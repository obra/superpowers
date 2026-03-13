# Copilot CLI Tool Mapping

Skills use Claude Code tool names. When you encounter these in a skill, use your platform equivalent:

| Skill references | Copilot CLI equivalent |
|-----------------|------------------------|
| `Skill` tool (invoke a skill) | Skills activate automatically via `/skills` or agent auto-invocation |
| `EnterPlanMode` | `/plan` |
| `TodoWrite` (task tracking) | `TodoWrite` (same name) |
| `Task` tool (dispatch subagent) | `Task` (same name) |
| Multiple `Task` calls (parallel) | Multiple `Task` calls (same pattern) |
| `Read`, `Write`, `Edit` (files) | Same names — use directly |
| `Bash` (run commands) | Same name — use directly |
| `Grep`, `Glob` (search) | Same names — use directly |
| `WebSearch`, `WebFetch` (web) | Same names — use directly |
| `EnterWorktree` | `EnterWorktree` (same name) |

## Key Difference

The main difference from Claude Code is skill invocation. Instead of using a `Skill` tool, skills are managed via `/skills` and activate automatically based on context and skill descriptions.

All other tools share the same names across both platforms.
