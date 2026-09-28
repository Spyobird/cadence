# Reflections

Type: build (AFK, then the owner's phone check)
Status: open
Blocked by: 05

## Goal

Under each Quest, the owner can write one optional Reflection per Day, guided by the day's Prompt. It's editable until midnight.

## Spec

[spec.md](../spec.md) §7 (Reflections and Prompts), §6.4 ("Reflections start on Day 1…"), §13 (store).

## Scope

1. **Store:** `saveReflection` and `removeReflection`, for today's date within a set-up Quarter only. They copy the Prompt, carry the date they're saved on, and refuse after the Quarter's last midnight.
2. **On the page:** the "Write today's Reflection" pill, the saved text beside a rule, and "Edit today's Reflection" (§7.3). Before Day 1, "Reflections start on Day 1, Thursday 1 Oct."
3. **The popup** (§7.4): the Prompt, the field, Save / Remove, Cancel with a discard question, and "You can change it until midnight."
4. **Update reload:** the popup sets the "something is being written" flag.

**Tests:**
- one per Quest per Day;
- re-saving replaces it;
- emptying it removes it;
- yesterday's is read-only;
- a save at 00:01 goes to the new Day with the new Prompt;
- a save refused after the Quarter ends keeps the text;
- no Reflection before Day 1.

## Done when

- [ ] The tests above pass, along with `tsc`.
- [ ] Deployed. The owner runs the data-safe phone check (§15.2, after slice 6) and records it here.
- [ ] `CHANGELOG.md`: "Added: a Reflection per Quest per Day".
