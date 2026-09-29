// One Quest's page on Today: its Main Quest, large, and the rest folded away (spec §6.1)

import { useState } from 'react'
import { firstDayOf, weekdayDate } from '../lib/quarters'
import { PARTS, SCAFFOLD } from '../lib/scaffold'
import { NAMES, type Quest, type QuestContent } from '../lib/store'
import type { TodayScreen } from './Today'

/** Everything under the Main Quest, in Scaffold order */
const FOLDED = PARTS.filter((part) => part !== 'mainQuest')

/** Starts with a capital, for display only: the stored words continue a Scaffold opening, and are unchanged */
const capitalised = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

interface Props {
  quest: Quest
  screen: TodayScreen
  content: QuestContent
}

export function QuestPage({ quest, screen, content }: Props) {
  const { quarter } = screen
  // Pages open folded every time; the fold is never stored
  const [open, setOpen] = useState(false)

  return (
    <section role="tabpanel" id={`page-${quest}`} aria-label={NAMES[quest]} className="w-full shrink-0 snap-start snap-always px-gutter">
      <p className="pt-3.5 text-s text-faint">{SCAFFOLD.mainQuest.opening(quest, quarter)}</p>
      {/* It continues the sentence, so it's shown as stored, starting in lower case */}
      <h2 className="mt-1 font-quest text-l font-extrabold tracking-[-0.025em] text-pretty">{content.mainQuest}</h2>

      <button
        type="button"
        aria-expanded={open}
        aria-controls={`fold-${quest}`}
        onClick={() => setOpen(!open)}
        className="mt-2.5 inline-flex min-h-11 items-center gap-1.5 text-given"
      >
        {open ? 'Fold it away' : 'Read the whole Quest'}
        <svg
          aria-hidden
          viewBox="0 0 16 16"
          className={`size-4 fill-none stroke-faint stroke-2 transition-transform duration-250 motion-reduce:transition-none ${open ? 'rotate-180' : ''}`}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3.5 6l4.5 4.5L12.5 6" />
        </svg>
      </button>

      {/*
       * The fold's rows grow from nothing. A folded part is hidden too, not only clipped, so it can't be read out
       * or focused; the transition keeps it visible while the fold closes.
       */}
      <div
        id={`fold-${quest}`}
        style={{ visibility: open ? 'visible' : 'hidden' }}
        className={`grid transition-[grid-template-rows,visibility] duration-300 motion-reduce:transition-none ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        <div className="min-h-0 overflow-hidden">
          {FOLDED.map((part) => {
            const words = content[part]
            // An empty Obstacle is left out wherever the Quest is shown (spec §4.1)
            if (words.length === 0) return null
            return (
              <div key={part} className="border-t border-line py-3 first:mt-1.5">
                <h3 className="text-s text-faint">{SCAFFOLD[part].name}</h3>
                {Array.isArray(words) ? (
                  <ol className="mt-0.5 list-decimal pl-[1.3em] marker:text-faint">
                    {words.map((item, index) => (
                      <li key={index}>{capitalised(item)}</li>
                    ))}
                  </ol>
                ) : (
                  <p>{capitalised(words)}</p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* The page ends with the Quest's Reflection area (§7), which slice 6 fills in for the running Quarter */}
      {screen.name === 'before-day-1' && (
        <p className="mt-[22px] text-faint">Reflections start on Day 1, {weekdayDate(firstDayOf(quarter))}.</p>
      )}
    </section>
  )
}
