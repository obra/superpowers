## Subagent dispatch requires multi-agent support

Add to your Codex config (`~/.codex/config.toml`):

```toml
[features]
multi_agent = true
```

This enables the multi-agent tools that skills like
`dispatching-parallel-agents` and `subagent-driven-development` use.
Which tools you get depends on the multi-agent version your model
preset selects (current presets run V2; older ones run V1). Trust your
actual tool list over any table — including this one — when they
disagree.

- **Spawning:** give children a clean context with
  `spawn_agent {fork_turns: "none"}`; the default `"all"` copies your
  entire transcript into the child. Under MultiAgent V2 on Codex
  0.148+, role files under `~/.codex/agents/` attach via `agent_type`
  regardless of how much parent history is inherited. In Codex
  0.149.1's live V2 contract, full-history forks (`fork_turns: "all"` or
  omitted) inherit the parent model and reasoning effort by default and
  do not accept per-call `model` or `reasoning_effort` overrides. To
  select either explicitly, use `fork_turns: "none"` or a positive
  integer string. Isolated forks remain the SDD default for context
  hygiene.
- **Fix rounds:** resume the implementer with `followup_task` — it
  delivers your message, triggers a turn, and transparently reloads a
  child the harness evicted. Never dispatch a fresh implementer on the
  theory that a spawned agent cannot be messaged again; on V2 it
  always can.
- **Lifecycle:** V2 has no `close_agent`. Finished children are
  evicted automatically when slots are needed; leaving them unclosed
  costs nothing. Only V1 sessions have `close_agent` — there, close
  reviewers when their review returns, and close each implementer
  after its task's review passes.
- **Model names:** never copy a model name from a skill, table, or old
  session into `spawn_agent` without checking it against your current
  spawn allowlist — V2 accepts only V2-capable presets and hard-errors
  on the rest.

## Waiting on children

`wait_agent` is an event subscription, not a poll: a long wait wakes
the moment a child produces mailbox activity, with the same latency as
a short one. Short-timeout polling buys nothing and costs a tool call —
and a context rebill — per poll. In measured sessions, roughly
two-thirds of all wait calls were short polls that timed out.

- While you still have local work, do not wait at all. A completed
  child's final answer is pushed into your mailbox and arrives with
  your next turn.
- When you are genuinely idle with children outstanding, wait in
  bounded stretches: `wait_agent` with `timeout_ms` 300000-600000
  (5-10 minutes). After each stretch — wake or timeout — post one
  status line, run `list_agents`, and chase any child that finished
  without reporting. Never stack polls shorter than five minutes; the
  event subscription wakes a bounded stretch just as fast as a short
  one.
- Completion mail cannot wake an idle controller (it is delivered
  without triggering a turn); covering that idle window is
  `wait_agent`'s only job. A stretch that times out with no activity
  is your cue to reconcile, not to shorten the next stretch.

## Model routing on spawns

Whenever a `spawn_agent` explicitly selects a model — including when
you are yourself a spawned child running a fan-out — set `model` AND
`reasoning_effort`, per the Model Selection rules of the skill you are
executing. Setting `model` alone is a trap: the child's effort silently
resets to that model's default, not to yours, unless a machine-level
subagent-effort default or selected role supplies different routing.
Under the verified Codex 0.149.1 live V2 contract, model and effort
overrides in the call require `fork_turns: "none"` or a positive integer
string; full-history calls must omit both. Without machine-level
subagent defaults or role-specific routing, those full-history children
inherit the parent's routing.

If otherwise-unrouted children should use a deliberate default tier
instead of silently inheriting the session's model, ask your human
partner to add this to `~/.codex/config.toml`:

```toml
[agents]
default_subagent_model = "<a mid-tier model from your spawn allowlist>"
default_subagent_reasoning_effort = "medium"
```

These defaults also apply when a full-history call omits `model` and
`reasoning_effort`, although a selected role can replace them. When a
full-history child must truly inherit the parent's model and effort, do
not set these defaults or select a role that changes routing.

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
