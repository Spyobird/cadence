// Keeping the iPhone's keyboard up between writing screens (spec §5.1). The writing prototype is the model.
//
// iOS raises the keyboard only for a focus() inside a tap or key handler. So a handler that moves to the next
// screen first parks focus on a hidden input, which keeps the keyboard up while the next field renders; that
// field then takes focus from it.

import { type SyntheticEvent, useEffect, useEffectEvent } from 'react'

const PARKING = 'keyboard-parking'

/** A hidden 16 px input (any smaller and iOS zooms), made on first use */
function parking(): HTMLInputElement {
  let input = document.getElementById(PARKING) as HTMLInputElement | null
  if (!input) {
    input = document.createElement('input')
    input.id = PARKING
    input.setAttribute('aria-hidden', 'true')
    input.tabIndex = -1
    input.autocomplete = 'off'
    input.style.cssText =
      'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;font-size:16px;border:0;padding:0;pointer-events:none'
    document.body.append(input)
  }
  return input
}

/** In a tap or key handler: keeps the keyboard up until the next field takes it */
export function holdKeyboard(): void {
  parking().focus({ preventScroll: true })
}

/** Lets the keyboard go down, for a screen with nothing to type */
export function dropKeyboard(): void {
  const active = document.activeElement
  if (active instanceof HTMLElement) active.blur()
}

/** Focuses a field that has just rendered, if the keyboard is being held for it, with the caret at the end */
export function takeKeyboard(field: HTMLTextAreaElement | null): void {
  if (!field || document.activeElement?.id !== PARKING) return
  field.focus({ preventScroll: true })
  field.setSelectionRange(field.value.length, field.value.length)
  field.scrollIntoView?.({ block: 'center' })
}

/** Spread on a button: tapping it doesn't take focus from the field, so the keyboard stays up */
export const keepsFocus = {
  onPointerDown: (event: SyntheticEvent) => event.preventDefault(),
  onMouseDown: (event: SyntheticEvent) => event.preventDefault(),
}

/**
 * Keeps `--visible-top` and `--visible-height` on <html> at the part of the page the keyboard leaves visible
 * (visualViewport), so a writing screen can fit it exactly: the bar sits under the words, above the keyboard.
 */
export function useVisibleArea(): void {
  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return
    const root = document.documentElement
    const measure = () => {
      root.style.setProperty('--visible-top', `${viewport.offsetTop}px`)
      root.style.setProperty('--visible-height', `${viewport.height}px`)
      // Taller than any bar iOS shows without the keyboard
      root.dataset.keyboard = window.innerHeight - viewport.height > 60 ? 'up' : 'down'
    }
    measure()
    viewport.addEventListener('resize', measure)
    viewport.addEventListener('scroll', measure)
    return () => {
      viewport.removeEventListener('resize', measure)
      viewport.removeEventListener('scroll', measure)
      root.style.removeProperty('--visible-top')
      root.style.removeProperty('--visible-height')
      delete root.dataset.keyboard
    }
  }, [])
}

/** Calls `onEscape` when Escape is pressed, from a hardware keyboard, while the component is on screen */
export function useEscape(onEscape: () => void): void {
  const escape = useEffectEvent(onEscape)
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') escape()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])
}
