import React, { useMemo, useState, useEffect } from 'react'
import { useReflections, Reflection } from '../hooks/useReflections'

export function ReflectionLog() {
  const { getAllReflections } = useReflections()
  const [reflectionsMap, setReflectionsMap] = useState<Record<string, Reflection[]>>({})

  useEffect(() => {
    getAllReflections().then(setReflectionsMap)
  }, [getAllReflections])

  const sortedDates = useMemo(() => {
    return Object.keys(reflectionsMap).sort((a, b) => b.localeCompare(a))
  }, [reflectionsMap])

  if (Object.keys(reflectionsMap).length === 0) {
    return (
      <div className="flex flex-col w-full max-w-lg mx-auto py-6 text-center">
        <p className="text-[#64748B] italic">The void is empty. No reflections recorded yet.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col w-full max-w-lg mx-auto py-6">
      <h2 className="text-xl font-bold text-[#C0C4CC] mb-6">Reflection Archive</h2>

      <div className="space-y-8">
        {sortedDates.map(date => {
          const dayReflections = reflectionsMap[date]
          if (!Array.isArray(dayReflections)) return null

          return (
            <div key={date} className="space-y-4">
              <h3 className="text-sm font-mono text-[#D4AF37] uppercase tracking-widest border-b border-[#1E2124] pb-1">
                {date}
              </h3>
              <div className="space-y-6">
                {dayReflections.map(reflection => (
                  <div key={reflection.id} className="bg-[#1E2124] rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                        reflection.questId === 'life' ? 'bg-blue-900/30 text-blue-400' : 'bg-purple-900/30 text-purple-400'
                      }`}>
                        {reflection.questId}
                      </span>
                    </div>
                    <p className="text-[#64748B] text-xs italic">{reflection.prompt}</p>
                    <p className="text-[#C0C4CC] leading-relaxed">{reflection.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
