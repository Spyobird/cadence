# GitHub Pages + PWA setup for iOS install: findings

Ticket: [02-github-pages-pwa-setup](../issues/02-github-pages-pwa-setup.md) · Researched 2026-09-27 · Target: `https://spyobird.github.io/cadence/`

**Method.** Primary sources: Context7 docs for vite-plugin-pwa, Vite and idb-keyval; vite-pwa-org.netlify.app; vite.dev; the plugin and Workbox source at the pinned tags; the W3C Service Worker spec; webkit.org; Apple docs and Safari release notes; MDN and browser-compat-data; docs.github.com; the npm registry. I also ran three local experiments, none of which touched the repo's working tree:
- **Probe build.** A copy of the repo in `/tmp/cadence-probe`, upgraded to vite 8.3.1 + vite-plugin-pwa 1.3.0 + @vitejs/plugin-react 6.1.1, built with the config sketched below.
- **`npm ci` test.** The repo's current `package.json` + lockfile, run through `npm ci` in `/tmp/cadence-ci`.
- **Live `curl` checks** against `spyobird.github.io` and other `github.io` sites.

**Confidence tags.** **[H]** = stated by a primary source or reproduced locally. **[M]** = inferred from a primary source, or the primary source is partial. **[U]** = unconfirmed (secondary sources only, or not verified on a device).

---

## TL;DR

1. **Subpath config.** Set Vite `base: '/cadence/'`. The plugin then derives SW URL `/cadence/sw.js`, SW scope `/cadence/`, and manifest `start_url`/`scope` `/cadence/`. Set manifest `id: '/cadence/'` explicitly. Vite rewrites `/…` public-file links in `index.html` to `/cadence/…`. **[H]** (probe build)
2. **The current config never applies updates on its own.** `registerType: 'autoUpdate'` only forces `skipWaiting`/`clientsClaim` when `injectRegister` is `'auto'` or unset. The repo sets `'script'`, so the built `sw.js` has no `clientsClaim()` and only a message-triggered `skipWaiting()`. The client code never sends that message in autoUpdate mode. Result: a new version waits until every Cadence page is closed. **[H]** (plugin source and the repo's own `dist/sw.js`)
3. **Upgrade is worth it and low-risk.** Latest versions are vite-plugin-pwa 1.3.0 (peer `vite ^3…^8`) and Vite 8.3.1. Vite 5 is out of support. The plugin's breaking changes between 0.18 and 1.x were Workbox bumps and assets-generator changes, none of which affect this config. 1.3.0 adds `onNeedReload`, which lets autoUpdate defer the reload. **[H]**
4. **Update checks on iOS.** Browsers check for a new SW on navigations (a cold launch) and on explicit `registration.update()`. Resuming a backgrounded Home Screen app is not a navigation, so it needs an explicit check on `visibilitychange`. **[M]**
5. **CI will fail today.** `npm ci` fails with ERESOLVE (`vitest@^3` vs `@vitest/coverage-v8@^4`). Fix the dev dependencies before adding the Pages workflow. Pin CI to Node 24, the current LTS. **[H]**
6. **iOS head tags.**
   - `apple-touch-icon` (180×180, opaque) overrides manifest icons, and iOS ignores `purpose: maskable`. **[H]**
   - `viewport-fit=cover` is required for `env(safe-area-inset-*)` to be non-zero. **[H]**
   - The status-bar-style meta still applies in standalone mode. **[M]**
   - iOS does not generate splash screens from the manifest. **[M]**
   - iOS/iPadOS 26 opens any Home Screen site as a web app by default. **[H]**
7. **Shared origin.** Every project on `spyobird.github.io` shares one origin (IndexedDB, Cache Storage, SW registrations). On iOS, though, an installed Home Screen app gets its own storage, separate from Safari. **[H]**
8. **Custom domain on the user site.** Adding one would 301 `spyobird.github.io/cadence/*` to the new domain, which is a new origin. The installed app would keep running from its SW cache but could never update (SW script fetches reject redirects), and its data would be stranded on the old origin. **[H]** for the redirect (observed on other accounts) and the spec rule; **[M]** for the end-to-end iOS behavior.

---

## 1. Base path, manifest identity and SW scope under `/cadence/`

**Vite `base`.**
- For `https://<USER>.github.io/<REPO>/`, set `base: '/<REPO>/'`. **[H]** ([vite.dev: static deploy, GitHub Pages](https://vite.dev/guide/static-deploy#github-pages))
- Asset references in `.html` files are rewritten to respect `base`. **[H]** ([vite.dev: public base path](https://vite.dev/guide/build#public-base-path))
- `%BASE_URL%` is also available in HTML. **[H]** ([Vite source, `htmlEnvHook`](https://github.com/vitejs/vite/blob/main/packages/vite/src/node/plugins/html.ts))
- In the probe build, `<link rel="icon" href="/favicon.svg">` came out as `/cadence/favicon.svg`, and the manifest link was injected as `/cadence/manifest.webmanifest`. **[H]** (probe)
- `base` also applies to `vite dev` and `vite preview`, so local URLs become `http://localhost:5173/cadence/` and the ngrok equivalent. **[M]** ([vite.dev: `base`](https://vite.dev/config/shared-options#base))

**Plugin defaults derived from `base`.** vite-plugin-pwa resolves `scope = options.scope || basePath`, manifest `start_url: basePath`, and `scope`. **[H]** ([`src/options.ts` @ v1.3.0](https://github.com/vite-pwa/vite-plugin-pwa/blob/v1.3.0/src/options.ts)) The probe output confirms it:
- `new Workbox('/cadence/sw.js', { scope: '/cadence/' })`
- manifest `"start_url":"/cadence/","scope":"/cadence/","id":"/cadence/"`
- the SW's `createHandlerBoundToURL("index.html")` resolves relative to the SW, which is `/cadence/index.html`.

The default `navigateFallback: 'index.html'` is already set by the plugin. **[H]** (same source)

**SW max scope.** Without a `Service-Worker-Allowed` header, a script at `/cadence/sw.js` can control at most `/cadence/`. GitHub Pages can't set custom headers. The spec notes that the path restriction "is not considered a hard security boundary, as only origins are." **[H]** ([SW spec, Update algorithm + §6.5 path restriction](https://w3c.github.io/ServiceWorker/))

**Manifest `id`.**
- If `id` is omitted, it falls back to `start_url`. **[H]** ([MDN `id`](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/id))
- A relative `id` resolves against the **origin** of `start_url`, not its path. `id: 'cadence'` would become `https://spyobird.github.io/cadence` without the trailing slash, so write `'/cadence/'`. **[H]** (same source)
- Keep `id` stable forever; it lets `start_url` change later without changing the app's identity. **[H]** (same source)
- Safari/iOS supports `id` from 16.4 and uses it to sync Focus settings. **[H]** ([WebKit: Web Push for Web Apps](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/); [BCD `manifests/webapp/id`](https://github.com/mdn/browser-compat-data/blob/main/manifests/webapp/id.json))

**Manifest `scope`.** The default is the `start_url` directory. `start_url` must sit inside `scope`. Off-scope navigations show browser UI and are not blocked. **[H]** ([MDN `scope`](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/scope))

**Stray `public/manifest.json`.** It has a white `theme_color` and would be published at `/cadence/manifest.json`. It is unused because the plugin links `manifest.webmanifest`. Delete it to avoid confusion. **[H]** (repo + `dist/index.html`)

## 2. Versions and whether to upgrade

| Package | Repo | Latest (npm, 2026-09-27) | Notes |
|---|---|---|---|
| vite | ^5.2 (5.4.21 installed) | **8.3.1** | Vite 5 is unsupported: only 8.3 gets regular patches, 7.3/8.2 important fixes, 6.4/8.1 security only. **[H]** ([vite.dev/releases](https://vite.dev/releases)). 5.4.21 (2025-10-20) was the last 5.x release. **[H]** ([npm](https://www.npmjs.com/package/vite?activeTab=versions)) |
| vite-plugin-pwa | ^0.18.2 | **1.3.0** (2026-05-05) | Peer `vite ^3 \|\| … \|\| ^8`, `workbox-build ^7.4.1`, engines `node >=16`. **[H]** ([npm](https://www.npmjs.com/package/vite-plugin-pwa)) |
| @vitejs/plugin-react | ^4.7 | 6.1.1 (peer `vite ^8`); 5.2.0 supports vite 4–8 | 4.7 supports vite 4–7. **[H]** (npm registry) |
| vitest / @vitest/coverage-v8 | ^3.2.6 / ^4.1.9 (**conflict**) | vitest 4.1.11 (peer `vite ^6–8`, node 20/22/24); vitest 5.0.2 (node ≥22.12) | **[H]** (npm registry) |

**Breaking changes in vite-plugin-pwa since 0.18** (release notes):
- 0.19: experimental PWA-assets generation ([v0.19.0](https://github.com/vite-pwa/vite-plugin-pwa/releases/tag/v0.19.0))
- 0.20: Workbox 7.1 ([v0.20.0](https://github.com/vite-pwa/vite-plugin-pwa/releases/tag/v0.20.0))
- 0.21: Workbox 7.3 ([v0.21.0](https://github.com/vite-pwa/vite-plugin-pwa/releases/tag/v0.21.0))
- 1.0: assets-generator v1, and "avoid assigning to bundle object" ([v1.0.0](https://github.com/vite-pwa/vite-plugin-pwa/releases/tag/v1.0.0))
- 1.3: Vite 8 peer support plus the client **`onNeedReload`** callback ([v1.3.0](https://github.com/vite-pwa/vite-plugin-pwa/releases/tag/v1.3.0))

None of these touch Cadence's config surface. **[H]**

**Vite 8.**
- Requires Node 20.19+ or 22.12+. **[H]** ([Vite 8 announcement](https://vite.dev/blog/announcing-vite8))
- Moves to Rolldown/Oxc, with a compatibility layer that auto-converts `esbuild`/`rollupOptions` config. **[H]** ([migration guide](https://vite.dev/guide/migration))
- Cadence's config uses neither. The probe built cleanly on 8.3.1 in about 0.4 s. **[H]** (probe)

**Node.**
- Local machine: v24.15.0.
- Node 24 is the current LTS ("Krypton"). Node 26 is Current. Node 20's last release was 2026-03-24. **[H]** ([nodejs.org/dist/index.json](https://nodejs.org/dist/index.json))
- Vite's own Pages workflow uses `node-version: lts/*`, which will switch to 26 when that becomes LTS. Pinning 24 via `.nvmrc` keeps CI and local identical. **[M]**
- CLAUDE.md's "Node 18 / SWC crash" notes describe an older devcontainer and are stale for this machine. **[H]** (local `node --version`)

**Security angle.**
- The site on Pages is static, so dev-server CVEs don't affect it. But `server.allowedHosts: true` + ngrok exposes the **dev server** to the internet.
- 2026 dev-server advisories (e.g., GHSA-p9ff-h696-f583, arbitrary file read) list 6.x/7.x/8.x ranges. 5.x is not listed, but it is also no longer assessed or patched. **[M]** ([Vite security advisories](https://github.com/vitejs/vite/security/advisories))

**Verdict.** Upgrade to vite 8 + vite-plugin-pwa 1.3 + plugin-react 6 (or 5.2) + vitest 4.1/coverage-v8 4.1 in one small step before the first deploy. Staying on 5.4/0.18 would also work for the subpath, because the defaults derive from `base` in 0.18 too. But it keeps an unsupported toolchain and loses `onNeedReload`. **[H]**

## 3. How updates reach an installed iOS web app

**When a browser checks for a new SW.**
- It runs Soft Update when a navigation (non-subresource request) is handled by the registration, or on subresource requests when the registration is stale (more than 86400 s since the last check). **[H]** ([SW spec: Handle Fetch, "stale"](https://w3c.github.io/ServiceWorker/))
- It also checks on functional events (push/sync) if more than 24 h have passed, and when `register()` is called with a changed URL. **[H]** ([web.dev: SW lifecycle](https://web.dev/articles/service-worker-lifecycle))
- `registration.update()` forces a check. **[H]** (same)
- By default (`updateViaCache: 'imports'`) the main SW script is fetched with cache mode `no-cache`, so GitHub Pages' `Cache-Control: max-age=600` doesn't delay the byte comparison in the browser. Safari has supported `updateViaCache` since 11.1. **[H]** ([SW spec, Update → fetch hook](https://w3c.github.io/ServiceWorker/); [BCD ServiceWorkerRegistration](https://github.com/mdn/browser-compat-data/blob/main/api/ServiceWorkerRegistration.json))
- GitHub Pages sends `cache-control: max-age=600` and is fronted by Fastly (`x-cache: HIT`). **[H]** (`curl -I https://spyobird.github.io/`, 2026-09-27)
- Whether Pages purges the CDN on deploy isn't documented. **[U]**

**What that means on iOS.**
- A **cold launch** of the Home Screen app is a navigation, so it triggers a check.
- **Resuming** from the app switcher doesn't navigate, so it doesn't check. The app can stay on an old version for as long as iOS keeps it suspended. **[M]** (spec reasoning; iOS suspend/kill timing not documented)
- The plugin's documented fix is a periodic `r.update()` in `onRegisteredSW`, guarded by an online check and a `fetch(swUrl, {cache:'no-store'})`. **[H]** ([vite-pwa: periodic SW updates](https://vite-pwa-org.netlify.app/guide/periodic-sw-updates))
- For iOS, add the same check on `visibilitychange → visible`. **[M]**

**What a new version does once found.**
- Workbox precaches revisioned entries such as `index.html` with `cache: 'reload'`, which bypasses the browser HTTP cache. Hashed `assets/*` use `default`, which is fine because their names change. **[H]** ([Workbox `PrecacheController` @ 7.3](https://github.com/GoogleChrome/workbox/blob/v7.3.0/packages/workbox-precaching/src/PrecacheController.ts))
- `cleanupOutdatedCaches` is on by default and recommended. **[H]** ([vite-pwa: auto-update](https://vite-pwa-org.netlify.app/guide/auto-update))
- Without `skipWaiting`, the new worker **waits** until no page uses the old one. A single reload isn't enough; all tabs/windows must close. **[H]** ([web.dev: SW lifecycle](https://web.dev/articles/service-worker-lifecycle))

**autoUpdate vs prompt.**
- **`autoUpdate`** sets `workbox.skipWaiting` and `clientsClaim` to `true`. The client then reloads the page after the new SW activates. The docs warn that users "can lose data … filling in a form." **[H]** ([vite-pwa: auto-update](https://vite-pwa-org.netlify.app/guide/auto-update))
- The skip/claim flags are forced **only when `injectRegister` is `'auto'` or unset**: `if ((injectRegister === 'auto' || injectRegister == null) && registerType === 'autoUpdate')`. **[H]** ([`src/options.ts` @ v1.3.0](https://github.com/vite-pwa/vite-plugin-pwa/blob/v1.3.0/src/options.ts), identical in the installed 0.18.2 `dist/index.js:767`)
- In autoUpdate mode the client calls `onNeedReload()` if provided (≥1.3.0), otherwise `window.location.reload()`, on the Workbox `activated` event with `isUpdate || isExternal`. It never sends `SKIP_WAITING`. **[H]** ([`src/client/build/register.ts` @ v1.3.0](https://github.com/vite-pwa/vite-plugin-pwa/blob/v1.3.0/src/client/build/register.ts))
- **`prompt`** leaves the new SW waiting and calls `onNeedRefresh`. The app shows UI, and `updateSW()` sends skip-waiting and reloads. **[H]** ([vite-pwa: prompt for update](https://vite-pwa-org.netlify.app/guide/prompt-for-update))
- **`injectRegister`:**
  - `'auto'` (the default) injects nothing when the app imports a `virtual:pwa-register*` module, and falls back to a `<script>` otherwise.
  - `'script'` always injects `registerSW.js`.
  - `null`/`false` is manual. **[H]** ([vite-pwa: register SW](https://vite-pwa-org.netlify.app/guide/register-service-worker))

**Cadence today (a bug).**
- Config: `registerType: 'autoUpdate'`, `injectRegister: 'script'`, plus `registerSW()` in `main.tsx`.
- Two registrations: both the injected `registerSW.js` and workbox-window register the same `/sw.js`. That is redundant but harmless.
- More importantly, `'script'` disables the forced `skipWaiting`/`clientsClaim`. The repo's `dist/sw.js` confirms it: no `clientsClaim()`, and `skipWaiting()` only inside a `SKIP_WAITING` message handler.
- The autoUpdate client never posts that message and has no `onNeedRefresh`.
- **Net effect: every deploy sits in "waiting" until the iPhone app is fully closed (swiped away) and relaunched, with no UI telling the user.** **[H]** (code + built artifact)

**Recommendation.**
- Keep `autoUpdate`, which fits the low-friction principle.
- Omit `injectRegister`, and also set `workbox.skipWaiting/clientsClaim: true` explicitly so behavior doesn't depend on that coupling.
- Register once, in `main.tsx`, with `immediate: true`.
- Add hourly and on-resume update checks.
- Use `onNeedReload` (1.3+) to reload immediately unless a check-in or quest edit has unsaved text; otherwise reload on the next resume.
- The probe build emitted `self.skipWaiting()` and `clientsClaim()`, and no `registerSW.js`. **[H]** (probe)

**Precache contents.** The current `globPatterns` + `includeManifestIcons` produce duplicate precache entries with identical revisions (visible in `dist/sw.js`). This is harmless. Dropping `includeAssets` when `globPatterns` already covers png/svg keeps the list clean. **[H]** (build output)

## 4. GitHub Actions deploy (official flow)

- **Source setting.** In the repo: Settings → Pages → Build and deployment → Source: **GitHub Actions**. **[H]** ([GitHub docs: publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site); [vite.dev](https://vite.dev/guide/static-deploy#github-pages))
- **Permissions and environment.** The deploy job needs `pages: write` and `id-token: write`. The environment defaults to `github-pages`. **[H]** ([GitHub docs: custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages))
- **Artifact.** It is a gzip'd tar under 10 GB, without symlinks. **[H]** (same)
- **Plan.** On GitHub Free the repo must be public. **[H]** ([GitHub docs: creating a Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site))
- **Limits.**
  - Site ≤ 1 GB.
  - Soft limit of 100 GB/month bandwidth.
  - Deploys time out after 10 min.
  - The 10 builds/hour soft limit doesn't apply to custom Actions workflows.

  **[H]** ([GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits))
- **Current action majors:** `actions/checkout` v7.0.1, `actions/setup-node` v7.0.0 (supports `node-version-file`, `cache`), `actions/configure-pages` v6.0.0, `actions/upload-pages-artifact` v5.0.0 (`path`, `include-hidden-files` default false), `actions/deploy-pages` v5.0.1. **[H]** (GitHub releases API and each repo's `action.yml`, 2026-09-27)
  - Vite's maintained workflow uses exactly these majors, pinned by SHA. **[H]** ([`static-deploy-github-pages.yaml`](https://github.com/vitejs/vite/blob/main/docs/guide/static-deploy-github-pages.yaml))
  - GitHub's `actions/starter-workflows` `pages/static.yml` still shows older majors (checkout v4, upload v3). Don't copy it. **[H]** ([starter-workflows](https://github.com/actions/starter-workflows/blob/main/pages/static.yml))
- **Deep links.** No SPA `404.html` trick is needed. Cadence has one URL (`/cadence/`), and offline navigations inside scope are served by the SW's `navigateFallback`. **[M]**
- **Blocker.** `npm ci` currently **fails** with ERESOLVE (`@vitest/coverage-v8@4.1.9` peer `vitest@4.1.9` vs root `vitest@^3.2.6`). Reproduced from the repo's `package.json` + `package-lock.json`. **[H]** (local `npm ci`)

## 5. iOS head tags in 2026: what is still needed

| Item | Status | Evidence |
|---|---|---|
| Web app mode | iOS/iPadOS 26: **every** site added to the Home Screen opens as a web app by default. An "Open as Web App" toggle lets the user opt out. A manifest is no longer required, but its benefits still apply. | **[H]** [WWDC25 WebKit post](https://webkit.org/blog/16993/news-from-wwdc25-web-technology-coming-this-fall-in-safari-26-beta/), [Safari 26.0 features](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/), [Safari 26 release notes](https://developer.apple.com/documentation/safari-release-notes/safari-26-release-notes) |
| Earlier iOS | A manifest with `display: standalone`/`fullscreen` opens as a web app. | **[H]** [WebKit 16.4 post](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/) |
| `apple-touch-icon` 180×180 | **Still recommended.** It **takes precedence** over manifest icons. Manifest icons (iOS 15.4+) are used only when no `apple-touch-icon` exists **and** the icon's `purpose` is `any` or absent. There is an open WebKit report that Safari picks a low-res manifest icon ([bug 235877](https://bugs.webkit.org/show_bug.cgi?id=235877), not re-checked: 502). Make it **opaque**: the vite-pwa assets generator fills the Apple icon with a background colour and keeps the others transparent. | **[H]** [Safari 15.4 post](https://webkit.org/blog/12445/new-webkit-features-in-safari-15-4/), [BCD icons note](https://github.com/mdn/browser-compat-data/blob/main/manifests/webapp/icons.json), [vite-pwa assets generator](https://vite-pwa-org.netlify.app/assets-generator/) |
| Maskable icons | **Ignored on iOS** (see the `purpose` rule above). Only useful for Android/desktop Chrome, so optional for an iPhone-only app. | **[H]** same |
| Manifest icons 192 + 512 | Minimal PWA requirement; also the fallback on iOS. The current PNGs are 1×1 placeholders. | **[H]** [vite-pwa minimal requirements](https://vite-pwa-org.netlify.app/guide/pwa-minimal-requirements); `file public/*.png` |
| `viewport-fit=cover` | **Required** for full-screen layout and non-zero `env(safe-area-inset-*)`. | **[H]** [WebKit: Designing for iPhone X](https://webkit.org/blog/7929/designing-websites-for-iphone-x/) |
| `apple-mobile-web-app-status-bar-style` | Values: `default`, `black` (content below the bar), `black-translucent` (content under the bar; needs top safe-area padding). web.dev: theme colour is ignored with `black-translucent`. Apple's archived reference says the tag only works with `apple-mobile-web-app-capable`. Whether manifest-standalone alone is enough on iOS 26 is **not documented**, so keeping both tags is cheap. | **[H]** [Apple meta tags (archived)](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariHTMLRef/Articles/MetaTags.html), [web.dev enhancements](https://web.dev/learn/pwa/enhancements); **[U]** for iOS 26 specifics |
| `apple-mobile-web-app-title` | Still the Home Screen label source (default: `<title>`). The manifest `short_name`/`name` likely also works. | **[H]** [Apple: configuring web apps (archived)](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html); **[U]** for manifest precedence |
| `theme-color` | Supported by iOS Safari since 15. Several write-ups say Safari 26 ignores it for toolbar tinting and samples `body`/fixed-element backgrounds instead. **Not found in Apple's 26.x/27 release notes.** Keep it (cheap, used by other browsers) and set an explicit `html, body` background. | **[H]** [BCD theme_color](https://github.com/mdn/browser-compat-data/blob/main/manifests/webapp/theme_color.json); **[U]** for the Safari 26 change |
| Startup / splash images | iOS does **not** generate a splash from the manifest. It needs one `apple-touch-startup-image` per exact device size and orientation (Google's web.dev; the Apple dev-forum thread has no Apple reply). The vite-pwa assets generator can emit them (`createAppleSplashScreens`). **Optional**: Cadence loads from cache fast, and a dark `html` background limits the flash. | **[M]** [web.dev enhancements](https://web.dev/learn/pwa/enhancements), [assets-generator CLI](https://vite-pwa-org.netlify.app/assets-generator/cli), [Apple forums 733490](https://developer.apple.com/forums/thread/733490) |
| Manifest `id` | Supported on iOS 16.4+. | **[H]** see §1 |

## 6. Shared origin (`spyobird.github.io`) and the custom-domain question

**One origin, many projects.**
- An origin is scheme + host + port; paths don't count. IndexedDB, Cache API, localStorage and SW registrations are per origin. **[H]** ([MDN storage quotas](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria))
- So `/cadence/` and every sibling project page, plus the user site at `/`, share storage in the same browser context.
- `github.io` is on the Public Suffix List, so other users' sites are separate sites, not just separate origins. **[H]** ([PSL](https://publicsuffix.org/list/public_suffix_list.dat))

**What a sibling page could do (same browser context):**
- **Storage.** Read, write or clear Cadence's IndexedDB. Cadence uses idb-keyval's **default** DB `keyval-store` / store `keyval`, and `db.reset()` calls `clear()` on it. Any sibling using idb-keyval defaults would share or clobber that same store. **[H]** ([idb-keyval custom stores](https://github.com/jakearchibald/idb-keyval/blob/main/custom-stores.md); `src/lib/db.ts`)
- **SW registrations.** List or unregister Cadence's SW (`getRegistrations()` is per container/origin). **[H]** ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/getRegistrations))
- **Scope.** A sibling at `/other/sw.js` can't take `/cadence/` scope (see the path restriction in §1). A **root** SW from the user site (`/sw.js`, scope `/`) could control `/cadence/` pages until Cadence's own, longer `/cadence/` scope is registered, because the longest matching scope wins. **[H]** ([SW spec: Match Service Worker Registration](https://w3c.github.io/ServiceWorker/))
- **Precache deletion.** Workbox's `cleanupOutdatedCaches` deletes caches whose name contains `-precache-` **and** its own `registration.scope`. Cadence's cache is named `workbox-precache-v2-https://spyobird.github.io/cadence/`. A root-scoped Workbox SW on the user site (scope string `https://spyobird.github.io/`) would therefore delete Cadence's precache in that context. Workbox falls back to network, so the effect is loss of offline support until the next update. **[H]** ([Workbox `deleteOutdatedCaches`](https://github.com/GoogleChrome/workbox/blob/v7.3.0/packages/workbox-precaching/src/utils/deleteOutdatedCaches.ts), [`cacheNames`](https://github.com/GoogleChrome/workbox/blob/v7.3.0/packages/workbox-core/src/_private/cacheNames.ts)); **[M]** for the impact
- **Today:** the user site is a Next.js starter with no SW or manifest (`/sw.js`, `/manifest.json` → 404; `/cadence/` currently → user-site 404). **[H]** (`curl`, 2026-09-27)

**Why this mostly doesn't bite on the iPhone.**
- Home Screen web apps are "isolated entities without shared state with the browser" (WebKit engineer, by design). **[H]** ([WebKit bug 181849](https://bugs.webkit.org/show_bug.cgi?id=181849))
- They are not part of Safari and have their own storage accounting. **[H]** ([WebKit: full third-party cookie blocking](https://webkit.org/blog/10218/full-third-party-cookie-blocking-and-more/); [WebKit storage policy](https://webkit.org/blog/14403/updates-to-storage-policy/))
- iOS supports multiple installs of the same web app, each with its own identity. **[H]** ([WebKit 16.4 post](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/))
- So a sibling project visited in Safari can't touch the installed Cadence's data. The shared-origin risks above apply to Safari tabs, desktop testing, and anything loaded *inside* the Cadence app container. **[M]** (per-install container isolation is implied rather than stated outright)
- Corollary: data entered in a Safari tab doesn't carry into the installed app. Install first, then enter data. (Ticket 01 covers durability.)

**If a custom domain is ever added to the user site.**
- GitHub docs: project sites without their own custom domain become available at `<custom-domain>/<repo>`. **[H]** ([GitHub: about custom domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/about-custom-domains-and-github-pages))
- The docs don't state the redirect, but it is observable. `https://addyosmani.github.io/basket.js/` → `301 http://addyosmani.com/basket.js/`, and `sindresorhus.github.io/devtools-detect/` → `301 sindresorhus.com/devtools-detect/`. **[H]** (`curl`, 2026-09-27)
- The new domain is a **different origin**, so a fresh install there starts with empty IndexedDB. **[H]** (MDN origin definition above)
- The already-installed app keeps opening from its SW cache, because in-scope navigations are served by `navigateFallback` without the network. Its update checks fetch `/cadence/sw.js` with redirect mode `"error"`, so the 301 makes every update fail: the app is **frozen on its last version**, and its data stays on the old origin. **[H]** for the spec rule ([SW spec, Update: "Set request's redirect mode to 'error'"](https://w3c.github.io/ServiceWorker/)); **[M]** for the iOS end-to-end behavior
- If that SW registration is ever lost (eviction, or WebKit clean-up such as Safari 27's "unregister when the main script is missing", whose scope is unclear), the next launch follows the 301 to the new origin with no data. **[U]** ([Safari 27 release notes](https://developer.apple.com/documentation/safari-release-notes/safari-27-release-notes))
- The same applies to **any** origin move (renaming the account, moving to another host): the only migration path is export → import.
- **Alternative:** a dedicated origin that no other project shares, e.g. a free GitHub organization whose `<org>.github.io` repo hosts Cadence at `/`. It removes the sibling concerns and decouples Cadence from what happens to `spyobird.github.io`. **[H]** that org sites exist at `<org>.github.io` ([GitHub: about Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages); [creating a site](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)); the trade-off judgement is mine.

---

## Recommended config sketch (text only; not applied)

### `vite.config.ts`
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/cadence/',                       // project page subpath; dev/preview also serve under /cadence/
  server: { host: true, allowedHosts: true },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // injectRegister omitted (= 'auto'): main.tsx imports virtual:pwa-register, so nothing is injected
      // and the SW is registered exactly once. Do NOT set 'script' (disables forced skipWaiting/clientsClaim).
      // devOptions omitted: no SW in `vite dev`; test the SW with `npm run build && npm run preview`.
      manifest: {
        id: '/cadence/',                   // stable identity; never change
        name: 'Cadence',
        short_name: 'Cadence',
        description: 'Quarterly Goal Manager',
        start_url: '/cadence/',            // plugin default = base; explicit for readability
        scope: '/cadence/',
        display: 'standalone',
        theme_color: '#0F1113',
        background_color: '#0F1113',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }, // Android only; optional
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        clientsClaim: true,                // explicit, independent of injectRegister coupling
        skipWaiting: true,
        // navigateFallback defaults to 'index.html' (resolved to /cadence/index.html); cleanupOutdatedCaches defaults to true
      },
    }),
  ],
})
```
Built and checked in the probe (vite 8.3.1 / plugin 1.3.0). Output: `dist/manifest.webmanifest` with `/cadence/` start_url/scope/id, `new Workbox('/cadence/sw.js', {scope:'/cadence/'})`, and `skipWaiting()` + `clientsClaim()` in `sw.js`, with no `registerSW.js`.

### `src/main.tsx` (registration section)
```ts
import { registerSW } from 'virtual:pwa-register'

const UPDATE_CHECK_MS = 60 * 60 * 1000
let reloadPending = false

registerSW({
  immediate: true,
  // v1.3+: called instead of window.location.reload() when a new SW has activated
  onNeedReload() {
    if (hasUnsavedInput()) reloadPending = true   // app-defined: true while a check-in/quest edit is dirty
    else window.location.reload()
  },
  onRegisteredSW(swUrl, r) {
    if (!r) return
    const check = async () => {
      if (r.installing || !navigator.onLine) return
      const resp = await fetch(swUrl, { cache: 'no-store', headers: { 'cache-control': 'no-cache' } })
      if (resp.status === 200) await r.update()
    }
    setInterval(check, UPDATE_CHECK_MS)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState !== 'visible') return
      if (reloadPending && !hasUnsavedInput()) window.location.reload()
      else void check()                              // iOS resume is not a navigation → no automatic check
    })
  },
})
```
The `check` body follows the plugin's documented pattern ([periodic SW updates](https://vite-pwa-org.netlify.app/guide/periodic-sw-updates)). `hasUnsavedInput` is a placeholder the app would provide.

### `vite-env.d.ts`
Replace the hand-written `declare module 'virtual:pwa-register…'` blocks with the plugin's shipped types:
```ts
/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />
```
The package exports `./client` → `client.d.ts`, and 1.3.0's `RegisterSWOptions` includes `onNeedReload` and `onRegisteredSW`. **[H]** (installed package in probe; [vite-pwa FAQ: type declarations](https://vite-pwa-org.netlify.app/guide/faq))

### `index.html` `<head>`
```html
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<title>Cadence</title>
<meta name="description" content="Quarterly Goal Manager" />
<meta name="theme-color" content="#0F1113" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" /> <!-- or "black" to avoid top safe-area padding -->
<meta name="apple-mobile-web-app-title" content="Cadence" />
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />                       <!-- Vite rewrites to /cadence/… -->
<link rel="apple-touch-icon" href="/apple-touch-icon-180x180.png" sizes="180x180" /> <!-- opaque, #0F1113 background -->
<style>html, body { background-color: #0F1113; }</style>
```
The manifest `<link>` is injected by the plugin. With `black-translucent`, the layout must pad `env(safe-area-inset-top)`, and the fixed bottom nav must pad `env(safe-area-inset-bottom)`. Icons can be generated once with the vite-pwa assets generator (`minimal-2023` preset: 64/192/512, maskable 512, apple 180) and committed. The in-plugin `pwaAssets` integration is still marked experimental. **[H]** ([assets generator](https://vite-pwa-org.netlify.app/assets-generator/), [integrations](https://vite-pwa-org.netlify.app/assets-generator/integrations))

### `.nvmrc`
```
24
```

### `.github/workflows/deploy.yml`
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false   # let an in-flight production deploy finish

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - run: npm test -- --run
      - run: npm run build
      - uses: actions/configure-pages@v6
      - uses: actions/upload-pages-artifact@v5
        with:
          path: ./dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v5
```
Major-version tags are used for readability. Vite's reference workflow pins full SHAs instead, which is the stricter option. One-time manual steps: push to a public GitHub repo, then Settings → Pages → Source: GitHub Actions.

### `src/lib/db.ts` (origin hygiene)
```ts
import { createStore, get, set, del, clear } from 'idb-keyval'
const store = createStore('cadence', 'kv')   // not the shared default 'keyval-store'/'keyval'
// pass `store` as the last argument to get/set/del/clear
```
([idb-keyval `createStore`](https://github.com/jakearchibald/idb-keyval/blob/main/custom-stores.md)). Existing data may be discarded per the map, so renaming the store costs nothing now.

---

## Open questions / verify on the device

- **[U]** Does resuming Cadence from the app switcher ever trigger an SW update check without the `visibilitychange` hook? Test: deploy a visible change, resume without killing the app, and observe.
- **[U]** How long iOS keeps a Home Screen app suspended before a cold relaunch, which is how long it can stay stale without the hook.
- **[U]** Does GitHub Pages purge its Fastly edge on deploy? Check `curl -I …/cadence/sw.js` (`age`, `x-cache`) right after the first deploy. If the edge could serve an old `index.html` alongside a new `sw.js` for up to 600 s, the new precache could pin a stale shell.
- **[U]** On iOS 26, is `apple-mobile-web-app-status-bar-style` honoured without `apple-mobile-web-app-capable`, and is `theme-color` used at all in standalone mode?
- **[U]** What iOS shows during launch without `apple-touch-startup-image` (white vs. `background_color`). Decide on splash images after seeing it.

## Implications for Cadence

1. **Decide the origin before the owner enters real data.** `spyobird.github.io/cadence/` is workable: on iOS the installed app's storage is isolated from Safari and from sibling projects. But the data is bound to that origin forever. Record a standing rule: **never add a custom domain to the `spyobird.github.io` user site** without first exporting Cadence data. If that constraint feels risky, host Cadence on a dedicated origin (e.g. a free org's `<org>.github.io`) now, while migration is free.
2. **Backup/export moves from "nice-to-have" toward "required before any origin change".** Any move of the app (domain, account, host) strands data without it. This connects to ticket 01's export/import findings.
3. **Fix the update path in the PWA setup ticket.** Remove `injectRegister: 'script'` and register once in `main.tsx`. Set `skipWaiting`/`clientsClaim`. Add hourly and on-resume `r.update()`. Use `onNeedReload` so an update never wipes a half-typed check-in. Without this, every deploy silently waits until the app is killed.
4. **Upgrade the toolchain in the same step** (vite 8, vite-plugin-pwa 1.3, plugin-react 6 or 5.2, vitest 4.1 + coverage-v8 4.1, Node 24 via `.nvmrc`). This also fixes the `npm ci` ERESOLVE that would otherwise break the first CI deploy. `vitest.config.ts` should switch from `plugin-react-swc` to `plugin-react` to match. Update CLAUDE.md's stale Node 18 notes.
5. **Config changes are small and verified:** `base: '/cadence/'`, manifest `id/start_url/scope: '/cadence/'`, delete `public/manifest.json`, drop `devOptions.enabled`, and use the shipped `vite-plugin-pwa/client` types. Test locally with `npm run build && npm run preview` at `http://localhost:4173/cadence/`.
6. **iOS polish checklist for the build tickets:**
   - real icons: an opaque 180×180 apple-touch-icon plus 192/512 manifest icons (maskable optional)
   - `viewport-fit=cover` + safe-area padding (fixes the audit's "safe areas inert")
   - status bar `black-translucent` (or `black`)
   - dark `html`/`body` background
   - splash images deferred until seen on device
7. **Use a namespaced IndexedDB store** (`createStore('cadence', 'kv')`) so Safari-tab and desktop testing can't collide with another project on the same origin.
8. **Add the Pages workflow last.** It needs a public GitHub remote (none exists yet per the map), Pages source set to GitHub Actions, and a green `npm ci && npm test -- --run && npm run build`.
