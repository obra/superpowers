# Using Superpowers-NG with Ralph

This guide explains how to use Superpowers-NG skills within the [Ralph autonomous loop framework](https://github.com/frankbria/ralph-claude-code).

## Overview

**Ralph** provides the autonomous loop orchestration (session management, exit detection, rate limiting).

**Superpowers-NG** provides development methodologies and best practices (TDD, debugging, planning).

They work at different layers and complement each other perfectly.

## Architecture

```
Ralph (External Shell Orchestration)
  ├── Loop management & continuation (--continue)
  ├── Exit signal detection
  ├── Rate limiting & circuit breakers
  └── Task list (@fix_plan.md)
      │
      └── Claude Code (Internal Skills)
          └── Superpowers-NG
              ├── test-driven-development
              ├── systematic-debugging
              ├── manus-planning
              └── brainstorming
```

## Quick Start

### 1. Install Both Systems

```bash
# Install Ralph
git clone https://github.com/frankbria/ralph-claude-code.git
cd ralph-claude-code
./install.sh

# Install Superpowers-NG as Claude Code plugin
/plugin marketplace add https://github.com/OniReimu/superpowers-ng
/plugin install superpowers-ng@superpowers-ng-marketplace
```

### 2. Create Ralph Project with Superpowers

```bash
# Create project
ralph-setup my-project
cd my-project

# Copy Superpowers-enhanced PROMPT.md
cp /path/to/superpowers-ng/docs/ralph-integration/PROMPT.template.md PROMPT.md

# Edit PROMPT.md with your project specifics
# The template already includes Superpowers skill references

# Run Ralph
ralph --monitor
```

## How Skills Work in Ralph Loops

Ralph runs the same PROMPT.md every loop using `--continue` for session continuity. Skills need to be aware of existing artifacts.

### Skill Lifecycle in Ralph

| Skill | Frequency | Condition | Notes |
|-------|-----------|-----------|-------|
| **brainstorming** | Once per task | Only if design.md missing | Auto-skips if design exists |
| **manus-planning** | Started once, continues | Checks for docs/manus/.active | Resumes automatically |
| **writing-plans** | Once per task | Only if plan.md missing | For shorter tasks |
| **executing-plans** | Every loop | Reads existing plan.md | Batch execution |
| **test-driven-development** | Every loop | Always | Core discipline |
| **systematic-debugging** | As needed | When bugs occur | Root cause analysis |
| **verification-before-completion** | Before exit | Claims complete | Evidence-based |

### Example: Typical Ralph Loop Flow

```
Loop 1 (Session 1):
  - No design.md → Run brainstorming → Create design.md
  - No docs/manus/ → Start manus-planning → Create task_plan.md
  - Work on Phase 1
  - Emit status: IN_PROGRESS

Loop 2 (Session 2, --continue):
  - design.md exists → Skip brainstorming
  - docs/manus/ + .active exists → Resume manus-planning
  - Continue Phase 2
  - Emit status: IN_PROGRESS

Loop 3 (Session 3, --continue):
  - Continue Phase 3
  - Fix bugs using systematic-debugging
  - Emit status: IN_PROGRESS

Final Loop:
  - All phases complete
  - verification-before-completion checks tests
  - Remove .active marker
  - Emit status: COMPLETE, EXIT_SIGNAL: true
```

## Recommended Skills for Ralph

### Essential (Use in PROMPT.md)

1. **manus-planning** - Perfect for Ralph's multi-session nature
   - Persistent files survive context resets
   - 5-phase structure maps well to long tasks
   - Auto-resumes via .active marker

2. **test-driven-development** - Maintains quality across loops
   - RED-GREEN-REFACTOR cycle
   - Prevents rationalizations
   - Works every loop

3. **systematic-debugging** - For when things break
   - 4-phase root cause process
   - Better than trial-and-error
   - Saves loop iterations

4. **verification-before-completion** - Before emitting EXIT_SIGNAL
   - Evidence-based claims only
   - Prevents premature completion
   - Critical for autonomous operation

### Optional (Conditional Use)

5. **brainstorming** - Once at start if design needed
   - Now checks for existing design
   - Auto-skips in subsequent loops
   - Use conditionally in PROMPT.md

6. **using-git-worktrees** - If working on feature branches
   - Isolates work
   - Clean separation
   - Pairs with finishing-a-development-branch

## PROMPT.md Structure

See `PROMPT.template.md` for a complete example. Key patterns:

### Conditional Skill Invocation

```markdown
# Design Phase (run once)
If docs/plans/*-design.md DOESN'T exist:
  - Use superpowers:brainstorming

# Implementation Phase (every loop)
Use superpowers:manus-planning (auto-resumes if docs/manus/ exists)
Use superpowers:test-driven-development for all code
```

### Status Emission

Ralph needs status at the end of every response:

```markdown
## Status Format

At the end of EVERY response, emit:

---RALPH_STATUS---
WORK_TYPE: IMPLEMENTATION | TESTING | DOCUMENTATION | REFACTORING
STATUS: IN_PROGRESS | COMPLETE | BLOCKED | NOT_RUN
PROGRESS: [What was accomplished this loop]
REMAINING: [Tasks left in @fix_plan.md]
EXIT_SIGNAL: true | false
---END_STATUS---

EXIT_SIGNAL = true ONLY when:
- All tasks in @fix_plan.md complete
- All Manus phases complete (if using manus-planning)
- Tests pass (verified via verification-before-completion)
```

## File Management

### Ralph's Files

- `@fix_plan.md` - Task checklist (Ralph's source of truth)
- `PROMPT.md` - Development instructions (includes skill references)
- `@AGENT.md` - Build/run instructions
- `logs/ralph.log` - Execution history

### Superpowers Files

- `docs/plans/YYYY-MM-DD-topic-design.md` - Design documents (from brainstorming)
- `docs/manus/task_plan.md` - 5-phase plan (from manus-planning)
- `docs/manus/findings.md` - Research and requirements
- `docs/manus/progress.md` - Session log and test results
- `docs/manus/.active` - Marker for active manus task

### Sync Strategy

Keep both systems updated:

| Action | Update Ralph | Update Superpowers |
|--------|--------------|-------------------|
| Complete task | Mark `[x]` in @fix_plan.md | Mark phase complete in task_plan.md |
| Log progress | Append to logs/ralph.log | Append to progress.md |
| Design complete | N/A | Write to docs/plans/ |

## Common Issues

### Issue: Brainstorming runs every loop

**Solution**: Updated in v0.1.0. Brainstorming now checks for existing design.md and auto-skips in autonomous mode.

### Issue: Losing context between loops

**Solution**: Use manus-planning instead of writing-plans/executing-plans. Manus files persist across loops.

### Issue: Ralph exits too early

**Solution**: Ensure PROMPT.md clearly defines EXIT_SIGNAL conditions. Use verification-before-completion before claiming done.

### Issue: Skills expect user interaction

**Solution**: Most skills now detect autonomous mode. If issues persist, adjust PROMPT.md to guide autonomous behavior.

## Advanced: Custom PROMPT.md Patterns

### Pattern: Conditional Planning

```markdown
# Choose planning system based on task complexity

If task requires >50 tool calls OR spans multiple sessions:
  - Use superpowers:manus-planning
Else:
  - Use superpowers:writing-plans + superpowers:executing-plans
```

### Pattern: Phased Approach

```markdown
# Phase-based workflow

Phase 1 - Design (once):
  - Check for design.md
  - If missing: superpowers:brainstorming

Phase 2 - Planning (once):
  - superpowers:manus-planning or writing-plans

Phase 3 - Implementation (every loop):
  - superpowers:test-driven-development
  - Update @fix_plan.md as tasks complete

Phase 4 - Completion:
  - superpowers:verification-before-completion
  - Emit EXIT_SIGNAL: true
```

## Testing Your Integration

1. **Create test project**:
   ```bash
   ralph-setup test-superpowers
   cd test-superpowers
   cp /path/to/PROMPT.template.md PROMPT.md
   ```

2. **Add simple task to @fix_plan.md**:
   ```markdown
   - [ ] Create hello world function with tests
   ```

3. **Run Ralph with monitoring**:
   ```bash
   ralph --monitor
   ```

4. **Verify behavior**:
   - Loop 1: Should run brainstorming, create design.md
   - Loop 2: Should skip brainstorming, resume manus-planning
   - Final: Should emit EXIT_SIGNAL: true when complete

## Resources

- **Ralph**: https://github.com/frankbria/ralph-claude-code
- **Superpowers-NG**: https://github.com/OniReimu/superpowers-ng
- **Template**: See `PROMPT.template.md` in this directory
- **Issues**: Report integration issues at https://github.com/OniReimu/superpowers-ng/issues

## Contributing

Found a better integration pattern? Please share:
1. Test it with Ralph
2. Document the approach
3. Submit a PR with your improved PROMPT.template.md
