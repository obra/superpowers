# sspower

Fork of [Superpowers](https://github.com/obra/superpowers) v5.0.5 — customized for Claude Code.

## Structure

```
skills/          — one dir per skill, each with SKILL.md + references/
hooks/           — session-start hook
agents/          — subagent prompts (code-reviewer, codex-rescue)
scripts/         — codex-bridge.mjs (native Codex CLI integration)
schemas/         — structured output contracts for Codex (implementation, spec-review, quality-review)
docs/            — customization docs, plans, specs
tests/           — skill and brainstorm-server tests
```

## Key Rules

- Skills use progressive disclosure: lean SKILL.md + `references/` loaded on demand
- `using-sspower` replaces upstream `using-superpowers` for skill routing
- `second-opinion` and Codex integration require Codex CLI installed locally (`npm install -g @openai/codex`) and authenticated (`codex login`). Uses native `scripts/codex-bridge.mjs`, not the external openai-codex plugin
- All skill changes must be eval-tested before committing
