// The day ring: one tick per Day of the Quarter, longer at each month's start, today's in gold (spec §6.1, DESIGN.md)

import { lengthOf, monthStartsOf, type Quarter } from '../lib/quarters'

/** What the ring shows */
export interface RingFace {
  /** How many Days have passed, in dim gold */
  passed: number
  /** Today's Day, in gold, while the Quarter is running */
  today?: number
  /** The middle: "43" over "of 92" */
  numeral: number
  caption: string
  /** What a screen reader hears: "Day 43 of 92" */
  label: string
}

const SIZE = 164
const CENTRE = SIZE / 2
const OUTER = CENTRE - 1
const STROKE = SIZE / 120

export function Ring({ quarter, face }: { quarter: Quarter; face: RingFace }) {
  const length = lengthOf(quarter)
  const monthStarts = monthStartsOf(quarter)
  const round = (n: number) => Math.round(n * 100) / 100

  const ticks = Array.from({ length }, (_, i) => {
    const day = i + 1
    const isToday = day === face.today
    const reach = SIZE * (isToday ? 0.13 : monthStarts.includes(day) ? 0.085 : 0.05)
    const angle = (i / length) * 2 * Math.PI - Math.PI / 2
    const [cos, sin] = [Math.cos(angle), Math.sin(angle)]
    return (
      <line
        key={day}
        x1={round(CENTRE + OUTER * cos)}
        y1={round(CENTRE + OUTER * sin)}
        x2={round(CENTRE + (OUTER - reach) * cos)}
        y2={round(CENTRE + (OUTER - reach) * sin)}
        stroke={isToday ? 'var(--gold)' : day <= face.passed ? 'var(--gold-dim)' : 'var(--line)'}
        strokeWidth={round(isToday ? STROKE * 1.8 : STROKE)}
        strokeLinecap="round"
      />
    )
  })

  return (
    <div role="img" aria-label={face.label} className="relative shrink-0">
      <svg aria-hidden width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="block">
        {ticks}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-numeral font-light tracking-[-0.03em] tabular-nums">{face.numeral}</span>
        <span className="mt-1 text-s text-faint">{face.caption}</span>
      </div>
    </div>
  )
}
