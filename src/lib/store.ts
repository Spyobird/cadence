// The only code that touches IndexedDB, and the owner of every data rule (ADR 0004, spec §13). Everything is
// loaded into memory by open(); every read comes from memory, and memory changes only once a write has landed.

import { createStore, entries, promisifyRequest, type UseStore } from 'idb-keyval'
import type { Appearance } from './appearance'
import { type LocalDate, localDate, type Quarter } from './quarters'

/** The schema this build reads and writes (spec §13.4) */
const SCHEMA_VERSION = 1

/** The two Quests, Work then Life, in that order everywhere */
export type Quest = 'work' | 'life'

export interface QuestContent {
  mainQuest: string
  whyItMatters: string
  successMetrics: string[]
  whyItsExciting: string
  /** '' when skipped */
  obstacle: string
  commitments: string[]
}

/** A Quest as it stood after being saved on a Day */
export interface Version {
  savedOn: LocalDate
  content: QuestContent
}

export interface Reflection {
  text: string
  /** A copy of the Day's Prompt */
  prompt: string
}

/** `quarter:2026-Q4`: both Quests' Versions and the Quarter's Reflections */
export interface QuarterRecord {
  /** Oldest first */
  versions: Record<Quest, Version[]>
  reflections: Record<LocalDate, Partial<Record<Quest, Reflection>>>
}

/** `setup:2026-Q4`: the words written so far, and where setup was left */
export interface SetupDraft {
  at: { quest: Quest; part: keyof QuestContent | 'readBack' }
  work: Partial<QuestContent>
  life: Partial<QuestContent>
}

export interface Meta {
  schemaVersion: number
  /** Epoch ms */
  lastBackupAt: number | null
  appearance: Appearance
}

/** Everything stored, as loaded into memory. A new Snapshot follows every write. */
export interface Snapshot {
  quarters: Partial<Record<Quarter, QuarterRecord>>
  setupDrafts: Partial<Record<Quarter, SetupDraft>>
  meta: Meta
  /** The data is from a newer Cadence, so nothing can be saved (spec §13.4) */
  readOnly: boolean
}

export interface Store {
  /** Everything stored. The same object until the next write lands. */
  snapshot(): Snapshot
  /** Calls `listener` after every write; returns the unsubscribe */
  subscribe(listener: () => void): () => void
  /** Keeps setup's words as typed, and where it was left (spec §5.4) */
  saveSetupDraft(quarter: Quarter, draft: SetupDraft): Promise<void>
  /** Makes the Quest's Version 1 and clears its words from the setup Draft, in one transaction (spec §5.3) */
  finishQuest(quarter: Quarter, quest: Quest, content: QuestContent): Promise<void>
}

/** A change to one key: the value to put, or undefined to delete it */
type Change = [key: string, value: unknown]

/** Every change lands, or none do: one IndexedDB transaction */
function transact(kv: UseStore, changes: Change[]): Promise<void> {
  return kv('readwrite', (store) => {
    for (const [key, value] of changes) {
      if (value === undefined) store.delete(key)
      else store.put(value, key)
    }
    return promisifyRequest(store.transaction)
  })
}

/** A copy of `record` with `key` set to `value`, or left out when `value` is undefined */
function withEntry<K extends string, V>(record: Partial<Record<K, V>>, key: K, value: V | undefined) {
  const next = { ...record }
  if (value === undefined) delete next[key]
  else next[key] = value
  return next
}

/** Loads everything into memory, and writes `meta` on first run */
export async function open(clock: () => Date, connect = () => createStore('cadence', 'kv')): Promise<Store> {
  const kv = connect()
  let snapshot: Snapshot = {
    quarters: {},
    setupDrafts: {},
    meta: { schemaVersion: SCHEMA_VERSION, lastBackupAt: null, appearance: 'system' },
    readOnly: false,
  }
  let hasMeta = false
  for (const [key, value] of await entries(kv)) {
    if (key === 'meta') {
      snapshot.meta = value as Meta
      hasMeta = true
    } else if (typeof key === 'string' && key.startsWith('quarter:')) {
      snapshot.quarters[key.slice('quarter:'.length) as Quarter] = value as QuarterRecord
    } else if (typeof key === 'string' && key.startsWith('setup:')) {
      snapshot.setupDrafts[key.slice('setup:'.length) as Quarter] = value as SetupDraft
    }
  }
  if (!hasMeta) await transact(kv, [['meta', snapshot.meta]])

  const listeners = new Set<() => void>()
  const today = () => localDate(clock())

  /** Writes the changes, and only once they've landed shows them in memory and tells the listeners */
  async function commit(changes: Change[], next: Snapshot) {
    await transact(kv, changes)
    snapshot = next
    for (const listener of listeners) listener()
  }

  return {
    snapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    async saveSetupDraft(quarter, draft) {
      await commit([[`setup:${quarter}`, draft]], {
        ...snapshot,
        setupDrafts: withEntry(snapshot.setupDrafts, quarter, draft),
      })
    },
    async finishQuest(quarter, quest, content) {
      const record = snapshot.quarters[quarter] ?? { versions: { work: [], life: [] }, reflections: {} }
      const finished: QuarterRecord = {
        ...record,
        versions: { ...record.versions, [quest]: [{ savedOn: today(), content }] },
      }
      const draft = snapshot.setupDrafts[quarter]
      // Work first: finishing it moves setup on to Life, part 1. Finishing Life sets the Quarter up.
      const left: SetupDraft | undefined =
        quest === 'work' ? { at: { quest: 'life', part: 'mainQuest' }, work: {}, life: draft?.life ?? {} } : undefined
      await commit(
        [
          [`quarter:${quarter}`, finished],
          [`setup:${quarter}`, left],
        ],
        {
          ...snapshot,
          quarters: withEntry(snapshot.quarters, quarter, finished),
          setupDrafts: withEntry(snapshot.setupDrafts, quarter, left),
        },
      )
    },
  }
}
