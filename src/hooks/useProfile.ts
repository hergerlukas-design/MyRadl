import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { Profile } from '@/types'

/** Erlaubte Username-Form – identisch zur Check-Constraint in Migration 009. */
export const USERNAME_RE = /^[a-z0-9_]{3,20}$/

/**
 * Namen, die als Route (oder Route-Präfix) der App bereits belegt sind bzw.
 * belegt werden könnten. Sie würden unter `/u/<username>` zwar funktionieren,
 * sind aber verwirrend – daher clientseitig gesperrt.
 */
const RESERVED = new Set([
  'admin', 'api', 'bikes', 'community', 'login', 'logout', 'me', 'myradl',
  'parts', 'profile', 'search', 'settings', 'share', 'sag', 'reifendruck',
  'support', 'u', 'user',
])

/**
 * Prüft einen Username-Entwurf. Gibt `null` zurück, wenn er in Ordnung ist,
 * sonst eine Meldung für die Oberfläche.
 */
export function validateUsername(value: string): string | null {
  const name = value.trim().toLowerCase()
  if (!name) return 'Bitte gib einen Username ein.'
  if (name.length < 3) return 'Mindestens 3 Zeichen.'
  if (name.length > 20) return 'Höchstens 20 Zeichen.'
  if (!USERNAME_RE.test(name)) return 'Erlaubt sind nur a–z, 0–9 und _.'
  if (RESERVED.has(name)) return 'Dieser Username ist reserviert.'
  return null
}

/** Profil des eingeloggten Users – `null`, solange keines angelegt wurde. */
export function useMyProfile() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['profile', 'me', user?.id ?? null],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user!.id)
        .maybeSingle()
      if (error) throw error
      return (data as Profile | null) ?? null
    },
    enabled: !!user,
  })
}

/** Profil zu einem Username (`/u/:username`). Läuft ohne Login. */
export function useProfileByUsername(username: string) {
  const name = username.trim().toLowerCase()
  return useQuery({
    queryKey: ['profile', 'username', name],
    queryFn: async () => {
      if (!USERNAME_RE.test(name)) return null
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', name)
        .maybeSingle()
      if (error) throw error
      return (data as Profile | null) ?? null
    },
    enabled: !!name,
    retry: false,
  })
}

/** Profil zu einer User-ID – z.B. um an einem geteilten Rad den Besitzer zu zeigen. */
export function useProfileByUserId(userId: string | null | undefined) {
  return useQuery({
    queryKey: ['profile', 'user', userId ?? null],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId!)
        .maybeSingle()
      if (error) throw error
      return (data as Profile | null) ?? null
    },
    enabled: !!userId,
  })
}

/** Mehrere Profile auf einmal (Community-Listen: Rad → Besitzer). */
export function useProfilesByIds(userIds: string[]) {
  // Stabiler Key, damit sich die Query nicht bei jeder Renderrunde ändert.
  const ids = Array.from(new Set(userIds)).sort()
  return useQuery({
    queryKey: ['profiles', 'ids', ids.join(',')],
    queryFn: async () => {
      if (ids.length === 0) return [] as Profile[]
      const { data, error } = await supabase.from('profiles').select('*').in('id', ids)
      if (error) throw error
      return data as Profile[]
    },
    enabled: ids.length > 0,
  })
}

/**
 * Legt das eigene Profil an oder aktualisiert es. Der Username wird immer
 * kleingeschrieben gespeichert (siehe Migration 009).
 */
export function useSaveProfile() {
  const qc = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async ({ username, displayName }: { username: string; displayName?: string | null }) => {
      if (!user) throw new Error('Nicht eingeloggt')
      const name = username.trim().toLowerCase()
      const invalid = validateUsername(name)
      if (invalid) throw new Error(invalid)

      const { data, error } = await supabase
        .from('profiles')
        .upsert(
          {
            id: user.id,
            username: name,
            display_name: displayName?.trim() || null,
          },
          { onConflict: 'id' },
        )
        .select()
        .single()

      if (error) {
        // 23505 = unique_violation: der Username ist bereits vergeben.
        if (error.code === '23505') throw new Error('Dieser Username ist schon vergeben.')
        throw error
      }
      return data as Profile
    },
    onSuccess: (profile) => {
      qc.setQueryData(['profile', 'me', profile.id], profile)
      qc.invalidateQueries({ queryKey: ['profile'] })
      qc.invalidateQueries({ queryKey: ['profiles'] })
    },
  })
}
