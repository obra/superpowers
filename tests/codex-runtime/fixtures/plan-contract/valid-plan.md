# Plan Contract Fixture

**Workflow State:** Engineering Approved
**Plan Revision:** 1
**Execution Mode:** none
**Source Spec:** `docs/featureforge/specs/2026-03-22-plan-contract-fixture-design.md`
**Source Spec Revision:** 1
**Last Reviewed By:** plan-eng-review

## Requirement Coverage Matrix

- REQ-001 -> Task 1
- REQ-002 -> Task 1
- REQ-003 -> Task 2, Task 3
- DEC-001 -> Task 1
- NONGOAL-001 -> Task 3
- VERIFY-001 -> Task 2, Task 3

## Execution Strategy

- Execute Task 1 serially. It establishes the contract surface before packet-backed execution splits into lane-owned work.
- After Task 1, create two worktrees and run Tasks 2 and 3 in parallel:
  - Task 2 owns the CLI and packaged-binary surfaces for packet-backed execution.
  - Task 3 owns the prompt and shell-proof surfaces for packet-backed execution.

## Dependency Diagram

```text
Task 1
  |
  +--> Task 2
  |
  +--> Task 3
```

## Task 1: Establish the plan contract

**Spec Coverage:** REQ-001, REQ-002, DEC-001
**Task Outcome:** The plan contract is represented as canonical traceability blocks that preserve exact approved wording.
**Plan Constraints:**
- Preserve exact approved statements instead of paraphrasing them.
- Keep markdown authoritative and fail closed on malformed structure.
**Open Questions:** none

**Files:**
- Create: `bin/featureforge`
- Modify: `skills/writing-plans/SKILL.md`
- Test: `cargo test --test contracts_spec_plan`

- [ ] **Step 1: Parse the source requirement index**
- [ ] **Step 2: Validate the coverage matrix against the indexed requirements**

## Task 2: Dispatch exact packet-backed execution

**Spec Coverage:** REQ-003, VERIFY-001
**Task Outcome:** The CLI and packaged binary surfaces emit exact task packets backed by approved artifacts and schema-readable evidence.
**Plan Constraints:**
- Do not invent controller-authored summary context.
- Keep the CLI and packaged binary surfaces lane-owned and disjoint from prompt or shell-proof work.
**Open Questions:** none

**Files:**
- Create: `bin/prebuilt/windows-x64/featureforge.exe`
- Modify: `src/cli/plan_contract.rs`
- Test: `tests/contracts_spec_plan.rs`

- [ ] **Step 1: Build canonical task packets**
- [ ] **Step 2: Emit schema-readable evidence for the packet-backed CLI surface**

## Task 3: Prove packet-backed execution handoffs

**Spec Coverage:** REQ-003, NONGOAL-001, VERIFY-001
**Task Outcome:** Execution prompts and shell-proof coverage consume exact packet-backed handoffs without controller-authored summaries.
**Plan Constraints:**
- Do not invent controller-authored summary context.
- Keep prompt and shell-proof work disjoint from CLI and packaged-binary ownership.
**Open Questions:** none

**Files:**
- Modify: `skills/subagent-driven-development/implementer-prompt.md`
- Test: `tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh`

- [ ] **Step 1: Consume the canonical task packet in the implementer prompt**
- [ ] **Step 2: Prove the shell handoff stays packet-backed end to end**
