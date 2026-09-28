# Backup

Type: build (AFK)
Status: open
Blocked by: 04

## Goal

The owner can export everything to Files, and import a backup to replace everything. The menu nudges when a backup is due.

## Spec

[spec.md](../spec.md) §12 (Backup), §6.3 (Backup due), §2.6 (the build stamp moves to the Backup screen), §13 (store). Background: [iOS storage durability](../research/ios-storage-durability.md).

## Scope

1. **Store:** `exportBackup` (returns a `File` with every key, Drafts included) and `markBackedUp`. `readBackup` returns a Preview or a Problem, checking the whole file and migrating older schemas. `replaceWith` works in one transaction and sets `lastBackupAt` to the backup's `exportedAt`.
2. **The Backup screen:** the last backup, the live `persisted()` status (or the Safari warning), Export, Import, the note, and the build stamp at the foot.
3. **Export:** Web Share with a file inside the tap handler, and the `<a download>` fallback. It counts as made on share success or when the download starts.
4. **Import:** the Files picker, a Problem message or the preview, and the three options.
5. **Backup due:** the gold dot on the menu button and the gold time in the Backup row (§6.3).

**Tests:**
- export → `readBackup` → `replaceWith` round trips to identical stored data;
- every Problem;
- a newer schema is refused;
- a cancelled share doesn't mark a backup;
- the backup-due rules.

## Done when

- [ ] The tests above pass, along with `tsc`.
- [ ] Deployed. The round trip is checked on the phone after slice 6.
- [ ] `CHANGELOG.md`: "Added: Backup export and import".
