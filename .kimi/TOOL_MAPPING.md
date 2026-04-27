# Kimi Code 2.6 Tool Mapping

Skills use Claude Code tool names. When you encounter these in a skill, use your platform equivalent:

| Skill references | Kimi Code 2.6 equivalent |
|-----------------|--------------------------|
| `Read` (file reading) | `ReadFile` |
| `Write` (file creation) | `WriteFile` |
| `Edit` (file editing) | `StrReplaceFile` |
| `Bash` (run commands) | `Shell` |
| `Grep` (search file content) | `Grep` |
| `Glob` (search files by name) | `Glob` |
| `TodoWrite` (task tracking) | `SetTodoList` |
| `Skill` tool (invoke a skill) | Auto-discovery + `/skill:<name>` slash command |
| `WebSearch` | `SearchWeb` |
| `WebFetch` | `FetchURL` |
| `Task` tool (dispatch subagent) | `Agent` |
| `EnterPlanMode` / `ExitPlanMode` | `EnterPlanMode` / `ExitPlanMode` |

## Skill Discovery and Loading

Kimi Code 2.6 has native skill discovery. When Superpowers is installed:

1. **Auto-discovery**: Kimi Code scans `~/.config/agents/skills/` at startup, parses `SKILL.md` frontmatter, and injects skill names and descriptions into the system prompt.
2. **Auto-triggering**: The AI automatically reads skill content when it determines a skill is relevant to the current task.
3. **Explicit loading**: Use `/skill:<name>` to force-load a skill. Examples:
   - `/skill:using-superpowers`
   - `/skill:brainstorming`
   - `/skill:test-driven-development`

When a skill references the `Skill` tool (Claude Code's native skill invocation), interpret it as: "Ensure the skill is loaded and follow its instructions." Kimi Code handles this via auto-discovery or `/skill:<name>`.

## Subagent Support

Kimi Code 2.6 **does** support true subagent dispatch via the `Agent` tool:

- Isolated context per subagent instance
- Built-in types: `coder`, `explore`, `plan`
- Supports `run_in_background=true` for parallel execution
- Use `subagent_type="explore"` for read-only research tasks
- Use `subagent_type="coder"` for implementation tasks

Skills like `subagent-driven-development` and `dispatching-parallel-agents` work correctly with Kimi Code's `Agent` tool.

## Additional Kimi Code 2.6 Tools

These tools are available in Kimi Code but have no Claude Code equivalent:

| Tool | Purpose |
|------|---------|
| `AskUserQuestion` | Request structured input from the user with multiple-choice options |
| `Think` | Record thinking process for complex reasoning |
| `TaskList` | List background tasks |
| `TaskOutput` | Retrieve output from background tasks |
| `TaskStop` | Stop a running background task |

## Background Tasks

Kimi Code supports background task execution via `Shell` with `run_in_background=true` or `Agent` with `run_in_background=true`. Use `TaskList`, `TaskOutput`, and `TaskStop` to manage long-running processes.
