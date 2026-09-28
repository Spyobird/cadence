# Prototype: the Today screen & app shell

Type: prototype
Status: resolved
Assignee: Spyobird
Blocked by: 05

## Question

What does opening Cadence look and feel like, and how is the rest of the app reached?

- How the Quests (the vision) sit against the Prompt and the two optional Reflections; where the quarter-progress ring lives.
- Today's saved state; editing today's Reflections.
- Reaching Quests (view, edit, history), Archive, and backup (export, import, last-exported nudge, storage status). Tab bar, or fewer surfaces?
- The boundary states from [Quarter boundaries](04-quarter-boundaries.md): set up but before Day 1 ("Starts in N days", empty ring, no reflecting); "Set up Q1 2027" offered from the last 14 days; the ended Quarter's read-only Quests while the next isn't set up.
- The warning banner when Cadence is opened in a normal Safari tab ([research](../research/ios-storage-durability.md)).
- How far `DESIGN.md`'s Precision Chronometer carries over. UX and seamlessness beat colour; creative latitude is welcome.

Context:

- [What a Quest is made of](03-quest-anatomy.md): Today shows both whole Quests as first-person prose plus two numbered lists, with the Main Quest as headline. The Obstacle is left out when empty.
- [What a Quest version is](06-quest-versions.md): each Quest's History lists its Versions newest first, current on top. A row shows date, Day and that Version's Main Quest ("12 Nov · Day 43"; "Set up 29 Sep · before Day 1"). Tapping opens the whole Version read-only. No version numbers, no restore. Where the History is reached is this ticket's to decide.
- [The morning ritual](05-morning-ritual.md): opening Cadence is a casual re-read at any time of day. It is not a ritual or a check-in. Reading leads. The Prompt is a thinking aid, and each Reflection is optional.
- [Prototype: writing a Quest](07-prototype-writing-a-quest.md): Work is listed before Life everywhere. Editing starts from a Quest's read-back (Cancel / Save; tap a part to change it on its own screen), so the Quests screen needs a way into Edit. The proposed look: the Scaffold's words in grey system sans, the owner's words in the system serif, gold only for the caret and the primary action.

Deliverable: a rough prototype the owner can open on their iPhone, linked from this ticket.

## Answer

Prototype (primary source): branch `prototype/today-screen`, file `.scratch/cadence-v1/prototypes/today-screen.html` (commit `9bc69a1`, open with `?variant=3`). It took four rounds, all tried on the owner's iPhone.

- Round 1 compared tabs, one long page, and one page per Quest. One page per Quest won as "the cleanest".
- Rounds 2 to 4 refined it. The final layout mixes the owner's picks from round 3's three directions.

**Today, the screen Cadence opens on:**

- **Top:** the day ring, today's date under it ("Thursday 12 Nov"), and the menu button top right.
  - The ring has one tick per Day, a longer tick at each month's start, and today's tick in gold.
  - The middle shows "43" over "of 92".
- **Work / Life:** the two words sit under the ring, with a gold dot under the page in view. There is one page per Quest, Work first. Swipe or tap to switch.
- **Each page:** "My Work Main Quest is to" small and grey, then the Main Quest large. It continues the sentence, so it starts in lower case.
- **Folding:** "Read the whole Quest" unfolds the other parts, and "Fold it away" folds them back. Pages open folded every time.
- **Unfolded parts:** each part shows its name small and grey ("Why it matters", "Success Metrics", …) above the owner's words, with a hairline between parts.
  - Lists are numbered.
  - The owner's words start with a capital here.
  - An empty Obstacle is left out.
  - The Scaffold's openings appear only in the read-back (Edit and History).
- This supersedes "Today shows both whole Quests" in [What a Quest is made of](03-quest-anatomy.md).

**Reflecting:**

- **The link:** under each Quest, "Write today's Reflection" with a pen icon, in gold inside a thin gold-outlined pill. It is part of the page, not a floating button.
- **The popup:** a box centred over the blurred page.
  - It holds "Work, Thu 12 Nov", the day's Prompt, a field, and Cancel / Save.
  - The keyboard comes up at once.
  - Save stays disabled until something changes.
  - Emptying a saved Reflection turns Save into Remove.
  - Reopening a saved one notes "You can change it until midnight."
- **Saved:** the page shows the Reflection's text beside a gold rule, with "Edit today's Reflection" under it.
- **When there's no reflecting:**
  - Before Day 1: "Reflections start on Day 1, Thursday 1 Oct."
  - After the Quarter has ended: "Reflecting starts again once Q1 2027 is set up."

**The menu:** one top-right button reaches everything else. There is no tab bar.

- **The sheet:** a bottom sheet. It holds:
  - "Q4 2026" and "Day 43 of 92, 49 to go";
  - a Work Quest row and a Life Quest row, each with Edit and History;
  - Archive, with its count;
  - Backup, with when the last backup was.
- **Backup due:** no backup yet, 7 or more days since the last one, or the Quarter has ended. It shows a gold dot on the menu button, and the Backup row's time turns gold.
- **Edit:** opens the read-back from [Prototype: writing a Quest](07-prototype-writing-a-quest.md).
- **History:** Versions newest first. Each row shows date · Day and the Main Quest, with "Current" on the newest. Tapping a row opens that Version read-only.
- **Archive:** every Reflection, newest Day first. Reflections are grouped by Day, under that Day's Prompt, Work before Life.
- **Backup:**
  - The last backup and the storage status ("On this iPhone, marked persistent", or the Safari-tab warning).
  - **Export backup:** share sheet, then Save to Files.
  - **Import:** Files picker, then "Replace everything with this backup?" with the backup's date and counts. The options are "Export what's here first", "Replace everything", and "Keep what's here" to cancel.
  - A note: export before deleting Cadence from the Home Screen.

**Boundary states** (from [Quarter boundaries](04-quarter-boundaries.md)): each is one quiet line under the date, and the owner accepted them through all four rounds without changes.

- **Before Day 1:**
  - The ring is empty, and its numeral counts the days to go.
  - The date line reads "Starts Thursday 1 Oct".
- **Last 14 days:**
  - "Q1 2027 starts in 12 days. Set it up".
  - Once Q1 2027 is set up: "Q1 2027 is set up. It takes over on 1 Jan."
- **Ended, with the next Quarter not set up:**
  - The ring is full, with "Q4 2026 is over. Its Quests are kept as they were."
  - A "Set up Q1 2027" button, and "Export a backup first".
  - Edit is hidden; History stays readable.
- **Opened in a Safari tab:** a red banner on top, "Open Cadence from your Home Screen", with the reason.

**Look:**

- **Dark:** the colour tokens in the prototype's `:root`.
  - `DESIGN.md`'s Deep Obsidian (`#0F1113`) and Pulse Gold (`#D4AF37`) carry over.
  - The text greys are brighter than Steel-Gray, for contrast.
  - Gold marks only today's tick, the Reflect link, the primary button, the backup-due dot and the caret.
- **Type:** three sizes, 13/18, 17/24 and 28/34 px, plus the ring's numeral. Hierarchy comes from weight and colour.
  - The Main Quest is in **Plus Jakarta Sans ExtraBold (800)**, tracked slightly tight (−0.025em).
  - The font is bundled with the app, so it works offline and makes no third-party request.
  - Everything else is the system sans.
  - Today has no serif, which supersedes the writing prototype's proposal of the system serif for the owner's words.
  - `DESIGN.md`'s monospace utility font and side-by-side layout are dropped.
- **Motion:** only in answer to a tap. Folds open, the popup scales in, and sheets rise.

**Feeds forward:**

- [Data layer & storage schema](09-data-layer.md):
  - Store when the last backup was made; it drives the backup-due nudge.
  - The Archive reads every Reflection newest first, each with its copy of the Prompt.
  - Import reads a backup's date and counts before it replaces anything.
  - The Backup screen shows whether storage is marked persistent.
  - Fold state and the page in view are UI-only and never stored.
- [v1 spec & build order](10-v1-spec-and-build-order.md):
  - Build Today, the menu and the pushed screens as above. The prototype is a reference, not code to promote.
  - Bundle and precache Plus Jakarta Sans 800.
  - Still to settle in the spec: dark only, or a light look too (one was built but never chosen); whether the writing screens drop the serif to match Today; a contrast check on the faintest grey.

## Comments

**Prototype built (2026-09-28):** `.scratch/cadence-v1/prototypes/today-screen.html`, served over the LAN (`python3 -m http.server 8124 --directory .scratch/cadence-v1/prototypes`). Three variants, `?variant=A|B|C`:

- **A, Tabs:** a tab bar with Today, Quests, Archive and Backup. Today is for reading: a small ring and the date, both whole Quests, then the day's Prompt with two Reflection boxes. The Quests tab holds Edit and History. A due backup shows as a dot on the Backup tab.
- **B, One page:** no tab bar. Today is the whole app. A slim sticky header has the date and a small ring. Each Quest carries its own Edit, History and a folded "Reflect on Work" with the Prompt. Archive and Backup sit at the foot of the page. A due backup shows as a line near the top.
- **C, Pages:** a large ring on top (one tick per Day, longer at each month's start), then one Quest per page: swipe or tap Work / Life. A floating "Reflect on Work" opens a sheet with the Prompt. Archive, History and Backup sit behind a "…" menu, which carries the backup-due dot.

`?state=` pretends a date: `running` (Thu 12 Nov, Day 43), `stale` (backup 16 days old), `before` (Mon 28 Sep), `late` (Sun 20 Dec), `ended` (Sat 2 Jan, Q1 2027 not set up), `safari` (the Safari-tab banner). `?look=dark|light`. Edit and Setup are stand-ins that point to Prototype: writing a Quest.

**Owner's verdict, round 1 (2026-09-28):** round 1 is on branch `prototype/today-screen` (commit `0e912a6`).

- C is the favourite: "the cleanest".
- The floating "Reflect" button glitched while swiping between pages. Having to tap a button before typing a Reflection is friction. Maybe Reflections get their own page; not sure yet.
- Edit, History and Backup: reached through some navigation, not on the page.
- Show the Main Quest first; the other parts drop down. The whole Quest at once is "too verbose and cluttered". This supersedes "Today shows both whole Quests" ([What a Quest is made of](03-quest-anatomy.md)).
- Wants it "more modern, minimalist and clean".

**Round 2 built (2026-09-28):** the same file, rewritten on C. Both variants have the ring and date on top, then plain-word page tabs with a gold dot under the page in view. Each Quest page shows "My Work Main Quest is to" and the Main Quest large. The other parts fold into rows (Why it matters, Success Metrics 3, …) that drop down to the Scaffold sentence. One menu (top right) holds Edit and History for each Quest, the Archive, and Backup, and it carries the backup-due dot. A Reflection is always an open field: type, and Save appears. The boundary states are one quiet line under the date, and the ended state has a single "Set up Q1 2027" action. The variants differ only in where the Reflection sits, `?variant=C1|C2`:

- **C1, Reflect page:** a third page after Work and Life, with the Prompt and both fields.
- **C2, under each Quest:** each Quest's page ends with the Prompt and its own field.

**Owner's verdict, round 2 (2026-09-28):** round 2 is on branch `prototype/today-screen` (commit `2c3b358`).

- C2 (Reflection under each Quest) over C1.
- The mix of small and large type looks "a bit off" and not clean. Make it more modern and minimalist.
- Reflect could be a button (not floating) that opens the Reflection in a popup. The owner asked for more ideas.

**Round 3 built (2026-09-28):** three directions on C2, all on one type scale (13 / 17 / 28 px, plus the ring's numeral), with Reflect as an in-page button that opens a popup holding the Prompt. `?variant=1|2|3`:

- **1, Rows + sheet:** all system sans. The large ring, then the Main Quest as a 28px headline (the Scaffold opening dropped), then fold-down rows. "Reflect on Work" is a full-width button under the rows. It opens a bottom sheet (Cancel / Work / Save) that rides above the keyboard.
- **2, Card + popup box:** all system sans, with a compact header (small ring, date, Day). A segmented Work / Life control sits above one card per Quest: the Main Quest, a single Details fold (each part labelled, with the owner's words only), and a Reflect button in the card's foot. It opens a centred popup box over a blurred page.
- **3, Prose + full screen:** the owner's words in serif and the Scaffold's in sans. "My Work Main Quest is to" is kept, and "Read the whole Quest" unfolds the prose. "Write today's Reflection" opens a full-screen page, like a note.

**Owner's verdict, round 3 (2026-09-28):** round 3 is on branch `prototype/today-screen` (commit `46eb6f0`). A mix:

- 3's page layout: the ring on top, "My Work Main Quest is to" small, and "Read the whole Quest" to unfold.
- The Main Quest in a bold modern sans, as in 1, not 3's serif. The owner is open to other bold typefaces.
- 2's labelled details (a small grey label above the owner's words). Not 2's segmented control or compact header.
- 1's big day ring.
- 3's "Write today's Reflection" link, opening 2's popup box, not 3's full screen.

**Round 4 built (2026-09-28):** one layout combining those picks, all in sans. After saving, the page shows the Reflection's text as 3 did. `?variant=1|2|3|4` switches only the Main Quest's typeface: SF Pro, SF Pro Rounded, Bricolage Grotesque, Manrope (the last two from Google Fonts in the prototype; the app would bundle the chosen one).

**Owner's verdict, round 4 (2026-09-28):** round 4 is on branch `prototype/today-screen` (commit `b2d0f49`).

- The layout is "ok". Add a light border around the Reflect link.
- Leans to SF Pro (1) or Manrope (4). Asked whether a web app can use more fonts. Answer: yes. Bundling the font file with the app beats loading it from a CDN: it works offline from the first launch and makes no third-party request. If there are no better options, Manrope.

**Round 4b built (2026-09-28):** the same layout. The Reflect link is now a gold-outlined pill. `?variant=1..6` switches the Main Quest's typeface: SF Pro, Geist, Plus Jakarta Sans, Manrope, Sora, Outfit.

**Owner's verdict, round 4b (2026-09-28):** Plus Jakarta Sans (3) for the Main Quest. The outlined Reflect link stays. Resolved.
