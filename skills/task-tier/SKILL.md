---
name: task-tier
description: Use at the start of every request to classify it into Trivial/Small/Medium/Large and decide which ceremony skills should fire. Other gating skills defer to this classification.
---

# Task Tier Triage

## Overview

Ceremony scales with task size. A typo fix should not trigger design approval, worktree creation, or multi-stage review. A multi-tenant subsystem should. This skill is the authoritative rubric every other gating skill consults.

**Core principle:** Infer the tier from the request — do NOT ask the user. When uncertain, tier up.

## The Four Tiers

| Tier | Scope | Examples |
|---|---|---|
| **Trivial** | Single-line edit, no logic change | Typo, rename, comment, config flip, dependency bump |
| **Small** | Single file, ≤~30 LOC, no architectural impact | Add a flag, isolated bugfix, add one test, tweak a UI label |
| **Medium** | Multi-file feature within one subsystem | New endpoint, new component, refactor of one module, new migration to one table |
| **Large** | Cross-system or open-ended | New subsystem, schema overhaul, multi-day project, security-sensitive surface, anything the user calls a "platform" or "rewrite" |

## Inference Cues

**Trivial signals:** "fix typo", "rename", "tweak", "update copy", explicit single line/word target.

**Small signals:** "just", "quick", "small", explicit single file, isolated bug report with reproducer.

**Medium signals:** "build", "add feature", "implement", multiple files implied, new external surface (endpoint, component, command).

**Large signals:** "platform", "subsystem", "rewrite", "across the codebase", "migration", "multi-tenant", "auth", "billing", schema change, anything touching >5 files or >1 module.

## Auto-Escalation (When in doubt, tier up)

Promote one tier up if ANY of these apply:

- Touches more than 2 files
- Touches a security surface (auth, crypto, permissions, secrets, input validation at trust boundaries)
- Requires a schema or migration change
- Modifies a public API or external contract
- The user's intent is ambiguous in a way that affects design

## Ceremony Matrix

| | Trivial | Small | Medium | Large |
|---|:-:|:-:|:-:|:-:|
| Restate intent before acting | optional | yes | yes | yes |
| `brainstorming` HARD-GATE | skip | skip | 1-pass batched | full |
| `writing-plans` doc | none | none | inline TODO | full plan file |
| Plan/spec file location | n/a | n/a | `.spx/` (gitignored) | `docs/superpowers/` (committed) |
| `using-git-worktrees` | skip | skip | recommended | REQUIRED |
| Commit cadence | 1 commit | logical units | logical units | frequent (per task) |
| Per-task reviewer | skip | skip | skip | yes |
| Final feature reviewer | skip | skip | yes | yes |
| `test-driven-development` | optional | recommended | yes | yes |
| `verification-before-completion` | yes | yes | yes | yes |
| `systematic-debugging` (when bug surfaces) | yes | yes | yes | yes |

## How Other Skills Use This

Every gating skill in this plugin checks the inferred tier before firing its full ceremony. If a skill's instructions and this matrix conflict, **this matrix wins** for tier-conditional behavior. The skill's content (what to do once it fires) is unchanged.

## Setting Up `.spx/` in a User Repo

The first time Medium-tier work needs a scratch spec or plan in a user repo, add `.spx/` to that repo's `.gitignore` (one line). For details and promotion procedure, see `spx-scratch-template.md` in this skill's directory.

## What This Skill Does NOT Change

- `verification-before-completion` Iron Law — applies to every tier (honesty is cheap)
- `systematic-debugging` root-cause discipline — applies whenever a bug appears
- `receiving-code-review` patterns — applies whenever review feedback arrives
- TDD's RED-GREEN-REFACTOR core — only the strictness of "must" vs "should" varies by tier

## Announcing the Tier

Before starting work, state the inferred tier in one short line so your human partner can correct you:

> "Triaged as **Small** (single file, isolated change). Skipping design doc and worktree."

If they push back ("treat this as Medium please"), accept and reclassify. Do not ask which tier — infer, announce, accept correction.

## Anti-Patterns

- **Asking the user "what tier is this?"** — defeats the purpose. Infer.
- **Auto-tiering down because the user said "quick"** — re-check against escalation rules first. "Quick auth fix" is still Medium-or-Large.
- **Skipping verification-before-completion on Trivial** — even a typo fix needs `git diff` evidence.
- **Treating Large as "Medium plus optional ceremony"** — Large gets full ceremony by default; the user opts out, not in.
