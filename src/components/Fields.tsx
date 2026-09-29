// The owner's words on a writing screen: one line of prose, or a list of one-line items (spec §4.1, §5.2)

import { type KeyboardEvent, type Ref, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { holdKeyboard, keepsFocus, takeKeyboard } from '../lib/keyboard'
import { isWritten } from '../lib/scaffold'
import { joinLines, MAX_ITEMS } from '../lib/store'

interface LineProps {
  value: string
  onChange: (value: string) => void
  /** Return: never a line break */
  onEnter: () => void
  /** Backspace in an empty field */
  onBackspaceEmpty?: () => void
  onFocus?: () => void
  onBlur?: () => void
  placeholder: string
  label?: string
  labelledBy?: string
  /** List items start with a capital; a part that continues the Scaffold's sentence doesn't */
  capitalise: boolean
  fieldRef?: Ref<HTMLTextAreaElement>
}

/** One line of the owner's words, in serif ink at L size, growing to fit as it wraps */
export function LineField({ value, onChange, onEnter, onBackspaceEmpty, capitalise, fieldRef, ...rest }: LineProps) {
  const own = useRef<HTMLTextAreaElement>(null)
  useLayoutEffect(() => {
    const field = own.current
    if (!field) return
    field.style.height = 'auto'
    field.style.height = `${field.scrollHeight}px`
  }, [value])

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
      event.preventDefault()
      onEnter()
    } else if (event.key === 'Backspace' && !event.currentTarget.value && onBackspaceEmpty) {
      event.preventDefault()
      onBackspaceEmpty()
    }
  }

  return (
    <textarea
      ref={(field) => {
        own.current = field
        if (typeof fieldRef === 'function') fieldRef(field)
        else if (fieldRef) fieldRef.current = field
      }}
      rows={1}
      value={value}
      placeholder={rest.placeholder}
      aria-label={rest.label}
      aria-labelledby={rest.labelledBy}
      enterKeyHint="next"
      autoCapitalize={capitalise ? 'sentences' : 'none'}
      autoComplete="off"
      spellCheck
      onFocus={rest.onFocus}
      onBlur={rest.onBlur}
      onKeyDown={onKeyDown}
      onChange={(event) => onChange(event.currentTarget.value)}
      className="block w-full resize-none overflow-hidden bg-transparent py-1 font-serif text-l text-ink caret-gold outline-none placeholder:text-faint placeholder:italic"
    />
  )
}

interface PartProps {
  value: string
  onChange: (value: string) => void
  onEnter: () => void
  placeholder: string
  labelledBy: string
}

/** A one-line part: Main Quest, Why it matters, Why it's exciting, Obstacle. Takes the keyboard if it's being held. */
export function PartLine({ onChange, ...props }: PartProps) {
  const field = useRef<HTMLTextAreaElement>(null)
  useEffect(() => takeKeyboard(field.current), [])
  // Every part is one line, so a pasted line break becomes a space (spec §4.1)
  return <LineField {...props} fieldRef={field} capitalise={false} onChange={(value) => onChange(joinLines(value))} />
}

interface ListProps {
  items: string[]
  onChange: (items: string[]) => void
  /** Return on an empty item, or on the fifth: leave the list with these items */
  onLeave: (items: string[]) => void
  /** "Success Metric", to name each item */
  itemName: string
  placeholder: string
}

const without = (items: string[], index: number) => items.filter((_, i) => i !== index)

const toolButton = 'min-h-11 rounded-full bg-raise px-3 text-m text-given disabled:text-faint'

/** Success Metrics or Commitments: one to five one-line items, in the owner's order (spec §5.2) */
export function ListField({ items: stored, onChange, onLeave, itemName, placeholder }: ListProps) {
  const items = stored.length > 0 ? stored : ['']
  const fields = useRef<(HTMLTextAreaElement | null)[]>([])
  /** The item that takes the keyboard after the next render: the last, when the list opens */
  const focusNext = useRef<number | null>(items.length - 1)
  const [focused, setFocused] = useState<number | null>(null)

  useEffect(() => {
    if (focusNext.current === null) return
    takeKeyboard(fields.current[focusNext.current] ?? null)
    focusNext.current = null
  })

  /** Changes the items and moves the keyboard to item `index`, holding it while the items re-render */
  function update(next: string[], index: number) {
    holdKeyboard()
    focusNext.current = index
    onChange(next)
  }

  function type(index: number, text: string) {
    if (!/[\r\n]/.test(text)) return onChange(items.map((item, i) => (i === index ? text : item)))
    // Pasted or dictated lines become separate items, up to five. A paste of line breaks alone leaves the item empty.
    const [first = '', ...rest] = text.split(/[\r\n]+/).map((line) => line.trim()).filter(isWritten)
    const next = [...items.slice(0, index), first, ...rest, ...items.slice(index + 1)].slice(0, MAX_ITEMS)
    update(next, Math.min(index + rest.length, next.length - 1))
  }

  function enter(index: number) {
    if (!isWritten(items[index]!)) {
      // Return on an empty item leaves the list, once something is written
      if (items.some(isWritten)) onLeave(items.length > 1 ? without(items, index) : items)
      return
    }
    if (items.length >= MAX_ITEMS) return onLeave(items)
    update([...items.slice(0, index + 1), '', ...items.slice(index + 1)], index + 1)
  }

  function move(index: number, to: number) {
    const next = [...items]
    ;[next[index], next[to]] = [next[to]!, next[index]!]
    update(next, to)
  }

  function remove(index: number) {
    if (items.length === 1) return update([''], 0)
    update(without(items, index), Math.max(0, index - 1))
  }

  const last = items.at(-1)!
  return (
    <div>
      <ol>
        {items.map((item, index) => (
          // Items are known by their place: moving one moves the keyboard with it
          <li key={index} className={`grid grid-cols-[30px_1fr] border-b ${focused === index ? 'border-given' : 'border-line'}`}>
            <span aria-hidden className="py-1 font-serif text-l text-faint tabular-nums">
              {index + 1}.
            </span>
            <LineField
              fieldRef={(field) => {
                fields.current[index] = field
              }}
              value={item}
              label={`${itemName} ${index + 1}`}
              placeholder={placeholder}
              capitalise
              onChange={(text) => type(index, text)}
              onEnter={() => enter(index)}
              onBackspaceEmpty={items.length > 1 ? () => update(without(items, index), Math.max(0, index - 1)) : undefined}
              onFocus={() => setFocused(index)}
              onBlur={() => setFocused((was) => (was === index ? null : was))}
            />
            {focused === index && (
              <span className="col-start-2 flex gap-1.5 pb-2.5">
                <button type="button" className={toolButton} {...keepsFocus} onClick={() => move(index, index - 1)} disabled={index === 0}>
                  Move up
                </button>
                <button type="button" className={toolButton} {...keepsFocus} onClick={() => move(index, index + 1)} disabled={index === items.length - 1}>
                  Move down
                </button>
                <button type="button" className={toolButton} {...keepsFocus} onClick={() => remove(index)}>
                  Remove
                </button>
              </span>
            )}
          </li>
        ))}
      </ol>
      {items.length >= MAX_ITEMS ? (
        <p className="mt-2.5 ml-[30px] text-m text-faint">That's five, the most a list holds.</p>
      ) : (
        isWritten(last) && (
          <button
            type="button"
            className="ml-[30px] min-h-11 text-m text-given"
            {...keepsFocus}
            onClick={() => update([...items, ''], items.length)}
          >
            Add another
          </button>
        )
      )}
    </div>
  )
}
