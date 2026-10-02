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

- [x] The tests above pass, along with `tsc`.
- [ ] Deployed.
- [x] `CHANGELOG.md`: "Added: setting up the next Quarter, and the end of a Quarter".

## Build notes

- **Where Today stands (`quarters.ts`):** `boundaryOf(snapshot, quarter, today)` gives the last 14 days, with the Upcoming Quarter, the days until it starts and its setup (`not-started`, `started` once a setup Draft exists, `set-up`), or the ended state, with `next`, the Current Quarter. The last 14 days are `setupTarget`'s window, 18–31 Dec for Q4. `dayAndMonth` gives "1 Jan", and `versionDay` now uses it.
- **The last 14 days:** one line under the date, `--given` and centred. "Q1 2027 starts in 12 days. Set it up", "1 day" on 31 Dec, with "Set it up" in `--gold-text`; "Finish setting it up" once there's a Draft, a finished Work Quest included; "Q1 2027 is set up. It takes over on 1 Jan." with nothing to tap.
- **Setup from Today:** `App` holds `setupFor`, the Quarter it was opened on. Close shows while `screenFor` says running, which is "while the Current Quarter is set up" (§5.4), so it goes at midnight on 1 Jan and setup carries on into Q1. Close waits for the Draft's last save to land, so reopening it brings every word back and an update reload can't cut a save off. "Go to Today" after finishing comes back to the Current Quarter. Cadence relaunched mid-setup opens on Today, since running wins, and reopening setup says "Picked up where you left off."
- **Close is `--given`,** like the switch it replaces in that row. DESIGN.md keeps gold for a pushed screen's header buttons, and setup isn't one; the prototype's gold Cancel was on a stand-in.
- **The ended state:** the ring full, "92" over "ended", under today's date (kept from slice 4; the prototype put "Ended Thursday 31 Dec" there, which the menu still reads). Then "Q4 2026 is over. Its Quests are kept as they were.", the primary "Set up Q1 2027", and "Export a backup first" to the Backup screen. That link is a quiet underlined one, not the prototype's gold, since the primary is the one gold action on a screen. Each page ends "Reflecting starts again once Q1 2027 is set up." Edit hidden, History readable and backup due came with slices 5 and 7.
- **Setup from the ended state** sets up the Current Quarter, also after a skipped Quarter (§3.1). It has no Close, since the Current Quarter isn't set up (§5.4), and once anything is typed, resume wins over ended.
- **Handover and midnight refusals:** `screenFor` and the routing already handed over; the tests now walk the midnight timer into a set-up Q1, a Q1 Draft, and the ended state. The popup and Edit's Save were already refused at the last midnight (slices 6, 7); a test adds typing on an Edit part's screen, which shows the message and keeps the words and the Draft as it stood.
- **Date override (`dateOverride.ts`):** `?today=2026-12-20` starts the clock on that date at the real time of day, and `?today=2026-12-31T23:58` at that moment, so a midnight can be walked; anything else is ignored. `main.tsx` reads it only under `import.meta.env.DEV`. A test builds the app twice: the dev bundle has `URLSearchParams`, which only the override uses, and the production bundle doesn't. A tunnelled dev server keeps its own storage, apart from the installed app.
- **Browser check:** headless Chrome at 390 px, light and dark, through the override: each last-14-days line, the ended state, and setup from Today. Lone last words on wrap were fixed with balanced lines.
- **Review (standards and spec):** fixed: Close could leave before the last save landed, which made one test fail in 2 of about 14 runs (now a test on a slow phone); Close lost its gold; the last-14-days line is one paragraph; a shared `link` look at its third use; `setupFor` is named for what it holds; the tests find each line by its words, not a test id; a simpler start for the override. Not changed: the ended state's `next` keeps `screenFor`'s name for the same Quarter; `wordsFor` and `boundaryOf` both read the Current Quarter as `quarterOf(today)`, a lookup rather than a rule; `ticks`, `work` and `life` are per test file, as the other screen tests have them; the build test runs in `npm test` (about 2 s), since the ticket asks for it; the test-only commits guard behaviour from slices 2, 6 and 7; the override sits outside `quarters.ts`, being clock plumbing, not Quarter maths.
- **For the owner:**
  - With Q3 the latest set up, on 20 Dec the ended state offers "Set up Q4 2026", 11 days before it ends, as §3.1 says; §3.2 would aim a blank setup at Q1 2027. The switch offers Q1.
  - Setup from the ended state has no Close, so a mistaken tap is undone only by closing Cadence.
  - "Export a backup first" and setup's Close aren't gold (above).
  - DESIGN.md's gold list leaves out "Set it up", which its token table and §6.4 give `--gold-text`.

## Phone check

At slice 10 (§15.2), through a dev tunnel with `?today=`: 18 Dec and 31 Dec; 20 Dec with Q1 not started, started and set up, including Close; 31 Dec at 23:58 across midnight, with the popup and an edit refused and setup from Today carrying on; 2 Jan, ended; and a skipped Quarter.
