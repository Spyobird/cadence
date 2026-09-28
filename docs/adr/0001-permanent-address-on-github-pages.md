# Cadence lives at spyobird.github.io/cadence/ for good

Cadence is served from GitHub Pages at `https://spyobird.github.io/cadence/`. An installed iPhone web app and its IndexedDB belong to the origin it was installed from, so this address can never change without stranding the data: a custom domain on `spyobird.github.io`, an account or repo rename, or a new host would all make a new, empty app. The owner exports a Backup before any such change.

## Considered options

- **A custom domain:** nicer, but adding one to the user site later 301s every project page, so the installed app would freeze on its last version with its data left behind.
- **A dedicated origin** (a free organisation's `<org>.github.io`): isolates Cadence from other Pages projects, but it's one more account for no real gain. An installed app's storage is already separate from Safari's, and Cadence uses its own named store.
- **Another host** (Netlify, Cloudflare Pages): no advantage over Pages for a static app, and it adds a service.

Sources: [GitHub Pages + PWA setup for iOS install](../../.scratch/cadence-v1/issues/02-github-pages-pwa-setup.md).
