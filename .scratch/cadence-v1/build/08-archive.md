# Archive

Type: build (AFK)
Status: open
Blocked by: 07

## Goal

The owner can read every Reflection they've written, newest Day first.

## Spec

[spec.md](../spec.md) §11 (Archive), §6.3 (the Archive row with its count).

## Scope

1. **The Archive screen:** grouped by Day, newest first, across all Quarters. Each Day has its header and stored Prompt, then Work's Reflection and Life's. There's an empty state.
2. **The menu:** the Archive row with the number of Reflections.

**Tests:**
- grouping and order across two Quarters;
- the stored Prompt is shown, not today's;
- the year shows only when it isn't the current year;
- the empty state.

## Done when

- [ ] The tests above pass, along with `tsc`.
- [ ] Deployed.
- [ ] `CHANGELOG.md`: "Added: the Archive of Reflections".

## Build notes

- **Date words (`quarters.ts`):** `archiveDay(date, today)` gives a Day's header, "Thu 12 Nov · Day 43", or "Thu 31 Dec 2026 · Day 92" when the Day isn't in today's year. The Day is counted in the Quarter the date falls in.
- **Reading the Reflections (`quarters.ts`):** `reflectionDays(snapshot)` lists every Day with a Reflection, across all Quarters, newest first; `reflectionCount(snapshot)` counts the Reflections on them. Both sit beside `reflectionOn`, and read memory only.
- **The Archive:** a pushed screen from the menu, "‹ Today" and "Archive". Each Day is a section under its header, then its stored Prompt small and faint, then Work's Reflection and Life's, each under its label, with line breaks kept. Hairlines between Days, as the Today prototype's feed has. It shows only what's written: no gaps for missed Days, nothing to tap. With no Reflections it reads "No Reflections yet."
- **The Day's Prompt:** both Reflections on a Day hold a copy of the same Prompt, so the Day shows Work's copy, or Life's when there's only Life's. The copy is shown, not `promptFor(date)`, so a Day keeps the words it was written under after the Prompts change (§7.1).
- **The menu:** an Archive row between the Quest rows and Backup, with "4 Reflections", "1 Reflection", or "None yet" in faint. The prototype's "Empty" became "None yet", to match "No Reflections yet." It shows in every state, the ended one and newer data too, since reading changes nothing.
- **Gold:** none in the Archive. Its Reflections are past, and gold marks only what's alive today.
- **Browser check:** headless Chrome at 390 px, light and dark, seeded with Reflections in Q4 2025, Q3 2026 and Q4 2026 on 1 Oct 2026: the menu with "5 Reflections", and the Archive with the 2025 Day carrying its year and a Reflection with a line break.
