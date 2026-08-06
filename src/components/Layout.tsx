import type { ReactNode } from 'react'
import BottomNav from './BottomNav'

interface LayoutProps {
  children: ReactNode
  /** Hide the bottom navigation (e.g. on nested form screens). */
  hideNav?: boolean
}

/**
 * App shell: a phone-width dark canvas. Each screen renders its own header
 * (the design integrates big Chivo headlines directly into the content).
 */
export default function Layout({ children, hideNav = false }: LayoutProps) {
  return (
    <div className="relative min-h-dvh bg-ink text-cream flex flex-col max-w-md mx-auto">
      <main
        className={`flex-1 flex flex-col ${
          hideNav ? 'pb-8' : 'pb-[calc(5rem+env(safe-area-inset-bottom))]'
        }`}
      >
        {children}
      </main>
      {!hideNav && <BottomNav />}
    </div>
  )
}
