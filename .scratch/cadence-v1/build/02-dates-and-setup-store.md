# Dates, Prompts and the store's setup path

Type: build (AFK)
Status: open
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

- [ ] Table tests cover:
  - quarter lengths (Q4 2026 = 92, Q1 2027 = 90);
  - 1 Jan;
  - the last-14-days default (18 Dec, and 17–30 Sep for Q3);
  - "before Day 1";
  - every `screenFor` rule and edge case in §3.1.
- [ ] Store tests cover every rule in §10 and §13.4 that the setup path touches, plus retry-once, quota and a newer schema.
- [ ] `tsc --noEmit` and `npm test -- --run` pass. `CHANGELOG.md` notes nothing, since nothing changed on the phone.
