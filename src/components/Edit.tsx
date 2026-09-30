// Edit: a finished Quest on the setup surface. The read-back, with Cancel and Save; a tapped part changes on its
// own screen (spec §8).

import { useEffect, useState } from 'react'
import { useCadence } from '../hooks/useCadence'
import { dropKeyboard, holdKeyboard, useVisibleArea } from '../lib/keyboard'
import { currentVersion, type Quarter, whenStarted } from '../lib/quarters'
import { isList, PARTS, type Part, SCAFFOLD } from '../lib/scaffold'
import { changedParts, NAMES, type Quest, type QuestContent, tidyQuest } from '../lib/store'
import { setWriting } from '../lib/writing'
import { Banners } from './Banners'
import { nav, plain, secondary } from './buttons'
import { FailedSave, failureOf } from './FailedSave'
import { PartScreen } from './PartScreen'
import { ReadBack } from './ReadBack'
import { ScreenHeader } from './ScreenHeader'
import { Sheet } from './Sheet'

/** Why Save is off, in the order the owner meets it, or undefined once it can save (spec §8) */
function whyNotSaved(content: QuestContent, changed: Part[]): string | undefined {
  if (changed.length === 0) return 'No changes yet'
  const tidy = tidyQuest(content)
  const empty = PARTS.find((part) => !isList(part) && part !== 'obstacle' && !tidy[part])
  if (empty) return `${SCAFFOLD[empty].name} can't be empty`
  const emptyList = PARTS.find((part) => isList(part) && tidy[part].length === 0)
  if (emptyList) return `Add at least one ${SCAFFOLD[emptyList].item}`
  return undefined
}

interface Props {
  /** The Quarter Edit opened in, which the app shell holds while it's open */
  quarter: Quarter
  quest: Quest
  onClose: () => void
}

export function Edit({ quarter, quest, onClose }: Props) {
  const { snapshot, today, saveEditDraft, discardEdit, saveQuest } = useCadence()
  const saved = currentVersion(snapshot, quarter, quest)!.content
  // A Draft left from before is restored, and says so (spec §8)
  const [restored] = useState(() => snapshot.editDrafts[quarter]?.[quest])
  const [content, setContent] = useState(() => restored?.content ?? saved)
  const [pickedUp, setPickedUp] = useState(() => !!restored)
  /** The part on its own screen, or null on the read-back */
  const [part, setPart] = useState<Part | null>(null)
  /** Cancel with changes asks first */
  const [asking, setAsking] = useState(false)
  /** A save is on its way: another tap would save twice */
  const [saving, setSaving] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const showFailure = (error: unknown) => setFailure(failureOf(error))

  const changed = changedParts(content, saved)
  const why = whyNotSaved(content, changed)

  useVisibleArea()
  // An update never reloads mid-edit (spec §2.3)
  useEffect(() => {
    setWriting(true)
    return () => setWriting(false)
  }, [])

  /** Every change is kept as typed (spec §8) */
  function change(next: QuestContent) {
    setContent(next)
    setPickedUp(false)
    saveEditDraft(quarter, quest, next).catch(showFailure)
  }

  function toPart(to: Part) {
    holdKeyboard()
    setPart(to)
  }

  function cancel() {
    if (changed.length > 0) setAsking(true)
    else onClose()
  }

  function discard() {
    // A Draft the discard can't delete is safe to leave: frozen with its Quarter, or restored by the next Edit
    discardEdit(quarter, quest).catch(() => {})
    onClose()
  }

  /** Closes once the save has landed. A refused save keeps the words on screen, and in the Draft. */
  async function save() {
    setSaving(true)
    try {
      await saveQuest(quarter, quest, content)
      onClose()
    } catch (error) {
      showFailure(error)
    } finally {
      setSaving(false)
    }
  }

  const failed = failure && <FailedSave message={failure} onClose={() => setFailure(null)} />

  if (part) {
    return (
      <div className="writing-screen">
        <Banners />
        <PartScreen
          key={part}
          quest={quest}
          quarter={quarter}
          part={part}
          draft={content}
          onChange={(next) => change({ ...content, ...next })}
          onNext={(next) => {
            change({ ...content, ...next })
            dropKeyboard()
            setPart(null)
          }}
          nextLabel="Done"
          editing
          slideIn
          head={<p className="pt-3 text-s text-faint">Editing your {NAMES[quest]} Quest</p>}
        />
        {failed}
      </div>
    )
  }

  return (
    <>
      <Banners />
      <ScreenHeader
        left={
          <button type="button" className={nav} onClick={cancel}>
            Cancel
          </button>
        }
        title={`${NAMES[quest]} Quest`}
        // Once Save is on, the note says what it would keep, as the menu's "Edit · unsaved changes" does
        note={why ?? 'Unsaved changes'}
        right={
          <button type="button" className={`${nav} font-semibold`} onClick={save} disabled={!!why || saving}>
            Save
          </button>
        }
      />
      <main className="mx-auto max-w-[600px] px-gutter pb-safe">
        {pickedUp && restored && (
          <p role="status" className="mt-3 text-s text-given">
            Your unsaved changes from {whenStarted(restored.startedAt, today)} are still here.
          </p>
        )}
        <p className="mt-3 text-s text-faint">Tap a part to change it.</p>
        <ReadBack quest={quest} quarter={quarter} content={content} onPart={toPart} changed={changed} />
      </main>
      {asking && (
        <Sheet label="Discard your changes?" onClose={() => setAsking(false)}>
          <h2 className="font-semibold">Discard your changes?</h2>
          <div className="mt-5 flex flex-col gap-2.5">
            {/* Not gold: gold marks what to tap next, and a discard can't be undone */}
            <button type="button" className={secondary} onClick={discard}>
              Discard changes
            </button>
            <button type="button" className={plain} onClick={() => setAsking(false)}>
              Keep editing
            </button>
          </div>
        </Sheet>
      )}
      {failed}
    </>
  )
}
