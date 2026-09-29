// Fakes what jsdom can't know about the phone: how Cadence was opened, and storage that fails as iOS's can

import { createStore, type UseStore } from 'idb-keyval'

export function pretendOpened(from: 'home screen (iOS)' | 'home screen (display-mode)' | 'safari tab') {
  Object.defineProperty(navigator, 'standalone', {
    value: from === 'home screen (iOS)' ? true : from === 'safari tab' ? false : undefined,
    configurable: true,
  })
  window.matchMedia = (query: string) =>
    ({
      matches: query === '(display-mode: standalone)' && from === 'home screen (display-mode)',
      media: query,
      onchange: null,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      dispatchEvent: () => false,
    }) as MediaQueryList
}

/** Connections to the phone's storage whose next writes can be made to fail, as iOS's IndexedDB can */
export function flakyPhone() {
  const failures: string[] = []
  const connect = (): UseStore => {
    const kv = createStore('cadence', 'kv')
    return (mode, callback) => {
      const failure = mode === 'readwrite' ? failures.shift() : undefined
      return failure ? Promise.reject(new DOMException('The write failed', failure)) : kv(mode, callback)
    }
  }
  return { connect, failNextWrites: (...names: string[]) => failures.push(...names) }
}

/** A moment after the last keystroke or tap: long enough for queued saves to land */
export const aMomentLater = () => new Promise((resolve) => setTimeout(resolve, 50))

/** Whether iOS has marked Cadence's storage persistent, as navigator.storage.persisted() reads it */
export function pretendStorage(persisted: boolean) {
  Object.defineProperty(navigator, 'storage', {
    value: { persisted: async () => persisted, persist: async () => persisted },
    configurable: true,
  })
}

/**
 * The iOS share sheet, which the owner finishes with Save to Files, or cancels. Returns the files it was handed,
 * as the share sheet shows them.
 */
export function pretendShareSheet(outcome: 'saved to Files' | 'cancelled') {
  const shared: File[] = []
  Object.defineProperty(navigator, 'canShare', {
    value: (data?: ShareData) => (data?.files?.length ?? 0) > 0,
    configurable: true,
  })
  Object.defineProperty(navigator, 'share', {
    value: async (data: ShareData) => {
      shared.push(...(data.files ?? []))
      if (outcome === 'cancelled') throw new DOMException('Share canceled', 'AbortError')
    },
    configurable: true,
  })
  return shared
}

/**
 * A browser whose share sheet can't take files, so Cadence downloads instead. Returns the names of the files
 * downloaded. Call `restore()` afterwards.
 */
export function pretendNoShareSheet() {
  for (const name of ['canShare', 'share']) Object.defineProperty(navigator, name, { value: undefined, configurable: true })
  const downloaded: string[] = []
  const { click } = HTMLAnchorElement.prototype
  const { createObjectURL, revokeObjectURL } = URL
  // jsdom's File can't become a URL here, and a link it follows goes nowhere
  URL.createObjectURL = (blob) => `blob:cadence/${(blob as File).name}`
  URL.revokeObjectURL = () => {}
  HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
    if (this.download && this.href.startsWith('blob:')) downloaded.push(this.download)
  }
  const restore = () => {
    HTMLAnchorElement.prototype.click = click
    Object.assign(URL, { createObjectURL, revokeObjectURL })
  }
  return { downloaded, restore }
}
