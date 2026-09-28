declare global {
  interface Navigator {
    /** iOS Safari: true when opened from the Home Screen */
    standalone?: boolean
  }
}

/** Opened as a Home Screen app, not in a Safari tab */
export function isStandalone(): boolean {
  return navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches
}

/** On every launch from the Home Screen, ask the phone to keep Cadence's storage (ADR 0002) */
export function askToPersist(): void {
  if (isStandalone()) void navigator.storage?.persist?.()
}
