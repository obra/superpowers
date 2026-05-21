# DeepSeek TUI Tool Mapping

Skills use Claude Code tool names. When you encounter these in a skill, use your platform equivalent:

| Skill references | DeepSeek TUI equivalent |
|-----------------|------------------------|
| `Read` (file reading) | `read_file` |
| `Write` (file creation) | `write_file` |
| `Edit` (file editing) | `edit_file` / `apply_patch` |
| `Bash` (run commands) | `exec_shell` / `task_shell_start` + `task_shell_wait` |
| `Grep` (search file content) | `grep_files` |
| `Glob` (search files by name) | `file_search` |
| `TodoWrite` (task tracking) | `checklist_write` |
| `Skill` tool (invoke a skill) | `load_skill` (or `read_file` on `skills/<name>/SKILL.md`) |
| `WebSearch` | `web_search` |
| `WebFetch` | `fetch_url` |
| `Task` tool (dispatch subagent) | `agent_open` / `agent_eval` / `agent_close` |
| Multiple `Task` calls (parallel) | Multiple parallel `agent_open` calls |
| Task status/output | `agent_eval` with the agent id |
| `EnterPlanMode` / `ExitPlanMode` | Read-only Plan mode (available natively) |

## Persistent Shell Sessions

DeepSeek TUI supports persistent background shell sessions for long-running commands:

| Tool | Purpose |
|------|---------|
| `task_shell_start` | Start a long-running command in the background |
| `task_shell_wait` | Poll or wait for a background shell to complete |
| `exec_shell` with `background: true` | Alternative async command dispatch |

## Subagent Support

DeepSeek TUI supports subagents natively via `agent_open`/`agent_eval`/`agent_close`:

| Skill instruction | DeepSeek TUI equivalent |
|-------------------|------------------------|
| `Task tool (superpowers:implementer)` | `agent_open` with the filled `implementer-prompt.md` |
| `Task tool (superpowers:spec-reviewer)` | `agent_open` with the filled `spec-reviewer-prompt.md` |
| `Task tool (superpowers:code-reviewer)` | `agent_open` with the filled review prompt |
| `Task tool (superpowers:code-quality-reviewer)` | `agent_open` with the filled `code-quality-reviewer-prompt.md` |
| `Task tool (general-purpose)` with inline prompt | `agent_open` with your inline prompt |
| `Explore` sub-agent | `agent_open` with role `explore`/`explorer` |

### Prompt filling

Skills provide prompt templates with placeholders like `{WHAT_WAS_IMPLEMENTED}` or `[FULL TEXT of task]`. Fill all placeholders and pass the complete prompt as the message to `agent_open`. The prompt template itself contains the agent's role, review criteria, and expected output format — the subagent will follow it.

### Parallel dispatch

DeepSeek TUI supports parallel subagent dispatch. When a skill asks you to dispatch multiple independent subagent tasks in parallel, open all those `agent_open` calls together in the same turn. Keep dependent tasks sequential, but do not serialize independent tasks.

## Checklists

Skills use `TodoWrite` for task tracking. Use `checklist_write` instead. The first parameter is the complete list of items to track:

```python
checklist_write(todos=[
    {"content": "Task description", "status": "in_progress"},
    {"content": "Next task", "status": "pending"},
])
```

Update task status with `checklist_update` or `checklist_write` with the full updated list.

## Additional DeepSeek TUI tools

These tools are available in DeepSeek TUI but have no direct Claude Code equivalent:

| Tool | Purpose |
|------|---------|
| `diagnostics` | Report workspace info, git detection, sandbox availability |
| `handle_read` | Read bounded slices from large var_handle payloads |
| `recall_archive` | Search prior context cycles for content not in briefing |
| `notify` | Fire a desktop notification for long-running task completion |
| `load_skill` | Load a skill's SKILL.md content by name |
| `tool_search_tool_regex` / `tool_search_tool_bm25` | Search deferred tool definitions |
| `task_gate_run` | Run a verification gate with structured evidence |
| `rlm_open` / `rlm_eval` / `rlm_configure` / `rlm_close` | Persistent Python REPL for long-context semantic work |
