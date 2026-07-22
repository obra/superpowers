## Subagent dispatch requires multi-agent support

Add to your Codex config (`~/.codex/config.toml`):

```toml
[features]
multi_agent = true
```

This enables `spawn_agent`, `wait_agent`, and `close_agent` for skills like `dispatching-parallel-agents` and `subagent-driven-development`. When using subagent-driven-development, close reviewer subagents when their review returns. Keep each implementer subagent open until its task's review passes — the fix loop resumes the implementer — then close it. If your harness cannot send another message to a spawned agent, dispatch each fix round as a fresh implementer carrying the brief, the report file, and the findings.

## SDD dispatch: pin fork_turns and the model on every spawn

Every `spawn_agent` call in subagent-driven-development sets
`fork_turns: "none"`. The parameter defaults to `"all"`, which forks your
entire session transcript into the child — the opposite of the fresh,
constructed context SDD requires — and a full-history fork also refuses
model and effort overrides. Never omit the parameter, and never pass
`"all"` or a turn count for an SDD dispatch.

Before Task 1, check your `spawn_agent` tool schema for `model` and
`reasoning_effort` parameters (present on Codex 0.145+).

**If the parameters exist**, set both explicitly on every dispatch. The
task-brief and review-package scripts print the exact values for each
dispatch as a `dispatch (codex spawn_agent):` line with their output —
copy that line's values onto the spawn_agent call verbatim, every time,
even late in a long session. The mapping they print: every SDD seat runs
`gpt-5.6-terra` — implementers and reviewers at `reasoning_effort: high`,
scoped re-reviews at `medium`. On Codex this mapping IS the Model
Selection section — including the final review, which stays on
terra/high rather than "most capable available." Never give a subagent
your session's model when you run a frontier config (sol at xhigh or
max): reviewer tier never exceeds implementer tier, and a fix round
never gets an effort bump. Rounds 4-5's "more capable model" means a
fresh implementer at the same tier; a task that genuinely needs more
than terra/high is a BLOCKED escalation to your human partner, not a
quiet tier climb. Inherited frontier-tier subagents are a measured cause
of SDD runs spinning out for hours: review seats that inherit a frontier
model at maximum effort find real-but-endless defects every round, and
fix diffs balloon instead of converging.

The model names here track Codex's `spawn_agent` allowlist (currently
`gpt-5.6-sol` and `gpt-5.6-terra`). When the allowlist changes, update
this file and the hint lines in task-brief and review-package together.

**If the parameters do not exist** (Codex 0.144 and earlier), every child
inherits your session's model and effort and no override is possible —
role files in `~/.codex/agents/` do not attach to spawns either. Say so
to your human partner before starting a plan of more than a few tasks,
and offer the choice: proceed with inheritance, or restart the session
at a lower effort so the whole run — controller and children — pays the
lower rate.

## Environment Detection

Skills that create worktrees or finish branches should detect their
environment with read-only git commands before proceeding:

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
BRANCH=$(git branch --show-current)
```

- `GIT_DIR != GIT_COMMON` → already in a linked worktree (skip creation)
- `BRANCH` empty → detached HEAD (cannot branch/push/PR from sandbox)

See `using-git-worktrees` Step 0 and `finishing-a-development-branch`
Step 1 for how each skill uses these signals.

## Codex App Finishing

When the sandbox blocks branch/push operations (detached HEAD in an
externally managed worktree), the agent commits all work and informs
the user to use the App's native controls:

- **"Create branch"** — names the branch, then commit/push/PR via App UI
- **"Hand off to local"** — transfers work to the user's local checkout

The agent can still run tests, stage files, and output suggested branch
names, commit messages, and PR descriptions for the user to copy.
