export type Appearance = 'system' | 'light' | 'dark'

/** Each look's --void (DESIGN.md): the page background, and the status-bar strip that matches it */
export const VOID = { light: '#F4F5F7', dark: '#0F1113' } as const

/**
 * A copy of meta.appearance in localStorage, which index.html's inline script reads to set the look before first
 * paint (spec §2.8). meta stays the source: the app writes this copy each time it applies the look.
 */
const MIRROR = 'cadence:appearance'

/** Sets the look on <html>, and the head's color-scheme and theme-color to match (spec §2.8) */
export function applyAppearance(appearance: Appearance): void {
  document.documentElement.dataset.look = appearance
  document
    .querySelector('meta[name="color-scheme"]')
    ?.setAttribute('content', appearance === 'system' ? 'light dark' : appearance)
  for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
    const phoneLook = meta.getAttribute('media')?.includes('dark') ? 'dark' : 'light'
    meta.content = VOID[appearance === 'system' ? phoneLook : appearance]
  }
  try {
    localStorage.setItem(MIRROR, appearance)
  } catch {
    // Storage blocked: the next launch paints in the phone's look until the app applies this one
  }
}
