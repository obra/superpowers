#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
EXEC_BIN="$REPO_ROOT/bin/superpowers-plan-execution"
STATE_DIR="$(mktemp -d)"
REPO_DIR="$(mktemp -d)"
trap 'rm -rf "$STATE_DIR" "$REPO_DIR"' EXIT
export SUPERPOWERS_STATE_DIR="$STATE_DIR"

PLAN_REL="docs/superpowers/plans/2026-03-17-example-execution-plan.md"
SPEC_REL="docs/superpowers/specs/2026-03-17-example-execution-plan-design.md"

require_helper() {
  if [[ ! -x "$EXEC_BIN" ]]; then
    echo "Expected plan-execution helper to exist and be executable: $EXEC_BIN"
    exit 1
  fi
}

assert_contains() {
  local output="$1"
  local expected="$2"
  local label="$3"
  if [[ "$output" != *"$expected"* ]]; then
    echo "Expected ${label} output to contain '${expected}'"
    printf '%s\n' "$output"
    exit 1
  fi
}

assert_not_contains() {
  local output="$1"
  local unexpected="$2"
  local label="$3"
  if [[ "$output" == *"$unexpected"* ]]; then
    echo "Expected ${label} output to not contain '${unexpected}'"
    printf '%s\n' "$output"
    exit 1
  fi
}

json_value() {
  local json="$1"
  local path="$2"
  printf '%s' "$json" | node -e '
    const fs = require("fs");
    const path = process.argv[1].split(".");
    let value = JSON.parse(fs.readFileSync(0, "utf8"));
    for (const key of path) {
      if (value === null || value === undefined) break;
      value = value[key];
    }
    if (value === null) {
      process.stdout.write("null");
    } else if (typeof value === "object") {
      process.stdout.write(JSON.stringify(value));
    } else {
      process.stdout.write(String(value));
    }
  ' "$path"
}

assert_json_equals() {
  local json="$1"
  local path="$2"
  local expected="$3"
  local label="$4"
  local actual
  actual="$(json_value "$json" "$path")"
  if [[ "$actual" != "$expected" ]]; then
    echo "Expected ${label} field ${path} to equal '${expected}'"
    echo "Actual: ${actual}"
    printf '%s\n' "$json"
    exit 1
  fi
}

assert_json_nonempty() {
  local json="$1"
  local path="$2"
  local label="$3"
  local actual
  actual="$(json_value "$json" "$path")"
  if [[ -z "$actual" || "$actual" == "null" ]]; then
    echo "Expected ${label} field ${path} to be non-empty"
    printf '%s\n' "$json"
    exit 1
  fi
}

assert_no_blank_line_at_eof() {
  local path="$1"
  local ending
  ending="$(tail -c 2 "$path" | od -An -t x1 | tr -d '[:space:]')"
  if [[ "$ending" == "0a0a" ]]; then
    echo "Expected $path to end with a single trailing newline, not a blank line at EOF."
    exit 1
  fi
}

run_json_command() {
  local repo_dir="$1"
  shift
  local output
  local status=0
  output="$(cd "$repo_dir" && "$EXEC_BIN" "$@" 2>&1)" || status=$?
  if [[ $status -ne 0 ]]; then
    echo "Expected command to succeed: $*"
    printf '%s\n' "$output"
    exit 1
  fi
  printf '%s\n' "$output"
}

run_json_command_with_env() {
  local repo_dir="$1"
  shift
  local output
  local status=0
  output="$(cd "$repo_dir" && env "$@" 2>&1)" || status=$?
  if [[ $status -ne 0 ]]; then
    echo "Expected command to succeed: $*"
    printf '%s\n' "$output"
    exit 1
  fi
  printf '%s\n' "$output"
}

run_command_fails() {
  local repo_dir="$1"
  local expected_class="$2"
  shift 2
  local output
  local status=0
  output="$(cd "$repo_dir" && "$EXEC_BIN" "$@" 2>&1)" || status=$?
  if [[ $status -eq 0 ]]; then
    echo "Expected command to fail: $*"
    printf '%s\n' "$output"
    exit 1
  fi
  assert_contains "$output" "\"error_class\":\"$expected_class\"" "failure"
  printf '%s\n' "$output"
}

run_command_fails_with_env() {
  local repo_dir="$1"
  local expected_class="$2"
  shift 2
  local output
  local status=0
  output="$(cd "$repo_dir" && env "$@" 2>&1)" || status=$?
  if [[ $status -eq 0 ]]; then
    echo "Expected command to fail: $*"
    printf '%s\n' "$output"
    exit 1
  fi
  assert_contains "$output" "\"error_class\":\"$expected_class\"" "failure"
  printf '%s\n' "$output"
}

write_file() {
  local path="$1"
  mkdir -p "$(dirname "$path")"
  cat > "$path"
}

rewrite_file_preserving_mtime() {
  local path="$1"
  local replacement="$2"

  python3 - <<'PY' "$path" "$replacement"
import os
import sys

path, replacement = sys.argv[1:]
st = os.stat(path)
original = open(path, "rb").read()
updated = replacement.encode("utf-8")
if len(updated) != len(original):
    raise SystemExit(f"Replacement for {path} must preserve file size.")
with open(path, "wb") as fh:
    fh.write(updated)
os.utime(path, ns=(st.st_atime_ns, st.st_mtime_ns))
PY
}

replace_in_file() {
  local path="$1"
  local expected="$2"
  local replacement="$3"

  node - <<'NODE' "$path" "$expected" "$replacement"
const fs = require("fs");
const [path, expected, replacement] = process.argv.slice(2);
const source = fs.readFileSync(path, "utf8");
if (!source.includes(expected)) {
  console.error(`Expected ${path} to contain the target text.`);
  process.exit(1);
}
fs.writeFileSync(path, source.replace(expected, replacement));
NODE
}

replace_in_file_preserving_mtime() {
  local path="$1"
  local search="$2"
  local replacement="$3"

  python3 - <<'PY' "$path" "$search" "$replacement"
from pathlib import Path
import os
import sys

path, search, replacement = sys.argv[1:]
target = Path(path)
st = os.stat(target)
source = target.read_text()
if search not in source:
    raise SystemExit(f"Did not find expected text in {path}: {search}")
updated = source.replace(search, replacement, 1)
if len(updated) != len(source):
    raise SystemExit(f"Replacement for {path} must preserve file size.")
target.write_text(updated)
os.utime(target, ns=(st.st_atime_ns, st.st_mtime_ns))
PY
}

three_spaces() {
  printf '   '
}

init_repo() {
  local repo_dir="$1"

  mkdir -p "$repo_dir"
  git -C "$repo_dir" init >/dev/null 2>&1
  git -C "$repo_dir" config user.name "Superpowers Test"
  git -C "$repo_dir" config user.email "superpowers-tests@example.com"
  printf '# plan execution regression fixture\n' > "$repo_dir/README.md"
  git -C "$repo_dir" add README.md
  git -C "$repo_dir" commit -m "init" >/dev/null 2>&1
}

commit_file() {
  local repo_dir="$1"
  local rel_path="$2"
  local content="$3"
  write_file "$repo_dir/$rel_path" <<EOF
$content
EOF
  git -C "$repo_dir" add "$rel_path"
  git -C "$repo_dir" commit -m "add $(basename "$rel_path")" >/dev/null 2>&1
}

evidence_rel_path() {
  local plan_rel="$1"
  local revision="$2"
  local base
  base="$(basename "$plan_rel" .md)"
  printf 'docs/superpowers/execution-evidence/%s-r%s-evidence.md\n' "$base" "$revision"
}

write_approved_spec() {
  local repo_dir="$1"
  write_file "$repo_dir/$SPEC_REL" <<EOF
# Example Execution Plan Design

**Workflow State:** CEO Approved
**Spec Revision:** 1
**Last Reviewed By:** plan-ceo-review

## Summary

Fixture spec for plan execution helper regression coverage.
EOF
}

write_newer_approved_spec_same_revision_different_path() {
  local repo_dir="$1"
  local alt_spec_rel="docs/superpowers/specs/2026-03-17-example-execution-plan-design-v2.md"
  write_file "$repo_dir/$alt_spec_rel" <<EOF
# Example Execution Plan Design V2

**Workflow State:** CEO Approved
**Spec Revision:** 1
**Last Reviewed By:** plan-ceo-review

Fixture spec representing a newer approved spec path with the same revision.
EOF
  touch -t 202603171421 "$repo_dir/$SPEC_REL"
  touch -t 202603171422 "$repo_dir/$alt_spec_rel"
}

write_plan() {
  local repo_dir="$1"
  local execution_mode="$2"
  write_file "$repo_dir/$PLAN_REL" <<EOF
# Example Execution Plan

**Workflow State:** Engineering Approved
**Plan Revision:** 1
**Execution Mode:** ${execution_mode}
**Source Spec:** \`${SPEC_REL}\`
**Source Spec Revision:** 1
**Last Reviewed By:** plan-eng-review

## Requirement Coverage Matrix

- REQ-001 -> Task 1
- REQ-002 -> Task 1
- REQ-003 -> Task 2
- VERIFY-001 -> Task 1, Task 2

## Task 1: Core flow

**Spec Coverage:** REQ-001, REQ-002, VERIFY-001
**Task Outcome:** Core execution setup and validation are tracked with canonical execution-state evidence.
**Plan Constraints:**
- Preserve helper-owned execution-state invariants.
- Keep execution evidence grounded in repo-visible artifacts.
**Open Questions:** none

**Files:**
- Modify: \`docs/example-output.md\`
- Test: \`bash tests/codex-runtime/test-superpowers-plan-execution.sh\`

- [ ] **Step 1: Prepare workspace for execution**
- [ ] **Step 2: Validate the generated output**

## Task 2: Repair flow

**Spec Coverage:** REQ-003, VERIFY-001
**Task Outcome:** Repair and handoff steps can reopen stale work without losing provenance.
**Plan Constraints:**
- Reuse the same approved plan and evidence path for repairs.
- Keep repair flows fail-closed on stale or malformed state.
**Open Questions:** none

**Files:**
- Modify: \`docs/example-output.md\`
- Test: \`bash tests/codex-runtime/test-superpowers-plan-execution.sh\`

- [ ] **Step 1: Repair an invalidated prior step**
- [ ] **Step 2: Finalize the execution handoff**
EOF
}

write_independent_plan() {
  local repo_dir="$1"
  local execution_mode="$2"
  write_file "$repo_dir/$PLAN_REL" <<EOF
# Example Execution Plan

**Workflow State:** Engineering Approved
**Plan Revision:** 1
**Execution Mode:** ${execution_mode}
**Source Spec:** \`${SPEC_REL}\`
**Source Spec Revision:** 1
**Last Reviewed By:** plan-eng-review

## Requirement Coverage Matrix

- REQ-001 -> Task 1
- REQ-002 -> Task 2
- VERIFY-001 -> Task 1, Task 2

## Task 1: Build parser slice

**Spec Coverage:** REQ-001, VERIFY-001
**Task Outcome:** The parser slice can be implemented independently with its own file scope.
**Plan Constraints:**
- Keep parser changes isolated from formatter scope.
- Use canonical repo-relative file paths in the task contract.
**Open Questions:** none

**Files:**
- Modify: \`src/parser-slice.sh\`
- Modify: \`tests/parser-slice.test.sh\`
- Test: \`bash tests/parser-slice.test.sh\`

- [ ] **Step 1: Build parser slice**

## Task 2: Build formatter slice

**Spec Coverage:** REQ-002, VERIFY-001
**Task Outcome:** The formatter slice remains independently executable in the same approved plan revision.
**Plan Constraints:**
- Keep formatter changes isolated from parser scope.
- Preserve canonical task packet scope data.
**Open Questions:** none

**Files:**
- Modify: \`src/formatter-slice.sh\`
- Modify: \`tests/formatter-slice.test.sh\`
- Test: \`bash tests/formatter-slice.test.sh\`

- [ ] **Step 1: Build formatter slice**
EOF
}

write_coupled_plan() {
  local repo_dir="$1"
  local execution_mode="$2"
  write_file "$repo_dir/$PLAN_REL" <<EOF
# Example Execution Plan

**Workflow State:** Engineering Approved
**Plan Revision:** 1
**Execution Mode:** ${execution_mode}
**Source Spec:** \`${SPEC_REL}\`
**Source Spec Revision:** 1
**Last Reviewed By:** plan-eng-review

## Requirement Coverage Matrix

- REQ-001 -> Task 1
- REQ-002 -> Task 2
- VERIFY-001 -> Task 1, Task 2

## Task 1: Update parser

**Spec Coverage:** REQ-001, VERIFY-001
**Task Outcome:** The shared parser receives the first half of the coupled update.
**Plan Constraints:**
- Preserve shared parser continuity across both tasks.
- Keep execution evidence explicit when later repair work is needed.
**Open Questions:** none

**Files:**
- Modify: \`src/shared-parser.sh\`
- Modify: \`tests/shared-parser.test.sh\`
- Test: \`bash tests/shared-parser.test.sh\`

- [ ] **Step 1: Update parser**

## Task 2: Repair parser follow-up

**Spec Coverage:** REQ-002, VERIFY-001
**Task Outcome:** The follow-up parser repair stays coupled to the same write scope.
**Plan Constraints:**
- Keep both tasks on the same shared parser scope to force the coupled recommendation path.
- Preserve canonical repo-relative file paths in the Files block.
**Open Questions:** none

**Files:**
- Modify: \`src/shared-parser.sh\`
- Modify: \`tests/shared-parser.test.sh\`
- Test: \`bash tests/shared-parser.test.sh\`

- [ ] **Step 1: Repair parser follow-up**
EOF
}

write_checked_single_step_plan() {
  local repo_dir="$1"
  local execution_mode="$2"
  write_file "$repo_dir/$PLAN_REL" <<EOF
# Example Execution Plan

**Workflow State:** Engineering Approved
**Plan Revision:** 1
**Execution Mode:** ${execution_mode}
**Source Spec:** \`${SPEC_REL}\`
**Source Spec Revision:** 1
**Last Reviewed By:** plan-eng-review

## Requirement Coverage Matrix

- REQ-001 -> Task 1
- VERIFY-001 -> Task 1

## Task 1: Review fixture

**Spec Coverage:** REQ-001, VERIFY-001
**Task Outcome:** Review-gate fixtures isolate a single completed step.
**Plan Constraints:**
- Keep the fixture to one checked step.
**Open Questions:** none

**Files:**
- Modify: \`docs/example-output.md\`
- Test: \`bash tests/codex-runtime/test-superpowers-plan-execution.sh\`

- [x] **Step 1: Record the review fixture evidence**
EOF
}

write_single_step_plan() {
  local repo_dir="$1"
  local execution_mode="$2"
  write_file "$repo_dir/$PLAN_REL" <<EOF
# Example Execution Plan

**Workflow State:** Engineering Approved
**Plan Revision:** 1
**Execution Mode:** ${execution_mode}
**Source Spec:** \`${SPEC_REL}\`
**Source Spec Revision:** 1
**Last Reviewed By:** plan-eng-review

## Requirement Coverage Matrix

- REQ-001 -> Task 1
- VERIFY-001 -> Task 1

## Task 1: Single-step fixture

**Spec Coverage:** REQ-001, VERIFY-001
**Task Outcome:** Single-step fixtures isolate completion and review behavior.
**Plan Constraints:**
- Keep the fixture to one step.
**Open Questions:** none

**Files:**
- Modify: \`docs/example-output.md\`
- Test: \`bash tests/codex-runtime/test-superpowers-plan-execution.sh\`

- [ ] **Step 1: Complete the single-step fixture**
EOF
}

write_two_step_review_plan() {
  local repo_dir="$1"
  local execution_mode="$2"
  write_file "$repo_dir/$PLAN_REL" <<EOF
# Example Execution Plan

**Workflow State:** Engineering Approved
**Plan Revision:** 1
**Execution Mode:** ${execution_mode}
**Source Spec:** \`${SPEC_REL}\`
**Source Spec Revision:** 1
**Last Reviewed By:** plan-eng-review

## Requirement Coverage Matrix

- REQ-001 -> Task 1
- VERIFY-001 -> Task 1

## Task 1: Review repair flow

**Spec Coverage:** REQ-001, VERIFY-001
**Task Outcome:** Review fixtures can prove later-step reprovals on the same write scope.
**Plan Constraints:**
- Keep the fixture to two serial steps in one task.
**Open Questions:** none

**Files:**
- Modify: \`docs/shared-output.md\`
- Test: \`bash tests/codex-runtime/test-superpowers-plan-execution.sh\`

- [ ] **Step 1: Record the first proof**
- [ ] **Step 2: Record the later proof**
EOF
}

upgrade_plan_fixture_to_full_contract() {
  local plan_path="$1"
  python3 - "$plan_path" <<'PY'
from pathlib import Path
import sys

path = Path(sys.argv[1])
text = path.read_text()

if "## Requirement Coverage Matrix" not in text:
    matrix = "\n## Requirement Coverage Matrix\n\n- REQ-001 -> Task 1\n- VERIFY-001 -> Task 1\n"
    if "## Task 2:" in text:
        matrix = "\n## Requirement Coverage Matrix\n\n- REQ-001 -> Task 1\n- REQ-002 -> Task 2\n- VERIFY-001 -> Task 1, Task 2\n"
    text = text.replace("**Last Reviewed By:** plan-eng-review\n\n", f"**Last Reviewed By:** plan-eng-review{matrix}\n", 1)

core_block = (
    "## Task 1: Core flow\n\n"
    "**Spec Coverage:** REQ-001, VERIFY-001\n"
    "**Task Outcome:** Core flow evidence remains parseable during regression scenarios.\n"
    "**Plan Constraints:**\n"
    "- Preserve helper-owned step state.\n"
    "- Keep regression fixtures contract-shaped.\n"
    "**Open Questions:** none\n\n"
)
repair_block = (
    "## Task 2: Repair flow\n\n"
    "**Spec Coverage:** REQ-002, VERIFY-001\n"
    "**Task Outcome:** Repair flow state remains parseable during regression scenarios.\n"
    "**Plan Constraints:**\n"
    "- Preserve repair-flow invariants for reopen and transfer coverage.\n"
    "- Keep regression fixtures contract-shaped.\n"
    "**Open Questions:** none\n\n"
)

if "## Task 1: Core flow\n\n**Spec Coverage:**" not in text:
    text = text.replace("## Task 1: Core flow\n\n", core_block, 1)
if "## Task 2: Repair flow\n\n**Spec Coverage:**" not in text:
    text = text.replace("## Task 2: Repair flow\n\n", repair_block, 1)

path.write_text(text)
PY
}

write_empty_evidence_stub() {
  local repo_dir="$1"
  local evidence_rel
  evidence_rel="$(evidence_rel_path "$PLAN_REL" 1)"
  write_file "$repo_dir/$evidence_rel" <<EOF
# Execution Evidence: 2026-03-17-example-execution-plan

**Plan Path:** ${PLAN_REL}
**Plan Revision:** 1

## Step Evidence
EOF
}

write_completed_attempt() {
  local repo_dir="$1"
  local source="$2"
  local evidence_rel
  evidence_rel="$(evidence_rel_path "$PLAN_REL" 1)"
  write_file "$repo_dir/$evidence_rel" <<EOF
# Execution Evidence: 2026-03-17-example-execution-plan

**Plan Path:** ${PLAN_REL}
**Plan Revision:** 1

## Step Evidence

### Task 1 Step 1
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-17T14:22:31Z
**Execution Source:** ${source}
**Claim:** Prepared the workspace for execution.
**Files:**
- docs/example-output.md
**Verification:**
- \`bash tests/codex-runtime/test-superpowers-plan-execution.sh\` -> passed in fixture setup
**Invalidation Reason:** N/A
EOF
}

write_legacy_completed_attempts_for_finished_plan() {
  local repo_dir="$1"
  local source="$2"
  local evidence_rel

  evidence_rel="$(evidence_rel_path "$PLAN_REL" 1)"
  mkdir -p "$(dirname "$repo_dir/$evidence_rel")"
  mkdir -p "$repo_dir/docs"
  printf 'finished output\n' > "$repo_dir/docs/example-output.md"
  write_file "$repo_dir/$evidence_rel" <<EOF
# Execution Evidence: 2026-03-17-example-execution-plan

**Plan Path:** ${PLAN_REL}
**Plan Revision:** 1

## Step Evidence

### Task 1 Step 1
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-17T14:22:31Z
**Execution Source:** ${source}
**Claim:** Completed task 1 step 1.
**Files:**
- docs/example-output.md
**Verification:**
- \`bash tests/codex-runtime/test-superpowers-plan-execution.sh\` -> passed in fixture setup
**Invalidation Reason:** N/A

### Task 2 Step 1
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-17T14:22:32Z
**Execution Source:** ${source}
**Claim:** Completed task 2 step 1.
**Files:**
- docs/example-output.md
**Verification:**
- \`bash tests/codex-runtime/test-superpowers-plan-execution.sh\` -> passed in fixture setup
**Invalidation Reason:** N/A
EOF
}

hash_file_sha256() {
  local path="$1"
  if command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$path" | awk '{print $1}'
    return
  fi
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$path" | awk '{print $1}'
    return
  fi
  cksum "$path" | awk '{print $1}'
}

hash_text_sha256() {
  if command -v shasum >/dev/null 2>&1; then
    shasum -a 256 | awk '{print $1}'
    return
  fi
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum | awk '{print $1}'
    return
  fi
  cksum | awk '{print $1}'
}

execution_contract_plan_hash() {
  local repo_dir="$1"
  local plan_abs="$repo_dir/$PLAN_REL"
  local tmp

  tmp="$(mktemp "${plan_abs}.contract.XXXXXX")"
  node - <<'NODE' "$plan_abs" "$tmp"
const fs = require("fs");
const [planPath, outPath] = process.argv.slice(2);
const source = fs.readFileSync(planPath, "utf8");
const lines = source.split("\n");
let currentTask = null;
let suppressExecutionNote = false;
const output = [];

for (const line of lines) {
  if (suppressExecutionNote) {
    if (line === "" || /^\s+\*\*Execution Note:\*\*/.test(line)) {
      continue;
    }
    suppressExecutionNote = false;
  }

  const executionModeMatch = line.match(/^\*\*Execution Mode:\*\*\s+(.+)$/);
  if (executionModeMatch) {
    output.push("**Execution Mode:** none");
    continue;
  }

  const taskMatch = line.match(/^## Task (\d+):/);
  if (taskMatch) {
    currentTask = taskMatch[1];
    output.push(line);
    continue;
  }

  const stepMatch = line.match(/^- \[([ x])\] \*\*Step (\d+): (.*)\*\*$/);
  if (stepMatch) {
    output.push(`- [ ] **Step ${stepMatch[2]}: ${stepMatch[3]}**`);
    suppressExecutionNote = true;
    continue;
  }

  output.push(line);
}

fs.writeFileSync(outPath, `${output.join("\n")}\n`);
NODE
  hash_file_sha256 "$tmp"
  rm -f "$tmp"
}

expected_execution_packet_fingerprint() {
  local repo_dir="$1"
  local task="$2"
  local step="$3"
  local plan_fingerprint spec_fingerprint

  plan_fingerprint="$(execution_contract_plan_hash "$repo_dir")"
  spec_fingerprint="$(hash_file_sha256 "$repo_dir/$SPEC_REL")"
  {
    printf 'plan_path=%s\n' "$PLAN_REL"
    printf 'plan_revision=1\n'
    printf 'plan_fingerprint=%s\n' "$plan_fingerprint"
    printf 'source_spec_path=%s\n' "$SPEC_REL"
    printf 'source_spec_revision=1\n'
    printf 'source_spec_fingerprint=%s\n' "$spec_fingerprint"
    printf 'task_number=%s\n' "$task"
    printf 'step_number=%s\n' "$step"
  } | hash_text_sha256
}

legacy_execution_packet_fingerprint() {
  local repo_dir="$1"
  local task="$2"
  local step="$3"
  local plan_fingerprint spec_fingerprint

  plan_fingerprint="$(hash_file_sha256 "$repo_dir/$PLAN_REL")"
  spec_fingerprint="$(hash_file_sha256 "$repo_dir/$SPEC_REL")"
  {
    printf 'plan_path=%s\n' "$PLAN_REL"
    printf 'plan_revision=1\n'
    printf 'plan_fingerprint=%s\n' "$plan_fingerprint"
    printf 'source_spec_path=%s\n' "$SPEC_REL"
    printf 'source_spec_revision=1\n'
    printf 'source_spec_fingerprint=%s\n' "$spec_fingerprint"
    printf 'task_number=%s\n' "$task"
    printf 'step_number=%s\n' "$step"
  } | hash_text_sha256
}

write_v2_completed_attempt() {
  local repo_dir="$1"
  local packet_fingerprint="$2"
  local evidence_rel plan_fingerprint spec_fingerprint head_sha base_sha file_digest

  evidence_rel="$(evidence_rel_path "$PLAN_REL" 1)"
  plan_fingerprint="$(hash_file_sha256 "$repo_dir/$PLAN_REL")"
  spec_fingerprint="$(hash_file_sha256 "$repo_dir/$SPEC_REL")"
  if [[ "$packet_fingerprint" == "packet-fingerprint-from-approved-plan" ]]; then
    packet_fingerprint="$(expected_execution_packet_fingerprint "$repo_dir" 1 1)"
  fi
  head_sha="$(git -C "$repo_dir" rev-parse HEAD)"
  base_sha="$(git -C "$repo_dir" rev-list --max-parents=0 HEAD | tail -n1)"
  mkdir -p "$repo_dir/docs"
  printf 'verified output\n' > "$repo_dir/docs/example-output.md"
  file_digest="$(hash_file_sha256 "$repo_dir/docs/example-output.md")"
  write_file "$repo_dir/$evidence_rel" <<EOF
# Execution Evidence: 2026-03-17-example-execution-plan

**Plan Path:** ${PLAN_REL}
**Plan Revision:** 1
**Plan Fingerprint:** ${plan_fingerprint}
**Source Spec Path:** ${SPEC_REL}
**Source Spec Revision:** 1
**Source Spec Fingerprint:** ${spec_fingerprint}

## Step Evidence

### Task 1 Step 1
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-17T14:22:31Z
**Execution Source:** superpowers:executing-plans
**Task Number:** 1
**Step Number:** 1
**Packet Fingerprint:** ${packet_fingerprint}
**Head SHA:** ${head_sha}
**Base SHA:** ${base_sha}
**Claim:** Prepared the workspace for execution.
**Files Proven:**
- docs/example-output.md | sha256:${file_digest}
**Verification Summary:** Manual inspection only: Verified by fixture setup.
**Invalidation Reason:** N/A
EOF
}

mark_all_plan_steps_checked() {
  local repo_dir="$1"

  python3 - "$repo_dir/$PLAN_REL" <<'PY'
from pathlib import Path
import sys

path = Path(sys.argv[1])
path.write_text(path.read_text().replace("- [ ] **Step", "- [x] **Step"))
PY
}

write_v2_completed_attempts_for_finished_plan() {
  local repo_dir="$1"
  local evidence_rel plan_fingerprint spec_fingerprint head_sha base_sha file_digest
  local task step packet_fingerprint

  evidence_rel="$(evidence_rel_path "$PLAN_REL" 1)"
  mkdir -p "$(dirname "$repo_dir/$evidence_rel")"
  plan_fingerprint="$(hash_file_sha256 "$repo_dir/$PLAN_REL")"
  spec_fingerprint="$(hash_file_sha256 "$repo_dir/$SPEC_REL")"
  head_sha="$(git -C "$repo_dir" rev-parse HEAD)"
  base_sha="$(git -C "$repo_dir" rev-list --max-parents=0 HEAD | tail -n1)"
  mkdir -p "$repo_dir/docs"
  printf 'finished output\n' > "$repo_dir/docs/example-output.md"
  file_digest="$(hash_file_sha256 "$repo_dir/docs/example-output.md")"

  {
    cat <<EOF
# Execution Evidence: 2026-03-17-example-execution-plan

**Plan Path:** ${PLAN_REL}
**Plan Revision:** 1
**Plan Fingerprint:** ${plan_fingerprint}
**Source Spec Path:** ${SPEC_REL}
**Source Spec Revision:** 1
**Source Spec Fingerprint:** ${spec_fingerprint}

## Step Evidence

EOF

    for task in 1 2; do
      for step in 1 2; do
        packet_fingerprint="$(expected_execution_packet_fingerprint "$repo_dir" "$task" "$step")"
        cat <<EOF
### Task ${task} Step ${step}
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-17T14:22:3${task}${step}Z
**Execution Source:** superpowers:executing-plans
**Task Number:** ${task}
**Step Number:** ${step}
**Packet Fingerprint:** ${packet_fingerprint}
**Head SHA:** ${head_sha}
**Base SHA:** ${base_sha}
**Claim:** Completed task ${task} step ${step}.
**Files Proven:**
- docs/example-output.md | sha256:${file_digest}
**Verification Summary:** Manual inspection only: Verified by fixture setup.
**Invalidation Reason:** N/A

EOF
      done
    done
  } > "$repo_dir/$evidence_rel"
}

write_large_checked_plan() {
  local repo_dir="$1"
  local execution_mode="$2"
  local task_count="${3:-20}"
  local step_count="${4:-3}"
  local task step

  mkdir -p "$(dirname "$repo_dir/$PLAN_REL")"
  {
    cat <<EOF
# Example Execution Plan

**Workflow State:** Engineering Approved
**Plan Revision:** 1
**Execution Mode:** ${execution_mode}
**Source Spec:** \`${SPEC_REL}\`
**Source Spec Revision:** 1
**Last Reviewed By:** plan-eng-review

## Requirement Coverage Matrix

EOF

    for ((task=1; task<=task_count; task++)); do
      printf -- '- REQ-%03d -> Task %s\n' "$task" "$task"
    done
    printf -- '- VERIFY-001 -> '
    for ((task=1; task<=task_count; task++)); do
      if (( task > 1 )); then
        printf ', '
      fi
      printf 'Task %s' "$task"
    done
    printf '\n\n'

    for ((task=1; task<=task_count; task++)); do
      printf '## Task %s: Bulk execution slice %s\n\n' "$task" "$task"
      cat <<EOF
**Spec Coverage:** REQ-$(printf '%03d' "$task"), VERIFY-001
**Task Outcome:** Bulk execution slice ${task} preserves canonical task structure under load.
**Plan Constraints:**
- Preserve canonical task fields for large-plan execution coverage.
- Keep each task's Files block normalized and parseable.
**Open Questions:** none

**Files:**
- Modify: \`docs/output-${task}.md\`
- Test: \`bash tests/codex-runtime/test-superpowers-plan-execution.sh\`

EOF
      for ((step=1; step<=step_count; step++)); do
        printf -- '- [x] **Step %s: Complete bulk step %s.%s**\n' "$step" "$task" "$step"
      done
      printf '\n'
    done
  } > "$repo_dir/$PLAN_REL"
}

write_large_v2_evidence_fixture() {
  local repo_dir="$1"
  local task_count="${2:-20}"
  local step_count="${3:-3}"
  local evidence_rel plan_fingerprint spec_fingerprint head_sha base_sha
  local task step packet_fingerprint

  evidence_rel="$(evidence_rel_path "$PLAN_REL" 1)"
  mkdir -p "$(dirname "$repo_dir/$evidence_rel")"
  plan_fingerprint="$(hash_file_sha256 "$repo_dir/$PLAN_REL")"
  spec_fingerprint="$(hash_file_sha256 "$repo_dir/$SPEC_REL")"
  head_sha="$(git -C "$repo_dir" rev-parse HEAD)"
  base_sha="$(git -C "$repo_dir" rev-list --max-parents=0 HEAD | tail -n1)"

  {
    cat <<EOF
# Execution Evidence: 2026-03-17-example-execution-plan

**Plan Path:** ${PLAN_REL}
**Plan Revision:** 1
**Plan Fingerprint:** ${plan_fingerprint}
**Source Spec Path:** ${SPEC_REL}
**Source Spec Revision:** 1
**Source Spec Fingerprint:** ${spec_fingerprint}

## Step Evidence

EOF

    for ((task=1; task<=task_count; task++)); do
      for ((step=1; step<=step_count; step++)); do
        packet_fingerprint="$(expected_execution_packet_fingerprint "$repo_dir" "$task" "$step")"
        cat <<EOF
### Task ${task} Step ${step}
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-17T14:22:31Z
**Execution Source:** superpowers:executing-plans
**Task Number:** ${task}
**Step Number:** ${step}
**Packet Fingerprint:** ${packet_fingerprint}
**Head SHA:** ${head_sha}
**Base SHA:** ${base_sha}
**Claim:** Completed bulk execution step ${task}.${step}.
**Files Proven:**
- docs/output-${task}-${step}.md | sha256:fixture${task}${step}
**Verification Summary:** Manual inspection only: Verified by bulk fixture setup.
**Invalidation Reason:** N/A

EOF
      done
    done
  } > "$repo_dir/$evidence_rel"
}

write_large_v2_evidence_fixture_with_real_proofs() {
  local repo_dir="$1"
  local task_count="${2:-20}"
  local step_count="${3:-3}"
  local evidence_rel plan_fingerprint spec_fingerprint head_sha base_sha
  local shared_digest task step packet_fingerprint

  evidence_rel="$(evidence_rel_path "$PLAN_REL" 1)"
  mkdir -p "$(dirname "$repo_dir/$evidence_rel")"
  mkdir -p "$repo_dir/docs"
  printf 'shared proof fixture\n' > "$repo_dir/docs/shared-proof.md"
  shared_digest="$(hash_file_sha256 "$repo_dir/docs/shared-proof.md")"
  plan_fingerprint="$(hash_file_sha256 "$repo_dir/$PLAN_REL")"
  spec_fingerprint="$(hash_file_sha256 "$repo_dir/$SPEC_REL")"
  head_sha="$(git -C "$repo_dir" rev-parse HEAD)"
  base_sha="$(git -C "$repo_dir" rev-list --max-parents=0 HEAD | tail -n1)"

  {
    cat <<EOF
# Execution Evidence: 2026-03-17-example-execution-plan

**Plan Path:** ${PLAN_REL}
**Plan Revision:** 1
**Plan Fingerprint:** ${plan_fingerprint}
**Source Spec Path:** ${SPEC_REL}
**Source Spec Revision:** 1
**Source Spec Fingerprint:** ${spec_fingerprint}

## Step Evidence

EOF

    for ((task=1; task<=task_count; task++)); do
      for ((step=1; step<=step_count; step++)); do
        packet_fingerprint="$(expected_execution_packet_fingerprint "$repo_dir" "$task" "$step")"
        cat <<EOF
### Task ${task} Step ${step}
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-17T14:22:31Z
**Execution Source:** superpowers:executing-plans
**Task Number:** ${task}
**Step Number:** ${step}
**Packet Fingerprint:** ${packet_fingerprint}
**Head SHA:** ${head_sha}
**Base SHA:** ${base_sha}
**Claim:** Completed bulk execution step ${task}.${step}.
**Files Proven:**
- docs/shared-proof.md | sha256:${shared_digest}
**Verification Summary:** Manual inspection only: Verified by bulk fixture setup.
**Invalidation Reason:** N/A

EOF
      done
    done
  } > "$repo_dir/$evidence_rel"
}

hash_counter_tool_name() {
  if command -v shasum >/dev/null 2>&1; then
    printf 'shasum\n'
    return
  fi
  if command -v sha256sum >/dev/null 2>&1; then
    printf 'sha256sum\n'
    return
  fi
  printf 'cksum\n'
}

install_hash_counter_wrapper() {
  local wrapper_dir="$1"
  local counter_file="$2"
  local tool_name real_bin

  tool_name="$(hash_counter_tool_name)"
  real_bin="$(command -v "$tool_name")"
  mkdir -p "$wrapper_dir"
  printf '0\n' > "$counter_file"
  write_file "$wrapper_dir/$tool_name" <<EOF
#!/usr/bin/env bash
set -euo pipefail
counter_file="$counter_file"
current=0
if [[ -f "\$counter_file" ]]; then
  current="\$(cat "\$counter_file")"
fi
printf '%s\n' "\$((current + 1))" > "\$counter_file"
exec "$real_bin" "\$@"
EOF
  chmod +x "$wrapper_dir/$tool_name"
}

install_hash_fail_wrapper() {
  local wrapper_dir="$1"
  local fail_pattern="$2"
  local tool_name real_bin

  tool_name="$(hash_counter_tool_name)"
  real_bin="$(command -v "$tool_name")"
  mkdir -p "$wrapper_dir"
  write_file "$wrapper_dir/$tool_name" <<EOF
#!/usr/bin/env bash
set -euo pipefail
fail_pattern="$fail_pattern"
for arg in "\$@"; do
  if [[ "\$arg" == *"\$fail_pattern"* ]]; then
    exit 1
  fi
done
exec "$real_bin" "\$@"
EOF
  chmod +x "$wrapper_dir/$tool_name"
}

run_json_command_with_timeout() {
  local repo_dir="$1"
  local timeout_seconds="$2"
  local stdout_file
  local stderr_file
  local status=0
  local output=""
  local error_output=""
  local timing=""
  shift 2

  stdout_file="$(mktemp "${TMPDIR:-/tmp}/superpowers-plan-execution-stdout.XXXXXX")"
  stderr_file="$(mktemp "${TMPDIR:-/tmp}/superpowers-plan-execution-stderr.XXXXXX")"
  TIMEFORMAT='%R'
  timing="$({ time (cd "$repo_dir" && "$EXEC_BIN" "$@" >"$stdout_file" 2>"$stderr_file"); } 2>&1)" || status=$?
  timing="${timing##*$'\n'}"

  output="$(cat "$stdout_file")"
  error_output="$(cat "$stderr_file")"
  rm -f "$stdout_file" "$stderr_file"

  if awk -v actual="$timing" -v limit="$timeout_seconds" 'BEGIN { exit !((actual + 0) > (limit + 0)) }'; then
    echo "Command timed out after ${timeout_seconds}s: $EXEC_BIN $*"
    echo "Elapsed: ${timing}s"
    [[ -n "$output" ]] && printf '%s\n' "$output"
    [[ -n "$error_output" ]] && printf '%s\n' "$error_output"
    exit 124
  fi

  if [[ $status -ne 0 ]]; then
    echo "Expected command to succeed: $EXEC_BIN $*"
    [[ -n "$output" ]] && printf '%s\n' "$output"
    [[ -n "$error_output" ]] && printf '%s\n' "$error_output"
    exit "$status"
  fi

  printf '%s\n' "$output"
}

load_slug_context() {
  local repo_dir="$1"
  local slug_env
  slug_env="$(cd "$repo_dir" && "$REPO_ROOT/bin/superpowers-slug")"
  eval "$slug_env"
  PROJECT_ARTIFACT_SLUG="$SLUG"
  PROJECT_ARTIFACT_SAFE_BRANCH="$BRANCH"
}

current_branch_name() {
  local repo_dir="$1"
  git -C "$repo_dir" rev-parse --abbrev-ref HEAD
}

project_artifact_dir() {
  local repo_dir="$1"
  load_slug_context "$repo_dir"
  printf '%s/projects/%s\n' "$SUPERPOWERS_STATE_DIR" "$PROJECT_ARTIFACT_SLUG"
}

write_test_plan_artifact() {
  local repo_dir="$1"
  local browser_required="${2:-no}"
  local artifact_dir branch_name artifact_path

  load_slug_context "$repo_dir"
  artifact_dir="$SUPERPOWERS_STATE_DIR/projects/$PROJECT_ARTIFACT_SLUG"
  branch_name="$(current_branch_name "$repo_dir")"
  mkdir -p "$artifact_dir"
  artifact_path="$artifact_dir/tester-$PROJECT_ARTIFACT_SAFE_BRANCH-test-plan-20260322-170500.md"
  write_file "$artifact_path" <<EOF
# Test Plan
**Source Plan:** \`${PLAN_REL}\`
**Source Plan Revision:** 1
**Branch:** ${branch_name}
**Repo:** ${PROJECT_ARTIFACT_SLUG}
**Browser QA Required:** ${browser_required}
**Generated By:** superpowers:plan-eng-review
**Generated At:** 2026-03-22T17:05:00Z

## Affected Pages / Routes
- /runtime-hardening - verify helper-backed finish gating
EOF
  printf '%s\n' "$artifact_path"
}

write_qa_result_artifact() {
  local repo_dir="$1"
  local test_plan_path="$2"
  local result="${3:-pass}"
  local head_sha="${4:-}"
  local artifact_dir branch_name artifact_path

  load_slug_context "$repo_dir"
  artifact_dir="$SUPERPOWERS_STATE_DIR/projects/$PROJECT_ARTIFACT_SLUG"
  branch_name="$(current_branch_name "$repo_dir")"
  [[ -n "$head_sha" ]] || head_sha="$(git -C "$repo_dir" rev-parse HEAD)"
  mkdir -p "$artifact_dir"
  artifact_path="$artifact_dir/tester-$PROJECT_ARTIFACT_SAFE_BRANCH-test-outcome-20260322-170900.md"
  write_file "$artifact_path" <<EOF
# QA Result
**Source Plan:** \`${PLAN_REL}\`
**Source Plan Revision:** 1
**Source Test Plan:** \`${test_plan_path}\`
**Branch:** ${branch_name}
**Repo:** ${PROJECT_ARTIFACT_SLUG}
**Head SHA:** ${head_sha}
**Result:** ${result}
**Generated By:** superpowers:qa-only
**Generated At:** 2026-03-22T17:09:00Z

## Summary
- Browser QA artifact fixture for gate-finish coverage.
EOF
  printf '%s\n' "$artifact_path"
}

write_release_readiness_artifact() {
  local repo_dir="$1"
  local result="${2:-pass}"
  local head_sha="${3:-}"
  local base_branch="${4:-}"
  local artifact_dir branch_name artifact_path

  load_slug_context "$repo_dir"
  artifact_dir="$SUPERPOWERS_STATE_DIR/projects/$PROJECT_ARTIFACT_SLUG"
  branch_name="$(current_branch_name "$repo_dir")"
  [[ -n "$base_branch" ]] || base_branch="$branch_name"
  [[ -n "$head_sha" ]] || head_sha="$(git -C "$repo_dir" rev-parse HEAD)"
  mkdir -p "$artifact_dir"
  artifact_path="$artifact_dir/tester-$PROJECT_ARTIFACT_SAFE_BRANCH-release-readiness-20260322-171500.md"
  write_file "$artifact_path" <<EOF
# Release Readiness Result
**Source Plan:** \`${PLAN_REL}\`
**Source Plan Revision:** 1
**Branch:** ${branch_name}
**Repo:** ${PROJECT_ARTIFACT_SLUG}
**Base Branch:** ${base_branch}
**Head SHA:** ${head_sha}
**Result:** ${result}
**Generated By:** superpowers:document-release
**Generated At:** 2026-03-22T17:15:00Z

## Summary
- Release-readiness artifact fixture for finish-gate coverage.
EOF
  printf '%s\n' "$artifact_path"
}

create_base_repo() {
  local name="$1"
  local repo_dir="$REPO_DIR/$name"
  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_plan "$repo_dir" "none"
  printf '%s\n' "$repo_dir"
}

run_status_reports_bounded_schema_for_clean_plan() {
  local repo_dir
  local status_output
  repo_dir="$(create_base_repo clean-plan)"
  status_output="$(run_json_command "$repo_dir" status --plan "$PLAN_REL")"

  assert_json_equals "$status_output" "plan_revision" "1" "clean status"
  assert_json_equals "$status_output" "execution_mode" "none" "clean status"
  assert_json_equals "$status_output" "execution_started" "no" "clean status"
  assert_json_equals "$status_output" "active_task" "null" "clean status"
  assert_json_equals "$status_output" "active_step" "null" "clean status"
  assert_json_equals "$status_output" "blocking_task" "null" "clean status"
  assert_json_equals "$status_output" "blocking_step" "null" "clean status"
  assert_json_equals "$status_output" "resume_task" "null" "clean status"
  assert_json_equals "$status_output" "resume_step" "null" "clean status"
  assert_json_equals "$status_output" "evidence_path" "$(evidence_rel_path "$PLAN_REL" 1)" "clean status"
  assert_json_nonempty "$status_output" "execution_fingerprint" "clean status"
}

run_status_completes_quickly_for_large_v2_evidence_fixture() {
  local repo_dir="$REPO_DIR/large-v2-evidence"
  local status_output

  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_large_checked_plan "$repo_dir" "superpowers:executing-plans" 40 3
  write_large_v2_evidence_fixture "$repo_dir" 40 3

  run_json_command "$repo_dir" status --plan "$PLAN_REL" >/dev/null
  status_output="$(run_json_command_with_timeout "$repo_dir" 1 status --plan "$PLAN_REL")"
  assert_json_equals "$status_output" "execution_mode" "superpowers:executing-plans" "large evidence status"
  assert_json_equals "$status_output" "active_task" "null" "large evidence status"
  assert_json_equals "$status_output" "resume_task" "null" "large evidence status"
}

run_status_treats_header_only_stub_as_same_empty_state() {
  local repo_dir
  local without_stub
  local with_stub
  repo_dir="$(create_base_repo header-only-stub)"

  without_stub="$(run_json_command "$repo_dir" status --plan "$PLAN_REL")"
  write_empty_evidence_stub "$repo_dir"
  with_stub="$(run_json_command "$repo_dir" status --plan "$PLAN_REL")"

  assert_json_equals \
    "$with_stub" \
    "execution_fingerprint" \
    "$(json_value "$without_stub" "execution_fingerprint")" \
    "header-only stub status"
}

run_status_cache_invalidates_after_plan_change() {
  local repo_dir
  local first_status
  local second_status
  repo_dir="$(create_base_repo cache-invalidates)"

  first_status="$(run_json_command "$repo_dir" status --plan "$PLAN_REL")"
  assert_json_equals "$first_status" "execution_mode" "none" "cache invalidation status"

  node -e '
    const fs = require("fs");
    const path = process.argv[1];
    const text = fs.readFileSync(path, "utf8");
    fs.writeFileSync(path, text.replace("**Execution Mode:** none", "**Execution Mode:** superpowers:executing-plans"));
  ' "$repo_dir/$PLAN_REL"

  second_status="$(run_json_command "$repo_dir" status --plan "$PLAN_REL")"
  assert_json_equals "$second_status" "execution_mode" "superpowers:executing-plans" "cache invalidation status"
}

run_status_cache_invalidates_after_same_size_same_mtime_plan_change() {
  local repo_dir
  local first_status
  local second_status
  repo_dir="$(create_base_repo cache-invalidates-same-size)"

  first_status="$(run_json_command "$repo_dir" status --plan "$PLAN_REL")"
  assert_json_equals "$first_status" "plan_revision" "1" "same-size cache invalidation status"

  replace_in_file_preserving_mtime \
    "$repo_dir/$PLAN_REL" \
    "**Plan Revision:** 1" \
    "**Plan Revision:** 2"

  second_status="$(run_json_command "$repo_dir" status --plan "$PLAN_REL")"
  assert_json_equals "$second_status" "plan_revision" "2" "same-size cache invalidation status"
}

run_status_cache_invalidates_after_sibling_approved_spec_change() {
  local repo_dir
  local first_status
  local failure

  repo_dir="$(create_base_repo cache-invalidates-sibling-spec)"

  first_status="$(run_json_command "$repo_dir" status --plan "$PLAN_REL")"
  assert_json_equals "$first_status" "plan_revision" "1" "sibling spec cache invalidation initial"

  write_newer_approved_spec_same_revision_different_path "$repo_dir"
  failure="$(run_command_fails "$repo_dir" PlanNotExecutionReady status --plan "$PLAN_REL")"
  assert_contains "$failure" "Approved plan source spec path or revision is stale." "sibling spec cache invalidation stale plan"
}

run_status_rejects_missing_execution_mode() {
  local repo_dir
  repo_dir="$(create_base_repo missing-execution-mode)"
  node -e '
    const fs = require("fs");
    const path = process.argv[1];
    const text = fs.readFileSync(path, "utf8");
    fs.writeFileSync(path, text.replace("**Execution Mode:** none\n", ""));
  ' "$repo_dir/$PLAN_REL"

  run_command_fails "$repo_dir" PlanNotExecutionReady status --plan "$PLAN_REL" >/dev/null
}

run_status_rejects_missing_task_outcome_in_approved_plan() {
  local repo_dir
  repo_dir="$(create_base_repo missing-task-outcome)"
  node - <<'NODE' "$repo_dir/$PLAN_REL"
const fs = require("fs");
const path = process.argv[2];
const source = fs.readFileSync(path, "utf8");
fs.writeFileSync(
  path,
  source.replace(/^\*\*Task Outcome:\*\*.*\n/m, ""),
);
NODE

  run_command_fails "$repo_dir" PlanNotExecutionReady status --plan "$PLAN_REL" >/dev/null
}

run_preflight_reports_allowed_for_clean_plan() {
  local repo_dir
  local output
  repo_dir="$(create_base_repo preflight-clean-plan)"

  output="$(run_json_command "$repo_dir" preflight --plan "$PLAN_REL")"
  assert_json_equals "$output" "allowed" "true" "preflight clean plan"
  assert_json_equals "$output" "failure_class" "" "preflight clean plan"
  assert_json_equals "$output" "reason_codes" "[]" "preflight clean plan"
  assert_json_equals "$output" "diagnostics" "[]" "preflight clean plan"
}

run_preflight_rejects_detached_head() {
  local repo_dir
  local output
  repo_dir="$(create_base_repo preflight-detached-head)"
  git -C "$repo_dir" checkout --detach >/dev/null 2>&1

  output="$(run_json_command "$repo_dir" preflight --plan "$PLAN_REL")"
  assert_json_equals "$output" "allowed" "false" "preflight detached head"
  assert_json_equals "$output" "failure_class" "WorkspaceNotSafe" "preflight detached head"
  assert_json_equals "$output" "reason_codes.0" "detached_head" "preflight detached head"
}

run_preflight_rejects_merge_in_progress() {
  local repo_dir
  local output
  local merge_head_path

  repo_dir="$(create_base_repo preflight-merge-in-progress)"
  merge_head_path="$(git -C "$repo_dir" rev-parse --git-path MERGE_HEAD)"
  [[ "$merge_head_path" == /* ]] || merge_head_path="$repo_dir/$merge_head_path"
  mkdir -p "$(dirname "$merge_head_path")"
  printf 'deadbeef\n' > "$merge_head_path"

  output="$(run_json_command "$repo_dir" preflight --plan "$PLAN_REL")"
  assert_json_equals "$output" "allowed" "false" "preflight merge in progress"
  assert_json_equals "$output" "failure_class" "WorkspaceNotSafe" "preflight merge in progress"
  assert_json_equals "$output" "reason_codes.0" "merge_in_progress" "preflight merge in progress"
}

run_preflight_rejects_rebase_in_progress() {
  local repo_dir
  local output
  local rebase_path

  repo_dir="$(create_base_repo preflight-rebase-in-progress)"
  rebase_path="$(git -C "$repo_dir" rev-parse --git-path rebase-merge)"
  [[ "$rebase_path" == /* ]] || rebase_path="$repo_dir/$rebase_path"
  mkdir -p "$rebase_path"

  output="$(run_json_command "$repo_dir" preflight --plan "$PLAN_REL")"
  assert_json_equals "$output" "allowed" "false" "preflight rebase in progress"
  assert_json_equals "$output" "failure_class" "WorkspaceNotSafe" "preflight rebase in progress"
  assert_json_equals "$output" "reason_codes.0" "rebase_in_progress" "preflight rebase in progress"
}

run_preflight_rejects_cherry_pick_in_progress() {
  local repo_dir
  local output
  local cherry_pick_path

  repo_dir="$(create_base_repo preflight-cherry-pick-in-progress)"
  cherry_pick_path="$(git -C "$repo_dir" rev-parse --git-path CHERRY_PICK_HEAD)"
  [[ "$cherry_pick_path" == /* ]] || cherry_pick_path="$repo_dir/$cherry_pick_path"
  mkdir -p "$(dirname "$cherry_pick_path")"
  printf 'deadbeef\n' > "$cherry_pick_path"

  output="$(run_json_command "$repo_dir" preflight --plan "$PLAN_REL")"
  assert_json_equals "$output" "allowed" "false" "preflight cherry-pick in progress"
  assert_json_equals "$output" "failure_class" "WorkspaceNotSafe" "preflight cherry-pick in progress"
  assert_json_equals "$output" "reason_codes.0" "cherry_pick_in_progress" "preflight cherry-pick in progress"
}

run_preflight_rejects_unresolved_index_entries() {
  local repo_dir
  local output
  local base_blob ours_blob theirs_blob

  repo_dir="$(create_base_repo preflight-unresolved-index-entries)"
  base_blob="$(printf 'base line\n' | git -C "$repo_dir" hash-object -w --stdin)"
  ours_blob="$(printf 'ours line\n' | git -C "$repo_dir" hash-object -w --stdin)"
  theirs_blob="$(printf 'theirs line\n' | git -C "$repo_dir" hash-object -w --stdin)"
  printf 'ours line\n' > "$repo_dir/conflict.txt"
  git -C "$repo_dir" update-index --index-info <<EOF
100644 $base_blob 1	conflict.txt
100644 $ours_blob 2	conflict.txt
100644 $theirs_blob 3	conflict.txt
EOF

  output="$(run_json_command "$repo_dir" preflight --plan "$PLAN_REL")"
  assert_json_equals "$output" "allowed" "false" "preflight unresolved index entries"
  assert_json_equals "$output" "failure_class" "WorkspaceNotSafe" "preflight unresolved index entries"
  assert_json_equals "$output" "reason_codes.0" "unresolved_index_entries" "preflight unresolved index entries"
}

run_preflight_rejects_repo_safety_runtime_failure() {
  local repo_dir
  local output
  repo_dir="$(create_base_repo preflight-repo-safety-runtime-failure)"

  output="$(run_json_command_with_env "$repo_dir" SUPERPOWERS_REPO_SAFETY_TEST_FAILPOINT=instruction_parse_failure "$EXEC_BIN" preflight --plan "$PLAN_REL")"
  assert_json_equals "$output" "allowed" "false" "preflight repo-safety runtime failure"
  assert_json_equals "$output" "failure_class" "WorkspaceNotSafe" "preflight repo-safety runtime failure"
  assert_json_equals "$output" "reason_codes.0" "repo_safety_unavailable" "preflight repo-safety runtime failure"
}

run_preflight_rejects_blocked_step() {
  local repo_dir
  local before
  local active
  local blocked
  local output

  repo_dir="$(create_base_repo preflight-blocked-step)"
  before="$(run_json_command "$repo_dir" status --plan "$PLAN_REL")"
  active="$(run_json_command "$repo_dir" begin --plan "$PLAN_REL" --task 1 --step 1 --execution-mode superpowers:executing-plans --expect-execution-fingerprint "$(json_value "$before" "execution_fingerprint")")"
  blocked="$(run_json_command "$repo_dir" note --plan "$PLAN_REL" --task 1 --step 1 --state blocked --message "Waiting on external approval" --expect-execution-fingerprint "$(json_value "$active" "execution_fingerprint")")"

  output="$(run_json_command "$repo_dir" preflight --plan "$PLAN_REL")"
  assert_json_equals "$output" "allowed" "false" "preflight blocked step"
  assert_json_equals "$output" "failure_class" "ExecutionStateNotReady" "preflight blocked step"
  assert_json_equals "$output" "reason_codes.0" "blocked_step" "preflight blocked step"
  assert_json_equals "$blocked" "blocking_task" "1" "preflight blocked step note"
}

run_preflight_rejects_interrupted_work() {
  local repo_dir
  local before
  local active
  local interrupted
  local output

  repo_dir="$(create_base_repo preflight-interrupted-step)"
  before="$(run_json_command "$repo_dir" status --plan "$PLAN_REL")"
  active="$(run_json_command "$repo_dir" begin --plan "$PLAN_REL" --task 1 --step 1 --execution-mode superpowers:executing-plans --expect-execution-fingerprint "$(json_value "$before" "execution_fingerprint")")"
  interrupted="$(run_json_command "$repo_dir" note --plan "$PLAN_REL" --task 1 --step 1 --state interrupted --message "Waiting on follow-up" --expect-execution-fingerprint "$(json_value "$active" "execution_fingerprint")")"

  output="$(run_json_command "$repo_dir" preflight --plan "$PLAN_REL")"
  assert_json_equals "$output" "allowed" "false" "preflight interrupted work"
  assert_json_equals "$output" "failure_class" "ExecutionStateNotReady" "preflight interrupted work"
  assert_json_equals "$output" "reason_codes.0" "interrupted_work_unresolved" "preflight interrupted work"
  assert_json_equals "$interrupted" "resume_task" "1" "preflight interrupted work note"
}

run_status_rejects_evidence_history_with_none_mode() {
  local repo_dir
  repo_dir="$(create_base_repo none-mode-evidence-history)"
  write_completed_attempt "$repo_dir" "superpowers:executing-plans"

  run_command_fails "$repo_dir" MalformedExecutionState status --plan "$PLAN_REL" >/dev/null
}

run_gate_review_warns_on_legacy_evidence_format() {
  local repo_dir="$REPO_DIR/gate-review-legacy-evidence"
  local output

  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_file "$repo_dir/$PLAN_REL" <<EOF
# Example Execution Plan

**Workflow State:** Engineering Approved
**Plan Revision:** 1
**Execution Mode:** superpowers:executing-plans
**Source Spec:** \`${SPEC_REL}\`
**Source Spec Revision:** 1
**Last Reviewed By:** plan-eng-review

## Requirement Coverage Matrix

- REQ-001 -> Task 1
- VERIFY-001 -> Task 1

## Task 1: Legacy review fixture

**Spec Coverage:** REQ-001, VERIFY-001
**Task Outcome:** Legacy evidence fixtures remain reviewable for one release cycle.
**Plan Constraints:**
- Keep the fixture to a single completed step.
**Open Questions:** none

**Files:**
- Modify: \`docs/example-output.md\`
- Test: \`bash tests/codex-runtime/test-superpowers-plan-execution.sh\`

- [x] **Step 1: Record the legacy evidence format**
EOF
  write_completed_attempt "$repo_dir" "superpowers:executing-plans"

  output="$(run_json_command "$repo_dir" gate-review --plan "$PLAN_REL")"
  assert_json_equals "$output" "allowed" "true" "gate-review legacy evidence"
  assert_json_equals "$output" "warning_codes.0" "legacy_evidence_format" "gate-review legacy evidence"
}

run_gate_review_warns_on_legacy_packet_provenance() {
  local repo_dir="$REPO_DIR/gate-review-legacy-packet-provenance"
  local output
  local legacy_packet

  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_file "$repo_dir/$PLAN_REL" <<EOF
# Example Execution Plan

**Workflow State:** Engineering Approved
**Plan Revision:** 1
**Execution Mode:** superpowers:executing-plans
**Source Spec:** \`${SPEC_REL}\`
**Source Spec Revision:** 1
**Last Reviewed By:** plan-eng-review

## Requirement Coverage Matrix

- REQ-001 -> Task 1
- VERIFY-001 -> Task 1

## Task 1: Legacy packet provenance fixture

**Spec Coverage:** REQ-001, VERIFY-001
**Task Outcome:** Legacy packet provenance remains reviewable for one release cycle.
**Plan Constraints:**
- Keep the fixture to a single completed step.
**Open Questions:** none

**Files:**
- Modify: \`docs/example-output.md\`
- Test: \`bash tests/codex-runtime/test-superpowers-plan-execution.sh\`

- [x] **Step 1: Record the legacy packet provenance**
EOF

  legacy_packet="$(legacy_execution_packet_fingerprint "$repo_dir" 1 1)"
  write_v2_completed_attempt "$repo_dir" "$legacy_packet"

  output="$(run_json_command "$repo_dir" gate-review --plan "$PLAN_REL")"
  assert_json_equals "$output" "allowed" "true" "gate-review legacy packet provenance"
  assert_json_equals "$output" "warning_codes.0" "legacy_packet_provenance" "gate-review legacy packet provenance"
}

run_gate_review_rejects_unfinished_steps_remaining() {
  local repo_dir
  local output
  repo_dir="$(create_base_repo gate-review-unfinished-steps)"

  output="$(run_json_command "$repo_dir" gate-review --plan "$PLAN_REL")"
  assert_json_equals "$output" "allowed" "false" "gate-review unfinished steps"
  assert_json_equals "$output" "failure_class" "ExecutionStateNotReady" "gate-review unfinished steps"
  assert_json_equals "$output" "reason_codes.0" "unfinished_steps_remaining" "gate-review unfinished steps"
}

run_gate_review_rejects_active_step_in_progress() {
  local repo_dir
  local before
  local active
  local output

  repo_dir="$(create_base_repo gate-review-active-step)"
  before="$(run_json_command "$repo_dir" status --plan "$PLAN_REL")"
  active="$(run_json_command "$repo_dir" begin --plan "$PLAN_REL" --task 1 --step 1 --execution-mode superpowers:executing-plans --expect-execution-fingerprint "$(json_value "$before" "execution_fingerprint")")"

  output="$(run_json_command "$repo_dir" gate-review --plan "$PLAN_REL")"
  assert_json_equals "$output" "allowed" "false" "gate-review active step"
  assert_json_equals "$output" "failure_class" "ExecutionStateNotReady" "gate-review active step"
  assert_json_equals "$output" "reason_codes.0" "active_step_in_progress" "gate-review active step"
  assert_json_equals "$active" "active_task" "1" "gate-review active step status"
}

run_gate_review_rejects_blocked_step() {
  local repo_dir
  local before
  local active
  local blocked
  local output

  repo_dir="$(create_base_repo gate-review-blocked-step)"
  before="$(run_json_command "$repo_dir" status --plan "$PLAN_REL")"
  active="$(run_json_command "$repo_dir" begin --plan "$PLAN_REL" --task 1 --step 1 --execution-mode superpowers:executing-plans --expect-execution-fingerprint "$(json_value "$before" "execution_fingerprint")")"
  blocked="$(run_json_command "$repo_dir" note --plan "$PLAN_REL" --task 1 --step 1 --state blocked --message "Waiting on external approval" --expect-execution-fingerprint "$(json_value "$active" "execution_fingerprint")")"

  output="$(run_json_command "$repo_dir" gate-review --plan "$PLAN_REL")"
  assert_json_equals "$output" "allowed" "false" "gate-review blocked step"
  assert_json_equals "$output" "failure_class" "ExecutionStateNotReady" "gate-review blocked step"
  assert_json_equals "$output" "reason_codes.0" "blocked_step" "gate-review blocked step"
  assert_json_equals "$blocked" "blocking_task" "1" "gate-review blocked step note"
}

run_gate_review_rejects_interrupted_work() {
  local repo_dir
  local before
  local active
  local interrupted
  local output

  repo_dir="$(create_base_repo gate-review-interrupted-step)"
  before="$(run_json_command "$repo_dir" status --plan "$PLAN_REL")"
  active="$(run_json_command "$repo_dir" begin --plan "$PLAN_REL" --task 1 --step 1 --execution-mode superpowers:executing-plans --expect-execution-fingerprint "$(json_value "$before" "execution_fingerprint")")"
  interrupted="$(run_json_command "$repo_dir" note --plan "$PLAN_REL" --task 1 --step 1 --state interrupted --message "Waiting on follow-up" --expect-execution-fingerprint "$(json_value "$active" "execution_fingerprint")")"

  output="$(run_json_command "$repo_dir" gate-review --plan "$PLAN_REL")"
  assert_json_equals "$output" "allowed" "false" "gate-review interrupted work"
  assert_json_equals "$output" "failure_class" "ExecutionStateNotReady" "gate-review interrupted work"
  assert_json_equals "$output" "reason_codes.0" "interrupted_work_unresolved" "gate-review interrupted work"
  assert_json_equals "$interrupted" "resume_task" "1" "gate-review interrupted work note"
}

run_gate_review_rejects_checked_step_missing_evidence() {
  local repo_dir="$REPO_DIR/gate-review-missing-evidence"
  local output

  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_checked_single_step_plan "$repo_dir" "superpowers:executing-plans"

  output="$(run_json_command "$repo_dir" gate-review --plan "$PLAN_REL")"
  assert_json_equals "$output" "allowed" "false" "gate-review missing evidence"
  assert_json_equals "$output" "failure_class" "StaleExecutionEvidence" "gate-review missing evidence"
  assert_json_equals "$output" "reason_codes.0" "checked_step_missing_evidence" "gate-review missing evidence"
}

run_gate_review_rejects_checked_step_without_completed_attempt() {
  local repo_dir="$REPO_DIR/gate-review-invalidated-attempt"
  local evidence_rel
  local output

  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_checked_single_step_plan "$repo_dir" "superpowers:executing-plans"
  write_v2_completed_attempt "$repo_dir" "packet-fingerprint-from-approved-plan"
  evidence_rel="$(evidence_rel_path "$PLAN_REL" 1)"
  replace_in_file "$repo_dir/$evidence_rel" "**Status:** Completed" "**Status:** Invalidated"
  replace_in_file "$repo_dir/$evidence_rel" "**Invalidation Reason:** N/A" "**Invalidation Reason:** Reopened after review drift."

  output="$(run_json_command "$repo_dir" gate-review --plan "$PLAN_REL")"
  assert_json_equals "$output" "allowed" "false" "gate-review invalidated attempt"
  assert_json_equals "$output" "failure_class" "StaleExecutionEvidence" "gate-review invalidated attempt"
  assert_json_equals "$output" "reason_codes.0" "checked_step_missing_evidence" "gate-review invalidated attempt"
}

run_gate_review_rejects_packet_fingerprint_mismatch() {
  local repo_dir="$REPO_DIR/gate-review-packet-mismatch"
  local output

  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_checked_single_step_plan "$repo_dir" "superpowers:executing-plans"
  write_v2_completed_attempt "$repo_dir" "packet-fingerprint-mismatch"

  output="$(run_json_command "$repo_dir" gate-review --plan "$PLAN_REL")"
  assert_json_equals "$output" "allowed" "false" "gate-review packet mismatch"
  assert_json_equals "$output" "failure_class" "StaleExecutionEvidence" "gate-review packet mismatch"
  assert_json_equals "$output" "reason_codes.0" "packet_fingerprint_mismatch" "gate-review packet mismatch"
}

run_gate_review_rejects_plan_fingerprint_mismatch() {
  local repo_dir="$REPO_DIR/gate-review-plan-fingerprint-mismatch"
  local evidence_rel
  local output

  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_checked_single_step_plan "$repo_dir" "superpowers:executing-plans"
  write_v2_completed_attempt "$repo_dir" "packet-fingerprint-from-approved-plan"
  evidence_rel="$(evidence_rel_path "$PLAN_REL" 1)"
  node - <<'NODE' "$repo_dir/$evidence_rel"
const fs = require("fs");
const file = process.argv[2];
const source = fs.readFileSync(file, "utf8");
fs.writeFileSync(
  file,
  source.replace(
    /(\*\*Plan Fingerprint:\*\* )([^\n]+)/,
    "$1stale-plan-fingerprint",
  ),
);
NODE

  output="$(run_json_command "$repo_dir" gate-review --plan "$PLAN_REL")"
  assert_json_equals "$output" "allowed" "false" "gate-review plan fingerprint mismatch"
  assert_json_equals "$output" "failure_class" "StaleExecutionEvidence" "gate-review plan fingerprint mismatch"
  assert_json_equals "$output" "reason_codes.0" "plan_fingerprint_mismatch" "gate-review plan fingerprint mismatch"
}

run_gate_review_rejects_source_spec_fingerprint_mismatch() {
  local repo_dir="$REPO_DIR/gate-review-source-spec-fingerprint-mismatch"
  local evidence_rel
  local output

  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_checked_single_step_plan "$repo_dir" "superpowers:executing-plans"
  write_v2_completed_attempt "$repo_dir" "packet-fingerprint-from-approved-plan"
  evidence_rel="$(evidence_rel_path "$PLAN_REL" 1)"
  node - <<'NODE' "$repo_dir/$evidence_rel"
const fs = require("fs");
const file = process.argv[2];
const source = fs.readFileSync(file, "utf8");
fs.writeFileSync(
  file,
  source.replace(
    /(\*\*Source Spec Fingerprint:\*\* )([^\n]+)/,
    "$1stale-source-spec-fingerprint",
  ),
);
NODE

  output="$(run_json_command "$repo_dir" gate-review --plan "$PLAN_REL")"
  assert_json_equals "$output" "allowed" "false" "gate-review source spec fingerprint mismatch"
  assert_json_equals "$output" "failure_class" "StaleExecutionEvidence" "gate-review source spec fingerprint mismatch"
  assert_json_equals "$output" "reason_codes.0" "source_spec_fingerprint_mismatch" "gate-review source spec fingerprint mismatch"
}

run_gate_review_rejects_plan_fingerprint_unavailable() {
  local repo_dir="$REPO_DIR/gate-review-plan-fingerprint-unavailable"
  local wrapper_dir="$repo_dir/.hash-fail-plan"
  local output

  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_checked_single_step_plan "$repo_dir" "superpowers:executing-plans"
  write_v2_completed_attempt "$repo_dir" "packet-fingerprint-from-approved-plan"
  install_hash_fail_wrapper "$wrapper_dir" "$repo_dir/$PLAN_REL"

  output="$(run_json_command_with_env "$repo_dir" PATH="$wrapper_dir:$PATH" "$EXEC_BIN" gate-review --plan "$PLAN_REL")"
  assert_json_equals "$output" "allowed" "false" "gate-review plan fingerprint unavailable"
  assert_json_equals "$output" "failure_class" "StaleExecutionEvidence" "gate-review plan fingerprint unavailable"
  assert_json_equals "$output" "reason_codes.0" "plan_fingerprint_unavailable" "gate-review plan fingerprint unavailable"
}

run_gate_review_rejects_source_spec_fingerprint_unavailable() {
  local repo_dir="$REPO_DIR/gate-review-source-spec-fingerprint-unavailable"
  local wrapper_dir="$repo_dir/.hash-fail-spec"
  local output

  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_checked_single_step_plan "$repo_dir" "superpowers:executing-plans"
  write_v2_completed_attempt "$repo_dir" "packet-fingerprint-from-approved-plan"
  install_hash_fail_wrapper "$wrapper_dir" "$repo_dir/$SPEC_REL"

  output="$(run_json_command_with_env "$repo_dir" PATH="$wrapper_dir:$PATH" "$EXEC_BIN" gate-review --plan "$PLAN_REL")"
  assert_json_equals "$output" "allowed" "false" "gate-review source spec fingerprint unavailable"
  assert_json_equals "$output" "failure_class" "StaleExecutionEvidence" "gate-review source spec fingerprint unavailable"
  assert_json_equals "$output" "reason_codes.0" "source_spec_fingerprint_unavailable" "gate-review source spec fingerprint unavailable"
}

run_gate_review_rejects_packet_fingerprint_unavailable() {
  local repo_dir="$REPO_DIR/gate-review-packet-fingerprint-unavailable"
  local wrapper_dir="$repo_dir/.hash-fail-contract"
  local output

  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_checked_single_step_plan "$repo_dir" "superpowers:executing-plans"
  write_v2_completed_attempt "$repo_dir" "packet-fingerprint-from-approved-plan"
  install_hash_fail_wrapper "$wrapper_dir" ".contract."

  output="$(run_json_command_with_env "$repo_dir" PATH="$wrapper_dir:$PATH" "$EXEC_BIN" gate-review --plan "$PLAN_REL")"
  assert_json_equals "$output" "allowed" "false" "gate-review packet fingerprint unavailable"
  assert_json_equals "$output" "failure_class" "StaleExecutionEvidence" "gate-review packet fingerprint unavailable"
  assert_json_equals "$output" "reason_codes.0" "packet_fingerprint_unavailable" "gate-review packet fingerprint unavailable"
}

run_gate_review_rejects_missed_reopen_after_file_drift() {
  local repo_dir="$REPO_DIR/gate-review-missed-reopen"
  local output

  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_checked_single_step_plan "$repo_dir" "superpowers:executing-plans"
  write_v2_completed_attempt "$repo_dir" "packet-fingerprint-from-approved-plan"
  printf 'drift after completion\n' > "$repo_dir/docs/example-output.md"

  output="$(run_json_command "$repo_dir" gate-review --plan "$PLAN_REL")"
  assert_json_equals "$output" "allowed" "false" "gate-review missed reopen"
  assert_json_equals "$output" "failure_class" "MissedReopenRequired" "gate-review missed reopen"
  assert_json_equals "$output" "reason_codes.0" "files_proven_drifted" "gate-review missed reopen"
}

run_gate_review_ignores_current_plan_and_evidence_file_proofs() {
  local repo_dir="$REPO_DIR/gate-review-ignores-bookkeeping-proofs"
  local output
  local evidence_rel

  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_checked_single_step_plan "$repo_dir" "superpowers:executing-plans"
  write_v2_completed_attempt "$repo_dir" "packet-fingerprint-from-approved-plan"
  evidence_rel="$(evidence_rel_path "$PLAN_REL" 1)"

  node - <<'NODE' "$repo_dir/$evidence_rel" "$PLAN_REL" "$evidence_rel"
const fs = require("fs");
const [file, planRel, evidenceRel] = process.argv.slice(2);
const source = fs.readFileSync(file, "utf8");
  fs.writeFileSync(
  file,
  source.replace(
    /(\*\*Files Proven:\*\*\n- docs\/example-output\.md \| sha256:[^\n]+\n)/,
    `$1- ${planRel} | sha256:0000000000000000000000000000000000000000000000000000000000000000\n- ${evidenceRel} | sha256:1111111111111111111111111111111111111111111111111111111111111111\n`,
  ),
);
NODE

  output="$(run_json_command "$repo_dir" gate-review --plan "$PLAN_REL")"
  assert_json_equals "$output" "allowed" "true" "gate-review bookkeeping proofs"
}

run_gate_review_accepts_file_reproved_by_later_completed_step() {
  local repo_dir
  local before_first
  local active_first
  local before_second
  local active_second
  local output

  repo_dir="$REPO_DIR/gate-review-reproved-file"
  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_two_step_review_plan "$repo_dir" "none"
  write_file "$repo_dir/docs/shared-output.md" <<'EOF'
first proof
EOF

  before_first="$(run_json_command "$repo_dir" status --plan "$PLAN_REL")"
  active_first="$(run_json_command "$repo_dir" begin --plan "$PLAN_REL" --task 1 --step 1 --execution-mode superpowers:executing-plans --expect-execution-fingerprint "$(json_value "$before_first" "execution_fingerprint")")"
  run_json_command "$repo_dir" complete --plan "$PLAN_REL" --task 1 --step 1 --source superpowers:executing-plans --claim "Prepared the workspace" --file docs/shared-output.md --manual-verify-summary "Verified the first proof" --expect-execution-fingerprint "$(json_value "$active_first" "execution_fingerprint")" >/dev/null

  write_file "$repo_dir/docs/shared-output.md" <<'EOF'
second proof
EOF

  before_second="$(run_json_command "$repo_dir" status --plan "$PLAN_REL")"
  active_second="$(run_json_command "$repo_dir" begin --plan "$PLAN_REL" --task 1 --step 2 --expect-execution-fingerprint "$(json_value "$before_second" "execution_fingerprint")")"
  run_json_command "$repo_dir" complete --plan "$PLAN_REL" --task 1 --step 2 --source superpowers:executing-plans --claim "Validated the generated output" --file docs/shared-output.md --manual-verify-summary "Verified the later proof" --expect-execution-fingerprint "$(json_value "$active_second" "execution_fingerprint")" >/dev/null

  output="$(run_json_command "$repo_dir" gate-review --plan "$PLAN_REL")"
  assert_json_equals "$output" "allowed" "true" "gate-review later reproved file"
}

run_gate_review_rejects_corrupted_nonlatest_packet_fingerprint() {
  local repo_dir
  local before_first
  local active_first
  local before_second
  local active_second
  local evidence_rel
  local output

  repo_dir="$REPO_DIR/gate-review-corrupted-older-packet"
  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_two_step_review_plan "$repo_dir" "none"
  write_file "$repo_dir/docs/shared-output.md" <<'EOF'
first proof
EOF

  before_first="$(run_json_command "$repo_dir" status --plan "$PLAN_REL")"
  active_first="$(run_json_command "$repo_dir" begin --plan "$PLAN_REL" --task 1 --step 1 --execution-mode superpowers:executing-plans --expect-execution-fingerprint "$(json_value "$before_first" "execution_fingerprint")")"
  run_json_command "$repo_dir" complete --plan "$PLAN_REL" --task 1 --step 1 --source superpowers:executing-plans --claim "Prepared the workspace" --file docs/shared-output.md --manual-verify-summary "Verified the first proof" --expect-execution-fingerprint "$(json_value "$active_first" "execution_fingerprint")" >/dev/null

  write_file "$repo_dir/docs/shared-output.md" <<'EOF'
second proof
EOF

  before_second="$(run_json_command "$repo_dir" status --plan "$PLAN_REL")"
  active_second="$(run_json_command "$repo_dir" begin --plan "$PLAN_REL" --task 1 --step 2 --expect-execution-fingerprint "$(json_value "$before_second" "execution_fingerprint")")"
  run_json_command "$repo_dir" complete --plan "$PLAN_REL" --task 1 --step 2 --source superpowers:executing-plans --claim "Validated the generated output" --file docs/shared-output.md --manual-verify-summary "Verified the later proof" --expect-execution-fingerprint "$(json_value "$active_second" "execution_fingerprint")" >/dev/null

  evidence_rel="$(evidence_rel_path "$PLAN_REL" 1)"
  node - <<'NODE' "$repo_dir/$evidence_rel"
const fs = require("fs");
const file = process.argv[2];
const source = fs.readFileSync(file, "utf8");
fs.writeFileSync(
  file,
  source.replace(
    /(### Task 1 Step 1[\s\S]*?\*\*Packet Fingerprint:\*\* )([^\n]+)/,
    "$1packet-fingerprint-mismatch",
  ),
);
NODE

  output="$(run_json_command "$repo_dir" gate-review --plan "$PLAN_REL")"
  assert_json_equals "$output" "allowed" "false" "gate-review corrupted older packet"
  assert_json_equals "$output" "failure_class" "StaleExecutionEvidence" "gate-review corrupted older packet"
  assert_json_equals "$output" "reason_codes.0" "packet_fingerprint_mismatch" "gate-review corrupted older packet"
}

run_gate_review_reuses_hash_work_for_large_v2_fixture() {
  local repo_dir="$REPO_DIR/gate-review-hash-count"
  local wrapper_dir="$repo_dir/.hash-counter"
  local counter_file="$wrapper_dir/count"
  local output
  local hash_invocations

  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_large_checked_plan "$repo_dir" "superpowers:executing-plans" 45 3
  write_large_v2_evidence_fixture_with_real_proofs "$repo_dir" 45 3
  install_hash_counter_wrapper "$wrapper_dir" "$counter_file"

  output="$(cd "$repo_dir" && PATH="$wrapper_dir:$PATH" "$EXEC_BIN" gate-review --plan "$PLAN_REL" 2>&1)"
  assert_json_equals "$output" "allowed" "true" "gate-review hash-count"
  hash_invocations="$(cat "$counter_file")"
  if (( hash_invocations > 200 )); then
    echo "Expected gate-review to avoid repeated hash work on a large fixture; saw ${hash_invocations} hash-tool invocations."
    exit 1
  fi
}

run_gate_review_completes_quickly_for_large_v2_fixture() {
  local repo_dir="$REPO_DIR/gate-review-timeout"
  local output

  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_large_checked_plan "$repo_dir" "superpowers:executing-plans" 45 3
  write_large_v2_evidence_fixture_with_real_proofs "$repo_dir" 45 3

  run_json_command "$repo_dir" gate-review --plan "$PLAN_REL" >/dev/null
  output="$(run_json_command_with_timeout "$repo_dir" 2 gate-review --plan "$PLAN_REL")"
  assert_json_equals "$output" "allowed" "true" "gate-review timeout"
}

run_gate_review_cache_invalidates_after_proof_drift() {
  local repo_dir="$REPO_DIR/gate-review-cache-invalidates"
  local output

  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_checked_single_step_plan "$repo_dir" "superpowers:executing-plans"
  write_v2_completed_attempt "$repo_dir" "packet-fingerprint-from-approved-plan"

  output="$(run_json_command "$repo_dir" gate-review --plan "$PLAN_REL")"
  assert_json_equals "$output" "allowed" "true" "gate-review cache initial"

  printf 'drift after cache warm\\n' > "$repo_dir/docs/example-output.md"
  output="$(run_json_command "$repo_dir" gate-review --plan "$PLAN_REL")"
  assert_json_equals "$output" "allowed" "false" "gate-review cache drift"
  assert_json_equals "$output" "reason_codes.0" "files_proven_drifted" "gate-review cache drift"
}

run_gate_review_cache_invalidates_after_same_size_same_mtime_proof_drift() {
  local repo_dir="$REPO_DIR/gate-review-cache-same-size-drift"
  local output

  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_checked_single_step_plan "$repo_dir" "superpowers:executing-plans"
  write_v2_completed_attempt "$repo_dir" "packet-fingerprint-from-approved-plan"

  output="$(run_json_command "$repo_dir" gate-review --plan "$PLAN_REL")"
  assert_json_equals "$output" "allowed" "true" "gate-review same-size cache initial"

  rewrite_file_preserving_mtime \
    "$repo_dir/docs/example-output.md" \
    $'changed! output\n'
  output="$(run_json_command "$repo_dir" gate-review --plan "$PLAN_REL")"
  assert_json_equals "$output" "allowed" "false" "gate-review same-size cache drift"
  assert_json_equals "$output" "reason_codes.0" "files_proven_drifted" "gate-review same-size cache drift"
}

run_gate_review_cache_invalidates_after_sibling_approved_spec_change() {
  local repo_dir="$REPO_DIR/gate-review-cache-sibling-spec"
  local output

  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_checked_single_step_plan "$repo_dir" "superpowers:executing-plans"
  write_v2_completed_attempt "$repo_dir" "packet-fingerprint-from-approved-plan"

  output="$(run_json_command "$repo_dir" gate-review --plan "$PLAN_REL")"
  assert_json_equals "$output" "allowed" "true" "gate-review sibling spec cache initial"

  write_newer_approved_spec_same_revision_different_path "$repo_dir"
  output="$(run_json_command "$repo_dir" gate-review --plan "$PLAN_REL")"
  assert_json_equals "$output" "allowed" "false" "gate-review sibling spec cache stale"
  assert_json_equals "$output" "failure_class" "PlanNotExecutionReady" "gate-review sibling spec cache stale"
  assert_json_equals "$output" "reason_codes.0" "plan_not_execution_ready" "gate-review sibling spec cache stale"
}

run_gate_finish_blocks_missing_release_artifact() {
  local repo_dir="$REPO_DIR/gate-finish-missing-release"
  local output

  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_plan "$repo_dir" "superpowers:executing-plans"
  mark_all_plan_steps_checked "$repo_dir"
  write_v2_completed_attempts_for_finished_plan "$repo_dir"
  write_test_plan_artifact "$repo_dir" "no" >/dev/null

  output="$(run_json_command "$repo_dir" gate-finish --plan "$PLAN_REL")"
  assert_json_equals "$output" "allowed" "false" "gate-finish missing release"
  assert_json_equals "$output" "failure_class" "ReleaseArtifactNotFresh" "gate-finish missing release"
  assert_json_equals "$output" "reason_codes.0" "release_artifact_missing" "gate-finish missing release"
}

run_gate_finish_blocks_missing_qa_artifact_when_required() {
  local repo_dir="$REPO_DIR/gate-finish-missing-qa"
  local output

  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_plan "$repo_dir" "superpowers:executing-plans"
  mark_all_plan_steps_checked "$repo_dir"
  write_v2_completed_attempts_for_finished_plan "$repo_dir"
  write_test_plan_artifact "$repo_dir" "yes" >/dev/null
  write_release_readiness_artifact "$repo_dir" "pass" >/dev/null

  output="$(run_json_command "$repo_dir" gate-finish --plan "$PLAN_REL")"
  assert_json_equals "$output" "allowed" "false" "gate-finish missing qa"
  assert_json_equals "$output" "failure_class" "QaArtifactNotFresh" "gate-finish missing qa"
  assert_json_equals "$output" "reason_codes.0" "qa_artifact_missing" "gate-finish missing qa"
}

run_gate_finish_blocks_missing_branch_specific_test_plan_artifact() {
  local repo_dir="$REPO_DIR/gate-finish-missing-test-plan"
  local output
  local project_dir

  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_plan "$repo_dir" "superpowers:executing-plans"
  mark_all_plan_steps_checked "$repo_dir"
  write_v2_completed_attempts_for_finished_plan "$repo_dir"
  project_dir="$SUPERPOWERS_STATE_DIR/projects/$(basename "$repo_dir")"
  mkdir -p "$project_dir"
  write_file "$project_dir/test-user-test-plan-20260322-120000.md" <<EOF
# Test Plan
**Source Plan:** \`${PLAN_REL}\`
**Source Plan Revision:** 1
**Branch:** other-branch
**Repo:** $(basename "$repo_dir")
**Browser QA Required:** no
**Generated By:** superpowers:plan-eng-review
**Generated At:** 2026-03-22T12:00:00Z
EOF
  write_release_readiness_artifact "$repo_dir" "pass" >/dev/null

  output="$(run_json_command "$repo_dir" gate-finish --plan "$PLAN_REL")"
  assert_json_equals "$output" "allowed" "false" "gate-finish missing test plan"
  assert_json_equals "$output" "failure_class" "QaArtifactNotFresh" "gate-finish missing test plan"
  assert_json_equals "$output" "reason_codes.0" "test_plan_artifact_missing" "gate-finish missing test plan"
}

run_gate_finish_blocks_malformed_test_plan_artifact() {
  local repo_dir="$REPO_DIR/gate-finish-malformed-test-plan"
  local output
  local test_plan_path

  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_plan "$repo_dir" "superpowers:executing-plans"
  mark_all_plan_steps_checked "$repo_dir"
  write_v2_completed_attempts_for_finished_plan "$repo_dir"
  test_plan_path="$(write_test_plan_artifact "$repo_dir" "no")"
  replace_in_file "$test_plan_path" "# Test Plan" "# Broken Test Plan"
  write_release_readiness_artifact "$repo_dir" "pass" >/dev/null

  output="$(run_json_command "$repo_dir" gate-finish --plan "$PLAN_REL")"
  assert_json_equals "$output" "allowed" "false" "gate-finish malformed test plan"
  assert_json_equals "$output" "failure_class" "QaArtifactNotFresh" "gate-finish malformed test plan"
  assert_json_equals "$output" "reason_codes.0" "test_plan_artifact_malformed" "gate-finish malformed test plan"
}

run_gate_finish_blocks_stale_test_plan_artifact() {
  local repo_dir="$REPO_DIR/gate-finish-stale-test-plan"
  local output
  local test_plan_path

  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_plan "$repo_dir" "superpowers:executing-plans"
  mark_all_plan_steps_checked "$repo_dir"
  write_v2_completed_attempts_for_finished_plan "$repo_dir"
  test_plan_path="$(write_test_plan_artifact "$repo_dir" "no")"
  replace_in_file "$test_plan_path" "**Source Plan Revision:** 1" "**Source Plan Revision:** 2"
  write_release_readiness_artifact "$repo_dir" "pass" >/dev/null

  output="$(run_json_command "$repo_dir" gate-finish --plan "$PLAN_REL")"
  assert_json_equals "$output" "allowed" "false" "gate-finish stale test plan"
  assert_json_equals "$output" "failure_class" "QaArtifactNotFresh" "gate-finish stale test plan"
  assert_json_equals "$output" "reason_codes.0" "test_plan_artifact_stale" "gate-finish stale test plan"
}

run_gate_finish_blocks_malformed_qa_artifact() {
  local repo_dir="$REPO_DIR/gate-finish-malformed-qa"
  local output
  local test_plan_path
  local qa_artifact_path

  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_plan "$repo_dir" "superpowers:executing-plans"
  mark_all_plan_steps_checked "$repo_dir"
  write_v2_completed_attempts_for_finished_plan "$repo_dir"
  test_plan_path="$(write_test_plan_artifact "$repo_dir" "yes")"
  qa_artifact_path="$(write_qa_result_artifact "$repo_dir" "$test_plan_path" "pass")"
  replace_in_file "$qa_artifact_path" "# QA Result" "# Broken QA Result"
  write_release_readiness_artifact "$repo_dir" "pass" >/dev/null

  output="$(run_json_command "$repo_dir" gate-finish --plan "$PLAN_REL")"
  assert_json_equals "$output" "allowed" "false" "gate-finish malformed qa"
  assert_json_equals "$output" "failure_class" "QaArtifactNotFresh" "gate-finish malformed qa"
  assert_json_equals "$output" "reason_codes.0" "qa_artifact_malformed" "gate-finish malformed qa"
}

run_gate_finish_blocks_qa_artifact_plan_mismatch() {
  local repo_dir="$REPO_DIR/gate-finish-qa-plan-mismatch"
  local output
  local test_plan_path
  local qa_artifact_path

  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_plan "$repo_dir" "superpowers:executing-plans"
  mark_all_plan_steps_checked "$repo_dir"
  write_v2_completed_attempts_for_finished_plan "$repo_dir"
  test_plan_path="$(write_test_plan_artifact "$repo_dir" "yes")"
  qa_artifact_path="$(write_qa_result_artifact "$repo_dir" "$test_plan_path" "pass")"
  replace_in_file "$qa_artifact_path" "**Source Plan Revision:** 1" "**Source Plan Revision:** 2"
  write_release_readiness_artifact "$repo_dir" "pass" >/dev/null

  output="$(run_json_command "$repo_dir" gate-finish --plan "$PLAN_REL")"
  assert_json_equals "$output" "allowed" "false" "gate-finish qa plan mismatch"
  assert_json_equals "$output" "failure_class" "QaArtifactNotFresh" "gate-finish qa plan mismatch"
  assert_json_equals "$output" "reason_codes.0" "qa_artifact_plan_mismatch" "gate-finish qa plan mismatch"
}

run_gate_finish_blocks_qa_artifact_branch_mismatch() {
  local repo_dir="$REPO_DIR/gate-finish-qa-branch-mismatch"
  local output
  local test_plan_path
  local qa_artifact_path
  local branch_name

  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_plan "$repo_dir" "superpowers:executing-plans"
  mark_all_plan_steps_checked "$repo_dir"
  write_v2_completed_attempts_for_finished_plan "$repo_dir"
  test_plan_path="$(write_test_plan_artifact "$repo_dir" "yes")"
  qa_artifact_path="$(write_qa_result_artifact "$repo_dir" "$test_plan_path" "pass")"
  branch_name="$(git -C "$repo_dir" rev-parse --abbrev-ref HEAD)"
  replace_in_file "$qa_artifact_path" "**Branch:** ${branch_name}" "**Branch:** other-branch"
  write_release_readiness_artifact "$repo_dir" "pass" >/dev/null

  output="$(run_json_command "$repo_dir" gate-finish --plan "$PLAN_REL")"
  assert_json_equals "$output" "allowed" "false" "gate-finish qa branch mismatch"
  assert_json_equals "$output" "failure_class" "QaArtifactNotFresh" "gate-finish qa branch mismatch"
  assert_json_equals "$output" "reason_codes.0" "qa_artifact_branch_mismatch" "gate-finish qa branch mismatch"
}

run_gate_finish_blocks_qa_artifact_head_mismatch() {
  local repo_dir="$REPO_DIR/gate-finish-qa-head-mismatch"
  local output
  local test_plan_path
  local qa_artifact_path
  local head_sha

  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_plan "$repo_dir" "superpowers:executing-plans"
  mark_all_plan_steps_checked "$repo_dir"
  write_v2_completed_attempts_for_finished_plan "$repo_dir"
  test_plan_path="$(write_test_plan_artifact "$repo_dir" "yes")"
  qa_artifact_path="$(write_qa_result_artifact "$repo_dir" "$test_plan_path" "pass")"
  head_sha="$(git -C "$repo_dir" rev-parse HEAD)"
  replace_in_file "$qa_artifact_path" "**Head SHA:** ${head_sha}" "**Head SHA:** deadbeef"
  write_release_readiness_artifact "$repo_dir" "pass" >/dev/null

  output="$(run_json_command "$repo_dir" gate-finish --plan "$PLAN_REL")"
  assert_json_equals "$output" "allowed" "false" "gate-finish qa head mismatch"
  assert_json_equals "$output" "failure_class" "QaArtifactNotFresh" "gate-finish qa head mismatch"
  assert_json_equals "$output" "reason_codes.0" "qa_artifact_head_mismatch" "gate-finish qa head mismatch"
}

run_gate_finish_blocks_qa_source_test_plan_mismatch() {
  local repo_dir="$REPO_DIR/gate-finish-qa-source-test-plan-mismatch"
  local output
  local test_plan_path
  local qa_artifact_path

  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_plan "$repo_dir" "superpowers:executing-plans"
  mark_all_plan_steps_checked "$repo_dir"
  write_v2_completed_attempts_for_finished_plan "$repo_dir"
  test_plan_path="$(write_test_plan_artifact "$repo_dir" "yes")"
  qa_artifact_path="$(write_qa_result_artifact "$repo_dir" "$test_plan_path" "pass")"
  replace_in_file "$qa_artifact_path" "**Source Test Plan:** \`${test_plan_path}\`" "**Source Test Plan:** \`$test_plan_path.stale\`"
  write_release_readiness_artifact "$repo_dir" "pass" >/dev/null

  output="$(run_json_command "$repo_dir" gate-finish --plan "$PLAN_REL")"
  assert_json_equals "$output" "allowed" "false" "gate-finish qa source test plan mismatch"
  assert_json_equals "$output" "failure_class" "QaArtifactNotFresh" "gate-finish qa source test plan mismatch"
  assert_json_equals "$output" "reason_codes.0" "qa_artifact_source_test_plan_mismatch" "gate-finish qa source test plan mismatch"
}

run_gate_finish_blocks_qa_result_not_pass() {
  local repo_dir="$REPO_DIR/gate-finish-qa-result-not-pass"
  local output
  local test_plan_path

  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_plan "$repo_dir" "superpowers:executing-plans"
  mark_all_plan_steps_checked "$repo_dir"
  write_v2_completed_attempts_for_finished_plan "$repo_dir"
  test_plan_path="$(write_test_plan_artifact "$repo_dir" "yes")"
  write_qa_result_artifact "$repo_dir" "$test_plan_path" "blocked" >/dev/null
  write_release_readiness_artifact "$repo_dir" "pass" >/dev/null

  output="$(run_json_command "$repo_dir" gate-finish --plan "$PLAN_REL")"
  assert_json_equals "$output" "allowed" "false" "gate-finish qa result not pass"
  assert_json_equals "$output" "failure_class" "QaArtifactNotFresh" "gate-finish qa result not pass"
  assert_json_equals "$output" "reason_codes.0" "qa_result_not_pass" "gate-finish qa result not pass"
}

run_gate_finish_blocks_malformed_release_artifact() {
  local repo_dir="$REPO_DIR/gate-finish-malformed-release"
  local output
  local release_artifact_path

  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_plan "$repo_dir" "superpowers:executing-plans"
  mark_all_plan_steps_checked "$repo_dir"
  write_v2_completed_attempts_for_finished_plan "$repo_dir"
  write_test_plan_artifact "$repo_dir" "no" >/dev/null
  release_artifact_path="$(write_release_readiness_artifact "$repo_dir" "pass")"
  replace_in_file "$release_artifact_path" "# Release Readiness Result" "# Broken Release Readiness"

  output="$(run_json_command "$repo_dir" gate-finish --plan "$PLAN_REL")"
  assert_json_equals "$output" "allowed" "false" "gate-finish malformed release"
  assert_json_equals "$output" "failure_class" "ReleaseArtifactNotFresh" "gate-finish malformed release"
  assert_json_equals "$output" "reason_codes.0" "release_artifact_malformed" "gate-finish malformed release"
}

run_gate_finish_blocks_release_artifact_plan_mismatch() {
  local repo_dir="$REPO_DIR/gate-finish-release-plan-mismatch"
  local output
  local release_artifact_path

  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_plan "$repo_dir" "superpowers:executing-plans"
  mark_all_plan_steps_checked "$repo_dir"
  write_v2_completed_attempts_for_finished_plan "$repo_dir"
  write_test_plan_artifact "$repo_dir" "no" >/dev/null
  release_artifact_path="$(write_release_readiness_artifact "$repo_dir" "pass")"
  replace_in_file "$release_artifact_path" "**Source Plan Revision:** 1" "**Source Plan Revision:** 2"

  output="$(run_json_command "$repo_dir" gate-finish --plan "$PLAN_REL")"
  assert_json_equals "$output" "allowed" "false" "gate-finish release plan mismatch"
  assert_json_equals "$output" "failure_class" "ReleaseArtifactNotFresh" "gate-finish release plan mismatch"
  assert_json_equals "$output" "reason_codes.0" "release_artifact_plan_mismatch" "gate-finish release plan mismatch"
}

run_gate_finish_blocks_release_artifact_branch_mismatch() {
  local repo_dir="$REPO_DIR/gate-finish-release-branch-mismatch"
  local output
  local release_artifact_path
  local branch_name

  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_plan "$repo_dir" "superpowers:executing-plans"
  mark_all_plan_steps_checked "$repo_dir"
  write_v2_completed_attempts_for_finished_plan "$repo_dir"
  write_test_plan_artifact "$repo_dir" "no" >/dev/null
  release_artifact_path="$(write_release_readiness_artifact "$repo_dir" "pass")"
  branch_name="$(current_branch_name "$repo_dir")"
  replace_in_file "$release_artifact_path" "**Branch:** ${branch_name}" "**Branch:** other-branch"

  output="$(run_json_command "$repo_dir" gate-finish --plan "$PLAN_REL")"
  assert_json_equals "$output" "allowed" "false" "gate-finish release branch mismatch"
  assert_json_equals "$output" "failure_class" "ReleaseArtifactNotFresh" "gate-finish release branch mismatch"
  assert_json_equals "$output" "reason_codes.0" "release_artifact_branch_mismatch" "gate-finish release branch mismatch"
}

run_gate_finish_blocks_release_result_not_pass() {
  local repo_dir="$REPO_DIR/gate-finish-release-result-not-pass"
  local output

  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_plan "$repo_dir" "superpowers:executing-plans"
  mark_all_plan_steps_checked "$repo_dir"
  write_v2_completed_attempts_for_finished_plan "$repo_dir"
  write_test_plan_artifact "$repo_dir" "no" >/dev/null
  write_release_readiness_artifact "$repo_dir" "blocked" >/dev/null

  output="$(run_json_command "$repo_dir" gate-finish --plan "$PLAN_REL")"
  assert_json_equals "$output" "allowed" "false" "gate-finish release result not pass"
  assert_json_equals "$output" "failure_class" "ReleaseArtifactNotFresh" "gate-finish release result not pass"
  assert_json_equals "$output" "reason_codes.0" "release_result_not_pass" "gate-finish release result not pass"
}

run_gate_finish_blocks_stale_release_artifact_head_mismatch() {
  local repo_dir="$REPO_DIR/gate-finish-stale-release"
  local output
  local old_head

  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_plan "$repo_dir" "superpowers:executing-plans"
  mark_all_plan_steps_checked "$repo_dir"
  write_v2_completed_attempts_for_finished_plan "$repo_dir"
  write_test_plan_artifact "$repo_dir" "no" >/dev/null
  old_head="$(git -C "$repo_dir" rev-parse HEAD)"
  write_release_readiness_artifact "$repo_dir" "pass" "$old_head" >/dev/null
  commit_file "$repo_dir" "docs/follow-up.txt" "later drift"

  output="$(run_json_command "$repo_dir" gate-finish --plan "$PLAN_REL")"
  assert_json_equals "$output" "allowed" "false" "gate-finish stale release"
  assert_json_equals "$output" "failure_class" "ReleaseArtifactNotFresh" "gate-finish stale release"
  assert_json_equals "$output" "reason_codes.0" "release_artifact_head_mismatch" "gate-finish stale release"
}

run_gate_finish_blocks_release_artifact_base_branch_mismatch() {
  local repo_dir="$REPO_DIR/gate-finish-base-branch-mismatch"
  local output
  local test_plan_path

  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_plan "$repo_dir" "superpowers:executing-plans"
  mark_all_plan_steps_checked "$repo_dir"
  write_v2_completed_attempts_for_finished_plan "$repo_dir"
  test_plan_path="$(write_test_plan_artifact "$repo_dir" "yes")"
  write_qa_result_artifact "$repo_dir" "$test_plan_path" "pass" >/dev/null
  write_release_readiness_artifact "$repo_dir" "pass" "" "develop" >/dev/null

  output="$(run_json_command "$repo_dir" gate-finish --plan "$PLAN_REL")"
  assert_json_equals "$output" "allowed" "false" "gate-finish base branch mismatch"
  assert_json_equals "$output" "failure_class" "ReleaseArtifactNotFresh" "gate-finish base branch mismatch"
  assert_json_equals "$output" "reason_codes.0" "release_artifact_base_branch_mismatch" "gate-finish base branch mismatch"
}

run_gate_finish_blocks_release_artifact_base_branch_unresolved() {
  local repo_dir="$REPO_DIR/gate-finish-base-branch-unresolved"
  local output

  init_repo "$repo_dir"
  git -C "$repo_dir" branch -m feature-a
  git -C "$repo_dir" branch feature-b
  write_approved_spec "$repo_dir"
  write_plan "$repo_dir" "superpowers:executing-plans"
  mark_all_plan_steps_checked "$repo_dir"
  write_v2_completed_attempts_for_finished_plan "$repo_dir"

  output="$(run_json_command "$repo_dir" gate-finish --plan "$PLAN_REL")"
  assert_json_equals "$output" "allowed" "false" "gate-finish base branch unresolved"
  assert_json_equals "$output" "failure_class" "ReleaseArtifactNotFresh" "gate-finish base branch unresolved"
  assert_json_equals "$output" "reason_codes.0" "release_artifact_base_branch_unresolved" "gate-finish base branch unresolved"
}

run_gate_finish_allows_fresh_structured_artifacts() {
  local repo_dir="$REPO_DIR/gate-finish-fresh"
  local output
  local test_plan_path

  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_plan "$repo_dir" "superpowers:executing-plans"
  mark_all_plan_steps_checked "$repo_dir"
  write_v2_completed_attempts_for_finished_plan "$repo_dir"
  test_plan_path="$(write_test_plan_artifact "$repo_dir" "yes")"
  write_qa_result_artifact "$repo_dir" "$test_plan_path" "pass" >/dev/null
  write_release_readiness_artifact "$repo_dir" "pass" >/dev/null

  output="$(run_json_command "$repo_dir" gate-finish --plan "$PLAN_REL")"
  assert_json_equals "$output" "allowed" "true" "gate-finish fresh artifacts"
  assert_json_equals "$output" "failure_class" "" "gate-finish fresh artifacts"
}

run_gate_finish_allows_master_default_branch_without_origin_head() {
  local repo_dir="$REPO_DIR/gate-finish-master-default"
  local output

  init_repo "$repo_dir"
  git -C "$repo_dir" branch -m master
  write_approved_spec "$repo_dir"
  write_plan "$repo_dir" "superpowers:executing-plans"
  mark_all_plan_steps_checked "$repo_dir"
  write_v2_completed_attempts_for_finished_plan "$repo_dir"
  write_test_plan_artifact "$repo_dir" "no" >/dev/null
  write_release_readiness_artifact "$repo_dir" "pass" >/dev/null

  output="$(run_json_command "$repo_dir" gate-finish --plan "$PLAN_REL")"
  assert_json_equals "$output" "allowed" "true" "gate-finish master default"
  assert_json_equals "$output" "failure_class" "" "gate-finish master default"
}

run_status_rejects_malformed_note_structure() {
  local repo_dir="$REPO_DIR/malformed-note-state"
  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_file "$repo_dir/$PLAN_REL" <<EOF
# Example Execution Plan

**Workflow State:** Engineering Approved
**Plan Revision:** 1
**Execution Mode:** none
**Source Spec:** \`${SPEC_REL}\`
**Source Spec Revision:** 1
**Last Reviewed By:** plan-eng-review

## Task 1: Core flow

**Files:**
- Modify: \`docs/example-output.md\`
- Test: \`bash tests/codex-runtime/test-superpowers-plan-execution.sh\`

- [ ] **Step 1: Prepare workspace for execution**

  **Execution Note:** Active - Running workspace prep
  **Execution Note:** Interrupted - Duplicate note should fail

- [ ] **Step 2: Validate the generated output**
EOF

  upgrade_plan_fixture_to_full_contract "$repo_dir/$PLAN_REL"

  run_command_fails "$repo_dir" MalformedExecutionState status --plan "$PLAN_REL" >/dev/null
}

run_status_rejects_task_without_parseable_files_block() {
  local repo_dir="$REPO_DIR/missing-files-block"

  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_file "$repo_dir/$PLAN_REL" <<EOF
# Example Execution Plan

**Workflow State:** Engineering Approved
**Plan Revision:** 1
**Execution Mode:** none
**Source Spec:** \`${SPEC_REL}\`
**Source Spec Revision:** 1
**Last Reviewed By:** plan-eng-review

## Task 1: Core flow

- [ ] **Step 1: Prepare workspace for execution**
- [ ] **Step 2: Validate the generated output**
EOF

  upgrade_plan_fixture_to_full_contract "$repo_dir/$PLAN_REL"

  run_command_fails "$repo_dir" PlanNotExecutionReady status --plan "$PLAN_REL" >/dev/null
}

run_status_rejects_malformed_evidence_attempt_fields() {
  local repo_dir="$REPO_DIR/malformed-evidence-fields"
  local evidence_rel

  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_plan "$repo_dir" "superpowers:executing-plans"
  evidence_rel="$(evidence_rel_path "$PLAN_REL" 1)"
  write_file "$repo_dir/$evidence_rel" <<EOF
# Execution Evidence: 2026-03-17-example-execution-plan

**Plan Path:** ${PLAN_REL}
**Plan Revision:** 1

## Step Evidence

### Task 1 Step 1
#### Attempt 1
**Status:** Invalidated
**Recorded At:** 2026-03-17T14:22:31Z
**Execution Source:** superpowers:executing-plans
**Claim:** Prepared the workspace for execution.
**Files:**
- docs/example-output.md
**Verification:**
- \`bash tests/codex-runtime/test-superpowers-plan-execution.sh\` -> passed in fixture setup
**Invalidation Reason:** N/A
EOF

  run_command_fails "$repo_dir" MalformedExecutionState status --plan "$PLAN_REL" >/dev/null
}

run_status_rejects_evidence_for_nonexistent_step() {
  local repo_dir="$REPO_DIR/nonexistent-evidence-step"
  local evidence_rel

  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_plan "$repo_dir" "superpowers:executing-plans"
  write_v2_completed_attempt "$repo_dir" "packet-fingerprint-from-approved-plan"
  evidence_rel="$(evidence_rel_path "$PLAN_REL" 1)"
  node - <<'NODE' "$repo_dir/$evidence_rel"
const fs = require("fs");
const file = process.argv[2];
const source = fs.readFileSync(file, "utf8");
fs.writeFileSync(
  file,
  source + "\n### Task 9 Step 9\n#### Attempt 1\n**Status:** Completed\n**Recorded At:** 2026-03-17T15:00:00Z\n**Execution Source:** superpowers:executing-plans\n**Task Number:** 9\n**Step Number:** 9\n**Packet Fingerprint:** packet-fingerprint-from-approved-plan\n**Head SHA:** abc123\n**Claim:** Impossible step evidence.\n**Files Proven:**\n- docs/example-output.md | sha256:deadbeef\n**Verification Summary:** Manual inspection only: impossible step\n**Invalidation Reason:** N/A\n",
);
NODE

  run_command_fails "$repo_dir" MalformedExecutionState status --plan "$PLAN_REL" >/dev/null
}

# Parser-hardening regressions for repo-edited plan state.
run_status_rejects_whitespace_only_execution_note_summary() {
  local repo_dir="$REPO_DIR/whitespace-only-execution-note-summary"
  local whitespace

  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  whitespace="$(three_spaces)"
  write_file "$repo_dir/$PLAN_REL" <<EOF
# Example Execution Plan

**Workflow State:** Engineering Approved
**Plan Revision:** 1
**Execution Mode:** none
**Source Spec:** \`${SPEC_REL}\`
**Source Spec Revision:** 1
**Last Reviewed By:** plan-eng-review

## Task 1: Core flow

**Files:**
- Modify: \`docs/example-output.md\`
- Test: \`bash tests/codex-runtime/test-superpowers-plan-execution.sh\`

- [ ] **Step 1: Prepare workspace for execution**

  **Execution Note:** Blocked - ${whitespace}

- [ ] **Step 2: Validate the generated output**
EOF

  upgrade_plan_fixture_to_full_contract "$repo_dir/$PLAN_REL"

  run_command_fails "$repo_dir" MalformedExecutionState status --plan "$PLAN_REL"
}

run_status_rejects_overlong_execution_note_summary() {
  local repo_dir="$REPO_DIR/overlong-execution-note-summary"
  local long_summary

  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  long_summary="$(printf 'x%.0s' {1..121})"
  write_file "$repo_dir/$PLAN_REL" <<EOF
# Example Execution Plan

**Workflow State:** Engineering Approved
**Plan Revision:** 1
**Execution Mode:** superpowers:executing-plans
**Source Spec:** \`${SPEC_REL}\`
**Source Spec Revision:** 1
**Last Reviewed By:** plan-eng-review

## Task 1: Core flow

**Files:**
- Modify: \`docs/example-output.md\`
- Test: \`bash tests/codex-runtime/test-superpowers-plan-execution.sh\`

- [ ] **Step 1: Prepare workspace for execution**

  **Execution Note:** Blocked - ${long_summary}

- [ ] **Step 2: Validate the generated output**
EOF

  upgrade_plan_fixture_to_full_contract "$repo_dir/$PLAN_REL"

  run_command_fails "$repo_dir" MalformedExecutionState status --plan "$PLAN_REL"
}

run_status_rejects_out_of_range_persisted_execution_source() {
  local repo_dir="$REPO_DIR/out-of-range-persisted-execution-source"
  local evidence_rel

  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_plan "$repo_dir" "superpowers:executing-plans"
  evidence_rel="$(evidence_rel_path "$PLAN_REL" 1)"
  write_file "$repo_dir/$evidence_rel" <<EOF
# Execution Evidence: 2026-03-17-example-execution-plan

**Plan Path:** ${PLAN_REL}
**Plan Revision:** 1

## Step Evidence

### Task 1 Step 1
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-17T14:22:31Z
**Execution Source:** plan-eng-review
**Claim:** Prepared the workspace for execution.
**Files:**
- docs/example-output.md
**Verification:**
- \`bash tests/codex-runtime/test-superpowers-plan-execution.sh\` -> passed in fixture setup
**Invalidation Reason:** N/A
EOF

  run_command_fails "$repo_dir" MalformedExecutionState status --plan "$PLAN_REL" >/dev/null
}

run_status_rejects_persisted_execution_source_mismatch() {
  local repo_dir="$REPO_DIR/persisted-execution-source-mismatch"
  local evidence_rel

  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_plan "$repo_dir" "superpowers:executing-plans"
  evidence_rel="$(evidence_rel_path "$PLAN_REL" 1)"
  write_file "$repo_dir/$evidence_rel" <<EOF
# Execution Evidence: 2026-03-17-example-execution-plan

**Plan Path:** ${PLAN_REL}
**Plan Revision:** 1

## Step Evidence

### Task 1 Step 1
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-17T14:22:31Z
**Execution Source:** superpowers:subagent-driven-development
**Claim:** Prepared the workspace for execution.
**Files:**
- docs/example-output.md
**Verification:**
- \`bash tests/codex-runtime/test-superpowers-plan-execution.sh\` -> passed in fixture setup
**Invalidation Reason:** N/A
EOF

  run_command_fails "$repo_dir" MalformedExecutionState status --plan "$PLAN_REL" >/dev/null
}

run_status_rejects_whitespace_only_persisted_claim() {
  local repo_dir="$REPO_DIR/whitespace-only-persisted-claim"
  local evidence_rel
  local whitespace

  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_plan "$repo_dir" "superpowers:executing-plans"
  evidence_rel="$(evidence_rel_path "$PLAN_REL" 1)"
  whitespace="$(three_spaces)"
  write_file "$repo_dir/$evidence_rel" <<EOF
# Execution Evidence: 2026-03-17-example-execution-plan

**Plan Path:** ${PLAN_REL}
**Plan Revision:** 1

## Step Evidence

### Task 1 Step 1
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-17T14:22:31Z
**Execution Source:** superpowers:executing-plans
**Claim:** ${whitespace}
**Files:**
- docs/example-output.md
**Verification:**
- \`bash tests/codex-runtime/test-superpowers-plan-execution.sh\` -> passed in fixture setup
**Invalidation Reason:** N/A
EOF

  run_command_fails "$repo_dir" MalformedExecutionState status --plan "$PLAN_REL" >/dev/null
}

run_status_rejects_whitespace_only_persisted_verification() {
  local repo_dir="$REPO_DIR/whitespace-only-persisted-verification"
  local evidence_rel
  local whitespace

  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_plan "$repo_dir" "superpowers:executing-plans"
  evidence_rel="$(evidence_rel_path "$PLAN_REL" 1)"
  whitespace="$(three_spaces)"
  write_file "$repo_dir/$evidence_rel" <<EOF
# Execution Evidence: 2026-03-17-example-execution-plan

**Plan Path:** ${PLAN_REL}
**Plan Revision:** 1

## Step Evidence

### Task 1 Step 1
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-17T14:22:31Z
**Execution Source:** superpowers:executing-plans
**Claim:** Prepared the workspace for execution.
**Files:**
- docs/example-output.md
**Verification:**
- ${whitespace}
**Invalidation Reason:** N/A
EOF

  run_command_fails "$repo_dir" MalformedExecutionState status --plan "$PLAN_REL" >/dev/null
}

run_status_rejects_whitespace_only_persisted_invalidation_reason() {
  local repo_dir="$REPO_DIR/whitespace-only-persisted-invalidation-reason"
  local evidence_rel
  local whitespace

  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_plan "$repo_dir" "superpowers:executing-plans"
  evidence_rel="$(evidence_rel_path "$PLAN_REL" 1)"
  whitespace="$(three_spaces)"
  write_file "$repo_dir/$evidence_rel" <<EOF
# Execution Evidence: 2026-03-17-example-execution-plan

**Plan Path:** ${PLAN_REL}
**Plan Revision:** 1

## Step Evidence

### Task 1 Step 1
#### Attempt 1
**Status:** Invalidated
**Recorded At:** 2026-03-17T14:22:31Z
**Execution Source:** superpowers:executing-plans
**Claim:** Prepared the workspace for execution.
**Files:**
- docs/example-output.md
**Verification:**
- \`bash tests/codex-runtime/test-superpowers-plan-execution.sh\` -> passed in fixture setup
**Invalidation Reason:** ${whitespace}
EOF

  run_command_fails "$repo_dir" MalformedExecutionState status --plan "$PLAN_REL" >/dev/null
}

run_status_rejects_whitespace_only_persisted_file_entry() {
  local repo_dir="$REPO_DIR/whitespace-only-persisted-file-entry"
  local evidence_rel
  local whitespace

  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_plan "$repo_dir" "superpowers:executing-plans"
  evidence_rel="$(evidence_rel_path "$PLAN_REL" 1)"
  whitespace="$(three_spaces)"
  write_file "$repo_dir/$evidence_rel" <<EOF
# Execution Evidence: 2026-03-17-example-execution-plan

**Plan Path:** ${PLAN_REL}
**Plan Revision:** 1

## Step Evidence

### Task 1 Step 1
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-17T14:22:31Z
**Execution Source:** superpowers:executing-plans
**Claim:** Prepared the workspace for execution.
**Files:**
- ${whitespace}
**Verification:**
- \`bash tests/codex-runtime/test-superpowers-plan-execution.sh\` -> passed in fixture setup
**Invalidation Reason:** N/A
EOF

  run_command_fails "$repo_dir" MalformedExecutionState status --plan "$PLAN_REL" >/dev/null
}

run_status_rejects_traversal_persisted_file_entry() {
  local repo_dir="$REPO_DIR/traversal-persisted-file-entry"
  local evidence_rel

  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_plan "$repo_dir" "superpowers:executing-plans"
  evidence_rel="$(evidence_rel_path "$PLAN_REL" 1)"
  write_file "$repo_dir/$evidence_rel" <<EOF
# Execution Evidence: 2026-03-17-example-execution-plan

**Plan Path:** ${PLAN_REL}
**Plan Revision:** 1

## Step Evidence

### Task 1 Step 1
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-17T14:22:31Z
**Execution Source:** superpowers:executing-plans
**Claim:** Prepared the workspace for execution.
**Files:**
- ../outside.md
**Verification:**
- \`bash tests/codex-runtime/test-superpowers-plan-execution.sh\` -> passed in fixture setup
**Invalidation Reason:** N/A
EOF

  run_command_fails "$repo_dir" MalformedExecutionState status --plan "$PLAN_REL" >/dev/null
}

run_status_rejects_absolute_persisted_file_entry() {
  local repo_dir="$REPO_DIR/absolute-persisted-file-entry"
  local evidence_rel

  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_plan "$repo_dir" "superpowers:executing-plans"
  evidence_rel="$(evidence_rel_path "$PLAN_REL" 1)"
  write_file "$repo_dir/$evidence_rel" <<EOF
# Execution Evidence: 2026-03-17-example-execution-plan

**Plan Path:** ${PLAN_REL}
**Plan Revision:** 1

## Step Evidence

### Task 1 Step 1
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-17T14:22:31Z
**Execution Source:** superpowers:executing-plans
**Claim:** Prepared the workspace for execution.
**Files:**
- /tmp/outside.md
**Verification:**
- \`bash tests/codex-runtime/test-superpowers-plan-execution.sh\` -> passed in fixture setup
**Invalidation Reason:** N/A
EOF

  run_command_fails "$repo_dir" MalformedExecutionState status --plan "$PLAN_REL" >/dev/null
}

run_status_accepts_persisted_file_entry_with_repeated_internal_spaces() {
  local repo_dir="$REPO_DIR/persisted-file-entry-repeated-internal-spaces"
  local evidence_rel
  local before
  local evidence_text

  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_file "$repo_dir/$PLAN_REL" <<EOF
# Example Execution Plan

**Workflow State:** Engineering Approved
**Plan Revision:** 1
**Execution Mode:** superpowers:executing-plans
**Source Spec:** \`${SPEC_REL}\`
**Source Spec Revision:** 1
**Last Reviewed By:** plan-eng-review

## Task 1: Core flow

**Files:**
- Modify: \`docs/example-output.md\`
- Test: \`bash tests/codex-runtime/test-superpowers-plan-execution.sh\`

- [x] **Step 1: Prepare workspace for execution**
- [ ] **Step 2: Validate the generated output**

## Task 2: Repair flow

**Files:**
- Modify: \`docs/example-output.md\`
- Test: \`bash tests/codex-runtime/test-superpowers-plan-execution.sh\`

- [ ] **Step 1: Repair an invalidated prior step**
- [ ] **Step 2: Finalize the execution handoff**
EOF
  upgrade_plan_fixture_to_full_contract "$repo_dir/$PLAN_REL"
  evidence_rel="$(evidence_rel_path "$PLAN_REL" 1)"
  write_file "$repo_dir/$evidence_rel" <<EOF
# Execution Evidence: 2026-03-17-example-execution-plan

**Plan Path:** ${PLAN_REL}
**Plan Revision:** 1

## Step Evidence

### Task 1 Step 1
#### Attempt 1
**Status:** Completed
**Recorded At:** 2026-03-17T14:22:31Z
**Execution Source:** superpowers:executing-plans
**Claim:** Prepared the workspace for execution.
**Files:**
-   docs/foo  bar.md  
**Verification:**
- \`bash tests/codex-runtime/test-superpowers-plan-execution.sh\` -> passed in fixture setup
**Invalidation Reason:** N/A
EOF

  before="$(run_json_command "$repo_dir" status --plan "$PLAN_REL")"
  run_json_command "$repo_dir" reopen --plan "$PLAN_REL" --task 1 --step 1 --source superpowers:executing-plans --reason "Need to preserve internal spaces in historical evidence paths" --expect-execution-fingerprint "$(json_value "$before" "execution_fingerprint")" >/dev/null

  evidence_text="$(cat "$repo_dir/$evidence_rel")"
  assert_contains "$evidence_text" "- docs/foo  bar.md" "repeated internal space persisted file path"
}

# Approved artifact header contract regressions.
run_status_rejects_missing_last_reviewed_by_on_approved_plan() {
  local repo_dir="$REPO_DIR/missing-last-reviewed-by-approved-plan"

  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_plan "$repo_dir" "none"
  node -e '
    const fs = require("fs");
    const path = process.argv[1];
    const text = fs.readFileSync(path, "utf8");
    fs.writeFileSync(path, text.replace("**Last Reviewed By:** plan-eng-review\n", ""));
  ' "$repo_dir/$PLAN_REL"

  run_command_fails "$repo_dir" PlanNotExecutionReady status --plan "$PLAN_REL" >/dev/null
}

run_status_rejects_malformed_last_reviewed_by_on_approved_plan() {
  local repo_dir="$REPO_DIR/malformed-last-reviewed-by-approved-plan"

  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_plan "$repo_dir" "none"
  node -e '
    const fs = require("fs");
    const path = process.argv[1];
    const text = fs.readFileSync(path, "utf8");
    fs.writeFileSync(path, text.replace("**Last Reviewed By:** plan-eng-review\n", "**Last Reviewed By:**   \n"));
  ' "$repo_dir/$PLAN_REL"

  run_command_fails "$repo_dir" PlanNotExecutionReady status --plan "$PLAN_REL" >/dev/null
}

run_status_rejects_out_of_range_last_reviewed_by_on_approved_plan() {
  local repo_dir="$REPO_DIR/out-of-range-last-reviewed-by-approved-plan"

  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_plan "$repo_dir" "none"
  node -e '
    const fs = require("fs");
    const path = process.argv[1];
    const text = fs.readFileSync(path, "utf8");
    fs.writeFileSync(path, text.replace("**Last Reviewed By:** plan-eng-review\n", "**Last Reviewed By:** brainstorming\n"));
  ' "$repo_dir/$PLAN_REL"

  run_command_fails "$repo_dir" PlanNotExecutionReady status --plan "$PLAN_REL" >/dev/null
}

run_status_rejects_missing_last_reviewed_by_on_ceo_approved_spec() {
  local repo_dir="$REPO_DIR/missing-last-reviewed-by-ceo-approved-spec"

  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_plan "$repo_dir" "none"
  node -e '
    const fs = require("fs");
    const path = process.argv[1];
    const text = fs.readFileSync(path, "utf8");
    fs.writeFileSync(path, text.replace("**Last Reviewed By:** plan-ceo-review\n", ""));
  ' "$repo_dir/$SPEC_REL"

  run_command_fails "$repo_dir" PlanNotExecutionReady status --plan "$PLAN_REL" >/dev/null
}

run_status_rejects_stale_source_spec_path_even_when_revision_matches() {
  local repo_dir="$REPO_DIR/stale-source-spec-path-same-revision"
  local failure

  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_newer_approved_spec_same_revision_different_path "$repo_dir"
  write_plan "$repo_dir" "none"

  failure="$(run_command_fails "$repo_dir" PlanNotExecutionReady status --plan "$PLAN_REL")"
  assert_contains "$failure" "Approved plan source spec path or revision is stale." "stale source-spec path"
}

run_status_rejects_malformed_last_reviewed_by_on_ceo_approved_spec() {
  local repo_dir="$REPO_DIR/malformed-last-reviewed-by-ceo-approved-spec"

  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_plan "$repo_dir" "none"
  node -e '
    const fs = require("fs");
    const path = process.argv[1];
    const text = fs.readFileSync(path, "utf8");
    fs.writeFileSync(path, text.replace("**Last Reviewed By:** plan-ceo-review\n", "**Last Reviewed By:**   \n"));
  ' "$repo_dir/$SPEC_REL"

  run_command_fails "$repo_dir" PlanNotExecutionReady status --plan "$PLAN_REL" >/dev/null
}

run_status_rejects_out_of_range_last_reviewed_by_on_ceo_approved_spec() {
  local repo_dir="$REPO_DIR/out-of-range-last-reviewed-by-ceo-approved-spec"

  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_plan "$repo_dir" "none"
  node -e '
    const fs = require("fs");
    const path = process.argv[1];
    const text = fs.readFileSync(path, "utf8");
    fs.writeFileSync(path, text.replace("**Last Reviewed By:** plan-ceo-review\n", "**Last Reviewed By:** writing-plans\n"));
  ' "$repo_dir/$SPEC_REL"

  run_command_fails "$repo_dir" PlanNotExecutionReady status --plan "$PLAN_REL" >/dev/null
}

run_status_rejects_noncontiguous_attempt_numbering() {
  local repo_dir="$REPO_DIR/noncontiguous-attempts"
  local evidence_rel

  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_plan "$repo_dir" "superpowers:executing-plans"
  evidence_rel="$(evidence_rel_path "$PLAN_REL" 1)"
  write_file "$repo_dir/$evidence_rel" <<EOF
# Execution Evidence: 2026-03-17-example-execution-plan

**Plan Path:** ${PLAN_REL}
**Plan Revision:** 1

## Step Evidence

### Task 1 Step 1
#### Attempt 2
**Status:** Completed
**Recorded At:** 2026-03-17T14:22:31Z
**Execution Source:** superpowers:executing-plans
**Claim:** Prepared the workspace for execution.
**Files:**
- docs/example-output.md
**Verification:**
- \`bash tests/codex-runtime/test-superpowers-plan-execution.sh\` -> passed in fixture setup
**Invalidation Reason:** N/A
EOF

  run_command_fails "$repo_dir" MalformedExecutionState status --plan "$PLAN_REL" >/dev/null
}

run_recommend_returns_bounded_decision_flags() {
  local repo_dir
  local output
  repo_dir="$(create_base_repo recommend-clean-plan)"
  output="$(run_json_command "$repo_dir" recommend --plan "$PLAN_REL" --isolated-agents available --session-intent stay --workspace-prepared yes)"

  assert_json_equals "$output" "recommended_skill" "superpowers:executing-plans" "recommend output"
  assert_json_nonempty "$output" "reason" "recommend output"
  assert_json_equals "$output" "decision_flags.tasks_independent" "no" "recommend output"
  assert_json_equals "$output" "decision_flags.isolated_agents_available" "yes" "recommend output"
  assert_json_equals "$output" "decision_flags.session_intent" "stay" "recommend output"
  assert_json_equals "$output" "decision_flags.workspace_prepared" "yes" "recommend output"
  assert_json_equals "$output" "decision_flags.same_session_viable" "yes" "recommend output"
}

run_recommend_prefers_subagent_for_independent_plan() {
  local repo_dir="$REPO_DIR/recommend-independent-plan"
  local output

  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_independent_plan "$repo_dir" "none"
  output="$(run_json_command "$repo_dir" recommend --plan "$PLAN_REL" --isolated-agents available --session-intent stay --workspace-prepared yes)"

  assert_json_equals "$output" "recommended_skill" "superpowers:subagent-driven-development" "recommend independent plan"
  assert_json_equals "$output" "decision_flags.tasks_independent" "yes" "recommend independent plan"
  assert_json_equals "$output" "decision_flags.same_session_viable" "yes" "recommend independent plan"
}

run_recommend_defaults_to_executing_plans_for_coupled_plan() {
  local repo_dir="$REPO_DIR/recommend-coupled-plan"
  local output

  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_coupled_plan "$repo_dir" "none"
  output="$(run_json_command "$repo_dir" recommend --plan "$PLAN_REL" --isolated-agents available --session-intent stay --workspace-prepared yes)"

  assert_json_equals "$output" "recommended_skill" "superpowers:executing-plans" "recommend coupled plan"
  assert_json_equals "$output" "decision_flags.tasks_independent" "no" "recommend coupled plan"
}

run_recommend_rejects_post_start_calls() {
  local repo_dir
  repo_dir="$(create_base_repo recommend-post-start)"
  node -e '
    const fs = require("fs");
    const path = process.argv[1];
    const text = fs.readFileSync(path, "utf8");
    fs.writeFileSync(path, text.replace("**Execution Mode:** none", "**Execution Mode:** superpowers:executing-plans"));
  ' "$repo_dir/$PLAN_REL"

  run_command_fails "$repo_dir" RecommendAfterExecutionStart recommend --plan "$PLAN_REL" >/dev/null
}

run_begin_is_idempotent_for_same_step() {
  local repo_dir
  local status_before
  local after_begin
  local after_retry
  local next_fp

  repo_dir="$(create_base_repo begin-idempotent)"
  status_before="$(run_json_command "$repo_dir" status --plan "$PLAN_REL")"
  after_begin="$(run_json_command "$repo_dir" begin --plan "$PLAN_REL" --task 1 --step 1 --execution-mode superpowers:executing-plans --expect-execution-fingerprint "$(json_value "$status_before" "execution_fingerprint")")"
  next_fp="$(json_value "$after_begin" "execution_fingerprint")"
  after_retry="$(run_json_command "$repo_dir" begin --plan "$PLAN_REL" --task 1 --step 1 --expect-execution-fingerprint "$next_fp")"

  assert_json_equals "$after_retry" "active_task" "1" "begin retry"
  assert_json_equals "$after_retry" "active_step" "1" "begin retry"
  assert_json_equals "$after_retry" "execution_mode" "superpowers:executing-plans" "begin retry"
}

run_begin_rejects_bypass_of_interrupted_step() {
  local repo_dir
  local status_before
  local after_begin
  local after_note

  repo_dir="$(create_base_repo interrupted-resume-rule)"
  status_before="$(run_json_command "$repo_dir" status --plan "$PLAN_REL")"
  after_begin="$(run_json_command "$repo_dir" begin --plan "$PLAN_REL" --task 1 --step 1 --execution-mode superpowers:executing-plans --expect-execution-fingerprint "$(json_value "$status_before" "execution_fingerprint")")"
  after_note="$(run_json_command "$repo_dir" note --plan "$PLAN_REL" --task 1 --step 1 --state interrupted --message "Waiting on dependency" --expect-execution-fingerprint "$(json_value "$after_begin" "execution_fingerprint")")"

  run_command_fails "$repo_dir" InvalidStepTransition begin --plan "$PLAN_REL" --task 1 --step 2 --expect-execution-fingerprint "$(json_value "$after_note" "execution_fingerprint")" >/dev/null
}

run_note_rejects_overlong_summary() {
  local repo_dir
  local status_before
  local after_begin
  local long_message

  repo_dir="$(create_base_repo overlong-note)"
  status_before="$(run_json_command "$repo_dir" status --plan "$PLAN_REL")"
  after_begin="$(run_json_command "$repo_dir" begin --plan "$PLAN_REL" --task 1 --step 1 --execution-mode superpowers:executing-plans --expect-execution-fingerprint "$(json_value "$status_before" "execution_fingerprint")")"
  long_message="$(printf 'x%.0s' {1..121})"

  run_command_fails "$repo_dir" InvalidCommandInput note --plan "$PLAN_REL" --task 1 --step 1 --state blocked --message "$long_message" --expect-execution-fingerprint "$(json_value "$after_begin" "execution_fingerprint")" >/dev/null
}

run_note_rejects_blank_summary_without_mutating_plan() {
  local repo_dir
  local status_before
  local after_begin
  local before_plan
  local failure
  local after_status
  local after_plan

  repo_dir="$(create_base_repo blank-note-summary)"
  status_before="$(run_json_command "$repo_dir" status --plan "$PLAN_REL")"
  after_begin="$(run_json_command "$repo_dir" begin --plan "$PLAN_REL" --task 1 --step 1 --execution-mode superpowers:executing-plans --expect-execution-fingerprint "$(json_value "$status_before" "execution_fingerprint")")"
  before_plan="$(cat "$repo_dir/$PLAN_REL")"

  failure="$(run_command_fails "$repo_dir" InvalidCommandInput note --plan "$PLAN_REL" --task 1 --step 1 --state blocked --message "   " --expect-execution-fingerprint "$(json_value "$after_begin" "execution_fingerprint")")"
  assert_contains "$failure" "\"error_class\":\"InvalidCommandInput\"" "blank note summary"

  after_status="$(run_json_command "$repo_dir" status --plan "$PLAN_REL")"
  after_plan="$(cat "$repo_dir/$PLAN_REL")"
  assert_json_equals "$after_status" "active_task" "1" "blank note summary"
  assert_json_equals "$after_status" "active_step" "1" "blank note summary"
  if [[ "$after_plan" != "$before_plan" ]]; then
    echo "Expected blank note summary rejection to leave the plan unchanged"
    diff -u <(printf '%s\n' "$before_plan") <(printf '%s\n' "$after_plan") || true
    exit 1
  fi
}

run_complete_rejects_blank_claim_without_mutating_state() {
  local repo_dir
  local status_before
  local after_begin
  local before_plan
  local evidence_rel
  local failure
  local after_status
  local after_plan

  repo_dir="$(create_base_repo blank-complete-claim)"
  evidence_rel="$(evidence_rel_path "$PLAN_REL" 1)"
  status_before="$(run_json_command "$repo_dir" status --plan "$PLAN_REL")"
  after_begin="$(run_json_command "$repo_dir" begin --plan "$PLAN_REL" --task 1 --step 1 --execution-mode superpowers:executing-plans --expect-execution-fingerprint "$(json_value "$status_before" "execution_fingerprint")")"
  before_plan="$(cat "$repo_dir/$PLAN_REL")"

  failure="$(run_command_fails "$repo_dir" InvalidCommandInput complete --plan "$PLAN_REL" --task 1 --step 1 --source superpowers:executing-plans --claim "   " --manual-verify-summary "Verified by inspection" --expect-execution-fingerprint "$(json_value "$after_begin" "execution_fingerprint")")"
  assert_contains "$failure" "\"error_class\":\"InvalidCommandInput\"" "blank completion claim"

  after_status="$(run_json_command "$repo_dir" status --plan "$PLAN_REL")"
  after_plan="$(cat "$repo_dir/$PLAN_REL")"
  assert_json_equals "$after_status" "active_task" "1" "blank completion claim"
  assert_json_equals "$after_status" "active_step" "1" "blank completion claim"
  if [[ "$after_plan" != "$before_plan" ]]; then
    echo "Expected blank completion claim rejection to leave the plan unchanged"
    diff -u <(printf '%s\n' "$before_plan") <(printf '%s\n' "$after_plan") || true
    exit 1
  fi
  if [[ -e "$repo_dir/$evidence_rel" ]]; then
    echo "Expected blank completion claim rejection to leave evidence absent"
    exit 1
  fi
}

run_complete_rejects_blank_manual_summary_without_mutating_state() {
  local repo_dir
  local status_before
  local after_begin
  local before_plan
  local evidence_rel
  local failure
  local after_status
  local after_plan

  repo_dir="$(create_base_repo blank-manual-summary)"
  evidence_rel="$(evidence_rel_path "$PLAN_REL" 1)"
  status_before="$(run_json_command "$repo_dir" status --plan "$PLAN_REL")"
  after_begin="$(run_json_command "$repo_dir" begin --plan "$PLAN_REL" --task 1 --step 1 --execution-mode superpowers:executing-plans --expect-execution-fingerprint "$(json_value "$status_before" "execution_fingerprint")")"
  before_plan="$(cat "$repo_dir/$PLAN_REL")"

  failure="$(run_command_fails "$repo_dir" InvalidCommandInput complete --plan "$PLAN_REL" --task 1 --step 1 --source superpowers:executing-plans --claim "Prepared the workspace" --manual-verify-summary "   " --expect-execution-fingerprint "$(json_value "$after_begin" "execution_fingerprint")")"
  assert_contains "$failure" "\"error_class\":\"InvalidCommandInput\"" "blank manual verification summary"

  after_status="$(run_json_command "$repo_dir" status --plan "$PLAN_REL")"
  after_plan="$(cat "$repo_dir/$PLAN_REL")"
  assert_json_equals "$after_status" "active_task" "1" "blank manual verification summary"
  assert_json_equals "$after_status" "active_step" "1" "blank manual verification summary"
  if [[ "$after_plan" != "$before_plan" ]]; then
    echo "Expected blank manual verification summary rejection to leave the plan unchanged"
    diff -u <(printf '%s\n' "$before_plan") <(printf '%s\n' "$after_plan") || true
    exit 1
  fi
  if [[ -e "$repo_dir/$evidence_rel" ]]; then
    echo "Expected blank manual verification summary rejection to leave evidence absent"
    exit 1
  fi
}

run_complete_rejects_mixed_verification_inputs() {
  local repo_dir
  local status_before
  local after_begin

  repo_dir="$(create_base_repo mixed-verification)"
  status_before="$(run_json_command "$repo_dir" status --plan "$PLAN_REL")"
  after_begin="$(run_json_command "$repo_dir" begin --plan "$PLAN_REL" --task 1 --step 1 --execution-mode superpowers:executing-plans --expect-execution-fingerprint "$(json_value "$status_before" "execution_fingerprint")")"

  run_command_fails "$repo_dir" InvalidCommandInput complete --plan "$PLAN_REL" --task 1 --step 1 --source superpowers:executing-plans --claim "Prepared the workspace" --verify-command "bash tests/codex-runtime/test-superpowers-plan-execution.sh" --verify-result "passed" --manual-verify-summary "Double-checked output manually" --expect-execution-fingerprint "$(json_value "$after_begin" "execution_fingerprint")" >/dev/null
}

run_complete_without_explicit_files_keeps_evidence_parseable() {
  local repo_dir
  local before
  local active
  local after
  local gate_review
  local evidence_rel
  local evidence_text

  repo_dir="$REPO_DIR/implicit-files"
  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_single_step_plan "$repo_dir" "none"
  before="$(run_json_command "$repo_dir" status --plan "$PLAN_REL")"
  active="$(run_json_command "$repo_dir" begin --plan "$PLAN_REL" --task 1 --step 1 --execution-mode superpowers:executing-plans --expect-execution-fingerprint "$(json_value "$before" "execution_fingerprint")")"

  run_json_command "$repo_dir" complete --plan "$PLAN_REL" --task 1 --step 1 --source superpowers:executing-plans --claim "Prepared the workspace" --manual-verify-summary "Verified by inspection" --expect-execution-fingerprint "$(json_value "$active" "execution_fingerprint")" >/dev/null

  after="$(run_json_command "$repo_dir" status --plan "$PLAN_REL")"
  assert_json_equals "$after" "active_task" "null" "implicit files complete"
  assert_json_equals "$after" "execution_started" "yes" "implicit files complete"

  evidence_rel="$(evidence_rel_path "$PLAN_REL" 1)"
  evidence_text="$(cat "$repo_dir/$evidence_rel")"
  assert_contains "$evidence_text" "**Files Proven:**" "implicit files evidence"
  assert_not_contains "$evidence_text" "None (no repo file changed)" "implicit files evidence"

  gate_review="$(run_json_command "$repo_dir" gate-review --plan "$PLAN_REL")"
  assert_json_equals "$gate_review" "allowed" "true" "implicit files gate-review"
}

run_complete_rejects_stale_fingerprint() {
  local repo_dir
  local before

  repo_dir="$(create_base_repo stale-complete)"
  before="$(run_json_command "$repo_dir" status --plan "$PLAN_REL")"
  run_json_command "$repo_dir" begin --plan "$PLAN_REL" --task 1 --step 1 --execution-mode superpowers:executing-plans --expect-execution-fingerprint "$(json_value "$before" "execution_fingerprint")" >/dev/null

  run_command_fails "$repo_dir" StaleMutation complete --plan "$PLAN_REL" --task 1 --step 1 --source superpowers:executing-plans --claim "Prepared the workspace" --manual-verify-summary "Verified by inspection" --expect-execution-fingerprint "$(json_value "$before" "execution_fingerprint")" >/dev/null
}

run_complete_applies_whitespace_normalization() {
  local repo_dir
  local before
  local active
  local evidence_rel
  local evidence_text

  repo_dir="$(create_base_repo whitespace-normalization)"
  write_file "$repo_dir/docs/output.md" <<'EOF'
normalized output
EOF

  before="$(run_json_command "$repo_dir" status --plan "$PLAN_REL")"
  active="$(run_json_command "$repo_dir" begin --plan "$PLAN_REL" --task 1 --step 1 --execution-mode superpowers:executing-plans --expect-execution-fingerprint "$(json_value "$before" "execution_fingerprint")")"
  run_json_command "$repo_dir" complete --plan "$PLAN_REL" --task 1 --step 1 --source superpowers:executing-plans --claim $'  Prepared\tworkspace \n thoroughly  ' --file docs/output.md --manual-verify-summary $'  Verified\tby \n inspection  ' --expect-execution-fingerprint "$(json_value "$active" "execution_fingerprint")" >/dev/null

  evidence_rel="$(evidence_rel_path "$PLAN_REL" 1)"
  evidence_text="$(cat "$repo_dir/$evidence_rel")"
  assert_contains "$evidence_text" "**Claim:** Prepared workspace thoroughly" "whitespace normalization claim"
  assert_contains "$evidence_text" "**Verification Summary:** Manual inspection only: Verified by inspection" "whitespace normalization verification"
  assert_contains "$evidence_text" "**Packet Fingerprint:** " "whitespace normalization packet fingerprint"
  assert_not_contains "$evidence_text" $'\t' "whitespace normalization evidence tabs"
}

run_complete_sorts_and_deduplicates_file_entries() {
  local repo_dir
  local before
  local active
  local evidence_rel
  local evidence_text

  repo_dir="$(create_base_repo canonical-files)"
  write_file "$repo_dir/src/zeta.txt" <<'EOF'
zeta
EOF
  write_file "$repo_dir/docs/alpha.md" <<'EOF'
alpha
EOF

  before="$(run_json_command "$repo_dir" status --plan "$PLAN_REL")"
  active="$(run_json_command "$repo_dir" begin --plan "$PLAN_REL" --task 1 --step 1 --execution-mode superpowers:executing-plans --expect-execution-fingerprint "$(json_value "$before" "execution_fingerprint")")"
  run_json_command "$repo_dir" complete --plan "$PLAN_REL" --task 1 --step 1 --source superpowers:executing-plans --claim "Prepared the workspace" --file src/zeta.txt --file docs/alpha.md --file src/zeta.txt --manual-verify-summary "Verified by inspection" --expect-execution-fingerprint "$(json_value "$active" "execution_fingerprint")" >/dev/null

  evidence_rel="$(evidence_rel_path "$PLAN_REL" 1)"
  assert_no_blank_line_at_eof "$repo_dir/$evidence_rel"
  evidence_text="$(cat "$repo_dir/$evidence_rel")"
  assert_contains "$evidence_text" $'**Files Proven:**\n- docs/alpha.md | sha256:' "canonical files evidence"
  assert_contains "$evidence_text" $'\n- src/zeta.txt | sha256:' "canonical files evidence"
  assert_contains "$evidence_text" "**Verification Summary:** Manual inspection only: Verified by inspection" "canonical files verification"
}

run_gate_review_accepts_fresh_packet_provenance_after_complete() {
  local repo_dir
  local before
  local active
  local output

  repo_dir="$REPO_DIR/gate-review-after-complete"
  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_single_step_plan "$repo_dir" "none"
  write_file "$repo_dir/docs/output.md" <<'EOF'
fresh output
EOF

  before="$(run_json_command "$repo_dir" status --plan "$PLAN_REL")"
  active="$(run_json_command "$repo_dir" begin --plan "$PLAN_REL" --task 1 --step 1 --execution-mode superpowers:executing-plans --expect-execution-fingerprint "$(json_value "$before" "execution_fingerprint")")"
  run_json_command "$repo_dir" complete --plan "$PLAN_REL" --task 1 --step 1 --source superpowers:executing-plans --claim "Prepared the workspace" --file docs/output.md --manual-verify-summary "Verified by inspection" --expect-execution-fingerprint "$(json_value "$active" "execution_fingerprint")" >/dev/null

  output="$(run_json_command "$repo_dir" gate-review --plan "$PLAN_REL")"
  assert_json_equals "$output" "allowed" "true" "gate-review after complete"
}

run_complete_accepts_deleted_paths_from_current_change_set() {
  local repo_dir
  local before
  local active
  local evidence_rel
  local evidence_text

  repo_dir="$(create_base_repo deleted-file-evidence)"
  commit_file "$repo_dir" "docs/deleted-output.md" "tracked output"
  rm -f "$repo_dir/docs/deleted-output.md"

  before="$(run_json_command "$repo_dir" status --plan "$PLAN_REL")"
  active="$(run_json_command "$repo_dir" begin --plan "$PLAN_REL" --task 1 --step 1 --execution-mode superpowers:executing-plans --expect-execution-fingerprint "$(json_value "$before" "execution_fingerprint")")"
  run_json_command "$repo_dir" complete --plan "$PLAN_REL" --task 1 --step 1 --source superpowers:executing-plans --claim "Prepared the workspace" --file docs/deleted-output.md --manual-verify-summary "Verified by inspection" --expect-execution-fingerprint "$(json_value "$active" "execution_fingerprint")" >/dev/null

  evidence_rel="$(evidence_rel_path "$PLAN_REL" 1)"
  evidence_text="$(cat "$repo_dir/$evidence_rel")"
  assert_contains "$evidence_text" $'**Files Proven:**\n- docs/deleted-output.md | sha256:missing' "deleted file evidence"
  assert_contains "$evidence_text" "**Verification Summary:** Manual inspection only: Verified by inspection" "deleted file verification"
}

run_complete_canonicalizes_rename_backed_paths() {
  local repo_dir
  local before
  local active
  local evidence_rel
  local evidence_text

  repo_dir="$(create_base_repo renamed-file-evidence)"
  commit_file "$repo_dir" "docs/old-output.md" "tracked output"
  git -C "$repo_dir" mv docs/old-output.md docs/new-output.md

  before="$(run_json_command "$repo_dir" status --plan "$PLAN_REL")"
  active="$(run_json_command "$repo_dir" begin --plan "$PLAN_REL" --task 1 --step 1 --execution-mode superpowers:executing-plans --expect-execution-fingerprint "$(json_value "$before" "execution_fingerprint")")"
  run_json_command "$repo_dir" complete --plan "$PLAN_REL" --task 1 --step 1 --source superpowers:executing-plans --claim "Prepared the workspace" --file docs/old-output.md --manual-verify-summary "Verified by inspection" --expect-execution-fingerprint "$(json_value "$active" "execution_fingerprint")" >/dev/null

  evidence_rel="$(evidence_rel_path "$PLAN_REL" 1)"
  evidence_text="$(cat "$repo_dir/$evidence_rel")"
  assert_contains "$evidence_text" $'**Files Proven:**\n- docs/new-output.md | sha256:' "rename-backed file evidence"
  assert_contains "$evidence_text" "**Verification Summary:** Manual inspection only: Verified by inspection" "rename-backed file verification"
}

run_complete_rejects_file_path_outside_repo_root() {
  local repo_dir
  local before
  local active

  repo_dir="$(create_base_repo invalid-file-path)"
  before="$(run_json_command "$repo_dir" status --plan "$PLAN_REL")"
  active="$(run_json_command "$repo_dir" begin --plan "$PLAN_REL" --task 1 --step 1 --execution-mode superpowers:executing-plans --expect-execution-fingerprint "$(json_value "$before" "execution_fingerprint")")"

  run_command_fails "$repo_dir" InvalidCommandInput complete --plan "$PLAN_REL" --task 1 --step 1 --source superpowers:executing-plans --claim "Prepared the workspace" --file ../outside.md --manual-verify-summary "Verified by inspection" --expect-execution-fingerprint "$(json_value "$active" "execution_fingerprint")" >/dev/null
}

run_reopen_rejects_blank_reason_without_mutating_state() {
  local repo_dir="$REPO_DIR/blank-reopen-reason"
  local before
  local before_plan
  local evidence_rel
  local before_evidence
  local failure
  local after
  local after_plan
  local after_evidence

  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_completed_attempt "$repo_dir" "superpowers:executing-plans"
  write_file "$repo_dir/$PLAN_REL" <<EOF
# Example Execution Plan

**Workflow State:** Engineering Approved
**Plan Revision:** 1
**Execution Mode:** superpowers:executing-plans
**Source Spec:** \`${SPEC_REL}\`
**Source Spec Revision:** 1
**Last Reviewed By:** plan-eng-review

## Task 1: Core flow

**Files:**
- Modify: \`docs/example-output.md\`
- Test: \`bash tests/codex-runtime/test-superpowers-plan-execution.sh\`

- [x] **Step 1: Prepare workspace for execution**
- [ ] **Step 2: Validate the generated output**
EOF

  upgrade_plan_fixture_to_full_contract "$repo_dir/$PLAN_REL"

  evidence_rel="$(evidence_rel_path "$PLAN_REL" 1)"
  before="$(run_json_command "$repo_dir" status --plan "$PLAN_REL")"
  before_plan="$(cat "$repo_dir/$PLAN_REL")"
  before_evidence="$(cat "$repo_dir/$evidence_rel")"

  failure="$(run_command_fails "$repo_dir" InvalidCommandInput reopen --plan "$PLAN_REL" --task 1 --step 1 --source superpowers:executing-plans --reason "   " --expect-execution-fingerprint "$(json_value "$before" "execution_fingerprint")")"
  assert_contains "$failure" "\"error_class\":\"InvalidCommandInput\"" "blank reopen reason"

  after="$(run_json_command "$repo_dir" status --plan "$PLAN_REL")"
  after_plan="$(cat "$repo_dir/$PLAN_REL")"
  after_evidence="$(cat "$repo_dir/$evidence_rel")"
  assert_json_equals "$after" "active_task" "null" "blank reopen reason"
  if [[ "$after_plan" != "$before_plan" ]]; then
    echo "Expected blank reopen reason rejection to leave the plan unchanged"
    diff -u <(printf '%s\n' "$before_plan") <(printf '%s\n' "$after_plan") || true
    exit 1
  fi
  if [[ "$after_evidence" != "$before_evidence" ]]; then
    echo "Expected blank reopen reason rejection to leave evidence unchanged"
    diff -u <(printf '%s\n' "$before_evidence") <(printf '%s\n' "$after_evidence") || true
    exit 1
  fi
}

run_reopen_rejects_second_parked_step_without_mutating_state() {
  local repo_dir
  local before
  local active_first
  local after_first
  local active_second
  local evidence_rel
  local before_plan
  local before_evidence
  local failure
  local after
  local after_plan
  local after_evidence

  repo_dir="$(create_base_repo reopen-second-parked-step)"
  write_file "$repo_dir/docs/example-output.md" <<'EOF'
prepared output
EOF

  before="$(run_json_command "$repo_dir" status --plan "$PLAN_REL")"
  active_first="$(run_json_command "$repo_dir" begin --plan "$PLAN_REL" --task 1 --step 1 --execution-mode superpowers:executing-plans --expect-execution-fingerprint "$(json_value "$before" "execution_fingerprint")")"
  run_json_command "$repo_dir" complete --plan "$PLAN_REL" --task 1 --step 1 --source superpowers:executing-plans --claim "Prepared the workspace" --file docs/example-output.md --manual-verify-summary "Verified the prepared output" --expect-execution-fingerprint "$(json_value "$active_first" "execution_fingerprint")" >/dev/null

  after_first="$(run_json_command "$repo_dir" status --plan "$PLAN_REL")"
  active_second="$(run_json_command "$repo_dir" begin --plan "$PLAN_REL" --task 1 --step 2 --expect-execution-fingerprint "$(json_value "$after_first" "execution_fingerprint")")"
  run_json_command "$repo_dir" note --plan "$PLAN_REL" --task 1 --step 2 --state interrupted --message "Waiting on a repair follow-up" --expect-execution-fingerprint "$(json_value "$active_second" "execution_fingerprint")" >/dev/null

  evidence_rel="$(evidence_rel_path "$PLAN_REL" 1)"
  before="$(run_json_command "$repo_dir" status --plan "$PLAN_REL")"
  before_plan="$(cat "$repo_dir/$PLAN_REL")"
  before_evidence="$(cat "$repo_dir/$evidence_rel")"

  failure="$(run_command_fails "$repo_dir" InvalidStepTransition reopen --plan "$PLAN_REL" --task 1 --step 1 --source superpowers:executing-plans --reason "Need to revisit the prepared output" --expect-execution-fingerprint "$(json_value "$before" "execution_fingerprint")")"
  assert_contains "$failure" "second parked interrupted step while one already exists" "reopen second parked step"

  after="$(run_json_command "$repo_dir" status --plan "$PLAN_REL")"
  after_plan="$(cat "$repo_dir/$PLAN_REL")"
  after_evidence="$(cat "$repo_dir/$evidence_rel")"
  assert_json_equals "$after" "resume_task" "1" "reopen second parked step"
  assert_json_equals "$after" "resume_step" "2" "reopen second parked step"
  if [[ "$after_plan" != "$before_plan" ]]; then
    echo "Expected second parked-step reopen rejection to leave the plan unchanged"
    diff -u <(printf '%s\n' "$before_plan") <(printf '%s\n' "$after_plan") || true
    exit 1
  fi
  if [[ "$after_evidence" != "$before_evidence" ]]; then
    echo "Expected second parked-step reopen rejection to leave evidence unchanged"
    diff -u <(printf '%s\n' "$before_evidence") <(printf '%s\n' "$after_evidence") || true
    exit 1
  fi
}

run_transfer_rejects_blank_reason_without_mutating_state() {
  local repo_dir="$REPO_DIR/blank-transfer-reason"
  local before
  local before_plan
  local evidence_rel
  local before_evidence
  local failure
  local after
  local after_plan
  local after_evidence

  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_completed_attempt "$repo_dir" "superpowers:executing-plans"
  write_file "$repo_dir/$PLAN_REL" <<EOF
# Example Execution Plan

**Workflow State:** Engineering Approved
**Plan Revision:** 1
**Execution Mode:** superpowers:executing-plans
**Source Spec:** \`${SPEC_REL}\`
**Source Spec Revision:** 1
**Last Reviewed By:** plan-eng-review

## Task 1: Core flow

**Files:**
- Modify: \`docs/example-output.md\`
- Test: \`bash tests/codex-runtime/test-superpowers-plan-execution.sh\`

- [ ] **Step 1: Prepare workspace for execution**

  **Execution Note:** Active - Prepare workspace for execution

- [ ] **Step 2: Validate the generated output**

## Task 2: Repair flow

**Files:**
- Modify: \`docs/example-output.md\`
- Test: \`bash tests/codex-runtime/test-superpowers-plan-execution.sh\`

- [x] **Step 1: Repair an invalidated prior step**
- [ ] **Step 2: Finalize the execution handoff**
EOF

  upgrade_plan_fixture_to_full_contract "$repo_dir/$PLAN_REL"

  evidence_rel="$(evidence_rel_path "$PLAN_REL" 1)"
  before="$(run_json_command "$repo_dir" status --plan "$PLAN_REL")"
  before_plan="$(cat "$repo_dir/$PLAN_REL")"
  before_evidence="$(cat "$repo_dir/$evidence_rel")"

  failure="$(run_command_fails "$repo_dir" InvalidCommandInput transfer --plan "$PLAN_REL" --repair-task 2 --repair-step 1 --source superpowers:executing-plans --reason "   " --expect-execution-fingerprint "$(json_value "$before" "execution_fingerprint")")"
  assert_contains "$failure" "\"error_class\":\"InvalidCommandInput\"" "blank transfer reason"

  after="$(run_json_command "$repo_dir" status --plan "$PLAN_REL")"
  after_plan="$(cat "$repo_dir/$PLAN_REL")"
  after_evidence="$(cat "$repo_dir/$evidence_rel")"
  assert_json_equals "$after" "active_task" "1" "blank transfer reason"
  assert_json_equals "$after" "active_step" "1" "blank transfer reason"
  if [[ "$after_plan" != "$before_plan" ]]; then
    echo "Expected blank transfer reason rejection to leave the plan unchanged"
    diff -u <(printf '%s\n' "$before_plan") <(printf '%s\n' "$after_plan") || true
    exit 1
  fi
  if [[ "$after_evidence" != "$before_evidence" ]]; then
    echo "Expected blank transfer reason rejection to leave evidence unchanged"
    diff -u <(printf '%s\n' "$before_evidence") <(printf '%s\n' "$after_evidence") || true
    exit 1
  fi
}

run_transfer_rejects_second_parked_step() {
  local repo_dir="$REPO_DIR/occupied-parked-slot"
  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_completed_attempt "$repo_dir" "superpowers:executing-plans"
  write_file "$repo_dir/$PLAN_REL" <<EOF
# Example Execution Plan

**Workflow State:** Engineering Approved
**Plan Revision:** 1
**Execution Mode:** superpowers:executing-plans
**Source Spec:** \`${SPEC_REL}\`
**Source Spec Revision:** 1
**Last Reviewed By:** plan-eng-review

## Task 1: Core flow

**Files:**
- Modify: \`docs/example-output.md\`
- Test: \`bash tests/codex-runtime/test-superpowers-plan-execution.sh\`

- [ ] **Step 1: Prepare workspace for execution**

  **Execution Note:** Active - Prepare workspace for execution

- [ ] **Step 2: Validate the generated output**

  **Execution Note:** Interrupted - Parked for repair of Task 2 Step 1

## Task 2: Repair flow

**Files:**
- Modify: \`docs/example-output.md\`
- Test: \`bash tests/codex-runtime/test-superpowers-plan-execution.sh\`

- [x] **Step 1: Repair an invalidated prior step**
- [ ] **Step 2: Finalize the execution handoff**
EOF

  upgrade_plan_fixture_to_full_contract "$repo_dir/$PLAN_REL"

  run_command_fails "$repo_dir" InvalidStepTransition transfer --plan "$PLAN_REL" --repair-task 2 --repair-step 1 --source superpowers:executing-plans --reason "Need to refresh the invalidated repair step" --expect-execution-fingerprint "$(json_value "$(run_json_command "$repo_dir" status --plan "$PLAN_REL")" "execution_fingerprint")" >/dev/null
}

run_complete_rolls_back_on_injected_failure() {
  local repo_dir
  local before
  local active
  local failure
  local after
  local evidence_rel

  repo_dir="$(create_base_repo complete-rollback)"
  evidence_rel="$(evidence_rel_path "$PLAN_REL" 1)"
  before="$(run_json_command "$repo_dir" status --plan "$PLAN_REL")"
  active="$(run_json_command "$repo_dir" begin --plan "$PLAN_REL" --task 1 --step 1 --execution-mode superpowers:executing-plans --expect-execution-fingerprint "$(json_value "$before" "execution_fingerprint")")"
  failure="$(run_command_fails_with_env "$repo_dir" EvidenceWriteFailed SUPERPOWERS_PLAN_EXECUTION_TEST_FAILPOINT=complete_after_plan_write "$EXEC_BIN" complete --plan "$PLAN_REL" --task 1 --step 1 --source superpowers:executing-plans --claim "Prepared the workspace" --manual-verify-summary "Verified by inspection" --expect-execution-fingerprint "$(json_value "$active" "execution_fingerprint")")"
  assert_contains "$failure" "\"error_class\":\"EvidenceWriteFailed\"" "complete rollback"

  after="$(run_json_command "$repo_dir" status --plan "$PLAN_REL")"
  assert_json_equals "$after" "active_task" "1" "complete rollback"
  assert_json_equals "$after" "active_step" "1" "complete rollback"
  if [[ -f "$repo_dir/$evidence_rel" ]]; then
    echo "Expected injected complete failure to leave evidence file absent"
    exit 1
  fi
  assert_not_contains "$(cat "$repo_dir/$PLAN_REL")" "- [x] **Step 1: Prepare workspace for execution**" "complete rollback plan"
}

run_reopen_rolls_back_on_injected_failure() {
  local repo_dir="$REPO_DIR/reopen-rollback"
  local before
  local failure
  local after

  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_completed_attempt "$repo_dir" "superpowers:executing-plans"
  write_file "$repo_dir/$PLAN_REL" <<EOF
# Example Execution Plan

**Workflow State:** Engineering Approved
**Plan Revision:** 1
**Execution Mode:** superpowers:executing-plans
**Source Spec:** \`${SPEC_REL}\`
**Source Spec Revision:** 1
**Last Reviewed By:** plan-eng-review

## Task 1: Core flow

**Files:**
- Modify: \`docs/example-output.md\`
- Test: \`bash tests/codex-runtime/test-superpowers-plan-execution.sh\`

- [x] **Step 1: Prepare workspace for execution**
- [ ] **Step 2: Validate the generated output**
EOF

  upgrade_plan_fixture_to_full_contract "$repo_dir/$PLAN_REL"

  before="$(run_json_command "$repo_dir" status --plan "$PLAN_REL")"
  failure="$(run_command_fails_with_env "$repo_dir" EvidenceWriteFailed SUPERPOWERS_PLAN_EXECUTION_TEST_FAILPOINT=reopen_after_plan_write "$EXEC_BIN" reopen --plan "$PLAN_REL" --task 1 --step 1 --source superpowers:executing-plans --reason "Claim is stale after later repo changes" --expect-execution-fingerprint "$(json_value "$before" "execution_fingerprint")")"
  assert_contains "$failure" "\"error_class\":\"EvidenceWriteFailed\"" "reopen rollback"

  after="$(run_json_command "$repo_dir" status --plan "$PLAN_REL")"
  assert_json_equals "$after" "execution_mode" "superpowers:executing-plans" "reopen rollback"
  assert_contains "$(cat "$repo_dir/$PLAN_REL")" "- [x] **Step 1: Prepare workspace for execution**" "reopen rollback plan"
}

run_reopen_updates_invalidation_timestamp() {
  local repo_dir="$REPO_DIR/reopen-invalidation-metadata"
  local before
  local evidence_rel
  local evidence_text

  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_completed_attempt "$repo_dir" "superpowers:executing-plans"
  write_file "$repo_dir/$PLAN_REL" <<EOF
# Example Execution Plan

**Workflow State:** Engineering Approved
**Plan Revision:** 1
**Execution Mode:** superpowers:executing-plans
**Source Spec:** \`${SPEC_REL}\`
**Source Spec Revision:** 1
**Last Reviewed By:** plan-eng-review

## Task 1: Core flow

**Files:**
- Modify: \`docs/example-output.md\`
- Test: \`bash tests/codex-runtime/test-superpowers-plan-execution.sh\`

- [x] **Step 1: Prepare workspace for execution**
- [ ] **Step 2: Validate the generated output**
EOF

  upgrade_plan_fixture_to_full_contract "$repo_dir/$PLAN_REL"

  before="$(run_json_command "$repo_dir" status --plan "$PLAN_REL")"
  run_json_command "$repo_dir" reopen --plan "$PLAN_REL" --task 1 --step 1 --source superpowers:executing-plans --reason "Claim is stale after later repo changes" --expect-execution-fingerprint "$(json_value "$before" "execution_fingerprint")" >/dev/null

  evidence_rel="$(evidence_rel_path "$PLAN_REL" 1)"
  evidence_text="$(cat "$repo_dir/$evidence_rel")"
  assert_contains "$evidence_text" "**Status:** Invalidated" "reopen invalidation metadata"
  assert_not_contains "$evidence_text" "**Recorded At:** 2026-03-17T14:22:31Z" "reopen invalidation metadata"
}

run_transfer_rolls_back_on_injected_failure() {
  local repo_dir="$REPO_DIR/transfer-rollback"
  local before
  local failure
  local after

  init_repo "$repo_dir"
  write_approved_spec "$repo_dir"
  write_completed_attempt "$repo_dir" "superpowers:executing-plans"
  write_file "$repo_dir/$PLAN_REL" <<EOF
# Example Execution Plan

**Workflow State:** Engineering Approved
**Plan Revision:** 1
**Execution Mode:** superpowers:executing-plans
**Source Spec:** \`${SPEC_REL}\`
**Source Spec Revision:** 1
**Last Reviewed By:** plan-eng-review

## Task 1: Core flow

**Files:**
- Modify: \`docs/example-output.md\`
- Test: \`bash tests/codex-runtime/test-superpowers-plan-execution.sh\`

- [ ] **Step 1: Prepare workspace for execution**

  **Execution Note:** Active - Prepare workspace for execution

- [ ] **Step 2: Validate the generated output**

## Task 2: Repair flow

**Files:**
- Modify: \`docs/example-output.md\`
- Test: \`bash tests/codex-runtime/test-superpowers-plan-execution.sh\`

- [x] **Step 1: Repair an invalidated prior step**
- [ ] **Step 2: Finalize the execution handoff**
EOF

  upgrade_plan_fixture_to_full_contract "$repo_dir/$PLAN_REL"

  before="$(run_json_command "$repo_dir" status --plan "$PLAN_REL")"
  failure="$(run_command_fails_with_env "$repo_dir" EvidenceWriteFailed SUPERPOWERS_PLAN_EXECUTION_TEST_FAILPOINT=transfer_after_plan_write "$EXEC_BIN" transfer --plan "$PLAN_REL" --repair-task 2 --repair-step 1 --source superpowers:executing-plans --reason "Current work invalidated an earlier completed step" --expect-execution-fingerprint "$(json_value "$before" "execution_fingerprint")")"
  assert_contains "$failure" "\"error_class\":\"EvidenceWriteFailed\"" "transfer rollback"

  after="$(run_json_command "$repo_dir" status --plan "$PLAN_REL")"
  assert_json_equals "$after" "active_task" "1" "transfer rollback"
  assert_json_equals "$after" "active_step" "1" "transfer rollback"
  assert_json_equals "$after" "resume_task" "null" "transfer rollback"
  assert_contains "$(cat "$repo_dir/$PLAN_REL")" "- [x] **Step 1: Repair an invalidated prior step**" "transfer rollback plan"
}

require_helper
run_status_reports_bounded_schema_for_clean_plan
run_status_completes_quickly_for_large_v2_evidence_fixture
run_status_treats_header_only_stub_as_same_empty_state
run_status_cache_invalidates_after_plan_change
run_status_cache_invalidates_after_same_size_same_mtime_plan_change
run_status_cache_invalidates_after_sibling_approved_spec_change
run_status_rejects_missing_execution_mode
run_status_rejects_missing_task_outcome_in_approved_plan
run_preflight_reports_allowed_for_clean_plan
run_preflight_rejects_detached_head
run_preflight_rejects_merge_in_progress
run_preflight_rejects_rebase_in_progress
run_preflight_rejects_cherry_pick_in_progress
run_preflight_rejects_unresolved_index_entries
run_preflight_rejects_repo_safety_runtime_failure
run_preflight_rejects_blocked_step
run_preflight_rejects_interrupted_work
run_status_rejects_evidence_history_with_none_mode
run_gate_review_warns_on_legacy_evidence_format
run_gate_review_warns_on_legacy_packet_provenance
run_gate_review_rejects_unfinished_steps_remaining
run_gate_review_rejects_active_step_in_progress
run_gate_review_rejects_blocked_step
run_gate_review_rejects_interrupted_work
run_gate_review_rejects_checked_step_missing_evidence
run_gate_review_rejects_checked_step_without_completed_attempt
run_gate_review_rejects_packet_fingerprint_mismatch
run_gate_review_rejects_plan_fingerprint_mismatch
run_gate_review_rejects_source_spec_fingerprint_mismatch
run_gate_review_rejects_plan_fingerprint_unavailable
run_gate_review_rejects_source_spec_fingerprint_unavailable
run_gate_review_rejects_packet_fingerprint_unavailable
run_gate_review_rejects_missed_reopen_after_file_drift
run_gate_review_ignores_current_plan_and_evidence_file_proofs
run_gate_review_accepts_file_reproved_by_later_completed_step
run_gate_review_rejects_corrupted_nonlatest_packet_fingerprint
run_gate_review_reuses_hash_work_for_large_v2_fixture
run_gate_review_completes_quickly_for_large_v2_fixture
run_gate_review_cache_invalidates_after_proof_drift
run_gate_review_cache_invalidates_after_same_size_same_mtime_proof_drift
run_gate_review_cache_invalidates_after_sibling_approved_spec_change
run_gate_finish_blocks_missing_release_artifact
run_gate_finish_blocks_missing_qa_artifact_when_required
run_gate_finish_blocks_missing_branch_specific_test_plan_artifact
run_gate_finish_blocks_malformed_test_plan_artifact
run_gate_finish_blocks_stale_test_plan_artifact
run_gate_finish_blocks_malformed_qa_artifact
run_gate_finish_blocks_qa_artifact_plan_mismatch
run_gate_finish_blocks_qa_artifact_branch_mismatch
run_gate_finish_blocks_qa_artifact_head_mismatch
run_gate_finish_blocks_qa_source_test_plan_mismatch
run_gate_finish_blocks_qa_result_not_pass
run_gate_finish_blocks_malformed_release_artifact
run_gate_finish_blocks_release_artifact_plan_mismatch
run_gate_finish_blocks_release_artifact_branch_mismatch
run_gate_finish_blocks_release_result_not_pass
run_gate_finish_blocks_stale_release_artifact_head_mismatch
run_gate_finish_blocks_release_artifact_base_branch_mismatch
run_gate_finish_blocks_release_artifact_base_branch_unresolved
run_gate_finish_allows_fresh_structured_artifacts
run_gate_finish_allows_master_default_branch_without_origin_head
run_status_rejects_malformed_note_structure
run_status_rejects_task_without_parseable_files_block
run_status_rejects_malformed_evidence_attempt_fields
run_status_rejects_evidence_for_nonexistent_step
run_status_rejects_whitespace_only_execution_note_summary
run_status_rejects_overlong_execution_note_summary
run_status_rejects_out_of_range_persisted_execution_source
run_status_rejects_persisted_execution_source_mismatch
run_status_rejects_whitespace_only_persisted_claim
run_status_rejects_whitespace_only_persisted_verification
run_status_rejects_whitespace_only_persisted_invalidation_reason
run_status_rejects_whitespace_only_persisted_file_entry
run_status_rejects_traversal_persisted_file_entry
run_status_rejects_absolute_persisted_file_entry
run_status_accepts_persisted_file_entry_with_repeated_internal_spaces
run_status_rejects_missing_last_reviewed_by_on_approved_plan
run_status_rejects_malformed_last_reviewed_by_on_approved_plan
run_status_rejects_out_of_range_last_reviewed_by_on_approved_plan
run_status_rejects_missing_last_reviewed_by_on_ceo_approved_spec
run_status_rejects_stale_source_spec_path_even_when_revision_matches
run_status_rejects_malformed_last_reviewed_by_on_ceo_approved_spec
run_status_rejects_out_of_range_last_reviewed_by_on_ceo_approved_spec
run_status_rejects_noncontiguous_attempt_numbering
run_recommend_returns_bounded_decision_flags
run_recommend_prefers_subagent_for_independent_plan
run_recommend_defaults_to_executing_plans_for_coupled_plan
run_recommend_rejects_post_start_calls
run_begin_is_idempotent_for_same_step
run_begin_rejects_bypass_of_interrupted_step
run_note_rejects_overlong_summary
run_note_rejects_blank_summary_without_mutating_plan
run_complete_rejects_blank_claim_without_mutating_state
run_complete_rejects_blank_manual_summary_without_mutating_state
run_complete_rejects_mixed_verification_inputs
run_complete_without_explicit_files_keeps_evidence_parseable
run_complete_rejects_stale_fingerprint
run_complete_applies_whitespace_normalization
run_complete_sorts_and_deduplicates_file_entries
run_gate_review_accepts_fresh_packet_provenance_after_complete
run_complete_accepts_deleted_paths_from_current_change_set
run_complete_canonicalizes_rename_backed_paths
run_complete_rejects_file_path_outside_repo_root
run_reopen_rejects_blank_reason_without_mutating_state
run_reopen_rejects_second_parked_step_without_mutating_state
run_transfer_rejects_blank_reason_without_mutating_state
run_transfer_rejects_second_parked_step
run_complete_rolls_back_on_injected_failure
run_reopen_rolls_back_on_injected_failure
run_reopen_updates_invalidation_timestamp
run_transfer_rolls_back_on_injected_failure

echo "Plan execution helper regression test passed."
