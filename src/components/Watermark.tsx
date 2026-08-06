/**
 * Eiger topographic sketch used as a faint watermark behind screen headers.
 * `variant` places it like the design: top-right on list screens, bottom-left
 * on detail headers.
 */
export default function Watermark({ variant = 'top' }: { variant?: 'top' | 'bottom' }) {
  const style =
    variant === 'top'
      ? { right: '-40px', top: '6px', width: '340px' }
      : { left: '-20px', bottom: '-30px', width: '430px' }
  return (
    <img
      src="/eiger.png"
      alt=""
      aria-hidden
      className="pointer-events-none absolute select-none"
      style={{ ...style, opacity: 'var(--wm-opacity)', filter: 'var(--wm-filter)' }}
    />
  )
}
