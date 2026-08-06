import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import { ArrowLeftRight } from 'lucide-react'
import Layout from '@/components/Layout'
import Spinner from '@/components/ui/Spinner'
import { categoryLabel, partTitle } from '@/lib/categories'
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
      setModel(old.model ?? '')
      setVariant(old.variant ?? '')
    }
  }, [old])

  if (isLoading || !old) {
    return (
      <Layout title="Teil ersetzen" back hideNav>
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      </Layout>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!brand.trim()) {
      setError('Hersteller ist ein Pflichtfeld.')
      return
    }
    try {
      // 1) Nachfolger anlegen (Kategorie/Position/Bezeichnung übernehmen).
      const next = await createPart.mutateAsync({
        bike_id: old!.bike_id,
        category: old!.category,
        brand: brand.trim(),
        model: model.trim() || null,
        variant: variant.trim() || null,
        position: old!.position,
        custom_type: old!.custom_type,
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
        note: `Ersetzt durch ${`${brand.trim()} ${model.trim()}`.trim()}`,
      })
      // … und neues Teil eingebaut.
      await addHistory.mutateAsync({
        part_id: next.id,
        event_type: 'eingebaut',
        event_date: date,
        note: `Nachfolger von ${partTitle(old!)}`,
      })
      navigate(`/parts/${next.id}`, { replace: true })
    } catch (err) {
      setError((err as Error)?.message ?? 'Ersetzen fehlgeschlagen')
    }
  }

  const busy = createPart.isPending || updatePart.isPending || addHistory.isPending

  return (
    <Layout title="Teil ersetzen" back hideNav>
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-start gap-3">
          <ArrowLeftRight size={18} className="text-orange-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-orange-900">
            Der bisherige Teil <span className="font-semibold">{partTitle(old)}</span> wird auf
            „ersetzt" gesetzt und erhält einen Verlaufseintrag. Der Nachfolger wird neu angelegt.
          </p>
        </div>

        <div className="text-sm text-[var(--color-text-muted)]">
          Kategorie: <span className="font-medium text-[var(--color-text)]">{categoryLabel(old.category)}</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="block text-sm font-medium text-[var(--color-text)] mb-1">Hersteller *</span>
            <input value={brand} onChange={(e) => setBrand(e.target.value)} className="input" />
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-[var(--color-text)] mb-1">Modell</span>
            <input value={model} onChange={(e) => setModel(e.target.value)} className="input" />
          </label>
        </div>

        <label className="block">
          <span className="block text-sm font-medium text-[var(--color-text)] mb-1">Variante / Größe</span>
          <input value={variant} onChange={(e) => setVariant(e.target.value)} placeholder="z.B. 180mm, 29 Zoll" className="input" />
        </label>

        <label className="block">
          <span className="block text-sm font-medium text-[var(--color-text)] mb-1">Einbaudatum Nachfolger</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full py-3 rounded-xl bg-primary text-white font-semibold active:scale-[0.98] transition-transform disabled:opacity-60"
        >
          {busy ? 'Wird ersetzt…' : 'Ersetzen &amp; Nachfolger anlegen'}
        </button>
      </form>
    </Layout>
  )
}
