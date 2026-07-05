import { v4 as uuidv4 } from 'uuid'
import { db } from '../lib/db'

export interface Reflection {
  id: string
  questId: 'life' | 'work'
  date: string // YYYY-MM-DD
  prompt: string
  text: string
  createdAt: number
}

// Storage key for reflections
const REFLECTIONS_KEY = 'reflections'

// Standalone functions for testing
export async function saveReflection(
  questId: 'life' | 'work',
  date: string,
  prompt: string,
  text: string
): Promise<void> {
  const reflections = await db.get(REFLECTIONS_KEY) || {}

  reflections[date] = {
    id: uuidv4(),
    questId,
    date,
    prompt,
    text,
    createdAt: Date.now()
  }

  await db.save(REFLECTIONS_KEY, reflections)
}

export async function getReflectionsForDate(date: string): Promise<Record<string, Reflection>> {
  const reflections = await db.get(REFLECTIONS_KEY) || {}
  return reflections[date] ? { [date]: reflections[date] } : {}
}

export async function getAllReflections(): Promise<Record<string, Reflection>> {
  return await db.get(REFLECTIONS_KEY) || {}
}

// React hook
export function useReflections() {
  return {
    saveReflection,
    getReflectionsForDate,
    getAllReflections
  }
}