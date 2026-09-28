import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { askToPersist } from './lib/launch'
import { keepUpToDate } from './lib/updates'
import './index.css'

keepUpToDate()
askToPersist()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
