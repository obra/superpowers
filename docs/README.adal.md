# Superpowers for AdaL

[AdaL](https://github.com/SylphAI-Inc/adal) (`@sylphai/adal-cli`) is a multi-model agentic CLI with native skill discovery and a plugin marketplace.

## Install

AdaL's plugin system reads `.claude-plugin/marketplace.json` natively:

```bash
/plugin marketplace add obra/superpowers
/plugin install superpowers@superpowers-dev
```

Skills appear in the agent's context from the next session.

## How it works

After install, AdaL discovers all Superpowers skills and surfaces them in
the `<SKILLS>` prompt block every session (name + path + description).
The agent reads a skill's `SKILL.md` with `read_file` when it judges the
skill relevant to the current task — the same progressive-disclosure
model Codex uses.

See `skills/using-superpowers/references/adal-tools.md` for the complete
tool mapping.

## Update

```bash
/plugin update superpowers@superpowers-dev
```

## Capabilities

| Capability | Status |
|-----------|--------|
| File read/write/edit | ✅ Native |
| Shell commands | ✅ Native |
| Search (grep/glob) | ✅ Native |
| Web fetch/search | ✅ Native |
| Subagent dispatch | ⚠️ Degraded — work inline (no model-callable dispatch tool) |
| Task tracking | Fallback: plan files / `TODO.md` |
| Native `Skill` tool | ❌ — uses `read_file` on `SKILL.md` |

## Status

AdaL discovers and surfaces Superpowers skills through its existing
plugin lifecycle. Autonomous skill selection (the model reading
`using-superpowers` then `brainstorming` without explicit prompting)
is under active development — currently 0/8 clean sessions pass.
See the PR discussion for measured evidence.

Note: The tool-mapping reference (`references/adal-tools.md`) and this
documentation become available in the installed plugin only after
the upstream PR is merged.

## Requirements

- AdaL CLI v1.0.0+ (`@sylphai/adal-cli`)
- An active AdaL session
