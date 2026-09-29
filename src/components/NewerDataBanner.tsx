import { useCadence } from '../hooks/useCadence'

/** Data from a newer Cadence opens read-only (spec §13.4) */
export function NewerDataBanner() {
  const { snapshot } = useCadence()
  if (!snapshot.readOnly) return null
  return (
    <p role="status" className="border-b border-line px-gutter py-3 text-m text-ink">
      This data is from a newer Cadence. Update Cadence to make changes.
    </p>
  )
}
