# Quarter boundaries

Type: grilling
Status: resolved
Blocked by:

## Question

Which Quarter does a Quest belong to, and what does the app show around quarter boundaries?

- Setting up on 30 Sep for Q4: does setup near the end of a quarter default to the upcoming one? How close is "near"?
- Starting mid-quarter (e.g. 20 Oct): same Quarter, "Day 20 / 92". Is anything different?
- Day counter: by local date. What shows before the Quarter starts, and after it ends if the owner hasn't set up the next one yet? The rollover flow itself is out of scope.
- What happens to a past Quarter's Quests and reflections: kept read-only? This fixes the rules the data model must follow from day one, even though rollover UI is post-v1.

## Answer

Terms are in [CONTEXT.md](../../../CONTEXT.md): **Current Quarter**, **Upcoming Quarter**, **Past Quarter**, **Day**. The owner's steer: keep it simple.

**Which Quarter a Quest belongs to:** the Quarter chosen at setup, fixed once saved.

- **Default target:** the Current Quarter. When fewer than 14 days of it are left, the default is the Upcoming Quarter instead (so from 18 Dec for Q4).
- **Switch:** the top of setup names the target ("Q4 2026 · 1 Oct – 31 Dec") with a one-tap switch to the other of the two.
- **Set up means finished:** a Quarter counts as set up only once both Quests are finished. Until then, opening the app resumes setup where it was left. The Day counter doesn't wait; it runs on the calendar.

**Counting:** Day N is counted from the Quarter's first day by the phone's current local date, with no stored time zone. The total is the Quarter's real length (Q4 2026 = 92, Q1 2027 = 90), not the "/ 90" in `DESIGN.md`. Starting mid-quarter changes nothing: 20 Oct is "Day 20 / 92", and the ring starts part-filled.

**What the app shows, by state:**

1. **Nothing set up:** setup.
2. **Setup started, not finished:** setup, resumed.
3. **Set up, before Day 1** (Q4 set up on 27 Sep): the Quests, readable and editable, with "Starts in 4 days" and an empty ring. No reflecting until Day 1.
4. **Current Quarter running:** the normal Today screen. From 18 Dec, "Set up Q1 2027" is also offered. If the Upcoming Quarter gets set up early, the screen stays on Q4 until 31 Dec and switches to Q1 2027 on 1 Jan.
5. **Quarter ended, next not set up** (1 Jan with no Q1 2027): the ended Quarter's Quests, read-only, plus "Set up Q1 2027". No reflecting until the new Quarter is set up.

**Setting up the next Quarter in v1** is the same plain setup: a blank Scaffold, with no review, verdict or carry-over. That full rollover flow stays post-v1.

**Past Quarters:**

- Read-only forever from local midnight after their last day. Their Quests and reflections can't be edited, nothing is deleted, and there's no grace window.
- A Quarter that ends with a Quest still a draft is frozen as it stands.
- Not browsable in v1: past Quests are kept in storage and in the export, and old reflections stay in the Archive feed.

**Rule of thumb:** a reflection always falls on a Day of a Quarter that has been set up.

**Feeds forward:**

- [What a Quest version is](06-quest-versions.md): do edits made before Day 1 create versions, or amend in place? No version can be added to a Past Quarter.
- [Prototype: writing a Quest](07-prototype-writing-a-quest.md): the target line and switch at the top of setup; resuming an unfinished setup; the same flow serves "Set up Q1 2027".
- [Prototype: the Today screen & app shell](08-prototype-morning-screen.md): screens for states 3–5 above ("Starts in N days", "Set up Q1 2027" from 18 Dec, the ended state).
- [Data layer & storage schema](09-data-layer.md): a Quarter is keyed by calendar quarter (e.g. `2026-Q4`), and more than one can exist at once (a Past Quarter, the current one, and one set up ahead). Reflections belong to the Quarter containing their date. "Finished" is a stored state. Writes to a Past Quarter are refused.

## Comments

**Grilling round 1 (2026-09-27):**

- Setup target (this Quarter or the next): owner asked for the options to be re-explained. Still open.
- Mid-quarter start counts from the calendar Quarter ("Day 20 / 92" on 20 Oct). Nothing else changes. Dates use the phone's current local date. The total is the Quarter's real length (90–92), not 90.
- A past Quarter is read-only forever: its Quests and reflections can't be edited, and nothing is deleted. No grace window.
- After a Quarter ends with nothing set up, v1 shows the ended state and offers plain setup of the new Quarter (a blank Scaffold, with no review, verdict or carry-over). The full rollover flow stays post-v1.

**Grilling round 2 (2026-09-27):**

- Setup targets the current Quarter by default, or the upcoming one when fewer than 14 days are left. The top of setup names the target ("Q4 2026 · 1 Oct – 31 Dec") with a one-tap switch to the other. Fixed once saved.
- No reflecting between a Quarter's end and setting up the next: the screen shows the ended Quarter's Quests read-only and "Set up Q1 2027".
- Past Quarters' Quests aren't browsable in v1. They're kept in storage and in the export, and old reflections stay in the Archive feed.

**Grilling round 3 (2026-09-27):** owner: "keep it simple".

- Set up, before Day 1: Quests readable and editable, "Starts in N days", empty ring, no reflecting.
- "Set up Q1 2027" is offered from the last 14 days of the Current Quarter. The morning screen stays on the Current Quarter until it ends.
- A Quarter counts as set up only once both Quests are finished. Until then the app resumes setup.
