# nimbou-skills

`nimbou-skills` is the canonical skill library for `Claude Code`, `Codex`, and `VS Code Copilot Chat`. It ships a backend-first core for `NestJS`, `Prisma`, `Clean Architecture`, and `SOLID`, plus Nuxt/Vuetify skills and Codex-only mirrors for Claude command workflows under `.codex/skills/`.

This fork consolidates:
- backend-first workflow skills
- NestJS auditing skills
- Nuxt/Vuetify skills
- Claude commands and Codex integration

## Skill Model

- Supported harnesses: `Claude Code` and `Codex`
- VS Code integration: shared skills in `~/.copilot/skills` and agents in `~/.config/Code/User/prompts`
- Default architecture bias: `NestJS + Prisma + Clean Architecture + SOLID`
- Use `nestjs-*` for backend-first work and `nuxt-*` for Nuxt-specific work

### Core workflow skills

- `fullstack-think`
- `nestjs-think`
- `nestjs-plan`
- `executing-plans`
- `subagent-driven-development`
- `dispatching-parallel-agents`
- `test-driven-development`
- `e2e-test-quality`
- `nestjs-debug` backend-first debugging for NestJS/Prisma work
- `verification-before-completion`
- `requesting-code-review`
- `receiving-code-review`
- `using-git-worktrees`
- `finishing-a-development-branch`
- `writing-skills`

### NestJS-specific skills

- `nestjs-test`

### Nuxt-specific skills

- `nuxt-think`
- `nuxt-plan`
- `nuxt-catalog`
- `nuxt-audit`
- `nuxt-test`
- `nuxt-debug`

## Repository Layout

- `plugins/nimbou-skills/skills/` — shared skill library
- `plugins/nimbou-skills/agents/` — auxiliary review and auditing agents
- `plugins/nimbou-skills/commands/` — Claude command entrypoints such as `/feature-dev`, `/design-md`, and `/merge-pr`
- `.codex/skills/` — Codex-only mirrors for the Claude command workflows
- `.agents/plugins/marketplace.json` — repo-scoped Codex marketplace catalog
- `.claude-plugin/marketplace.json` — marketplace manifest for `claude plugin marketplace add`
- `docs/plans/` — generated plans and design artifacts
- `tests/` — skill tree, install flow, and catalog coverage

## Installation

Clone the repository once into `/var/www` and run the single bootstrap script:

```bash
cd /var/www
git clone <your-fork-url> nimbou-skills
cd /var/www/nimbou-skills
./install.sh
```

The bootstrap script:
- runs `pnpm install`
- registers and installs the Claude Code plugin
- installs the same plugin into GitHub Copilot CLI from the local repo path
- links the shared skills and Codex command mirrors into `~/.copilot/skills` for VS Code Copilot Chat
- links the review and auditing agents into `~/.config/Code/User/prompts` and `~/.config/Code/User/prompts/agents`
- compares the installed Claude Code plugin version against `plugins/nimbou-skills/.claude-plugin/plugin.json` and skips reinstall when it already matches
- requires Codex `rust-v0.121.0+` or newer for marketplace installation
- registers the Codex marketplace from the repository root, backed by `.agents/plugins/marketplace.json`
- runs `npm link` for `nb-catalog`
- creates `~/.local/bin/codex-full` when missing, wired to `codex --dangerously-bypass-approvals-and-sandbox`
- creates `~/.local/bin/chrome-devtools-mcp-wayland` and rewrites `~/.codex/config.toml` so the `chrome-devtools` MCP inherits the local X/Wayland session automatically

If your installed Codex build does not support `codex plugin marketplace add`, upgrade to `rust-v0.121.0+` or newer and rerun `./install.sh`.

After the bootstrap finishes, restart Claude Code and Codex, then reload VS Code so VS Code Copilot Chat picks up the updated skills and agents.

## Nuxt Catalog Workflow

The Nuxt domain uses a shared machine-level catalog workflow:

```bash
cd /path/to/project
nb-catalog validate
nb-catalog generate
```

Optional domain filtering stays available:

```bash
nb-catalog generate projects
```

This workflow writes `components.meta.json` and `.generated/component-catalog/components.meta.json`.

`nuxt-catalog` defaults to `validate -> generate` and runs the bundled generator from this repository via `CATALOG_ROOT`.

If a project wants a copied local fallback instead of depending on `/var/www/nimbou-skills` at runtime, copy `skills/nuxt-catalog/` into `.claude/skills/nuxt-catalog/` and run `.claude/skills/nuxt-catalog/scripts/install.sh <project-root>`.

## Notes

- `/feature-dev`, `/design-md`, and `/merge-pr` stay as Claude commands, with matching Codex mirrors in `.codex/skills/`.
- `fullstack-think` is the mixed-request entry point. It closes the shared specification first, dispatches `nuxt-plan` and `nestjs-plan` in parallel, and reconciles the result before execution. Frontend-only requests stay in `nuxt-think`; backend-only requests stay in `nestjs-think`.
- `nestjs-think` and `nestjs-plan` stay backend-first; `nuxt-think` and `nuxt-plan` cover Nuxt planning.
- `nestjs-test` handles Gherkin-driven backend coverage, audit routing, and backend test stabilization.
- `nestjs-debug` handles NestJS, Prisma, and boundary failures across controller, use-case, repository, and transaction layers.
- `nuxt-debug` is the Codex browser-debugging flow; `nuxt-test` turns the result into bounded coverage.
- `nuxt-audit` is the single frontend review pass; `executing-plans` handles explicit execution groups.
- `e2e-test-quality` covers broader end-to-end reliability beyond one Nuxt module slice.
- This fork intentionally removed upstream bootstrap hooks and unsupported harness integrations.

## License

MIT License. See `LICENSE`.
