# Task 8: Tier 3 — E2E Workflow Chains A + B

**Specialist:** test-writer-2
**Depends on:** Task 3 (pressure test infrastructure for helpers)
**Produces:** 2 E2E chain test scripts in `tests/workflow-chains/`

## Goal

Create two end-to-end workflow chain tests that verify multi-skill handoffs work correctly through complete lifecycle flows.

## Acceptance Criteria

- [ ] Chain A test in `tests/workflow-chains/chain-a-team-lifecycle/`
- [ ] Chain B test in `tests/workflow-chains/chain-b-solo-lifecycle/`
- [ ] Each chain creates a small real project, runs Claude headless, and verifies skill invocation order + state.yml contents
- [ ] Chain A verifies: brainstorming → writing-plans → agent-team → finishing
- [ ] Chain B verifies: brainstorming → writing-plans → subagent-driven → finishing
- [ ] Handoff state checked at each transition (design.approved, plan.status, etc.)

## Test Expectations

### Chain A — Team Lifecycle

- **Test:** Full team flow from idea to finishing
- **Expected red failure:** grep for skill order in JSONL fails — skills invoked out of order or missing
- **Expected green:** JSONL shows brainstorming → writing-plans → agent-team-driven-development → finishing-a-development-branch in sequence; state.yml transitions through phases

### Chain B — Solo Lifecycle

- **Test:** Full solo flow from idea to finishing
- **Expected red failure:** grep for skill order in JSONL fails — wrong execution skill chosen
- **Expected green:** JSONL shows brainstorming → writing-plans → subagent-driven-development → finishing in sequence; team fitness check correctly chose serial path

## Files

- Create: `tests/workflow-chains/chain-a-team-lifecycle/run-chain.sh`
- Create: `tests/workflow-chains/chain-a-team-lifecycle/fixtures/design.md`
- Create: `tests/workflow-chains/chain-a-team-lifecycle/fixtures/project-scaffold/` (minimal project)
- Create: `tests/workflow-chains/chain-b-solo-lifecycle/run-chain.sh`
- Create: `tests/workflow-chains/chain-b-solo-lifecycle/fixtures/design.md`
- Create: `tests/workflow-chains/chain-b-solo-lifecycle/fixtures/project-scaffold/` (minimal project)

## Implementation Notes

### Chain A — Team Lifecycle (~30 min expected runtime)

**Setup:**
1. Create a temp project with 2-3 source files (Node.js)
2. Pre-write a design document that describes 6+ tasks across 2+ specialist domains (to trigger team fitness → team execution)
3. Create `.superpowers/state.yml` with `phase: brainstorming` and `design.approved: true`
4. The design should be complex enough that team execution is warranted (frontend + backend tasks)

**Prompt:** "I've reviewed and approved the design. Let's create the implementation plan and execute it with a team."

**Verification checkpoints:**
1. Skill order: brainstorming (if re-invoked) → writing-plans → agent-team-driven-development → finishing
2. After writing-plans: `state.yml` has `plan.status: pending`
3. During execution: Agent tool invocations present (subagents dispatched)
4. After execution: `plan.status: executed` or all tasks marked complete
5. Finishing: Agent presents options (merge/PR/park/discard)

**Key handoff:** `design.approved: true` → plan written with wave analysis → team execution with pipelined TDD → finishing presents options

### Chain B — Solo Lifecycle (~20 min expected runtime)

**Setup:**
1. Create a temp project (Node.js)
2. Pre-write a design document with 3 tasks in a single domain (all backend, tightly coupled)
3. Create `.superpowers/state.yml` with `phase: brainstorming` and `design.approved: true`
4. The design should trigger team fitness → serial (1 specialist, tightly coupled tasks)

**Prompt:** "Design is approved. Let's plan and execute this."

**Verification:**
1. Team Fitness Check produces serial recommendation (or subagent-driven chosen)
2. Skill order: writing-plans → subagent-driven-development → finishing
3. Each task runs with solo TDD (test first, then implement)
4. State.yml updated throughout

### JSONL Parsing

Use the same pattern as existing tests:
```bash
# Check skill invocation order
SKILLS_IN_ORDER=$(grep '"name":"Skill"' "$SESSION_FILE" | grep -o '"skill":"[^"]*"' | sed 's/"skill":"//;s/"//')
```

Verify ordering with `assert_order` from `test-helpers.sh`.

### Fixtures

Keep fixture projects minimal — just enough files to make the scenario realistic:
- `package.json` with name and test script
- 1-2 source files
- Pre-written design.md with clear tasks

### Timeout

These are long-running tests. Use `timeout 2400` (40 min) for Chain A, `timeout 1800` (30 min) for Chain B.

## Commit

`test: add E2E workflow chain tests for team (A) and solo (B) lifecycles`
