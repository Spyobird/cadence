import React, { useState } from 'react'
import { useQuests, Quest, QuestContent } from '../hooks/useQuests'
import { QuestForm } from './QuestForm'

interface EvolutionLabProps {
  onNavigate?: (view: string) => void
}

export function EvolutionLab({ onNavigate }: EvolutionLabProps) {
  const { quests, saveQuest, loading } = useQuests()
  const [selectedId, setSelectedId] = useState<'life' | 'work'>('life')
  const [isEditing, setIsEditing] = useState(false)

  const currentQuest = quests[selectedId]

  const handleSave = async (updatedContent: QuestContent) => {
    if (!currentQuest) return

    const updatedQuest: Quest = {
      ...currentQuest,
      content: updatedContent,
      version: currentQuest.version + 1,
      updatedAt: Date.now(),
    }

    await saveQuest(selectedId, updatedQuest)
    setIsEditing(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-[#D4AF37] animate-pulse">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col w-full max-w-lg mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[#C0C4CC]">Evolution Lab</h1>
        <button
          onClick={() => onNavigate?.('dashboard')}
          className="text-sm text-[#D4AF37] hover:underline"
        >
          Back to Dashboard
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-[#1E2124] rounded-lg p-1 mb-6">
        <button
          onClick={() => {
            setSelectedId('life')
            setIsEditing(false)
          }}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition ${
            selectedId === 'life'
              ? 'bg-[#D4AF37] text-[#0F1113]'
              : 'text-[#C0C4CC] hover:text-white'
          }`}
        >
          Life
        </button>
        <button
          onClick={() => {
            setSelectedId('work')
            setIsEditing(false)
          }}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition ${
            selectedId === 'work'
              ? 'bg-[#D4AF37] text-[#0F1113]'
              : 'text-[#C0C4CC] hover:text-white'
          }`}
        >
          Work
        </button>
      </div>

      {isEditing ? (
        <div className="animate-in fade-in duration-300">
          <QuestForm
            quest={currentQuest?.content || {
              mainQuest: '',
              importance: '',
              successMetrics: [],
              commitments: [],
              excitement: '',
            }}
            onSubmit={handleSave}
            onCancel={() => setIsEditing(false)}
          />
        </div>
      ) : (
        <div className="space-y-8">
          {/* Current Quest Card */}
          <div className="bg-[#1E2124] rounded-xl p-6 border border-[#374151]">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-[#C0C4CC] capitalize">
                  {selectedId} Quest
                </h2>
                <p className="text-xs text-[#64748B] mt-1">
                  Last updated: {currentQuest?.updatedAt
                    ? new Date(currentQuest.updatedAt).toLocaleString()
                    : 'Never'}
                </p>
              </div>
              <span className="text-sm font-mono text-[#D4AF37] bg-[#0F1113] px-2 py-1 rounded">
                v{currentQuest?.version || 1}
              </span>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <h3 className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-1">
                  Main Quest
                </h3>
                <p className="text-[#C0C4CC] text-lg">{currentQuest?.content.mainQuest}</p>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-1">
                  Importance
                </h3>
                <p className="text-[#C0C4CC]">{currentQuest?.content.importance}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-1">
                    Success Metrics
                  </h3>
                  <ul className="text-sm text-[#C0C4CC] list-disc list-inside">
                    {currentQuest?.content.successMetrics.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-1">
                    Commitments
                  </h3>
                  <ul className="text-sm text-[#C0C4CC] list-disc list-inside">
                    {currentQuest?.content.commitments.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsEditing(true)}
              className="w-full py-3 bg-[#D4AF37] text-[#0F1113] rounded-lg font-bold hover:opacity-90 transition"
            >
              Update Goal
            </button>
          </div>

          {/* Version History */}
          <div>
            <h3 className="text-lg font-bold text-[#C0C4CC] mb-4">Version History</h3>
            <div className="space-y-4">
              {currentQuest?.history && currentQuest.history.length > 0 ? (
                currentQuest.history.map((h, i) => (
                  <div
                    key={i}
                    className="bg-[#1E2124] rounded-lg p-4 border border-[#374151] opacity-80"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-mono text-[#D4AF37]">v{h.version}</span>
                      <span className="text-xs text-[#64748B]">
                        {new Date(h.updatedAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-[#C0C4CC] line-clamp-2">
                      {h.content.mainQuest}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#64748B] italic">No previous versions found.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
