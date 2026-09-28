# iOS Home Screen web app status bar with light + dark appearance

Resolves: the open question in `research/github-pages-pwa-setup.md` ("is `theme-color` used at all in standalone mode?") and the "status-bar behaviour on iOS 26" item in `map.md`. Also bears on the "dark only, or a light look too" leftover in `issues/10-v1-spec-and-build-order.md`.
Researched: 2026-09-29. Target: iOS 26 (iOS 17–18 where 26 data is thin). iOS 27 shipped 2026-09-14 and is noted where it matters.
App context: `https://spyobird.github.io/cadence/`, dark `#0F1113` and light `#F4F5F7`, following the system Appearance via `prefers-color-scheme`. The plan in `github-pages-pwa-setup.md` was `black-translucent` + `viewport-fit=cover`. `index.html` today has `default`, no `viewport-fit`, and an inline dark body background.

**Confidence labels**
- **Confirmed**: stated by Apple or WebKit (docs, release notes, an Apple engineer on WebKit Bugzilla, WebKit source), or visible in a primary artifact such as a device screenshot attached to a WebKit bug.
- **Likely**: several independent reports agree, or it follows from primary sources (e.g. WebKit code), but Apple hasn't stated it.
- **Unconfirmed**: one report, conflicting reports, or no source. Verify it on the device.

Apple publishes nothing current on the web-app status bar. Its only reference page is the archived *Supported Meta Tags*, and none of the Safari 26.0–27.0 release notes mention the status bar in web apps (checked). The status-bar-style tag isn't handled in WebKit at all: `HTMLMetaElement.cpp` on WebKit `main` (8f483b0, 2026-09-28) has no code for it, so Safari's closed-source web-app shell reads it. Most iOS 26 behaviour below therefore comes from WebKit Bugzilla, where Apple engineers answered some of the reports.

---

## Verdict

**Don't use `black-translucent` for a light + dark Cadence.** An Apple WebKit engineer said in June 2026 that it "has been deprecated for multiple releases because it semantically can't work with dark mode." He told developers to remove the tag, so that the status bar "automatically appear[s] in the same color as the webpage." He also said Home Screen web apps "do not support drawing arbitrary content below the status bar." In practice the edge-to-edge mode has also:
- regressed in iOS 26.1 and again in the iOS 27 betas;
- picked up a Liquid Glass blur over whatever sits under the status bar (seen on 26.0, and reported as worse on iOS 27).

**Use the `default` style, or omit the tag.** Keep `viewport-fit=cover` for the bottom home-indicator inset. Declare `theme-color` twice, once per `prefers-color-scheme`, and set `html`/`body` backgrounds to the same two colours. The status bar then becomes a solid strip in the page's colour. It looks edge to edge, and it doesn't matter whether iOS takes the colour from `theme-color` or from the page background. The glyphs come out dark on `#F4F5F7` and light on `#0F1113` (Likely).

**The status-bar-style is fixed when the icon is added (Likely).** Changing it later means deleting and re-adding the Home Screen icon. Deleting the icon erases Cadence's data (see `ios-storage-durability.md`), so settle this before real data exists.

## Answers at a glance

| Question | Answer | Confidence |
|---|---|---|
| `black-translucent`: are the glyphs always white? | No. Device screenshots from iOS 18 (Apr 2025) and iOS 26.0 show dark glyphs over light pages. What sets the glyph colour (system appearance, page content or `theme-color`) is undocumented. | Likely (not white); Unconfirmed (mechanism) |
| `black-translucent`: is it supported going forward? | Apple says it's deprecated, "can't work with dark mode", and that drawing under the status bar isn't supported. | Confirmed (Apple engineer) |
| `black-translucent` on iOS 26/27 in practice | 26.0 worked, with a blur band. 26.1 broke it (solid bar, top inset 0), 26.2 fixed it, and one report says it's broken again on 26.5.2. The iOS 27 betas letterboxed or blurred it. | Confirmed (bugs, Apple triage); state on 27.0 release Unconfirmed |
| `default` / no tag: background | A solid bar. Content starts below it, even with `viewport-fit=cover`. Apple says the bar takes the page's colour. | Confirmed (doc + Apple engineer); iOS 26 test Likely |
| `default` / no tag: glyphs | Dark on a light bar, light on a dark bar. | Likely |
| `theme-color` + `media` in standalone | iOS 15–18: yes. iOS 26: MDN's compat data says Safari 26 uses `theme-color` *only* for installed web apps. Which source wins when `theme-color` and `body` differ is unknown. | Likely; conflict Unconfirmed |
| `color-scheme` | Doesn't set the status bar directly. It changes the UA default canvas and control colours, which only matter if `html`/`body` have no explicit background. | Likely (inferred from WebKit code) |
| Changing it at runtime | status-bar-style: no, it needs a reinstall. `theme-color`/`body` colour swaps: conflicting reports. `prefers-color-scheme` live switching: broken on iOS 17, fixed on 18. | Likely / Unconfirmed / Likely |

---

## 1. `black-translucent`

**What Apple documents (Confirmed, archived).** *"If set to `black-translucent`, the status bar is black and translucent … the web content is displayed on the entire screen, partially obscured by the status bar. The default value is `default`."* The same page says the tag *"has no effect unless you first specify full-screen mode"* (`apple-mobile-web-app-capable`). It says nothing about glyph colour or dark mode. ([Apple, Supported Meta Tags](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariHTMLRef/Articles/MetaTags.html))

**Apple's current position (Confirmed).** Luming Yin (`@apple.com`), on [WebKit bug 317153 comment 2](https://bugs.webkit.org/show_bug.cgi?id=317153#c2), 2026-06-17:
> "The status bar behavior has not changed between iOS 26 and iOS 27. The black-translucent status bar mode has been deprecated for multiple releases because it semantically can't work with dark mode and across different webpage styles. Please remove this key, and the status bar should automatically appear in the same color as the webpage. Home Screen web apps does not support drawing arbitrary content below the status bar."

firt.dev's iOS PWA compatibility notes (updated June 2023, Secondary but well regarded) already marked the tag deprecated since iOS 15 in favour of `theme-color`. They also said `black-translucent` was "still the only way to get a fullscreen app" ([firt.dev/notes/pwa-ios](https://firt.dev/notes/pwa-ios/)).

**Glyph colour is not fixed white (Likely).** The old guides say the glyphs stay white even on a light page (e.g. [Appscope, Medium](https://medium.com/appscope/changing-the-ios-status-bar-of-your-progressive-web-app-9fc8fbe8e6ab)). Recent device evidence disagrees:
- **iOS 18 era (Apr 2025).** Stanko Tadić's demo uses `black-translucent`, has no `theme-color`, and paints a light-blue body. His screenshots show black glyphs. He writes: *"the method works well in both light and dark mode. iOS will automatically adjust the color of the status bar elements … to be visible on the background."* ([muffinman.io](https://muffinman.io/blog/pwa-ios-status-bar-blur/), [demo head](https://muffinman.io/ios-statusbar-blur/))
- **iOS 26.0.** flowery.app is a light + dark dictionary web app with the exact stack Cadence planned:
  - head tags: `theme-color` for light `#fff` and dark `#1e1e1e`, `color-scheme: light dark`, `viewport-fit=cover`, `black-translucent` (fetched 2026-09-28);
  - its screenshot on [bug 300445](https://bugs.webkit.org/show_bug.cgi?id=300445) ([attachment](https://bugs.webkit.org/attachment.cgi?id=477035)) shows the white page under a black-glyph status bar.

Neither case tells us whether the glyphs follow the system appearance, the page's pixels or `theme-color`. The same flowery screenshot shows the page header **blurred** under the status bar on 26.0 (next point). **Mechanism: Unconfirmed.**

**The Liquid Glass blur under the status bar (Likely).**
- **How WebKit handles the top inset (Confirmed, code).** Since iOS 26, WebKit fills an obscured top inset in one of two ways:
  - a **fixed colour extension** taken from a `position: fixed/sticky` element at the top edge;
  - otherwise, UIKit's scroll edge effect, a soft blur on iPhone.
  - The code is in `WKWebView.mm` (`_updateFixedColorExtensionViews`, `_updateHiddenScrollPocketEdges`).
- **Which elements qualify (Confirmed, code).** `LocalFrameView::fixedContainerEdges` only counts an element that:
  - is fixed or sticky;
  - is more than 10 px in both dimensions;
  - is at least 90% of the viewport width;
  - has a resolved, visible `background-color` (gradients don't count).
- Wenson Hsieh (Apple) describes the same behaviour on [bug 301756 c2](https://bugs.webkit.org/show_bug.cgi?id=301756#c2).
- **What people see.** The blur is visible in the 26.0 flowery screenshot. [Bug 324438](https://bugs.webkit.org/show_bug.cgi?id=324438) (2026-09-17, radar imported) reports "Starting in iOS 27 PWAs are blurry at the top near the status bar."
- **Whether the web-app shell counts the status bar as an obscured inset: Likely.** It's inferred from these symptoms. The shell is closed source.

**Regression history** (all WebKit Bugzilla):
- [300445](https://bugs.webkit.org/show_bug.cgi?id=300445) and [301994](https://bugs.webkit.org/show_bug.cgi?id=301994) (**iOS 26.1**).
  - `viewport-fit=cover` stopped covering the top edge. The inset was filled with a solid colour and `env(safe-area-inset-top)` became `0`.
  - Apple: *"an issue in Safari, not in WebKit."*
  - Reporters confirmed it **fixed in 26.2**. A July 2026 comment says it reproduces on **26.5.2**.
  - Marcos Cáceres (Apple) reopened it for the iOS 27 beta on 2026-08-05.
- [313800](https://bugs.webkit.org/show_bug.cgi?id=313800) (26.3.1): with `black-translucent`, the page is 62 px shorter than the screen, and the strip at the bottom can't be laid out.
- [317153](https://bugs.webkit.org/show_bug.cgi?id=317153) (**iOS 27 betas**): letterboxed status bar.
  - One reporter says it depends on *when the icon was added*: *"install-time chrome persists across OS updates."*
  - Another says it was fixed in beta 4.
  - **The state on the 27.0 release is Unconfirmed.**
- The [Glide community](https://community.glideapps.com/t/webapp-status-bar-not-transparent-anymore/85272) reported the same 26.1 break in Nov 2025 (Secondary).

## 2. `default` (or no tag)

**Content sits below the bar, even with `viewport-fit=cover`.**
- **Confirmed** (doc): *"If set to `default` or `black`, the web content is displayed below the status bar."*
- **Likely** (iOS 26 test): the test pages on [bug 316008](https://bugs.webkit.org/show_bug.cgi?id=316008) (2026-06) are identical except for the tag. Both have `apple-mobile-web-app-capable` and `viewport-fit=cover`. Without `black-translucent`, *"the body element is NOT drawn behind the status bar."*

**`viewport-fit=cover` still matters (Likely).** In standalone mode, without `cover`, content ran under the home indicator and `env(safe-area-inset-*)` didn't compensate. Adding `cover` fixed it ([bug 236445](https://bugs.webkit.org/show_bug.cgi?id=236445), comments 4–8). Expect `env(safe-area-inset-top)` = 0 under `default` (bug 301994 c4, [barcelona-cinemas #98](https://github.com/jas7553/barcelona-cinemas/pull/98), simulator). Expect a non-zero bottom inset.

**Background colour.**
- **Confirmed intent (Apple engineer):** "the same color as the webpage."
- **Confirmed, older WebKit design:** safe-area insets are *"filled with the page's background-color (as specified on the `<body>` or `<html>` elements)"* ([WebKit, Designing Websites for iPhone X](https://webkit.org/blog/7929/designing-websites-for-iphone-x/)).
- **Confirmed (code):** WebKit's fallback colour for the top inset is `underPageBackgroundColor`. That is the page's extended (root) background colour unless the client overrides it ([`WebPageProxy.cpp`](https://github.com/WebKit/WebKit/blob/main/Source/WebKit/UIProcess/WebPageProxy.cpp), `underPageBackgroundColor()`).
- **Secondary, with no page colour declared:** it follows the system: white in light mode, dark in dark mode ([FlutterFlow community](https://community.flutterflow.io/ask-the-community/post/status-bar-color-in-dark-mode-Liry9sibmjsPkVI)).

**Does `theme-color` with `media` affect it? Likely.**
- **Safari 15** added `theme-color` for *"the status bar in iOS"* and the `media` attribute for light and dark variants ([Safari 15 notes](https://developer.apple.com/documentation/safari-release-notes/safari-15-release-notes), [WebKit blog](https://webkit.org/blog/11989/new-webkit-features-in-safari-15/)). **Confirmed for Safari; Likely for standalone.**
- **iOS 18.4:** Tuta's installed web app (no status-bar-style tag, `viewport-fit=cover`) showed a status bar colour inverted against the theme. The fix was a JS-inserted `theme-color` that is updated whenever the theme changes. The team says it applies *"when loading the webapp from the Home Screen on iOS"* ([issue 8911](https://github.com/tutao/tutanota/issues/8911), [PR 9405](https://github.com/tutao/tutanota/pull/9405)). Secondary.
- **iOS 26:**
  - MDN's compat data adds a note: *"From Safari 26, the theme color is only used for installed web apps."* That came from a BCD meeting decision citing caniuse's discussion ([BCD PR 28503](https://github.com/mdn/browser-compat-data/pull/28503), [caniuse PR 7366](https://github.com/Fyrd/caniuse/pull/7366)). There, Jen Simmons (Apple) confirmed Safari no longer uses `theme-color` for browser chrome and advised *"testing web apps separate from pages in Safari."*
  - One iOS 27 **device** report: an app switched to `default` + per-route `theme-color`. It passed "light / dark / system switch: colour follows, glyphs legible", and users had to re-add the app ([volleybro PR 427](https://github.com/andrewck24/volleybro/pull/427), Secondary).
  - Safari *tabs* on 26 ignore `theme-color` and use the `body` or top fixed-element colour. That's a different surface ([bug 301756](https://bugs.webkit.org/show_bug.cgi?id=301756), [bug 309956](https://bugs.webkit.org/show_bug.cgi?id=309956)).
- **Unconfirmed:** which colour wins in standalone on 26 when `theme-color` ≠ `body` background. Make them equal and it stops mattering.

**Glyphs (Likely).** Dark on a light bar and light on a dark bar, in the volleybro and Tuta reports. The Safari-tab simulator report says the clock switched to light text over a dark `body` colour. This matches how UIKit's `default` style behaves, but Apple hasn't documented it for web apps.

## 3. `color-scheme` (CSS property or meta)

- **What it does (Confirmed).** It declares which colour schemes the page supports. The UA then renders its defaults (canvas background, form controls, scrollbars) in the matching scheme. Safari has supported the meta since 12.1 and the CSS property since 13 ([BCD](https://github.com/mdn/browser-compat-data/blob/main/html/elements/meta.json)). Safari 17.4 fixed reprocessing `<meta name="color-scheme">` when it changes ([17.4 notes](https://developer.apple.com/documentation/safari-release-notes/safari-17_4-release-notes)).
- **Status bar effect (Likely indirect only).** No source says it sets the status bar. It matters only if `html`/`body` have no explicit background. Then the default canvas colour follows the scheme, and that colour becomes the page background WebKit hands to the status-bar strip (the `underPageBackgroundColor` path above). Cadence sets explicit backgrounds, so for Cadence it only changes controls and scrollbars.
- **It doesn't flip `prefers-color-scheme` for the top-level page.** That request is still open: [bug 319500](https://bugs.webkit.org/show_bug.cgi?id=319500), "color-scheme should affect prefers-color-scheme" (NEW).
- **It's still worth declaring (Likely).** Otherwise native date inputs, textareas and scrollbars render light-on-dark in dark mode. flowery.app declares it.

## 4. What current guidance and real apps do

- **Apple (engineer, 2026):** remove `black-translucent`, and the bar matches the page. **Confirmed.**
- **WebKit (2017, still current):** `viewport-fit=cover` + `env(safe-area-inset-*)` with `max()` for minimum padding ([WebKit blog 7929](https://webkit.org/blog/7929/designing-websites-for-iphone-x/)). **Confirmed.**
- **firt.dev (2023):** `theme-color` replaces the status-bar-style tag, and `black-translucent` is only for true full screen. Secondary.
- **Real apps.**
  - flowery.app (light + dark) shipped `black-translucent` + `theme-color`/`media` + `color-scheme` and was hit by the 26.1 regression.
  - In Sept 2026 several projects moved from `black-translucent` to `default` + `theme-color` because of the iOS 27 blur (e.g. [volleybro #427](https://github.com/andrewck24/volleybro/pull/427)).
  - Many of those write-ups contradict each other and rest on simulator or Chromium evidence, so they count only as weak Secondary evidence.
- **Keep any fixed top bar solid.** In a Safari tab, and in any web app that draws under an inset, a fixed/sticky top bar should use a solid `background-color`. A gradient or `backdrop-filter` defeats colour sampling ([bug 325446](https://bugs.webkit.org/show_bug.cgi?id=325446), [bug 319479](https://bugs.webkit.org/show_bug.cgi?id=319479)). **Likely.**

## 5. Changing things at runtime

| Change | Takes effect without reinstall? | Confidence | Source |
|---|---|---|---|
| Swap or add `apple-mobile-web-app-status-bar-style` | **No.** It's read when the icon is added. The fix is delete and re-add. | Likely | [bug 260508](https://bugs.webkit.org/show_bug.cgi?id=260508) (2023), [bug 316008](https://bugs.webkit.org/show_bug.cgi?id=316008) (2026, "does not change when the meta tag is added later on"), [bug 317153 c5](https://bugs.webkit.org/show_bug.cgi?id=317153#c5), [Apple Community 252493175](https://discussions.apple.com/thread/252493175) (2021) |
| Edit `theme-color` from JS | iOS 18: apparently yes (Tuta). iOS 26/27: conflicting. One app reports per-route changes work (iOS 27), while another project's notes claim iOS "mostly ignore[s] later changes" (untested). | Unconfirmed | Tuta PR 9405, volleybro PR 427, [cluckwork #974](https://github.com/mforce/cluckwork/issues/974) |
| Change `body` background from JS | Conflicting. "Works correctly in PWA/standalone mode" (26.3) vs. "only updates on relaunch" (26.5.2). | Unconfirmed | [bug 309956](https://bugs.webkit.org/show_bug.cgi?id=309956), [bug 301994 c12](https://bugs.webkit.org/show_bug.cgi?id=301994#c12) |
| System Appearance flips while the app is open | iOS 17: `prefers-color-scheme` stayed frozen until relaunch (FB12858610). The original poster says it's fixed in iOS 18. The status bar strip may still lag until relaunch. | Likely (CSS); Unconfirmed (bar) | [Apple forums 739154](https://developer.apple.com/forums/thread/739154) |
| Manifest `theme_color` / `background_color` | Read at install. One value only, with no light/dark variant. | Likely | cluckwork #974 (Secondary); [MDN theme_color](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/theme_color) |

---

## Implications for Cadence

**1. Recommended head** (replace the status bar lines in `index.html`):
```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" media="(prefers-color-scheme: light)" content="#F4F5F7">
<meta name="theme-color" media="(prefers-color-scheme: dark)"  content="#0F1113">
<meta name="apple-mobile-web-app-capable" content="yes">
<!-- No apple-mobile-web-app-status-bar-style: same as "default". Apple says don't use black-translucent. -->
<style>
  :root { color-scheme: light dark; --bg: #F4F5F7; }
  @media (prefers-color-scheme: dark) { :root { --bg: #0F1113; } }
  html, body { background-color: var(--bg); }
</style>
```
- Keep the inline `<style>` so the first paint has the right colour before the JS bundle loads. Today's inline `body { background-color: #0F1113 }` would paint dark in light mode.
- `theme-color` and `html`/`body` backgrounds must stay **identical per scheme**. That's the whole trick: whichever source iOS uses, the strip matches.

**2. Layout.**
- Pad the top with `env(safe-area-inset-top)`. It's harmless when 0 and correct if iOS ever reports a value.
- Pad the fixed bottom nav with `max(<gap>, env(safe-area-inset-bottom))`.
- Avoid `100vh`/`100lvh` for full-height screens in standalone. Bug 316008 reports they include the status bar height when the tag isn't `black-translucent`, which makes the page scroll. Use `100dvh`/`100svh`.

**3. Don't build a fixed top bar that relies on drawing under the status bar.** If a sticky header is added later, give it a solid `background-color: var(--bg)`, not a gradient or `backdrop-filter`.

**4. Settle the head before real data, and reinstall once.** The status-bar mode is baked in when the icon is added. If a test install exists with other tags, delete and re-add it before the owner starts real use. Deleting the icon erases IndexedDB (`ios-storage-durability.md` §4), so export/import around any later change.

**5. Update the plan.** Drop "status bar `black-translucent` (or `black`)" from `github-pages-pwa-setup.md` implication 6. Fold these tags into ticket 02's build step. The manifest `theme_color`/`background_color` can hold only one colour. Pick one, since it probably only affects the install and launch screen (Unconfirmed).

**6. Device checks** (add to the on-device checklist). Note the iOS version (26.x vs 27.x) for each:
1. Light Appearance: strip is `#F4F5F7` with dark glyphs.
2. Dark Appearance: strip is `#0F1113` with light glyphs.
3. Flip Appearance in Control Centre while Cadence is open. Does the strip follow without a relaunch?
4. Scroll a long list. Nothing should blur at the top.
5. Log `env(safe-area-inset-top)`, `innerHeight` vs `screen.height`, and whether `100dvh` fills the screen with no bottom gap (bugs 301994, 313800).
6. If the strip's colour is wrong in one scheme, test which source iOS reads (`theme-color` vs `body`) before changing anything.

## Open questions

- **Unconfirmed:** on iOS 26 standalone, which wins when `theme-color` and the `body` background differ? And do scripted changes to either repaint live?
- **Unconfirmed:** what drives glyph colour under `black-translucent` on iOS 18–26: system appearance, page pixels or `theme-color`? It's moot if Cadence follows the recommendation.
- **Unconfirmed:** whether the 26.1-style letterbox regression (bug 301994, reopened for 27) is present in iOS 27.0 for *default*-style apps. It shouldn't matter, since that regression removes only the under-bar drawing Cadence would no longer use.
- **Unconfirmed:** what iOS 26 shows at launch before first paint (manifest `background_color` vs system colour) in light mode.
