import 'fake-indexeddb/auto'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { IDBFactory } from 'fake-indexeddb'
import { beforeEach, describe, expect, it } from 'vitest'
import { App } from '../App'
import { open, type QuestContent } from '../lib/store'
import { pretendOpened } from '../test/phone'

let now: Date
/** Sets the phone's clock, in local time: "2026-11-12T10:42" */
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
const life: QuestContent = { ...work, mainQuest: 'run 5K in under 25 minutes' }

/** The Work Quest as it changed: set up on 29 Sep, edited on 2 Oct and 12 Nov */
const edits: [string, QuestContent][] = [
  ['2026-10-02T09:00', { ...work, obstacle: 'late client calls, so I move deep work to Tuesday' }],
  ['2026-11-12T10:42', { ...work, mainQuest: 'ship onboarding to every new customer, and measure week one' }],
]

/** Q4 2026 set up on 29 Sep, as the owner did, and the Work Quest edited since */
async function setUpQ4() {
  const store = await open(() => now)
  itIs('2026-09-29T10:00')
  await store.finishQuest('2026-Q4', 'work', work)
  await store.finishQuest('2026-Q4', 'life', life)
  for (const [when, content] of edits) {
    itIs(when)
    await store.saveQuest('2026-Q4', 'work', content)
  }
}

/** Opens Cadence as the phone would: the real app over the real store */
async function launch() {
  return render(<App store={await open(() => now)} />)
}

/** Opens the menu on Today, then History on a Quest */
async function openHistory(quest: 'Work' | 'Life') {
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: 'Menu' }))
  const menu = within(screen.getByRole('dialog', { name: 'Menu' }))
  await user.click(within(menu.getByRole('group', { name: `${quest} Quest` })).getByRole('button', { name: 'History' }))
  return user
}

beforeEach(async () => {
  indexedDB = new IDBFactory()
  pretendOpened('home screen (iOS)')
  await setUpQ4()
  itIs('2026-11-14T08:00')
})

describe('History (spec §9)', () => {
  it("lists the Versions newest first, each with its date and Day and its Main Quest, and marks the newest Current", async () => {
    await launch()
    const user = await openHistory('Work')

    expect(screen.getByRole('heading', { name: 'Work History' })).toBeInTheDocument()
    const rows = screen.getAllByRole('listitem')
    expect(rows.map((row) => row.textContent)).toEqual([
      '12 Nov · Day 43CurrentShip onboarding to every new customer, and measure week one',
      '2 Oct · Day 2Ship the redesigned onboarding flow',
      '29 Sep · before Day 1Ship the redesigned onboarding flow',
    ])

    await user.click(screen.getByRole('button', { name: 'Today' }))
    expect(screen.getByRole('img', { name: 'Day 45 of 92' })).toBeInTheDocument()
  })

  it('opens a tapped row as the whole Version, read-only, laid out as the read-back', async () => {
    await launch()
    const user = await openHistory('Work')
    await user.click(screen.getByRole('button', { name: /^2 Oct · Day 2/ }))

    expect(screen.getByText('2 Oct · Day 2')).toBeInTheDocument()
    expect(screen.queryByText(/Current/)).not.toBeInTheDocument()
    expect(screen.getByText('My Work Main Quest is to').parentElement).toHaveTextContent(
      'My Work Main Quest is to ship the redesigned onboarding flow',
    )
    expect(screen.getByText("What's most likely to get in my way is").parentElement).toHaveTextContent(
      "What's most likely to get in my way is late client calls, so I move deep work to Tuesday",
    )
    // Nothing to tap but the way back: no restore, no comparing
    expect(screen.getAllByRole('button').map((button) => button.textContent)).toEqual(['History'])

    await user.click(screen.getByRole('button', { name: 'History' }))
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
    await user.click(screen.getByRole('button', { name: /^29 Sep · before Day 1/ }))
    // An empty Obstacle is left out
    expect(screen.queryByText("What's most likely to get in my way is")).not.toBeInTheDocument()
  })

  it("stays readable once the Quarter has ended, and has Life's own Versions", async () => {
    itIs('2027-01-02T10:00')
    await launch()
    await openHistory('Life')
    expect(screen.getByRole('heading', { name: 'Life History' })).toBeInTheDocument()
    expect(screen.getAllByRole('listitem').map((row) => row.textContent)).toEqual([
      '29 Sep · before Day 1CurrentRun 5K in under 25 minutes',
    ])
  })
})
