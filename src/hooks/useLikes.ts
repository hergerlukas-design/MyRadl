import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { LikeState } from '@/types'

/** Leerer Zustand, solange (oder falls) für ein Rad keine Likes geladen sind. */
export const NO_LIKES: LikeState = { count: 0, likedByMe: false }

type LikeRow = { bike_id: string; user_id: string }

/**
 * Like-Zahlen für eine Menge von Rädern, plus das Flag „von mir geliked".
 *
 * Die Aggregation passiert bewusst im Client: `bike_likes` ist öffentlich
 * lesbar und liefert nur UUID-Paare, die Listen hier sind ein Bildschirm groß.
 * Das spart eine View bzw. RPC und hält die RLS-Fläche klein.
 */
export function useBikeLikes(bikeIds: string[]) {
  const { user } = useAuth()
  const ids = Array.from(new Set(bikeIds)).sort()

  const query = useQuery({
    queryKey: ['bike_likes', ids.join(',')],
    queryFn: async () => {
      if (ids.length === 0) return [] as LikeRow[]
      const { data, error } = await supabase
        .from('bike_likes')
        .select('bike_id, user_id')
        .in('bike_id', ids)
      if (error) throw error
      return data as LikeRow[]
    },
    enabled: ids.length > 0,
  })

  const byBike = new Map<string, LikeState>()
  for (const id of ids) byBike.set(id, { count: 0, likedByMe: false })
  for (const row of query.data ?? []) {
    const state = byBike.get(row.bike_id)
    if (!state) continue
    state.count += 1
    if (user && row.user_id === user.id) state.likedByMe = true
  }

  return {
    ...query,
    /** Like-Zustand eines Rads; nie `undefined`. */
    likesFor: (bikeId: string): LikeState => byBike.get(bikeId) ?? NO_LIKES,
  }
}

/** Like-Zustand eines einzelnen Rads (Rad-Detail). */
export function useBikeLike(bikeId: string) {
  const { likesFor, ...rest } = useBikeLikes(bikeId ? [bikeId] : [])
  return { ...rest, likes: likesFor(bikeId) }
}

/**
 * Setzt oder entfernt das eigene Like. Nur eingeloggt möglich – die
 * RLS-Policies lassen ausschließlich Zeilen mit `user_id = auth.uid()` zu.
 */
export function useToggleLike() {
  const qc = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async ({ bikeId, liked }: { bikeId: string; liked: boolean }) => {
      if (!user) throw new Error('Nicht eingeloggt')
      if (liked) {
        const { error } = await supabase
          .from('bike_likes')
          .delete()
          .eq('bike_id', bikeId)
          .eq('user_id', user.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('bike_likes')
          .insert({ bike_id: bikeId, user_id: user.id })
        // 23505 = unique_violation: in einem anderen Tab bereits geliked –
        // das Ergebnis stimmt trotzdem, also nicht als Fehler behandeln.
        if (error && error.code !== '23505') throw error
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bike_likes'] }),
  })
}
