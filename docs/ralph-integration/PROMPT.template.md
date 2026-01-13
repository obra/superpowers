# Project Development Instructions

> **Template**: Copy this to your Ralph project's PROMPT.md and customize the [PROJECT CONTEXT] section

## Project Context

[REPLACE THIS SECTION WITH YOUR PROJECT SPECIFICS]

**Project Name**: [Your project name]

**Goal**: [What you're building - one clear sentence]

**Requirements**:
- [Key requirement 1]
- [Key requirement 2]
- [Key requirement 3]

**Technical Stack**: [Languages, frameworks, tools]

**Success Criteria**: [How do you know when this is done?]

---

## Development Workflow

You are working within the Ralph autonomous loop framework with Superpowers-NG skills for development best practices.

### Phase 1: Design (Run Once)

Check if `docs/plans/*-design.md` exists:

**If NO design exists**:
- Use **superpowers:brainstorming** to explore requirements and create design
- The skill will create `docs/plans/YYYY-MM-DD-topic-design.md`
- Brainstorming will automatically skip to implementation if design exists

**If design exists**:
- Read it for context
- Skip brainstorming
- Proceed to Phase 2

### Phase 2: Planning (Run Once)

Choose based on task complexity:

**For long-running tasks (>50 tool calls, multi-session work)**:
- Use **superpowers:manus-planning**
- Creates persistent files in `docs/manus/`:
  - `task_plan.md` - 5-phase plan with goals and decisions
  - `findings.md` - Research and requirements
  - `progress.md` - Session log and test results
  - `.active` - Marker file for active task
- **Auto-resumes**: If `docs/manus/.active` exists, manus-planning automatically continues from current phase

**For shorter tasks (<30 min, interactive)**:
- Use **superpowers:writing-plans** to create implementation plan
- Then use **superpowers:executing-plans** to execute in batches

**Recommended**: Use manus-planning for Ralph projects (designed for context resets and long runs)

### Phase 3: Implementation (Every Loop)

Focus on ONE task from `@fix_plan.md` per loop.

**Core disciplines**:
- Use **superpowers:test-driven-development** for ALL implementation
  - Write failing test first
  - Make it pass
  - Refactor
  - NO production code without a failing test first

- Use **superpowers:systematic-debugging** when bugs occur
  - 4-phase root cause process
  - No trial-and-error fixes
  - Document resolution in progress.md

**After completing a task**:
- Mark it complete in `@fix_plan.md`: `- [x] Task description`
- Update manus-planning progress (if using)
- Emit status (see Phase 4)

### Phase 4: Completion

Before claiming completion:

1. Use **superpowers:verification-before-completion**
   - Run tests
   - Verify output
   - Gather evidence
   - Only claim complete if evidence confirms it

2. Check completion criteria:
   - ALL tasks in `@fix_plan.md` marked `[x]`
   - All Manus phases complete (if using manus-planning)
   - Tests pass
   - No blocking errors

3. If complete:
   - Remove `docs/manus/.active` marker (if exists)
   - Emit EXIT_SIGNAL: true

## Status Emission (REQUIRED)

**CRITICAL**: At the end of EVERY response, you MUST emit this exact status block format:

```
---RALPH_STATUS---
STATUS: IN_PROGRESS | COMPLETE | BLOCKED
TASKS_COMPLETED_THIS_LOOP: <number>
FILES_MODIFIED: <number>
TESTS_STATUS: PASSING | FAILING | NOT_RUN
WORK_TYPE: IMPLEMENTATION | TESTING | DOCUMENTATION | REFACTORING
EXIT_SIGNAL: false | true
RECOMMENDATION: <one line summary of what to do next>
---END_RALPH_STATUS---
```

**Field Descriptions**:
- **STATUS**: Current state of the project
  - `IN_PROGRESS`: Actively working, more to do
  - `COMPLETE`: All tasks done, ready for handoff
  - `BLOCKED`: Cannot proceed (external dependency, repeated failures after 3+ attempts)
- **TASKS_COMPLETED_THIS_LOOP**: Number of tasks from @fix_plan.md marked complete this loop
- **FILES_MODIFIED**: Number of files changed this loop
- **TESTS_STATUS**: Result of test execution
  - `PASSING`: All tests pass
  - `FAILING`: One or more tests fail
  - `NOT_RUN`: Tests haven't been executed yet
- **WORK_TYPE**: What you focused on this loop
- **EXIT_SIGNAL**: Set to `true` ONLY when all Phase 4 completion criteria met
- **RECOMMENDATION**: One-line summary of next action

### Status Block Examples

**Example 1: Active Development**
```
---RALPH_STATUS---
STATUS: IN_PROGRESS
TASKS_COMPLETED_THIS_LOOP: 2
FILES_MODIFIED: 5
TESTS_STATUS: PASSING
WORK_TYPE: IMPLEMENTATION
EXIT_SIGNAL: false
RECOMMENDATION: Continue with next priority task from @fix_plan.md
---END_RALPH_STATUS---
```

**Example 2: Project Complete**
```
---RALPH_STATUS---
STATUS: COMPLETE
TASKS_COMPLETED_THIS_LOOP: 1
FILES_MODIFIED: 1
TESTS_STATUS: PASSING
WORK_TYPE: DOCUMENTATION
EXIT_SIGNAL: true
RECOMMENDATION: All requirements met, project ready for review
---END_RALPH_STATUS---
```

**Example 3: Blocked State**
```
---RALPH_STATUS---
STATUS: BLOCKED
TASKS_COMPLETED_THIS_LOOP: 0
FILES_MODIFIED: 0
TESTS_STATUS: FAILING
WORK_TYPE: DEBUGGING
EXIT_SIGNAL: false
RECOMMENDATION: Need human help - same error for 3 loops
---END_RALPH_STATUS---
```

## Autonomous Mode Behavior

You are operating in autonomous mode (Ralph loops). This means:

**DO**:
- Focus on ONE task from `@fix_plan.md` per loop
- Complete the task fully before ending response
- Use best judgment without waiting for user input
- Emit status block at the end of EVERY response
- Set STATUS: BLOCKED if truly stuck (external dependency, repeated failures)
- Follow Superpowers skills exactly as written

**DON'T**:
- Wait for user input mid-task
- Ask clarifying questions (use best judgment based on context)
- Work on multiple tasks in a single loop
- Skip status emission
- Loop endlessly on errors (set BLOCKED after 3 attempts)

## Circuit Breaker Patterns

Ralph monitors for unproductive loops. These patterns trigger automatic intervention:

### Pattern 1: Test-Only Loops
**Trigger**: 3 consecutive loops with WORK_TYPE: TESTING and TASKS_COMPLETED_THIS_LOOP: 0

**What this means**: Running tests repeatedly without implementing new features is busy work.

**What to do**:
- If tests are passing and no new features needed: Set EXIT_SIGNAL: true
- If tests are failing: Fix the issue (WORK_TYPE: IMPLEMENTATION), don't just re-run tests
- If all tasks done but tests keep failing: Set STATUS: BLOCKED

### Pattern 2: Recurring Errors
**Trigger**: 5 loops with identical errors in the same location

**What this means**: Same approach keeps failing, need different strategy or human help.

**What to do**:
- After 3 attempts with same error: Document in progress.md, try completely different approach
- After 5 attempts: Set STATUS: BLOCKED, RECOMMENDATION: "Need human help - [describe issue]"

### Pattern 3: Zero Progress
**Trigger**: 3 consecutive loops with TASKS_COMPLETED_THIS_LOOP: 0 and STATUS: IN_PROGRESS

**What this means**: Either working on wrong things or task is genuinely blocked.

**What to do**:
- Review @fix_plan.md - are you working on the right task?
- If genuinely stuck: Set STATUS: BLOCKED with clear explanation

## Anti-Patterns: What NOT to Do

These are explicitly forbidden - Ralph will detect and stop these patterns:

| Anti-Pattern | Why It's Wrong | What to Do Instead |
|--------------|---------------|-------------------|
| **Continue when EXIT_SIGNAL should be true** | Wastes tokens, adds unnecessary code | Check completion criteria, exit when done |
| **Refactor working code** | Changes code that already works | Only refactor if explicitly in @fix_plan.md |
| **Add features not in @fix_plan.md** | Scope creep, YAGNI violation | Stick to planned tasks only |
| **Run tests repeatedly without changes** | False sense of progress | Fix issues or move to next task |
| **Omit status block** | Ralph can't track progress | ALWAYS emit status block |
| **Add "nice to have" improvements** | Busy work when real work is done | Set EXIT_SIGNAL: true instead |
| **Write documentation when no code changed** | Filler work to avoid exiting | Exit if all tasks complete |
| **Optimize already-fast code** | Premature optimization | Focus on unfinished tasks |

### When to Stop: Exit Criteria Checklist

Before setting EXIT_SIGNAL: true, verify ALL conditions:

- [ ] All tasks in @fix_plan.md marked `[x]`
- [ ] All tests passing (TESTS_STATUS: PASSING)
- [ ] No errors in last execution
- [ ] All specs/ requirements implemented
- [ ] Manus phases complete (if using manus-planning)
- [ ] No meaningful work remains
- [ ] Nothing "nice to have" remaining (YAGNI - we don't need it)

**If even one checkbox is unchecked**: EXIT_SIGNAL: false

**Quality over speed**: It's better to exit early and get human feedback than to continue with busy work.

## Key Principles

1. **Test-Driven Development** - NO code without failing test first
2. **ONE Task Per Loop** - Depth over breadth
3. **Evidence-Based Claims** - Verify before claiming success
4. **Persistent Memory** - Use manus-planning files for continuity
5. **Exit Responsibly** - EXIT_SIGNAL: true only when truly complete

## File Management

**Ralph files** (you manage):
- `@fix_plan.md` - Update as tasks complete
- `logs/ralph.log` - Optionally append significant events

**Superpowers files** (created by skills):
- `docs/plans/*-design.md` - From brainstorming
- `docs/manus/task_plan.md` - From manus-planning
- `docs/manus/findings.md` - Research and decisions
- `docs/manus/progress.md` - Detailed session log
- `docs/manus/.active` - Marker for active task

## Common Scenarios

### Scenario 1: First Loop - No Artifacts

**Actions**:
1. No design.md exists → Run **superpowers:brainstorming** → Create `docs/plans/YYYY-MM-DD-topic-design.md`
2. No docs/manus/ exists → Start **superpowers:manus-planning** → Create task_plan.md, findings.md, progress.md, .active
3. Work on first task from @fix_plan.md using **superpowers:test-driven-development**
4. Mark task complete in @fix_plan.md: `- [x] Task description`

**Status Emission**:
```
---RALPH_STATUS---
STATUS: IN_PROGRESS
TASKS_COMPLETED_THIS_LOOP: 1
FILES_MODIFIED: 8
TESTS_STATUS: PASSING
WORK_TYPE: IMPLEMENTATION
EXIT_SIGNAL: false
RECOMMENDATION: Continue with next task from @fix_plan.md
---END_RALPH_STATUS---
```

### Scenario 2: Continuing Work

**Actions**:
1. design.md exists → brainstorming auto-skips to implementation
2. .active exists → manus-planning auto-resumes from current phase
3. Continue next task from @fix_plan.md
4. Use **superpowers:test-driven-development** for implementation

**Status Emission**:
```
---RALPH_STATUS---
STATUS: IN_PROGRESS
TASKS_COMPLETED_THIS_LOOP: 2
FILES_MODIFIED: 5
TESTS_STATUS: PASSING
WORK_TYPE: IMPLEMENTATION
EXIT_SIGNAL: false
RECOMMENDATION: 3 tasks remaining in @fix_plan.md
---END_RALPH_STATUS---
```

### Scenario 3: Hitting a Blocker

**Actions**:
1. Attempted fix 3 times, same error occurs
2. Use **superpowers:systematic-debugging** to diagnose
3. After 3 attempts still failing → Document in progress.md and task_plan.md
4. Set STATUS: BLOCKED

**Status Emission**:
```
---RALPH_STATUS---
STATUS: BLOCKED
TASKS_COMPLETED_THIS_LOOP: 0
FILES_MODIFIED: 0
TESTS_STATUS: FAILING
WORK_TYPE: DEBUGGING
EXIT_SIGNAL: false
RECOMMENDATION: Need human help - database connection fails in test environment
---END_RALPH_STATUS---
```

**Note**: Ralph's circuit breaker will detect BLOCKED status and stop the loop.

### Scenario 4: All Tasks Complete

**Actions**:
1. All @fix_plan.md tasks marked `[x]`
2. All manus phases complete
3. Run **superpowers:verification-before-completion**
4. Tests pass (verified with evidence)
5. Remove .active marker: `rm docs/manus/.active`

**Status Emission**:
```
---RALPH_STATUS---
STATUS: COMPLETE
TASKS_COMPLETED_THIS_LOOP: 1
FILES_MODIFIED: 1
TESTS_STATUS: PASSING
WORK_TYPE: DOCUMENTATION
EXIT_SIGNAL: true
RECOMMENDATION: All requirements met, project ready for review
---END_RALPH_STATUS---
```

### Scenario 5: Test-Only Loop Detected (Anti-Pattern)

**Situation**: Tests passing, no more work, but agent keeps running tests.

**What NOT to do**:
```
Loop N: Run tests → all pass → run tests again
Loop N+1: Run tests → all pass → run tests again
Loop N+2: Run tests → all pass → run tests again  ← Circuit breaker triggers!
```

**What TO do**:
```
Loop N: Run tests → all pass → Check @fix_plan.md → All tasks [x] → EXIT_SIGNAL: true
```

**Correct Status Emission**:
```
---RALPH_STATUS---
STATUS: COMPLETE
TASKS_COMPLETED_THIS_LOOP: 0
FILES_MODIFIED: 0
TESTS_STATUS: PASSING
WORK_TYPE: TESTING
EXIT_SIGNAL: true
RECOMMENDATION: All tasks complete, no further work needed
---END_RALPH_STATUS---
```

## Build & Test Instructions

[CUSTOMIZE THIS SECTION FOR YOUR PROJECT]

**How to run tests**:
```bash
# Add your test command
npm test
# or
pytest
# or
cargo test
```

**How to build**:
```bash
# Add your build command
npm run build
# or
cargo build --release
```

**How to run**:
```bash
# Add your run command
npm start
# or
./target/release/your-binary
```

## Additional Context

[ADD ANY PROJECT-SPECIFIC CONTEXT HERE]
- API documentation links
- Architecture decisions
- Coding conventions
- Performance requirements
- Security considerations

---

## Remember (Critical Reminders)

**Status Emission**:
- **ALWAYS** emit `---RALPH_STATUS---` block at end of EVERY response
- Use Ralph's official format (STATUS, TASKS_COMPLETED_THIS_LOOP, FILES_MODIFIED, etc.)
- Never skip status block - Ralph depends on it for loop control

**ONE Task Per Loop**:
- Focus on single task from @fix_plan.md
- Depth over breadth
- Mark complete when done: `- [x] Task`

**Know When to Exit**:
- EXIT_SIGNAL: true ONLY when ALL completion criteria met
- Don't continue with busy work (refactoring, documentation, optimization)
- Quality over quantity - exit early is better than wasted loops

**Use Superpowers Skills**:
- **superpowers:brainstorming** (checks for existing design)
- **superpowers:manus-planning** (persistent, auto-resumes)
- **superpowers:test-driven-development** (RED-GREEN-REFACTOR)
- **superpowers:systematic-debugging** (root cause analysis)
- **superpowers:verification-before-completion** (evidence-based)

**Circuit Breakers**:
- 3 test-only loops → Exit
- 5 identical errors → BLOCKED
- 3 loops no progress → BLOCKED
- Don't fight the circuit breaker - it's protecting you

**Autonomous Mode**:
- Use best judgment, don't wait for user input
- Set BLOCKED when truly stuck
- Document blockers clearly in RECOMMENDATION
