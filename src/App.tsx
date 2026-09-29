import { useLayoutEffect, useState } from 'react'
import { Backup } from './components/Backup'
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
  /** The Backup screen is open, from Today's menu or from a blank setup */
  const [backupFrom, setBackupFrom] = useState<'today' | 'setup'>()

  if (backupFrom) {
    // An import can change the screen underneath, so leaving Backup goes where the data now says (spec §12.3)
    const leave = () => {
      setBackupFrom(undefined)
      setInSetup(settingUp)
    }
    return <Backup back={backupFrom === 'today' ? 'Today' : 'Close'} onBack={leave} />
  }
  // Setup places the banners itself, inside the screen it fits to the keyboard
  if (inSetup) {
    return <Setup quarter={screen.quarter} onToday={() => setInSetup(false)} onRestore={() => setBackupFrom('setup')} />
  }
  return <Today quarter={screen.quarter} onBackup={() => setBackupFrom('today')} />
}
