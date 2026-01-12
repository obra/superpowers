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

## Validation (Pre-Start)

Before starting loop, validate ALL of these:

### Required Files

```bash
# Check required files exist
ls specs/*.md           # At least one spec
ls IMPLEMENTATION_PLAN.md
ls GUARDRAILS.md
```

### Plan Parsing

```bash
# Check plan has uncompleted tasks
grep -E "^\s*-\s*\[\s*\]" IMPLEMENTATION_PLAN.md
```

### Environment

```bash
# Git status (should be clean)
git status --porcelain

# Tests passing
npm test || pytest || cargo test  # project-appropriate

# tmux available
tmux -V
```

### Model Check

```bash
# Check current model
claude --print-settings | grep model
```

**If model is not Haiku:**
```
WARNING: Current model is [model]. Ralph runs many iterations.
Haiku costs $1/$5 per million tokens (vs $3/$15 for Sonnet).
40-iteration session: ~$4-12 on Haiku vs $12-36 on Sonnet.

Continue with [model]? [Yes / Switch to Haiku]
```

### Validation Output

```
Validating Ralph setup...

✓ specs/ directory found (N files)
✓ IMPLEMENTATION_PLAN.md found (N tasks)
✓ GUARDRAILS.md found
✓ .ralph/progress.txt initialized

Parsing IMPLEMENTATION_PLAN.md...
✓ All N tasks have clear descriptions
⚠ Warning: Task 4 has no explicit test criteria

Checking environment...
✓ Git repo clean
✓ Tests passing (N/N)
✓ tmux available
✓ Model: Haiku

Ready to start. Estimated: N tasks, ~40 iterations max, 8h limit
```

## Red Flags

**Never:**
- Skip validation before starting
- Use non-Haiku model (cost control)
- Retry failed iteration without fresh context
- Accumulate context across iterations
