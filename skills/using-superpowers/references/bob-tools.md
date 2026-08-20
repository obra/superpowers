# Bob IDE Tool Mapping

Skills speak in actions ("dispatch a subagent", "create a todo", "read a file"). On IBM Bob IDE these resolve to the tools below.

| Action skills request | Bob IDE equivalent |
|----------------------|-------------------|
| Read a file | `read_file` |
| Create / fully rewrite a file | `write_file` |
| Edit a file (targeted) | `apply_diff`, `insert_content`, `search_and_replace` |
| Run a shell command | `execute_command` |
| Search file contents | `grep` |
| Find files by name | `glob` |
| List directory contents | `list_files` |
| Navigate code symbols | `GetSymbolsOverview`, `FindSymbol`, `FindReferencingSymbols` |
| Dispatch a subagent (general-purpose) | `spawn_subagent` with `name: "general"` (full tool access) |
| Dispatch a subagent (read-only research) | `spawn_subagent` with `name: "explore"` |
| Pass prior conversation context to subagent | Set `fork_context: true` on the `spawn_subagent` call |
| Multiple parallel dispatches | Multiple `spawn_subagent` calls in the same response |
| Create / update todos | `update_todo_list` |
| Invoke a skill | `use_skill` with `skill_name` parameter |
| Switch mode | `switch_mode` |
| Structured multi-step work (subtasks) | `start_subtask` |
| Start a workflow | `start_workflow` |
| Ask the user a clarifying question | `ask_followup_question` |
| Web fetch / search | Not natively available — use an MCP server if configured; otherwise treat as degraded |

## Instructions file

When a skill mentions "your instructions file", on Bob IDE this is **`AGENTS.md`**. Bob loads `AGENTS.md` from the workspace root and merges it into the model context alongside any mode-specific instructions.

## Personal skills directory

User-level skills live at **`~/.bob/skills/`**. Project-level skills live at **`.bob/skills/`** within the project root. Bob auto-discovers all `SKILL.md` files in these directories at session start; no explicit registration is required.

## Subagent support

Bob dispatches subagents through the `spawn_subagent` tool.

| Parameter | Value | Notes |
|-----------|-------|-------|
| `name` | `"general"` | Full tool access — use for implementation tasks |
| `name` | `"explore"` | Read-only — use for codebase research |
| `fork_context` | `true` | Passes parent conversation history into the subagent |
| `description` | string | What the subagent should accomplish — be specific |

Skills dispatch with `Subagent (general-purpose):` and either reference a prompt-template file or supply an inline prompt. On Bob:

| Skill dispatch form | Bob IDE equivalent |
|---------------------|--------------------|
| References a `*-prompt.md` template (implementer, task-reviewer, code-reviewer, etc.) | Fill the template, then `spawn_subagent` with `name: "general"` and the filled prompt as `description` |
| References `superpowers:requesting-code-review`'s `./code-reviewer.md` | `spawn_subagent` with `name: "general"` and the filled review template as `description` |
| Inline prompt (no template referenced) | `spawn_subagent` with `name: "general"` and your inline prompt as `description` |

### Prompt filling

Skills provide prompt templates with placeholders like `{WHAT_WAS_IMPLEMENTED}` or `[FULL TEXT of task]`. Fill all placeholders before passing the complete prompt to `spawn_subagent`. The prompt template contains the subagent's role, criteria, and expected output — the subagent will follow it.

### Parallel dispatch

Bob supports parallel subagent dispatch. Issue multiple `spawn_subagent` calls in the same response to run independent work in parallel. Keep dependent tasks sequential, but do not serialize independent subagent tasks just to preserve a simpler history.
