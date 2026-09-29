// A whole Quest as it reads back: each opening in grey sans, then the owner's words in serif ink (spec §5.3)

import type { Quarter } from '../lib/quarters'
import { PARTS, type Part, SCAFFOLD } from '../lib/scaffold'
import { type Quest, type QuestContent, tidyQuest } from '../lib/store'

/** A sentence ends with a full stop, unless the owner gave it other punctuation. Display only. */
const asSentence = (text: string) => (/[.!?…"')]$/.test(text) ? text : `${text}.`)

interface Props {
  quest: Quest
  quarter: Quarter
  content: QuestContent
  /** Tapping a part opens its screen */
  onPart: (part: Part) => void
}

export function ReadBack({ quest, quarter, content, onPart }: Props) {
  const tidy = tidyQuest(content)
  return (
    <div className="mt-4">
      {PARTS.map((part) => {
        const value = tidy[part]
        return (
          <button
            key={part}
            type="button"
            onClick={() => onPart(part)}
            className={`block w-full border-b border-line py-3.5 text-left ${part === 'mainQuest' ? 'text-l' : 'text-m'}`}
          >
            <span className="text-given">{SCAFFOLD[part].opening(quest, quarter)}</span>{' '}
            {Array.isArray(value) ? (
              value.map((item, index) => (
                <span key={index} className="mt-1 flex gap-2 font-serif text-ink">
                  <span className="w-6 shrink-0 text-faint tabular-nums">{index + 1}.</span>
                  {item}
                </span>
              ))
            ) : value ? (
              <span className="font-serif text-ink">{asSentence(value)}</span>
            ) : (
              // Only the Obstacle can be empty: skipped, and still tappable to add one
              part === 'obstacle' && <span className="mt-1 block text-faint">Skipped for now. Tap to add one.</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
