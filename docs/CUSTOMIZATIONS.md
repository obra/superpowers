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

sspower uses its own independent version scheme starting at **v1.0.0**, separate from upstream superpowers versioning (v5.x). The fork base was superpowers v5.0.5.

Version is tracked in these files (managed by `.version-bump.json`):
- `package.json`
- `.claude-plugin/plugin.json`

## Config Changes

- `package.json` — name `sspower`, version `1.0.0`
- `.claude-plugin/plugin.json` — name, author, homepage, repository updated to `sskys18/sspower`
- `.version-bump.json` — trimmed to only Claude Code config files

## Removed from Upstream

- `.cursor-plugin/` — Cursor plugin config (not needed)
- `.opencode/` — OpenCode plugin config (not needed)
- `gemini-extension.json`, `GEMINI.md` — Gemini config (not needed)

## Syncing with Upstream

```bash
git fetch upstream
git merge upstream/main  # or rebase
# Resolve conflicts, keeping sspower customizations
```
