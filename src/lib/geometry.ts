import type { GeometryField } from '@/types'

export interface GeometryFieldMeta {
  key: GeometryField
  label: string
  unit: string
  /** Kurzbeschreibung / Einfluss auf das Fahrverhalten. */
  hint: string
  /** Reach & Stack: die wichtigsten, herstellerübergreifend vergleichbaren Werte. */
  primary?: boolean
}

// Reihenfolge = Anzeige- und Eingabereihenfolge.
export const GEOMETRY_FIELDS: GeometryFieldMeta[] = [
  {
    key: 'reach',
    label: 'Reach',
    unit: 'mm',
    hint: 'Tretlagermitte bis Steuerrohr-Oberkante (horizontal). Länger = stabiler/gestreckter, kürzer = wendiger.',
    primary: true,
  },
  {
    key: 'stack',
    label: 'Stack',
    unit: 'mm',
    hint: 'Tretlagermitte bis Steuerrohr-Oberkante (vertikal). Hoch = aufrecht/komfortabel, niedrig = sportlich.',
    primary: true,
  },
  {
    key: 'seat_tube_length',
    label: 'Sitzrohrlänge',
    unit: 'mm',
    hint: 'Tretlagermitte bis Oberkante Sitzrohr. Wegen Vario-Stützen heute weniger relevant für die Rahmengröße.',
  },
  {
    key: 'top_tube_length',
    label: 'Oberrohrlänge (horizontal)',
    unit: 'mm',
    hint: 'Steuerrohroberkante bis Sitzrohrmitte. Beeinflusst die Sitzposition (gestreckt vs. kompakt).',
  },
  {
    key: 'head_angle',
    label: 'Steuerwinkel (Lenkwinkel)',
    unit: '°',
    hint: 'Flacher = laufruhiger/stabiler, steiler = wendiger/direkter.',
  },
  {
    key: 'seat_angle',
    label: 'Sitzwinkel',
    unit: '°',
    hint: 'Steiler = bessere Kraftübertragung bergauf, flacher = entspannter im flachen Gelände.',
  },
  {
    key: 'head_tube_length',
    label: 'Steuerrohrlänge',
    unit: 'mm',
    hint: 'Bestimmt direkt den Stack: länger = höherer Stack/aufrechter, kürzer = niedriger/gestreckter.',
  },
  {
    key: 'chainstay_length',
    label: 'Kettenstrebenlänge',
    unit: 'mm',
    hint: 'Tretlagermitte bis hinteres Ausfallende. Lang = laufruhig/Kletter-Performance, kurz = agil/verspielt.',
  },
  {
    key: 'wheelbase',
    label: 'Radstand',
    unit: 'mm',
    hint: 'Abstand Vorder-/Hinterradachse. Kurz = agil, lang = laufruhig.',
  },
  {
    key: 'bb_drop',
    label: 'Tretlagerabsenkung',
    unit: 'mm',
    hint: 'Größer = niedrigerer Schwerpunkt/agiler, aber weniger Kurvenschräglage möglich.',
  },
  {
    key: 'standover_height',
    label: 'Überstandshöhe',
    unit: 'mm',
    hint: 'Bewegungsfreiheit zwischen Fahrer und Rahmen, relevant beim Absteigen.',
  },
]

/** Wert für die Anzeige formatieren (ohne unnötige Nachkommastellen). */
export function formatGeometryValue(value: number | null | undefined, unit: string): string {
  if (value === null || value === undefined) return '–'
  return `${Number(value)} ${unit}`.trim()
}
