// One Scaffold part on its own screen: the opening, the owner's words, the hint, and the bar above the keyboard
// (spec §5.1)

import { type ReactNode, useId, useState } from 'react'
import { keepFocus } from '../lib/keyboard'
import type { Quarter } from '../lib/quarters'
import { isList, type Part, SCAFFOLD, STUCK_QUESTIONS, withEnd } from '../lib/scaffold'
import type { Quest, QuestContent } from '../lib/store'
import { primary, secondary, plain } from './buttons'
import { ListField, PartLine } from './Fields'

/** The words written so far, part by part */
export type Words = Partial<QuestContent>

/** Written: a part with more than spaces, or a list with at least one such item */
export function isPartWritten(words: Words, part: Part): boolean {
  const value = words[part] ?? ''
  return [value].flat().some((text) => text.trim() !== '')
}

interface Props {
  quest: Quest
  quarter: Quarter
  part: Part
  words: Words
  onWords: (words: Words) => void
  /** Next, Done or Skip for now: moves on, with these words */
  onNext: (words: Words) => void
  /** Without it, Back is disabled */
  onBack?: () => void
  /** Done, when the part was opened from the read-back */
  nextLabel: 'Next' | 'Done'
}

export function PartScreen({ quest, quarter, part, words, onWords, onNext, onBack, nextLabel }: Props) {
  const openingId = useId()
  const { opening, placeholder, hint, item } = SCAFFOLD[part]
  const written = isPartWritten(words, part)
  // Skipping the Obstacle is a deliberate tap, in Next's place while it's empty (spec §4.1)
  const skip = part === 'obstacle' && !written

  return (
    <>
      <div className="step-in pt-6">
        <p id={openingId} className="mb-2.5 text-l text-given">
          {opening(quest, quarter)}
        </p>
        {isList(part) ? (
          <ListField
            items={words[part] ?? []}
            onChange={(items) => onWords({ ...words, [part]: items })}
            onLeave={(items) => onNext({ ...words, [part]: items })}
            itemName={item!}
            placeholder={placeholder}
          />
        ) : (
          <PartLine
            value={words[part] ?? ''}
            onChange={(value) => onWords({ ...words, [part]: value })}
            onEnter={() => written && onNext(words)}
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
      <Bar>
        <button type="button" className={plain} onPointerDown={keepFocus} onMouseDown={keepFocus} onClick={onBack} disabled={!onBack}>
          Back
        </button>
        {skip ? (
          <button type="button" className={secondary} onPointerDown={keepFocus} onMouseDown={keepFocus} onClick={() => onNext({ ...words, obstacle: '' })}>
            Skip for now
          </button>
        ) : (
          <button type="button" className={primary} onPointerDown={keepFocus} onMouseDown={keepFocus} onClick={() => onNext(words)} disabled={!written}>
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
        onPointerDown={keepFocus}
        onMouseDown={keepFocus}
        onClick={() => setOpen(!open)}
      >
        {open ? 'Hide the questions' : 'Stuck? Four questions to help find it'}
      </button>
      {open && (
        <ul className="mt-1 border-l-2 border-line">
          {STUCK_QUESTIONS[quest].map((question) => (
            <li key={question} className="py-1.5 pl-3.5 font-serif text-m text-given italic">
              {withEnd(question, quarter)}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** The bar above the keyboard: it rides on the keyboard, or clears the home indicator when it's down */
export function Bar({ children }: { children: ReactNode }) {
  return (
    <div className="keyboard-bar z-20 bg-void px-gutter pt-3">
      <div className="mx-auto flex max-w-[600px] items-center justify-between gap-3">{children}</div>
    </div>
  )
}
