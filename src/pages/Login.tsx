import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Mail, Loader2 } from 'lucide-react'
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
    <div
      className="min-h-dvh flex flex-col items-center justify-center px-6"
      style={{ background: 'linear-gradient(135deg, #14532d 0%, #15803d 100%)' }}
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img
            src="/logo.png"
            alt="MyRadl"
            className="w-20 h-20 rounded-2xl mx-auto mb-4 shadow-lg object-cover"
          />
          <h1 className="text-2xl font-bold text-white">MyRadl</h1>
          <p className="text-green-200 text-sm mt-1">Deine Bikes, Teile &amp; Einstellungen.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-green-100 text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="du@example.com"
              autoComplete="email"
              required
              className="w-full px-4 py-3 rounded-xl text-white placeholder-green-200/60 border border-white/20 focus:outline-none focus:border-white/70"
              style={{ backgroundColor: 'rgba(255,255,255,0.10)' }}
            />
          </div>

          {mode === 'password' && (
            <div>
              <label className="block text-green-100 text-sm font-medium mb-1">Passwort</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-xl text-white placeholder-green-200/60 border border-white/20 focus:outline-none focus:border-white/70"
                style={{ backgroundColor: 'rgba(255,255,255,0.10)' }}
              />
            </div>
          )}

          {mode === 'password' && isSignup && (
            <div>
              <label className="block text-green-100 text-sm font-medium mb-1">Passwort bestätigen</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                required
                minLength={6}
                className="w-full px-4 py-3 rounded-xl text-white placeholder-green-200/60 border border-white/20 focus:outline-none focus:border-white/70"
                style={{ backgroundColor: 'rgba(255,255,255,0.10)' }}
              />
            </div>
          )}

          {error && (
            <div className="bg-red-500/20 border border-red-400/40 rounded-xl px-4 py-3 text-red-100 text-sm text-center">
              {error}
            </div>
          )}
          {info && (
            <div className="bg-white/15 border border-white/30 rounded-xl px-4 py-3 text-green-50 text-sm text-center">
              {info}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-3 rounded-xl font-bold text-base bg-white text-primary transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {busy && <Loader2 className="animate-spin" size={18} />}
            {mode === 'magic' ? 'Magic-Link senden' : isSignup ? 'Registrieren' : 'Anmelden'}
          </button>
        </form>

        <div className="mt-6 space-y-3 text-center text-sm">
          {mode === 'password' ? (
            <>
              <button
                onClick={() => {
                  setIsSignup((v) => !v)
                  setError(null)
                  setInfo(null)
                }}
                className="text-green-100 underline underline-offset-2"
              >
                {isSignup ? 'Ich habe schon ein Konto' : 'Neu hier? Konto erstellen'}
              </button>
              <div>
                <button
                  onClick={() => {
                    setMode('magic')
                    setError(null)
                    setInfo(null)
                  }}
                  className="inline-flex items-center gap-1.5 text-green-200/90"
                >
                  <Mail size={15} /> Stattdessen per Magic-Link
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={() => {
                setMode('password')
                setError(null)
                setInfo(null)
              }}
              className="text-green-100 underline underline-offset-2"
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
