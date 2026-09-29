// The only code that touches IndexedDB, and the owner of every data rule (ADR 0004, spec §13). Everything is
// loaded into memory by open(); every read comes from memory, and memory changes only once a write has landed.

import { createStore, entries, promisifyRequest, type UseStore } from 'idb-keyval'
import type { Appearance } from './appearance'
import { isFinished, isPast, labelOf, type LocalDate, localDate, nextQuarter, type Quarter, quarterOf } from './quarters'

/** The schema this build reads and writes (spec §13.4) */
const SCHEMA_VERSION = 1

/** The two Quests, Work then Life, in that order everywhere */
export const QUESTS = ['work', 'life'] as const
export type Quest = (typeof QUESTS)[number]

const NAMES: Record<Quest, string> = { work: 'Work', life: 'Life' }

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
  /** The phone's local date, by the clock the store was opened with */
  today(): LocalDate
  /** Keeps setup's words as typed, and where it was left (spec §5.4) */
  saveSetupDraft(quarter: Quarter, draft: SetupDraft): Promise<void>
  /** Moves setup, and its words, to the other of the Current and Upcoming Quarters, until Work is finished (spec §3.2) */
  switchSetupTarget(from: Quarter, to: Quarter): Promise<void>
  /** Makes the Quest's Version 1 and clears its words from the setup Draft, in one transaction (spec §5.3) */
  finishQuest(quarter: Quarter, quest: Quest, content: QuestContent): Promise<void>
}

/** Why a write didn't happen */
export type Refusal =
  /** It failed, and failed again on a fresh connection (spec §13.5) */
  | 'failed'
  /** The iPhone's storage is full */
  | 'storage-full'
  /** The data is from a newer Cadence (spec §13.4) */
  | 'read-only'
  /** It was for a Past Quarter */
  | 'quarter-ended'
  /** It would finish a Quest that isn't complete (spec §10) */
  | 'incomplete'
  /** It breaks another of setup's rules, which the UI shouldn't have offered */
  | 'not-allowed'

/** A write that didn't happen. Nothing was saved, and `message` says why in words the UI can show. */
export class StoreError extends Error {
  readonly reason: Refusal

  constructor(reason: Refusal, message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'StoreError'
    this.reason = reason
  }
}

/** A list holds at most five items (spec §4.1) */
const MAX_ITEMS = 5

/** One line of prose: trimmed, with a pasted line break made a space (spec §4.3) */
const oneLine = (text: string) => text.replace(/\s*[\r\n]+\s*/g, ' ').trim()
const tidyList = (items: string[]) => items.map(oneLine).filter(Boolean)

/** A Quest as it's saved, and as it's compared: every part and list item on one tidy line, and no empty list items */
export function tidyQuest(content: QuestContent): QuestContent {
  return {
    mainQuest: oneLine(content.mainQuest),
    whyItMatters: oneLine(content.whyItMatters),
    successMetrics: tidyList(content.successMetrics),
    whyItsExciting: oneLine(content.whyItsExciting),
    obstacle: oneLine(content.obstacle),
    commitments: tidyList(content.commitments),
  }
}

/** Every required part written, and one to five items in each list; only the Obstacle may be empty */
function isComplete(content: QuestContent): boolean {
  const { mainQuest, whyItMatters, whyItsExciting, successMetrics, commitments } = content
  const listOk = (items: string[]) => items.length >= 1 && items.length <= MAX_ITEMS
  return !!mainQuest && !!whyItMatters && !!whyItsExciting && listOk(successMetrics) && listOk(commitments)
}

/** The storage keys (spec §13.2, ADR 0004) */
const QUARTER_KEY = 'quarter:'
const SETUP_KEY = 'setup:'
const quarterKey = (quarter: Quarter) => `${QUARTER_KEY}${quarter}`
const setupKey = (quarter: Quarter) => `${SETUP_KEY}${quarter}`

/** A change to one key: the value to put, or undefined to delete it */
type Change = [key: string, value: unknown]

/** The DOMException names iOS gives when it has dropped the connection, so a fresh one may work */
const CONNECTION_LOST = ['InvalidStateError', 'UnknownError']

/** An error's name, read directly: a DOMException may come from another realm, where instanceof fails */
const nameOf = (error: unknown) => (typeof error === 'object' && error !== null && 'name' in error ? error.name : undefined)

function failedSave(error: unknown): StoreError {
  return nameOf(error) === 'QuotaExceededError'
    ? new StoreError('storage-full', "Couldn't save: iPhone storage is full.", { cause: error })
    : new StoreError('failed', "Couldn't save. Close and reopen Cadence, or restart the iPhone.", { cause: error })
}

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
  let kv = connect()
  let snapshot: Snapshot = {
    quarters: {},
    setupDrafts: {},
    meta: { schemaVersion: SCHEMA_VERSION, lastBackupAt: null, appearance: 'system' },
    readOnly: false,
  }
  /** Writes the changes, retrying once on a fresh connection if iOS has dropped this one (spec §13.5) */
  async function write(changes: Change[]) {
    try {
      await transact(kv, changes)
    } catch (error) {
      if (!CONNECTION_LOST.includes(String(nameOf(error)))) throw failedSave(error)
      kv = connect()
      await transact(kv, changes).catch((again: unknown) => {
        throw failedSave(again)
      })
    }
  }

  let hasMeta = false
  for (const [key, value] of await entries(kv)) {
    if (key === 'meta') {
      snapshot.meta = value as Meta
      hasMeta = true
    } else if (typeof key === 'string' && key.startsWith(QUARTER_KEY)) {
      snapshot.quarters[key.slice(QUARTER_KEY.length) as Quarter] = value as QuarterRecord
    } else if (typeof key === 'string' && key.startsWith(SETUP_KEY)) {
      snapshot.setupDrafts[key.slice(SETUP_KEY.length) as Quarter] = value as SetupDraft
    }
  }
  if (!hasMeta) await write([['meta', snapshot.meta]])
  snapshot.readOnly = snapshot.meta.schemaVersion > SCHEMA_VERSION

  const listeners = new Set<() => void>()
  const today = () => localDate(clock())

  /** A Past Quarter's key is never written again, and its Drafts are frozen with it (spec §13.4) */
  function refuseIfEnded(quarter: Quarter) {
    if (isPast(quarter, today())) {
      throw new StoreError('quarter-ended', `${labelOf(quarter)} ended at midnight, so this can't be saved.`)
    }
  }

  /** Setup writes only to the Current or the Upcoming Quarter (spec §3.2) */
  function refuseUnlessSetupTarget(quarter: Quarter) {
    refuseIfEnded(quarter)
    const current = quarterOf(today())
    if (quarter !== current && quarter !== nextQuarter(current)) {
      throw new StoreError('not-allowed', `${labelOf(quarter)} can't be set up yet.`)
    }
  }

  /** Writes the changes, and only once they've landed shows them in memory and tells the listeners */
  async function commit(changes: Change[], next: Snapshot) {
    await write(changes)
    snapshot = next
    for (const listener of listeners) listener()
  }

  /** The write in progress. Each write waits its turn, so its rules see what the write before it saved. */
  let queue: Promise<unknown> = Promise.resolve()
  function inTurn<A extends unknown[]>(operation: (...args: A) => Promise<void>) {
    return (...args: A) => {
      const turn = queue.then(() => {
        // Newer data refuses every write, before any other rule is checked (spec §13.4)
        if (snapshot.readOnly) {
          throw new StoreError('read-only', 'This data is from a newer Cadence. Update Cadence to make changes.')
        }
        return operation(...args)
      })
      queue = turn.catch(() => {})
      return turn
    }
  }

  async function saveSetupDraft(quarter: Quarter, draft: SetupDraft) {
    refuseUnlessSetupTarget(quarter)
    for (const quest of QUESTS) {
      // A finished Quest never turns back into a Draft (spec §10)
      if (isFinished(snapshot, quarter, quest) && (draft.at.quest === quest || Object.keys(draft[quest]).length > 0)) {
        throw new StoreError('not-allowed', `The ${NAMES[quest]} Quest is finished, so the setup Draft can't hold it.`)
      }
    }
    await commit([[setupKey(quarter), draft]], {
      ...snapshot,
      setupDrafts: withEntry(snapshot.setupDrafts, quarter, draft),
    })
  }

  async function switchSetupTarget(from: Quarter, to: Quarter) {
    refuseUnlessSetupTarget(from)
    refuseUnlessSetupTarget(to)
    if (from === to || snapshot.setupDrafts[to] || snapshot.quarters[to]) {
      throw new StoreError('not-allowed', `Setup can't switch from ${labelOf(from)} to ${labelOf(to)}.`)
    }
    if (isFinished(snapshot, from, 'work')) {
      throw new StoreError('not-allowed', `The Work Quest is finished, so setup stays on ${labelOf(from)}.`)
    }
    // With nothing typed yet, a blank Draft still keeps the new target
    const draft = snapshot.setupDrafts[from] ?? { at: { quest: 'work', part: 'mainQuest' }, work: {}, life: {} }
    await commit(
      [
        [setupKey(from), undefined],
        [setupKey(to), draft],
      ],
      { ...snapshot, setupDrafts: withEntry(withEntry(snapshot.setupDrafts, from, undefined), to, draft) },
    )
  }

  async function finishQuest(quarter: Quarter, quest: Quest, typed: QuestContent) {
    refuseUnlessSetupTarget(quarter)
    if (isFinished(snapshot, quarter, quest)) throw new StoreError('not-allowed', `The ${NAMES[quest]} Quest is already finished.`)
    if (quest === 'life' && !isFinished(snapshot, quarter, 'work')) {
      throw new StoreError('not-allowed', 'Setup finishes the Work Quest before the Life Quest.')
    }
    const content = tidyQuest(typed)
    if (!isComplete(content)) {
      throw new StoreError(
        'incomplete',
        'Only a complete Quest can be finished: every part but the Obstacle written, and one to five items in each list.',
      )
    }
    const record = snapshot.quarters[quarter] ?? { versions: { work: [], life: [] }, reflections: {} }
    const finished: QuarterRecord = {
      ...record,
      versions: { ...record.versions, [quest]: [{ savedOn: today(), content }] },
    }
    const draft = snapshot.setupDrafts[quarter]
    // Work first: finishing it moves setup on to Life, part 1. Finishing Life sets the Quarter up.
    const remaining: SetupDraft | undefined =
      quest === 'work' ? { at: { quest: 'life', part: 'mainQuest' }, work: {}, life: draft?.life ?? {} } : undefined
    await commit(
      [
        [quarterKey(quarter), finished],
        [setupKey(quarter), remaining],
      ],
      {
        ...snapshot,
        quarters: withEntry(snapshot.quarters, quarter, finished),
        setupDrafts: withEntry(snapshot.setupDrafts, quarter, remaining),
      },
    )
  }

  return {
    snapshot: () => snapshot,
    today,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    saveSetupDraft: inTurn(saveSetupDraft),
    switchSetupTarget: inTurn(switchSetupTarget),
    finishQuest: inTurn(finishQuest),
  }
}
