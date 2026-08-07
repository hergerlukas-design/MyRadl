import type { PartCategory } from '@/types'

// Standard-Blueprintbilder je Kategorie. Sie dienen als Fallback, solange ein
// Teil kein eigenes Foto hat – so ist jedes Bauteil sofort visuell erkennbar.
// Griffe, Sonstiges und der Legacy-Wert „Cockpit" haben bewusst kein Standardbild.
import federgabel from '@/assets/categories/federgabel.webp'
import daempfer from '@/assets/categories/daempfer.webp'
import antrieb from '@/assets/categories/antrieb.webp'
import bremsen from '@/assets/categories/bremsen.webp'
import laufraeder from '@/assets/categories/laufraeder.webp'
import reifen from '@/assets/categories/reifen.webp'
import vorbau from '@/assets/categories/vorbau.webp'
import lenker from '@/assets/categories/lenker.webp'
import sattel from '@/assets/categories/sattel.webp'
import sattelstuetze from '@/assets/categories/sattelstuetze.webp'

const CATEGORY_IMAGES: Partial<Record<PartCategory, string>> = {
  federgabel,
  daempfer,
  antrieb,
  bremsen,
  laufraeder,
  reifen,
  vorbau,
  lenker,
  sattel,
  sattelstuetze,
}

/**
 * Standardbild (Blueprint-Zeichnung) einer Kategorie oder null, wenn keines
 * hinterlegt ist. Wird als Fallback genutzt, wenn ein Teil kein eigenes Foto hat.
 */
export function categoryImage(category: PartCategory): string | null {
  return CATEGORY_IMAGES[category] ?? null
}
