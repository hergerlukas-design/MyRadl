import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, Pencil, Trash2, ChevronRight } from 'lucide-react'
import Layout from '@/components/Layout'
import Modal from '@/components/ui/Modal'
import Spinner from '@/components/ui/Spinner'
import ImageUpload from '@/components/ImageUpload'
import { CATEGORIES, partTitle, partSubtitle } from '@/lib/categories'
import { uploadBikePhoto, deletePhoto, photoUrl } from '@/lib/storage'
import { useAuth } from '@/hooks/useAuth'
import { useBike, useUpdateBike, useDeleteBike } from '@/hooks/useBikes'
import { useParts } from '@/hooks/useParts'
import type { Bike, Part } from '@/types'

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

  if (isLoading || !bike) {
    return (
      <Layout title="Rad" back>
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

  const sub = [bike.brand, bike.model, bike.year].filter(Boolean).join(' · ')

  return (
    <Layout
      title={bike.name}
      back
      action={
        <button onClick={() => setEditing(true)} className="p-1.5 text-gray-500 hover:text-gray-900" aria-label="Bearbeiten">
          <Pencil size={18} />
        </button>
      }
    >
      <div className="p-4 space-y-5">
        <ImageUpload
          value={bike.image_url}
          onUpload={handlePhoto}
          onRemove={handlePhotoRemove}
          aspect="video"
          label="Radfoto"
        />

        {sub && <p className="text-gray-500 -mt-1">{sub}</p>}

        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Bauteile</h2>
          <button
            onClick={() => navigate(`/bikes/${bike.id}/parts/new`)}
            className="flex items-center gap-1 bg-primary text-white text-sm font-semibold pl-2.5 pr-3 py-1.5 rounded-full active:scale-95 transition-transform"
          >
            <Plus size={17} /> Teil
          </button>
        </div>

        {!parts || parts.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">
            Noch keine Bauteile. Füge das erste Teil hinzu.
          </p>
        ) : (
          <div className="space-y-5">
            {CATEGORIES.map((cat) => {
              const group = parts.filter((p) => p.category === cat.value)
              if (group.length === 0) return null
              const Icon = cat.icon
              return (
                <section key={cat.value}>
                  <div className="flex items-center gap-2 mb-2 text-gray-500">
                    <Icon size={16} />
                    <h3 className="text-xs font-semibold uppercase tracking-wide">{cat.label}</h3>
                  </div>
                  <ul className="space-y-2">
                    {group.map((part) => (
                      <PartRow key={part.id} part={part} />
                    ))}
                  </ul>
                </section>
              )
            })}
          </div>
        )}

        <button
          onClick={() => setConfirmDelete(true)}
          className="mt-4 w-full flex items-center justify-center gap-2 text-red-600 text-sm font-medium py-2"
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
              <button onClick={() => setConfirmDelete(false)} className="flex-1 py-3 rounded-xl bg-gray-100 font-semibold">
                Abbrechen
              </button>
              <button onClick={handleDelete} className="flex-1 py-3 rounded-xl bg-red-600 text-white font-semibold">
                Löschen
              </button>
            </div>
          }
        >
          <p className="text-sm text-gray-600">
            „{bike.name}" und alle zugehörigen Bauteile, Einstellungen und Verläufe werden dauerhaft gelöscht.
          </p>
        </Modal>
      )}
    </Layout>
  )
}

function PartRow({ part }: { part: Part }) {
  const navigate = useNavigate()
  const url = photoUrl(part.image_url)
  const replaced = part.status === 'ersetzt'
  return (
    <li>
      <button
        onClick={() => navigate(`/parts/${part.id}`)}
        className={`w-full flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-2.5 text-left active:scale-[0.99] transition-transform ${
          replaced ? 'opacity-60' : ''
        }`}
      >
        {url && (
          <img src={url} alt="" className="w-11 h-11 rounded-lg object-cover flex-shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">
            {partTitle(part)}
          </p>
          <p className="text-sm text-gray-500 truncate">
            {partSubtitle(part) || '—'}
          </p>
        </div>
        {replaced && (
          <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">ersetzt</span>
        )}
        <ChevronRight className="text-gray-300 flex-shrink-0" size={18} />
      </button>
    </li>
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
          className="w-full py-3 rounded-xl bg-primary text-white font-semibold disabled:opacity-60"
        >
          Speichern
        </button>
      }
    >
      <label className="block">
        <span className="block text-sm font-medium text-gray-700 mb-1">Name *</span>
        <input value={name} onChange={(e) => setName(e.target.value)} className="input" />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="block text-sm font-medium text-gray-700 mb-1">Marke</span>
          <input value={brand} onChange={(e) => setBrand(e.target.value)} className="input" />
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-gray-700 mb-1">Modell</span>
          <input value={model} onChange={(e) => setModel(e.target.value)} className="input" />
        </label>
      </div>
      <label className="block">
        <span className="block text-sm font-medium text-gray-700 mb-1">Baujahr</span>
        <input
          value={year}
          onChange={(e) => setYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
          inputMode="numeric"
          className="input"
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </Modal>
  )
}
