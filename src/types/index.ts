export type PartCategory =
  | 'federgabel'
  | 'daempfer'
  | 'antrieb'
  | 'bremsen'
  | 'laufraeder'
  | 'reifen'
  | 'vorbau'
  | 'lenker'
  | 'griffe'
  | 'sattel'
  | 'sonstiges'
  // Legacy-Wert (nicht mehr zur Auswahl): früher „Cockpit".
  | 'cockpit'

export type PartStatus = 'aktiv' | 'ersetzt'

export type HistoryEventType = 'eingebaut' | 'gewartet' | 'ersetzt'

export interface Bike {
  id: string
  user_id: string
  name: string
  brand: string | null
  model: string | null
  year: number | null
  image_url: string | null
  created_at: string
}

export interface Part {
  id: string
  bike_id: string
  category: PartCategory
  brand: string
  model: string | null
  variant: string | null
  /** Einbauposition bei Reifen/Laufrädern: 'vorne' | 'hinten' | null. */
  position: string | null
  /** Freie Bezeichnung bei Kategorie „Sonstiges". */
  custom_type: string | null
  status: PartStatus
  install_date: string | null
  image_url: string | null
  notes: string | null
  /** User-defined display order within the bike (drag-to-reorder). */
  sort_order: number | null
  created_at: string
}

export interface BikeGeometry {
  bike_id: string
  frame_size: string | null
  seat_tube_length: number | null
  top_tube_length: number | null
  head_angle: number | null
  seat_angle: number | null
  head_tube_length: number | null
  chainstay_length: number | null
  wheelbase: number | null
  bb_drop: number | null
  standover_height: number | null
  reach: number | null
  stack: number | null
  updated_at: string
}

/** Die numerischen Messwert-Felder der Geometrie (ohne Metaspalten & Rahmengröße). */
export type GeometryField = Exclude<
  keyof BikeGeometry,
  'bike_id' | 'updated_at' | 'frame_size'
>

export interface PartLink {
  id: string
  part_id: string
  label: string
  url: string
}

export interface PartSetting {
  id: string
  part_id: string
  key: string
  value: string
  unit: string | null
  updated_at: string
}

export interface PartHistory {
  id: string
  part_id: string
  event_type: HistoryEventType
  event_date: string
  note: string | null
  created_at: string
}
