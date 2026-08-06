import { useRef, useState } from 'react'
import { Camera, Loader2, X } from 'lucide-react'
import { photoUrl } from '@/lib/storage'

interface ImageUploadProps {
  /** Current stored Storage path (or null). */
  value: string | null
  /** Uploads the file and returns the new stored path. */
  onUpload: (file: File) => Promise<string>
  onRemove?: () => Promise<void> | void
  /** Aspect: 'video' (16/9, bikes) or 'square' (parts). */
  aspect?: 'video' | 'square'
  label?: string
}

export default function ImageUpload({
  value,
  onUpload,
  onRemove,
  aspect = 'video',
  label = 'Foto',
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const url = photoUrl(value)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError(null)
    setBusy(true)
    try {
      await onUpload(file)
    } catch (err) {
      setError((err as Error)?.message ?? 'Upload fehlgeschlagen')
    } finally {
      setBusy(false)
    }
  }

  async function handleRemove() {
    if (!onRemove) return
    setBusy(true)
    try {
      await onRemove()
    } finally {
      setBusy(false)
    }
  }

  const ratio = aspect === 'square' ? 'aspect-square' : 'aspect-video'

  return (
    <div>
      {/* Ohne `capture` bietet der native Dialog Kamera UND Fotogalerie zur Auswahl. */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
      <div
        className={`relative ${ratio} w-full rounded-2xl overflow-hidden border border-dashed border-[var(--color-border-subtle)] bg-[var(--color-surface)] flex items-center justify-center`}
      >
        {url ? (
          <img src={url} alt={label} className="w-full h-full object-cover" />
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex flex-col items-center gap-1 text-[var(--color-text-muted)]"
          >
            <Camera size={28} />
            <span className="text-xs font-medium">{label} hinzufügen</span>
          </button>
        )}

        {busy && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <Loader2 className="animate-spin text-white" size={28} />
          </div>
        )}

        {url && !busy && (
          <div className="absolute bottom-2 right-2 flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="bg-white/90 rounded-full p-2 shadow"
              aria-label="Foto ändern"
            >
              <Camera size={16} />
            </button>
            {onRemove && (
              <button
                type="button"
                onClick={handleRemove}
                className="bg-white/90 rounded-full p-2 shadow text-red-600"
                aria-label="Foto entfernen"
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
