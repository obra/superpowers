# Task 9: Tier 3 — E2E Chain C + Top-Level Runner

**Specialist:** test-writer-3
**Depends on:** Task 3 (pressure test infrastructure), Tasks 1-8 (for top-level runner integration)
**Produces:** Chain C test, workflow-chains `run-all.sh`, pressure-tests `run-all.sh` finalization, top-level `run-all-tests.sh`

## Goal

Create the cold-resume E2E chain test and the top-level test orchestrator that runs all 3 tiers.

## Acceptance Criteria

- [ ] Chain C test in `tests/workflow-chains/chain-c-cold-resume/`
- [ ] `tests/workflow-chains/run-all.sh` runs all 3 chain tests
- [ ] `tests/run-all-tests.sh` orchestrates Tier 1, Tier 2, and Tier 3 with summary
- [ ] Chain C verifies: cold resume from partial state → verification → finishing
- [ ] Top-level runner reports per-tier pass/fail counts

## Test Expectations

### Chain C — Cold Resume + Error

- **Test:** Resume from partial state.yml (tasks 1-3 complete, 4 incomplete), hit plan error, escalate, then finish
- **Expected red failure:** grep for resume behavior fails — agent restarts from task 1 or doesn't detect error
- **Expected green:** Agent reads state.yml, skips tasks 1-3, resumes task 4, discovers error, escalates, then finishing presents options

### Top-Level Runner

- **Test:** `run-all-tests.sh` exits 0 when all sub-runners pass, non-zero if any fail
- **Expected red failure:** Runner exits 0 even when sub-tests fail (bad error propagation)
- **Expected green:** Runner shows per-tier summary, exits non-zero on any failure

## Files

- Create: `tests/workflow-chains/chain-c-cold-resume/run-chain.sh`
- Create: `tests/workflow-chains/chain-c-cold-resume/fixtures/state.yml` (partial completion)
- Create: `tests/workflow-chains/chain-c-cold-resume/fixtures/plan.md` (plan with error in task 4)
- Create: `tests/workflow-chains/chain-c-cold-resume/fixtures/project-scaffold/`
- Create: `tests/workflow-chains/run-all.sh`
- Create: `tests/run-all-tests.sh`

## Implementation Notes

### Chain C — Cold Resume (~15 min expected runtime)

**Setup:**
1. Create a temp project (Node.js) with some implemented files (tasks 1-3 "done")
2. Pre-create `.superpowers/state.yml` with:
   ```yaml
   phase: executing
   plan:
     path: docs/plans/feature/plan.md
     status: executing
     tasks:
       1: { status: completed }
       2: { status: completed }
       3: { status: completed }
       4: { status: in-progress }
   ```
3. Pre-create a plan where task 4 references a file that doesn't exist (will trigger error detection)
4. Pre-create source files for tasks 1-3 (so they look "done")

**Prompt:** "Resume execution of the implementation plan. We were in the middle of task 4."

**Verification checkpoints:**
1. Agent reads state.yml and identifies task 4 as the resume point
2. Agent does NOT re-execute tasks 1-3
3. Agent discovers plan error in task 4 (nonexistent file reference)
4. Agent escalates to user (stops, reports, doesn't brute-force)
5. If prompted to finish, verification skill checks and finishing presents options

**Key handoff:** Partial state.yml → executing-plans resume → error detection → escalation → verification → finishing

### Top-Level Runner (`run-all-tests.sh`)

**Design:**
```bash
#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "============================================"
echo " Superpowers Test Suite"
echo "============================================"
echo ""

TIER1_PASS=0; TIER1_FAIL=0
TIER2_PASS=0; TIER2_FAIL=0
TIER3_PASS=0; TIER3_FAIL=0

# Tier 1: Triggering + Explicit
echo "=== Tier 1: Skill Triggering ==="
# Run skill-triggering/run-all.sh, capture results
# Run explicit-skill-requests/run-all.sh, capture results

# Tier 2: Pressure Tests
echo "=== Tier 2: Pressure/Behavior Tests ==="
# Run pressure-tests/run-all.sh, capture results

# Tier 3: E2E Chains
echo "=== Tier 3: Workflow Chain Tests ==="
# Run workflow-chains/run-all.sh, capture results

# Summary
echo "============================================"
echo " Summary"
echo "============================================"
echo "Tier 1 (Triggering):  $TIER1_PASS passed, $TIER1_FAIL failed"
echo "Tier 2 (Pressure):    $TIER2_PASS passed, $TIER2_FAIL failed"
echo "Tier 3 (E2E Chains):  $TIER3_PASS passed, $TIER3_FAIL failed"

TOTAL_FAIL=$((TIER1_FAIL + TIER2_FAIL + TIER3_FAIL))
exit $TOTAL_FAIL
```

**Features:**
- Runs all tiers sequentially (Tier 1 → 2 → 3)
- Captures pass/fail counts from each sub-runner
- Reports per-tier and total summary
- Exits non-zero if any test fails
- Supports `--tier N` flag to run only a specific tier (optional convenience)

### `workflow-chains/run-all.sh`

Discovers and runs `run-chain.sh` in each chain subdirectory:
```bash
for chain_dir in "$SCRIPT_DIR"/chain-*/; do
    "$chain_dir/run-chain.sh"
done
```

### Timeout

Chain C: Use `timeout 1200` (20 min). Top-level runner: no global timeout (individual tests have their own).

## Commit

`test: add E2E chain C (cold resume) and top-level test runner`
