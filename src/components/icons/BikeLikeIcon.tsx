interface BikeLikeIconProps {
  /** Eigenes Like gesetzt ⇒ befüllte Variante. */
  filled?: boolean
  size?: number
  className?: string
}

/**
 * Fahrrad-Glyphe für den Like-Button – befüllt, sobald das eigene Like sitzt.
 *
 * Bewusst als eigene, abgeschlossene Datei: die endgültige Zeichnung wird
 * nachgereicht und lässt sich hier ersetzen, ohne den Button anzufassen.
 * Erwartete Schnittstelle bleibt `{ filled, size, className }`, gezeichnet wird
 * in `currentColor`.
 */
export default function BikeLikeIcon({ filled = false, size = 18, className }: BikeLikeIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={filled ? 2 : 1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
      focusable="false"
    >
      {/* Laufräder – im gelikten Zustand ausgefüllt. */}
      <circle cx="5.5" cy="17.5" r="3.5" fill={filled ? 'currentColor' : 'none'} />
      <circle cx="18.5" cy="17.5" r="3.5" fill={filled ? 'currentColor' : 'none'} />
      {/* Sattel */}
      <circle cx="15" cy="5" r="1" fill={filled ? 'currentColor' : 'none'} />
      {/* Rahmen: Sitzrohr, Unterrohr, Oberrohr, Lenker */}
      <path d="M12 17.5V14l-3-3 4-3 2 3h2" />
    </svg>
  )
}
