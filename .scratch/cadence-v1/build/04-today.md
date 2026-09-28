# Today for reading

Type: build (AFK, then the owner's phone check)
Status: open
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

- [ ] The tests above pass, along with `tsc`.
- [ ] Deployed. The owner runs the real-use phone check (§15.2, after slice 4) and records it here.
- [ ] `CHANGELOG.md`: "Added: Today, with the day ring and both Quests"; "Added: the menu, and Appearance (System, Light, Dark)".
