# Writing a Quest (setup)

Type: build (AFK)
Status: open
Blocked by: 02

## Goal

On the phone, Cadence opens on setup and walks through both Quests, Work then Life, one Scaffold part per screen. Setup resumes after the app is killed, and ends on "Q4 2026 is set up".

## Spec

[spec.md](../spec.md) §3.2 (Setup target), §4 (A Quest), §5 (Setup), §13.5 (Failed saves), §2.7 (Launch). Reference: [writing prototype](../prototypes/writing-a-quest.html), variant A; its keyboard handling is the model. Look: [DESIGN.md](../../../DESIGN.md), with the serif for the owner's words.

## Scope

1. **Routing:** the app shell routes on `screenFor`. This slice handles setup and resume. The other states go to a plain interim screen listing both Main Quests, which slice 4 replaces.
2. **Part screens** (§5.1): the target line and switch, the 12-tick progress bar, openings, fields and hints. On the Main Quest screen, the "Stuck?" prompts. On the Obstacle screen, "Skip for now".
3. **The keyboard:** it stays up between screens (the hidden-input parking), Return is Next, and the bar rides above the keyboard (`visualViewport`).
4. **Lists** (§5.2): Return, Backspace, Move up/down, Remove, "Add another", the cap at five, and pasted lines.
5. **Read-back and finishing** (§5.3): tap a part to change it; "Finish Work Quest"; "Finish Life Quest"; "Q4 2026 is set up".
6. **Resuming** (§5.4): the Draft is saved as typed, then "Picked up where you left off."
7. **Messages:** the blocking failed-save message and the newer-schema banner.
8. **Update reload:** setup sets the app's "something is being written" flag, so an update never reloads mid-setup.

**Tests:** screens are driven with `user-event` over the real store:
- type a whole Quest, finish it, reload, and it's still there;
- resume on the right part;
- list keys;
- switch the target;
- Next stays disabled on an empty part;
- the Obstacle can be skipped.

## Done when

- [ ] The tests above pass, along with `tsc`.
- [ ] Deployed. Setting up on the phone works; the full phone check is after slice 4.
- [ ] `CHANGELOG.md`: "Added: setting up a Quarter's Work and Life Quests".
