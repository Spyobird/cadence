import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { LaunchFailed } from './components/LaunchFailed'
import { overriddenClock } from './lib/dateOverride'
import { askToPersist } from './lib/launch'
import { open } from './lib/store'
import { keepUpToDate } from './lib/updates'
// The Main Quest's face on Today: Plus Jakarta Sans 800, bundled and precached so it works offline (DESIGN.md)
import '@fontsource/plus-jakarta-sans/latin-800.css'
import './index.css'

keepUpToDate()
askToPersist()

const realClock = () => new Date()
// A dev build can move the date, `?today=2026-12-20`; a production build leaves the override out (spec §15.2)
const clock = import.meta.env.DEV ? overriddenClock(location.search, realClock) : realClock

const root = createRoot(document.getElementById('root')!)
open(clock).then(
  (store) =>
    root.render(
      <StrictMode>
        <App store={store} />
      </StrictMode>,
    ),
  () => root.render(<LaunchFailed />),
)
