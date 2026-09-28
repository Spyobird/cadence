# Cadence v1

Label: wayfinder:map

## Destination

A decided v1 spec for Cadence, sliced into ordered build tickets ready for TDD sessions. v1 is installable from `https://spyobird.github.io/cadence/` on an iPhone, data-safe, and has a polished core loop. Target: in daily use early in Q4 2026 (October).

## Notes

- **Domain:** a personal quarterly-goal PWA for one person on one iPhone (iOS 26). Local-first (IndexedDB), no server, no login. Glossary: [CONTEXT.md](../../CONTEXT.md).
- **Settled while charting (2026-09-27):**
  - Quarters are calendar quarters. Existing data may be discarded (no migration). No reminders.
  - Hosting is a public repo `cadence` on GitHub Pages at `spyobird.github.io/cadence/`.
  - `DESIGN.md`'s "Precision Chronometer" is a starting point, not a contract. UX and seamlessness beat colour; creative latitude is welcome.
- **v1 scope (settled 2026-09-27):**
  - Installable with a real icon and proper iOS chrome.
  - Hardened data layer that knows about Quarters.
  - Quarter setup.
  - Today screen: the Quests to re-read, with the day's Prompt and optional Reflections.
  - Quest view/edit, with one Version kept per Day, plus a simple History list ([What a Quest version is](issues/06-quest-versions.md)).
  - Quarter-progress ring.
  - Plain Archive feed.
  - Backup export **and** import; import is in so the round trip can be proven on the device.
  - A warning when Cadence is opened in a Safari tab.
- **Owner's framing:** Cadence is a vision statement to re-read casually, at any time of day. It is not a ritual and not a check-in. Keep it simple ([The morning ritual](issues/05-morning-ritual.md)).
- **Standing rules for the owner:**
  - Export before any origin change (custom domain on `spyobird.github.io`, account or repo rename, new host).
  - Never delete the Home Screen icon without a fresh export.
  - Never keep real data in a Safari tab.
- **Strategy:** repair, not rewrite. Baseline: [audit.md](audit.md).
- **Skills:**
  - Grilling tickets: `grilling` + `domain-modeling`.
  - Prototype tickets: `prototype`, plus `frontend-design` for UI.
  - Research: `research`.
  - Build tickets (after this map): `tdd`.
  - `CLAUDE.md` requires Context7 for any library API.
- **Tracker:** local markdown (no git remote yet). Research findings live in `research/` next to this map, not on research branches, because the working tree holds uncommitted work.

## Decisions so far

<!-- one line per resolved ticket: [title](issues/NN-slug.md): gist -->

- [iOS storage durability & backup mechanics](issues/01-ios-storage-durability.md): Home Screen storage is separate from Safari and exempt from the 7-day cap. Call `persist()` on launch. Deleting the icon likely wipes data. Export via Web Share files, import via file input. Upgrade `idb-keyval` to 6.3 with a named store and retry-once on connection loss.
- [GitHub Pages + PWA setup for iOS install](issues/02-github-pages-pwa-setup.md): `base: '/cadence/'`. Fix the update path (it never auto-applies today). Upgrade to Vite 8 / vite-plugin-pwa 1.3 / vitest 4.1 on Node 24. Official Actions deploy. 180px opaque touch icon + `viewport-fit=cover`. Namespaced IDB store. Origin is permanent.
- [What a Quest is made of](issues/03-quest-anatomy.md): six single-line Scaffold parts, with a new optional Obstacle and reworded metrics. Lists hold 1–5 items. Nothing tracked. The morning re-read shows the whole Quest. "Prompts to find it" are thinking aids.
- [Quarter boundaries](issues/04-quarter-boundaries.md): setup targets the current Quarter, or the upcoming one in the last 14 days, with a one-tap switch. Day N counts from the calendar Quarter's start. A Quarter is set up once both Quests are finished. Reflecting happens only on a Day of a set-up Quarter. Past Quarters are read-only and not browsable in v1. v1 offers plain setup of the next Quarter.
- [The morning ritual](issues/05-morning-ritual.md): not a ritual. Opening Cadence is a casual re-read of both Quests at any time of day, and it leaves no record. There is an optional Reflection per Quest per Day, editable until midnight, with no backfill. The weekday Prompt is only a thinking aid. All seven Prompts were revised to work at any hour.
- [What a Quest version is](issues/06-quest-versions.md): the History is a read-only record, with no restore, note or pivot flag. Version 1 is made at finish. After that, at most one Version per Day (same-Day saves replace it), and everything before Day 1 is Version 1. History rows show date, Day and Main Quest. Reflections don't store a Version.
- [Prototype: writing a Quest](issues/07-prototype-writing-a-quest.md): variant A for setup and editing: one Scaffold part per screen, then a read-back where you tap a part to change it. Work comes before Life everywhere. Return is Next, the keyboard stays up, and drafts survive the app closing. The Obstacle hint is now a question.
- [Prototype: the Today screen & app shell](issues/08-prototype-morning-screen.md): the ring on top, then one page per Quest (Work first). Each page shows the Main Quest, the rest folded under "Read the whole Quest", and a "Write today's Reflection" link that opens a popup. One menu holds Edit, History, Archive and Backup. Dark look, three type sizes, and the Main Quest in bundled Plus Jakarta Sans ExtraBold.
- [Data layer & storage schema](issues/09-data-layer.md): one key per Quarter holds its Versions and Reflections, and Drafts and `meta` have their own keys. `store.ts` is the only code that touches IndexedDB and it enforces every rule; `quarters.ts` does the date maths, and one `useCadence()` hook serves the UI. A save carries the date it's saved on. A failed save retries once, then blocks with the text kept. The Backup is every key, Drafts included, and import checks the whole file before replacing everything in one transaction. Drafts left when their Quarter ends are frozen with it.

## Not yet specified

- **On-device verification:** launch appearance without splash images, whether an update applies on resume, and status-bar behaviour on iOS 26. Can't be pinned down until something is deployed at the real origin; may graduate into build tickets.

## Out of scope

- **Cloud sync, accounts, multi-device:** one phone, local-first.
- **Reminders / push notifications:** would need a server; an iOS Reminder covers it.
- **Migrating existing data:** none worth keeping.
- **App Store / native wrapper:** the point is to avoid it.
- **Quarter rollover flow** (review, verdict, carry-over): post-v1. v1 already offers plain setup of the next Quarter, so 1 Jan 2027 isn't a hard deadline ([Quarter boundaries](issues/04-quarter-boundaries.md)).
- **Comparing Quest versions:** post-v1.
- **Motion polish (check-in pulse, screen slides):** post-v1 unless it comes almost free.
- **Archive filters:** post-v1.
- **Rhythm strip:** dropped; it duplicates the ring.
- **Streaks / stats:** dropped.
- **Tracking Success Metrics or Commitments** (ticks, habit check-offs, a quarter-end verdict): v1 Quests are text to re-read. A verdict belongs to the rollover flow ([What a Quest is made of](issues/03-quest-anatomy.md)).
