import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Part, PartLink, PartSetting, PartHistory } from '@/types'

// ── Settings ────────────────────────────────────────────────────────────────
export function usePartSettings(partId: string) {
  return useQuery({
    queryKey: ['part_settings', partId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('part_settings')
        .select('*')
        .eq('part_id', partId)
        .order('updated_at', { ascending: true })
      if (error) throw error
      return data as PartSetting[]
    },
    enabled: !!partId,
  })
}

/** Alle Einstellungen eines Rads (über alle Teile) – für die Schnellübersicht. */
export interface BikeSetting extends PartSetting {
  part: Pick<Part, 'id' | 'category' | 'position' | 'status'> | null
}

export function useBikeSettings(bikeId: string) {
  return useQuery({
    queryKey: ['bike_settings', bikeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('part_settings')
        .select('*, part:parts!inner(id, category, position, status, bike_id)')
        .eq('part.bike_id', bikeId)
      if (error) throw error
      return data as BikeSetting[]
    },
    enabled: !!bikeId,
  })
}

export function useUpsertSetting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (row: Partial<PartSetting> & { part_id: string; key: string; value: string }) => {
      const payload = { ...row, updated_at: new Date().toISOString() }
      const { data, error } = row.id
        ? await supabase.from('part_settings').update(payload).eq('id', row.id).select().single()
        : await supabase.from('part_settings').insert(payload).select().single()
      if (error) throw error
      return data as PartSetting
    },
    onSuccess: (s) => {
      qc.invalidateQueries({ queryKey: ['part_settings', s.part_id] })
      qc.invalidateQueries({ queryKey: ['bike_settings'] })
    },
  })
}

export function useDeleteSetting() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id }: { id: string; partId: string }) => {
      const { error } = await supabase.from('part_settings').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_r, { partId }) => {
      qc.invalidateQueries({ queryKey: ['part_settings', partId] })
      qc.invalidateQueries({ queryKey: ['bike_settings'] })
    },
  })
}

// ── Links ───────────────────────────────────────────────────────────────────
export function usePartLinks(partId: string) {
  return useQuery({
    queryKey: ['part_links', partId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('part_links')
        .select('*')
        .eq('part_id', partId)
      if (error) throw error
      return data as PartLink[]
    },
    enabled: !!partId,
  })
}

export function useAddLink() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (row: { part_id: string; label: string; url: string }) => {
      const { data, error } = await supabase.from('part_links').insert(row).select().single()
      if (error) throw error
      return data as PartLink
    },
    onSuccess: (l) => qc.invalidateQueries({ queryKey: ['part_links', l.part_id] }),
  })
}

export function useDeleteLink() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id }: { id: string; partId: string }) => {
      const { error } = await supabase.from('part_links').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_r, { partId }) => qc.invalidateQueries({ queryKey: ['part_links', partId] }),
  })
}

// ── History ─────────────────────────────────────────────────────────────────
export function usePartHistory(partId: string) {
  return useQuery({
    queryKey: ['part_history', partId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('part_history')
        .select('*')
        .eq('part_id', partId)
        .order('event_date', { ascending: false })
      if (error) throw error
      return data as PartHistory[]
    },
    enabled: !!partId,
  })
}

export function useAddHistory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (row: Omit<PartHistory, 'id' | 'created_at'>) => {
      const { data, error } = await supabase.from('part_history').insert(row).select().single()
      if (error) throw error
      return data as PartHistory
    },
    onSuccess: (h) => qc.invalidateQueries({ queryKey: ['part_history', h.part_id] }),
  })
}

export function useDeleteHistory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id }: { id: string; partId: string }) => {
      const { error } = await supabase.from('part_history').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_r, { partId }) => qc.invalidateQueries({ queryKey: ['part_history', partId] }),
  })
}
