// Today: the day ring and the date, then one page per Quest, Work then Life, and the menu (spec §6)

import { useCallback, useRef, useState } from 'react'
import { useCadence } from '../hooks/useCadence'
import {
  type Boundary,
  boundaryOf,
  dayAndMonth,
  firstDayOf,
  labelOf,
  lastDayOf,
  lengthOf,
  type LocalDate,
  type Quarter,
  quarterOf,
  standingIn,
  weekdayDate,
} from '../lib/quarters'
import type { Quest } from '../lib/store'
import { Banners } from './Banners'
import { primary } from './buttons'
import { FailedSave, failureOf } from './FailedSave'
import { Menu, MenuButton } from './Menu'
import { Pages } from './Pages'
import { ReflectionPopup } from './ReflectionPopup'
import { Ring, type RingFace } from './Ring'

/** What Today says about the day, from where today stands in the Quarter on screen */
interface DayWords {
  /** Under the ring: "Thursday 12 Nov", or "Starts Thursday 1 Oct" before Day 1 (§6.1, §6.4) */
  dateLine: string
  /** In the menu: "Day 43 of 92, 49 to go", or "Starts in 2 days" (§6.3) */
  summary: string
  /** At the foot of each page, while no Reflection can be written yet (§6.4) */
  reflectionsNote?: string
  /** Today is a Day of the Quarter, so its Reflections can be written (§7.1) */
  canReflect: boolean
  /** The Quarter hasn't ended, so its Quests can be edited (§6.4) */
  canEdit: boolean
  ring: RingFace
}

function wordsFor(quarter: Quarter, today: LocalDate): DayWords {
  const length = lengthOf(quarter)
  const standing = standingIn(quarter, today)
  switch (standing.at) {
    case 'day': {
      const { day, daysLeft } = standing
      return {
        dateLine: weekdayDate(today),
        summary: `Day ${day} of ${length}, ${daysLeft} to go`,
        canReflect: true,
        canEdit: true,
        ring: { passed: day - 1, today: day, numeral: day, caption: `of ${length}`, label: `Day ${day} of ${length}` },
      }
    }
    case 'before': {
      const { daysToGo } = standing
      const days = daysToGo === 1 ? 'day' : 'days'
      const dayOne = weekdayDate(firstDayOf(quarter))
      return {
        dateLine: `Starts ${dayOne}`,
        summary: `Starts in ${daysToGo} ${days}`,
        reflectionsNote: `Reflections start on Day 1, ${dayOne}.`,
        canReflect: false,
        canEdit: true,
        // The ring is empty, and counts the days to go
        ring: { passed: 0, numeral: daysToGo, caption: `${days} to go`, label: `${daysToGo} ${days} to go` },
      }
    }
    case 'past':
      return {
        dateLine: weekdayDate(today),
        summary: `Ended ${weekdayDate(lastDayOf(quarter))}`,
        // The Current Quarter is the one the ended state sets up (§3.1)
        reflectionsNote: `Reflecting starts again once ${labelOf(quarterOf(today))} is set up.`,
        canReflect: false,
        canEdit: false,
        // The ring is full
        ring: { passed: length, numeral: length, caption: 'ended', label: `${labelOf(quarter)} has ended` },
      }
  }
}

interface Props {
  quarter: Quarter
  /** The menu's Edit on a Quest */
  onEdit: (quest: Quest) => void
  /** The menu's History on a Quest */
  onHistory: (quest: Quest) => void
  /** The menu's Archive row */
  onArchive: () => void
  /** The menu's Backup row */
  onBackup: () => void
  /** A Reflection popup opens or closes */
  onReflecting: (open: boolean) => void
  /** Opens setup on a Quarter: "Set it up" in the last 14 days, or "Set up Q1 2027" once a Quarter has ended (spec §6.4) */
  onSetUp: (quarter: Quarter) => void
}

export function Today({ quarter, onEdit, onHistory, onArchive, onBackup, onReflecting, onSetUp }: Props) {
  const { snapshot, today } = useCadence()
  const words = wordsFor(quarter, today)
  const boundary = boundaryOf(snapshot, quarter, today)
  const [menuOpen, setMenuOpen] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  /** The Quest whose Reflection popup is open */
  const [reflecting, setReflecting] = useState<Quest | null>(null)
  const reflect = (quest: Quest | null) => {
    setReflecting(quest)
    onReflecting(quest !== null)
  }
  const menuButton = useRef<HTMLButtonElement>(null)
  const closeMenu = useCallback(() => {
    setMenuOpen(false)
    menuButton.current?.focus()
  }, [])

  return (
    <>
      <Banners />
      <main className="mx-auto max-w-[600px] pt-safe pb-[calc(56px+env(safe-area-inset-bottom))]">
        <header className="relative flex flex-col items-center gap-3.5 px-gutter pt-7 pb-6">
          <MenuButton ref={menuButton} onOpen={() => setMenuOpen(true)} />
          <Ring quarter={quarter} face={words.ring} />
          <p className="text-given tabular-nums">{words.dateLine}</p>
          {boundary && <BoundaryLine quarter={quarter} boundary={boundary} onSetUp={onSetUp} onBackup={onBackup} />}
        </header>
        <Pages
          quarter={quarter}
          reflectionsNote={words.reflectionsNote}
          onReflect={words.canReflect ? reflect : undefined}
        />
      </main>
      {menuOpen && (
        <Menu
          quarter={quarter}
          summary={words.summary}
          canEdit={words.canEdit}
          onClose={closeMenu}
          onEdit={onEdit}
          onHistory={onHistory}
          onArchive={onArchive}
          onBackup={onBackup}
          onFailure={(error) => setFailure(failureOf(error))}
        />
      )}
      {reflecting && (
        <ReflectionPopup key={reflecting} quest={reflecting} quarter={quarter} onClose={() => reflect(null)} />
      )}
      {failure && <FailedSave message={failure} onClose={() => setFailure(null)} />}
    </>
  )
}

interface BoundaryProps {
  /** The Quarter on Today */
  quarter: Quarter
  boundary: Boundary
  onSetUp: (quarter: Quarter) => void
  onBackup: () => void
}

/** At most one quiet line under the date at a Quarter's boundary, or one action once it has ended (spec §6.4) */
function BoundaryLine({ quarter, boundary, onSetUp, onBackup }: BoundaryProps) {
  if (boundary.at === 'ended') {
    const { next } = boundary
    return (
      <div data-testid="boundary" className="flex flex-col items-center gap-1.5 text-center">
        <p className="text-given">{labelOf(quarter)} is over. Its Quests are kept as they were.</p>
        <button type="button" className={`${primary} mt-1.5`} onClick={() => onSetUp(next)}>
          Set up {labelOf(next)}
        </button>
        {/* Not gold: the primary button is the one gold action on a screen (DESIGN.md) */}
        <button type="button" className="min-h-11 text-given underline decoration-line underline-offset-4" onClick={onBackup}>
          Export a backup first
        </button>
      </div>
    )
  }
  const { upcoming, daysToGo, setup } = boundary
  if (setup === 'set-up') {
    return (
      <p data-testid="boundary" className="text-center text-given">
        {labelOf(upcoming)} is set up. It takes over on {dayAndMonth(firstDayOf(upcoming))}.
      </p>
    )
  }
  return (
    <p data-testid="boundary" className="text-center text-given">
      {labelOf(upcoming)} starts in {daysToGo} {daysToGo === 1 ? 'day' : 'days'}.{' '}
      <button type="button" className="min-h-11 font-semibold text-gold-text" onClick={() => onSetUp(upcoming)}>
        {setup === 'started' ? 'Finish setting it up' : 'Set it up'}
      </button>
    </p>
  )
}
