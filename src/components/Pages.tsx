// The two Quest pages under the ring, Work then Life, swiped or tapped, with a gold dot under the page in view (spec §6.1).
// The page in view is UI-only and never stored.

import { useRef, useState } from 'react'
import { useCadence } from '../hooks/useCadence'
import { currentVersion, type Quarter } from '../lib/quarters'
import { NAMES, QUESTS } from '../lib/store'
import { QuestPage } from './QuestPage'

interface Props {
  quarter: Quarter
  /** At the foot of each page, while no Reflection can be written yet */
  reflectionsNote?: string
}

export function Pages({ quarter, reflectionsNote }: Props) {
  const { snapshot } = useCadence()
  const pager = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(0)
  /** The page a tapped tab is scrolling to, so the dot doesn't flick back as the scroll passes through */
  const scrollingTo = useRef<number | null>(null)

  function show(index: number) {
    const el = pager.current
    if (!el) return
    scrollingTo.current = index
    setInView(index)
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollTo({ left: index * el.clientWidth, behavior: reducedMotion ? 'auto' : 'smooth' })
  }

  // A swipe moves the dot once the page is past halfway
  function onScroll() {
    const el = pager.current
    if (!el?.clientWidth) return
    const index = Math.round(el.scrollLeft / el.clientWidth)
    if (scrollingTo.current !== null) {
      if (index === scrollingTo.current) scrollingTo.current = null
      return
    }
    setInView(index)
  }

  return (
    <>
      <nav role="tablist" className="sticky top-0 z-10 flex justify-center gap-8 bg-void pt-2.5 pb-4">
        {QUESTS.map((quest, index) => (
          <button
            key={quest}
            type="button"
            role="tab"
            aria-selected={index === inView}
            aria-controls={`page-${quest}`}
            onClick={() => show(index)}
            className={`relative min-h-11 px-2 font-semibold transition-colors after:absolute after:bottom-0.5 after:left-1/2 after:size-[5px] after:-translate-x-1/2 after:rounded-full after:bg-gold after:transition-[opacity,scale] after:content-[''] motion-reduce:transition-none motion-reduce:after:transition-none ${
              index === inView ? 'text-ink after:opacity-100' : 'text-faint after:scale-40 after:opacity-0'
            }`}
          >
            {NAMES[quest]}
          </button>
        ))}
      </nav>
      <div
        ref={pager}
        onScroll={onScroll}
        // A finger on the pages takes over from a tapped tab's scroll
        onTouchStart={() => (scrollingTo.current = null)}
        className="flex snap-x snap-mandatory items-start overflow-x-auto overflow-y-hidden overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {QUESTS.map((quest) => {
          const version = currentVersion(snapshot, quarter, quest)
          return (
            version && (
              <QuestPage key={quest} quest={quest} quarter={quarter} content={version.content} reflectionsNote={reflectionsNote} />
            )
          )
        })}
      </div>
    </>
  )
}
