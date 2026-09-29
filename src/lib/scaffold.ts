// The Scaffold: the six parts of a Quest, in order, with the openings a Quest is written by completing (spec §4).

import { endOf, type Quarter } from './quarters'
import { NAMES, type Quest, type QuestContent, type QuestDraft } from './store'

export type Part = keyof QuestContent

interface PartWords {
  /** "Main Quest", as a part is named */
  name: string
  /** The Scaffold's opening, which the owner's words continue */
  opening: (quest: Quest, quarter: Quarter) => string
  placeholder: string
  /** Faint, under the field. `{end}` is the Quarter's last day, and `*when*` is set in italics. */
  hint: string
  /** The name of one item, for the two lists: "Success Metric 1" */
  item?: string
}

export const SCAFFOLD: Record<Part, PartWords> = {
  mainQuest: {
    name: 'Main Quest',
    opening: (quest) => `My ${NAMES[quest]} Main Quest is to`,
    placeholder: 'your one aim',
    hint: "One specific aim. On {end} you'll know whether you did it.",
  },
  whyItMatters: {
    name: 'Why it matters',
    opening: () =>
      'This is the single most important thing for me to accomplish this quarter because completing it would',
    placeholder: 'what it would change',
    hint: 'The reason: what finishing it would change for you.',
  },
  successMetrics: {
    name: 'Success Metrics',
    opening: (_, quarter) => `By ${endOf(quarter)}, I'll have:`,
    placeholder: 'a result you can check',
    hint: 'Results you could check on {end}. Outcomes, not actions. Up to five.',
    item: 'Success Metric',
  },
  whyItsExciting: {
    name: "Why it's exciting",
    opening: () => 'This feels really exciting and compelling for me because',
    placeholder: 'what pulls you toward it',
    hint: "The pull, not the reason: why you'll want to do it.",
  },
  obstacle: {
    name: 'Obstacle',
    opening: () => "What's most likely to get in my way is",
    placeholder: 'what could stop you',
    hint: "What's the one thing most likely to stop you, and what will you do about it? Optional.",
  },
  commitments: {
    name: 'Commitments',
    opening: () => "To make sure I complete the Quest, I'm going to:",
    placeholder: 'a habit or action, with a when',
    hint: 'One habit with a *when* ("every Monday 9–11am, deep work") and one action with a *by when*.',
    item: 'Commitment',
  },
}

/** The parts in order */
export const PARTS = Object.keys(SCAFFOLD) as Part[]

/** More than spaces */
export const isWritten = (text: string) => text.trim() !== ''

/** A one-line part with more than spaces, or a list with at least one such item */
export const isPartWritten = (draft: QuestDraft, part: Part) => [draft[part] ?? ''].flat().some(isWritten)

/** The two lists, as opposed to the one-line parts */
export type ListPart = 'successMetrics' | 'commitments'
export const isList = (part: Part): part is ListPart => part === 'successMetrics' || part === 'commitments'

/** "Stuck? Four questions to help find it": thinking aids on the Main Quest screen, never saved (spec §4.2) */
export const STUCK_QUESTIONS: Record<Quest, string[]> = {
  work: [
    "What's the one thing that, if accomplished, would move the needle the most?",
    'Fast-forward to {end}: what one accomplishment would make you proudest?',
    "What's the one thing that would make everything else easier or unnecessary?",
    'What have you been postponing that you know would be transformative?',
  ],
  life: [
    "What's the one thing that would bring the most joy, fulfilment, or peace to your personal life?",
    'Fast-forward to {end}: what one accomplishment would make you feel proudest?',
    "What's the one change that would positively impact every other area of your life?",
    'What have you been avoiding that would transform your relationships or happiness?',
  ],
}

/** Puts the Quarter's last day in for `{end}` */
export const withEnd = (text: string, quarter: Quarter) => text.replaceAll('{end}', endOf(quarter))
