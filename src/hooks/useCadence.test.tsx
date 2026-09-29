import 'fake-indexeddb/auto'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { IDBFactory } from 'fake-indexeddb'
import { beforeEach, expect, it } from 'vitest'
import { open, type QuestContent } from '../lib/store'
import { CadenceContext, useCadence } from './useCadence'

const quest: QuestContent = {
  mainQuest: 'ship Cadence v1',
  whyItMatters: 'it would prove I can finish what I start',
  successMetrics: ['v1 installed on the phone'],
  whyItsExciting: 'I will use it every day',
  obstacle: '',
  commitments: ['Build every Saturday morning'],
}

/** A stand-in for setup: shows where Cadence would open, and writes through the hook */
function Setup() {
  const { screen, today, saveSetupDraft, finishQuest } = useCadence()
  return (
    <>
      <p>
        {today}: {screen.name} {screen.quarter}
      </p>
      <button onClick={() => void saveSetupDraft('2026-Q4', { at: { quest: 'work', part: 'mainQuest' }, work: {}, life: {} })}>
        Start
      </button>
      <button onClick={() => void finishQuest('2026-Q4', 'work', quest)}>Finish Work</button>
      <button onClick={() => void finishQuest('2026-Q4', 'life', quest)}>Finish Life</button>
    </>
  )
}

beforeEach(() => {
  indexedDB = new IDBFactory()
})

it("shows today's screen, and re-renders after every write", async () => {
  const store = await open(() => new Date('2026-09-29T10:00'))
  render(
    <CadenceContext value={store}>
      <Setup />
    </CadenceContext>,
  )
  expect(screen.getByText('2026-09-29: setup 2026-Q4')).toBeInTheDocument()

  await userEvent.click(screen.getByRole('button', { name: 'Start' }))
  expect(await screen.findByText('2026-09-29: resume 2026-Q4')).toBeInTheDocument()

  await userEvent.click(screen.getByRole('button', { name: 'Finish Work' }))
  await userEvent.click(screen.getByRole('button', { name: 'Finish Life' }))
  expect(await screen.findByText('2026-09-29: before-day-1 2026-Q4')).toBeInTheDocument()
})
