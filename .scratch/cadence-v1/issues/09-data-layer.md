# Data layer & storage schema

Type: grilling
Status: resolved
Assignee: Spyobird
Blocked by: 03, 04, 05, 06

## Question

How is Cadence's data shaped and stored so that it can't corrupt itself and export/import is trivial?

- Records and keys: Quarters, Quest Versions per Quest per Quarter (at most one per Day), reflections by local date. Named store `cadence`/`kv`, and a `schemaVersion` for future migrations.
- Write semantics: atomic multi-key writes, retry once on connection loss, "Saved" only after the write resolves, handling quota errors ([research 01](../research/ios-storage-durability.md)).
- Export file = stored data plus metadata. Import validation, preview, and replace semantics.
- `persist()` and standalone detection on launch.
- One module interface the UI talks to, replacing the ad-hoc storage in `useQuests` / `useReflections`?

Context: [audit.md](../audit.md) bugs 1, 2, 4; [research 02](../research/github-pages-pwa-setup.md) (named store, shared origin); [What a Quest is made of](03-quest-anatomy.md) (Quest content shape; supersedes the current `QuestContent`); [Quarter boundaries](04-quarter-boundaries.md) (Quarters keyed by calendar quarter; several can exist at once; a finished/unfinished state; reflections belong to the Quarter containing their date; writes to a Past Quarter are refused); [The morning ritual](05-morning-ritual.md) (at most one Reflection per Quest per Day, keyed by local date; multi-line text plus a copy of the Prompt; writable only for today's date, and replaced on re-save); [What a Quest version is](06-quest-versions.md) (a Version is tagged with its Day or "before Day 1"; a save appends or replaces today's Version and drops it if identical to the one before; nothing else changes a Version; no note, pivot flag, or Version on Reflections; the edit draft is stored apart; saves to a Past Quarter refused); [Prototype: writing a Quest](07-prototype-writing-a-quest.md) (the setup draft keeps its position, meaning which Quest and which part; the edit draft keeps when it started; both survive the app closing; Work comes before Life in any ordered output); [Prototype: the Today screen & app shell](08-prototype-morning-screen.md) (store when the last backup was made, which drives the backup-due nudge; the Archive reads every Reflection newest first with its Prompt; import reads a backup's date and counts before replacing; the Backup screen shows whether storage is persistent; fold state and the page in view are UI-only, not stored).

## Answer

Terms are in [CONTEXT.md](../../../CONTEXT.md). **Draft** is new, and **Backup** now includes Drafts. Everything below was accepted as recommended over two grilling rounds.

**Storage:**

- **Store:** `idb-keyval` 6.3 with a named store, `createStore('cadence', 'kv')` ([research 01](../research/ios-storage-durability.md)).
- **Keys:**
  - One key per Quarter (`quarter:2026-Q4`) holds both Quests' Versions and that Quarter's Reflections.
  - One key per Draft.
  - One `meta` key.
- **Past Quarters:** a Past Quarter's key is never written again, so it's read-only by construction.
- **Atomicity:** a change to one key uses `update()`, an atomic read-modify-write. A change to several keys (e.g. finishing a Quest also clears its Draft, or an import) runs in one IndexedDB transaction through the store function `createStore` returns.

**Records:**

```ts
QuestContent { mainQuest, whyItMatters, successMetrics: string[],
               whyItsExciting, obstacle /* '' when skipped */, commitments: string[] }
Version      { savedOn: "2026-11-12", content: QuestContent }
Reflection   { text, prompt }             // prompt: a copy of the Day's Prompt

quarter:2026-Q4    { versions: { work: Version[], life: Version[] },      // oldest first
                     reflections: { "2026-11-12": { work?, life? } } }
setup:2026-Q4      { at: { quest, part }, work: partial content, life: partial content }
edit:2026-Q4:work  { startedAt, content }
meta               { schemaVersion: 1, lastBackupAt: epoch ms | null }
```

- **Nothing is stored that can be derived:**
  - There's no "finished" flag. A Quest is finished once it has a Version, and a Quarter is set up once both Quests have one.
  - The Day is never stored; it comes from the date and the Quarter.
  - Fold state, the page in view and the persistent status aren't stored either.
- **Order:** Work before Life in every ordered output.

**Code:**

- **`src/lib/quarters.ts`** does pure date maths: `quarterOf(date)`, `dayOf(date, quarter)` (a number, or "before"), `lengthOf(quarter)`, and `screenFor(snapshot, today)`, which picks one of setup, resume, before Day 1, running or ended.
- **`src/lib/store.ts`** is the only code that touches IndexedDB, and it owns every rule. It takes the clock as an input. Operations:
  - `open(clock)` loads everything into memory once.
  - `saveSetupDraft`, and `switchSetupTarget` (only until Work is finished).
  - `finishQuest` makes Version 1 and clears that Quest's part of the setup Draft.
  - `saveEditDraft` and `discardEdit`.
  - `saveQuest` adds today's Version, replaces it, or drops it if it's identical to the Version before.
  - `saveReflection` and `removeReflection`, for today only.
  - `exportBackup` returns a `File`, and `markBackedUp` records the backup.
  - `readBackup` returns a Preview or a Problem, and `replaceWith` imports it.
- **`useCadence()`** is one hook that replaces `useQuests` and `useReflections`. It re-renders after every write. The data is small (a few MB after years), so all reads come from memory.
- **Tests** run against real IndexedDB through `fake-indexeddb`.

**Rules the store enforces:**

- **Past Quarters:** a write to a Past Quarter is refused.
- **Versions:**
  - At most one per Quest per Day. Before Day 1, every save replaces Version 1.
  - A Day's Version that matches the Version before it is dropped.
  - Only a complete Quest can be finished or saved.
- **Reflections:** only for today's date, within a set-up Quarter.
- **A save carries the date it's saved on.**
  - A Reflection saved at 00:01 is the new Day's Reflection, with that Day's Prompt. If the Quarter has just ended, the save is refused.
  - The Version from before Day 1 is dated by its last save. Its History row reads "29 Sep · before Day 1", with no "Set up".
- **Text is tidied on save:**
  - Quest parts and list items are trimmed, and a pasted line break becomes a space. Empty list items are dropped.
  - A Reflection is trimmed at the ends only. One that's only spaces is empty, so Save becomes Remove.
  - "Changed" (which enables Save) and "identical" (which drops a Version) compare the tidied text.
- **Drafts:**
  - An edit Draft survives across Days ("Your unsaved changes from Thu 10:42 are still here"), and saving it makes that Day's Version.
  - An edit Draft is deleted once it matches the saved Version again.
  - A setup or edit Draft left when its Quarter ends stays frozen with that Quarter. It's kept in storage and the Backup, and never shown or resumed. Cadence then opens on a blank setup for the Current Quarter.

**Failed saves:**

1. The store retries once on a fresh connection.
2. If that fails too, a blocking message appears: "Couldn't save. Close and reopen Cadence, or restart the iPhone." The typed text stays on screen.
3. A quota error says "iPhone storage is full" instead.

"Saved" only shows after the write finishes. Stored data with a newer `schemaVersion` than the app knows opens read-only, with "Update Cadence".

**Backup:**

- **File:** `cadence-backup-YYYY-MM-DD.json`, holding `{ app: "cadence", schemaVersion, exportedAt, data }`. `data` is every stored key, Drafts included, so a restore puts the phone back exactly as it was.
- **When it counts as made:** when the share sheet finishes without Cancel, since Save to Files, AirDrop and Mail all count. With the fallback `<a download>`, when the download starts. This sets `lastBackupAt`, which drives the backup-due nudge.
- **Import:**
  1. Check the whole file before touching anything: it must be a Cadence backup, its schema can't be newer than the app's, and every record must be valid. An older schema is migrated.
  2. Show the preview: "Backup from Mon 12 Oct 2026 · Q4 2026 · 43 Reflections", listing every Quarter the backup contains.
  3. "Replace everything" clears the store and writes the backup in one transaction.
  4. `lastBackupAt` becomes the backup's `exportedAt`.

**Launch:**

- **Home Screen app:** `navigator.storage.persist()` is called on every launch. The Backup screen reads `persisted()` live.
- **Safari tab:** the red banner shows, but Cadence still works and saves. Its data stays in Safari, and the owner's standing rule covers the risk.

**Feeds forward:**

- [v1 spec & build order](10-v1-spec-and-build-order.md):
  - The store, `quarters.ts` and `useCadence()` are the core of the build and are written test-first.
  - Housekeeping: `CLAUDE.md` names `useQuests`/`useReflections`; the `uuid` dependency becomes unused; `src/test-db.ts` is stale.
  - It removes the data-side causes of [audit.md](../audit.md) bugs 1, 2 and 4, as well as the stale History after a save and the duplicate Reflections per Day.

## Comments

**Grilling round 1 (2026-09-29):** the owner accepted every recommendation.

- **Keys:** one key per Quarter (`quarter:2026-Q4`) holds both Quests' Versions and that Quarter's Reflections. `meta` holds `schemaVersion` and the last backup date. Each draft has its own key. A Past Quarter's key is never written again. A change to more than one key runs in one IndexedDB transaction (idb-keyval's store function); a change to one key uses `update()`.
- **One store module** (`src/lib/store.ts`) owns every rule: no writes to a Past Quarter, one Version per Day with identical saves dropped, Reflections only for today, and only a complete Quest can be finished. It takes the clock as an input. Tests use real IndexedDB through `fake-indexeddb`.
- **Failed saves:** retry once on a fresh connection. If that fails too, show a blocking "Couldn't save. Close and reopen Cadence, or restart the iPhone." and keep the typed text on screen. A quota error says "iPhone storage is full" instead. "Saved" only shows after the write finishes. Data with a newer `schemaVersion` opens read-only, with "Update Cadence".
- **Backup file:** `cadence-backup-YYYY-MM-DD.json`, holding `{ app: "cadence", schemaVersion, exportedAt, data }`, where `data` is every stored key, drafts included.
  - It counts as made when the share sheet finishes without Cancel, or when the fallback download starts.
  - Import checks the whole file before touching anything. It refuses a newer schema. "Replace everything" clears and writes in one transaction, then sets the last backup date to the backup's `exportedAt`.
- **A save carries the date it's saved on:**
  - A Reflection saved at 00:01 is the new Day's Reflection, with that Day's Prompt. If the Quarter has just ended, the save is refused.
  - The Version from before Day 1 is dated by its last save. Its History row reads "29 Sep · before Day 1", with no "Set up".
  - The Day is never stored; it comes from the date and the Quarter.
- **Setup unfinished when its Quarter ends:** it stays frozen with that Quarter, in storage and the Backup, and is never shown or resumed. Cadence then opens on a blank setup for the Current Quarter.

**Grilling round 2 (2026-09-29):** the owner accepted every recommendation.

- **Two modules and one hook:**
  - `src/lib/quarters.ts` does pure date maths: `quarterOf`, `dayOf`, `lengthOf`, and `screenFor`, which picks one of setup, resume, before Day 1, running or ended.
  - `src/lib/store.ts` is the only code that touches IndexedDB. Its operations: `open(clock)`, `saveSetupDraft`, `switchSetupTarget` (only until Work is finished), `finishQuest`, `saveEditDraft`, `discardEdit`, `saveQuest`, `saveReflection`, `removeReflection`, `exportBackup`, `markBackedUp`, `readBackup`, `replaceWith`.
  - One `useCadence()` hook replaces `useQuests` and `useReflections`. Everything is loaded into memory at launch.
- **Records:** `quarter:2026-Q4` holds `{ versions: { work, life }, reflections: { date: { work?, life? } } }`. A Version is `{ savedOn, content }`, and a Reflection is `{ text, prompt }`. The other keys: `setup:2026-Q4` holds `{ at: { quest, part }, work, life }`, `edit:2026-Q4:work` holds `{ startedAt, content }`, and `meta` holds `{ schemaVersion: 1, lastBackupAt }`. There's no finished flag: a Quest is finished once it has a Version.
- **Text tidy-up on save:**
  - Quest parts and list items are trimmed, and a pasted line break becomes a space. Empty list items are dropped.
  - A Reflection is trimmed at the ends only, and one that's only spaces counts as empty.
  - "Changed" and "identical" compare the tidied text.
- **An edit draft survives across Days:** "from Thu 10:42". It's deleted once it matches the saved Version again. It's frozen with its Quarter once that Quarter ends.
- **Launch:**
  - As a Home Screen app, Cadence calls `persist()` every time, and the Backup screen reads the status live.
  - In a Safari tab it shows the banner but still works and saves.
  - The import preview reads "Backup from Mon 12 Oct 2026 · Q4 2026 · 43 Reflections".
