import { describe, expect, it } from 'vitest'
import { promptFor } from './prompts'

describe('promptFor', () => {
  it.each([
    ['2026-09-28', 'Mon', 'What is the one thing that must happen this week to feel real progress on this Quest?'],
    ['2026-09-29', 'Tue', "What's a small win from the last 24 hours that shows you're on track?"],
    ['2026-09-30', 'Wed', "What's the next step that would move this Quest forward?"],
    ['2026-10-01', 'Thu', "What's getting in the way right now, and what will you do when it shows up?"],
    ['2026-10-02', 'Fri', 'Looking at the week so far, are your Commitments actually moving your Success Metrics?'],
    [
      '2026-10-03',
      'Sat',
      'How do you actually feel about your progress right now: energized, drained, or neutral? Why?',
    ],
    ['2026-10-04', 'Sun', "Looking at next week, what's one specific change you could make to your Commitments?"],
    ['2026-11-12', 'Thu', "What's getting in the way right now, and what will you do when it shows up?"],
  ])('%s (%s)', (date, _weekday, prompt) => {
    expect(promptFor(date)).toBe(prompt)
  })
})
