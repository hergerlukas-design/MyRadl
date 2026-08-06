import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search as SearchIcon, ChevronRight } from 'lucide-react'
import Layout from '@/components/Layout'
import Spinner from '@/components/ui/Spinner'
import { CATEGORIES, categoryColor, categoryLabel, partTitle, partSubtitle } from '@/lib/categories'
import { photoUrl } from '@/lib/storage'
import { useBikes } from '@/hooks/useBikes'
import { useAllParts } from '@/hooks/useParts'
import type { PartCategory } from '@/types'

export default function Search() {
  const navigate = useNavigate()
  const { data: parts, isLoading } = useAllParts()
  const { data: bikes } = useBikes()

  const [q, setQ] = useState('')
  const [category, setCategory] = useState<PartCategory | ''>('')
  const [bikeId, setBikeId] = useState('')
  const [onlyActive, setOnlyActive] = useState(true)

  const results = useMemo(() => {
    if (!parts) return []
    const needle = q.trim().toLowerCase()
    return parts.filter((p) => {
      if (category && p.category !== category) return false
      if (bikeId && p.bike_id !== bikeId) return false
      if (onlyActive && p.status !== 'aktiv') return false
      if (needle) {
        const hay = `${p.brand} ${p.model ?? ''} ${p.variant ?? ''} ${p.custom_type ?? ''}`.toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    })
  }, [parts, q, category, bikeId, onlyActive])

  return (
    <Layout title="Suche">
      <div className="p-4 space-y-3">
        <div className="relative">
          <SearchIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Hersteller, Modell, Variante…"
            className="input pl-10"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <select value={category} onChange={(e) => setCategory(e.target.value as PartCategory | '')} className="input">
            <option value="">Alle Kategorien</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <select value={bikeId} onChange={(e) => setBikeId(e.target.value)} className="input">
            <option value="">Alle Räder</option>
            {bikes?.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
          <input type="checkbox" checked={onlyActive} onChange={(e) => setOnlyActive(e.target.checked)} className="accent-primary w-4 h-4" />
          Nur aktive Teile
        </label>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : results.length === 0 ? (
        <p className="text-sm text-[var(--color-text-muted)] text-center py-12">Keine Teile gefunden.</p>
      ) : (
        <ul className="px-4 pb-4 space-y-2">
          {results.map((p) => {
            const url = photoUrl(p.image_url)
            const color = categoryColor(p.category)
            return (
              <li key={p.id}>
                <button
                  onClick={() => navigate(`/parts/${p.id}`)}
                  style={{ borderLeft: `4px solid ${color.fg}` }}
                  className={`card w-full flex items-center gap-3 rounded-xl p-2.5 text-left active:scale-[0.99] transition-transform ${
                    p.status === 'ersetzt' ? 'opacity-60' : ''
                  }`}
                >
                  <div
                    className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0"
                    style={{ backgroundColor: color.bg }}
                  >
                    {url && <img src={url} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[var(--color-text)] truncate">
                      {partTitle(p)}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)] truncate">
                      {categoryLabel(p.category)}
                      {p.bike ? ` · ${p.bike.name}` : ''}
                      {partSubtitle(p) ? ` · ${partSubtitle(p)}` : ''}
                    </p>
                  </div>
                  <ChevronRight className="text-[var(--color-text-muted)] opacity-50 flex-shrink-0" size={18} />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </Layout>
  )
}
