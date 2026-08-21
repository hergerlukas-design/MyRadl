/**
 * Zentrale Stammdaten für Impressum & Datenschutzerklärung.
 *
 * ▸ Diese Werte sind die einzige Stelle, an der Betreiberdaten gepflegt werden.
 *   Die Platzhalter unten MÜSSEN vor einem öffentlichen Launch durch die
 *   echten Angaben ersetzt werden – ein unvollständiges Impressum ist in
 *   Deutschland (§ 5 DDG) und Österreich (§ 5 ECG) abmahnfähig.
 */

export const LEGAL = {
  /** Name der natürlichen/juristischen Person, die die App betreibt. */
  operator: 'Lukas Herger',
  /** Straße + Hausnummer. TODO: echte Anschrift eintragen. */
  street: 'Musterstraße 1',
  /** PLZ + Ort. TODO: echte Anschrift eintragen. */
  city: '0000 Musterstadt',
  /** Land des Betreibersitzes – bestimmt die zuständige Aufsichtsbehörde. */
  country: 'Österreich',
  /** Kontakt für Auskunfts-, Lösch- und Widerspruchsersuchen. */
  email: 'herger.lukas@gmail.com',
  /** Optionale Telefonnummer. Leer lassen, wenn nicht gewünscht. */
  phone: '',
  /** Öffentliche Adresse der App. */
  site: 'https://myradl.fly.dev',
  /** Datum der letzten inhaltlichen Änderung dieser Texte. */
  updated: '21.08.2026',
} as const

/** Zuständige Datenschutz-Aufsichtsbehörde je nach Sitz des Betreibers. */
export const SUPERVISORY_AUTHORITY = {
  name: 'Österreichische Datenschutzbehörde',
  address: 'Barichgasse 40–42, 1030 Wien',
  url: 'https://www.dsb.gv.at',
} as const

/** Eingesetzte Dienstleister (Auftragsverarbeiter bzw. Drittempfänger). */
export const PROCESSORS = [
  {
    name: 'Supabase Inc.',
    purpose: 'Datenbank, Authentifizierung und Foto-Speicher',
    location: 'Serverstandort Frankfurt am Main (eu-central-1), Unternehmenssitz USA',
    privacy: 'https://supabase.com/privacy',
  },
  {
    name: 'Fly.io Inc.',
    purpose: 'Hosting und Auslieferung der Web-App',
    location: 'Serverstandort Frankfurt am Main (fra), Unternehmenssitz USA',
    privacy: 'https://fly.io/legal/privacy-policy/',
  },
  {
    name: 'Google Ireland Ltd.',
    purpose: 'Auslieferung der Schriftarten (Google Fonts)',
    location: 'Irland, Übermittlung in die USA möglich',
    privacy: 'https://policies.google.com/privacy',
  },
] as const
