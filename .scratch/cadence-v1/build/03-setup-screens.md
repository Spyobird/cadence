# Writing a Quest (setup)

Type: build (AFK)
Status: open
Blocked by: 02

## Goal

On the phone, Cadence opens on setup and walks through both Quests, Work then Life, one Scaffold part per screen. Setup resumes after the app is killed, and ends on "Q4 2026 is set up".

## Spec

[spec.md](../spec.md) §3.2 (Setup target), §4 (A Quest), §5 (Setup), §13.5 (Failed saves), §2.7 (Launch). Reference: [writing prototype](../prototypes/writing-a-quest.html), variant A; its keyboard handling is the model. Look: [DESIGN.md](../../../DESIGN.md), with the serif for the owner's words.

## Scope

1. **Routing:** the app shell routes on `screenFor`. This slice handles setup and resume. The other states go to a plain interim screen listing both Main Quests, which slice 4 replaces.
2. **Part screens** (§5.1): the target line and switch, the 12-tick progress bar, openings, fields and hints. On the Main Quest screen, the "Stuck?" prompts. On the Obstacle screen, "Skip for now".
3. **The keyboard:** it stays up between screens (the hidden-input parking), Return is Next, and the bar rides above the keyboard (`visualViewport`).
4. **Lists** (§5.2): Return, Backspace, Move up/down, Remove, "Add another", the cap at five, and pasted lines.
5. **Read-back and finishing** (§5.3): tap a part to change it; "Finish Work Quest"; "Finish Life Quest"; "Q4 2026 is set up".
6. **Resuming** (§5.4): the Draft is saved as typed, then "Picked up where you left off."
7. **Messages:** the blocking failed-save message and the newer-schema banner.
8. **Update reload:** setup sets the app's "something is being written" flag, so an update never reloads mid-setup.

**Tests:** screens are driven with `user-event` over the real store:
- type a whole Quest, finish it, reload, and it's still there;
- resume on the right part;
- list keys;
- switch the target;
- Next stays disabled on an empty part;
- the Obstacle can be skipped.

## Done when

- [x] The tests above pass, along with `tsc`.
- [ ] Deployed. Setting up on the phone works; the full phone check is after slice 4.
- [x] `CHANGELOG.md`: "Added: setting up a Quarter's Work and Life Quests".

## Build notes

- **Launch:** `main.tsx` opens the store before the first render and passes it to `<App store>`, which provides it. A failed read at launch shows "Couldn't open what's saved. Close and reopen Cadence, or restart the iPhone." The spec has no words for this; change them there if they're wrong.
- **Interim screen:** slice 1's placeholder, now headed by the Quarter and both Main Quests. Slice 4 replaces it.
- **Staying in setup:** finishing Life moves `screenFor` on, so the app shell keeps setup on screen until "Go to Today". Setup keeps its own target once open, so typing straight after a switch saves to the new Quarter. After Work is finished, setup follows the stored Draft on to Life rather than rebuilding it.
- **The store's rules:** `switchTargetFrom` (store.ts) decides whether the switch shows, and `switchSetupTarget` refuses by the same rule. `BLANK_SETUP_DRAFT`, `joinLines`, `isComplete` and `MAX_ITEMS` are exported for setup.
- **Buttons:** Back and Next on every part, as §5.1 says (the prototype's "Read it back" isn't used). Done when a part was opened from the read-back, and again on resuming a part once the Commitments are written. Back is disabled on Life's first part: Work is finished and can't come back into the Draft. Back, the read-back's parts and the switch wait while a Quest is being finished.
- **The Obstacle:** Return on an empty Obstacle does nothing, since skipping is a deliberate tap. An empty Obstacle is left out of the read-back (§4.1); Back reaches it. The read-back shows the words as written, with no added punctuation.
- **For slice 7:** Edit's read-back must still offer a way to add an empty Obstacle ("It can be added or emptied later by editing", §4.1). `PartScreen`, `ReadBack` and the fields in `Fields.tsx` are shaped for Edit to reuse.
- **"Picked up where you left off.":** a quiet line that stays until the first change, since nothing moves on its own. It shows when the Draft holds words or Work is finished.
- **Failed saves:** the blocking message takes focus, and with it the keyboard, so nothing more is typed under it. Its OK leaves the typed words on screen to copy. A read-only refusal doesn't show it; the banner already says why.
- **Look:** gold only on the primary button and the caret. The progress ticks use ink for now and faint for done; the focused list item's rule is `--given`. "Stuck?", "Add another" and the switch are grey sans at M. A step slides in only after a tap, never at launch.
- **Words the build wrote:** the hints for Main Quest, Why it matters, Success Metrics and Why it's exciting, and every placeholder, come from the prototype. The Commitments and Obstacle hints are the spec's. Apostrophes are straight, as in the spec.
- **Test seam:** `reopen()` waits `aMomentLater()` (50 ms) for queued saves to land, as a kill a moment after typing would. `flakyPhone()` moved to `src/test/phone.ts` for the screen tests.
- **Browser check:** headless Chrome at 390 px wide, light and dark, through part 1 with the questions open, a list, the Obstacle and the read-back. The keyboard itself waits for the phone check after slice 4.
- **Phone feedback (29 Sep):** the owner didn't like the bar floating over the words while scrolling, nor the blank space the page could scroll into. A writing screen now fills the area the keyboard leaves visible (`useVisibleArea`, `.writing-screen`): only the words scroll, the bar sits under them, and the page doesn't scroll. `Banners` renders the banners inside it.
- **Review (standards and spec):** fixed as above. Not changed: the placeholder copy "your one aim" (CONTEXT.md's own definition calls the Main Quest an aim), and tests seeding `meta` directly to stand in for a newer Cadence, as the store tests do.
