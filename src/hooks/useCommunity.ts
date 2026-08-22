import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useProfilesByIds } from '@/hooks/useProfile'
import type { Bike, PublicBike } from '@/types'

/**
 * Alle öffentlich geteilten Räder, neueste zuerst. Läuft ohne Login: die
 * `bikes_public_read`-Policy aus Migration 008 gibt genau die Räder mit
 * `visibility = 'public'` frei.
 */
function usePublicBikeRows() {
  return useQuery({
    queryKey: ['community', 'bikes', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bikes')
        .select('*')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Bike[]
    },
  })
}

/**
 * Community-Feed: öffentliche Räder von Usern, die ein Profil haben, samt
 * Profil des Besitzers.
 *
 * `bikes` und `profiles` hängen beide an `auth.users` und haben untereinander
 * keinen Fremdschlüssel – PostgREST kann sie deshalb nicht einbetten, also
 * werden die Profile in einer zweiten Abfrage geholt und hier zusammengeführt.
 *
 * Dass Räder ohne Besitzerprofil herausfallen, ist Absicht: ein Rad aus Phase 1
 * wurde für einen *Link* freigegeben, nicht für eine durchstöberbare Liste. Wer
 * noch kein Profil angelegt hat, taucht hier nicht auf; sein Share-Link
 * funktioniert unverändert weiter. Ab Phase 2 verlangt der Teilen-Schalter
 * ohnehin einen Username, bevor ein Rad öffentlich wird.
 */
export function useCommunityBikes() {
  const bikesQuery = usePublicBikeRows()
  const bikes = bikesQuery.data
  const profilesQuery = useProfilesByIds((bikes ?? []).map((b) => b.user_id))

  const byUser = new Map((profilesQuery.data ?? []).map((p) => [p.id, p]))
  const data: PublicBike[] = (bikes ?? [])
    .map((b) => ({ ...b, profile: byUser.get(b.user_id) ?? null }))
    .filter((b): b is PublicBike => b.profile != null)

  return {
    data,
    isLoading: bikesQuery.isLoading || (!!bikes?.length && profilesQuery.isLoading),
    isError: bikesQuery.isError,
  }
}

/** Öffentliche Räder eines einzelnen Users (Profilseite `/u/:username`). */
export function usePublicBikesOfUser(userId: string | null | undefined) {
  return useQuery({
    queryKey: ['community', 'bikes', 'user', userId ?? null],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bikes')
        .select('*')
        .eq('visibility', 'public')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Bike[]
    },
    enabled: !!userId,
  })
}
