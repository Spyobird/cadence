# GitHub Pages + PWA setup for iOS install

Type: research
Status: resolved
Blocked by:

## Question

What is the correct, current setup to deploy this Vite + `vite-plugin-pwa` app to `https://spyobird.github.io/cadence/` so it installs, runs offline, and updates cleanly on an iPhone?

- Vite `base`, manifest `id` / `start_url` / `scope`, and service-worker scope under a project-page subpath.
- Current `vite-plugin-pwa` and Vite versions and compatibility (repo pins `vite@^5`, `vite-plugin-pwa@^0.18`); upgrade worth it?
- How updates reach an installed iOS web app: when the SW checks for updates, `autoUpdate` vs `prompt`, risk of a stale app.
- GitHub Actions workflow for Pages (official `deploy-pages` flow), Node version for CI.
- iOS head tags in 2026: `apple-touch-icon` (180×180), maskable/any icons, `theme-color`, `apple-mobile-web-app-status-bar-style` + `viewport-fit=cover`, startup images — which are still needed vs. read from the manifest.
- Shared-origin implications: `spyobird.github.io` hosts other Pages projects (and a user site, no custom domain) — what storage/SW isolation exists between `/cadence/` and siblings; what happens to an installed app if a custom domain is ever added.

## Answer

Findings, sources, and a full config sketch: [research/github-pages-pwa-setup.md](../research/github-pages-pwa-setup.md).

- **Subpath:** `base: '/cadence/'` plus manifest `id`/`start_url`/`scope` of `/cadence/`. The plugin derives the SW URL and scope from `base` (verified by a probe build).
- **Updates are broken today:** `injectRegister: 'script'` disables autoUpdate's skip-waiting and clients-claim, so a deploy waits until the app is killed.
  - Fix: register once in `main.tsx`, set `skipWaiting`/`clientsClaim`, and call `registration.update()` hourly and on `visibilitychange`.
  - Use `onNeedReload` (vite-plugin-pwa 1.3) so an update never wipes a half-typed check-in.
- **Toolchain:** upgrade to Vite 8.3 + vite-plugin-pwa 1.3 + plugin-react 6 + vitest 4.1, on Node 24 (`.nvmrc`). This also fixes the `npm ci` ERESOLVE that would break CI. The probe build was clean.
- **Deploy:** official GitHub Actions Pages flow (`upload-pages-artifact` + `deploy-pages`), gated on `npm ci && npm test -- --run && npm run build`. Needs the public remote first.
- **iOS head:**
  - An opaque 180×180 `apple-touch-icon` (it overrides manifest icons; iOS ignores maskable).
  - `viewport-fit=cover` is required for safe areas.
  - Status bar `black-translucent`.
  - Splash images deferred until seen on the device.
  - iOS 26 opens every Home Screen site as a web app.
- **Origin:** all `spyobird.github.io` projects share one origin, but an installed iOS app's storage is isolated from Safari. Use a namespaced store (`createStore('cadence','kv')`).
  - Adding a custom domain to the user site would 301 Cadence to a new origin: the installed app freezes on its last version and its data is stranded.
  - Alternative: a dedicated origin, e.g. a free org's `<org>.github.io`.
- **Verify on the device:** whether resuming from the app switcher checks for updates, launch appearance without splash images, and Pages edge caching right after a deploy.
