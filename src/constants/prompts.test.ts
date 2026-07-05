import { WEEKLY_PROMPTS } from './prompts'

describe('WEEKLY_PROMPTS', () => {
  it('should have exactly 7 prompts, one for each day of the week', () => {
    expect(WEEKLY_PROMPTS).toHaveLength(7)
  })

  it('should have a prompt for Monday (index 0)', () => {
    expect(WEEKLY_PROMPTS[0]).toBe(
      "What is the one thing that must happen this week to feel real progress on this quest?"
    )
  })

  it('should have a prompt for Tuesday (index 1)', () => {
    expect(WEEKLY_PROMPTS[1]).toBe(
      "What's a small victory from the last 24 hours that confirms you're on the right track?"
    )
  })

  it('should have a prompt for Wednesday (index 2)', () => {
    expect(WEEKLY_PROMPTS[2]).toBe(
      "How is the momentum? What needs a course correction for the rest of the week?"
    )
  })

  it('should have a prompt for Thursday (index 3)', () => {
    expect(WEEKLY_PROMPTS[3]).toBe(
      "What is currently the biggest source of resistance or friction for this goal?"
    )
  })

  it('should have a prompt for Friday (index 4)', () => {
    expect(WEEKLY_PROMPTS[4]).toBe(
      "Looking at the week as a whole, did your actions align with your success metrics?"
    )
  })

  it('should have a prompt for Saturday (index 5)', () => {
    expect(WEEKLY_PROMPTS[5]).toBe(
      "How do you actually feel about your progress right now—energized, drained, or neutral? Why?"
    )
  })

  it('should have a prompt for Sunday (index 6)', () => {
    expect(WEEKLY_PROMPTS[6]).toBe(
      "Looking at next week, what's one specific adjustment you can make to your commitments?"
    )
  })
})