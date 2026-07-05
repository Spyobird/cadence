import { describe, it, expect, beforeEach, vi } from 'vitest'
import { db } from '../lib/db'
import { saveReflection, getReflectionsForDate, getAllReflections } from './useReflections'

// Mock the db module
vi.mock('../lib/db', () => ({
  db: {
    get: vi.fn(),
    save: vi.fn(),
    del: vi.fn()
  }
}))

const mockDb = db as any

describe('useReflections', () => {
  const mockReflectionInput = {
    questId: 'life' as const,
    date: '2026-07-04',
    prompt: 'What is the one thing that must happen this week?',
    text: 'This is my reflection text'
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('saveReflection', () => {
    it('should save a new reflection when no reflections exist', async () => {
      mockDb.get.mockResolvedValue(undefined)

      await saveReflection(
        mockReflectionInput.questId,
        mockReflectionInput.date,
        mockReflectionInput.prompt,
        mockReflectionInput.text
      )

      expect(mockDb.save).toHaveBeenCalledWith('reflections', expect.objectContaining({
        [mockReflectionInput.date]: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            questId: mockReflectionInput.questId,
            date: mockReflectionInput.date,
            prompt: mockReflectionInput.prompt,
            text: mockReflectionInput.text,
            createdAt: expect.any(Number)
          })
        ])
      }))
    })

    it('should add reflection to existing reflections', async () => {
      const existingReflections = {
        [mockReflectionInput.date]: [
          {
            id: 'existing-id',
            questId: 'work' as const,
            date: mockReflectionInput.date,
            prompt: 'Existing prompt',
            text: 'Existing text',
            createdAt: 1000
          }
        ]
      }
      mockDb.get.mockResolvedValue(existingReflections)

      await saveReflection(
        mockReflectionInput.questId,
        mockReflectionInput.date,
        mockReflectionInput.prompt,
        mockReflectionInput.text
      )

      const savedData = mockDb.save.mock.calls[0][1]
      expect(savedData[mockReflectionInput.date]).toHaveLength(2)
      expect(savedData[mockReflectionInput.date][1].questId).toBe('life')
    })
  })

  describe('getReflectionsForDate', () => {
    it('should return reflections for a specific date', async () => {
      const reflections = {
        '2026-07-04': [
          {
            id: 'reflection-1',
            questId: 'life' as const,
            date: '2026-07-04',
            prompt: 'Test prompt',
            text: 'Test text',
            createdAt: 1000
          }
        ]
      }
      mockDb.get.mockResolvedValue(reflections)

      const result = await getReflectionsForDate('2026-07-04')

      expect(result).toEqual(reflections['2026-07-04'])
    })

    it('should return empty array when no reflections for date', async () => {
      mockDb.get.mockResolvedValue({})

      const result = await getReflectionsForDate('2026-07-04')

      expect(result).toEqual([])
    })
  })

  describe('getAllReflections', () => {
    it('should return all reflections', async () => {
      const allReflections = {
        '2026-07-04': [
          {
            id: 'reflection-1',
            questId: 'life' as const,
            date: '2026-07-04',
            prompt: 'Test prompt',
            text: 'Test text',
            createdAt: 1000
          }
        ],
        '2026-07-05': [
          {
            id: 'reflection-2',
            questId: 'work' as const,
            date: '2026-07-05',
            prompt: 'Another prompt',
            text: 'Another text',
            createdAt: 2000
          }
        ]
      }
      mockDb.get.mockResolvedValue(allReflections)

      const result = await getAllReflections()

      expect(result).toEqual(allReflections)
    })

    it('should return empty object when no reflections exist', async () => {
      mockDb.get.mockResolvedValue(undefined)

      const result = await getAllReflections()

      expect(result).toEqual({})
    })
  })
})