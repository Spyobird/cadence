// The only code that touches IndexedDB, and the owner of every data rule (ADR 0004, spec §13). Everything is
// loaded into memory by open(); every read comes from memory, and memory changes only once a write has landed.

import { createStore, entries, promisifyRequest, type UseStore } from 'idb-keyval'
import { APPEARANCES, type Appearance } from './appearance'
import { promptFor } from './prompts'
import {
  firstDayOf,
  isFinished,
  isLocalDate,
  isPast,
  isQuarter,
  isSetUp,
  labelOf,
  lastDayOf,
  type LocalDate,
  localDate,
  nextQuarter,
  type Quarter,
  quarterOf,
  weekdayDate,
} from './quarters'

/** The schema this build reads and writes (spec §13.4) */
const SCHEMA_VERSION = 1

/** The two Quests, Work then Life, in that order everywhere */
export const QUESTS = ['work', 'life'] as const
export type Quest = (typeof QUESTS)[number]

/** "Work" and "Life", as the Quests are named */
export const NAMES: Record<Quest, string> = { work: 'Work', life: 'Life' }

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

/** One Quest's words in a Draft, as typed: any part may be missing */
export type QuestDraft = Partial<QuestContent>

/** `setup:2026-Q4`: the words written so far, and where setup was left */
export interface SetupDraft {
  at: { quest: Quest; part: keyof QuestContent | 'readBack' }
  work: QuestDraft
  life: QuestDraft
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
  /** The moment, by the clock the store was opened with */
  now(): Date
  /** The phone's local date, by that clock */
  today(): LocalDate
  /** Keeps setup's words as typed, and where it was left (spec §5.4) */
  saveSetupDraft(quarter: Quarter, draft: SetupDraft): Promise<void>
  /** Moves setup, and its words, to the other of the Current and Upcoming Quarters, until Work is finished (spec §3.2) */
  switchSetupTarget(from: Quarter, to: Quarter): Promise<void>
  /** Makes the Quest's Version 1 and clears its words from the setup Draft, in one transaction (spec §5.3) */
  finishQuest(quarter: Quarter, quest: Quest, content: QuestContent): Promise<void>
  /** Keeps today's Reflection on a Quest, with a copy of the day's Prompt (spec §7.1) */
  saveReflection(quarter: Quarter, quest: Quest, text: string): Promise<void>
  /** Removes today's Reflection on a Quest */
  removeReflection(quarter: Quarter, quest: Quest): Promise<void>
  /** Keeps the Appearance chosen in the menu (spec §2.8) */
  setAppearance(appearance: Appearance): Promise<void>
  /** The Backup: one file holding every stored key, Drafts included, named for today (spec §12.2) */
  exportBackup(): File
  /** Records that a backup was made: the share sheet finished, or the download started (spec §12.2) */
  markBackedUp(): Promise<void>
  /** Checks the whole of a Backup file before anything is touched (spec §12.3) */
  readBackup(file: Blob): Promise<Preview | Problem>
  /** Clears everything and writes the Backup in one transaction, dated by its export (spec §12.3) */
  replaceWith(backup: Preview): Promise<void>
}

/** A checked Backup, ready to replace everything with (spec §12.3) */
export interface Preview {
  /** When it was exported, epoch ms */
  exportedAt: number
  /** Every Quarter it holds anything for, a Draft included, in calendar order */
  quarters: Quarter[]
  /** How many Reflections it holds, across its Quarters */
  reflectionCount: number
  /** Every key it holds, checked */
  data: Record<string, unknown>
}

/** Why a file can't be imported, in words the UI can show (spec §12.3) */
export interface Problem {
  problem: 'not-a-backup' | 'newer' | 'damaged'
  message: string
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
export const MAX_ITEMS = 5

/** One line of prose: trimmed, with a pasted line break made a space (spec §4.3) */
/** A pasted or dictated line break becomes a space, as typed */
export const joinLines = (text: string) => text.replace(/\s*[\r\n]+\s*/g, ' ')
const oneLine = (text: string) => joinLines(text).trim()
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

/** A Reflection as it's saved, and as it's compared: trimmed at the ends only, keeping its line breaks (spec §4.3) */
export const tidyReflection = (text: string) => text.trim()

/** Every required part written, and one to five items in each list; only the Obstacle may be empty */
export function isComplete(content: QuestContent): boolean {
  const { mainQuest, whyItMatters, whyItsExciting, successMetrics, commitments } = content
  const listOk = (items: string[]) => items.length >= 1 && items.length <= MAX_ITEMS
  return !!mainQuest && !!whyItMatters && !!whyItsExciting && listOk(successMetrics) && listOk(commitments)
}

/** A setup Draft before anything is typed: the Work Quest's Main Quest */
export const BLANK_SETUP_DRAFT: SetupDraft = { at: { quest: 'work', part: 'mainQuest' }, work: {}, life: {} }

/**
 * The Quarter setup can switch to from `from`: the other of the Current and Upcoming Quarters, while nothing is
 * stored for it, and only until the Work Quest is finished (spec §3.2). Undefined when setup can't switch.
 */
export function switchTargetFrom(snapshot: Snapshot, today: LocalDate, from: Quarter): Quarter | undefined {
  const current = quarterOf(today)
  const upcoming = nextQuarter(current)
  const to = from === current ? upcoming : from === upcoming ? current : undefined
  if (!to || isFinished(snapshot, from, 'work') || snapshot.setupDrafts[to] || snapshot.quarters[to]) return undefined
  return to
}

/** A finished Quest the Draft holds words for, or sits on: a finished Quest never turns back into a Draft (spec §10) */
function finishedQuestIn(snapshot: Snapshot, quarter: Quarter, draft: SetupDraft): Quest | undefined {
  return QUESTS.find(
    (quest) => isFinished(snapshot, quarter, quest) && (draft.at.quest === quest || Object.keys(draft[quest]).length > 0),
  )
}

/** The storage keys (spec §13.2, ADR 0004) */
const QUARTER_KEY = 'quarter:'
const SETUP_KEY = 'setup:'
const EDIT_KEY = 'edit:'
const quarterKey = (quarter: Quarter) => `${QUARTER_KEY}${quarter}`
const setupKey = (quarter: Quarter) => `${SETUP_KEY}${quarter}`

/** What a Backup file holds (spec §12.2) */
interface BackupFile {
  app: 'cadence'
  schemaVersion: number
  /** Epoch ms */
  exportedAt: number
  /** Every stored key, as stored */
  data: Record<string, unknown>
}

const PROBLEMS = {
  'not-a-backup': "This isn't a Cadence backup.",
  newer: 'This backup is from a newer Cadence. Update Cadence first.',
  damaged: "This backup is damaged and can't be used.",
} as const
const problem = (why: Problem['problem']): Problem => ({ problem: why, message: PROBLEMS[why] })

// What schema 1 stores (spec §13.2), to check a Backup's every record against

type Fields = Record<string, unknown>
const isObject = (value: unknown): value is Fields => typeof value === 'object' && value !== null && !Array.isArray(value)
/** An object with exactly these fields, each passing its check */
const isRecord = (value: unknown, fields: Record<string, (field: unknown) => boolean>): value is Fields =>
  isObject(value) &&
  Object.keys(value).every((name) => Object.hasOwn(fields, name)) &&
  Object.entries(fields).every(([name, check]) => check(value[name]))

const isText = (value: unknown) => typeof value === 'string'
const isList = (value: unknown) => Array.isArray(value) && value.every(isText)
const isTime = (value: unknown) => Number.isSafeInteger(value) && (value as number) >= 0
const isQuest = (value: unknown): value is Quest => QUESTS.includes(value as Quest)
const isAppearance = (value: unknown) => APPEARANCES.includes(value as Appearance)

/** A Quest's words, as typed: each part optional, a line or a list */
const PART_CHECKS: Record<keyof QuestContent, (words: unknown) => boolean> = {
  mainQuest: isText,
  whyItMatters: isText,
  successMetrics: isList,
  whyItsExciting: isText,
  obstacle: isText,
  commitments: isList,
}
const optional = (check: (value: unknown) => boolean) => (value: unknown) => value === undefined || check(value)
const isQuestDraft = (value: unknown) =>
  isRecord(value, Object.fromEntries(Object.entries(PART_CHECKS).map(([part, check]) => [part, optional(check)])))
/** Every part there, though perhaps not written yet */
const isQuestContent = (value: unknown): value is QuestContent => isRecord(value, PART_CHECKS)

function isVersions(value: unknown, quarter: Quarter) {
  const isVersion = (version: unknown): version is Version =>
    isRecord(version, {
      savedOn: (date) => isLocalDate(date) && date <= lastDayOf(quarter),
      content: (content) => isQuestContent(content) && isComplete(content),
    })
  // Oldest first, and at most one a Day
  return (
    Array.isArray(value) &&
    value.every(isVersion) &&
    value.every((version, i) => i === 0 || version.savedOn > value[i - 1]!.savedOn)
  )
}

function isQuarterRecord(value: unknown, quarter: Quarter) {
  const isReflection = (reflection: unknown) => isRecord(reflection, { text: isText, prompt: isText })
  const isDay = (day: unknown) =>
    isObject(day) && Object.keys(day).every(isQuest) && Object.values(day).every(isReflection)
  const ofThisQuarter = (versions: unknown) => isVersions(versions, quarter)
  return isRecord(value, {
    versions: (versions) => isRecord(versions, { work: ofThisQuarter, life: ofThisQuarter }),
    // Each Day's Reflections, on a Day of this Quarter
    reflections: (reflections) =>
      isObject(reflections) &&
      Object.entries(reflections).every(([date, day]) => isLocalDate(date) && quarterOf(date) === quarter && isDay(day)),
  })
}

const isPlace = (part: unknown) => part === 'readBack' || Object.hasOwn(PART_CHECKS, part as string)
const isSetupDraft = (value: unknown) =>
  isRecord(value, { at: (at) => isRecord(at, { quest: isQuest, part: isPlace }), work: isQuestDraft, life: isQuestDraft })

const isEditDraft = (value: unknown) => isRecord(value, { startedAt: isTime, content: isQuestContent })

/** A stored key and its value, as schema 1 has them */
function isEntry(key: string, value: unknown, schemaVersion: number): boolean {
  if (key === 'meta') {
    return isRecord(value, {
      schemaVersion: (version) => version === schemaVersion,
      lastBackupAt: (at) => at === null || isTime(at),
      appearance: isAppearance,
    })
  }
  // quarter:2026-Q4, setup:2026-Q4 and edit:2026-Q4:work
  const [name, quarter = '', quest, ...rest] = key.split(':')
  const kind = `${name}:`
  if (!isQuarter(quarter) || rest.length > 0) return false
  if (kind === QUARTER_KEY && quest === undefined) return isQuarterRecord(value, quarter)
  if (kind === SETUP_KEY && quest === undefined) return isSetupDraft(value)
  if (kind === EDIT_KEY && isQuest(quest)) return isEditDraft(value)
  return false
}

/** Parses a Backup file's text and checks all of it, or says why it can't be used */
function checkBackup(text: string): Preview | Problem {
  let file: unknown
  try {
    file = JSON.parse(text)
  } catch {
    return problem('not-a-backup')
  }
  if (!isObject(file) || file.app !== 'cadence') return problem('not-a-backup')
  const { schemaVersion, exportedAt, data } = file
  // A newer schema is refused before its data is read: this build can't know what valid means there
  if (typeof schemaVersion === 'number' && schemaVersion > SCHEMA_VERSION) return problem('newer')
  // Schema 1 is the first. From schema 2 on, an older backup's data is migrated here, before it's checked.
  if (
    schemaVersion !== SCHEMA_VERSION ||
    !isTime(exportedAt) ||
    !isObject(data) ||
    !('meta' in data) ||
    !Object.entries(data).every(([key, value]) => isEntry(key, value, schemaVersion))
  ) {
    return problem('damaged')
  }
  // And the rules the store keeps across keys: Reflections only in a set-up Quarter, and no finished Quest in a Draft
  const loaded = snapshotOf(new Map(Object.entries(data)))
  const quarters = Object.entries(loaded.quarters) as [Quarter, QuarterRecord][]
  if (
    quarters.some(([quarter, record]) => !isSetUp(loaded, quarter) && Object.keys(record.reflections).length > 0) ||
    (Object.entries(loaded.setupDrafts) as [Quarter, SetupDraft][]).some(([quarter, draft]) =>
      finishedQuestIn(loaded, quarter, draft),
    )
  ) {
    return problem('damaged')
  }
  const days = quarters.flatMap(([, record]) => Object.values(record.reflections))
  // Every key but meta names its Quarter second: quarter:2026-Q4, setup:2026-Q4, edit:2026-Q4:work
  const held = Object.keys(data).flatMap((key) => (key === 'meta' ? [] : [key.split(':')[1] as Quarter]))
  return {
    exportedAt: exportedAt as number,
    quarters: [...new Set(held)].sort(),
    reflectionCount: days.reduce((count, day) => count + Object.keys(day).length, 0),
    data,
  }
}

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

/** Every change lands, or none do: one IndexedDB transaction. `replace` clears every key first. */
function transact(kv: UseStore, changes: Change[], replace: boolean): Promise<void> {
  return kv('readwrite', (store) => {
    if (replace) store.clear()
    for (const [key, value] of changes) {
      if (value === undefined) store.delete(key)
      else store.put(value, key)
    }
    return promisifyRequest(store.transaction)
  })
}

/** A copy of `record` with `key` set to `value`, or left out when `value` is undefined */
function withEntry<R extends Record<string, unknown>, K extends keyof R & string>(
  record: R,
  key: K,
  value: R[K] | undefined,
): R {
  const next = { ...record }
  if (value === undefined) delete next[key]
  else next[key] = value
  return next
}

/** What memory holds for the stored keys, meta among them */
function snapshotOf(stored: Map<string, unknown>): Snapshot {
  const snapshot: Snapshot = { quarters: {}, setupDrafts: {}, meta: stored.get('meta') as Meta, readOnly: false }
  for (const [key, value] of stored) {
    if (key.startsWith(QUARTER_KEY)) {
      snapshot.quarters[key.slice(QUARTER_KEY.length) as Quarter] = value as QuarterRecord
    } else if (key.startsWith(SETUP_KEY)) {
      snapshot.setupDrafts[key.slice(SETUP_KEY.length) as Quarter] = value as SetupDraft
    }
  }
  snapshot.readOnly = snapshot.meta.schemaVersion > SCHEMA_VERSION
  return snapshot
}

/** Loads everything into memory, and writes `meta` on first run */
export async function open(clock: () => Date, connect = () => createStore('cadence', 'kv')): Promise<Store> {
  let kv = connect()
  /** Writes the changes, retrying once on a fresh connection if iOS has dropped this one (spec §13.5) */
  async function write(changes: Change[], replace = false) {
    try {
      await transact(kv, changes, replace)
    } catch (error) {
      if (!CONNECTION_LOST.includes(String(nameOf(error)))) throw failedSave(error)
      kv = connect()
      await transact(kv, changes, replace).catch((again: unknown) => {
        throw failedSave(again)
      })
    }
  }

  /** Every key as stored, the ones this build doesn't read too, so a Backup holds everything */
  const stored = new Map((await entries(kv)) as [string, unknown][])
  if (!stored.has('meta')) {
    const meta: Meta = { schemaVersion: SCHEMA_VERSION, lastBackupAt: null, appearance: 'system' }
    await write([['meta', meta]])
    stored.set('meta', meta)
  }
  let snapshot = snapshotOf(stored)

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
  async function commit(changes: Change[], next: Snapshot, replace = false) {
    await write(changes, replace)
    if (replace) stored.clear()
    for (const [key, value] of changes) {
      if (value === undefined) stored.delete(key)
      else stored.set(key, value)
    }
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
    const finished = finishedQuestIn(snapshot, quarter, draft)
    if (finished) {
      throw new StoreError('not-allowed', `The ${NAMES[finished]} Quest is finished, so the setup Draft can't hold it.`)
    }
    await commit([[setupKey(quarter), draft]], {
      ...snapshot,
      setupDrafts: withEntry(snapshot.setupDrafts, quarter, draft),
    })
  }

  async function switchSetupTarget(from: Quarter, to: Quarter) {
    refuseUnlessSetupTarget(from)
    refuseUnlessSetupTarget(to)
    if (isFinished(snapshot, from, 'work')) {
      throw new StoreError('not-allowed', `The Work Quest is finished, so setup stays on ${labelOf(from)}.`)
    }
    if (to !== switchTargetFrom(snapshot, today(), from)) {
      throw new StoreError('not-allowed', `Setup can't switch from ${labelOf(from)} to ${labelOf(to)}.`)
    }
    // With nothing typed yet, a blank Draft still keeps the new target
    const draft = snapshot.setupDrafts[from] ?? BLANK_SETUP_DRAFT
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

  /** A Reflection that's only spaces is empty, so saving it removes the Day's Reflection on that Quest */
  async function saveReflection(quarter: Quarter, quest: Quest, typed: string) {
    refuseIfEnded(quarter)
    const date = today()
    // Only for today's date, on a Day of a set-up Quarter (spec §7.1)
    if (quarterOf(date) !== quarter) {
      throw new StoreError('not-allowed', `Reflections start on Day 1, ${weekdayDate(firstDayOf(quarter))}.`)
    }
    const record = snapshot.quarters[quarter]
    if (!record || !isSetUp(snapshot, quarter)) {
      throw new StoreError('not-allowed', `Reflections start once ${labelOf(quarter)} is set up.`)
    }
    const text = tidyReflection(typed)
    const day = withEntry(record.reflections[date] ?? {}, quest, text ? { text, prompt: promptFor(date) } : undefined)
    // A Day is kept only while it has a Reflection
    const reflections = withEntry(record.reflections, date, Object.keys(day).length > 0 ? day : undefined)
    const reflected: QuarterRecord = { ...record, reflections }
    await commit([[quarterKey(quarter), reflected]], {
      ...snapshot,
      quarters: withEntry(snapshot.quarters, quarter, reflected),
    })
  }
  const removeReflection = (quarter: Quarter, quest: Quest) => saveReflection(quarter, quest, '')

  /** Changes some of meta, keeping the rest as it was */
  async function saveMeta(changes: Partial<Meta>) {
    const meta: Meta = { ...snapshot.meta, ...changes }
    await commit([['meta', meta]], { ...snapshot, meta })
  }
  const setAppearance = (appearance: Appearance) => saveMeta({ appearance })
  const markBackedUp = () => saveMeta({ lastBackupAt: clock().getTime() })

  /** From memory, so the tap that shares it still counts as a tap when the share sheet opens (spec §12.2) */
  function exportBackup() {
    const backup: BackupFile = {
      app: 'cadence',
      schemaVersion: snapshot.meta.schemaVersion,
      exportedAt: clock().getTime(),
      data: Object.fromEntries(stored),
    }
    return new File([JSON.stringify(backup, null, 2)], `cadence-backup-${today()}.json`, { type: 'application/json' })
  }

  /** The Backups readBackup has checked: only these can replace everything */
  const checked = new WeakSet<Preview>()

  async function readBackup(file: Blob) {
    // A file iOS won't let Cadence read (in Lockdown Mode, say) can't be used
    const text = await file.text().catch(() => undefined)
    const backup = text === undefined ? problem('damaged') : checkBackup(text)
    if (!('problem' in backup)) checked.add(backup)
    return backup
  }

  async function replaceWith(backup: Preview) {
    if (!checked.has(backup)) throw new StoreError('not-allowed', 'Only a checked backup can replace everything.')
    const data = new Map(Object.entries(backup.data))
    data.set('meta', { ...(data.get('meta') as Meta), lastBackupAt: backup.exportedAt })
    await commit([...data], snapshotOf(data), true)
  }

  return {
    snapshot: () => snapshot,
    now: clock,
    today,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    saveSetupDraft: inTurn(saveSetupDraft),
    switchSetupTarget: inTurn(switchSetupTarget),
    finishQuest: inTurn(finishQuest),
    saveReflection: inTurn(saveReflection),
    removeReflection: inTurn(removeReflection),
    setAppearance: inTurn(setAppearance),
    exportBackup,
    markBackedUp: inTurn(markBackedUp),
    readBackup,
    replaceWith: inTurn(replaceWith),
  }
}
