// The Backup screen: when the last backup was, whether the iPhone keeps Cadence's storage, export and import
// (spec §12)

import { type ChangeEvent, useEffect, useState } from 'react'
import { useCadence } from '../hooks/useCadence'
import { isPersisted, isStandalone } from '../lib/launch'
import { labelOf, localDate, shortDate } from '../lib/quarters'
import { saveFile } from '../lib/share'
import type { Preview } from '../lib/store'
import { Banners } from './Banners'
import { lastBackupWords } from './backupWords'
import { nav, plain, primary, secondary } from './buttons'
import { FailedSave, failureOf } from './FailedSave'
import { SAFARI_TAB_RISK } from './SafariBanner'
import { Sheet } from './Sheet'

/** "Backup from Mon 12 Oct 2026 · Q4 2026 · 43 Reflections", with every Quarter it holds (spec §12.3) */
function previewLine({ exportedAt, quarters, reflectionCount }: Preview) {
  return [
    `Backup from ${shortDate(localDate(exportedAt), true)}`,
    ...(quarters.length ? [quarters.map(labelOf).join(', ')] : []),
    `${reflectionCount} ${reflectionCount === 1 ? 'Reflection' : 'Reflections'}`,
  ].join(' · ')
}

interface Props {
  /** "Today" from the menu, or "Close" back to setup */
  back: 'Today' | 'Close'
  onBack: () => void
}

export function Backup({ back, onBack }: Props) {
  const { snapshot, today, exportBackup, markBackedUp, readBackup, replaceWith } = useCadence()
  /** Why the file picked can't be imported */
  const [problem, setProblem] = useState<string | null>(null)
  /** The file picked, checked, waiting on the owner's choice */
  const [preview, setPreview] = useState<Preview | null>(null)
  /** The share sheet is open: a second tap would open another, or fall back to a download */
  const [exporting, setExporting] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const showFailure = (error: unknown) => setFailure(failureOf(error))
  const [standalone] = useState(isStandalone)
  const [persisted, setPersisted] = useState<boolean>()
  useEffect(() => {
    if (standalone) void isPersisted().then(setPersisted)
  }, [standalone])

  // Read live: whether iOS keeps the storage isn't stored (spec §13.2). A blank keeps the row's height meanwhile.
  const storage = !standalone
    ? SAFARI_TAB_RISK
    : persisted === undefined
      ? '\u00a0'
      : persisted
        ? 'On this iPhone, marked persistent'
        : 'On this iPhone, not marked persistent, so iOS could clear it to free up space'

  /** In the tap, before any await, so iOS opens the share sheet (spec §12.2) */
  async function exportNow() {
    setExporting(true)
    try {
      if (await saveFile(exportBackup())) await markBackedUp().catch(showFailure)
    } finally {
      setExporting(false)
    }
  }

  /** The whole file is checked before anything is touched (spec §12.3) */
  async function pick(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    // So picking the same file again still counts as a pick
    event.target.value = ''
    if (!file) return
    const checked = await readBackup(file)
    if ('problem' in checked) {
      setProblem(checked.message)
    } else {
      setProblem(null)
      setPreview(checked)
    }
  }

  async function replace(backup: Preview) {
    try {
      await replaceWith(backup)
      setPreview(null)
    } catch (error) {
      showFailure(error)
    }
  }

  return (
    <>
      <Banners />
      <header className="sticky top-0 z-10 bg-void pt-safe">
        <div className="mx-auto grid max-w-[600px] grid-cols-[6em_1fr_6em] items-center px-gutter">
          <button type="button" className={`${nav} flex items-center gap-1 justify-self-start`} onClick={onBack}>
            {back === 'Today' && (
              <svg aria-hidden viewBox="0 0 16 16" className="size-4 fill-none stroke-current stroke-2" strokeLinecap="round">
                <path d="M10 3.5 5.5 8l4.5 4.5" />
              </svg>
            )}
            {back}
          </button>
          <h1 className="text-center font-semibold">Backup</h1>
        </div>
      </header>
      <main className="mx-auto max-w-[600px] px-gutter pb-safe">
        <p className="border-b border-line py-3.5 tabular-nums">
          {lastBackupWords(snapshot.meta.lastBackupAt, today).screen}
        </p>
        <p className="border-b border-line py-3.5">{storage}</p>
        <div className="mt-6 flex flex-wrap gap-2.5">
          <button type="button" className={primary} onClick={exportNow} disabled={exporting}>
            Export backup
          </button>
          {/* A label, so a tap opens the Files picker itself (research: iOS storage durability §7c) */}
          {/* Off for data from a newer Cadence, which nothing may change (spec §13.4): the banner says why */}
          <label
            className={`${secondary} inline-flex cursor-pointer items-center has-focus-visible:outline-2 has-focus-visible:outline-ink has-disabled:cursor-default has-disabled:text-faint`}
          >
            Import a backup
            <input type="file" className="sr-only" onChange={pick} disabled={snapshot.readOnly} />
          </label>
        </div>
        {problem && (
          <p role="status" className="mt-4">
            {problem}
          </p>
        )}
        <p className="mt-6 text-given">
          Export before deleting Cadence from your Home Screen. Deleting the icon erases everything in it.
        </p>
        <p className="mt-10 text-s text-faint">Build {__BUILD__}</p>
      </main>
      {preview && (
        <Sheet label="Replace everything with this backup?" onClose={() => setPreview(null)}>
          <h2 className="font-semibold">Replace everything with this backup?</h2>
          <p className="mt-1 text-given tabular-nums">{previewLine(preview)}</p>
          <div className="mt-5 flex flex-col gap-2.5">
            <button type="button" className={secondary} onClick={exportNow} disabled={exporting}>
              Export what's here first
            </button>
            {/* Not gold: gold marks what to tap next, and this can't be undone */}
            <button type="button" className={secondary} onClick={() => replace(preview)}>
              Replace everything
            </button>
            <button type="button" className={plain} onClick={() => setPreview(null)}>
              Keep what's here
            </button>
          </div>
        </Sheet>
      )}
      {failure && <FailedSave message={failure} onClose={() => setFailure(null)} />}
    </>
  )
}
