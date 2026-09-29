# Today for reading

Type: build (AFK, then the owner's phone check)
Status: done
Blocked by: 03

## Goal

Cadence opens on Today: the ring, then one page per Quest with the Main Quest large and the rest folded, plus the menu. From here the owner re-reads their Quests every day. **Real use starts after this slice.**

## Spec

[spec.md](../spec.md) §6.1–6.3 (Today, the menu), §6.4 (only "Before Day 1" and the Safari banner; the rest is slice 9), §2.8 (Appearance), §3 (Today rolls over at midnight). Reference: [Today prototype](../prototypes/today-screen.html) `?variant=3`. Look: [DESIGN.md](../../../DESIGN.md).

## Scope

1. **The ring:** ticks, month ticks, today in gold, "43 / of 92". Before Day 1, it's empty and counts the days to go.
2. **The date line:** "Thursday 12 Nov", or "Starts Thursday 1 Oct" before Day 1.
3. **The two pages:** Work and Life, swipe or tap, with the gold dot. The Main Quest is in Plus Jakarta Sans 800, bundled and precached.
4. **Folding:** "Read the whole Quest" / "Fold it away", with part names, numbered lists, an empty Obstacle left out, and a capital first letter for display.
5. **The menu sheet:** the Quarter summary, Work and Life rows (their Edit and History buttons arrive in slice 7), and Appearance, if slice 1's check kept it. `store.setAppearance` is added here, with the pre-paint mirror (§2.8).
6. **Remove the placeholder's temporary pieces** from slice 1.
7. **Midnight:** Today re-reads the date when the page becomes visible and at midnight.

**Tests:**
- the running and before-Day-1 states render the right Day and lines for a given clock;
- the fold opens and closes;
- the page order is Work then Life;
- Appearance persists across a reload.

## Done when

- [x] The tests above pass, along with `tsc`.
- [x] Deployed. The owner runs the real-use phone check (§15.2, after slice 4) and records it here.
- [x] `CHANGELOG.md`: "Added: Today, with the day ring and both Quests"; "Added: the menu, and Appearance (System, Light, Dark)".

## Build notes

- **Routing:** the app shell sends running, before Day 1 and ended to Today, and the placeholder, its Appearance switch, its inset readout and its 40 scroll rows are gone. For ended, this slice only keeps the screen whole: the ring is full, and the date line is today's, as §6.1 has it. The ring's middle ("92" over "ended") and the menu's "Ended Thursday 31 Dec" come from the prototype, since the spec gives no words for them; slice 9 checks them with the rest of §6.4.
- **What Today says:** `standingIn` (quarters.ts) tells where today stands in the Quarter on screen: before Day 1, on a Day, or past its last. `wordsFor` in Today.tsx turns that into the ring, the date line, the menu's summary and the before-Day-1 line, in one place.
- **The ring:** the prototype's geometry (164 px; longer ticks at each month's start and today). Screen readers hear "Day 43 of 92" or "2 days to go".
- **The pages:** a scroll-snap pager, so a swipe is the phone's own. A tapped tab scrolls smoothly (instantly with reduced motion), and a finger on the pages takes over from it. The tabs stick to the top on solid `--void`, by DESIGN.md's rule for sticky headers, not the prototype's glass. The Main Quest gets no added full stop (the prototype added one): the words show as written, as in setup's read-back.
- **Folding:** the fold's rows grow from nothing (0.3 s). A folded part is also hidden, not only clipped, so nothing folded is read out or reached by Tab.
- **Before Day 1:** each page ends with "Reflections start on Day 1, Thursday 1 Oct.", from §6.4's Before Day 1. The running Reflection area is slice 6's.
- **The menu:** a sheet that rises over a scrim; a tap on the scrim or Escape closes it, and focus goes back to the menu button. The page behind doesn't scroll. The Work and Life rows are plain until slice 7 brings Edit and History. **The build stamp** sits at the foot of the menu until slice 5 moves it to the Backup screen: §2.6 names only the placeholder and Backup, and without it there'd be no way to see which build is running.
- **Appearance:** `store.setAppearance` writes `meta`, and the app shell applies `meta.appearance` once the write lands. Each time, it also keeps a copy in `localStorage` (`cadence:appearance`), which an inline script in `index.html` applies before first paint; the first-paint background follows it too. A failed save shows the blocking message, and newer data refuses quietly, as the banner already says why. `failureOf` (FailedSave.tsx) now words a refusal for setup and Today alike.
- **Midnight:** `useCadence()` reads the date through a watch that fires at each local midnight and whenever the page is shown again, so a Home Screen app left in the background still moves on. `msToMidnight` (quarters.ts) counts on the calendar, so a daylight-saving night is 23 or 25 hours. The store now also gives its clock's `now()`.
- **The font:** `@fontsource/plus-jakarta-sans`, latin 800 only. Its woff2 is precached; the package's woff fallback is built but not precached, and iOS reads the woff2.
- **One easing:** `--default-transition-timing-function` is DESIGN.md's `cubic-bezier(.2, .8, .2, 1)`, so every transition uses it.
- **Tests:** jsdom has no `scrollTo`, so `src/test/setup.ts` fills it in; a swipe can't be tested in jsdom and waits for the phone. The midnight test fakes `setTimeout` and `Date` only, since `fake-indexeddb` runs on `setImmediate`.
- **Browser check:** headless Chrome at 390 px, light and dark: Day 43, the Work page unfolded, the menu, before Day 1, and the Life page by its tab.
- **Review (standards and spec):** fixed: the day's words come from one place, with the date maths in quarters.ts; `currentVersion` and `shownParts` are shared (the read-back uses `shownParts` too); the sheet's shadow is a token, `--shadow`, added to DESIGN.md; the easing is one token, `--ease`; the ended date line is today's; a test for the Safari banner on Today; ticket 05 now moves the build stamp out of the menu. Not changed: the Today commit (scope items 1–6 in one) stays as it is; `index.html` keeps its own copy of the mirror's key and the two `--void` colours, since it runs before any module loads, and a test runs it against the app.

## Phone check

Checked by the owner on 29 Sep 2026, at `07c7f5b` (live at the address), against the steps given at merge: the ring before Day 1, swiping and folding the pages, the Main Quest's face offline, and Appearance across a relaunch. The owner reported "it works nice", with nothing to change. Setup's part of the real-use check was done with ticket 03. The iOS version wasn't noted.
