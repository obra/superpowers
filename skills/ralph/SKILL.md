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
grep -E "^[[:space:]]*-[[:space:]]*\[[[:space:]]*\]" IMPLEMENTATION_PLAN.md
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

## Iteration Pattern

Each loop cycle follows this pattern with FRESH context:

```
Orient → Select → Check → Implement → Validate → Review → Update → Commit → Exit
```

### Phase Details

| Phase | Action | On Failure |
|-------|--------|------------|
| Orient | Read specs + plan + progress.txt | N/A (startup) |
| Select | Pick ONE uncompleted task | Exit code 2 (plan exhausted) |
| Check | Search codebase, verify not done | Skip to next task |
| Implement | Use TDD skill | Write failure → Exit code 1 |
| Validate | Use verification skill | Write failure → Exit code 1 |
| Review | Use code review skill | Write feedback → Exit code 1 |
| Update | Write success to progress.txt | N/A |
| Commit | Git commit changes | Write failure → Exit code 1 |
| Exit | End iteration | N/A (always exits) |

### Key Principle

**Failures exit immediately for fresh context.** Progress file bridges knowledge between iterations.

### Iteration Prompt Template

See `./iteration-prompt.md` for the prompt fed to Claude CLI each iteration.

## Progress File (.ralph/progress.txt)

Machine-readable JSON for parsing, human-readable markdown for debugging.

### Structure

```markdown
# Progress

## Current State
- Iteration: 12
- Active Task: Task 5 - Add caching layer
- Status: in-progress
- Started: 2026-01-12 01:30
- Elapsed: 2h 12m

## Task Status
- [x] Task 1 - Setup project structure
- [x] Task 2 - Implement auth endpoints
- [x] Task 3 - Add API rate limiting
- [x] Task 4 - Add input validation
- [ ] Task 5 - Add caching layer
- [ ] Task 6 - Write integration tests
- [ ] Task 7 - Add monitoring hooks

## Iteration History

### Iteration 12 (2026-01-12 03:42)
- Task: 5 - Add caching layer
- Actions: Implemented token bucket algorithm, added middleware
- Files modified: src/middleware/rateLimit.ts, src/config.ts
- Outcome: FAILED - Tests failing, Redis connection timeout
- Learnings: Need to mock Redis in test environment

### Iteration 11 (2026-01-12 03:31)
- Task: 5 - Add caching layer
- Actions: Added Redis client, wrote cache wrapper
- Files modified: src/cache/redis.ts, package.json
- Outcome: FAILED - Code review rejected, missing error handling
- Learnings: Add try/catch around all Redis operations
```

### JSON Block (for machine parsing)

Each iteration appends a JSON block for programmatic access:

```json
{
  "iteration": 12,
  "task_id": "5",
  "task_name": "Add caching layer",
  "status": "failed",
  "failure_reason": "Redis connection timeout",
  "files_modified": ["src/middleware/rateLimit.ts", "src/config.ts"],
  "learnings": "Need to mock Redis in test environment",
  "commit_sha": "abc123",
  "tokens_used": 15000,
  "timestamp": "2026-01-12T03:42:00Z"
}
```

## Completion Detection

Loop stops when ANY condition is met:

### 1. Plan Exhaustion (Primary)

All tasks in `IMPLEMENTATION_PLAN.md` checked off:

```bash
# No uncompleted tasks remain
! grep -qE "^[[:space:]]*-[[:space:]]*\[[[:space:]]*\]" IMPLEMENTATION_PLAN.md
```

Exit code: 2 (success - plan complete)

### 2. Backpressure Satisfied

Tests, lints, and type checks all pass. Enforced by TDD + verification skills per iteration.

### 3. Convergence Detection

No meaningful changes in 3 consecutive iterations:

```bash
# Compare iterations N, N-1, N-2
# If >95% similar (by git diff), increment stuck counter
# At 3x stuck, exit and report
```

Exit code: 3 (stuck - needs human intervention)

### 4. Hard Limits

```yaml
max_iterations: 40
max_duration: 8h  # 28800 seconds
```

Exit code: 4 (limit reached)

### Notifications

On completion, send platform notification:

**macOS:**
```bash
osascript -e 'display notification "7/7 tasks done in 3h 12m" with title "Ralph Complete" sound name "Glass"'
```

**Linux:**
```bash
notify-send -u normal -t 5000 "Ralph Complete" "7/7 tasks done in 3h 12m"
```

## Background Execution

Ralph uses tmux for background execution that survives terminal close.

### Session Management

```bash
# Create detached session
project=$(basename "$(git rev-parse --show-toplevel)")
tmux new-session -t "ralph-$project" -d -c "$(pwd)"

# Check existence
tmux has-session -t "ralph-$project" 2>/dev/null && echo "Running"

# Send command
tmux send-keys -t "ralph-$project" "command" Enter

# Kill session
tmux kill-session -t "ralph-$project"
```

### Loop Script

The loop runs inside tmux:

```bash
#!/bin/bash
# .ralph/loop.sh

set -e

project=$(basename "$(git rev-parse --show-toplevel)")
iteration=0
max_iterations=40
start_time=$(date +%s)
max_duration=28800  # 8 hours

# Graceful shutdown trap
trap 'echo "Stopping after current iteration..."; touch .ralph/stop' SIGINT SIGTERM

while true; do
    # Check stop signal
    [[ -f .ralph/stop ]] && break

    # Check hard limits
    ((iteration++))
    [[ $iteration -gt $max_iterations ]] && break

    elapsed=$(($(date +%s) - start_time))
    [[ $elapsed -gt $max_duration ]] && break

    # Run iteration with fresh context
    exit_code=0
    claude -p "$(cat .ralph/iteration-prompt.md)" --model claude-haiku-4-5 || exit_code=$?

    # Handle exit codes
    case $exit_code in
        0) continue ;;           # Success, next iteration
        1) continue ;;           # Failed, next iteration will retry
        2) break ;;              # Plan exhausted
        3) break ;;              # Stuck detected
        4) break ;;              # Limit reached
        *) break ;;              # Unknown, stop
    esac
done

# Send completion notification
# (platform-specific, see notifications section)

rm -f .ralph/stop
```

### User Commands

```
/ralph start

Starting Ralph loop in tmux session 'ralph-hyperpowers'...

To monitor:  tmux attach -t ralph-hyperpowers
To detach:   Ctrl+B then D
To stop:     /ralph stop

Loop running. Check /ralph status for progress.
```

## Guardrails (GUARDRAILS.md)

Default guardrails created by `/ralph init`:

```markdown
# Guardrails

## Limits
- Max iterations: 40
- Max time: 8 hours
- Model: Haiku only (cost control)

## Quality Gates
- Tests must pass before commit
- Lints/type checks must pass before commit
- Code review must approve before marking task complete

## Git Rules
- Commit after each completed task
- No force push
- No commits to main/master directly
- No uncommitted changes before iteration

## Behavior
- One task per iteration
- Exit on failure (fresh context next iteration)
- Update progress.txt before exiting
- If stuck for 3 consecutive iterations, stop and report

## Forbidden Actions
- Modifying GUARDRAILS.md during loop
- Skipping tests for "quick fixes"
- Accumulating context across iterations
- Retrying within same iteration
```

### Customization

Users can modify GUARDRAILS.md before starting. Ralph reads it fresh each iteration.

**Safe customizations:**
- Adjust max_iterations (recommend 20-60)
- Adjust max_duration (recommend 4-12h)
- Add project-specific rules

**Dangerous customizations:**
- Disabling quality gates (defeats purpose)
- Allowing main/master commits
- Removing cost controls

## Red Flags

**Never:**
- Skip validation before starting
- Use non-Haiku model (cost control)
- Retry failed iteration without fresh context
- Accumulate context across iterations
