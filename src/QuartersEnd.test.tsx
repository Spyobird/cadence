// A Quarter's end (spec §3.1, §5.4, §6.4): setting up the next Quarter in the last 14 days, handing over on 1 Jan,
// and the ended state when nothing new is set up

import 'fake-indexeddb/auto'
import { act, cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { IDBFactory } from 'fake-indexeddb'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from './App'
import { open, type QuestContent } from './lib/store'
import { aMomentLater, pretendOpened } from './test/phone'

let now: Date
/** Sets the phone's clock, in local time: "2026-12-20T10:00" */
const itIs = (when: string) => {
  now = new Date(when)
}

const work: QuestContent = {
  mainQuest: 'ship the redesigned onboarding flow',
  whyItMatters: 'stop us losing a third of new sign-ups',
  successMetrics: ['the new onboarding live for every sign-up'],
  whyItsExciting: "it's the first project I've led end to end",
  obstacle: '',
  commitments: ['Two hours of deep work every Monday morning'],
}
const life: QuestContent = {
  mainQuest: 'run 5K in under 25 minutes',
  whyItMatters: 'prove I can keep a promise to my own body',
  successMetrics: ['an official parkrun 5K under 25:00'],
  whyItsExciting: "I've never thought of myself as a runner",
  obstacle: '',
  commitments: ['Run every Tuesday, Thursday and Saturday at 6:30am'],
}

/** Sets up a Quarter's two Quests, on a day its setup was open */
async function setUp(quarter: '2026-Q3' | '2026-Q4' | '2027-Q1', on: string) {
  const store = await open(() => new Date(on))
  await store.finishQuest(quarter, 'work', work)
  await store.finishQuest(quarter, 'life', life)
}

/** Opens Cadence as the phone would: the real app over the real store */
async function launch() {
  return render(<App store={await open(() => now)} />)
}

/** The quiet line under the date on Today */
const boundaryLine = () => screen.getByTestId('boundary')
const button = (name: string) => screen.getByRole('button', { name })
const page = (name: 'Work' | 'Life') => within(screen.getByRole('tabpanel', { name }))
const mainQuestField = () => screen.getByRole('textbox', { name: 'My Work Main Quest is to' })

/** The ring's ticks, one per Day, by colour */
function ticks(ring: HTMLElement) {
  const strokes = Array.from(ring.querySelectorAll('line'), (line) => line.getAttribute('stroke'))
  return {
    count: strokes.length,
    passed: strokes.filter((stroke) => stroke === 'var(--gold-dim)').length,
    today: strokes.indexOf('var(--gold)') + 1 || undefined,
  }
}

beforeEach(async () => {
  indexedDB = new IDBFactory()
  pretendOpened('home screen (iOS)')
  await setUp('2026-Q4', '2026-09-29T10:00')
})

describe('the last 14 days (spec §6.4)', () => {
  it.each([
    ['2026-12-18T10:00', 'Q1 2027 starts in 14 days.'],
    ['2026-12-20T10:00', 'Q1 2027 starts in 12 days.'],
    ['2026-12-31T10:00', 'Q1 2027 starts in 1 day.'],
  ])('on %s, read "%s Set it up" under the date', async (when, line) => {
    itIs(when)
    await launch()
    expect(boundaryLine()).toHaveTextContent(`${line} Set it up`)
    expect(within(boundaryLine()).getByRole('button', { name: 'Set it up' })).toBeInTheDocument()
  })

  it('read "Q1 2027 is set up. It takes over on 1 Jan." once it is, with nothing to tap', async () => {
    await setUp('2027-Q1', '2026-12-19T10:00')
    itIs('2026-12-20T10:00')
    await launch()
    expect(boundaryLine()).toHaveTextContent(/^Q1 2027 is set up. It takes over on 1 Jan.$/)
    expect(within(boundaryLine()).queryByRole('button')).not.toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Day 81 of 92' })).toBeInTheDocument()
  })

  it('say nothing under the date before them', async () => {
    itIs('2026-12-17T10:00')
    await launch()
    expect(screen.queryByTestId('boundary')).not.toBeInTheDocument()
  })
})

describe('setup started from Today (spec §5.4)', () => {
  beforeEach(() => itIs('2026-12-20T10:00'))

  it('opens on the Upcoming Quarter from "Set it up", with Close back to Today, which then reads "Finish setting it up"', async () => {
    const user = userEvent.setup()
    await launch()
    await user.click(button('Set it up'))
    expect(screen.getByText('Q1 2027 · 1 Jan – 31 Mar')).toBeInTheDocument()
    expect(screen.getByText('Work Quest, part 1 of 6')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Switch to/ })).not.toBeInTheDocument()
    await user.type(mainQuestField(), 'write the book')
    await user.click(button('Close'))

    expect(screen.getByRole('img', { name: 'Day 81 of 92' })).toBeInTheDocument()
    expect(boundaryLine()).toHaveTextContent('Q1 2027 starts in 12 days. Finish setting it up')
    await user.click(within(boundaryLine()).getByRole('button', { name: 'Finish setting it up' }))
    expect(screen.getByText('Q1 2027 · 1 Jan – 31 Mar')).toBeInTheDocument()
    expect(mainQuestField()).toHaveValue('write the book')
  })

  it('keeps the Draft when Cadence is closed, and still opens on Today, since the Current Quarter is running', async () => {
    const user = userEvent.setup()
    await launch()
    await user.click(button('Set it up'))
    await user.type(mainQuestField(), 'write the book')
    await aMomentLater()
    cleanup()

    await launch()
    expect(screen.getByRole('img', { name: 'Day 81 of 92' })).toBeInTheDocument()
    await user.click(button('Finish setting it up'))
    expect(screen.getByText('Picked up where you left off.')).toBeInTheDocument()
    expect(mainQuestField()).toHaveValue('write the book')
  })

  it('carries on past midnight into the new Quarter, which it now resumes, so Close goes', async () => {
    const user = userEvent.setup()
    itIs('2026-12-31T23:58')
    await launch()
    await user.click(button('Set it up'))
    await user.type(mainQuestField(), 'write the book')
    expect(button('Close')).toBeInTheDocument()

    itIs('2027-01-01T00:01')
    act(() => void document.dispatchEvent(new Event('visibilitychange')))
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument()
    await user.type(mainQuestField(), ' this year')
    await aMomentLater()
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect((await open(() => now)).snapshot().setupDrafts['2027-Q1']?.work.mainQuest).toBe('write the book this year')
  })

  it('finishes the Upcoming Quarter, and "Go to Today" comes back to the Current one, which says so', async () => {
    const user = userEvent.setup()
    await (await open(() => now)).finishQuest('2027-Q1', 'work', work)
    await launch()
    await user.click(button('Finish setting it up'))
    expect(screen.getByText('Life Quest, part 1 of 6')).toBeInTheDocument()
    await user.type(screen.getByRole('textbox', { name: 'My Life Main Quest is to' }), 'run a marathon{Enter}')
    await user.keyboard('prove it to myself{Enter}')
    await user.keyboard('a finish time{Enter}{Enter}')
    await user.keyboard('I never have{Enter}')
    await user.click(button('Skip for now'))
    await user.keyboard('Run four times a week{Enter}{Enter}')
    await user.click(button('Finish Life Quest'))

    expect(await screen.findByText('Q1 2027 is set up')).toBeInTheDocument()
    await user.click(button('Go to Today'))
    expect(screen.getByRole('img', { name: 'Day 81 of 92' })).toBeInTheDocument()
    expect(boundaryLine()).toHaveTextContent('Q1 2027 is set up. It takes over on 1 Jan.')
  })
})

describe('the ended state (spec §6.4)', () => {
  beforeEach(() => itIs('2027-01-02T10:00'))

  it('shows the ring full under today\'s date, says the Quarter is over, and offers to set up the next, or export first', async () => {
    await launch()
    expect(ticks(screen.getByRole('img', { name: 'Q4 2026 has ended' }))).toEqual({ count: 92, passed: 92, today: undefined })
    expect(screen.getByText('Saturday 2 Jan')).toBeInTheDocument()
    const boundary = within(boundaryLine())
    expect(boundary.getByText('Q4 2026 is over. Its Quests are kept as they were.')).toBeInTheDocument()
    expect(boundary.getByRole('button', { name: 'Set up Q1 2027' })).toBeInTheDocument()
    expect(boundary.getByRole('button', { name: 'Export a backup first' })).toBeInTheDocument()
    for (const name of ['Work', 'Life'] as const) {
      expect(page(name).getByText('Reflecting starts again once Q1 2027 is set up.')).toBeVisible()
    }
    expect(screen.queryByRole('button', { name: /today's Reflection/ })).not.toBeInTheDocument()
  })

  it('opens a blank setup for Q1 2027 from "Set up Q1 2027", with no Close, and resumes it once something is typed', async () => {
    const user = userEvent.setup()
    await launch()
    await user.click(button('Set up Q1 2027'))
    expect(screen.getByText('Q1 2027 · 1 Jan – 31 Mar')).toBeInTheDocument()
    expect(mainQuestField()).toHaveValue('')
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument()
    await user.type(mainQuestField(), 'write the book')
    await aMomentLater()
    cleanup()

    await launch()
    expect(screen.getByText('Picked up where you left off.')).toBeInTheDocument()
    expect(mainQuestField()).toHaveValue('write the book')
  })

  it('opens the Backup screen from "Export a backup first", and comes back', async () => {
    const user = userEvent.setup()
    await launch()
    await user.click(button('Export a backup first'))
    expect(screen.getByRole('heading', { name: 'Backup' })).toBeInTheDocument()
    await user.click(button('Today'))
    expect(screen.getByText('Q4 2026 is over. Its Quests are kept as they were.')).toBeInTheDocument()
  })

  it('makes a backup due, though the last was made two days ago, before the Quarter ended (spec §6.3)', async () => {
    await (await open(() => new Date('2026-12-31T22:00'))).markBackedUp()
    await launch()
    expect(screen.getByRole('button', { name: 'Menu' })).toHaveAccessibleDescription('A backup is due')
  })

  it('shows the latest set-up Quarter when a Quarter was skipped, and sets up the Current one', async () => {
    const user = userEvent.setup()
    indexedDB = new IDBFactory()
    await setUp('2026-Q3', '2026-06-29T10:00')
    itIs('2027-01-15T10:00')
    await launch()
    expect(ticks(screen.getByRole('img', { name: 'Q3 2026 has ended' }))).toEqual({ count: 92, passed: 92, today: undefined })
    expect(screen.getByText('Q3 2026 is over. Its Quests are kept as they were.')).toBeInTheDocument()
    expect(page('Work').getByText('Reflecting starts again once Q1 2027 is set up.')).toBeVisible()
    await user.click(button('Set up Q1 2027'))
    expect(screen.getByText('Q1 2027 · 1 Jan – 31 Mar')).toBeInTheDocument()
  })

  it('never resumes a Draft frozen at its Quarter\'s end, and keeps it stored (spec §3.1)', async () => {
    const user = userEvent.setup()
    indexedDB = new IDBFactory()
    await setUp('2026-Q3', '2026-06-29T10:00')
    // On 20 Dec, with Q4 skipped so far, setup for Q4 is started from the ended state, and left
    itIs('2026-12-20T10:00')
    await launch()
    await user.click(button('Set up Q4 2026'))
    await user.type(mainQuestField(), 'write the book')
    await aMomentLater()
    cleanup()

    itIs('2027-01-02T10:00')
    await launch()
    expect(screen.getByText('Q3 2026 is over. Its Quests are kept as they were.')).toBeInTheDocument()
    await user.click(button('Set up Q1 2027'))
    expect(screen.getByText('Q1 2027 · 1 Jan – 31 Mar')).toBeInTheDocument()
    expect(mainQuestField()).toHaveValue('')
    expect((await open(() => now)).snapshot().setupDrafts['2026-Q4']?.work.mainQuest).toBe('write the book')
  })
})

describe('the handover at midnight on 1 Jan (spec §3.1)', () => {
  afterEach(() => vi.useRealTimers())

  /** Opens Cadence on Today at 23:59:58 on 31 Dec, and lets the clock run past midnight */
  async function openOnTheLastDay() {
    vi.useFakeTimers({ now: new Date('2026-12-31T23:59:58'), toFake: ['setTimeout', 'clearTimeout', 'Date'] })
    render(<App store={await open(() => new Date())} />)
    expect(screen.getByRole('img', { name: 'Day 92 of 92' })).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(2000))
  }

  it('hands Today over to a set-up Q1 2027', async () => {
    await setUp('2027-Q1', '2026-12-20T10:00')
    await openOnTheLastDay()
    expect(screen.getByRole('img', { name: 'Day 1 of 90' })).toBeInTheDocument()
    expect(screen.getByText('Friday 1 Jan')).toBeInTheDocument()
    expect(screen.queryByTestId('boundary')).not.toBeInTheDocument()
    expect(page('Work').getByRole('button', { name: "Write today's Reflection" })).toBeInTheDocument()
  })

  it("resumes a Q1 2027 Draft started in December", async () => {
    await (await open(() => new Date('2026-12-20T10:00'))).saveSetupDraft('2027-Q1', {
      at: { quest: 'work', part: 'whyItMatters' },
      work: { mainQuest: 'write the book' },
      life: {},
    })
    await openOnTheLastDay()
    expect(screen.getByText('Q1 2027 · 1 Jan – 31 Mar')).toBeInTheDocument()
    expect(screen.getByText('Work Quest, part 2 of 6')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument()
  })

  it('ends the Quarter when nothing new is set up', async () => {
    await openOnTheLastDay()
    expect(screen.getByRole('img', { name: 'Q4 2026 has ended' })).toBeInTheDocument()
    expect(screen.getByText('Q4 2026 is over. Its Quests are kept as they were.')).toBeInTheDocument()
  })
})
