import { useState } from 'react'
import { Banners } from './components/Banners'
import { Placeholder } from './components/Placeholder'
import { Setup } from './components/Setup'
import { CadenceContext, useCadence } from './hooks/useCadence'
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
  const { screen } = useCadence()
  const settingUp = screen.name === 'setup' || screen.name === 'resume'
  // Finishing Life moves screenFor on, but setup stays on screen with "Q4 2026 is set up" until the owner leaves it
  const [inSetup, setInSetup] = useState(settingUp)
  if (settingUp && !inSetup) setInSetup(true)

  // Setup places the banners itself, inside the screen it fits to the keyboard
  if (inSetup) return <Setup quarter={screen.quarter} onToday={() => setInSetup(false)} />
  return (
    <>
      <Banners />
      <Placeholder quarter={screen.quarter} />
    </>
  )
}
