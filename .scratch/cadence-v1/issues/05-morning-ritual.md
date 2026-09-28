# The morning ritual

Type: grilling
Status: resolved
Blocked by: 03

## Question

What is the morning session for, and what exactly does it record?

- The owner's framing: less a check-in, more re-reading a vision statement to stay on track, and "that might be the stronger goal". Is reading the Quests the primary act and writing a reflection optional? Or the reverse?
- Does the weekly prompt rotation fit a morning session? Several prompts read as end-of-day ("last 24 hours", "the week as a whole"). One prompt for both Quests, or one each?
- Per day: how many reflections, can today's be edited later, and what about missed days (shown as gaps? backfilled?)
- Day boundary for an early-morning session: local date (see [audit.md](../audit.md) bug 4).
- Name the daily act (Check-in? Morning read? Something else?) and record it in `CONTEXT.md`.

Context: [What a Quest is made of](03-quest-anatomy.md) fixed *what* is re-read: the whole Quest, with the Main Quest as headline, and the Obstacle included when present. The open question is whether that reading or the writing leads.

## Answer

Terms are in [CONTEXT.md](../../../CONTEXT.md): **Reflection**, **Prompt**. The owner's steer: "a chill whenever check. Keep it simple, not ritualistic."

**What opening Cadence is for:** re-reading both Quests. Reading is the only thing expected of the owner.

- **Any time of day:** it is not tied to the morning.
- **No name and no record:** opening the app and reading leaves no trace, and nothing counts attendance.
- **The screen:** it is just **Today**. Avoid "check-in".

**Reflection** (optional):

- **What it is:** a free-text note about one Quest, written on a Day. Unlike Quest parts, line breaks are allowed. There is no length cap.
- **How many:** at most one per Quest per Day, so Life, Work, either, both or neither. Saving again replaces it.
- **Its Prompt:** it keeps a copy of the Day's Prompt, so the Archive still shows what guided it after the Prompts change.
- **Editing:** editable until local midnight, then read-only. There is no version history.
- **Missed days:** no backfill; a missed Day can't be written later. The Archive shows no gaps.
- **"Today":** the phone's local date, rolling over at midnight with no early-hours cutoff. This fixes [audit.md](../audit.md) bug 4.
- **When writing is allowed:** as in [Quarter boundaries](04-quarter-boundaries.md), a Reflection is only written on a Day of a set-up Quarter.

**Prompt:** one per weekday, shared by both Quests. It is shown as a thinking aid only, not a question to be answered. All seven work at any time of day:

| Day | Prompt |
|---|---|
| Mon | What is the one thing that must happen this week to feel real progress on this Quest? |
| Tue | What's a small win from the last 24 hours that shows you're on track? |
| Wed | What's the next step that would move this Quest forward? |
| Thu | What's getting in the way right now, and what will you do when it shows up? |
| Fri | Looking at the week so far, are your Commitments actually moving your Success Metrics? |
| Sat | How do you actually feel about your progress right now: energized, drained, or neutral? Why? |
| Sun | Looking at next week, what's one specific change you could make to your Commitments? |

Why these changes:

- **Wednesday:** the old set looked back over the week three times (Wed, Fri, Sun) and never looked at the next step.
- **Thursday:** it now pairs what's in the way with a plan (if-then, as in the Obstacle part). It still works when no Obstacle is written.
- **Friday:** it was asked four days in as though the week were over. It now checks Commitments (inputs) against Success Metrics (outcomes).
- **Glossary terms** are capitalised.

These Prompts supersede `src/constants/prompts.ts` and spec §4.

**Feeds forward:**

- [Prototype: the Today screen & app shell](08-prototype-morning-screen.md): the Quests lead, and the Prompt and Reflections follow, all optional and low-key. There is no "done for today" state beyond a saved Reflection. The screen must not read as a ritual or a check-in.
- [Data layer & storage schema](09-data-layer.md): a Reflection is keyed by local date and Quest. It holds multi-line text plus the Prompt text. It can be written only for today's date within a set-up Quarter; a write to an earlier date is refused.
- [What a Quest version is](06-quest-versions.md): still decides whether a Reflection records the Quest version it was written against.
- [v1 spec & build order](10-v1-spec-and-build-order.md): the "check-in" wording in `CLAUDE.md` and spec §3.2 is superseded.

## Comments

**Grilling round 1 (2026-09-27):**

- Reading leads; writing is optional. A morning where the owner only reads leaves no record.
- Prompts are there to guide thinking, not questions to be answered. There is one prompt of the day, shared by both Quests.
- Keep the weekday rotation. The owner asked for the seven prompts to be reviewed for how helpful they are in a morning.
- "Today" is the phone's local date, rolling over at midnight with no early-hours cutoff. Each Quest has at most one Reflection per Day; saving again replaces it. It stays editable until local midnight, then becomes read-only, with no version history. Owner: "keep it simple".
- Missed days: no backfill, and the Archive marks no gaps. Owner: "prompts are kinda optional, just there to guide reflection if needed".

**Grilling round 2 (2026-09-27):**

- One optional note per Quest per Day (Life and Work, either or both). Line breaks are allowed, and each note keeps a copy of the day's prompt.
- The daily act has no name. Owner: "it doesn't really matter when I read it. It's just a chill whenever check. Keep it simple, not ritualistic." It is not tied to the morning.
- Revised prompts accepted. Owner: reframe Wednesday so it doesn't rely on being done in the morning, as a high-level thought that works any time of day.
