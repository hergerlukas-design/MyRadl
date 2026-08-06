import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Plus, Pencil, Trash2, ChevronRight, ChevronDown, Ruler, GripVertical } from 'lucide-react'
import Layout from '@/components/Layout'
import Watermark from '@/components/Watermark'
import PageHeader, { squareBtn } from '@/components/PageHeader'
import Modal from '@/components/ui/Modal'
import Spinner from '@/components/ui/Spinner'
import ImageUpload from '@/components/ImageUpload'
import { CATEGORIES, categoryColor, categoryLabel, partTitle, partSubtitle } from '@/lib/categories'
import { GEOMETRY_FIELDS, formatGeometryValue } from '@/lib/geometry'
import { uploadBikePhoto, deletePhoto } from '@/lib/storage'
import { useAuth } from '@/hooks/useAuth'
import { useBike, useUpdateBike, useDeleteBike } from '@/hooks/useBikes'
import { useBikeGeometry, useUpsertBikeGeometry } from '@/hooks/useBikeGeometry'
import { useParts, useReorderParts } from '@/hooks/useParts'
import type { Bike, BikeGeometry, GeometryField, Part } from '@/types'

const CAT_ORDER = new Map(CATEGORIES.map((c, i) => [c.value, i]))

/** Zahl fürs Header-Kachel-Format (deutsches Dezimalkomma, optionale Einheit). */
function tileValue(value: number | null | undefined, unit = ''): string {
  if (value === null || value === undefined) return '–'
  return `${String(value).replace('.', ',')}${unit}`
}

export default function BikeDetail() {
  const { bikeId = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: bike, isLoading } = useBike(bikeId)
  const { data: parts } = useParts(bikeId)
  const { data: geo } = useBikeGeometry(bikeId)
  const updateBike = useUpdateBike()
  const deleteBike = useDeleteBike()
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const sorted = useMemo(() => {
    const arr = [...(parts ?? [])]
    const anyCustom = arr.some((p) => p.sort_order != null)
    if (anyCustom) {
      // Vom Nutzer festgelegte Reihenfolge (Drag & Drop).
      arr.sort(
        (a, b) =>
          (a.sort_order ?? Number.MAX_SAFE_INTEGER) - (b.sort_order ?? Number.MAX_SAFE_INTEGER) ||
          (a.created_at < b.created_at ? -1 : 1),
      )
    } else {
      // Standard: nach Kategorie gruppiert.
      arr.sort((a, b) => (CAT_ORDER.get(a.category) ?? 99) - (CAT_ORDER.get(b.category) ?? 99))
    }
    return arr
  }, [parts])
  const active = sorted.filter((p) => p.status === 'aktiv').length

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
      <header className="relative overflow-hidden border-b border-hair flex-none">
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
            <Tile label="REACH" value={tileValue(geo?.reach)} />
            <Tile label="STACK" value={tileValue(geo?.stack)} />
            <Tile label="LW" value={tileValue(geo?.head_angle, '°')} />
            <Tile label="KETTE" value={tileValue(geo?.chainstay_length)} />
          </div>
        </div>
      </header>

      <div className="flex-1 px-5 py-5 flex flex-col gap-5">
        {bike.image_url && (
          <ImageUpload
            value={bike.image_url}
            onUpload={handlePhoto}
            onRemove={handlePhotoRemove}
            aspect="video"
            label="Radfoto"
          />
        )}

        <GeometrySection bikeId={bike.id} />

        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-extrabold tracking-[0.02em] text-cream">
            Verbaute Teile
            {sorted.length > 0 && <span className="text-muted font-mono text-xs ml-2">{active} aktiv</span>}
          </h2>
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
          <PartsList bikeId={bike.id} parts={sorted} />
        )}

        {!bike.image_url && (
          <ImageUpload
            value={bike.image_url}
            onUpload={handlePhoto}
            onRemove={handlePhotoRemove}
            aspect="video"
            label="Radfoto"
          />
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
    <div className="bg-surface border border-hair rounded-[14px] px-3 py-2.5 flex flex-col gap-1">
      <span className="eyebrow">{label}</span>
      <span className="font-display font-semibold text-[17px] text-cream leading-none">{value}</span>
    </div>
  )
}

// ── Bauteilliste mit Drag & Drop ──────────────────────────────────────────────
function PartsList({ bikeId, parts }: { bikeId: string; parts: Part[] }) {
  const reorder = useReorderParts()
  const [order, setOrder] = useState<string[]>(() => parts.map((p) => p.id))
  const [dragId, setDragId] = useState<string | null>(null)
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const byId = useMemo(() => {
    const m: Record<string, Part> = {}
    for (const p of parts) m[p.id] = p
    return m
  }, [parts])

  // Reihenfolge aus den Daten übernehmen, solange nicht gerade gezogen wird.
  useEffect(() => {
    if (!dragId) setOrder(parts.map((p) => p.id))
  }, [parts, dragId])

  function handleDown(e: React.PointerEvent, id: string) {
    e.preventDefault()
    e.stopPropagation()
    ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
    setDragId(id)
  }

  function handleMove(e: React.PointerEvent) {
    if (!dragId) return
    const y = e.clientY
    let target = order.length - 1
    for (let i = 0; i < order.length; i++) {
      const el = rowRefs.current[order[i]]
      if (!el) continue
      const r = el.getBoundingClientRect()
      if (y < r.top + r.height / 2) {
        target = i
        break
      }
    }
    const from = order.indexOf(dragId)
    if (from === -1 || from === target) return
    const next = [...order]
    next.splice(from, 1)
    next.splice(target, 0, dragId)
    setOrder(next)
  }

  function handleUp(e: React.PointerEvent) {
    if (!dragId) return
    ;(e.currentTarget as Element).releasePointerCapture?.(e.pointerId)
    setDragId(null)
    const current = parts.map((p) => p.id)
    if (order.length === current.length && order.some((id, i) => id !== current[i])) {
      reorder.mutate({ bikeId, orderedIds: order })
    }
  }

  return (
    <div className="flex flex-col gap-2.5">
      {order
        .map((id) => byId[id])
        .filter(Boolean)
        .map((part) => (
          <PartRow
            key={part.id}
            part={part}
            dragging={dragId === part.id}
            setRef={(el) => {
              rowRefs.current[part.id] = el
            }}
            onHandleDown={(e) => handleDown(e, part.id)}
            onHandleMove={handleMove}
            onHandleUp={handleUp}
          />
        ))}
    </div>
  )
}

function PartRow({
  part,
  dragging,
  setRef,
  onHandleDown,
  onHandleMove,
  onHandleUp,
}: {
  part: Part
  dragging: boolean
  setRef: (el: HTMLDivElement | null) => void
  onHandleDown: (e: React.PointerEvent) => void
  onHandleMove: (e: React.PointerEvent) => void
  onHandleUp: (e: React.PointerEvent) => void
}) {
  const navigate = useNavigate()
  const color = categoryColor(part.category)
  const isReplaced = part.status === 'ersetzt'
  const sub = partSubtitle(part)
  return (
    <div
      ref={setRef}
      className={`flex items-stretch gap-1.5 bg-surface border rounded-[18px] pl-1.5 pr-4 py-3.5 ${
        dragging ? 'border-accent/60 shadow-lg shadow-black/40 relative z-10' : 'border-hair'
      } ${isReplaced ? 'opacity-55' : ''}`}
    >
      <button
        onPointerDown={onHandleDown}
        onPointerMove={onHandleMove}
        onPointerUp={onHandleUp}
        onPointerCancel={onHandleUp}
        className="flex-none self-stretch flex items-center px-1 text-dim active:text-accent cursor-grab touch-none"
        style={{ touchAction: 'none' }}
        aria-label="Zum Sortieren ziehen"
      >
        <GripVertical size={18} />
      </button>
      <span className="w-[3px] rounded-full flex-none self-stretch" style={{ background: color }} />
      <button
        onClick={() => navigate(`/parts/${part.id}`)}
        className="flex-1 min-w-0 flex items-center gap-3 text-left active:scale-[0.99] transition-transform"
      >
        <span className="flex-1 min-w-0 flex flex-col gap-1">
          <span className="font-mono text-[9px] font-medium tracking-[0.16em]" style={{ color }}>
            {categoryLabel(part.category).toUpperCase()}
          </span>
          <span className="block text-base font-semibold leading-tight text-cream truncate">
            {partTitle(part)}
          </span>
          <span className="font-mono text-xs text-muted truncate">{sub || '—'}</span>
        </span>
        {isReplaced ? (
          <span className="self-center font-mono text-[9px] font-medium tracking-[0.12em] text-muted">ERSETZT</span>
        ) : (
          <ChevronRight className="self-center text-dim flex-none" size={18} />
        )}
      </button>
    </div>
  )
}

// ── Geometrie ─────────────────────────────────────────────────────────────────
function GeometrySection({ bikeId }: { bikeId: string }) {
  const { data: geo, isLoading } = useBikeGeometry(bikeId)
  const [editing, setEditing] = useState(false)
  const [open, setOpen] = useState(false)

  const hasAny =
    geo != null && (!!geo.frame_size || GEOMETRY_FIELDS.some((f) => geo[f.key] != null))

  const summary = geo
    ? [
        geo.frame_size ? `Gr. ${geo.frame_size}` : null,
        geo.reach != null ? `Reach ${geo.reach}` : null,
        geo.stack != null ? `Stack ${geo.stack}` : null,
      ]
        .filter(Boolean)
        .join(' · ')
    : ''

  return (
    <section className="bg-surface border border-hair rounded-[20px] overflow-hidden">
      <div className="flex items-center">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex-1 flex items-center gap-2 px-4 py-3.5 min-w-0 text-left"
          aria-expanded={open}
        >
          <Ruler size={16} className="text-muted flex-shrink-0" />
          <span className="text-[15px] font-extrabold text-cream flex-shrink-0">Geometrie</span>
          {!open && summary && (
            <span className="font-mono text-xs text-muted truncate">{summary}</span>
          )}
          <ChevronDown
            size={18}
            className={`ml-auto flex-shrink-0 text-muted transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>
        <button
          onClick={() => setEditing(true)}
          className="text-accent pl-2 pr-4 py-3.5 flex-shrink-0"
          aria-label={hasAny ? 'Geometrie bearbeiten' : 'Geometrie erfassen'}
        >
          <Pencil size={16} />
        </button>
      </div>

      {open && (
        <div className="border-t border-hair-soft">
          {isLoading ? (
            <div className="py-4 flex justify-center">
              <Spinner />
            </div>
          ) : !hasAny ? (
            <p className="text-sm text-muted px-4 py-3">
              Noch keine Geometrie erfasst. Reach &amp; Stack sind die wichtigsten Werte für die Rahmengröße.
            </p>
          ) : (
            <div className="px-4">
              {geo!.frame_size && (
                <div className="flex items-center justify-between py-3 border-b border-hair-soft">
                  <span className="eyebrow">RAHMENGRÖSSE</span>
                  <span className="text-sm font-bold text-accent">{geo!.frame_size}</span>
                </div>
              )}
              {GEOMETRY_FIELDS.filter((f) => geo![f.key] != null).map((f, i, arr) => (
                <div
                  key={f.key}
                  className={`flex items-center justify-between py-3 ${i < arr.length - 1 ? 'border-b border-hair-soft' : ''}`}
                >
                  <span className={`text-sm ${f.primary ? 'font-semibold text-cream' : 'text-muted'}`}>
                    {f.label}
                  </span>
                  <span className={`text-sm ${f.primary ? 'font-bold text-accent' : 'font-medium text-cream-dim'}`}>
                    {formatGeometryValue(geo![f.key], f.unit)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {editing && <GeometryModal bikeId={bikeId} geo={geo ?? null} onClose={() => setEditing(false)} />}
    </section>
  )
}

function GeometryModal({
  bikeId,
  geo,
  onClose,
}: {
  bikeId: string
  geo: BikeGeometry | null
  onClose: () => void
}) {
  const upsert = useUpsertBikeGeometry()
  const [frameSize, setFrameSize] = useState(geo?.frame_size ?? '')
  const [values, setValues] = useState<Record<GeometryField, string>>(() => {
    const init = {} as Record<GeometryField, string>
    for (const f of GEOMETRY_FIELDS) {
      const v = geo?.[f.key]
      init[f.key] = v == null ? '' : String(v)
    }
    return init
  })
  const [error, setError] = useState<string | null>(null)

  const set = (key: GeometryField, value: string) => setValues((v) => ({ ...v, [key]: value }))

  async function save() {
    setError(null)
    const patch: Partial<BikeGeometry> & { bike_id: string } = {
      bike_id: bikeId,
      frame_size: frameSize.trim() || null,
    }
    for (const f of GEOMETRY_FIELDS) {
      const raw = values[f.key].trim().replace(',', '.')
      if (raw === '') {
        patch[f.key] = null
        continue
      }
      const num = Number(raw)
      if (Number.isNaN(num)) {
        setError(`„${f.label}" ist keine gültige Zahl.`)
        return
      }
      patch[f.key] = num
    }
    try {
      await upsert.mutateAsync(patch)
      onClose()
    } catch (err) {
      setError((err as Error)?.message ?? 'Speichern fehlgeschlagen')
    }
  }

  return (
    <Modal
      title="Geometrie"
      onClose={onClose}
      footer={
        <button
          onClick={save}
          disabled={upsert.isPending}
          className="w-full py-3.5 rounded-xl bg-accent text-accent-ink font-semibold disabled:opacity-60"
        >
          {upsert.isPending ? 'Speichern…' : 'Speichern'}
        </button>
      }
    >
      <p className="text-sm text-muted -mt-1">
        Alle Angaben optional. Reach &amp; Stack sind herstellerübergreifend am besten vergleichbar.
      </p>
      <label className="block">
        <span className="block text-sm font-medium text-cream-dim mb-1.5">Rahmengröße</span>
        <input
          value={frameSize}
          onChange={(e) => setFrameSize(e.target.value)}
          placeholder="z.B. M oder 44 cm"
          className="input"
        />
      </label>
      {GEOMETRY_FIELDS.map((f) => (
        <label key={f.key} className="block">
          <span className="flex items-baseline justify-between mb-1.5">
            <span className={`text-sm font-medium ${f.primary ? 'text-accent' : 'text-cream-dim'}`}>
              {f.label}
              {f.primary && <span className="ml-1.5 font-mono text-[9px] font-semibold tracking-[0.12em]">WICHTIG</span>}
            </span>
            <span className="font-mono text-xs text-muted">{f.unit}</span>
          </span>
          <input
            value={values[f.key]}
            onChange={(e) => set(f.key, e.target.value)}
            inputMode="decimal"
            placeholder={`z.B. ${f.unit === '°' ? '64,5' : '450'}`}
            className="input"
          />
          <span className="block text-xs text-muted mt-1.5 leading-relaxed">{f.hint}</span>
        </label>
      ))}
      {error && <p className="text-sm text-danger">{error}</p>}
    </Modal>
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
