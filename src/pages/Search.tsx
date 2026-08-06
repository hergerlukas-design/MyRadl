import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '@/components/Layout'
import Spinner from '@/components/ui/Spinner'
import { CATEGORIES, categoryColor, categoryLabel } from '@/lib/categories'
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
        const hay = `${p.brand} ${p.model} ${p.variant ?? ''}`.toLowerCase()
        if (!hay.includes(needle)) return false
      }
      return true
    })
  }, [parts, q, category, bikeId, onlyActive])

  return (
    <Layout>
      <div className="px-5 pt-4 pb-4 flex flex-col gap-3.5 flex-none">
        <h1 className="font-display font-black text-[32px] leading-none tracking-[-0.02em] text-cream">Suche</h1>

        <div className="flex items-center gap-2.5 bg-surface border border-white/[0.09] rounded-2xl px-4 py-3">
          <span className="text-muted text-lg leading-none">⌕</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Hersteller, Modell, Variante…"
            className="flex-1 bg-transparent border-0 outline-none text-cream placeholder:text-dim text-[15px]"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Chip active={onlyActive} onClick={() => setOnlyActive((v) => !v)}>Nur aktive Teile</Chip>
          {bikes?.map((b) => (
            <Chip key={b.id} active={bikeId === b.id} onClick={() => setBikeId((v) => (v === b.id ? '' : b.id))}>
              {b.name}
            </Chip>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto scr -mx-5 px-5 pb-0.5">
          <Chip active={category === ''} onClick={() => setCategory('')}>Alle</Chip>
          {CATEGORIES.map((c) => (
            <Chip
              key={c.value}
              active={category === c.value}
              color={c.color}
              onClick={() => setCategory((v) => (v === c.value ? '' : c.value))}
            >
              {c.label}
            </Chip>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : (
        <div className="flex-1 px-5 pb-6 flex flex-col gap-2.5">
          <span className="eyebrow px-0.5 py-1">{results.length} TEILE</span>
          {results.length === 0 ? (
            <p className="font-mono text-xs text-muted text-center py-8">Keine Teile gefunden.</p>
          ) : (
            results.map((p) => {
              const url = photoUrl(p.image_url)
              const color = categoryColor(p.category)
              return (
                <button
                  key={p.id}
                  onClick={() => navigate(`/parts/${p.id}`)}
                  className={`text-left flex items-center gap-3.5 bg-surface border border-white/[0.07] rounded-[18px] px-3.5 py-3 active:scale-[0.99] transition-transform ${
                    p.status === 'ersetzt' ? 'opacity-55' : ''
                  }`}
                >
                  <div className="w-[46px] h-[46px] flex-none rounded-[13px] overflow-hidden photo-ph border border-white/[0.06]">
                    {url && <img src={url} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <span className="text-[15px] font-semibold text-cream truncate">
                      {p.brand} {p.model}
                    </span>
                    <span className="font-mono text-[11.5px] text-muted truncate">
                      {categoryLabel(p.category)}
                      {p.bike ? ` · ${p.bike.name}` : ''}
                      {p.variant ? ` · ${p.variant}` : ''}
                    </span>
                  </div>
                  <span className="w-2 h-2 rounded-full flex-none" style={{ background: color }} />
                </button>
              )
            })
          )}
        </div>
      )}
    </Layout>
  )
}

function Chip({
  children,
  active,
  color,
  onClick,
}: {
  children: React.ReactNode
  active: boolean
  color?: string
  onClick: () => void
}) {
  const accent = color ?? 'var(--color-accent)'
  return (
    <button
      onClick={onClick}
      className="flex-none flex items-center gap-1.5 px-3.5 py-2 rounded-full font-mono text-xs font-medium tracking-[0.04em] transition-colors whitespace-nowrap"
      style={{
        background: active ? accent : 'transparent',
        color: active ? '#12100e' : 'var(--color-cream-dim)',
        border: `1px solid ${active ? accent : 'rgba(255,255,255,0.12)'}`,
      }}
    >
      {color && !active && <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />}
      {children}
    </button>
  )
}
