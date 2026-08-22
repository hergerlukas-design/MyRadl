import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Modal from '@/components/ui/Modal'
import BikeLikeIcon from '@/components/icons/BikeLikeIcon'
import { useAuth } from '@/hooks/useAuth'
import { useToggleLike } from '@/hooks/useLikes'
import type { LikeState } from '@/types'

interface LikeButtonProps {
  bikeId: string
  likes: LikeState
  /** `lg` für das Rad-Detail, `sm` (Standard) für Karten in Listen. */
  size?: 'sm' | 'lg'
  className?: string
}

/**
 * Fahrrad-Icon mit Like-Zahl. Eingeloggt togglet der Klick das eigene Like;
 * ausgeloggt bleibt der Button sichtbar und führt zur Login-Aufforderung.
 *
 * Liegt der Button in einer klickbaren Karte, stoppt er die Weitergabe des
 * Klicks, damit nicht gleichzeitig navigiert wird.
 */
export default function LikeButton({ bikeId, likes, size = 'sm', className = '' }: LikeButtonProps) {
  const navigate = useNavigate()
  const { session } = useAuth()
  const toggleLike = useToggleLike()
  const [askLogin, setAskLogin] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const big = size === 'lg'
  const { count, likedByMe } = likes

  async function handleClick(e: React.MouseEvent) {
    e.stopPropagation()
    e.preventDefault()
    setError(null)
    if (!session) {
      setAskLogin(true)
      return
    }
    try {
      await toggleLike.mutateAsync({ bikeId, liked: likedByMe })
    } catch (err) {
      setError((err as Error)?.message ?? 'Konnte das Like nicht speichern.')
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={toggleLike.isPending}
        aria-pressed={likedByMe}
        aria-label={likedByMe ? 'Like entfernen' : 'Rad liken'}
        title={error ?? undefined}
        className={`flex-none inline-flex items-center gap-1.5 rounded-full border transition-colors active:scale-95 disabled:opacity-60 ${
          big ? 'px-3.5 py-2' : 'px-2.5 py-1.5'
        } ${className}`}
        style={{
          background: likedByMe ? 'color-mix(in srgb, var(--color-accent) 15%, transparent)' : 'transparent',
          borderColor: likedByMe ? 'var(--color-accent)' : 'var(--c-hair-strong)',
          color: likedByMe ? 'var(--color-accent)' : 'var(--color-muted)',
        }}
      >
        <BikeLikeIcon filled={likedByMe} size={big ? 20 : 17} />
        <span className={`font-mono font-medium tabular-nums ${big ? 'text-[13px]' : 'text-[11.5px]'}`}>
          {count}
        </span>
      </button>

      {askLogin && (
        <Modal
          title="Zum Liken anmelden"
          onClose={() => setAskLogin(false)}
          footer={
            <div className="flex gap-3">
              <button
                onClick={() => setAskLogin(false)}
                className="flex-1 py-3.5 rounded-xl bg-surface-2 text-cream font-semibold"
              >
                Später
              </button>
              <button
                onClick={() => navigate('/login')}
                className="flex-1 py-3.5 rounded-xl bg-accent text-accent-ink font-semibold"
              >
                Anmelden
              </button>
            </div>
          }
        >
          <p className="text-sm text-cream-dim leading-relaxed">
            Likes brauchen ein MyRadl-Konto. Melde dich an oder registriere dich – danach kannst du Räder
            aus der Community liken.
          </p>
        </Modal>
      )}
    </>
  )
}
