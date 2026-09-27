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
- Housekeeping: stale Node 18 notes in `CLAUDE.md`; the unused `public/manifest.json` and `@vitejs/plugin-react-swc`.
