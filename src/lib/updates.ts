import { registerSW } from 'virtual:pwa-register'
import { isWriting } from './writing'

const CHECK_EVERY_MS = 60 * 60 * 1000

/**
 * Registers the service worker (once, from main.tsx) and keeps Cadence up to date (spec §2.3):
 * checks hourly and whenever the page becomes visible, because resuming a Home Screen app isn't a
 * navigation. A new build never reloads the page under the owner: it waits until the page is next
 * shown with nothing being written.
 */
export function keepUpToDate(): void {
  let reloadWaiting = false

  registerSW({
    immediate: true,
    onNeedReload() {
      reloadWaiting = true
    },
    onRegisteredSW(swUrl, registration) {
      if (!registration) return

      // The plugin's documented check: skip while installing or offline, and only update if the script is reachable
      const check = async () => {
        if (registration.installing || !navigator.onLine) return
        const response = await fetch(swUrl, { cache: 'no-store', headers: { 'cache-control': 'no-cache' } }).catch(
          () => undefined,
        )
        if (response?.status === 200) await registration.update()
      }

      setInterval(check, CHECK_EVERY_MS)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState !== 'visible') return
        if (reloadWaiting && !isWriting()) window.location.reload()
        else void check()
      })
    },
  })
}
