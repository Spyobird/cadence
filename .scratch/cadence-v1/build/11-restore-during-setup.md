# Restore during setup

Type: build (AFK)
Status: done
Blocked by:

## Goal

Setup always has a way to the Backup screen. Today, "Restore from a backup" goes as soon as one letter is typed, and setup has no menu, so there's no way left to restore until a whole Quarter is set up. Found in ticket 10's full phone check (the owner, 11 Oct 2026).

## Spec

[spec.md](../spec.md) §12.3 ("Restoring during setup").

## Scope

1. **The rule:** "Restore from a backup" shows on every part's screen while setup has no Close, that is, while setup has no menu to reach. Typing no longer hides it. Setup opened from Today has Close, so it doesn't show there.
2. **Leaving for the Backup screen** waits until every word typed has landed in the Draft, as Close does, so closing the Backup screen brings setup back as it was.
3. **Changelog:** the line about the fresh install's link says what it does now.

## Done when

- [x] After typing, the link is still there, on later parts too.
- [x] Close on the Backup screen brings back every word typed, even on a slow phone.
- [x] Setup opened from Today, with Close, has no link.
- [x] `npx tsc --noEmit`, `npm test -- --run` and `npm run build` pass.

## Build notes

- **The rule** is now "setup has no Close" (`Setup.tsx`), in place of "nothing is stored". That also covers setup carried past midnight on 1 Jan, which loses Close: it now shows the link too, where before there was no way to the Backup screen until the Quarter was set up.
- **Leaving** waits for the last save, as Close does (`restore()` beside `close()`).
- **Tests:** `Backup.test.tsx` (the link stays after typing and on part 2; Close brings the words back on a slow phone), `QuartersEnd.test.tsx` (no link with Close; the link appears when Close goes at midnight). Both guards were checked against the old rule and against a link that always shows, and each fails one of them.
- tsc, 420 tests and the build pass.

## Phone check

With ticket 10's full check: on a fresh install, type a few words in setup, tap "Restore from a backup", then Close and check the words are back. Then import a backup from there.

- **11 Oct 2026, the owner, iOS 26.6.2:** passes.
