# Codex Tool Mapping

Horspowers skills use Claude Code tool names. When you see those names inside a
skill, map them to the closest native Codex capability.

| Skill references | Codex equivalent |
|------------------|------------------|
| `Task` tool (dispatch subagent) | `spawn_agent` |
| Multiple `Task` calls | Multiple `spawn_agent` calls |
| Wait for task result | `wait_agent` |
| Release completed agent | `close_agent` |
| `TodoWrite` | `update_plan` |
| `Skill` tool | Native skill loading |
| `Read`, `Write`, `Edit` | Native file tools |
| `Bash` | Native shell tools |

## Subagent Dispatch

If a skill asks for a subagent workflow:

1. Spawn an agent with `spawn_agent`
2. Use `worker`, `explorer`, or `default` as the Codex role
3. Wait only when you actually need the result on the critical path
4. Close the agent after it has finished and you no longer need it

If your Codex build does not expose `spawn_agent`, execute the task locally and
state that limitation explicitly.

## Named Agent Types

Some Horspowers skills reference named agent types like
`horspowers:code-reviewer`. Codex does not resolve those names directly.

Adapt them like this:

1. Locate the prompt file referenced by the skill
2. Fill any placeholders in that prompt
3. Spawn a `worker` agent with the filled prompt as the message body

Example pattern:

```text
Your task is to perform the following. Follow the instructions below exactly.

<agent-instructions>
[filled prompt content]
</agent-instructions>

Execute this now. Output ONLY the structured response requested above.
```

## Native Discovery

Codex should discover Horspowers through:

```text
~/.agents/skills/horspowers -> <repo>/skills
```

The legacy `.codex/superpowers-codex` CLI remains available for compatibility,
but it is not the primary path.

## Worktree / Finishing Skills

When a skill needs to reason about worktrees or branch state, use read-only git
commands first:

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
BRANCH=$(git branch --show-current)
```

- `GIT_DIR != GIT_COMMON` means you are already inside a linked worktree
- Empty `BRANCH` means detached HEAD and some branch/push flows may be blocked

Skills should adapt to those signals instead of blindly creating another
worktree or assuming normal branch operations are available.
