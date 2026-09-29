// The menu: one button, top right on Today, opening a bottom sheet. There's no tab bar (spec §6.3).

import { type Ref, useEffect, useRef } from 'react'
import { useCadence } from '../hooks/useCadence'
import { dayOf, daysUntil, firstDayOf, labelOf, lastDayOf, lengthOf, type LocalDate, weekdayDate } from '../lib/quarters'
import { NAMES, QUESTS } from '../lib/store'
import { AppearanceSwitch } from './AppearanceSwitch'
import type { TodayScreen } from './Today'

/** "Day 43 of 92, 49 to go", or "Starts in 2 days" before Day 1 */
function summaryOf(screen: TodayScreen, today: LocalDate): string {
  const length = lengthOf(screen.quarter)
  switch (screen.name) {
    case 'running': {
      const day = dayOf(today, screen.quarter) as number
      return `Day ${day} of ${length}, ${length - day} to go`
    }
    case 'before-day-1': {
      const toGo = daysUntil(today, firstDayOf(screen.quarter))
      return `Starts in ${toGo} ${toGo === 1 ? 'day' : 'days'}`
    }
    case 'ended':
      return `Ended ${weekdayDate(lastDayOf(screen.quarter))}`
  }
}

export function MenuButton({ ref, onOpen }: { ref: Ref<HTMLButtonElement>; onOpen: () => void }) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label="Menu"
      onClick={onOpen}
      className="absolute top-2.5 right-2.5 grid size-11 place-items-center rounded-full text-given"
    >
      <svg aria-hidden viewBox="0 0 24 24" className="size-[22px] fill-none stroke-current stroke-[1.8]" strokeLinecap="round">
        <path d="M5 9h14M5 15h14" />
      </svg>
    </button>
  )
}

interface Props {
  screen: TodayScreen
  onClose: () => void
  /** A save from the menu didn't happen */
  onFailure: (error: unknown) => void
}

export function Menu({ screen, onClose, onFailure }: Props) {
  const { today } = useCadence()
  const sheet = useRef<HTMLDivElement>(null)

  useEffect(() => {
    sheet.current?.focus()
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [onClose])

  return (
    <>
      <div data-testid="scrim" aria-hidden className="fade-in fixed inset-0 z-40 bg-void/70" onClick={onClose} />
      <div
        ref={sheet}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        tabIndex={-1}
        className="sheet-in fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[calc(100dvh-24px)] max-w-[600px] overflow-y-auto overscroll-contain rounded-t-[24px] bg-surface px-gutter pt-2 pb-[max(18px,env(safe-area-inset-bottom))] shadow-2xl outline-none"
      >
        <div aria-hidden className="mx-auto mb-3.5 h-[5px] w-9 rounded-full bg-line" />
        <p className="font-semibold">{labelOf(screen.quarter)}</p>
        <p className="mb-2.5 text-s text-faint tabular-nums">{summaryOf(screen, today)}</p>
        {/* Each Quest's Edit and History buttons arrive in slice 7 */}
        {QUESTS.map((quest) => (
          <div key={quest} className="flex min-h-14 items-center border-t border-line">
            {NAMES[quest]} Quest
          </div>
        ))}
        <div className="border-t border-line pt-3 pb-4">
          <AppearanceSwitch onFailure={onFailure} />
        </div>
        {/* Here until the Backup screen, in slice 5, takes it (spec §2.6) */}
        <p className="text-s text-faint">Build {__BUILD__}</p>
      </div>
    </>
  )
}
