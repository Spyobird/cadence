import { useLayoutEffect, useState } from 'react'
import { Setup } from './components/Setup'
import { Today } from './components/Today'
import { CadenceContext, useCadence } from './hooks/useCadence'
import { applyAppearance } from './lib/appearance'
import type { Store } from './lib/store'

export function App({ store }: { store: Store }) {
  return (
    <CadenceContext value={store}>
      <Screens />
    </CadenceContext>
  )
}

/** Routes on screenFor (spec §3.1) */
function Screens() {
  const { screen, snapshot } = useCadence()
  const { appearance } = snapshot.meta
  // The look follows the stored Appearance, once it's saved (spec §2.8)
  useLayoutEffect(() => applyAppearance(appearance), [appearance])

  const settingUp = screen.name === 'setup' || screen.name === 'resume'
  // Finishing Life moves screenFor on, but setup stays on screen with "Q4 2026 is set up" until the owner leaves it
  const [inSetup, setInSetup] = useState(settingUp)
  if (settingUp && !inSetup) setInSetup(true)

  // Setup places the banners itself, inside the screen it fits to the keyboard
  if (inSetup || settingUp) return <Setup quarter={screen.quarter} onToday={() => setInSetup(false)} />
  return <Today screen={screen} />
}
