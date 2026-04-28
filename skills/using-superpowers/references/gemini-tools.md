# Gemini CLI Tool Mapping

Skills use Claude Code tool names. When you encounter these in a skill, use your platform equivalent:

| Skill references | Gemini CLI equivalent |
|-----------------|----------------------|
| `Read` (file reading) | `read_file` |
| `Write` (file creation) | `write_file` |
| `Edit` (file editing) | `replace` |
| `Bash` (run commands) | `run_shell_command` |
| `Grep` (search file content) | `grep_search` |
| `Glob` (search files by name) | `glob` |
| `TodoWrite` (task tracking) | `write_todos` |
| `Skill` tool (invoke a skill) | `activate_skill` |
| `WebSearch` | `google_web_search` |
| `WebFetch` | `web_fetch` |
| `Task` tool (dispatch subagent) | `@agent-name` (see [Subagent support](#subagent-support)) |

## Subagent support

Gemini CLI supports subagents natively via the `@` syntax. Use the built-in `@generalist` agent to dispatch any task — it has access to all tools and follows the prompt you provide.

When a skill says to dispatch a named agent type, use `@generalist` with the full prompt from the skill's prompt template:

| Skill instruction | Gemini CLI equivalent |
|-------------------|----------------------|
| `Task tool (superpowers:implementer)` | `@generalist` with the filled `implementer-prompt.md` template |
| `Task tool (superpowers:spec-reviewer)` | `@generalist` with the filled `spec-reviewer-prompt.md` template |
| `Task tool (superpowers:code-reviewer)` | `@code-reviewer` (bundled agent) or `@generalist` with the filled review prompt |
| `Task tool (superpowers:code-quality-reviewer)` | `@generalist` with the filled `code-quality-reviewer-prompt.md` template |
| `Task tool (general-purpose)` with inline prompt | `@generalist` with your inline prompt |

### Prompt filling

Skills provide prompt templates with placeholders like `{WHAT_WAS_IMPLEMENTED}` or `[FULL TEXT of task]`. Fill all placeholders and pass the complete prompt as the message to `@generalist`. The prompt template itself contains the agent's role, review criteria, and expected output format — `@generalist` will follow it.

### Parallel dispatch

Gemini CLI supports parallel subagent dispatch. When a skill asks you to dispatch multiple independent subagent tasks in parallel, request all of those `@generalist` or named subagent tasks together in the same prompt. Keep dependent tasks sequential, but do not serialize independent subagent tasks just to preserve a simpler history.

## Additional Gemini CLI tools

These tools are available in Gemini CLI but have no Claude Code equivalent:

| Tool | Purpose |
|------|---------|
| `list_directory` | List files and subdirectories |
| `save_memory` | Persist facts to GEMINI.md across sessions |
| `ask_user` | Request structured input from the user |
| `tracker_create_task` | Rich task management (create, update, list, visualize) |
| `enter_plan_mode` / `exit_plan_mode` | Switch to read-only research mode before making changes |
