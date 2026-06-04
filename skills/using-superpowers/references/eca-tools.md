# ECA Tool Mapping

Skills use Claude Code tool names. When you encounter these in a skill, use your platform equivalent:

| Skill references | ECA equivalent |
|-----------------|----------------|
| `Read` (file reading) | `eca__read_file` |
| `Write` (file creation) | `eca__write_file` |
| `Edit` (file editing) | `eca__edit_file` |
| `Bash` (run commands) | `eca__shell_command` |
| `Grep` (search file content) | `eca__grep` |
| `Glob` / `LS` (list directory) | `eca__directory_tree` |
| `TodoWrite` (task tracking) | `eca__task` |
| `Skill` tool (invoke a skill) | `eca__skill` |
| `Task` tool (dispatch subagent) | `eca__spawn_agent` |

## Subagent support

ECA supports subagents via the `eca__spawn_agent` tool. The `code` agent is the primary implementation agent, `explorer` is for codebase exploration, and `general` handles complex multi-step tasks.

When a skill says to dispatch a named agent type, use `eca__spawn_agent` with the appropriate agent and a detailed task prompt:

| Skill instruction | ECA equivalent |
|-------------------|----------------|
| `Task tool (superpowers:implementer)` | `eca__spawn_agent(agent: "code", task: "<filled implementer-prompt.md>")` |
| `Task tool (superpowers:spec-reviewer)` | `eca__spawn_agent(agent: "general", task: "<filled spec-reviewer-prompt.md>")` |
| `Task tool (superpowers:code-reviewer)` | `eca__spawn_agent(agent: "general", task: "<filled code-reviewer.md>")` |
| `Task tool (superpowers:code-quality-reviewer)` | `eca__spawn_agent(agent: "general", task: "<filled code-quality-reviewer-prompt.md>")` |
| `Task tool (general-purpose)` with inline prompt | `eca__spawn_agent(agent: "general", task: "<inline prompt>")` |
| `Task tool (explorer)` | `eca__spawn_agent(agent: "explorer", task: "<exploration task>")` |

### Prompt filling

Skills provide prompt templates with placeholders like `{WHAT_WAS_IMPLEMENTED}` or `[FULL TEXT of task]`. Fill all placeholders and pass the complete prompt as the task to `eca__spawn_agent`.

### Parallel dispatch

ECA supports parallel subagent dispatch. When a skill asks you to dispatch multiple independent subagent tasks in parallel, spawn all of them together. Keep dependent tasks sequential, but do not serialize independent subagent tasks.
