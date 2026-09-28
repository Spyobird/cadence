// The app-wide "something is being written" flag: an update reload waits while it's on (spec §2.3).
// Setup, Edit and the Reflection popup turn it on in later slices; nothing does yet.
let writing = false

export function isWriting(): boolean {
  return writing
}

export function setWriting(on: boolean): void {
  writing = on
}
