import { NavLink } from 'react-router-dom'
import { Bike, Search, Settings } from 'lucide-react'

const items = [
  { to: '/bikes', icon: Bike, label: 'Räder' },
  { to: '/search', icon: Search, label: 'Suche' },
  { to: '/settings', icon: Settings, label: 'Mehr' },
]

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 flex max-w-2xl mx-auto"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {items.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-xs font-medium transition-colors ${
              isActive ? 'text-primary' : 'text-gray-400 hover:text-gray-700'
            }`
          }
        >
          <Icon size={22} />
          <span className="truncate max-w-full px-1">{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
