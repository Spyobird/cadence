import 'fake-indexeddb/auto'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { IDBFactory } from 'fake-indexeddb'
import { beforeEach, describe, expect, it } from 'vitest'
import { App } from '../App'
import { open } from '../lib/store'
import { isWriting } from '../lib/writing'
import { flakyPhone, pretendOpened } from '../test/phone'

let now: Date
/** Sets the phone's clock, in local time: "2026-09-29T10:00" */
const itIs = (when: string) => {
  now = new Date(when)
}

/** Opens Cadence as the phone would: the real app over the real store */
async function launch(connect?: Parameters<typeof open>[1]) {
  const store = await open(() => now, connect)
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

it('offers four questions to help find the Main Quest, and only there', async () => {
  const user = userEvent.setup()
  await launch()
  await user.click(button('Stuck? Four questions to help find it'))
  expect(
    screen.getByText('Fast-forward to 31 December 2026: what one accomplishment would make you proudest?'),
  ).toBeInTheDocument()
  expect(screen.getAllByRole('listitem')).toHaveLength(4)

  await user.type(field('My Work Main Quest is to'), 'ship Cadence v1{Enter}')
  expect(screen.queryByRole('button', { name: /^Stuck\?/ })).not.toBeInTheDocument()
})

it('asks the keyboard for Next on Return, and for capitals only on list items', async () => {
  const user = userEvent.setup()
  await launch()
  const mainQuest = field('My Work Main Quest is to')
  expect(mainQuest).toHaveAttribute('enterkeyhint', 'next')
  expect(mainQuest).toHaveAttribute('autocapitalize', 'none')

  await user.type(mainQuest, 'ship Cadence v1{Enter}')
  await user.keyboard('prove I can finish what I start{Enter}')
  expect(field('Success Metric 1')).toHaveAttribute('enterkeyhint', 'next')
  expect(field('Success Metric 1')).toHaveAttribute('autocapitalize', 'sentences')
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

describe('resuming', () => {
  it('opens on the part it was left on, with the words as typed', async () => {
    const user = userEvent.setup()
    await launch()
    await user.type(field('My Work Main Quest is to'), 'ship Cadence v1{Enter}')
    await user.keyboard('prove I can')

    await reopen()
    expect(screen.getByText('Work Quest, part 2 of 6')).toBeInTheDocument()
    expect(field(/because completing it would$/)).toHaveValue('prove I can')
    expect(screen.getByRole('status')).toHaveTextContent('Picked up where you left off.')
  })

  it('opens on a list with its items', async () => {
    const user = userEvent.setup()
    await launch()
    await user.type(field('My Work Main Quest is to'), 'ship Cadence v1{Enter}')
    await user.keyboard('prove I can finish what I start{Enter}')
    await user.keyboard('one{Enter}two')

    await reopen()
    expect(screen.getByText('Work Quest, part 3 of 6')).toBeInTheDocument()
    expect(field('Success Metric 1')).toHaveValue('one')
    expect(field('Success Metric 2')).toHaveValue('two')
  })

  it('opens on the read-back', async () => {
    const user = userEvent.setup()
    await launch()
    await writeQuest(user, 'Work', 'ship Cadence v1')

    await reopen()
    expect(screen.getByText('Work Quest, read it back')).toBeInTheDocument()
    expect(button('Finish Work Quest')).toBeEnabled()
  })

  it('returns to the read-back from a part opened there', async () => {
    const user = userEvent.setup()
    await launch()
    await writeQuest(user, 'Work', 'ship Cadence v1')
    await user.click(button('My Work Main Quest is to ship Cadence v1'))

    await reopen()
    await user.click(button('Done'))
    expect(screen.getByText('Work Quest, read it back')).toBeInTheDocument()
  })

  it('opens on the Life Quest once Work is finished, and says it picked up', async () => {
    const user = userEvent.setup()
    await launch()
    await writeQuest(user, 'Work', 'ship Cadence v1')
    await user.click(button('Finish Work Quest'))
    await screen.findByText('Life Quest, part 1 of 6')

    await reopen()
    expect(screen.getByText('Life Quest, part 1 of 6')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Picked up where you left off.')
  })
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

  it('removes an empty first item on Backspace, when there are others', async () => {
    const user = await toSuccessMetrics()
    await user.keyboard('one{Enter}two')
    await user.clear(field('Success Metric 1'))
    await user.keyboard('{Backspace}')
    expect(items()).toEqual(['two'])
    expect(field('Success Metric 1')).toHaveFocus()
  })

  it('keeps an item, and the keyboard on it, when a paste holds only line breaks', async () => {
    const user = await toSuccessMetrics()
    await user.paste('\n\n')
    expect(items()).toEqual([''])
    expect(field('Success Metric 1')).toHaveFocus()
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

describe('the target', () => {
  it('switches to the other Quarter, keeping the words', async () => {
    const user = userEvent.setup()
    await launch()
    await user.type(field('My Work Main Quest is to'), 'ship Cadence v1')
    await user.click(button('Switch to Q3 2026'))
    expect(screen.getByText('Q3 2026 · 1 Jul – 30 Sep')).toBeInTheDocument()
    expect(field('My Work Main Quest is to')).toHaveValue('ship Cadence v1')

    await reopen()
    expect(screen.getByText('Q3 2026 · 1 Jul – 30 Sep')).toBeInTheDocument()
    expect(field('My Work Main Quest is to')).toHaveValue('ship Cadence v1')
    await user.click(button('Switch to Q4 2026'))
    expect(screen.getByText('Q4 2026 · 1 Oct – 31 Dec')).toBeInTheDocument()
  })

  it("ends the Quest's Success Metrics on the target's last day", async () => {
    const user = userEvent.setup()
    await launch()
    await user.click(button('Switch to Q3 2026'))
    await user.type(field('My Work Main Quest is to'), 'ship Cadence v1{Enter}')
    await user.keyboard('prove I can finish what I start{Enter}')
    expect(screen.getByText("By 30 September 2026, I'll have:")).toBeInTheDocument()
  })

  it('keeps a switch made before anything is typed, without a note that it was picked up', async () => {
    const user = userEvent.setup()
    await launch()
    await user.click(button('Switch to Q3 2026'))

    await reopen()
    expect(screen.getByText('Q3 2026 · 1 Jul – 30 Sep')).toBeInTheDocument()
    expect(screen.queryByText('Picked up where you left off.')).not.toBeInTheDocument()
  })

  it('is fixed once the Work Quest is finished', async () => {
    const user = userEvent.setup()
    await launch()
    await writeQuest(user, 'Work', 'ship Cadence v1')
    await user.click(button('Finish Work Quest'))
    expect(await screen.findByText('Life Quest, part 1 of 6')).toBeInTheDocument()
    expect(screen.getByText('Q4 2026 · 1 Oct – 31 Dec')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Switch to/ })).not.toBeInTheDocument()
    // Nor can Life go back into Work
    expect(button('Back')).toBeDisabled()
  })
})

describe('the read-back', () => {
  it('opens a tapped part, and Done returns to it', async () => {
    const user = userEvent.setup()
    await launch()
    await writeQuest(user, 'Work', 'ship Cadence v1')
    await user.click(button('My Work Main Quest is to ship Cadence v1'))
    expect(screen.getByText('Work Quest, part 1 of 6')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument()

    await user.type(field('My Work Main Quest is to'), ' by December')
    await user.click(button('Done'))
    expect(screen.getByText('Work Quest, read it back')).toBeInTheDocument()
    expect(button('My Work Main Quest is to ship Cadence v1 by December')).toBeInTheDocument()
  })
})

it('hints at a when for the Commitments, as §4.1 words it', async () => {
  const user = userEvent.setup()
  await launch()
  await writeQuest(user, 'Work', 'ship Cadence v1')
  await user.click(button('Back'))
  expect(
    screen.getByText((_, element) =>
      element?.textContent === 'One habit with a when ("every Monday 9–11am, deep work") and one action with a by when.',
    ),
  ).toBeInTheDocument()
})

describe('the Obstacle', () => {
  /** Opens setup and writes the four parts before the Obstacle */
  async function toObstacle() {
    const user = userEvent.setup()
    await launch()
    await user.type(field('My Work Main Quest is to'), 'ship Cadence v1{Enter}')
    await user.keyboard('prove I can finish what I start{Enter}')
    await user.keyboard('v1 installed on the phone{Enter}{Enter}')
    await user.keyboard('I will use it every day{Enter}')
    expect(screen.getByText('Work Quest, part 5 of 6')).toBeInTheDocument()
    return user
  }

  it('offers "Skip for now" in place of Next while it is empty', async () => {
    const user = await toObstacle()
    expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument()
    await user.keyboard('{Enter}')
    expect(screen.getByText('Work Quest, part 5 of 6')).toBeInTheDocument()

    await user.keyboard('late calls')
    expect(next()).toBeEnabled()
    expect(screen.queryByRole('button', { name: 'Skip for now' })).not.toBeInTheDocument()
    await user.clear(field("What's most likely to get in my way is"))
    await user.click(button('Skip for now'))
    expect(screen.getByText('Work Quest, part 6 of 6')).toBeInTheDocument()
  })

  it('once skipped, is left out of the read-back, and Back still reaches it', async () => {
    const user = await toObstacle()
    await user.click(button('Skip for now'))
    await user.keyboard('Build every Saturday morning{Enter}{Enter}')
    expect(screen.queryByText("What's most likely to get in my way is")).not.toBeInTheDocument()

    await user.click(button('Back'))
    await user.click(button('Back'))
    await user.type(field("What's most likely to get in my way is"), 'late client calls{Enter}')
    await user.click(next())
    expect(button("What's most likely to get in my way is late client calls")).toBeInTheDocument()
  })
})

describe('a save that fails', () => {
  it('blocks with a message, and keeps the words on screen', async () => {
    const user = userEvent.setup()
    const phone = flakyPhone()
    await launch(phone.connect)
    phone.failNextWrites('AbortError')
    await user.type(field('My Work Main Quest is to'), 's')

    expect(await screen.findByRole('alertdialog')).toHaveTextContent(
      "Couldn't save. Close and reopen Cadence, or restart the iPhone.",
    )
    expect(field('My Work Main Quest is to')).toHaveValue('s')
    expect(button('OK')).toHaveFocus()
    await user.click(button('OK'))
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('says when the iPhone storage is full', async () => {
    const user = userEvent.setup()
    const phone = flakyPhone()
    await launch(phone.connect)
    await writeQuest(user, 'Work', 'ship Cadence v1')
    phone.failNextWrites('QuotaExceededError')
    await user.click(button('Finish Work Quest'))

    expect(await screen.findByRole('alertdialog')).toHaveTextContent("Couldn't save: iPhone storage is full.")
    expect(screen.getByText('Work Quest, read it back')).toBeInTheDocument()
  })
})

it('holds off an update reload until the Quarter is set up (spec §2.3)', async () => {
  const user = userEvent.setup()
  await launch()
  expect(isWriting()).toBe(true)

  await writeQuest(user, 'Work', 'ship Cadence v1')
  await user.click(button('Finish Work Quest'))
  await screen.findByText('Life Quest, part 1 of 6')
  await writeQuest(user, 'Life', 'run 5K in under 25 minutes')
  await user.click(button('Finish Life Quest'))
  await screen.findByRole('heading', { name: 'Q4 2026 is set up' })
  expect(isWriting()).toBe(false)
})
