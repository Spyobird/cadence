// Pure date maths for Quarters and Days (spec §3). Dates are the phone's local calendar dates, written
// "2026-11-12"; no time zone is stored.

import type { Quest, Snapshot } from './store'

/** A local calendar date, like "2026-11-12" */
export type LocalDate = string

/** A calendar quarter, keyed like "2026-Q4" */
export type Quarter = `${number}-Q${1 | 2 | 3 | 4}`

/** The phone's local calendar date at that moment */
export function localDate(moment: Date): LocalDate {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${moment.getFullYear()}-${pad(moment.getMonth() + 1)}-${pad(moment.getDate())}`
}

const ymd = (date: LocalDate) => date.split('-').map(Number) as [number, number, number]
/** "2026-Q4" as [2026, 4] */
const yearAndNumber = (quarter: Quarter) => quarter.split('-Q').map(Number) as [number, number]

export function quarterOf(date: LocalDate): Quarter {
  const [year, month] = ymd(date)
  return `${year}-Q${Math.ceil(month / 3) as 1 | 2 | 3 | 4}`
}

/** "Q4 2026" */
export function labelOf(quarter: Quarter): string {
  const [year, q] = yearAndNumber(quarter)
  return `Q${q} ${year}`
}

/** A Past Quarter's last day has gone. Quarter keys sort in calendar order. */
export function isPast(quarter: Quarter, today: LocalDate): boolean {
  return quarter < quarterOf(today)
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

/** Days since 1970-01-01, counted on the calendar alone, so daylight saving never shifts a Day */
const dayNumber = (year: number, month: number, day: number) => Date.UTC(year, month - 1, day) / MS_PER_DAY

/** The Quarter's first day, as a day number */
function startOf(quarter: Quarter): number {
  const [year, q] = yearAndNumber(quarter)
  return dayNumber(year, q * 3 - 2, 1)
}

export function nextQuarter(quarter: Quarter): Quarter {
  const [year, q] = yearAndNumber(quarter)
  return q === 4 ? `${year + 1}-Q1` : `${year}-Q${(q + 1) as 2 | 3 | 4}`
}

export function lengthOf(quarter: Quarter): number {
  return startOf(nextQuarter(quarter)) - startOf(quarter)
}

/** The date's Day within the Quarter, counted from the Quarter's first day, or "before" Day 1 */
export function dayOf(date: LocalDate, quarter: Quarter): number | 'before' {
  const day = dayNumber(...ymd(date)) - startOf(quarter) + 1
  return day < 1 ? 'before' : day
}

/** 0 for Sunday to 6 for Saturday, as Date counts them */
export function weekdayOf(date: LocalDate): number {
  return new Date(dayNumber(...ymd(date)) * MS_PER_DAY).getUTCDay()
}

/** How many of a Quarter's last days aim setup at the Upcoming Quarter instead (spec §3.2) */
const LAST_DAYS = 14

/** The Quarter a blank setup is aimed at: the Current Quarter, or the Upcoming one in its last 14 days */
export function setupTarget(today: LocalDate): Quarter {
  const current = quarterOf(today)
  const daysLeft = lengthOf(current) - (dayOf(today, current) as number)
  return daysLeft < LAST_DAYS ? nextQuarter(current) : current
}

/** A Quest is finished once it has a Version (spec §3) */
export function isFinished(snapshot: Snapshot, quarter: Quarter, quest: Quest): boolean {
  return (snapshot.quarters[quarter]?.versions[quest].length ?? 0) > 0
}

/** A Quarter is set up once both of its Quests are finished */
export function isSetUp(snapshot: Snapshot, quarter: Quarter): boolean {
  return isFinished(snapshot, quarter, 'work') && isFinished(snapshot, quarter, 'life')
}

/** Which screen Cadence opens on (spec §3.1) */
export type Screen =
  /** Today for the Current Quarter */
  | { name: 'running'; quarter: Quarter }
  /** Today for the Upcoming Quarter: "Starts in N days" */
  | { name: 'before-day-1'; quarter: Quarter }
  /** Setup, where its Draft was left */
  | { name: 'resume'; quarter: Quarter }
  /** Today for the latest set-up Quarter, read-only, with a button to set up `next` */
  | { name: 'ended'; quarter: Quarter; next: Quarter }
  /** A blank setup */
  | { name: 'setup'; quarter: Quarter }

/** Applies the rules of spec §3.1 in order; the first that matches wins */
export function screenFor(snapshot: Snapshot, today: LocalDate): Screen {
  const current = quarterOf(today)
  const upcoming = nextQuarter(current)
  const setUp = (quarter: Quarter) => isSetUp(snapshot, quarter)

  if (setUp(current)) return { name: 'running', quarter: current }
  if (setUp(upcoming)) return { name: 'before-day-1', quarter: upcoming }
  // A Draft for a Past Quarter is frozen, so only these two can resume
  const draft = [current, upcoming].find((quarter) => snapshot.setupDrafts[quarter])
  if (draft) return { name: 'resume', quarter: draft }
  const latest = (Object.keys(snapshot.quarters) as Quarter[])
    .filter((quarter) => isPast(quarter, today) && setUp(quarter))
    .sort()
    .at(-1)
  if (latest) return { name: 'ended', quarter: latest, next: current }
  return { name: 'setup', quarter: setupTarget(today) }
}
