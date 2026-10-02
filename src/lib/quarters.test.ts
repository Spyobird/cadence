import { afterEach, describe, expect, it } from 'vitest'
import {
  archiveDay,
  boundaryOf,
  currentVersion,
  dayOf,
  daysUntil,
  endOf,
  firstDayOf,
  isBackupDue,
  lastDayOf,
  lengthOf,
  monthStartsOf,
  msToMidnight,
  type Quarter,
  quarterOf,
  reflectionCount,
  reflectionDays,
  reflectionOn,
  screenFor,
  setupTarget,
  shortDate,
  spanOf,
  standingIn,
  versionDay,
  weekdayDate,
  whenStarted,
} from './quarters'
import type { QuestContent, Snapshot } from './store'

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
    editDrafts: {},
    meta: { schemaVersion: 1, lastBackupAt: null, appearance: 'system' },
    readOnly: false,
  }
  for (const q of setUp) snapshot.quarters[q] = { versions: { work: [version], life: [version] }, reflections: {} }
  for (const q of workOnly) snapshot.quarters[q] = { versions: { work: [version], life: [] }, reflections: {} }
  for (const q of drafts) snapshot.setupDrafts[q] = { at: { quest: 'life', part: 'mainQuest' }, work: {}, life: {} }
  return snapshot
}

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

describe('shortDate', () => {
  it.each([
    ['2026-10-12', false, 'Mon 12 Oct'],
    ['2026-11-01', false, 'Sun 1 Nov'],
    ['2026-10-12', true, 'Mon 12 Oct 2026'],
    ['2027-01-02', true, 'Sat 2 Jan 2027'],
  ] as const)('%s, with the year %s, reads %s', (date, withYear, line) => {
    expect(shortDate(date, withYear)).toBe(line)
  })
})

describe('versionDay (spec §9)', () => {
  it.each([
    ['2026-11-12', '2026-Q4', '12 Nov · Day 43'],
    ['2026-10-01', '2026-Q4', '1 Oct · Day 1'],
    ['2026-12-31', '2026-Q4', '31 Dec · Day 92'],
    ['2026-09-29', '2026-Q4', '29 Sep · before Day 1'],
    ['2026-12-20', '2027-Q1', '20 Dec · before Day 1'],
  ] as const)('a Version saved on %s in %s reads "%s"', (savedOn, quarter, label) => {
    expect(versionDay(savedOn, quarter)).toBe(label)
  })
})

describe('archiveDay (spec §11)', () => {
  it.each([
    ['2026-11-12', '2026-11-14', 'Thu 12 Nov · Day 43'],
    ['2026-10-01', '2026-10-01', 'Thu 1 Oct · Day 1'],
    ['2026-03-31', '2026-11-14', 'Tue 31 Mar · Day 90'],
    ['2026-12-31', '2027-01-08', 'Thu 31 Dec 2026 · Day 92'],
    ['2027-01-08', '2027-01-08', 'Fri 8 Jan · Day 8'],
  ] as const)('a Day on %s, seen on %s, reads "%s"', (date, today, header) => {
    expect(archiveDay(date, today)).toBe(header)
  })
})

describe('whenStarted (spec §8)', () => {
  it.each([
    ['2026-11-12T10:42', '2026-11-12', '10:42'],
    ['2026-11-12T09:05', '2026-11-12', '09:05'],
    ['2026-11-12T00:00', '2026-11-12', '00:00'],
    ['2026-11-12T23:59', '2026-11-13', 'Thu 23:59'],
    ['2026-11-12T10:42', '2026-11-20', 'Thu 10:42'],
  ] as const)('an edit started at %s, seen on %s, reads "from %s"', (started, today, words) => {
    expect(whenStarted(new Date(started).getTime(), today)).toBe(words)
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

describe('boundaryOf (spec §6.4)', () => {
  const q4 = snapshotWith({ setUp: ['2026-Q4'] })

  it.each([
    ['2026-09-29', 'before Day 1, though Q3 is in its last 14 days'],
    ['2026-10-01', 'Day 1'],
    ['2026-12-17', 'the day before the last 14 days'],
  ])('is nothing on %s, %s', (today) => {
    expect(boundaryOf(q4, '2026-Q4', today)).toBeUndefined()
  })

  it.each([
    ['2026-12-18', 14], // Q4's last 14 days are 18–31 Dec
    ['2026-12-20', 12],
    ['2026-12-31', 1],
  ])('on %s, in the last 14 days, counts %i days to the Upcoming Quarter, not yet set up', (today, daysToGo) => {
    expect(boundaryOf(q4, '2026-Q4', today)).toEqual({ at: 'last-days', upcoming: '2027-Q1', daysToGo, setup: 'not-started' })
  })

  it.each<[string, Parameters<typeof snapshotWith>[0], string]>([
    ['started, with a setup Draft', { setUp: ['2026-Q4'], drafts: ['2027-Q1'] }, 'started'],
    ['started, with only its Work Quest finished', { setUp: ['2026-Q4'], workOnly: ['2027-Q1'], drafts: ['2027-Q1'] }, 'started'],
    ['set up', { setUp: ['2026-Q4', '2027-Q1'] }, 'set-up'],
  ])("knows the Upcoming Quarter's setup is %s", (_, stored, setup) => {
    expect(boundaryOf(snapshotWith(stored), '2026-Q4', '2026-12-20')).toMatchObject({ at: 'last-days', setup })
  })

  it.each<[string, Quarter, string, Quarter]>([
    ['the Quarter on screen ended at midnight', '2026-Q4', '2027-01-01', '2027-Q1'],
    ['a Quarter was skipped entirely', '2026-Q3', '2027-01-15', '2027-Q1'],
    ['the skipped Quarter is in its last 14 days', '2026-Q3', '2026-12-20', '2026-Q4'],
  ])('has ended when %s, and the Current Quarter is the one to set up', (_, quarter, today, next) => {
    expect(boundaryOf(snapshotWith({ setUp: [quarter] }), quarter, today)).toEqual({ at: 'ended', next })
  })
})

describe('isBackupDue (spec §6.3)', () => {
  /** Q4 2026 set up, or these Quarters, and the last backup made at this local time, or never */
  function backedUp(at: string | null, setUp: Quarter[] = ['2026-Q4']) {
    const snapshot = snapshotWith({ setUp })
    snapshot.meta.lastBackupAt = at === null ? null : new Date(at).getTime()
    return snapshot
  }

  it.each<['due' | 'not due', string, string | null, string]>([
    ['due', 'no backup has been made', null, '2026-09-29'],
    ['not due', 'the last one is from today', '2026-11-12T08:00', '2026-11-12'],
    ['not due', 'the last one is 6 days old', '2026-11-06T23:59', '2026-11-12'],
    ['due', 'the last one is 7 days old', '2026-11-05T00:01', '2026-11-12'],
    ['due', 'the Quarter ended after the last one, made on its last day', '2026-12-31T22:00', '2027-01-01'],
    ['not due', 'the last one was made after the Quarter ended', '2027-01-01T09:00', '2027-01-03'],
  ])('is %s when %s', (due, _, at, today) => {
    expect(isBackupDue(backedUp(at), today)).toBe(due === 'due')
  })

  it('counts any set-up Quarter ending, though the next one was set up before it ended', () => {
    expect(isBackupDue(backedUp('2026-12-31T22:00', ['2026-Q4', '2027-Q1']), '2027-01-02')).toBe(true)
    expect(isBackupDue(backedUp('2027-01-01T09:00', ['2026-Q4', '2027-Q1']), '2027-01-02')).toBe(false)
  })

  it('counts nothing ending before anything is set up', () => {
    expect(isBackupDue(backedUp('2026-09-29T10:00', []), '2026-10-02')).toBe(false)
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
    editDrafts: {},
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

describe('reflectionOn', () => {
  const reflection = { text: 'Pages next', prompt: "What's the next step that would move this Quest forward?" }
  const snapshot: Snapshot = {
    quarters: {
      '2026-Q4': {
        versions: { work: [], life: [] },
        reflections: { '2026-11-11': { work: reflection } },
      },
    },
    setupDrafts: {},
    editDrafts: {},
    meta: { schemaVersion: 1, lastBackupAt: null, appearance: 'system' },
    readOnly: false,
  }

  it("is the Quest's Reflection written on that date, from that date's Quarter", () => {
    expect(reflectionOn(snapshot, '2026-11-11', 'work')).toEqual(reflection)
  })

  it('is missing for the other Quest, another Day, or a Quarter with nothing stored', () => {
    expect(reflectionOn(snapshot, '2026-11-11', 'life')).toBeUndefined()
    expect(reflectionOn(snapshot, '2026-11-12', 'work')).toBeUndefined()
    expect(reflectionOn(snapshot, '2027-01-01', 'work')).toBeUndefined()
  })
})

describe('reflectionDays and reflectionCount (spec §11, §6.3)', () => {
  const on = (text: string) => ({ text, prompt: "What's the next step that would move this Quest forward?" })
  const snapshot: Snapshot = {
    quarters: {
      // Stored in any order: Q1 2027 before Q4 2026, and a Quarter's Days out of order
      '2027-Q1': {
        versions: { work: [version], life: [version] },
        reflections: { '2027-01-08': { work: on('Planned the sprint') } },
      },
      '2026-Q4': {
        versions: { work: [version], life: [version] },
        reflections: {
          '2026-11-12': { life: on('Ran 5K'), work: on('Pages next') },
          '2026-12-28': { life: on('A rest week') },
        },
      },
    },
    setupDrafts: {},
    editDrafts: {},
    meta: { schemaVersion: 1, lastBackupAt: null, appearance: 'system' },
    readOnly: false,
  }

  it('lists every Day with a Reflection, newest first, across Quarters', () => {
    expect(reflectionDays(snapshot).map(({ date, reflections }) => [date, Object.keys(reflections).sort()])).toEqual([
      ['2027-01-08', ['work']],
      ['2026-12-28', ['life']],
      ['2026-11-12', ['life', 'work']],
    ])
  })

  it('counts each Quest\'s Reflection on each Day', () => {
    expect(reflectionCount(snapshot)).toBe(4)
  })

  it('has no Days, and counts none, before any Reflection', () => {
    const none = snapshotWith({ setUp: ['2026-Q4'] })
    expect(reflectionDays(none)).toEqual([])
    expect(reflectionCount(none)).toBe(0)
  })
})
