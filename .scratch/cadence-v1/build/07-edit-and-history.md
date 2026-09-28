# Edit and History

Type: build (AFK)
Status: open
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

- [ ] The tests above pass, along with `tsc`.
- [ ] Deployed.
- [ ] `CHANGELOG.md`: "Added: editing a Quest, and its History".
