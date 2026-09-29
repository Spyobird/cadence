// The two Quest pages under the ring, Work then Life, swiped or tapped, with a gold dot under the page in view (spec §6.1).
// The page in view is UI-only and never stored.

import { useRef, useState } from 'react'
import { useCadence } from '../hooks/useCadence'
import { NAMES, QUESTS } from '../lib/store'
import { QuestPage } from './QuestPage'
import type { TodayScreen } from './Today'

export function Pages({ screen }: { screen: TodayScreen }) {
  const { snapshot } = useCadence()
  const versions = snapshot.quarters[screen.quarter]?.versions
  const pager = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(0)
  /** The page a tapped tab is scrolling to, so the dot doesn't flick back as the scroll passes through */
  const heading = useRef<number | null>(null)

  function show(index: number) {
    const el = pager.current
    if (!el) return
    heading.current = index
    setInView(index)
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollTo({ left: index * el.clientWidth, behavior: still ? 'auto' : 'smooth' })
  }

  // A swipe moves the dot once the page is past halfway
  function onScroll() {
    const el = pager.current
    if (!el?.clientWidth) return
    const index = Math.round(el.scrollLeft / el.clientWidth)
    if (heading.current !== null) {
      if (index === heading.current) heading.current = null
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
        onTouchStart={() => (heading.current = null)}
        className="flex snap-x snap-mandatory items-start overflow-x-auto overflow-y-hidden overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {QUESTS.map((quest) => {
          const content = versions?.[quest].at(-1)?.content
          return content && <QuestPage key={quest} quest={quest} screen={screen} content={content} />
        })}
      </div>
    </>
  )
}
