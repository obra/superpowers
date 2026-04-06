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

Superpowers for Codex installs native workflow roles under:

- `~/.codex/agents/`

Codex currently discovers agent role files by walking the `agents/` directory and does not recurse into symlinked subdirectories. Superpowers therefore installs direct TOML files such as:

- `~/.codex/agents/superpowers_reviewer.toml`
- `~/.codex/agents/superpowers_spec_reviewer.toml`

Current native roles:

- `superpowers_implementer`
- `superpowers_explorer`
- `superpowers_verifier`
- `superpowers_reviewer`
- `superpowers_spec_reviewer`
- `superpowers_plan_reviewer`
- `superpowers_doc_reviewer`

These are standard Codex custom roles, not a separate plugin-only mechanism.

## Preferred Dispatch Model

When a skill references a specialized Superpowers subagent on Codex:

- use the matching native `superpowers_*` role if it appears in the `spawn_agent` role list
- in `subagent-driven-development`, map the implementer to `superpowers_implementer` when that role is available
- do not keep the implementer on built-in `worker` when `superpowers_implementer` is installed
- use built-in Codex roles only as compatibility fallback when the matching native role is unavailable

| Skill instruction | Preferred Codex mapping |
|-------------------|-------------------------|
| Implementer in `subagent-driven-development` | `spawn_agent(agent_type="superpowers_implementer", message=...)` |
| `Task tool (superpowers:code-reviewer)` | `spawn_agent(agent_type="superpowers_reviewer", message=...)` |
| Spec-compliance reviewer in `subagent-driven-development` | `spawn_agent(agent_type="superpowers_spec_reviewer", message=...)` |
| Plan document reviewer | `spawn_agent(agent_type="superpowers_plan_reviewer", message=...)` |
| Spec/design document reviewer | `spawn_agent(agent_type="superpowers_doc_reviewer", message=...)` |
| Focused repository exploration | `spawn_agent(agent_type="superpowers_explorer", message=...)` |
| Verification or test-only subagent | `spawn_agent(agent_type="superpowers_verifier", message=...)` |

## Compatibility Fallback

If the matching native Superpowers role is not available in the current Codex installation:

1. reviewer-style or document-review work:
   find the prompt source (`agents/code-reviewer.md` or the skill-local reviewer prompt), fill any placeholders, then dispatch `worker` or `default` with the filled instructions in `message`
2. bounded implementation work:
   dispatch the built-in `worker` role with the same task brief and context
3. focused codebase exploration:
   dispatch the built-in `explorer` role
4. verification or test-only work:
   dispatch the built-in `worker` role with explicit verification instructions

Fallback is compatibility behavior, not the primary design.

## Message Framing for Prompt-Based Fallback

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
