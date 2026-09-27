# Data layer & storage schema

Type: grilling
Status: open
Blocked by: 03, 04, 05, 06

## Question

How is Cadence's data shaped and stored so that it can't corrupt itself and export/import is trivial?

- Records and keys: Quarters, Quest versions as a flat append-only list, reflections by local date. Named store `cadence`/`kv`, and a `schemaVersion` for future migrations.
- Write semantics: atomic multi-key writes, retry once on connection loss, "Saved" only after the write resolves, handling quota errors ([research 01](../research/ios-storage-durability.md)).
- Export file = stored data plus metadata. Import validation, preview, and replace semantics.
- `persist()` and standalone detection on launch.
- One module interface the UI talks to, replacing the ad-hoc storage in `useQuests` / `useReflections`?

Context: [audit.md](../audit.md) bugs 1, 2, 4; [research 02](../research/github-pages-pwa-setup.md) (named store, shared origin); [What a Quest is made of](03-quest-anatomy.md) (Quest content shape; supersedes the current `QuestContent`); [Quarter boundaries](04-quarter-boundaries.md) (Quarters keyed by calendar quarter; several can exist at once; a finished/unfinished state; reflections belong to the Quarter containing their date; writes to a Past Quarter are refused).
