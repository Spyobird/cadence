import { useLayoutEffect, useState } from 'react'
import { Backup } from './components/Backup'
import { Edit } from './components/Edit'
import { History } from './components/History'
import { Setup } from './components/Setup'
import { Today } from './components/Today'
import { CadenceContext, useCadence } from './hooks/useCadence'
import { applyAppearance } from './lib/appearance'
import type { Quarter } from './lib/quarters'
import type { Quest, Store } from './lib/store'

export function App({ store }: { store: Store }) {
  return (
    <CadenceContext value={store}>
      <Screens />
    </CadenceContext>
  )
}

/**
 * A screen pushed over Today or setup. Edit and History keep the Quarter they opened in, so midnight doesn't move
 * the screen out from under them: an edit saved after the Quarter's end is refused, and keeps its words (spec §8).
 */
type Pushed =
  | { screen: 'backup'; from: 'today' | 'setup' }
  | { screen: 'edit' | 'history'; quarter: Quarter; quest: Quest }

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
  const [pushed, setPushed] = useState<Pushed>()
  /**
   * The Quarter on Today while a Reflection popup is open there: midnight doesn't move the screen out from under it,
   * so a save refused at the Quarter's end keeps its words (spec §7.1)
   */
  const [reflectingIn, setReflectingIn] = useState<Quarter>()

  if (pushed) {
    // An import can change the screen underneath, so leaving goes where the data now says (spec §12.3)
    const leave = () => {
      setPushed(undefined)
      setInSetup(settingUp)
    }
    switch (pushed.screen) {
      case 'backup':
        return <Backup back={pushed.from === 'today' ? 'Today' : 'Close'} onBack={leave} />
      case 'edit':
        return <Edit quarter={pushed.quarter} quest={pushed.quest} onClose={leave} />
      case 'history':
        return <History quarter={pushed.quarter} quest={pushed.quest} onBack={leave} />
    }
  }
  // Setup places the banners itself, inside the screen it fits to the keyboard
  if (inSetup && !reflectingIn) {
    return (
      <Setup
        quarter={screen.quarter}
        onToday={() => setInSetup(false)}
        onRestore={() => setPushed({ screen: 'backup', from: 'setup' })}
      />
    )
  }
  const quarter = reflectingIn ?? screen.quarter
  return (
    <Today
      quarter={quarter}
      onEdit={(quest) => setPushed({ screen: 'edit', quarter, quest })}
      onHistory={(quest) => setPushed({ screen: 'history', quarter, quest })}
      onBackup={() => setPushed({ screen: 'backup', from: 'today' })}
      onReflecting={(open) => setReflectingIn(open ? quarter : undefined)}
    />
  )
}
