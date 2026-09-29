import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'
import { createStore, get, set, type UseStore } from 'idb-keyval'
import { beforeEach, describe, expect, it } from 'vitest'
import { screenFor } from './quarters'
import { open, type QuestContent, type SetupDraft, StoreError } from './store'

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

describe('open', () => {
  it('creates meta on first run', async () => {
    const store = await open(clock)
    const meta = { schemaVersion: 1, lastBackupAt: null, appearance: 'system' }
    expect(store.snapshot().meta).toEqual(meta)
    expect(await stored('meta')).toEqual(meta)
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
    expect((await open(clock)).snapshot()).toMatchObject({ quarters: {}, setupDrafts: {} })
    expect(await stored('meta')).toEqual(newer)
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
    expect(await refusal(store.finishQuest('2026-Q4', 'work', again))).toMatchObject({ reason: 'not-allowed' })
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

describe('a failed save', () => {
  const draft: SetupDraft = { at: { quest: 'work', part: 'mainQuest' }, work: { mainQuest: 'ship' }, life: {} }
  const changed: SetupDraft = { ...draft, work: { mainQuest: 'ship Cadence' } }

  /** Connections to the phone's storage whose next writes can be made to fail, as iOS's IndexedDB can */
  function flakyPhone() {
    const failures: string[] = []
    const connect = (): UseStore => {
      const kv = createStore('cadence', 'kv')
      return (mode, callback) => {
        const failure = mode === 'readwrite' ? failures.shift() : undefined
        return failure ? Promise.reject(new DOMException('The write failed', failure)) : kv(mode, callback)
      }
    }
    return { connect, failNextWrites: (...names: string[]) => failures.push(...names) }
  }

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
