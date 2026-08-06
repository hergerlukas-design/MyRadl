import {
  MoveVertical,
  Wind,
  Cog,
  Disc3,
  CircleDot,
  Circle,
  Move,
  Armchair,
  Package,
  type LucideIcon,
} from 'lucide-react'
import type { PartCategory } from '@/types'

export interface CategoryMeta {
  value: PartCategory
  label: string
  icon: LucideIcon
  /** Fixed color code — stays identical across list, detail and search. */
  color: string
}

// Reihenfolge = Anzeigereihenfolge in der Bauteilliste.
// Farbcodes aus dem Design-System (Kategorie-Codes) — als CSS-Variablen, damit
// sie zwischen Dark- und Light-Theme automatisch wechseln (siehe index.css).
export const CATEGORIES: CategoryMeta[] = [
  { value: 'federgabel', label: 'Federgabel', icon: MoveVertical, color: 'var(--cat-federgabel)' },
  { value: 'daempfer', label: 'Dämpfer', icon: Wind, color: 'var(--cat-daempfer)' },
  { value: 'antrieb', label: 'Antrieb', icon: Cog, color: 'var(--cat-antrieb)' },
  { value: 'bremsen', label: 'Bremsen', icon: Disc3, color: 'var(--cat-bremsen)' },
  { value: 'laufraeder', label: 'Laufräder', icon: CircleDot, color: 'var(--cat-laufraeder)' },
  { value: 'reifen', label: 'Reifen', icon: Circle, color: 'var(--cat-reifen)' },
  { value: 'cockpit', label: 'Cockpit', icon: Move, color: 'var(--cat-cockpit)' },
  { value: 'sattel', label: 'Sattel', icon: Armchair, color: 'var(--cat-sattel)' },
  { value: 'sonstiges', label: 'Sonstiges', icon: Package, color: 'var(--cat-sonstiges)' },
]

const BY_VALUE = new Map(CATEGORIES.map((c) => [c.value, c]))

export function categoryMeta(value: PartCategory): CategoryMeta {
  return BY_VALUE.get(value) ?? CATEGORIES[CATEGORIES.length - 1]
}

export function categoryLabel(value: PartCategory): string {
  return categoryMeta(value).label
}

export function categoryColor(value: PartCategory): string {
  return categoryMeta(value).color
}

/** Häufige Einstell-Vorschläge je Kategorie (nur UI-Hilfe, frei überschreibbar). */
export const SETTING_SUGGESTIONS: Partial<Record<PartCategory, string[]>> = {
  federgabel: ['Luftdruck', 'Sag', 'Zugstufe', 'Druckstufe', 'Tokens'],
  daempfer: ['Luftdruck', 'Sag', 'Zugstufe', 'Druckstufe'],
  reifen: ['Luftdruck vorne', 'Luftdruck hinten'],
  bremsen: ['Hebelweite', 'Druckpunkt'],
  antrieb: ['Kettenlänge', 'Übersetzung'],
}
