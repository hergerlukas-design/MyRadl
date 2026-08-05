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
}

// Reihenfolge = Anzeigereihenfolge in der Bauteilliste.
export const CATEGORIES: CategoryMeta[] = [
  { value: 'federgabel', label: 'Federgabel', icon: MoveVertical },
  { value: 'daempfer', label: 'Dämpfer', icon: Wind },
  { value: 'antrieb', label: 'Antrieb', icon: Cog },
  { value: 'bremsen', label: 'Bremsen', icon: Disc3 },
  { value: 'laufraeder', label: 'Laufräder', icon: CircleDot },
  { value: 'reifen', label: 'Reifen', icon: Circle },
  { value: 'cockpit', label: 'Cockpit', icon: Move },
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

/** Häufige Einstell-Vorschläge je Kategorie (nur UI-Hilfe, frei überschreibbar). */
export const SETTING_SUGGESTIONS: Partial<Record<PartCategory, string[]>> = {
  federgabel: ['Luftdruck', 'Sag', 'Zugstufe', 'Druckstufe', 'Tokens'],
  daempfer: ['Luftdruck', 'Sag', 'Zugstufe', 'Druckstufe'],
  reifen: ['Luftdruck vorne', 'Luftdruck hinten'],
  bremsen: ['Hebelweite', 'Druckpunkt'],
  antrieb: ['Kettenlänge', 'Übersetzung'],
}
