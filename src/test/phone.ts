// Fakes what jsdom can't know about the phone: how Cadence was opened
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
