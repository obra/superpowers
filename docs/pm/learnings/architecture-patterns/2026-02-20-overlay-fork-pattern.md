---
date: 2026-02-20
project: scaffolding-platform
project_type: claude-code-plugin
category: architecture-patterns
tags: [overlay-fork, native-primitives, severity-gates, compound-engineering]
outcome: success
---

## What Worked

Using Claude Code native primitives (Task tool, hooks, AskUserQuestion, model routing) instead of building custom infrastructure. The orchestrator is thin — mostly configuration and domain logic.

Overlay approach (additive files in personal `~/.claude/skills/` and `~/.claude/agents/`, new commands in fork) keeps upstream merges clean. Only CLAUDE.md was added to the fork as a new file — zero modifications to existing Superpowers files.

## What Didn't Work

Nothing significant at the architecture level. The split between fork commands (repo-level) and personal skills/agents (user-level) is the right separation of concerns.

## Reusable Pattern

For Claude Code plugin projects: overlay approach (additive files, minimal core modifications) keeps upstream merges clean. Severity-based gates (P1/P2/P3) prevent gate fatigue while still catching critical issues. Personal skills in `~/.claude/skills/` are portable across all projects without plugin installation.
