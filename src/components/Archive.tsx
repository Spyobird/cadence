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
        {days.map(({ date, reflections }) => {
          // The copy stored with the Day's first Reflection, so it reads as it did that Day
          const prompt = (reflections.work ?? reflections.life)?.prompt
          return (
            <section key={date} aria-labelledby={`archive-${date}`} className="border-b border-line py-[18px]">
              <h2 id={`archive-${date}`} className="font-semibold tabular-nums">
                {archiveDay(date, today)}
              </h2>
              <p className="mt-0.5 text-s text-faint">{prompt}</p>
              <dl>
                {QUESTS.map((quest) => {
                  const reflection = reflections[quest]
                  return (
                    reflection && (
                      <div key={quest} className="mt-2.5">
                        <dt className="text-s font-semibold text-faint">{NAMES[quest]}</dt>
                        <dd>
                          {/* Cadence updated between the Day's two Reflections, and its Prompts changed */}
                          {reflection.prompt !== prompt && <p className="text-s text-faint">{reflection.prompt}</p>}
                          {/* Its line breaks are kept */}
                          <p className="whitespace-pre-wrap">{reflection.text}</p>
                        </dd>
                      </div>
                    )
                  )
                })}
              </dl>
            </section>
          )
        })}
      </main>
    </>
  )
}
