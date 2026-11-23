import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Bike } from '@/types'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Rad zu einem öffentlichen Share-Token. Läuft bewusst ohne Login: RLS gibt
 * über die `*_public_read`-Policies ausschließlich Räder mit
 * `visibility = 'public'` frei. Ein unbekannter, entwerteter oder wieder auf
 * privat gestellter Token liefert `null`.
 */
export function useSharedBike(shareToken: string) {
  return useQuery({
    queryKey: ['shared_bike', shareToken],
    queryFn: async () => {
      // Kein gültiger Token ⇒ gar nicht erst anfragen (Postgres würde bei einem
      // nicht-UUID-Wert mit einem Cast-Fehler antworten statt „nicht gefunden").
      if (!UUID_RE.test(shareToken)) return null
      const { data, error } = await supabase
        .from('bikes')
        .select('*')
        .eq('share_token', shareToken)
        .eq('visibility', 'public')
        .maybeSingle()
      if (error) throw error
      return (data as Bike | null) ?? null
    },
    enabled: !!shareToken,
    retry: false,
  })
}
