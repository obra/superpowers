---
inclusion: always
description: "Development conventions and project structure for the Superpowers repository"
---

# Superpowers Development

This is the Superpowers repository — a composable skills library for coding agents.

## Project Structure

- `skills/` — Individual skills, each with a `SKILL.md` file containing YAML frontmatter (name, description) and markdown instructions
- `.claude-plugin/` — Claude Code plugin manifest
- `.cursor-plugin/` — Cursor plugin manifest
- `.codex/` — Codex installation support
- `.opencode/` — OpenCode plugin and installation support
- `.kiro-power/` — Kiro Power (POWER.md + INSTALL.md)
- `hooks/` — Session start hooks for Claude Code and Cursor
- `lib/` — Shared JavaScript utilities (skills-core.js)
- `docs/` — Platform-specific documentation and design plans
- `tests/` — Test suites for skill triggering and integration

## Conventions

- Skills use YAML frontmatter with `name` and `description` fields (per the agentskills.io spec)
- SKILL.md files reference Claude Code tool names; platform-specific tool mapping is handled in bootstrap (not in skill files)
- Design documents go in `docs/plans/YYYY-MM-DD-<topic>-design.md`
- Implementation plans go in `docs/plans/YYYY-MM-DD-<topic>-implementation.md`
- Each platform has its own directory: `.claude-plugin/`, `.cursor-plugin/`, `.codex/`, `.opencode/`, `.kiro-power/`
