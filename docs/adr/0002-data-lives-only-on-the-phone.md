# Data lives only on the phone, and Backup files are the only safety net

Cadence stores everything in the installed app's IndexedDB and has no server, account or sync. The only protection against loss is a Backup: one JSON file with every stored key, exported through the share sheet and importable to replace everything. This keeps Cadence free, private and without a login for one person on one iPhone. The cost is that deleting the Home Screen icon, or changing the origin ([ADR 0001](0001-permanent-address-on-github-pages.md)), erases the data unless a fresh Backup exists. So the app calls `navigator.storage.persist()` on every launch, nudges when a Backup is 7 or more days old, and the owner follows three standing rules: export before any origin change, never delete the icon without a fresh export, and never keep real data in a Safari tab.

## Considered options

- **Cloud sync or an account:** needs a server and a login, which is against the local-first principle for a one-person app.
- **iCloud or device backups:** they appear to include web-app storage, but that's unconfirmed and out of Cadence's control.
- **Automatic backups:** a web app can't write a file without a tap, so a manual export with a nudge is the most that works.

Sources: [iOS storage durability & backup mechanics](../../.scratch/cadence-v1/issues/01-ios-storage-durability.md), [Data layer & storage schema](../../.scratch/cadence-v1/issues/09-data-layer.md).
