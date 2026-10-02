// The dev-only date override (spec §15.2): `?today=2026-12-20` starts Cadence's clock on that date, at the real time
// of day, and `?today=2026-12-31T23:58` at that moment, so every boundary state can be walked on the phone through a
// dev tunnel. main.tsx reads it only in a dev build, so a production build leaves it out.

import { isLocalDate } from './quarters'

/** A time of day on the 24-hour clock, like "23:58" */
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/

/** The clock `?today=` asks for, running on from there, or `real` when it asks for no real date */
export function overriddenClock(search: string, real: () => Date): () => Date {
  const [date, time, ...rest] = (new URLSearchParams(search).get('today') ?? '').split('T')
  if (!isLocalDate(date) || (time !== undefined && !TIME.test(time)) || rest.length > 0) return real
  const now = real()
  const [year, month, day] = date.split('-').map(Number) as [number, number, number]
  const [hours, minutes] = time ? time.split(':').map(Number) : [now.getHours(), now.getMinutes()]
  const start = time
    ? new Date(year, month - 1, day, hours, minutes)
    : new Date(year, month - 1, day, hours, minutes, now.getSeconds(), now.getMilliseconds())
  const offset = start.getTime() - now.getTime()
  return () => new Date(real().getTime() + offset)
}
