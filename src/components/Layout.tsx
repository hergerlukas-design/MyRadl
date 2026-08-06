import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import BottomNav from './BottomNav'

interface LayoutProps {
  children: ReactNode
  title?: string
  /** Show a back chevron in the header. */
  back?: boolean
  /** Right-aligned header slot (e.g. an action button). */
  action?: ReactNode
  /** Hide the bottom navigation (e.g. on nested form screens). */
  hideNav?: boolean
}

export default function Layout({ children, title, back = false, action, hideNav = false }: LayoutProps) {
  const navigate = useNavigate()

  return (
    <div className="min-h-dvh bg-[var(--color-bg)] flex flex-col max-w-2xl mx-auto">
      {(title || back || action) && (
        <header className="sticky top-0 z-30 bg-[var(--color-surface)] border-b border-[var(--color-border-subtle)] px-4 py-3">
          <div className="flex items-center gap-2">
            {back && (
              <button
                onClick={() => navigate(-1)}
                className="-ml-2 p-1 text-gray-500 hover:text-gray-900"
                aria-label="Zurück"
              >
                <ChevronLeft size={24} />
              </button>
            )}
            <h1 className="flex-1 min-w-0 text-lg font-semibold text-[var(--color-text)] truncate">{title}</h1>
            {action}
          </div>
        </header>
      )}
      <main className={`flex-1 ${hideNav ? 'pb-8' : 'pb-[calc(4.5rem+env(safe-area-inset-bottom))]'}`}>
        {children}
      </main>
      {!hideNav && <BottomNav />}
    </div>
  )
}
