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
import PageHeader, { squareBtn } from '@/components/PageHeader'
import Modal from '@/components/ui/Modal'
import Spinner from '@/components/ui/Spinner'
import ImageUpload from '@/components/ImageUpload'
import { categoryColor, categoryLabel, SETTING_SUGGESTIONS } from '@/lib/categories'
import { uploadPartPhoto, deletePhoto } from '@/lib/storage'
import { useAuth } from '@/hooks/useAuth'
import { useBike } from '@/hooks/useBikes'
import { usePart, useUpdatePart } from '@/hooks/useParts'
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
  const { data: bike } = useBike(part?.bike_id ?? '')
  const updatePart = useUpdatePart()

  if (isLoading || !part) {
    return (
      <Layout>
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

  const color = categoryColor(part.category)

  return (
    <Layout>
      <header className="border-b border-white/[0.07] px-5 pt-4 pb-5 flex-none">
        <PageHeader
          eyebrow={(bike?.name ?? '').toUpperCase()}
          onBack={() => navigate(`/bikes/${part.bike_id}`)}
          action={
            <button
              onClick={() => navigate(`/parts/${part.id}/edit`)}
              className={squareBtn}
              aria-label="Bearbeiten"
            >
              <Pencil size={15} className="text-accent" />
            </button>
          }
        />
        <div className="mt-3.5 flex flex-col gap-1.5">
          <span className="font-mono text-[10px] font-medium tracking-[0.16em]" style={{ color }}>
            {categoryLabel(part.category).toUpperCase()}
          </span>
          <h1 className="font-display font-extrabold text-[30px] leading-[1.05] tracking-[-0.02em] text-cream">
            {part.brand} {part.model}
          </h1>
          <span className="font-mono text-[13px] text-muted">{part.variant || categoryLabel(part.category)}</span>
        </div>
      </header>

      <div className="flex-1 px-5 py-5 flex flex-col gap-4">
        <ImageUpload
          value={part.image_url}
          onUpload={handlePhoto}
          onRemove={handlePhotoRemove}
          aspect="square"
          label="Teilfoto"
        />

        <Stammdaten part={part} />
        <SettingsBlock partId={part.id} category={part.category} />
        {part.notes && (
          <div className="bg-surface border border-white/[0.07] rounded-[20px] p-4 flex flex-col gap-2">
            <span className="eyebrow">SETUP-NOTIZ</span>
            <p className="text-sm leading-relaxed text-cream-dim whitespace-pre-wrap">{part.notes}</p>
          </div>
        )}
        <LinksBlock partId={part.id} />
        <HistoryBlock partId={part.id} />

        {part.status === 'aktiv' && (
          <button
            onClick={() => navigate(`/parts/${part.id}/replace`)}
            className="w-full flex items-center justify-center gap-2 border border-accent/40 text-accent font-semibold py-3.5 rounded-xl active:scale-[0.98] transition-transform"
          >
            <Repeat size={18} /> Teil ersetzen
          </button>
        )}
      </div>
    </Layout>
  )
}

// ── Stammdaten ────────────────────────────────────────────────────────────────
function Stammdaten({ part }: { part: Part }) {
  const rows: [string, string][] = [
    ['KATEGORIE', categoryLabel(part.category)],
    ['HERSTELLER', part.brand],
    ['MODELL', part.model],
    ...(part.variant ? [['VARIANTE', part.variant] as [string, string]] : []),
    ['STATUS', part.status],
    ...(part.install_date ? [['EINBAU', fmtDate(part.install_date)] as [string, string]] : []),
  ]
  return (
    <div className="bg-surface border border-white/[0.07] rounded-[20px] px-4">
      {rows.map(([label, value], i) => (
        <div
          key={label}
          className={`flex items-center justify-between py-3.5 ${
            i < rows.length - 1 ? 'border-b border-white/[0.06]' : ''
          }`}
        >
          <span className="eyebrow">{label}</span>
          <span
            className={`text-sm font-medium ${
              label === 'STATUS' && value === 'ersetzt' ? 'text-muted' : 'text-cream-dim'
            }`}
          >
            {value}
          </span>
        </div>
      ))}
    </div>
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
    <section className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <h2 className="text-[15px] font-extrabold tracking-[0.02em] text-cream">{title}</h2>
        <button
          onClick={onAdd}
          className="flex items-center gap-1 text-accent text-[13px] font-semibold"
          aria-label={`${title} hinzufügen`}
        >
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
        <p className="font-mono text-xs text-muted py-1">Noch keine Einstellungen erfasst.</p>
      ) : (
        <div className="bg-surface border border-white/[0.07] rounded-[20px] px-4">
          {settings.map((s, i) => (
            <div
              key={s.id}
              className={`flex items-center gap-3 py-3.5 ${
                i < settings.length - 1 ? 'border-b border-white/[0.06]' : ''
              }`}
            >
              <span className="flex-1 eyebrow">{s.key}</span>
              <button onClick={() => setEditing(s)} className="text-sm font-medium text-cream-dim">
                {s.value}
                {s.unit ? ` ${s.unit}` : ''}
              </button>
              <button
                onClick={() => del.mutate({ id: s.id, partId })}
                className="text-dim hover:text-danger"
                aria-label="Löschen"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
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
        <button onClick={save} disabled={upsert.isPending} className="w-full py-3.5 rounded-xl bg-accent text-accent-ink font-semibold disabled:opacity-60">
          Speichern
        </button>
      }
    >
      <label className="block">
        <span className="block text-sm font-medium text-cream-dim mb-1.5">Bezeichnung</span>
        <input value={key} onChange={(e) => setKey(e.target.value)} list="setting-suggestions" placeholder="z.B. Luftdruck" className="input" autoFocus />
        <datalist id="setting-suggestions">
          {suggestions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="block text-sm font-medium text-cream-dim mb-1.5">Wert</span>
          <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="z.B. 75" className="input" />
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-cream-dim mb-1.5">Einheit</span>
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
    <Section title="Shop & Preisvergleich" onAdd={() => setAdding(true)}>
      {!links || links.length === 0 ? (
        <p className="font-mono text-xs text-muted py-1">Noch keine Links. Füge Shop- oder Vergleichslinks hinzu.</p>
      ) : (
        <div className="bg-surface border border-white/[0.07] rounded-[20px] px-4">
          {links.map((l, i) => (
            <div
              key={l.id}
              className={`flex items-center gap-3 py-3.5 ${
                i < links.length - 1 ? 'border-b border-white/[0.06]' : ''
              }`}
            >
              <a
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center gap-2 text-sm font-medium text-accent min-w-0"
              >
                <ExternalLink size={15} className="flex-shrink-0" />
                <span className="truncate">{l.label}</span>
              </a>
              <button onClick={() => del.mutate({ id: l.id, partId })} className="text-dim hover:text-danger" aria-label="Löschen">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
      {adding && (
        <Modal
          title="Link hinzufügen"
          onClose={() => setAdding(false)}
          footer={
            <button onClick={save} disabled={add.isPending} className="w-full py-3.5 rounded-xl bg-accent text-accent-ink font-semibold disabled:opacity-60">
              Speichern
            </button>
          }
        >
          <label className="block">
            <span className="block text-sm font-medium text-cream-dim mb-1.5">Bezeichnung</span>
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="z.B. Bike-Components" className="input" autoFocus />
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-cream-dim mb-1.5">URL</span>
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" inputMode="url" className="input" />
          </label>
        </Modal>
      )}
    </Section>
  )
}

// ── Verlaufshistorie ──────────────────────────────────────────────────────────
const EVENT_META: Record<HistoryEventType, { label: string; icon: typeof Wrench; color: string }> = {
  eingebaut: { label: 'Eingebaut', icon: PackagePlus, color: '#A6D65A' },
  gewartet: { label: 'Gewartet', icon: Wrench, color: '#6FA8D6' },
  ersetzt: { label: 'Ersetzt', icon: ArrowLeftRight, color: '#D6A65A' },
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
        <p className="font-mono text-xs text-muted py-1">Noch keine Einträge.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {history.map((h) => {
            const meta = EVENT_META[h.event_type] ?? EVENT_META.gewartet
            const Icon = meta.icon
            return (
              <div key={h.id} className="flex items-start gap-3 bg-surface border border-white/[0.07] rounded-[18px] px-4 py-3.5">
                <Icon size={18} className="mt-0.5 flex-shrink-0" style={{ color: meta.color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-cream">{meta.label}</span>
                    <span className="font-mono text-xs text-muted">{fmtDate(h.event_date)}</span>
                  </div>
                  {h.note && <p className="text-sm text-cream-dim mt-0.5 whitespace-pre-wrap">{h.note}</p>}
                </div>
                <button onClick={() => del.mutate({ id: h.id, partId })} className="text-dim hover:text-danger mt-0.5" aria-label="Löschen">
                  <Trash2 size={15} />
                </button>
              </div>
            )
          })}
        </div>
      )}
      {adding && (
        <Modal
          title="Verlaufseintrag"
          onClose={() => setAdding(false)}
          footer={
            <button onClick={save} disabled={add.isPending} className="w-full py-3.5 rounded-xl bg-accent text-accent-ink font-semibold disabled:opacity-60">
              Speichern
            </button>
          }
        >
          <label className="block">
            <span className="block text-sm font-medium text-cream-dim mb-1.5">Ereignis</span>
            <select value={type} onChange={(e) => setType(e.target.value as HistoryEventType)} className="input">
              <option value="eingebaut">Eingebaut</option>
              <option value="gewartet">Gewartet</option>
              <option value="ersetzt">Ersetzt</option>
            </select>
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-cream-dim mb-1.5">Datum</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-cream-dim mb-1.5">Notiz</span>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="optional" className="input resize-none" />
          </label>
        </Modal>
      )}
    </Section>
  )
}
