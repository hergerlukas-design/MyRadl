import { useMemo, useState } from 'react'
import Layout from '@/components/Layout'
import PageHeader from '@/components/PageHeader'

type Wheel = '29' | '27.5' | '26' | 'mullet'
type Mount = 'tubeless' | 'tube'
type Discipline = 'xc' | 'trail' | 'enduro' | 'dh'

/**
 * Volumen-Zuschlag kleinerer Laufräder (Referenz 29″), getrennt pro Rad –
 * Mullet fährt 29″ vorne / 27,5″ hinten.
 */
const WHEELS: { value: Wheel; label: string; front: number; rear: number }[] = [
  { value: '29', label: '29″', front: 1.0, rear: 1.0 },
  { value: '27.5', label: '27,5″', front: 1.05, rear: 1.05 },
  { value: '26', label: '26″', front: 1.08, rear: 1.08 },
  { value: 'mullet', label: 'Mullet', front: 1.0, rear: 1.05 },
]

/** Schlauch braucht mehr Druck (Durchschlagschutz). */
const MOUNTS: { value: Mount; label: string; factor: number }[] = [
  { value: 'tubeless', label: 'Tubeless', factor: 1.0 },
  { value: 'tube', label: 'Schlauch', factor: 1.15 },
]

/** Aggressiveres Fahren → mehr Druck gegen Durchschläge. */
const DISCIPLINES: { value: Discipline; label: string; factor: number }[] = [
  { value: 'xc', label: 'XC', factor: 0.97 },
  { value: 'trail', label: 'Trail', factor: 1.0 },
  { value: 'enduro', label: 'Enduro', factor: 1.05 },
  { value: 'dh', label: 'DH', factor: 1.1 },
]

const REF_WIDTH = 2.4 // Zoll, Referenz-Reifenbreite

export default function TirePressure() {
  const [weight, setWeight] = useState('')
  const [width, setWidth] = useState('')
  const [wheel, setWheel] = useState<Wheel>('29')
  const [mount, setMount] = useState<Mount>('tubeless')
  const [discipline, setDiscipline] = useState<Discipline>('trail')

  const result = useMemo(() => {
    const s = parseFloat(weight.replace(',', '.'))
    const w = parseFloat(width.replace(',', '.'))
    if (!(s > 0)) return null
    if (!(w >= 1.5 && w <= 3.2)) {
      return width.trim() ? { error: 'Reifenbreite in Zoll angeben (z. B. 2,4).' as const } : null
    }

    const wheelCfg = WHEELS.find((x) => x.value === wheel)!
    const mountF = MOUNTS.find((x) => x.value === mount)!.factor
    const discF = DISCIPLINES.find((x) => x.value === discipline)!.factor
    const widthF = 1 + (REF_WIDTH - w) * 0.4

    // Basisdruck (bar), grob an realen Tubeless-Trail-Werten kalibriert.
    // Laufrad-Faktor wirkt pro Rad (Mullet: 29″ vorne / 27,5″ hinten).
    const base = (0.016 * s + 0.12) * widthF * mountF * discF
    return { front: base * wheelCfg.front * 0.94, rear: base * wheelCfg.rear * 1.06 }
  }, [weight, width, wheel, mount, discipline])

  return (
    <Layout hideNav>
      <div className="px-5 pt-4">
        <PageHeader eyebrow="REIFENDRUCK-RECHNER" />
      </div>

      <div className="px-5 pt-3 pb-6 flex flex-col gap-3.5">
        <div className="flex flex-col gap-1">
          <h1 className="font-display font-black text-[32px] leading-none tracking-[-0.02em] text-cream">
            Reifendruck
          </h1>
          <p className="text-[13px] leading-relaxed text-muted">
            Startwerte für vorne und hinten – anschließend ±0,2 bar nach Gefühl feinjustieren.
          </p>
        </div>

        {/* Eingaben */}
        <div className="bg-surface border border-hair rounded-[20px] p-[18px] flex flex-col gap-3.5">
          <label className="flex flex-col gap-1.5">
            <span className="eyebrow">SYSTEMGEWICHT (KG)</span>
            <input
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              type="number"
              inputMode="decimal"
              min={0}
              placeholder="Fahrer + Rad + Ausrüstung, z. B. 95"
              className="input"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="eyebrow">REIFENBREITE (ZOLL)</span>
            <input
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              type="number"
              inputMode="decimal"
              min={0}
              placeholder="z. B. 2,4"
              className="input"
            />
          </label>

          <div className="flex flex-col gap-1.5">
            <span className="eyebrow">LAUFRADGRÖSSE</span>
            <Segmented options={WHEELS} value={wheel} onChange={setWheel} cols={4} />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="eyebrow">MONTAGE</span>
            <Segmented options={MOUNTS} value={mount} onChange={setMount} cols={2} />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="eyebrow">DISZIPLIN</span>
            <Segmented options={DISCIPLINES} value={discipline} onChange={setDiscipline} cols={4} />
          </div>
        </div>

        {/* Ergebnis */}
        {result && 'error' in result && <p className="text-sm text-danger px-1">{result.error}</p>}

        {result && !('error' in result) && (
          <div className="bg-surface border border-hair rounded-[20px] p-[18px] flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <PressureReadout label="VORNE" bar={result.front} />
              <div className="border-l border-hair pl-3">
                <PressureReadout label="HINTEN" bar={result.rear} />
              </div>
            </div>
            <p className="text-[13px] leading-relaxed text-muted">
              Richtwert, kein Festwert – bei Durchschlägen/Felgenkontakt erhöhen, für mehr Grip
              senken. Tubeless nie unter ~1,0 bar.
            </p>
          </div>
        )}
      </div>
    </Layout>
  )
}

function PressureReadout({ label, bar }: { label: string; bar: number }) {
  const barR = Math.round(bar / 0.05) * 0.05
  const psi = Math.round(bar * 14.5038)
  return (
    <div className="flex flex-col gap-1">
      <span className="eyebrow">{label}</span>
      <span className="font-display font-black text-[38px] leading-none text-accent">
        {fmt(barR)}
        <span className="text-[18px] font-bold text-cream-dim"> bar</span>
      </span>
      <span className="font-mono text-xs text-muted">{psi} psi</span>
    </div>
  )
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
  cols,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
  cols: 2 | 3 | 4
}) {
  const colClass = cols === 2 ? 'grid-cols-2' : cols === 3 ? 'grid-cols-3' : 'grid-cols-4'
  return (
    <div className={`grid ${colClass} gap-2`}>
      {options.map((opt) => {
        const active = value === opt.value
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className="py-2.5 rounded-xl font-semibold text-sm transition-colors border"
            style={{
              background: active ? 'var(--color-accent)' : 'transparent',
              color: active ? 'var(--color-accent-ink)' : 'var(--color-cream-dim)',
              borderColor: active ? 'var(--color-accent)' : 'var(--c-hair-strong)',
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

/** Bar mit Komma, ohne unnötige Nullen (z. B. 1,6 / 1,65). */
function fmt(n: number): string {
  return n.toFixed(2).replace(/0$/, '').replace(/[.,]$/, '').replace('.', ',')
}
