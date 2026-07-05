import React, { useState, useEffect } from 'react'
import { useQuests } from '../hooks/useQuests'
import { useReflections } from '../hooks/useReflections'
import { WEEKLY_PROMPTS } from '../constants/prompts'

interface DashboardProps {
  onNavigate?: (view: string) => void
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { quests } = useQuests()
  const { saveReflection } = useReflections()

  const [lifeReflectionText, setLifeReflectionText] = useState('')
  const [workReflectionText, setWorkReflectionText] = useState('')
  const [hasSavedToday, setHasSavedToday] = useState(false)

  // Get the current day's prompt (Monday = 0, Sunday = 6)
  const getPromptForDay = (): string => {
    const today = new Date()
    const dayOfWeek = today.getDay() // 0 = Sun, 1 = Mon, ..., 6 = Sat
    // Adjust to match WEEKLY_PROMPTS index (Mon = 0, Sun = 6)
    const promptIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    return WEEKLY_PROMPTS[promptIndex]
  }

  const [currentPrompt] = useState(getPromptForDay)

  const today = new Date().toISOString().split('T')[0]

  const handleSaveReflection = async () => {
    const lifeToSave = lifeReflectionText.trim()
    const workToSave = workReflectionText.trim()

    if (!lifeToSave && !workToSave) return

    if (lifeToSave) {
      await saveReflection('life', today, currentPrompt, lifeToSave)
    }
    if (workToSave) {
      await saveReflection('work', today, currentPrompt, workToSave)
    }

    setLifeReflectionText('')
    setWorkReflectionText('')
    setHasSavedToday(true)

    // Reset hasSavedToday after a short delay
    setTimeout(() => setHasSavedToday(false), 2000)
  }

  const clearReflection = () => {
    setLifeReflectionText('')
    setWorkReflectionText('')
  }

  return (
    <div className="flex flex-col w-full max-w-lg mx-auto py-6">
      {/* Rhythm Strip */}
      <div className="flex justify-center mb-4">
        <div className="w-2 h-2 bg-[#D4AF37] rounded-full"></div>
      </div>

      {/* Quest Summary Section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-[#C0C4CC] mb-4">Quest Summary</h2>

        <div className="grid gap-4">
          {/* Life Quest */}
          <div className="bg-[#1E2124] rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-bold text-[#C0C4CC]">Life</h3>
              <span className="text-sm text-[#D4AF37] font-mono">v{quests.life?.version || 1}</span>
            </div>
            <p className="text-[#C0C4CC] text-sm">{quests.life?.content.mainQuest || 'No quest defined'}</p>
          </div>

          {/* Work Quest */}
          <div className="bg-[#1E2124] rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-bold text-[#C0C4CC]">Work</h3>
              <span className="text-sm text-[#D4AF37] font-mono">v{quests.work?.version || 1}</span>
            </div>
            <p className="text-[#C0C4CC] text-sm">{quests.work?.content.mainQuest || 'No quest defined'}</p>
          </div>
        </div>
      </div>

      {/* Daily Reflection Section */}
      <div>
        <h2 className="text-xl font-bold text-[#C0C4CC] mb-4">Daily Reflection</h2>

        <div className="bg-[#1E2124] rounded-lg p-4 mb-4">
          <p className="text-[#C0C4CC] text-sm italic mb-3">{currentPrompt}</p>

          <textarea
            value={lifeReflectionText}
            onChange={(e) => setLifeReflectionText(e.target.value)}
            placeholder="Life reflection..."
            className="w-full px-3 py-2 bg-[#0F1113] border border-[#374151] rounded-lg text-[#C0C4CC] placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] resize-y mb-4"
            rows={3}
          />

          <textarea
            value={workReflectionText}
            onChange={(e) => setWorkReflectionText(e.target.value)}
            placeholder="Work reflection..."
            className="w-full px-3 py-2 bg-[#0F1113] border border-[#374151] rounded-lg text-[#C0C4CC] placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#D4AF37] resize-y"
            rows={3}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSaveReflection}
            disabled={hasSavedToday || (!lifeReflectionText.trim() && !workReflectionText.trim())}
            className={`flex-1 px-4 py-3 rounded-lg font-semibold transition ${
              hasSavedToday || (!lifeReflectionText.trim() && !workReflectionText.trim())
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-[#D4AF37] text-[#0F1113] hover:opacity-90'
            }`}
          >
            {hasSavedToday ? 'Saved!' : 'Save'}
          </button>
          <button
            onClick={clearReflection}
            className="px-4 py-3 border border-[#374151] text-[#C0C4CC] rounded-lg font-medium hover:bg-[#374151] transition"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  )
}