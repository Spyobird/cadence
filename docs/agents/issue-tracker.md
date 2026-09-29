# Issue tracker: Local Markdown

Issues and specs for this repo live as markdown files in `.scratch/`. GitHub Issues is not used.

## Conventions

- One feature per directory: `.scratch/<feature-slug>/` (the current one is `.scratch/cadence-v1/`)
- The spec is `.scratch/<feature-slug>/spec.md`. It wins over the tickets.
- Build tickets (implementation) are one file per ticket at `.scratch/<feature-slug>/build/<NN>-<slug>.md`, numbered from `01`, never a single combined tickets file. They are built in order, one branch each.
- Every ticket opens with three lines under its title: `Type:`, `Status:` and `Blocked by: NN, NN` (empty when nothing blocks it).
- A build ticket's `Type:` is `build (AFK)` or `build (HITL: <what the owner does>)`. Its `Status:` is `open` until merged, then `done`; triage roles from `triage-labels.md` may stand there before it is ready.
- A build ticket has `## Goal`, `## Spec`, `## Scope` and `## Done when`. The builder appends `## Build notes`; a ticket that needs the owner's phone check ends with `## Phone check`.
- Comments and conversation history append to the bottom of the file under a `## Comments` heading

## When a skill says "publish to the issue tracker"

Create a new file under `.scratch/<feature-slug>/` (creating the directory if needed): a build ticket in `build/`, a question in `issues/`.

## When a skill says "fetch the relevant ticket"

Read the file at the referenced path. The user will normally pass the path or the number directly. A bare "ticket 03" usually means `build/03-*.md`; ask if it could be either.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a file with one **child** file per ticket.

- **Map**: `.scratch/<effort>/map.md` (the Notes / Decisions-so-far / Fog body), with `Label: wayfinder:map` under its title.
- **Child ticket**: `.scratch/<effort>/issues/NN-<slug>.md`, numbered from `01`, with the question in the body. A `Type:` line records the ticket type (`research`/`prototype`/`grilling`/`task`); a `Status:` line records `claimed`/`resolved`.
- **Blocking**: a `Blocked by: NN, NN` line near the top. A ticket is unblocked when every file it lists is `resolved`.
- **Frontier**: scan `.scratch/<effort>/issues/` for files that are open, unblocked, and unclaimed; first by number wins.
- **Claim**: set `Status: claimed` and save before any work.
- **Resolve**: append the answer under an `## Answer` heading, set `Status: resolved`, then append a context pointer (gist + link) to the map's Decisions-so-far in `map.md`.
