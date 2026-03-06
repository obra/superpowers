---
name: claude-md-creator
description: Use when creating or improving CLAUDE.md, AGENTS.md, or similar repository-level context files for coding agents, focusing on minimal, high-signal content.
---

# CLAUDE / AGENTS Context File Creator

This skill guides the creation of repository-level context files (e.g., `CLAUDE.md`, `AGENTS.md`) based on empirical findings that **minimal, targeted instructions outperform verbose, auto-generated documents**.

Key principle: **Only include what the agent cannot easily discover itself.**

High-signal content:
- Exact commands for build, test, lint, type-check, and deploy.
- Non-obvious environment setup (env vars, secrets, services).
- Critical constraints and conventions (e.g., “never edit generated files”, “fast test subset”).

Avoid:
- Restating README content or project overviews.
- Long architecture descriptions or style-guide prose.
- Redundant explanations of things the agent can discover directly from the repo.

## When to Use in Superpowers

- Early in `brainstorming` or `writing-plans` when the repo lacks a good `CLAUDE.md`/`AGENTS.md`.
- When the user explicitly asks to “set up agent context”, “write AGENTS.md”, or similar.

In those situations, use this skill to:
- Ask only the minimal questions needed to capture commands, constraints, and non-standard workflows.
- Produce a short, high-signal context file that stays under ~50 lines whenever possible.

