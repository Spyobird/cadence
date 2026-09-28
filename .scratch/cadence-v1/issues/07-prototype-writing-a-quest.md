# Prototype: writing a Quest

Type: prototype
Status: resolved
Assignee: Spyobird
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

## Answer

Prototype (primary source): branch `prototype/writing-a-quest`, file `.scratch/cadence-v1/prototypes/writing-a-quest.html` (commit `07f429c`). Variant **A, "One part at a time"**, won over B (the whole Quest as one page with inline blanks) and C (a list of the six parts, each written in a sheet). The owner tried all three on the iPhone and found the keyboard fine.

**Order: Work first, then Life, everywhere.** That covers setup, Today, the History and the export. It supersedes the Life → Work order in the ticket's question.

**Writing a Quest (setup):**

- **One Scaffold part per screen.** The opening is set large in quiet grey, and the owner's words continue it right below in the Quest's own type. Below that sits the hint. On the Main Quest screen, the "prompts to find it" are hidden behind a "Stuck? Four questions to help find it" link.
- **Top of setup:** the target line ("Q4 2026 · 1 Oct – 31 Dec") with a one-tap "Switch to Q3 2026". Under it, a 12-tick progress bar (6 for Work, then 6 for Life) and "Work Quest, part 2 of 6".
- **The bar above the keyboard:** Back and Next. Next stays disabled until the part is written. On the Obstacle screen, "Skip for now" is the deliberate tap.
- **Return is Next.** The keyboard stays up from screen to screen. Parts that continue a sentence aren't auto-capitalised; list items are.
- **Read it back:** after Commitments comes the whole Quest as it reads back. Tapping any part opens its screen, and Done returns to the read-back. "Finish Work Quest" makes Version 1 and moves on to Life. After Life comes "Q4 2026 is set up".

**Lists (Success Metrics, Commitments):**

- Return on a written item adds the next one. Return on an empty item leaves the list and moves on. Backspace on an empty item removes it.
- The focused item shows **Move up / Move down / Remove**. "Add another" sits under the list. At five it reads "That's five, the most a list holds."
- Pasted lines become separate items, up to five.

**Drafts:**

- **Setup draft:** saved as it's typed. Reopening Cadence resumes on the same Quest and part, with "Picked up where you left off."
- **Edit draft:** it also survives the app closing. Reopening shows "Your unsaved changes from 10:42 are still here."

**Editing later: the same surface as setup.**

- **Edit** opens the read-back with **Cancel** and **Save** at the top. Tapping a part changes it on its own screen, and Done returns to the read-back. Changed parts are marked.
- **Save** is disabled until something has changed and every required part is written, and a note under the title says why ("No changes yet", "Main Quest can't be empty").
- **Cancel** with changes asks "Discard your changes?" (Discard changes / Keep editing).
- The Obstacle can be left empty when editing.

**Obstacle wording** (supersedes the hint in [What a Quest is made of](03-quest-anatomy.md)):

- The opening is unchanged: "What's most likely to get in my way is".
- The placeholder becomes "what could stop you".
- The hint becomes a question: "What's the one thing most likely to stop you, and what will you do about it? Optional." The "…, and when it does, I'll …" formula is dropped as too cheesy.

**Look (a proposal, not yet confirmed):**

- A dark background, with the Scaffold's words in grey system sans and the owner's words in the system serif (`ui-serif`, New York on iPhone, so there is nothing to self-host).
- Gold only for the caret and the primary action.

This feeds the map's visual-system fog.

**Feeds forward:**

- [Prototype: the Today screen & app shell](08-prototype-morning-screen.md): Work is listed first. The A read-back is a starting layout for a whole Quest, and Edit starts from it.
- [Data layer & storage schema](09-data-layer.md): the setup draft stores its position (which Quest and part). The edit draft stores when it started. Both survive the app closing and stay apart from the Versions. Work comes first in any ordered output.
- [v1 spec & build order](10-v1-spec-and-build-order.md): `CONTEXT.md` now lists Work first. The prototype's keyboard handling is a reference for the build: it parks focus on a hidden input so iOS keeps the keyboard up between screens, uses `enterkeyhint="next"`, and keeps the bar above the keyboard with the `visualViewport` API.

## Comments

**Prototype built (2026-09-28):** three variants, each with Setup and Edit modes, served over the LAN to the owner's iPhone.

**Owner's verdict (2026-09-28):**

- A is the favourite. Keyboard "was ok actually".
- Put Work first, before Life, everywhere.
- The Obstacle prompt was "a bit cheesy". Keep the opening and turn the hint into a question.
- Use A for editing too.
