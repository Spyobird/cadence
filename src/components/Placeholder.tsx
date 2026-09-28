import { AppearanceSwitch } from './AppearanceSwitch'
import { InsetReadout } from './InsetReadout'

// Slice 1's stand-in for Today: proves the head, the install and updates on the phone (spec §15.2)
export function Placeholder() {
  return (
    <main className="mx-auto max-w-[600px] px-gutter">
      {/* One full screen: the build stamp sits at the bottom, so a gap under 100dvh or the home indicator shows */}
      <section className="flex min-h-dvh flex-col pt-safe pb-safe">
        <h1 className="mt-16 text-l font-semibold">Cadence</h1>
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
