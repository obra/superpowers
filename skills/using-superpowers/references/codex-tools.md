# Codex Tool Mapping

Skills use Claude Code tool names. When you encounter these in a skill, use your platform equivalent:

| Skill references | Codex equivalent |
|-----------------|------------------|
| `Task` tool (dispatch subagent) | `spawn_agent` |
| Multiple `Task` calls (parallel) | Multiple `spawn_agent` calls |
| Task returns result | `wait_agent` |
| Task completes automatically | `close_agent` to free slot |
| `TodoWrite` (task tracking) | `update_plan` |
| `Skill` tool (invoke a skill) | Skills load natively - just follow the instructions |
| `Read`, `Write`, `Edit` (files) | Use your native file tools |
| `Bash` (run commands) | Use your native shell tools |

## Native Superpowers Codex Roles

Superpowers for Codex installs native reviewer roles under:

- `~/.codex/agents/superpowers`

Current native roles:

- `superpowers_reviewer`
- `superpowers_spec_reviewer`
- `superpowers_plan_reviewer`
- `superpowers_doc_reviewer`

These are standard Codex custom roles, not a separate plugin-only mechanism.

## Preferred Dispatch Model

When a skill references a specialized Superpowers reviewer on Codex:

- use the matching native `superpowers_*` role if it appears in the `spawn_agent` role list
- keep implementation work on the built-in `worker` role
- keep read-heavy codebase exploration on the built-in `explorer` role

| Skill instruction | Preferred Codex mapping |
|-------------------|-------------------------|
| `Task tool (superpowers:code-reviewer)` | `spawn_agent(agent_type="superpowers_reviewer", message=...)` |
| Spec-compliance reviewer in `subagent-driven-development` | `spawn_agent(agent_type="superpowers_spec_reviewer", message=...)` |
| Plan document reviewer | `spawn_agent(agent_type="superpowers_plan_reviewer", message=...)` |
| Spec/design document reviewer | `spawn_agent(agent_type="superpowers_doc_reviewer", message=...)` |

## Compatibility Fallback

If the native Superpowers role is not available in the current Codex installation:

1. find the prompt source (`agents/code-reviewer.md` or the skill-local reviewer prompt)
2. fill any placeholders
3. dispatch `worker` or `default` with the filled instructions in `message`

Fallback is compatibility behavior, not the primary design.

## Message Framing for Fallback

The `message` parameter is user-level input, not a system prompt. Structure fallback dispatches like this:

```
Your task is to perform the following. Follow the instructions below exactly.

<agent-instructions>
[filled prompt content from the agent's .md file]
</agent-instructions>

Execute this now. Output ONLY the structured response following the format specified in the instructions above.
```

## Role Naming Guidance

Do not redefine built-ins such as `worker` or `explorer` for Superpowers. Codex lets custom roles override built-ins with the same name, so Superpowers uses namespaced `superpowers_*` role names to avoid collisions.

## Environment Detection

Skills that create worktrees or finish branches should detect their environment with read-only git commands before proceeding:

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
BRANCH=$(git branch --show-current)
```

- `GIT_DIR != GIT_COMMON` -> already in a linked worktree
- `BRANCH` empty -> detached HEAD

See `using-git-worktrees` and `finishing-a-development-branch` for how Superpowers uses these signals.

## Codex App Finishing

When the sandbox blocks branch or push operations in an externally managed worktree, the agent can still run tests, stage files, and prepare suggested branch names, commit messages, and PR descriptions for the user to apply with the host application's own controls.
