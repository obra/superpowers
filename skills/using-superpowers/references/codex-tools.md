## Subagent dispatch requires multi-agent support

Add to your Codex config (`~/.codex/config.toml`):

```toml
[features]
multi_agent = true
```

This enables the multi-agent tools that skills like
`dispatching-parallel-agents` and `subagent-driven-development` use.
The exact multi-agent contract can depend on the current model preset
and configuration. Trust the live tool declaration and current-session
usage hints over version numbers, old sessions, and this reference.
`codex --version` alone is not capability detection.

- **Spawning:** prefer a clean context with the no-history form exposed
  by the live spawn tool (for example, `fork_turns: "none"` when that
  value is listed). If no context control is exposed, follow the tool's
  fixed semantics and the unavailable-mode rule below.
  Use partial or full-history forks only when the task needs inherited
  context, then add role and routing fields only when the live contract
  permits that combination. Isolated forks remain the SDD default for
  context hygiene.
- **Fix rounds:** when the live tools expose `followup_task` with
  turn-triggering or reload behavior, use it to resume the implementer.
  Do not dispatch a replacement merely because a child is no longer
  resident; follow the live tool description for resumption behavior.
- **Lifecycle:** use only the lifecycle controls in the live tool list.
  Do not invent `close_agent` when it is absent. When it is exposed,
  follow its current description and close completed agents at the
  documented point.
- **Model names:** never copy a model name from a skill, table, or old
  session into `spawn_agent` without checking it against your current
  spawn allowlist. Unlisted names may hard-error.

## Constructing spawns from live capabilities

Before every spawn, read the live `spawn_agent` fields and values plus
any current-session usage hint and selected-role constraints. The tool
declaration says which fields exist; the hints and role descriptions
may impose stricter cross-field rules. Never invent an absent field or
override a declared fixed role setting.

| Requirement | Call shape |
|---|---|
| Clean context | If exposed, use the live no-history form. Add role/model/effort only if exposed and compatible. Otherwise apply the unavailable-mode rule. |
| Limited recent context | Use a positive turn count only if the live fork field supports it. Choose the actual bounded count needed; never use a guessed huge number as a surrogate for full history. Otherwise apply the unavailable-mode rule. |
| Full history | If exposed, use the live full-history form. Add `agent_type`, `model`, or `reasoning_effort` only if the live contract explicitly permits each with full history. Otherwise apply the unavailable-mode rule. |
| Full history plus an incompatible role or routing override | One call cannot satisfy both requirements. Keep full history and omit the incompatible override, or use a clean/partial fork and put the required context in the exposed task-instruction field (`message` in the current contract). Use partial history only when the needed bounded turn count is known; otherwise use a clean fork with self-contained instructions. Follow the task's stated priority; if none is stated, ask rather than silently changing it. |
| Requested context mode unavailable | Use only the exposed or fixed context semantics. Put needed context in the exposed task-instruction field (`message` in the current contract) when self-contained instructions preserve the requirements. If the available mode would violate a required isolation or inheritance boundary, follow the task's stated priority; if none is stated, ask. |

Only treat a rejection as newer capability evidence when the error
explicitly identifies an unsupported field, value, or cross-field
combination. Rebuild that payload instead of retrying it or inferring a
rule from the version string. Slot exhaustion, task-name errors, and
other operational failures are not capability evidence; handle them by
their own documented semantics.

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

When the live contract permits explicit model routing — including from
a spawned child running a fan-out — choose a model from its current
allowlist. If `reasoning_effort` is exposed, not fixed by the selected
role, and permitted with that model by the live cross-field rules, set
it explicitly with `model`; do not assume an omitted effort inherits
yours. If any of those conditions fails, omit the conflicting override
and follow the declared effective route.
This Codex-specific rule overrides generic skill text or spawn templates
that require an explicit model on every call.

If the current Codex config reference still exposes these keys and
otherwise-unrouted children should use a deliberate default tier, ask
your human partner to add this to `~/.codex/config.toml`:

```toml
[agents]
default_subagent_model = "<a mid-tier model from your spawn allowlist>"
default_subagent_reasoning_effort = "medium"
```

Machine defaults may affect calls that omit routing, and a selected
role may replace them. Confirm precedence against the current config
and role descriptions. When a child must truly inherit the parent's
model and effort, do not configure child-routing defaults or select a
role that changes routing.

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
