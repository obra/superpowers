---
name: one-shot-development
description: Use when you have a comprehensive, well-researched plan ready for execution without oversight during task implementation
allowed-tools: Bash, Read, Grep, Glob, Write, Edit, AskUserQuestion
user-invocable: false
---

# One-Shot Development

Execute all plan tasks sequentially without human checkpoints, then run build and test phases with fix loops.

**Core principle:** Trust the plan. Execute everything, validate at the end.

**Warning:** This mode is NOT recommended for most use cases. Use only when:
- The plan is well-tested and unambiguous
- You trust the agent to execute without oversight
- You want minimal interaction during implementation

<requirements>
## Requirements

1. Execute all tasks without human checkpoints. Pausing defeats one-shot purpose.
2. Run build phase with fix loops (max 3 cycles). Unlimited loops risk infinite execution.
3. Ask user before proceeding to test phase. Build success is a natural checkpoint.
4. Invoke finishing-a-development-branch at completion. Standard completion pattern.
</requirements>

## When to Use

**Use this skill when:**
- Plan is comprehensive with exact file paths and complete code
- Tasks are independent enough that mid-flight adjustments aren't needed
- You want to "fire and forget" and review only at build/test phase
- Plan has been validated through research and assumption checking

**Don't use when:**
- Plan has vague tasks ("add validation", "improve error handling")
- Tasks have complex interdependencies that might need runtime adjustment
- This is exploratory work where you expect to change direction
- You want human oversight during implementation

## Arguments

- Plan path: First argument (e.g., `docs/hyperpowers/plans/feature.md`)

## The Process

```dot
digraph process {
    rankdir=TB;

    "Load Plan" [shape=box];
    "Phase 1: Pre-Execution Setup" [shape=box style=filled fillcolor=lightyellow];
    "Phase 2: Implementation (all tasks)" [shape=box];
    "Phase 3: Build Phase" [shape=box style=filled fillcolor=lightyellow];
    "Build passes?" [shape=diamond];
    "Fix build issues" [shape=box];
    "Fix cycles < 3?" [shape=diamond];
    "Escalate to user" [shape=box style=filled fillcolor=lightcoral];
    "Phase 4: Build→Test Checkpoint" [shape=box style=filled fillcolor=lightgreen];
    "User continues?" [shape=diamond];
    "Phase 5: Test Phase" [shape=box style=filled fillcolor=lightyellow];
    "Tests pass?" [shape=diamond];
    "Fix test issues" [shape=box];
    "Test fix cycles < 3?" [shape=diamond];
    "Escalate to user (tests)" [shape=box style=filled fillcolor=lightcoral];
    "Phase 6: Completion" [shape=box style=filled fillcolor=lightgreen];

    "Load Plan" -> "Phase 1: Pre-Execution Setup";
    "Phase 1: Pre-Execution Setup" -> "Phase 2: Implementation (all tasks)";
    "Phase 2: Implementation (all tasks)" -> "Phase 3: Build Phase";
    "Phase 3: Build Phase" -> "Build passes?";
    "Build passes?" -> "Phase 4: Build→Test Checkpoint" [label="yes"];
    "Build passes?" -> "Fix build issues" [label="no"];
    "Fix build issues" -> "Fix cycles < 3?";
    "Fix cycles < 3?" -> "Phase 3: Build Phase" [label="yes"];
    "Fix cycles < 3?" -> "Escalate to user" [label="no"];
    "Escalate to user" -> "Phase 4: Build→Test Checkpoint";
    "Phase 4: Build→Test Checkpoint" -> "User continues?";
    "User continues?" -> "Phase 5: Test Phase" [label="continue"];
    "User continues?" -> "Phase 6: Completion" [label="stop"];
    "Phase 5: Test Phase" -> "Tests pass?";
    "Tests pass?" -> "Phase 6: Completion" [label="yes"];
    "Tests pass?" -> "Fix test issues" [label="no"];
    "Fix test issues" -> "Test fix cycles < 3?";
    "Test fix cycles < 3?" -> "Phase 5: Test Phase" [label="yes"];
    "Test fix cycles < 3?" -> "Escalate to user (tests)" [label="no"];
    "Escalate to user (tests)" -> "Phase 6: Completion";
}
```

## Phase 1: Pre-Execution Setup

Same as other execution modes. Present offers before task loop begins.

<verification>
### Pre-Execution Verification

Before starting implementation:

- [ ] On base branch? If yes, present Branch Creation Offer
- [ ] Primary issue exists? If yes, present Status Update Offer

User can decline any offer - the requirement is presentation, not execution.
</verification>

### Branch Creation Offer (if on base branch)

Check if on main/master/develop:
```bash
git branch --show-current
```

If on base branch:
```
AskUserQuestion(
  questions: [{
    question: "Create feature branch for this work?",
    header: "Branch",
    options: [
      {label: "Yes", description: "Create branch: feature/<plan-name>"},
      {label: "Skip", description: "Stay on current branch"}
    ],
    multiSelect: false
  }]
)
```

### Status Update Offer (if issue tracked)

If primary issue identified (from plan header or branch name):
```
AskUserQuestion(
  questions: [{
    question: "Update issue [ISSUE-ID] status to in-progress?",
    header: "Status",
    options: [
      {label: "Yes", description: "Mark issue [ISSUE-ID] as in-progress"},
      {label: "Skip", description: "Leave status unchanged"}
    ],
    multiSelect: false
  }]
)
```

After offers complete (or skipped), proceed to Phase 2.

## Phase 2: Implementation (No Checkpoints)

**Purpose:** Execute ALL tasks from the plan sequentially without pausing for human input.

### Execution Flow

1. Load plan from argument path
2. For each task in plan:
   - Show progress: "**Implementing Task N/M:** [task title]"
   - Execute task following plan specifications exactly
   - Update progress file after each task
   - **Do NOT pause for user feedback**
3. When all tasks complete, proceed to Phase 3

### What the Main Agent Does

- Follow plan specifications exactly (this is one-shot, not exploratory)
- Write code directly (no subagent dispatch)
- Note discovered work in progress file (do not act on it mid-flight)
- Show brief progress output after each task

### What the Main Agent Does NOT Do

- Pause for human checkpoints (defeats one-shot purpose)
- Dispatch implementation subagents (preserves context)
- Run build/tests mid-flight (validation is Phase 3+)
- Ask for feedback before all tasks complete

### Progress Tracking

Update `docs/hyperpowers/current-progress.md` after each task:

```markdown
# One-Shot Development Progress

## Plan
docs/hyperpowers/plans/feature-plan.md

## Mode
One-Shot (no checkpoints)

## Status
Implementing Task 4/10

## Completed Tasks
- [x] Task 1: Setup project structure
- [x] Task 2: Add base API client
- [x] Task 3: Add error handling

## Remaining Tasks
- [ ] Task 4: Add retry logic ← in progress
- [ ] Task 5: Add rate limiting
...

## Discovered Work
- [ ] "Need timeout configuration" (discovered in Task 3)
```

<verification>
**Implementation Completion Gate** (Required):

- [ ] All plan tasks executed (none skipped)
- [ ] Progress file shows all tasks marked [x]
- [ ] Discovered work appended (if any found)

**STOP CONDITION:** If ANY unchecked, do NOT proceed. Complete all tasks before proceeding to Phase 3.
</verification>

## Phase 3: Build Phase

**Purpose:** Validate that all implemented code compiles/builds successfully.

### Build System Detection

Detect build command from project manifests (in priority order):

| Manifest File | Build Command |
|--------------|---------------|
| `package.json` (with `scripts.build`) | `npm run build` |
| `Cargo.toml` | `cargo build` |
| `pyproject.toml` | `python -m build` |
| `Makefile` | `make` |
| `go.mod` | `go build ./...` |

If no manifest found:
```
AskUserQuestion(
  questions: [{
    question: "No build system detected. What build command should I use?",
    header: "Build",
    options: [
      {label: "Skip build", description: "No build needed for this project"},
      {label: "Custom command", description: "I'll provide a build command"}
    ],
    multiSelect: false
  }]
)
```

### Build Loop

```
fix_cycles = 0
MAX_CYCLES = 3

while fix_cycles < MAX_CYCLES:
    run build command

    if build succeeds:
        proceed to Phase 4
        break

    if build fails:
        analyze error output
        apply targeted fix
        fix_cycles += 1

if fix_cycles >= MAX_CYCLES:
    escalate to user
```

### 3-Strike Escalation (Build)

After 3 failed fix cycles:

```
AskUserQuestion(
  questions: [{
    question: "Build failed after 3 fix attempts. How do you want to proceed?",
    header: "Escalate",
    options: [
      {label: "Continue trying", description: "Reset counter and try more fixes"},
      {label: "Skip build", description: "Proceed to checkpoint without passing build"},
      {label: "Stop", description: "Pause execution, I'll investigate"}
    ],
    multiSelect: false
  }]
)
```

<verification>
**Build Phase Gate** (Required):

- [ ] Build command identified (or user confirmed skip)
- [ ] Build passes OR user approved skip after escalation
- [ ] Fix cycles documented (show count)

**STOP CONDITION:** If ANY unchecked, do NOT proceed. Do not proceed to checkpoint with failing build unless user explicitly approved via escalation.
</verification>

## Phase 4: Build→Test Checkpoint

**Purpose:** The ONLY human checkpoint in one-shot mode. User decides whether to run tests.

This is the natural pause point between build and test phases. All implementation is complete, build passes, user can review before testing.

### Checkpoint Presentation

Display implementation summary:

```
## One-Shot Implementation Complete

**Tasks Completed:** N/N
**Build Status:** ✓ Passed (X fix cycles used)

**Summary of Changes:**
- [brief summary of what was implemented]

**Discovered Work (for later):**
- [list any discovered work items]
```

### User Decision

```
AskUserQuestion(
  questions: [{
    question: "Build successful. How would you like to proceed?",
    header: "Continue",
    options: [
      {label: "Run tests", description: "Continue to test phase with fix loops"},
      {label: "Review first", description: "Pause here so I can review the changes"},
      {label: "Stop here", description: "Skip tests, proceed to completion"}
    ],
    multiSelect: false
  }]
)
```

### Response Handling

- **Run tests:** Proceed to Phase 5
- **Review first:** Pause and wait for user to return with feedback or "continue"
- **Stop here:** Skip Phase 5, proceed directly to Phase 6 (Completion)

<verification>
**Checkpoint Gate** (Required):

- [ ] Used AskUserQuestion (not plain text)
- [ ] Waited for explicit user response
- [ ] Routed to correct next phase based on selection

**STOP CONDITION:** If ANY unchecked, do NOT proceed. Never proceed to tests without explicit user approval via AskUserQuestion.
</verification>

## Phase 5: Test Phase

**Purpose:** Run tests with fix loops to ensure code works correctly.

### Test Command Detection

Detect test command from project manifests (in priority order):

| Manifest File | Test Command |
|--------------|--------------|
| `package.json` (with `scripts.test`) | `npm test` |
| `Cargo.toml` | `cargo test` |
| `pyproject.toml` | `pytest` |
| `Makefile` (with `test` target) | `make test` |
| `go.mod` | `go test ./...` |

If no test command found:
```
AskUserQuestion(
  questions: [{
    question: "No test command detected. What test command should I use?",
    header: "Test",
    options: [
      {label: "Skip tests", description: "No tests to run for this project"},
      {label: "Custom command", description: "I'll provide a test command"}
    ],
    multiSelect: false
  }]
)
```

### Test Loop

```
fix_cycles = 0
MAX_CYCLES = 3

while fix_cycles < MAX_CYCLES:
    run test command

    if all tests pass:
        proceed to Phase 6
        break

    if tests fail:
        analyze failure output
        identify failing tests
        apply targeted fix
        fix_cycles += 1

if fix_cycles >= MAX_CYCLES:
    escalate to user
```

### Failure Analysis

When tests fail, categorize the failure:

| Pattern | Likely Cause | Fix Approach |
|---------|--------------|--------------|
| Same test fails repeatedly | Implementation doesn't address root cause | Re-analyze test expectation |
| Different tests fail each cycle | Architectural issue | Flag and escalate immediately |
| Import/module errors | Missing dependency or path | Check imports and dependencies |
| Assertion errors | Logic bug in implementation | Review test case and fix logic |

### 3-Strike Escalation (Tests)

After 3 failed fix cycles:

```
AskUserQuestion(
  questions: [{
    question: "Tests failed after 3 fix attempts. How do you want to proceed?",
    header: "Escalate",
    options: [
      {label: "Continue trying", description: "Reset counter and try more fixes"},
      {label: "Skip tests", description: "Proceed to completion with failing tests"},
      {label: "Stop", description: "Pause execution, I'll investigate"}
    ],
    multiSelect: false
  }]
)
```

<verification>
**Test Phase Gate** (Required):

- [ ] Test command identified (or user confirmed skip)
- [ ] Tests pass OR user approved skip after escalation
- [ ] Fix cycles documented (show count)

**STOP CONDITION:** If ANY unchecked, do NOT proceed. Do not proceed to completion with failing tests unless user explicitly approved via escalation.
</verification>

## Phase 6: Completion

**Purpose:** Verify completion and hand off to finishing skill.

### Step 1: Final Verification

Use `hyperpowers:verification-before-completion`:
- Evidence-based completion checklist
- Discovered work offers
- Original issue update offer

### Step 2: Cleanup Transient Files

```bash
rm -f docs/hyperpowers/current-progress.md
```

Note: This file is gitignored. Only cleanup AFTER verification passes.

### Step 3: Finish

Use `hyperpowers:finishing-a-development-branch` skill:
- Offers 4 completion options (merge, PR, keep, discard)
- Issue close offer (if primary issue tracked)
- Worktree cleanup offer (if in worktree)

## Red Flags

| Violation | Why It's Critical | Recovery |
|-----------|-------------------|----------|
| Pausing mid-implementation for feedback | Defeats one-shot purpose | Continue to completion, pause only at Phase 4 |
| > 3 fix cycles without escalation | Risk of infinite loops | Escalate to user after 3 cycles |
| Skipping build phase entirely | Ships potentially broken code | Run build or get explicit user skip |
| Plain text questions instead of AskUserQuestion | User can't respond via structured UI | Use AskUserQuestion tool |
| Proceeding to tests without user approval | Violates single-checkpoint contract | Wait for Phase 4 response |
| Different tests failing each fix cycle | Indicates architectural issue | Escalate immediately, don't count as normal fix |
| Cleaning up progress file before verification | Loses debugging context | Keep until verification-before-completion passes |

## Integration

**Required workflow skills:**
- **hyperpowers:verification-before-completion** - Final evidence-based verification
- **hyperpowers:finishing-a-development-branch** - Complete development after all tasks

**No prompt templates needed:** One-shot executes directly without subagents.

<requirements>
## Requirements Reminder

1. Execute all tasks without human checkpoints.
2. Run build phase with fix loops (max 3 cycles).
3. Ask user before proceeding to test phase.
4. Invoke finishing-a-development-branch at completion.
</requirements>
