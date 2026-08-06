export default function Spinner({ size = 8 }: { size?: number }) {
  return (
    <div
      className="rounded-full border-2 animate-spin"
      style={{
        width: `${size * 4}px`,
        height: `${size * 4}px`,
        borderColor: 'var(--c-track)',
        borderTopColor: 'var(--color-accent)',
      }}
    />
  )
}
