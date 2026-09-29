import { useState } from 'react'
import { NewerDataBanner } from './components/NewerDataBanner'
import { Placeholder } from './components/Placeholder'
import { SafariBanner } from './components/SafariBanner'
import { Setup } from './components/Setup'
import { CadenceContext, useCadence } from './hooks/useCadence'
import { isStandalone } from './lib/launch'
import type { Store } from './lib/store'

export function App({ store }: { store: Store }) {
  const [standalone] = useState(isStandalone)
  return (
    <CadenceContext value={store}>
      {!standalone && <SafariBanner />}
      <NewerDataBanner />
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

  if (inSetup) return <Setup quarter={screen.quarter} onToday={() => setInSetup(false)} />
  return <Placeholder quarter={screen.quarter} />
}
