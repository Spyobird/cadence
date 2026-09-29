// One Scaffold part on its own screen: the opening, the owner's words, the hint, and the bar above the keyboard
// (spec §5.1)

import { type ReactNode, useId, useState } from 'react'
import { keepsFocus } from '../lib/keyboard'
import type { Quarter } from '../lib/quarters'
import { isList, isPartWritten, type Part, SCAFFOLD, STUCK_QUESTIONS, withEnd } from '../lib/scaffold'
import type { Quest, QuestDraft } from '../lib/store'
import { plain, primary, secondary } from './buttons'
import { ListField, PartLine } from './Fields'

interface Props {
  quest: Quest
  quarter: Quarter
  part: Part
  /** The Quest's words so far */
  draft: QuestDraft
  onChange: (draft: QuestDraft) => void
  /** Next, Done or Skip for now: moves on, with these words */
  onNext: (draft: QuestDraft) => void
  /** Without it, Back is disabled */
  onBack?: () => void
  /** Done, when the part was opened from the read-back */
  nextLabel: 'Next' | 'Done'
  /** Reached by a tap, so it slides in; motion only ever answers a tap */
  slideIn: boolean
  /** What sits above the part, and scrolls with it */
  head: ReactNode
}

export function PartScreen({ quest, quarter, part, draft, onChange, onNext, onBack, nextLabel, slideIn, head }: Props) {
  const openingId = useId()
  const { opening, placeholder, hint, item } = SCAFFOLD[part]
  const written = isPartWritten(draft, part)
  // Skipping the Obstacle is a deliberate tap, in Next's place while it's empty (spec §4.1)
  const skip = part === 'obstacle' && !written

  return (
    <>
      <Words>
        {head}
        <div className={`pt-6 ${slideIn ? 'step-in' : ''}`}>
          <p id={openingId} className="mb-2.5 text-l text-given">
            {opening(quest, quarter)}
          </p>
          {isList(part) ? (
            <ListField
              items={draft[part] ?? []}
              onChange={(items) => onChange({ ...draft, [part]: items })}
              onLeave={(items) => onNext({ ...draft, [part]: items })}
              itemName={item!}
              placeholder={placeholder}
            />
          ) : (
            <PartLine
              value={draft[part] ?? ''}
              onChange={(value) => onChange({ ...draft, [part]: value })}
              onEnter={() => written && onNext(draft)}
              placeholder={placeholder}
              labelledBy={openingId}
            />
          )}
          <p className="mt-3.5 text-m text-faint">
            {withEnd(hint, quarter)
              .split('*')
              .map((piece, i) => (i % 2 ? <em key={i}>{piece}</em> : piece))}
          </p>
          {part === 'mainQuest' && <Stuck quest={quest} quarter={quarter} />}
        </div>
      </Words>
      <Bar>
        <button type="button" className={plain} {...keepsFocus} onClick={onBack} disabled={!onBack}>
          Back
        </button>
        {skip ? (
          <button type="button" className={secondary} {...keepsFocus} onClick={() => onNext({ ...draft, obstacle: '' })}>
            Skip for now
          </button>
        ) : (
          <button type="button" className={primary} {...keepsFocus} onClick={() => onNext(draft)} disabled={!written}>
            {nextLabel}
          </button>
        )}
      </Bar>
    </>
  )
}

/** "Stuck? Four questions to help find it": thinking aids, never saved (spec §4.2) */
function Stuck({ quest, quarter }: { quest: Quest; quarter: Quarter }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-2">
      <button
        type="button"
        aria-expanded={open}
        className="min-h-11 text-left text-m text-given underline decoration-line underline-offset-4"
        {...keepsFocus}
        onClick={() => setOpen(!open)}
      >
        {open ? 'Hide the questions' : 'Stuck? Four questions to help find it'}
      </button>
      {open && (
        <ul className="mt-1 border-l-2 border-line">
          {STUCK_QUESTIONS[quest].map((question) => (
            <li key={question} className="py-1.5 pl-3.5 text-m text-given italic">
              {withEnd(question, quarter)}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** The words of a writing screen: the only part that scrolls */
export function Words({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      <main className="mx-auto max-w-[600px] px-gutter pt-safe pb-6">{children}</main>
    </div>
  )
}

/** The bar under the words, above the keyboard: part of the screen, never over the words (spec §5.1) */
export function Bar({ children }: { children: ReactNode }) {
  return (
    <div className="keyboard-bar shrink-0 border-t border-line bg-void px-gutter pt-3">
      <div className="mx-auto flex max-w-[600px] items-center justify-between gap-3">{children}</div>
    </div>
  )
}
