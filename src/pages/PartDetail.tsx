import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import {
  Pencil,
  Plus,
  Trash2,
  ExternalLink,
  Repeat,
  Wrench,
  PackagePlus,
  ArrowLeftRight,
} from 'lucide-react'
import Layout from '@/components/Layout'
import Modal from '@/components/ui/Modal'
import Spinner from '@/components/ui/Spinner'
import ImageUpload from '@/components/ImageUpload'
import { categoryColor, categoryLabel, partTitle, positionLabel, SETTING_SUGGESTIONS } from '@/lib/categories'
import { uploadPartPhoto, deletePhoto } from '@/lib/storage'
import { useAuth } from '@/hooks/useAuth'
import { usePart, useUpdatePart, useDeletePart } from '@/hooks/useParts'
import {
  usePartSettings,
  useUpsertSetting,
  useDeleteSetting,
  usePartLinks,
  useAddLink,
  useDeleteLink,
  usePartHistory,
  useAddHistory,
  useDeleteHistory,
} from '@/hooks/usePartMeta'
import type { HistoryEventType, Part, PartSetting } from '@/types'

function fmtDate(iso: string): string {
  try {
    return format(new Date(iso), 'dd.MM.yyyy')
  } catch {
    return iso
  }
}

export default function PartDetail() {
  const { partId = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: part, isLoading } = usePart(partId)
  const updatePart = useUpdatePart()
  const deletePart = useDeletePart()
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (isLoading || !part) {
    return (
      <Layout title="Teil" back>
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      </Layout>
    )
  }

  async function handlePhoto(file: File) {
    const path = await uploadPartPhoto(user!.id, part!.id, file)
    if (part!.image_url && part!.image_url !== path) deletePhoto(part!.image_url)
    await updatePart.mutateAsync({ id: part!.id, patch: { image_url: path } })
    return path
  }

  async function handlePhotoRemove() {
    if (part!.image_url) deletePhoto(part!.image_url)
    await updatePart.mutateAsync({ id: part!.id, patch: { image_url: null } })
  }

  async function handleDelete() {
    if (part!.image_url) deletePhoto(part!.image_url)
    await deletePart.mutateAsync(part!.id)
    navigate(`/bikes/${part!.bike_id}`, { replace: true })
  }

  return (
    <Layout
      title={partTitle(part)}
      back
      action={
        <button
          onClick={() => navigate(`/parts/${part.id}/edit`)}
          className="p-1.5 text-gray-500 hover:text-gray-900"
          aria-label="Bearbeiten"
        >
          <Pencil size={18} />
        </button>
      }
    >
      <div className="p-4 space-y-5">
        <ImageUpload
          value={part.image_url}
          onUpload={handlePhoto}
          onRemove={handlePhotoRemove}
          aspect="square"
          label="Teilfoto"
        />

        <Stammdaten part={part} />
        <SettingsBlock partId={part.id} category={part.category} />
        <LinksBlock partId={part.id} />
        <HistoryBlock partId={part.id} />

        {part.status === 'aktiv' && (
          <button
            onClick={() => navigate(`/parts/${part.id}/replace`)}
            className="w-full flex items-center justify-center gap-2 border border-primary text-primary font-semibold py-3 rounded-xl active:scale-[0.98] transition-transform"
          >
            <Repeat size={18} /> Teil ersetzen
          </button>
        )}

        <button
          onClick={() => setConfirmDelete(true)}
          className="w-full flex items-center justify-center gap-2 text-red-600 text-sm font-medium py-2"
        >
          <Trash2 size={16} /> Teil löschen
        </button>
      </div>

      {confirmDelete && (
        <Modal
          title="Teil löschen?"
          onClose={() => setConfirmDelete(false)}
          footer={
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(false)} className="flex-1 py-3 rounded-xl bg-gray-100 font-semibold">
                Abbrechen
              </button>
              <button
                onClick={handleDelete}
                disabled={deletePart.isPending}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white font-semibold disabled:opacity-60"
              >
                Löschen
              </button>
            </div>
          }
        >
          <p className="text-sm text-gray-600">
            „{partTitle(part)}" und alle zugehörigen Einstellungen, Links und Verläufe werden dauerhaft gelöscht.
          </p>
        </Modal>
      )}
    </Layout>
  )
}

// ── Stammdaten ────────────────────────────────────────────────────────────────
function Stammdaten({ part }: { part: Part }) {
  const rows: [string, string][] = [
    ['Kategorie', categoryLabel(part.category)],
    ...(part.custom_type ? [['Bezeichnung', part.custom_type] as [string, string]] : []),
    ['Hersteller', part.brand],
    ...(part.model ? [['Modell', part.model] as [string, string]] : []),
    ...(positionLabel(part.position) ? [['Position', positionLabel(part.position)!] as [string, string]] : []),
    ...(part.variant ? [['Variante', part.variant] as [string, string]] : []),
    ['Status', part.status],
    ...(part.install_date ? [['Einbaudatum', fmtDate(part.install_date)] as [string, string]] : []),
  ]
  const color = categoryColor(part.category)
  return (
    <section
      className="card rounded-2xl divide-y divide-[var(--color-border-subtle)]"
      style={{ borderLeft: `4px solid ${color.fg}` }}
    >
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between px-4 py-2.5">
          <span className="text-sm text-gray-500">{label}</span>
          <span className={`text-sm font-medium ${label === 'Status' && value === 'ersetzt' ? 'text-gray-400' : 'text-gray-900'}`}>
            {value}
          </span>
        </div>
      ))}
      {part.notes && (
        <div className="px-4 py-3">
          <p className="text-sm text-gray-500 mb-0.5">Notizen</p>
          <p className="text-sm text-gray-800 whitespace-pre-wrap">{part.notes}</p>
        </div>
      )}
    </section>
  )
}

// ── Section shell ─────────────────────────────────────────────────────────────
function Section({
  title,
  onAdd,
  children,
}: {
  title: string
  onAdd: () => void
  children: React.ReactNode
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        <button onClick={onAdd} className="flex items-center gap-1 text-primary text-sm font-semibold" aria-label={`${title} hinzufügen`}>
          <Plus size={16} /> Hinzufügen
        </button>
      </div>
      {children}
    </section>
  )
}

// ── Einstellungen ─────────────────────────────────────────────────────────────
function SettingsBlock({ partId, category }: { partId: string; category: Part['category'] }) {
  const { data: settings } = usePartSettings(partId)
  const del = useDeleteSetting()
  const [editing, setEditing] = useState<PartSetting | 'new' | null>(null)

  return (
    <Section title="Einstellungen" onAdd={() => setEditing('new')}>
      {!settings || settings.length === 0 ? (
        <p className="text-sm text-gray-400 py-2">Noch keine Einstellungen erfasst.</p>
      ) : (
        <ul className="card rounded-2xl divide-y divide-[var(--color-border-subtle)]">
          {settings.map((s) => (
            <li key={s.id} className="flex items-center gap-3 px-4 py-2.5">
              <span className="flex-1 text-sm text-gray-700">{s.key}</span>
              <button onClick={() => setEditing(s)} className="text-sm font-semibold text-gray-900">
                {s.value}
                {s.unit ? ` ${s.unit}` : ''}
              </button>
              <button
                onClick={() => del.mutate({ id: s.id, partId })}
                className="text-gray-300 hover:text-red-500"
                aria-label="Löschen"
              >
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
      {editing && (
        <SettingModal
          partId={partId}
          category={category}
          setting={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </Section>
  )
}

function SettingModal({
  partId,
  category,
  setting,
  onClose,
}: {
  partId: string
  category: Part['category']
  setting: PartSetting | null
  onClose: () => void
}) {
  const upsert = useUpsertSetting()
  const [key, setKey] = useState(setting?.key ?? '')
  const [value, setValue] = useState(setting?.value ?? '')
  const [unit, setUnit] = useState(setting?.unit ?? '')
  const suggestions = SETTING_SUGGESTIONS[category] ?? []

  async function save() {
    if (!key.trim() || !value.trim()) return
    await upsert.mutateAsync({
      id: setting?.id,
      part_id: partId,
      key: key.trim(),
      value: value.trim(),
      unit: unit.trim() || null,
    })
    onClose()
  }

  return (
    <Modal
      title={setting ? 'Einstellung bearbeiten' : 'Neue Einstellung'}
      onClose={onClose}
      footer={
        <button onClick={save} disabled={upsert.isPending} className="w-full py-3 rounded-xl bg-primary text-white font-semibold disabled:opacity-60">
          Speichern
        </button>
      }
    >
      <label className="block">
        <span className="block text-sm font-medium text-gray-700 mb-1">Bezeichnung</span>
        <input value={key} onChange={(e) => setKey(e.target.value)} list="setting-suggestions" placeholder="z.B. Luftdruck" className="input" autoFocus />
        <datalist id="setting-suggestions">
          {suggestions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="block text-sm font-medium text-gray-700 mb-1">Wert</span>
          <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="z.B. 75" className="input" />
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-gray-700 mb-1">Einheit</span>
          <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="z.B. psi" className="input" />
        </label>
      </div>
    </Modal>
  )
}

// ── Shop-Links ────────────────────────────────────────────────────────────────
function LinksBlock({ partId }: { partId: string }) {
  const { data: links } = usePartLinks(partId)
  const add = useAddLink()
  const del = useDeleteLink()
  const [adding, setAdding] = useState(false)
  const [label, setLabel] = useState('')
  const [url, setUrl] = useState('')

  async function save() {
    if (!label.trim() || !url.trim()) return
    const normalized = /^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`
    await add.mutateAsync({ part_id: partId, label: label.trim(), url: normalized })
    setLabel('')
    setUrl('')
    setAdding(false)
  }

  return (
    <Section title="Shop &amp; Preisvergleich" onAdd={() => setAdding(true)}>
      {!links || links.length === 0 ? (
        <p className="text-sm text-gray-400 py-2">Noch keine Links. Füge Shop- oder Vergleichslinks hinzu.</p>
      ) : (
        <ul className="card rounded-2xl divide-y divide-[var(--color-border-subtle)]">
          {links.map((l) => (
            <li key={l.id} className="flex items-center gap-3 px-4 py-2.5">
              <a
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center gap-2 text-sm font-medium text-primary min-w-0"
              >
                <ExternalLink size={15} className="flex-shrink-0" />
                <span className="truncate">{l.label}</span>
              </a>
              <button onClick={() => del.mutate({ id: l.id, partId })} className="text-gray-300 hover:text-red-500" aria-label="Löschen">
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
      {adding && (
        <Modal
          title="Link hinzufügen"
          onClose={() => setAdding(false)}
          footer={
            <button onClick={save} disabled={add.isPending} className="w-full py-3 rounded-xl bg-primary text-white font-semibold disabled:opacity-60">
              Speichern
            </button>
          }
        >
          <label className="block">
            <span className="block text-sm font-medium text-gray-700 mb-1">Bezeichnung</span>
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="z.B. Bike-Components" className="input" autoFocus />
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-gray-700 mb-1">URL</span>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" inputMode="url" className="input" />
          </label>
        </Modal>
      )}
    </Section>
  )
}

// ── Verlaufshistorie ──────────────────────────────────────────────────────────
const EVENT_META: Record<HistoryEventType, { label: string; icon: typeof Wrench; color: string }> = {
  eingebaut: { label: 'Eingebaut', icon: PackagePlus, color: 'text-primary' },
  gewartet: { label: 'Gewartet', icon: Wrench, color: 'text-blue-600' },
  ersetzt: { label: 'Ersetzt', icon: ArrowLeftRight, color: 'text-orange-600' },
}

function HistoryBlock({ partId }: { partId: string }) {
  const { data: history } = usePartHistory(partId)
  const add = useAddHistory()
  const del = useDeleteHistory()
  const [adding, setAdding] = useState(false)
  const [type, setType] = useState<HistoryEventType>('gewartet')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [note, setNote] = useState('')

  async function save() {
    if (!date) return
    await add.mutateAsync({ part_id: partId, event_type: type, event_date: date, note: note.trim() || null })
    setNote('')
    setAdding(false)
  }

  return (
    <Section title="Verlauf" onAdd={() => setAdding(true)}>
      {!history || history.length === 0 ? (
        <p className="text-sm text-gray-400 py-2">Noch keine Einträge.</p>
      ) : (
        <ul className="space-y-2">
          {history.map((h) => {
            const meta = EVENT_META[h.event_type] ?? EVENT_META.gewartet
            const Icon = meta.icon
            return (
              <li key={h.id} className="card flex items-start gap-3 rounded-xl px-4 py-3">
                <Icon size={18} className={`mt-0.5 flex-shrink-0 ${meta.color}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-gray-900">{meta.label}</span>
                    <span className="text-xs text-gray-400">{fmtDate(h.event_date)}</span>
                  </div>
                  {h.note && <p className="text-sm text-gray-600 mt-0.5 whitespace-pre-wrap">{h.note}</p>}
                </div>
                <button onClick={() => del.mutate({ id: h.id, partId })} className="text-gray-300 hover:text-red-500 mt-0.5" aria-label="Löschen">
                  <Trash2 size={15} />
                </button>
              </li>
            )
          })}
        </ul>
      )}
      {adding && (
        <Modal
          title="Verlaufseintrag"
          onClose={() => setAdding(false)}
          footer={
            <button onClick={save} disabled={add.isPending} className="w-full py-3 rounded-xl bg-primary text-white font-semibold disabled:opacity-60">
              Speichern
            </button>
          }
        >
          <label className="block">
            <span className="block text-sm font-medium text-gray-700 mb-1">Ereignis</span>
            <select value={type} onChange={(e) => setType(e.target.value as HistoryEventType)} className="input">
              <option value="eingebaut">Eingebaut</option>
              <option value="gewartet">Gewartet</option>
              <option value="ersetzt">Ersetzt</option>
            </select>
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-gray-700 mb-1">Datum</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-gray-700 mb-1">Notiz</span>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="optional" className="input resize-none" />
          </label>
        </Modal>
      )}
    </Section>
  )
}
