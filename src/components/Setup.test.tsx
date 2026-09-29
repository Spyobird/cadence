import 'fake-indexeddb/auto'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { IDBFactory } from 'fake-indexeddb'
import { beforeEach, expect, it } from 'vitest'
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
