# AtomCode Tool Mapping

Skills speak in actions ("dispatch a subagent", "create a todo", "read a file"). On AtomCode these resolve to the native tools below.

| Action skills request | AtomCode equivalent |
| --- | --- |
| Invoke a skill | AtomCode's native `use_skill` tool (`list_skills` to enumerate) |
| Read a file | `read_file` (supports offset/limit and multi-range reads) |
| Create a file | `write_file` |
| Edit a file | `edit_file` (targeted string match); `search_replace` for project-wide renames |
| Delete a file | `bash` (e.g. `rm` — destructive commands prompt for permission) |
| Run a shell command | `bash` |
| List a directory | `list_directory` |
| Search file contents / find files by name | `grep`, `glob` |
| Fetch a URL / web search | `web_fetch`, `web_search` |
| Dispatch a subagent (`Subagent (general-purpose):` template) | `task` with `subagent_type` (`"explore"` for codebase exploration, `"worker"` for edits); `team` for async parallel work |
| Task tracking ("create a todo", "mark complete") | `todowrite` |

## Skills

AtomCode has a native skill system. Skills are loaded with the `use_skill` tool and listed with `list_skills`; do not read skill files with file tools to load one. Installed superpowers skills are namespaced (`superpowers:skill-name`).

## Code graph

AtomCode ships code-intelligence tools for navigating large codebases without reading whole files: `list_symbols`, `read_symbol`, `find_references`, `trace_callers`, `trace_callees`, `trace_chain`, `file_dependencies`, `blast_radius`. Prefer these over dumping files when understanding structure.

## Memory

AtomCode has a persistent `memory` tool (`action: "remember"` / `"forget"` / `"list"`). When a skill or your human partner establishes a durable preference, record it there.
