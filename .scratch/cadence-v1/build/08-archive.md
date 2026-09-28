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
