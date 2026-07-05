import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QuestForm } from './QuestForm'
import { QuestContent } from '../hooks/useQuests'

describe('QuestForm', () => {
  const mockOnSubmit = vi.fn()
  const mockOnCancel = vi.fn()

  const defaultQuest: QuestContent = {
    mainQuest: '',
    importance: '',
    successMetrics: [],
    commitments: [],
    excitement: ''
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render all required form fields', () => {
    render(<QuestForm quest={defaultQuest} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

    expect(screen.getByLabelText(/main quest/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/importance/i)).toBeInTheDocument()
    expect(screen.getByText(/success metrics/i)).toBeInTheDocument()
    expect(screen.getByText(/commitments/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/excitement/i)).toBeInTheDocument()
  })

  it('should render text input for mainQuest', () => {
    render(<QuestForm quest={defaultQuest} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

    expect(screen.getByLabelText(/main quest/i)).toBeInTheDocument()
  })

  it('should render textarea for multi-line inputs', () => {
    render(<QuestForm quest={defaultQuest} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

    expect(screen.getByLabelText(/importance/i)).toHaveAttribute('rows')
    expect(screen.getByLabelText(/excitement/i)).toHaveAttribute('rows')
  })

  it('should allow adding list items for successMetrics', () => {
    render(<QuestForm quest={defaultQuest} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

    const successMetricsInput = screen.getByPlaceholderText(/add observable result/i)
    fireEvent.change(successMetricsInput, { target: { value: 'Complete first milestone' } })

    // Click the Add button
    const addButtons = screen.getAllByRole('button', { name: /add/i })
    fireEvent.click(addButtons[0])

    expect(screen.getByText('Complete first milestone')).toBeInTheDocument()
  })

  it('should allow adding list items for commitments', () => {
    render(<QuestForm quest={defaultQuest} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

    const commitmentsInput = screen.getByPlaceholderText(/add commitment/i)
    fireEvent.change(commitmentsInput, { target: { value: 'Work 2 hours daily' } })

    // Click the Add button
    const addButtons = screen.getAllByRole('button', { name: /add/i })
    fireEvent.click(addButtons[1])

    expect(screen.getByText('Work 2 hours daily')).toBeInTheDocument()
  })

  it('should render cancel button when onCancel is provided', () => {
    render(<QuestForm quest={defaultQuest} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('should not render cancel button when onCancel is not provided', () => {
    render(<QuestForm quest={defaultQuest} onSubmit={mockOnSubmit} />)

    expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument()
  })

  it('should populate form with existing quest data', () => {
    const existingQuest: QuestContent = {
      mainQuest: 'Live with purpose',
      importance: 'This is my top priority',
      successMetrics: ['Daily reflection', 'Weekly review'],
      commitments: ['Morning meditation'],
      excitement: 'Feeling energized'
    }

    render(<QuestForm quest={existingQuest} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

    expect(screen.getByLabelText(/main quest/i)).toHaveValue('Live with purpose')
    expect(screen.getByLabelText(/importance/i)).toHaveValue('This is my top priority')
    expect(screen.getByLabelText(/excitement/i)).toHaveValue('Feeling energized')
  })

  it('should call onSubmit with updated quest when form is submitted', async () => {
    render(<QuestForm quest={defaultQuest} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

    const mainQuestInput = screen.getByLabelText(/main quest/i)
    fireEvent.change(mainQuestInput, { target: { value: 'My new quest' } })

    const submitButton = screen.getByRole('button', { name: /save/i })
    fireEvent.click(submitButton)

    expect(mockOnSubmit).toHaveBeenCalled()
  })

  it('should call onCancel when cancel button is clicked', () => {
    render(<QuestForm quest={defaultQuest} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelButton)

    expect(mockOnCancel).toHaveBeenCalled()
  })

  it('should use Pulse Gold color for primary button', () => {
    render(<QuestForm quest={defaultQuest} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />)

    const saveButton = screen.getByRole('button', { name: /save/i })
    expect(saveButton).toHaveClass('bg-[#D4AF37]')
  })
})