import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextValue {
  session: Session | null
  user: User | null
  loading: boolean
  signInWithPassword: (email: string, password: string) => Promise<void>
  /** `meta` landet in den User-Metadaten – siehe termsAcceptanceMeta(). */
  signUpWithPassword: (
    email: string,
    password: string,
    meta?: Record<string, unknown>,
  ) => Promise<{ needsConfirmation: boolean }>
  signInWithMagicLink: (email: string, meta?: Record<string, unknown>) => Promise<void>
  updatePassword: (password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  async function signInWithPassword(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signUpWithPassword(
    email: string,
    password: string,
    meta?: Record<string, unknown>,
  ) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: meta },
    })
    if (error) throw error
    // When email confirmation is enabled, no session is returned until the user
    // confirms via the link in their inbox.
    return { needsConfirmation: !data.session }
  }

  async function signInWithMagicLink(email: string, meta?: Record<string, unknown>) {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      // `data` wird nur ausgewertet, wenn dabei ein neues Konto entsteht –
      // bei bestehenden Konten lässt Supabase die Metadaten unangetastet.
      options: { emailRedirectTo: window.location.origin, data: meta },
    })
    if (error) throw error
  }

  async function updatePassword(password: string) {
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw error
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        signInWithPassword,
        signUpWithPassword,
        signInWithMagicLink,
        updatePassword,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
