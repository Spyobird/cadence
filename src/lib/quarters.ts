// Pure date maths for Quarters and Days (spec §3). Dates are the phone's local calendar dates, written
// "2026-11-12"; no time zone is stored.

import type { Quest, Snapshot, Version } from './store'

/** A local calendar date, like "2026-11-12" */
export type LocalDate = string

/** A calendar quarter, keyed like "2026-Q4" */
export type Quarter = `${number}-Q${1 | 2 | 3 | 4}`

const pad = (n: number) => String(n).padStart(2, '0')

/** The phone's local calendar date at that moment */
export function localDate(moment: Date): LocalDate {
  return `${moment.getFullYear()}-${pad(moment.getMonth() + 1)}-${pad(moment.getDate())}`
}

/** How long from that moment until the next local midnight, when the phone's date changes */
export function msToMidnight(moment: Date): number {
  const midnight = new Date(moment.getFullYear(), moment.getMonth(), moment.getDate() + 1)
  return midnight.getTime() - moment.getTime()
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

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const

/** A Quarter's first and last month, and the last month's last day: every Quarter ends on the same date each year */
function monthsOf(quarter: Quarter) {
  const [year, q] = yearAndNumber(quarter)
  const first = MONTHS[q * 3 - 3]!
  const last = MONTHS[q * 3 - 1]!
  return { year, first, last, lastDay: q === 1 || q === 4 ? 31 : 30 }
}

/** "1 Oct – 31 Dec", as the top of setup names the target (spec §3.2) */
export function spanOf(quarter: Quarter): string {
  const { first, last, lastDay } = monthsOf(quarter)
  return `1 ${first.slice(0, 3)} – ${lastDay} ${last.slice(0, 3)}`
}

/** "31 December 2026": the Scaffold's {end} (spec §4.1) */
export function endOf(quarter: Quarter): string {
  const { year, last, lastDay } = monthsOf(quarter)
  return `${lastDay} ${last} ${year}`
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

/** Days since 1970-01-01, counted on the calendar alone, so daylight saving never shifts a Day */
const dayNumber = (year: number, month: number, day: number) => Date.UTC(year, month - 1, day) / MS_PER_DAY

/** The Quarter's first day, as a day number */
function startOf(quarter: Quarter): number {
  const [year, q] = yearAndNumber(quarter)
  return dayNumber(year, q * 3 - 2, 1)
}

/** The date of a day number */
function dateOf(day: number): LocalDate {
  const utc = new Date(day * MS_PER_DAY)
  return `${utc.getUTCFullYear()}-${pad(utc.getUTCMonth() + 1)}-${pad(utc.getUTCDate())}`
}

/** A real calendar date, written like "2026-11-12" */
export function isLocalDate(value: unknown): value is LocalDate {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && dateOf(dayNumber(...ymd(value))) === value
}

/** A Quarter's key, like "2026-Q4" */
export function isQuarter(value: string): value is Quarter {
  return /^\d{4}-Q[1-4]$/.test(value)
}

/** The Quarter's Day 1 */
export function firstDayOf(quarter: Quarter): LocalDate {
  return dateOf(startOf(quarter))
}

/** The Quarter's last Day */
export function lastDayOf(quarter: Quarter): LocalDate {
  return dateOf(startOf(nextQuarter(quarter)) - 1)
}

/** Whole days from one date to a later one: 2 from 29 Sep to 1 Oct */
export function daysUntil(from: LocalDate, to: LocalDate): number {
  return dayNumber(...ymd(to)) - dayNumber(...ymd(from))
}

/** Where a date stands in a Quarter: before its Day 1, on one of its Days, or past its last */
export type Standing =
  | { at: 'before'; daysToGo: number }
  | { at: 'day'; day: number; daysLeft: number }
  | { at: 'past' }

export function standingIn(quarter: Quarter, date: LocalDate): Standing {
  const day = dayOf(date, quarter)
  if (day === 'before') return { at: 'before', daysToGo: daysUntil(date, firstDayOf(quarter)) }
  const length = lengthOf(quarter)
  return day > length ? { at: 'past' } : { at: 'day', day, daysLeft: length - day }
}

/** The Days on which each of the Quarter's three months starts, which the ring marks with a longer tick */
export function monthStartsOf(quarter: Quarter): number[] {
  const [year, q] = yearAndNumber(quarter)
  return [0, 1, 2].map((month) => dayNumber(year, q * 3 - 2 + month, 1) - startOf(quarter) + 1)
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

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const

/** "Thursday 12 Nov", as Today's date line reads (spec §6.1) */
export function weekdayDate(date: LocalDate): string {
  const [, month, day] = ymd(date)
  return `${WEEKDAYS[weekdayOf(date)]} ${day} ${MONTHS[month - 1]!.slice(0, 3)}`
}

/** How many of a Quarter's last days aim setup at the Upcoming Quarter instead (spec §3.2) */
const LAST_DAYS = 14

/** The Quarter a blank setup is aimed at: the Current Quarter, or the Upcoming one in its last 14 days */
export function setupTarget(today: LocalDate): Quarter {
  const current = quarterOf(today)
  const daysLeft = lengthOf(current) - (dayOf(today, current) as number)
  return daysLeft < LAST_DAYS ? nextQuarter(current) : current
}

/** The Quest as it stands: its newest Version, or undefined until it's finished */
export function currentVersion(snapshot: Snapshot, quarter: Quarter, quest: Quest): Version | undefined {
  return snapshot.quarters[quarter]?.versions[quest].at(-1)
}

/** A Quest is finished once it has a Version (spec §3) */
export function isFinished(snapshot: Snapshot, quarter: Quarter, quest: Quest): boolean {
  return currentVersion(snapshot, quarter, quest) !== undefined
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
