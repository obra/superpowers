## Subagent dispatch requires multi-agent support

Add to your Codex config (`~/.codex/config.toml`):

```toml
[features]
multi_agent = true
```

This enables `spawn_agent`, `wait_agent`, and `close_agent` for skills like `dispatching-parallel-agents` and `subagent-driven-development`. When using subagent-driven-development, close reviewer subagents when their review returns. Keep each implementer subagent open until its task's review passes — the fix loop resumes the implementer — then close it. If your harness cannot send another message to a spawned agent, dispatch each fix round as a fresh implementer carrying the brief, the report file, and the findings.

## SDD dispatch on Codex

Every SDD `spawn_agent` call sets `fork_turns: "none"` — the default
`"all"` forks your whole transcript into the child and refuses model
and effort overrides.

If your `spawn_agent` schema has `model` and `reasoning_effort`
parameters (Codex 0.145+), set both on every dispatch: task-brief and
review-package print a `dispatch:` hint line with the exact values —
copy it onto the call verbatim, every time, even late in a long
session. The hints print at those scripts' boundaries; every other
spawn — ad-hoc fan-outs included — follows the same table without a
printed reminder. Those hints are the Model Selection mapping on Codex:
reviewer tier never exceeds implementer tier, no fix round gets an
effort bump, and rounds 4-5's "more capable model" means a fresh
implementer at the same tier — needing more is a BLOCKED escalation
to your human partner. Inherited frontier-tier subagents are a
measured cause of runs spinning out for hours. (Values live in
`codex-dispatch.hints` beside this file; they track the spawn_agent
model allowlist.)

Without those parameters (Codex 0.144 and earlier), children inherit
your model and effort with no override — role files in
`~/.codex/agents/` do not attach to spawns either. Tell your human
partner before starting a plan of more than a few tasks, and offer a
lower-effort session instead.

## Compaction sheds these instructions

Context compaction replaces your transcript with a summary that keeps
your progress but not your working instructions — the first
post-compaction dispatch is where routing drift starts, and once one
bare spawn lands, the broken pattern becomes its own precedent. The
plugin ships a compaction re-injection hook (`hooks/hooks-codex.json`,
Codex 0.145+) that restores the bootstrap after every compaction; it
needs one-time trust approval, so if you never see a
`<CONTEXT_RESTORED>` block after a compaction, tell your human partner
the hook may be untrusted or unsupported on this version. Without it,
the printed `dispatch:` hints are your only re-grounding — treat every
one you see as authoritative, especially right after a summary appears
in your context.

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
