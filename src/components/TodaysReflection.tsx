// The foot of a Quest's page on Today: the pill to write today's Reflection, or the saved one beside its rule
// (spec §7.3)

import { useCadence } from '../hooks/useCadence'
import { holdKeyboard } from '../lib/keyboard'
import { reflectionOn } from '../lib/quarters'
import type { Quest } from '../lib/store'

interface Props {
  quest: Quest
  /** Opens the popup. The tap has already raised the keyboard for its field. */
  onWrite: () => void
}

export function TodaysReflection({ quest, onWrite }: Props) {
  const { snapshot, today } = useCadence()
  const reflection = reflectionOn(snapshot, today, quest)
  // Data from a newer Cadence can't be changed (spec §13.4)
  const canWrite = !snapshot.readOnly
  // iOS raises the keyboard only for a focus inside the tap
  const write = () => {
    holdKeyboard()
    onWrite()
  }

  if (!reflection) {
    return (
      canWrite && (
        <button
          type="button"
          onClick={write}
          className="mt-[22px] inline-flex min-h-11 items-center gap-2 rounded-full border border-gold-dim pr-[18px] pl-3.5 font-semibold text-gold-text"
        >
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="size-[18px] shrink-0 fill-none stroke-current stroke-[1.8]"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 20h4L19 9l-4-4L4 16v4z" />
            <path d="M13.5 6.5l4 4" />
          </svg>
          Write today's Reflection
        </button>
      )
    )
  }
  return (
    <div className="mt-[22px] border-l-2 border-gold-dim pl-3.5">
      {/* Its line breaks are kept */}
      <p className="whitespace-pre-wrap">{reflection.text}</p>
      {canWrite && (
        <button type="button" onClick={write} className="min-h-11 font-semibold text-gold-text">
          Edit today's Reflection
        </button>
      )}
    </div>
  )
}
