# Execution Evidence: 2026-03-21-using-superpowers-bypass

**Plan Path:** docs/superpowers/plans/2026-03-21-using-superpowers-bypass.md
**Plan Revision:** 1

## Step Evidence

### Task 1 Step 1
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-21T15:38:40Z
**Execution Source:** superpowers:executing-plans
**Claim:** Added red generator and contract assertions for the dedicated using-superpowers bootstrap
**Files:**
- None (no repo file changed)
**Verification:**
- Manual inspection only: Inspected the new test cases in gen-skill-docs.unit.test.mjs and skill-doc-contracts.test.mjs.
**Invalidation Reason:** N/A

### Task 1 Step 2
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-21T15:39:03Z
**Execution Source:** superpowers:executing-plans
**Claim:** Ran the Task 1 red test command and confirmed the bootstrap contract currently fails
**Files:**
- None (no repo file changed)
**Verification:**
- `node --test tests/codex-runtime/gen-skill-docs.unit.test.mjs tests/codex-runtime/skill-doc-contracts.test.mjs` -> failed as expected: missing bypass helper exports and using-superpowers still uses the shared preamble
**Invalidation Reason:** N/A

### Task 1 Step 3
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-21T15:41:31Z
**Execution Source:** superpowers:executing-plans
**Claim:** Implemented dedicated using-superpowers shell-line and bypass-gate builders in the skill-doc generator
**Files:**
- scripts/gen-skill-docs.mjs
- tests/codex-runtime/gen-skill-docs.unit.test.mjs
- tests/codex-runtime/skill-doc-contracts.test.mjs
**Verification:**
- Manual inspection only: Inspected the new generator exports and red tests covering the dedicated bootstrap contract.
**Invalidation Reason:** N/A

### Task 1 Step 4
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-21T15:41:49Z
**Execution Source:** superpowers:executing-plans
**Claim:** Wired BASE_PREAMBLE rendering so using-superpowers resolves through its dedicated bootstrap path
**Files:**
- scripts/gen-skill-docs.mjs
- skills/using-superpowers/SKILL.md
**Verification:**
- Manual inspection only: Regenerated skills and confirmed the on-disk using-superpowers preamble now derives the session decision path without session markers or contributor state.
**Invalidation Reason:** N/A

### Task 1 Step 5
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-21T15:42:05Z
**Execution Source:** superpowers:executing-plans
**Claim:** Re-ran the focused generator and contract tests and confirmed the dedicated using-superpowers bootstrap passes
**Files:**
- scripts/gen-skill-docs.mjs
- skills/using-superpowers/SKILL.md
- tests/codex-runtime/gen-skill-docs.unit.test.mjs
- tests/codex-runtime/skill-doc-contracts.test.mjs
**Verification:**
- `node --test tests/codex-runtime/gen-skill-docs.unit.test.mjs tests/codex-runtime/skill-doc-contracts.test.mjs` -> passed
**Invalidation Reason:** N/A

### Task 1 Step 6
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-21T15:42:41Z
**Execution Source:** superpowers:executing-plans
**Claim:** Committed the Task 1 dedicated bootstrap foundation
**Files:**
- None (no repo file changed)
**Verification:**
- Manual inspection only: Created commit 942be7d with the generator/bootstrap changes and matching execution evidence.
**Invalidation Reason:** N/A

### Task 2 Step 1
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-21T15:43:32Z
**Execution Source:** superpowers:executing-plans
**Claim:** Added red runtime-instructions assertions for the using-superpowers bypass gate wording
**Files:**
- tests/codex-runtime/test-runtime-instructions.sh
**Verification:**
- Manual inspection only: Inspected the new using-superpowers runtime-instructions patterns for the opt-out gate, decision path, and malformed-state wording.
**Invalidation Reason:** N/A

### Task 2 Step 2
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-21T15:44:12Z
**Execution Source:** superpowers:executing-plans
**Claim:** Ran the runtime-instructions contract check and confirmed the bypass-gate wording is still missing
**Files:**
- None (no repo file changed)
**Verification:**
- `bash tests/codex-runtime/test-runtime-instructions.sh` -> failed as expected: using-superpowers is missing the new bypass-gate wording
**Invalidation Reason:** N/A

### Task 2 Step 3
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-21T15:45:05Z
**Execution Source:** superpowers:executing-plans
**Claim:** Updated the using-superpowers template to include the generator-owned bypass gate contract
**Files:**
- scripts/gen-skill-docs.mjs
- skills/using-superpowers/SKILL.md.tmpl
**Verification:**
- Manual inspection only: Confirmed the template now includes the bypass-gate placeholder and the generator helper emits the required wording.
**Invalidation Reason:** N/A

### Task 2 Step 4
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-21T15:46:14Z
**Execution Source:** superpowers:executing-plans
**Claim:** Regenerated the using-superpowers skill doc from the updated template and generator
**Files:**
- scripts/gen-skill-docs.mjs
- skills/using-superpowers/SKILL.md
- skills/using-superpowers/SKILL.md.tmpl
**Verification:**
- Manual inspection only: Ran node scripts/gen-skill-docs.mjs and inspected the generated using-superpowers SKILL.md output.
**Invalidation Reason:** N/A

### Task 2 Step 5
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-21T15:46:33Z
**Execution Source:** superpowers:executing-plans
**Claim:** Aligned runtime-facing docs with the using-superpowers session bypass gate
**Files:**
- README.md
- docs/README.codex.md
- docs/README.copilot.md
- tests/codex-runtime/skill-doc-contracts.test.mjs
**Verification:**
- Manual inspection only: Updated the README surfaces and the generated-doc contract test to describe the gated entry router instead of unconditional takeover.
**Invalidation Reason:** N/A

### Task 2 Step 6
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-21T15:47:07Z
**Execution Source:** superpowers:executing-plans
**Claim:** Re-ran the freshness and runtime-instructions checks and confirmed the bypass-gate wording passes
**Files:**
- README.md
- docs/README.codex.md
- docs/README.copilot.md
- skills/using-superpowers/SKILL.md
- skills/using-superpowers/SKILL.md.tmpl
- tests/codex-runtime/skill-doc-contracts.test.mjs
- tests/codex-runtime/test-runtime-instructions.sh
**Verification:**
- Manual inspection only: node scripts/gen-skill-docs.mjs --check and bash tests/codex-runtime/test-runtime-instructions.sh both passed.
**Invalidation Reason:** N/A

### Task 2 Step 7
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-21T15:47:42Z
**Execution Source:** superpowers:executing-plans
**Claim:** Committed the Task 2 bypass-gate contract and doc alignment slice
**Files:**
- None (no repo file changed)
**Verification:**
- Manual inspection only: Created commit f6efe11 with the bypass-gate template, generated doc, runtime-doc, and contract-test updates.
**Invalidation Reason:** N/A

### Task 3 Step 1
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-21T15:48:44Z
**Execution Source:** superpowers:executing-plans
**Claim:** Added a red shell regression scaffold for the using-superpowers bypass contract
**Files:**
- tests/codex-runtime/test-using-superpowers-bypass.sh
**Verification:**
- Manual inspection only: Inspected the new shell scaffold and confirmed it asserts the decision path, enabled/bypassed states, malformed state, and re-entry write-failure wording.
**Invalidation Reason:** N/A

### Task 3 Step 2
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-21T15:49:15Z
**Execution Source:** superpowers:executing-plans
**Claim:** Ran the new shell regression and confirmed the re-entry write-failure contract is still missing
**Files:**
- None (no repo file changed)
**Verification:**
- `bash tests/codex-runtime/test-using-superpowers-bypass.sh` -> failed as expected: generated using-superpowers doc is missing the re-entry write-failure wording
**Invalidation Reason:** N/A

### Task 3 Step 3
#### Attempt 1
**Status:** Invalidated
**Recorded At:** 2026-03-21T15:57:02Z
**Execution Source:** superpowers:executing-plans
**Claim:** Implemented the minimum generated-contract assertions and shell harness support needed for deterministic bypass regression coverage without adding a new helper binary.
**Files:**
- None (no repo file changed)
**Verification:**
- Manual inspection only: Confirmed the generated using-superpowers contract includes the decision-state and explicit re-entry failure wording, and the focused shell regression now passes after creating the temp decision directory before fixture writes.
**Invalidation Reason:** Final review found the bypass re-entry contract drifted from the approved spec: naming a Superpowers skill does not currently count as explicit re-entry in the generated instructions or regression coverage.

#### Attempt 2
**Status:** Completed
**Recorded At:** 2026-03-21T15:58:41Z
**Execution Source:** superpowers:executing-plans
**Claim:** Corrected the bypass re-entry contract so explicitly naming a Superpowers skill counts as re-entry, and updated the generator-owned assertions accordingly.
**Files:**
- None (no repo file changed)
**Verification:**
- Manual inspection only: Red checks failed on the missing named-skill wording, then passed after updating scripts/gen-skill-docs.mjs, regenerating skills/using-superpowers/SKILL.md, and rerunning the focused contract tests.
**Invalidation Reason:** N/A

### Task 3 Step 4
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-21T15:53:37Z
**Execution Source:** superpowers:executing-plans
**Claim:** Re-ran the focused using-superpowers bypass regression and confirmed the state-machine coverage passes.
**Files:**
- None (no repo file changed)
**Verification:**
- `bash tests/codex-runtime/test-using-superpowers-bypass.sh` -> PASS
**Invalidation Reason:** N/A

### Task 3 Step 5
#### Attempt 1
**Status:** Invalidated
**Recorded At:** 2026-03-21T15:59:15Z
**Execution Source:** superpowers:executing-plans
**Claim:** Ran the full targeted verification matrix for the using-superpowers bypass changes and confirmed the generator, runtime-contract, and regression coverage all pass.
**Files:**
- None (no repo file changed)
**Verification:**
- Manual inspection only: PASS: node --test tests/codex-runtime/gen-skill-docs.unit.test.mjs tests/codex-runtime/skill-doc-contracts.test.mjs; PASS: bash tests/codex-runtime/test-runtime-instructions.sh; PASS: bash tests/codex-runtime/test-using-superpowers-bypass.sh; PASS: node scripts/gen-skill-docs.mjs --check.
**Invalidation Reason:** Post-review fix changed the generated bypass contract and tests after the previous full verification matrix, so the recorded Step 5 evidence is stale.

#### Attempt 2
**Status:** Completed
**Recorded At:** 2026-03-21T15:59:52Z
**Execution Source:** superpowers:executing-plans
**Claim:** Re-ran the full targeted verification matrix after the review-driven explicit re-entry fix and confirmed the generator, runtime-contract, and regression coverage all pass.
**Files:**
- None (no repo file changed)
**Verification:**
- Manual inspection only: PASS: node --test tests/codex-runtime/gen-skill-docs.unit.test.mjs tests/codex-runtime/skill-doc-contracts.test.mjs; PASS: bash tests/codex-runtime/test-runtime-instructions.sh; PASS: bash tests/codex-runtime/test-using-superpowers-bypass.sh; PASS: node scripts/gen-skill-docs.mjs --check.
**Invalidation Reason:** N/A

### Task 3 Step 6
#### Attempt 1
**Status:** Invalidated
**Recorded At:** 2026-03-21T16:00:05Z
**Execution Source:** superpowers:executing-plans
**Claim:** Applied verification-before-completion by confirming fresh verification evidence and checking that the working tree only contains the intended Task 3 slice plus plan-execution artifacts.
**Files:**
- None (no repo file changed)
**Verification:**
- Manual inspection only: Fresh verification evidence from Step 5 remains current, and git status/diff show only the expected runtime-contract files, the new shell regression, and the plan/evidence tracking updates for this approved slice.
**Invalidation Reason:** Post-review fix changed the working tree after the earlier completion gate, so the Step 6 verification snapshot is stale.

#### Attempt 2
**Status:** Completed
**Recorded At:** 2026-03-21T16:00:34Z
**Execution Source:** superpowers:executing-plans
**Claim:** Re-applied verification-before-completion after the review-driven fix by confirming fresh verification evidence and checking that the working tree only contains the intended follow-up contract/test updates plus plan-execution artifacts.
**Files:**
- None (no repo file changed)
**Verification:**
- Manual inspection only: Fresh verification evidence from the rerun Step 5 is current, and git status/diff show only the expected generator, generated doc, contract-test, shell regression, and plan/evidence tracking changes for the explicit skill-name re-entry fix.
**Invalidation Reason:** N/A

### Task 3 Step 7
#### Attempt 1
**Status:** Invalidated
**Recorded At:** 2026-03-21T16:00:46Z
**Execution Source:** superpowers:executing-plans
**Claim:** Committed the bypass regression coverage, generated-contract wording updates, and execution tracking artifacts.
**Files:**
- None (no repo file changed)
**Verification:**
- Manual inspection only: Created commit a6af020 (test: cover using-superpowers bypass state machine).
**Invalidation Reason:** Post-review fix changed the generator, generated skill doc, and regression tests after the previous Step 7 commit, so the recorded commit step is stale.

#### Attempt 2
**Status:** Completed
**Recorded At:** 2026-03-21T16:01:16Z
**Execution Source:** superpowers:executing-plans
**Claim:** Committed the review-driven explicit skill-name re-entry fix, updated regression coverage, and refreshed execution tracking artifacts.
**Files:**
- None (no repo file changed)
**Verification:**
- Manual inspection only: Created commit c7a5156 (test: cover explicit skill re-entry in bypass gate).
**Invalidation Reason:** N/A
