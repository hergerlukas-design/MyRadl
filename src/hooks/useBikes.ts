import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { Bike } from '@/types'

export function useBikes() {
  return useQuery({
    queryKey: ['bikes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bikes')
        .select('*')
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as Bike[]
    },
  })
}

export function useBike(id: string) {
  return useQuery({
    queryKey: ['bikes', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('bikes').select('*').eq('id', id).single()
      if (error) throw error
      return data as Bike
    },
    enabled: !!id,
  })
}

export function useCreateBike() {
  const qc = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async (patch: Partial<Bike>) => {
      if (!user) throw new Error('Nicht eingeloggt')
      const { data, error } = await supabase
        .from('bikes')
        .insert({ ...patch, user_id: user.id })
        .select()
        .single()
      if (error) throw error
      return data as Bike
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bikes'] }),
  })
}

export function useUpdateBike() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Bike> }) => {
      const { data, error } = await supabase
        .from('bikes')
        .update(patch)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Bike
    },
    onSuccess: (b) => {
      qc.invalidateQueries({ queryKey: ['bikes'] })
      qc.setQueryData(['bikes', b.id], b)
    },
  })
}

export function useDeleteBike() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('bikes').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bikes'] }),
  })
}
