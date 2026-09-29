// A Quest's History: its Versions, newest first, each opening read-only as the read-back (spec §9)

import { useState } from 'react'
import { useCadence } from '../hooks/useCadence'
import { labelOf, type Quarter, versionDay } from '../lib/quarters'
import { capitalised } from '../lib/scaffold'
import { NAMES, type Quest } from '../lib/store'
import { Banners } from './Banners'
import { ReadBack } from './ReadBack'
import { BackButton, ScreenHeader } from './ScreenHeader'

interface Props {
  /** The Quarter History opened in */
  quarter: Quarter
  quest: Quest
  onBack: () => void
}

export function History({ quarter, quest, onBack }: Props) {
  const { snapshot } = useCadence()
  const versions = snapshot.quarters[quarter]?.versions[quest] ?? []
  const newestFirst = [...versions].reverse()
  /** The Version open, by its place newest first */
  const [open, setOpen] = useState<number>()
  const version = open === undefined ? undefined : newestFirst[open]

  if (version) {
    return (
      <>
        <Banners />
        <ScreenHeader left={<BackButton to="History" onClick={() => setOpen(undefined)} />} title={`${NAMES[quest]} Quest`} />
        <main className="mx-auto max-w-[600px] px-gutter pb-safe">
          <p className="mt-3 text-s text-faint tabular-nums">
            {versionDay(version.savedOn, quarter)}
            {open === 0 && ' · Current'}
          </p>
          <ReadBack quest={quest} quarter={quarter} content={version.content} />
        </main>
      </>
    )
  }

  return (
    <>
      <Banners />
      <ScreenHeader left={<BackButton to="Today" onClick={onBack} />} title={`${NAMES[quest]} History`} />
      <main className="mx-auto max-w-[600px] px-gutter pb-safe">
        <p className="mt-3 text-given">How this Quest changed across {labelOf(quarter)}, newest first.</p>
        <ol className="mt-3">
          {newestFirst.map(({ savedOn, content }, index) => (
            <li key={savedOn}>
              <button type="button" onClick={() => setOpen(index)} className="block w-full border-b border-line py-3.5 text-left">
                <span className="flex justify-between gap-3 text-s text-faint tabular-nums">
                  {versionDay(savedOn, quarter)}
                  {index === 0 && <span className="font-semibold text-given">Current</span>}
                </span>
                <span className="mt-0.5 line-clamp-2">{capitalised(content.mainQuest)}</span>
              </button>
            </li>
          ))}
        </ol>
      </main>
    </>
  )
}
