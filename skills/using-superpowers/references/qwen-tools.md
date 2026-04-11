# Qwen Tool Mapping

Skills use generic tool names. When you encounter these in a skill, use your Qwen equivalent:

| Skill references | Qwen equivalent |
|-----------------|------------------|
| `TodoWrite` | `todo_write` (built-in) |
| `Task` tool (subagent dispatch) | See [Subagent dispatch](#subagent-dispatch) below |
| `Read`, `Write`, `Edit` (files) | `read_file`, `write_file`, `edit` |
| `Bash` / shell | `run_shell_command` |
| `Skill` tool (invoke a skill) | Skills load natively — just follow the instructions |

## Subagent dispatch

Qwen Code has a **built-in `general-purpose` subagent** that is automatically triggered
during task execution. Unlike Claude Code's explicit `Task` tool, Qwen's subagent is
managed by the system — the model decides autonomously when to delegate.

**What this means for skills:**

1. **You cannot manually spawn agents.** Skills that instruct the agent to "dispatch a
   subagent" should be reframed as "use your subagent capability to..." — trust the model
   to delegate when appropriate.

2. **Subagents have limited tool access.** The built-in subagent does not have the full
   tool set of the main agent. It can read files, search, and reason, but may not have
   file write/edit capabilities depending on configuration.

3. **Subagent tool names use TitleCase.** Issues have been reported where tools appear as
   `TodoWrite` vs `todoWrite` — the model handles this internally.

**Workaround for named agent dispatch:**

When a skill references a named agent type (e.g., `superpowers:code-reviewer`):

1. Read the agent's prompt template file (e.g., `code-quality-reviewer-prompt.md`)
2. Fill in any placeholders with actual values
3. Delegate the task to your subagent by passing the filled prompt as context
4. The subagent will execute and return results to you

Frame subagent instructions as task delegations:

```
Your task is to perform the following review. Follow these instructions exactly.

<review-criteria>
[filled prompt content]
</review-criteria>

Output ONLY the structured response following the format above.
```

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

## Execution modes

Qwen Code supports four execution modes:

- **Plan** — The agent plans before acting; use for complex tasks
- **Default** — Standard interactive mode
- **Auto-edit** — The agent can edit files without confirmation
- **YOLO** — Maximum autonomy, minimal confirmation prompts

Skills that require autonomous work (like subagent-driven-development) work best
in `Auto-edit` or `YOLO` mode.
