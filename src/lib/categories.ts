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
// Farbcodes aus dem Design-System (Kategorie-Codes).
export const CATEGORIES: CategoryMeta[] = [
  { value: 'federgabel', label: 'Federgabel', icon: MoveVertical, color: '#A6D65A' },
  { value: 'daempfer', label: 'Dämpfer', icon: Wind, color: '#6FA8D6' },
  { value: 'antrieb', label: 'Antrieb', icon: Cog, color: '#D6C25A' },
  { value: 'bremsen', label: 'Bremsen', icon: Disc3, color: '#D67A5A' },
  { value: 'laufraeder', label: 'Laufräder', icon: CircleDot, color: '#8C8CD6' },
  { value: 'reifen', label: 'Reifen', icon: Circle, color: '#E0A94E' },
  { value: 'cockpit', label: 'Cockpit', icon: Move, color: '#5AD6B0' },
  { value: 'sattel', label: 'Sattel', icon: Armchair, color: '#C58BD6' },
  { value: 'sonstiges', label: 'Sonstiges', icon: Package, color: '#9A9489' },
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
