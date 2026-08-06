import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Bike as BikeIcon, ChevronRight } from 'lucide-react'
import Layout from '@/components/Layout'
import Modal from '@/components/ui/Modal'
import Spinner from '@/components/ui/Spinner'
import { photoUrl } from '@/lib/storage'
import { useBikes, useCreateBike } from '@/hooks/useBikes'
import type { Bike } from '@/types'

export default function Bikes() {
  const { data: bikes, isLoading } = useBikes()
  const [adding, setAdding] = useState(false)

  return (
    <Layout
      title="Meine Räder"
      action={
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1 bg-primary text-white text-sm font-semibold pl-2.5 pr-3 py-1.5 rounded-full active:scale-95 transition-transform"
        >
          <Plus size={18} /> Rad
        </button>
      }
    >
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : !bikes || bikes.length === 0 ? (
        <EmptyState onAdd={() => setAdding(true)} />
      ) : (
        <ul className="p-4 space-y-3">
          {bikes.map((bike) => (
            <BikeCard key={bike.id} bike={bike} />
          ))}
        </ul>
      )}

      {adding && <AddBikeModal onClose={() => setAdding(false)} />}
    </Layout>
  )
}

function BikeCard({ bike }: { bike: Bike }) {
  const navigate = useNavigate()
  const url = photoUrl(bike.image_url)
  const sub = [bike.brand, bike.model, bike.year].filter(Boolean).join(' · ')

  return (
    <li>
      <button
        onClick={() => navigate(`/bikes/${bike.id}`)}
        className="card w-full flex items-center gap-3 rounded-2xl p-3 text-left active:scale-[0.99] transition-transform"
      >
        <div className="w-20 h-16 rounded-xl overflow-hidden bg-[var(--color-border-subtle)] flex-shrink-0 flex items-center justify-center">
          {url ? (
            <img src={url} alt={bike.name} className="w-full h-full object-cover" />
          ) : (
            <BikeIcon className="text-[var(--color-text-muted)] opacity-50" size={28} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[var(--color-text)] truncate">{bike.name}</p>
          {sub && <p className="text-sm text-[var(--color-text-muted)] truncate">{sub}</p>}
        </div>
        <ChevronRight className="text-[var(--color-text-muted)] opacity-50 flex-shrink-0" size={20} />
      </button>
    </li>
  )
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-8 py-24">
      <div className="w-16 h-16 rounded-2xl bg-[var(--color-cat-fork-bg)] flex items-center justify-center mb-4">
        <BikeIcon className="text-primary" size={30} />
      </div>
      <h2 className="text-lg font-semibold text-[var(--color-text)]">Noch kein Rad angelegt</h2>
      <p className="text-sm text-[var(--color-text-muted)] mt-1 mb-6">
        Lege dein erstes Mountainbike an, um Bauteile und Einstellungen zu verwalten.
      </p>
      <button
        onClick={onAdd}
        className="flex items-center gap-1.5 bg-primary text-white font-semibold px-5 py-2.5 rounded-full active:scale-95 transition-transform"
      >
        <Plus size={18} /> Erstes Rad anlegen
      </button>
    </div>
  )
}

function AddBikeModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const createBike = useCreateBike()
  const [name, setName] = useState('')
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    if (!name.trim()) {
      setError('Bitte gib einen Namen ein.')
      return
    }
    try {
      const bike = await createBike.mutateAsync({
        name: name.trim(),
        brand: brand.trim() || null,
        model: model.trim() || null,
        year: year ? Number(year) : null,
      })
      navigate(`/bikes/${bike.id}`)
    } catch (err) {
      setError((err as Error)?.message ?? 'Speichern fehlgeschlagen')
    }
  }

  return (
    <Modal
      title="Neues Rad"
      onClose={onClose}
      footer={
        <button
          onClick={handleSave}
          disabled={createBike.isPending}
          className="w-full py-3 rounded-xl bg-primary text-white font-semibold active:scale-[0.98] transition-transform disabled:opacity-60"
        >
          {createBike.isPending ? 'Speichern…' : 'Speichern'}
        </button>
      }
    >
      <Field label="Name *">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="z.B. Enduro 2024"
          className="input"
          autoFocus
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Marke">
          <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="z.B. Canyon" className="input" />
        </Field>
        <Field label="Modell">
          <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="z.B. Spectral" className="input" />
        </Field>
      </div>
      <Field label="Baujahr">
        <input
          value={year}
          onChange={(e) => setYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
          placeholder="z.B. 2024"
          inputMode="numeric"
          className="input"
        />
      </Field>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </Modal>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-[var(--color-text)] mb-1">{label}</span>
      {children}
    </label>
  )
}
