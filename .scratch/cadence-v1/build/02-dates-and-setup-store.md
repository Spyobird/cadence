# Dates, Prompts and the store's setup path

Type: build (AFK)
Status: done
Blocked by: 01

## Goal

The data core, written test-first. It covers the date maths, the Prompts, and a store that can open, save a setup Draft and finish a Quest under every rule. There's no UI yet.

## Spec

[spec.md](../spec.md) §3 (Quarters and Days), §4 (A Quest, including tidy-up), §7.2 (Prompts), §10 (Versions), §13 (Data layer), §14 (Tests). Background: [Data layer & storage schema](../issues/09-data-layer.md).

## Scope

1. **`src/lib/quarters.ts`:** `quarterOf`, `dayOf`, `lengthOf`, `setupTarget` and `screenFor`, with all five states and the edge cases in §3.1.
2. **`src/lib/prompts.ts`:** the seven Prompts and `promptFor(date)`.
3. **`src/lib/store.ts`**, against `fake-indexeddb` with an injected clock:
   - `open(clock)` loads everything into memory, and creates `meta` on first run (`schemaVersion: 1`, `lastBackupAt: null`, `appearance: 'system'`).
   - `saveSetupDraft`, `switchSetupTarget` (only until Work is finished) and `finishQuest` (Version 1, which clears that Quest's part of the Draft in one transaction).
   - Tidy-up on save (§4.3). A complete Quest is required to finish.
   - Refuses writes to a Past Quarter. Drafts are frozen with their Quarter.
   - Failed saves: retry once on a fresh connection, then a typed error the UI can show. Quota errors get their own type (§13.5).
   - Newer `schemaVersion` → read-only (§13.4).
4. **`src/hooks/useCadence.ts`:** exposes the snapshot, `screenFor` for today, and the setup operations. It re-renders after every write.

Later slices add their own store operations: Backup in 05, Reflections in 06, editing in 07.

## Done when

- [x] Table tests cover:
  - quarter lengths (Q4 2026 = 92, Q1 2027 = 90);
  - 1 Jan;
  - the last-14-days default (18 Dec, and 17–30 Sep for Q3);
  - "before Day 1";
  - every `screenFor` rule and edge case in §3.1.
- [x] Store tests cover every rule in §10 and §13.4 that the setup path touches, plus retry-once, quota and a newer schema.
- [x] `tsc --noEmit` and `npm test -- --run` pass. `CHANGELOG.md` notes nothing, since nothing changed on the phone.

## Build notes

- **Writes:** every write, to one key or several, is one transaction through `createStore`'s store function, with its values worked out from memory. Writes wait their turn in a queue, so each one's rules see the write before it. §13.1 and ADR 0004 said a one-key change used `update()`; the owner chose to change that wording to match.
- **Ended:** the button sets up the Current Quarter, as §3.1 says, even in its last 14 days. The setup switch reaches the Upcoming Quarter from there.
- **Finishing:** `finishQuest(quarter, quest, content)` finishes the words on screen, not the stored Draft.
- **Tidy-up:** a setup Draft is stored as typed. The tidy-up applies when a Version is made. `tidyQuest` is exported for slice 7's "changed".
- **Rules the spec implies** (each refused as `not-allowed`):
  - Work is finished before Life, and a Quest is finished only once.
  - Setup writes only to the Current or the Upcoming Quarter.
  - The setup Draft can't hold a finished Quest's words or point at it.
- **Errors:** a `StoreError` has a `reason` and a `message`. The messages for `failed`, `storage-full`, `quarter-ended` and `read-only` are the spec's words. Read-only is checked before any other rule.
- **Launch:** the first-run `meta` write is retried like any save. The read at launch isn't, since its connection is new, so a failed read throws.
- **Test seam:** `open(clock, connect)`. Tests pass a `connect` that closes or fails the connection.
- **For slice 3:**
  - Provide the store with `<CadenceContext value={store}>`.
  - Send the last as-typed save before Finish. A save that lands after Finish, still holding Work's words, is refused.
  - A switch before anything is typed stores a blank Draft, so `screenFor` says `resume`. Don't show "Picked up where you left off." for a blank Draft.
