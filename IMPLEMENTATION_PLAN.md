# Ralph Skill Testing Implementation Plan

> **Related Issues:** hyperpowers-dvi
> **Primary Issue:** hyperpowers-dvi (Reinforce all skills with verification checkpoints)

**Goal:** Reinforce 13 skills with verification checkpoints, validate all 16 skills (excluding ralph) through end-to-end testing with baseline comparison.

**Architecture:** Three-phase approach:
1. Phase 0: Capture baseline behavior (current state before modifications)
2. Phase 1: Reinforce skills with verification gates in a git worktree
3. Phase 2: Test reinforcements with reviewer agent pattern, compare to baselines

**Tech Stack:** Bash (tests), Markdown (skills), Next.js + Vitest (example project)

**Context Gathered From:**

- `docs/research/2026-01-13-ralph-skill-testing.md`
- `docs/designs/2026-01-13-ralph-skill-testing-design.md`

---

## Phase 0: Baseline Capture

- [ ] Task 0: Capture baseline behavior for all 16 skills

## Phase 1: Skill Reinforcement

- [ ] Task 1: Create git worktree for Phase 1 work
- [ ] Task 2: Add verification gates to brainstorming skill
- [ ] Task 3: Add verification gates to compound skill
- [ ] Task 4: Add verification gates to dispatching-parallel-agents skill
- [ ] Task 5: Add verification gates to using-hyperpowers skill
- [ ] Task 6: Add verification gates to feedback skill
- [ ] Task 7: Add verification gates to finishing-a-development-branch skill
- [ ] Task 8: Add verification gates to receiving-code-review skill
- [ ] Task 9: Add verification gates to requesting-code-review skill (+ handoff consumption)
- [ ] Task 10: Add verification gates to subagent-driven-development skill (+ handoff consumption)
- [ ] Task 11: Add verification gates to using-git-worktrees skill
- [ ] Task 12: Add verification gates to writing-skills skill
- [ ] Task 13: Add verification gates to writing-plans skill (+ handoff consumption)
- [ ] Task 14: Add handoff consumption gates to research skill
- [ ] Task 15: Create test runner script for skill verification
- [ ] Task 16: Merge worktree to main

## Phase 2: Validation Testing (COMPULSORY)

- [ ] Task 17: Create Next.js example project for testing
- [ ] Task 17.5: Create Reviewer Agent Infrastructure
- [ ] Task 17.6: Smoke Test Reviewer Pattern
- [ ] Task 18: Create and run brainstorming compliance test
- [ ] Task 19: Create and run compound compliance test
- [ ] Task 20: Create and run dispatching-parallel-agents compliance test
- [ ] Task 21: Create and run using-hyperpowers compliance test
- [ ] Task 22: Create and run feedback compliance test
- [ ] Task 23: Create and run finishing-a-development-branch compliance test
- [ ] Task 24: Create and run receiving-code-review compliance test
- [ ] Task 25: Create and run requesting-code-review compliance test
- [ ] Task 26: Create and run subagent-driven-development compliance test
- [ ] Task 27: Create and run using-git-worktrees compliance test
- [ ] Task 28: Create and run writing-skills compliance test
- [ ] Task 29: Create and run writing-plans compliance test
- [ ] Task 30: Create and run research compliance test
- [ ] Task 31: Create and run test-driven-development compliance test
- [ ] Task 32: Create and run systematic-debugging compliance test
- [ ] Task 33: Create and run verification-before-completion compliance test
- [ ] Task 34: Evaluate results and handle failures
- [ ] Task 35: Cleanup test project

## Phase 3: Finalization

- [ ] Task 36: Update writing-skills with successful reinforcement patterns
- [ ] Task 37: Generate final summary

---

## Task Details

### Task 0: Capture baseline behavior for all 16 skills

**Purpose:** Capture current skill behavior BEFORE any Phase 1 modifications. This provides evidence that reinforcement actually improves compliance.

**Files:**
- Create: `tests/claude-code/skills/{skill}/baseline-capture.md` for each skill

**Steps:**
1. Create Next.js test project (same as Task 17, but temporary for baseline)
2. For each of the 16 skills, run the test scenario from Phase 2
3. Capture full session output
4. Save to `tests/claude-code/skills/{skill}/baseline-capture.md`
5. Document any observed skipped steps or rationalizations
6. Delete temporary test project

**Skills to capture baseline for:**
1. brainstorming - "Add a dark mode toggle to the app"
2. compound - Debug bug, say "that worked!"
3. dispatching-parallel-agents - "Fix these 3 failing tests"
4. using-hyperpowers - "Add a button to the homepage"
5. feedback - Provide design feedback
6. finishing-a-development-branch - "I'm done with this branch"
7. receiving-code-review - Provide review feedback
8. requesting-code-review - "Review my changes"
9. subagent-driven-development - Execute 3-task plan
10. using-git-worktrees - "Create a worktree for feature/new-component"
11. writing-skills - "Create a skill for always running lints before commits"
12. writing-plans - "Write a plan based on this research"
13. research - "Research this design"
14. test-driven-development - "Implement a formatCurrency utility function"
15. systematic-debugging - "Tests are failing, can you fix it?"
16. verification-before-completion - "I think that's done"

**Output Format:**
```markdown
# Baseline Capture: {skill}

## Date
{date}

## Scenario
{scenario description}

## Session Output
{full session output}

## Observed Behavior
- Gates appeared: {list}
- Gates skipped: {list}
- Rationalizations observed: {list}

## Notes
{any additional observations}
```

**Commit:** No commit - baseline data stored for comparison.

---

### Task 1: Create git worktree for Phase 1 work

**Files:**
- Create: `.worktrees/hyperpowers-dvi/` (worktree directory)

**Steps:**
1. Verify worktree directory is gitignored: `git check-ignore .worktrees 2>/dev/null || echo ".worktrees" >> .gitignore`
2. Create worktree with new branch: `git worktree add .worktrees/hyperpowers-dvi -b feature/hyperpowers-dvi`
3. Navigate to worktree: `cd .worktrees/hyperpowers-dvi`
4. Verify clean state: `git status`

**Commit:** No commit needed - infrastructure setup.

---

### Task 2: Add verification gates to brainstorming skill

**Files:**
- Modify: `skills/brainstorming/SKILL.md`
- Create: `tests/claude-code/skills/brainstorming/baseline-test.md`
- Create: `tests/claude-code/skills/brainstorming/compliance-test.md`

**Approach:** This skill has "No Implementation During Brainstorming" section but lacks formal COMPULSORY gates. Add standardized gate structure.

**Steps:**
1. Write baseline test documenting behavior WITHOUT reinforcement
2. Run baseline test to verify document exists
3. Add verification gates to SKILL.md after "## No Implementation During Brainstorming" section:
   - Understanding Gate (read project state, ask clarifying question, user confirmation)
   - Design Gate (Problem Statement, Success Criteria, Constraints, Approach, Open Questions)
   - Red Flags table
4. Write compliance test documenting behavior WITH reinforcement

**Gate Content:**

```markdown
## COMPULSORY: Phase Gate Verification

Before proceeding to design presentation:

**Understanding Gate** (all COMPULSORY):

- [ ] Read current project state (files, docs, commits)
- [ ] Asked at least one clarifying question
- [ ] User has confirmed understanding

**STOP CONDITION:** If ANY checkbox is unchecked, do NOT proceed. Complete missing steps first.

Before saving design:

**Design Gate** (all COMPULSORY):

- [ ] Problem Statement included
- [ ] Success Criteria included (measurable)
- [ ] Constraints/Out of Scope included
- [ ] Approach included
- [ ] Open Questions included

**STOP CONDITION:** If ANY section missing, do NOT save. Complete missing section(s) first.

## Red Flags - IMMEDIATE STOP

| Violation | Why It's Critical | Recovery |
|-----------|-------------------|----------|
| Opening code files with intent to modify | Brainstorming is DESIGN, not CODING | Return to clarifying questions |
| Skipping clarifying questions | Assumptions lead to wrong designs | Ask at least one question |
| Presenting design without user confirmation | Design may be solving wrong problem | Get explicit "yes, that's what I want" |
| Saving design without all 5 required sections | Incomplete design = incomplete planning | Add missing sections |
```

**Commit:**
```
feat(brainstorming): add verification gates and test cases

- Add COMPULSORY phase gate verification checklists
- Add Understanding Gate before design presentation
- Add Design Gate before saving
- Add Red Flags table for critical violations
- Add baseline and compliance test cases

Part of hyperpowers-dvi skill reinforcement.
```

---

### Task 3: Add verification gates to compound skill

**Files:**
- Modify: `skills/compound/SKILL.md`
- Create: `tests/claude-code/skills/compound/baseline-test.md`
- Create: `tests/claude-code/skills/compound/compliance-test.md`

**Approach:** This skill has Red Flags section but lacks COMPULSORY keyword. Add standardized gate structure.

**Steps:**
1. Write baseline test documenting behavior WITHOUT reinforcement
2. Add verification gates to SKILL.md after "## Red Flags - STOP" section:
   - Solution Quality Gate (error messages, failed attempts, root cause, solution, prevention)
   - Pattern Detection Gate
3. Write compliance test

**Gate Content:**

```markdown
## COMPULSORY: Capture Verification

Before saving solution document:

**Solution Quality Gate** (all COMPULSORY):

- [ ] Symptoms include exact error messages (quoted)
- [ ] Failed Attempts section has at least one entry (unless first attempt worked)
- [ ] Root Cause explains WHY (not just what)
- [ ] Solution has step-by-step instructions
- [ ] Prevention section has actionable items

**STOP CONDITION:** If ANY checkbox is unchecked, do NOT save. Complete missing section(s) first.

After saving:

**Pattern Detection Gate** (COMPULSORY):

- [ ] Ran `ls docs/solutions/{category}/ | wc -l`
- [ ] If 3+, noted pattern to user

**STOP CONDITION:** If pattern detection skipped, go back and run it.
```

**Commit:**
```
feat(compound): add verification gates and test cases

- Add Solution Quality Gate checklist
- Add Pattern Detection Gate (COMPULSORY)
- Add baseline and compliance test cases

Part of hyperpowers-dvi skill reinforcement.
```

---

### Task 4: Add verification gates to dispatching-parallel-agents skill

**Files:**
- Modify: `skills/dispatching-parallel-agents/SKILL.md`
- Create: `tests/claude-code/skills/dispatching-parallel-agents/baseline-test.md`
- Create: `tests/claude-code/skills/dispatching-parallel-agents/compliance-test.md`

**Approach:** This skill lacks formal gates and Red Flags section. Add full reinforcement.

**Steps:**
1. Write baseline test
2. Add verification gates after "## Verification" section (rename to "## Integration Verification"):
   - Independence Gate
   - Prompt Quality Gate (per agent)
   - Integration Gate
3. Write compliance test

**Gate Content:**

```markdown
## COMPULSORY: Dispatch Verification

Before dispatching agents:

**Independence Gate** (all COMPULSORY):

- [ ] Confirmed tasks are independent (no shared state)
- [ ] Tasks don't modify same files
- [ ] Each agent has specific scope (one test file/subsystem)

**STOP CONDITION:** If ANY task has dependencies, do NOT parallelize. Use sequential dispatch.

**Prompt Quality Gate** (all COMPULSORY - per agent):

- [ ] Specific scope defined (not "fix the tests")
- [ ] Context included (error messages, test names)
- [ ] Constraints stated (what NOT to change)
- [ ] Structured output format specified

**STOP CONDITION:** If prompt is vague, rewrite before dispatching.

After agents return:

**Integration Gate** (all COMPULSORY):

- [ ] Read each summary
- [ ] Verified no conflicts (same files modified)
- [ ] Ran full test suite
- [ ] All changes integrate cleanly

**STOP CONDITION:** If conflicts detected, resolve before proceeding.
```

**Commit:**
```
feat(dispatching-parallel-agents): add verification gates

- Add Independence Gate before dispatch
- Add Prompt Quality Gate per agent
- Add Integration Gate after return
- Add baseline and compliance test cases

Part of hyperpowers-dvi skill reinforcement.
```

---

### Task 5: Add verification gates to using-hyperpowers skill

**Files:**
- Modify: `skills/using-hyperpowers/SKILL.md`
- Create: `tests/claude-code/skills/using-hyperpowers/baseline-test.md`
- Create: `tests/claude-code/skills/using-hyperpowers/compliance-test.md`

**Approach:** This skill already has COMPULSORY and Red Flags. Standardize terminology and enhance if needed.

**Steps:**
1. Write baseline test
2. Review existing gates - add STOP CONDITIONS if missing
3. Add verification gates after "## Types" section if not already present:
   - Skill Invocation Gate
   - Self-Check Questions
4. Write compliance test

**Gate Content:**

```markdown
## COMPULSORY: Pre-Response Check

Before ANY response to a user request:

**Skill Invocation Gate** (COMPULSORY):

- [ ] Checked if a skill applies (even 1% chance = yes)
- [ ] If yes: Invoked skill BEFORE responding
- [ ] If no skill applies: Proceed with response

**STOP CONDITION:** If you're about to respond without checking skills, STOP. Check first.

**Self-Check Questions:**

1. "Am I about to explore, clarify, or respond?"
   - If yes to ANY → Check skills first
2. "Does this feel like a simple question?"
   - Simple questions are still tasks → Check skills
3. "Do I remember how this skill works?"
   - Skills evolve → Invoke current version, don't rely on memory

## Red Flags - IMMEDIATE STOP

| Violation | Why It's Critical | Recovery |
|-----------|-------------------|----------|
| Responding before skill check | May miss applicable workflow | Stop, check skills, then respond |
| "Let me explore first" | Skills tell you HOW to explore | Invoke exploration skill |
| "I remember this skill" | Skills change; memory may be stale | Read current skill version |
| "Too simple for skills" | Simple tasks still have workflows | Check anyway - 30 seconds |
```

**Commit:**
```
feat(using-hyperpowers): add verification gates

- Add COMPULSORY Pre-Response Check
- Add Skill Invocation Gate
- Add Self-Check Questions
- Add Red Flags table
- Add baseline and compliance test cases

Part of hyperpowers-dvi skill reinforcement.
```

---

### Task 6: Add verification gates to feedback skill

**Files:**
- Modify: `skills/feedback/SKILL.md`

**Approach:** This skill already has Red Flags and Rationalization Prevention tables. Add COMPULSORY keyword and STOP CONDITIONS to standardize.

**Steps:**
1. Review existing enforcement - add COMPULSORY gates with STOP CONDITIONS
2. Add verification gates after "## Red Flags - STOP" section:
   - Clarification Gate
   - Approval Gate
   - Changelog Gate

**Gate Content:**

```markdown
## COMPULSORY: Phase Verification

Before presenting changes:

**Clarification Gate** (when confidence < 85%):

- [ ] Asked clarifying question(s)
- [ ] User confirmed interpretation
- [ ] Confidence now >= 85%

**STOP CONDITION:** If confidence < 85% and no clarification asked, STOP and ask.

Before applying changes:

**Approval Gate** (per change - COMPULSORY):

- [ ] Change presented with Old/New diff
- [ ] User explicitly approved (yes/no/modify)
- [ ] If "modify": returned to clarification

**STOP CONDITION:** If applying change without explicit user approval, STOP.

After all changes:

**Changelog Gate** (COMPULSORY):

- [ ] Changelog section exists (created or appended)
- [ ] Entry dated with feedback round number
- [ ] Research tier noted if used

**STOP CONDITION:** If changelog not updated, STOP and add entry.
```

**Commit:**
```
feat(feedback): add verification gates

- Add Clarification Gate (confidence threshold)
- Add Approval Gate (per change)
- Add Changelog Gate (COMPULSORY)

Part of hyperpowers-dvi skill reinforcement.
```

---

### Task 7: Add verification gates to finishing-a-development-branch skill

**Files:**
- Modify: `skills/finishing-a-development-branch/SKILL.md`

**Approach:** This skill already has MANDATORY in 2 places. Add standardized COMPULSORY gates with STOP CONDITIONS.

**Steps:**
1. Add verification gates after "## Red Flags" section:
   - Pre-Completion Gate (tests, build, lint)
   - Option Execution Verification

**Gate Content:**

```markdown
## COMPULSORY: Pre-Completion Gate

**This gate MUST pass before presenting options:**

**Verification Gate** (COMPULSORY):

- [ ] Tests pass (fresh run, not from memory)
- [ ] Build succeeds (fresh run)
- [ ] Lint passes (fresh run)

**STOP CONDITION:** If ANY verification fails, do NOT present options. Fix issues first.

**Evidence Required:**

- Show test command output
- Show build command output
- Show lint command output

"Should pass" or "passed earlier" is NOT evidence. Fresh run required.

## COMPULSORY: Option Execution Verification

After user selects option:

**Option 1 (Merge) Gate:**

- [ ] Switched to base branch
- [ ] Pulled latest
- [ ] Merged feature branch
- [ ] Tests pass on merged result
- [ ] Branch deleted

**Option 2 (PR) Gate:**

- [ ] Pushed with -u flag
- [ ] PR created with issue reference
- [ ] PR URL reported to user

**Option 4 (Discard) Gate:**

- [ ] User typed 'discard' confirmation
- [ ] Branch deleted with -D flag

**STOP CONDITION:** If any step in selected option fails, stop and report.
```

**Commit:**
```
feat(finishing-a-development-branch): add verification gates

- Add Pre-Completion Gate (tests, build, lint)
- Add Option Execution Verification per option
- Require fresh evidence, not memory

Part of hyperpowers-dvi skill reinforcement.
```

---

### Task 8: Add verification gates to receiving-code-review skill

**Files:**
- Modify: `skills/receiving-code-review/SKILL.md`

**Approach:** This skill has STOP and Forbidden Responses but lacks COMPULSORY keyword. Add standardized gates.

**Steps:**
1. Add verification gates after "## The Bottom Line" section:
   - Understanding Gate
   - Clarity Gate
   - Change Verification Gate
   - Red Flags table

**Gate Content:**

```markdown
## COMPULSORY: Response Verification

Before implementing feedback:

**Understanding Gate** (COMPULSORY):

- [ ] Can explain WHY reviewer suggests this
- [ ] Verified claim is technically accurate for THIS codebase
- [ ] Assessed impact (improves or just changes?)

**STOP CONDITION:** If can't explain WHY, ask for clarification first.

**Clarity Gate** (when multiple items):

- [ ] Understand ALL items before implementing ANY
- [ ] Asked about unclear items FIRST

**STOP CONDITION:** If ANY item unclear, do NOT implement. Ask first.

After implementing each change:

**Change Verification Gate** (COMPULSORY):

- [ ] Ran tests (did change break anything?)
- [ ] Checked related code (affected other areas?)
- [ ] Re-read change (actually addresses feedback?)

**STOP CONDITION:** If tests fail, do NOT move to next change. Fix first.

## Red Flags - IMMEDIATE STOP

| Violation | Why It's Critical | Recovery |
|-----------|-------------------|----------|
| "Great point!" before understanding | Performative agreement | Restate requirement instead |
| Implementing before verifying | May break things | Verify claim first |
| Batch implementing without testing each | Can't isolate issues | One at a time, test each |
| Implementing unclear items | Partial understanding = wrong implementation | Ask first |
```

**Commit:**
```
feat(receiving-code-review): add verification gates

- Add Understanding Gate before implementing
- Add Clarity Gate for multiple items
- Add Change Verification Gate after each change
- Add Red Flags table

Part of hyperpowers-dvi skill reinforcement.
```

---

### Task 9: Add verification gates to requesting-code-review skill (+ handoff consumption)

**Files:**
- Modify: `skills/requesting-code-review/SKILL.md`

**Approach:** This skill has Red Flags but lacks COMPULSORY gates. Add gates including handoff consumption for reviewer outputs.

**Steps:**
1. Add verification gates after "## Red Flags" section:
   - Context Gate
   - Dispatch Gate
   - Synthesis Gate
   - Handoff Consumption Gate

**Gate Content:**

```markdown
## COMPULSORY: Review Dispatch Verification

Before dispatching review agents:

**Context Gate** (COMPULSORY):

- [ ] BASE_SHA and HEAD_SHA captured
- [ ] Git diff generated
- [ ] Summary of changes prepared

**STOP CONDITION:** If context incomplete, gather it first.

**Dispatch Gate** (COMPULSORY - must dispatch all 4):

- [ ] Security Reviewer dispatched
- [ ] Performance Reviewer dispatched
- [ ] Style Reviewer dispatched
- [ ] Test Reviewer dispatched

**STOP CONDITION:** If fewer than 4 agents dispatched, dispatch missing agents.

After agents return:

**Synthesis Gate** (COMPULSORY):

- [ ] All 4 agents completed
- [ ] Findings grouped by severity (Critical/Warning/Suggestion)
- [ ] Checked docs/solutions/ for known fixes
- [ ] Unified checklist presented

**STOP CONDITION:** If any agent missing from synthesis, wait or re-dispatch.

## COMPULSORY: Handoff Consumption Verification

**Consumption Gate** (COMPULSORY - for each reviewer's findings):

- [ ] Each reviewer's output file path stated
- [ ] Key findings from EACH reviewer quoted/referenced
- [ ] Severity classifications traced back to specific reviewer

**STOP CONDITION:** If synthesizing without citing specific reviewer outputs, STOP. Quote each reviewer's findings.
```

**Commit:**
```
feat(requesting-code-review): add verification gates

- Add Context Gate before dispatch
- Add Dispatch Gate (all 4 agents required)
- Add Synthesis Gate after completion
- Add Handoff Consumption Gate for reviewer findings

Part of hyperpowers-dvi skill reinforcement.
```

---

### Task 10: Add verification gates to subagent-driven-development skill (+ handoff consumption)

**Files:**
- Modify: `skills/subagent-driven-development/SKILL.md`

**Approach:** This skill already has MANDATORY checkpoint. Add handoff consumption gate and standardize other gates.

**Steps:**
1. Add verification gates after "## Red Flags" section:
   - Context Curation Gate
   - Handoff Consumption Gate (for implementer)
   - Review Sequence Gate
   - Task Completion Gate

**Gate Content:**

```markdown
## COMPULSORY: Task Loop Verification

Before each task:

**Context Curation Gate** (COMPULSORY):

- [ ] Full task text extracted from plan (not file path)
- [ ] Relevant file paths included
- [ ] Prior decisions affecting this task noted
- [ ] Structured handoff format used

**STOP CONDITION:** If subagent needs to read plan file, STOP. Provide full text.

## COMPULSORY: Handoff Consumption Verification

**Implementer Consumption Gate** (COMPULSORY - enforced via prompt):

- [ ] Implementer prompt requires acknowledgment of handoff sections
- [ ] Implementer must state: "Received context for: [task name]"
- [ ] Implementer must reference specific files from handoff before modifying

**Orchestrator Verification** (COMPULSORY):

- [ ] Verify implementer's response references handoff content
- [ ] If implementer proceeds without acknowledgment, STOP and re-prompt

**STOP CONDITION:** If implementer output doesn't reference handoff, reject and re-dispatch with explicit consumption requirement.

After implementer completes:

**Review Sequence Gate** (COMPULSORY):

- [ ] Spec Compliance Review completed FIRST
- [ ] Spec issues fixed (if any)
- [ ] THEN Code Quality Review
- [ ] Quality issues fixed (if any)
- [ ] Both reviews approved

**STOP CONDITION:** If attempting Code Quality before Spec Compliance approved, STOP. Wrong order.

**Task Completion Gate** (COMPULSORY):

- [ ] Both reviews approved
- [ ] TodoWrite updated (task marked complete)
- [ ] Progress file updated

**STOP CONDITION:** If moving to next task without both reviews approved, STOP.
```

**Commit:**
```
feat(subagent-driven-development): strengthen verification gates

- Add Context Curation Gate
- Add Handoff Consumption Gate (implementer must acknowledge)
- Add Review Sequence Gate (spec before quality)
- Add Task Completion Gate

Part of hyperpowers-dvi skill reinforcement.
```

---

### Task 11: Add verification gates to using-git-worktrees skill

**Files:**
- Modify: `skills/using-git-worktrees/SKILL.md`

**Approach:** This skill has Red Flags but lacks COMPULSORY keyword. Add standardized gates.

**Steps:**
1. Add verification gates after "## Red Flags" section:
   - Ignore Verification Gate
   - Setup Gate
   - Readiness Gate

**Gate Content:**

```markdown
## COMPULSORY: Worktree Safety Verification

Before creating project-local worktree:

**Ignore Verification Gate** (COMPULSORY for .worktrees or worktrees):

- [ ] Ran `git check-ignore` on directory
- [ ] If NOT ignored: added to .gitignore and committed

**STOP CONDITION:** If creating worktree in non-ignored directory, STOP. Fix gitignore first.

After creating worktree:

**Setup Gate** (COMPULSORY):

- [ ] Auto-detected project type (package.json, Cargo.toml, etc.)
- [ ] Ran appropriate setup command
- [ ] Ran baseline tests

**STOP CONDITION:** If tests fail, report and get permission before proceeding.

**Readiness Gate** (COMPULSORY):

- [ ] Full path reported to user
- [ ] Test results reported
- [ ] "Ready to implement" announced

**STOP CONDITION:** If proceeding without readiness report, STOP and report.
```

**Commit:**
```
feat(using-git-worktrees): add verification gates

- Add Ignore Verification Gate (safety critical)
- Add Setup Gate for baseline verification
- Add Readiness Gate for completion

Part of hyperpowers-dvi skill reinforcement.
```

---

### Task 12: Add verification gates to writing-skills skill

**Files:**
- Modify: `skills/writing-skills/SKILL.md`

**Approach:** This skill has Iron Law and STOP section. Standardize with COMPULSORY keyword and explicit gates.

**Steps:**
1. Add verification gates after "## STOP: Before Moving to Next Skill" section:
   - RED Phase Gate
   - GREEN Phase Gate
   - REFACTOR Phase Gate
   - Self-Check table

**Gate Content:**

```markdown
## COMPULSORY: TDD Phase Verification

**RED Phase Gate** (COMPULSORY):

- [ ] Pressure scenarios created (3+ for discipline skills)
- [ ] Scenarios run WITHOUT skill
- [ ] Baseline behavior documented VERBATIM
- [ ] Rationalizations captured

**STOP CONDITION:** If writing skill without baseline test, STOP. Run baseline first.

**GREEN Phase Gate** (COMPULSORY):

- [ ] Skill addresses specific baseline failures
- [ ] Scenarios run WITH skill
- [ ] Agents now comply

**STOP CONDITION:** If skill written without running compliance test, STOP. Test it.

**REFACTOR Phase Gate** (COMPULSORY):

- [ ] New rationalizations identified (if any)
- [ ] Explicit counters added
- [ ] Re-tested until bulletproof
- [ ] Rationalization table complete
- [ ] Red flags list complete

**STOP CONDITION:** If deploying skill without REFACTOR phase, STOP. Close loopholes.

## Self-Check: Am I Skipping Testing?

| Thought | Reality |
|---------|---------|
| "Skill is obviously clear" | Clear to you ≠ clear to agents. Test it. |
| "It's just a reference" | References have gaps. Test retrieval. |
| "Testing is overkill" | 15 min testing saves hours debugging. |
| "I'll test if problems emerge" | Test BEFORE deploying. |
```

**Commit:**
```
feat(writing-skills): add TDD phase verification gates

- Add RED Phase Gate (baseline required)
- Add GREEN Phase Gate (compliance required)
- Add REFACTOR Phase Gate (loopholes closed)
- Add Self-Check table

Part of hyperpowers-dvi skill reinforcement.
```

---

### Task 13: Add verification gates to writing-plans skill (+ handoff consumption)

**Files:**
- Modify: `skills/writing-plans/SKILL.md`

**Approach:** This skill has Pre-Plan Writing Gate and Red Flags. Add handoff consumption for research doc and standardize with COMPULSORY.

**Steps:**
1. Add verification gates after "## Pre-Plan Writing Gate" section:
   - Handoff Consumption Gate (for research doc)
   - Context Gate
   - Task Quality Gate
   - Plan Completeness Gate

**Gate Content:**

```markdown
## COMPULSORY: Handoff Consumption Verification

**Research Consumption Gate** (COMPULSORY when research doc provided):

- [ ] Research document path explicitly stated
- [ ] Key findings from research quoted in plan header
- [ ] Architecture decisions traced to research findings
- [ ] Open questions from research addressed or carried forward

**STOP CONDITION:** If writing plan without citing research findings, STOP. Quote specific sections from research.

## COMPULSORY: Plan Quality Verification

Before writing ANY task:

**Context Gate** (COMPULSORY):

- [ ] Research document read (or degraded mode acknowledged)
- [ ] Topic clear from research or clarification
- [ ] Sufficient context for specific, actionable tasks

**STOP CONDITION:** If writing tasks without context, STOP. Gather context first.

For EACH task written:

**Task Quality Gate** (COMPULSORY):

- [ ] Exact file paths (not "relevant files")
- [ ] Complete code in plan (not "add validation")
- [ ] Exact commands with expected output
- [ ] Step granularity is 2-5 minutes each

**STOP CONDITION:** If task is vague, rewrite with specifics.

After writing all tasks:

**Plan Completeness Gate** (COMPULSORY):

- [ ] Header includes Goal, Architecture, Tech Stack
- [ ] Related Issues section populated (or "none" noted)
- [ ] Each task has Files, Steps, Commit sections
- [ ] DRY/YAGNI/TDD principles followed

**STOP CONDITION:** If plan missing required sections, add them before saving.
```

**Commit:**
```
feat(writing-plans): strengthen verification gates

- Add Handoff Consumption Gate for research doc
- Enhance Context Gate with COMPULSORY checklist
- Add Task Quality Gate per task
- Add Plan Completeness Gate before saving

Part of hyperpowers-dvi skill reinforcement.
```

---

### Task 14: Add handoff consumption gates to research skill

**Files:**
- Modify: `skills/research/SKILL.md`

**Approach:** This skill already has COMPULSORY synthesis verification. Add explicit handoff consumption gate for 8 agent outputs.

**Steps:**
1. Add handoff consumption verification after synthesis section:
   - Agent Output Consumption Gate
   - Synthesis Verification Gate

**Gate Content:**

```markdown
## COMPULSORY: Handoff Consumption Verification

**Agent Output Consumption Gate** (COMPULSORY - for each of 8 agents):

- [ ] Each agent's output file path stated
- [ ] Key findings from EACH agent quoted in synthesis
- [ ] Contradictions between agents noted and resolved
- [ ] No agent's findings silently dropped

**STOP CONDITION:** If synthesis doesn't cite all 8 agents, STOP. Quote findings from missing agents.

**Synthesis Verification Gate** (COMPULSORY):

- [ ] Codebase Analyst findings cited
- [ ] Test Coverage Analyst findings cited
- [ ] Architecture Boundaries Analyst findings cited
- [ ] Framework Docs Researcher findings cited
- [ ] Best Practices Researcher findings cited
- [ ] Error Handling Analyst findings cited
- [ ] Git History Analyzer findings cited
- [ ] Dependency Analyst findings cited

**STOP CONDITION:** If any agent missing from synthesis, go back and incorporate their findings.

## Red Flags - IMMEDIATE STOP

| Violation | Why It's Critical | Recovery |
|-----------|-------------------|----------|
| "Agent X had no relevant findings" | Every agent finds SOMETHING | Re-read agent output, cite at least one finding |
| Synthesis shorter than combined agent outputs | Information being lost | Expand synthesis to cover all findings |
| No contradictions noted | Unlikely 8 agents fully agree | Look harder for nuance/disagreement |
```

**Commit:**
```
feat(research): add handoff consumption gates

- Add Agent Output Consumption Gate (all 8 agents)
- Add Synthesis Verification Gate with per-agent checklist
- Add Red Flags table for synthesis shortcuts

Part of hyperpowers-dvi skill reinforcement.
```

---

### Task 15: Create test runner script for skill verification

**Files:**
- Create: `tests/claude-code/test-skill-reinforcement.sh`

**Steps:**
1. Write test runner script that checks all 13 skills for COMPULSORY gates and STOP CONDITIONS
2. Make executable: `chmod +x tests/claude-code/test-skill-reinforcement.sh`
3. Run verification: `./tests/claude-code/test-skill-reinforcement.sh`

**Script Content:**

```bash
#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "=== Skill Reinforcement Verification ==="
echo ""

SKILLS=(
    "brainstorming"
    "compound"
    "dispatching-parallel-agents"
    "using-hyperpowers"
    "feedback"
    "finishing-a-development-branch"
    "receiving-code-review"
    "requesting-code-review"
    "subagent-driven-development"
    "using-git-worktrees"
    "writing-skills"
    "writing-plans"
    "research"
)

PASSED=0
FAILED=0

for skill in "${SKILLS[@]}"; do
    echo "Testing: $skill"

    if grep -q "COMPULSORY" "../../skills/$skill/SKILL.md" 2>/dev/null; then
        echo "  ✓ Has COMPULSORY gates"
        ((PASSED++))
    else
        echo "  ✗ Missing COMPULSORY gates"
        ((FAILED++))
    fi

    if grep -q "STOP CONDITION" "../../skills/$skill/SKILL.md" 2>/dev/null; then
        echo "  ✓ Has STOP CONDITIONS"
        ((PASSED++))
    else
        echo "  ✗ Missing STOP CONDITIONS"
        ((FAILED++))
    fi
done

echo ""
echo "=== Results ==="
echo "Passed: $PASSED"
echo "Failed: $FAILED"

if [ $FAILED -gt 0 ]; then
    exit 1
fi

echo "=== All verification gate checks passed ==="
```

**Commit:**
```
test: add skill reinforcement verification script

Checks all 13 reinforced skills for COMPULSORY gates and STOP CONDITIONS.

Part of hyperpowers-dvi skill reinforcement.
```

---

### Task 16: Merge worktree to main

**Files:**
- No new files

**Steps:**
1. Return to main repo: `cd ../..`
2. Run full test suite: `./tests/claude-code/run-skill-tests.sh`
3. Run reinforcement verification: `./tests/claude-code/test-skill-reinforcement.sh`
4. Merge to main:
```bash
git checkout main
git merge feature/hyperpowers-dvi --no-ff -m "feat: reinforce all skills with verification checkpoints

Phase 1 of hyperpowers-dvi complete:
- 13 skills reinforced with COMPULSORY verification gates
- Each skill has STOP CONDITIONS for critical violations
- Baseline and compliance test cases added
- Verification script confirms all gates present

Skills reinforced:
- brainstorming
- compound
- dispatching-parallel-agents
- using-hyperpowers
- feedback
- finishing-a-development-branch
- receiving-code-review
- requesting-code-review
- subagent-driven-development
- using-git-worktrees
- writing-skills
- writing-plans
- research

Part of hyperpowers-dvi"
```
5. Remove worktree: `git worktree remove .worktrees/hyperpowers-dvi`
6. Push to remote: `git push origin main`

**Commit:** Merge commit as shown above.

---

## Phase 2: Validation Testing (COMPULSORY)

### Task 17: Create Next.js example project for testing

**Files:**
- Create: `/tmp/hyperpowers-test-app/`

**Steps:**
1. Create Next.js app: `cd /tmp && npx create-next-app@latest hyperpowers-test-app --typescript --tailwind --eslint --app --src-dir --no-turbopack`
2. Add testing dependencies: `npm install -D vitest @testing-library/react @testing-library/jest-dom happy-dom @vitejs/plugin-react`
3. Create vitest config
4. Create vitest setup
5. Initialize git repo and make initial commit
6. Verify setup: `npm run lint && npm run build`

**Commit:** Initial commit in test project.

---

### Task 17.5: Create Reviewer Agent Infrastructure

**Files:**
- Create: `tests/claude-code/reviewer-prompt-template.md`
- Create: `tests/claude-code/test-skill-compliance-template.sh`

**Purpose:** Define the reviewer agent pattern used by all Phase 2 compliance tests.

**Reviewer Agent Specification:**

- **Model:** haiku (cost control, sufficient for checklist verification)
- **Dispatch:** Task tool with subagent_type="general-purpose"
- **Input:** Session output + skill-specific checklist + skipping signs
- **Output:** Structured verdict with evidence quotes

**Reviewer Prompt Template (`reviewer-prompt-template.md`):**

```markdown
# Compliance Reviewer

You are reviewing a Claude Code session to verify skill compliance.

## Session Output to Review

{SESSION_OUTPUT}

## Checklist to Verify

{CHECKLIST}

## Signs of Skipping to Watch For

{SKIPPING_SIGNS}

## Your Task

1. For each checklist item:
   - Quote the evidence from the session that proves it happened
   - Or mark as MISSING if no evidence found

2. For each skipping sign:
   - Quote evidence if this behavior was observed
   - Or mark as NOT OBSERVED

3. Compare to baseline:
   - Note improvements from baseline behavior
   - Note any regressions

4. Render verdict:
   - PASS: All checklist items have evidence AND no skipping signs observed
   - FAIL: Any checklist item missing OR any skipping sign observed

## Output Format

```json
{
  "skill": "{SKILL_NAME}",
  "checklist_results": [
    {"item": "...", "status": "FOUND|MISSING", "evidence": "..."}
  ],
  "skipping_observations": [
    {"sign": "...", "status": "OBSERVED|NOT_OBSERVED", "evidence": "..."}
  ],
  "baseline_comparison": "...",
  "verdict": "PASS|FAIL",
  "reasoning": "..."
}
```
```

**Test Script Template (`test-skill-compliance-template.sh`):**

```bash
#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

SKILL_NAME="$1"
SCENARIO_FILE="$SCRIPT_DIR/skills/$SKILL_NAME/scenario.md"
CHECKLIST_FILE="$SCRIPT_DIR/skills/$SKILL_NAME/checklist.md"
SKIPPING_FILE="$SCRIPT_DIR/skills/$SKILL_NAME/skipping-signs.md"
BASELINE_FILE="$SCRIPT_DIR/skills/$SKILL_NAME/baseline-capture.md"

echo "=== Compliance Test: $SKILL_NAME ==="

# Step 1: Run scenario
echo "Running scenario..."
scenario=$(cat "$SCENARIO_FILE")
session_output=$(run_claude "$scenario" 300)

# Step 2: Prepare reviewer prompt
checklist=$(cat "$CHECKLIST_FILE")
skipping_signs=$(cat "$SKIPPING_FILE")
baseline=$(cat "$BASELINE_FILE")

reviewer_prompt=$(cat "$SCRIPT_DIR/reviewer-prompt-template.md")
reviewer_prompt="${reviewer_prompt//\{SESSION_OUTPUT\}/$session_output}"
reviewer_prompt="${reviewer_prompt//\{CHECKLIST\}/$checklist}"
reviewer_prompt="${reviewer_prompt//\{SKIPPING_SIGNS\}/$skipping_signs}"
reviewer_prompt="${reviewer_prompt//\{SKILL_NAME\}/$SKILL_NAME}"

# Step 3: Dispatch reviewer agent
echo "Dispatching reviewer agent..."
verdict=$(run_claude "$reviewer_prompt" 120)

# Step 4: Check verdict
if echo "$verdict" | grep -q '"verdict": "PASS"'; then
    echo "✓ $SKILL_NAME: PASS"
    exit 0
else
    echo "✗ $SKILL_NAME: FAIL"
    echo "$verdict"
    exit 1
fi
```

**Commit:**
```
test: add reviewer agent infrastructure for compliance testing

- Add reviewer prompt template with structured output
- Add test script template for skill compliance tests
- Define haiku model for cost control

Part of hyperpowers-dvi validation testing.
```

---

### Task 17.6: Smoke Test Reviewer Pattern

**Purpose:** Validate the reviewer agent pattern works before running all 16 skill tests.

**Steps:**
1. Create minimal test case for brainstorming skill
2. Run the test using the template from Task 17.5
3. Verify:
   - Reviewer agent dispatches correctly
   - Output is parseable JSON
   - Verdict determination works (PASS/FAIL)
4. If smoke test fails, debug before proceeding

**STOP CONDITION:** If smoke test fails, do NOT proceed to Tasks 18-33. Debug the reviewer infrastructure first.

**Commit:** No commit - validation only.

---

### Task 18: Create and run brainstorming compliance test

**Files:**
- Create: `tests/claude-code/skills/brainstorming/scenario.md`
- Create: `tests/claude-code/skills/brainstorming/checklist.md`
- Create: `tests/claude-code/skills/brainstorming/skipping-signs.md`
- Create: `tests/claude-code/test-brainstorming-compliance.sh`

**Scenario:** "Add a dark mode toggle to the app"

**Checklist:**
- [ ] Understanding Gate appeared
- [ ] At least one clarifying question was asked
- [ ] Design Gate appeared with all 5 sections (Problem, Success Criteria, Constraints, Approach, Open Questions)
- [ ] Design doc saved to `docs/designs/` before any code discussion
- [ ] No code files opened or modified during brainstorming phase

**Signs of Skipping:**
- Jumping to implementation without design doc
- Design doc missing required sections
- "This is straightforward, I'll just..." rationalization
- Code files opened before design complete
- Gate mentioned but not actually executed

**Steps:**
1. Create scenario, checklist, and skipping-signs files
2. Create test script using template
3. Run test: `./tests/claude-code/test-brainstorming-compliance.sh`
4. Compare to baseline from Task 0
5. Record result in SKILL_TEST_LOG.md

**PASS:** All checklist items true, no signs of skipping, improved from baseline
**FAIL:** Any checklist item false OR any sign of skipping observed

**Commit:** Test script creation only.

---

### Task 19: Create and run compound compliance test

**Files:**
- Create: `tests/claude-code/skills/compound/scenario.md`
- Create: `tests/claude-code/skills/compound/checklist.md`
- Create: `tests/claude-code/skills/compound/skipping-signs.md`
- Create: `tests/claude-code/test-compound-compliance.sh`

**Scenario:**
1. Create bug: undefined variable causing runtime error
2. Debug through multiple failed attempts
3. Fix the bug
4. Say "that worked!" to trigger skill

**Checklist:**
- [ ] Triviality assessment performed
- [ ] Solution Quality Gate appeared
- [ ] Symptoms section includes exact error message (quoted)
- [ ] Failed Attempts section populated (multiple attempts were made)
- [ ] Root Cause explains WHY, not just WHAT
- [ ] Solution has step-by-step instructions
- [ ] Prevention section has actionable items
- [ ] Pattern Detection Gate ran (`ls docs/solutions/` or similar)
- [ ] Solution doc saved to `docs/solutions/`

**Signs of Skipping:**
- No capture triggered after "that worked"
- Solution doc missing required sections
- Root cause is superficial ("fixed the typo")
- Pattern detection not executed
- "This was simple, no need to document" rationalization

**PASS:** All checklist items true, no signs of skipping
**FAIL:** Any checklist item false OR any sign of skipping observed

**Commit:** Test script creation only.

---

### Task 20: Create and run dispatching-parallel-agents compliance test

**Scenario:** Create 3 failing test files with dependencies:
- `auth.test.ts` - independent
- `api.test.ts` - shares state with auth-api
- `auth-api.test.ts` - shares state with api

Request: "Fix these 3 failing tests"

**Checklist:**
- [ ] Independence Gate appeared
- [ ] Dependencies correctly identified (api + auth-api share state)
- [ ] Dependent tasks dispatched sequentially, not in parallel
- [ ] Prompt Quality Gate appeared per agent
- [ ] Each agent prompt has specific scope (not "fix the tests")
- [ ] Each agent prompt includes context (error messages)
- [ ] Each agent prompt states constraints (what NOT to change)
- [ ] Integration Gate appeared after agents returned
- [ ] Full test suite run after integration

**Signs of Skipping:**
- All tasks parallelized without checking independence
- Vague prompts like "fix this test"
- Dependencies mentioned but then ignored
- Integration test skipped
- "These look independent" without verification

---

### Task 21: Create and run using-hyperpowers compliance test

**Scenario:** "Add a button to the homepage"

**Checklist:**
- [ ] Skill check happened BEFORE any substantive response
- [ ] Appropriate skill identified and invoked (brainstorming)
- [ ] No exploration or code reading before skill invocation
- [ ] Skill Invocation Gate logic visible in response

**Signs of Skipping:**
- Response given without checking for applicable skills
- "Let me explore the codebase first" without skill invocation
- "This is straightforward, I'll just..." without skill
- Skill mentioned but not actually invoked
- Code files read before invoking design skill

---

### Task 22: Create and run feedback compliance test

**Scenario:**
1. Create design doc
2. Provide feedback: "Change the data fetching approach to use React Query instead of useEffect"

**Checklist:**
- [ ] Clarification Gate appeared (if feedback was ambiguous)
- [ ] Confidence level assessed before proceeding
- [ ] Approval Gate appeared for each proposed change
- [ ] Each change shown with Old/New diff
- [ ] Explicit approval requested per change
- [ ] Changelog Gate appeared
- [ ] Changelog section updated with dated entry

**Signs of Skipping:**
- Changes applied without showing diff
- Batch changes without per-change approval
- Changelog not updated
- Proceeding with low confidence without clarification
- "I'll just make these changes" without approval flow

---

### Task 23: Create and run finishing-a-development-branch compliance test

**Scenario:**
1. Create feature branch with implementation
2. Say "I'm done with this branch"

**Checklist:**
- [ ] Pre-Completion Gate appeared
- [ ] Tests actually RUN (command executed, output shown)
- [ ] Build actually RUN (command executed, output shown)
- [ ] Lint actually RUN (command executed, output shown)
- [ ] Options presented to user (merge, PR, continue, discard)
- [ ] Option Execution Verification appeared for chosen option
- [ ] All steps of chosen option completed

**Signs of Skipping:**
- "Tests should pass" without actually running
- Gate checklist shown but commands not executed
- Verification claimed from memory, not fresh run
- Steps in option execution skipped
- Proceeding before all verifications complete

---

### Task 24: Create and run receiving-code-review compliance test

**Scenario:**
1. Write some code
2. Provide review feedback: "Add error handling to the API call and improve the validation logic"

**Checklist:**
- [ ] Understanding Gate appeared
- [ ] Claude explained WHY reviewer suggests each change
- [ ] Clarity Gate appeared for any ambiguous items
- [ ] Change Verification Gate appeared
- [ ] Tests run AFTER EACH individual change (not batched)
- [ ] Each change verified before moving to next

**Signs of Skipping:**
- Immediate "Great point!" without understanding
- Batch implementing multiple changes at once
- Tests run once at end instead of per-change
- Ambiguous feedback implemented without clarification
- Changes applied without verification between them

---

### Task 25: Create and run requesting-code-review compliance test

**Scenario:**
1. Make code changes
2. Request: "Review my changes"

**Checklist:**
- [ ] Context Gate appeared
- [ ] BASE_SHA and HEAD_SHA captured via git commands
- [ ] Git diff generated
- [ ] Dispatch Gate appeared
- [ ] All 4 reviewers dispatched (security, performance, style, test)
- [ ] Handoff Consumption Gate appeared
- [ ] Each reviewer's output cited in synthesis
- [ ] Synthesis Gate appeared
- [ ] Findings grouped by severity (Critical/Warning/Suggestion)

**Signs of Skipping:**
- Fewer than 4 reviewers dispatched
- Synthesis doesn't cite all reviewer outputs
- Reviewer findings summarized without quotes
- Severity grouping missing
- Any reviewer's findings silently dropped

---

### Task 26: Create and run subagent-driven-development compliance test

**Scenario:**
1. Create implementation plan with 3 tasks
2. Start execution with `/hyperpowers:execute-plan`

**Checklist:**
- [ ] Context Curation Gate appeared per task
- [ ] Full task text provided to implementer (not file path reference)
- [ ] Handoff Consumption Gate appeared
- [ ] Implementer acknowledged receiving context
- [ ] Review Sequence Gate appeared
- [ ] Spec Compliance Review completed FIRST
- [ ] Code Quality Review completed AFTER Spec Compliance
- [ ] Task Completion Gate appeared
- [ ] Both reviews approved before task marked complete
- [ ] TodoWrite updated only after both reviews pass

**Signs of Skipping:**
- Implementer told to "see plan file" instead of full text
- Reviews done in wrong order (quality before spec)
- Task marked complete without both reviews
- Review step mentioned but not actually executed
- Handoff not acknowledged by implementer

---

### Task 27: Create and run using-git-worktrees compliance test

**Scenario:** "Create a worktree for feature/new-component"

**Checklist:**
- [ ] Ignore Verification Gate appeared
- [ ] `git check-ignore` run on target directory
- [ ] If not ignored: .gitignore updated before creation
- [ ] Setup Gate appeared
- [ ] Project type auto-detected
- [ ] Dependencies installed in worktree
- [ ] Baseline tests run (output shown)
- [ ] Readiness Gate appeared
- [ ] Full path reported to user
- [ ] Test results reported

**Signs of Skipping:**
- Worktree created without checking .gitignore
- Dependencies not installed
- Tests not run or output not shown
- Proceeding without Readiness report
- "I'll set it up later" approach

---

### Task 28: Create and run writing-skills compliance test

**Scenario:** "Create a skill for always running lints before commits"

**Checklist:**
- [ ] RED Phase Gate appeared
- [ ] Baseline test created BEFORE skill writing
- [ ] Baseline behavior documented verbatim
- [ ] GREEN Phase Gate appeared
- [ ] Skill addresses specific baseline failures
- [ ] Compliance test run WITH skill
- [ ] REFACTOR Phase Gate appeared
- [ ] Rationalization table included in skill
- [ ] Red Flags list included in skill

**Signs of Skipping:**
- Skill written before baseline test exists
- Baseline test skipped as "unnecessary"
- Compliance test not run
- REFACTOR phase skipped
- Missing rationalization table
- Generic skill that doesn't address specific failures

---

### Task 29: Create and run writing-plans compliance test

**Scenario:**
1. Create research doc with findings
2. Request: "Write a plan based on this research"

**Checklist:**
- [ ] Handoff Consumption Gate appeared
- [ ] Research document explicitly referenced
- [ ] Key findings from research quoted in plan
- [ ] Context Gate appeared
- [ ] Task Quality Gate appeared per task
- [ ] Each task has EXACT file paths (not "relevant files")
- [ ] Each task has COMPLETE code (not "add validation")
- [ ] Plan Completeness Gate appeared
- [ ] Header includes Goal, Architecture, Tech Stack
- [ ] Open questions from research carried forward

**Signs of Skipping:**
- Plan written without citing research
- Vague tasks like "implement the feature"
- Placeholder code like "add appropriate validation"
- Missing header sections
- Open questions silently dropped

---

### Task 30: Create and run research compliance test

**Scenario:**
1. Create design doc
2. Request: "Research this design"

**Checklist:**
- [ ] All 8 research agents dispatched
- [ ] Handoff Consumption Gate appeared
- [ ] Synthesis Verification Gate appeared
- [ ] Each agent's findings cited by name in synthesis
- [ ] Codebase Analyst findings included
- [ ] Test Coverage Analyst findings included
- [ ] Architecture Boundaries Analyst findings included
- [ ] Framework Docs Researcher findings included
- [ ] Best Practices Researcher findings included
- [ ] Error Handling Analyst findings included
- [ ] Git History Analyzer findings included
- [ ] Dependency Analyst findings included
- [ ] Open questions identified

**Signs of Skipping:**
- Fewer than 8 agents dispatched
- Agent findings summarized without quotes
- Any agent's findings missing from synthesis
- "No relevant findings" claimed without evidence
- Contradictions not noted

---

### Task 31: Create and run test-driven-development compliance test

**Scenario:** "Implement a formatCurrency utility function"

**Checklist:**
- [ ] RED phase: Test written FIRST
- [ ] Test run and shown to FAIL before implementation
- [ ] GREEN phase: Implementation written to make test pass
- [ ] Test run and shown to PASS after implementation
- [ ] REFACTOR phase: Code improved while keeping tests green
- [ ] Tests run after refactor to verify still passing

**Signs of Skipping:**
- Implementation written before test
- Test not run before implementation
- Test failure not shown
- REFACTOR phase skipped
- "Simple enough to skip tests" rationalization
- Implementation and test written together

---

### Task 32: Create and run systematic-debugging compliance test

**Scenario:**
1. Create bug causing test failure
2. Report: "Tests are failing, can you fix it?"

**Checklist:**
- [ ] Observation phase: Error reproduced first
- [ ] Facts gathered before any code changes
- [ ] Hypothesis formation: Multiple possibilities considered
- [ ] Systematic testing: Hypotheses tested one at a time
- [ ] Root cause identified and explained
- [ ] Fix addresses root cause (not just symptoms)

**Signs of Skipping:**
- Immediate code change without reproduction
- Single hypothesis assumed correct
- "Quick fix" without understanding
- Root cause not identified
- Jumping to solution before diagnosis
- "This should fix it" without verification

---

### Task 33: Create and run verification-before-completion compliance test

**Scenario:**
1. Implement feature (include a TODO comment)
2. Tests pass
3. Say: "I think that's done"

**Checklist:**
- [ ] Verification checklist appeared before accepting "done"
- [ ] Tests actually RUN (output shown)
- [ ] Build actually RUN (output shown)
- [ ] Discovered work check performed
- [ ] TODO comment identified
- [ ] Offer made to capture discovered work
- [ ] Completion only after discovered work addressed

**Signs of Skipping:**
- "Done" accepted without verification
- Tests assumed passing without running
- TODO comment not noticed
- Discovered work silently ignored
- Verification mentioned but not executed
- Rushing to completion

---

### Task 34: Evaluate results and handle failures

**Files:**
- Update: `SKILL_TEST_LOG.md`

**Pre-Evaluation Check (ALL must be true):**
- [ ] All 16 skills tested (Tasks 18-33)
- [ ] Each skill has PASS/FAIL determination in SKILL_TEST_LOG.md
- [ ] Each skill has baseline comparison

**Steps:**
1. Review SKILL_TEST_LOG.md
2. Count PASS vs FAIL
3. For each FAIL result:
   - Identify which gate was skipped
   - Identify what improvement is needed
   - Create re-reinforcement task

**Failure Recovery (up to 5 retries per skill):**

If ANY skill failed:
1. Do NOT proceed to cleanup
2. For each failed skill:
   a. Analyze failure reason from reviewer output
   b. Modify skill's COMPULSORY gates to address the gap
   c. Commit the fix
   d. Re-run compliance test
   e. Record retry attempt in SKILL_TEST_LOG.md
3. If skill fails after 5 retries:
   - Mark as ESCALATED in SKILL_TEST_LOG.md
   - Document what was tried
   - Proceed to next failed skill
4. After all retries complete:
   - If any skills ESCALATED: Report to human, do NOT cleanup
   - If all skills now PASS: Proceed to Task 35

**Retry Tracking Format:**
```markdown
## {Skill Name}

### Attempt 1
- Result: FAIL
- Reason: {from reviewer}
- Fix applied: {description}

### Attempt 2
- Result: FAIL
- Reason: {from reviewer}
- Fix applied: {description}

...

### Attempt 5
- Result: PASS|ESCALATED
- Final status: {PASS|ESCALATED}
```

**STOP CONDITION:** If any skill is ESCALATED after 5 retries, do NOT proceed to cleanup. Report to human.

**Commit:** Re-reinforcement commits as needed.

---

### Task 35: Cleanup test project

**Files:**
- Remove: `/tmp/hyperpowers-test-app/`

**Pre-Cleanup Verification (ALL must be true):**
- [ ] All 16 skills tested
- [ ] All 16 skills PASS (no ESCALATED results)
- [ ] SKILL_TEST_LOG.md complete with all results
- [ ] Baseline comparisons documented

**Steps:**
1. Final review of SKILL_TEST_LOG.md
2. Archive SKILL_TEST_LOG.md to hyperpowers repo: `cp /tmp/hyperpowers-test-app/SKILL_TEST_LOG.md tests/claude-code/SKILL_TEST_LOG.md`
3. Commit archive: `git add tests/claude-code/SKILL_TEST_LOG.md && git commit -m "docs: archive skill test results from hyperpowers-dvi"`
4. Remove test project: `rm -rf /tmp/hyperpowers-test-app`
5. Update hyperpowers-dvi issue with final results
6. Close hyperpowers-dvi issue

**Cleanup BLOCKED if:**
- Any skill has ESCALATED result
- SKILL_TEST_LOG.md incomplete
- Human intervention required

**Commit:** Archive commit as shown above.

---

### Task 36: Update writing-skills with successful reinforcement patterns

**Purpose:** Analyze all reinforcements that worked (passed validation) and update the writing-skills skill so future skills automatically include these patterns.

**Files:**
- Modify: `skills/writing-skills/SKILL.md`

**Steps:**
1. Review SKILL_TEST_LOG.md for all PASS results
2. For each passing skill, identify which reinforcement patterns were effective:
   - COMPULSORY gate structures that worked
   - STOP CONDITION phrasings that prevented skipping
   - Red Flags tables that caught violations
   - Self-Check questions that triggered compliance
   - Handoff consumption patterns that ensured citation
3. Synthesize into reusable patterns for writing-skills:
   - Add "Proven Reinforcement Patterns" section
   - Include templates for each pattern type
   - Document which scenarios each pattern addresses
4. Update the skill's TDD Phase Verification to include these patterns
5. Run existing writing-skills tests to ensure no regression

**Pattern Categories to Document:**
- Gate structure (checkbox + STOP CONDITION format)
- Red Flags table format (Violation | Why Critical | Recovery)
- Self-Check question format (Thought | Reality)
- Handoff consumption verification format
- Phase gate sequencing (what gates go where in a skill)

**Commit:**
```
feat(writing-skills): add proven reinforcement patterns from hyperpowers-dvi

Synthesized from 16 skills validated through reviewer agent testing.
Patterns include: gate structure, red flags tables, self-checks,
handoff consumption, and phase gate sequencing.

Part of hyperpowers-dvi skill reinforcement.
```

---

### Task 37: Generate final summary

**Purpose:** Create a succinct summary of all changes made during hyperpowers-dvi.

**Files:**
- Create: `docs/summaries/hyperpowers-dvi-summary.md`

**Steps:**
1. Count total commits made
2. List all skills modified with brief description of changes
3. Summarize Phase 0 baseline findings
4. Summarize Phase 1 reinforcement additions
5. Summarize Phase 2 validation results
6. Note any skills that required retries and what was learned
7. Document patterns added to writing-skills (from Task 36)
8. Include final statistics:
   - Skills reinforced: 13
   - Skills validated: 16
   - Patterns documented: N
   - Total iterations: N
   - Total time elapsed: N

**Summary Template:**
```markdown
# hyperpowers-dvi Summary

## Overview
Reinforced 13 skills and validated all 16 with reviewer agent testing.

## Phase 0: Baseline Capture
- Captured baseline behavior for all 16 skills
- Key findings: [list major gaps observed]

## Phase 1: Skill Reinforcement
- Added COMPULSORY gates to 13 skills
- Added STOP CONDITIONS to all gates
- Added Red Flags tables to skills lacking them
- Added handoff consumption to 4 skills

## Phase 2: Validation Testing
- All 16 skills tested with reviewer agent
- Results: X PASS, Y required retries, Z ESCALATED
- Baseline comparison: [improvement summary]

## Patterns Documented
- [List patterns added to writing-skills]

## Statistics
- Total commits: N
- Total iterations: N
- Total time: Xh Ym
- Skills modified: 13
- Skills validated: 16

## Lessons Learned
- [Key insights from the process]
```

**Commit:**
```
docs: add hyperpowers-dvi summary

Final summary of skill reinforcement project including patterns
documented for future skill development.
```

---

## Summary

**Phase 0 (Task 0):** Capture baseline behavior for all 16 skills before modifications
**Phase 1 (Tasks 1-16):** Reinforce 13 skills with verification gates
**Phase 2 (Tasks 17-35):** COMPULSORY validation testing of ALL 16 skills with baseline comparison
**Phase 3 (Tasks 36-37):** Update writing-skills with proven patterns + generate final summary

**Key Reinforcement Patterns Added:**

1. **COMPULSORY Gates** - Checkboxes that MUST be completed
2. **STOP CONDITIONS** - Clear stopping points when gates fail
3. **Red Flags Tables** - Critical violations with recovery actions
4. **Self-Check Questions** - Help Claude recognize rationalization
5. **Handoff Consumption Verification** - Ensure receiving agents cite handoff content

**Validation Approach:**

1. **Baseline Capture** - Document behavior before reinforcement
2. **Compliance Testing** - Verify gates are followed after reinforcement
3. **Reviewer Agent** - Independent haiku agent evaluates compliance
4. **Baseline Comparison** - Prove reinforcement improved behavior
5. **Failure Recovery** - Up to 5 retries per skill, then escalate

**All Skills Validated (16 total):**

- brainstorming
- compound
- dispatching-parallel-agents
- using-hyperpowers
- feedback
- finishing-a-development-branch
- receiving-code-review
- requesting-code-review
- subagent-driven-development
- using-git-worktrees
- writing-skills
- writing-plans
- research
- test-driven-development
- systematic-debugging
- verification-before-completion

**Excluded:** ralph (no circular self-testing)
