# Plan Contract Fixture

**Workflow State:** Engineering Approved
**Plan Revision:** 1
**Execution Mode:** none
**Source Spec:** `docs/superpowers/specs/2026-03-22-plan-contract-fixture-design.md`
**Source Spec Revision:** 1
**Last Reviewed By:** plan-eng-review

## Requirement Coverage Matrix

- REQ-001 -> Task 1
- REQ-002 -> Task 1
- REQ-003 -> Task 2
- DEC-001 -> Task 1
- NONGOAL-001 -> Task 2
- VERIFY-001 -> Task 2

## Task 1: Establish the plan contract

**Spec Coverage:** REQ-001, REQ-002, DEC-001
**Task Outcome:** The plan contract is represented as canonical traceability blocks that preserve exact approved wording.
**Plan Constraints:**
- Preserve exact approved statements instead of paraphrasing them.
- Keep markdown authoritative and fail closed on malformed structure.
**Open Questions:** none

**Files:**
- Create: `bin/superpowers-plan-contract`
- Modify: `skills/writing-plans/SKILL.md`
- Test: `tests/codex-runtime/test-superpowers-plan-contract.sh`

- [ ] **Step 1: Parse the source requirement index**
- [ ] **Step 2: Validate the coverage matrix against the indexed requirements**

## Task 2: Dispatch exact packet-backed execution

**Spec Coverage:** REQ-003, NONGOAL-001, VERIFY-001
**Task Outcome:** Execution and review should consume a derived `superpowers-plan-contract` helper that lints traceability and builds canonical task packets.
**Plan Constraints:**
- Do not invent controller-authored summary context.
- Reject malformed file scope and normalized path traversal.
**Open Questions:** none

**Files:**
- Create: `bin/superpowers-plan-contract.ps1`
- Modify: `skills/subagent-driven-development/implementer-prompt.md`
- Test: `tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh`

- [ ] **Step 1: Build canonical task packets**
- [ ] **Step 2: Rebuild stale packets from the current approved artifacts**
