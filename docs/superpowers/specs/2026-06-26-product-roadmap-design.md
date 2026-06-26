# Product Roadmap — Design

**Date:** 2026-06-26
**Status:** approved

## Problem

When working feature-by-feature ("vibe coding"), there is no comprehensive,
human-readable view of the whole product or of what progress has been made. The
existing superpowers artifacts (per-feature specs and plans, the SDD progress
ledger) are for LLM consumption and are scoped to a single feature each — nothing
aggregates them into a product-level picture for stakeholders.

## Solution

A per-project **roadmap** that aggregates features and their status, maintained
automatically at two existing workflow hooks:

- **`brainstorming`** — when a feature's spec is written, add the feature to the
  roadmap with status `planned`.
- **`finishing-a-development-branch`** — when the work is integrated (merge or
  PR), set that feature's status to `done`.

## Files (per working project)

```
docs/superpowers/
  roadmap.json    # source of truth (LLM reads/writes)
  ROADMAP.html    # rendered view for humans, regenerated from roadmap.json
```

## Data model

`roadmap.json` is an array of entries keyed by `slug`:

| Field | Meaning |
|-------|---------|
| `slug` | stable key = `<topic>` from `YYYY-MM-DD-<topic>-design.md` |
| `title` | human-readable feature name |
| `status` | `planned` or `done` |
| `spec` / `plan` | paths relative to `docs/superpowers/` (or `null`) |
| `created` / `completed` | `YYYY-MM-DD` (`completed` null until done) |

## Behavior

- **Idempotent by `slug`:** find-and-update if the slug exists, append otherwise.
  Re-running brainstorming on the same feature never duplicates a row.
- **Status lifecycle:** `planned` (after brainstorm) → `done` (after integrate).
  Two states only.
- **Finish step scope:** updates to `done` only for merge (Option 1) and PR
  (Option 2); not for keep-as-is or discard. If the slug is ambiguous, ask the
  user.
- **ROADMAP.html:** self-contained (inline CSS, embedded data) so it opens by
  double-click; planned rows first, then done; status shown as a colored badge.

## Constraints

- **Zero dependency, runtime-agnostic:** no render script; the agent edits the
  JSON and regenerates the HTML from a fixed template stored in the skill
  reference. Works regardless of the target project's language/runtime.
- **Marked sections:** every addition to the skills is wrapped in
  `<!-- created by riso-tech -->` … `<!-- end created by riso-tech -->`.

## Implementation

- `skills/brainstorming/roadmap.md` — shared reference: schema, idempotent update
  rules, and the `ROADMAP.html` template.
- `skills/brainstorming/SKILL.md` — Documentation step + checklist updated to add
  the feature to the roadmap.
- `skills/finishing-a-development-branch/SKILL.md` — new Step 5b updates the
  matching entry to `done`.

## Out of scope

- `in-progress` status (rejected: only two hooks, two states).
- HTML companions / roadmap entries for SDD scratch files (`progress.md`,
  `task-N-report.md`) — those are machine recovery/handoff scratch, not reader
  deliverables.
- A render script or any new runtime dependency.
