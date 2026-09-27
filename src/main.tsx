import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

import { registerSW } from 'virtual:pwa-register'

registerSW({
  onOfflineReady() {
    console.log('PWA ready for offline use')
  }
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)