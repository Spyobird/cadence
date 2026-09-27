import React, { useState } from 'react'
import { QuestContent, Quest } from '../hooks/useQuests'
import { useQuests } from '../hooks/useQuests'
import { QuestForm } from './QuestForm'

type OnboardingStep = 1 | 2 | 3

interface OnboardingProps {
  onNavigate: (view: 'dashboard') => void
}

const createQuestContent = (updates: Partial<QuestContent> = {}): QuestContent => ({
  mainQuest: '',
  importance: '',
  successMetrics: [],
  commitments: [],
  excitement: '',
  ...updates
})

const createQuest = (id: 'life' | 'work', content: QuestContent): Quest => ({
  id,
  version: 1,
  content,
  updatedAt: Date.now()
})

export function Onboarding({ onNavigate }: OnboardingProps) {
  const [step, setStep] = useState<OnboardingStep>(1)
  const [lifeQuestContent, setLifeQuestContent] = useState<QuestContent | null>(null)
  const [workQuestContent, setWorkQuestContent] = useState<QuestContent | null>(null)

  const { saveQuest } = useQuests()

  const handleSaveLifeQuest = async (content: QuestContent) => {
    const quest = createQuest('life', content)
    await saveQuest('life', quest)
    setLifeQuestContent(content)
    setStep(2)
  }

  const handleSaveWorkQuest = async (content: QuestContent) => {
    const quest = createQuest('work', content)
    await saveQuest('work', quest)
    setWorkQuestContent(content)
    setStep(3)
  }

  const handleComplete = () => {
    onNavigate('dashboard')
  }

  const getStepTitle = (): string => {
    switch (step) {
      case 1: return 'Life Quest'
      case 2: return 'Work Quest'
      case 3: return 'All Done!'
      default: return 'Onboarding'
    }
  }

  const getStepDescription = (): string => {
    switch (step) {
      case 1: return 'Your life quest for this quarter'
      case 2: return 'Your work quest for this quarter'
      case 3: return "You've completed your quarterly setup"
      default: return ''
    }
  }

  const getStepInput = (): QuestContent => {
    if (step === 1) {
      return lifeQuestContent || createQuestContent()
    }
    if (step === 2) {
      return workQuestContent || createQuestContent()
    }
    return createQuestContent()
  }

  const handleStepSubmit = async (content: QuestContent) => {
    if (step === 1) {
      await handleSaveLifeQuest(content)
    } else if (step === 2) {
      await handleSaveWorkQuest(content)
    }
  }

  const handleStepCancel = () => {
    if (step === 1) {
      handleComplete()
    } else if (step === 2) {
      setStep(1)
    } else {
      setStep(2)
    }
  }

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto py-8">
      <div className="mb-6 text-center">
        <span className="text-sm text-[#64748B]">
          Step {step} of 3
        </span>
      </div>

      <h2 className="text-2xl font-bold mb-2 text-[#C0C4CC]">
        {getStepTitle()}
      </h2>

      <p className="text-[#64748B] mb-6 text-center">
        {getStepDescription()}
      </p>

      {step < 3 && (
        <QuestForm
          quest={getStepInput()}
          onSubmit={handleStepSubmit}
          onCancel={handleStepCancel}
        />
      )}

      {step === 3 && (
        <div className="text-center py-8">
          <div className="mb-4">
            <div className="w-16 h-16 bg-[#D4AF37] rounded-full flex items-center justify-center mx-auto">
              <svg
                className="w-8 h-8 text-[#0F1113]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="3"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          <h3 className="text-xl font-bold mb-2 text-[#C0C4CC]">
            All Set!
          </h3>

          <p className="text-[#64748B] mb-6">
            Your quarterly goals are ready. Let's get to work.
          </p>

          <button
            onClick={handleComplete}
            className="px-8 py-3 bg-[#D4AF37] text-[#0F1113] rounded-full font-semibold hover:opacity-90 transition"
          >
            Go to Dashboard
          </button>
        </div>
      )}
    </div>
  )
}