# Cadence v1 spec

Written 2026-09-29 from the resolved tickets on the [Cadence v1 map](map.md). It is the one document a build session reads. The rest of the documentation divides up like this:

- The words are defined in [CONTEXT.md](../../CONTEXT.md). This spec uses them with capitals (Quest, Version, Day …).
- The look is in [DESIGN.md](../../DESIGN.md).
- Why the hard-to-reverse choices were made is in the ADRs: [0001](../../docs/adr/0001-permanent-address-on-github-pages.md), [0002](../../docs/adr/0002-data-lives-only-on-the-phone.md), [0003](../../docs/adr/0003-one-version-per-quest-per-day.md) and [0004](../../docs/adr/0004-one-storage-key-per-quarter.md).
- The build is sliced into [build tickets](#15-build-order).

**Precedence:** where this spec and a ticket disagree, the spec wins, because it already applies every later ticket's changes. The prototypes ([writing a Quest](prototypes/writing-a-quest.html), [Today](prototypes/today-screen.html) `?variant=3`) are references for behaviour and feel, not code to promote.

---

## 1. What v1 is

Cadence is a vision statement to re-read casually, at any time of day. It is not a ritual and not a check-in. Each Quarter the owner writes two Quests, Work and Life, re-reads them whenever they like, and may write a short Reflection on each one per Day.

**In v1:**

- Cadence installs from `https://spyobird.github.io/cadence/` with a real icon and proper iOS chrome, in light and dark.
- A data layer that knows about Quarters, and that can't corrupt itself.
- Setup of a Quarter's two Quests.
- Today: the ring, both Quests, the day's Prompt and optional Reflections.
- Editing a Quest, with at most one Version per Day, and a History list.
- A plain Archive of Reflections.
- Backup export and import.
- A warning when Cadence is opened in a Safari tab.

**Not in v1** (see the map's [Out of scope](map.md#out-of-scope)): sync or accounts, reminders, migrating old data, a native wrapper, the Quarter rollover flow (review, verdict, carry-over), comparing Versions, motion polish, Archive filters, streaks or stats, tracking Success Metrics or Commitments.

**Standing rules for the owner** (also in the Backup screen's note, [ADR 0002](../../docs/adr/0002-data-lives-only-on-the-phone.md)):

- Export before any origin change (custom domain, account or repo rename, new host).
- Never delete the Home Screen icon without a fresh export.
- Never keep real data in a Safari tab.

---

## 2. Platform and delivery

### 2.1 Hosting

- **Repo:** the public GitHub repo `spyobird/cadence`, default branch `main`.
- **Address:** Pages serves it at `https://spyobird.github.io/cadence/`. This is permanent ([ADR 0001](../../docs/adr/0001-permanent-address-on-github-pages.md)).
- **Deploys:** the official Actions flow (`upload-pages-artifact` + `deploy-pages`) runs on every push to `main`. It's gated on `npm ci`, `tsc --noEmit`, `npm test -- --run` and `npm run build`.
- **Checkout:** `fetch-depth: 0`, so the build stamp can see tags.

### 2.2 Toolchain

- **Runtime:** Node 24, pinned in `.nvmrc`.
- **Build:** Vite 8, `@vitejs/plugin-react` 6 and vite-plugin-pwa 1.3.
- **App:** React 19, TypeScript strict (with a `tsconfig.json`), and Tailwind 4 with the tokens from DESIGN.md in `@theme`.
- **Tests:** vitest 4.1 with coverage-v8 4.1, jsdom, Testing Library, `@testing-library/user-event` and `fake-indexeddb`.
- **Storage:** `idb-keyval` 6.3.
- **Removed:** `@vitejs/plugin-react-swc` and `uuid`.
- **Library APIs:** every one of them is checked in Context7 before use (`CLAUDE.md`).

### 2.3 PWA config

The full sketch is in [research: GitHub Pages + PWA](research/github-pages-pwa-setup.md). The status-bar line there is superseded by §2.4.

- **Base and scope:** `base: '/cadence/'`; manifest `id`, `start_url` and `scope` are `/cadence/`. Name and short name are "Cadence". `display: standalone`. `theme_color` and `background_color` are `#0F1113`, because the manifest holds one colour.
- **One registration:** register the service worker once, in `main.tsx`. That means no `injectRegister: 'script'` and no dev-mode service worker. Delete the stray `public/manifest.json`.
- **Precache:** the app shell, the icons and the Plus Jakarta Sans 800 font file.
- **No code-splitting:** one bundle, so a page running the old code never asks for a chunk the new service worker has dropped.

**Updates** (what they fix: every deploy used to wait until the app was killed):

1. `registerType: 'autoUpdate'`, so `skipWaiting` and `clientsClaim` are on.
2. Check with `registration.update()` hourly, and whenever the page becomes visible (`visibilitychange`). Resuming a Home Screen app isn't a navigation, so it doesn't check by itself.
3. When a new version is ready, `onNeedReload` defers the reload. The page reloads the next time it's visible **and** nothing is being written: no Reflection popup, no setup screen and no edit open. Setup and edit Drafts survive a reload anyway; the popup's text wouldn't.

### 2.4 iOS head

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" media="(prefers-color-scheme: light)" content="#F4F5F7">
<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0F1113">
<meta name="apple-mobile-web-app-title" content="Cadence">
<link rel="apple-touch-icon" href="/apple-touch-icon-180x180.png" sizes="180x180">
```

- **No `apple-mobile-web-app-status-bar-style` tag.** `black-translucent` is deprecated and can't work with light mode ([research: status bar](research/ios-status-bar-appearance.md)). The status bar is a solid strip in the page's colour, and nothing is drawn under it.
- **Backgrounds:** `html` and `body` take `--void` for the look in use, with a matching `color-scheme`.
- **Full height:** full-height screens use `100dvh`, never `100vh`.
- **Launch:** no splash images for now. They're added only if the launch looks wrong on the phone.
- **Fixed at install:** the status-bar mode is set when the icon is added. So these tags are proven at the slice 1 phone check, before any real data exists (§13).

### 2.5 Icons

- **Design:** the day ring, gold on `#0F1113`. Build slice 1 drafts 2–3 variants as SVG, and the owner picks one.
- **Files:** the vite-pwa assets generator makes an opaque 180 × 180 `apple-touch-icon` plus 192 and 512 manifest icons. The files are committed.

### 2.6 Build stamp

- **What it is:** at build time, `vite.config.ts` runs `git describe --tags --always --dirty` and injects the result through `define` as `__BUILD__`. If git isn't available, it's `dev`.
- **What it reads:**
  - `3f2c1a9` before any tag;
  - `v1.0.0` on a tagged commit;
  - `v1.0.0-4-g3f2c1a9` four commits later;
  - `3f2c1a9-dirty` for a local build with uncommitted edits.
- **Where it shows:** "Build 3f2c1a9" at S size, faint. It's on the slice 1 placeholder, then at the foot of the Backup screen.

### 2.7 Launch

- **Standalone:** detected by `navigator.standalone` or `(display-mode: standalone)`.
- **As a Home Screen app:** call `navigator.storage.persist()` on every launch.
- **In a Safari tab:** a red banner across the top reads "Open Cadence from your Home Screen", with the reason: "In a Safari tab, what you write is kept by Safari, apart from the Home Screen app, and Safari can erase it." Cadence still works and saves underneath it.

### 2.8 Appearance

- **The control:** a three-way **Appearance** control in the menu: System (the default), Light, Dark. It's saved in `meta.appearance`.
- **Applying it:** set `data-look` on `<html>`, `color-scheme`, and the `theme-color` content to match. Apply it before first paint, so a choice that differs from the phone doesn't flash: a `localStorage` mirror read by an inline script in `index.html` is fine, as long as `meta` stays the source.
- **Depends on a phone check:** the slice 1 check tests whether the status bar follows a scripted change. If it doesn't, the control is dropped and Cadence follows the phone's setting only (§13).

---

## 3. Quarters and Days

- **Quarter:** a calendar quarter, keyed like `2026-Q4`. Its length is 90–92 days (Q4 2026 is 92, Q1 2027 is 90).
- **Day:** Day N is the date's position within its Quarter, counted from the Quarter's first day by the phone's current local date. No time zone is stored. Before the first day, the Day is "before Day 1".
- **Today:** the phone's local date, rolling over at local midnight. Today's screen re-reads the date when the page becomes visible and at local midnight.
- **Current, Upcoming and Past:** the Current Quarter contains today. The Upcoming Quarter is the one after it. A Past Quarter's last day has gone, and from local midnight after that day it is read-only forever.
- **Set up:** a Quarter is set up once both of its Quests are finished. A Quest is finished once it has a Version.

### 3.1 Which screen Cadence opens on

`screenFor(snapshot, today)` in `quarters.ts` applies these rules in order. The first that matches wins.

| # | State | When | Screen |
|---|---|---|---|
| 1 | **running** | The Current Quarter is set up | Today |
| 2 | **before Day 1** | The Upcoming Quarter is set up | Today for the Upcoming Quarter: "Starts in N days" |
| 3 | **resume** | A setup Draft exists for the Current or the Upcoming Quarter | Setup, where it was left |
| 4 | **ended** | An earlier Quarter is set up | Today for the latest set-up Quarter, read-only, with "Set up Q1 2027" |
| 5 | **setup** | Nothing above | Setup, blank, aimed at the default target (§3.2) |

**Edge cases:**

- **Today's situation:** on 29 Sep, with Q3 never set up, setup defaults to Q4. Once Q4 is set up, Cadence shows Q4 "before Day 1". Until then, it resumes Q4's Draft.
- **Running:** if the Upcoming Quarter is also set up, the screen stays on the Current Quarter until it ends. The next day it becomes the Current Quarter.
- **Resume before ended:** on 1 Jan, with Q4 over and a Q1 2027 Draft started in December, Cadence resumes that Draft.
- **Ended:** if a Quarter was skipped entirely, the screen shows the latest set-up Quarter, and the button sets up the Current Quarter.
- **Frozen Drafts:** a Draft whose Quarter has become a Past Quarter is frozen. It's kept in storage and the Backup, and never shown or resumed. It doesn't count for "resume".

### 3.2 Setup target

- **Default:** the Current Quarter. In its last 14 days (18–31 Dec for Q4), the default is the Upcoming Quarter instead.
- **The switch:** the top of setup names the target, "Q4 2026 · 1 Oct – 31 Dec", with a one-tap "Switch to Q3 2026" to the other of the two. Switching is allowed only until the Work Quest is finished, and it keeps the Draft's words.
- **After saving:** the target is fixed once a Quest is saved.
- **Starting mid-quarter** changes nothing: set up on 20 Oct, it's "Day 20 of 92", and the ring starts part-filled.

---

## 4. A Quest

Every Quarter has exactly two Quests, **Work** then **Life**, in that order everywhere (setup, Today, the menu, the History, the Archive, the Backup).

### 4.1 The Scaffold

A Quest is written by completing the Scaffold's openings. `{Domain}` is Work or Life. `{end}` is the Quarter's last day, written like "31 December 2026".

| # | Part | Opening | Required |
|---|---|---|---|
| 1 | Main Quest | "My {Domain} Main Quest is to" | Yes |
| 2 | Why it matters | "This is the single most important thing for me to accomplish this quarter because completing it would" | Yes |
| 3 | Success Metrics | "By {end}, I'll have:" then a numbered list | Yes, 1–5 items |
| 4 | Why it's exciting | "This feels really exciting and compelling for me because" | Yes |
| 5 | Obstacle | "What's most likely to get in my way is" | No |
| 6 | Commitments | "To make sure I complete the Quest, I'm going to:" then a numbered list | Yes, 1–5 items |

**Hints** (faint, under the field):

| Part | Hint |
|---|---|
| Obstacle | "What's the one thing most likely to stop you, and what will you do about it? Optional." Its placeholder is "what could stop you". |
| Commitments | One habit with a *when* ("every Monday 9–11am, deep work") and one action with a *by when*. |
| Other parts | The build writes a short hint in the same voice. |

**Rules:**

- **One line each:** every part and every list item is one line of prose, with no line breaks and no length cap.
- **Lists:** 1–5 items, a hard cap at five. The owner orders them, and they're numbered when read back.
- **Obstacle:** the only optional part. Setup still asks for it, and skipping it is a deliberate tap ("Skip for now"). It can be added or emptied later by editing. If it's empty, it's left out wherever the Quest is shown.
- **Complete or not:** a Draft may be incomplete; a finished Quest may not.
- **Nothing is tracked:** Success Metrics and Commitments are text to re-read. A done one-off Commitment is edited out, which makes a new Version.

### 4.2 Prompts to find it

"Stuck? Four questions to help find it" is a link on the Main Quest screen. It opens four thinking aids; their answers aren't saved.

- **Work:**
  - What's the one thing that, if accomplished, would move the needle the most?
  - Fast-forward to {end}: what one accomplishment would make you proudest?
  - What's the one thing that would make everything else easier or unnecessary?
  - What have you been postponing that you know would be transformative?
- **Life:**
  - What's the one thing that would bring the most joy, fulfilment, or peace to your personal life?
  - Fast-forward to {end}: what one accomplishment would make you feel proudest?
  - What's the one change that would positively impact every other area of your life?
  - What have you been avoiding that would transform your relationships or happiness?

### 4.3 Text tidy-up on save

- **Quest parts and list items:** trimmed; a pasted line break becomes a space; empty list items are dropped.
- **Reflections:** trimmed at the ends only, and line breaks are kept. A Reflection that's only spaces is empty.
- **Comparing:** "changed" (which enables Save) and "identical" (which drops a Version) both compare the tidied text.

---

## 5. Setup

Variant A from the [writing prototype](prototypes/writing-a-quest.html): one Scaffold part per screen, then a read-back.

### 5.1 A part screen

- **Top:** the target line and its switch (§3.2). Under it, a 12-tick progress bar (6 for Work, then 6 for Life) and "Work Quest, part 2 of 6".
- **The words:** the opening in `--given` sans at L size. The owner's words continue it right below in serif ink at L size, then the hint.
- **Capitals:** parts that continue a sentence aren't auto-capitalised (Main Quest, Why it matters, Why it's exciting, Obstacle). List items are.
- **The bar above the keyboard:** Back and Next. Next stays disabled until the part is written. On the Obstacle screen, "Skip for now" takes Next's place while the field is empty.
- **Return is Next** (`enterkeyhint="next"`), and the keyboard stays up from screen to screen.

**Keyboard handling:** the prototype is the reference. It parks focus on a hidden 16 px input between screens, so iOS keeps the keyboard up, and it keeps the bar above the keyboard with `visualViewport`.

### 5.2 Lists (Success Metrics, Commitments)

- **Return:** on a written item, it adds the next item. On an empty item, it leaves the list and moves on.
- **Backspace** on an empty item removes it.
- **Tools:** the focused item shows Move up, Move down and Remove.
- **Adding:** "Add another" sits under the list. At five, it reads "That's five, the most a list holds."
- **Pasting:** pasted lines become separate items, up to five.

### 5.3 Read-back and finishing

- **The read-back:** after Commitments comes the whole Quest, as it reads back: each opening in grey sans, then the owner's words in serif ink. The Main Quest part is at L size, the rest at M. Tapping a part opens its screen, and Done returns to the read-back.
- **Finishing Work:** "Finish Work Quest" (the primary button) makes Version 1 and clears Work's part of the setup Draft. Setup moves on to Life, part 1.
- **Finishing Life:** "Finish Life Quest" leads to "Q4 2026 is set up", with one button to Today.

### 5.4 Drafts and resuming

- **Saved as typed:** the setup Draft (`setup:2026-Q4`) keeps its words and its position (which Quest, which part) as the owner types.
- **Resuming:** reopening Cadence resumes on the same Quest and part, with "Picked up where you left off."
- **Setup started from Today** (for the Upcoming Quarter, §6.4): it has a Close button back to Today while the Current Quarter is set up, and the Draft stays.

---

## 6. Today

Built from the [Today prototype](prototypes/today-screen.html) (`?variant=3`) and [DESIGN.md](../../DESIGN.md).

### 6.1 Layout

1. **Top:** the day ring, with the date under it ("Thursday 12 Nov") and the menu button top right.
   - The ring has one tick per Day, and today's tick is gold. Its middle reads "43" over "of 92".
2. **Boundary line:** at most one quiet line under the date (§6.4).
3. **The two pages:** "Work" and "Life" sit under the ring, with a gold dot under the page in view. There is one page per Quest, Work first. Swipe or tap to switch.
4. **Each page:**
   - "My Work Main Quest is to" small and faint, then the Main Quest at L size in Plus Jakarta Sans 800. It continues the sentence, so it's shown as stored, starting in lower case.
   - "Read the whole Quest" unfolds the other parts, and "Fold it away" folds them back. Pages open folded every time.
   - Each unfolded part shows its name small and faint ("Why it matters", "Success Metrics" …) above the owner's words, with a hairline between parts. The words start with a capital here (display only; the stored text is unchanged). Lists are numbered. An empty Obstacle is left out. The Scaffold's openings don't appear on Today.
   - The page ends with that Quest's Reflection area (§7).

The fold state and the page in view are UI-only and never stored.

### 6.2 Reading, not a ritual

- Opening Cadence and reading leaves no record, and nothing counts attendance.
- Nothing on Today may read as a check-in, a streak or a task to complete.

### 6.3 The menu

One button, top right, opens a bottom sheet. There is no tab bar. The sheet holds:

- "Q4 2026" and "Day 43 of 92, 49 to go" (before Day 1: "Starts in 2 days").
- **Work Quest** and **Life Quest** rows, each with **Edit** and **History**. The Edit button reads "Edit · unsaved changes" when that Quest has an edit Draft.
- **Archive**, with the number of Reflections.
- **Backup**, with when the last backup was ("3 days ago", "Never").
- **Appearance:** System · Light · Dark (§2.8).

**Backup due:** the menu button shows a gold dot, and the Backup row's time turns `--gold-text`, when any of these is true:

- no backup has been made;
- the last one is 7 or more days old;
- the latest set-up Quarter has ended since the last backup.

### 6.4 Boundary states

Each is one quiet line under the date (from [Quarter boundaries](issues/04-quarter-boundaries.md), accepted through four prototype rounds).

- **Before Day 1:**
  - The ring is empty, and its numeral counts the days to go ("2" over "days to go").
  - The date line reads "Starts Thursday 1 Oct".
  - Quests are readable and editable. The Reflection area reads "Reflections start on Day 1, Thursday 1 Oct."
- **Last 14 days**, Upcoming Quarter not set up: "Q1 2027 starts in 12 days. Set it up", with "Set it up" in `--gold-text`, opening setup for the Upcoming Quarter. With a setup Draft started, the link reads "Finish setting it up".
- **Last 14 days**, Upcoming Quarter set up: "Q1 2027 is set up. It takes over on 1 Jan."
- **Ended**, next Quarter not set up:
  - The ring is full. The line reads "Q4 2026 is over. Its Quests are kept as they were."
  - A primary "Set up Q1 2027" button, with an "Export a backup first" link to the Backup screen.
  - Edit is hidden; History stays readable. The Reflection area reads "Reflecting starts again once Q1 2027 is set up."
- **Safari tab:** the red banner on top (§2.7), in any state.

---

## 7. Reflections and Prompts

### 7.1 Rules

- **Optional:** a Reflection is a free-text note about one Quest, written on a Day.
- **Text:** line breaks are allowed, and there's no length cap.
- **How many:** at most one per Quest per Day, so Work, Life, either, both or neither. Saving again replaces it.
- **Where it's allowed:** only for today's date, and only on a Day of a set-up Quarter (not before Day 1, and not in the ended state).
- **Editing:** a Reflection is editable until local midnight, then read-only. There's no history, no backfill for a missed Day, and the Archive shows no gaps.
- **Its Prompt:** it keeps a copy of the Day's Prompt.
- **No Version:** it doesn't record a Version.
- **Midnight:** a save carries the date it's saved on. A Reflection saved at 00:01 is the new Day's, with that Day's Prompt. If the Quarter ended at that midnight, the save is refused with "Q4 2026 ended at midnight, so this can't be saved." The text stays in the field so it can be copied.

### 7.2 The Prompts

One per weekday, shared by both Quests. Each is shown as a thinking aid, not a question to answer. These replace `src/constants/prompts.ts`.

| Day | Prompt |
|---|---|
| Mon | What is the one thing that must happen this week to feel real progress on this Quest? |
| Tue | What's a small win from the last 24 hours that shows you're on track? |
| Wed | What's the next step that would move this Quest forward? |
| Thu | What's getting in the way right now, and what will you do when it shows up? |
| Fri | Looking at the week so far, are your Commitments actually moving your Success Metrics? |
| Sat | How do you actually feel about your progress right now: energized, drained, or neutral? Why? |
| Sun | Looking at next week, what's one specific change you could make to your Commitments? |

### 7.3 On the page

- **Nothing written today:** "Write today's Reflection", a pen icon and the words in `--gold-text` inside a thin `--gold-dim` pill, under the Quest.
- **Saved:** the Reflection's text beside a dim gold rule, with "Edit today's Reflection" under it.

### 7.4 The popup

A box centred over the blurred page, sized to the visible viewport.

- **Contents:** "Work, Thu 12 Nov", the day's Prompt, a field, and Cancel / Save. The keyboard comes up at once.
- **Save:** disabled until something changes. Emptying a saved Reflection turns Save into Remove.
- **Reopening a saved one:** it notes "You can change it until midnight."
- **Cancel:** with nothing changed, it just closes. With changes, it asks "Discard what you wrote?" (Discard / Keep writing).

---

## 8. Edit

Edit uses the same surface as setup.

- **Opening it:** Edit (from the menu) opens the read-back with **Cancel** left, the title "Work Quest" centred, and **Save** right.
- **Changing a part:** tapping a part changes it on its own screen (§5.1, without the setup progress bar). Done returns to the read-back. Changed parts are marked with a dim gold rule.
- **Save:** disabled until something has changed and every required part is written. A note under the title says why, in this order:
  - "No changes yet";
  - "Main Quest can't be empty" (or whichever part is empty);
  - "Add at least one Success Metric" (or Commitment).
- **The Obstacle** can be left empty.
- **Cancel with changes:** asks "Discard your changes?" (Discard changes / Keep editing).
- **The Draft:** saved as typed (`edit:2026-Q4:work`, with when it started). It survives the app closing and across Days. Reopening Edit on that Quest restores it, with "Your unsaved changes from 10:42 are still here." On an earlier Day, it reads "from Thu 10:42". The Draft is deleted once it matches the saved Version again. Cadence itself still opens on Today.
- **Saving:** it makes today's Version (§10), and Today shows it at once.
- **Not in the ended state:** Edit is hidden once the Quarter has ended. An edit still open at that midnight can't be saved. Save is refused with "Q4 2026 ended at midnight, so this can't be saved.", and the Draft is frozen with the Quarter.

---

## 9. History

- **One per Quest,** reached from the menu. It lists the Versions newest first.
- **Rows:** each row shows the date and Day ("12 Nov · Day 43") and that Version's Main Quest, clamped to two lines. The newest row is marked "Current". A Version from before Day 1 reads "29 Sep · before Day 1".
- **Opening a row:** tapping it opens that whole Version, read-only, laid out as the read-back.
- **Leaving things out:** no version numbers, no comparing, no restore, no notes.
- **Past Quarters** stay readable only through the ended state, until the next Quarter is set up. After that, past Quarters aren't browsable in v1: they're kept in storage and the Backup, and their Reflections stay in the Archive.

---

## 10. Versions

One Version per Quest per Day ([ADR 0003](../../docs/adr/0003-one-version-per-quest-per-day.md)):

- **Version 1** is made when a Quest is first finished. Setup Draft saves are never Versions.
- **Before Day 1,** every save replaces Version 1. It's dated by its last save.
- **From Day 1,** a Quest has at most one Version per Day. Saving again that Day replaces the Day's Version. A save belongs to the Day it's made on: start at 23:50, save at 00:05, and it's the new Day's.
- **No change, no Version:** if a Day's Version ends up identical to the Version before it, it's dropped.
- **Complete only:** only a complete Quest can be finished or saved. An edit can't turn a finished Quest back into a Draft.
- **Past Quarters:** nothing changes a Past Quarter's Versions.

---

## 11. Archive

- **Contents:** every Reflection, across all Quarters, grouped by Day, newest Day first.
- **Each Day:** its header reads "Thu 12 Nov · Day 43", with the year added when it isn't the current year. Under it sits that Day's stored Prompt, then Work's Reflection and then Life's, each labelled.
- **Read-only.** Today's Reflections are edited from Today.
- **Empty:** it reads "No Reflections yet."

---

## 12. Backup

### 12.1 The Backup screen

- **Status:** the last backup ("Last backup: Mon 12 Oct, 3 days ago" or "No backup yet"), and the storage status: "On this iPhone, marked persistent" (from a live `navigator.storage.persisted()`), or the Safari-tab warning.
- **Export backup:** the primary button.
- **Import a backup:** a secondary button.
- **A note:** "Export before deleting Cadence from your Home Screen. Deleting the icon erases everything in it."
- **At the foot:** the build stamp (§2.6).

### 12.2 Export

- **The file:** `cadence-backup-YYYY-MM-DD.json`, holding `{ app: "cadence", schemaVersion, exportedAt, data }`. `data` is every stored key, Drafts included, so a restore puts the phone back exactly as it was.
- **Sharing:** Web Share with a file, called inside the tap handler, then Save to Files. The fallback is an `<a download>` Blob.
- **When it counts as made:** when the share sheet finishes without Cancel (Save to Files, AirDrop and Mail all count), or when the fallback download starts. This sets `lastBackupAt`.

### 12.3 Import

1. **Pick:** Import opens the Files picker (`<input type="file">`).
2. **Check first:** the whole file is checked before anything is touched. It must be a Cadence backup, its `schemaVersion` can't be newer than the app's, and every record must be valid. An older schema is migrated. A failed check shows one of:
   - "This isn't a Cadence backup."
   - "This backup is from a newer Cadence. Update Cadence first."
   - "This backup is damaged and can't be used."
3. **Preview:** "Replace everything with this backup?" with "Backup from Mon 12 Oct 2026 · Q4 2026 · 43 Reflections", listing every Quarter the backup contains.
4. **The three options:**
   - **Export what's here first:** runs an export, then returns to this choice.
   - **Replace everything:** clears the store and writes the backup in one transaction, then sets `lastBackupAt` to the backup's `exportedAt`.
   - **Keep what's here:** cancels.

**Restoring onto a fresh install:** blank setup has no menu, so while nothing is stored its first screen shows a quiet "Restore from a backup" link. It opens the Backup screen, with Close back to setup, and it goes once anything is typed. After an import, leaving the Backup screen opens wherever the data now says (§3.1). (The owner's choice, 30 Sep 2026: phone check step 4 needs it.)

---

## 13. Data layer

[Data layer & storage schema](issues/09-data-layer.md) holds the reasoning. [ADR 0004](../../docs/adr/0004-one-storage-key-per-quarter.md) covers the key-per-Quarter design.

### 13.1 Storage

- **The store:** `idb-keyval` 6.3 with a named store, `createStore('cadence', 'kv')`.
- **One key per Quarter** holds both Quests' Versions and that Quarter's Reflections. Each Draft has its own key, and there's one `meta` key.
- **Past Quarters:** a Past Quarter's key is never written again.
- **Atomicity:** every write, whether to one key or several (finishing a Quest also clears its Draft; an import), runs in one IndexedDB transaction through the store function `createStore` returns. Its values are worked out from memory, which only the store changes. Writes wait their turn in a queue, so each one's rules see what the write before it saved.
- **Reads:** everything is loaded into memory at launch. All reads come from memory.

### 13.2 Records

```ts
QuestContent { mainQuest, whyItMatters, successMetrics: string[],
               whyItsExciting, obstacle /* '' when skipped */, commitments: string[] }
Version      { savedOn: "2026-11-12", content: QuestContent }
Reflection   { text, prompt }             // prompt: a copy of the Day's Prompt

quarter:2026-Q4    { versions: { work: Version[], life: Version[] },      // oldest first
                     reflections: { "2026-11-12": { work?, life? } } }
setup:2026-Q4      { at: { quest, part }, work: partial content, life: partial content }
edit:2026-Q4:work  { startedAt, content }
meta               { schemaVersion: 1, lastBackupAt: epoch ms | null,
                     appearance: 'system' | 'light' | 'dark' }
```

Nothing that can be derived is stored:

- There's no "finished" flag.
- The Day isn't stored.
- Fold state, the page in view and the persistent status aren't stored.

### 13.3 Code

- **`src/lib/quarters.ts`:** pure date maths. `quarterOf(date)`, `dayOf(date, quarter)` (a number, or "before"), `lengthOf(quarter)`, `setupTarget(today)` and `screenFor(snapshot, today)`.
- **`src/lib/prompts.ts`:** the seven Prompts and `promptFor(date)`.
- **`src/lib/store.ts`:** the only code that touches IndexedDB, and it owns every rule. It takes the clock as an input. Its operations:
  - `open(clock)`
  - `saveSetupDraft`, `switchSetupTarget` (only until Work is finished) and `finishQuest`
  - `saveEditDraft`, `discardEdit` and `saveQuest`
  - `saveReflection` and `removeReflection`, for today only
  - `exportBackup` (returns a `File`), `markBackedUp`, `readBackup` (returns a Preview or a Problem) and `replaceWith`
  - `setAppearance`
- **`src/hooks/useCadence.ts`:** one hook that serves the UI. It re-renders after every write.

### 13.4 Rules the store enforces

- A write to a Past Quarter is refused.
- **Versions:** the rules in §10.
- **Reflections:** only for today's date, within a set-up Quarter.
- **Drafts:** a Draft left when its Quarter ends stays frozen with it, and is never shown or resumed.
- **Newer data:** stored data with a newer `schemaVersion` than the app knows opens read-only, with a banner: "This data is from a newer Cadence. Update Cadence to make changes."

### 13.5 Failed saves

1. The store retries once on a fresh connection (after `InvalidStateError` or `UnknownError`).
2. If that fails too, a blocking message appears: "Couldn't save. Close and reopen Cadence, or restart the iPhone." The typed text stays on screen.
3. A quota error says "Couldn't save: iPhone storage is full." instead.

"Saved" shows only after the write finishes.

---

## 14. Tests

Three layers, all in vitest:

1. **Pure logic:** `quarters.ts`, `prompts.ts` and the text tidy-up, with table tests over real calendar dates. Cover quarter lengths, 1 Jan, the last-14-days window, "before Day 1" and every `screenFor` state.
2. **The store:** `store.ts` against real IndexedDB through `fake-indexeddb`, with an injected clock. Each rule in §13.4 and §10 gets tests, and so do midnight saves, frozen Drafts, the retry-once path, quota errors, a newer `schemaVersion`, export → `readBackup` → `replaceWith` round trips, and every import Problem.
3. **Screens:** render the real app over a real store (`fake-indexeddb`), with `user-event` typing. No mocked hooks and no `fireEvent.change`: those let the old app's data-loss bugs pass.

**Also:**

- **Write tests first** for every rule, using the `tdd` skill.
- **Deploy gate:** `tsc --noEmit` and `npm test -- --run` gate every deploy.
- **No browser end-to-end suite in v1:** the keyboard, safe areas, share sheet and install can't be faked in jsdom. The phone checks (§15.2) cover them.

---

## 15. Build order

### 15.1 Slices

Each slice is one TDD session on its own branch, merged into `main` once `tsc` and the tests pass; the merge deploys. Slice 2 is data only. From slice 3 on, each slice adds something to the app on the phone. The tickets are in [build/](build/). Each is blocked by the one before it, because the order is chosen, not just forced by dependencies.

**In daily use (1–4):**

1. [Installable skeleton at the real address](build/01-installable-skeleton.md)
2. [Dates, Prompts and the store's setup path](build/02-dates-and-setup-store.md)
3. [Writing a Quest (setup)](build/03-setup-screens.md)
4. [Today for reading](build/04-today.md)

**Data-safe (5–6):**

5. [Backup](build/05-backup.md)
6. [Reflections](build/06-reflections.md)

**Complete (7–10):**

7. [Edit and History](build/07-edit-and-history.md)
8. [Archive](build/08-archive.md)
9. [Quarter's end](build/09-quarters-end.md)
10. [v1 acceptance](build/10-acceptance.md)

Backup comes before Reflections because Reflections can't be recreated. Quarter's end sits late because it isn't needed until 18 Dec.

### 15.2 Phone checks

The owner runs these checks at four milestones, not after every slice. Each merge to `main` still deploys.

- **After slice 1:** the head and install checks, listed below.
- **After slice 4:** set up Q4 and read Today. Real use starts here.
- **After slice 6:** the Backup round trip and Reflections.
- **Slice 10:** the full list, which also covers slices 7–9.

Each check records the iOS version (26.x or 27.x).

**Head and install (slice 1):**

1. Installs from Safari's Share → Add to Home Screen. The chosen icon shows, and the name is "Cadence".
2. **Light Appearance:** the status bar strip is `#F4F5F7` with dark glyphs.
3. **Dark Appearance:** the strip is `#0F1113` with light glyphs.
4. Flipping Appearance in Control Centre while Cadence is open: does the strip follow without a relaunch?
5. The placeholder's temporary Appearance switch (Light while the phone is Dark, and the reverse): does the strip follow? If not, the in-app control is dropped (§2.8).
6. Scrolling a long page: nothing blurs at the top, and nothing sits under the strip.
7. `100dvh` fills the screen with no bottom gap, and the bottom padding clears the home indicator. The placeholder logs `env(safe-area-inset-top)`, `innerHeight` and `screen.height`.
8. **Launch appearance** without splash images: note what shows before first paint, in light and dark.
9. **Update when reopened:** push a trivial change, wait for the deploy, and reopen Cadence from the app switcher. The build stamp changes without deleting the icon.
10. Opened in a Safari tab, the red banner shows. From the Home Screen, it doesn't.

If step 2, 3 or 6 fails, change the head and **re-add the icon** before slice 4, while there's no real data. If a strip colour is wrong in one look, first test which source iOS reads (`theme-color` or the `body` background).

**Real use (after slice 4):**

- Set up Q4 end to end on the phone. The keyboard stays up between parts, the bar rides above it, and Return is Next.
- Kill the app mid-setup, reopen, and it resumes on the same part.
- Today:
  - the ring shows the right Day;
  - pages swipe, and fold and unfold;
  - the Main Quest is in Plus Jakarta Sans, also in flight mode (offline).

**Data-safe (after slice 6):**

- **Round trip:**
  1. Export to Files.
  2. Write a Reflection.
  3. Import the file: the preview is right, and "Replace everything" removes the new Reflection.
  4. Export again, delete the icon, re-add it, and import. Everything is back.
- **Storage:** the Backup screen says "marked persistent".
- **Reflections:**
  - Write one, reopen it ("until midnight"), empty it (Remove).
  - After midnight, yesterday's is read-only.

**Full (slice 10):** all of the above again, plus:

- Edit with a Draft surviving a kill.
- History rows.
- The Archive.
- Every boundary state, through a date override in a dev build.
- Light and dark on every screen.

---

## 16. Housekeeping

Done in the slice named:

| What | Slice |
|---|---|
| Delete the old app: components, `useQuests`, `useReflections`, `db.ts`, `src/test-db.ts`, their tests, `scaffold.md`, `public/manifest.json`, the 1 px icons, `uuid` and `@vitejs/plugin-react-swc` | 1 |
| Delete the old spec and plan in `docs/superpowers/` (git keeps them) | 1 |
| `CLAUDE.md`: Node 24 and `.nvmrc`; no devcontainer or SWC notes; "one Version per Quest per Day"; the new structure (`quarters.ts`, `prompts.ts`, `store.ts`, `useCadence()`); no "check-in"; no `test-db.ts` command; the design points at `DESIGN.md` and this spec; the phone-testing notes point at the real address | 1 |
| Rename `master` to `main`. The owner creates the public repo and sets Pages' source to GitHub Actions | 1 |
| Delete the `prototype/*` branches (their files are now in `prototypes/`) and the five stale `worktree-agent-*` worktrees and branches, after checking that nothing on them is unmerged | 1 |
| Start `CHANGELOG.md` | 1 |

## 17. Changelog and releases

- **Format:** `CHANGELOG.md` follows Keep a Changelog 1.1.0 (Added, Changed, Removed, Fixed).
- **Style:** entries are plain words about what changed on the phone, not code.
- **When to write them:** every slice adds its lines under `[Unreleased]`.
- **Releases:** no versions and no tags until the owner says so. When they do, `[Unreleased]` becomes the release, the commit is tagged, and the build stamp shows the tag by itself (§2.6).

---

## 18. Details this spec fills in

These weren't decided in a ticket. The spec settles them so the build doesn't have to guess. Any of them can be changed by editing this section and the one it points to.

- The ended state shows the latest set-up Quarter when a Quarter was skipped (§3.1).
- Setup started from Today for the Upcoming Quarter has a Close button, and the Today link reads "Finish setting it up" once a Draft exists (§5.4, §6.4).
- The menu's Edit button notes "unsaved changes". Cadence opens on Today, not on the Edit screen (§6.3, §8).
- The Reflection popup's Cancel asks before discarding changes. A Reflection or edit saved just after the Quarter ended is refused with a message, and the text is kept (§7, §8).
- Today re-reads the date when the page becomes visible and at midnight (§3).
- The Archive's Day header, and its empty state (§11).
- The Backup screen's wording and the import Problem messages (§12), and the fresh install's "Restore from a backup" link (§12.3).
- The update reload waits until nothing is being written, and the app has no code-splitting (§2.3).
- The Safari-tab banner's reason text (§2.7).
- `setupTarget` in `quarters.ts`, `prompts.ts` as its own module, and `setAppearance` (§13.3).
