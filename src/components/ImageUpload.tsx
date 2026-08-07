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
  /**
   * Standardbild, das angezeigt wird, solange `value` leer ist (z. B. das
   * Blueprint-Bild der Kategorie). Der Nutzer kann trotzdem ein eigenes Foto
   * hinzufügen; entfernt werden kann nur ein echtes, hochgeladenes Foto.
   */
  fallbackUrl?: string | null
}

export default function ImageUpload({
  value,
  onUpload,
  onRemove,
  aspect = 'video',
  label = 'Foto',
  fallbackUrl = null,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Eigenes Foto hat Vorrang; sonst das Standardbild der Kategorie.
  const isFallback = !value && !!fallbackUrl
  const url = photoUrl(value) ?? fallbackUrl

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
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      {url ? (
        // Mit Foto: volles Seitenverhältnis anzeigen.
        <div className={`relative ${ratio} w-full rounded-2xl overflow-hidden border border-hair`}>
          <img src={url} alt={label} className="w-full h-full object-cover" />
          {busy && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="animate-spin text-accent" size={28} />
            </div>
          )}
          {!busy && (
            <div className="absolute bottom-2 right-2 flex gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="bg-ink/80 text-cream rounded-full p-2 border border-hair-strong"
                aria-label="Foto ändern"
              >
                <Camera size={16} />
              </button>
              {onRemove && !isFallback && (
                <button
                  type="button"
                  onClick={handleRemove}
                  className="bg-ink/80 rounded-full p-2 border border-hair-strong text-danger"
                  aria-label="Foto entfernen"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        // Ohne Foto: schlanke Schaltfläche statt großer leerer Fläche.
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-hair-dashed text-muted active:scale-[0.99] transition-transform disabled:opacity-60"
        >
          {busy ? <Loader2 className="animate-spin text-accent" size={16} /> : <Camera size={16} />}
          <span className="font-mono text-[11px] tracking-[0.14em]">
            {busy ? 'LÄDT…' : `+ ${label.toUpperCase()}`}
          </span>
        </button>
      )}

      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  )
}
