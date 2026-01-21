# Manus Planning Examples

This document demonstrates planning patterns for managing multi-step tasks through persistent file-based workflows in **Superpowers-NG**.

## Core Pattern

All examples follow the 3-file pattern under `docs/manus/`:
- `task_plan.md` — Goal, phases, decisions, errors
- `findings.md` — Research, requirements, resources
- `progress.md` — Session log, test results, detailed actions
- `.active` — Marker file that enables pre-tool reminder hook

## Examples

### Example 1: Greenfield Feature Build - CLI Todo App

**User request:** "Build a simple command-line todo app in Python that can add, list, and delete tasks."

This lightweight walkthrough shows how the 3 files evolve together during a real task.

#### Phase 0: Initialization

Create the Manus planning files under `docs/manus/` and enable the marker file:
- `docs/manus/task_plan.md`
- `docs/manus/findings.md`
- `docs/manus/progress.md`
- `docs/manus/.active`

At this point, the pre-tool hook should start reminding you to review the plan before actions.

#### Phase 1: Requirements & Discovery

**docs/manus/findings.md** (requirements captured)

```md
# Findings

## Requirements
- Python CLI application
- Commands: add, list, delete
- Tasks persist between runs (file-based storage)
- Keep it simple (stdlib preferred)

## Research Findings
- Python stdlib: argparse for CLI
- JSON file storage is good enough for a small example
```

**docs/manus/task_plan.md** (phase stays in_progress)

```md
# CLI Todo App (Python)

**Goal:** Implement a Python CLI todo app with add/list/delete and persistence.

**Current Phase:** 1 - Requirements & Discovery

### Phase 1: Requirements & Discovery
- [x] Understand user requirements
- [x] Identify persistence requirement (tasks survive restart)
- [x] Document findings

**Status:** in_progress
```

**docs/manus/progress.md** (log actions taken)

```md
# Progress Log

## Session: 2026-01-13

### Phase 1: Requirements & Discovery
**Status:** in_progress
**Started:** 2026-01-13 14:05

**Actions:**
- Captured requirements in findings.md
- Confirmed persistence requirement and likely storage format
```

#### Phase 2: Planning & Structure

In Phase 2 you make and record the key technical decisions, then break work into concrete steps.

**docs/manus/task_plan.md** (phase 1 complete, phase 2 in_progress)

```md
**Current Phase:** 2 - Planning & Structure

### Phase 1: Requirements & Discovery
...
**Status:** complete

### Phase 2: Planning & Structure
- [ ] Decide technical approach
- [ ] Document key decisions
- [ ] Break into actionable steps

**Status:** in_progress

## Decisions Made
| Decision | Rationale | Date |
|----------|-----------|------|
| Use `argparse` subcommands | Clear CLI UX, stdlib | 2026-01-13 |
| Store tasks in `todos.json` | Simple persistence, debuggable | 2026-01-13 |
```

**docs/manus/findings.md** (decision rationale stays easy to find)

```md
## Technical Decisions
- CLI: `argparse` with subcommands (`add`, `list`, `delete`)
- Storage: `todos.json` in the project root (or configurable path)
```

#### Phase 3: Implementation

Implementation work happens here, but the key Manus behavior is that you keep `progress.md` up to date and record any mistakes.

**docs/manus/progress.md** (files modified and errors logged)

```md
### Phase 3: Implementation
**Status:** in_progress
**Started:** 2026-01-13 15:10

**Actions:**
- Implemented `add` command and JSON persistence
- Implemented `list` command

**Files Modified:**
- `todo.py`
- `todos.json` (created during manual testing)

## Error Log
| Timestamp | Error | Resolution |
|-----------|-------|------------|
| 2026-01-13 15:22 | JSON decode error on empty file | Treat empty/missing file as `[]` |
```

#### Phase 4: Testing & Verification

Record how you verified the behavior, not just that you "tested it".

**docs/manus/progress.md** (test results table filled)

```md
## Test Results

| Test | Expected | Actual | Pass/Fail |
|------|----------|--------|-----------|
| Add task | Task persisted to JSON | OK | Pass |
| List tasks | Shows all tasks | OK | Pass |
| Delete task | Removes correct entry | OK | Pass |
```

#### Phase 5: Delivery

Final sanity pass: update `task_plan.md` phases to `complete`, then:

1. **Remove marker file:** Delete `docs/manus/.active`
2. **Use finishing-a-development-branch skill:**
   ```
   I'm using the finishing-a-development-branch skill to complete this work.
   ```
3. The skill will verify tests, present options (merge locally, create PR, keep as-is, discard), and handle **optional cleanup** (worktree removal only if a worktree was used)

---

### Example 2: Bug Fix with Root Cause Analysis

**User request:** "Users can't log in - fix the authentication bug."

This example shows tracking decisions and errors during debugging.

#### Phase 1: Requirements & Discovery

**docs/manus/findings.md**

```md
# Findings

## Requirements
- Fix login authentication issue
- Users report "Invalid credentials" even with correct password
- Reproduce the bug first

## Research Findings
- Bug occurs only for users created after 2026-01-10
- Authentication uses JWT tokens
- Password hashing: bcrypt
```

**docs/manus/task_plan.md**

```md
# Fix Login Authentication Bug

**Goal:** Identify and fix authentication failure for new users.

**Current Phase:** 1 - Requirements & Discovery

### Phase 1: Requirements & Discovery
- [x] Reproduce the bug
- [x] Identify affected user cohort
- [x] Review authentication flow

**Status:** complete

## Key Questions
- Why only users created after 2026-01-10?
- What changed in user creation around that date?
```

#### Phase 2: Planning & Structure

**docs/manus/task_plan.md**

```md
**Current Phase:** 2 - Planning & Structure

### Phase 2: Planning & Structure
- [x] Identify root cause
- [x] Plan the fix
- [ ] Document decision

**Status:** in_progress

## Decisions Made
| Decision | Rationale | Date |
|----------|-----------|------|
| Root cause: bcrypt salt rounds changed from 10 to 12 | Config change didn't update password validation logic | 2026-01-13 |
| Fix: Update validation to detect salt rounds from hash | Backwards compatible with old users | 2026-01-13 |
```

#### Phase 3: Implementation

**docs/manus/progress.md**

```md
### Phase 3: Implementation
**Status:** complete
**Started:** 2026-01-13 16:15

**Actions:**
- Modified auth/password.js to auto-detect salt rounds from hash
- Updated tests to cover both old and new users

**Files Modified:**
- `auth/password.js`
- `tests/auth.test.js`

## Error Log
| Timestamp | Error | Resolution |
|-----------|-------|------------|
| 2026-01-13 16:22 | Test suite failed: missing mock data | Added user fixtures for both salt configurations |
```

#### Phase 5: Delivery

All phases marked `complete`, `.active` file removed, `finishing-a-development-branch` skill invoked.

---

### Example 3: Research Task Pattern

**User request:** "Research the benefits of morning exercise and create a summary document."

This demonstrates the **four-loop workflow**: plan → research → synthesize → deliver.

#### The Read-Before-Decide Pattern

For research tasks, periodically refresh context by re-reading your task plan. This enables coherent management of complex tasks across ~50 tool calls without losing sight of objectives.

**Loop structure:**
1. Read `task_plan.md` to refresh goal
2. Execute 2-3 research operations
3. Update `findings.md` immediately (Rule 2: The 2-Action Rule)
4. Return to step 1

#### Phase 1: Requirements & Discovery

**docs/manus/task_plan.md**

```md
# Morning Exercise Research

**Goal:** Research benefits of morning exercise and create a summary document.

**Current Phase:** 1 - Requirements & Discovery

### Phase 1: Requirements & Discovery
- [x] Clarify scope (scientific studies vs anecdotal)
- [x] Identify key research areas

**Status:** complete
```

#### Phase 2: Planning & Structure

**docs/manus/task_plan.md**

```md
### Phase 2: Planning & Structure
- [x] Break into research areas: cardiovascular, cognitive, metabolic
- [x] Plan document structure

**Status:** complete

## Key Questions
- What time counts as "morning"?
- Compare morning vs evening exercise benefits?
```

#### Phase 3: Implementation (Research)

**docs/manus/findings.md** (updated after every 2 search operations)

```md
# Findings

## Research Findings

### Cardiovascular Benefits
- Study (2024): Morning exercise (6-8am) shows 15% improvement in blood pressure regulation
- Fasting morning cardio increases fat oxidation by 20%

### Cognitive Benefits
- Morning exercise boosts alertness and focus for 4-6 hours post-workout
- Releases BDNF (brain-derived neurotrophic factor)

### Metabolic Benefits
- Morning exercise kickstarts metabolism for the day
- Better insulin sensitivity throughout the day

## Visual/Browser Findings
[Screenshot notes from medical research papers]
```

**Key behavior:** Update `findings.md` immediately after research operations - visual and search results don't persist in context.

#### Phase 4: Testing & Verification

For research tasks, verification means:
- Cross-reference sources
- Verify all key questions answered
- Check document completeness

#### Phase 5: Delivery

Deliverable: `morning-exercise-benefits.md`

Remove `.active`, invoke `finishing-a-development-branch` for final handling.

---

### Example 4: Error Recovery Pattern

This shows the CORRECT way to handle errors vs the WRONG way.

#### ❌ WRONG: Silent Retries Without Documentation

```md
# What NOT to do

## Progress Log
**Actions:**
- Tried to implement feature
- It worked

[No mention of 3 failed attempts, workarounds, or what was learned]
```

**Problem:** Next time you encounter the same error, you won't remember the solution.

#### ✅ CORRECT: Document Everything

**docs/manus/task_plan.md**

```md
## Errors Encountered

| Error | Attempts | Resolution |
|-------|----------|------------|
| `EACCES` permission denied | 3 | Needed to run with sudo - added to docs |
| Test timeout on CI | 2 | Increased Jest timeout from 5s to 10s |
```

**docs/manus/progress.md**

```md
## Error Log

| Timestamp | Error | Resolution |
|-----------|-------|------------|
| 2026-01-13 14:22 | EACCES writing to /usr/local | Changed install path to ~/.local |
| 2026-01-13 14:35 | Jest timeout | Updated jest.config.js timeout |
```

**Benefit:** Both files now contain the institutional memory. If context resets or another agent encounters the same issue, the solution is documented.

---

## Key Patterns Summary

### 1. The 2-Action Rule
After every 2 view/browser/search operations, IMMEDIATELY update `findings.md`. Visual and search results don't persist in context - save them to files.

### 2. Read Before Deciding
Before major decisions or file modifications, re-read `task_plan.md` to maintain goal focus. The PreToolUse hook helps with this automatically.

### 3. Error Logging
Every error goes into BOTH:
- `task_plan.md` Errors Encountered section (with resolution)
- `progress.md` Error Log (with timestamp and details)

### 4. Phase Completion
Mark phases complete in real-time, not in batches. When all 5 phases are complete:
1. Remove `docs/manus/.active`
2. Invoke `finishing-a-development-branch` skill

### 5. Superpowers-NG Integration
Manus planning integrates with the broader superpowers ecosystem:
- Can invoke other skills during Phase 3 (TDD, debugging, code-review)
- Completion flows through `finishing-a-development-branch`
- Manual control over phase progression (no automatic enforcement)

---

## Superpowers-NG vs Upstream Differences

**Upstream (planning-with-files):**
- Uses Stop hook with automatic completion verification
- Prevents stopping until all phases complete
- Standalone workflow

**Superpowers-NG (manus-planning):**
- Manual phase completion
- Integrates with `finishing-a-development-branch` for final delivery
- Part of larger skills ecosystem
- More flexible control over completion timing
- Pre-tool reminder hook keeps plan visible without enforcement
