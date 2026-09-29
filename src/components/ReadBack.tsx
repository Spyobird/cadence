// A whole Quest as it reads back: each opening in grey sans, then the owner's words in serif ink (spec §5.3)

import type { Quarter } from '../lib/quarters'
import { PARTS, type Part, SCAFFOLD, shownParts } from '../lib/scaffold'
import { type Quest, type QuestContent, tidyQuest } from '../lib/store'

interface Props {
  quest: Quest
  quarter: Quarter
  content: QuestContent
  /** Tapping a part opens its screen. Without it, the Quest is read-only (spec §9). */
  onPart?: (part: Part) => void
  /** While the Quest is being finished */
  disabled?: boolean
  /**
   * In Edit, the parts changed from the saved Version, which a dim gold rule marks. Edit shows every part, an empty
   * one too, so it can be written again (spec §8).
   */
  changed?: Part[]
}

export function ReadBack({ quest, quarter, content, onPart, disabled, changed }: Props) {
  const tidy = tidyQuest(content)
  const parts = changed ? PARTS.map((part): [Part, QuestContent[Part]] => [part, tidy[part]]) : shownParts(tidy)
  return (
    <div className="mt-4">
      {parts.map(([part, value]) => {
        const marked = changed?.includes(part)
        const words = (
          <>
            <span className="text-given">{SCAFFOLD[part].opening(quest, quarter)}</span>{' '}
            {value.length === 0 ? (
              <span className="text-faint italic">
                {part === 'obstacle' ? '… nothing yet. Tap to add one.' : '… not written yet.'}
              </span>
            ) : Array.isArray(value) ? (
              value.map((item, index) => (
                <span key={index} className="mt-1 flex gap-2 font-serif text-ink">
                  <span className="w-6 shrink-0 text-faint tabular-nums">{index + 1}.</span>
                  {item}
                </span>
              ))
            ) : (
              <span className="font-serif text-ink">{value}</span>
            )}
          </>
        )
        const look = `block w-full border-b border-line py-3.5 text-left ${part === 'mainQuest' ? 'text-l' : 'text-m'} ${
          marked ? 'border-l-2 border-l-gold-dim pl-3.5' : ''
        }`
        return onPart ? (
          <button
            key={part}
            type="button"
            onClick={() => onPart(part)}
            disabled={disabled}
            aria-description={marked ? 'Changed' : undefined}
            className={look}
          >
            {words}
          </button>
        ) : (
          <p key={part} className={look}>
            {words}
          </p>
        )
      })}
    </div>
  )
}
