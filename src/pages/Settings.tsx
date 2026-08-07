import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Moon, Sun, RefreshCw, Calculator, ChevronRight } from 'lucide-react'
import Layout from '@/components/Layout'
import { useAuth } from '@/hooks/useAuth'
import { useTheme, type Theme } from '@/hooks/useTheme'
import { applyUpdate, checkForUpdate } from '@/lib/pwa'

export default function Settings() {
  const { user, signOut, updatePassword } = useAuth()
  const navigate = useNavigate()

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

  const initials = (user?.email ?? '?').slice(0, 2).toUpperCase()

  return (
    <Layout>
      <div className="px-5 pt-4 pb-4 flex-none">
        <h1 className="font-display font-black text-[32px] leading-none tracking-[-0.02em] text-cream">Mehr</h1>
      </div>

      <div className="flex-1 px-5 pb-6 flex flex-col gap-3.5">
        {/* Account */}
        <div className="flex items-center gap-3.5 bg-surface border border-hair rounded-[20px] p-4">
          <div className="w-[46px] h-[46px] rounded-full bg-accent/15 border border-accent/35 flex items-center justify-center font-display font-semibold text-[15px] text-accent">
            {initials}
          </div>
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="eyebrow">ANGEMELDET ALS</span>
            <span className="text-sm font-medium text-cream-dim truncate">{user?.email ?? '—'}</span>
          </div>
        </div>

        {/* Werkzeuge */}
        <button
          onClick={() => navigate('/sag')}
          className="flex items-center gap-3.5 bg-surface border border-hair rounded-[20px] p-4 text-left active:scale-[0.99] transition-transform"
        >
          <div className="w-[46px] h-[46px] rounded-full bg-accent/15 border border-accent/35 flex items-center justify-center text-accent">
            <Calculator size={20} />
          </div>
          <div className="flex flex-col gap-0.5 min-w-0 flex-1">
            <span className="text-[15px] font-extrabold text-cream">Sag-Rechner</span>
            <span className="text-[13px] text-muted truncate">Sag in % aus Federweg &amp; Messung</span>
          </div>
          <ChevronRight size={20} className="text-dim flex-none" />
        </button>

        <ThemeCard />

        {/* Passwort */}
        <div className="bg-surface border border-hair rounded-[20px] p-[18px] flex flex-col gap-3">
          <span className="text-[15px] font-extrabold text-cream">Passwort festlegen</span>
          <span className="text-[13px] leading-relaxed text-muted">
            Lege ein Passwort fest oder ändere es, um dich künftig mit Email &amp; Passwort anzumelden.
          </span>
          <form onSubmit={handleSetPassword} className="flex flex-col gap-3">
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
            {error && <p className="text-sm text-danger">{error}</p>}
            {done && (
              <p className="text-sm text-accent flex items-center gap-1.5">
                <Check size={16} /> Passwort gespeichert.
              </p>
            )}
            <button
              type="submit"
              disabled={busy}
              className="w-full py-3.5 rounded-xl bg-accent text-accent-ink font-semibold active:scale-[0.98] transition-transform disabled:opacity-60"
            >
              {busy ? 'Speichern…' : 'Passwort speichern'}
            </button>
          </form>
        </div>

        {/* App-Version */}
        <div className="bg-surface border border-hair rounded-[20px] p-[18px] flex flex-col gap-3">
          <div className="flex items-baseline justify-between">
            <span className="text-[15px] font-extrabold text-cream">App-Version</span>
            <span className="font-mono text-xs text-muted">{__APP_VERSION__}</span>
          </div>
          <span className="text-[13px] leading-relaxed text-muted">
            Prüfe, ob eine neuere Version verfügbar ist, und aktualisiere sofort.
          </span>
          <button
            onClick={handleCheckUpdate}
            disabled={checking}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-accent/40 text-accent font-semibold active:scale-[0.98] transition-transform disabled:opacity-60"
          >
            <RefreshCw size={16} className={checking ? 'animate-spin' : ''} />
            {checking ? 'Suche…' : 'Auf Updates prüfen'}
          </button>
          {updateStatus === 'current' && (
            <p className="text-sm text-accent flex items-center gap-1.5">
              <Check size={16} /> Du hast die neueste Version.
            </p>
          )}
          {updateStatus === 'available' && (
            <p className="text-sm text-muted">Update gefunden – App wird neu geladen…</p>
          )}
        </div>

        <button
          onClick={() => signOut()}
          className="w-full py-3.5 rounded-[20px] border border-danger/30 text-danger font-semibold active:scale-[0.98] transition-transform"
        >
          Abmelden
        </button>
      </div>
    </Layout>
  )
}

function ThemeCard() {
  const { theme, setTheme } = useTheme()
  const options: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: 'dark', label: 'Dunkel', icon: Moon },
    { value: 'light', label: 'Hell', icon: Sun },
  ]
  return (
    <div className="bg-surface border border-hair rounded-[20px] p-[18px] flex flex-col gap-3">
      <span className="text-[15px] font-extrabold text-cream">Erscheinungsbild</span>
      <div className="grid grid-cols-2 gap-2.5">
        {options.map(({ value, label, icon: Icon }) => {
          const active = theme === value
          return (
            <button
              key={value}
              onClick={() => setTheme(value)}
              className="flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-colors border"
              style={{
                background: active ? 'var(--color-accent)' : 'transparent',
                color: active ? 'var(--color-accent-ink)' : 'var(--color-cream-dim)',
                borderColor: active ? 'var(--color-accent)' : 'var(--c-hair-strong)',
              }}
            >
              <Icon size={16} /> {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
