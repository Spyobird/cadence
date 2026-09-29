import type { LocalDate } from './quarters'

/** One Prompt per weekday, Sunday first as Date counts them, shared by both Quests (spec §7.2) */
const PROMPTS = [
  "Looking at next week, what's one specific change you could make to your Commitments?",
  'What is the one thing that must happen this week to feel real progress on this Quest?',
  "What's a small win from the last 24 hours that shows you're on track?",
  "What's the next step that would move this Quest forward?",
  "What's getting in the way right now, and what will you do when it shows up?",
  'Looking at the week so far, are your Commitments actually moving your Success Metrics?',
  'How do you actually feel about your progress right now: energized, drained, or neutral? Why?',
] as const

/** The Prompt for a Day's date */
export function promptFor(date: LocalDate): string {
  // A date-only string parses as UTC midnight, so the UTC weekday is the calendar's
  return PROMPTS[new Date(date).getUTCDay()]!
}
