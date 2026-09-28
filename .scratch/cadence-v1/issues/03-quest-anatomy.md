# What a Quest is made of

Type: grilling
Status: resolved
Blocked by:

## Question

What is a Quest made of, and what should writing one ask of the owner?

- The scaffold's parts: main quest (X), why it matters (Y), success metrics, why it's exciting (Z), commitments. Keep, rename, merge or add? Which are required?
- Success metrics are "observable results by quarter end". Are they plain text to re-read, or something the app tracks (checked off, counted)? The same question for commitments ("gym 3× a week").
- The owner sees Cadence as a vision statement to stay on track, more than a check-in. What distilled form of a Quest is worth re-reading every morning: one line, or the full scaffold?
- Any limit on the number of metrics or commitments (the scaffold shows 3–4)?
- What does "done" mean for a Quest at quarter end: a verdict or score, or nothing in v1?

Context: [scaffold.md](../../../scaffold.md), spec §2 in `docs/superpowers/specs/`, [audit.md](../audit.md) bug 3.

## Answer

Terms are in [CONTEXT.md](../../../CONTEXT.md) under **Parts of a Quest**.

**A Quest** is one of exactly two per Quarter, **Life** and **Work**, both required, names fixed. It is written by completing the **Scaffold**, fixed first-person sentence openings, and reads back as a short vision statement. Six parts, in this order (`{Domain}` is Life or Work; `{end}` is the Quarter's last day, e.g. 31 December 2026):

1. **Main Quest**: "My {Domain} Main Quest is to …"
2. **Why it matters**: "This is the single most important thing for me to accomplish this quarter because completing it would …"
3. **Success Metrics**: "By {end}, I'll have:" then 1–5 numbered results.
4. **Why it's exciting**: "This feels really exciting and compelling for me because …"
5. **Obstacle** (optional): "What's most likely to get in my way is …". The hint nudges toward "…, and when it does, I'll …".
6. **Commitments**: "To make sure I complete the Quest, I'm going to:" then 1–5 numbered actions or habits. The hint shows one habit with a *when* ("every Monday 9–11am, deep work") and one action with a *by when*.

Why these parts: the scaffold was sound: one specific aim, two separate whys (the reason and the pull), outcomes plus inputs. Two gaps were fixed. The **Obstacle** makes the daily re-read contrast the vision with reality (mental contrasting / WOOP), instead of rehearsing an all-positive picture. Commitments are nudged toward a *when* (implementation intentions). The metrics opening dropped "I commit that … I'll have done", which blurred results with actions and collided with "Commitments".

**Rules:**

- **Required:** every part except the Obstacle. Each list needs at least one item. A draft may be incomplete; a finished Quest may not.
- **Obstacle:** the only optional part. The writing flow still asks for it, and skipping it is a deliberate tap. It can be added later by editing, since obstacles often appear mid-quarter. If empty, it is left out of the read-back.
- **Lists:** 1–5 items each, hard cap at 5. Ordered by the owner and numbered when read back.
- **Text:** every part and list item is a single line of prose, with no line breaks and no length cap.
- **Tracking:** nothing is tracked in v1. Success Metrics and Commitments are text to re-read. Progress lives in reflections. A done one-off Commitment is edited out (a new version; the history keeps it).
- **Quarter end:** no verdict or score in v1. A verdict belongs to the post-v1 rollover flow. A past Quarter's Quests stay intact.
- **Morning re-read:** the whole Quest, with the Main Quest as headline. Layout belongs to [Prototype: the Today screen & app shell](08-prototype-morning-screen.md), and whether reading or writing leads belongs to [The morning ritual](05-morning-ritual.md).

**Prompts to find it:** these come from the owner's fuller scaffold. They are shown while writing the Main Quest, as thinking aids only; answers are not saved. `{end}` replaces "New Year's Eve".

- *Work:*
  - What's the one thing that, if accomplished, would move the needle the most?
  - Fast-forward to {end}: what one accomplishment would make you proudest?
  - What's the one thing that would make everything else easier or unnecessary?
  - What have you been postponing that you know would be transformative?
- *Life:*
  - What's the one thing that would bring the most joy, fulfilment, or peace to your personal life?
  - Fast-forward to {end}: what one accomplishment would make you feel proudest?
  - What's the one change that would positively impact every other area of your life?
  - What have you been avoiding that would transform your relationships or happiness?

**Feeds forward:**

- [What a Quest version is](06-quest-versions.md): a version is of the whole Quest. Changing the Main Quest is a candidate definition of a pivot, and changing any other part a refinement.
- [Data layer & storage schema](09-data-layer.md): Quest content is six single-line strings, two of them ordered lists of 1–5, and the Obstacle is optional. `scaffold.md` and the current `QuestContent` (`importance`/`excitement`, excitement last, no obstacle) are superseded.

## Comments

**Grilling round 1 (2026-09-27):**

- Parts and names: parked by the owner, to revisit after the other questions.
- Written as scaffold sentence stems (first-person prose), not labelled fields. Stems fixed in v1; the metrics date comes from the Quarter's end.
- Nothing tracked in v1: metrics and commitments are text to re-read. A quarter-end verdict belongs to the post-v1 rollover.
- The morning re-read shows the whole Quest, with the Main Quest as headline.
- Exactly one Life and one Work Quest per Quarter, both required, fixed names.

**Grilling round 2 (2026-09-27):**

- All parts required for a finished Quest; each list has at least one item. Drafts may be incomplete.
- Success Metrics and Commitments: 1–5 each, hard cap at 5, ordered by the owner, numbered when read back.
- Every part is a single line of prose, no line breaks, no length cap.
- Owner asked whether the scaffold is a good one; Q1 (parts and names) reopened with that review.

**Grilling round 3 (2026-09-27), the reopened parts-and-names question:**

- Scaffold review: sound (one specific aim, two separate whys, outcomes plus inputs), but no obstacle and Commitments lack a "when".
- Add an **Obstacle** part between Why it's exciting and Commitments. Owner leans optional; pending confirmation.
- Commitments: the example hint names a time; nothing enforced. Owner: Commitments cover one-off actions as well as habits.
- Success Metrics opening becomes "By 31 December 2026, I'll have:".
- Names kept: Main Quest, Why it matters, Success Metrics, Why it's exciting, Obstacle, Commitments. Recorded in `CONTEXT.md`.
- Owner shared a fuller version of the scaffold: the same openings, plus four "prompts to find it" per domain for the Main Quest, and metrics framed as "objective, verifiable criteria".

**Grilling round 4 (2026-09-27):**

- Obstacle is the only optional part. The writing flow still asks for it; skipping is a deliberate tap; it can be added later by editing.
- The four "prompts to find it" per domain are shown while writing the Main Quest, as thinking aids only; answers are not saved.
- A done one-off Commitment is edited out (a new version; the history keeps it). No ticking.

**Superseded (2026-09-28):** the Obstacle hint's "…, and when it does, I'll …" nudge was dropped as too cheesy. The hint is now a question, and Work comes before Life. See [Prototype: writing a Quest](07-prototype-writing-a-quest.md).

**Superseded (2026-09-28):** Today no longer shows both whole Quests. It shows one Quest per page: the Main Quest under its Scaffold opening, with the other parts folded under "Read the whole Quest". See [Prototype: the Today screen & app shell](08-prototype-morning-screen.md).
