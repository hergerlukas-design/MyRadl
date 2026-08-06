import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Bike, Part } from '@/types'

/** All parts for a bike. */
export function useParts(bikeId: string) {
  return useQuery({
    queryKey: ['parts', 'bike', bikeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parts')
        .select('*')
        .eq('bike_id', bikeId)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as Part[]
    },
    enabled: !!bikeId,
  })
}

export function usePart(id: string) {
  return useQuery({
    queryKey: ['parts', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('parts').select('*').eq('id', id).single()
      if (error) throw error
      return data as Part
    },
    enabled: !!id,
  })
}

/**
 * All of the user's parts joined with light bike info, for the global search /
 * filter screen. RLS scopes this to the user's own rows.
 */
export interface PartWithBike extends Part {
  bike: Pick<Bike, 'id' | 'name'> | null
}

export function useAllParts() {
  return useQuery({
    queryKey: ['parts', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parts')
        .select('*, bike:bikes(id, name)')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as PartWithBike[]
    },
  })
}

export function useCreatePart() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (patch: Partial<Part> & { bike_id: string; category: Part['category'] }) => {
      const { data, error } = await supabase.from('parts').insert(patch).select().single()
      if (error) throw error
      return data as Part
    },
    onSuccess: (p) => {
      qc.invalidateQueries({ queryKey: ['parts'] })
      qc.setQueryData(['parts', p.id], p)
    },
  })
}

export function useUpdatePart() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Part> }) => {
      const { data, error } = await supabase
        .from('parts')
        .update(patch)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Part
    },
    onSuccess: (p) => {
      qc.invalidateQueries({ queryKey: ['parts'] })
      qc.setQueryData(['parts', p.id], p)
    },
  })
}

export function useDeletePart() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('parts').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['parts'] }),
  })
}

/**
 * Persist a user-defined order for a bike's parts. Writes sort_order = index
 * for each id in `orderedIds`. Optimistically updates the cached bike list so
 * the new order sticks instantly.
 */
export function useReorderParts() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ orderedIds }: { bikeId: string; orderedIds: string[] }) => {
      const results = await Promise.all(
        orderedIds.map((id, index) =>
          supabase.from('parts').update({ sort_order: index }).eq('id', id),
        ),
      )
      const failed = results.find((r) => r.error)
      if (failed?.error) throw failed.error
    },
    onMutate: async ({ bikeId, orderedIds }) => {
      const key = ['parts', 'bike', bikeId]
      await qc.cancelQueries({ queryKey: key })
      const previous = qc.getQueryData<Part[]>(key)
      qc.setQueryData<Part[]>(key, (old) =>
        old?.map((p) => {
          const idx = orderedIds.indexOf(p.id)
          return idx === -1 ? p : { ...p, sort_order: idx }
        }),
      )
      return { previous, bikeId }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(['parts', 'bike', ctx.bikeId], ctx.previous)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['parts'] }),
  })
}
