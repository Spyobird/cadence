# A Quest keeps at most one Version per Day

A Quest's History keeps at most one Version per Day: saving again on the same Day replaces that Day's Version, every save before Day 1 replaces Version 1, and a Day whose saves end up identical to the Version before leaves no Version. This keeps the History a readable record of how the Quest changed across the Quarter, rather than a log of every typo fix. It deliberately replaces the earlier rule that "every edit creates a new version". The intermediate saves within a Day are gone for good, which is why this is hard to reverse.

## Considered options

- **A Version per save:** complete, but the History fills with near-identical rows. The first build's nested copies also grew the data exponentially (audit bug 2).
- **Explicit milestones (a pivot flag or a note):** rejected as ceremony. A changed Main Quest shows a pivot by itself, and a reason belongs in that Day's Reflection.

Sources: [What a Quest version is](../../.scratch/cadence-v1/issues/06-quest-versions.md).
