# Reflections

Type: build (AFK, then the owner's phone check)
Status: open
Blocked by: 05

## Goal

Under each Quest, the owner can write one optional Reflection per Day, guided by the day's Prompt. It's editable until midnight.

## Spec

[spec.md](../spec.md) §7 (Reflections and Prompts), §6.4 ("Reflections start on Day 1…"), §13 (store).

## Scope

1. **Store:** `saveReflection` and `removeReflection`, for today's date within a set-up Quarter only. They copy the Prompt, carry the date they're saved on, and refuse after the Quarter's last midnight.
2. **On the page:** the "Write today's Reflection" pill, the saved text beside a rule, and "Edit today's Reflection" (§7.3). Before Day 1, "Reflections start on Day 1, Thursday 1 Oct."
3. **The popup** (§7.4): the Prompt, the field, Save / Remove, Cancel with a discard question, and "You can change it until midnight."
4. **Update reload:** the popup sets the "something is being written" flag.

**Tests:**
- one per Quest per Day;
- re-saving replaces it;
- emptying it removes it;
- yesterday's is read-only;
- a save at 00:01 goes to the new Day with the new Prompt;
- a save refused after the Quarter ends keeps the text;
- no Reflection before Day 1.

## Done when

- [x] The tests above pass, along with `tsc`.
- [ ] Deployed. The owner runs the data-safe phone check (§15.2, after slice 6) and records it here.
- [x] `CHANGELOG.md`: "Added: a Reflection per Quest per Day".

## Build notes

- **Store:** `saveReflection(quarter, quest, text)` and `removeReflection(quarter, quest)` write today's date, by the store's clock, with a copy of `promptFor(today)`. The Quarter is passed in so a save at the last midnight can be refused by name: "Q4 2026 ended at midnight, so this can't be saved." Before Day 1 it's refused with "Reflections start on Day 1, Thursday 1 Oct.", and in a Quarter that isn't set up with "Reflections start once Q4 2026 is set up." Neither is offered by the UI.
- **Tidy and empty:** `tidyReflection` trims the ends only, keeping line breaks (§4.3). Saving text that tidies to nothing removes the Reflection, so an empty one is never stored; `removeReflection` is that save. A Day with no Reflection left is dropped from `reflections`, so the Archive (slice 8) never meets an empty Day.
- **Yesterday's:** read-only by construction: the store only ever writes today's date. After midnight, Today shows the pill again; yesterday's waits for the Archive.
- **On the page:** `TodaysReflection` at the foot of each Quest's page, while today is a Day of the Quarter on screen (`canReflect` in Today's day words). Before Day 1 the note stays; in the ended state there's nothing until slice 9 adds its line. With data from a newer Cadence the saved text shows, with no pill and no Edit.
- **The popup** (`ReflectionPopup`): the tap holds the keyboard (`holdKeyboard`) and the field takes it on mount, as setup does. It fills the visible area (`.writing-screen`, `useVisibleArea`) over a blurred scrim, and scales in. The placeholder is the prototype's "A line or two". "You can change it until midnight." sits under the field of a saved one. Save waits for a change from what was saved when it opened, compared tidied, and is off while a save is on its way.
- **Cancel:** a tap outside the box and Escape are Cancel too. With changes, the button row turns into "Discard what you wrote?" with Keep writing and Discard, both secondary: gold marks what to tap next, and a discard can't be undone. Cancel and Keep writing keep the field's focus, so the keyboard stays up.
- **Midnight:** the header and Prompt follow the date live, since a save carries the date it's made on. The popup keeps the Quarter it opened in, so a Q4 popup still open when a set-up Q1 takes over Today on 1 Jan is refused, not saved into Q1. A refused or failed save shows the blocking message, and the words stay in the field.
- **Update reload:** the popup turns `setWriting` on while it's open.
- **Browser check:** headless Chrome at 390 px, light and dark, with a set-up Q3 seeded (30 Sep is Day 92): the pill, the popup empty and written, the discard question, the saved Reflection with its rule, and Remove.

