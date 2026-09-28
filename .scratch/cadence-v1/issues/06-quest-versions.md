# What a Quest version is

Type: grilling
Status: resolved
Assignee: Spyobird
Blocked by: 03

## Question

What counts as a new version of a Quest, and what is the history for?

- Does every save create a version, or only material changes? Can a typo fix amend in place?
- Can a Quest be replaced outright mid-quarter (a pivot), or only refined? Does a pivot look different in the history?
- Should a version carry a short "why I changed this" note?
- Should each reflection record the version it was written against?
- What must the v1 history list show? (Comparing versions is out of scope.)
- Edits made after setup but before Day 1 (e.g. Q4 set up on 27 Sep): do they create versions, or amend the first version in place? And when is the first version created: at finish, or with each draft save?

Context: `CLAUDE.md` "Quests are never overwritten"; [audit.md](../audit.md) bug 2 (exponential history); [What a Quest is made of](03-quest-anatomy.md). A version is of the whole six-part Quest. Editing out a done Commitment and adding an Obstacle mid-quarter both make versions. A pivot might mean "the Main Quest changed". [Quarter boundaries](04-quarter-boundaries.md): a Past Quarter is read-only, so no version can be added to it. A Quarter counts as set up only once both Quests are finished.

## Answer

Terms are in [CONTEXT.md](../../../CONTEXT.md): **Version**, **History**. The owner's steer, as before: keep it simple.

**What the History is for:** a read-only record of how each Quest changed across its Quarter, something to look back on. There's no restore; old wording can be copied by hand.

**When a Version is made:**

- **Version 1** is made when a Quest is first finished. Draft saves during setup are never Versions.
- **One per Day:** a Quest has at most one Version per Day. Saving again that Day replaces the Day's Version, as Reflections work. A typo fixed straight after saving doesn't grow the History; one spotted the next Day makes a new Version.
- **Before Day 1:** every save replaces Version 1, so the History starts with the Quest as it stood when the Quarter began. This covers a Quarter set up ahead (Q4 set up on 27 Sep, or Q1 2027 from 18 Dec). A Quest finished mid-quarter gets Version 1 on the Day it's finished, and the one-per-Day rule applies from there.
- **Across midnight:** a change belongs to the Day it's saved on. Start at 23:50 and save at 00:05, and it's the new Day's Version.
- **No change, no Version:** Save with nothing changed creates nothing. If a Day's saves end up identical to the Version before, that Day has no Version, so the History never shows two identical rows.
- **Always finished:** Save needs every required part and 1–5 items per list ([What a Quest is made of](03-quest-anatomy.md)). An edit can't turn a finished Quest back into a draft.
- **The last Day:** once the Quarter's last Day ends at local midnight, saving is refused, because a Past Quarter is read-only ([Quarter boundaries](04-quarter-boundaries.md)). An edit still open at that moment can't be saved.

**What's not stored:**

- **No pivot:** replacing a Quest mid-quarter is an ordinary edit. There's no "start over" flow and no pivot flag; the changed Main Quest shows it.
- **No note:** there's no "why I changed this". If the reason matters, it goes in that Day's Reflection.
- **No link from Reflections:** a Reflection doesn't store a Version. If it's ever needed, its date finds the Version as it stood at the end of that Day.

**The History list:** one per Quest, newest first, with the current Version on top. Each row shows the date and Day ("12 Nov · Day 43") and that Version's Main Quest; a Version from before Day 1 reads "Set up 29 Sep · before Day 1". Tapping a row opens the whole Version read-only, laid out as the Quest reads back. There are no version numbers and no comparing (post-v1).

**Editing:** Today and the History show only saved Versions. An unsaved edit is a private draft until Save or discard.

**Feeds forward:**

- [Prototype: writing a Quest](07-prototype-writing-a-quest.md): Save is only possible on a complete Quest. An edit-in-progress is a draft, separate from the Version on Today; whether it survives an app switch, and how discard works, is the prototype's to decide.
- [Prototype: the Today screen & app shell](08-prototype-morning-screen.md): where each Quest's History is reached, and the row and read-only Version views above.
- [Data layer & storage schema](09-data-layer.md): Versions per Quest per Quarter, each tagged with its Day or "before Day 1". A save appends a Version or replaces today's, and drops it if identical to the one before. Nothing else ever changes or removes a Version. No note, no pivot flag, no Version on Reflections. An edit draft is stored apart from the Versions. A save to a Past Quarter is refused. This supersedes the nested `history` in `useQuests` ([audit.md](../audit.md) bug 2).
- [v1 spec & build order](10-v1-spec-and-build-order.md): `CLAUDE.md`'s "every edit creates a new version" and spec §3.3/"Versioning Logic" are superseded by one Version per Quest per Day.

## Comments

**Grilling round 1 (2026-09-28):**

- The history is a read-only record of how each Quest changed across the Quarter. There's no restore; old wording can be copied by hand.
- Version 1 is made when a Quest is first finished. Draft saves during setup are never versions.
- A pivot is an ordinary edit. There's no "start over" flow and no stored pivot flag; the changed Main Quest shows it in the history.
- No "why I changed this" note. If the reason matters, it goes in that Day's Reflection.
- A Reflection doesn't store a Quest version. If it's ever needed, the date finds it.

**Grilling round 2 (2026-09-28):**

- At most one Version per Quest per Day. Saving again that Day replaces the Day's Version, as with Reflections.
- Edits before Day 1 replace Version 1, so the History starts with the Quest as it stood when the Quarter began.
- The History list: one per Quest, newest first, current on top. Each row shows date, Day and that Version's Main Quest. Tapping opens the whole Version read-only, as it read back. No version numbers.
- Glossary: **Version** and **History** added to `CONTEXT.md`; avoid "Evolution Lab", "revision", "pivot".
- Today and the History show only saved Versions. An unsaved edit is a private draft until Save or discard.
