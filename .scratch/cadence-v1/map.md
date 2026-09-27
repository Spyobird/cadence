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
  - Morning screen with the daily prompt.
  - Quest view/edit, with every save kept as a version, plus a simple history list.
  - Quarter-progress ring.
  - Plain Archive feed.
  - Backup export **and** import; import is in so the round trip can be proven on the device.
  - A warning when Cadence is opened in a Safari tab.
- **Owner's framing:** the session happens in the morning. Cadence may be less a check-in than a vision statement re-read to stay on track, which the owner called "the stronger goal". This framing leads [The morning ritual](issues/05-morning-ritual.md). The owner wants to go deep on the Quests first.
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

## Not yet specified

- **Visual system detail:** typography (self-hosted fonts for offline), colour tuning (Steel-Gray contrast), and how much motion earns its place. Graduates once the two prototypes set the visual language.
- **On-device verification:** launch appearance without splash images, whether an update applies on resume, and status-bar behaviour on iOS 26. Can't be pinned down until something is deployed at the real origin; may graduate into build tickets.

## Out of scope

- **Cloud sync, accounts, multi-device:** one phone, local-first.
- **Reminders / push notifications:** would need a server; an iOS Reminder covers it.
- **Migrating existing data:** none worth keeping.
- **App Store / native wrapper:** the point is to avoid it.
- **Quarter rollover flow:** post-v1, needed before 1 Jan 2027. The data model must still know about Quarters from day one ([Quarter boundaries](issues/04-quarter-boundaries.md)).
- **Comparing Quest versions:** post-v1.
- **Motion polish (check-in pulse, screen slides):** post-v1 unless it comes almost free.
- **Archive filters:** post-v1.
- **Rhythm strip:** dropped; it duplicates the ring.
- **Streaks / stats:** dropped.
- **Tracking Success Metrics or Commitments** (ticks, habit check-offs, a quarter-end verdict): v1 Quests are text to re-read. A verdict belongs to the rollover flow ([What a Quest is made of](issues/03-quest-anatomy.md)).
