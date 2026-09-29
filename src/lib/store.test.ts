import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'
import { createStore, get } from 'idb-keyval'
import { beforeEach, describe, expect, it } from 'vitest'
import { screenFor } from './quarters'
import { open, type QuestContent, type SetupDraft } from './store'

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
