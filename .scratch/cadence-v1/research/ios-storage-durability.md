# iOS Home Screen web app storage: durability, deletion, backup, export/import

Resolves: `.scratch/cadence-v1/issues/01-ios-storage-durability.md`
Researched: 2026-09-27. Target: iOS/iPadOS 18–26. Safari 27 / iOS 27 shipped 2026-09-14 and is noted where it matters.
App context: `https://spyobird.github.io/cadence/`, `idb-keyval` 6.2.6 (`package-lock.json`), default store (`src/lib/db.ts`).

**Confidence labels**
- **Confirmed**: stated by Apple or WebKit (docs, release notes, WebKit engineer on Bugzilla, or WebKit source code).
- **Inferred**: follows from primary sources but is not stated directly.
- **Secondary**: a third-party empirical report that Apple has not confirmed.
- **Unconfirmed**: no source found. Treat it as unknown.

---

## Answers at a glance

| Question | Answer | Confidence |
|---|---|---|
| Separate from Safari? | Yes. Each Home Screen web app has its own cookies and storage, separate from Safari. | Confirmed |
| Exempt from the 7-day cap? | Yes. ITP skips the web app's first-party domain. | Confirmed |
| Quota | Same as Safari (iOS 17+). One origin can use up to about 60% of the disk, and all origins together up to about 80%. | Confirmed |
| `persist()` | Supported. WebKit grants it without a prompt, using heuristics such as "opened as a Home Screen web app". Persisted origins are skipped by eviction. | Confirmed |
| Removing the icon | Removes the app. The app's data very likely goes with it. | Secondary (treat as destructive) |
| "Clear History and Website Data" | Apple's documentation doesn't mention web apps. Storage isolation suggests web apps are unaffected. | Unconfirmed |
| Offloading / iOS updates | No evidence either way. Offloading is an App Store setting. | Unconfirmed |
| Low storage | Evicts whole origins, least-recently-used first, unless the origin is persisted or active. | Confirmed |
| iCloud / device backup | Web app data sits in `Library/WebClips/<id>.webclip/` and is included in backups. Restoring it onto a new phone is not verified. | Secondary |
| iOS 26 "Open as Web App" | Any site added to the Home Screen opens as a web app by default, with no manifest needed. If the toggle is off, the icon is a Safari bookmark. No storage-policy change found. | Confirmed |
| Web Share with files | Safari/iOS 15+. Needs a tap (5 s transient activation). WebKit doesn't filter file types. | Confirmed (standalone: Inferred) |
| `<a download>` Blob | Behaves differently in standalone mode (a preview sheet you save from). Apple calls this Safari UI behaviour. Not reliable. | Confirmed bug report, behaviour Secondary |
| `<input type=file>` | Works through the iOS document picker. `accept` is mapped to UTTypes. | Confirmed (code); standalone Inferred |
| IndexedDB bugs | Network-process crash → "Connection to Indexed Database server lost". Reported on iOS 17.4 through at least 18.0.1. Fixes shipped in Safari 26.5 and 27.0. | Confirmed |

---

## 1. Is Home Screen web app storage separate from Safari? Is it exempt from the 7-day cap?

**Separate: Confirmed.**
- Apple, WWDC23 "What's new in web apps": *"Home Screen web apps have a standalone, app-like experience on iOS, with separate cookies and storage from the browser."* ([video/transcript](https://developer.apple.com/videos/play/wwdc2023/10120/), June 2023)
- WebKit Tracking Prevention reference: *"the website data of home screen web applications is kept isolated from Safari and thus will not be affected by ITP's classification of tracking behavior in Safari."* ([webkit.org/tracking-prevention](https://webkit.org/tracking-prevention/))
- WebKit Bugzilla 181849, Brent Fulgham (WebKit): *"The current behavior (on Apple platforms) is by design. Home Screen apps are created as isolated entities without shared state with the browser."* ([bug 181849](https://bugs.webkit.org/show_bug.cgi?id=181849), filed 2018, still NEW)
- Since Safari 17.2 (iOS 17.2), **cookies** are copied into the web app when it is added: *"Added support for copying cookies when saving a website to the Home Screen on iOS and iPadOS."* ([Safari 17.2 release notes](https://developer.apple.com/documentation/safari-release-notes/safari-17_2-release-notes)). The Mac equivalent states that *"Safari does not copy over any other kind of local storage"* ([WebKit, Safari 17.0](https://webkit.org/blog/14445/webkit-features-in-safari-17-0/)). **Inferred for iOS:** IndexedDB data you create in a Safari tab stays in Safari and does not carry into the installed app.
- **Each icon is a separate install.** *"iOS has supported multiple installs of the same web app since the very beginning … to support multiple accounts"* ([WebKit, Feb 2023](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)). That implies each install has its own storage (**Inferred**). firt.dev says it explicitly for iOS 14: *"Cookies, Web Storage, and IndexedDB are still isolated and separately from Safari and other icons of the same PWAs"*. In iOS 14, though, Service Worker registration and CacheStorage were shared with Safari ([firt.dev, iOS 14, Sep 2020](https://firt.dev/ios-14/), **Secondary**, and old).

**Exempt from the 7-day cap: Confirmed.**
- WebKit (March 24, 2020, iOS 13.4) introduced the cap. IndexedDB, LocalStorage, Service Worker registrations and cache are deleted after *"seven days of Safari use without user interaction on the site."* Home Screen web apps *"have their own counter of days of use"*, and *"We do not expect the first-party in such a web application to have its website data deleted"*. WebKit would consider deletion a serious bug. ([WebKit blog 10218](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/))
- Current reference: *"The first-party domain of home screen web applications is exempt from ITP's 7-day cap on all script-writeable storage, i.e. ITP always skips that domain in its website data removal algorithm."* ([webkit.org/tracking-prevention](https://webkit.org/tracking-prevention/))
- Source code (WebKit `main`, checked 2026-09-27): ITP's removal loop skips `shouldExemptFromWebsiteDataDeletion(domain)`. The exempt set includes `m_standaloneApplicationDomain` ([ResourceLoadStatisticsStore.cpp](https://github.com/WebKit/WebKit/blob/main/Source/WebKit/NetworkProcess/Classifier/ResourceLoadStatisticsStore.cpp), `domainsExemptFromWebsiteDataDeletion()`).

**Origin note for Cadence (Inferred).** The storage origin is `https://spyobird.github.io`, not `/cadence/`. `github.io` is on the [Public Suffix List](https://publicsuffix.org/list/public_suffix_list.dat), so the registrable domain is `spyobird.github.io`. Every GitHub Pages project site under this account shares that origin, and therefore the same IndexedDB namespace, within any one storage container. Eviction and `persist()` both work per origin or registrable domain.

## 2. Quotas

**Confirmed. Applies to iOS 17 and later.** Source: [WebKit, "Updates to Storage Policy", Aug 10, 2023](https://webkit.org/blog/14403/updates-to-storage-policy/).
- Browser app: *"the origin quota is up to 60% of the total disk space"*, and the overall quota is *"up to 80%"*. Other WKWebView apps get 15% and 20%.
- *"When a web app is running standalone (as Home Screen Web App on iOS …), it has the same origin quota and overall quota as when it is opened in a browser app."*
- Going over the origin quota throws `QuotaExceededError`. *"quota might change based on factors like existing usage and site visit frequency"*, so a failed write still has to be handled.
- MDN agrees and notes that before iOS 17 there was a 1 GiB initial quota with a user prompt ([MDN, Storage quotas and eviction criteria](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)). The often-quoted "50 MB" figures are outdated and predate iOS 17.
- `navigator.storage.estimate()` is available from Safari 17 ([MDN browser-compat-data](https://github.com/mdn/browser-compat-data/blob/main/api/StorageManager.json)).

Cadence's JSON data is tiny compared with these limits. The only realistic way to hit the quota is the exponential quest-history bug listed in `audit.md`.

## 3. `navigator.storage.persist()`

**Supported and meaningful in standalone mode: Confirmed.**
- *"WebKit currently grants a request based on heuristics like whether the website is opened as a Home Screen Web App."* An origin is exempt from eviction *"if it has active page at the time of eviction, or its storage is in persistent mode. By default, all origins use a best-effort mode."* ([WebKit, Aug 2023](https://webkit.org/blog/14403/updates-to-storage-policy/)). WebKit says the Storage API has been "fully supported" since Safari 17.0. BCD lists `persist()` from Safari 15.2.
- Safari approves or denies automatically, with **no prompt** ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)).
- How the heuristic works in code (WebKit `main`, [NetworkStorageManager.cpp](https://github.com/WebKit/WebKit/blob/main/Source/WebKit/NetworkProcess/storage/NetworkStorageManager.cpp) `persist()`/`persistOrigin()`):
  - `persist()` returns `true` only for a top-level origin whose registrable domain is in `domainsExemptFromWebsiteDataDeletion`. That set is the app-bound domains, managed domains, persisted sites and the **standalone application domain**.
  - The grant is written as a marker file, and `persisted()` checks that the file exists, so **the grant survives relaunches**. That contradicts a 2022 forum claim ([Apple forums 710157](https://developer.apple.com/forums/thread/710157), Secondary) that it has to be re-requested on every launch. Calling it on every launch is harmless anyway.
  - A June 2026 fix corrected `persistOrigin()` returning `true` when the file write failed ([commit 2fa8d7a](https://github.com/WebKit/WebKit/commit/2fa8d7a994aec95eec422d08b43b1e323091f5e6)).
- **What it changes:**
  - Quota- and storage-pressure-based eviction skips origins where `isActive || isPersisted` (same file, `performQuotaBasedEviction`).
  - WebKit added a **time-based eviction** in May 2026: origins not accessed within a threshold (default 180 days) lose their Storage-API data. It is *"gated on timeBasedEvictionEnabled, which is off by default"*, and it also skips persisted origins ([commit 4fb2a09](https://github.com/WebKit/WebKit/commit/4fb2a0985cf0d6956111bf749feaf75118b7f6de), [bug 313865](https://bugs.webkit.org/show_bug.cgi?id=313865)). Whether Safari or Home Screen web apps turn this on is **Unconfirmed**. It is another reason to persist.
- **What it does not protect against:** the user deleting the icon or clearing data, device loss, or IndexedDB bugs.

## 4. What deletes the data

| Action | Effect on Cadence's IndexedDB | Confidence | Source |
|---|---|---|---|
| 7 days without using the app | Nothing. The web app domain is exempt from ITP. | Confirmed | [tracking-prevention](https://webkit.org/tracking-prevention/) |
| **Removing the Home Screen icon** | MDN: *"removing the icon from the home screen deletes the PWA"*. Stuart Langridge found each web app's data in its own `Library/WebClips/<id>.webclip/` folder in a device backup; removing web apps cut his iCloud backup from 5 GB to 800 MB, which means the data was deleted. Apple doesn't document this. **Treat it as erasing all data.** | Secondary | [MDN Installing](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Installing), [kryogenix.org, Sep 17 2024](https://www.kryogenix.org/days/2024/09/17/on-ios-home-screen-web-apps-are-part-of-your-icloud-backup/) |
| Adding the site again / a second icon | A new install with empty storage. | Inferred | §1 |
| Settings → Safari → "Clear History and Website Data" | Apple's page (updated Sep 14, 2026) says it clears *"history, cache, and cookies"* and doesn't mention web apps. Isolation (§1) suggests web apps are unaffected. | Unconfirmed | [Apple Support 105082](https://support.apple.com/en-us/105082) |
| Low device storage / over the overall quota | Whole-origin LRU eviction. Persisted or active origins are skipped. | Confirmed | [WebKit Aug 2023](https://webkit.org/blog/14403/updates-to-storage-policy/) |
| "Offload Unused Apps" | An App Store setting (*"Tap Apps, tap App Store, then turn on Offload Unused Apps"*) that *"keeps your data"*. Web apps aren't App Store apps, so it probably doesn't apply. | Unconfirmed | [Apple iPhone User Guide](https://support.apple.com/guide/iphone/manage-storage-on-iphone-iph47c931112/ios) |
| iOS update | No reports found of updates wiping web app data. | Unconfirmed | none |
| Lockdown Mode | WebKit's Lockdown Mode *"Disabled IndexedDB"* and *"Disabled the File API and FileReader API"* (Safari 17). Safari websites can be excluded per site; whether that covers Home Screen web apps is unknown. The data is probably still on disk but unreachable (Unconfirmed). | Confirmed (disablement) | [Safari 17 notes](https://developer.apple.com/documentation/safari-release-notes/safari-17-release-notes), [Apple 105120](https://support.apple.com/en-us/105120) |
| WebKit eviction bugs (historical) | Safari 17.2: opening Web Inspector could delete LocalStorage/IndexedDB for many origins. Fixed in 17.4 (272951@main). Safari 17.4 also *"Fixed cases where website data is unexpectedly evicted."* | Confirmed | [bug 266559](https://bugs.webkit.org/show_bug.cgi?id=266559), [Safari 17.4 notes](https://developer.apple.com/documentation/safari-release-notes/safari-17_4-release-notes) |
| Changing the origin (GitHub username rename, custom domain, new host) | A new origin starts with empty storage. The old data stays behind, unreachable. | Inferred | same-origin model |

## 5. iCloud / device backups

- Apple's list of what iCloud Backup includes (page dated May 1, 2025) has *"app data for the apps that you've downloaded"* and says nothing about web apps or website data ([Apple 108770](https://support.apple.com/en-us/108770)).
- **Secondary, empirical (Stuart Langridge, Sep 17 2024).** An encrypted local backup made with libimobiledevice contained a `Library/WebClips/<id>.webclip/` folder for each Home Screen web app, holding its manifest and data. Some were over 1 GB. Deleting web apps shrank his iCloud backup, so web app data **is included in iCloud Backup**. The iCloud backup settings list doesn't show web apps; he filed this with Apple as a bug ([kryogenix.org](https://www.kryogenix.org/days/2024/09/17/on-ios-home-screen-web-apps-are-part-of-your-icloud-backup/)).
- **Restoring onto a new iPhone (from iCloud, a Finder backup, or Quick Start): Unconfirmed.** No source tested it.
- **Conclusion:** device backup may happen to save the data, but Cadence can't see or control it. A JSON export is the only backup the app can guarantee.

## 6. iOS 26 "Open as Web App"

- Safari 26.0 (released Sep 15, 2025): *"Added support for any website to become a web app on iOS or iPadOS."* It also fixed the Add to Home Screen flow failing to load webpage data ([Safari 26.0 notes](https://developer.apple.com/documentation/safari-release-notes/safari-26-release-notes)).
- *"By default, every website added to the Home Screen opens as a web app."* *"there are now zero requirements for 'installability' in Safari"*. A manifest is still used if present ([WebKit, Safari 26.0](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/)). If the user turns "Open as Web App" off, the icon becomes *"a bookmark that opens in their default browser"* ([WebKit WWDC25](https://webkit.org/blog/16993/news-from-wwdc25-web-technology-coming-this-fall-in-safari-26-beta/)).
- Apple's steps: Share → Add to Home Screen → **Turn on Open as Web App** → Add ([iPhone User Guide](https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios)).
- **No storage-policy change found.** I checked the Safari 26.0–26.5 and 27.0 release notes. The only storage items are IndexedDB fixes (§8).
- **Inferred:** a bookmark-mode icon runs in Safari with Safari's storage, so it gets **no** isolation and **is** subject to the 7-day ITP cap.

## 7. Export and import in standalone mode

### 7a. Web Share Level 2 with files (primary export path)
- Safari 15: *"Added support for Web Share level 2 enhancements to Web Share that enable sharing files from a web page to an app."* ([Safari 15 notes](https://developer.apple.com/documentation/safari-release-notes/safari-15-release-notes)). BCD lists `files` support from Safari 14.
- WebKit's `Navigator::share` rejects with `NotAllowedError` unless it can `consumeTransientActivation()`. The activation lasts **5 seconds** (`defaultTransientActivationDuration { 5_s }`) ([Navigator.cpp](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/page/Navigator.cpp), [LocalDOMWindow.cpp](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/page/LocalDOMWindow.cpp)). Build the `File` before or immediately after the tap, and don't run slow awaits first. The user cancelling gives `AbortError` ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share)).
- WebKit's `canShare` only checks that files are present and the feature flag is on. **It has no MIME allowlist** (Confirmed, code), so `application/json` passes on iOS. MDN's list of "usually shareable" types (Chromium's list) leaves out JSON. That matters only on non-WebKit browsers.
- **Standalone mode:** nothing in WebKit ties Web Share to browser mode or standalone mode (Inferred). Whether the iOS share sheet offers **"Save to Files"** for a `.json` file is iOS UI and **Unconfirmed**. Verify it on the device.

### 7b. `<a download>` with a Blob URL (fallback only)
- The `download` attribute works on iOS Safari from iOS 13 ([BCD](https://github.com/mdn/browser-compat-data/blob/main/html/elements/a.json)).
- [WebKit bug 275288](https://bugs.webkit.org/show_bug.cgi?id=275288) (June 2024, iOS 17), about a Blob `<a download>`:
  - In a Safari tab, a download prompt appears and the file goes to Downloads.
  - In the installed PWA, *"the popup is a preview of the file instead and the user has to click to save"*. The initial report said *"no indication of a download"*.
  - Apple (Karl Dubost): *"the UI difference … is expected here … It doesn't depend on WebKit"*. The bug was moved to an internal Safari UI radar with no public tracking.
- A 2018 thread reports that downloads did nothing at all in standalone mode ([Apple forums 95911](https://developer.apple.com/forums/thread/95911)).
- **Verdict:** it may work through a preview-and-save sheet. Keep it as a fallback and test it on the device.

### 7c. `<input type="file">` (import)
- Supported on iOS. WebKit's iOS upload panel ([WKFileUploadPanel.mm](https://github.com/WebKit/WebKit/blob/main/Source/WebKit/UIProcess/ios/forms/WKFileUploadPanel.mm)) opens a `UIDocumentPickerViewController` in import mode.
  - With no `accept`, any file (`UTTypeItem`) can be picked.
  - `accept` MIME types and `.ext` extensions (the latter resolved through WebKit's MIME registry) become UTTypes. `application/json` maps to `public.json`.
  - Files whose type doesn't match are greyed out (the greying is Secondary: [openradar 36726477](https://openradar.appspot.com/36726477)).
- Standalone mode uses the same WKWebView upload panel. No standalone-specific restriction was found (Inferred).
- Lockdown Mode disables FileReader and the File API (§4), which would break reading the imported file.
- Unconfirmed tip from community reports: a programmatic `.click()` on an input with the `hidden` attribute may not open the picker. Use a `<label for>` or a visually-hidden (not `hidden`) input.

## 8. Known IndexedDB bugs and `idb-keyval` mitigations

**WebKit / iOS**
- **[Bug 197050](https://bugs.webkit.org/show_bug.cgi?id=197050)** (filed Apr 2019, iOS 12+). Backgrounding the app while IndexedDB transactions were active crashed the network process, giving *"An internal error was encountered in the Indexed Database server"* or *"Connection to Indexed Database server lost"*.
  - Fixes: bug 196372 stops IndexedDB transactions when the process suspends. [Bug 259078](https://bugs.webkit.org/show_bug.cgi?id=259078) (Jul 2023, 265951@main) allows suspension with locked database files.
  - WebKit's advice (Sihui Liu): listen for `close` and reopen.
  - Resolution: CONFIGURATION CHANGED.
- **[Bug 273827](https://bugs.webkit.org/show_bug.cgi?id=273827)**, "REGRESSION (iOS 17.4): … Connection to Indexed Database server lost." Filed May 7, 2024.
  - Brady Eidson (WebKit): *"This error happens when WebKit's Networking process crashes."*
  - Sihui Liu: the site *"can listen to close event … and reopen database"*.
  - Reporters said `indexedDB.open()` also failed afterwards, and one WKWebView app said it persisted *"until their iOS device is fully restarted"*. Data written during that state is lost. Stored data was not deleted.
  - Alexey Proskuryakov (Jul 25, 2024): *"fixed in iOS 17.6 beta (and iOS 18 beta) with an OS change outside WebKit."* The Dexie author still saw it on iOS 18.0.1 (Oct 2024). Last comment, Oct 10, 2025: *"Not resolved. Regression. Still occurring."*
  - Reports come from websites, Capacitor/Ionic (WKWebView) apps, and error logs showing an "Apple Mail" user agent. No comment explicitly names a Home Screen web app. It likely applies to them too, because every WebKit client shares the same networking-process design (Inferred).
- **[Bug 282093](https://bugs.webkit.org/show_bug.cgi?id=282093)** (Oct 2024, iOS 17.4/18.0.1, NEW): random `UnknownError`/`AbortError` failures. Restarting Safari clears it temporarily.
- **Fixes in release notes:**
  - Safari 26.4 (Mar 24, 2026): *"Fixed an issue where IndexedDB databases might have mismatched metadata version and database name encoding format."*
  - **Safari 26.5 (May 11, 2026):** *"Fixed an issue where IndexedDB connections could become permanently broken until the page was reloaded."* ([notes](https://developer.apple.com/documentation/safari-release-notes/safari-26_5-release-notes))
  - **Safari 27.0 (Sep 14, 2026):** fixed IndexedDB *"incorrectly return[ing] a version 0 database after an abort during the initial `onupgradeneeded`"*; *"IndexedDB connections in workers to recover after a network process crash"*; and *"IndexedDB transactions could be blocked for an extended period before starting when another page's transaction was suspended in the background."* ([notes](https://developer.apple.com/documentation/safari-release-notes/safari-27-release-notes))
- Historical and irrelevant on iOS 18+: `indexedDB.open()` hung on first load in iOS 14.6 ([bug 226547](https://bugs.webkit.org/show_bug.cgi?id=226547), fixed in 14.7). idb-keyval removed its workaround in June 2022.

**`idb-keyval`** ([source](https://github.com/jakearchibald/idb-keyval/blob/main/src/index.ts), [npm versions](https://registry.npmjs.org/idb-keyval))
- **6.2.2 (2025-05-08), "Reconnect to the db if it closes":** `db.onclose = () => (dbp = undefined)`, with the comment *"It seems like Safari sometimes likes to just close the connection. It's supposed to fire this event when that happens. Let's hope it does!"* Cadence's 6.2.6 includes this (checked in `node_modules/idb-keyval/dist/index.js`).
- **6.3.0 (2026-07-08, [PR #185](https://github.com/jakearchibald/idb-keyval/pull/185)):** before this, a failed `open()` was cached forever as a rejected promise. 6.3.0 clears the cached promise on rejection so the next call retries. **Cadence is on 6.2.6 and doesn't have this fix.**
- **Remaining gap (Confirmed from the code):** if the connection dies without firing `close`, `db.transaction()` throws (e.g. *"The database connection is closing"*) and the stale cached connection is reused until a reload. This is open issue [#165](https://github.com/jakearchibald/idb-keyval/issues/165) (Jul 2023). The workaround is to create a fresh store with `createStore()` and retry.
- [Issue #180](https://github.com/jakearchibald/idb-keyval/issues/180) (Dec 2025): in Safari, large writes just before a same-origin navigation (e.g. in `beforeunload`) can freeze transactions. On iOS, `set` sometimes stays stuck while `get` completes.
- `set()` resolves only when the transaction's `complete` event fires (`promisifyRequest(store.transaction)`), so awaiting it is a real "saved" signal.

---

## Implications for Cadence

**1. Call `persist()`: yes.**
- On every launch, when running standalone: `if (!(await navigator.storage.persisted())) await navigator.storage.persist();`
- There is no prompt, and in standalone mode the grant should succeed.
- It protects against eviction under storage pressure or quota limits, and against WebKit's new time-based eviction if Apple turns it on.
- Record the result and show it in a small status line ("Storage: persistent / best-effort"). Never present it as a backup.

**2. Detect browser mode and warn.**
- If `matchMedia('(display-mode: standalone)')` is false (and `navigator.standalone` is not true), show a banner. It should say to add Cadence to the Home Screen with **Open as Web App on**, and that data in a Safari tab is separate and can be deleted after 7 days without use.
- Don't let the owner build real data in a Safari tab. Data doesn't move into the installed app.

**3. The backup UX must cover:**
- **Export:**
  - One file, `cadence-backup-YYYY-MM-DD.json`, typed `application/json`, containing a `schemaVersion`, the export time and every key (all quest versions, reflections, quarter/settings).
  - Primary path: `navigator.canShare({files})`, then `navigator.share({files})` called directly in the tap handler with the `File` already built (5 s activation window). Treat `AbortError` as a cancel, not an error.
  - Fallback: a Blob `<a download>`.
- **Import:**
  - A visible button wired to `<input type="file" accept="application/json,.json">`.
  - Validate the schema version and shape, show a preview ("12 reflections, 2 quests"), then an explicit replace confirmation.
  - Write atomically with `setMany`.
- **Nudges:** store a "last exported" timestamp. Nudge when it's stale (e.g. weekly) and always at quarter rollover. Also offer an export before any reset or destructive action.
- **Device acceptance test** on the owner's iPhone, before relying on any of this:
  1. Export, and confirm "Save to Files" appears and the file lands in Files.
  2. Add a *second* Cadence icon (fresh, empty storage) and import there to prove the round trip.
  3. Delete the test icon.

**4. Harden `src/lib/db.ts`.**
- Upgrade to `idb-keyval@^6.3.0`.
- Use a named store, `createStore('cadence', 'kv')`, instead of the default `keyval-store`. The origin `spyobird.github.io` is shared with every other Pages project on the account. Do this before real data exists, because renaming later orphans the data.
- Wrap each call:
  - On `InvalidStateError`/`UnknownError`, recreate the store and retry once.
  - If it still fails, show a blocking "Couldn't save. Close and reopen Cadence, or restart the iPhone" message and keep the unsaved input in memory.
  - Show "Saved" only after `set()` resolves.
  - Handle `QuotaExceededError`. It matters while the exponential-history bug in `audit.md` exists.
- Write small records immediately on explicit save. Never do large writes in `beforeunload`, `pagehide` or `visibilitychange`.

**5. The owner must never:**
- Delete the Cadence Home Screen icon (or re-install it) without a fresh export. Treat deleting it as erasing everything.
- Add Cadence with "Open as Web App" **off**, or use it in a Safari tab for real data.
- Expect a second icon to share data with the first.
- Change the origin (rename the GitHub account, add a custom domain, move hosts) without first exporting and then importing on the new origin. Renaming the repo also moves `start_url`, so export before doing that too.
- Turn on Lockdown Mode without first checking that Cadence still works. Lockdown Mode disables IndexedDB and FileReader.
- Treat iCloud Backup as the backup, or assume "Clear History and Website Data" is harmless. Both are unconfirmed, so export first.
- Stay on an old iOS. Safari 26.5 and 27.0 contain IndexedDB connection fixes.
