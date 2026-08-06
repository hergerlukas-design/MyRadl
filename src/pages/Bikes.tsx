import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import Watermark from '@/components/Watermark'
import Modal from '@/components/ui/Modal'
import Spinner from '@/components/ui/Spinner'
import { photoUrl } from '@/lib/storage'
import { useBikes, useCreateBike } from '@/hooks/useBikes'
import { useAllParts } from '@/hooks/useParts'
import type { Bike } from '@/types'

export default function Bikes() {
  const { data: bikes, isLoading } = useBikes()
  const { data: parts } = useAllParts()
  const [adding, setAdding] = useState(false)

  const activeCount = useMemo(() => {
    const map = new Map<string, number>()
    for (const p of parts ?? []) {
      if (p.status !== 'aktiv') continue
      map.set(p.bike_id, (map.get(p.bike_id) ?? 0) + 1)
    }
    return map
  }, [parts])

  const count = bikes?.length ?? 0

  return (
    <Layout>
      <header className="relative overflow-hidden px-6 pt-4 pb-5 flex-none">
        <Watermark variant="top" />
        <div className="relative flex flex-col gap-1">
          <span className="eyebrow">GARAGE · {count} {count === 1 ? 'RAD' : 'RÄDER'}</span>
          <h1 className="font-display font-black text-[34px] leading-[1.05] tracking-[-0.02em] text-cream">
            Deine Räder
          </h1>
        </div>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : (
        <div className="flex-1 px-6 pb-6 flex flex-col gap-4">
          {bikes?.map((bike) => (
            <BikeCard key={bike.id} bike={bike} parts={activeCount.get(bike.id) ?? 0} />
          ))}
          <button
            onClick={() => setAdding(true)}
            className="rounded-[22px] border border-dashed border-white/20 py-5 text-center font-medium text-muted active:scale-[0.99] transition-transform"
          >
            + Rad hinzufügen
          </button>
        </div>
      )}

      {adding && <AddBikeModal onClose={() => setAdding(false)} />}
    </Layout>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="eyebrow">{label}</span>
      <span className="text-[13px] font-medium text-cream-dim truncate">{value || '—'}</span>
    </div>
  )
}

function BikeCard({ bike, parts }: { bike: Bike; parts: number }) {
  const navigate = useNavigate()
  const url = photoUrl(bike.image_url)

  return (
    <button
      onClick={() => navigate(`/bikes/${bike.id}`)}
      className="text-left rounded-[22px] bg-surface border border-white/[0.07] overflow-hidden active:scale-[0.99] transition-transform"
    >
      <div className="relative h-[150px] photo-ph flex items-end justify-between p-4">
        {url && <img src={url} alt={bike.name} className="absolute inset-0 w-full h-full object-cover" />}
        <span className="relative font-mono text-[10px] text-dim">{url ? '' : 'radfoto'}</span>
        {bike.year && (
          <span className="relative font-mono text-[10px] font-medium tracking-[0.14em] text-accent-ink bg-accent px-2 py-1 rounded-md">
            {bike.year}
          </span>
        )}
      </div>
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display font-extrabold text-2xl leading-none tracking-[-0.01em] text-cream truncate">
            {bike.name}
          </h2>
          {bike.model && <span className="font-mono text-xs text-muted flex-none">{bike.model}</span>}
        </div>
        <div className="grid grid-cols-3 gap-4 pt-3 border-t border-white/[0.07]">
          <Stat label="HERSTELLER" value={bike.brand ?? ''} />
          <Stat label="BAUTEILE" value={String(parts)} />
          <Stat label="BAUJAHR" value={bike.year ? String(bike.year) : ''} />
        </div>
      </div>
    </button>
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
          className="w-full py-3.5 rounded-xl bg-accent text-accent-ink font-semibold active:scale-[0.98] transition-transform disabled:opacity-60"
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
      {error && <p className="text-sm text-danger">{error}</p>}
    </Modal>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-cream-dim mb-1.5">{label}</span>
      {children}
    </label>
  )
}
