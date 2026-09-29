// A pushed screen's sticky header (Edit, History, Backup): the back or Cancel button left, the title centred and the
// action right (DESIGN.md)

import type { ReactNode } from 'react'
import { nav } from './buttons'

interface Props {
  left: ReactNode
  title: string
  /** Under the title, small and faint */
  note?: string
  right?: ReactNode
}

export function ScreenHeader({ left, title, note, right }: Props) {
  return (
    <header className="sticky top-0 z-10 bg-void pt-safe">
      <div className="mx-auto grid max-w-[600px] grid-cols-[6em_1fr_6em] items-center px-gutter">
        <div className="justify-self-start">{left}</div>
        <div className="py-1.5 text-center">
          <h1 className="font-semibold">{title}</h1>
          {note !== undefined && <p className="text-s text-faint">{note}</p>}
        </div>
        <div className="justify-self-end">{right}</div>
      </div>
    </header>
  )
}

/** "‹ Today": back to the screen this one was pushed from */
export function BackButton({ to, chevron = true, onClick }: { to: string; chevron?: boolean; onClick: () => void }) {
  return (
    <button type="button" className={`${nav} flex items-center gap-1`} onClick={onClick}>
      {chevron && (
        <svg aria-hidden viewBox="0 0 16 16" className="size-4 fill-none stroke-current stroke-2" strokeLinecap="round">
          <path d="M10 3.5 5.5 8l4.5 4.5" />
        </svg>
      )}
      {to}
    </button>
  )
}
