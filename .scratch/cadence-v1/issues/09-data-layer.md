# Data layer & storage schema

Type: grilling
Status: open
Blocked by: 03, 04, 05, 06

## Question

How is Cadence's data shaped and stored so that it can't corrupt itself and export/import is trivial?

- Records and keys: Quarters, Quest Versions per Quest per Quarter (at most one per Day), reflections by local date. Named store `cadence`/`kv`, and a `schemaVersion` for future migrations.
- Write semantics: atomic multi-key writes, retry once on connection loss, "Saved" only after the write resolves, handling quota errors ([research 01](../research/ios-storage-durability.md)).
- Export file = stored data plus metadata. Import validation, preview, and replace semantics.
- `persist()` and standalone detection on launch.
- One module interface the UI talks to, replacing the ad-hoc storage in `useQuests` / `useReflections`?

Context: [audit.md](../audit.md) bugs 1, 2, 4; [research 02](../research/github-pages-pwa-setup.md) (named store, shared origin); [What a Quest is made of](03-quest-anatomy.md) (Quest content shape; supersedes the current `QuestContent`); [Quarter boundaries](04-quarter-boundaries.md) (Quarters keyed by calendar quarter; several can exist at once; a finished/unfinished state; reflections belong to the Quarter containing their date; writes to a Past Quarter are refused); [The morning ritual](05-morning-ritual.md) (at most one Reflection per Quest per Day, keyed by local date; multi-line text plus a copy of the Prompt; writable only for today's date, and replaced on re-save); [What a Quest version is](06-quest-versions.md) (a Version is tagged with its Day or "before Day 1"; a save appends or replaces today's Version and drops it if identical to the one before; nothing else changes a Version; no note, pivot flag, or Version on Reflections; the edit draft is stored apart; saves to a Past Quarter refused); [Prototype: writing a Quest](07-prototype-writing-a-quest.md) (the setup draft keeps its position, meaning which Quest and which part; the edit draft keeps when it started; both survive the app closing; Work comes before Life in any ordered output).
