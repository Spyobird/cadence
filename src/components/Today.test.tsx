import 'fake-indexeddb/auto'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { IDBFactory } from 'fake-indexeddb'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../App'
import { open, type QuestContent } from '../lib/store'
import { aMomentLater, flakyPhone, pretendOpened } from '../test/phone'

let now: Date
/** Sets the phone's clock, in local time: "2026-11-12T10:00" */
const itIs = (when: string) => {
  now = new Date(when)
}

const work: QuestContent = {
  mainQuest: 'ship the redesigned onboarding flow to every new customer',
  whyItMatters: 'stop us losing a third of new sign-ups in their first week',
  successMetrics: ['the new onboarding live for every new sign-up', 'week-one drop-off below 20%'],
  whyItsExciting: "it's the first project I've led end to end",
  obstacle: '',
  commitments: ['Two hours of deep work every Monday morning'],
}

const life: QuestContent = {
  mainQuest: 'run 5K in under 25 minutes',
  whyItMatters: 'prove I can keep a promise to my own body',
  successMetrics: ['an official parkrun 5K under 25:00'],
  whyItsExciting: "I've never thought of myself as a runner",
  obstacle: 'late client calls, and when one runs over I run at 6:30 the next morning',
  commitments: ['Run every Tuesday, Thursday and Saturday at 6:30am', 'sign up for the 13 December parkrun'],
}

/** Q4 2026 set up on 29 Sep, as the owner did */
async function setUpQ4() {
  const store = await open(() => new Date('2026-09-29T10:00'))
  await store.finishQuest('2026-Q4', 'work', work)
  await store.finishQuest('2026-Q4', 'life', life)
}

/** Opens Cadence as the phone would: the real app over the real store */
async function launch(connect?: Parameters<typeof open>[1]) {
  return render(<App store={await open(() => now, connect)} />)
}

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
  await setUpQ4()
})

describe('the day', () => {
  it('shows Day 43 of 92 on Thursday 12 Nov', async () => {
    itIs('2026-11-12T10:00')
    await launch()

    const ring = screen.getByRole('img', { name: 'Day 43 of 92' })
    expect(within(ring).getByText('43')).toBeInTheDocument()
    expect(within(ring).getByText('of 92')).toBeInTheDocument()
    expect(ticks(ring)).toEqual({ count: 92, passed: 42, today: 43 })
    expect(screen.getByText('Thursday 12 Nov')).toBeInTheDocument()
    expect(screen.queryByText(/Reflections start/)).not.toBeInTheDocument()
  })

  it('counts the days to go before Day 1, with the ring empty', async () => {
    itIs('2026-09-29T10:00')
    await launch()

    const ring = screen.getByRole('img', { name: '2 days to go' })
    expect(within(ring).getByText('2')).toBeInTheDocument()
    expect(within(ring).getByText('days to go')).toBeInTheDocument()
    expect(ticks(ring)).toEqual({ count: 92, passed: 0, today: undefined })
    expect(screen.getByText('Starts Thursday 1 Oct')).toBeInTheDocument()
    for (const name of ['Work', 'Life']) {
      expect(within(screen.getByRole('tabpanel', { name })).getByText('Reflections start on Day 1, Thursday 1 Oct.')).toBeVisible()
    }
  })

  it('has one day to go on the eve of Day 1', async () => {
    itIs('2026-09-30T22:00')
    await launch()
    expect(screen.getByRole('img', { name: '1 day to go' })).toHaveTextContent('1day to go')
  })

  it('shows Day 1 on the first day, and Day 92 on the last', async () => {
    itIs('2026-10-01T00:00')
    const { unmount } = await launch()
    expect(ticks(screen.getByRole('img', { name: 'Day 1 of 92' }))).toEqual({ count: 92, passed: 0, today: 1 })
    unmount()

    itIs('2026-12-31T23:59')
    await launch()
    expect(ticks(screen.getByRole('img', { name: 'Day 92 of 92' }))).toEqual({ count: 92, passed: 91, today: 92 })
    expect(screen.getByText('Thursday 31 Dec')).toBeInTheDocument()
  })
})

describe('once the Quarter has ended (the rest is slice 9)', () => {
  it('shows the ring full, under today\'s date (spec §6.1, §6.4)', async () => {
    itIs('2027-01-02T10:00')
    await launch()
    expect(ticks(screen.getByRole('img', { name: 'Q4 2026 has ended' }))).toEqual({ count: 92, passed: 92, today: undefined })
    expect(screen.getByText('Saturday 2 Jan')).toBeInTheDocument()
  })
})

it('warns across the top of Today when opened in a Safari tab (spec §6.4)', async () => {
  pretendOpened('safari tab')
  itIs('2026-09-29T10:00')
  await launch()
  expect(screen.getByRole('alert')).toHaveTextContent('Open Cadence from your Home Screen')
  expect(screen.getByRole('img', { name: '2 days to go' })).toBeInTheDocument()
})

describe('the pages', () => {
  beforeEach(() => itIs('2026-11-12T10:00'))

  it('are Work then Life, each opening on its Main Quest as stored, with Work in view', async () => {
    await launch()
    const tabs = screen.getAllByRole('tab')
    expect(tabs.map((tab) => tab.textContent)).toEqual(['Work', 'Life'])
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true')
    expect(tabs[1]).toHaveAttribute('aria-selected', 'false')

    const pages = screen.getAllByRole('tabpanel')
    expect(pages.map((page) => page.getAttribute('aria-label'))).toEqual(['Work', 'Life'])
    expect(within(pages[0]!).getByText('My Work Main Quest is to')).toBeInTheDocument()
    expect(within(pages[0]!).getByRole('heading', { name: work.mainQuest })).toBeInTheDocument()
    expect(within(pages[1]!).getByText('My Life Main Quest is to')).toBeInTheDocument()
    expect(within(pages[1]!).getByRole('heading', { name: 'run 5K in under 25 minutes' })).toBeInTheDocument()
  })

  it('switch at a tap', async () => {
    const user = userEvent.setup()
    await launch()
    await user.click(screen.getByRole('tab', { name: 'Life' }))
    expect(screen.getByRole('tab', { name: 'Life' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Work' })).toHaveAttribute('aria-selected', 'false')
  })
})

describe('folding', () => {
  beforeEach(() => itIs('2026-11-12T10:00'))

  const page = (name: 'Work' | 'Life') => within(screen.getByRole('tabpanel', { name }))

  it('opens a page folded, and unfolds the whole Quest, each part under its name, with no openings', async () => {
    const user = userEvent.setup()
    await launch()
    const workPage = page('Work')
    expect(workPage.getByText('Why it matters')).not.toBeVisible()

    await user.click(workPage.getByRole('button', { name: 'Read the whole Quest' }))
    expect(workPage.getByRole('button', { name: 'Fold it away' })).toHaveAttribute('aria-expanded', 'true')
    expect(workPage.getAllByRole('heading', { level: 3 }).map((part) => part.textContent)).toEqual([
      'Why it matters',
      'Success Metrics',
      "Why it's exciting",
      'Commitments', // an empty Obstacle is left out
    ])
    // Each part starts with a capital here, and lists are numbered
    expect(workPage.getByText('Stop us losing a third of new sign-ups in their first week')).toBeVisible()
    expect(workPage.getByText("It's the first project I've led end to end")).toBeVisible()
    const [metrics, commitments] = workPage.getAllByRole('list')
    expect(within(metrics!).getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'The new onboarding live for every new sign-up',
      'Week-one drop-off below 20%',
    ])
    expect(within(commitments!).getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'Two hours of deep work every Monday morning',
    ])
    expect(screen.queryByText(/single most important thing/)).not.toBeInTheDocument()
    expect(screen.queryByText(/I'll have:/)).not.toBeInTheDocument()

    await user.click(workPage.getByRole('button', { name: 'Fold it away' }))
    expect(workPage.getByRole('button', { name: 'Read the whole Quest' })).toHaveAttribute('aria-expanded', 'false')
    expect(workPage.getByText('Why it matters')).not.toBeVisible()
  })

  it("shows a written Obstacle, and folds each page on its own", async () => {
    const user = userEvent.setup()
    await launch()
    await user.click(page('Life').getByRole('button', { name: 'Read the whole Quest' }))

    expect(page('Life').getByRole('heading', { name: 'Obstacle' })).toBeVisible()
    expect(page('Life').getByText('Late client calls, and when one runs over I run at 6:30 the next morning')).toBeVisible()
    expect(page('Life').getByText('Sign up for the 13 December parkrun')).toBeVisible()
    expect(page('Work').getByText('Why it matters')).not.toBeVisible()
  })

  it('shows the Main Quest as stored, in lower case', async () => {
    await launch()
    expect(page('Work').getByRole('heading', { level: 2 })).toHaveTextContent(/^ship the redesigned/)
  })
})

describe('the menu', () => {
  const openMenu = async () => {
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Menu' }))
    return { user, menu: within(screen.getByRole('dialog', { name: 'Menu' })) }
  }

  it('sums up the Quarter, then the Work and Life Quests', async () => {
    itIs('2026-11-12T10:00')
    await launch()
    const { menu } = await openMenu()
    expect(menu.getByText('Q4 2026')).toBeInTheDocument()
    expect(menu.getByText('Day 43 of 92, 49 to go')).toBeInTheDocument()
    expect(menu.getAllByText(/^(Work|Life) Quest$/).map((row) => row.textContent)).toEqual(['Work Quest', 'Life Quest'])
  })

  it.each([
    ['2026-09-29T10:00', 'Starts in 2 days'],
    ['2026-09-30T10:00', 'Starts in 1 day'],
  ])('on %s, before Day 1, reads "%s"', async (when, line) => {
    itIs(when)
    await launch()
    const { menu } = await openMenu()
    expect(menu.getByText(line)).toBeInTheDocument()
  })

  it('shows which build is running, until the Backup screen takes it (spec §2.6)', async () => {
    itIs('2026-11-12T10:00')
    await launch()
    const { menu } = await openMenu()
    expect(menu.getByText(/^Build \S+$/)).toBeInTheDocument()
  })

  it('says when the Appearance could not be saved, and keeps the look as it was', async () => {
    itIs('2026-11-12T10:00')
    const phone = flakyPhone()
    await launch(phone.connect)
    const { user, menu } = await openMenu()
    phone.failNextWrites('QuotaExceededError')
    await user.click(menu.getByRole('radio', { name: 'Dark' }))
    await aMomentLater()

    expect(screen.getByRole('alertdialog')).toHaveTextContent("Couldn't save: iPhone storage is full.")
    expect(menu.getByRole('radio', { name: 'System' })).toBeChecked()
    expect(document.documentElement).toHaveAttribute('data-look', 'system')
  })

  it('closes on a tap outside it, or Escape, handing focus back to the menu button', async () => {
    itIs('2026-11-12T10:00')
    await launch()
    const { user } = await openMenu()
    await user.click(screen.getByTestId('scrim'))
    expect(screen.queryByRole('dialog', { name: 'Menu' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Menu' })).toHaveFocus()

    await openMenu()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: 'Menu' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Menu' })).toHaveFocus()
  })
})

describe('a new day (spec §3)', () => {
  afterEach(() => vi.useRealTimers())

  it('comes in at midnight, with Today open', async () => {
    vi.useFakeTimers({ now: new Date('2026-09-30T23:59:58'), toFake: ['setTimeout', 'clearTimeout', 'Date'] })
    render(<App store={await open(() => new Date())} />)
    expect(screen.getByText('Starts Thursday 1 Oct')).toBeInTheDocument()

    await act(() => vi.advanceTimersByTimeAsync(1000))
    expect(screen.getByText('Starts Thursday 1 Oct')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(1000))
    expect(screen.getByText('Thursday 1 Oct')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Day 1 of 92' })).toBeInTheDocument()

    // And again the midnight after
    await act(() => vi.advanceTimersByTimeAsync(24 * 60 * 60 * 1000))
    expect(screen.getByText('Friday 2 Oct')).toBeInTheDocument()
  })

  it('comes in when Cadence is shown again', async () => {
    itIs('2026-11-12T22:00')
    await launch()
    itIs('2026-11-13T07:30')
    act(() => void document.dispatchEvent(new Event('visibilitychange')))
    expect(screen.getByText('Friday 13 Nov')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Day 44 of 92' })).toBeInTheDocument()
  })
})
