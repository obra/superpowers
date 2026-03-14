# Codex Tool Mapping

Many Superpowers skills were originally written around Claude Code tool names.
When a skill uses those older names, translate them to the Codex surface below.

| Legacy skill wording | Codex equivalent |
|----------------------|------------------|
| `Task` tool (dispatch subagent) | `spawn_agent` |
| Multiple parallel `Task` calls | multiple `spawn_agent` calls |
| Large homogeneous fan-out | `spawn_agents_on_csv` |
| Follow-up to a running subagent | `send_input` |
| Reopen a previously closed agent | `resume_agent` |
| Wait for agent results | `wait` |
| Close completed agent threads | `close_agent` |
| `TodoWrite` (task tracking) | `update_plan` |
| `Skill` tool (invoke a skill) | native skill discovery, or explicit `$skill-name` |
| Reviewer / implementer agent labels | named Codex roles in `.codex/examples/agents/` |

## Enable Multi-Agent

Add to your real Codex config (`~/.codex/config.toml` or project
`.codex/config.toml`):

```toml
[features]
multi_agent = true
```

## Role Catalog

Superpowers ships Codex role examples under `.codex/examples/agents/`:

- `explorer` - read-only code path tracing
- `worker` - minimal implementation owner
- `reviewer` - final branch or PR review
- `monitor` - polling and wait-heavy tasks
- `browser_debugger` - optional UI reproduction with browser MCP
- `spec_reviewer` - task scope compliance
- `quality_reviewer` - correctness, tests, and maintenance

These roles are examples, not active project config. Copy them into your real
Codex config directory if you want Codex to use them.

## Stable vs Experimental

- **Stable:** `.agents/skills`, `agents/openai.yaml`, `multi_agent`, and
  `notify`
- **Experimental:** `codex_hooks` with `hooks.json`

The hooks example in `.codex/examples/` is source-derived from Codex and should
be treated as experimental.
