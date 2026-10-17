# Qoder Tool Mapping

Skills describe actions rather than hard-coding one runtime's tool names. In
Qoder CLI and Qoder IDE, use the corresponding native tool exposed by the
current session:

| Action requested by a skill | Qoder equivalent |
|---|---|
| Invoke a skill | Qoder's native `Skill` tool |
| Read a file | `Read` |
| Create or replace a file | `Write` |
| Edit an existing file | `Edit` |
| Run a shell command | `Bash` |
| Search file contents | `Grep` |
| Find files by path or pattern | `Glob` |
| Fetch a URL | `WebFetch` |
| Search the web | `WebSearch` |
| Dispatch a subagent | `Agent`; use `general-purpose` for implementation or review, `Explore` for read-only discovery, and `Plan` for read-only planning |
| Create or update a todo list | `TodoWrite` |
| Ask the human partner a blocking question | `AskUserQuestion` |

Tool availability can vary by Qoder entry point, mode, and configuration. Trust
the current session's tool list when it differs from this mapping. Keep
dependent subagent work sequential; parallelize only independent work.
