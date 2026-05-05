# Junie Tool Mapping

Skills use Claude Code tool names. When you encounter these in a skill, use your platform equivalent:

> **Note:** Junie's subagent docs list tool names that match Claude Code (Read, Bash, Glob, etc.). These mappings assume the same names apply in the main agent context. Verify in a live session and update this file if names differ.

| Skill references | Junie equivalent |
|-----------------|-----------------|
| `Read` (file reading) | `Read` |
| `Write` (file creation) | `Write` |
| `Edit` (file editing) | `Edit` |
| `Bash` (run commands) | `Bash` |
| `Grep` (search file content) | `Grep` |
| `Glob` (search files by name) | `Glob` |
| `WebSearch` | `WebSearch` |
| `WebFetch` | `WebFetch` (if available) or use `WebSearch` with the target URL |
| `AskUserQuestion` | `AskUserQuestion` |
| `Skill` tool (invoke a skill) | Read the skill file at `~/.junie/skills/superpowers/<skill-name>/SKILL.md` then follow it |
| `TodoWrite` (task tracking) | Use your native task tracking if available, otherwise maintain a checklist in conversation |
| `Task` tool (dispatch subagent) | Not natively supported — execute the subagent task inline in the current session |

## Loading Skills

Superpowers skills are installed at `~/.junie/skills/superpowers/`. To load a skill:

1. Read the file at `~/.junie/skills/superpowers/<skill-name>/SKILL.md`
2. Follow the skill's instructions exactly

Example: to load the `brainstorming` skill, read `~/.junie/skills/superpowers/brainstorming/SKILL.md`.

## Additional Junie tools

No Junie-specific tools without Claude Code equivalents have been identified. If you discover platform-specific tools (e.g., IDE integration tools), update this mapping.
