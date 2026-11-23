import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import { useSaveProfile, validateUsername } from '@/hooks/useProfile'
import type { Profile } from '@/types'

interface UsernameModalProps {
  /** Bestehendes Profil ⇒ Bearbeiten statt Anlegen. */
  profile?: Profile | null
  /** Zusatzhinweis, warum gerade jetzt ein Username nötig ist. */
  hint?: string
  onClose: () => void
  /** Nach erfolgreichem Speichern – z.B. um das Teilen fortzusetzen. */
  onSaved?: (profile: Profile) => void
}

/**
 * Username (und optionaler Anzeigename) vergeben bzw. ändern. Wird sowohl in
 * den Einstellungen als auch beim ersten öffentlichen Teilen eines Rads
 * verwendet – ein öffentliches Rad braucht ein Profil, damit es einer Person
 * zugeordnet werden kann.
 */
export default function UsernameModal({ profile, hint, onClose, onSaved }: UsernameModalProps) {
  const saveProfile = useSaveProfile()
  const [username, setUsername] = useState(profile?.username ?? '')
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '')
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    const invalid = validateUsername(username)
    if (invalid) {
      setError(invalid)
      return
    }
    setError(null)
    try {
      const saved = await saveProfile.mutateAsync({ username, displayName })
      onSaved?.(saved)
      onClose()
    } catch (err) {
      setError((err as Error)?.message ?? 'Konnte das Profil nicht speichern.')
    }
  }

  return (
    <Modal
      title={profile ? 'Profil bearbeiten' : 'Username wählen'}
      onClose={onClose}
      footer={
        <button
          onClick={handleSave}
          disabled={saveProfile.isPending}
          className="w-full py-3.5 rounded-xl bg-accent text-accent-ink font-semibold active:scale-[0.98] transition-transform disabled:opacity-60"
        >
          {saveProfile.isPending ? 'Speichern…' : 'Speichern'}
        </button>
      }
    >
      {hint && <p className="text-sm text-cream-dim leading-relaxed">{hint}</p>}

      <label className="block">
        <span className="block text-sm font-medium text-cream-dim mb-1.5">Username *</span>
        <div className="flex items-center gap-2 bg-surface-2 border border-hair-strong rounded-xl px-3.5">
          <span className="font-mono text-sm text-muted">@</span>
          <input
            value={username}
            // Nur Kleinbuchstaben, Ziffern und _ – identisch zur DB-Constraint.
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20))}
            placeholder="trailrider"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            autoFocus={!profile}
            className="flex-1 bg-transparent border-0 outline-none py-3 text-cream placeholder:text-dim text-[15px] font-mono"
          />
        </div>
        <span className="mt-1.5 block text-xs text-muted leading-relaxed">
          3–20 Zeichen aus a–z, 0–9 und _. Dein Profil ist danach unter{' '}
          <span className="font-mono text-cream-dim">/u/{username || 'username'}</span> öffentlich
          erreichbar.
        </span>
      </label>

      <label className="block">
        <span className="block text-sm font-medium text-cream-dim mb-1.5">Anzeigename</span>
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value.slice(0, 40))}
          placeholder="optional, z.B. Lukas H."
          className="input"
        />
      </label>

      {error && <p className="text-sm text-danger">{error}</p>}
    </Modal>
  )
}
