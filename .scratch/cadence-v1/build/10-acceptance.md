# v1 acceptance

Type: build (HITL: the owner's phone check)
Status: open
Blocked by: 09

## Goal

v1 is proven on the phone, end to end, in light and dark. After that the owner decides when to tag it.

## Spec

[spec.md](../spec.md) §15.2 (every phone check, including Full), §17 (Changelog and releases).

## Scope

1. **Run the full check:** the owner runs the whole §15.2 list at the real address, and the boundary states through the dev date override. The results, with the iOS version, go under `## Phone check` in this ticket.
2. **Fixes:** every failure becomes a new build ticket in this folder, and this one waits for them.
3. **Changelog:** `CHANGELOG.md`'s `[Unreleased]` reads as a complete, plain-words list of what v1 does.
4. **Tagging:** when the owner says so, `[Unreleased]` becomes the release, and the commit is tagged. The build stamp then shows the tag.

## Done when

- [ ] Every §15.2 check passes on the phone, or has a closed fix ticket.
- [ ] The owner has confirmed v1. Tagging happens when they ask.
