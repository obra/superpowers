# Ultipowers MCP Augment

Ultipowers MCP Augment is a fork of [obra/superpowers](https://github.com/obra/superpowers). It keeps the Superpowers workflow skeleton for brainstorming, planning, TDD, systematic debugging, review, and delivery, then adds an MCP-aware execution layer for code navigation and implementation.

The goal is simple: Superpowers controls the workflow, while specialized tools handle the codebase.

```text
Ultipowers MCP Augment
  |- brainstorming / planning / TDD / review workflow
  |- mem0 for architecture context, decisions, and graph intelligence
  `- Serena MCP for symbol navigation, references, edits, and diagnostics
```

## Credits

This fork exists because the original Superpowers project established a strong workflow model for coding agents. Credit and thanks go to Jesse Vincent, Prime Radiant, and the Superpowers contributors for the original methodology, skill structure, and agent behavior design.

This repository is a focused fork for Codex users who want MCP-augmented execution. It is not an upstream replacement and does not claim ownership of the original Superpowers work.

## How It Works

Ultipowers preserves the core Superpowers sequence:

1. `using-superpowers` ensures relevant skills are loaded before action.
2. `brainstorming` develops and approves a design before implementation.
3. `writing-plans` turns the design into a TDD-oriented implementation plan.
4. `subagent-driven-development` or `executing-plans` runs the plan.
5. `test-driven-development`, `systematic-debugging`, `requesting-code-review`, and `verification-before-completion` enforce quality gates.
6. `finishing-a-development-branch` handles final delivery.

The added MCP layer is conditional. If mem0 or Serena are unavailable, the workflow falls back to normal Superpowers behavior.

## MCP Layer

### mem0

Use mem0 for durable project knowledge:

- architecture notes and design decisions
- graph summaries and dependency maps
- coding conventions and project-specific constraints
- reusable debugging and review learnings

Memory is context, not proof. Current code, tests, and diagnostics remain authoritative.

### Serena

Use Serena for live code navigation and edits:

- project onboarding and active project checks
- symbol overview and symbol search
- reference and impact discovery
- symbol-body edits and insertions
- diagnostics for edited files

Shell search and file reads remain valid fallbacks for literals, config, docs, manifests, generated artifacts, and cases where MCP coverage is insufficient.

## Added Skills

- `mcp-session-sync`: load relevant mem0 context and verify Serena state near session start.
- `mcp-routing`: route code discovery, edits, diagnostics, and durable memory writes through the best available structured tool.
- `mcp-trace`: trace bugs, feature impact, and cross-module behavior before changing code.

## Codex Plugin

The Codex plugin manifest is:

```text
.codex-plugin/plugin.json
```

It identifies the plugin as:

```text
ultipowers
```

The skill tree is exposed through:

```text
skills/
```

## Local Development

Clone the fork:

```bash
git clone https://github.com/thaingocthienlong/superpowers.git ultipowers
cd ultipowers
```

Run the focused plugin contract test:

```bash
node tests/codex-plugin-contract.test.js
```

Validate the Codex plugin manifest with the local plugin validator when available:

```bash
python C:/Users/longt/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py .
```

## License

MIT. See [LICENSE](LICENSE).
