# ECA Tool Mapping

Skills speak in actions ("dispatch a subagent", "create a todo", "read a file"). On ECA (Editor Code Assistant) these resolve to the tools below.

| Action skills request | ECA equivalent |
|----------------------|----------------|
| Read a file | `eca__read_file` |
| Create / overwrite a file | `eca__write_file` |
| Edit a file (targeted replace) | `eca__edit_file` |
| Move / rename a file | `eca__move_file` |
| Run a shell command | `eca__shell_command` |
| Search file contents | `eca__grep` |
| List directory tree | `eca__directory_tree` |
| Task tracking ("create a todo", "mark complete") | `eca__task` |
| Invoke a skill | `eca__skill` |
| Check editor diagnostics | `eca__editor_diagnostics` |
| Git operations | `eca__git` |
| Fetch a URL / web search | `eca__shell_command` (use `curl`/`wget`) |

## Subagent support

ECA supports subagents via the `eca__spawn_agent` tool. Available agent types:

- `general` — General-purpose agent for complex multi-step tasks and research.
- `explorer` — Codebase search specialist for finding and reading file contents.

When a skill says to dispatch a named agent type, use `eca__spawn_agent` with the appropriate agent and a detailed task prompt:

| Skill instruction | ECA equivalent |
|-------------------|----------------|
| `Task tool (superpowers:implementer)` | `eca__spawn_agent(agent: "general", task: "<filled implementer-prompt.md>")` |
| `Task tool (superpowers:spec-reviewer)` | `eca__spawn_agent(agent: "general", task: "<filled spec-reviewer-prompt.md>")` |
| `Task tool (superpowers:code-reviewer)` | `eca__spawn_agent(agent: "general", task: "<filled code-reviewer.md>")` |
| `Task tool (superpowers:code-quality-reviewer)` | `eca__spawn_agent(agent: "general", task: "<filled code-quality-reviewer-prompt.md>")` |
| `Task tool (general-purpose)` with inline prompt | `eca__spawn_agent(agent: "general", task: "<inline prompt>")` |
| `Task tool (explorer)` | `eca__spawn_agent(agent: "explorer", task: "<exploration task>")` |

### Prompt filling

Skills provide prompt templates with placeholders like `{WHAT_WAS_IMPLEMENTED}` or `[FULL TEXT of task]`. Fill all placeholders and pass the complete prompt as the `task` argument to `eca__spawn_agent`.

### Parallel dispatch

ECA supports parallel subagent dispatch. When a skill asks you to dispatch multiple independent subagent tasks in parallel, issue the `eca__spawn_agent` calls together. Keep dependent tasks sequential.
