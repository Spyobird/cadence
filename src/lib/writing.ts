// The app-wide "something is being written" flag: an update reload waits while it's on (spec §2.3).
// Setup, the Reflection popup and Edit turn it on.
let writing = false

export function isWriting(): boolean {
  return writing
}

export function setWriting(on: boolean): void {
  writing = on
}
