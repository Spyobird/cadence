import { useState, useEffect } from 'react'
import { db } from '../lib/db'

export interface QuestContent {
  mainQuest: string
  importance: string
  successMetrics: string[]
  commitments: string[]
  excitement: string
}

export interface Quest {
  id: 'life' | 'work'
  version: number
  content: QuestContent
  updatedAt: number
  history?: Quest[]
}

// Standalone functions for testing
export async function getQuests(): Promise<Record<'life' | 'work', Quest>> {
  const quests = await db.get('quests')
  return quests || {}
}

export async function saveQuest(id: 'life' | 'work', updatedQuest: Quest): Promise<void> {
  const quests = await getQuests()

  if (quests[id]) {
    // Push old version to history
    const existingQuest = quests[id]
    const history = existingQuest.history || []

    // Create new quest with history
    quests[id] = {
      ...updatedQuest,
      history: [...history, existingQuest]
    }
  } else {
    // New quest, no history yet
    quests[id] = updatedQuest
  }

  await db.save('quests', quests)
}

export async function getQuestHistory(id: 'life' | 'work'): Promise<Quest[]> {
  const quests = await getQuests()
  const quest = quests[id]
  return quest?.history || []
}

// React hook
export function useQuests() {
  const [quests, setQuests] = useState<Record<'life' | 'work', Quest>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadQuests()
  }, [])

  async function loadQuests() {
    try {
      const loadedQuests = await getQuests()
      setQuests(loadedQuests)
      setLoading(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load quests')
      setLoading(false)
    }
  }

  return {
    quests,
    loading,
    error,
    getQuests,
    saveQuest,
    getQuestHistory
  }
}