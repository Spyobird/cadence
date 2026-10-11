# Restore during setup

Type: build (AFK)
Status: open
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

- [ ] After typing, the link is still there, on later parts too.
- [ ] Close on the Backup screen brings back every word typed, even on a slow phone.
- [ ] Setup opened from Today, with Close, has no link.
- [ ] `npx tsc --noEmit`, `npm test -- --run` and `npm run build` pass.

## Phone check

With ticket 10's full check: on a fresh install, type a few words in setup, tap "Restore from a backup", then Close and check the words are back. Then import a backup from there.
