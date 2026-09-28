# Cadence

A minimal, local-first PWA for one iPhone: each Quarter the owner writes a Work Quest and a Life Quest, re-reads them, and may write a short Reflection on each per Day. Installed from `https://spyobird.github.io/cadence/`, a permanent address ([ADR 0001](docs/adr/0001-permanent-address-on-github-pages.md)).

## Where things are decided

- **Words:** [CONTEXT.md](CONTEXT.md). Use its capitalised terms (Quarter, Quest, Version, Draft, Reflection …) in code, tests and commits.
- **Behaviour:** [the v1 spec](.scratch/cadence-v1/spec.md). It wins over the build tickets in [.scratch/cadence-v1/build/](.scratch/cadence-v1/build/), which are built in order, one branch each.
- **Look:** [DESIGN.md](DESIGN.md). Every colour is a token from `src/index.css`.
- **Hard-to-reverse choices:** the ADRs in [docs/adr/](docs/adr/).

## Core principles

- **Minimalism:** the two Quests only. Avoid feature creep.
- **Local-first:** all data lives in IndexedDB on the phone, through `idb-keyval` with its own store. No server, no login ([ADR 0002](docs/adr/0002-data-lives-only-on-the-phone.md)).
- **Reading, not a ritual:** re-reading a Quest leaves no record; nothing counts attendance.
- **One Version per Quest per Day** ([ADR 0003](docs/adr/0003-one-version-per-quest-per-day.md)).
- **iOS first:** a Home Screen app with safe-area insets, `100dvh`, and light and dark looks.

## Code

- React 19, TypeScript strict, Vite 8, Tailwind 4, vite-plugin-pwa 1.3. Node 24, pinned in `.nvmrc`.
- `src/lib/store.ts` is the only code that touches IndexedDB, and it owns every data rule ([ADR 0004](docs/adr/0004-one-storage-key-per-quarter.md)). Date maths lives in `src/lib/quarters.ts`, the Prompts in `src/lib/prompts.ts`, and the UI reads through one hook, `useCadence()` (spec §13.3; built from slice 2).
- The service worker is registered once, in `src/lib/updates.ts`. An update reload waits while `setWriting(true)` is on (`src/lib/writing.ts`): anything that holds unsaved words sets it.
- The build stamp (`__BUILD__`) comes from `git describe`; see `scripts/build-stamp.ts`.
- Icons: `public/icon.svg` is the source; `npm run icons` regenerates the PNGs, which are committed.

## Workflow

- **TDD:** write the failing test first for every rule, using the `tdd` skill. Screen tests render the real app over a real store (`fake-indexeddb`) and type with `user-event`.
- **Before a merge to `main`:** `npx tsc --noEmit`, `npm test -- --run` and `npm run build` pass. Every push to `main` deploys to Pages through `.github/workflows/deploy.yml`.
- **Commits:** small and atomic, one per finished step.
- **Changelog:** every slice adds plain-words lines under `[Unreleased]` in `CHANGELOG.md` (spec §17). No versions or tags until the owner says so.
- **Library APIs:** check each one in Context7 (`resolve-library-id`, then `query-docs`) before writing code against it; the toolchain is newer than most training data.

## Phone testing

- **The real thing:** push to `main`, wait for the deploy, and open `https://spyobird.github.io/cadence/` on the iPhone.
- **A local build:** `npm run build && npm run preview` serves `http://localhost:4173/cadence/`. A service worker and install need HTTPS, so tunnel it for the phone (`npx ngrok http 4173`).
- **Real data lives only in the installed app.** Test in a Safari tab or a tunnel freely; never delete the Home Screen icon without a fresh Backup.
