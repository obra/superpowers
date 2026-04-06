# sspower Customizations

sspower is a fork of [obra/superpowers](https://github.com/obra/superpowers) (v5.0.5) with the following customizations.

## Upstream

- **Remote**: `upstream` → `https://github.com/obra/superpowers.git`
- **Fork base**: tag `v5.0.5`
- **Origin**: `origin` → `https://github.com/sskys18/sspower.git`

## New Skills

| Skill | Purpose |
|-------|---------|
| `using-sspower` | Replaces `using-superpowers` — custom skill routing, red-flags table, platform adaptation |
| `second-opinion` | Independent review via Codex subagent before merging or after 2+ failed fix attempts |

## Modified Skills

All upstream skills received **reference extraction** — large inline examples and rationale blocks were moved to `references/` subdirectories to reduce SKILL.md token load. Modified skills:

- `brainstorming` — added `references/design-process.md`, `references/after-design.md`
- `dispatching-parallel-agents` — added `references/examples.md`
- `finishing-a-development-branch` — added `references/option-details.md`
- `receiving-code-review` — added `references/response-patterns.md`
- `subagent-driven-development` — added `references/advantages.md`, `references/example-workflow.md`
- `systematic-debugging` — added `references/phases.md`, `references/rationalizations.md`
- `test-driven-development` — added `references/rationalizations.md`
- `writing-plans` — added `references/plan-template.md`
- `writing-skills` — added `references/cso-guide.md`, `references/quality-checklist.md`, `references/skill-creation-process.md`

## New Docs

- `docs/MAINTENANCE.md` — maintenance guide for this fork
- `docs/superpowers/plans/2026-04-04-codex-integration-fork.md` — Codex integration plan
- `docs/superpowers/specs/2026-04-03-codex-integration-fork-design.md` — Codex integration design spec

## Versioning

sspower v1.0.0 — independent from upstream superpowers v5.x.

Version tracked in:
- `package.json`
- `.claude-plugin/plugin.json`

## Removed from Upstream

| Removed | Reason |
|---------|--------|
| `.cursor-plugin/` | Cursor config |
| `.opencode/` | OpenCode config |
| `.codex/` | Codex install guide (for Superpowers, not sspower) |
| `gemini-extension.json`, `GEMINI.md` | Gemini config |
| `commands/` | Deprecated slash commands (replaced by skills) |
| `hooks/hooks-cursor.json`, `hooks/run-hook.cmd` | Cursor hooks, Windows batch |
| `scripts/`, `.version-bump.json` | Superpowers release tooling |
| `.github/` | Superpowers issue/PR templates |
| `AGENTS.md`, `CHANGELOG.md`, `CODE_OF_CONDUCT.md`, `RELEASE-NOTES.md` | Superpowers docs |
| `skills/using-superpowers/` | Replaced by `using-sspower` |
| `tests/opencode/` | OpenCode tests |

## Syncing with Upstream

```bash
git fetch upstream
git merge upstream/main  # or rebase
# Resolve conflicts, keeping sspower customizations
```
