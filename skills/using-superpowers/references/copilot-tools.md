# GitHub Copilot CLI Tool Mapping

Skills use Claude Code tool names. When you encounter these in a skill, use the GitHub Copilot CLI equivalent:

| Skill references | GitHub Copilot CLI equivalent |
| --- | --- |
| `Skill` tool (invoke a skill) | Skills load natively from `~/.copilot/skills` |
| `Task` tool (dispatch subagent) | Use a built-in or custom agent from `~/.copilot/agents/*.agent.md` |
| Multiple `Task` calls (parallel) | Use multiple agents in parallel if your Copilot surface supports it; otherwise run them sequentially |
| `Read`, `Write`, `Edit` (files) | Use Copilot's native file tools |
| `Bash` (run commands) | Use Copilot's native shell/terminal tools |

## Named Agent Mapping

Some Superpowers skills refer to named Claude agents such as `superpowers:code-reviewer`.

In GitHub Copilot CLI, install the reviewer as a personal custom agent named `code-reviewer` at `~/.copilot/agents/code-reviewer.agent.md`.

## Fallbacks

If the current Copilot surface cannot dispatch custom agents or parallel agents, fall back to single-session execution with `executing-plans`.
