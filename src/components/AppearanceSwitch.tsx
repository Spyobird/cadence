import { useState } from 'react'
import { applyAppearance, type Appearance } from '../lib/appearance'

const CHOICES: { value: Appearance; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

// Temporary, for phone check step 5 (spec §15.2). Not stored. Removed in slice 4, when Appearance moves to the menu.
export function AppearanceSwitch() {
  const [appearance, setAppearance] = useState<Appearance>('system')

  function choose(next: Appearance) {
    setAppearance(next)
    applyAppearance(next)
  }

  return (
    <fieldset>
      <legend className="text-s text-faint mb-2">Appearance</legend>
      <div className="flex rounded-full bg-raise p-1">
        {CHOICES.map(({ value, label }) => (
          <label
            key={value}
            className="flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-full text-m text-given has-checked:bg-surface has-checked:text-ink has-focus-visible:outline-2 has-focus-visible:outline-gold"
          >
            <input
              type="radio"
              name="appearance"
              value={value}
              checked={appearance === value}
              onChange={() => choose(value)}
              className="sr-only"
            />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
