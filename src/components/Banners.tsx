import { useState } from 'react'
import { isStandalone } from '../lib/launch'
import { NewerDataBanner } from './NewerDataBanner'
import { SafariBanner } from './SafariBanner'

/** Across the top of every screen: opened in a Safari tab (spec §2.7), and data from a newer Cadence (§13.4) */
export function Banners() {
  const [standalone] = useState(isStandalone)
  return (
    <>
      {!standalone && <SafariBanner />}
      <NewerDataBanner />
    </>
  )
}
