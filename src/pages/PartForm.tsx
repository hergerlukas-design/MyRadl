import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Layout from '@/components/Layout'
import Spinner from '@/components/ui/Spinner'
import { CATEGORIES } from '@/lib/categories'
import { usePart, useCreatePart, useUpdatePart } from '@/hooks/useParts'
import { useAddHistory } from '@/hooks/usePartMeta'
import type { PartCategory, PartStatus } from '@/types'

interface FormState {
  category: PartCategory
  brand: string
  model: string
  variant: string
  status: PartStatus
  install_date: string
  notes: string
}

const EMPTY: FormState = {
  category: 'federgabel',
  brand: '',
  model: '',
  variant: '',
  status: 'aktiv',
  install_date: '',
  notes: '',
}

export default function PartForm() {
  const { bikeId, partId } = useParams()
  const isEdit = !!partId
  const navigate = useNavigate()

  const { data: existing, isLoading } = usePart(partId ?? '')
  const createPart = useCreatePart()
  const updatePart = useUpdatePart()
  const addHistory = useAddHistory()

  const [form, setForm] = useState<FormState>(EMPTY)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (existing) {
      setForm({
        category: existing.category,
        brand: existing.brand,
        model: existing.model,
        variant: existing.variant ?? '',
        status: existing.status,
        install_date: existing.install_date ?? '',
        notes: existing.notes ?? '',
      })
    }
  }, [existing])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!form.brand.trim() || !form.model.trim()) {
      setError('Hersteller und Modell sind Pflichtfelder.')
      return
    }
    const patch = {
      category: form.category,
      brand: form.brand.trim(),
      model: form.model.trim(),
      variant: form.variant.trim() || null,
      status: form.status,
      install_date: form.install_date || null,
      notes: form.notes.trim() || null,
    }

    try {
      if (isEdit && existing) {
        await updatePart.mutateAsync({ id: existing.id, patch })
        navigate(`/parts/${existing.id}`, { replace: true })
      } else if (bikeId) {
        const part = await createPart.mutateAsync({ bike_id: bikeId, ...patch })
        // Beim Anlegen mit Einbaudatum automatisch einen History-Eintrag setzen.
        if (form.install_date) {
          await addHistory.mutateAsync({
            part_id: part.id,
            event_type: 'eingebaut',
            event_date: form.install_date,
            note: null,
          })
        }
        navigate(`/parts/${part.id}`, { replace: true })
      }
    } catch (err) {
      setError((err as Error)?.message ?? 'Speichern fehlgeschlagen')
    }
  }

  if (isEdit && isLoading) {
    return (
      <Layout title="Teil bearbeiten" back hideNav>
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      </Layout>
    )
  }

  const busy = createPart.isPending || updatePart.isPending

  return (
    <Layout title={isEdit ? 'Teil bearbeiten' : 'Neues Teil'} back hideNav>
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <label className="block">
          <span className="block text-sm font-medium text-gray-700 mb-1">Kategorie</span>
          <select
            value={form.category}
            onChange={(e) => set('category', e.target.value as PartCategory)}
            className="input"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="block text-sm font-medium text-gray-700 mb-1">Hersteller *</span>
            <input value={form.brand} onChange={(e) => set('brand', e.target.value)} placeholder="z.B. Fox" className="input" />
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-gray-700 mb-1">Modell *</span>
            <input value={form.model} onChange={(e) => set('model', e.target.value)} placeholder="z.B. 36 Factory" className="input" />
          </label>
        </div>

        <label className="block">
          <span className="block text-sm font-medium text-gray-700 mb-1">Variante / Größe</span>
          <input
            value={form.variant}
            onChange={(e) => set('variant', e.target.value)}
            placeholder="z.B. 180mm, 29 Zoll"
            className="input"
          />
        </label>

        <label className="block">
          <span className="block text-sm font-medium text-gray-700 mb-1">Einbaudatum</span>
          <input type="date" value={form.install_date} onChange={(e) => set('install_date', e.target.value)} className="input" />
        </label>

        {isEdit && (
          <label className="block">
            <span className="block text-sm font-medium text-gray-700 mb-1">Status</span>
            <select value={form.status} onChange={(e) => set('status', e.target.value as PartStatus)} className="input">
              <option value="aktiv">aktiv</option>
              <option value="ersetzt">ersetzt</option>
            </select>
          </label>
        )}

        <label className="block">
          <span className="block text-sm font-medium text-gray-700 mb-1">Notizen</span>
          <textarea
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            rows={3}
            placeholder="Freitext, z.B. Service-Historie, Besonderheiten…"
            className="input resize-none"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full py-3 rounded-xl bg-primary text-white font-semibold active:scale-[0.98] transition-transform disabled:opacity-60"
        >
          {busy ? 'Speichern…' : 'Speichern'}
        </button>
      </form>
    </Layout>
  )
}
