# Memory Bootstrap

Use this file only when `docs/superpowers/memory/` or `docs/superpowers/memory/TYPE.md` is missing, or when the selected type's required docs structure is absent and must be restored.

## Goal

Restore the minimum repository-owned memory structure so `memory-tracker` can resume normal discovery and recording.

## Canonical Paths

- Root: `docs/superpowers/memory/`
- Type router: `docs/superpowers/memory/TYPE.md`
- Type index: `docs/superpowers/memory/<type>/MEMORY.md`
- Type entry template: `docs/superpowers/memory/<type>/entry.md`
- Entries: `docs/superpowers/memory/<type>/entries/<YYYY-MM>/YYYY-MM-DD-N.md`

## Cold Start

When the memory root or router is missing:

1. Create `docs/superpowers/memory/`.
2. Create `docs/superpowers/memory/TYPE.md` from `template/TYPE.md`.
3. Create the repository-shipped default types from `template/type/`:
   - `milestone`
   - `debug`
   - `refactor`
4. For each default type, create:
   - `docs/superpowers/memory/<type>/MEMORY.md`
   - `docs/superpowers/memory/<type>/entry.md`
   - `docs/superpowers/memory/<type>/entries/<YYYY-MM>/`
5. After structure exists, return to `SKILL.md` and restart discovery.

## Existing Type Repair

When `TYPE.md` exists and routing already selected a type:

- If the selected type is one of the repository-shipped defaults and its `MEMORY.md` or `entry.md` is missing, restore the missing docs file(s) from `template/type/<type>/`.
- If only `entries/<YYYY-MM>/` is missing, create only that month bucket.
- If the selected type is custom and its docs files are missing, stop and ask the user to confirm or provide that type's semantics before restoring anything.

## New Type Introduction

When no existing type fits and the user explicitly confirms a new one:

1. Start from:
   - `template/type/base/MEMORY.md`
   - `template/type/base/entry.md`
2. Create:
   - `docs/superpowers/memory/<type>/MEMORY.md`
   - `docs/superpowers/memory/<type>/entry.md`
   - `docs/superpowers/memory/<type>/entries/<YYYY-MM>/`
3. In the new `docs/superpowers/memory/<type>/MEMORY.md`, set:
   - `## Type` to the confirmed type name
   - `## Entry Template` to `docs/superpowers/memory/<type>/entry.md`
4. Update `docs/superpowers/memory/TYPE.md` so the new type becomes repository-discoverable.
5. Return to `SKILL.md` and continue normal discovery.

## Constraints

- Create only the minimum missing structure needed for the current recording task.
- Never leave `Entry Template` as a placeholder.
- Do not invent custom type semantics without user confirmation.
- Do not overwrite existing memory entries.
