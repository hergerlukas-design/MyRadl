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
  Package,
  type LucideIcon,
} from 'lucide-react'
import type { Part, PartCategory } from '@/types'

export interface CategoryMeta {
  value: PartCategory
  label: string
  icon: LucideIcon
}

/** Farbpaar einer Kategorie: Chip-Hintergrund + Vorder-/Randfarbe. */
export interface CategoryColor {
  bg: string
  fg: string
}

/**
 * Zentrale Kategoriefarben. Werte referenzieren die Tokens aus index.css
 * (@theme), damit sich das Farbschema an einer Stelle steuern lässt und neue
 * Kategorien einfach ergänzt werden können.
 */
export const CATEGORY_COLORS: Record<PartCategory, CategoryColor> = {
  federgabel: { bg: 'var(--color-cat-fork-bg)', fg: 'var(--color-cat-fork-fg)' },
  daempfer: { bg: 'var(--color-cat-shock-bg)', fg: 'var(--color-cat-shock-fg)' },
  antrieb: { bg: 'var(--color-cat-drive-bg)', fg: 'var(--color-cat-drive-fg)' },
  bremsen: { bg: 'var(--color-cat-brake-bg)', fg: 'var(--color-cat-brake-fg)' },
  laufraeder: { bg: 'var(--color-cat-wheel-bg)', fg: 'var(--color-cat-wheel-fg)' },
  reifen: { bg: 'var(--color-cat-tire-bg)', fg: 'var(--color-cat-tire-fg)' },
  vorbau: { bg: 'var(--color-cat-stem-bg)', fg: 'var(--color-cat-stem-fg)' },
  lenker: { bg: 'var(--color-cat-bar-bg)', fg: 'var(--color-cat-bar-fg)' },
  griffe: { bg: 'var(--color-cat-grip-bg)', fg: 'var(--color-cat-grip-fg)' },
  sattel: { bg: 'var(--color-cat-saddle-bg)', fg: 'var(--color-cat-saddle-fg)' },
  sonstiges: { bg: 'var(--color-cat-misc-bg)', fg: 'var(--color-cat-misc-fg)' },
  // Legacy „Cockpit" erbt die neutrale Sonstiges-Farbe.
  cockpit: { bg: 'var(--color-cat-misc-bg)', fg: 'var(--color-cat-misc-fg)' },
}

export function categoryColor(value: PartCategory): CategoryColor {
  return CATEGORY_COLORS[value] ?? CATEGORY_COLORS.sonstiges
}

// Reihenfolge = Anzeigereihenfolge in der Bauteilliste.
export const CATEGORIES: CategoryMeta[] = [
  { value: 'federgabel', label: 'Federgabel', icon: MoveVertical },
  { value: 'daempfer', label: 'Dämpfer', icon: Wind },
  { value: 'antrieb', label: 'Antrieb', icon: Cog },
  { value: 'bremsen', label: 'Bremsen', icon: Disc3 },
  { value: 'laufraeder', label: 'Laufräder', icon: CircleDot },
  { value: 'reifen', label: 'Reifen', icon: Circle },
  { value: 'vorbau', label: 'Vorbau', icon: Move },
  { value: 'lenker', label: 'Lenker', icon: MoveHorizontal },
  { value: 'griffe', label: 'Griffe', icon: Grip },
  { value: 'sattel', label: 'Sattel', icon: Armchair },
  { value: 'sonstiges', label: 'Sonstiges', icon: Package },
]

const BY_VALUE = new Map(CATEGORIES.map((c) => [c.value, c]))

export function categoryMeta(value: PartCategory): CategoryMeta {
  return BY_VALUE.get(value) ?? CATEGORIES[CATEGORIES.length - 1]
}

export function categoryLabel(value: PartCategory): string {
  return categoryMeta(value).label
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
  federgabel: ['Luftdruck', 'Sag', 'Zugstufe', 'Druckstufe', 'Tokens'],
  daempfer: ['Luftdruck', 'Sag', 'Zugstufe', 'Druckstufe'],
  reifen: ['Luftdruck vorne', 'Luftdruck hinten'],
  bremsen: ['Hebelweite', 'Druckpunkt'],
  antrieb: ['Kettenlänge', 'Übersetzung'],
}
