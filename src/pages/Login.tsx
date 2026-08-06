import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Mail, Loader2 } from 'lucide-react'
import Watermark from '@/components/Watermark'
import { useAuth } from '@/hooks/useAuth'

type Mode = 'password' | 'magic'

export default function Login() {
  const { session, signInWithPassword, signUpWithPassword, signInWithMagicLink } = useAuth()
  const [mode, setMode] = useState<Mode>('password')
  const [isSignup, setIsSignup] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  if (session) return <Navigate to="/bikes" replace />

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setBusy(true)
    try {
      if (mode === 'magic') {
        await signInWithMagicLink(email.trim())
        setInfo('Magic-Link gesendet – prüfe dein Postfach.')
      } else if (isSignup) {
        if (password !== confirmPassword) {
          setError('Die Passwörter stimmen nicht überein.')
          setBusy(false)
          return
        }
        const { needsConfirmation } = await signUpWithPassword(email.trim(), password)
        if (needsConfirmation) {
          setInfo('Fast fertig! Bestätige deine Email über den zugesendeten Link.')
        }
      } else {
        await signInWithPassword(email.trim(), password)
      }
    } catch (err) {
      setError(translateError((err as Error)?.message))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative min-h-dvh bg-ink text-cream flex flex-col justify-center px-6 max-w-md mx-auto overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <Watermark variant="top" />
      </div>

      <div className="relative w-full">
        <div className="mb-9">
          <span className="eyebrow">GARAGE · MOUNTAINBIKE</span>
          <h1 className="font-display font-black text-[52px] leading-[0.95] tracking-[-0.03em] text-cream mt-1">
            MyRadl
          </h1>
          <p className="text-muted text-sm mt-2">Deine Bikes, Teile &amp; Einstellungen.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div>
            <label className="block text-cream-dim text-sm font-medium mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="du@example.com"
              autoComplete="email"
              required
              className="input"
            />
          </div>

          {mode === 'password' && (
            <div>
              <label className="block text-cream-dim text-sm font-medium mb-1.5">Passwort</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                required
                minLength={6}
                className="input"
              />
            </div>
          )}

          {mode === 'password' && isSignup && (
            <div>
              <label className="block text-cream-dim text-sm font-medium mb-1.5">Passwort bestätigen</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                required
                minLength={6}
                className="input"
              />
            </div>
          )}

          {error && (
            <div className="bg-danger/10 border border-danger/40 rounded-xl px-4 py-3 text-danger text-sm text-center">
              {error}
            </div>
          )}
          {info && (
            <div className="bg-accent/10 border border-accent/30 rounded-xl px-4 py-3 text-accent text-sm text-center">
              {info}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-3.5 rounded-xl font-semibold text-base bg-accent text-accent-ink transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {busy && <Loader2 className="animate-spin" size={18} />}
            {mode === 'magic' ? 'Magic-Link senden' : isSignup ? 'Registrieren' : 'Anmelden'}
          </button>
        </form>

        <div className="mt-6 flex flex-col gap-3 text-center text-sm">
          {mode === 'password' ? (
            <>
              <button
                onClick={() => {
                  setIsSignup((v) => !v)
                  setError(null)
                  setInfo(null)
                }}
                className="text-cream-dim underline underline-offset-2"
              >
                {isSignup ? 'Ich habe schon ein Konto' : 'Neu hier? Konto erstellen'}
              </button>
              <button
                onClick={() => {
                  setMode('magic')
                  setError(null)
                  setInfo(null)
                }}
                className="inline-flex items-center justify-center gap-1.5 text-muted"
              >
                <Mail size={15} /> Stattdessen per Magic-Link
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                setMode('password')
                setError(null)
                setInfo(null)
              }}
              className="text-cream-dim underline underline-offset-2"
            >
              Mit Passwort anmelden
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function translateError(msg?: string): string {
  if (!msg) return 'Etwas ist schiefgelaufen.'
  if (/invalid login credentials/i.test(msg)) return 'Email oder Passwort ist falsch.'
  if (/already registered/i.test(msg)) return 'Diese Email ist bereits registriert.'
  if (/password should be at least/i.test(msg)) return 'Passwort muss mindestens 6 Zeichen haben.'
  return msg
}
