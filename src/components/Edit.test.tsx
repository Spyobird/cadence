import 'fake-indexeddb/auto'
import { act, cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { IDBFactory } from 'fake-indexeddb'
import { beforeEach, describe, expect, it } from 'vitest'
import { App } from '../App'
import { open, type QuestContent } from '../lib/store'
import { isWriting } from '../lib/writing'
import { aMomentLater, pretendNewerCadence, pretendOpened } from '../test/phone'

let now: Date
/** Sets the phone's clock, in local time: "2026-11-12T10:42" */
const itIs = (when: string) => {
  now = new Date(when)
}

const work: QuestContent = {
  mainQuest: 'ship the redesigned onboarding flow',
  whyItMatters: 'stop us losing a third of new sign-ups',
  successMetrics: ['the new onboarding live for every sign-up', 'week-one drop-off below 20%'],
  whyItsExciting: "it's the first project I've led end to end",
  obstacle: '',
  commitments: ['Two hours of deep work every Monday morning'],
}
const life: QuestContent = {
  mainQuest: 'run 5K in under 25 minutes',
  whyItMatters: 'prove I can keep a promise to my own body',
  successMetrics: ['an official parkrun 5K under 25:00'],
  whyItsExciting: "I've never thought of myself as a runner",
  obstacle: 'late client calls',
  commitments: ['Run every Tuesday, Thursday and Saturday at 6:30am'],
}

/** Q4 2026 set up on 29 Sep, as the owner did */
async function setUpQ4() {
  const store = await open(() => new Date('2026-09-29T10:00'))
  await store.finishQuest('2026-Q4', 'work', work)
  await store.finishQuest('2026-Q4', 'life', life)
}

/** Opens Cadence as the phone would: the real app over the real store */
async function launch() {
  return render(<App store={await open(() => now)} />)
}

/** What's stored once Cadence has been closed and opened again */
const reopened = async () => (await open(() => now)).snapshot()

/** Opens the menu on Today. `row` finds a Quest's row in it. */
async function openMenu() {
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: 'Menu' }))
  const menu = within(screen.getByRole('dialog', { name: 'Menu' }))
  return { user, row: (quest: 'Work' | 'Life') => within(menu.getByRole('group', { name: `${quest} Quest` })) }
}

/** Opens the menu on Today, then Edit on a Quest */
async function openEdit(quest: 'Work' | 'Life') {
  const { user, row } = await openMenu()
  await user.click(row(quest).getByRole('button', { name: /^Edit/ }))
  return user
}

/** A part on the read-back, by its opening */
const part = (opening: string) => screen.getByRole('button', { name: new RegExp(`^${opening}`) })

beforeEach(async () => {
  indexedDB = new IDBFactory()
  pretendOpened('home screen (iOS)')
  itIs('2026-11-12T10:42')
  await setUpQ4()
})

describe('Edit (spec §8)', () => {
  it('opens from the menu on the read-back, with Cancel, the title and Save, which waits for a change', async () => {
    await launch()
    const user = await openEdit('Work')

    expect(screen.getByRole('heading', { name: 'Work Quest' })).toBeInTheDocument()
    expect(screen.getByText('No changes yet')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    expect(part('My Work Main Quest is to')).toHaveTextContent('ship the redesigned onboarding flow')
    // An empty Obstacle shows here, so it can be added
    expect(part("What's most likely to get in my way is")).toHaveTextContent('nothing yet. Tap to add one.')

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.getByRole('img', { name: 'Day 43 of 92' })).toBeInTheDocument()
  })

  it("changes a tapped part on its own screen, marks it changed, and saves today's Version, which Today shows at once", async () => {
    await launch()
    const user = await openEdit('Work')
    await user.click(part('My Work Main Quest is to'))

    // The part's own screen, without the setup progress bar
    const field = screen.getByRole('textbox', { name: 'My Work Main Quest is to' })
    expect(field).toHaveValue('ship the redesigned onboarding flow')
    expect(field).toHaveFocus()
    expect(screen.getByText('Editing your Work Quest')).toBeInTheDocument()
    expect(screen.queryByText(/part 1 of 6/)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument()
    await user.clear(field)
    await user.type(field, 'ship onboarding to every new customer')
    await user.click(screen.getByRole('button', { name: 'Done' }))

    expect(part('My Work Main Quest is to')).toHaveAccessibleDescription('Changed')
    expect(part('This is the single most important thing')).not.toHaveAccessibleDescription()
    expect(screen.getByRole('banner')).toHaveTextContent('Unsaved changes')
    expect(screen.queryByText('No changes yet')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Save' }))

    const workPage = within(await screen.findByRole('tabpanel', { name: 'Work' }))
    expect(workPage.getByRole('heading', { name: 'ship onboarding to every new customer' })).toBeInTheDocument()
    const stored = await reopened()
    expect(stored.quarters['2026-Q4']?.versions.work).toEqual([
      { savedOn: '2026-09-29', content: work },
      { savedOn: '2026-11-12', content: { ...work, mainQuest: 'ship onboarding to every new customer' } },
    ])
    expect(stored.editDrafts).toEqual({})
  })

  it('says why Save is off: no changes, then an empty part, then an empty list', async () => {
    await launch()
    const user = await openEdit('Work')
    const note = (words: string) => expect(screen.getByRole('banner')).toHaveTextContent(words)
    const save = () => screen.getByRole('button', { name: 'Save' })

    // Success Metrics emptied, Remove by Remove
    await user.click(part("By 31 December 2026, I'll have:"))
    for (const item of ['Success Metric 2', 'Success Metric 1']) {
      await user.click(screen.getByRole('textbox', { name: item }))
      await user.click(screen.getByRole('button', { name: 'Remove' }))
    }
    await user.click(screen.getByRole('button', { name: 'Done' }))
    note('Add at least one Success Metric')
    expect(part("By 31 December 2026, I'll have:")).toHaveTextContent('… not written yet.')
    expect(save()).toBeDisabled()

    // An empty part comes first
    await user.click(part("This feels really exciting and compelling for me because"))
    await user.clear(screen.getByRole('textbox', { name: /^This feels really exciting/ }))
    await user.click(screen.getByRole('button', { name: 'Done' }))
    note("Why it's exciting can't be empty")
    expect(save()).toBeDisabled()

    // Undone, both of them: nothing has changed
    await user.click(part("This feels really exciting and compelling for me because"))
    await user.keyboard("it's the first project I've led end to end{Enter}")
    await user.click(part("By 31 December 2026, I'll have:"))
    await user.keyboard('the new onboarding live for every sign-up{Enter}week-one drop-off below 20%{Enter}{Enter}')
    note('No changes yet')
    expect(save()).toBeDisabled()
    expect(screen.getAllByRole('button').filter((button) => button.getAttribute('aria-description'))).toEqual([])
  })

  it('adds an Obstacle, and saves one emptied (spec §4.1)', async () => {
    await launch()
    const user = await openEdit('Life')
    await user.click(part("What's most likely to get in my way is"))
    // Done, not "Skip for now", takes an emptied Obstacle back to the read-back
    await user.clear(screen.getByRole('textbox', { name: "What's most likely to get in my way is" }))
    expect(screen.queryByRole('button', { name: 'Skip for now' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Done' }))
    expect(part("What's most likely to get in my way is")).toHaveTextContent('… nothing yet. Tap to add one.')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByRole('tabpanel', { name: 'Life' })).toBeInTheDocument()
    expect((await reopened()).quarters['2026-Q4']?.versions.life.at(-1)?.content.obstacle).toBe('')

    const again = await openEdit('Life')
    await again.click(part("What's most likely to get in my way is"))
    await again.keyboard('rain, so I run on the treadmill{Enter}')
    await again.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByRole('tabpanel', { name: 'Life' })).toBeInTheDocument()
    expect((await reopened()).quarters['2026-Q4']?.versions.life.map((version) => version.content.obstacle)).toEqual([
      'late client calls',
      'rain, so I run on the treadmill',
    ])
  })

  it('asks before discarding changes: Keep editing stays, and Discard changes drops the Draft', async () => {
    await launch()
    const user = await openEdit('Work')
    await user.click(part('My Work Main Quest is to'))
    await user.keyboard(' this quarter{Enter}')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    const question = within(screen.getByRole('dialog', { name: 'Discard your changes?' }))
    await user.click(question.getByRole('button', { name: 'Keep editing' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(part('My Work Main Quest is to')).toHaveTextContent('ship the redesigned onboarding flow this quarter')

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    await user.click(screen.getByRole('button', { name: 'Discard changes' }))
    const workPage = within(screen.getByRole('tabpanel', { name: 'Work' }))
    expect(workPage.getByRole('heading', { name: 'ship the redesigned onboarding flow' })).toBeInTheDocument()
    await aMomentLater()
    const stored = await reopened()
    expect(stored.editDrafts).toEqual({})
    expect(stored.quarters['2026-Q4']?.versions.work).toEqual([{ savedOn: '2026-09-29', content: work }])
  })

  it('keeps the Draft when Cadence is closed, and restores it, saying from when, even on a later Day', async () => {
    await launch()
    const user = await openEdit('Work')
    await user.click(part('My Work Main Quest is to'))
    await user.keyboard(' this quarter')
    await aMomentLater()
    cleanup()

    // Cadence still opens on Today, and the menu says the Draft is there
    itIs('2026-11-12T16:20')
    await launch()
    expect(screen.getByRole('img', { name: 'Day 43 of 92' })).toBeInTheDocument()
    const again = await openMenu()
    await again.user.click(again.row('Work').getByRole('button', { name: 'Edit · unsaved changes' }))
    expect(screen.getByRole('status')).toHaveTextContent('Your unsaved changes from 10:42 are still here.')
    expect(part('My Work Main Quest is to')).toHaveTextContent('ship the redesigned onboarding flow this quarter')
    expect(part('My Work Main Quest is to')).toHaveAccessibleDescription('Changed')
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled()
    cleanup()

    itIs('2026-11-14T08:00')
    await launch()
    const later = await openMenu()
    expect(later.row('Life').getByRole('button', { name: 'Edit' })).toBeInTheDocument()
    await later.user.click(later.row('Work').getByRole('button', { name: 'Edit · unsaved changes' }))
    expect(screen.getByRole('status')).toHaveTextContent('Your unsaved changes from Thu 10:42 are still here.')
  })

  it("refuses a save after the Quarter's last midnight, keeping the words on screen and the Draft frozen", async () => {
    itIs('2026-12-31T23:58')
    await launch()
    const user = await openEdit('Work')
    await user.click(part('My Work Main Quest is to'))
    await user.keyboard(' at last{Enter}')

    itIs('2027-01-01T00:01')
    act(() => void document.dispatchEvent(new Event('visibilitychange')))
    await user.click(screen.getByRole('button', { name: 'Save' }))
    const refused = await screen.findByRole('alertdialog')
    expect(refused).toHaveTextContent("Q4 2026 ended at midnight, so this can't be saved.")
    await user.click(within(refused).getByRole('button', { name: 'OK' }))
    expect(part('My Work Main Quest is to')).toHaveTextContent('ship the redesigned onboarding flow at last')

    const stored = await reopened()
    expect(stored.quarters['2026-Q4']?.versions.work).toEqual([{ savedOn: '2026-09-29', content: work }])
    expect(stored.editDrafts['2026-Q4']?.work?.content.mainQuest).toBe('ship the redesigned onboarding flow at last')
  })

  it("refuses what's typed on a part's screen after the Quarter's last midnight, keeping the words, and the Draft as it stood", async () => {
    itIs('2026-12-31T23:58')
    await launch()
    const user = await openEdit('Work')
    await user.click(part('My Work Main Quest is to'))
    await user.keyboard(' at last')

    itIs('2027-01-01T00:01')
    act(() => void document.dispatchEvent(new Event('visibilitychange')))
    await user.keyboard('!')
    const refused = await screen.findByRole('alertdialog')
    expect(refused).toHaveTextContent("Q4 2026 ended at midnight, so this can't be saved.")
    await user.click(within(refused).getByRole('button', { name: 'OK' }))
    expect(screen.getByRole('textbox', { name: 'My Work Main Quest is to' })).toHaveValue('ship the redesigned onboarding flow at last!')

    expect((await reopened()).editDrafts['2026-Q4']?.work?.content.mainQuest).toBe('ship the redesigned onboarding flow at last')
  })

  it.each([
    ['once the Quarter has ended (spec §6.4)', () => itIs('2027-01-02T10:00')],
    ['for data from a newer Cadence (spec §13.4)', pretendNewerCadence],
  ])('is hidden %s, and History stays', async (_, when) => {
    await when()
    await launch()
    const { row } = await openMenu()
    for (const quest of ['Work', 'Life'] as const) {
      expect(row(quest).queryByRole('button', { name: /^Edit/ })).not.toBeInTheDocument()
      expect(row(quest).getByRole('button', { name: 'History' })).toBeInTheDocument()
    }
  })

  it('holds off an update reload while open (spec §2.3)', async () => {
    await launch()
    const user = await openEdit('Life')
    expect(isWriting()).toBe(true)
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(isWriting()).toBe(false)
  })
})
