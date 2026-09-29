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
