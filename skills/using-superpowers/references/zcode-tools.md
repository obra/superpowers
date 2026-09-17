# ZCode Tool Mapping

Skills speak in actions ("dispatch a subagent", "create a todo", "read a file"). On ZCode these resolve to the tools below.

| Action | Tool |
|--------|------|
| Read a file | `Read` |
| Create a file | `Write` |
| Edit a file | `Edit` |
| Run a shell command | `Bash` |
| Search file contents | `Bash` with `grep`/`rg` — ZCode has no dedicated Grep tool |
| Find files by name | `Bash` with `find`/`fd` — ZCode has no dedicated Glob tool |
| Fetch a URL | `WebFetch` |
| Web search | `WebSearch` |
| Dispatch a subagent | `Agent` |
| Create / update todos | `TodoWrite` (read back with `TodoRead`) |
| Invoke a skill | `Skill` |
| Ask your human partner a question | `AskUserQuestion` |

## Subagent dispatch

Skills that say "dispatch a subagent" or "Task tool (general-purpose)" call ZCode's `Agent` tool. Use `general-purpose` for implementer/reviewer-style work and `Explore` for read-only codebase investigation. Do not invent other agent types; if `Agent` is unavailable, do the work inline and say so.

## Task tracking

`TodoWrite`/`TodoRead` already match the names skills use — no translation needed.

## Skills

Invoke skills with the native `Skill` tool.
