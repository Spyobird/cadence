# One storage key per Quarter, and one module that owns every rule

Cadence stores each Quarter under one `idb-keyval` key (`quarter:2026-Q4`) that holds both Quests' Versions and that Quarter's Reflections. Drafts and `meta` have keys of their own. `src/lib/store.ts` is the only code that touches IndexedDB, and it enforces every rule: no writes to a Past Quarter, one Version per Day, Reflections only for today, and only a complete Quest can be finished. A Past Quarter's key is then never written again, a change to one key is a single atomic `update()`, and an export is simply every key. The data is small (a few MB after years), so everything is read into memory at launch.

## Considered options

- **One key per record** (a Version, a Reflection): finer writes, but more keys to keep consistent, more multi-key transactions, and no natural place to freeze a Quarter.
- **Raw IndexedDB object stores with indexes:** more power than the app needs, and a heavier API to get right on iOS's buggy IndexedDB.
- **Rules in each hook or component:** that's how the first build lost data (audit bugs 1 and 2).

## Consequences

Changing the key layout later needs a migration, driven by `meta.schemaVersion`. Stored data with a newer `schemaVersion` than the app knows opens read-only.

Sources: [Data layer & storage schema](../../.scratch/cadence-v1/issues/09-data-layer.md).
