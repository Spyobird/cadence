# Quarter's end

Type: build (AFK)
Status: open
Blocked by: 08

## Goal

Cadence handles the end of a Quarter: offering setup of the next one in the last 14 days, handing over on 1 Jan, and the ended state when nothing new is set up. Needed by 18 Dec 2026.

## Spec

[spec.md](../spec.md) §3.1 (every `screenFor` state), §3.2 (Setup target), §5.4 (setup started from Today), §6.4 (Boundary states), §7.1 and §8 (saves refused at the last midnight).

## Scope

1. **Last 14 days:** "Q1 2027 starts in 12 days. Set it up", "Finish setting it up", and "Q1 2027 is set up. It takes over on 1 Jan." Setup opened from Today has Close.
2. **Handover:** on 1 Jan, a set-up Q1 2027 takes over. A Q1 Draft resumes.
3. **Ended:** the full ring, the line, "Set up Q1 2027", "Export a backup first", Edit hidden, History readable, and the Reflection area's line. Backup is due.
4. **Midnight refusals:** an open popup or edit at the Quarter's last midnight can't save. The message shows and the text stays.
5. **Dev-only date override** (`?today=2026-12-20`), stripped from production builds, so slice 10 can walk every state on the phone through a dev tunnel.

**Tests:**
- each boundary state for a given clock;
- a skipped Quarter;
- a Draft frozen at the Quarter's end is never resumed;
- the override is absent from a production build.

## Done when

- [ ] The tests above pass, along with `tsc`.
- [ ] Deployed.
- [ ] `CHANGELOG.md`: "Added: setting up the next Quarter, and the end of a Quarter".
