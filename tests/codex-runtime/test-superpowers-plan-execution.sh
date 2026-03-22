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

## Task 1: Core flow

**Files:**
- Test: \`bash tests/codex-runtime/test-superpowers-plan-execution.sh\`

- [ ] **Step 1: Prepare workspace for execution**
- [ ] **Step 2: Validate the generated output**

## Task 2: Repair flow

**Files:**
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

## Task 1: Build parser slice

**Files:**
- Modify: \`src/parser-slice.sh:10-40\`
- Modify: \`tests/parser-slice.test.sh:1-25\`
- Test: \`bash tests/parser-slice.test.sh\`

- [ ] **Step 1: Build parser slice**

## Task 2: Build formatter slice

**Files:**
- Modify: \`src/formatter-slice.sh:12-36\`
- Modify: \`tests/formatter-slice.test.sh:1-18\`
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

## Task 1: Update parser

**Files:**
- Modify: \`src/shared-parser.sh:10-40\`
- Modify: \`tests/shared-parser.test.sh:1-20\`
- Test: \`bash tests/shared-parser.test.sh\`

- [ ] **Step 1: Update parser**

## Task 2: Repair parser follow-up

**Files:**
- Modify: \`src/shared-parser.sh:42-75\`
- Modify: \`tests/shared-parser.test.sh:22-40\`
- Test: \`bash tests/shared-parser.test.sh\`

- [ ] **Step 1: Repair parser follow-up**
EOF
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

run_status_rejects_evidence_history_with_none_mode() {
  local repo_dir
  repo_dir="$(create_base_repo none-mode-evidence-history)"
  write_completed_attempt "$repo_dir" "superpowers:executing-plans"

  run_command_fails "$repo_dir" MalformedExecutionState status --plan "$PLAN_REL" >/dev/null
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

  run_command_fails "$repo_dir" MalformedExecutionState status --plan "$PLAN_REL" >/dev/null
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
  assert_json_equals "$output" "decision_flags.tasks_independent" "unknown" "recommend output"
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
  assert_contains "$evidence_text" $'**Verification:**\n- Manual inspection only: Verified by inspection\n' "whitespace normalization verification"
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
  assert_contains "$evidence_text" $'**Files:**\n- docs/alpha.md\n- src/zeta.txt\n**Verification:**' "canonical files evidence"
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
  assert_contains "$evidence_text" $'**Files:**\n- docs/deleted-output.md\n**Verification:**' "deleted file evidence"
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
  assert_contains "$evidence_text" $'**Files:**\n- docs/new-output.md\n**Verification:**' "rename-backed file evidence"
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
run_status_treats_header_only_stub_as_same_empty_state
run_status_rejects_missing_execution_mode
run_status_rejects_evidence_history_with_none_mode
run_status_rejects_malformed_note_structure
run_status_rejects_task_without_parseable_files_block
run_status_rejects_malformed_evidence_attempt_fields
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
run_complete_rejects_stale_fingerprint
run_complete_applies_whitespace_normalization
run_complete_sorts_and_deduplicates_file_entries
run_complete_accepts_deleted_paths_from_current_change_set
run_complete_canonicalizes_rename_backed_paths
run_complete_rejects_file_path_outside_repo_root
run_reopen_rejects_blank_reason_without_mutating_state
run_transfer_rejects_blank_reason_without_mutating_state
run_transfer_rejects_second_parked_step
run_complete_rolls_back_on_injected_failure
run_reopen_rolls_back_on_injected_failure
run_reopen_updates_invalidation_timestamp
run_transfer_rolls_back_on_injected_failure

echo "Plan execution helper regression test passed."
