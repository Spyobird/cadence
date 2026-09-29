import { createContext, useContext, useMemo, useSyncExternalStore } from 'react'
import { isBackupDue, msToMidnight, screenFor } from '../lib/quarters'
import type { Store } from '../lib/store'

/** The open store, provided once by the app shell: `<CadenceContext value={store}>` */
export const CadenceContext = createContext<Store | null>(null)

/**
 * Calls `onChange` at each local midnight, and whenever Cadence is shown again, so the date is read afresh (spec §3).
 * A Home Screen app can sit in the background across midnight, where its timers don't run.
 */
function watchTheDate(now: () => Date) {
  return (onChange: () => void) => {
    let midnight: ReturnType<typeof setTimeout>
    const wait = () => {
      midnight = setTimeout(() => {
        onChange()
        wait()
      }, msToMidnight(now()))
    }
    const shown = () => {
      clearTimeout(midnight)
      onChange()
      wait()
    }
    wait()
    document.addEventListener('visibilitychange', shown)
    return () => {
      clearTimeout(midnight)
      document.removeEventListener('visibilitychange', shown)
    }
  }
}

/** The one way the UI reads Cadence's data and writes it (spec §13.3). Re-renders after every write, and on a new day. */
export function useCadence() {
  const store = useContext(CadenceContext)
  if (!store) throw new Error('useCadence() needs a <CadenceContext value={store}> above it')
  const snapshot = useSyncExternalStore(store.subscribe, store.snapshot)
  const onNewDay = useMemo(() => watchTheDate(store.now), [store])
  const today = useSyncExternalStore(onNewDay, store.today)
  return {
    snapshot,
    today,
    /** Which screen Cadence opens on today */
    screen: screenFor(snapshot, today),
    /** The menu nudges for a backup (spec §6.3) */
    backupDue: isBackupDue(snapshot, today),
    saveSetupDraft: store.saveSetupDraft,
    switchSetupTarget: store.switchSetupTarget,
    finishQuest: store.finishQuest,
    setAppearance: store.setAppearance,
    exportBackup: store.exportBackup,
    markBackedUp: store.markBackedUp,
    readBackup: store.readBackup,
    replaceWith: store.replaceWith,
  }
}
