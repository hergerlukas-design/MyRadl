import { NavLink } from 'react-router-dom'

const items = [
  { to: '/bikes', label: 'RÄDER' },
  { to: '/search', label: 'SUCHE' },
  { to: '/settings', label: 'MEHR' },
]

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex items-stretch bg-nav border-t border-white/[0.07] max-w-md mx-auto px-3 pt-2.5"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}
    >
      {items.map(({ to, label }) => (
        <NavLink
          key={to}
          to={to}
          className="flex-1 flex flex-col items-center gap-1.5 py-2 group"
        >
          {({ isActive }) => (
            <>
              <span
                className="h-1 w-[34px] rounded-full transition-colors"
                style={{ background: isActive ? 'var(--color-accent)' : 'rgba(255,255,255,0.08)' }}
              />
              <span
                className="font-mono text-[11px] font-semibold tracking-[0.12em] transition-colors"
                style={{ color: isActive ? 'var(--color-accent)' : 'var(--color-dim)' }}
              >
                {label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
