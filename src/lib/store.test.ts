import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'
import { createStore, entries, get, set, type UseStore } from 'idb-keyval'
import { beforeEach, describe, expect, it } from 'vitest'
import { flakyPhone } from '../test/phone'
import { screenFor } from './quarters'
import { open, type QuestContent, type SetupDraft, StoreError, tidyQuest } from './store'

let now: Date
const clock = () => now
/** Sets the phone's clock, in local time: "2026-09-29T10:00" */
const itIs = (when: string) => {
  now = new Date(when)
}

/** Reads a key as stored, for the records whose shape is the contract (spec §13.2) */
const stored = (key: string) => get(key, createStore('cadence', 'kv'))
/** Puts data on the phone as another build of Cadence left it */
const leftOnPhone = (key: string, value: unknown) => set(key, value, createStore('cadence', 'kv'))

/** A complete Quest, already tidy */
const quest: QuestContent = {
  mainQuest: 'ship Cadence v1',
  whyItMatters: 'it would prove I can finish what I start',
  successMetrics: ['v1 installed on the phone', 'Q4 set up in it'],
  whyItsExciting: 'I will use it every day',
  obstacle: '',
  commitments: ['Build every Saturday morning'],
}

/** Awaits a write the store should refuse, and returns its error */
async function refusal(write: Promise<void>) {
  const error = await write.then(
    () => undefined,
    (e: unknown) => e,
  )
  expect(error).toBeInstanceOf(StoreError)
  return error as StoreError
}

beforeEach(() => {
  indexedDB = new IDBFactory()
  itIs('2026-09-29T10:00')
})

describe('tidyQuest', () => {
  it.each([
    ['  ship Cadence  ', 'ship Cadence'],
    ['ship\nCadence', 'ship Cadence'],
    ['ship \r\n  Cadence', 'ship Cadence'],
    ['ship\n\n\nCadence\n', 'ship Cadence'],
    ['   ', ''],
  ])('makes a part one line: %j becomes %j', (typed, tidy) => {
    expect(tidyQuest({ ...quest, mainQuest: typed, obstacle: typed })).toMatchObject({ mainQuest: tidy, obstacle: tidy })
  })

  it.each([
    [[' v1 on the phone '], ['v1 on the phone']],
    [['', 'v1 on the phone', ' ', '\n'], ['v1 on the phone']],
    [['v1 on\nthe phone', 'Q4 set up'], ['v1 on the phone', 'Q4 set up']],
    [['', ''], []],
  ])('tidies each list item and drops the empty ones: %j becomes %j', (typed, tidy) => {
    expect(tidyQuest({ ...quest, successMetrics: typed, commitments: typed })).toMatchObject({
      successMetrics: tidy,
      commitments: tidy,
    })
  })
})

describe('open', () => {
  it('creates meta on first run', async () => {
    const store = await open(clock)
    const meta = { schemaVersion: 1, lastBackupAt: null, appearance: 'system' }
    expect(store.snapshot().meta).toEqual(meta)
    expect(await stored('meta')).toEqual(meta)
  })
})

describe('writes made back to back', () => {
  it('land in order, each building on the one before', async () => {
    const store = await open(clock)
    const typingLife: SetupDraft = { at: { quest: 'life', part: 'whyItMatters' }, work: {}, life: { mainQuest: 'run 5K' } }
    await Promise.all([store.finishQuest('2026-Q4', 'work', quest), store.saveSetupDraft('2026-Q4', typingLife)])

    for (const snapshot of [store.snapshot(), (await open(clock)).snapshot()]) {
      expect(snapshot.quarters['2026-Q4']?.versions.work).toEqual([{ savedOn: '2026-09-29', content: quest }])
      expect(snapshot.setupDrafts['2026-Q4']).toEqual(typingLife)
    }
  })
})

describe('data from a newer Cadence', () => {
  const newer = { schemaVersion: 2, lastBackupAt: null, appearance: 'dark' }

  it('opens read-only, and refuses every write', async () => {
    await leftOnPhone('meta', newer)
    const store = await open(clock)
    expect(store.snapshot()).toMatchObject({ readOnly: true, meta: newer })

    const draft: SetupDraft = { at: { quest: 'work', part: 'mainQuest' }, work: {}, life: {} }
    expect(await refusal(store.saveSetupDraft('2026-Q4', draft))).toMatchObject({
      reason: 'read-only',
      message: 'This data is from a newer Cadence. Update Cadence to make changes.',
    })
    expect(await refusal(store.switchSetupTarget('2026-Q4', '2026-Q3'))).toMatchObject({ reason: 'read-only' })
    expect(await refusal(store.finishQuest('2026-Q4', 'work', quest))).toMatchObject({ reason: 'read-only' })
    expect(await refusal(store.saveReflection('2026-Q4', 'work', 'Pages next'))).toMatchObject({ reason: 'read-only' })
    expect(await refusal(store.removeReflection('2026-Q4', 'work'))).toMatchObject({ reason: 'read-only' })
    expect(await refusal(store.setAppearance('light'))).toMatchObject({ reason: 'read-only' })
    expect(await refusal(store.markBackedUp())).toMatchObject({ reason: 'read-only' })
    const backup = { exportedAt: 1762941600000, quarters: [], reflectionCount: 0, data: { meta: { ...newer, schemaVersion: 1 } } }
    expect(await refusal(store.replaceWith(backup))).toMatchObject({ reason: 'read-only' })
    itIs('2026-10-01T09:00') // read-only comes first, before any other rule
    expect(await refusal(store.saveSetupDraft('2026-Q3', draft))).toMatchObject({ reason: 'read-only' })
    expect((await open(clock)).snapshot()).toMatchObject({ quarters: {}, setupDrafts: {} })
    expect(await stored('meta')).toEqual(newer)
  })

  it('still exports all of it, keys this build does not know included, as its own schema', async () => {
    await leftOnPhone('meta', newer)
    await leftOnPhone('journal:2026-11-12', { text: 'from a newer Cadence' })
    const file = (await open(clock)).exportBackup()
    expect(JSON.parse(await file.text())).toMatchObject({
      schemaVersion: 2,
      data: { meta: newer, 'journal:2026-11-12': { text: 'from a newer Cadence' } },
    })
  })
})

describe('setAppearance', () => {
  it('keeps the choice in meta, across a reopen, and leaves the rest of meta as it was (spec §2.8)', async () => {
    await leftOnPhone('meta', { schemaVersion: 1, lastBackupAt: 1790000000000, appearance: 'system' })
    const store = await open(clock)
    await store.setAppearance('dark')

    const meta = { schemaVersion: 1, lastBackupAt: 1790000000000, appearance: 'dark' }
    expect(store.snapshot().meta).toEqual(meta)
    expect((await open(clock)).snapshot().meta).toEqual(meta)
  })

  it('tells the listeners once it has landed', async () => {
    const store = await open(clock)
    const seen: string[] = []
    store.subscribe(() => seen.push(store.snapshot().meta.appearance))
    await store.setAppearance('light')
    expect(seen).toEqual(['light'])
  })
})

describe('saveSetupDraft', () => {
  const draft: SetupDraft = {
    at: { quest: 'work', part: 'successMetrics' },
    work: { mainQuest: 'ship Cadence v1 ', whyItMatters: '', successMetrics: ['v1 on the phone', ''] },
    life: {},
  }

  it('keeps the words as typed, and where setup was left, across a reopen', async () => {
    const store = await open(clock)
    await store.saveSetupDraft('2026-Q4', draft)
    expect(store.snapshot().setupDrafts['2026-Q4']).toEqual(draft)

    const reopened = await open(clock)
    expect(reopened.snapshot().setupDrafts['2026-Q4']).toEqual(draft)
    expect(reopened.snapshot().quarters).toEqual({}) // a setup Draft is never a Version
  })

  it('keeps a finished Quest out of the Draft', async () => {
    const store = await open(clock)
    await store.finishQuest('2026-Q4', 'work', quest)
    const backOnWork: SetupDraft = { at: { quest: 'work', part: 'readBack' }, work: {}, life: {} }
    const withWorkWords: SetupDraft = { at: { quest: 'life', part: 'mainQuest' }, work: { mainQuest: 'ship' }, life: {} }

    for (const stale of [backOnWork, withWorkWords]) {
      expect(await refusal(store.saveSetupDraft('2026-Q4', stale))).toMatchObject({ reason: 'not-allowed' })
    }
    expect((await open(clock)).snapshot().setupDrafts['2026-Q4']).toEqual({
      at: { quest: 'life', part: 'mainQuest' },
      work: {},
      life: {},
    })
  })

  it('sets up only the Current or the Upcoming Quarter', async () => {
    const store = await open(clock) // 29 Sep: Q3 is the Current Quarter, and Q4 the Upcoming one
    expect(await refusal(store.saveSetupDraft('2027-Q1', draft))).toMatchObject({ reason: 'not-allowed' })
    expect(await refusal(store.finishQuest('2027-Q1', 'work', quest))).toMatchObject({ reason: 'not-allowed' })
    expect((await open(clock)).snapshot()).toMatchObject({ quarters: {}, setupDrafts: {} })
  })
})

describe('switchSetupTarget', () => {
  const draft: SetupDraft = { at: { quest: 'work', part: 'whyItMatters' }, work: { mainQuest: 'ship' }, life: {} }

  it("moves the Draft's words to the other Quarter", async () => {
    const store = await open(clock)
    await store.saveSetupDraft('2026-Q4', draft)
    await store.switchSetupTarget('2026-Q4', '2026-Q3')

    for (const snapshot of [store.snapshot(), (await open(clock)).snapshot()]) {
      expect(snapshot.setupDrafts).toEqual({ '2026-Q3': draft })
    }
  })

  it('keeps the new target when nothing has been typed yet', async () => {
    const store = await open(clock)
    await store.switchSetupTarget('2026-Q4', '2026-Q3')
    expect(screenFor((await open(clock)).snapshot(), '2026-09-29')).toEqual({ name: 'resume', quarter: '2026-Q3' })
  })

  it('is refused once the Work Quest is finished', async () => {
    const store = await open(clock)
    await store.finishQuest('2026-Q4', 'work', quest)
    expect(await refusal(store.switchSetupTarget('2026-Q4', '2026-Q3'))).toMatchObject({ reason: 'not-allowed' })
    const snapshot = (await open(clock)).snapshot()
    expect(Object.keys(snapshot.setupDrafts)).toEqual(['2026-Q4'])
    expect(Object.keys(snapshot.quarters)).toEqual(['2026-Q4'])
  })

  it('switches only between the Current and the Upcoming Quarter', async () => {
    const store = await open(clock)
    await store.saveSetupDraft('2026-Q4', draft)
    expect(await refusal(store.switchSetupTarget('2026-Q4', '2027-Q1'))).toMatchObject({ reason: 'not-allowed' })
    expect(await refusal(store.switchSetupTarget('2026-Q4', '2026-Q4'))).toMatchObject({ reason: 'not-allowed' })

    itIs('2026-10-01T09:00') // Q4's Draft can't move back into Q3 once Q3 has ended
    expect(await refusal(store.switchSetupTarget('2026-Q4', '2026-Q3'))).toMatchObject({ reason: 'quarter-ended' })
    expect((await open(clock)).snapshot().setupDrafts).toEqual({ '2026-Q4': draft })
  })
})

describe('finishQuest', () => {
  it("makes Work's Version 1, dated today, clears Work's words from the Draft, and moves setup on to Life", async () => {
    const store = await open(clock)
    await store.saveSetupDraft('2026-Q4', { at: { quest: 'work', part: 'readBack' }, work: quest, life: {} })
    await store.finishQuest('2026-Q4', 'work', quest)

    for (const snapshot of [store.snapshot(), (await open(clock)).snapshot()]) {
      expect(snapshot.quarters['2026-Q4']).toEqual({
        versions: { work: [{ savedOn: '2026-09-29', content: quest }], life: [] },
        reflections: {},
      })
      expect(snapshot.setupDrafts['2026-Q4']).toEqual({ at: { quest: 'life', part: 'mainQuest' }, work: {}, life: {} })
    }
  })

  it('stores the Quarter and its Draft under their own keys (spec §13.2)', async () => {
    const store = await open(clock)
    await store.finishQuest('2026-Q4', 'work', quest)
    expect(await stored('quarter:2026-Q4')).toEqual(store.snapshot().quarters['2026-Q4'])
    expect(await stored('setup:2026-Q4')).toEqual(store.snapshot().setupDrafts['2026-Q4'])
  })

  it('dates Version 1 by the Day it is saved on, even a minute after midnight', async () => {
    itIs('2026-10-01T00:01')
    const store = await open(clock)
    await store.finishQuest('2026-Q4', 'work', quest)
    expect(store.snapshot().quarters['2026-Q4']?.versions.work[0]?.savedOn).toBe('2026-10-01')
  })

  it('tidies the words: trimmed, a pasted line break becomes a space, and empty list items are dropped', async () => {
    const store = await open(clock)
    await store.finishQuest('2026-Q4', 'work', {
      mainQuest: '  ship Cadence v1 ',
      whyItMatters: 'it would prove\nI can finish\r\n  what I start',
      successMetrics: [' v1 installed on the phone', '', '   ', 'Q4 set up\nin it '],
      whyItsExciting: 'I will use it every day\n',
      obstacle: '   ',
      commitments: ['', 'Build every Saturday morning  '],
    })
    expect(store.snapshot().quarters['2026-Q4']?.versions.work[0]?.content).toEqual({
      mainQuest: 'ship Cadence v1',
      whyItMatters: 'it would prove I can finish what I start',
      successMetrics: ['v1 installed on the phone', 'Q4 set up in it'],
      whyItsExciting: 'I will use it every day',
      obstacle: '',
      commitments: ['Build every Saturday morning'],
    })
  })

  it.each<[string, Partial<QuestContent>]>([
    ['no Main Quest', { mainQuest: '  ' }],
    ['no Why it matters', { whyItMatters: '' }],
    ["no Why it's exciting", { whyItsExciting: '\n' }],
    ['no Success Metrics', { successMetrics: [] }],
    ['only empty Success Metrics', { successMetrics: ['', ' '] }],
    ['six Success Metrics', { successMetrics: ['1', '2', '3', '4', '5', '6'] }],
    ['no Commitments', { commitments: [''] }],
    ['six Commitments', { commitments: ['1', '2', '3', '4', '5', '6'] }],
  ])('refuses to finish a Quest with %s, and saves nothing', async (_, gap) => {
    const store = await open(clock)
    const draft: SetupDraft = { at: { quest: 'work', part: 'readBack' }, work: quest, life: {} }
    await store.saveSetupDraft('2026-Q4', draft)

    expect(await refusal(store.finishQuest('2026-Q4', 'work', { ...quest, ...gap }))).toMatchObject({
      reason: 'incomplete',
    })
    for (const snapshot of [store.snapshot(), (await open(clock)).snapshot()]) {
      expect(snapshot.quarters).toEqual({})
      expect(snapshot.setupDrafts['2026-Q4']).toEqual(draft)
    }
  })

  it('finishes Work before Life', async () => {
    const store = await open(clock)
    expect(await refusal(store.finishQuest('2026-Q4', 'life', quest))).toMatchObject({ reason: 'not-allowed' })
    expect((await open(clock)).snapshot().quarters).toEqual({})
  })

  it('finishes a Quest only once', async () => {
    const store = await open(clock)
    await store.finishQuest('2026-Q4', 'work', quest)
    const again = { ...quest, mainQuest: 'ship Cadence v2' }
    expect(await refusal(store.finishQuest('2026-Q4', 'work', again))).toMatchObject({
      reason: 'not-allowed',
      message: 'The Work Quest is already finished.',
    })
    expect((await open(clock)).snapshot().quarters['2026-Q4']?.versions.work).toEqual([
      { savedOn: '2026-09-29', content: quest },
    ])
  })

  it('sets the Quarter up once Life is finished, and deletes the Draft', async () => {
    const store = await open(clock)
    await store.finishQuest('2026-Q4', 'work', quest)
    await store.saveSetupDraft('2026-Q4', { at: { quest: 'life', part: 'readBack' }, work: {}, life: quest })
    await store.finishQuest('2026-Q4', 'life', quest)

    for (const snapshot of [store.snapshot(), (await open(clock)).snapshot()]) {
      expect(snapshot.quarters['2026-Q4']?.versions.life).toEqual([{ savedOn: '2026-09-29', content: quest }])
      expect(snapshot.setupDrafts).not.toHaveProperty('2026-Q4')
      expect(screenFor(snapshot, '2026-09-29')).toEqual({ name: 'before-day-1', quarter: '2026-Q4' })
    }
  })
})

describe('a Past Quarter', () => {
  it('freezes its setup Draft at midnight', async () => {
    const store = await open(clock)
    itIs('2026-09-30T23:59')
    const draft: SetupDraft = { at: { quest: 'work', part: 'mainQuest' }, work: { mainQuest: 'ship' }, life: {} }
    await store.saveSetupDraft('2026-Q3', draft)

    itIs('2026-10-01T00:00')
    const changed = { ...draft, work: { mainQuest: 'ship Cadence' } }
    expect(await refusal(store.saveSetupDraft('2026-Q3', changed))).toMatchObject({
      reason: 'quarter-ended',
      message: "Q3 2026 ended at midnight, so this can't be saved.",
    })
    expect((await open(clock)).snapshot().setupDrafts['2026-Q3']).toEqual(draft)
  })

  it('refuses to finish a Quest', async () => {
    itIs('2026-10-01T00:01')
    const store = await open(clock)
    expect(await refusal(store.finishQuest('2026-Q3', 'work', quest))).toMatchObject({ reason: 'quarter-ended' })
    expect((await open(clock)).snapshot().quarters).toEqual({})
  })
})

describe('Reflections', () => {
  const THURSDAYS_PROMPT = "What's getting in the way right now, and what will you do when it shows up?"

  /** Q4 2026, set up on 29 Sep */
  async function setUpQ4() {
    const store = await open(clock)
    await store.finishQuest('2026-Q4', 'work', quest)
    await store.finishQuest('2026-Q4', 'life', { ...quest, mainQuest: 'run 5K in under 25 minutes' })
    return store
  }

  it("keeps today's Reflection on a Quest with a copy of the day's Prompt, across a reopen", async () => {
    const store = await setUpQ4()
    itIs('2026-11-12T10:00')
    await store.saveReflection('2026-Q4', 'work', 'Pages next')

    for (const snapshot of [store.snapshot(), (await open(clock)).snapshot()]) {
      expect(snapshot.quarters['2026-Q4']?.reflections).toEqual({
        '2026-11-12': { work: { text: 'Pages next', prompt: THURSDAYS_PROMPT } },
      })
    }
  })

  it('keeps one per Quest per Day: Work and Life each have their own, and saving again replaces it', async () => {
    const store = await setUpQ4()
    itIs('2026-11-12T10:00')
    await store.saveReflection('2026-Q4', 'work', 'Pages next')
    await store.saveReflection('2026-Q4', 'life', 'Ran 4K')
    itIs('2026-11-12T21:30')
    await store.saveReflection('2026-Q4', 'work', 'Pages done, the fold next')

    for (const snapshot of [store.snapshot(), (await open(clock)).snapshot()]) {
      expect(snapshot.quarters['2026-Q4']?.reflections).toEqual({
        '2026-11-12': {
          work: { text: 'Pages done, the fold next', prompt: THURSDAYS_PROMPT },
          life: { text: 'Ran 4K', prompt: THURSDAYS_PROMPT },
        },
      })
    }
  })

  it('is trimmed at the ends only, keeping its line breaks (spec §4.3)', async () => {
    const store = await setUpQ4()
    itIs('2026-11-12T10:00')
    await store.saveReflection('2026-Q4', 'work', '\n  Shipped the ring.\n\n  Felt good.  \n')
    expect(store.snapshot().quarters['2026-Q4']?.reflections['2026-11-12']?.work?.text).toBe(
      'Shipped the ring.\n\n  Felt good.',
    )
  })

  it('is removed, leaving the Day only with a Reflection, when it is emptied or removed', async () => {
    const store = await setUpQ4()
    itIs('2026-11-12T10:00')
    await store.saveReflection('2026-Q4', 'work', 'Pages next')
    await store.saveReflection('2026-Q4', 'life', 'Ran 4K')

    await store.saveReflection('2026-Q4', 'work', ' \n ')
    expect(store.snapshot().quarters['2026-Q4']?.reflections).toEqual({
      '2026-11-12': { life: { text: 'Ran 4K', prompt: THURSDAYS_PROMPT } },
    })
    await store.removeReflection('2026-Q4', 'life')
    for (const snapshot of [store.snapshot(), (await open(clock)).snapshot()]) {
      expect(snapshot.quarters['2026-Q4']?.reflections).toEqual({})
    }
  })

  it("belongs to the Day it's saved on: at 00:01 it's the new Day's, with its Prompt, and yesterday's stays read-only", async () => {
    const store = await setUpQ4()
    itIs('2026-11-12T23:58')
    await store.saveReflection('2026-Q4', 'work', 'Pages next')

    itIs('2026-11-13T00:01')
    await store.saveReflection('2026-Q4', 'work', 'Pages next, and the fold')
    await store.removeReflection('2026-Q4', 'work')
    await store.saveReflection('2026-Q4', 'life', 'Ran 4K')

    expect((await open(clock)).snapshot().quarters['2026-Q4']?.reflections).toEqual({
      '2026-11-12': { work: { text: 'Pages next', prompt: THURSDAYS_PROMPT } },
      '2026-11-13': {
        life: { text: 'Ran 4K', prompt: 'Looking at the week so far, are your Commitments actually moving your Success Metrics?' },
      },
    })
  })

  it("is refused once its Quarter has ended at midnight, and nothing is saved", async () => {
    const store = await setUpQ4()
    itIs('2026-12-31T23:58')
    await store.saveReflection('2026-Q4', 'work', 'The last Day')

    itIs('2027-01-01T00:01')
    for (const write of [
      store.saveReflection('2026-Q4', 'work', 'The last Day, and a bit'),
      store.removeReflection('2026-Q4', 'work'),
    ]) {
      expect(await refusal(write)).toMatchObject({
        reason: 'quarter-ended',
        message: "Q4 2026 ended at midnight, so this can't be saved.",
      })
    }
    expect((await open(clock)).snapshot().quarters['2026-Q4']?.reflections).toEqual({
      '2026-12-31': { work: { text: 'The last Day', prompt: THURSDAYS_PROMPT } },
    })
  })

  it('is refused before Day 1 (spec §6.4)', async () => {
    const store = await setUpQ4() // on 29 Sep, before Q4's Day 1
    expect(await refusal(store.saveReflection('2026-Q4', 'work', 'Ready'))).toMatchObject({
      reason: 'not-allowed',
      message: 'Reflections start on Day 1 of Q4 2026.',
    })
    itIs('2026-11-12T10:00') // nor for a Quarter further ahead
    expect(await refusal(store.saveReflection('2027-Q1', 'work', 'Ready'))).toMatchObject({ reason: 'not-allowed' })
    expect((await open(clock)).snapshot().quarters).toMatchObject({ '2026-Q4': { reflections: {} } })
    expect((await open(clock)).snapshot().quarters).not.toHaveProperty('2027-Q1')
  })

  it('is refused in a Quarter that is not set up', async () => {
    itIs('2026-10-01T09:00')
    const store = await open(clock)
    await store.finishQuest('2026-Q4', 'work', quest)
    for (const quarter of ['2026-Q4', '2026-Q3'] as const) {
      expect(await refusal(store.saveReflection(quarter, 'work', 'Pages next'))).toMatchObject({
        reason: quarter === '2026-Q4' ? 'not-allowed' : 'quarter-ended',
      })
    }
    expect((await open(clock)).snapshot().quarters['2026-Q4']?.reflections).toEqual({})
  })
})

describe('the Backup', () => {
  /** Q4 2026 on 12 Nov, in use: a Version edited since setup, and Reflections on two Days */
  const q4 = {
    versions: {
      work: [
        { savedOn: '2026-09-29', content: quest },
        { savedOn: '2026-11-02', content: { ...quest, obstacle: 'late client calls' } },
      ],
      life: [{ savedOn: '2026-09-29', content: { ...quest, mainQuest: 'run 5K in under 25 minutes' } }],
    },
    reflections: {
      '2026-11-11': { work: { text: 'Shipped the ring.\nFelt good.', prompt: "What's the next step that would move this Quest forward?" } },
      '2026-11-12': {
        work: { text: 'Pages next', prompt: "What's getting in the way right now, and what will you do when it shows up?" },
        life: { text: 'Ran 4K', prompt: "What's getting in the way right now, and what will you do when it shows up?" },
      },
    },
  }
  /** Every key a phone in use holds, Drafts included (spec §13.2) */
  const inUse = {
    meta: { schemaVersion: 1, lastBackupAt: 1762500000000, appearance: 'dark' },
    'quarter:2026-Q4': q4,
    'setup:2027-Q1': { at: { quest: 'work', part: 'whyItMatters' }, work: { mainQuest: 'write the book' }, life: {} },
    'edit:2026-Q4:life': { startedAt: 1762930000000, content: { ...quest, mainQuest: 'run 5K in under 24 minutes' } },
  }

  /** Every key as stored, as an object */
  const everythingStored = async () => Object.fromEntries(await entries(createStore('cadence', 'kv')))

  beforeEach(async () => {
    itIs('2026-11-12T10:00')
    for (const [key, value] of Object.entries(inUse)) await leftOnPhone(key, value)
  })

  it('exports every stored key, Drafts included, in a file named for today (spec §12.2)', async () => {
    const store = await open(clock)
    const file = store.exportBackup()

    expect(file.name).toBe('cadence-backup-2026-11-12.json')
    expect(file.type).toBe('application/json')
    expect(JSON.parse(await file.text())).toEqual({
      app: 'cadence',
      schemaVersion: 1,
      exportedAt: new Date('2026-11-12T10:00').getTime(),
      data: inUse,
    })
  })

  it('round trips: importing the export puts back exactly what was stored, dated by the export (spec §12.3)', async () => {
    const store = await open(clock)
    const file = store.exportBackup()
    const exportedAt = new Date('2026-11-12T10:00').getTime()

    // Then the phone moves on: a new Appearance, and Q1 2027's Work Quest finished, which adds its key
    itIs('2026-11-14T08:00')
    await store.setAppearance('light')
    await store.finishQuest('2027-Q1', 'work', quest)

    const backup = await store.readBackup(file)
    if ('problem' in backup) throw new Error(backup.message)
    await store.replaceWith(backup)

    const restored = { ...inUse, meta: { ...inUse.meta, lastBackupAt: exportedAt } }
    expect(await everythingStored()).toEqual(restored)
    const reopened = (await open(clock)).snapshot()
    expect(store.snapshot()).toEqual(reopened)
    expect(reopened).toMatchObject({ meta: restored.meta, quarters: { '2026-Q4': q4 } })
  })

  it('marks when a backup was made, keeping the rest of meta as it was (spec §12.2)', async () => {
    const store = await open(clock)
    await store.markBackedUp()

    const meta = { ...inUse.meta, lastBackupAt: new Date('2026-11-12T10:00').getTime() }
    expect(store.snapshot().meta).toEqual(meta)
    expect((await open(clock)).snapshot().meta).toEqual(meta)
  })

  it('keeps everything as it was when the replace fails', async () => {
    const phone = flakyPhone()
    const store = await open(clock, phone.connect)
    const backup = await store.readBackup(picked(backupText({ data: { meta: inUse.meta } })))
    if ('problem' in backup) throw new Error(backup.message)
    phone.failNextWrites('QuotaExceededError')

    expect(await refusal(store.replaceWith(backup))).toMatchObject({ reason: 'storage-full' })
    expect(await everythingStored()).toEqual(inUse)
    expect(store.snapshot()).toEqual((await open(clock)).snapshot())
    expect(JSON.parse(await store.exportBackup().text()).data).toEqual(inUse)
  })

  it('previews when the backup was made, every Quarter it holds, and how many Reflections', async () => {
    const store = await open(clock)
    const data = { ...inUse, 'quarter:2026-Q3': { versions: { work: [], life: [] }, reflections: {} } }
    expect(await store.readBackup(picked(backupText({ data })))).toMatchObject({
      exportedAt: 1762941600000,
      quarters: ['2026-Q3', '2026-Q4', '2027-Q1'], // Q1 2027 has only a setup Draft
      reflectionCount: 3,
    })
  })

  /** A file as the Files picker hands it over */
  const picked = (text: string) => new File([text], 'picked.json', { type: 'application/json' })
  /** A Backup file's text, as exported on 12 Nov, with any of its fields changed */
  const backupText = (changes: Record<string, unknown> = {}) =>
    JSON.stringify({ app: 'cadence', schemaVersion: 1, exportedAt: 1762941600000, data: inUse, ...changes })

  it.each([
    ['a photo', '\u0089PNG\r\n'],
    ['a note', 'Buy milk'],
    ['empty', ''],
    ['JSON that is not an object', '[1, 2]'],
    ["another app's export", JSON.stringify({ app: 'notes', schemaVersion: 1, exportedAt: 1762941600000, data: {} })],
    ['JSON with no app', JSON.stringify({ quarters: [] })],
  ])('says "This isn\'t a Cadence backup." for %s', async (_, text) => {
    const store = await open(clock)
    expect(await store.readBackup(picked(text))).toEqual({
      problem: 'not-a-backup',
      message: "This isn't a Cadence backup.",
    })
  })

  it('refuses a backup from a newer Cadence, whatever its data', async () => {
    const store = await open(clock)
    const newer = backupText({ schemaVersion: 2, data: { meta: { schemaVersion: 2 }, 'journal:2026-11-12': 'new' } })
    expect(await store.readBackup(picked(newer))).toEqual({
      problem: 'newer',
      message: 'This backup is from a newer Cadence. Update Cadence first.',
    })
  })

  const workVersion = q4.versions.work[0]!
  const reflection = q4.reflections['2026-11-11'].work
  /** The backup's data with one key changed, or removed when `value` is undefined */
  const dataWith = (key: string, value: unknown) => {
    const data: Record<string, unknown> = { ...inUse, [key]: value }
    if (value === undefined) delete data[key]
    return data
  }
  const q4With = (changes: Record<string, unknown>) => dataWith('quarter:2026-Q4', { ...q4, ...changes })
  /** Q4 with these Work Versions */
  const workVersions = (...versions: unknown[]) => q4With({ versions: { ...q4.versions, work: versions } })
  /** Q4 with one Work Version, its words changed */
  const workWords = (changes: Record<string, unknown>) =>
    workVersions({ ...workVersion, content: { ...quest, ...changes } })
  const setupAt = (part: string) => ({ at: { quest: 'work', part }, work: {}, life: {} })

  it.each<[string, Record<string, unknown>]>([
    ['no schema version', { schemaVersion: undefined }],
    ['a schema version in words', { schemaVersion: 'one' }],
    ['a schema version before the first', { schemaVersion: 0 }],
    ['no export time', { exportedAt: undefined }],
    ['an export time in words', { exportedAt: '12 Nov' }],
    ['no data', { data: undefined }],
    ['data that is a list', { data: [] }],
    ['no meta', { data: dataWith('meta', undefined) }],
    ["a meta whose schema isn't the file's", { data: dataWith('meta', { ...inUse.meta, schemaVersion: 2 }) }],
    ['an unknown Appearance', { data: dataWith('meta', { ...inUse.meta, appearance: 'sepia' }) }],
    ['a last backup in words', { data: dataWith('meta', { ...inUse.meta, lastBackupAt: 'last week' }) }],
    ['a key Cadence never stores', { data: dataWith('notes', 'hello') }],
    ['a Quarter that does not exist', { data: dataWith('quarter:2026-Q5', q4) }],
    ['a Quarter record that is not an object', { data: dataWith('quarter:2026-Q4', 'Q4') }],
    ['a Quest that is not Work or Life', { data: q4With({ versions: { ...q4.versions, health: [] } }) }],
    ['no Life Versions', { data: q4With({ versions: { work: q4.versions.work } }) }],
    ['a Version on a date that does not exist', { data: workVersions({ ...workVersion, savedOn: '2026-11-31' }) }],
    ['a Version saved after its Quarter', { data: workVersions({ ...workVersion, savedOn: '2027-01-01' }) }],
    ['Versions out of order', { data: workVersions(...[...q4.versions.work].reverse()) }],
    ['two Versions on one Day', { data: workVersions(workVersion, workVersion) }],
    ['a Version with no Main Quest', { data: workWords({ mainQuest: '' }) }],
    ['a Version with a part missing', { data: workWords({ obstacle: undefined }) }],
    ['a Version with six Commitments', { data: workWords({ commitments: ['1', '2', '3', '4', '5', '6'] }) }],
    ['a list item that is a number', { data: workWords({ successMetrics: [5] }) }],
    ['a Reflection on a Day of another Quarter', { data: q4With({ reflections: { '2026-09-30': { work: reflection } } }) }],
    ['a Reflection for a Quest that is not Work or Life', { data: q4With({ reflections: { '2026-11-11': { health: reflection } } }) }],
    ['a Reflection with no Prompt', { data: q4With({ reflections: { '2026-11-11': { work: { text: 'Shipped' } } } }) }],
    ['a Reflection that is only words', { data: q4With({ reflections: { '2026-11-11': { work: 'Shipped' } } }) }],
    ['a setup Draft at a part that does not exist', { data: dataWith('setup:2027-Q1', setupAt('why')) }],
    ['a setup Draft with no Life', { data: dataWith('setup:2027-Q1', { ...setupAt('mainQuest'), life: undefined }) }],
    ['a setup Draft with a list in words', { data: dataWith('setup:2027-Q1', { ...setupAt('mainQuest'), work: { commitments: 'run' } }) }],
    ['an edit Draft for a Quest that is not Work or Life', { data: dataWith('edit:2026-Q4:health', inUse['edit:2026-Q4:life']) }],
    ['an edit Draft with no start time', { data: dataWith('edit:2026-Q4:life', { content: quest }) }],
    ['an edit Draft with a part missing', { data: dataWith('edit:2026-Q4:life', { startedAt: 1762930000000, content: { mainQuest: 'run' } }) }],
    ['a record with a field Cadence never stores', { data: dataWith('meta', { ...inUse.meta, streak: 12 }) }],
    ['a field named like one every object has', { data: dataWith('meta', { ...inUse.meta, constructor: 1 }) }],
    ['a Reflection in a Quarter not set up', { data: q4With({ versions: { ...q4.versions, life: [] } }) }],
    ['a setup Draft holding a finished Quest', { data: dataWith('setup:2026-Q4', { ...setupAt('mainQuest'), work: { mainQuest: 'ship' } }) }],
  ])('says "This backup is damaged and can\'t be used." for %s', async (_, changes) => {
    const store = await open(clock)
    expect(await store.readBackup(picked(backupText(changes)))).toEqual({
      problem: 'damaged',
      message: "This backup is damaged and can't be used.",
    })
  })

  it("says a file that can't be read is damaged", async () => {
    const store = await open(clock)
    const unreadable = { text: () => Promise.reject(new DOMException('Lockdown Mode', 'NotReadableError')) } as Blob
    expect(await store.readBackup(unreadable)).toMatchObject({ problem: 'damaged' })
  })

  it("replaces everything only with a backup it has checked", async () => {
    const store = await open(clock)
    const unchecked = { exportedAt: 1762941600000, quarters: [], reflectionCount: 0, data: { meta: inUse.meta } }
    expect(await refusal(store.replaceWith(unchecked))).toMatchObject({ reason: 'not-allowed' })
    expect(await everythingStored()).toEqual(inUse)
  })

  it('accepts an empty Obstacle, a Quarter with only its Work Quest, and a Draft with no words yet', async () => {
    const store = await open(clock)
    const data = {
      meta: inUse.meta,
      'quarter:2027-Q1': { versions: { work: [workVersion], life: [] }, reflections: {} },
      'setup:2027-Q1': { at: { quest: 'life', part: 'mainQuest' }, work: {}, life: {} },
    }
    expect(await store.readBackup(picked(backupText({ data })))).toMatchObject({ data })
  })
})

describe('a failed save', () => {
  const draft: SetupDraft = { at: { quest: 'work', part: 'mainQuest' }, work: { mainQuest: 'ship' }, life: {} }
  const changed: SetupDraft = { ...draft, work: { mainQuest: 'ship Cadence' } }

  it('is retried on a fresh connection when iOS has closed the old one', async () => {
    const connections: UseStore[] = []
    const store = await open(clock, () => {
      const kv = createStore('cadence', 'kv')
      connections.push(kv)
      return kv
    })
    await connections[0]!('readonly', (kv) => kv.transaction.db.close())

    await store.saveSetupDraft('2026-Q4', draft)
    expect((await open(clock)).snapshot().setupDrafts['2026-Q4']).toEqual(draft)
  })

  it('is retried when it is the first-run meta', async () => {
    const phone = flakyPhone()
    phone.failNextWrites('UnknownError')
    await open(clock, phone.connect)
    expect(await stored('meta')).toEqual({ schemaVersion: 1, lastBackupAt: null, appearance: 'system' })
  })

  it('is retried once after an UnknownError', async () => {
    const phone = flakyPhone()
    const store = await open(clock, phone.connect)
    phone.failNextWrites('UnknownError')

    await store.saveSetupDraft('2026-Q4', draft)
    expect((await open(clock)).snapshot().setupDrafts['2026-Q4']).toEqual(draft)
  })

  it('that fails again says so, and keeps what was saved before', async () => {
    const phone = flakyPhone()
    const store = await open(clock, phone.connect)
    await store.saveSetupDraft('2026-Q4', draft)
    phone.failNextWrites('InvalidStateError', 'UnknownError')

    expect(await refusal(store.saveSetupDraft('2026-Q4', changed))).toMatchObject({
      reason: 'failed',
      message: "Couldn't save. Close and reopen Cadence, or restart the iPhone.",
    })
    expect(store.snapshot().setupDrafts['2026-Q4']).toEqual(draft)
    expect((await open(clock)).snapshot().setupDrafts['2026-Q4']).toEqual(draft)
  })

  it('is not retried for any other error', async () => {
    const phone = flakyPhone()
    const store = await open(clock, phone.connect)
    phone.failNextWrites('AbortError')

    expect(await refusal(store.saveSetupDraft('2026-Q4', draft))).toMatchObject({ reason: 'failed' })
    expect((await open(clock)).snapshot().setupDrafts).toEqual({})
  })

  it('says when the iPhone storage is full', async () => {
    const phone = flakyPhone()
    const store = await open(clock, phone.connect)
    phone.failNextWrites('QuotaExceededError')

    expect(await refusal(store.finishQuest('2026-Q4', 'work', quest))).toMatchObject({
      reason: 'storage-full',
      message: "Couldn't save: iPhone storage is full.",
    })
    expect(store.snapshot().quarters).toEqual({})
    expect((await open(clock)).snapshot().quarters).toEqual({})
  })
})
