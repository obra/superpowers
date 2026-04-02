# Record Memory Bootstrap

Use this file only when `docs/superpowers/memory/` is missing, when scanning finds no usable type definitions, or when a selected or scanned type has structurally damaged docs that must be restored.

## Goal

Restore the minimum repository-owned memory structure so `record-memory` can resume direct type discovery and recording.

## Canonical Paths

- Root: `docs/superpowers/memory/`
- Type definition protocol: `docs/superpowers/memory/<type>/MEMORY.md`
- Type index only: `docs/superpowers/memory/<type>/INDEX.md`
- Type entry template: `docs/superpowers/memory/<type>/ENTRY.md`
- Entries: `docs/superpowers/memory/<type>/entries/<YYYY-MM>/YYYY-MM-DD-N.md`

## Cold Start

When the memory root is missing, or when scanning `docs/superpowers/memory/*/MEMORY.md` finds no usable type definitions:

1. Create `docs/superpowers/memory/`.
2. Create the repository-shipped default types from `template/type/`:
   - `milestone`
   - `debug`
   - `refactor`
3. For each default type, create:
   - `docs/superpowers/memory/<type>/MEMORY.md`
   - `docs/superpowers/memory/<type>/INDEX.md`
   - `docs/superpowers/memory/<type>/ENTRY.md`
   - `docs/superpowers/memory/<type>/entries/<YYYY-MM>/`
4. Initialize each new `INDEX.md` with the minimum index skeleton only:
   - `| Page ID | Date | Title | Path | Related Change Unit | Keywords |`
   - `| --- | --- | --- | --- | --- | --- |`
5. After structure exists, return to `SKILL.md` and restart discovery by scanning type-local `MEMORY.md` files.

## Existing Type Repair

When a selected type cannot be recorded to, or when a scanned `docs/superpowers/memory/<type>/MEMORY.md` is missing required retrieval-facing or record-facing fields, or cannot be parsed:

- If the selected or damaged type is one of the repository-shipped defaults and its `MEMORY.md`, `INDEX.md`, or `ENTRY.md` is missing, restore the missing docs file(s) from `template/type/<type>/`.
- If a repository-shipped default type's `MEMORY.md` exists but the file is unparsable, restore `MEMORY.md` from `template/type/<type>/MEMORY.md`.
- If `INDEX.md` is missing for any recoverable type, restore it as the minimum index-only file using the fixed two-line skeleton:
  - `| Page ID | Date | Title | Path | Related Change Unit | Keywords |`
  - `| --- | --- | --- | --- | --- | --- |`
- If only `entries/<YYYY-MM>/` is missing, create only that month bucket.
- If the selected or damaged type is custom and its `MEMORY.md` still exists with intact, parseable retrieval-facing and record-facing sections, treat the type as recoverable: restore a missing `INDEX.md` with the minimum index-only skeleton, restore a missing `ENTRY.md` with the minimum structure needed, and create a missing `entries/<YYYY-MM>/` bucket directly.
- If the selected or damaged type is custom and its `MEMORY.md` is missing, lacks required retrieval-facing or record-facing sections, is unparsable, or the type semantics cannot be recovered from that file, stop and ask the user to confirm or provide that type's semantics before restoring anything. Never use `INDEX.md` to recover type semantics or routing decisions.

## New Type Introduction

When no existing type fits and the user explicitly confirms a new one:

1. Start from:
   - `template/type/base/MEMORY.md`
   - `template/type/base/INDEX.md`
   - `template/type/base/ENTRY.md`
2. Create:
   - `docs/superpowers/memory/<type>/MEMORY.md`
   - `docs/superpowers/memory/<type>/INDEX.md`
   - `docs/superpowers/memory/<type>/ENTRY.md`
   - `docs/superpowers/memory/<type>/entries/<YYYY-MM>/`
3. In the new `docs/superpowers/memory/<type>/MEMORY.md`, set:
    - `## Type` to the confirmed type name
    - `## Use When` to the confirmed retrieval cues for when `using-memory` should consult this type
    - `## Avoid When` to the confirmed retrieval cues for when `using-memory` should skip this type
    - `## Record When` to the confirmed recording cues for this type
    - `## Avoid Recording When` to the confirmed non-fit cues for this type
    - `## Entry Template` to `docs/superpowers/memory/<type>/ENTRY.md`
4. If the user can only confirm recording cues or only confirm retrieval cues, stop and ask for the missing field semantics before creating the new type. Do not invent one side from the other.
5. Initialize the new `docs/superpowers/memory/<type>/INDEX.md` as an index-only file with the fixed two-line skeleton and no type semantics.
6. The new type becomes discoverable immediately because `record-memory` and `using-memory` both scan `docs/superpowers/memory/*/MEMORY.md` directly.
7. Return to `SKILL.md` and continue normal discovery.

## Constraints

- Create only the minimum missing structure needed for the current recording task.
- Treat `INDEX.md` as index-only state, never as a source for type discovery, semantic recovery, or routing.
- Never leave `Entry Template` as a placeholder.
- Never leave a newly created type without both retrieval-facing fields (`Use When` / `Avoid When`) and record-facing fields (`Record When` / `Avoid Recording When`).
- Keep `MEMORY.md` as the only repository-owned source of type semantics unless the user explicitly confirms replacements.
- Do not invent custom type semantics without user confirmation.
- Do not overwrite existing memory entries.
