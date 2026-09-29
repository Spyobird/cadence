// Setup: a Quarter's two Quests, Work then Life, one Scaffold part per screen, then a read-back (spec §5)

import { useEffect, useState } from 'react'
import { useCadence } from '../hooks/useCadence'
import { dropKeyboard, holdKeyboard, keepsFocus, useKeyboardInset } from '../lib/keyboard'
import { isFinished, labelOf, type Quarter, spanOf } from '../lib/quarters'
import { isPartWritten, PARTS, type Part } from '../lib/scaffold'
import {
  BLANK_SETUP_DRAFT,
  isComplete,
  NAMES,
  QUESTS,
  type Quest,
  type QuestContent,
  type QuestDraft,
  type SetupDraft,
  StoreError,
  switchTargetFrom,
  tidyQuest,
} from '../lib/store'
import { setWriting } from '../lib/writing'
import { plain, primary } from './buttons'
import { FailedSave } from './FailedSave'
import { Bar, PartScreen } from './PartScreen'
import { ReadBack } from './ReadBack'

const EMPTY: QuestContent = {
  mainQuest: '',
  whyItMatters: '',
  successMetrics: [],
  whyItsExciting: '',
  obstacle: '',
  commitments: [],
}

interface Props {
  /** The Quarter setup opened on. Setup keeps its own target from then on, since the owner can switch it. */
  quarter: Quarter
  /** From "Q4 2026 is set up" */
  onToday: () => void
}

export function Setup({ quarter: opened, onToday }: Props) {
  const { snapshot, today, saveSetupDraft, switchSetupTarget, finishQuest } = useCadence()
  const [quarter, setQuarter] = useState(opened)
  // The words on screen, which every change saves as typed (spec §5.4)
  const [draft, setDraft] = useState(() => snapshot.setupDrafts[opened] ?? BLANK_SETUP_DRAFT)
  const [pickedUp, setPickedUp] = useState(() => {
    const stored = snapshot.setupDrafts[opened]
    const written = (questDraft: QuestDraft) => PARTS.some((part) => isPartWritten(questDraft, part))
    return !!stored && (QUESTS.some((quest) => written(stored[quest])) || isFinished(snapshot, opened, 'work'))
  })
  /**
   * The part on screen was opened from the read-back, so Done returns there. On resuming a part, written
   * Commitments mean the read-back was reached before, and every later part is written.
   */
  const [fromReadBack, setFromReadBack] = useState(() => {
    const stored = snapshot.setupDrafts[opened]
    return !!stored && stored.at.part !== 'readBack' && isPartWritten(stored[stored.at.quest], 'commitments')
  })
  /** Setup has moved since it opened, so a new step slides in: motion only ever answers a tap */
  const [moved, setMoved] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [setUp, setSetUp] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)

  // Finishing Work moves the stored Draft on to Life's first part, by the store's rule, and setup follows it there
  const stored = snapshot.setupDrafts[quarter]
  if (stored && stored.at.quest !== draft.at.quest) setDraft(stored)

  useKeyboardInset()
  // An update never reloads mid-setup (spec §2.3)
  useEffect(() => {
    setWriting(!setUp)
    return () => setWriting(false)
  }, [setUp])

  function showFailure(error: unknown) {
    if (!(error instanceof StoreError)) throw error
    // The newer-data banner already says why nothing saves
    if (error.reason !== 'read-only') setFailure(error.message)
  }

  const { quest, part } = draft.at
  const questDraft = draft[quest]
  /** The part on screen, counting the read-back as the seventh */
  const index = part === 'readBack' ? PARTS.length : PARTS.indexOf(part)

  function save(next: SetupDraft) {
    setDraft(next)
    setPickedUp(false)
    saveSetupDraft(quarter, next).catch(showFailure)
  }

  function moveTo(to: Part | 'readBack', next: QuestDraft = questDraft) {
    setMoved(true)
    save({ ...draft, at: { quest, part: to }, [quest]: next })
  }

  function toPart(to: Part, fromTheReadBack = false) {
    holdKeyboard()
    setFromReadBack(fromTheReadBack)
    moveTo(to)
  }

  function toReadBack(next: QuestDraft) {
    dropKeyboard()
    setFromReadBack(false)
    moveTo('readBack', next)
  }

  function forward(next: QuestDraft) {
    if (fromReadBack || index === PARTS.length - 1) return toReadBack(next)
    holdKeyboard()
    moveTo(PARTS[index + 1]!, next)
  }

  const switchTo = finishing ? undefined : switchTargetFrom(snapshot, today, quarter)

  function switchTarget(to: Quarter) {
    const from = quarter
    setQuarter(to)
    setPickedUp(false)
    switchSetupTarget(from, to).catch((error: unknown) => {
      setQuarter(from)
      showFailure(error)
    })
  }

  const content: QuestContent = { ...EMPTY, ...questDraft }
  const canFinish = isComplete(tidyQuest(content)) && !finishing

  async function finish() {
    setFinishing(true)
    setMoved(true)
    // Finishing Work moves on to Life's first part, which takes the keyboard
    if (quest === 'work') holdKeyboard()
    try {
      await finishQuest(quarter, quest, content)
      setPickedUp(false)
      if (quest === 'life') setSetUp(true)
    } catch (error) {
      dropKeyboard()
      showFailure(error)
    } finally {
      setFinishing(false)
    }
  }

  if (setUp) {
    return (
      <main className="mx-auto max-w-[600px] px-gutter pt-safe">
        <h1 className="mt-16 text-l font-semibold">{labelOf(quarter)} is set up</h1>
        <button type="button" className={`${primary} mt-8`} onClick={onToday}>
          Go to Today
        </button>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-[600px] px-gutter pt-safe pb-[calc(96px+var(--kb,0px))]">
      <div className="flex items-center justify-between gap-3 border-b border-line">
        <span className="py-3 text-s font-semibold tabular-nums">{`${labelOf(quarter)} · ${spanOf(quarter)}`}</span>
        {switchTo && (
          <button type="button" className="min-h-11 text-m text-given" {...keepsFocus} onClick={() => switchTarget(switchTo)}>
            Switch to {labelOf(switchTo)}
          </button>
        )}
      </div>
      <Progress quest={quest} index={index} />
      <p className="text-s text-faint">
        {NAMES[quest]} Quest, {part === 'readBack' ? 'read it back' : `part ${index + 1} of ${PARTS.length}`}
      </p>
      {pickedUp && (
        <p role="status" className="mt-2 text-s text-given">
          Picked up where you left off.
        </p>
      )}

      {part === 'readBack' ? (
        <>
          <h1 className={`mt-6 text-l font-semibold ${moved ? 'step-in' : ''}`}>Your {NAMES[quest]} Quest</h1>
          <p className="mt-2 text-s text-faint">Read it through. Tap a part to change it.</p>
          <ReadBack quest={quest} quarter={quarter} content={content} onPart={(to) => toPart(to, true)} disabled={finishing} />
          <Bar>
            {/* Nothing else is saved while a Quest is finished: a save holding its words would be refused */}
            <button type="button" className={plain} onClick={() => toPart('commitments')} disabled={finishing}>
              Back
            </button>
            <button type="button" className={primary} onClick={finish} disabled={!canFinish}>
              Finish {NAMES[quest]} Quest
            </button>
          </Bar>
        </>
      ) : (
        <PartScreen
          key={`${quest}-${part}`}
          quest={quest}
          quarter={quarter}
          part={part}
          draft={questDraft}
          onChange={(next) => save({ ...draft, [quest]: next })}
          onNext={forward}
          // Life can't go back into Work: it's finished
          onBack={index > 0 ? () => toPart(PARTS[index - 1]!) : undefined}
          nextLabel={fromReadBack ? 'Done' : 'Next'}
          slideIn={moved}
        />
      )}

      {failure && <FailedSave message={failure} onClose={() => setFailure(null)} />}
    </main>
  )
}

/** Twelve ticks: six for Work, then six for Life */
function Progress({ quest, index }: { quest: Quest; index: number }) {
  return (
    <div aria-hidden className="mt-4 mb-2 flex gap-[3px]">
      {QUESTS.map((each, q) => (
        <div key={each} className={`flex flex-1 gap-[3px] ${q > 0 ? 'ml-2.5' : ''}`}>
          {PARTS.map((_, i) => {
            const now = each === quest && i === index
            const done = q < QUESTS.indexOf(quest) || (each === quest && i < index)
            return <i key={i} className={`h-[3px] flex-1 rounded-sm ${now ? 'bg-ink' : done ? 'bg-faint' : 'bg-line'}`} />
          })}
        </div>
      ))}
    </div>
  )
}
