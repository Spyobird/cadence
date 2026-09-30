// The Archive: every Reflection, across all Quarters, grouped by Day, newest Day first. Read-only (spec §11).

import { useCadence } from '../hooks/useCadence'
import { archiveDay, reflectionDays } from '../lib/quarters'
import { NAMES, QUESTS } from '../lib/store'
import { Banners } from './Banners'
import { BackButton, ScreenHeader } from './ScreenHeader'

export function Archive({ onBack }: { onBack: () => void }) {
  const { snapshot, today } = useCadence()
  const days = reflectionDays(snapshot)
  return (
    <>
      <Banners />
      <ScreenHeader left={<BackButton to="Today" onClick={onBack} />} title="Archive" />
      <main className="mx-auto max-w-[600px] px-gutter pb-safe">
        {days.length === 0 && <p className="mt-3 text-given">No Reflections yet.</p>}
        {days.map(({ date, reflections }) => (
          <section key={date} aria-labelledby={`archive-${date}`} className="border-b border-line py-[18px]">
            <h2 id={`archive-${date}`} className="font-semibold tabular-nums">
              {archiveDay(date, today)}
            </h2>
            {/* The copy stored with the Day's Reflections, which both share, so it reads as it did that Day */}
            <p className="mt-0.5 text-s text-faint">{(reflections.work ?? reflections.life)?.prompt}</p>
            <dl>
              {QUESTS.map((quest) => {
                const reflection = reflections[quest]
                return (
                  reflection && (
                    <div key={quest} className="mt-2.5">
                      <dt className="text-s font-semibold text-given">{NAMES[quest]}</dt>
                      {/* Its line breaks are kept */}
                      <dd className="whitespace-pre-wrap">{reflection.text}</dd>
                    </div>
                  )
                )
              })}
            </dl>
          </section>
        ))}
      </main>
    </>
  )
}
