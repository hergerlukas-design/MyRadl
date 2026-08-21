/**
 * Zentrale Stammdaten für Impressum & Datenschutzerklärung.
 *
 * ▸ Diese Werte sind die einzige Stelle, an der Betreiberdaten gepflegt werden.
 *   Sitz des Betreibers ist München – daraus folgen die deutschen
 *   Rechtsgrundlagen (§ 5 DDG, BDSG, § 25 TDDDG) in den Texten sowie das
 *   BayLDA als zuständige Aufsichtsbehörde. Bei einem Umzug in ein anderes
 *   Bundesland ist `SUPERVISORY_AUTHORITY` anzupassen.
 */

export const LEGAL = {
  /** Name der natürlichen/juristischen Person, die die App betreibt. */
  operator: 'Lukas Herger',
  /** Straße + Hausnummer. */
  street: 'Passauerstraße 26',
  /** PLZ + Ort. */
  city: '81369 München',
  /** Land des Betreibersitzes – bestimmt die zuständige Aufsichtsbehörde. */
  country: 'Deutschland',
  /** Kontakt für Auskunfts-, Lösch- und Widerspruchsersuchen. */
  email: 'herger.lukas@gmail.com',
  /** Optionale Telefonnummer. Leer lassen, wenn nicht gewünscht. */
  phone: '',
  /** Öffentliche Adresse der App. */
  site: 'https://myradl.fly.dev',
  /** Datum der letzten inhaltlichen Änderung dieser Texte. */
  updated: '21.08.2026',
} as const

/**
 * Zuständige Datenschutz-Aufsichtsbehörde. Für nicht-öffentliche Stellen in
 * Bayern (Sitz München) ist das BayLDA in Ansbach zuständig – nicht der
 * Bayerische Landesbeauftragte für den Datenschutz, der nur öffentliche
 * Stellen betreut.
 */
export const SUPERVISORY_AUTHORITY = {
  name: 'Bayerisches Landesamt für Datenschutzaufsicht (BayLDA)',
  address: 'Promenade 27, 91522 Ansbach',
  url: 'https://www.lda.bayern.de',
} as const

/**
 * Eingesetzte Dienstleister (Auftragsverarbeiter bzw. Drittempfänger).
 *
 * Bewusst kurz: Schriftarten werden seit v0.6.0 selbst ausgeliefert
 * (src/fonts.css), es gibt daher keinen Google-Fonts-Empfänger mehr.
 */
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
] as const
