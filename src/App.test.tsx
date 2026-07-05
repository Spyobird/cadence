import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import App from './App'

// Mock the useQuests hook
vi.mock('./hooks/useQuests', () => ({
  useQuests: () => ({
    quests: {},
    loading: false,
    error: null,
    saveQuest: vi.fn().mockResolvedValue(undefined),
    getQuestHistory: vi.fn()
  })
}))

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render onboarding view by default', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: /life quest/i })).toBeInTheDocument()
    expect(screen.getByText(/your life quest for this quarter/i)).toBeInTheDocument()
  })

  it('should render the quest form in onboarding', () => {
    render(<App />)

    expect(screen.getByLabelText(/main quest/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
  })

  it('should navigate to dashboard after completing onboarding', async () => {
    render(<App />)

    // Fill out Life quest
    const mainQuestInput = screen.getByLabelText(/main quest/i)
    fireEvent.change(mainQuestInput, { target: { value: 'Life Quest' } })

    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    // Should show Work quest step
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /work quest/i })).toBeInTheDocument()
    })

    // Fill out Work quest
    fireEvent.change(screen.getByLabelText(/main quest/i), { target: { value: 'Work Quest' } })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    // Should show completion screen
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /all done!/i })).toBeInTheDocument()
    })

    // Navigate to dashboard
    fireEvent.click(screen.getByRole('button', { name: /go to dashboard/i }))

    await waitFor(() => {
      expect(screen.getByText('Quest Summary')).toBeInTheDocument()
    })
  })

  it('should navigate to dashboard when complete is triggered', async () => {
    render(<App />)

    // Complete Life quest
    fireEvent.change(screen.getByLabelText(/main quest/i), { target: { value: 'Life Quest' } })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /work quest/i })).toBeInTheDocument()
    })

    // Complete Work quest
    fireEvent.change(screen.getByLabelText(/main quest/i), { target: { value: 'Work Quest' } })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /all done!/i })).toBeInTheDocument()
    })

    // Complete onboarding
    fireEvent.click(screen.getByRole('button', { name: /go to dashboard/i }))

    await waitFor(() => {
      expect(screen.getByText('Quest Summary')).toBeInTheDocument()
    })
  })
})