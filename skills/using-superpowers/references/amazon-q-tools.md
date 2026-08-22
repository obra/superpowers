# Amazon Q Developer CLI (`q`) Tool Mapping

Skills speak in actions ("dispatch a subagent", "create a todo", "read a file"). On Amazon Q Developer CLI these resolve to the tools below.

## Tools

| Action skills request | Amazon Q CLI equivalent |
|----------------------|------------------------|
| Read a file | `fs_read` |
| Create or edit files | `fs_write` |
| Run a shell command | `execute_bash` |
| Search / find files | `execute_bash` with `grep`/`find`/`rg` (Q has no dedicated search tool) |
| Fetch a URL | `execute_bash` with `curl` |
| Dispatch a subagent (`Subagent (general-purpose):` template) | no built-in subagent tool — see [Subagents](#subagents) |
| Task tracking ("create a todo", "mark complete") | no built-in todo tool — see [Task lists](#task-lists) |

## Bootstrap

Superpowers reaches Amazon Q CLI sessions through the **superpowers custom agent** (`q chat --agent superpowers`). Its `agentSpawn` hook runs the plugin's session-start script once per session; the script detects `AMAZON_Q_AGENT=1` and emits the bootstrap as plain text, which becomes fixed session context. If you are not running under that agent and no bootstrap is present, fall back to reading the skill directly:

```
fs_read with path: ~/.superpowers/skills/using-superpowers/SKILL.md
```

## Subagents

Amazon Q CLI ships no subagent tool. Do not fabricate `Subagent (general-purpose):` calls. Execute sequentially in the current session, or note that subagent capability is not available in this harness.

## Task lists

Amazon Q CLI ships no todo/task tool. Track progress in the plan file's checkboxes or a repo-local `TODO.md`, updated via `fs_write`. Older Superpowers docs may refer to `TodoWrite`; treat that as the task-tracking action above.
