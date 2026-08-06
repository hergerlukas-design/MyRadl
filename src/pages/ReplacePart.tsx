import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { ArrowLeftRight } from 'lucide-react'
import Layout from '@/components/Layout'
import PageHeader from '@/components/PageHeader'
import Spinner from '@/components/ui/Spinner'
import { categoryLabel } from '@/lib/categories'
import { usePart, useCreatePart, useUpdatePart } from '@/hooks/useParts'
import { useAddHistory } from '@/hooks/usePartMeta'

export default function ReplacePart() {
  const { partId = '' } = useParams()
  const navigate = useNavigate()
  const { data: old, isLoading } = usePart(partId)
  const createPart = useCreatePart()
  const updatePart = useUpdatePart()
  const addHistory = useAddHistory()

  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [variant, setVariant] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [error, setError] = useState<string | null>(null)

  // Vorschlag: Marke/Modell des Vorgängers übernehmen (editierbar).
  useEffect(() => {
    if (old) {
      setBrand(old.brand)
      setModel(old.model)
      setVariant(old.variant ?? '')
    }
  }, [old])

  if (isLoading || !old) {
    return (
      <Layout hideNav>
        <div className="px-5 pt-4">
          <PageHeader />
        </div>
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      </Layout>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!brand.trim() || !model.trim()) {
      setError('Hersteller und Modell sind Pflichtfelder.')
      return
    }
    try {
      // 1) Nachfolger anlegen (Kategorie übernehmen).
      const next = await createPart.mutateAsync({
        bike_id: old!.bike_id,
        category: old!.category,
        brand: brand.trim(),
        model: model.trim(),
        variant: variant.trim() || null,
        status: 'aktiv',
        install_date: date || null,
      })
      // 2) Altes Teil auf "ersetzt" setzen.
      await updatePart.mutateAsync({ id: old!.id, patch: { status: 'ersetzt' } })
      // 3) History: altes Teil ausgebaut/ersetzt …
      await addHistory.mutateAsync({
        part_id: old!.id,
        event_type: 'ersetzt',
        event_date: date,
        note: `Ersetzt durch ${brand.trim()} ${model.trim()}`,
      })
      // … und neues Teil eingebaut.
      await addHistory.mutateAsync({
        part_id: next.id,
        event_type: 'eingebaut',
        event_date: date,
        note: `Nachfolger von ${old!.brand} ${old!.model}`,
      })
      navigate(`/parts/${next.id}`, { replace: true })
    } catch (err) {
      setError((err as Error)?.message ?? 'Ersetzen fehlgeschlagen')
    }
  }

  const busy = createPart.isPending || updatePart.isPending || addHistory.isPending

  return (
    <Layout hideNav>
      <div className="px-5 pt-4 pb-2">
        <PageHeader eyebrow={categoryLabel(old.category).toUpperCase()} />
        <h1 className="mt-3 font-display font-black text-[30px] leading-none tracking-[-0.02em] text-cream">
          Teil ersetzen
        </h1>
      </div>
      <form onSubmit={handleSubmit} className="px-5 py-4 flex flex-col gap-4">
        <div className="bg-surface border border-hair rounded-[18px] p-4 flex items-start gap-3">
          <ArrowLeftRight size={18} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--cat-reifen)' }} />
          <p className="text-sm text-cream-dim">
            Der bisherige Teil <span className="font-semibold text-cream">{old.brand} {old.model}</span> wird auf
            „ersetzt" gesetzt und erhält einen Verlaufseintrag. Der Nachfolger wird neu angelegt.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="block text-sm font-medium text-cream-dim mb-1.5">Hersteller *</span>
            <input value={brand} onChange={(e) => setBrand(e.target.value)} className="input" />
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-cream-dim mb-1.5">Modell *</span>
            <input value={model} onChange={(e) => setModel(e.target.value)} className="input" />
          </label>
        </div>

        <label className="block">
          <span className="block text-sm font-medium text-cream-dim mb-1.5">Variante / Größe</span>
          <input value={variant} onChange={(e) => setVariant(e.target.value)} placeholder="z.B. 180mm, 29 Zoll" className="input" />
        </label>

        <label className="block">
          <span className="block text-sm font-medium text-cream-dim mb-1.5">Einbaudatum Nachfolger</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
        </label>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full py-3.5 rounded-xl bg-accent text-accent-ink font-semibold active:scale-[0.98] transition-transform disabled:opacity-60"
        >
          {busy ? 'Wird ersetzt…' : 'Ersetzen & Nachfolger anlegen'}
        </button>
      </form>
    </Layout>
  )
}
