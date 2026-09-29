// The menu: one button, top right on Today, opening a bottom sheet. There's no tab bar (spec §6.3).

import type { Ref } from 'react'
import { labelOf, type Quarter } from '../lib/quarters'
import { NAMES, QUESTS } from '../lib/store'
import { AppearanceSwitch } from './AppearanceSwitch'
import { Sheet } from './Sheet'

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
  quarter: Quarter
  /** "Day 43 of 92, 49 to go", or "Starts in 2 days" before Day 1 */
  summary: string
  onClose: () => void
  /** The Backup row */
  onBackup: () => void
  /** A save from the menu didn't happen */
  onFailure: (error: unknown) => void
}

export function Menu({ quarter, summary, onClose, onBackup, onFailure }: Props) {
  return (
    <Sheet label="Menu" onClose={onClose}>
      <p className="font-semibold">{labelOf(quarter)}</p>
      <p className="mb-2.5 text-s text-faint tabular-nums">{summary}</p>
      {/* Each Quest's Edit and History buttons arrive in slice 7 */}
      {QUESTS.map((quest) => (
        <div key={quest} className="flex min-h-14 items-center border-t border-line">
          {NAMES[quest]} Quest
        </div>
      ))}
      <button
        type="button"
        onClick={onBackup}
        className="flex min-h-14 w-full items-center justify-between gap-3 border-t border-line text-left"
      >
        Backup
      </button>
      <div className="border-t border-line pt-3 pb-4">
        <AppearanceSwitch onFailure={onFailure} />
      </div>
      {/* Here until the Backup screen, in slice 5, takes it (spec §2.6) */}
      <p className="text-s text-faint">Build {__BUILD__}</p>
    </Sheet>
  )
}
