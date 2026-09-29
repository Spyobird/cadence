import 'fake-indexeddb/auto'
import { readFileSync } from 'node:fs'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { IDBFactory } from 'fake-indexeddb'
import { createStore, set } from 'idb-keyval'
import { beforeEach, describe, expect, it } from 'vitest'
import { App } from './App'
import { open, type QuestContent } from './lib/store'
import { aMomentLater, pretendOpened } from './test/phone'

const clock = () => new Date('2026-09-29T10:00')

const quest: QuestContent = {
  mainQuest: 'ship Cadence v1',
  whyItMatters: 'it would prove I can finish what I start',
  successMetrics: ['v1 installed on the phone'],
  whyItsExciting: 'I will use it every day',
  obstacle: '',
  commitments: ['Build every Saturday morning'],
}

/** Opens Cadence on a fresh phone */
const launch = async () => render(<App store={await open(clock)} />)

/** Opens Cadence with Q4 2026 already set up */
async function launchSetUp() {
  const store = await open(clock)
  await store.finishQuest('2026-Q4', 'work', quest)
  await store.finishQuest('2026-Q4', 'life', quest)
  return render(<App store={store} />)
}

beforeEach(() => {
  indexedDB = new IDBFactory()
})

describe('the Safari-tab banner', () => {
  it('shows in a Safari tab', async () => {
    pretendOpened('safari tab')
    await launch()
    expect(screen.getByRole('alert')).toHaveTextContent('Open Cadence from your Home Screen')
  })

  it('stays hidden from the Home Screen on iOS', async () => {
    pretendOpened('home screen (iOS)')
    await launch()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('stays hidden in any standalone display mode', async () => {
    pretendOpened('home screen (display-mode)')
    await launch()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

describe('the Appearance switch', () => {
  // The real head from index.html, which the switch rewrites
  beforeEach(() => {
    const html = readFileSync('index.html', 'utf8')
    document.head.innerHTML = new DOMParser().parseFromString(html, 'text/html').head.innerHTML
    document.documentElement.removeAttribute('data-look')
    pretendOpened('home screen (iOS)')
  })

  const themeColors = () =>
    Array.from(document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]'), (m) => [m.getAttribute('media'), m.content])

  it('starts on System, following the phone', async () => {
    await launchSetUp()
    expect(screen.getByRole('radio', { name: 'System' })).toBeChecked()
    expect(themeColors()).toEqual([
      ['(prefers-color-scheme: light)', '#F4F5F7'],
      ['(prefers-color-scheme: dark)', '#0F1113'],
    ])
  })

  it('Light sets the light look and its status bar colour', async () => {
    await launchSetUp()
    await userEvent.click(screen.getByRole('radio', { name: 'Light' }))
    expect(document.documentElement).toHaveAttribute('data-look', 'light')
    expect(themeColors().map(([, colour]) => colour)).toEqual(['#F4F5F7', '#F4F5F7'])
  })

  it('Dark sets the dark look and its status bar colour', async () => {
    await launchSetUp()
    await userEvent.click(screen.getByRole('radio', { name: 'Dark' }))
    expect(document.documentElement).toHaveAttribute('data-look', 'dark')
    expect(themeColors().map(([, colour]) => colour)).toEqual(['#0F1113', '#0F1113'])
  })

  it('System hands the look back to the phone', async () => {
    await launchSetUp()
    await userEvent.click(screen.getByRole('radio', { name: 'Dark' }))
    await userEvent.click(screen.getByRole('radio', { name: 'System' }))
    expect(document.documentElement).toHaveAttribute('data-look', 'system')
    expect(themeColors()).toEqual([
      ['(prefers-color-scheme: light)', '#F4F5F7'],
      ['(prefers-color-scheme: dark)', '#0F1113'],
    ])
  })
})

describe('data from a newer Cadence', () => {
  beforeEach(() => pretendOpened('home screen (iOS)'))

  it('shows a banner, and setup saves nothing, without a failed-save message', async () => {
    await set('meta', { schemaVersion: 2, lastBackupAt: null, appearance: 'system' }, createStore('cadence', 'kv'))
    await launch()
    expect(screen.getByText('This data is from a newer Cadence. Update Cadence to make changes.')).toBeInTheDocument()

    await userEvent.type(screen.getByRole('textbox', { name: 'My Work Main Quest is to' }), 'ship')
    await aMomentLater()
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('shows no banner for data this Cadence knows', async () => {
    await launch()
    expect(screen.queryByText(/newer Cadence/)).not.toBeInTheDocument()
  })
})
