// The day ring: one tick per Day of the Quarter, longer at each month's start, today's in gold (spec §6.1, DESIGN.md)

import { dayOf, daysUntil, firstDayOf, labelOf, lengthOf, type LocalDate, monthStartsOf } from '../lib/quarters'
import type { TodayScreen } from './Today'

const SIZE = 164
const CENTRE = SIZE / 2
const OUTER = CENTRE - 1
const STROKE = SIZE / 120

/** What the ring shows: how many Days have passed, which one is today, and the words in its middle */
function faceOf(screen: TodayScreen, today: LocalDate) {
  const length = lengthOf(screen.quarter)
  switch (screen.name) {
    case 'running': {
      const day = dayOf(today, screen.quarter) as number
      return { passed: day - 1, today: day, numeral: day, caption: `of ${length}`, label: `Day ${day} of ${length}` }
    }
    case 'before-day-1': {
      // Before Day 1 the ring is empty, and counts the days to go (spec §6.4)
      const toGo = daysUntil(today, firstDayOf(screen.quarter))
      const caption = toGo === 1 ? 'day to go' : 'days to go'
      return { passed: 0, numeral: toGo, caption, label: `${toGo} ${caption}` }
    }
    case 'ended':
      return { passed: length, numeral: length, caption: 'ended', label: `${labelOf(screen.quarter)} has ended` }
  }
}

export function Ring({ screen, today }: { screen: TodayScreen; today: LocalDate }) {
  const length = lengthOf(screen.quarter)
  const monthStarts = monthStartsOf(screen.quarter)
  const face = faceOf(screen, today)
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
    <div role="img" aria-label={face.label} className="relative size-[164px] shrink-0">
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
