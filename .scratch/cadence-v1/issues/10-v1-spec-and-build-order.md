# v1 spec & build order

Type: grilling
Status: open
Blocked by: 07, 08, 09

## Question

With every decision made, what is the v1 spec, and in what order is it built?

- Write `.scratch/cadence-v1/spec.md` from the resolved tickets.
- Slice it into ordered build tickets, one TDD session each. The first slice is an installable skeleton deployed to Pages at the real origin: toolchain upgrade, `base`, the service-worker update path, icons, head tags, Actions workflow ([research 02](../research/github-pages-pwa-setup.md)).
- Test strategy: real IndexedDB (e.g. `fake-indexeddb`) and real typing in place of mocked hooks; `tsc` in CI.
- On-device acceptance checklist: install, export → import round trip, update on resume, launch appearance.
- Housekeeping: stale Node 18 notes in `CLAUDE.md`; "check-in" wording in `CLAUDE.md` and spec §3.2, superseded by [The morning ritual](05-morning-ritual.md); "every edit creates a new version" in `CLAUDE.md` and spec §3.3 / "Versioning Logic", superseded by [What a Quest version is](06-quest-versions.md); the unused `public/manifest.json` and `@vitejs/plugin-react-swc`.
- Writing a Quest: build variant A from [Prototype: writing a Quest](07-prototype-writing-a-quest.md). Its keyboard handling (branch `prototype/writing-a-quest`) is a reference, not code to promote.
- Today and the app shell: build from [Prototype: the Today screen & app shell](08-prototype-morning-screen.md) (branch `prototype/today-screen`, a reference, not code to promote). Bundle and precache Plus Jakarta Sans 800 for the Main Quest.
- Visual-system leftovers (from the map's former "Visual system detail" fog): dark only, or a light look too; whether the writing screens drop the serif to match Today; a contrast check on the faintest grey.
