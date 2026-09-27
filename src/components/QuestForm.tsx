import React, { useState, useCallback } from 'react'
import { QuestContent } from '../hooks/useQuests'

interface QuestFormProps {
  quest: QuestContent
  onSubmit: (quest: QuestContent) => void
  onCancel?: () => void
}

export function QuestForm({ quest, onSubmit, onCancel }: QuestFormProps) {
  const [formData, setFormData] = useState<QuestContent>(quest)
  const [newSuccessMetric, setNewSuccessMetric] = useState('')
  const [newCommitment, setNewCommitment] = useState('')

  const handleInputChange = (field: keyof QuestContent, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAddItem = useCallback((field: 'successMetrics' | 'commitments', value: string, setter: (value: string) => void) => {
    if (!value.trim()) return

    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], value.trim()]
    }))

    setter('')
  }, [])

  const handleRemoveItem = (field: 'successMetrics' | 'commitments', index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const ListField = ({
    label,
    field,
    newValue,
    onValueChange,
    addLabel
  }: {
    label: string
    field: 'successMetrics' | 'commitments'
    newValue: string
    onValueChange: (value: string) => void
    addLabel: string
  }) => {
    const items = formData[field]
    const isSuccessMetrics = field === 'successMetrics'
    const setter = isSuccessMetrics ? setNewSuccessMetric : setNewCommitment

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleAddItem(field, e.target.value, setter)
      }
    }

    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-[#64748B] mb-2">
          {label}
        </label>

        <div className="space-y-2 mb-2">
          {items.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="flex-1 px-3 py-2 bg-[#1E2124] rounded text-sm text-[#C0C4CC]">
                {item}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveItem(field, index)}
                className="flex-shrink-0 w-6 h-6 rounded-full bg-red-900/30 text-red-400 hover:bg-red-900/50 flex items-center justify-center"
                aria-label={`Remove ${item}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newValue}
            onChange={(e) => onValueChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={addLabel}
            className="flex-1 px-3 py-2 border border-[#374151] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#C0C4CC]"
          />
          <button
            type="button"
            onClick={() => handleAddItem(field, newValue, setter)}
            className="px-4 py-2 bg-[#D4AF37] text-[#0F1113] rounded-lg font-semibold hover:opacity-90 transition"
          >
            Add
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-lg mx-auto">
      <div className="mb-4">
        <label
          htmlFor="mainQuest"
          className="block text-sm font-medium text-[#64748B] mb-2"
        >
          Main Quest
        </label>
        <input
          id="mainQuest"
          type="text"
          value={formData.mainQuest}
          onChange={(e) => handleInputChange('mainQuest', e.target.value)}
          placeholder="What is your main quest for this quarter?"
          className="w-full px-4 py-3 border border-[#374151] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#C0C4CC] placeholder-[#64748B]"
        />
      </div>

      <div className="mb-4">
        <label
          htmlFor="importance"
          className="block text-sm font-medium text-[#64748B] mb-2"
        >
          Importance
        </label>
        <textarea
          id="importance"
          rows={3}
          value={formData.importance}
          onChange={(e) => handleInputChange('importance', e.target.value)}
          placeholder="Why is this the most important thing?"
          className="w-full px-4 py-3 border border-[#374151] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#C0C4CC] placeholder-[#64748B] resize-y"
        />
      </div>

      <ListField
        label="Success Metrics"
        field="successMetrics"
        newValue={newSuccessMetric}
        onValueChange={setNewSuccessMetric}
        addLabel="Add observable result..."
      />

      <ListField
        label="Commitments"
        field="commitments"
        newValue={newCommitment}
        onValueChange={setNewCommitment}
        addLabel="Add commitment..."
      />

      <div className="mb-6">
        <label
          htmlFor="excitement"
          className="block text-sm font-medium text-[#64748B] mb-2"
        >
          Excitement
        </label>
        <textarea
          id="excitement"
          rows={3}
          value={formData.excitement}
          onChange={(e) => handleInputChange('excitement', e.target.value)}
          placeholder="What makes this exciting?"
          className="w-full px-4 py-3 border border-[#374151] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#C0C4CC] placeholder-[#64748B] resize-y"
        />
      </div>

      <div className="flex gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-3 border border-[#374151] text-[#C0C4CC] rounded-lg font-medium hover:bg-[#374151] transition"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className={`flex-1 px-4 py-3 rounded-lg font-semibold transition ${
            onCancel ? '' : 'ml-auto'
          } bg-[#D4AF37] text-[#0F1113] hover:opacity-90`}
        >
          Save
        </button>
      </div>
    </form>
  )
}