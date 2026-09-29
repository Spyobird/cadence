import { useCadence } from '../hooks/useCadence'
import type { Appearance } from '../lib/appearance'

const CHOICES: { value: Appearance; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

/** System, Light or Dark, kept in meta (spec §2.8). The app shell applies it once it's saved. */
export function AppearanceSwitch({ onFailure }: { onFailure: (error: unknown) => void }) {
  const { snapshot, setAppearance } = useCadence()

  return (
    <fieldset>
      <legend className="mb-2 text-s text-faint">Appearance</legend>
      <div className="flex rounded-full bg-raise p-1">
        {CHOICES.map(({ value, label }) => (
          <label
            key={value}
            className="flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-full text-m text-given has-checked:bg-surface has-checked:text-ink has-focus-visible:outline-2 has-focus-visible:outline-ink"
          >
            <input
              type="radio"
              name="appearance"
              value={value}
              checked={snapshot.meta.appearance === value}
              onChange={() => setAppearance(value).catch(onFailure)}
              className="sr-only"
            />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
