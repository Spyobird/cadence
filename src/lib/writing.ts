// The app-wide "something is being written" flag: an update reload waits while it's on (spec §2.3).
// Setup and the Reflection popup turn it on; Edit will in slice 7.
let writing = false

export function isWriting(): boolean {
  return writing
}

export function setWriting(on: boolean): void {
  writing = on
}
