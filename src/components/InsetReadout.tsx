import { useEffect, useRef, useState } from 'react'

// Temporary, for phone check step 7 (spec §15.2): what the phone reports about its safe areas. Removed in slice 4.
export function InsetReadout() {
  const probe = useRef<HTMLDivElement>(null)
  const [readings, setReadings] = useState({ insetTop: '', innerHeight: 0, screenHeight: 0 })

  useEffect(() => {
    const read = () =>
      setReadings({
        insetTop: probe.current ? getComputedStyle(probe.current).paddingTop : '',
        innerHeight: window.innerHeight,
        screenHeight: window.screen.height,
      })
    read()
    window.addEventListener('resize', read)
    return () => window.removeEventListener('resize', read)
  }, [])

  return (
    <dl className="grid grid-cols-[1fr_auto] gap-x-4 text-s text-given tabular-nums">
      <div ref={probe} aria-hidden className="pt-safe absolute" />
      <dt>env(safe-area-inset-top)</dt>
      <dd>{readings.insetTop}</dd>
      <dt>innerHeight</dt>
      <dd>{readings.innerHeight}px</dd>
      <dt>screen.height</dt>
      <dd>{readings.screenHeight}px</dd>
    </dl>
  )
}
