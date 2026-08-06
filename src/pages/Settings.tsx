import { useState } from 'react'
import { LogOut, Bike as BikeIcon, KeyRound, Check, RefreshCw } from 'lucide-react'
import Layout from '@/components/Layout'
import { useAuth } from '@/hooks/useAuth'
import { applyUpdate, checkForUpdate } from '@/lib/pwa'

export default function Settings() {
  const { user, signOut, updatePassword } = useAuth()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const [checking, setChecking] = useState(false)
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'current' | 'available'>('idle')

  async function handleCheckUpdate() {
    setChecking(true)
    setUpdateStatus('idle')
    try {
      const found = await checkForUpdate()
      if (found) {
        setUpdateStatus('available')
        // Direkt anwenden und neu laden.
        await applyUpdate()
      } else {
        setUpdateStatus('current')
      }
    } finally {
      setChecking(false)
    }
  }

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setDone(false)
    if (password.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen haben.')
      return
    }
    if (password !== confirm) {
      setError('Die Passwörter stimmen nicht überein.')
      return
    }
    setBusy(true)
    try {
      await updatePassword(password)
      setPassword('')
      setConfirm('')
      setDone(true)
    } catch (err) {
      setError((err as Error)?.message ?? 'Konnte Passwort nicht speichern.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Layout title="Mehr">
      <div className="p-4 space-y-5">
        <div className="card flex items-center gap-3 rounded-2xl p-4">
          <div className="w-11 h-11 rounded-full bg-[var(--color-cat-fork-bg)] flex items-center justify-center">
            <BikeIcon className="text-primary" size={22} />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-[var(--color-text-muted)]">Angemeldet als</p>
            <p className="font-medium text-[var(--color-text)] truncate">{user?.email ?? '—'}</p>
          </div>
        </div>

        <section className="card rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <KeyRound size={18} className="text-primary" />
            <h2 className="font-semibold text-[var(--color-text)]">Passwort festlegen</h2>
          </div>
          <p className="text-sm text-[var(--color-text-muted)] mb-3">
            Lege ein Passwort fest oder ändere es, um dich künftig mit Email &amp; Passwort anzumelden.
          </p>
          <form onSubmit={handleSetPassword} className="space-y-3">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Neues Passwort"
              autoComplete="new-password"
              minLength={6}
              className="input"
            />
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Passwort bestätigen"
              autoComplete="new-password"
              minLength={6}
              className="input"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            {done && (
              <p className="text-sm text-primary flex items-center gap-1.5">
                <Check size={16} /> Passwort gespeichert.
              </p>
            )}
            <button
              type="submit"
              disabled={busy}
              className="w-full py-2.5 rounded-xl bg-primary text-white font-semibold active:scale-[0.98] transition-transform disabled:opacity-60"
            >
              {busy ? 'Speichern…' : 'Passwort speichern'}
            </button>
          </form>
        </section>

        <section className="card rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <RefreshCw size={18} className="text-primary" />
            <h2 className="font-semibold text-[var(--color-text)]">App-Version</h2>
          </div>
          <p className="text-sm text-[var(--color-text-muted)] mb-3">
            Prüfe, ob eine neuere Version der App verfügbar ist, und aktualisiere sofort.
          </p>
          <button
            onClick={handleCheckUpdate}
            disabled={checking}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-white font-semibold active:scale-[0.98] transition-transform disabled:opacity-60"
          >
            <RefreshCw size={16} className={checking ? 'animate-spin' : ''} />
            {checking ? 'Suche…' : 'Auf Updates prüfen'}
          </button>
          {updateStatus === 'current' && (
            <p className="mt-2 text-sm text-primary flex items-center gap-1.5">
              <Check size={16} /> Du hast die neueste Version.
            </p>
          )}
          {updateStatus === 'available' && (
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">Update gefunden – App wird neu geladen…</p>
          )}
        </section>

        <button
          onClick={() => signOut()}
          className="card w-full flex items-center justify-center gap-2 text-red-600 font-semibold py-3 rounded-xl active:scale-[0.98] transition-transform"
        >
          <LogOut size={18} /> Abmelden
        </button>

        <p className="text-center text-xs text-gray-400">MyRadl v{__APP_VERSION__}</p>
      </div>
    </Layout>
  )
}
