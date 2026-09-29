import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { LaunchFailed } from './components/LaunchFailed'
import { askToPersist } from './lib/launch'
import { open } from './lib/store'
import { keepUpToDate } from './lib/updates'
import './index.css'

keepUpToDate()
askToPersist()

const root = createRoot(document.getElementById('root')!)
open(() => new Date()).then(
  (store) =>
    root.render(
      <StrictMode>
        <App store={store} />
      </StrictMode>,
    ),
  () => root.render(<LaunchFailed />),
)
