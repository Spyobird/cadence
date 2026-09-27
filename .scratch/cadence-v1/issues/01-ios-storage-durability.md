# iOS storage durability & backup mechanics

Type: research
Status: resolved
Blocked by:

## Question

How safe is IndexedDB data in an iPhone Home Screen web app (iOS 18–26), and what backup/restore mechanics actually work there?

- Is Home Screen web app storage separate from Safari's, and exempt from WebKit's 7-day script-writable storage cap? Quotas?
- Does `navigator.storage.persist()` work in standalone mode, and what does it change?
- What deletes the data: removing the icon, "Clear History and Website Data", app offloading, iOS updates, low-storage eviction?
- Is it included in iCloud / device backups and restored onto a new phone?
- Did iOS 26's "Open as Web App" default change anything about install or storage?
- Export: can a standalone web app hand a JSON file to the user (Web Share with files → Save to Files, `<a download>` Blob)? Import: does `<input type="file">` work in standalone mode?
- Known IndexedDB bugs in iOS standalone mode (e.g. connection lost after backgrounding) and mitigations relevant to `idb-keyval`.

## Answer

Findings with sources and confidence labels: [research/ios-storage-durability.md](../research/ios-storage-durability.md).

- **Separate and exempt (confirmed):** a Home Screen web app has its own storage, separate from Safari's, and is exempt from the 7-day cap. Each icon is a separate install with its own data (inferred). Quota is up to ~60% of disk.
- **`persist()` (confirmed):** granted without a prompt for Home Screen apps; persisted origins are skipped by eviction. Call it on every standalone launch. It is not a backup.
- **What deletes data:**
  - Removing the icon very likely deletes it (secondary evidence).
  - "Clear History and Website Data", offloading and iOS updates are unconfirmed.
  - iCloud/device backups appear to include it (secondary); restore onto a new phone is unconfirmed.
- **iOS 26:** "Open as Web App" is on by default. Off means a Safari bookmark with the 7-day cap.
- **Export:** Web Share with files (iOS 15+, must be called in the tap handler) → Save to Files. `<a download>` Blob is a fallback only. **Import:** `<input type="file">` works in standalone mode.
- **IndexedDB bugs:** "connection lost" after the network process crashes (iOS 17.4–18.x; fixes in Safari 26.5/27). Upgrade to `idb-keyval@^6.3.0`, use a named store, retry once on `InvalidStateError`/`UnknownError`, and show "Saved" only after the write resolves.
- **Owner rules:**
  - Never delete the icon or change the origin without a fresh export.
  - Never keep real data in a Safari tab.
  - Check Cadence still works before enabling Lockdown Mode (it disables IndexedDB).
