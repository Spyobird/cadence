// A bottom sheet that rises over a scrim (DESIGN.md). A tap on the scrim or Escape closes it.

import { type ReactNode, useEffect, useEffectEvent, useRef } from 'react'

interface Props {
  /** What screen readers call it */
  label: string
  onClose: () => void
  children: ReactNode
}

export function Sheet({ label, onClose, children }: Props) {
  const sheet = useRef<HTMLDivElement>(null)
  const close = useEffectEvent(onClose)

  useEffect(() => {
    sheet.current?.focus()
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [])

  return (
    <>
      <div data-testid="scrim" aria-hidden className="fade-in fixed inset-0 z-40 bg-void/70" onClick={onClose} />
      <div
        ref={sheet}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className="sheet-in fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[calc(100dvh-24px)] max-w-[600px] overflow-y-auto overscroll-contain rounded-t-[24px] bg-surface px-gutter pt-2 pb-[max(18px,env(safe-area-inset-bottom))] shadow-sheet outline-none"
      >
        <div aria-hidden className="mx-auto mb-3.5 h-[5px] w-9 rounded-full bg-line" />
        {children}
      </div>
    </>
  )
}
