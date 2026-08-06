export default function Spinner({ size = 8 }: { size?: number }) {
  return (
    <div
      className="rounded-full border-2 animate-spin"
      style={{
        width: `${size * 4}px`,
        height: `${size * 4}px`,
        borderColor: 'rgba(255,255,255,0.12)',
        borderTopColor: 'var(--color-accent)',
      }}
    />
  )
}
