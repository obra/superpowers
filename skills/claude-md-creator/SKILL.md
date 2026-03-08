---
name: claude-md-creator
description: >
  MUST USE when creating, writing, or improving CLAUDE.md, AGENTS.md, or any
  repository-level context file for coding agents. Triggers on: /init command,
  "create CLAUDE.md", "write AGENTS.md", "initialize agent context",
  "set up Claude Code for this project", "help me set up context file",
  or any similar request. This skill produces minimal, high-signal context
  files based on empirical best practices.
---

# CLAUDE / AGENTS Context File Creator

This skill guides the creation of repository-level context files (e.g., `CLAUDE.md`, `AGENTS.md`) based on empirical findings that **minimal, targeted instructions outperform verbose, auto-generated documents**.

Key principle: **Only include what the agent cannot easily discover itself.**

## Trigger Conditions

This skill MUST be invoked when any of the following occur:

- The `/init` command is run
- The user asks to create, write, or improve a `CLAUDE.md` or `AGENTS.md`
- The user mentions "agent context", "initialize project", "set up Claude Code"
- A repo is missing a `CLAUDE.md` and the user begins a new project setup
- During `brainstorming` or `writing-plans` when the repo lacks a context file

## High-Signal Content (include)

- Exact commands for build, test, lint, type-check, and deploy.
- Non-obvious environment setup (env vars, secrets, services).
- Critical constraints and conventions (e.g., "never edit generated files", "fast test subset").
- Key architectural decisions that aren't obvious from the code.
- Preferred patterns and anti-patterns specific to the project.

## Low-Signal Content (avoid)

- Restating README content or project overviews.
- Long architecture descriptions or style-guide prose.
- Redundant explanations of things the agent can discover directly from the repo.
- Generic best practices that apply to any project.

## Process

1. **Scan the repo** — read key config files (`package.json`, `tsconfig.json`, `Makefile`, CI configs, etc.) and source structure.
2. **Identify gaps** — what would an agent get wrong without explicit guidance?
3. **Ask minimal questions** — only ask about things that can't be inferred from the repo.
4. **Produce a short, high-signal context file** — stay under ~50 lines whenever possible.
5. **Validate** — ensure every line passes the test: "would the agent get this wrong without being told?"
