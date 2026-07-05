import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Dashboard } from './Dashboard'
import { useQuests } from '../hooks/useQuests'
import { useReflections } from '../hooks/useReflections'
import '@testing-library/jest-dom'

// Mock the hooks
vi.mock('../hooks/useQuests', () => ({
  useQuests: vi.fn(),
}))

vi.mock('../hooks/useReflections', () => ({
  useReflections: vi.fn(),
}))

describe('Dashboard', () => {
  const mockSaveReflection = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock implementation for useQuests
    ;(useQuests as any).mockReturnValue({
      quests: {
        life: {
          id: 'life',
          version: 1,
          content: { mainQuest: 'Life Quest' },
        },
        work: {
          id: 'work',
          version: 2,
          content: { mainQuest: 'Work Quest' },
        },
      },
      loading: false,
      error: null,
    })

    // Default mock implementation for useReflections
    ;(useReflections as any).mockReturnValue({
      saveReflection: mockSaveReflection,
    })

    // Mock Date to control the prompt without using fake timers that interfere with waitFor
    vi.spyOn(Date.prototype, 'getDay').mockReturnValue(6)
    vi.spyOn(Date.prototype, 'toISOString').mockReturnValue('2026-07-05T12:00:00.000Z')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders quest summaries for life and work', async () => {
    render(<Dashboard onNavigate={vi.fn()} />)

    expect(await screen.findByText('Life Quest')).toBeInTheDocument()
    expect(screen.getByText('v1')).toBeInTheDocument()
    expect(await screen.findByText('Work Quest')).toBeInTheDocument()
    expect(screen.getByText('v2')).toBeInTheDocument()
  })

  it('renders the correct daily prompt', async () => {
    render(<Dashboard onNavigate={vi.fn()} />)
    // Saturday prompt (index 5)
    const prompt = "How do you actually feel about your progress right now—energized, drained, or neutral? Why?"
    expect(await screen.findByText(prompt)).toBeInTheDocument()
  })

  it('allows typing in reflection textareas', async () => {
    render(<Dashboard onNavigate={vi.fn()} />)

    const lifeTextarea = screen.getByPlaceholderText(/life reflection/i)
    const workTextarea = screen.getByPlaceholderText(/work reflection/i)

    fireEvent.change(lifeTextarea, { target: { value: 'Life reflection text' } })
    fireEvent.change(workTextarea, { target: { value: 'Work reflection text' } })

    expect(lifeTextarea).toHaveValue('Life reflection text')
    expect(workTextarea).toHaveValue('Work reflection text')
  })

  it('calls saveReflection when saving', async () => {
    render(<Dashboard onNavigate={vi.fn()} />)

    const lifeTextarea = screen.getByPlaceholderText(/life reflection/i)
    const workTextarea = screen.getByPlaceholderText(/work reflection/i)
    const saveButton = screen.getByRole('button', { name: /save/i })

    fireEvent.change(lifeTextarea, { target: { value: 'Life reflection text' } })
    fireEvent.change(workTextarea, { target: { value: 'Work reflection text' } })
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockSaveReflection).toHaveBeenCalledWith(
        'life',
        expect.any(String),
        expect.any(String),
        'Life reflection text'
      )
      expect(mockSaveReflection).toHaveBeenCalledWith(
        'work',
        expect.any(String),
        expect.any(String),
        'Work reflection text'
      )
    })
  })
})
