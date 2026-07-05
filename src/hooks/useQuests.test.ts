import { describe, it, expect, beforeEach, vi } from 'vitest'
import { db } from '../lib/db'
import { saveQuest, getQuests, getQuestHistory } from './useQuests'

// Mock the db module
vi.mock('../lib/db', () => ({
  db: {
    get: vi.fn(),
    save: vi.fn()
  }
}))

const mockDb = db as any

describe('useQuests', () => {
  const mockQuest = {
    id: 'life' as const,
    version: 1,
    content: {
      mainQuest: 'Live with purpose and integrity',
      importance: 'This is my highest priority',
      successMetrics: ['Daily reflection', 'Weekly review'],
      commitments: ['Morning meditation', 'Evening journaling'],
      excitement: 'Feeling energized by this journey'
    },
    updatedAt: Date.now()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getQuests', () => {
    it('should return current active quests', async () => {
      const quests = { life: mockQuest, work: { ...mockQuest, id: 'work' as const } }
      mockDb.get.mockResolvedValue(quests)

      const result = await getQuests()

      expect(result).toEqual(quests)
    })

    it('should return empty object when no quests exist', async () => {
      mockDb.get.mockResolvedValue(undefined)

      const result = await getQuests()

      expect(result).toEqual({})
    })
  })

  describe('saveQuest', () => {
    it('should create a new quest when none exists', async () => {
      mockDb.get.mockResolvedValue(undefined)

      await saveQuest('life', {
        ...mockQuest,
        content: {
          ...mockQuest.content,
          mainQuest: 'New quest'
        }
      })

      expect(mockDb.get).toHaveBeenCalledWith('quests')
      expect(mockDb.save).toHaveBeenCalledWith('quests', expect.objectContaining({
        life: expect.objectContaining({
          id: 'life',
          version: 1,
          content: expect.objectContaining({ mainQuest: 'New quest' })
        })
      }))
    })

    it('should increment version when updating existing quest', async () => {
      const existingQuest = { ...mockQuest, version: 2 }
      mockDb.get.mockResolvedValue({ life: existingQuest })

      await saveQuest('life', {
        ...mockQuest,
        version: 3,
        content: { ...mockQuest.content, mainQuest: 'Updated quest' }
      })

      expect(mockDb.save).toHaveBeenCalledWith('quests', expect.objectContaining({
        life: expect.objectContaining({
          id: 'life',
          version: 3
        })
      }))
    })

    it('should push old version to history when updating', async () => {
      const existingQuest = { ...mockQuest, version: 1 }
      mockDb.get.mockResolvedValue({ life: existingQuest })

      await saveQuest('life', {
        ...mockQuest,
        version: 2,
        content: { ...mockQuest.content, mainQuest: 'Updated quest' }
      })

      // The save should include the history array with the old version
      const savedData = mockDb.save.mock.calls[0][1]
      expect(savedData.life.history).toBeDefined()
      expect(savedData.life.history).toContainEqual(existingQuest)
    })
  })

  describe('getQuestHistory', () => {
    it('should return history for a quest', async () => {
      const questWithHistory = {
        ...mockQuest,
        history: [
          { ...mockQuest, version: 1 },
          { ...mockQuest, version: 2 }
        ]
      }
      mockDb.get.mockResolvedValue({ life: questWithHistory })

      const result = await getQuestHistory('life')

      expect(result).toEqual(questWithHistory.history)
    })

    it('should return empty array when no history exists', async () => {
      mockDb.get.mockResolvedValue({ life: mockQuest })

      const result = await getQuestHistory('life')

      expect(result).toEqual([])
    })

    it('should return empty array when quest does not exist', async () => {
      mockDb.get.mockResolvedValue({})

      const result = await getQuestHistory('life')

      expect(result).toEqual([])
    })
  })
})