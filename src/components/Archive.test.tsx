import 'fake-indexeddb/auto'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { IDBFactory } from 'fake-indexeddb'
import { createStore, update } from 'idb-keyval'
import { beforeEach, describe, expect, it } from 'vitest'
import { App } from '../App'
import { open, type QuarterRecord, type Quest, type QuestContent, type Store } from '../lib/store'
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

/** Both of a Quarter's Quests finished, as setup would */
async function setUp(store: Store, quarter: '2026-Q4' | '2027-Q1') {
  await store.finishQuest(quarter, 'work', work)
  await store.finishQuest(quarter, 'life', life)
}

/** Opens Cadence as the phone would: the real app over the real store */
async function launch() {
  return render(<App store={await open(() => now)} />)
}

/** Opens the menu on Today, then the Archive */
async function openArchive() {
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: 'Menu' }))
  const menu = within(screen.getByRole('dialog', { name: 'Menu' }))
  await user.click(menu.getByRole('button', { name: /^Archive/ }))
  return user
}

/** Reflections written across Q4 2026 and Q1 2027, which was set up in Q4's last days */
async function reflectAcrossTwoQuarters() {
  const store = await open(() => now)
  itIs('2026-09-29T10:00')
  await setUp(store, '2026-Q4')
  itIs('2026-11-12T07:30')
  await store.saveReflection('2026-Q4', 'work', 'The client calls ate Monday again.\nDeep work moves to Tuesday.')
  itIs('2026-11-12T21:10')
  await store.saveReflection('2026-Q4', 'life', 'Ran 5K in 26:40.')
  itIs('2026-12-20T09:00')
  await setUp(store, '2027-Q1')
  itIs('2026-12-28T08:00')
  await store.saveReflection('2026-Q4', 'life', 'A rest week, and it felt right.')
  itIs('2027-01-08T08:00')
  await store.saveReflection('2027-Q1', 'work', 'Planned the first sprint.')
}

/** Thursday's Prompt as an earlier Cadence worded it, before the Prompts changed */
const OLDER_THURSDAY = 'What stands in your way today?'

/** Leaves 12 Nov's Reflections on these Quests as that earlier Cadence saved them, with its copy of Thursday's Prompt */
const writtenUnderOlderPrompts = (...quests: Quest[]) =>
  update<QuarterRecord>(
    'quarter:2026-Q4',
    (record) => {
      for (const quest of quests) record!.reflections['2026-11-12']![quest]!.prompt = OLDER_THURSDAY
      return record!
    },
    createStore('cadence', 'kv'),
  )

/** A Day in the Archive as it reads: its header, then each Reflection under its label */
function read(day: HTMLElement) {
  const labels = within(day).getAllByRole('term')
  const texts = within(day).getAllByRole('definition')
  return {
    header: within(day).getByRole('heading').textContent,
    reflections: labels.map((label, index) => [label.textContent, texts[index]?.textContent]),
  }
}

beforeEach(() => {
  indexedDB = new IDBFactory()
  pretendOpened('home screen (iOS)')
})

describe('the Archive (spec §11)', () => {
  it('reads "No Reflections yet." before any is written, and goes back to Today', async () => {
    const store = await open(() => now)
    itIs('2026-09-29T10:00')
    await setUp(store, '2026-Q4')
    itIs('2026-11-14T08:00')
    await launch()
    const user = await openArchive()

    expect(screen.getByRole('heading', { name: 'Archive' })).toBeInTheDocument()
    expect(screen.getByText('No Reflections yet.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Today' }))
    expect(screen.getByRole('img', { name: 'Day 45 of 92' })).toBeInTheDocument()
  })

  it("groups every Reflection by Day, newest Day first across Quarters, Work before Life, with the year only when it isn't this year", async () => {
    await reflectAcrossTwoQuarters()
    itIs('2027-01-09T08:00')
    await launch()
    await openArchive()

    expect(within(screen.getByRole('main')).getAllByRole('region').map(read)).toEqual([
      { header: 'Fri 8 Jan · Day 8', reflections: [['Work', 'Planned the first sprint.']] },
      { header: 'Mon 28 Dec 2026 · Day 89', reflections: [['Life', 'A rest week, and it felt right.']] },
      {
        header: 'Thu 12 Nov 2026 · Day 43',
        reflections: [
          ['Work', 'The client calls ate Monday again.\nDeep work moves to Tuesday.'],
          ['Life', 'Ran 5K in 26:40.'],
        ],
      },
    ])
  })

  it("shows each Day's stored Prompt once, not today's, even after the Prompts are worded differently", async () => {
    await reflectAcrossTwoQuarters()
    await writtenUnderOlderPrompts('work', 'life')
    // A Saturday
    itIs('2027-01-09T08:00')
    await launch()
    await openArchive()

    const days = within(screen.getByRole('main')).getAllByRole('region')
    expect(
      within(days[0]!).getByText('Looking at the week so far, are your Commitments actually moving your Success Metrics?'),
    ).toBeInTheDocument()
    expect(
      within(days[1]!).getByText('What is the one thing that must happen this week to feel real progress on this Quest?'),
    ).toBeInTheDocument()
    expect(within(days[2]!).getByText(OLDER_THURSDAY)).toBeInTheDocument()
    expect(screen.queryByText("What's getting in the way right now, and what will you do when it shows up?")).not.toBeInTheDocument()
    expect(screen.queryByText(/^How do you actually feel about your progress/)).not.toBeInTheDocument()
  })

  it("shows a Reflection's own Prompt when it differs from its Day's, as when Cadence updated between the two", async () => {
    await reflectAcrossTwoQuarters()
    // Work was written before an update reworded the Prompts, and Life after it
    await writtenUnderOlderPrompts('work')
    itIs('2027-01-09T08:00')
    await launch()
    await openArchive()

    const thursday = within(screen.getByRole('main')).getAllByRole('region')[2]!
    expect(within(thursday).getByText(OLDER_THURSDAY)).toBeInTheDocument()
    const [workText, lifeText] = within(thursday).getAllByRole('definition')
    expect(workText).not.toHaveTextContent(OLDER_THURSDAY)
    expect(lifeText).toHaveTextContent("What's getting in the way right now, and what will you do when it shows up?")
    expect(lifeText).toHaveTextContent('Ran 5K in 26:40.')
  })
})

describe("the menu's Archive row (spec §6.3)", () => {
  /** Opens the menu on Today, and finds its Archive row */
  async function archiveRow() {
    await userEvent.setup().click(screen.getByRole('button', { name: 'Menu' }))
    return within(screen.getByRole('dialog', { name: 'Menu' })).getByRole('button', { name: /^Archive/ })
  }

  it('counts every Reflection, across Quarters', async () => {
    await reflectAcrossTwoQuarters()
    itIs('2027-01-09T08:00')
    await launch()
    expect(await archiveRow()).toHaveTextContent(/^Archive4 Reflections$/)
  })

  it('reads "None yet" before any Reflection, and "1 Reflection" for one', async () => {
    const store = await open(() => now)
    itIs('2026-09-29T10:00')
    await setUp(store, '2026-Q4')
    itIs('2026-11-12T07:30')
    const { unmount } = await launch()
    expect(await archiveRow()).toHaveTextContent(/^ArchiveNone yet$/)

    unmount()
    await store.saveReflection('2026-Q4', 'work', 'Shipped the ring.')
    await launch()
    expect(await archiveRow()).toHaveTextContent(/^Archive1 Reflection$/)
  })
})
