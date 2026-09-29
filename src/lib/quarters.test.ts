import { describe, expect, it } from 'vitest'
import { dayOf, lengthOf, quarterOf, setupTarget } from './quarters'

describe('quarterOf', () => {
  it.each([
    ['2026-01-01', '2026-Q1'],
    ['2026-03-31', '2026-Q1'],
    ['2026-04-01', '2026-Q2'],
    ['2026-06-30', '2026-Q2'],
    ['2026-07-01', '2026-Q3'],
    ['2026-09-29', '2026-Q3'],
    ['2026-10-01', '2026-Q4'],
    ['2026-12-31', '2026-Q4'],
    ['2027-01-01', '2027-Q1'],
  ])('%s is in %s', (date, quarter) => {
    expect(quarterOf(date)).toBe(quarter)
  })
})

describe('lengthOf', () => {
  it.each([
    ['2026-Q4', 92],
    ['2027-Q1', 90],
    ['2028-Q1', 91], // a leap year
    ['2026-Q2', 91],
    ['2026-Q3', 92],
  ] as const)('%s is %i days', (quarter, days) => {
    expect(lengthOf(quarter)).toBe(days)
  })
})

describe('dayOf', () => {
  it.each([
    ['2026-10-01', '2026-Q4', 1],
    ['2026-10-20', '2026-Q4', 20], // set up mid-quarter, it's still Day 20
    ['2026-11-12', '2026-Q4', 43],
    ['2026-12-31', '2026-Q4', 92],
    ['2027-01-01', '2027-Q1', 1],
    ['2027-03-31', '2027-Q1', 90],
  ] as const)('%s is Day %i of %s', (date, quarter, day) => {
    expect(dayOf(date, quarter)).toBe(day)
  })

  it.each([
    ['2026-09-29', '2026-Q4'],
    ['2026-09-30', '2026-Q4'],
    ['2026-12-31', '2027-Q1'],
  ] as const)('%s is before Day 1 of %s', (date, quarter) => {
    expect(dayOf(date, quarter)).toBe('before')
  })
})

describe('setupTarget', () => {
  it.each([
    ['2026-07-01', '2026-Q3'],
    ['2026-09-16', '2026-Q3'],
    ['2026-10-01', '2026-Q4'],
    ['2026-12-17', '2026-Q4'],
    ['2027-01-01', '2027-Q1'], // 1 Jan
    ['2027-03-17', '2027-Q1'],
  ] as const)('on %s it is the Current Quarter, %s', (today, quarter) => {
    expect(setupTarget(today)).toBe(quarter)
  })

  it.each([
    ['2026-09-17', '2026-Q4'], // Q3's last 14 days are 17–30 Sep
    ['2026-09-29', '2026-Q4'],
    ['2026-09-30', '2026-Q4'],
    ['2026-12-18', '2027-Q1'], // Q4's are 18–31 Dec
    ['2026-12-31', '2027-Q1'],
    ['2027-03-18', '2027-Q2'],
  ] as const)('on %s, in the last 14 days, it is the Upcoming Quarter, %s', (today, quarter) => {
    expect(setupTarget(today)).toBe(quarter)
  })
})
