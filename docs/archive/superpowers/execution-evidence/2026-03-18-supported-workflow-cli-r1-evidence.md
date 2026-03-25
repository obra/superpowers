# Execution Evidence: 2026-03-18-supported-workflow-cli

**Plan Path:** docs/superpowers/plans/2026-03-18-supported-workflow-cli.md
**Plan Revision:** 1

## Step Evidence

### Task 1 Step 1
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-18T12:34:17Z
**Execution Source:** superpowers:executing-plans
**Claim:** Added the initial failing public CLI regression scaffold.
**Files:**
- tests/codex-runtime/test-superpowers-workflow.sh
**Verification:**
- Manual inspection only: Created the scaffolded shell test and confirmed it targets the missing public CLI binary.
**Invalidation Reason:** N/A

### Task 1 Step 2
#### Attempt 1
**Status:** Invalidated
**Recorded At:** 2026-03-18T12:42:46Z
**Execution Source:** superpowers:executing-plans
**Claim:** Ran the new public CLI scaffold test and observed the expected missing-binary failure.
**Files:**
- None (no repo file changed)
**Verification:**
- Manual inspection only: bash tests/codex-runtime/test-superpowers-workflow.sh failed because bin/superpowers-workflow does not exist yet.
**Invalidation Reason:** Step 2 was checked before the non-mutation scaffolding was actually added.

#### Attempt 2
**Status:** Completed
**Recorded At:** 2026-03-18T12:43:32Z
**Execution Source:** superpowers:executing-plans
**Claim:** Added red non-mutation coverage scaffolding for manifest and repo-doc stability.
**Files:**
- tests/codex-runtime/test-superpowers-workflow.sh
**Verification:**
- Manual inspection only: Extended the public CLI regression scaffold with explicit no-create, no-backup, no-rewrite, and repo-doc byte-stability cases.
**Invalidation Reason:** N/A

### Task 1 Step 3
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-18T12:42:14Z
**Execution Source:** superpowers:executing-plans
**Claim:** Added red runtime-failure coverage scaffolding for outside-repo, invalid-command, and debug failure-class cases.
**Files:**
- tests/codex-runtime/test-superpowers-workflow.sh
**Verification:**
- Manual inspection only: Extended the public CLI regression scaffold with explicit runtime-failure helper cases while keeping the suite red.
**Invalidation Reason:** N/A

### Task 1 Step 4
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-18T12:44:25Z
**Execution Source:** superpowers:executing-plans
**Claim:** Extended the internal helper regression suite with read-only resolve parity and non-mutation assertions.
**Files:**
- tests/codex-runtime/test-superpowers-workflow-status.sh
**Verification:**
- Manual inspection only: Added red resolve-contract cases for parity, outside-repo failure, and manifest byte-stability.
**Invalidation Reason:** N/A

### Task 1 Step 5
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-18T12:44:57Z
**Execution Source:** superpowers:executing-plans
**Claim:** Added the new public workflow CLI binaries and test suite to the runtime validation inventory.
**Files:**
- tests/codex-runtime/test-runtime-instructions.sh
**Verification:**
- Manual inspection only: Updated the runtime FILES list so repo validation will fail until the new public CLI surfaces exist.
**Invalidation Reason:** N/A

### Task 1 Step 6
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-18T12:47:14Z
**Execution Source:** superpowers:executing-plans
**Claim:** Ran the red checks and confirmed failures for the missing public CLI, missing runtime inventory files, and missing read-only resolve subcommand.
**Files:**
- None (no repo file changed)
**Verification:**
- Manual inspection only: The public suite failed on the absent bin/superpowers-workflow binary, test-runtime-instructions failed on missing workflow CLI files, and a direct workflow-status resolve invocation returned usage text because resolve is not implemented yet.
**Invalidation Reason:** N/A

### Task 1 Step 7
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-18T12:48:18Z
**Execution Source:** superpowers:executing-plans
**Claim:** Committed the red workflow CLI contract coverage baseline.
**Files:**
- docs/superpowers/execution-evidence/2026-03-18-supported-workflow-cli-r1-evidence.md
- docs/superpowers/plans/2026-03-18-supported-workflow-cli.md
- tests/codex-runtime/test-runtime-instructions.sh
- tests/codex-runtime/test-superpowers-workflow-status.sh
- tests/codex-runtime/test-superpowers-workflow.sh
**Verification:**
- Manual inspection only: Committed the red test baseline as dade8d7 with the plan and execution evidence kept in sync.
**Invalidation Reason:** N/A

### Task 2 Step 1
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-18T12:53:15Z
**Execution Source:** superpowers:executing-plans
**Claim:** Refactored workflow-status into clearer read-only versus mutating phases inside the existing helper.
**Files:**
- bin/superpowers-workflow-status
**Verification:**
- Manual inspection only: Split the helper logic so the new resolve path can stay side-effect-free while status/expect/sync keep their write behavior.
**Invalidation Reason:** N/A

### Task 2 Step 2
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-18T12:53:21Z
**Execution Source:** superpowers:executing-plans
**Claim:** Implemented the internal read-only resolve subcommand on superpowers-workflow-status.
**Files:**
- bin/superpowers-workflow-status
**Verification:**
- Manual inspection only: Added cmd_resolve with resolved/runtime_failure JSON output for the public CLI to consume.
**Invalidation Reason:** N/A

### Task 2 Step 3
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-18T12:53:27Z
**Execution Source:** superpowers:executing-plans
**Claim:** Kept the resolve path side-effect-free by using read-only manifest loading and recovery diagnostics only.
**Files:**
- bin/superpowers-workflow-status
**Verification:**
- Manual inspection only: Verified the resolve implementation does not call manifest write or corrupt-manifest backup paths.
**Invalidation Reason:** N/A

### Task 2 Step 4
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-18T12:53:33Z
**Execution Source:** superpowers:executing-plans
**Claim:** Exposed the internal resolve subcommand without changing the supported status, expect, or sync interfaces.
**Files:**
- bin/superpowers-workflow-status
**Verification:**
- Manual inspection only: Updated the command dispatcher and helper usage text to include resolve while preserving existing command behavior.
**Invalidation Reason:** N/A

### Task 2 Step 5
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-18T12:53:39Z
**Execution Source:** superpowers:executing-plans
**Claim:** Preserved the existing mutating helper semantics for status refresh, expect, and sync.
**Files:**
- bin/superpowers-workflow-status
**Verification:**
- Manual inspection only: Kept the current write-and-recover flow intact for existing skill consumers while layering in the new read-only path.
**Invalidation Reason:** N/A

### Task 2 Step 6
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-18T12:53:46Z
**Execution Source:** superpowers:executing-plans
**Claim:** Extended the helper regression suite with deterministic read-only failure-class coverage.
**Files:**
- bin/superpowers-workflow-status
- tests/codex-runtime/test-superpowers-workflow-status.sh
**Verification:**
- Manual inspection only: Added resolve tests for repo-context failure, invalid input, contract-violation failpoint, runtime-failure failpoint, parity, and no-manifest-mutation.
**Invalidation Reason:** N/A

### Task 2 Step 7
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-18T12:53:54Z
**Execution Source:** superpowers:executing-plans
**Claim:** Ran the workflow-status regression suite and confirmed the read-only resolver contract passes.
**Files:**
- bin/superpowers-workflow-status
- tests/codex-runtime/test-superpowers-workflow-status.sh
**Verification:**
- Manual inspection only: bash tests/codex-runtime/test-superpowers-workflow-status.sh passed after the resolve implementation.
**Invalidation Reason:** N/A

### Task 2 Step 8
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-18T12:54:38Z
**Execution Source:** superpowers:executing-plans
**Claim:** Committed the read-only workflow resolver extraction.
**Files:**
- bin/superpowers-workflow-status
- docs/superpowers/execution-evidence/2026-03-18-supported-workflow-cli-r1-evidence.md
- docs/superpowers/plans/2026-03-18-supported-workflow-cli.md
- tests/codex-runtime/test-superpowers-workflow-status.sh
**Verification:**
- Manual inspection only: Committed Task 2 as 47667bf with helper code, resolver coverage, and execution tracking kept in sync.
**Invalidation Reason:** N/A

### Task 3 Step 1
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-18T13:12:31Z
**Execution Source:** superpowers:executing-plans
**Claim:** Added the public workflow CLI parser and shared option handling.
**Files:**
- bin/superpowers-workflow
**Verification:**
- Manual inspection only: Manual inspection only: Added public command parsing, shared debug handling, and centralized resolver dispatch.
**Invalidation Reason:** N/A

### Task 3 Step 2
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-18T13:12:40Z
**Execution Source:** superpowers:executing-plans
**Claim:** Implemented repo-independent help text for the supported public workflow CLI.
**Files:**
- bin/superpowers-workflow
**Verification:**
- Manual inspection only: Manual inspection only: Help now succeeds without repo context and clearly distinguishes the public CLI from the internal helper.
**Invalidation Reason:** N/A

### Task 3 Step 3
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-18T13:12:49Z
**Execution Source:** superpowers:executing-plans
**Claim:** Validated the read-only resolver contract and failed closed on wrapper/runtime errors.
**Files:**
- bin/superpowers-workflow
**Verification:**
- Manual inspection only: Manual inspection only: The public CLI now validates resolver output, classifies wrapper failures, and avoids success-path fallthrough on runtime errors.
**Invalidation Reason:** N/A

### Task 3 Step 4
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-18T13:13:00Z
**Execution Source:** superpowers:executing-plans
**Claim:** Rendered the supported human-facing status, next, artifacts, and explain commands.
**Files:**
- bin/superpowers-workflow
- tests/codex-runtime/test-superpowers-workflow.sh
**Verification:**
- Manual inspection only: Manual inspection only: Added human vocabulary mapping plus renderer coverage for status, next, artifacts, explain, and debug diagnostics.
**Invalidation Reason:** N/A

### Task 3 Step 5
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-18T13:13:11Z
**Execution Source:** superpowers:executing-plans
**Claim:** Kept implementation-ready output at the execution handoff boundary.
**Files:**
- bin/superpowers-workflow
- tests/codex-runtime/test-superpowers-workflow.sh
**Verification:**
- Manual inspection only: Manual inspection only: The public next command stops at approved-plan handoff wording and does not invoke execution recommendation logic.
**Invalidation Reason:** N/A

### Task 3 Step 6
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-18T13:13:22Z
**Execution Source:** superpowers:executing-plans
**Claim:** Implemented debug output without changing the default human contract.
**Files:**
- bin/superpowers-workflow
- tests/codex-runtime/test-superpowers-workflow.sh
**Verification:**
- Manual inspection only: Manual inspection only: Debug mode now exposes resolver outcome, manifest source, and failure class details while the default output stays human-first.
**Invalidation Reason:** N/A

### Task 3 Step 7
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-18T13:13:35Z
**Execution Source:** superpowers:executing-plans
**Claim:** Ran the public workflow CLI regression suite until all supported states and failures passed.
**Files:**
- bin/superpowers-workflow
- bin/superpowers-workflow-status
- tests/codex-runtime/test-superpowers-workflow-status.sh
- tests/codex-runtime/test-superpowers-workflow.sh
**Verification:**
- `bash tests/codex-runtime/test-superpowers-workflow.sh && bash tests/codex-runtime/test-superpowers-workflow-status.sh` -> PASS
**Invalidation Reason:** N/A

### Task 3 Step 8
#### Attempt 1
**Status:** Invalidated
**Recorded At:** 2026-03-18T13:49:08Z
**Execution Source:** superpowers:executing-plans
**Claim:** Committed the public bash workflow CLI implementation.
**Files:**
- bin/superpowers-workflow
- bin/superpowers-workflow-status
- docs/superpowers/execution-evidence/2026-03-18-supported-workflow-cli-r1-evidence.md
- docs/superpowers/plans/2026-03-18-supported-workflow-cli.md
- tests/codex-runtime/test-superpowers-workflow-status.sh
- tests/codex-runtime/test-superpowers-workflow.sh
**Verification:**
- Manual inspection only: Committed Task 3 as f098f34 with the bash CLI, shared resolver refinements, expanded public/runtime coverage, and execution tracking in sync.
**Invalidation Reason:** Public CLI explain output changed after deeper review

#### Attempt 2
**Status:** Completed
**Recorded At:** 2026-03-18T13:49:56Z
**Execution Source:** superpowers:executing-plans
**Claim:** Tightened the public CLI explain rerun hint to use the stable supported command and added regression coverage.
**Files:**
- bin/superpowers-workflow
- tests/codex-runtime/test-superpowers-workflow.sh
**Verification:**
- `bash tests/codex-runtime/test-superpowers-workflow.sh` -> PASS
**Invalidation Reason:** N/A

### Task 4 Step 1
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-18T13:16:55Z
**Execution Source:** superpowers:executing-plans
**Claim:** Added the PowerShell wrapper for the public workflow CLI.
**Files:**
- bin/superpowers-workflow.ps1
**Verification:**
- Manual inspection only: Manual inspection only: Added a PowerShell shim that resolves Git Bash, invokes the public bash CLI, and preserves native exit handling.
**Invalidation Reason:** N/A

### Task 4 Step 2
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-18T13:17:10Z
**Execution Source:** superpowers:executing-plans
**Claim:** Kept JSON path conversion limited to JSON-shaped wrapper output.
**Files:**
- bin/superpowers-workflow.ps1
**Verification:**
- Manual inspection only: Manual inspection only: The wrapper only attempts Windows path conversion when successful output starts with JSON, so normal human workflow text passes through unchanged.
**Invalidation Reason:** N/A

### Task 4 Step 3
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-18T13:17:25Z
**Execution Source:** superpowers:executing-plans
**Claim:** Extended PowerShell wrapper regression coverage for the public workflow CLI.
**Files:**
- tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh
**Verification:**
- Manual inspection only: Manual inspection only: Added wrapper coverage for public human output, argument forwarding, failure propagation, and debug output preservation.
**Invalidation Reason:** N/A

### Task 4 Step 4
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-18T13:17:39Z
**Execution Source:** superpowers:executing-plans
**Claim:** Ran the wrapper regression suite for the new public workflow wrapper.
**Files:**
- bin/superpowers-workflow.ps1
- tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh
**Verification:**
- `bash tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh` -> PASS
**Invalidation Reason:** N/A

### Task 4 Step 5
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-18T13:18:11Z
**Execution Source:** superpowers:executing-plans
**Claim:** Committed the workflow CLI PowerShell wrapper parity changes.
**Files:**
- bin/superpowers-workflow.ps1
- docs/superpowers/execution-evidence/2026-03-18-supported-workflow-cli-r1-evidence.md
- docs/superpowers/plans/2026-03-18-supported-workflow-cli.md
- tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh
**Verification:**
- Manual inspection only: Committed Task 4 as 7e83b8d with the public wrapper, wrapper-regression coverage, and execution tracking in sync.
**Invalidation Reason:** N/A

### Task 5 Step 1
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-18T13:23:43Z
**Execution Source:** superpowers:executing-plans
**Claim:** Updated runtime docs to distinguish the public workflow CLI from the internal helper.
**Files:**
- README.md
- docs/README.codex.md
- docs/README.copilot.md
**Verification:**
- Manual inspection only: Manual inspection only: README and both platform READMEs now identify bin/superpowers-workflow as the supported public inspection CLI and keep workflow-status marked internal.
**Invalidation Reason:** N/A

### Task 5 Step 2
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-18T13:23:58Z
**Execution Source:** superpowers:executing-plans
**Claim:** Documented the supported public commands and the execution handoff boundary.
**Files:**
- README.md
- docs/README.codex.md
- docs/README.copilot.md
**Verification:**
- Manual inspection only: Manual inspection only: The runtime docs now call out status, next, artifacts, explain, and help plus the rule that next stops before execution recommendation.
**Invalidation Reason:** N/A

### Task 5 Step 3
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-18T13:24:15Z
**Execution Source:** superpowers:executing-plans
**Claim:** Updated testing docs and runtime validation inventory for the public CLI.
**Files:**
- docs/testing.md
- tests/codex-runtime/test-runtime-instructions.sh
**Verification:**
- Manual inspection only: Manual inspection only: Added the public workflow CLI suite to the documented validation order and extended runtime-instructions required-pattern coverage for the new docs.
**Invalidation Reason:** N/A

### Task 5 Step 4
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-18T13:24:32Z
**Execution Source:** superpowers:executing-plans
**Claim:** Recorded the supported workflow CLI feature in the release notes.
**Files:**
- RELEASE-NOTES.md
**Verification:**
- Manual inspection only: Manual inspection only: Added a Workflow Runtime section under the current release entry covering the public CLI, side-effect-free resolver, docs, and regression coverage.
**Invalidation Reason:** N/A

### Task 5 Step 5
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-18T13:24:52Z
**Execution Source:** superpowers:executing-plans
**Claim:** Ran the full deterministic validation set for the supported workflow CLI release surface.
**Files:**
- README.md
- RELEASE-NOTES.md
- docs/README.codex.md
- docs/README.copilot.md
- docs/testing.md
- tests/codex-runtime/test-runtime-instructions.sh
**Verification:**
- `bash tests/codex-runtime/test-runtime-instructions.sh && bash tests/codex-runtime/test-superpowers-workflow-status.sh && bash tests/codex-runtime/test-superpowers-workflow.sh && bash tests/codex-runtime/test-powershell-wrapper-bash-resolution.sh && bash tests/codex-runtime/test-workflow-enhancements.sh && bash tests/codex-runtime/test-workflow-sequencing.sh && node --test tests/codex-runtime/*.test.mjs` -> PASS
**Invalidation Reason:** N/A

### Task 5 Step 6
#### Attempt 1
**Status:** Invalidated
**Recorded At:** 2026-03-18T13:50:28Z
**Execution Source:** superpowers:executing-plans
**Claim:** Committed the supported workflow CLI documentation and release-surface updates.
**Files:**
- README.md
- RELEASE-NOTES.md
- docs/README.codex.md
- docs/README.copilot.md
- docs/superpowers/execution-evidence/2026-03-18-supported-workflow-cli-r1-evidence.md
- docs/superpowers/plans/2026-03-18-supported-workflow-cli.md
- docs/testing.md
- tests/codex-runtime/test-runtime-instructions.sh
**Verification:**
- Manual inspection only: Committed Task 5 as 90799ad with the README/platform docs, testing docs, release notes, runtime contract checks, and execution tracking in sync.
**Invalidation Reason:** Runtime TODO state was stale after the workflow CLI shipped

#### Attempt 2
**Status:** Completed
**Recorded At:** 2026-03-18T13:50:43Z
**Execution Source:** superpowers:executing-plans
**Claim:** Moved the shipped workflow CLI TODO to Completed and added a runtime contract check to keep the active docs in sync.
**Files:**
- TODOS.md
- tests/codex-runtime/test-runtime-instructions.sh
**Verification:**
- `bash tests/codex-runtime/test-runtime-instructions.sh` -> PASS
**Invalidation Reason:** N/A

