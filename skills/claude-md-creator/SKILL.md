---
name: claude-md-creator
description: >
  Creates minimal, high-signal CLAUDE.md and AGENTS.md context files
  based on empirical best practices. Invoke on /init command, "create
  CLAUDE.md", "update CLAUDE.md", "write AGENTS.md", or "set up Claude Code for this
  project". Also invoked by brainstorming when repo lacks a context file.
  tools: Read, Glob, Grep, Bash, Edit
---

# CLAUDE / AGENTS Context File Creator

Creates repository-level context files (`CLAUDE.md`, `AGENTS.md`) that give coding agents the minimum guidance needed to work correctly in a repo.

**Core principle: Only include what the agent cannot easily discover itself.**

Empirical research (Gloaguen et al., 2026 — "Evaluating AGENTS.md") shows that LLM-generated context files *decrease* agent performance by 3% and increase cost by 20-23% when they contain redundant or overly broad content. Human-written, minimal context files improve performance by ~4%. The difference comes down to signal density — every unnecessary line adds cognitive load without helping the agent solve tasks.

## Trigger Conditions

Invoke this skill when any of the following occur:

- The `/init` command is run
- The user asks to create, write, or update a `CLAUDE.md` or `AGENTS.md`
- The user mentions "agent context", "initialize project", "set up Claude Code"
- A repo is missing a `CLAUDE.md` and the user begins a new project setup
- During `brainstorming` or `writing-plans` when the repo lacks a context file

## What to Include (highest to lowest priority)

### 1. Build, test, and lint commands (highest impact)

Explicit tool and command mentions are the single most effective instruction type — agents use mentioned tools 1.6x-2.5x more often. Spell out exact commands:

```
npm run test -- --watch
uv run pytest tests/ -x
make lint && make typecheck
```

### 2. Non-obvious environment setup

Env vars, required services, secrets handling, database setup — things the agent would get wrong without being told.

### 3. Critical constraints (things that cause wrong behavior if violated)

Focus narrowly on constraints where violating them breaks something:
- "Never edit files in `generated/` — they're overwritten by codegen"
- "Always run migrations through the ORM, never raw SQL"
- "The `legacy/` module uses CommonJS — no ES imports"

### 4. Repo-specific patterns and anti-patterns

Only patterns unique to this project that differ from standard practice. If it's what any experienced developer would do by default, leave it out.

## What to Exclude

These categories have been empirically shown to provide zero benefit or actively hurt agent performance:

### Repository overviews and project descriptions
100% of LLM-generated context files included these, yet agents took identical steps to discover files whether the overview existed or not. The agent explores the repo anyway — an overview just adds tokens without saving any work.

### Directory trees and file structure listings
Same finding: detailed directory structures don't help agents locate relevant files. They navigate codebases by searching, not by reading maps.

### Architecture summaries and design explanations
Broad architecture descriptions don't help agents solve tasks. If there's an architectural constraint that would cause incorrect behavior (e.g., "this is a monorepo — changes to `packages/core` require rebuilding all dependents"), include the constraint. Skip the explanation of how the architecture works.

### Content that duplicates existing documentation
Don't restate what's already in README, docs/, wiki, or inline comments. Redundancy with existing docs is actively harmful — when researchers removed documentation from repos, LLM-generated context files improved performance by 2.7%, proving the duplication was the problem.

### Generic best practices
"Write tests", "follow SOLID principles", "use meaningful variable names" — agents already know these. Only include project-specific deviations from standard practice.

### Over-constraining requirements
Unnecessary requirements make tasks harder. Every rule you add has a cost — the agent spends reasoning tokens processing it and may over-apply it. Include a constraint only if violating it would cause a real problem in this specific repo.

## Process

1. **Scan the repo** — read key config files (`package.json`, `tsconfig.json`, `Makefile`, CI configs, etc.) and source structure.
2. **Identify gaps** — what would an agent get wrong without explicit guidance? Focus on commands, env setup, and constraints that cause breakage.
3. **Ask minimal questions** — only ask about things that can't be inferred from the repo.
4. **Draft a short, high-signal context file** — aim for under ~50 lines. Every line should pass the test: *"would the agent produce incorrect output without this?"*
5. **Self-assess before presenting** — before showing the draft, apply the filter to every line yourself: *"Is this discoverable by reading the code, types, or inline comments?"* If yes, cut it. If unsure, cut it. Only surface lines that would cause incorrect agent behavior if absent. Do not ask the user to identify redundant items — that is your job.
6. **Present the draft for human review** — LLM-generated context files without human review consistently underperform. Walk the user through what you kept and briefly state *why each section survives the filter* (one phrase per section is enough). Ask only questions the codebase cannot answer — e.g., undocumented team conventions, production-only gotchas, or decisions made outside the repo.
