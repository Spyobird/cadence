import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ReflectionLog } from './ReflectionLog'
import { useReflections } from '../hooks/useReflections'
import '@testing-library/jest-dom'

vi.mock('../hooks/useReflections', () => ({
  useReflections: vi.fn(),
}))

describe('ReflectionLog', () => {
  it('renders empty state when there are no reflections', async () => {
    ;(useReflections as any).mockReturnValue({
      getAllReflections: vi.fn().mockResolvedValue({}),
    })

    render(<ReflectionLog />)

    expect(await screen.findByText(/the void is empty/i)).toBeInTheDocument()
  })

  it('renders reflections grouped by date', async () => {
    const mockReflections = {
      '2026-07-05': [
        {
          id: 'id1',
          questId: 'life' as const,
          date: '2026-07-05',
          prompt: 'How was your day?',
          text: 'It was great.',
          createdAt: 123456789,
        },
        {
          id: 'id2',
          questId: 'work' as const,
          date: '2026-07-05',
          prompt: 'How was your day?',
          text: 'It was great.',
          createdAt: 123456789,
        }
      ]
    }

    ;(useReflections as any).mockReturnValue({
      getAllReflections: vi.fn().mockResolvedValue(mockReflections),
    })

    render(<ReflectionLog />)

    expect(await screen.findByText('2026-07-05')).toBeInTheDocument()
    expect(screen.getByText(/Life/i)).toBeInTheDocument()
    expect(screen.getByText(/Work/i)).toBeInTheDocument()
    // Use getAllByText because it appears twice
    expect(screen.getAllByText('It was great.')).toHaveLength(2)
  })

  it('renders reflections in reverse chronological order', async () => {
    const mockReflections = {
      '2026-07-05': [
        {
          id: 'id1',
          questId: 'life' as const,
          date: '2026-07-05',
          prompt: 'Prompt 1',
          text: 'Text 1',
          createdAt: 2,
        }
      ],
      '2026-07-06': [
        {
          id: 'id2',
          questId: 'work' as const,
          date: '2026-07-06',
          prompt: 'Prompt 2',
          text: 'Text 2',
          createdAt: 1,
        }
      ]
    }

    ;(useReflections as any).mockReturnValue({
      getAllReflections: vi.fn().mockResolvedValue(mockReflections),
    })

    render(<ReflectionLog />)

    const dates = await screen.findAllByText(/2026-07-/i)
    expect(dates.length).toBe(2)
  })
})