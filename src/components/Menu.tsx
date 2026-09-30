// The menu: one button, top right on Today, opening a bottom sheet. There's no tab bar (spec §6.3).

import type { Ref } from 'react'
import { useCadence } from '../hooks/useCadence'
import { labelOf, type Quarter, reflectionCount } from '../lib/quarters'
import { NAMES, type Quest, QUESTS } from '../lib/store'
import { AppearanceSwitch } from './AppearanceSwitch'
import { lastBackupWords } from './backupWords'
import { chip } from './buttons'
import { Sheet } from './Sheet'

export function MenuButton({ ref, onOpen }: { ref: Ref<HTMLButtonElement>; onOpen: () => void }) {
  const { backupDue } = useCadence()
  return (
    <button
      ref={ref}
      type="button"
      aria-label="Menu"
      aria-description={backupDue ? 'A backup is due' : undefined}
      onClick={onOpen}
      className="absolute top-2.5 right-2.5 grid size-11 place-items-center rounded-full text-given"
    >
      <svg aria-hidden viewBox="0 0 24 24" className="size-[22px] fill-none stroke-current stroke-[1.8]" strokeLinecap="round">
        <path d="M5 9h14M5 15h14" />
      </svg>
      {/* The backup-due dot (spec §6.3) */}
      {backupDue && <i aria-hidden className="absolute top-2.5 right-[9px] size-[7px] rounded-full bg-gold" />}
    </button>
  )
}

interface Props {
  quarter: Quarter
  /** "Day 43 of 92, 49 to go", or "Starts in 2 days" before Day 1 */
  summary: string
  /** The Quarter hasn't ended, so its Quests can be edited (spec §6.4) */
  canEdit: boolean
  onClose: () => void
  onEdit: (quest: Quest) => void
  onHistory: (quest: Quest) => void
  /** The Archive row */
  onArchive: () => void
  /** The Backup row */
  onBackup: () => void
  /** A save from the menu didn't happen */
  onFailure: (error: unknown) => void
}

export function Menu({ quarter, summary, canEdit, onClose, onEdit, onHistory, onArchive, onBackup, onFailure }: Props) {
  const { snapshot, today, backupDue } = useCadence()
  const reflections = reflectionCount(snapshot)
  return (
    <Sheet label="Menu" onClose={onClose}>
      <p className="font-semibold">{labelOf(quarter)}</p>
      <p className="mb-2.5 text-s text-faint tabular-nums">{summary}</p>
      {QUESTS.map((quest) => (
        <div
          key={quest}
          role="group"
          aria-label={`${NAMES[quest]} Quest`}
          className="flex min-h-14 flex-wrap items-center justify-between gap-x-3 gap-y-1.5 border-t border-line py-1.5"
        >
          <span>{NAMES[quest]} Quest</span>
          <span className="flex gap-1.5">
            {/* Data from a newer Cadence can't be changed (spec §13.4) */}
            {canEdit && !snapshot.readOnly && (
              <button type="button" className={chip} onClick={() => onEdit(quest)}>
                {snapshot.editDrafts[quarter]?.[quest] ? 'Edit · unsaved changes' : 'Edit'}
              </button>
            )}
            <button type="button" className={chip} onClick={() => onHistory(quest)}>
              History
            </button>
          </span>
        </div>
      ))}
      <button
        type="button"
        onClick={onArchive}
        className="flex min-h-14 w-full items-center justify-between gap-3 border-t border-line text-left"
      >
        Archive
        <span className="text-faint tabular-nums">
          {reflections === 0 ? 'None yet' : `${reflections} ${reflections === 1 ? 'Reflection' : 'Reflections'}`}
        </span>
      </button>
      <button
        type="button"
        onClick={onBackup}
        className="flex min-h-14 w-full items-center justify-between gap-3 border-t border-line text-left"
      >
        Backup
        <span className={`tabular-nums ${backupDue ? 'text-gold-text' : 'text-faint'}`}>
          {lastBackupWords(snapshot.meta.lastBackupAt, today).menu}
        </span>
      </button>
      <div className="border-t border-line pt-3 pb-1">
        <AppearanceSwitch onFailure={onFailure} />
      </div>
    </Sheet>
  )
}
