import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Onboarding } from './Onboarding'

// Mock the useQuests hook
const mockSaveQuest = vi.fn().mockResolvedValue(undefined)

vi.mock('../hooks/useQuests', () => ({
  useQuests: () => ({
    quests: {},
    loading: false,
    error: null,
    saveQuest: mockSaveQuest,
    getQuestHistory: vi.fn()
  })
}))

describe('Onboarding', () => {
  const mockNavigate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render step 1 for Life quest setup', () => {
    render(<Onboarding onNavigate={mockNavigate} />)

    expect(screen.getByRole('heading', { name: /life quest/i })).toBeInTheDocument()
    expect(screen.getByText(/your life quest for this quarter/i)).toBeInTheDocument()
  })

  it('should render the QuestForm for the current step', () => {
    render(<Onboarding onNavigate={mockNavigate} />)

    expect(screen.getByLabelText(/main quest/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/importance/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/excitement/i)).toBeInTheDocument()
  })

  it('should show step indicator showing current step', () => {
    render(<Onboarding onNavigate={mockNavigate} />)

    expect(screen.getByText(/step 1 of 3/i)).toBeInTheDocument()
  })

  it('should save Life quest and proceed to Work quest when submitted on step 1', async () => {
    render(<Onboarding onNavigate={mockNavigate} />)

    // Fill out the Life quest form
    const mainQuestInput = screen.getByLabelText(/main quest/i)
    fireEvent.change(mainQuestInput, { target: { value: 'Live with purpose and integrity' } })

    const importanceInput = screen.getByLabelText(/importance/i)
    fireEvent.change(importanceInput, { target: { value: 'This is my highest priority' } })

    const excitementInput = screen.getByLabelText(/excitement/i)
    fireEvent.change(excitementInput, { target: { value: 'Feeling energized by this journey' } })

    // Submit the form
    const saveButton = screen.getByRole('button', { name: /save/i })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockSaveQuest).toHaveBeenCalledWith('life', expect.objectContaining({
        id: 'life',
        version: 1,
        content: expect.objectContaining({
          mainQuest: 'Live with purpose and integrity'
        })
      }))
    })
  })

  it('should navigate to dashboard after all quests are completed', async () => {
    render(<Onboarding onNavigate={mockNavigate} />)

    // Fill out Life quest
    const mainQuestInput = screen.getByLabelText(/main quest/i)
    fireEvent.change(mainQuestInput, { target: { value: 'Life Quest' } })

    const saveButton = screen.getByRole('button', { name: /save/i })
    fireEvent.click(saveButton)

    // Step 2 should appear after Life quest is saved
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /work quest/i })).toBeInTheDocument()
    })

    // Fill out Work quest
    const workQuestInput = screen.getByLabelText(/main quest/i)
    fireEvent.change(workQuestInput, { target: { value: 'Work Quest' } })

    const workSaveButton = screen.getByRole('button', { name: /save/i })
    fireEvent.click(workSaveButton)

    // Step 3 should appear, then navigate to dashboard
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /all done!/i })).toBeInTheDocument()
    })
  })

  it('should show completion screen after both quests are saved', async () => {
    render(<Onboarding onNavigate={mockNavigate} />)

    // Save Life quest
    const mainQuestInput = screen.getByLabelText(/main quest/i)
    fireEvent.change(mainQuestInput, { target: { value: 'Life Quest' } })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    // Save Work quest
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /work quest/i })).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText(/main quest/i), { target: { value: 'Work Quest' } })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    // Check for completion screen
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /all done!/i })).toBeInTheDocument()
      expect(screen.getByText(/your quarterly goals are ready/i)).toBeInTheDocument()
    })
  })
})