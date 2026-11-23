import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { format } from 'date-fns'
import {
  ChevronDown,
  ExternalLink,
  Eye,
  Ruler,
  SlidersHorizontal,
  Wrench,
  PackagePlus,
  ArrowLeftRight,
} from 'lucide-react'
import Layout from '@/components/Layout'
import Watermark from '@/components/Watermark'
import Spinner from '@/components/ui/Spinner'
import LikeButton from '@/components/LikeButton'
import { photoUrl } from '@/lib/storage'
import {
  categoryColor,
  categoryLabel,
  categoryMeta,
  partTitle,
  partSubtitle,
  positionLabel,
  sortParts,
  importantSettingsForPart,
  shockTypeFromValue,
  DAEMPFER_TYPE_KEY,
  QUICK_SETTING_CATEGORIES,
  type ShockType,
} from '@/lib/categories'
import { GEOMETRY_FIELDS, formatGeometryValue } from '@/lib/geometry'
import { useSharedBike } from '@/hooks/useSharedBike'
import { useProfileByUserId } from '@/hooks/useProfile'
import { useBikeLike } from '@/hooks/useLikes'
import { useParts } from '@/hooks/useParts'
import { useBikeGeometry } from '@/hooks/useBikeGeometry'
import { useBikeSettings, useBikeLinks, useBikeHistory, type BikeSetting } from '@/hooks/usePartMeta'
import type { BikeGeometry, HistoryEventType, Part, PartHistory, PartLink, Profile } from '@/types'

/** Zahl fürs Header-Kachel-Format (deutsches Dezimalkomma, optionale Einheit). */
function tileValue(value: number | null | undefined, unit = ''): string {
  if (value === null || value === undefined) return '–'
  return `${String(value).replace('.', ',')}${unit}`
}

function fmtDate(iso: string): string {
  try {
    return format(new Date(iso), 'dd.MM.yyyy')
  } catch {
    return iso
  }
}

/**
 * Öffentliche, schreibgeschützte Ansicht eines Rads (`/share/:shareToken`).
 * Ohne Login erreichbar; sichtbar ist ausschließlich das Rad zum Token – die
 * RLS-Policies geben nur Räder mit `visibility = 'public'` frei.
 */
export default function SharedBike() {
  const { shareToken = '' } = useParams()
  const { data: bike, isLoading, isError } = useSharedBike(shareToken)
  const bikeId = bike?.id ?? ''
  const { data: parts } = useParts(bikeId)
  const { data: geo } = useBikeGeometry(bikeId)
  const { data: settings } = useBikeSettings(bikeId)
  const { data: links } = useBikeLinks(bikeId)
  const { data: history } = useBikeHistory(bikeId)
  const { data: owner } = useProfileByUserId(bike?.user_id)
  const { likes } = useBikeLike(bikeId)

  const sorted = useMemo(() => sortParts(parts ?? []), [parts])

  if (isLoading) {
    return (
      <Layout hideNav>
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      </Layout>
    )
  }

  if (isError || !bike) {
    return <NotShared />
  }

  const sub = [bike.brand, bike.year, bike.model].filter(Boolean).join(' · ')
  const photo = photoUrl(bike.image_url)

  return (
    <Layout hideNav>
      <header className="relative overflow-hidden border-b border-hair flex-none">
        <Watermark variant="bottom" />
        <div className="relative px-5 pt-5 pb-5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface border border-hair-strong px-2.5 py-1">
              <Eye size={12} className="text-accent" />
              <span className="font-mono text-[9px] font-medium tracking-[0.16em] text-cream-dim">
                GETEILTES RAD · NUR LESEN
              </span>
            </span>
          </div>
          <h1 className="mt-3.5 font-display font-black text-[42px] leading-[0.95] tracking-[-0.03em] text-cream">
            {bike.name}
          </h1>
          {sub && <p className="mt-0.5 font-mono text-[13px] text-muted">{sub}</p>}
          <div className="mt-3.5 flex items-center gap-3">
            {bikeId && <LikeButton bikeId={bikeId} likes={likes} />}
            {owner && (
              <Link to={`/u/${owner.username}`} className="min-w-0 flex flex-col gap-0.5">
                <span className="font-mono text-[12.5px] text-accent truncate">@{owner.username}</span>
                {owner.display_name && (
                  <span className="text-[12px] text-muted truncate">{owner.display_name}</span>
                )}
              </Link>
            )}
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2.5">
            <Tile label="REACH" value={tileValue(geo?.reach)} />
            <Tile label="STACK" value={tileValue(geo?.stack)} />
            <Tile label="LW" value={tileValue(geo?.head_angle, '°')} />
            <Tile label="KETTE" value={tileValue(geo?.chainstay_length)} />
          </div>
        </div>
      </header>

      <div className="flex-1 px-5 py-5 flex flex-col gap-5">
        {photo && (
          <img
            src={photo}
            alt={bike.name}
            className="w-full aspect-video object-cover rounded-[20px] border border-hair"
          />
        )}

        <GeometryCard geo={geo ?? null} />
        <SetupCard parts={sorted} settings={settings ?? []} />

        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-extrabold tracking-[0.02em] text-cream">Verbaute Teile</h2>
          {sorted.length > 0 && (
            <span className="font-mono text-xs text-muted">
              {sorted.filter((p) => p.status === 'aktiv').length} aktiv
            </span>
          )}
        </div>

        {sorted.length === 0 ? (
          <p className="font-mono text-xs text-muted text-center py-8">Keine Bauteile erfasst.</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {sorted.map((part) => (
              <SharedPartRow
                key={part.id}
                part={part}
                settings={(settings ?? []).filter((s) => s.part_id === part.id)}
                links={(links ?? []).filter((l) => l.part_id === part.id)}
                history={(history ?? []).filter((h) => h.part_id === part.id)}
              />
            ))}
          </div>
        )}

        <ShareFooter owner={owner ?? null} />
      </div>
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

/** Hinweis, wenn der Token unbekannt ist oder das Rad nicht (mehr) geteilt wird. */
function NotShared() {
  return (
    <Layout hideNav>
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 text-center">
        <h1 className="font-display font-black text-[28px] leading-tight tracking-[-0.02em] text-cream">
          Link nicht verfügbar
        </h1>
        <p className="text-sm text-cream-dim leading-relaxed">
          Dieses Rad wird nicht (mehr) öffentlich geteilt oder der Link wurde neu generiert. Frag die
          Besitzerin oder den Besitzer nach einem aktuellen Link.
        </p>
        <Link
          to="/"
          className="mt-2 px-5 py-3 rounded-xl bg-accent text-accent-ink text-sm font-semibold"
        >
          MyRadl öffnen
        </Link>
      </div>
    </Layout>
  )
}

function ShareFooter({ owner }: { owner: Profile | null }) {
  return (
    <div className="mt-2 flex flex-col items-center gap-2.5 border-t border-hair pt-5 text-center">
      <p className="text-xs text-muted leading-relaxed">
        Schreibgeschützte Ansicht – geteilt mit MyRadl. Sichtbar sind nur Räder, die ausdrücklich
        öffentlich geteilt wurden.
      </p>
      {owner && (
        <Link to={`/u/${owner.username}`} className="text-sm font-semibold text-accent">
          Alle öffentlichen Räder von @{owner.username}
        </Link>
      )}
      <Link to="/community" className="text-sm font-semibold text-accent">
        Community entdecken
      </Link>
      <Link to="/" className="text-sm font-medium text-muted">
        Eigenes Setup verwalten
      </Link>
    </div>
  )
}

// ── Aufklappbare Karte (nur lesend) ──────────────────────────────────────────
function Card({
  icon: Icon,
  title,
  summary,
  children,
}: {
  icon: typeof Ruler
  title: string
  summary?: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  return (
    <section className="bg-surface border border-hair rounded-[20px] overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-4 py-3.5 min-w-0 text-left"
        aria-expanded={open}
      >
        <Icon size={16} className="text-muted flex-shrink-0" />
        <span className="text-[15px] font-extrabold text-cream flex-shrink-0">{title}</span>
        {!open && summary && <span className="font-mono text-xs text-muted truncate">{summary}</span>}
        <ChevronDown
          size={18}
          className={`ml-auto flex-shrink-0 text-muted transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <div className="border-t border-hair-soft">{children}</div>}
    </section>
  )
}

// ── Geometrie ────────────────────────────────────────────────────────────────
function GeometryCard({ geo }: { geo: BikeGeometry | null }) {
  const hasAny = geo != null && (!!geo.frame_size || GEOMETRY_FIELDS.some((f) => geo[f.key] != null))
  if (!hasAny) return null

  const summary = [
    geo!.frame_size ? `Gr. ${geo!.frame_size}` : null,
    geo!.reach != null ? `Reach ${geo!.reach}` : null,
    geo!.stack != null ? `Stack ${geo!.stack}` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <Card icon={Ruler} title="Geometrie" summary={summary}>
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
            className={`flex items-center justify-between py-3 ${
              i < arr.length - 1 ? 'border-b border-hair-soft' : ''
            }`}
          >
            <span className={`text-sm ${f.primary ? 'font-semibold text-cream' : 'text-muted'}`}>
              {f.label}
            </span>
            <span
              className={`text-sm ${f.primary ? 'font-bold text-accent' : 'font-medium text-cream-dim'}`}
            >
              {formatGeometryValue(geo![f.key], f.unit)}
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ── Setup-Schnellübersicht ───────────────────────────────────────────────────
function SetupCard({ parts, settings }: { parts: Part[]; settings: BikeSetting[] }) {
  const valueFor = (partId: string, key: string) =>
    settings.find((s) => s.part_id === partId && s.key === key) ?? null

  const shockTypeOf = (part: Part): ShockType =>
    part.category === 'daempfer'
      ? shockTypeFromValue(valueFor(part.id, DAEMPFER_TYPE_KEY)?.value)
      : 'air'

  const groups = QUICK_SETTING_CATEGORIES.map((cat) => ({
    cat,
    parts: parts.filter((p) => p.category === cat && p.status === 'aktiv'),
  })).filter((g) => g.parts.length > 0)

  const rows = groups.flatMap(({ cat, parts: catParts }) =>
    catParts.map((part) => ({
      part,
      cat,
      values: importantSettingsForPart(part, shockTypeOf(part))
        .map((s) => ({ ...s, current: valueFor(part.id, s.key) }))
        .filter((s) => s.current != null),
    })),
  ).filter((r) => r.values.length > 0)

  if (rows.length === 0) return null

  const summary = rows
    .map(({ cat, values }) => {
      const first = values[0]!
      const short = cat === 'federgabel' ? 'Gabel' : categoryLabel(cat)
      return `${short} ${first.current!.value}${first.current!.unit ? ` ${first.current!.unit}` : ''}`
    })
    .slice(0, 3)
    .join(' · ')

  return (
    <Card icon={SlidersHorizontal} title="Einstellungen" summary={summary}>
      <div className="px-4">
        {rows.map(({ part, cat, values }) => {
          const Icon = categoryMeta(cat).icon
          const color = categoryColor(cat)
          const eyebrow = [categoryLabel(cat), positionLabel(part.position)]
            .filter(Boolean)
            .join(' · ')
            .toUpperCase()
          return (
            <div key={part.id} className="py-3 border-b border-hair-soft last:border-0">
              <div className="flex items-center gap-1.5 min-w-0 mb-1.5">
                <Icon size={13} className="flex-none" style={{ color }} />
                <span
                  className="font-mono text-[9px] font-medium tracking-[0.16em] flex-none"
                  style={{ color }}
                >
                  {eyebrow}
                </span>
                <span className="text-[13px] font-semibold text-cream truncate">{partTitle(part)}</span>
              </div>
              {values.map((s) => (
                <div key={s.key} className="flex items-center justify-between py-2">
                  <span className={s.primary ? 'text-sm font-semibold text-cream' : 'text-sm text-muted'}>
                    {s.key}
                  </span>
                  <span
                    className={
                      s.primary ? 'text-sm font-bold text-accent' : 'text-sm font-medium text-cream-dim'
                    }
                  >
                    {s.current!.value}
                    {s.current!.unit ? ` ${s.current!.unit}` : ''}
                  </span>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </Card>
  )
}

// ── Bauteil (aufklappbar: Stammdaten, Einstellungen, Links, Verlauf) ─────────
const EVENT_META: Record<HistoryEventType, { label: string; icon: typeof Wrench; color: string }> = {
  eingebaut: { label: 'Eingebaut', icon: PackagePlus, color: 'var(--cat-federgabel)' },
  gewartet: { label: 'Gewartet', icon: Wrench, color: 'var(--cat-daempfer)' },
  ersetzt: { label: 'Ersetzt', icon: ArrowLeftRight, color: 'var(--cat-reifen)' },
}

function SharedPartRow({
  part,
  settings,
  links,
  history,
}: {
  part: Part
  settings: BikeSetting[]
  links: PartLink[]
  history: PartHistory[]
}) {
  const [open, setOpen] = useState(false)
  const color = categoryColor(part.category)
  const isReplaced = part.status === 'ersetzt'
  const sub = partSubtitle(part)
  const photo = photoUrl(part.image_url)

  const facts: [string, string][] = [
    ['HERSTELLER', part.brand],
    ...(part.model ? ([['MODELL', part.model]] as [string, string][]) : []),
    ...(positionLabel(part.position)
      ? ([['POSITION', positionLabel(part.position)!]] as [string, string][])
      : []),
    ...(part.variant ? ([['VARIANTE', part.variant]] as [string, string][]) : []),
    ['STATUS', part.status],
    ...(part.install_date ? ([['EINBAU', fmtDate(part.install_date)]] as [string, string][]) : []),
  ]

  return (
    <div
      className={`bg-surface border border-hair rounded-[18px] overflow-hidden ${
        isReplaced ? 'opacity-55' : ''
      }`}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-stretch gap-3 pl-1.5 pr-4 py-3.5 text-left"
        aria-expanded={open}
      >
        <span className="w-[3px] rounded-full flex-none self-stretch" style={{ background: color }} />
        <span className="flex-1 min-w-0 flex flex-col gap-1">
          <span className="font-mono text-[9px] font-medium tracking-[0.16em]" style={{ color }}>
            {categoryLabel(part.category).toUpperCase()}
          </span>
          <span className="block text-base font-semibold leading-tight text-cream truncate">
            {partTitle(part)}
          </span>
          <span className="font-mono text-xs text-muted truncate">{sub || '—'}</span>
        </span>
        <ChevronDown
          size={18}
          className={`self-center text-dim flex-none transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="border-t border-hair-soft px-4 py-3.5 flex flex-col gap-4">
          {photo && (
            <img
              src={photo}
              alt={partTitle(part)}
              className="w-full aspect-square object-cover rounded-[14px] border border-hair"
            />
          )}

          <div>
            {facts.map(([label, value], i) => (
              <div
                key={label}
                className={`flex items-center justify-between py-2.5 ${
                  i < facts.length - 1 ? 'border-b border-hair-soft' : ''
                }`}
              >
                <span className="eyebrow">{label}</span>
                <span className="text-sm font-medium text-cream-dim">{value}</span>
              </div>
            ))}
          </div>

          {settings.length > 0 && (
            <Block title="Einstellungen">
              {settings.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted">{s.key}</span>
                  <span className="text-sm font-medium text-cream-dim">
                    {s.value}
                    {s.unit ? ` ${s.unit}` : ''}
                  </span>
                </div>
              ))}
            </Block>
          )}

          {part.notes && (
            <Block title="Setup-Notiz">
              <p className="text-sm leading-relaxed text-cream-dim whitespace-pre-wrap py-1">
                {part.notes}
              </p>
            </Block>
          )}

          {links.length > 0 && (
            <Block title="Shop & Preisvergleich">
              {links.map((l) => (
                <a
                  key={l.id}
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="flex items-center gap-2 py-2 text-sm font-medium text-accent min-w-0"
                >
                  <ExternalLink size={15} className="flex-shrink-0" />
                  <span className="truncate">{l.label}</span>
                </a>
              ))}
            </Block>
          )}

          {history.length > 0 && (
            <Block title="Verlauf">
              {history.map((h) => {
                const meta = EVENT_META[h.event_type] ?? EVENT_META.gewartet
                const Icon = meta.icon
                return (
                  <div key={h.id} className="flex items-start gap-3 py-2">
                    <Icon size={16} className="mt-0.5 flex-shrink-0" style={{ color: meta.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-cream">{meta.label}</span>
                        <span className="font-mono text-xs text-muted">{fmtDate(h.event_date)}</span>
                      </div>
                      {h.note && (
                        <p className="text-sm text-cream-dim mt-0.5 whitespace-pre-wrap">{h.note}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </Block>
          )}
        </div>
      )}
    </div>
  )
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <span className="eyebrow mb-1">{title.toUpperCase()}</span>
      {children}
    </div>
  )
}
