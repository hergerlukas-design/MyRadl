import { useMemo, useState } from 'react'
import Layout from '@/components/Layout'
import Watermark from '@/components/Watermark'
import Spinner from '@/components/ui/Spinner'
import PublicBikeCard from '@/components/PublicBikeCard'
import { useAuth } from '@/hooks/useAuth'
import { useCommunityBikes } from '@/hooks/useCommunity'
import { useBikeLikes } from '@/hooks/useLikes'

/**
 * Community/Entdecken: alle öffentlich geteilten Räder, neueste zuerst.
 * Ohne Login erreichbar – Liken verlangt ein Konto (siehe LikeButton).
 */
export default function Community() {
  const { user } = useAuth()
  const { data: bikes, isLoading, isError } = useCommunityBikes()
  const { likesFor } = useBikeLikes(bikes.map((b) => b.id))
  const [q, setQ] = useState('')

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return bikes
    return bikes.filter((b) => {
      const hay = [
        b.name,
        b.brand ?? '',
        b.model ?? '',
        b.profile?.username ?? '',
        b.profile?.display_name ?? '',
      ]
        .join(' ')
        .toLowerCase()
      return hay.includes(needle)
    })
  }, [bikes, q])

  return (
    <Layout>
      <header className="relative overflow-hidden px-6 pt-4 pb-5 flex-none">
        <Watermark variant="top" />
        <div className="relative flex flex-col gap-1">
          <span className="eyebrow">
            COMMUNITY · {bikes.length} {bikes.length === 1 ? 'RAD' : 'RÄDER'}
          </span>
          <h1 className="font-display font-black text-[34px] leading-[1.05] tracking-[-0.02em] text-cream">
            Entdecken
          </h1>
        </div>
      </header>

      <div className="px-5 pb-4 flex-none">
        <div className="flex items-center gap-2.5 bg-surface border border-hair-strong rounded-2xl px-4 py-3">
          <span className="text-muted text-lg leading-none">⌕</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Username, Marke, Modell…"
            autoCapitalize="none"
            autoCorrect="off"
            className="flex-1 bg-transparent border-0 outline-none text-cream placeholder:text-dim text-[15px]"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : (
        <div className="flex-1 px-5 pb-6 flex flex-col gap-4">
          {isError && (
            <p className="text-sm text-danger text-center py-8">
              Die Community konnte nicht geladen werden. Versuch es später noch einmal.
            </p>
          )}

          {!isError && results.length === 0 && (
            <p className="font-mono text-xs text-muted text-center leading-relaxed py-10 px-4">
              {q.trim()
                ? 'Keine Räder gefunden.'
                : 'Noch keine öffentlichen Räder. Teile dein erstes Rad im Rad-Detail unter „Teilen".'}
            </p>
          )}

          {results.map((bike) => (
            <PublicBikeCard
              key={bike.id}
              bike={bike}
              profile={bike.profile}
              likes={likesFor(bike.id)}
              isOwn={bike.user_id === user?.id}
            />
          ))}
        </div>
      )}
    </Layout>
  )
}
