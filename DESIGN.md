# Cadence visual system

The look of v1, taken from the two prototypes the owner tried on the iPhone: [writing a Quest](.scratch/cadence-v1/prototypes/writing-a-quest.html) (variant A) and [the Today screen](.scratch/cadence-v1/prototypes/today-screen.html) (`?variant=3`). The prototypes are references, not code to promote. Where this file and a prototype disagree, this file wins.

It replaces the "Precision Chronometer" draft: the rhythm strip, the monospace utility font, the side-by-side layout, Steel-Gray and "Day N / 90" are all gone.

## Principles

- **Calm and quiet.** Cadence is a vision statement to re-read, not a dashboard. Nothing blinks, counts attendance or celebrates.
- **The owner's words lead.** The Scaffold's words and every label are quiet grey; the owner's words are bright ink.
- **Gold is rare.** It marks only what's alive today or what to tap next (see [Gold](#gold)).
- **Hierarchy from weight and colour,** not from many sizes.
- **Touch first.** Every tap target is at least 44 × 44 px.

## Appearance

Two looks, **dark** and **light**, chosen by the **Appearance** control in the menu: System (the default, following the iPhone), Light or Dark.

- Every colour is a token. Components never use a raw colour code: `src/index.css` defines the tokens below and removes Tailwind's own palette.
- System follows the phone's `prefers-color-scheme`. Light or Dark sets `data-look` on `<html>`, which fixes `color-scheme`, and rewrites both `theme-color` tags to that look's `--void` (`src/lib/appearance.ts`).
- The status bar is a solid strip in the page's background colour; nothing is drawn under it ([research](.scratch/cadence-v1/research/ios-status-bar-appearance.md)). Sticky headers use a solid `--void` background, not glass or a gradient.

## Colour tokens

| Token | Dark | Light | Use |
|---|---|---|---|
| `--void` | `#0F1113` | `#F4F5F7` | Page background, the status-bar strip |
| `--surface` | `#181B1F` | `#FFFFFF` | Sheets and the Reflection popup |
| `--raise` | `#23272C` | `#E9EBEF` | Chips, secondary buttons, a disabled primary button |
| `--line` | `#262A30` | `#E0E3E8` | Hairlines between parts and rows, empty ring ticks |
| `--ink` | `#EEE9DF` | `#15171A` | The owner's words, titles |
| `--given` | `#A0A7B2` | `#4A525C` | The Scaffold's openings on writing screens, secondary text |
| `--faint` | `#7F8794` | `#5F6875` | Labels, hints, part names, list numbers, placeholders |
| `--gold` | `#D4AF37` | `#C9A227` | Fills: today's tick, the primary button, the backup-due dot, the caret, the page dot |
| `--gold-text` | `#D4AF37` | `#7A5F00` | Gold text: "Write today's Reflection", "Set it up", nav buttons, a due backup time |
| `--gold-dim` | `#5E5126` | `#DCC883` | Passed ring ticks, the Reflect pill's outline, the saved Reflection's rule |
| `--on-gold` | `#17140A` | `#17140A` | Text on a gold fill |
| `--danger` | `#FF7A66` | `#C0392B` | The Safari-tab banner, the failed-save message |
| `--on-danger` | `#1A0703` | `#FFFFFF` | Text on `--danger` |
| `--shadow` | `#000000` at 50% | `#14181E` at 18% | The popup's and sheets' shadow, the only one |

**Contrast (WCAG AA, checked 2026-09-29):**

- `--faint` is 5.2:1 on `--void` and 4.8:1 on `--surface` in dark, 5.2:1 and 5.6:1 in light.
- `--faint` text never sits on `--raise`, except as a disabled control's label (4.15:1 in dark; disabled controls are exempt).
- Light `--gold` is only 2.2:1 as text, which is why gold text uses `--gold-text` (5.6:1 on `--void`).
- Text on `--gold` is 8.8:1 (dark) and 7.6:1 (light). Banner text on `--danger` is 7.7:1 (dark) and 5.4:1 (light).

## Gold

Gold appears only on:

- today's tick on the ring;
- the "Write today's Reflection" / "Edit today's Reflection" link;
- the primary button on a screen (at most one);
- the backup-due dot on the menu button and the due time in the menu;
- the header buttons of a pushed screen, like "‹ Today" (`--gold-text`; the owner's choice, 30 Sep 2026);
- the caret;
- the dot under the Quest page in view;
- the rule beside a saved Reflection and the marker on a changed part when editing (dim gold).

Anything else that wants gold doesn't get it.

## Type

**Fonts:**

- **System sans** (`-apple-system, system-ui`) for everything by default.
- **System serif** (`ui-serif`, New York on the iPhone) for the owner's words on the writing surfaces: the setup screens, Edit and the read-back (which the History's Version view also uses). Nothing to self-host.
- **Plus Jakarta Sans ExtraBold (800)** for the Main Quest on Today, tracked −0.025em. Bundled with the app and precached, so it works offline and makes no third-party request.
- Today has no serif. A Quest reads in sans on Today and in serif ink wherever it's being written or read back.

**Sizes:** three, plus the ring's numeral.

| Name | Size / line | Used for |
|---|---|---|
| S | 13 / 18 px | Labels, part names, notes under a title, the build stamp |
| M | 17 / 24 px | Body text, Reflections, hints, rows, buttons |
| L | 28 / 34 px | The Main Quest on Today, screen titles, the Scaffold opening and the owner's words on a setup or edit screen |

- The ring's numeral is its own size, light weight (300), with tabular figures.
- The read-back sets the Main Quest part at L and the other parts at M.
- Numbers that change (Day counts, dates in rows) use tabular figures.
- Inputs are at least 16 px, so iOS doesn't zoom on focus.

## Layout

- One column, at most 600 px wide, centred.
- A 22 px side gutter, or the safe-area inset if that's larger.
- Pad the top with `env(safe-area-inset-top)` and the bottom with `max(<gap>, env(safe-area-inset-bottom))`.
- Full-height screens use `100dvh` (or `100svh`), never `100vh`, which includes the status bar in a Home Screen app.
- Hairlines (`--line`) separate parts and rows. There are no cards and no drop shadows, except the popup's and sheets' shadow.
- Pill-shaped buttons (radius 999 px) on Today and in sheets. Sheets have a 24 px top radius; the popup has 26 px.

## Components

- **The ring:** one tick per Day of the Quarter; a longer tick at each month's start; passed Days in `--gold-dim`, today in `--gold`, the rest in `--line`. The middle reads "43" over "of 92".
- **Quest pages:** Work then Life, one page each, swiped or tapped; the words "Work" and "Life" under the ring, with a gold dot under the page in view.
- **Folding:** "Read the whole Quest" / "Fold it away" with a chevron. Pages open folded every time.
- **The Reflect link:** a pen icon and the words in `--gold-text`, inside a thin `--gold-dim` pill. Part of the page, never floating.
- **The Reflection popup:** a box centred over a blurred, dimmed page, sized to the visible viewport so the keyboard never covers it.
- **The menu:** one button, top right, opening a bottom sheet. No tab bar.
- **Pushed screens** (Edit, History, Archive, Backup): a sticky header with the back or Cancel button left, the title centred and the action right.
- **The bar above the keyboard** (setup and editing a part): Back and Next, kept above the keyboard with the `visualViewport` API. It's part of the screen, under the words, never floating over them: a writing screen fills the area the keyboard leaves visible, only the words scroll, and the page itself doesn't (the owner's phone check, 29 Sep 2026).

## Motion

Only in answer to a tap:

- folds open and close (about 0.3 s);
- the popup scales in;
- sheets rise;
- a setup step slides in (about 0.2 s).

One easing: `cubic-bezier(.2, .8, .2, 1)`, the `--ease` token, which every transition uses by default. Nothing moves on its own, and everything respects `prefers-reduced-motion`.

## Icon

The day ring, gold on `--void` (dark), drawn as the Quarter in progress: passed Days in `--gold-dim`, today's tick longer and in `--gold`, the rest in `--line`, with longer ticks at each month's start. The owner chose it (draft A) from three drafts in build slice 1; the drafts and the script that draws them are in [.scratch/cadence-v1/icons/](.scratch/cadence-v1/icons/).

- **Source:** `public/icon.svg`, a full-bleed, opaque square with no padding. iOS rounds the corners.
- **Files:** `npm run icons` (the vite-pwa assets generator, `pwa-assets.config.ts`) makes the 180 × 180 `apple-touch-icon`, the 64, 192 and 512 manifest icons and `favicon.ico`. They're committed.
