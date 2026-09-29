// Today: the day ring and the date, then one page per Quest, Work then Life, and the menu (spec §6)

import { useCallback, useRef, useState } from 'react'
import { useCadence } from '../hooks/useCadence'
import { firstDayOf, labelOf, lastDayOf, lengthOf, type LocalDate, type Quarter, standingIn, weekdayDate } from '../lib/quarters'
import { Banners } from './Banners'
import { FailedSave, failureOf } from './FailedSave'
import { Menu, MenuButton } from './Menu'
import { Pages } from './Pages'
import { Ring, type RingFace } from './Ring'

/** What Today says about the day, from where today stands in the Quarter on screen */
interface DayWords {
  /** Under the ring: "Thursday 12 Nov", or "Starts Thursday 1 Oct" before Day 1 (§6.1, §6.4) */
  dateLine: string
  /** In the menu: "Day 43 of 92, 49 to go", or "Starts in 2 days" (§6.3) */
  summary: string
  /** At the foot of each page, while no Reflection can be written yet (§6.4) */
  reflectionsNote?: string
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
        // The ring is empty, and counts the days to go
        ring: { passed: 0, numeral: daysToGo, caption: `${days} to go`, label: `${daysToGo} ${days} to go` },
      }
    }
    case 'past':
      // Slice 9 finishes the ended state (§6.4). Until then the ring is full, and reads as the prototype's does.
      return {
        dateLine: weekdayDate(today),
        summary: `Ended ${weekdayDate(lastDayOf(quarter))}`,
        ring: { passed: length, numeral: length, caption: 'ended', label: `${labelOf(quarter)} has ended` },
      }
  }
}

interface Props {
  quarter: Quarter
  /** The menu's Backup row */
  onBackup: () => void
}

export function Today({ quarter, onBackup }: Props) {
  const { today } = useCadence()
  const words = wordsFor(quarter, today)
  const [menuOpen, setMenuOpen] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
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
        </header>
        <Pages quarter={quarter} reflectionsNote={words.reflectionsNote} />
      </main>
      {menuOpen && (
        <Menu
          quarter={quarter}
          summary={words.summary}
          onClose={closeMenu}
          onBackup={onBackup}
          onFailure={(error) => setFailure(failureOf(error))}
        />
      )}
      {failure && <FailedSave message={failure} onClose={() => setFailure(null)} />}
    </>
  )
}
