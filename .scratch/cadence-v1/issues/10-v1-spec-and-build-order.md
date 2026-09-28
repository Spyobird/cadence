# v1 spec & build order

Type: grilling
Status: resolved
Assignee: Spyobird
Blocked by: 07, 08, 09

## Question

With every decision made, what is the v1 spec, and in what order is it built?

- Write `.scratch/cadence-v1/spec.md` from the resolved tickets.
- Slice it into ordered build tickets, one TDD session each. The first slice is an installable skeleton deployed to Pages at the real origin: toolchain upgrade, `base`, the service-worker update path, icons, head tags, Actions workflow ([research 02](../research/github-pages-pwa-setup.md)).
- Test strategy: real IndexedDB (e.g. `fake-indexeddb`) and real typing in place of mocked hooks; `tsc` in CI.
- On-device acceptance checklist: install, export → import round trip, update on resume, launch appearance.
- Housekeeping: stale Node 18 notes in `CLAUDE.md`; "check-in" wording in `CLAUDE.md` and spec §3.2, superseded by [The morning ritual](05-morning-ritual.md); "every edit creates a new version" in `CLAUDE.md` and spec §3.3 / "Versioning Logic", superseded by [What a Quest version is](06-quest-versions.md); the unused `public/manifest.json` and `@vitejs/plugin-react-swc`; `CLAUDE.md`'s "`useQuests`, `useReflections`" and project structure, superseded by `store.ts`, `quarters.ts` and `useCadence()` ([Data layer & storage schema](09-data-layer.md)); the `uuid` dependency, unused once Reflections are keyed by date; the stale `src/test-db.ts` and its `CLAUDE.md` command.
- Data layer: build `src/lib/quarters.ts`, `src/lib/store.ts` and `useCadence()` test-first, as specified in [Data layer & storage schema](09-data-layer.md).
- Writing a Quest: build variant A from [Prototype: writing a Quest](07-prototype-writing-a-quest.md). Its keyboard handling (branch `prototype/writing-a-quest`) is a reference, not code to promote.
- Today and the app shell: build from [Prototype: the Today screen & app shell](08-prototype-morning-screen.md) (branch `prototype/today-screen`, a reference, not code to promote). Bundle and precache Plus Jakarta Sans 800 for the Main Quest.
- Visual-system leftovers (from the map's former "Visual system detail" fog): dark only, or a light look too; whether the writing screens drop the serif to match Today; a contrast check on the faintest grey.

## Answer

**The spec:** [spec.md](../spec.md) is the one document a build session reads. It's standalone, with every later ticket's changes already applied, and where it and a ticket disagree, the spec wins. Its §18 lists the small details it filled in that no ticket decided.

**Written alongside it:**

- **[DESIGN.md](../../../DESIGN.md)** is rewritten as the lasting v1 visual system: tokens for both looks, three type sizes, fonts, where gold is used, motion. It replaces the "Precision Chronometer" draft.
- **Four ADRs:**
  - [permanent address](../../../docs/adr/0001-permanent-address-on-github-pages.md);
  - [data only on the phone](../../../docs/adr/0002-data-lives-only-on-the-phone.md);
  - [one Version per Day](../../../docs/adr/0003-one-version-per-quest-per-day.md);
  - [one key per Quarter](../../../docs/adr/0004-one-storage-key-per-quarter.md).
- **[CONTEXT.md](../../../CONTEXT.md)** gains **Setup**.
- **The prototypes** are copied from their branches into [prototypes/](../prototypes/).

**Build order:** ten slices in [build/](../build/), each one TDD session on its own branch, merged into `main` when `tsc` and the tests pass.

- **In daily use:**
  1. installable skeleton;
  2. dates and the store's setup path;
  3. writing a Quest;
  4. Today.
- **Data-safe:**
  5. Backup;
  6. Reflections.
- **Complete:**
  7. Edit and History;
  8. Archive;
  9. Quarter's end;
  10. v1 acceptance.

Backup comes before Reflections because Reflections can't be recreated.

**What changed from earlier tickets:**

- **Light mode is in:** the prototype's light colours, plus a separate gold for text (`#7A5F00`), because light gold is 2.2:1 as text. A System / Light / Dark control sits in the menu and is saved in `meta.appearance`. It depends on the slice 1 phone check: if the status bar doesn't follow a scripted change, Cadence follows the phone's setting only.
- **No `black-translucent`:** [research: status bar](../research/ios-status-bar-appearance.md) found it deprecated and unable to work with light mode. The status bar is a solid strip in the page's colour, set by two `theme-color` tags. This supersedes [GitHub Pages + PWA setup](02-github-pages-pwa-setup.md)'s status-bar line.
- **The serif stays** on the writing surfaces (setup, Edit, the read-back) as in the writing prototype. Today stays sans, with the Main Quest in Plus Jakarta Sans 800.
- **The faintest grey is kept.** It's 5.2:1 on the background. On the raised grey it appears only as a disabled label.

**How it's built and checked:**

- **The old app is deleted in slice 1,** and git keeps it.
- **Toolchain:** research 02's upgrades, plus TypeScript strict, Tailwind 4 and React 19.
- **Tests:** pure logic; the store against `fake-indexeddb` with an injected clock; screens over the real store with `user-event`. `tsc` and the tests gate every deploy. There's no browser end-to-end suite.
- **Phone checks at four milestones** (after slices 1, 4 and 6, and at 10), not every slice. Slice 1's check proves the head tags before any real data exists. This graduates the map's "On-device verification" fog.
- **Build stamp:** `git describe --tags --always --dirty`, with no build time. It's on the Backup screen.
- **Changelog:** `CHANGELOG.md` in Keep a Changelog format, with every entry under `[Unreleased]`. There are no versions or tags until the owner says so.
- **Repo:** `master` becomes `main`, and the owner creates the public repo. `.scratch/` goes public too.

## Comments

**Grilling round 1 (2026-09-29):**

- **Accepted as recommended:**
  - the spec is standalone;
  - build tickets live in `build/`, worked AFK with `tdd`;
  - usable slices, in the order above;
  - the old app is deleted in slice 1;
  - the skeleton is a placeholder with the Safari banner and a build stamp;
  - the ring icon, with 2–3 drafts to pick from;
  - repo and branches: `main`, public, `.scratch/` included, prototypes copied onto `main`, a branch per slice;
  - TypeScript strict, Tailwind 4 and React 19;
  - the test strategy;
  - the contrast rule;
  - `CLAUDE.md` fixed in slice 1, `DESIGN.md` rewritten now, the old `docs/superpowers/` deleted;
  - **Setup** added to `CONTEXT.md`.
- **Changed:**
  - phone checks happen after a meaningful amount of work, not every ticket;
  - light mode is added, because the owner likes the colours;
  - the writing screens keep what the prototype decided;
  - the owner asked for ADRs as needed and a changelog in Keep a Changelog format.

**Round 2:**

- Phone checks after slices 1, 4, 6 and 10.
- Light mode with the gold split.
- The owner doesn't mind an in-app Appearance toggle.
- The serif is option (a): writing surfaces in serif, Today in sans.
- The changelog keeps everything under `[Unreleased]`, and the owner says when to tag.
- The build stamp needed thought; the owner asked whether it was the best option.
- The ADRs were accepted.

**Round 3:**

- The Appearance toggle is System / Light / Dark, saved in `meta`.
- The build stamp is `git describe --tags --always --dirty` through Vite's `define`, and the owner asked what it contains. Explained: nearest tag, commits since, short hash, and `-dirty` for local builds with uncommitted edits.
- The build time was dropped.

**Round 4**, after [research: status bar](../research/ios-status-bar-appearance.md):

- The head tags were accepted, and the owner asked to test them on the phone too. They're steps 2–8 of slice 1's check.
- The toggle is option (a): kept, and proven or dropped at slice 1's check.
