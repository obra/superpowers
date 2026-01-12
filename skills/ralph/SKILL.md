---
name: ralph
description: Use when starting autonomous overnight iteration loops for well-defined specs and implementation plans
---

# Ralph

## Overview

Autonomous iteration loops with fresh context per task. Uses existing Hyperpowers skills (TDD, verification, code review) per iteration.

**Core principle:** Fresh agent per iteration + existing quality skills = autonomous overnight execution without context rot.

## When to Use

Use ralph when:
- You have a validated spec + implementation plan
- Tasks are well-defined and independent
- You want autonomous overnight execution
- You need to walk away and return to completed work

Don't use when:
- Tasks require judgment calls or design decisions
- Plan isn't validated (run brainstorm/research/write-plan first)
- Tasks are tightly coupled (use subagent-driven-development instead)

## Commands

| Command | Description |
|---------|-------------|
| `/ralph init` | Create template files (specs, plan, guardrails) |
| `/ralph start` | Start loop (validates first) |
| `/ralph resume` | Continue from progress.txt |
| `/ralph status` | Show progress + recent activity |
| `/ralph stop` | Graceful stop with summary |

## Quick Reference

TODO: Complete after iteration pattern is implemented

## Red Flags

**Never:**
- Skip validation before starting
- Use non-Haiku model (cost control)
- Retry failed iteration without fresh context
- Accumulate context across iterations
