export default function Spinner({ size = 8 }: { size?: number }) {
  return (
    <div
      className="rounded-full border-2 border-gray-200 border-t-primary animate-spin"
      style={{ width: `${size * 4}px`, height: `${size * 4}px` }}
    />
  )
}
