import { createContext, useContext, useSyncExternalStore } from 'react'
import { screenFor } from '../lib/quarters'
import type { Store } from '../lib/store'

/** The open store, provided once by the app shell: `<CadenceContext value={store}>` */
export const CadenceContext = createContext<Store | null>(null)

/** The one way the UI reads Cadence's data and writes it (spec §13.3). Re-renders after every write. */
export function useCadence() {
  const store = useContext(CadenceContext)
  if (!store) throw new Error('useCadence() needs a <CadenceContext value={store}> above it')
  const snapshot = useSyncExternalStore(store.subscribe, store.snapshot)
  const today = store.today()
  return {
    snapshot,
    today,
    /** Which screen Cadence opens on today */
    screen: screenFor(snapshot, today),
    saveSetupDraft: store.saveSetupDraft,
    switchSetupTarget: store.switchSetupTarget,
    finishQuest: store.finishQuest,
  }
}
