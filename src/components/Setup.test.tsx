import 'fake-indexeddb/auto'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { IDBFactory } from 'fake-indexeddb'
import { beforeEach, describe, expect, it } from 'vitest'
import { App } from '../App'
import { open } from '../lib/store'
import { pretendOpened } from '../test/phone'

let now: Date
/** Sets the phone's clock, in local time: "2026-09-29T10:00" */
const itIs = (when: string) => {
  now = new Date(when)
}

/** Opens Cadence as the phone would: the real app over the real store */
async function launch() {
  const store = await open(() => now)
  return render(<App store={store} />)
}

/** Kills Cadence a moment after the last keystroke, once its saves have landed, and opens it again */
async function reopen() {
  await new Promise((resolve) => setTimeout(resolve, 50))
  cleanup()
  return launch()
}

beforeEach(() => {
  indexedDB = new IDBFactory()
  pretendOpened('home screen (iOS)')
  itIs('2026-09-29T10:00')
})

const button = (name: string) => screen.getByRole('button', { name })
const next = () => button('Next')
const field = (name: string | RegExp) => screen.getByRole('textbox', { name })

/** Writes a whole Quest from its Main Quest, with Return as Next, skipping the Obstacle */
async function writeQuest(user: UserEvent, quest: 'Work' | 'Life', mainQuest: string) {
  await user.type(field(`My ${quest} Main Quest is to`), `${mainQuest}{Enter}`)
  await user.keyboard('prove I can finish what I start{Enter}')
  await user.keyboard('v1 installed on the phone{Enter}{Enter}')
  await user.keyboard('I will use it every day{Enter}')
  await user.click(button('Skip for now'))
  await user.keyboard('Build every Saturday morning{Enter}{Enter}')
}

it("opens on setup for Q4 2026, at the Work Quest's Main Quest", async () => {
  await launch()
  expect(screen.getByText('Q4 2026 · 1 Oct – 31 Dec')).toBeInTheDocument()
  expect(screen.getByText('Work Quest, part 1 of 6')).toBeInTheDocument()
  expect(screen.getByRole('textbox', { name: 'My Work Main Quest is to' })).toHaveValue('')
  expect(next()).toBeDisabled()
})

it('enables Next once the part is written', async () => {
  const user = userEvent.setup()
  await launch()
  await user.type(screen.getByRole('textbox', { name: 'My Work Main Quest is to' }), '   ')
  expect(next()).toBeDisabled()
  await user.type(screen.getByRole('textbox', { name: 'My Work Main Quest is to' }), 'ship Cadence v1')
  expect(next()).toBeEnabled()
})

it('writes both Quests, Work then Life, and they are still there after a reload', async () => {
  const user = userEvent.setup()
  await launch()
  await writeQuest(user, 'Work', 'ship Cadence v1')
  expect(screen.getByText('Work Quest, read it back')).toBeInTheDocument()
  await user.click(button('Finish Work Quest'))

  expect(await screen.findByText('Life Quest, part 1 of 6')).toBeInTheDocument()
  await writeQuest(user, 'Life', 'run 5K in under 25 minutes')
  await user.click(button('Finish Life Quest'))
  expect(await screen.findByRole('heading', { name: 'Q4 2026 is set up' })).toBeInTheDocument()
  await user.click(button('Go to Today'))

  await reopen()
  expect(screen.getByText('ship Cadence v1')).toBeInTheDocument()
  expect(screen.getByText('run 5K in under 25 minutes')).toBeInTheDocument()
})

it('resumes on the part it was left on, with the words as typed', async () => {
  const user = userEvent.setup()
  await launch()
  await user.type(field('My Work Main Quest is to'), 'ship Cadence v1{Enter}')
  await user.keyboard('prove I can')

  await reopen()
  expect(screen.getByText('Work Quest, part 2 of 6')).toBeInTheDocument()
  expect(field(/because completing it would$/)).toHaveValue('prove I can')
  expect(screen.getByRole('status')).toHaveTextContent('Picked up where you left off.')
})

describe('a list', () => {
  /** Opens setup and writes the first two parts, to reach the Success Metrics */
  async function toSuccessMetrics() {
    const user = userEvent.setup()
    await launch()
    await user.type(field('My Work Main Quest is to'), 'ship Cadence v1{Enter}')
    await user.keyboard('prove I can finish what I start{Enter}')
    return user
  }
  const items = () => screen.getAllByRole<HTMLTextAreaElement>('textbox', { name: /^Success Metric/ }).map((item) => item.value)

  it('adds the next item on Return, and moves on at Return on an empty item, dropping it', async () => {
    const user = await toSuccessMetrics()
    expect(screen.getByText("By 31 December 2026, I'll have:")).toBeInTheDocument()
    await user.keyboard('v1 on the phone{Enter}')
    expect(items()).toEqual(['v1 on the phone', ''])
    expect(field('Success Metric 2')).toHaveFocus()

    await user.keyboard('{Enter}')
    expect(screen.getByText('Work Quest, part 4 of 6')).toBeInTheDocument()
    await user.click(button('Back'))
    expect(items()).toEqual(['v1 on the phone'])
  })

  it('stays put on Return while nothing is written', async () => {
    const user = await toSuccessMetrics()
    await user.keyboard('{Enter}')
    expect(screen.getByText('Work Quest, part 3 of 6')).toBeInTheDocument()
    expect(items()).toEqual([''])
    expect(next()).toBeDisabled()
  })

  it('removes an empty item on Backspace', async () => {
    const user = await toSuccessMetrics()
    await user.keyboard('one{Enter}two{Enter}{Backspace}')
    expect(items()).toEqual(['one', 'two'])
    expect(field('Success Metric 2')).toHaveFocus()
  })

  it('moves the focused item up and down, and removes it', async () => {
    const user = await toSuccessMetrics()
    await user.keyboard('one{Enter}two')
    await user.click(button('Move up'))
    expect(items()).toEqual(['two', 'one'])
    expect(field('Success Metric 1')).toHaveFocus()

    await user.click(button('Move down'))
    expect(items()).toEqual(['one', 'two'])
    expect(field('Success Metric 2')).toHaveFocus()

    await user.click(button('Remove'))
    expect(items()).toEqual(['one'])
    expect(field('Success Metric 1')).toHaveFocus()
  })

  it('adds another item from under the list', async () => {
    const user = await toSuccessMetrics()
    await user.keyboard('one')
    await user.click(button('Add another'))
    expect(items()).toEqual(['one', ''])
    expect(field('Success Metric 2')).toHaveFocus()
  })

  it('holds five items at most', async () => {
    const user = await toSuccessMetrics()
    await user.keyboard('one{Enter}two{Enter}three{Enter}four{Enter}five')
    expect(screen.getByText("That's five, the most a list holds.")).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Add another' })).not.toBeInTheDocument()

    await user.keyboard('{Enter}')
    expect(screen.getByText('Work Quest, part 4 of 6')).toBeInTheDocument()
  })

  it('makes pasted lines separate items, up to five', async () => {
    const user = await toSuccessMetrics()
    await user.paste('one\ntwo\n\nthree')
    expect(items()).toEqual(['one', 'two', 'three'])
    expect(field('Success Metric 3')).toHaveFocus()

    await user.paste('\nfour\nfive\nsix')
    expect(items()).toEqual(['one', 'two', 'three', 'four', 'five'])
  })
})
