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
| `Skill` tool (invoke a skill) | Use the `agent_skill_read_doc` tool with the skill name (e.g., `superpowers:brainstorming`) |
| `TodoWrite` (task tracking) | Use your native task tracking if available, otherwise maintain a checklist in conversation |
| `Task` tool (dispatch subagent) | Not natively supported — execute the subagent task inline in the current session |

## Loading Skills

Superpowers skills are installed in the `~/.junie/skills/superpowers/` directory. To load a skill:

1. Call the `agent_skill_read_doc` tool with the prefixed skill name (e.g., `superpowers:brainstorming`)
2. Follow the skill's instructions exactly

Example: to load the `brainstorming` skill, use `agent_skill_read_doc(name="superpowers:brainstorming")`.

## Additional Junie tools

No Junie-specific tools without Claude Code equivalents have been identified. If you discover platform-specific tools (e.g., IDE integration tools), update this mapping.
