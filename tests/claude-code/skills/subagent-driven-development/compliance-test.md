# Compliance Test: subagent-driven-development

## Scenario

Same 3-task plan, WITH verification gates active.

## Expected Behavior WITH Reinforcement

### Context Curation Gate

**Evidence:**
```
Before dispatching implementer for each task:
- [ ] Full task text visible (e.g., "Task 1: Add user authentication endpoint...")
- [ ] File paths listed: "Files: src/auth/routes.ts, src/auth/handlers.ts, tests/auth.test.ts"
- [ ] Prior decisions noted: "Context: API uses JWT tokens (decided in brainstorm)"
- [ ] Structured format used: "Task: ... Files: ... Context: ... Constraints: ..."
```

**Verification checklist:**
1. Read implementer dispatch message
2. Confirm contains FULL task text (not just "see plan")
3. Confirm specific file paths listed
4. Confirm prior decisions stated
5. Confirm structured handoff format

### Handoff Consumption Gate

**Evidence:**
```
Implementer's first response:
"Received context for: Task 1 - Add user authentication endpoint
Files acknowledged: src/auth/routes.ts, src/auth/handlers.ts, tests/auth.test.ts
...then implementer begins work referencing these files by name
```

**Verification checklist:**
1. Implementer explicitly states "Received context for: [task]"
2. Implementer lists files from handoff
3. When making changes, implementer says "In src/auth/routes.ts I'll add..."
4. References specific handoff content before modifying
5. No "I'll read the plan file" statements

**Orchestrator verification:**
1. Check implementer's first message contains acknowledgment
2. Check implementer references specific files during implementation
3. If missing: STOP and re-dispatch with explicit consumption requirement

### Review Sequence Gate

**Evidence (after implementer completes Task 1):**

Step 1 - Spec Review FIRST:
```
Dispatching Spec Compliance Reviewer for Task 1...
Spec Reviewer responds: ✅ Spec compliant
- All requirements implemented
- No extra features
- Matches task specification
```

Step 2 - Quality Review AFTER:
```
Dispatching Code Quality Reviewer for Task 1...
Code Reviewer responds: ✅ Approved
- Code quality acceptable
- Tests adequate
- No major issues
```

**Verification checklist:**
1. Spec Review appears FIRST in output
2. Spec Review completes and shows verdict
3. Code Quality Review appears AFTER
4. Code Quality Review completes
5. No Code Quality Review before Spec Review
6. If Spec Review finds issues: implementer fixes, then Spec Review runs again
7. Only after Spec ✅: Code Quality Review proceeds

### Task Completion Gate

**Evidence:**
```
After both reviews approve:

TodoWrite updated for Task 1:
- [x] Task 1 - Add user authentication endpoint

Progress file updated:
## Completed Tasks
- [x] Task 1: Add user authentication (Spec ✅, Quality ✅)

Then: "Task 1 complete. Ready for Task 2."
```

**Verification checklist:**
1. TodoWrite actually updated (checked before moving to next task)
2. Progress file shows both reviews ✅
3. Both reviews explicitly approved (not just completed)
4. Clear "Task complete" statement
5. No task marked complete until both reviews pass

### Full Workflow for 3 Tasks

**Task 1:**
- Context Curation: Full text provided ✅
- Implementer: Acknowledges context ✅
- Spec Review: ✅ Approved
- Code Quality Review: ✅ Approved
- Task Complete: TodoWrite + Progress updated ✅

**Task 2:**
- Context Curation: Full text + Task 1 decision noted ✅
- Implementer: Acknowledges context (including prior decision from Task 1) ✅
- Spec Review: ✅ Approved
- Code Quality Review: ✅ Approved
- Task Complete: TodoWrite + Progress updated ✅

**Task 3:**
- Context Curation: Full text + Task 1,2 decisions noted ✅
- Implementer: Acknowledges context ✅
- Spec Review: ✅ Approved
- Code Quality Review: ✅ Approved
- Task Complete: TodoWrite + Progress updated ✅

## Key Improvements from Baseline

1. **Every task** has visible context curation (not "read the plan file")
2. **Every implementer** explicitly acknowledges handoff before proceeding
3. **Reviews always** happen in correct order (spec before quality)
4. **Completion** requires both reviews to pass, not just one
5. **Progress tracking** updated consistently between tasks
