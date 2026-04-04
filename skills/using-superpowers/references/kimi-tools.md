# Kimi CLI Tool Mapping

Skills use Claude Code tool names. When you encounter these in a skill, use your platform equivalent:

| Skill references | Kimi CLI equivalent |
|-----------------|---------------------|
| `Read` (file reading) | `ReadFile` |
| `Write` (file creation) | `WriteFile` |
| `Edit` (file editing) | `StrReplaceFile` |
| `Bash` (run commands) | `Shell` |
| `Grep` (search file content) | `Grep` |
| `Glob` (search files by name) | `Glob` |
| `WebSearch` | `SearchWeb` |
| `WebFetch` | `FetchURL` |
| `TodoWrite` (task tracking) | `SetTodoList` (see [Task management](#task-management)) |
| `TaskCreate` / `TaskUpdate` | `SetTodoList` (see [Task management](#task-management)) |
| `TaskList` | `TaskList` |
| `TaskGet` | `TaskOutput` |
| `TaskStop` | `TaskStop` |
| `Skill` tool (invoke a skill) | `/skill:name` slash command |
| `Agent` (dispatch subagent) | `Agent` (see [Subagent dispatch](#subagent-dispatch)) |
| `EnterPlanMode` / `ExitPlanMode` | `EnterPlanMode` / `ExitPlanMode` |
| `AskUserQuestion` | `AskUserQuestion` |
| `Think` | `Think` |
| `NotebookEdit` | No equivalent — Kimi CLI does not support notebook editing |

## Task management

Claude Code has granular task tools (`TaskCreate`, `TaskUpdate`, `TaskGet`, `TaskList`). Kimi CLI uses `SetTodoList` which replaces the entire todo list in a single call.

When a skill says "create a task and mark it in_progress":
1. Read the current todo list
2. Add or update the relevant item
3. Call `SetTodoList` with the complete updated list

## Subagent dispatch

Kimi CLI's `Agent` tool uses type-based dispatch with three built-in types:

| Type | Purpose |
|------|---------|
| `coder` | Software engineering — Shell, file operations, search |
| `explore` | Read-only exploration — search and read only |
| `plan` | Architecture design — read and search only |

### Named agent dispatch

Claude Code skills reference named agent types like `superpowers:code-reviewer`. Kimi CLI does not have a named agent registry — `Agent` dispatches by type.

When a skill says to dispatch a named agent type:

1. Find the agent's prompt file (e.g., `code-quality-reviewer-prompt.md`)
2. Read the prompt content
3. Fill any template placeholders (`{BASE_SHA}`, `{WHAT_WAS_IMPLEMENTED}`, etc.)
4. Dispatch using `Agent` with type `coder` and the filled prompt as the task description

| Skill instruction | Kimi CLI equivalent |
|-------------------|---------------------|
| `Agent (superpowers:code-reviewer)` | `Agent(type="coder", ...)` with code-reviewer prompt content |
| `Agent (general-purpose)` with inline prompt | `Agent(type="coder", ...)` with the same prompt |
| `Agent (Explore)` | `Agent(type="explore", ...)` |
| `Agent (Plan)` | `Agent(type="plan", ...)` |
