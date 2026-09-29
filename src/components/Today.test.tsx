import 'fake-indexeddb/auto'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { IDBFactory } from 'fake-indexeddb'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from '../App'
import { open, type QuestContent } from '../lib/store'
import { isWriting } from '../lib/writing'
import { aMomentLater, flakyPhone, pretendNewerCadence, pretendOpened } from '../test/phone'

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

  it('leaves the build stamp to the Backup screen (spec §2.6)', async () => {
    itIs('2026-11-12T10:00')
    await launch()
    const { menu } = await openMenu()
    expect(menu.queryByText(/^Build /)).not.toBeInTheDocument()
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

describe('Reflections (spec §7)', () => {
  beforeEach(() => itIs('2026-11-12T10:00'))

  const THURSDAYS_PROMPT = "What's getting in the way right now, and what will you do when it shows up?"
  const page = (name: 'Work' | 'Life') => within(screen.getByRole('tabpanel', { name }))
  const popup = (name: 'Work' | 'Life') => within(screen.getByRole('dialog', { name: `${name} Reflection` }))
  /** A Reflection already saved today, before Cadence opens */
  const reflected = async (quest: 'work' | 'life', text: string) =>
    (await open(() => now)).saveReflection('2026-Q4', quest, text)

  it("writes today's Reflection on a Quest, under the day's Prompt, and keeps its line breaks", async () => {
    const user = userEvent.setup()
    const { unmount } = await launch()
    await user.click(page('Work').getByRole('button', { name: "Write today's Reflection" }))

    const work = popup('Work')
    expect(work.getByText('Work, Thu 12 Nov')).toBeInTheDocument()
    expect(work.getByText(THURSDAYS_PROMPT)).toBeInTheDocument()
    expect(work.getByRole('textbox', { name: 'Reflection' })).toHaveFocus()
    expect(work.getByRole('button', { name: 'Save' })).toBeDisabled()
    await user.keyboard('Shipped the ring.{Enter}Pages next.  ')
    await user.click(work.getByRole('button', { name: 'Save' }))

    const saved = await page('Work').findByText(/^Shipped the ring/)
    expect(saved.textContent).toBe('Shipped the ring.\nPages next.')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(page('Work').getByRole('button', { name: "Edit today's Reflection" })).toBeInTheDocument()
    expect(page('Life').getByRole('button', { name: "Write today's Reflection" })).toBeInTheDocument()

    unmount()
    await launch()
    expect(page('Work').getByText(/^Shipped the ring/).textContent).toBe('Shipped the ring.\nPages next.')
  })

  it('reopens a saved one to change until midnight, and saves the change in its place', async () => {
    const user = userEvent.setup()
    await reflected('work', 'Pages next')
    await launch()
    await user.click(page('Work').getByRole('button', { name: "Edit today's Reflection" }))

    const work = popup('Work')
    const field = work.getByRole('textbox', { name: 'Reflection' })
    expect(field).toHaveValue('Pages next')
    expect(field).toHaveFocus()
    expect(work.getByText('You can change it until midnight.')).toBeInTheDocument()
    await user.keyboard('  ')
    expect(work.getByRole('button', { name: 'Save' })).toBeDisabled() // spaces at the end change nothing
    await user.keyboard('{Backspace}{Backspace}, then the fold')
    await user.click(work.getByRole('button', { name: 'Save' }))

    expect(await page('Work').findByText('Pages next, then the fold')).toBeInTheDocument()
    expect(page('Work').queryByText('Pages next')).not.toBeInTheDocument()
  })

  it("saves into the new Day after midnight, leaving yesterday's as it was (spec §7.1)", async () => {
    const user = userEvent.setup()
    itIs('2026-11-12T23:58')
    await reflected('work', 'Pages next')
    await launch()
    await user.click(page('Work').getByRole('button', { name: "Edit today's Reflection" }))
    expect(popup('Work').getByText('You can change it until midnight.')).toBeInTheDocument()

    itIs('2026-11-13T00:01')
    act(() => void document.dispatchEvent(new Event('visibilitychange')))
    const work = popup('Work')
    expect(work.getByText('Work, Fri 13 Nov')).toBeInTheDocument()
    expect(work.queryByText('You can change it until midnight.')).not.toBeInTheDocument()
    await user.clear(work.getByRole('textbox', { name: 'Reflection' }))
    expect(work.getByRole('button', { name: 'Save' })).toBeDisabled() // nothing to remove today
    await user.keyboard('Pages next, still')
    await user.click(work.getByRole('button', { name: 'Save' }))

    expect(await page('Work').findByText('Pages next, still')).toBeInTheDocument()
    expect((await open(() => now)).snapshot().quarters['2026-Q4']?.reflections).toEqual({
      '2026-11-12': { work: { text: 'Pages next', prompt: THURSDAYS_PROMPT } },
      '2026-11-13': {
        work: { text: 'Pages next, still', prompt: 'Looking at the week so far, are your Commitments actually moving your Success Metrics?' },
      },
    })
  })

  it('removes a saved one once it is emptied, bringing back the pill', async () => {
    const user = userEvent.setup()
    await reflected('life', 'Ran 4K')
    await launch()
    await user.click(page('Life').getByRole('button', { name: "Edit today's Reflection" }))

    const life = popup('Life')
    await user.clear(life.getByRole('textbox', { name: 'Reflection' }))
    await user.type(life.getByRole('textbox', { name: 'Reflection' }), ' {Enter} ')
    expect(life.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument()
    await user.click(life.getByRole('button', { name: 'Remove' }))

    expect(await page('Life').findByRole('button', { name: "Write today's Reflection" })).toBeInTheDocument()
    expect(screen.queryByText('Ran 4K')).not.toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('closes at Cancel with nothing changed, and asks before discarding what was written', async () => {
    const user = userEvent.setup()
    await launch()
    const writeButton = () => page('Work').getByRole('button', { name: "Write today's Reflection" })
    await user.click(writeButton())
    await user.click(popup('Work').getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await user.click(writeButton())
    await user.keyboard('Pages next')
    await user.click(popup('Work').getByRole('button', { name: 'Cancel' }))
    const question = within(screen.getByRole('alertdialog', { name: 'Discard what you wrote?' }))
    await user.click(question.getByRole('button', { name: 'Keep writing' }))
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(popup('Work').getByRole('textbox', { name: 'Reflection' })).toHaveValue('Pages next')

    await user.click(popup('Work').getByRole('button', { name: 'Cancel' }))
    await user.click(screen.getByRole('button', { name: 'Discard' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(writeButton()).toBeInTheDocument()
    expect(screen.queryByText('Pages next')).not.toBeInTheDocument()
  })

  it('treats a tap outside the box, or Escape, as Cancel', async () => {
    const user = userEvent.setup()
    await launch()
    await user.click(page('Work').getByRole('button', { name: "Write today's Reflection" }))
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    await user.click(page('Work').getByRole('button', { name: "Write today's Reflection" }))
    await user.keyboard('Pages next')
    await user.click(screen.getByTestId('outside-the-popup'))
    expect(screen.getByRole('alertdialog', { name: 'Discard what you wrote?' })).toBeInTheDocument()
  })

  it('keeps the text in the field when the Quarter ended at midnight, so the save is refused (spec §7.1)', async () => {
    const user = userEvent.setup()
    itIs('2026-12-31T23:58')
    await launch()
    await user.click(page('Work').getByRole('button', { name: "Write today's Reflection" }))
    await user.keyboard('The last Day')

    itIs('2027-01-01T00:01')
    await user.click(popup('Work').getByRole('button', { name: 'Save' }))
    const refused = await screen.findByRole('alertdialog')
    expect(refused).toHaveTextContent("Q4 2026 ended at midnight, so this can't be saved.")
    await user.click(within(refused).getByRole('button', { name: 'OK' }))
    expect(popup('Work').getByRole('textbox', { name: 'Reflection' })).toHaveValue('The last Day')
    expect((await open(() => now)).snapshot().quarters['2026-Q4']?.reflections).toEqual({})
  })

  it('refuses at the last midnight even when the next Quarter is set up, and hands Today over once it closes', async () => {
    const user = userEvent.setup()
    const december = await open(() => new Date('2026-12-20T10:00'))
    await december.finishQuest('2027-Q1', 'work', work)
    await december.finishQuest('2027-Q1', 'life', life)
    itIs('2026-12-31T23:58')
    await launch()
    await user.click(page('Work').getByRole('button', { name: "Write today's Reflection" }))
    await user.keyboard('The last Day')

    itIs('2027-01-01T00:01')
    act(() => void document.dispatchEvent(new Event('visibilitychange')))
    await user.click(popup('Work').getByRole('button', { name: 'Save' }))
    expect(await screen.findByRole('alertdialog')).toHaveTextContent("Q4 2026 ended at midnight, so this can't be saved.")
    expect((await open(() => now)).snapshot().quarters['2027-Q1']?.reflections).toEqual({})

    await user.click(screen.getByRole('button', { name: 'OK' }))
    await user.click(popup('Work').getByRole('button', { name: 'Cancel' }))
    await user.click(screen.getByRole('button', { name: 'Discard' }))
    expect(screen.getByRole('img', { name: 'Day 1 of 90' })).toBeInTheDocument()
  })

  it("stays over Today at the last midnight, when a Draft for the next Quarter would resume setup, so its words aren't lost", async () => {
    const user = userEvent.setup()
    const december = await open(() => new Date('2026-12-20T10:00'))
    await december.saveSetupDraft('2027-Q1', {
      at: { quest: 'work', part: 'whyItMatters' },
      work: { mainQuest: 'write the book' },
      life: {},
    })
    itIs('2026-12-31T23:58')
    await launch()
    await user.click(page('Work').getByRole('button', { name: "Write today's Reflection" }))
    await user.keyboard('The last Day')

    itIs('2027-01-01T00:01')
    act(() => void document.dispatchEvent(new Event('visibilitychange')))
    await user.click(popup('Work').getByRole('button', { name: 'Save' }))
    expect(await screen.findByRole('alertdialog')).toHaveTextContent("Q4 2026 ended at midnight, so this can't be saved.")
    await user.click(screen.getByRole('button', { name: 'OK' }))
    expect(popup('Work').getByRole('textbox', { name: 'Reflection' })).toHaveValue('The last Day')

    // Once it closes, Cadence moves on to where the date says: setup, resumed
    await user.click(popup('Work').getByRole('button', { name: 'Cancel' }))
    await user.click(screen.getByRole('button', { name: 'Discard' }))
    expect(screen.getByText('Work Quest, part 2 of 6')).toBeInTheDocument()
  })

  it('keeps the text in the field when the save fails', async () => {
    const user = userEvent.setup()
    const phone = flakyPhone()
    await launch(phone.connect)
    await user.click(page('Life').getByRole('button', { name: "Write today's Reflection" }))
    await user.keyboard('Ran 4K')
    phone.failNextWrites('QuotaExceededError')
    await user.click(popup('Life').getByRole('button', { name: 'Save' }))

    expect(await screen.findByRole('alertdialog')).toHaveTextContent("Couldn't save: iPhone storage is full.")
    await user.click(screen.getByRole('button', { name: 'OK' }))
    expect(popup('Life').getByRole('textbox', { name: 'Reflection' })).toHaveValue('Ran 4K')
    expect(page('Life').getByRole('button', { name: "Write today's Reflection" })).toBeInTheDocument()
  })

  it("leaves yesterday's behind at midnight: today starts with the pill again", async () => {
    await reflected('work', 'Pages next')
    await launch()
    expect(page('Work').getByText('Pages next')).toBeInTheDocument()

    itIs('2026-11-13T07:30')
    act(() => void document.dispatchEvent(new Event('visibilitychange')))
    expect(page('Work').queryByText('Pages next')).not.toBeInTheDocument()
    expect(page('Work').getByRole('button', { name: "Write today's Reflection" })).toBeInTheDocument()
  })

  it.each([
    ['before Day 1', '2026-09-30T10:00'],
    ['once the Quarter has ended', '2027-01-02T10:00'],
  ])('offers no Reflection %s', async (_, when) => {
    itIs(when)
    await launch()
    expect(screen.queryByRole('button', { name: /today's Reflection/ })).not.toBeInTheDocument()
  })

  it('shows today\'s Reflection, but offers no change, when the data is from a newer Cadence (spec §13.4)', async () => {
    await reflected('work', 'Pages next')
    await pretendNewerCadence()
    await launch()
    expect(page('Work').getByText('Pages next')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /today's Reflection/ })).not.toBeInTheDocument()
  })

  it('holds off an update reload while the popup is open (spec §2.3)', async () => {
    const user = userEvent.setup()
    await launch()
    expect(isWriting()).toBe(false)
    await user.click(page('Work').getByRole('button', { name: "Write today's Reflection" }))
    expect(isWriting()).toBe(true)
    await user.click(popup('Work').getByRole('button', { name: 'Cancel' }))
    expect(isWriting()).toBe(false)
  })
})
