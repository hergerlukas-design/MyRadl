import { Link, useParams } from 'react-router-dom'
import Layout from '@/components/Layout'
import Watermark from '@/components/Watermark'
import Spinner from '@/components/ui/Spinner'
import PublicBikeCard from '@/components/PublicBikeCard'
import { useAuth } from '@/hooks/useAuth'
import { useProfileByUsername } from '@/hooks/useProfile'
import { usePublicBikesOfUser } from '@/hooks/useCommunity'
import { useBikeLikes } from '@/hooks/useLikes'

/**
 * Öffentliches Profil (`/u/:username`) mit allen öffentlich geteilten Rädern
 * dieses Users. Kein Login nötig – die RLS-Policies geben Profile komplett und
 * Räder nur mit `visibility = 'public'` frei.
 */
export default function PublicProfile() {
  const { username = '' } = useParams()
  const { user } = useAuth()
  const { data: profile, isLoading: profileLoading } = useProfileByUsername(username)
  const { data: bikes, isLoading: bikesLoading } = usePublicBikesOfUser(profile?.id)
  const { likesFor } = useBikeLikes((bikes ?? []).map((b) => b.id))

  if (profileLoading) {
    return (
      <Layout>
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      </Layout>
    )
  }

  if (!profile) return <UnknownProfile username={username} />

  const count = bikes?.length ?? 0
  const initials = (profile.display_name ?? profile.username).slice(0, 2).toUpperCase()
  const isMe = profile.id === user?.id

  return (
    <Layout>
      <header className="relative overflow-hidden border-b border-hair flex-none">
        <Watermark variant="bottom" />
        <div className="relative px-5 pt-5 pb-5 flex items-center gap-4">
          <div className="w-[58px] h-[58px] flex-none rounded-full bg-accent/15 border border-accent/35 flex items-center justify-center font-display font-semibold text-[18px] text-accent">
            {initials}
          </div>
          <div className="min-w-0 flex flex-col gap-1">
            <span className="eyebrow">
              PROFIL · {count} {count === 1 ? 'RAD' : 'RÄDER'}
            </span>
            <h1 className="font-display font-black text-[30px] leading-none tracking-[-0.02em] text-cream truncate">
              {profile.display_name || `@${profile.username}`}
            </h1>
            {profile.display_name && (
              <span className="font-mono text-[13px] text-muted truncate">@{profile.username}</span>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 px-5 py-5 flex flex-col gap-4">
        {bikesLoading ? (
          <div className="flex justify-center py-14">
            <Spinner />
          </div>
        ) : count === 0 ? (
          <p className="font-mono text-xs text-muted text-center leading-relaxed py-12 px-4">
            {isMe
              ? 'Du teilst noch kein Rad öffentlich. Den Schalter dafür findest du im Rad-Detail unter „Teilen".'
              : 'Dieser Nutzer teilt aktuell kein Rad öffentlich.'}
          </p>
        ) : (
          bikes!.map((bike) => (
            <PublicBikeCard
              key={bike.id}
              bike={bike}
              likes={likesFor(bike.id)}
              isOwn={isMe}
              showOwner={false}
            />
          ))
        )}

        <div className="mt-2 border-t border-hair pt-5 text-center">
          <Link to="/community" className="text-sm font-semibold text-accent">
            Mehr Räder in der Community
          </Link>
        </div>
      </div>
    </Layout>
  )
}

/** Hinweis, wenn es zu einem Username kein Profil gibt. */
function UnknownProfile({ username }: { username: string }) {
  return (
    <Layout>
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8 text-center py-20">
        <h1 className="font-display font-black text-[28px] leading-tight tracking-[-0.02em] text-cream">
          Profil nicht gefunden
        </h1>
        <p className="text-sm text-cream-dim leading-relaxed">
          Zu <span className="font-mono text-cream">@{username}</span> gibt es kein Profil. Vielleicht
          wurde der Username geändert oder vertippt.
        </p>
        <Link
          to="/community"
          className="mt-2 px-5 py-3 rounded-xl bg-accent text-accent-ink text-sm font-semibold"
        >
          Zur Community
        </Link>
      </div>
    </Layout>
  )
}
