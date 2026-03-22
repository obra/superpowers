#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
HELPER_BIN="$REPO_ROOT/bin/superpowers-plan-contract"
FIXTURE_DIR="$REPO_ROOT/tests/codex-runtime/fixtures/plan-contract"
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

test_build_task_packet_json_preserves_exact_contract_text() {
  reset_artifacts
  install_valid_artifacts

  local output
  output="$(run_json_command "$REPO_DIR" build-task-packet --plan "$PLAN_REL" --task 1 --format json --persist no)"
  assert_json_equals "$output" "status" "ok" "packet"
  assert_json_equals "$output" "plan_path" "$PLAN_REL" "packet"
  assert_json_equals "$output" "source_spec_path" "$SPEC_REL" "packet"
  assert_json_equals "$output" "task_number" "1" "packet"
  assert_json_equals "$output" "task_title" "Establish the plan contract" "packet"
  assert_json_equals "$output" "open_questions" "none" "packet"
  assert_json_equals "$output" "requirement_ids.0" "REQ-001" "packet"
  assert_json_equals "$output" "requirement_ids.1" "REQ-002" "packet"
  assert_json_equals "$output" "requirement_ids.2" "DEC-001" "packet"
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
test_persisted_packet_cache_prunes_old_entries

echo "Plan-contract helper regression test passed."
