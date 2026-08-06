import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { BikeGeometry } from '@/types'

/** Geometrie eines Rads (kann noch nicht existieren → null). */
export function useBikeGeometry(bikeId: string) {
  return useQuery({
    queryKey: ['bike_geometry', bikeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bike_geometry')
        .select('*')
        .eq('bike_id', bikeId)
        .maybeSingle()
      if (error) throw error
      return (data as BikeGeometry | null) ?? null
    },
    enabled: !!bikeId,
  })
}

export function useUpsertBikeGeometry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (row: Partial<BikeGeometry> & { bike_id: string }) => {
      const payload = { ...row, updated_at: new Date().toISOString() }
      const { data, error } = await supabase
        .from('bike_geometry')
        .upsert(payload, { onConflict: 'bike_id' })
        .select()
        .single()
      if (error) throw error
      return data as BikeGeometry
    },
    onSuccess: (g) => {
      qc.invalidateQueries({ queryKey: ['bike_geometry', g.bike_id] })
      qc.setQueryData(['bike_geometry', g.bike_id], g)
    },
  })
}
