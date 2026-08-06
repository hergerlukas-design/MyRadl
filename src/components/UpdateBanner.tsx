import { RefreshCw } from 'lucide-react'

interface UpdateBannerProps {
  onUpdate: () => void
}

export default function UpdateBanner({ onUpdate }: UpdateBannerProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-accent text-accent-ink px-4 py-2.5 flex items-center justify-between gap-3 shadow-lg max-w-md mx-auto">
      <span className="text-sm font-semibold">Neue Version verfügbar</span>
      <button
        onClick={onUpdate}
        className="flex items-center gap-1.5 bg-ink text-cream text-sm font-semibold px-3 py-1 rounded-lg active:scale-95 transition-transform"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Aktualisieren
      </button>
    </div>
  )
}
