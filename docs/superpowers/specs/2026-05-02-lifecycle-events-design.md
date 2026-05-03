# Lifecycle Events for Plugin Authors

**Date:** 2026-05-02
**Status:** Draft (spec self-review complete; pending user approval)
**Branch:** `lifecycle-events`

## Problem

A Beads integration was prototyped on the `beads-integration` branch and rejected from upstream as direct integration — domain-specific tools belong in standalone plugins. To rebuild Beads (or any future workflow plugin) without forking core skills, plugin authors need a small set of lifecycle hooks they can listen to.

This spec defines the minimum-surface lifecycle event API: 4 events, one shell-based event bus, one env-var registry. Plugin authors drop hook scripts; core fires events. Core knows nothing about specific plugins.

## Goals

- Plugin authors can mirror plan/task lifecycle into their own systems without forking skills
- Zero impact on the legacy markdown-only flow when no plugins are installed
- Plugin failures never block the agent's normal workflow
- Tiny core surface: <100 LOC of new shell, <50 LOC of skill-markdown additions, <200 LOC of docs
- Forward-compatible — events can be added or payloads enriched without breaking existing plugins

## Non-Goals

- Plugin discovery via manifest files (defer until 3+ plugins exist)
- Structured/nested payloads (env vars only; defer JSON-on-stdin until an event needs it)
- Plugin → agent return path (hooks are pure observers)
- Cross-plugin coordination or dependency management
- Sandboxing or isolation of plugin code (plugins run with user permissions; this is a trust boundary the user opted into when adding the dir to `SUPERPOWERS_HOOK_DIRS`)

## Architecture

Two new core artifacts:

1. **`scripts/emit-hook.sh`** — one bash script (~50 lines). Skills call it at lifecycle moments. It scans `$SUPERPOWERS_HOOK_DIRS` for matching plugin scripts and runs them with payload data set as env vars.
2. **`SUPERPOWERS_HOOK_DIRS`** — colon-separated list of directories (like `$PATH`) the user adds to their shell rc. Each plugin documents one dir to register. Unset = silent no-op.

Skills get small additive emit blocks at lifecycle points, marked with `<!-- LIFECYCLE: EventName -->` comment markers for searchability and future maintainability.

```
                    ┌────────────────────┐
                    │ skill calls:       │
                    │ emit-hook.sh \     │
                    │   PlanWritten ...  │
                    └─────────┬──────────┘
                              │
                              ▼
                    ┌────────────────────┐
                    │ emit-hook.sh:      │
                    │ - parse kv args    │
                    │ - export SP_*      │
                    │ - scan HOOK_DIRS   │
                    │ - run matching     │
                    │   <Event>.sh files │
                    └─────────┬──────────┘
                              │
                ┌─────────────┴─────────────┐
                ▼                           ▼
        ┌──────────────┐            ┌──────────────┐
        │ plugin-A/    │            │ plugin-B/    │
        │ PlanWritten  │            │ PlanWritten  │
        │   .sh        │            │   .sh        │
        └──────────────┘            └──────────────┘
            (sequential per dir, failures isolated)
```

## Event Catalog

All event payloads are passed as env vars with the `SP_` prefix when invoking the plugin's hook script. The plugin's script filename matches the event name with a `.sh` extension (e.g., `PlanWritten.sh`).

### `PlanWritten`

- **Fired by:** `writing-plans` skill, immediately after self-review passes
- **Payload:**
  - `SP_PLAN_PATH` — absolute path to the plan markdown file
  - `SP_PLAN_TITLE` — H1 heading from the plan (the feature name)
- **Plugin guidance:** plugins may mutate the plan file at this point (e.g., add a `**Refs:** xxx` line to each task body). The implementer prompt sends full task body text from the plan, so any plan-level enrichment propagates naturally to subagent prompts without core needing a separate prompt-injection mechanism.

### `TaskClaimed`

- **Fired by:** `executing-plans` and `subagent-driven-development` when a task transitions to in_progress
- **Payload:**
  - `SP_PLAN_PATH` — plan the task belongs to
  - `SP_TASK_NUMBER` — integer matching `### Task N:` heading in plan
  - `SP_TASK_TITLE` — task heading text

### `TaskCompleted`

- **Fired by:** same skills, when a task reaches completed state
- **Payload:** same shape as `TaskClaimed`

### `BlockedOnHuman`

- **Fired by:** same skills, when a task cannot proceed and requires human resolution
- **Payload:** same shape as `TaskClaimed` plus `SP_REASON` (free-text string explaining the block)

## emit-hook.sh contract

Invocation:

```
emit-hook.sh <EventName> [key=value ...]
```

Behavior:

- Translates `key=value` args to `SP_<KEY>` env vars (key uppercased; literal `=` separates key from value; values may contain `=` characters).
- Iterates each path in `SUPERPOWERS_HOOK_DIRS` (colon-separated; like `$PATH`). Unset/empty → silent exit 0.
- For each dir: if `<dir>/<EventName>.sh` exists and is executable, runs it with the env vars set.
- Each hook script runs with a 5-second timeout. The user can override via `SUPERPOWERS_HOOK_TIMEOUT` (integer seconds).
- Plugin script's stderr is captured and prefixed in core's stderr log; stdout is discarded.
- Failures (nonzero exit, timeout, missing exec bit) → log `[hook warn] <EventName> in <dir>: <reason>` to stderr and continue to the next dir.
- emit-hook.sh always exits 0. The agent's lifecycle step never fails because of a plugin.

## Skill integration points

| Skill file | Insertion point | Event |
|---|---|---|
| `skills/writing-plans/SKILL.md` | After "Self-Review" section, before "Execution Handoff" | `PlanWritten` |
| `skills/executing-plans/SKILL.md` | Step 2: when marking task in_progress | `TaskClaimed` |
| `skills/executing-plans/SKILL.md` | Step 2: when marking task completed | `TaskCompleted` |
| `skills/executing-plans/SKILL.md` | Step 2: BLOCKED status escalation | `BlockedOnHuman` |
| `skills/subagent-driven-development/SKILL.md` | Per-task in_progress transition | `TaskClaimed` |
| `skills/subagent-driven-development/SKILL.md` | Per-task completed transition | `TaskCompleted` |
| `skills/subagent-driven-development/SKILL.md` | Implementer reports BLOCKED | `BlockedOnHuman` |

Each insertion is a small additive block (no existing prose is rewritten):

````markdown
<!-- LIFECYCLE: TaskClaimed -->
**Lifecycle event:** after marking the task in_progress, emit:

```bash
"${CLAUDE_PLUGIN_ROOT:-$SUPERPOWERS_ROOT}/scripts/emit-hook.sh" TaskClaimed \
  plan_path="$plan_path" task_number="$n" task_title="$title"
```

When `SUPERPOWERS_HOOK_DIRS` is unset, this is a no-op — the legacy flow is unaffected.
<!-- END LIFECYCLE -->
````

## Plugin author contract

A plugin is a directory containing executable hook scripts named after the events it cares about. Example minimal plugin:

```
~/.config/superpowers-beads/
└── hooks/
    ├── PlanWritten.sh         (chmod +x)
    ├── TaskClaimed.sh
    ├── TaskCompleted.sh
    └── BlockedOnHuman.sh
```

User registers the plugin by adding to their shell rc:

```bash
export SUPERPOWERS_HOOK_DIRS="$HOME/.config/superpowers-beads/hooks${SUPERPOWERS_HOOK_DIRS:+:$SUPERPOWERS_HOOK_DIRS}"
```

Hook script template:

```bash
#!/usr/bin/env bash
set -euo pipefail
# Available env vars: $SP_PLAN_PATH, $SP_TASK_NUMBER, $SP_TASK_TITLE
echo "TaskClaimed: task $SP_TASK_NUMBER in $SP_PLAN_PATH" >&2
# do plugin-specific work here
```

Plugins that don't care about an event simply don't ship a script for it. Multiple plugins coexist by registering multiple dirs in `SUPERPOWERS_HOOK_DIRS`.

## Failure modes

| Condition | Behavior |
|---|---|
| `SUPERPOWERS_HOOK_DIRS` unset or empty | silent no-op; emit-hook exits 0 |
| Hook script not present in a registered dir | silent skip; continue to next dir |
| Hook script exists but not executable | warning logged; skip |
| Hook script exits nonzero | warning logged; continue to next dir |
| Hook script exceeds timeout | killed with SIGTERM, then SIGKILL after 1s grace; warning logged; continue |
| Hook script writes to stdout | discarded |
| Hook script writes to stderr | captured and prefixed in core's stderr stream |
| `emit-hook.sh` itself fails to start | the calling skill block uses `|| true` to absorb; agent continues |

## Testing

`scripts/tests/emit-hook.test.sh` — bash test suite covering:

- Unset `HOOK_DIRS` → emit-hook exits 0, no output
- Empty dir registered → emit-hook exits 0, no output
- Mock plugin with `PlanWritten.sh` → script runs, sees `SP_PLAN_PATH` and `SP_PLAN_TITLE`
- Mock plugin script exits 1 → emit-hook exits 0, warning on stderr
- Mock plugin script sleeps past timeout → killed, emit-hook exits 0, warning on stderr
- Two dirs registered with same event → both run sequentially, both see env vars
- Key=value parsing: values containing `=` (e.g., `reason="error: foo=bar"`) preserved correctly

Manual end-to-end:

- Build a stub `mock-plugin/` with hook scripts that append to a log file
- Run a real `writing-plans` + `executing-plans` flow on a tiny throwaway plan
- Verify log file contains expected sequence: `PlanWritten` → `TaskClaimed` → `TaskCompleted`

## Out of scope (roadmap, not this PR)

These wait for concrete motivating use cases:

- **6 additional events** from prior brainstorming: `BrainstormCompleted`, `DesignSaved`, `WorktreeCreated`, `ReviewFindingCreated`, `EpicCompleted`, `BranchFinished` — each waits for a real plugin that needs it
- **JSON-on-stdin payload format** — wait for an event that needs nested data
- **Manifest-based plugin discovery** — wait for ecosystem of 3+ plugins
- **Plugin → agent return channel** (stdout-capture filter pattern) — wait for an event that genuinely cannot use plan-mutation as the data path
- **Programmatic plugin registry** (`superpowers plugins list/install/remove`) — premature without ecosystem

## PR strategy

- **Branch:** `lifecycle-events` (already pushed to fork at `cdub615/superpowers`)
- **Target:** `obra/superpowers` `main`
- **Title:** `feat: lifecycle event hooks for plugin authors`
- **Approach:** single-problem PR, additive only, small diff
- **Required PR template sections:**
  - Problem statement: forked Beads integration; cannot rebuild as plugin without these hooks
  - Existing PRs search: must search both open and closed PRs for prior attempts at lifecycle events / plugin APIs and reference them
  - Per-event motivation: each of the 4 events ties to a specific Beads use case (in `beads-integration` branch)
  - Test plan: bash test suite + manual end-to-end with stub plugin
  - Roadmap section: 6 deferred events listed with explicit "wait for motivating use case"
- **Anticipated diff size:**
  - `scripts/emit-hook.sh` — ~50 LOC
  - `scripts/tests/emit-hook.test.sh` — ~80 LOC
  - `docs/superpowers/lifecycle-events.md` — ~150 LOC reference doc
  - 3 skill files — ~10 LOC additive each (~30 LOC total)
  - **Total: ~310 LOC, all additive, zero rewrites**

## Risks

**Maintainer rejection (94% rejection rate is real):**

- Mitigation: only 4 events, each tied to a real use case (Beads); roadmap is explicitly deferred
- Mitigation: PR template fully completed; existing PRs searched; human review of complete diff before submission
- Mitigation: diff is purely additive — no existing prose modified

**Skill content scrutiny:**

- The project flags PRs that modify skill content without eval evidence
- Mitigation: skill changes are **additive blocks**, not rewrites of existing prose
- Mitigation: each block is a no-op when no plugins are installed (zero behavior change for default users) — explicitly documented in PR description
- Mitigation: skill blocks include `<!-- LIFECYCLE -->` markers so reviewers can see exactly what changed

**Cross-harness compatibility:**

- Path resolution uses `${CLAUDE_PLUGIN_ROOT:-$SUPERPOWERS_ROOT}` — works for Claude Code; needs validation on at least one other harness
- Mitigation: test on Cursor or another harness before submission; report results in PR's environment table

**Misuse of stdin/stdout:**

- A plugin script that reads stdin or writes large stdout could surprise users
- Mitigation: emit-hook.sh redirects stdin from /dev/null and discards plugin stdout; documented in plugin author contract

## Open questions for user review

1. Is `SUPERPOWERS_HOOK_DIRS` the right env var name? Alternatives: `SP_HOOK_DIRS`, `SUPERPOWERS_PLUGINS`, `SUPERPOWERS_HOOK_PATH`. The chosen name is explicit and parallel to `SUPERPOWERS_BEADS` and `SUPERPOWERS_ROOT`.
2. Default timeout of 5s — sufficient for most plugins, or should it be 10s/30s?
3. Should plugin hooks run in parallel (background, wait-all) or sequentially per dir? Sequential is simpler and preserves ordering across dirs; parallel adds complexity for marginal benefit.
4. Should the LIFECYCLE marker be `<!-- LIFECYCLE: -->` or follow the existing `<!-- BEGIN/END beads -->` convention used in `beads-integration`? Matching the existing convention may improve consistency.
