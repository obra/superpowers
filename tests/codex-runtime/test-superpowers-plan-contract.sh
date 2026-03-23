#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
HELPER_BIN="$REPO_ROOT/bin/superpowers-plan-contract"
FIXTURE_DIR="$REPO_ROOT/tests/codex-runtime/fixtures/plan-contract"
WORKFLOW_FIXTURE_DIR="$REPO_ROOT/tests/codex-runtime/fixtures/workflow-artifacts"
STATE_DIR="$(mktemp -d)"
REPO_DIR="$(mktemp -d)"
trap 'rm -rf "$STATE_DIR" "$REPO_DIR"' EXIT
export SUPERPOWERS_STATE_DIR="$STATE_DIR"
REAL_SPEC_REL="docs/superpowers/specs/2026-03-21-task-fidelity-improvement-design.md"
REAL_PLAN_REL="docs/superpowers/plans/2026-03-21-task-fidelity-improvement.md"

SPEC_REL="docs/superpowers/specs/2026-03-22-plan-contract-fixture-design.md"
PLAN_REL="docs/superpowers/plans/2026-03-22-plan-contract-fixture.md"

FIXTURE_NAMES=(
  valid-spec.md
  valid-plan.md
  invalid-missing-index-spec.md
  invalid-missing-coverage-plan.md
  invalid-unknown-id-plan.md
  invalid-ambiguous-wording-plan.md
  invalid-requirement-weakening-plan.md
  invalid-open-questions-plan.md
  invalid-malformed-files-plan.md
  invalid-malformed-task-structure-plan.md
  invalid-path-traversal-plan.md
  overlapping-write-scopes-plan.md
)

require_helper() {
  if [[ ! -x "$HELPER_BIN" ]]; then
    echo "Expected plan-contract helper to exist and be executable: $HELPER_BIN"
    exit 1
  fi
}

require_fixtures() {
  local name
  for name in "${FIXTURE_NAMES[@]}"; do
    if [[ ! -f "$FIXTURE_DIR/$name" ]]; then
      echo "Expected plan-contract fixture to exist: $FIXTURE_DIR/$name"
      exit 1
    fi
  done
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

assert_not_equals() {
  local actual="$1"
  local unexpected="$2"
  local label="$3"
  if [[ "$actual" == "$unexpected" ]]; then
    echo "Expected ${label} to differ from '${unexpected}'"
    exit 1
  fi
}

json_value() {
  local json="$1"
  local path="$2"
  printf '%s' "$json" | node -e '
    const fs = require("fs");
    const keys = process.argv[1].split(".");
    let value = JSON.parse(fs.readFileSync(0, "utf8"));
    for (const key of keys) {
      if (value === null || value === undefined) break;
      if (/^[0-9]+$/.test(key) && Array.isArray(value)) {
        value = value[Number(key)];
      } else {
        value = value[key];
      }
    }
    if (value === null) {
      process.stdout.write("null");
    } else if (value === undefined) {
      process.stdout.write("");
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

run_json_command() {
  local repo_dir="$1"
  shift
  local output
  local status=0
  output="$(cd "$repo_dir" && "$HELPER_BIN" "$@" 2>&1)" || status=$?
  if [[ $status -ne 0 ]]; then
    echo "Expected command to succeed: $*"
    printf '%s\n' "$output"
    exit 1
  fi
  printf '%s\n' "$output"
}

run_markdown_command() {
  local repo_dir="$1"
  shift
  local output
  local status=0
  output="$(cd "$repo_dir" && "$HELPER_BIN" "$@" 2>&1)" || status=$?
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

  stdout_file="$(mktemp "${TMPDIR:-/tmp}/superpowers-plan-contract-stdout.XXXXXX")"
  stderr_file="$(mktemp "${TMPDIR:-/tmp}/superpowers-plan-contract-stderr.XXXXXX")"
  TIMEFORMAT='%R'
  timing="$({ time (cd "$repo_dir" && "$HELPER_BIN" "$@" >"$stdout_file" 2>"$stderr_file"); } 2>&1)" || status=$?
  timing="${timing##*$'\n'}"

  output="$(cat "$stdout_file")"
  error_output="$(cat "$stderr_file")"
  rm -f "$stdout_file" "$stderr_file"

  if awk -v actual="$timing" -v limit="$timeout_seconds" 'BEGIN { exit !((actual + 0) > (limit + 0)) }'; then
    echo "Command timed out after ${timeout_seconds}s: $HELPER_BIN $*"
    echo "Elapsed: ${timing}s"
    [[ -n "$output" ]] && printf '%s\n' "$output"
    [[ -n "$error_output" ]] && printf '%s\n' "$error_output"
    exit 124
  fi

  if [[ $status -ne 0 ]]; then
    echo "Expected command to succeed: $HELPER_BIN $*"
    [[ -n "$output" ]] && printf '%s\n' "$output"
    [[ -n "$error_output" ]] && printf '%s\n' "$error_output"
    exit "$status"
  fi

  printf '%s\n' "$output"
}

run_command_fails() {
  local repo_dir="$1"
  local expected_class="$2"
  shift 2
  local output
  local status=0
  output="$(cd "$repo_dir" && "$HELPER_BIN" "$@" 2>&1)" || status=$?
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

init_repo() {
  local repo_dir="$1"

  mkdir -p "$repo_dir"
  git -C "$repo_dir" init >/dev/null 2>&1
  git -C "$repo_dir" config user.name "Superpowers Test"
  git -C "$repo_dir" config user.email "superpowers-tests@example.com"
  git -C "$repo_dir" checkout -b task-fidelity-fixture >/dev/null 2>&1
  printf '# plan contract regression fixture\n' > "$repo_dir/README.md"
  git -C "$repo_dir" add README.md
  git -C "$repo_dir" commit -m "init" >/dev/null 2>&1
}

install_fixture() {
  local fixture_name="$1"
  local destination_rel="$2"
  mkdir -p "$(dirname "$REPO_DIR/$destination_rel")"
  cp "$FIXTURE_DIR/$fixture_name" "$REPO_DIR/$destination_rel"
}

install_valid_artifacts() {
  install_fixture "valid-spec.md" "$SPEC_REL"
  install_fixture "valid-plan.md" "$PLAN_REL"
}

install_runtime_integration_artifacts() {
  mkdir -p "$(dirname "$REPO_DIR/docs/superpowers/specs/2026-03-22-runtime-integration-hardening-design.md")"
  mkdir -p "$(dirname "$REPO_DIR/docs/superpowers/plans/2026-03-22-runtime-integration-hardening.md")"
  cp \
    "$WORKFLOW_FIXTURE_DIR/specs/2026-03-22-runtime-integration-hardening-design.md" \
    "$REPO_DIR/docs/superpowers/specs/2026-03-22-runtime-integration-hardening-design.md"
  cp \
    "$WORKFLOW_FIXTURE_DIR/plans/2026-03-22-runtime-integration-hardening.md" \
    "$REPO_DIR/docs/superpowers/plans/2026-03-22-runtime-integration-hardening.md"
  node - <<'NODE' "$REPO_DIR/docs/superpowers/plans/2026-03-22-runtime-integration-hardening.md"
const fs = require("fs");
const file = process.argv[2];
const source = fs.readFileSync(file, "utf8");
fs.writeFileSync(
  file,
  source.replace(
    "tests/codex-runtime/fixtures/workflow-artifacts/specs/2026-03-22-runtime-integration-hardening-design.md",
    "docs/superpowers/specs/2026-03-22-runtime-integration-hardening-design.md",
  ),
);
NODE
}

reset_artifacts() {
  rm -rf "$REPO_DIR/docs"
}

rewrite_in_repo() {
  local rel_path="$1"
  local source="$2"
  node -e '
    const fs = require("fs");
    const path = process.argv[1];
    const pattern = process.argv[2];
    const replacement = process.argv[3];
    const source = fs.readFileSync(path, "utf8");
    fs.writeFileSync(path, source.replace(pattern, replacement));
  ' "$REPO_DIR/$rel_path" "$source" "$4"
}
replace_in_file() {
  local rel_path="$1"
  local search="$2"
  local replacement="$3"
  node - <<'NODE' "$REPO_DIR/$rel_path" "$search" "$replacement"
const fs = require("fs");
const [file, search, replacement] = process.argv.slice(2);
const source = fs.readFileSync(file, "utf8");
if (!source.includes(search)) {
  process.stderr.write(`Did not find expected text in ${file}: ${search}\n`);
  process.exit(1);
}
fs.writeFileSync(file, source.replace(search, replacement));
NODE
}

test_lint_succeeds_for_valid_contract() {
  reset_artifacts
  install_valid_artifacts

  local output
  output="$(run_json_command "$REPO_DIR" lint --spec "$SPEC_REL" --plan "$PLAN_REL")"
  assert_json_equals "$output" "status" "ok" "lint"
  assert_json_equals "$output" "spec_requirement_count" "6" "lint"
  assert_json_equals "$output" "plan_task_count" "2" "lint"
  assert_json_equals "$output" "coverage.REQ-001.0" "1" "lint"
  assert_json_equals "$output" "coverage.REQ-003.0" "2" "lint"
}

test_lint_ignores_fenced_example_requirement_index_blocks() {
  reset_artifacts
  install_fixture "valid-plan.md" "$PLAN_REL"
  write_file "$REPO_DIR/$SPEC_REL" <<'EOF'
# Plan Contract Fixture Design

**Workflow State:** CEO Approved
**Spec Revision:** 1
**Last Reviewed By:** plan-ceo-review

## Summary

Fixture spec for plan-contract helper regression coverage.

## Proposed Design

Example:

```markdown
## Requirement Index

- [REQ-999][behavior] Example requirement only.
```

## Requirement Index

- [REQ-001][behavior] Execution-bound specs must include a parseable `Requirement Index`.
- [REQ-002][behavior] Implementation plans must include a parseable `Requirement Coverage Matrix` mapping every indexed requirement to one or more tasks.
- [REQ-003][behavior] Superpowers must provide a derived `superpowers-plan-contract` helper that lints traceability and builds canonical task packets.
- [DEC-001][decision] Markdown artifacts remain authoritative and helper output must preserve exact approved statements rather than paraphrase them.
- [NONGOAL-001][non-goal] Do not introduce hidden workflow authority outside repo-visible markdown artifacts.
- [VERIFY-001][verification] Regression coverage must cover missing indexes, missing coverage, unknown IDs, unresolved open questions, malformed task structure, malformed `Files:` blocks, path traversal rejection, and stale packet handling.
EOF

  local output
  output="$(run_json_command "$REPO_DIR" lint --spec "$SPEC_REL" --plan "$PLAN_REL")"
  assert_json_equals "$output" "status" "ok" "lint"
  assert_json_equals "$output" "spec_requirement_count" "6" "lint"
  assert_json_equals "$output" "plan_task_count" "2" "lint"
}

test_analyze_plan_reports_valid_contract_and_buildable_packets() {
  reset_artifacts
  install_valid_artifacts

  local output
  output="$(run_json_command "$REPO_DIR" analyze-plan --spec "$SPEC_REL" --plan "$PLAN_REL" --format json)"
  assert_json_equals "$output" "contract_state" "valid" "analyze-plan"
  assert_json_equals "$output" "spec_path" "$SPEC_REL" "analyze-plan"
  assert_json_equals "$output" "spec_revision" "1" "analyze-plan"
  assert_json_nonempty "$output" "spec_fingerprint" "analyze-plan"
  assert_json_equals "$output" "plan_path" "$PLAN_REL" "analyze-plan"
  assert_json_equals "$output" "plan_revision" "1" "analyze-plan"
  assert_json_nonempty "$output" "plan_fingerprint" "analyze-plan"
  assert_json_equals "$output" "task_count" "2" "analyze-plan"
  assert_json_equals "$output" "packet_buildable_tasks" "2" "analyze-plan"
  assert_json_equals "$output" "coverage_complete" "true" "analyze-plan"
  assert_json_equals "$output" "open_questions_resolved" "true" "analyze-plan"
  assert_json_equals "$output" "task_structure_valid" "true" "analyze-plan"
  assert_json_equals "$output" "files_blocks_valid" "true" "analyze-plan"
  assert_json_equals "$output" "reason_codes" "[]" "analyze-plan"
  assert_json_equals "$output" "overlapping_write_scopes" "[]" "analyze-plan"
  assert_json_equals "$output" "diagnostics" "[]" "analyze-plan"
}

test_analyze_plan_rejects_stale_source_spec_linkage() {
  reset_artifacts
  install_valid_artifacts

  node - <<'NODE' "$REPO_DIR/$PLAN_REL"
const fs = require("fs");
const path = process.argv[2];
const source = fs.readFileSync(path, "utf8");
fs.writeFileSync(
  path,
  source.replace("**Source Spec Revision:** 1", "**Source Spec Revision:** 2"),
);
NODE

  local output
  output="$(run_json_command "$REPO_DIR" analyze-plan --spec "$SPEC_REL" --plan "$PLAN_REL" --format json)"
  assert_json_equals "$output" "contract_state" "invalid" "analyze-plan stale source linkage"
  assert_json_equals "$output" "reason_codes.0" "stale_spec_plan_linkage" "analyze-plan stale source linkage"
  assert_json_equals "$output" "coverage_complete" "true" "analyze-plan stale source linkage"
  assert_json_equals "$output" "open_questions_resolved" "true" "analyze-plan stale source linkage"
}

test_analyze_plan_reports_missing_coverage_as_invalid() {
  reset_artifacts
  install_fixture "valid-spec.md" "$SPEC_REL"
  install_fixture "invalid-missing-coverage-plan.md" "$PLAN_REL"

  local output
  output="$(run_json_command "$REPO_DIR" analyze-plan --spec "$SPEC_REL" --plan "$PLAN_REL" --format json)"
  assert_json_equals "$output" "contract_state" "invalid" "analyze-plan missing coverage"
  assert_json_equals "$output" "task_count" "2" "analyze-plan missing coverage"
  assert_json_equals "$output" "packet_buildable_tasks" "2" "analyze-plan missing coverage"
  assert_json_equals "$output" "coverage_complete" "false" "analyze-plan missing coverage"
  assert_json_equals "$output" "open_questions_resolved" "true" "analyze-plan missing coverage"
  assert_json_equals "$output" "task_structure_valid" "true" "analyze-plan missing coverage"
  assert_json_equals "$output" "files_blocks_valid" "true" "analyze-plan missing coverage"
  assert_json_equals "$output" "reason_codes.0" "missing_requirement_coverage" "analyze-plan missing coverage"
  assert_json_equals "$output" "diagnostics.0.code" "missing_requirement_coverage" "analyze-plan missing coverage"
}

test_analyze_plan_reports_partial_packet_buildability() {
  reset_artifacts
  install_fixture "valid-spec.md" "$SPEC_REL"
  install_fixture "invalid-malformed-files-plan.md" "$PLAN_REL"

  local output
  output="$(run_json_command "$REPO_DIR" analyze-plan --spec "$SPEC_REL" --plan "$PLAN_REL" --format json)"
  assert_json_equals "$output" "contract_state" "invalid" "analyze-plan malformed files"
  assert_json_equals "$output" "task_count" "2" "analyze-plan malformed files"
  assert_json_equals "$output" "packet_buildable_tasks" "1" "analyze-plan malformed files"
  assert_json_equals "$output" "coverage_complete" "true" "analyze-plan malformed files"
  assert_json_equals "$output" "open_questions_resolved" "true" "analyze-plan malformed files"
  assert_json_equals "$output" "task_structure_valid" "true" "analyze-plan malformed files"
  assert_json_equals "$output" "files_blocks_valid" "false" "analyze-plan malformed files"
  assert_json_equals "$output" "reason_codes.0" "malformed_files_block" "analyze-plan malformed files"
  assert_json_equals "$output" "diagnostics.0.code" "malformed_files_block" "analyze-plan malformed files"
}

test_analyze_plan_reports_missing_spec_revision() {
  reset_artifacts
  install_fixture "valid-spec.md" "$SPEC_REL"
  install_fixture "valid-plan.md" "$PLAN_REL"
  replace_in_file "$SPEC_REL" "**Spec Revision:** 1" "**Spec Revision:** one"

  local output
  output="$(run_json_command "$REPO_DIR" analyze-plan --spec "$SPEC_REL" --plan "$PLAN_REL" --format json)"
  assert_json_equals "$output" "contract_state" "invalid" "analyze-plan missing spec revision"
  assert_json_equals "$output" "reason_codes.0" "missing_spec_revision" "analyze-plan missing spec revision"
  assert_json_equals "$output" "diagnostics.0.code" "missing_spec_revision" "analyze-plan missing spec revision"
}

test_analyze_plan_reports_malformed_task_structure() {
  reset_artifacts
  install_fixture "valid-spec.md" "$SPEC_REL"
  install_fixture "invalid-malformed-task-structure-plan.md" "$PLAN_REL"

  local output
  output="$(run_json_command "$REPO_DIR" analyze-plan --spec "$SPEC_REL" --plan "$PLAN_REL" --format json)"
  assert_json_equals "$output" "contract_state" "invalid" "analyze-plan malformed task structure"
  assert_json_equals "$output" "task_structure_valid" "false" "analyze-plan malformed task structure"
  assert_json_equals "$output" "reason_codes.0" "malformed_task_structure" "analyze-plan malformed task structure"
  assert_json_equals "$output" "diagnostics.0.code" "malformed_task_structure" "analyze-plan malformed task structure"
}

test_analyze_plan_reports_coverage_matrix_mismatch() {
  reset_artifacts
  install_fixture "valid-spec.md" "$SPEC_REL"
  install_fixture "valid-plan.md" "$PLAN_REL"
  replace_in_file "$PLAN_REL" "- REQ-001 -> Task 1" "- REQ-001 -> Task 9"

  local output
  output="$(run_json_command "$REPO_DIR" analyze-plan --spec "$SPEC_REL" --plan "$PLAN_REL" --format json)"
  assert_json_equals "$output" "contract_state" "invalid" "analyze-plan coverage matrix mismatch"
  assert_json_equals "$output" "reason_codes.0" "coverage_matrix_mismatch" "analyze-plan coverage matrix mismatch"
  assert_json_equals "$output" "diagnostics.0.code" "coverage_matrix_mismatch" "analyze-plan coverage matrix mismatch"
}

test_analyze_plan_reports_overlapping_write_scopes() {
  reset_artifacts
  install_fixture "valid-spec.md" "$SPEC_REL"
  install_fixture "overlapping-write-scopes-plan.md" "$PLAN_REL"

  local output
  output="$(run_json_command "$REPO_DIR" analyze-plan --spec "$SPEC_REL" --plan "$PLAN_REL" --format json)"
  assert_json_equals "$output" "contract_state" "valid" "analyze-plan overlapping scopes"
  assert_json_equals "$output" "task_count" "2" "analyze-plan overlapping scopes"
  assert_json_equals "$output" "packet_buildable_tasks" "2" "analyze-plan overlapping scopes"
  assert_json_equals "$output" "overlapping_write_scopes" '[{"path":"skills/writing-plans/SKILL.md","tasks":[1,2]}]' "analyze-plan overlapping scopes"
  assert_json_equals "$output" "overlapping_write_scopes.0.path" "skills/writing-plans/SKILL.md" "analyze-plan overlapping scopes"
  assert_json_equals "$output" "overlapping_write_scopes.0.tasks.0" "1" "analyze-plan overlapping scopes"
  assert_json_equals "$output" "overlapping_write_scopes.0.tasks.1" "2" "analyze-plan overlapping scopes"
}

test_analyze_plan_reports_missing_requirement_index() {
  reset_artifacts
  install_fixture "invalid-missing-index-spec.md" "$SPEC_REL"
  install_fixture "valid-plan.md" "$PLAN_REL"

  local output
  output="$(run_json_command "$REPO_DIR" analyze-plan --spec "$SPEC_REL" --plan "$PLAN_REL" --format json)"
  assert_json_equals "$output" "contract_state" "invalid" "analyze-plan missing requirement index"
  assert_json_equals "$output" "reason_codes.0" "missing_requirement_index" "analyze-plan missing requirement index"
  assert_json_equals "$output" "diagnostics.0.code" "missing_requirement_index" "analyze-plan missing requirement index"
}

test_analyze_plan_reports_malformed_requirement_index() {
  reset_artifacts
  install_fixture "valid-spec.md" "$SPEC_REL"
  install_fixture "valid-plan.md" "$PLAN_REL"
  replace_in_file "$SPEC_REL" '- [REQ-001][behavior] Execution-bound specs must include a parseable `Requirement Index`.' '- REQ-001 behavior] Execution-bound specs must include a parseable `Requirement Index`.'

  local output
  output="$(run_json_command "$REPO_DIR" analyze-plan --spec "$SPEC_REL" --plan "$PLAN_REL" --format json)"
  assert_json_equals "$output" "contract_state" "invalid" "analyze-plan malformed requirement index"
  assert_json_equals "$output" "reason_codes.0" "malformed_requirement_index" "analyze-plan malformed requirement index"
  assert_json_equals "$output" "diagnostics.0.code" "malformed_requirement_index" "analyze-plan malformed requirement index"
}

test_analyze_plan_reports_task_missing_spec_coverage() {
  reset_artifacts
  install_fixture "valid-spec.md" "$SPEC_REL"
  install_fixture "valid-plan.md" "$PLAN_REL"
  replace_in_file "$PLAN_REL" "**Spec Coverage:** REQ-001, REQ-002, DEC-001" "**Spec Coverage:** "

  local output
  output="$(run_json_command "$REPO_DIR" analyze-plan --spec "$SPEC_REL" --plan "$PLAN_REL" --format json)"
  assert_json_equals "$output" "contract_state" "invalid" "analyze-plan task missing spec coverage"
  assert_json_equals "$output" "reason_codes.0" "task_missing_spec_coverage" "analyze-plan task missing spec coverage"
  assert_json_equals "$output" "diagnostics.0.code" "task_missing_spec_coverage" "analyze-plan task missing spec coverage"
}

test_analyze_plan_reports_unexpected_requirement_index_failure() {
  reset_artifacts
  install_valid_artifacts

  local output
  output="$(run_json_command_with_env "$REPO_DIR" SUPERPOWERS_PLAN_CONTRACT_TEST_FAILPOINT=requirement_index_unexpected_failure "$HELPER_BIN" analyze-plan --spec "$SPEC_REL" --plan "$PLAN_REL" --format json)"
  assert_json_equals "$output" "contract_state" "invalid" "analyze-plan unexpected requirement index failure"
  assert_json_equals "$output" "reason_codes.0" "unexpected_plan_contract_failure" "analyze-plan unexpected requirement index failure"
  assert_json_equals "$output" "diagnostics.0.code" "unexpected_plan_contract_failure" "analyze-plan unexpected requirement index failure"
}

test_analyze_plan_reports_unexpected_coverage_matrix_failure() {
  reset_artifacts
  install_valid_artifacts

  local output
  output="$(run_json_command_with_env "$REPO_DIR" SUPERPOWERS_PLAN_CONTRACT_TEST_FAILPOINT=coverage_matrix_unexpected_failure "$HELPER_BIN" analyze-plan --spec "$SPEC_REL" --plan "$PLAN_REL" --format json)"
  assert_json_equals "$output" "contract_state" "invalid" "analyze-plan unexpected coverage matrix failure"
  assert_json_equals "$output" "reason_codes.0" "unexpected_plan_contract_failure" "analyze-plan unexpected coverage matrix failure"
  assert_json_equals "$output" "diagnostics.0.code" "unexpected_plan_contract_failure" "analyze-plan unexpected coverage matrix failure"
}

test_build_task_packet_json_preserves_exact_contract_text() {
  reset_artifacts
  install_valid_artifacts

  local output
  output="$(run_json_command "$REPO_DIR" build-task-packet --plan "$PLAN_REL" --task 1 --format json --persist no)"
  assert_json_equals "$output" "status" "ok" "packet"
  assert_json_equals "$output" "plan_path" "$PLAN_REL" "packet"
  assert_json_equals "$output" "plan_revision" "1" "packet"
  assert_json_nonempty "$output" "plan_fingerprint" "packet"
  assert_json_equals "$output" "source_spec_path" "$SPEC_REL" "packet"
  assert_json_equals "$output" "source_spec_revision" "1" "packet"
  assert_json_nonempty "$output" "source_spec_fingerprint" "packet"
  assert_json_equals "$output" "task_number" "1" "packet"
  assert_json_equals "$output" "task_title" "Establish the plan contract" "packet"
  assert_json_equals "$output" "open_questions" "none" "packet"
  assert_json_equals "$output" "requirement_ids.0" "REQ-001" "packet"
  assert_json_equals "$output" "requirement_ids.1" "REQ-002" "packet"
  assert_json_equals "$output" "requirement_ids.2" "DEC-001" "packet"
  assert_json_nonempty "$output" "packet_timestamp" "packet"
  assert_json_nonempty "$output" "packet_fingerprint" "packet"
  assert_json_equals "$output" "persisted" "false" "packet"
  assert_json_equals "$output" "cache_status" "ephemeral" "packet"
  assert_contains "$output" 'Execution-bound specs must include a parseable `Requirement Index`' "packet"
  assert_contains "$output" "## Task 1: Establish the plan contract" "packet"
}

test_build_task_packet_markdown_preserves_exact_contract_text() {
  reset_artifacts
  install_valid_artifacts

  local output
  output="$(run_markdown_command "$REPO_DIR" build-task-packet --plan "$PLAN_REL" --task 2 --format markdown --persist no)"
  assert_contains "$output" "## Task Packet" "markdown packet"
  assert_contains "$output" "**Plan Path:** \`$PLAN_REL\`" "markdown packet"
  assert_contains "$output" "**Plan Revision:** 1" "markdown packet"
  assert_contains "$output" "**Source Spec Path:** \`$SPEC_REL\`" "markdown packet"
  assert_contains "$output" "**Source Spec Revision:** 1" "markdown packet"
  assert_contains "$output" "**Packet Fingerprint:** \`" "markdown packet"
  assert_contains "$output" "**Generated At:** " "markdown packet"
  assert_contains "$output" "## Task 2: Dispatch exact packet-backed execution" "markdown packet"
  assert_contains "$output" 'Superpowers must provide a derived `superpowers-plan-contract` helper that lints traceability and builds canonical task packets.' "markdown packet"
  assert_contains "$output" "**Open Questions:** none" "markdown packet"
}

test_missing_requirement_index_fails() {
  reset_artifacts
  install_fixture "invalid-missing-index-spec.md" "$SPEC_REL"
  install_fixture "valid-plan.md" "$PLAN_REL"

  run_command_fails "$REPO_DIR" "MissingRequirementIndex" lint --spec "$SPEC_REL" --plan "$PLAN_REL" >/dev/null
}

test_missing_requirement_coverage_fails() {
  reset_artifacts
  install_fixture "valid-spec.md" "$SPEC_REL"
  install_fixture "invalid-missing-coverage-plan.md" "$PLAN_REL"

  run_command_fails "$REPO_DIR" "MissingRequirementCoverage" lint --spec "$SPEC_REL" --plan "$PLAN_REL" >/dev/null
}

test_unknown_requirement_id_fails() {
  reset_artifacts
  install_fixture "valid-spec.md" "$SPEC_REL"
  install_fixture "invalid-unknown-id-plan.md" "$PLAN_REL"

  run_command_fails "$REPO_DIR" "UnknownRequirementId" lint --spec "$SPEC_REL" --plan "$PLAN_REL" >/dev/null
}

test_ambiguous_task_wording_fails() {
  reset_artifacts
  install_fixture "valid-spec.md" "$SPEC_REL"
  install_fixture "invalid-ambiguous-wording-plan.md" "$PLAN_REL"

  run_command_fails "$REPO_DIR" "AmbiguousTaskWording" lint --spec "$SPEC_REL" --plan "$PLAN_REL" >/dev/null
}

test_requirement_weakening_fails() {
  reset_artifacts
  install_fixture "valid-spec.md" "$SPEC_REL"
  install_fixture "invalid-requirement-weakening-plan.md" "$PLAN_REL"

  run_command_fails "$REPO_DIR" "RequirementWeakeningDetected" lint --spec "$SPEC_REL" --plan "$PLAN_REL" >/dev/null
}

test_open_questions_fail_closed() {
  reset_artifacts
  install_fixture "valid-spec.md" "$SPEC_REL"
  install_fixture "invalid-open-questions-plan.md" "$PLAN_REL"

  run_command_fails "$REPO_DIR" "TaskOpenQuestionsNotResolved" lint --spec "$SPEC_REL" --plan "$PLAN_REL" >/dev/null
}

test_malformed_files_block_fails() {
  reset_artifacts
  install_fixture "valid-spec.md" "$SPEC_REL"
  install_fixture "invalid-malformed-files-plan.md" "$PLAN_REL"

  run_command_fails "$REPO_DIR" "MalformedFilesBlock" lint --spec "$SPEC_REL" --plan "$PLAN_REL" >/dev/null
}

test_malformed_task_structure_fails() {
  reset_artifacts
  install_fixture "valid-spec.md" "$SPEC_REL"
  install_fixture "invalid-malformed-task-structure-plan.md" "$PLAN_REL"

  run_command_fails "$REPO_DIR" "MalformedTaskStructure" lint --spec "$SPEC_REL" --plan "$PLAN_REL" >/dev/null
}

test_path_traversal_in_files_block_fails() {
  reset_artifacts
  install_fixture "valid-spec.md" "$SPEC_REL"
  install_fixture "invalid-path-traversal-plan.md" "$PLAN_REL"

  run_command_fails "$REPO_DIR" "MalformedFilesBlock" lint --spec "$SPEC_REL" --plan "$PLAN_REL" >/dev/null
}

test_build_task_packet_fails_for_unknown_task() {
  reset_artifacts
  install_valid_artifacts

  run_command_fails "$REPO_DIR" "TaskNotFound" build-task-packet --plan "$PLAN_REL" --task 99 --format json --persist no >/dev/null
}

test_build_task_packet_detects_stale_plan_revision_and_regenerates() {
  reset_artifacts
  install_valid_artifacts

  local first_output first_path first_fingerprint second_output second_path second_fingerprint
  first_output="$(run_json_command "$REPO_DIR" build-task-packet --plan "$PLAN_REL" --task 1 --format json --persist yes)"
  assert_json_equals "$first_output" "persisted" "true" "packet"
  assert_json_equals "$first_output" "cache_status" "fresh" "packet"
  assert_json_nonempty "$first_output" "packet_path" "packet"
  assert_json_nonempty "$first_output" "packet_fingerprint" "packet"
  first_path="$(json_value "$first_output" "packet_path")"
  first_fingerprint="$(json_value "$first_output" "packet_fingerprint")"

  replace_in_file "$PLAN_REL" "**Plan Revision:** 1" "**Plan Revision:** 2"

  second_output="$(run_json_command "$REPO_DIR" build-task-packet --plan "$PLAN_REL" --task 1 --format json --persist yes)"
  assert_json_equals "$second_output" "plan_revision" "2" "packet"
  assert_json_equals "$second_output" "cache_status" "regenerated" "packet"
  assert_json_nonempty "$second_output" "packet_path" "packet"
  assert_json_nonempty "$second_output" "packet_fingerprint" "packet"
  second_path="$(json_value "$second_output" "packet_path")"
  second_fingerprint="$(json_value "$second_output" "packet_fingerprint")"
  assert_not_equals "$second_fingerprint" "$first_fingerprint" "packet fingerprint after plan revision change"
  if [[ ! -f "$second_path" ]]; then
    echo "Expected regenerated packet to exist at $second_path"
    exit 1
  fi
  if [[ "$first_path" != "$second_path" ]]; then
    echo "Expected regenerated packet to reuse the persisted packet path"
    echo "First:  $first_path"
    echo "Second: $second_path"
    exit 1
  fi
}

test_build_task_packet_detects_tampered_cache_and_regenerates() {
  reset_artifacts
  install_valid_artifacts

  local first_output packet_path second_output second_fingerprint
  first_output="$(run_json_command "$REPO_DIR" build-task-packet --plan "$PLAN_REL" --task 2 --format json --persist yes)"
  packet_path="$(json_value "$first_output" "packet_path")"
  assert_json_nonempty "$first_output" "packet_path" "packet"
  assert_json_nonempty "$first_output" "packet_fingerprint" "packet"
  printf 'tampered\n' > "$packet_path"

  second_output="$(run_json_command "$REPO_DIR" build-task-packet --plan "$PLAN_REL" --task 2 --format json --persist yes)"
  assert_json_equals "$second_output" "cache_status" "regenerated" "packet"
  assert_json_nonempty "$second_output" "packet_fingerprint" "packet"
  second_fingerprint="$(json_value "$second_output" "packet_fingerprint")"
  assert_not_equals "$second_fingerprint" "tampered" "packet fingerprint after cache tamper"
  assert_contains "$(cat "$packet_path")" "Dispatch exact packet-backed execution" "regenerated packet file"
}

test_real_approved_task_fidelity_artifacts_lint_clean() {
  local output
  output="$(run_json_command "$REPO_ROOT" lint --spec "$REAL_SPEC_REL" --plan "$REAL_PLAN_REL")"
  assert_json_equals "$output" "status" "ok" "real task-fidelity lint"
  assert_json_equals "$output" "spec_requirement_count" "18" "real task-fidelity lint"
  assert_json_equals "$output" "plan_task_count" "5" "real task-fidelity lint"
  assert_json_equals "$output" "coverage.REQ-006.0" "4" "real task-fidelity lint"
  assert_json_equals "$output" "coverage.VERIFY-001.1" "5" "real task-fidelity lint"
}

test_real_approved_task_fidelity_packet_builds() {
  local output
  output="$(run_json_command "$REPO_ROOT" build-task-packet --plan "$REAL_PLAN_REL" --task 4 --format json --persist no)"
  assert_json_equals "$output" "status" "ok" "real task-fidelity packet"
  assert_json_equals "$output" "task_number" "4" "real task-fidelity packet"
  assert_json_equals "$output" "persisted" "false" "real task-fidelity packet"
  assert_contains "$output" "Execution modes must build and consume canonical task packets" "real task-fidelity packet"
  assert_contains "$output" "## Task 4: Switch Execution And Review Consumers To Task Packets" "real task-fidelity packet"
}

test_runtime_integration_repo_lint_stays_fast() {
  local output

  run_json_command "$REPO_ROOT" lint --spec docs/superpowers/specs/2026-03-22-runtime-integration-hardening-design.md --plan docs/superpowers/plans/2026-03-22-runtime-integration-hardening.md >/dev/null
  output="$(run_json_command_with_timeout "$REPO_ROOT" 1 lint --spec docs/superpowers/specs/2026-03-22-runtime-integration-hardening-design.md --plan docs/superpowers/plans/2026-03-22-runtime-integration-hardening.md)"
  assert_json_equals "$output" "status" "ok" "runtime integration repo lint"
}

test_runtime_integration_repo_analyze_plan_stays_fast() {
  local output

  run_json_command "$REPO_ROOT" analyze-plan --spec docs/superpowers/specs/2026-03-22-runtime-integration-hardening-design.md --plan docs/superpowers/plans/2026-03-22-runtime-integration-hardening.md --format json >/dev/null
  output="$(run_json_command_with_timeout "$REPO_ROOT" 1 analyze-plan --spec docs/superpowers/specs/2026-03-22-runtime-integration-hardening-design.md --plan docs/superpowers/plans/2026-03-22-runtime-integration-hardening.md --format json)"
  assert_json_equals "$output" "contract_state" "valid" "runtime integration repo analyze-plan"
}

test_lint_cache_invalidates_after_plan_change() {
  reset_artifacts
  install_valid_artifacts

  run_json_command "$REPO_DIR" lint --spec "$SPEC_REL" --plan "$PLAN_REL" >/dev/null
  replace_in_file "$PLAN_REL" "- REQ-003 -> Task 2" "- REQ-003 -> Task 1"

  run_command_fails "$REPO_DIR" CoverageMatrixMismatch lint --spec "$SPEC_REL" --plan "$PLAN_REL" >/dev/null
}

test_persisted_packet_cache_prunes_old_entries() {
  reset_artifacts
  install_valid_artifacts

  local first_output packet_path packet_dir retained_count
  first_output="$(run_json_command_with_env "$REPO_DIR" SUPERPOWERS_PLAN_PACKET_RETENTION=2 "$HELPER_BIN" build-task-packet --plan "$PLAN_REL" --task 1 --format json --persist yes)"
  packet_path="$(json_value "$first_output" "packet_path")"
  packet_dir="$(dirname "$packet_path")"

  printf 'stale one\n' > "$packet_dir/stale-one.packet.md"
  printf 'stale two\n' > "$packet_dir/stale-two.packet.md"
  printf 'stale three\n' > "$packet_dir/stale-three.packet.md"
  touch -t 202603220101 "$packet_dir/stale-one.packet.md"
  touch -t 202603220102 "$packet_dir/stale-two.packet.md"
  touch -t 202603220103 "$packet_dir/stale-three.packet.md"

  run_json_command_with_env "$REPO_DIR" SUPERPOWERS_PLAN_PACKET_RETENTION=2 "$HELPER_BIN" build-task-packet --plan "$PLAN_REL" --task 1 --format json --persist yes >/dev/null

  retained_count="$(find "$packet_dir" -maxdepth 1 -name '*.packet.md' | wc -l | tr -d ' ')"
  if [[ "$retained_count" != "2" ]]; then
    echo "Expected packet cache retention to keep exactly 2 packet files"
    echo "Actual count: $retained_count"
    find "$packet_dir" -maxdepth 1 -name '*.packet.md' -print | sort
    exit 1
  fi
  if [[ ! -f "$packet_path" ]]; then
    echo "Expected the current task packet to remain after retention pruning"
    exit 1
  fi
}

require_helper
require_fixtures
init_repo "$REPO_DIR"

test_lint_succeeds_for_valid_contract
test_lint_ignores_fenced_example_requirement_index_blocks
test_analyze_plan_reports_valid_contract_and_buildable_packets
test_analyze_plan_rejects_stale_source_spec_linkage
test_analyze_plan_reports_missing_coverage_as_invalid
test_analyze_plan_reports_partial_packet_buildability
test_analyze_plan_reports_missing_spec_revision
test_analyze_plan_reports_malformed_task_structure
test_analyze_plan_reports_coverage_matrix_mismatch
test_analyze_plan_reports_overlapping_write_scopes
test_analyze_plan_reports_missing_requirement_index
test_analyze_plan_reports_malformed_requirement_index
test_analyze_plan_reports_task_missing_spec_coverage
test_analyze_plan_reports_unexpected_requirement_index_failure
test_analyze_plan_reports_unexpected_coverage_matrix_failure
test_build_task_packet_json_preserves_exact_contract_text
test_build_task_packet_markdown_preserves_exact_contract_text
test_missing_requirement_index_fails
test_missing_requirement_coverage_fails
test_unknown_requirement_id_fails
test_ambiguous_task_wording_fails
test_requirement_weakening_fails
test_open_questions_fail_closed
test_malformed_files_block_fails
test_malformed_task_structure_fails
test_path_traversal_in_files_block_fails
test_build_task_packet_fails_for_unknown_task
test_build_task_packet_detects_stale_plan_revision_and_regenerates
test_build_task_packet_detects_tampered_cache_and_regenerates
test_real_approved_task_fidelity_artifacts_lint_clean
test_real_approved_task_fidelity_packet_builds
test_runtime_integration_repo_lint_stays_fast
test_runtime_integration_repo_analyze_plan_stays_fast
test_lint_cache_invalidates_after_plan_change
test_persisted_packet_cache_prunes_old_entries

echo "Plan-contract helper regression test passed."
