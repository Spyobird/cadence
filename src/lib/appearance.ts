export type Appearance = 'system' | 'light' | 'dark'

/** Each look's --void (DESIGN.md): the page background, and the status-bar strip that matches it */
export const VOID = { light: '#F4F5F7', dark: '#0F1113' } as const

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
}
