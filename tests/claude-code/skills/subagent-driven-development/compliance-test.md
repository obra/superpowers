# Subagent-Driven Development Compliance Test

## Purpose
Verify agent follows subagent-driven-development skill correctly after implementation with verification gates in place.

## Test 1: Context Curation Gate Enforced

**Setup:** Create test implementation plan with 3 tasks.

**Input:**
```
Execute this implementation plan using /hyperpowers:execute-plan

Plan:
- Task 1: Create auth module (Task1.md exists in docs/plans/)
- Task 2: Add token validation (Task2.md exists in docs/plans/)
- Task 3: Implement refresh logic (Task3.md exists in docs/plans/)
```

**Expected:**
- Agent extracts FULL text of Task 1 (not "see Task1.md")
- Relevant file paths are included in handoff
- Prior decisions noted (if any from previous tasks)
- Structured format used: Task / Files / Context / Constraints

**Pass if:** Implementer receives complete context without needing to ask "where is the task text?"

## Test 2: Implementer Acknowledges Handoff

**Expected (during implementer dispatch):**
- Implementer's first response includes: "Received context for: [task name]"
- Implementer references specific files from handoff before modifying anything
- Orchestrator verifies acknowledgment appeared
- If missing, orchestrator STOPS and re-prompts with explicit consumption requirement

**Pass if:** Implementer acknowledges and references handoff, orchestrator verifies it.

## Test 3: Spec Compliance Review First

**Setup:** Implementer completes Task 1, commits, self-reviews.

**Expected:**
- Spec Compliance Reviewer dispatched FIRST
- Spec reviewer checks: does code match spec requirements?
- If spec reviewer approves, THEN Code Quality Reviewer dispatched
- Code quality reviewer DOES NOT run before spec approval

**Pass if:** Spec compliance review happens first, code quality happens second.

## Test 4: Code Quality Review After Spec Passes

**Expected:**
- Code Quality Reviewer only dispatches after Spec Reviewer approves
- If spec review found issues, implementer fixes FIRST
- Spec reviewer re-reviews fixes
- Only after spec re-review passes does code quality run

**Pass if:** Code quality review never runs before spec compliance is approved.

## Test 5: Task Completion Only After Both Reviews

**Expected:**
- After both reviews approve, TodoWrite updated with task marked complete
- Progress file updated with task status
- If EITHER review has open issues, task NOT marked complete
- If attempting to move to next task early, gate catches it

**Pass if:** Task only marked complete after both reviews approved.

## Test 6: Review Loop on Issues

**Setup:** Spec reviewer finds issues (e.g., missing error handling).

**Expected:**
- Implementer (same subagent) receives issue description
- Implementer fixes the issues
- Spec Reviewer dispatched AGAIN to verify fixes
- Only after re-review passes, code quality review runs

**Pass if:** Issues are fixed and re-reviewed (not accepted as-is).

## Test 7: Multiple Tasks Sequence

**Expected:**
- Task 1 complete (both reviews pass) → TodoWrite updated
- Task 2 execution begins with fresh subagent
- Task 2 context includes relevant decisions from Task 1
- Task 2 follows same review sequence
- Task 3 proceeds after Task 2 complete

**Pass if:** All tasks follow correct sequence with proper handoff between them.

## Running Tests

```bash
# Create test plan
mkdir -p docs/plans
cat > docs/plans/test-3task-plan.md << 'EOF'
# Test Implementation Plan

## Task 1: Setup database connection

### Files
- src/db.ts
- src/config.ts

### Steps
1. Create database connection pool
2. Export connection instance
3. Write tests for connection

### Expected Output
- Tests passing
- Connection established on app startup

---

## Task 2: Add authentication middleware

### Files
- src/middleware/auth.ts
- src/types/auth.ts

### Steps
1. Create auth middleware
2. Add token validation
3. Write tests for middleware

### Expected Output
- Middleware validates tokens
- Tests passing

---

## Task 3: Create auth API endpoints

### Files
- src/routes/auth.ts
- tests/routes/auth.test.ts

### Steps
1. Create login endpoint
2. Create logout endpoint
3. Write tests

### Expected Output
- Endpoints functional
- Tests passing
EOF

# Run compliance test
./tests/claude-code/run-skill-tests.sh --skill subagent-driven-development
```

## Verification Checklist

- [ ] Context Curation Gate: Full task text provided, not file path
- [ ] Handoff Consumption Gate: Implementer acknowledged and referenced handoff
- [ ] Review Sequence Gate: Spec compliance review happened FIRST
- [ ] Review Sequence Gate: Code quality review happened AFTER spec passed
- [ ] Task Completion Gate: Task marked complete only after both reviews
- [ ] Review Loop: Issues were fixed and re-reviewed (not bypassed)
- [ ] Multiple Tasks: Each task followed same sequence
- [ ] No context pollution: Each task got fresh subagent with only needed context
