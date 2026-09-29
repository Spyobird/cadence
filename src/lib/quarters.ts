// Pure date maths for Quarters and Days (spec §3). Dates are the phone's local calendar dates, written
// "2026-11-12"; no time zone is stored.

/** A local calendar date, like "2026-11-12" */
export type LocalDate = string

/** A calendar quarter, keyed like "2026-Q4" */
export type Quarter = `${number}-Q${1 | 2 | 3 | 4}`

const parts = (date: LocalDate) => date.split('-').map(Number) as [number, number, number]

export function quarterOf(date: LocalDate): Quarter {
  const [year, month] = parts(date)
  return `${year}-Q${Math.ceil(month / 3) as 1 | 2 | 3 | 4}`
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

/** Days since 1970-01-01, counted on the calendar alone, so daylight saving never shifts a Day */
const dayNumber = (year: number, month: number, day: number) => Date.UTC(year, month - 1, day) / MS_PER_DAY

/** The Quarter's first day, as a day number */
function startOf(quarter: Quarter): number {
  const [year, q] = quarter.split('-Q').map(Number) as [number, number]
  return dayNumber(year, q * 3 - 2, 1)
}

function nextQuarter(quarter: Quarter): Quarter {
  const [year, q] = quarter.split('-Q').map(Number) as [number, number]
  return q === 4 ? `${year + 1}-Q1` : `${year}-Q${(q + 1) as 2 | 3 | 4}`
}

export function lengthOf(quarter: Quarter): number {
  return startOf(nextQuarter(quarter)) - startOf(quarter)
}

/** The date's Day within the Quarter, counted from the Quarter's first day, or "before" Day 1 */
export function dayOf(date: LocalDate, quarter: Quarter): number | 'before' {
  const day = dayNumber(...parts(date)) - startOf(quarter) + 1
  return day < 1 ? 'before' : day
}

/** How many of a Quarter's last days aim setup at the Upcoming Quarter instead (spec §3.2) */
const LAST_DAYS = 14

/** The Quarter a blank setup is aimed at: the Current Quarter, or the Upcoming one in its last 14 days */
export function setupTarget(today: LocalDate): Quarter {
  const current = quarterOf(today)
  const daysLeft = lengthOf(current) - (dayOf(today, current) as number)
  return daysLeft < LAST_DAYS ? nextQuarter(current) : current
}
