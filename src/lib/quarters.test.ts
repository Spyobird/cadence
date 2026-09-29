import { afterEach, describe, expect, it } from 'vitest'
import {
  currentVersion,
  dayOf,
  daysUntil,
  endOf,
  firstDayOf,
  lastDayOf,
  lengthOf,
  monthStartsOf,
  msToMidnight,
  type Quarter,
  quarterOf,
  screenFor,
  setupTarget,
  spanOf,
  standingIn,
  weekdayDate,
} from './quarters'
import type { QuestContent, Snapshot } from './store'

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

describe('spanOf and endOf', () => {
  it.each([
    ['2027-Q1', '1 Jan – 31 Mar', '31 March 2027'],
    ['2026-Q2', '1 Apr – 30 Jun', '30 June 2026'],
    ['2026-Q3', '1 Jul – 30 Sep', '30 September 2026'],
    ['2026-Q4', '1 Oct – 31 Dec', '31 December 2026'],
  ] as const)('%s runs %s, and ends on %s', (quarter, span, end) => {
    expect(spanOf(quarter)).toBe(span)
    expect(endOf(quarter)).toBe(end)
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

describe('firstDayOf and lastDayOf', () => {
  it.each([
    ['2026-Q4', '2026-10-01', '2026-12-31'],
    ['2027-Q1', '2027-01-01', '2027-03-31'],
    ['2026-Q2', '2026-04-01', '2026-06-30'],
    ['2026-Q3', '2026-07-01', '2026-09-30'],
  ] as const)('%s runs from %s to %s', (quarter, first, last) => {
    expect(firstDayOf(quarter)).toBe(first)
    expect(lastDayOf(quarter)).toBe(last)
  })
})

describe('daysUntil', () => {
  it.each([
    ['2026-09-29', '2026-10-01', 2],
    ['2026-09-30', '2026-10-01', 1],
    ['2026-10-01', '2026-10-01', 0],
    ['2026-12-18', '2027-01-01', 14],
    ['2026-03-28', '2026-03-30', 2], // across the change to summer time, in zones that have one
  ] as const)('from %s to %s is %i days', (from, to, days) => {
    expect(daysUntil(from, to)).toBe(days)
  })
})

describe('standingIn', () => {
  it.each([
    ['2026-09-29', { at: 'before', daysToGo: 2 }],
    ['2026-09-30', { at: 'before', daysToGo: 1 }],
    ['2026-10-01', { at: 'day', day: 1, daysLeft: 91 }],
    ['2026-11-12', { at: 'day', day: 43, daysLeft: 49 }],
    ['2026-12-31', { at: 'day', day: 92, daysLeft: 0 }],
    ['2027-01-01', { at: 'past' }],
    ['2027-02-14', { at: 'past' }],
  ] as const)('on %s, Q4 2026 stands at %j', (date, standing) => {
    expect(standingIn('2026-Q4', date)).toEqual(standing)
  })
})

describe('monthStartsOf', () => {
  it.each([
    ['2026-Q4', [1, 32, 62]],
    ['2027-Q1', [1, 32, 60]],
    ['2028-Q1', [1, 32, 61]], // a leap year
    ['2026-Q3', [1, 32, 63]],
  ] as const)('%s starts a month on Days %j', (quarter, days) => {
    expect(monthStartsOf(quarter)).toEqual(days)
  })
})

describe('msToMidnight', () => {
  const hours = (h: number) => h * 60 * 60 * 1000

  it.each([
    ['2026-11-12T10:00', hours(14)],
    ['2026-11-12T00:00', hours(24)],
    ['2026-11-12T23:59:59.500', 500],
    ['2026-12-31T23:00', hours(1)],
  ] as const)('from %s local time is %i ms', (moment, ms) => {
    expect(msToMidnight(new Date(moment))).toBe(ms)
  })

  describe('where the clocks change (London)', () => {
    const zone = process.env.TZ
    afterEach(() => {
      // process.env holds strings only, so an unset zone is deleted, not set to undefined
      if (zone === undefined) delete process.env.TZ
      else process.env.TZ = zone
    })

    it.each([
      ['2026-10-25T00:30', hours(24.5)], // the clocks go back an hour at 02:00
      ['2026-03-29T00:30', hours(22.5)], // they go forward an hour at 01:00
    ] as const)('from %s local time is %i ms', (moment, ms) => {
      process.env.TZ = 'Europe/London'
      expect(msToMidnight(new Date(moment))).toBe(ms)
    })
  })
})

describe('weekdayDate', () => {
  it.each([
    ['2026-11-12', 'Thursday 12 Nov'],
    ['2026-10-01', 'Thursday 1 Oct'],
    ['2026-09-29', 'Tuesday 29 Sep'],
    ['2027-01-03', 'Sunday 3 Jan'],
    ['2028-02-29', 'Tuesday 29 Feb'],
  ] as const)('%s reads %s', (date, line) => {
    expect(weekdayDate(date)).toBe(line)
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

describe('screenFor', () => {
  const content: QuestContent = {
    mainQuest: 'ship Cadence v1',
    whyItMatters: 'prove it',
    successMetrics: ['v1 on the phone'],
    whyItsExciting: 'it is mine',
    obstacle: '',
    commitments: ['Build every Saturday'],
  }
  const version = { savedOn: '2026-09-29', content }

  /** Stored data with these Quarters set up, these with only Work finished, and setup Drafts for these */
  function snapshotWith({ setUp = [], workOnly = [], drafts = [] }: Partial<Record<'setUp' | 'workOnly' | 'drafts', Quarter[]>>) {
    const snapshot: Snapshot = {
      quarters: {},
      setupDrafts: {},
      meta: { schemaVersion: 1, lastBackupAt: null, appearance: 'system' },
      readOnly: false,
    }
    for (const q of setUp) snapshot.quarters[q] = { versions: { work: [version], life: [version] }, reflections: {} }
    for (const q of workOnly) snapshot.quarters[q] = { versions: { work: [version], life: [] }, reflections: {} }
    for (const q of drafts) snapshot.setupDrafts[q] = { at: { quest: 'life', part: 'mainQuest' }, work: {}, life: {} }
    return snapshot
  }

  describe('1. running', () => {
    it('opens on Today when the Current Quarter is set up', () => {
      expect(screenFor(snapshotWith({ setUp: ['2026-Q4'] }), '2026-11-12')).toEqual({ name: 'running', quarter: '2026-Q4' })
    })

    it('stays on the Current Quarter until it ends, even with the Upcoming one set up', () => {
      const both = snapshotWith({ setUp: ['2026-Q4', '2027-Q1'] })
      expect(screenFor(both, '2026-12-31')).toEqual({ name: 'running', quarter: '2026-Q4' })
      expect(screenFor(both, '2027-01-01')).toEqual({ name: 'running', quarter: '2027-Q1' })
    })
  })

  describe('2. before Day 1', () => {
    it('opens on Today for the Upcoming Quarter once it is set up (29 Sep, Q3 never set up)', () => {
      expect(screenFor(snapshotWith({ setUp: ['2026-Q4'] }), '2026-09-29')).toEqual({ name: 'before-day-1', quarter: '2026-Q4' })
    })

    it('comes before resuming a Draft for the Current Quarter', () => {
      const snapshot = snapshotWith({ setUp: ['2026-Q4'], drafts: ['2026-Q3'] })
      expect(screenFor(snapshot, '2026-09-29')).toEqual({ name: 'before-day-1', quarter: '2026-Q4' })
    })
  })

  describe('3. resume', () => {
    it("resumes the Upcoming Quarter's Draft (29 Sep, Q4 not yet set up)", () => {
      expect(screenFor(snapshotWith({ drafts: ['2026-Q4'] }), '2026-09-29')).toEqual({ name: 'resume', quarter: '2026-Q4' })
    })

    it("resumes the Current Quarter's Draft", () => {
      expect(screenFor(snapshotWith({ drafts: ['2026-Q4'] }), '2026-10-05')).toEqual({ name: 'resume', quarter: '2026-Q4' })
    })

    it('resumes a Quarter with only its Work Quest finished, since it is not set up', () => {
      const snapshot = snapshotWith({ workOnly: ['2026-Q4'], drafts: ['2026-Q4'] })
      expect(screenFor(snapshot, '2026-09-29')).toEqual({ name: 'resume', quarter: '2026-Q4' })
    })

    it('resumes before showing the ended state (1 Jan, Q1 Draft started in December)', () => {
      const snapshot = snapshotWith({ setUp: ['2026-Q4'], drafts: ['2027-Q1'] })
      expect(screenFor(snapshot, '2027-01-01')).toEqual({ name: 'resume', quarter: '2027-Q1' })
    })
  })

  describe('4. ended', () => {
    it('shows the Quarter that just ended, with setup for the Current Quarter', () => {
      expect(screenFor(snapshotWith({ setUp: ['2026-Q4'] }), '2027-01-01')).toEqual({
        name: 'ended',
        quarter: '2026-Q4',
        next: '2027-Q1',
      })
    })

    it('shows the latest set-up Quarter when a Quarter was skipped entirely', () => {
      expect(screenFor(snapshotWith({ setUp: ['2026-Q2', '2026-Q3'] }), '2027-01-15')).toEqual({
        name: 'ended',
        quarter: '2026-Q3',
        next: '2027-Q1',
      })
    })

    it('sets up the Current Quarter even in its last 14 days', () => {
      expect(screenFor(snapshotWith({ setUp: ['2026-Q3'] }), '2026-12-20')).toEqual({
        name: 'ended',
        quarter: '2026-Q3',
        next: '2026-Q4',
      })
    })

    it('ignores a frozen Draft', () => {
      const snapshot = snapshotWith({ setUp: ['2026-Q3'], drafts: ['2026-Q4'] })
      expect(screenFor(snapshot, '2027-01-01')).toEqual({ name: 'ended', quarter: '2026-Q3', next: '2027-Q1' })
    })
  })

  describe('5. setup', () => {
    it('opens a blank setup for the Current Quarter', () => {
      expect(screenFor(snapshotWith({}), '2026-09-10')).toEqual({ name: 'setup', quarter: '2026-Q3' })
    })

    it('aims at the Upcoming Quarter in the last 14 days (29 Sep)', () => {
      expect(screenFor(snapshotWith({}), '2026-09-29')).toEqual({ name: 'setup', quarter: '2026-Q4' })
    })

    it('never resumes a frozen Draft', () => {
      expect(screenFor(snapshotWith({ drafts: ['2026-Q4'] }), '2027-01-01')).toEqual({ name: 'setup', quarter: '2027-Q1' })
    })

    it('does not count a Past Quarter with only its Work Quest finished as set up', () => {
      expect(screenFor(snapshotWith({ workOnly: ['2026-Q3'] }), '2026-11-01')).toEqual({ name: 'setup', quarter: '2026-Q4' })
    })
  })
})

describe('currentVersion', () => {
  const content = (mainQuest: string): QuestContent => ({
    mainQuest,
    whyItMatters: 'prove it',
    successMetrics: ['v1 on the phone'],
    whyItsExciting: 'it is mine',
    obstacle: '',
    commitments: ['Build every Saturday'],
  })
  const snapshot: Snapshot = {
    quarters: {
      '2026-Q4': {
        versions: {
          work: [
            { savedOn: '2026-09-29', content: content('ship v1') },
            { savedOn: '2026-11-12', content: content('ship v1 by December') },
          ],
          life: [],
        },
        reflections: {},
      },
    },
    setupDrafts: {},
    meta: { schemaVersion: 1, lastBackupAt: null, appearance: 'system' },
    readOnly: false,
  }

  it("is a Quest's newest Version", () => {
    expect(currentVersion(snapshot, '2026-Q4', 'work')?.content.mainQuest).toBe('ship v1 by December')
  })

  it('is missing for a Quest not yet finished, or a Quarter with nothing stored', () => {
    expect(currentVersion(snapshot, '2026-Q4', 'life')).toBeUndefined()
    expect(currentVersion(snapshot, '2027-Q1', 'work')).toBeUndefined()
  })
})
