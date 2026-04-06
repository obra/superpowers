# sspower

Fork of [Superpowers](https://github.com/obra/superpowers) v5.0.5 — customized for Claude Code.

## Structure

```
skills/          — one dir per skill, each with SKILL.md + references/
hooks/           — session-start hook
agents/          — subagent prompts (code-reviewer)
docs/            — customization docs, plans, specs
tests/           — skill and brainstorm-server tests
```

## Key Rules

- Skills use progressive disclosure: lean SKILL.md + `references/` loaded on demand
- `using-sspower` replaces `using-superpowers` for skill routing
- `second-opinion` requires the Codex plugin (`openai-codex` marketplace)
- All skill changes must be eval-tested before committing
