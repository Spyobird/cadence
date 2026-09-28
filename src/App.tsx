import { useState } from 'react'
import { Placeholder } from './components/Placeholder'
import { SafariBanner } from './components/SafariBanner'
import { isStandalone } from './lib/launch'

export function App() {
  const [standalone] = useState(isStandalone)
  return (
    <>
      {!standalone && <SafariBanner />}
      <Placeholder />
    </>
  )
}
