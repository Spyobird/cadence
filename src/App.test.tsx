import { readFileSync } from 'node:fs'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { App } from './App'
import { pretendOpened } from './test/phone'

describe('the Safari-tab banner', () => {
  it('shows in a Safari tab', () => {
    pretendOpened('safari tab')
    render(<App />)
    expect(screen.getByRole('alert')).toHaveTextContent('Open Cadence from your Home Screen')
  })

  it('stays hidden from the Home Screen on iOS', () => {
    pretendOpened('home screen (iOS)')
    render(<App />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('stays hidden in any standalone display mode', () => {
    pretendOpened('home screen (display-mode)')
    render(<App />)
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

  it('starts on System, following the phone', () => {
    render(<App />)
    expect(screen.getByRole('radio', { name: 'System' })).toBeChecked()
    expect(themeColors()).toEqual([
      ['(prefers-color-scheme: light)', '#F4F5F7'],
      ['(prefers-color-scheme: dark)', '#0F1113'],
    ])
  })

  it('Light sets the light look and its status bar colour', async () => {
    render(<App />)
    await userEvent.click(screen.getByRole('radio', { name: 'Light' }))
    expect(document.documentElement).toHaveAttribute('data-look', 'light')
    expect(themeColors().map(([, colour]) => colour)).toEqual(['#F4F5F7', '#F4F5F7'])
  })

  it('Dark sets the dark look and its status bar colour', async () => {
    render(<App />)
    await userEvent.click(screen.getByRole('radio', { name: 'Dark' }))
    expect(document.documentElement).toHaveAttribute('data-look', 'dark')
    expect(themeColors().map(([, colour]) => colour)).toEqual(['#0F1113', '#0F1113'])
  })

  it('System hands the look back to the phone', async () => {
    render(<App />)
    await userEvent.click(screen.getByRole('radio', { name: 'Dark' }))
    await userEvent.click(screen.getByRole('radio', { name: 'System' }))
    expect(document.documentElement).toHaveAttribute('data-look', 'system')
    expect(themeColors()).toEqual([
      ['(prefers-color-scheme: light)', '#F4F5F7'],
      ['(prefers-color-scheme: dark)', '#0F1113'],
    ])
  })
})
