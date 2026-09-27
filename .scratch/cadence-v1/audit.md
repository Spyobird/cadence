# Baseline audit — 2026-09-27

State of the repo at `d9c476f` + 16 uncommitted files, before the v1 map. Verified by running the test suite, a strict `tsc`, a production build, and a throwaway probe test (in a scratch copy; `node_modules` in the repo is a Linux devcontainer install).

## Would lose data or block use

1. **Every launch opens onboarding** — `src/App.tsx:11` hardcodes `useState<View>('onboarding')`. Re-saving writes over the existing quests.
2. **Quest history grows exponentially** — `src/hooks/useQuests.ts:35-38` pushes the previous quest (with its own `history`) into `history`; `src/components/EvolutionLab.tsx:19` spreads `history` into the new version. Probe: 12 edits of a near-empty quest = 295 KB; ~25 edits → GBs → IndexedDB write failure.
3. **List inputs unusable on a phone** — `ListField` is declared inside `QuestForm`'s render (`src/components/QuestForm.tsx:42`), so the input remounts on every keystroke (probe: element detached after one `change`). On iOS the keyboard dismisses per character. Enter in those inputs also submits the whole form (`QuestForm.tsx:59-63`, no `preventDefault`).
4. **Pre-8am check-ins dated yesterday** — `src/components/Dashboard.tsx:29` uses `toISOString()` (UTC); the owner is UTC+8. The prompt uses the local weekday, so date and prompt disagree.
5. **Setup form is light-grey on white** — Tailwind v3 preflight doesn't reset text-input backgrounds; `QuestForm` inputs set text colour `#C0C4CC` but no background.
6. **Icons are 1×1 px placeholders** — `public/pwa-192x192.png`, `public/pwa-512x512.png`.
7. **No stable origin** — an installed web app and its IndexedDB are bound to the origin it was installed from; ngrok URLs are ephemeral.

## Significant

- **No Quarter model** — no start/end date, day counter, ring, or rollover. Onboarding's "new 90-day cycle" trigger is unimplemented.
- **Evolution Lab stale after save** — `useQuests` loads once (`useQuests.ts:59-61`), never reloads; the next edit is based on the stale copy.
- **Safe areas inert** — `index.html` lacks `viewport-fit=cover`, so `env(safe-area-inset-*)` is 0; status-bar style `default`; the fixed bottom nav overlaps content and the home indicator.
- **Check-in semantics loose** — each save appends (duplicates per day); "Saved!" resets after 2 s (`Dashboard.tsx:49`), so the app doesn't know you've checked in today.
- **No backup/export**, no `navigator.storage.persist()`.
- **Tests hide real bugs** — hooks are mocked and inputs set via `fireEvent.change`, which is how bugs 1–3 passed. `EvolutionLab.test.tsx` is `expect(true)`. 55/55 pass.
- **No typecheck** — no `typescript` dependency, no `tsconfig.json`; strict `tsc` reports 5 errors (`App.tsx` prop types, `QuestForm.tsx:61` `e.target.value`, `useQuests.ts:55` initial state).
- **Fresh install fails** — `npm install` ERESOLVE: `vitest@^3.2.6` vs `@vitest/coverage-v8@^4.1.9` peer. `@vitejs/plugin-react-swc` still listed though unused.
- **PWA config drift** — service worker registered twice (`injectRegister: 'script'` + `registerSW` in `main.tsx`); stray `public/manifest.json` (white theme) unused; dev-mode SW enabled; `apple-touch-icon` points at the 192 px file.
- **Design mostly unbuilt** — none of `DESIGN.md`'s ring, rhythm strip, typography, or motion exist; colours are hardcoded hex in every class rather than tokens. Steel-Gray `#64748B` on `#0F1113` ≈ 4.0:1 (below AA 4.5:1 for small text).
- **Uncommitted work** — 16 files, including `DESIGN.md`, `CLAUDE.md`, SW registration.

## Sound

- Small, readable component structure (~600 lines); build emits a valid `manifest.webmanifest` and Workbox `sw.js` precaching the app shell.
- Weekly prompt rotation (`src/constants/prompts.ts`) matches the spec.
