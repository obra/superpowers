# Pi Tool Mapping

Pi supports Superpowers skills natively through skill discovery and `/skill:name` commands. It does not expose Claude Code's `Skill` tool.

When a Superpowers skill mentions Claude Code tool names, use these Pi equivalents:

| Superpowers / Claude Code name | Pi equivalent |
| --- | --- |
| `Skill` | Pi native skills: load the relevant `SKILL.md` with `read`, or let the human use `/skill:name` |
| `Read` | `read` |
| `Write` | `write` |
| `Edit` | `edit` |
| `Bash` | `bash` |
| `Grep` | `grep` when active; otherwise `bash` with `rg`/`grep` |
| `Glob` | `find` or `bash` with shell globs |
| `LS` / `List` | `ls` when active; otherwise `bash` with `ls` |
| `Task` | Use an installed subagent tool such as `subagent` from `pi-subagents` if available |
| `TodoWrite` | Use an installed todo/task tool if available, otherwise track tasks in the plan or `TODO.md` |

## Skills

Pi discovers skills from configured skill directories and installed Pi packages. A Superpowers Pi package should expose `skills/` through its `pi.skills` manifest entry. The agent should still follow the Superpowers rule: when a skill applies, load and follow it before responding.

## Subagents

Pi core does not ship a standard subagent tool. The `pi-subagents` package is a strong optional companion and provides a `subagent` tool with single-agent, chain, parallel, async, forked-context, and resume/status workflows. If no subagent tool is available, do not fabricate `Task` calls; execute sequentially in the current session or explain that the optional subagent capability is not installed.

## Task lists

Pi core does not ship a standard task-list tool. If a todo/task extension is installed, use its documented tool. Otherwise use Superpowers plan files, checklists in Markdown, or a repo-local `TODO.md` for task tracking.
