import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'myradl-theme'
const THEME_BG: Record<Theme, string> = { dark: '#12100E', light: '#F4F2ED' }

function storedTheme(): Theme | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v === 'light' || v === 'dark' ? v : null
  } catch {
    return null
  }
}

function systemTheme(): Theme {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

/** Reflect the resolved theme onto <html> and the theme-color meta tag. */
function apply(theme: Theme, explicit: boolean) {
  const root = document.documentElement
  if (explicit) root.setAttribute('data-theme', theme)
  else root.removeAttribute('data-theme')
  root.style.backgroundColor = THEME_BG[theme]
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_BG[theme])
}

interface ThemeContextValue {
  /** The currently rendered theme. */
  theme: Theme
  /** True when the user has explicitly overridden the system preference. */
  explicit: boolean
  setTheme: (t: Theme) => void
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [explicit, setExplicit] = useState<boolean>(() => storedTheme() !== null)
  const [theme, setThemeState] = useState<Theme>(() => storedTheme() ?? systemTheme())

  // Apply on mount and whenever the resolved theme changes.
  useEffect(() => {
    apply(theme, explicit)
  }, [theme, explicit])

  // While the user hasn't chosen explicitly, follow the OS preference live.
  useEffect(() => {
    if (explicit) return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setThemeState(mq.matches ? 'dark' : 'light')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [explicit])

  function setTheme(t: Theme) {
    try {
      localStorage.setItem(STORAGE_KEY, t)
    } catch {
      /* ignore */
    }
    setExplicit(true)
    setThemeState(t)
  }

  return (
    <ThemeContext.Provider value={{ theme, explicit, setTheme, toggle: () => setTheme(theme === 'dark' ? 'light' : 'dark') }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
