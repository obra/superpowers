# sspower

Fork of [Superpowers](https://github.com/obra/superpowers) v5.0.5 — customized for Claude Code.

## Structure

```
skills/          — one dir per skill, each with SKILL.md + references/
hooks/           — SessionStart (diet-activate), UserPromptSubmit (diet-track), PreToolUse:Bash (cmd-rewrite), PreCompact + SessionEnd (wiki-archive)
agents/          — subagent prompts (code-reviewer, codex-rescue)
scripts/         — codex-bridge.mjs (native Codex CLI integration)
schemas/         — structured output contracts for Codex (implementation, spec-review, quality-review)
commands/        — slash command entrypoints (diet, diet-commit, diet-review)
docs/            — customization docs, plans, specs
tests/           — skill and brainstorm-server tests
```

## Key Rules

- Skills use progressive disclosure: lean SKILL.md + `references/` loaded on demand
- `using-sspower` replaces upstream `using-superpowers` for skill routing
- `second-opinion` and Codex integration require Codex CLI installed locally (`npm install -g @openai/codex`) and authenticated (`codex login`). Uses native `scripts/codex-bridge.mjs`, not the external openai-codex plugin. Bridge defaults to `gpt-5.5` + `xhigh` reasoning effort
- Diet hooks: `hooks/package.json` is `{"type":"commonjs"}` even though the repo root is ESM — needed because hook files use CJS. Don't delete it
- Project wiki lives at `<cwd>/.claude/wiki/`: per-session JSON+MD in `sessions/`, plus `decisions.md`, `gotchas.md`, `index.md`. Sidecars are also symlinked into `~/.claude/sessions/` for cross-project tooling
- All skill changes must be eval-tested before committing
