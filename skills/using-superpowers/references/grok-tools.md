# Grok Build Tool Mapping

Skills speak in actions ("dispatch a subagent", "create a todo", "read a file",
"invoke a skill"). On [Grok Build](https://github.com/xai-org) these resolve as
follows.

| Action skills request | Grok Build equivalent |
| --- | --- |
| Read a file | `read_file` |
| Create / overwrite a file | `write` (or `search_replace` for edits) |
| Edit a file | `search_replace` |
| Run a shell command | `run_terminal_command` |
| Search file contents | `grep` |
| Find files / list directories | `list_dir`, `grep` with path filters |
| Fetch a URL | `web_fetch` / `open_page` |
| Web search | `web_search` |
| Dispatch a subagent | `spawn_subagent` (`subagent_type`: `general-purpose`, `explore`, or `plan`; optional `isolation: "worktree"`) |
| Wait on background work | `get_command_or_subagent_output` |
| Task tracking ("create a todo") | `todo_write` |
| Invoke a skill | Grok auto-matches skill `description` / `when-to-use` fields, or the user runs `/skill-name`. When a skill applies, **read its `SKILL.md`** (or follow Grok's skill-loading UI) and follow it. Reading `SKILL.md` is the blessed path when no separate Skill tool is exposed. |

## Bootstrap on Grok Build

Grok Build surfaces each installed plugin skill's name + description in session
context. The `using-superpowers` skill description ("Use when starting any
conversation…") is what triggers the methodology. There is **no** SessionStart
`additionalContext` injection path on Grok today (hooks run, but SessionStart /
UserPromptSubmit stdout is not model-visible). Do **not** invent a `Task` tool
name; use `spawn_subagent`.

Empty `hooks: {}` in `.grok-plugin/plugin.json` suppresses the Claude Code
SessionStart hook that ships in `hooks/hooks.json` (same pattern as Codex).

## Worktrees

Prefer `spawn_subagent` with `isolation: "worktree"` when a skill asks for an
isolated workspace. Fall back to `using-git-worktrees` / plain `git worktree`
only when the harness worktree path is unavailable.

## Subagents

- Mechanical implementers: `general-purpose`
- Codebase exploration: `explore` (read-only)
- Architecture / planning: `plan` (read-only)

Pass a full task brief in the `prompt`. Use `resume_from` for fix/review loops
on the same subagent when the harness supports it.

## Verification

Before claiming work is done, follow `verification-before-completion`. On Grok,
also respect any user/project verify-before-report rules.
