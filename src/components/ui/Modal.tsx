import { useEffect, useState, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}

/**
 * Tracks the visible viewport (shrinks when the on-screen keyboard opens) so the
 * bottom sheet stays above the keyboard. Falls back to the full layout viewport
 * where the visualViewport API is unavailable.
 */
function useVisibleViewport() {
  const [vp, setVp] = useState<{ top: number; height: number } | null>(null)
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const update = () => setVp({ top: vv.offsetTop, height: vv.height })
    update()
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    }
  }, [])
  return vp
}

export default function Modal({ title, onClose, children, footer }: ModalProps) {
  const vp = useVisibleViewport()

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div
        className="fixed left-0 right-0 z-50 flex items-end justify-center pointer-events-none"
        style={vp ? { top: vp.top, height: vp.height } : { top: 0, bottom: 0 }}
      >
        <div className="pointer-events-auto bg-[var(--color-surface)] rounded-t-3xl shadow-2xl w-full max-w-2xl max-h-full flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border-subtle)] flex-shrink-0">
            <h2 className="text-base font-semibold text-[var(--color-text)]">{title}</h2>
            <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] p-1" aria-label="Schließen">
              <X size={20} />
            </button>
          </div>
          <div
            className="flex-1 overflow-y-auto px-5 py-4 space-y-4"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            {children}
          </div>
          {footer && (
            <div
              className="px-5 pb-4 pt-2 border-t border-[var(--color-border-subtle)] flex-shrink-0"
              style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}
            >
              {footer}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
