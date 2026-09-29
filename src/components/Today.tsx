// Today: the day ring and the date, then one page per Quest, Work then Life, and the menu (spec §6)

import { useCallback, useRef, useState } from 'react'
import { useCadence } from '../hooks/useCadence'
import { firstDayOf, lastDayOf, type LocalDate, type Screen, weekdayDate } from '../lib/quarters'
import { Banners } from './Banners'
import { FailedSave, failureOf } from './FailedSave'
import { Menu, MenuButton } from './Menu'
import { Pages } from './Pages'
import { Ring } from './Ring'

/** The screens Today shows: the running Quarter, the Upcoming one before its Day 1, or the latest one that has ended */
export type TodayScreen = Extract<Screen, { name: 'running' | 'before-day-1' | 'ended' }>

/** "Thursday 12 Nov", or "Starts Thursday 1 Oct" before Day 1 (spec §6.1, §6.4) */
function dateLine(screen: TodayScreen, today: LocalDate): string {
  switch (screen.name) {
    case 'running':
      return weekdayDate(today)
    case 'before-day-1':
      return `Starts ${weekdayDate(firstDayOf(screen.quarter))}`
    case 'ended':
      return `Ended ${weekdayDate(lastDayOf(screen.quarter))}`
  }
}

export function Today({ screen }: { screen: TodayScreen }) {
  const { today } = useCadence()
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
          <Ring screen={screen} today={today} />
          <p className="text-given tabular-nums">{dateLine(screen, today)}</p>
        </header>
        <Pages screen={screen} />
      </main>
      {menuOpen && <Menu screen={screen} onClose={closeMenu} onFailure={(error) => setFailure(failureOf(error))} />}
      {failure && <FailedSave message={failure} onClose={() => setFailure(null)} />}
    </>
  )
}
