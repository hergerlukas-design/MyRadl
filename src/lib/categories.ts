import {
  MoveVertical,
  Wind,
  Cog,
  Disc3,
  CircleDot,
  Circle,
  Move,
  MoveHorizontal,
  Grip,
  Armchair,
  ArrowUpDown,
  Package,
  type LucideIcon,
} from 'lucide-react'
import type { Part, PartCategory } from '@/types'

export interface CategoryMeta {
  value: PartCategory
  label: string
  icon: LucideIcon
  /**
   * Fester Farbcode der Kategorie als CSS-Variable — wechselt zwischen Dark-
   * und Light-Theme automatisch (siehe index.css) und bleibt in Liste, Detail
   * und Suche identisch.
   */
  color: string
}

// Reihenfolge = Anzeigereihenfolge in der Bauteilliste.
export const CATEGORIES: CategoryMeta[] = [
  { value: 'federgabel', label: 'Federgabel', icon: MoveVertical, color: 'var(--cat-federgabel)' },
  { value: 'daempfer', label: 'Dämpfer', icon: Wind, color: 'var(--cat-daempfer)' },
  { value: 'antrieb', label: 'Antrieb', icon: Cog, color: 'var(--cat-antrieb)' },
  { value: 'bremsen', label: 'Bremsen', icon: Disc3, color: 'var(--cat-bremsen)' },
  { value: 'laufraeder', label: 'Laufräder', icon: CircleDot, color: 'var(--cat-laufraeder)' },
  { value: 'reifen', label: 'Reifen', icon: Circle, color: 'var(--cat-reifen)' },
  { value: 'vorbau', label: 'Vorbau', icon: Move, color: 'var(--cat-vorbau)' },
  { value: 'lenker', label: 'Lenker', icon: MoveHorizontal, color: 'var(--cat-lenker)' },
  { value: 'griffe', label: 'Griffe', icon: Grip, color: 'var(--cat-griffe)' },
  { value: 'sattel', label: 'Sattel', icon: Armchair, color: 'var(--cat-sattel)' },
  { value: 'sattelstuetze', label: 'Sattelstütze', icon: ArrowUpDown, color: 'var(--cat-sattelstuetze)' },
  { value: 'sonstiges', label: 'Sonstiges', icon: Package, color: 'var(--cat-sonstiges)' },
]

const BY_VALUE = new Map(CATEGORIES.map((c) => [c.value, c]))

export function categoryMeta(value: PartCategory): CategoryMeta {
  return BY_VALUE.get(value) ?? CATEGORIES[CATEGORIES.length - 1]
}

export function categoryLabel(value: PartCategory): string {
  return categoryMeta(value).label
}

/** Fester Farbcode (CSS-Variable, themebar). Legacy „Cockpit" → neutrale Farbe. */
export function categoryColor(value: PartCategory): string {
  if (value === 'cockpit') return 'var(--cat-sonstiges)'
  return categoryMeta(value).color
}

/** Kategorien, bei denen eine Einbauposition (vorne/hinten) sinnvoll ist. */
export function categoryHasPosition(value: PartCategory): boolean {
  return value === 'reifen' || value === 'laufraeder'
}

export interface PositionOption {
  value: string
  label: string
}

export const POSITION_OPTIONS: PositionOption[] = [
  { value: 'vorne', label: 'Vorne' },
  { value: 'hinten', label: 'Hinten' },
]

/** Anzeige-Label für eine gespeicherte Position, sonst null. */
export function positionLabel(position: string | null | undefined): string | null {
  return POSITION_OPTIONS.find((p) => p.value === position)?.label ?? null
}

/**
 * Sprechender Titel eines Teils. Bei „Sonstiges" ist die freie Bezeichnung der
 * primäre Titel; sonst Hersteller + Modell, zuletzt der Kategoriename.
 */
export function partTitle(
  part: Pick<Part, 'brand' | 'model' | 'custom_type' | 'category'>,
): string {
  if (part.category === 'sonstiges' && part.custom_type?.trim()) {
    return part.custom_type.trim()
  }
  const name = `${part.brand ?? ''} ${part.model ?? ''}`.trim()
  if (name) return name
  if (part.custom_type?.trim()) return part.custom_type.trim()
  return categoryLabel(part.category)
}

/**
 * Zweitzeile für Listen/Übersicht. Bei „Sonstiges" Hersteller + Modell (die
 * Bezeichnung steht bereits im Titel), sonst Position und Variante/Größe.
 */
export function partSubtitle(
  part: Pick<Part, 'brand' | 'model' | 'custom_type' | 'category' | 'position' | 'variant'>,
): string {
  if (part.category === 'sonstiges') {
    return `${part.brand ?? ''} ${part.model ?? ''}`.trim()
  }
  return [positionLabel(part.position), part.variant].filter(Boolean).join(' · ')
}

/** Häufige Einstell-Vorschläge je Kategorie (nur UI-Hilfe, frei überschreibbar). */
export const SETTING_SUGGESTIONS: Partial<Record<PartCategory, string[]>> = {
  federgabel: ['Luftdruck', 'Sag', 'Rebound', 'HSC', 'LSC', 'Tokens'],
  daempfer: ['Luftdruck', 'Feder', 'Sag', 'Rebound', 'HSC', 'LSC'],
  reifen: ['Luftdruck', 'Luftdruck vorne', 'Luftdruck hinten'],
  bremsen: ['Hebelweite', 'Druckpunkt'],
  antrieb: ['Kettenlänge', 'Übersetzung'],
}

// ── Schnellübersicht: „wichtige" Setup-Werte am Rad ───────────────────────────
// Diese Keys erscheinen in der Einstellungen-Karte unter der Geometrie
// (Federgabel, Dämpfer, Reifen). `primary` hebt die zentralen Werte hervor,
// `unit` ist die Standardeinheit, die beim ersten Setzen vorbelegt wird.
export interface ImportantSetting {
  key: string
  unit: string
  primary?: boolean
}

// Reihenfolge der Kategorien in der Schnellübersicht.
export const QUICK_SETTING_CATEGORIES: PartCategory[] = ['federgabel', 'daempfer', 'reifen']

const FEDERGABEL_SETTINGS: ImportantSetting[] = [
  { key: 'Luftdruck', unit: 'psi', primary: true },
  { key: 'Sag', unit: '%', primary: true },
  { key: 'Rebound', unit: 'Klicks' },
  { key: 'HSC', unit: 'Klicks' },
  { key: 'LSC', unit: 'Klicks' },
  { key: 'Tokens', unit: '' },
]

// ── Dämpfer: Luft- oder Stahlfeder-Dämpfer ────────────────────────────────────
// Der Typ wird als normale Einstellung am Teil gespeichert (Key = DAEMPFER_TYPE_KEY),
// damit er mit der Teil-Detailseite synchron bleibt. Luftdämpfer → „Luftdruck",
// Stahlfederdämpfer → „Feder" (Federrate). Der Rest ist identisch.
export type ShockType = 'air' | 'coil'
export const DAEMPFER_TYPE_KEY = 'Typ'

const DAEMPFER_BASE: ImportantSetting[] = [
  { key: 'Sag', unit: '%', primary: true },
  { key: 'Rebound', unit: 'Klicks' },
  { key: 'HSC', unit: 'Klicks' },
  { key: 'LSC', unit: 'Klicks' },
]

/** Leitet den Dämpfer-Typ aus dem gespeicherten „Typ"-Wert ab (Default: Luft). */
export function shockTypeFromValue(value: string | null | undefined): ShockType {
  const v = (value ?? '').toLowerCase()
  return v.includes('coil') || v.includes('feder') || v.includes('stahl') ? 'coil' : 'air'
}

export function shockTypeLabel(type: ShockType): string {
  return type === 'coil' ? 'Coil' : 'Luft'
}

function daempferSettings(type: ShockType): ImportantSetting[] {
  const head: ImportantSetting =
    type === 'coil'
      ? { key: 'Feder', unit: 'lbs', primary: true }
      : { key: 'Luftdruck', unit: 'psi', primary: true }
  return [head, ...DAEMPFER_BASE]
}

function reifenSettings(hasPosition: boolean): ImportantSetting[] {
  // Positionierte Reifen (vorne/hinten) haben je einen Luftdruck; ein einzelner
  // Reifen ohne Position deckt vorne und hinten separat ab.
  return hasPosition
    ? [{ key: 'Luftdruck', unit: 'bar', primary: true }]
    : [
        { key: 'Luftdruck vorne', unit: 'bar', primary: true },
        { key: 'Luftdruck hinten', unit: 'bar', primary: true },
      ]
}

/** Wichtige Einstellungen für ein konkretes Teil (Dämpfer typ-, Reifen positionsabhängig). */
export function importantSettingsForPart(
  part: Pick<Part, 'category' | 'position'>,
  shockType: ShockType = 'air',
): ImportantSetting[] {
  switch (part.category) {
    case 'federgabel':
      return FEDERGABEL_SETTINGS
    case 'daempfer':
      return daempferSettings(shockType)
    case 'reifen':
      return reifenSettings(!!part.position)
    default:
      return []
  }
}
