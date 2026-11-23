import { useMemo, useState } from 'react'
import Layout from '@/components/Layout'
import PageHeader from '@/components/PageHeader'

type Kind = 'fork' | 'shock'

/** Empfohlene Sag-Bereiche (Prozent des Federwegs) je Komponente. */
const PRESETS: Record<Kind, { label: string; min: number; max: number }> = {
  fork: { label: 'Federgabel', min: 15, max: 20 },
  shock: { label: 'Dämpfer', min: 25, max: 30 },
}

/** Obergrenze der Skala für den Balken (%). */
const SCALE_MAX = 40

export default function SagCalculator() {
  const [kind, setKind] = useState<Kind>('fork')
  const [travel, setTravel] = useState('')
  const [sag, setSag] = useState('')

  const preset = PRESETS[kind]

  const result = useMemo(() => {
    const t = parseFloat(travel.replace(',', '.'))
    const s = parseFloat(sag.replace(',', '.'))
    if (!(t > 0) || !(s >= 0)) return null
    if (s > t) return { error: 'Der Sag kann nicht größer als der Federweg sein.' as const }
    const pct = (s / t) * 100
    const verdict =
      pct < preset.min ? ('firm' as const) : pct > preset.max ? ('soft' as const) : ('ok' as const)
    return { pct, verdict, travel: t }
  }, [travel, sag, preset])

  // Empfohlener Sag in mm, sobald der Federweg bekannt ist.
  const targetMm = useMemo(() => {
    const t = parseFloat(travel.replace(',', '.'))
    if (!(t > 0)) return null
    return { min: (t * preset.min) / 100, max: (t * preset.max) / 100 }
  }, [travel, preset])

  return (
    <Layout hideNav>
      <div className="px-5 pt-4">
        <PageHeader eyebrow="SAG-RECHNER" />
      </div>

      <div className="px-5 pt-3 pb-6 flex flex-col gap-3.5">
        <div className="flex flex-col gap-1">
          <h1 className="font-display font-black text-[32px] leading-none tracking-[-0.02em] text-cream">
            Sag-Rechner
          </h1>
          <p className="text-[13px] leading-relaxed text-muted">
            Miss mit dem O-Ring den Federweg-Einbruch im Stand und ermittle den Sag in Prozent.
          </p>
        </div>

        {/* Komponenten-Umschalter */}
        <div className="grid grid-cols-2 gap-2.5">
          {(Object.keys(PRESETS) as Kind[]).map((k) => {
            const active = kind === k
            return (
              <button
                key={k}
                onClick={() => setKind(k)}
                className="flex flex-col items-center gap-0.5 py-3 rounded-xl font-semibold text-sm transition-colors border"
                style={{
                  background: active ? 'var(--color-accent)' : 'transparent',
                  color: active ? 'var(--color-accent-ink)' : 'var(--color-cream-dim)',
                  borderColor: active ? 'var(--color-accent)' : 'var(--c-hair-strong)',
                }}
              >
                {PRESETS[k].label}
                <span
                  className="font-mono text-[10px] tracking-[0.08em]"
                  style={{ color: active ? 'var(--color-accent-ink)' : 'var(--color-dim)' }}
                >
                  {PRESETS[k].min}–{PRESETS[k].max}%
                </span>
              </button>
            )
          })}
        </div>

        {/* Eingaben */}
        <div className="bg-surface border border-hair rounded-[20px] p-[18px] flex flex-col gap-3.5">
          <label className="flex flex-col gap-1.5">
            <span className="eyebrow">FEDERWEG (MM)</span>
            <input
              value={travel}
              onChange={(e) => setTravel(e.target.value)}
              type="number"
              inputMode="decimal"
              min={0}
              placeholder="z. B. 160"
              className="input"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="eyebrow">GEMESSENER SAG (MM)</span>
            <input
              value={sag}
              onChange={(e) => setSag(e.target.value)}
              type="number"
              inputMode="decimal"
              min={0}
              placeholder="z. B. 32"
              className="input"
            />
          </label>

          {targetMm && (
            <p className="text-[13px] leading-relaxed text-muted">
              Ziel-Sag für {preset.label.toLowerCase()}:{' '}
              <span className="text-cream-dim font-medium">
                {fmt(targetMm.min)}–{fmt(targetMm.max)} mm
              </span>{' '}
              ({preset.min}–{preset.max}%)
            </p>
          )}
        </div>

        {/* Ergebnis */}
        {result && 'error' in result && (
          <p className="text-sm text-danger px-1">{result.error}</p>
        )}

        {result && !('error' in result) && (
          <ResultCard pct={result.pct} verdict={result.verdict} preset={preset} />
        )}
      </div>
    </Layout>
  )
}

function ResultCard({
  pct,
  verdict,
  preset,
}: {
  pct: number
  verdict: 'firm' | 'ok' | 'soft'
  preset: { label: string; min: number; max: number }
}) {
  const copy = {
    firm: { text: 'Zu straff – mehr Sag zulassen (Luftdruck senken).', color: 'var(--color-danger)' },
    ok: { text: 'Optimal – im empfohlenen Bereich.', color: 'var(--color-accent)' },
    soft: { text: 'Zu weich – weniger Sag (Luftdruck erhöhen).', color: 'var(--color-danger)' },
  }[verdict]

  const marker = Math.min(pct / SCALE_MAX, 1) * 100
  const bandLeft = (preset.min / SCALE_MAX) * 100
  const bandWidth = ((preset.max - preset.min) / SCALE_MAX) * 100

  return (
    <div className="bg-surface border border-hair rounded-[20px] p-[18px] flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <span className="eyebrow">SAG</span>
        <span className="font-display font-black text-[40px] leading-none" style={{ color: copy.color }}>
          {fmt(pct)}
          <span className="text-[22px] font-bold">%</span>
        </span>
      </div>

      {/* Skala 0–40 % mit Empfehlungszone und Markierung */}
      <div className="relative h-2.5 rounded-full" style={{ background: 'var(--c-track)' }}>
        <div
          className="absolute top-0 bottom-0 rounded-full"
          style={{
            left: `${bandLeft}%`,
            width: `${bandWidth}%`,
            background: 'color-mix(in srgb, var(--color-accent) 40%, transparent)',
          }}
        />
        <div
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2"
          style={{
            left: `${marker}%`,
            background: copy.color,
            borderColor: 'var(--color-ink)',
          }}
        />
      </div>
      <div className="flex justify-between font-mono text-[10px] text-dim -mt-2">
        <span>0%</span>
        <span>
          {preset.min}–{preset.max}%
        </span>
        <span>{SCALE_MAX}%</span>
      </div>

      <p className="text-[13px] leading-relaxed font-medium" style={{ color: copy.color }}>
        {copy.text}
      </p>
    </div>
  )
}

/** Auf eine Nachkommastelle, ohne unnötige Nullen. */
function fmt(n: number): string {
  return (Math.round(n * 10) / 10).toString().replace('.', ',')
}
