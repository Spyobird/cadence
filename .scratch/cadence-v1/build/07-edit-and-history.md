# Edit and History

Type: build (AFK)
Status: done
Blocked by: 06

## Goal

The owner can change a Quest mid-quarter, and see how it changed, one Version per Day.

## Spec

[spec.md](../spec.md) §8 (Edit), §9 (History), §10 (Versions), §6.3 (the menu's Edit and History buttons), §13 (store).

## Scope

1. **Store:** `saveEditDraft`, `discardEdit` and `saveQuest`: append today's Version, replace it, or drop it when it's identical. Before Day 1, a save replaces Version 1. An edit Draft is deleted once it matches the saved Version.
2. **Edit:** the read-back with Cancel / Save, part screens without the progress bar, changed-part markers, the reason Save is disabled, the discard question, and restoring a Draft with "Your unsaved changes from …".
3. **History:** rows ("12 Nov · Day 43", the Main Quest, "Current", "29 Sep · before Day 1"). A tapped row opens the Version read-only, as the read-back.
4. **The menu:** Edit and History on each Quest row, with "Edit · unsaved changes" when a Draft exists.
5. **Update reload:** Edit sets the "something is being written" flag.

**Tests:**
- same-Day saves replace;
- next-Day saves append;
- identical saves are dropped;
- before-Day-1 saves replace Version 1;
- an incomplete Quest can't save;
- a Draft survives a reload and across Days;
- History order and labels.

## Done when

- [x] The tests above pass, along with `tsc`.
- [x] Deployed, at `adf1436` on 1 Oct 2026. Edit with a Draft surviving a kill, and the History rows, are checked on the phone at slice 10 (§15.2).
- [x] `CHANGELOG.md`: "Added: editing a Quest, and its History".

## Build notes

- **Store:** `saveEditDraft(quarter, quest, content)` keeps the words as typed under `edit:2026-Q4:work`, with `startedAt` from the first save of that edit. A save that tidies to the saved Version deletes the Draft instead, so the next edit starts afresh. `discardEdit` deletes it. `saveQuest` tidies, refuses an incomplete Quest (`incomplete`), and writes the Quarter key and deletes the Draft in one transaction. All three refuse a Quest that isn't finished, and a Past Quarter, so a Draft left at the last midnight stays frozen. `snapshot.editDrafts` holds the Drafts by Quarter, then Quest.
- **Versions (§10):** before Day 1, every save replaces Version 1, dated by its last save. From Day 1, a save replaces the Day's Version if there is one, and otherwise adds one. The result is dropped when it matches the Version before it, compared tidied (`changedParts`, which Edit's markers and Save use too). Version 1 made on the same Day is never dropped, since a finished Quest can't turn back into a Draft.
- **Date words (`quarters.ts`):** `versionDay` gives "12 Nov · Day 43" or "29 Sep · before Day 1". `whenStarted` gives "10:42", or "Thu 10:42" on an earlier Day, in 24-hour time with a leading zero.
- **Edit:** a pushed screen from the menu, held on the Quarter it opened in (`Pushed` in `App.tsx`), as the Reflection popup is. The read-back shows every part, an empty one too ("… not written yet.", or "… nothing yet. Tap to add one." for the Obstacle), so an emptied part can be written again. Changed parts have a dim gold rule and the accessible description "Changed". A part opens on `PartScreen` with `editing`: "Editing your Work Quest" in place of the target line and progress bar, and no Back or "Skip for now". Done always returns, so Save's note can say what's missing. Each change saves the Draft. Save waits for the save to land, then Today shows the new Version. Cancel with changes asks in a sheet, with "Discard changes" and "Keep editing" (both not gold: a discard can't be undone). A discard that can't be saved is let go, since the Draft left behind is either frozen or restored by the next Edit.
- **The header note:** "No changes yet", then "Main Quest can't be empty" (or whichever part), then "Add at least one Success Metric" (or Commitment). Once Save is on, the note reads "Unsaved changes", as the writing prototype did. Without it, the empty line pushed the title above Cancel and Save. The owner kept it, and spec §8 now says so.
- **Restoring:** "Your unsaved changes from 10:42 are still here." shows on the read-back until the first change, as "Picked up where you left off." does in setup. Cadence still opens on Today.
- **History:** "‹ Today" and "Work History", then "How this Quest changed across Q4 2026, newest first." Each row shows `versionDay`, "Current" on the newest, and the Main Quest with a capital, clamped to two lines. A tapped row opens the Version read-only (`ReadBack` without `onPart`, so an empty Obstacle is left out), under "‹ History".
- **The menu:** each Quest row is a group with Edit ("Edit · unsaved changes" with a Draft) and History, as pills. Edit is hidden once the Quarter has ended (`canEdit` in Today's day words) and for data from a newer Cadence. The row wraps its pills under the name when "unsaved changes" makes them too wide.
- **Shared header:** `ScreenHeader` and `BackButton`, now used by Backup, Edit and History. Its centre sizes to its content, between equal sides, so a note doesn't wrap.
- **Update reload:** Edit turns `setWriting` on while it's open.
- **Browser check:** headless Chrome at 390 px, light and dark, with Q3 seeded with two Work Versions and an edit Draft from the day before: the menu with "Edit · unsaved changes", the restored read-back ("from Tue 05:59") with the changed Obstacle marked, a part screen, "Main Quest can't be empty", the discard sheet, the History list, and a Version.
- **Review (standards and spec):** fixed: the store names a Quest's first empty part (`emptyPart`, in §8's order: each line, then each list), which `isComplete` and Edit's "can't be empty" note both read, so the completeness rule lives only in the store; one helper each for a short month and weekday in `quarters.ts`; one `setUpQ4` for the store tests; History's `shown`, `PartScreen`'s `canMoveOn`, and `completeQuest`'s `toBe`. Not changed: `canEdit` stays in Today's day words beside `canReflect`, and the menu adds only the newer-data check, while the store's refusal is the rule; `ScreenHeader`'s title keeps Backup's size, to settle in one pass over every pushed screen; `ReadBack`'s `changed` and `PartScreen`'s `editing` stay separate props until a third mode needs them; a discard that fails is let go, since nothing typed is lost (§13.5 keeps typed words, and the next Edit restores the Draft and says so); the commits already made stay as they are. The spec review found no hard gaps. The owner kept the "Unsaved changes" note (now in §8). History's intro line and the Version view's date line go a little beyond §9, and stay.
