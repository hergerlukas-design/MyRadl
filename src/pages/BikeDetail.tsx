import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, Pencil, Trash2, ChevronRight } from 'lucide-react'
import Layout from '@/components/Layout'
import Watermark from '@/components/Watermark'
import PageHeader, { squareBtn } from '@/components/PageHeader'
import Modal from '@/components/ui/Modal'
import Spinner from '@/components/ui/Spinner'
import ImageUpload from '@/components/ImageUpload'
import { CATEGORIES, categoryColor, categoryLabel } from '@/lib/categories'
import { uploadBikePhoto, deletePhoto } from '@/lib/storage'
import { useAuth } from '@/hooks/useAuth'
import { useBike, useUpdateBike, useDeleteBike } from '@/hooks/useBikes'
import { useParts } from '@/hooks/useParts'
import type { Bike, Part } from '@/types'

const CAT_ORDER = new Map(CATEGORIES.map((c, i) => [c.value, i]))

export default function BikeDetail() {
  const { bikeId = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: bike, isLoading } = useBike(bikeId)
  const { data: parts } = useParts(bikeId)
  const updateBike = useUpdateBike()
  const deleteBike = useDeleteBike()
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const sorted = useMemo(
    () =>
      [...(parts ?? [])].sort(
        (a, b) => (CAT_ORDER.get(a.category) ?? 99) - (CAT_ORDER.get(b.category) ?? 99),
      ),
    [parts],
  )
  const active = sorted.filter((p) => p.status === 'aktiv').length
  const replaced = sorted.length - active

  if (isLoading || !bike) {
    return (
      <Layout>
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      </Layout>
    )
  }

  async function handlePhoto(file: File) {
    const path = await uploadBikePhoto(user!.id, bike!.id, file)
    if (bike!.image_url && bike!.image_url !== path) deletePhoto(bike!.image_url)
    await updateBike.mutateAsync({ id: bike!.id, patch: { image_url: path } })
    return path
  }

  async function handlePhotoRemove() {
    if (bike!.image_url) deletePhoto(bike!.image_url)
    await updateBike.mutateAsync({ id: bike!.id, patch: { image_url: null } })
  }

  async function handleDelete() {
    await deleteBike.mutateAsync(bike!.id)
    navigate('/bikes', { replace: true })
  }

  const sub = [bike.brand, bike.year, bike.model].filter(Boolean).join(' · ')
  const eyebrow = (bike.brand ?? 'Rad').toUpperCase()

  return (
    <Layout>
      <header className="relative overflow-hidden border-b border-white/[0.07] flex-none">
        <Watermark variant="bottom" />
        <div className="relative px-5 pt-4 pb-5">
          <PageHeader
            eyebrow={eyebrow}
            onBack={() => navigate('/bikes')}
            action={
              <button onClick={() => setEditing(true)} className={squareBtn} aria-label="Bearbeiten">
                <Pencil size={15} className="text-accent" />
              </button>
            }
          />
          <h1 className="mt-3.5 font-display font-black text-[42px] leading-[0.95] tracking-[-0.03em] text-cream">
            {bike.name}
          </h1>
          {sub && <p className="mt-0.5 font-mono text-[13px] text-muted">{sub}</p>}
          <div className="mt-4 grid grid-cols-4 gap-2.5">
            <Tile label="TEILE" value={String(sorted.length)} />
            <Tile label="AKTIV" value={String(active)} />
            <Tile label="ERSETZT" value={String(replaced)} />
            <Tile label="JAHR" value={bike.year ? String(bike.year) : '—'} />
          </div>
        </div>
      </header>

      <div className="flex-1 px-5 py-5 flex flex-col gap-5">
        <ImageUpload
          value={bike.image_url}
          onUpload={handlePhoto}
          onRemove={handlePhotoRemove}
          aspect="video"
          label="Radfoto"
        />

        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-extrabold tracking-[0.02em] text-cream">Verbaute Teile</h2>
          <button
            onClick={() => navigate(`/bikes/${bike.id}/parts/new`)}
            className="flex items-center gap-1.5 bg-accent text-accent-ink text-[13px] font-semibold pl-3 pr-3.5 py-2 rounded-full active:scale-95 transition-transform"
          >
            <Plus size={16} /> Teil
          </button>
        </div>

        {sorted.length === 0 ? (
          <p className="font-mono text-xs text-muted text-center py-8">
            Noch keine Bauteile. Füge das erste Teil hinzu.
          </p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {sorted.map((part) => (
              <PartRow key={part.id} part={part} />
            ))}
          </div>
        )}

        <button
          onClick={() => setConfirmDelete(true)}
          className="mt-2 w-full flex items-center justify-center gap-2 text-danger text-sm font-medium py-2"
        >
          <Trash2 size={16} /> Rad löschen
        </button>
      </div>

      {editing && <EditBikeModal bike={bike} onClose={() => setEditing(false)} />}
      {confirmDelete && (
        <Modal
          title="Rad löschen?"
          onClose={() => setConfirmDelete(false)}
          footer={
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 py-3.5 rounded-xl bg-surface-2 text-cream font-semibold">
                Abbrechen
              </button>
              <button onClick={handleDelete} className="flex-1 py-3.5 rounded-xl bg-danger text-ink font-semibold">
                Löschen
              </button>
            </div>
          }
        >
          <p className="text-sm text-cream-dim">
            „{bike.name}" und alle zugehörigen Bauteile, Einstellungen und Verläufe werden dauerhaft gelöscht.
          </p>
        </Modal>
      )}
    </Layout>
  )
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface border border-white/[0.07] rounded-[14px] px-3 py-2.5 flex flex-col gap-1">
      <span className="eyebrow">{label}</span>
      <span className="font-display font-semibold text-[17px] text-cream leading-none">{value}</span>
    </div>
  )
}

function PartRow({ part }: { part: Part }) {
  const navigate = useNavigate()
  const color = categoryColor(part.category)
  const isReplaced = part.status === 'ersetzt'
  return (
    <button
      onClick={() => navigate(`/parts/${part.id}`)}
      className={`text-left flex items-stretch gap-3.5 bg-surface border border-white/[0.07] rounded-[18px] px-4 py-3.5 active:scale-[0.99] transition-transform ${
        isReplaced ? 'opacity-55' : ''
      }`}
    >
      <span className="w-[3px] rounded-full flex-none" style={{ background: color }} />
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <span
          className="font-mono text-[9px] font-medium tracking-[0.16em]"
          style={{ color }}
        >
          {categoryLabel(part.category).toUpperCase()}
        </span>
        <span className="text-base font-semibold leading-tight text-cream truncate">
          {part.brand} {part.model}
        </span>
        <span className="font-mono text-xs text-muted truncate">{part.variant || '—'}</span>
      </div>
      {isReplaced ? (
        <span className="self-center font-mono text-[9px] font-medium tracking-[0.12em] text-muted">ERSETZT</span>
      ) : (
        <ChevronRight className="self-center text-dim flex-none" size={18} />
      )}
    </button>
  )
}

function EditBikeModal({ bike, onClose }: { bike: Bike; onClose: () => void }) {
  const updateBike = useUpdateBike()
  const [name, setName] = useState(bike.name)
  const [brand, setBrand] = useState(bike.brand ?? '')
  const [model, setModel] = useState(bike.model ?? '')
  const [year, setYear] = useState(bike.year ? String(bike.year) : '')
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    if (!name.trim()) {
      setError('Bitte gib einen Namen ein.')
      return
    }
    try {
      await updateBike.mutateAsync({
        id: bike.id,
        patch: {
          name: name.trim(),
          brand: brand.trim() || null,
          model: model.trim() || null,
          year: year ? Number(year) : null,
        },
      })
      onClose()
    } catch (err) {
      setError((err as Error)?.message ?? 'Speichern fehlgeschlagen')
    }
  }

  return (
    <Modal
      title="Rad bearbeiten"
      onClose={onClose}
      footer={
        <button
          onClick={handleSave}
          disabled={updateBike.isPending}
          className="w-full py-3.5 rounded-xl bg-accent text-accent-ink font-semibold disabled:opacity-60"
        >
          Speichern
        </button>
      }
    >
      <label className="block">
        <span className="block text-sm font-medium text-cream-dim mb-1.5">Name *</span>
        <input value={name} onChange={(e) => setName(e.target.value)} className="input" />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="block text-sm font-medium text-cream-dim mb-1.5">Marke</span>
          <input value={brand} onChange={(e) => setBrand(e.target.value)} className="input" />
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-cream-dim mb-1.5">Modell</span>
          <input value={model} onChange={(e) => setModel(e.target.value)} className="input" />
        </label>
      </div>
      <label className="block">
        <span className="block text-sm font-medium text-cream-dim mb-1.5">Baujahr</span>
        <input
          value={year}
          onChange={(e) => setYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
          inputMode="numeric"
          className="input"
        />
      </label>
      {error && <p className="text-sm text-danger">{error}</p>}
    </Modal>
  )
}
