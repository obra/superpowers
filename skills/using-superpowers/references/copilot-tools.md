# Copilot CLI Tool Mapping

Skills use Claude Code tool names. When you encounter these in a skill, use your platform equivalent:

| Skill references | Copilot CLI equivalent |
|-----------------|------------------------|
| `Skill` tool (invoke a skill) | `/skill-name` slash command — skills invoke directly |
| `EnterPlanMode` | Shift+Tab or `/plan` |
| `TodoWrite` (task tracking) | `TodoWrite` (same name) |
| `Task` tool (dispatch subagent) | `Task` (same name) |
| Multiple `Task` calls (parallel) | Multiple `Task` calls (same pattern) |
| `Read`, `Write`, `Edit` (files) | Same names — use directly |
| `Bash` (run commands) | Same name — use directly |
| `Grep`, `Glob` (search) | Same names — use directly |
| `WebSearch`, `WebFetch` (web) | Same names — use directly |
| `EnterWorktree` | `EnterWorktree` (same name) |

## Key Difference

The main difference from Claude Code is skill invocation. Instead of using a `Skill` tool, invoke skills directly as `/skill-name` slash commands or let the agent auto-invoke based on context.

All other tools share the same names across both platforms.
