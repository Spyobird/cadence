# Installable skeleton at the real address

Type: build (HITL: the owner creates the repo, picks the icon, and runs the phone check)
Status: open
Blocked by: none

## Goal

Cadence installs from `https://spyobird.github.io/cadence/` on the iPhone. It runs on the new toolchain, updates itself when reopened, and shows a placeholder. The old app is gone. The head tags are proven on the phone before any real data exists.

## Spec

[spec.md](../spec.md) §2 (Platform and delivery), §14 (Tests), §15.2 (Head and install checks), §16 (Housekeeping), §17 (Changelog). Research: [GitHub Pages + PWA](../research/github-pages-pwa-setup.md), [status bar](../research/ios-status-bar-appearance.md).

## Scope

**The owner, first** (a checklist for the owner):

1. On github.com, create the empty **public** repo `spyobird/cadence`. No README or licence, so the first push is clean.
2. Settings → Pages → Build and deployment → Source: **GitHub Actions**.
3. Give the agent the remote URL. Pushing needs your git credentials on this Mac.

**The agent:**

1. **Rename and branch:** rename `master` to `main`, then work on the branch `build/01-skeleton`.
2. **Delete the old app** and the rest of §16's slice 1 rows. Keep `src/test/setup.ts` if it's still useful.
3. **Toolchain** (§2.2): check each library in Context7 first. Add `.nvmrc` (24), `tsconfig.json` (strict), and the Tailwind 4 `@theme` tokens for both looks from DESIGN.md.
4. **PWA config** (§2.3), the **head** (§2.4), **icons** (§2.5) and the **build stamp** (§2.6).
   - **Icon:** draft 2–3 SVG variants of the day ring, and the owner picks one before the PNGs are generated.
   - **Update reload:** gate it on one app-wide "something is being written" flag, which later slices set. Here it's always false.
5. **Launch** (§2.7): standalone detection, the Safari-tab banner and `persist()`.
6. **The placeholder:** "Cadence" and the build stamp, plus two temporary pieces for check steps 5 and 7, both removed in slice 4:
   - an Appearance switch (System / Light / Dark, not stored);
   - a readout of `env(safe-area-inset-top)`, `innerHeight` and `screen.height`.
7. **Deploy workflow** (§2.1): `.github/workflows/deploy.yml` with `fetch-depth: 0`.
8. **Docs:** update `CLAUDE.md` (§16), and start `CHANGELOG.md` with its first `[Unreleased]` lines (§17).
9. **Clean up** the stale `prototype/*` and `worktree-agent-*` branches and worktrees (§16).
10. **Ship it:** merge into `main`, push, and confirm the deploy is live at the address.

**Tests:**

- the build stamp's fallback (`dev`);
- the banner shows only when not standalone;
- the Appearance switch sets `data-look` and `theme-color`.

## Done when

- [ ] `npm ci && tsc --noEmit && npm test -- --run && npm run build` pass on Node 24, locally and in Actions.
- [ ] `https://spyobird.github.io/cadence/` serves the placeholder, with its build stamp.
- [ ] The owner has run the head and install checks (§15.2, steps 1–10). The results, with the iOS version, are recorded under `## Phone check` in this ticket.
- [ ] Recorded: whether the in-app Appearance control stays (step 5), and whether splash images are needed (step 8). Any fix they need is a new build ticket, blocking slice 4.
- [ ] If the head changed after the first install, the owner has re-added the icon.

## Build notes

- **Icon:** the owner chose draft A, the Quarter in progress ([DESIGN.md](../../../DESIGN.md#icon)).
- **Update reload:** as the spec says, a new build waits and reloads the next time the page is shown with nothing being written; it never reloads while Cadence is on screen. So check step 9 takes two reopens: the first finds the update, the second shows it.
- **Placeholder extras:** besides the two temporary pieces, a list of 40 rows gives check step 6 a long page to scroll. It goes with them in slice 4.

## Phone check

iOS version:

| # | Check | Result |
|---|---|---|
| 1 | Installs from Share → Add to Home Screen; icon and name "Cadence" | |
| 2 | Light: strip `#F4F5F7`, dark glyphs | |
| 3 | Dark: strip `#0F1113`, light glyphs | |
| 4 | Control Centre flip while open: strip follows without relaunch? | |
| 5 | Placeholder switch (Light on a Dark phone, and the reverse): strip follows? **Decides whether the in-app control stays.** | |
| 6 | Scroll the rows: nothing blurs at the top, nothing under the strip | |
| 7 | `100dvh` fills with no bottom gap; build stamp clears the home indicator. Readout: inset top / innerHeight / screen.height | |
| 8 | Launch without splash images, light and dark: what shows before first paint? **Decides whether splash images are needed.** | |
| 9 | Push a trivial change, wait for the deploy, reopen from the app switcher (finds the update), then leave and reopen again: build stamp changes | |
| 10 | Safari tab shows the red banner; Home Screen doesn't | |
