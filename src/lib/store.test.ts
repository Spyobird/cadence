import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'
import { createStore, get } from 'idb-keyval'
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
