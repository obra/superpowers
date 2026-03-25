# Platform Tool Mapping

If you encounter legacy tool names in a skill, use your platform equivalent:

| Skill references | Codex | GitHub Copilot local installs |
|-----------------|-------|------------------------------|
| Dispatch one focused agent task | `spawn_agent` | Custom agent or sub-agent |
| Dispatch multiple independent tasks | multiple `spawn_agent` calls | multiple custom agent or sub-agent invocations |
| Wait for agent results | `wait` | use the platform's native agent waiting flow |
| Free finished agent slots | `close_agent` | use the platform's native agent lifecycle |
| Legacy checklist tracking | `update_plan` | use the platform's native task list or plan tracker |
| `Skill` tool (invoke a skill) | native skills from `~/.agents/skills/` | native skills from `~/.copilot/skills/` |
| `Read`, `Write`, `Edit` (files) | Use your native file tools | Use your native file tools |
| `Bash` (run commands) | Use your native shell tools | Use your native shell tools |

## Agent Support

### Codex

- Current Codex releases enable subagent workflows by default. No `multi_agent` feature flag is required for `spawn_agent`, `wait`, or `close_agent`.
- Built-in agents:
  - `default` - General-purpose fallback
  - `worker` - Execution-focused implementation and fix work
  - `explorer` - Read-heavy codebase exploration and review work
- Custom agents:
  - Project-scoped: `.codex/agents/*.toml`
  - Personal: `~/.codex/agents/*.toml`
  - FeatureForge installs its `code-reviewer` custom agent to `~/.codex/agents/code-reviewer.toml`.
  - Required fields: `name`, `description`, `developer_instructions`
  - Common optional fields: `nickname_candidates`, `model`, `model_reasoning_effort`, `sandbox_mode`, `mcp_servers`, `skills.config`
  - Omitted optional fields inherit from the parent session
  - If a custom agent name matches a built-in such as `explorer`, the custom agent takes precedence
- Global subagent limits stay under `[agents]` in Codex config:
  - `max_threads`
  - `max_depth`
  - `job_max_runtime_seconds`
  - Defaults: `max_threads = 6`, `max_depth = 1`

### GitHub Copilot local installs

Install skills to `~/.copilot/skills/` and custom agents to `~/.copilot/agents/`. Use the platform's native custom-agent and sub-agent features for skills like `dispatching-parallel-agents` and `subagent-driven-development`.
