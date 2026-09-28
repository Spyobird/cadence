# Prototype: writing a Quest

Type: prototype
Status: open
Blocked by: 03, 04

## Question

How should writing and editing a Quest feel on an iPhone?

- One scaffold sentence per screen ("My Life Main Quest is to …"), a single long form, or something else?
- Adding list items without fighting the keyboard ([audit.md](../audit.md) bug 3): what the Return key does, reordering, removing.
- The Life → Work sequence: progress, going back, and a draft surviving an app switch.
- Is the same surface reused for editing from the Quests screen, or is editing different?

Context: [What a Quest is made of](03-quest-anatomy.md) fixes the content:
- the six Scaffold openings and hints;
- the "prompts to find it" beside the Main Quest, as thinking aids;
- the optional Obstacle, where skipping is a deliberate tap;
- 1–5 ordered list items;
- single-line parts, so Return never inserts a line break.

[Quarter boundaries](04-quarter-boundaries.md) fixes the frame:
- the top of setup names the target Quarter ("Q4 2026 · 1 Oct – 31 Dec") with a one-tap switch between the current and upcoming Quarter;
- setup isn't done until both Quests are finished, and reopening the app resumes it;
- the same flow serves "Set up Q1 2027" later, starting from a blank Scaffold.

[What a Quest version is](06-quest-versions.md) fixes saving an edit:
- Save is only possible on a complete Quest; an edit can't turn it back into a draft;
- an edit-in-progress is a draft, apart from the saved Version that Today shows, until Save or discard;
- saving again the same Day replaces that Day's Version, so there's no "new version vs fix" choice to offer.

Deliverable: a rough clickable prototype the owner can open on their iPhone (LAN or tunnel), linked from this ticket.
