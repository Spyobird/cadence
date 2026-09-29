import type { Appearance } from './appearance'
import type { LocalDate, Quarter } from './quarters'

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
