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
2. **The Backup screen:** the last backup, the live `persisted()` status (or the Safari warning), Export, Import, the note, and the build stamp at the foot. The stamp moves there from the foot of the menu, where slice 4 kept it in the meantime.
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

- [x] The tests above pass, along with `tsc`.
- [ ] Deployed. The round trip is checked on the phone after slice 6.
- [x] `CHANGELOG.md`: "Added: Backup export and import".

## Build notes

- **Export:** `exportBackup` builds the file from memory, with no await, so the tap that shares it still counts as a tap when the share sheet opens. The store now keeps every key as stored, including keys this build doesn't read. So a Backup holds everything, even data from a newer Cadence: read-only data still exports, labelled with its own schema.
- **The check:** `readBackup` checks the whole file against schema 1 (§13.2): every key and every field. Versions must be complete, oldest first, one a Day and none after their Quarter. Reflections must sit on a Day of their Quarter. `edit:` keys are checked as §13.2 has them, though slice 7 writes the first one. A key or field that schema 1 doesn't have makes the file damaged.
- **The Problems:** a file that isn't JSON, isn't an object, or has no `app: "cadence"` "isn't a Cadence backup". A newer schema is refused before its data is read. Schema 1 is the first, so there's nothing older to migrate yet: a schema below 1 is damaged, and the check marks where schema 2 would migrate.
- **Replace:** `replaceWith` clears and writes in one transaction, with `lastBackupAt` set to the backup's `exportedAt`. A failed replace changes nothing, and the preview stays open under the blocking message.
- **The preview:** "Backup from Mon 12 Oct 2026 · Q3 2026, Q4 2026 · 43 Reflections". It lists every Quarter with any key, a setup Draft included. One Reflection reads "1 Reflection".
- **Backup due:** `isBackupDue` (quarters.ts) counts calendar days, as "3 days ago" does. "The latest set-up Quarter has ended since the last backup" is taken as written: if Q1 2027 is set up before Q4 ends, Q4 ending doesn't nudge, and the 7-day rule still does.
- **The menu:** the Backup row reads "Never", "Today", "Yesterday" or "3 days ago", in `--gold-text` when due. The gold dot sits on the menu button, which screen readers hear as "A backup is due". The build stamp has moved to the Backup screen. The Menu's sheet is now `Sheet.tsx`, which the import preview uses too.
- **The Backup screen:** a pushed screen, routed by the app shell. Its back button reads "‹ Today" from the menu, or "Close" from setup. It's ink, not gold: DESIGN.md's colour table lists nav buttons under `--gold-text`, but its Gold list doesn't, and the Gold list says "only".
- **Its words:** "Last backup: Mon 12 Oct, 3 days ago" ("today" and "yesterday" too, with the year added when it isn't this year), or "No backup yet". Storage reads "On this iPhone, marked persistent", or in a Safari tab §2.7's reason. The spec gives no words for a Home Screen app that isn't marked persistent, so it reads "On this iPhone, not marked persistent, so iOS could clear it to free up space".
- **Export's fallback:** `share.ts` uses the share sheet when it can take the file. Cancel (`AbortError`) isn't counted. Any other failure falls back to `<a download>`, which counts once it starts. Export is disabled while the share sheet is open, so a second tap can't open another, or fall back to a download.
- **Import:** a label wraps a visually hidden file input, so a tap opens the Files picker itself (research §7c). It has no `accept`, so the picker never greys out a backup Files has typed differently: the check refuses anything else. "Replace everything" is the sheet's primary button.
- **Restoring onto a fresh install (the owner's choice, 30 Sep 2026):** blank setup has no menu, so there was no way to Import after re-adding the icon (phone check step 4). While nothing is stored, setup's first screen shows "Restore from a backup". It opens the Backup screen with Close back to setup, and goes once anything is typed. Leaving the Backup screen goes wherever the data now says. Added to spec §12.3 and §18.
- **Tests:** `src/test/phone.ts` fakes a share sheet (saved to Files, or cancelled), a browser with no share sheet for files, and the storage's persisted status. Vitest's `URL.createObjectURL` can't take jsdom's `File`, so the no-share fake stands in for it too.
- **Browser check:** headless Chrome at 390 px. Checked: the menu with the due dot (light and dark), the Backup screen in a Safari tab (light and dark), a fresh setup with the restore link, the preview sheet, and Today after the replace.
