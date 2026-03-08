# Superpowers-Optimized

Optimized fork of [obra/superpowers](https://github.com/obra/superpowers) — an agentic skills framework for Claude Code.

## Key Commands

```bash
# Run skill trigger tests
bash tests/skill-triggering/run-all.sh

# Run explicit skill request tests
bash tests/explicit-skill-requests/run-all.sh

# Run subagent-driven-dev E2E tests
bash tests/subagent-driven-dev/run-test.sh
```

## Project Structure

- `skills/` — Each subdirectory contains a `SKILL.md` with YAML frontmatter (`name`, `description`) and the skill body
- `agents/` — Subagent definitions (e.g., `code-reviewer.md`)
- `commands/` — Slash command redirects to skills
- `hooks/` — Session-start hooks
- `lib/skills-core.js` — Shared skill discovery utilities
- `tests/` — Integration and trigger tests
- `docs/plans/` — Design docs and implementation plans

## Conventions

- Skill names use `lowercase-hyphen-case`
- Skill `description` frontmatter defines **when to trigger**, not what the skill does
- Keep SKILL.md files concise; move detailed references to subdirectory files
- All cross-skill references must match the `name:` in the target's frontmatter exactly
- Plans go in `docs/plans/YYYY-MM-DD-<topic>.md`
- Platform: support both Unix and Windows in process management commands

## Critical Constraints

- Never add `TaskCreate`/`TaskUpdate`/`TaskList` references — these are not real Claude Code tools
- The `using-superpowers` skill is the mandatory entry point for all technical work (except micro tasks)
- Discipline-critical skills (`systematic-debugging`, `test-driven-development`, `verification-before-completion`) must include rationalization tables and red flags to enforce LLM compliance
- `context-management` is for cross-session persistence only — Claude Code handles in-session compression automatically
