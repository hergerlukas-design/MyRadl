import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

interface PageHeaderProps {
  /** Mono eyebrow shown centered between the back and action buttons. */
  eyebrow?: string
  /** Right-aligned action button (e.g. edit). */
  action?: ReactNode
  onBack?: () => void
}

const squareBtn =
  'w-9 h-9 rounded-xl bg-surface border border-white/[0.08] flex items-center justify-center text-cream-dim active:scale-95 transition-transform'

/** The back / eyebrow / action row used at the top of detail & form screens. */
export default function PageHeader({ eyebrow, action, onBack }: PageHeaderProps) {
  const navigate = useNavigate()
  return (
    <div className="flex items-center justify-between h-10">
      <button
        onClick={onBack ?? (() => navigate(-1))}
        className={squareBtn}
        aria-label="Zurück"
      >
        <ChevronLeft size={20} />
      </button>
      {eyebrow ? (
        <span className="font-mono text-[10px] font-medium tracking-[0.16em] text-muted truncate px-2">
          {eyebrow}
        </span>
      ) : (
        <span />
      )}
      {action ?? <span className="w-9" />}
    </div>
  )
}

export { squareBtn }
