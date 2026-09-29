import { useCadence } from '../hooks/useCadence'
import { labelOf, type Quarter } from '../lib/quarters'
import { NAMES, QUESTS } from '../lib/store'
import { AppearanceSwitch } from './AppearanceSwitch'
import { InsetReadout } from './InsetReadout'

// The stand-in for Today until slice 4: both Main Quests, and slice 1's phone-check pieces (spec §15.2)
export function Placeholder({ quarter }: { quarter: Quarter }) {
  const { snapshot } = useCadence()
  const versions = snapshot.quarters[quarter]?.versions
  return (
    <main className="mx-auto max-w-[600px] px-gutter">
      {/* One full screen: the build stamp sits at the bottom, so a gap under 100dvh or the home indicator shows */}
      <section className="flex min-h-dvh flex-col pt-safe pb-safe">
        <h1 className="mt-16 text-l font-semibold">{labelOf(quarter)}</h1>
        <dl className="mt-6">
          {QUESTS.map((quest) => (
            <div key={quest} className="border-t border-line py-4">
              <dt className="text-s text-faint">My {NAMES[quest]} Main Quest is to</dt>
              <dd className="font-serif text-l">{versions?.[quest].at(-1)?.content.mainQuest}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-12 flex flex-col gap-8">
          <AppearanceSwitch />
          <InsetReadout />
        </div>
        <p className="mt-auto pt-8 text-s text-faint">Build {__BUILD__}</p>
      </section>
      {/* Temporary, for phone check step 6: a long page to scroll under the status bar */}
      <ol className="pb-safe">
        {Array.from({ length: 40 }, (_, i) => (
          <li key={i} className="border-t border-line py-3 text-m text-given">
            Scroll check, row {i + 1}
          </li>
        ))}
      </ol>
    </main>
  )
}
