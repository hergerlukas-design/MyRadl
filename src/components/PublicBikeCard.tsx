import { Link } from 'react-router-dom'
import LikeButton from '@/components/LikeButton'
import { photoUrl } from '@/lib/storage'
import type { Bike, LikeState, Profile } from '@/types'

interface PublicBikeCardProps {
  bike: Bike
  /** Besitzerprofil für die @username-Zeile. */
  profile?: Profile | null
  likes: LikeState
  /** Eigenes Rad ⇒ Klick führt ins bearbeitbare Rad-Detail statt in die Leseansicht. */
  isOwn?: boolean
  /** Auf einer Profilseite überflüssig – dort steht der Besitzer schon im Kopf. */
  showOwner?: boolean
}

/**
 * Rad-Karte für die Community-Liste und öffentliche Profile.
 *
 * Der Titelbereich verlinkt in die Detailansicht – bei fremden Rädern die
 * schreibgeschützte Share-Ansicht aus Phase 1, beim eigenen Rad das normale
 * Rad-Detail. Username-Link und Like-Button liegen bewusst außerhalb dieses
 * Links (verschachtelte interaktive Elemente wären ungültiges Markup).
 */
export default function PublicBikeCard({
  bike,
  profile,
  likes,
  isOwn = false,
  showOwner = true,
}: PublicBikeCardProps) {
  const url = photoUrl(bike.image_url)
  const target = isOwn ? `/bikes/${bike.id}` : `/share/${bike.share_token}`
  const sub = [bike.brand, bike.model].filter(Boolean).join(' · ')

  return (
    <article className="rounded-[22px] bg-surface border border-hair overflow-hidden">
      <Link to={target} className="block text-left active:opacity-90 transition-opacity">
        <div className="relative h-[150px] photo-ph flex items-end justify-between p-4">
          {url && <img src={url} alt="" className="absolute inset-0 w-full h-full object-cover" />}
          <span className="relative font-mono text-[10px] text-dim">{url ? '' : 'radfoto'}</span>
          {bike.year && (
            <span className="relative font-mono text-[10px] font-medium tracking-[0.14em] text-accent-ink bg-accent px-2 py-1 rounded-md">
              {bike.year}
            </span>
          )}
        </div>
        <div className="px-4 pt-3.5 pb-3 flex flex-col gap-1">
          <h2 className="font-display font-extrabold text-[22px] leading-none tracking-[-0.01em] text-cream truncate">
            {bike.name}
          </h2>
          {sub && <span className="font-mono text-xs text-muted truncate">{sub}</span>}
        </div>
      </Link>

      <div className="px-4 pb-3.5 pt-1 flex items-center justify-end gap-3">
        {showOwner && profile && (
          <Link
            to={`/u/${profile.username}`}
            className="mr-auto min-w-0 flex flex-col gap-0.5 active:opacity-70 transition-opacity"
          >
            <span className="font-mono text-[11.5px] text-accent truncate">@{profile.username}</span>
            {profile.display_name && (
              <span className="text-[11.5px] text-muted truncate">{profile.display_name}</span>
            )}
          </Link>
        )}
        <LikeButton bikeId={bike.id} likes={likes} />
      </div>
    </article>
  )
}
