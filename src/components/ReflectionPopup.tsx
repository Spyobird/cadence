// The Reflection popup: a box centred over the blurred page, sized to the part the keyboard leaves visible, with
// the day's Prompt and a field (spec §7.4)

import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from 'react'
import { useCadence } from '../hooks/useCadence'
import { dropKeyboard, keepsFocus, takeKeyboard, useVisibleArea } from '../lib/keyboard'
import { promptFor } from '../lib/prompts'
import { type Quarter, reflectionOn, shortDate } from '../lib/quarters'
import { NAMES, type Quest, tidyReflection } from '../lib/store'
import { setWriting } from '../lib/writing'
import { primary, secondary } from './buttons'
import { FailedSave, failureOf } from './FailedSave'

interface Props {
  quest: Quest
  /** The Quarter on Today when the popup opened */
  quarter: Quarter
  onClose: () => void
}

export function ReflectionPopup({ quest, quarter: openedIn, onClose }: Props) {
  const { snapshot, today, saveReflection, removeReflection } = useCadence()
  /** A save belongs to the Quarter the popup opened in, even once the next has taken over Today at midnight */
  const [quarter] = useState(openedIn)
  /** Today's Reflection as it was when the popup opened: Save waits for a change from it */
  const [saved] = useState(() => reflectionOn(snapshot, today, quest)?.text ?? '')
  const [text, setText] = useState(saved)
  const field = useRef<HTMLTextAreaElement>(null)
  const changed = tidyReflection(text) !== saved
  /** Emptying a saved Reflection turns Save into Remove */
  const removing = changed && !tidyReflection(text)
  /** Cancel with changes asks first */
  const [asking, setAsking] = useState(false)
  /** A save is on its way: another tap would save twice */
  const [saving, setSaving] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)

  useVisibleArea()
  // The tap that opened the popup is holding the keyboard for the field
  useEffect(() => takeKeyboard(field.current), [])
  // The field grows with what's written
  useLayoutEffect(() => {
    const grow = field.current
    if (!grow) return
    grow.style.height = 'auto'
    grow.style.height = `${grow.scrollHeight}px`
  }, [text])
  // An update never reloads while a Reflection is being written: its words aren't kept anywhere else (spec §2.3)
  useEffect(() => {
    setWriting(true)
    return () => setWriting(false)
  }, [])

  function close() {
    dropKeyboard()
    onClose()
  }

  function cancel() {
    if (changed) setAsking(true)
    else close()
  }

  // Escape is Cancel, or Keep writing while the question is up
  const escape = useEffectEvent(() => (asking ? setAsking(false) : cancel()))
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') escape()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  /** Closes once the save has landed. A refused save keeps the words in the field, so they can be copied. */
  async function save() {
    setSaving(true)
    try {
      await (removing ? removeReflection(quarter, quest) : saveReflection(quarter, quest, text))
      close()
    } catch (error) {
      dropKeyboard()
      setFailure(failureOf(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div aria-hidden className="fade-in fixed inset-0 z-40 bg-void/70 backdrop-blur-sm" />
      {/* A tap outside the box is Cancel */}
      <div
        data-testid="outside-the-popup"
        className="writing-screen z-50 items-center justify-center p-4"
        onClick={(event) => event.target === event.currentTarget && cancel()}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${NAMES[quest]} Reflection`}
          className="pop-in max-h-full w-full max-w-[440px] overflow-y-auto overscroll-contain rounded-[26px] bg-surface px-5 pt-[22px] pb-3.5 shadow-sheet"
        >
          <p className="text-s text-faint">
            {NAMES[quest]}, {shortDate(today)}
          </p>
          <p className="mt-1 font-semibold">{promptFor(today)}</p>
          <textarea
            ref={field}
            rows={4}
            value={text}
            aria-label="Reflection"
            placeholder="A line or two"
            autoCapitalize="sentences"
            spellCheck
            onChange={(event) => setText(event.currentTarget.value)}
            className="mt-4 block min-h-[120px] w-full resize-none rounded-[14px] bg-void p-3.5 text-ink caret-gold outline-none placeholder:text-faint"
          />
          {saved && <p className="mt-2 text-s text-faint">You can change it until midnight.</p>}
          {asking ? (
            // The keyboard stays up, and the words stay where they are, while the question is asked
            <div role="alertdialog" aria-label="Discard what you wrote?" className="mt-3.5">
              <p className="font-semibold">Discard what you wrote?</p>
              <div className="mt-2.5 flex justify-end gap-2">
                <button type="button" className={secondary} {...keepsFocus} onClick={() => setAsking(false)}>
                  Keep writing
                </button>
                <button type="button" className={secondary} onClick={close}>
                  Discard
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-3.5 flex items-center justify-end gap-2">
              <button type="button" className={secondary} {...keepsFocus} onClick={cancel}>
                Cancel
              </button>
              <button type="button" className={primary} disabled={!changed || saving} onClick={save}>
                {removing ? 'Remove' : 'Save'}
              </button>
            </div>
          )}
        </div>
      </div>
      {failure && <FailedSave message={failure} onClose={() => setFailure(null)} />}
    </>
  )
}
