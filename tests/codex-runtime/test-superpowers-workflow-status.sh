#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
STATUS_BIN="$REPO_ROOT/bin/superpowers-workflow-status"
STATE_DIR="$(mktemp -d)"
REPO_DIR="$(mktemp -d)"
trap 'rm -rf "$STATE_DIR" "$REPO_DIR"' EXIT
export SUPERPOWERS_STATE_DIR="$STATE_DIR"

WORKFLOW_FIXTURE_DIR="$REPO_ROOT/tests/codex-runtime/fixtures/workflow-artifacts"
USER_NAME="$(whoami 2>/dev/null || echo user)"

# bootstrap repo with no docs -> brainstorming
# draft spec -> plan-ceo-review
# approved spec with no plan -> writing-plans
# draft plan -> plan-eng-review
# stale approved plan -> writing-plans
# corrupted manifest -> backup + warning + conservative route
# out-of-repo path -> explicit failure
# same repo slug, different branches/worktrees -> independent manifests
# bounded refresh -> prefer newest bounded candidate set
# single retry -> one retry on write conflict, then conservative route
# expect missing path survives refresh
# missing manifest path falls forward to a discovered artifact when unambiguous
# ambiguous fallback routes conservatively with note
# sync with missing artifact reads actual file state (not expect semantics)
# expect/sync write conflicts route conservatively after single retry
# implementation-ready reports terminal status without a fake next skill
# status --summary is supported and matches JSON status semantics
# repo identity mismatches recover conservatively with explicit diagnostics
# manifest state stores repo identity plus canonical reason diagnostics
# malformed spec/plan headers surface explicit malformed reasons
# cross-slug recovery respects the bounded 12-candidate lookup budget
# read-only resolve exposes side-effect-free parity for the public workflow CLI
# normalized repo-relative paths are canonicalized before manifest persistence

require_helper() {
  if [[ ! -x "$STATUS_BIN" ]]; then
    echo "Expected workflow helper to exist and be executable: $STATUS_BIN"
    exit 1
  fi
}

slug_identity_for_repo() {
  local repo_dir="$1"
  local helper_output
  local SLUG
  local BRANCH
  helper_output="$(cd "$repo_dir" && "$REPO_ROOT/bin/superpowers-slug")"
  eval "$helper_output"
  printf '%s\t%s\n' "$SLUG" "$BRANCH"
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

run_status_refresh() {
  local repo_dir="$1"
  local label="$2"
  local expected_skill="$3"
  local output
  local status=0
  output="$(cd "$repo_dir" && "$STATUS_BIN" status --refresh 2>&1)" || status=$?
  if [[ $status -ne 0 ]]; then
    echo "Expected status refresh to succeed for: $label"
    printf '%s\n' "$output"
    exit 1
  fi
  assert_json_nonempty "$output" "schema_version" "$label"
  assert_json_nonempty "$output" "status" "$label"
  assert_json_equals "$output" "next_skill" "$expected_skill" "$label"
  printf '%s\n' "$output"
}

run_status_refresh_with_env() {
  local repo_dir="$1"
  local label="$2"
  local expected_skill="$3"
  local output
  local status=0
  shift 3
  output="$(cd "$repo_dir" && env "$@" "$STATUS_BIN" status --refresh 2>&1)" || status=$?
  if [[ $status -ne 0 ]]; then
    echo "Expected status refresh to succeed for: $label"
    printf '%s\n' "$output"
    exit 1
  fi
  assert_json_nonempty "$output" "schema_version" "$label"
  assert_json_nonempty "$output" "status" "$label"
  assert_json_equals "$output" "next_skill" "$expected_skill" "$label"
  printf '%s\n' "$output"
}

create_status_bin_with_plan_contract_stub() {
  local contract_json="$1"
  local tool_dir

  tool_dir="$(mktemp -d "$STATE_DIR/status-bin.XXXXXX")"
  ln -s "$STATUS_BIN" "$tool_dir/superpowers-workflow-status"
  ln -s "$REPO_ROOT/bin/superpowers-runtime-common.sh" "$tool_dir/superpowers-runtime-common.sh"
  ln -s "$REPO_ROOT/bin/superpowers-plan-structure-common" "$tool_dir/superpowers-plan-structure-common"
  ln -s "$REPO_ROOT/bin/superpowers-slug" "$tool_dir/superpowers-slug"
  cat > "$tool_dir/superpowers-plan-contract" <<EOF
#!/usr/bin/env bash
set -euo pipefail
if [[ "\${1:-}" == "analyze-plan" ]]; then
  printf '%s\n' '$contract_json'
  exit 0
fi
printf '{"error_class":"UnexpectedStubCommand","message":"Unexpected stubbed plan-contract command."}\n' >&2
exit 1
EOF
  chmod +x "$tool_dir/superpowers-plan-contract"
  printf '%s\n' "$tool_dir"
}

run_command_fails() {
  local repo_dir="$1"
  local label="$2"
  local expected_output="$3"
  local output
  local status=0
  shift 3
  output="$(cd "$repo_dir" && "$STATUS_BIN" "$@" 2>&1)" || status=$?
  if [[ $status -eq 0 ]]; then
    echo "Expected command to fail for: $label"
    printf '%s\n' "$output"
    exit 1
  fi
  if [[ -n "$expected_output" && "$output" != *"$expected_output"* && "${output,,}" != *"${expected_output,,}"* ]]; then
    echo "Expected failure output for ${label} to mention '${expected_output}'"
    printf '%s\n' "$output"
    exit 1
  fi
}

run_command_succeeds() {
  local repo_dir="$1"
  local label="$2"
  local output
  local status=0
  shift 2
  output="$(cd "$repo_dir" && "$STATUS_BIN" "$@" 2>&1)" || status=$?
  if [[ $status -ne 0 ]]; then
    echo "Expected command to succeed for: $label"
    printf '%s\n' "$output"
    exit 1
  fi
  printf '%s\n' "$output"
}

run_command_succeeds_with_timeout() {
  local repo_dir="$1"
  local label="$2"
  local timeout_seconds="$3"
  local stdout_file
  local stderr_file
  local status=0
  local output=""
  local error_output=""
  local timing=""
  shift 3

  stdout_file="$(mktemp "${TMPDIR:-/tmp}/superpowers-workflow-status-stdout.XXXXXX")"
  stderr_file="$(mktemp "${TMPDIR:-/tmp}/superpowers-workflow-status-stderr.XXXXXX")"
  TIMEFORMAT='%R'
  timing="$({ time (cd "$repo_dir" && "$STATUS_BIN" "$@" >"$stdout_file" 2>"$stderr_file"); } 2>&1)" || status=$?
  timing="${timing##*$'\n'}"

  output="$(cat "$stdout_file")"
  error_output="$(cat "$stderr_file")"
  rm -f "$stdout_file" "$stderr_file"

  if awk -v actual="$timing" -v limit="$timeout_seconds" 'BEGIN { exit !((actual + 0) > (limit + 0)) }'; then
    echo "Expected command to stay under ${timeout_seconds}s for: $label"
    echo "Command timed out: $STATUS_BIN $*"
    echo "Elapsed: ${timing}s"
    [[ -n "$output" ]] && printf '%s\n' "$output"
    [[ -n "$error_output" ]] && printf '%s\n' "$error_output"
    exit 124
  fi

  if [[ $status -ne 0 ]]; then
    echo "Expected command to succeed for: $label"
    [[ -n "$output" ]] && printf '%s\n' "$output"
    [[ -n "$error_output" ]] && printf '%s\n' "$error_output"
    exit "$status"
  fi

  printf '%s\n' "$output"
}

run_resolve_succeeds() {
  local repo_dir="$1"
  local label="$2"
  local output
  local status=0
  shift 2
  output="$(cd "$repo_dir" && "$STATUS_BIN" resolve "$@" 2>&1)" || status=$?
  if [[ $status -ne 0 ]]; then
    echo "Expected read-only resolve to succeed for: $label"
    printf '%s\n' "$output"
    exit 1
  fi
  printf '%s\n' "$output"
}

run_resolve_fails_with_env() {
  local repo_dir="$1"
  local label="$2"
  local expected_output="$3"
  local output
  local status=0
  shift 3
  output="$(cd "$repo_dir" && env "$@" "$STATUS_BIN" resolve 2>&1)" || status=$?
  if [[ $status -eq 0 ]]; then
    echo "Expected read-only resolve to fail for: $label"
    printf '%s\n' "$output"
    exit 1
  fi
  if [[ -n "$expected_output" && "$output" != *"$expected_output"* && "${output,,}" != *"${expected_output,,}"* ]]; then
    echo "Expected read-only resolve failure for ${label} to mention '${expected_output}'"
    printf '%s\n' "$output"
    exit 1
  fi
}

assert_single_line() {
  local output="$1"
  local label="$2"
  if [[ "$output" == *$'\n'* ]]; then
    echo "Expected ${label} output to stay on one line"
    printf '%s\n' "$output"
    exit 1
  fi
}

init_repo() {
  local repo_dir="$1"
  local remote_url="${2:-}"

  mkdir -p "$repo_dir"
  git -C "$repo_dir" init >/dev/null 2>&1
  git -C "$repo_dir" config user.name "Superpowers Test"
  git -C "$repo_dir" config user.email "superpowers-tests@example.com"
  printf '# workflow status regression fixture\n' > "$repo_dir/README.md"
  git -C "$repo_dir" add README.md
  git -C "$repo_dir" commit -m "init" >/dev/null 2>&1
  if [[ -n "$remote_url" ]]; then
    git -C "$repo_dir" remote add origin "$remote_url"
  fi
}

manifest_path_for_branch() {
  local repo_dir="$1"
  local slug
  local branch

  IFS=$'\t' read -r slug branch < <(slug_identity_for_repo "$repo_dir")
  printf '%s\n' "$STATE_DIR/projects/$slug/${USER_NAME}-${branch}-workflow-state.json"
}

write_file() {
  local path="$1"
  mkdir -p "$(dirname "$path")"
  cat > "$path"
}

copy_fixture() {
  local src="$1"
  local dst="$2"
  mkdir -p "$(dirname "$dst")"
  cp "$src" "$dst"
}

run_bootstrap_no_docs() {
  local repo="$REPO_DIR/bootstrap-no-docs"
  init_repo "$repo"
  run_status_refresh "$repo" "bootstrap without docs" "superpowers:brainstorming"
}

run_draft_spec() {
  local repo="$REPO_DIR/draft-spec"
  local spec_path="$repo/docs/superpowers/specs/2026-03-17-draft-spec-design.md"
  init_repo "$repo"

  write_file "$spec_path" <<'EOF'
# Draft Spec

**Workflow State:** Draft
**Spec Revision:** 1
**Last Reviewed By:** brainstorming

## Notes
EOF
  run_status_refresh "$repo" "draft spec" "superpowers:plan-ceo-review"
}

run_approved_spec_no_plan() {
  local repo="$REPO_DIR/approved-spec-no-plan"
  init_repo "$repo"
  copy_fixture \
    "$WORKFLOW_FIXTURE_DIR/specs/2026-01-22-document-review-system-design.md" \
    "$repo/docs/superpowers/specs/2026-01-22-document-review-system-design.md"
  run_status_refresh "$repo" "approved spec with no plan" "superpowers:writing-plans"
}

run_draft_plan() {
  local repo="$REPO_DIR/draft-plan"
  local spec_path="$repo/docs/superpowers/specs/2026-01-22-document-review-system-design.md"
  local plan_path="$repo/docs/superpowers/plans/2026-01-22-document-review-system.md"

  init_repo "$repo"
  copy_fixture \
    "$WORKFLOW_FIXTURE_DIR/specs/2026-01-22-document-review-system-design.md" \
    "$spec_path"
  write_file "$plan_path" <<'EOF'
# Draft Plan

**Workflow State:** Draft
**Plan Revision:** 1
**Execution Mode:** none
**Source Spec:** `docs/superpowers/specs/2026-01-22-document-review-system-design.md`
**Source Spec Revision:** 1
**Last Reviewed By:** writing-plans

## Requirement Coverage Matrix

- REQ-001 -> Task 1

## Task 1: Prepare the draft plan for review

**Spec Coverage:** REQ-001
**Task Outcome:** The draft plan is ready for engineering review.
**Plan Constraints:**
- Keep the fixture minimal.
**Open Questions:** none

**Files:**
- Test: `bash tests/codex-runtime/test-superpowers-workflow-status.sh`

- [ ] **Step 1: Review the draft plan**
EOF
  run_status_refresh "$repo" "draft plan" "superpowers:plan-eng-review"
}

run_stale_approved_plan() {
  local repo="$REPO_DIR/stale-approved-plan"
  local spec_path="$repo/docs/superpowers/specs/2026-01-22-document-review-system-design-v2.md"
  local plan_path="$repo/docs/superpowers/plans/2026-01-22-document-review-system.md"
  init_repo "$repo"

  write_file "$spec_path" <<'EOF'
# Approved Spec, Newer Path

**Workflow State:** CEO Approved
**Spec Revision:** 1
**Last Reviewed By:** plan-ceo-review

## Notes
EOF
  write_file "$plan_path" <<'EOF'
# Approved Plan, Stale Source Path

**Workflow State:** Engineering Approved
**Plan Revision:** 1
**Execution Mode:** none
**Source Spec:** `docs/superpowers/specs/2026-01-22-document-review-system-design.md`
**Source Spec Revision:** 1
**Last Reviewed By:** plan-eng-review

## Requirement Coverage Matrix

- REQ-001 -> Task 1

## Task 1: Preserve the stale source path case

**Spec Coverage:** REQ-001
**Task Outcome:** The plan remains structurally valid while its source-spec path goes stale.
**Plan Constraints:**
- Keep the fixture minimal.
**Open Questions:** none

**Files:**
- Test: `bash tests/codex-runtime/test-superpowers-workflow-status.sh`

- [ ] **Step 1: Detect the stale source path**
EOF
  local output
  output="$(run_status_refresh "$repo" "stale approved plan" "superpowers:writing-plans")"
  assert_json_equals "$output" "status" "stale_plan" "stale approved plan status"
  assert_json_equals "$output" "contract_state" "stale" "stale approved plan contract state"
  assert_json_equals "$output" "reason_codes.0" "stale_spec_plan_linkage" "stale approved plan reason code"
  assert_json_equals "$output" "diagnostics.0.code" "stale_spec_plan_linkage" "stale approved plan diagnostic code"
}

run_packet_buildability_failure_surfaces_structured_contract() {
  local repo="$REPO_DIR/packet-buildability-structured"
  local spec_path="$repo/docs/superpowers/specs/2026-03-22-packet-buildability-structured-design.md"
  local plan_path="$repo/docs/superpowers/plans/2026-03-22-packet-buildability-structured.md"
  local tool_dir
  local output

  init_repo "$repo"
  copy_fixture \
    "$WORKFLOW_FIXTURE_DIR/specs/2026-03-22-runtime-integration-hardening-design.md" \
    "$spec_path"
  copy_fixture \
    "$WORKFLOW_FIXTURE_DIR/plans/2026-03-22-runtime-integration-hardening.md" \
    "$plan_path"
  node - "$plan_path" <<'NODE'
const fs = require("fs");
const file = process.argv[2];
const source = fs.readFileSync(file, "utf8");
fs.writeFileSync(
  file,
  source.replace(
    "tests/codex-runtime/fixtures/workflow-artifacts/specs/2026-03-22-runtime-integration-hardening-design.md",
    "docs/superpowers/specs/2026-03-22-packet-buildability-structured-design.md",
  ),
);
NODE
  tool_dir="$(create_status_bin_with_plan_contract_stub '{"contract_state":"valid","task_count":2,"packet_buildable_tasks":1,"reason_codes":[],"diagnostics":[]}')"

  output="$(cd "$repo" && "$tool_dir/superpowers-workflow-status" status --refresh 2>&1)"
  assert_json_equals "$output" "status" "plan_draft" "packet buildability structured status"
  assert_json_equals "$output" "next_skill" "superpowers:plan-eng-review" "packet buildability structured next skill"
  assert_json_equals "$output" "contract_state" "invalid" "packet buildability structured contract state"
  assert_json_equals "$output" "reason_codes.0" "packet_buildability_failure" "packet buildability structured reason code"
  assert_json_equals "$output" "diagnostics.0.code" "packet_buildability_failure" "packet buildability structured diagnostic code"
}

run_bounded_refresh() {
  local repo="$REPO_DIR/bounded-refresh"
  local old_spec="$repo/docs/superpowers/specs/2026-03-16-approved-design.md"
  local newest_spec="$repo/docs/superpowers/specs/2026-03-17-newest-draft-design.md"
  init_repo "$repo"

  write_file "$old_spec" <<'EOF'
# Older Approved Spec

**Workflow State:** CEO Approved
**Spec Revision:** 1
**Last Reviewed By:** plan-ceo-review
EOF
  sleep 1
  write_file "$newest_spec" <<'EOF'
# Newest Draft Spec

**Workflow State:** Draft
**Spec Revision:** 2
**Last Reviewed By:** brainstorming
EOF

  local output
  output="$(run_status_refresh_with_env \
    "$repo" \
    "bounded refresh" \
    "superpowers:plan-ceo-review" \
    "SUPERPOWERS_WORKFLOW_STATUS_FALLBACK_LIMIT=1")"
  assert_contains "$output" "2026-03-17-newest-draft-design.md" "bounded refresh candidate selection"
  assert_json_equals "$output" "scan_truncated" "true" "bounded refresh scan truncation"
  assert_json_nonempty "$output" "schema_version" "bounded refresh schema version"
  assert_json_equals "$output" "spec_candidate_count" "2" "bounded refresh candidate count"
}

run_expected_path_survives_refresh() {
  local repo="$REPO_DIR/expected-path-survives-refresh"
  local expected_spec_path="docs/superpowers/specs/2026-03-17-missing-spec-design.md"
  local output

  init_repo "$repo"
  run_command_succeeds "$repo" "set expected missing spec path" expect --artifact spec --path "$expected_spec_path" >/dev/null
  output="$(run_status_refresh "$repo" "missing expected spec survives refresh" "superpowers:brainstorming")"
  assert_contains "$output" "$expected_spec_path" "expected missing spec path survives refresh"
}

run_missing_manifest_path_falls_forward() {
  local repo="$REPO_DIR/missing-manifest-path-falls-forward"
  local expected_missing_spec_path="docs/superpowers/specs/2026-03-17-missing-spec-design.md"
  local actual_spec_path="docs/superpowers/specs/2026-03-17-actual-spec-design.md"
  local manifest_path
  local manifest_json
  local output

  init_repo "$repo"
  run_command_succeeds "$repo" "set expected missing spec path before discovery" \
    expect --artifact spec --path "$expected_missing_spec_path" >/dev/null
  write_file "$repo/$actual_spec_path" <<'EOF'
# Actual Spec After Missing Manifest Path

**Workflow State:** Draft
**Spec Revision:** 1
**Last Reviewed By:** brainstorming
EOF

  output="$(run_status_refresh "$repo" "missing manifest path falls forward" "superpowers:plan-ceo-review")"
  assert_contains "$output" "$actual_spec_path" "missing manifest path discovered spec output"

  manifest_path="$(manifest_path_for_branch "$repo")"
  manifest_json="$(cat "$manifest_path")"
  assert_contains "$manifest_json" "$actual_spec_path" "missing manifest path discovered spec manifest"
  assert_not_contains "$manifest_json" "$expected_missing_spec_path" "missing manifest path old manifest entry"
}

run_ambiguous_fallback_discovery() {
  local repo="$REPO_DIR/ambiguous-fallback"
  local spec_a="$repo/docs/superpowers/specs/2026-03-17-spec-a.md"
  local spec_b="$repo/docs/superpowers/specs/2026-03-17-spec-b.md"
  local output

  init_repo "$repo"
  write_file "$spec_a" <<'EOF'
# Ambiguous Spec A

**Workflow State:** Draft
**Spec Revision:** 1
**Last Reviewed By:** brainstorming
EOF
  write_file "$spec_b" <<'EOF'
# Ambiguous Spec B

**Workflow State:** CEO Approved
**Spec Revision:** 1
**Last Reviewed By:** plan-ceo-review
EOF

  output="$(run_status_refresh_with_env \
    "$repo" \
    "ambiguous fallback" \
    "superpowers:plan-ceo-review" \
    "SUPERPOWERS_WORKFLOW_STATUS_FALLBACK_LIMIT=5")"
  assert_contains "$output" "ambigu" "ambiguous fallback note"
  assert_json_equals "$output" "status" "spec_draft" "ambiguous fallback status"
  assert_json_equals "$output" "reason_codes.0" "ambiguous_spec_candidates" "ambiguous fallback reason code"
  assert_json_equals "$output" "diagnostics.0.code" "ambiguous_spec_candidates" "ambiguous fallback diagnostic code"
}

run_corrupted_manifest() {
  local repo="$REPO_DIR/corrupted-manifest"
  local manifest_path
  local manifest_dir
  local backups_before
  local backups_after

  init_repo "$repo"
  run_status_refresh "$repo" "manifest bootstrap" "superpowers:brainstorming"

  manifest_path="$(manifest_path_for_branch "$repo")"
  manifest_dir="$(dirname "$manifest_path")"
  backups_before="$(find "$manifest_dir" -maxdepth 1 -name '*.corrupt-*' | wc -l | tr -d ' ')"
  printf '%s\n' '{ "bad": "json"' > "$manifest_path"

  local output
  local status=0
  output="$(cd "$repo" && "$STATUS_BIN" status --refresh 2>&1)" || status=$?
  if [[ $status -ne 0 ]]; then
    echo "Expected corrupted manifest to be rescued"
    printf '%s\n' "$output"
    exit 1
  fi
  assert_contains "$output" "superpowers:brainstorming" "corrupted manifest route"
  if [[ "$output" != *"warning"* && "$output" != *"corrupt"* ]]; then
    echo "Expected corrupted manifest warning in output"
    printf '%s\n' "$output"
    exit 1
  fi

  if [[ ! -e "$manifest_path" ]]; then
    echo "Expected manifest file to be rebuilt after corruption"
    exit 1
  fi
  backups_after="$(find "$manifest_dir" -maxdepth 1 -name '*.corrupt-*' | wc -l | tr -d ' ')"
  if (( backups_after <= backups_before )); then
    echo "Expected a corrupted manifest backup file to be created"
    echo "Backup count before: $backups_before"
    echo "Backup count after:  $backups_after"
    exit 1
  fi
}

run_single_retry_conflict() {
  local repo="$REPO_DIR/single-retry-conflict"
  local manifest_path
  local manifest_dir
  local output
  local status=0
  local retry_count

  init_repo "$repo"
  run_status_refresh "$repo" "single retry bootstrap" "superpowers:brainstorming" >/dev/null

  manifest_path="$(manifest_path_for_branch "$repo")"
  manifest_dir="$(dirname "$manifest_path")"
  chmod u-w "$manifest_dir"
  output="$(cd "$repo" && "$STATUS_BIN" status --refresh 2>&1)" || status=$?
  chmod u+w "$manifest_dir"

  if [[ $status -ne 0 ]]; then
    echo "Expected write conflict fallback to keep status command successful"
    printf '%s\n' "$output"
    exit 1
  fi

  assert_contains "$output" "retrying once" "single retry warning"
  assert_contains "$output" "manifest_write_conflict" "single retry conservative note"
  assert_contains "$output" "superpowers:brainstorming" "single retry conservative route"

  retry_count="$(printf '%s\n' "$output" | grep -o "retrying once" | wc -l | tr -d ' ')"
  if (( retry_count != 1 )); then
    echo "Expected exactly one retry attempt"
    printf '%s\n' "$output"
    exit 1
  fi
}

run_expect_sync_retry_conflict() {
  local repo="$REPO_DIR/expect-sync-retry-conflict"
  local manifest_path
  local manifest_dir
  local spec_path_rel="docs/superpowers/specs/2026-03-17-sync-spec.md"
  local spec_path_abs="$repo/$spec_path_rel"
  local output_expect
  local output_sync
  local status=0

  init_repo "$repo"
  write_file "$spec_path_abs" <<'EOF'
# Sync Spec

**Workflow State:** Draft
**Spec Revision:** 1
**Last Reviewed By:** brainstorming
EOF

  run_status_refresh "$repo" "expect/sync conflict bootstrap" "superpowers:plan-ceo-review" >/dev/null
  manifest_path="$(manifest_path_for_branch "$repo")"
  manifest_dir="$(dirname "$manifest_path")"
  chmod u-w "$manifest_dir"

  output_expect="$(cd "$repo" && "$STATUS_BIN" expect --artifact spec --path "$spec_path_rel" 2>&1)" || status=$?
  if [[ $status -ne 0 ]]; then
    chmod u+w "$manifest_dir"
    echo "Expected expect write-conflict fallback to succeed"
    printf '%s\n' "$output_expect"
    exit 1
  fi
  assert_contains "$output_expect" "retrying once" "expect write-conflict retry warning"
  assert_contains "$output_expect" "manifest_write_conflict" "expect write-conflict conservative note"
  assert_contains "$output_expect" "superpowers:brainstorming" "expect write-conflict conservative route"

  status=0
  output_sync="$(cd "$repo" && "$STATUS_BIN" sync --artifact spec --path "$spec_path_rel" 2>&1)" || status=$?
  chmod u+w "$manifest_dir"
  if [[ $status -ne 0 ]]; then
    echo "Expected sync write-conflict fallback to succeed"
    printf '%s\n' "$output_sync"
    exit 1
  fi
  assert_contains "$output_sync" "retrying once" "sync write-conflict retry warning"
  assert_contains "$output_sync" "manifest_write_conflict" "sync write-conflict conservative note"
  assert_contains "$output_sync" "superpowers:brainstorming" "sync write-conflict conservative route"
}

run_sync_missing_artifact_behavior() {
  local repo="$REPO_DIR/sync-missing-artifact"
  local missing_path="docs/superpowers/specs/2026-03-17-sync-missing-spec.md"
  local output

  init_repo "$repo"
  output="$(run_command_succeeds "$repo" "sync missing artifact" sync --artifact spec --path "$missing_path")"
  assert_contains "$output" "missing_artifact" "sync missing artifact note"
  assert_contains "$output" "superpowers:brainstorming" "sync missing artifact conservative route"
}

run_sync_preserves_manifest_missing_expectation() {
  local repo="$REPO_DIR/sync-preserves-manifest-missing"
  local missing_path="docs/superpowers/specs/2026-03-17-manifest-backed-missing-spec.md"
  local manifest_path
  local manifest_json
  local output

  init_repo "$repo"
  run_command_succeeds "$repo" "expect missing path for manifest-backed sync" \
    expect --artifact spec --path "$missing_path" >/dev/null

  output="$(run_command_succeeds "$repo" "sync uses manifest-backed missing path" sync --artifact spec)"
  assert_contains "$output" "missing_artifact" "manifest-backed sync missing artifact note"
  assert_contains "$output" "superpowers:brainstorming" "manifest-backed sync conservative route"
  assert_contains "$output" "$missing_path" "manifest-backed sync output preserves missing path"

  manifest_path="$(manifest_path_for_branch "$repo")"
  manifest_json="$(cat "$manifest_path")"
  assert_contains "$manifest_json" "$missing_path" "manifest-backed sync manifest preserves missing path"
}

run_expect_normalizes_repo_relative_paths() {
  local repo="$REPO_DIR/normalized-repo-relative-paths"
  local raw_spec_path="./docs//superpowers/specs/./2026-03-17-normalized-spec.md"
  local canonical_spec_path="docs/superpowers/specs/2026-03-17-normalized-spec.md"
  local output
  local manifest_path
  local manifest_json

  init_repo "$repo"
  output="$(run_command_succeeds "$repo" "expect normalized repo-relative paths" expect --artifact spec --path "$raw_spec_path")"
  assert_contains "$output" "\"spec_path\":\"$canonical_spec_path\"" "normalized repo-relative paths output"

  manifest_path="$(manifest_path_for_branch "$repo")"
  manifest_json="$(cat "$manifest_path")"
  assert_contains "$manifest_json" "\"expected_spec_path\":\"$canonical_spec_path\"" "normalized repo-relative paths manifest"
  assert_not_contains "$manifest_json" "$raw_spec_path" "normalized repo-relative paths raw manifest value"
}

run_sync_missing_plan_preserves_stage() {
  local repo_no_spec="$REPO_DIR/sync-missing-plan-no-spec"
  local repo_draft_spec="$REPO_DIR/sync-missing-plan-draft-spec"
  local repo_approved_spec="$REPO_DIR/sync-missing-plan-approved-spec"
  local missing_plan_path="docs/superpowers/plans/2026-03-17-missing-sync-plan.md"
  local output

  init_repo "$repo_no_spec"
  output="$(run_command_succeeds "$repo_no_spec" "sync missing plan without spec" sync --artifact plan --path "$missing_plan_path")"
  assert_contains "$output" "missing_artifact" "sync missing plan without spec note"
  assert_contains "$output" "superpowers:brainstorming" "sync missing plan without spec route"

  init_repo "$repo_draft_spec"
  write_file "$repo_draft_spec/docs/superpowers/specs/2026-03-17-sync-draft-spec.md" <<'EOF'
# Draft Spec For Missing Plan Sync

**Workflow State:** Draft
**Spec Revision:** 1
**Last Reviewed By:** brainstorming
EOF
  output="$(run_command_succeeds "$repo_draft_spec" "sync missing plan with draft spec" sync --artifact plan --path "$missing_plan_path")"
  assert_contains "$output" "missing_artifact" "sync missing plan with draft spec note"
  assert_contains "$output" "superpowers:plan-ceo-review" "sync missing plan with draft spec route"

  init_repo "$repo_approved_spec"
  write_file "$repo_approved_spec/docs/superpowers/specs/2026-03-17-sync-approved-spec.md" <<'EOF'
# Approved Spec For Missing Plan Sync

**Workflow State:** CEO Approved
**Spec Revision:** 1
**Last Reviewed By:** plan-ceo-review
EOF
  output="$(run_command_succeeds "$repo_approved_spec" "sync missing plan with approved spec" sync --artifact plan --path "$missing_plan_path")"
  assert_contains "$output" "missing_artifact" "sync missing plan with approved spec note"
  assert_contains "$output" "superpowers:writing-plans" "sync missing plan with approved spec route"
}

run_status_summary_matches_json() {
  local repo="$REPO_DIR/status-summary"
  local spec_path="$repo/docs/superpowers/specs/2026-03-17-summary-design.md"
  local plan_path="$repo/docs/superpowers/plans/2026-03-17-summary.md"
  local json_output
  local summary_output

  init_repo "$repo"
  write_file "$spec_path" <<'EOF'
# Summary Spec

**Workflow State:** CEO Approved
**Spec Revision:** 2
**Last Reviewed By:** plan-ceo-review

## Requirement Index

- [REQ-001][behavior] Summary fixtures preserve implementation-ready routing when the approved plan stays contract-valid.
- [VERIFY-001][verification] Route-time summary output stays aligned with JSON output for valid approved artifacts.
EOF
  write_file "$plan_path" <<'EOF'
# Summary Plan

**Workflow State:** Engineering Approved
**Plan Revision:** 1
**Execution Mode:** none
**Source Spec:** `docs/superpowers/specs/2026-03-17-summary-design.md`
**Source Spec Revision:** 2
**Last Reviewed By:** plan-eng-review

## Requirement Coverage Matrix

- REQ-001 -> Task 1
- VERIFY-001 -> Task 1

## Task 1: Preserve summary parity

**Spec Coverage:** REQ-001, VERIFY-001
**Task Outcome:** Summary output continues to match JSON status semantics for a valid approved plan.
**Plan Constraints:**
- Keep the fixture minimal.
**Open Questions:** none

**Files:**
- Test: `bash tests/codex-runtime/test-superpowers-workflow-status.sh`

- [ ] **Step 1: Emit matching summary and JSON output**
EOF

  json_output="$(run_command_succeeds "$repo" "status summary JSON parity" status --refresh)"
  summary_output="$(run_command_succeeds "$repo" "status summary output" status --refresh --summary)"

  assert_contains "$json_output" '"status":"implementation_ready"' "status summary JSON output"
  assert_contains "$json_output" '"next_skill":""' "status summary JSON next skill"
  assert_contains "$json_output" '"reason":"implementation_ready"' "status summary JSON reason"

  assert_single_line "$summary_output" "status summary"
  assert_not_contains "$summary_output" '{"status"' "status summary"
  assert_contains "$summary_output" "status=implementation_ready" "status summary status"
  assert_contains "$summary_output" "next=execution_preflight" "status summary handoff"
  assert_contains "$summary_output" "spec=docs/superpowers/specs/2026-03-17-summary-design.md" "status summary spec path"
  assert_contains "$summary_output" "plan=docs/superpowers/plans/2026-03-17-summary.md" "status summary plan path"
  assert_contains "$summary_output" "reason=implementation_ready" "status summary reason"
}

run_malformed_spec_headers() {
  local repo="$REPO_DIR/malformed-spec"
  local spec_path="$repo/docs/superpowers/specs/2026-03-17-malformed-spec.md"
  local output

  init_repo "$repo"
  write_file "$spec_path" <<'EOF'
# Malformed Spec

**Workflow State:** CEO Approved
**Last Reviewed By:** plan-ceo-review
EOF

  output="$(run_command_succeeds "$repo" "malformed spec headers" status --refresh)"
  assert_contains "$output" '"status":"spec_draft"' "malformed spec status"
  assert_contains "$output" '"next_skill":"superpowers:plan-ceo-review"' "malformed spec next skill"
  assert_contains "$output" 'malformed_spec_headers' "malformed spec reason"
}

run_malformed_plan_headers() {
  local repo="$REPO_DIR/malformed-plan"
  local spec_path="$repo/docs/superpowers/specs/2026-03-17-malformed-plan-design.md"
  local plan_path="$repo/docs/superpowers/plans/2026-03-17-malformed-plan.md"
  local output

  init_repo "$repo"
  write_file "$spec_path" <<'EOF'
# Approved Spec For Malformed Plan

**Workflow State:** CEO Approved
**Spec Revision:** 1
**Last Reviewed By:** plan-ceo-review
EOF
  write_file "$plan_path" <<'EOF'
# Malformed Plan

**Workflow State:** Engineering Approved
**Source Spec:** `docs/superpowers/specs/2026-03-17-malformed-plan-design.md`
**Last Reviewed By:** plan-eng-review
EOF

  output="$(run_command_succeeds "$repo" "malformed plan headers" status --refresh)"
  assert_contains "$output" '"status":"plan_draft"' "malformed plan status"
  assert_contains "$output" '"next_skill":"superpowers:plan-eng-review"' "malformed plan next skill"
  assert_contains "$output" 'malformed_plan_headers' "malformed plan reason"
}

run_missing_plan_revision_routes_plan_draft() {
  local repo="$REPO_DIR/missing-plan-revision"
  local spec_path="$repo/docs/superpowers/specs/2026-03-22-missing-plan-revision-design.md"
  local plan_path="$repo/docs/superpowers/plans/2026-03-22-missing-plan-revision.md"
  local output

  init_repo "$repo"
  copy_fixture \
    "$WORKFLOW_FIXTURE_DIR/specs/2026-03-22-runtime-integration-hardening-design.md" \
    "$spec_path"
  write_file "$plan_path" <<'EOF'
# Missing Plan Revision

**Workflow State:** Engineering Approved
**Execution Mode:** none
**Source Spec:** `docs/superpowers/specs/2026-03-22-missing-plan-revision-design.md`
**Source Spec Revision:** 1
**Last Reviewed By:** plan-eng-review

## Requirement Coverage Matrix

- REQ-001 -> Task 1
- REQ-004 -> Task 1
- VERIFY-001 -> Task 1

## Task 1: Preserve route-time hardening

**Spec Coverage:** REQ-001, REQ-004, VERIFY-001
**Task Outcome:** The plan keeps the approved-plan contract parseable for route-time helpers.
**Plan Constraints:**
- Keep the fixture small.
**Open Questions:** none

**Files:**
- Test: `bash tests/codex-runtime/test-superpowers-workflow-status.sh`

- [ ] **Step 1: Validate the route-time contract**
EOF

  output="$(run_command_succeeds "$repo" "missing plan revision routes plan draft" status --refresh)"
  assert_json_equals "$output" "status" "plan_draft" "missing plan revision status"
  assert_json_equals "$output" "next_skill" "superpowers:plan-eng-review" "missing plan revision next skill"
  assert_json_equals "$output" "contract_state" "invalid" "missing plan revision contract state"
  assert_json_equals "$output" "reason_codes.0" "missing_plan_revision" "missing plan revision reason codes"
  assert_json_equals "$output" "diagnostics.0.code" "missing_plan_revision" "missing plan revision diagnostics"
  assert_contains "$output" '"reason":"malformed_plan_headers"' "missing plan revision compatibility reason"
}

run_invalid_execution_mode_routes_plan_draft() {
  local repo="$REPO_DIR/invalid-execution-mode"
  local spec_path="$repo/docs/superpowers/specs/2026-03-22-invalid-execution-mode-design.md"
  local plan_path="$repo/docs/superpowers/plans/2026-03-22-invalid-execution-mode.md"
  local output

  init_repo "$repo"
  copy_fixture \
    "$WORKFLOW_FIXTURE_DIR/specs/2026-03-22-runtime-integration-hardening-design.md" \
    "$spec_path"
  write_file "$plan_path" <<'EOF'
# Invalid Execution Mode

**Workflow State:** Engineering Approved
**Plan Revision:** 1
**Execution Mode:** superpowers:teleport
**Source Spec:** `docs/superpowers/specs/2026-03-22-invalid-execution-mode-design.md`
**Source Spec Revision:** 1
**Last Reviewed By:** plan-eng-review

## Requirement Coverage Matrix

- REQ-001 -> Task 1
- REQ-004 -> Task 1
- VERIFY-001 -> Task 1

## Task 1: Reject invalid execution mode

**Spec Coverage:** REQ-001, REQ-004, VERIFY-001
**Task Outcome:** Route-time helpers reject plans with invalid execution-mode values.
**Plan Constraints:**
- Keep the fixture small.
**Open Questions:** none

**Files:**
- Test: `bash tests/codex-runtime/test-superpowers-workflow-status.sh`

- [ ] **Step 1: Reject the invalid execution mode**
EOF

  output="$(run_command_succeeds "$repo" "invalid execution mode routes plan draft" status --refresh)"
  assert_json_equals "$output" "status" "plan_draft" "invalid execution mode status"
  assert_json_equals "$output" "next_skill" "superpowers:plan-eng-review" "invalid execution mode next skill"
  assert_json_equals "$output" "contract_state" "invalid" "invalid execution mode contract state"
  assert_json_equals "$output" "reason_codes.0" "invalid_execution_mode" "invalid execution mode reason codes"
  assert_json_equals "$output" "diagnostics.0.code" "invalid_execution_mode" "invalid execution mode diagnostics"
}

run_malformed_task_contract_routes_plan_draft() {
  local repo="$REPO_DIR/malformed-task-contract"
  local spec_path="$repo/docs/superpowers/specs/2026-03-22-malformed-task-contract-design.md"
  local plan_path="$repo/docs/superpowers/plans/2026-03-22-malformed-task-contract.md"
  local output

  init_repo "$repo"
  copy_fixture \
    "$WORKFLOW_FIXTURE_DIR/specs/2026-03-22-runtime-integration-hardening-design.md" \
    "$spec_path"
  write_file "$plan_path" <<'EOF'
# Malformed Task Contract

**Workflow State:** Engineering Approved
**Plan Revision:** 1
**Execution Mode:** none
**Source Spec:** `docs/superpowers/specs/2026-03-22-malformed-task-contract-design.md`
**Source Spec Revision:** 1
**Last Reviewed By:** plan-eng-review

This deliberately omits the Requirement Coverage Matrix and canonical task structure.
EOF

  output="$(run_command_succeeds "$repo" "malformed task contract routes plan draft" status --refresh)"
  assert_json_equals "$output" "status" "plan_draft" "malformed task contract status"
  assert_json_equals "$output" "next_skill" "superpowers:plan-eng-review" "malformed task contract next skill"
  assert_json_equals "$output" "contract_state" "invalid" "malformed task contract contract state"
  assert_json_equals "$output" "reason_codes.0" "missing_requirement_coverage" "malformed task contract reason codes"
  assert_json_equals "$output" "diagnostics.0.code" "missing_requirement_coverage" "malformed task contract diagnostics"
}

run_malformed_task_structure_routes_plan_draft() {
  local repo="$REPO_DIR/malformed-task-structure-contract"
  local spec_path="$repo/docs/superpowers/specs/2026-03-22-malformed-task-structure-design.md"
  local plan_path="$repo/docs/superpowers/plans/2026-03-22-malformed-task-structure.md"
  local output

  init_repo "$repo"
  copy_fixture \
    "$WORKFLOW_FIXTURE_DIR/specs/2026-03-22-runtime-integration-hardening-design.md" \
    "$spec_path"
  write_file "$plan_path" <<'EOF'
# Malformed Task Structure

**Workflow State:** Engineering Approved
**Plan Revision:** 1
**Execution Mode:** none
**Source Spec:** `docs/superpowers/specs/2026-03-22-malformed-task-structure-design.md`
**Source Spec Revision:** 1
**Last Reviewed By:** plan-eng-review

## Requirement Coverage Matrix

- REQ-001 -> Task 1

### Task 1: Broken task

This deliberately omits the canonical task contract fields and step checklist.
EOF

  output="$(run_command_succeeds "$repo" "malformed task structure routes plan draft" status --refresh)"
  assert_json_equals "$output" "status" "plan_draft" "malformed task structure status"
  assert_json_equals "$output" "next_skill" "superpowers:plan-eng-review" "malformed task structure next skill"
  assert_json_equals "$output" "contract_state" "invalid" "malformed task structure contract state"
  assert_json_equals "$output" "reason_codes.0" "malformed_task_structure" "malformed task structure reason codes"
  assert_json_equals "$output" "diagnostics.0.code" "malformed_task_structure" "malformed task structure diagnostics"
}

run_contract_analysis_surfaces_multiple_diagnostics() {
  local repo="$REPO_DIR/multi-diagnostic-contract"
  local spec_path="$repo/docs/superpowers/specs/2026-03-22-multi-diagnostic-contract-design.md"
  local plan_path="$repo/docs/superpowers/plans/2026-03-22-multi-diagnostic-contract.md"
  local output

  init_repo "$repo"
  copy_fixture \
    "$WORKFLOW_FIXTURE_DIR/specs/2026-03-22-runtime-integration-hardening-design.md" \
    "$spec_path"
  write_file "$plan_path" <<'EOF'
# Multi-Diagnostic Contract

**Workflow State:** Engineering Approved
**Plan Revision:** 1
**Execution Mode:** none
**Source Spec:** `docs/superpowers/specs/2026-03-22-multi-diagnostic-contract-design.md`
**Source Spec Revision:** 1
**Last Reviewed By:** plan-eng-review

## Task 1: Preserve rich contract diagnostics

**Spec Coverage:** REQ-001, REQ-004, VERIFY-001
**Task Outcome:** Route-time status preserves the authoritative multi-diagnostic contract output.
**Plan Constraints:**
- Keep the fixture small.
**Open Questions:** still deciding whether to bundle this follow-up

**Files:**
- Test: `bash tests/codex-runtime/test-superpowers-workflow-status.sh`

- [ ] **Step 1: Surface all contract diagnostics**
EOF

  output="$(run_command_succeeds "$repo" "multi-diagnostic contract routes plan draft" status --refresh)"
  assert_json_equals "$output" "status" "plan_draft" "multi-diagnostic contract status"
  assert_json_equals "$output" "next_skill" "superpowers:plan-eng-review" "multi-diagnostic contract next skill"
  assert_json_equals "$output" "contract_state" "invalid" "multi-diagnostic contract contract state"
  assert_json_equals "$output" "reason_codes.0" "missing_requirement_coverage" "multi-diagnostic contract first reason"
  assert_json_equals "$output" "reason_codes.1" "task_open_questions_not_resolved" "multi-diagnostic contract second reason"
  assert_json_equals "$output" "diagnostics.0.code" "missing_requirement_coverage" "multi-diagnostic contract first diagnostic"
  assert_json_equals "$output" "diagnostics.1.code" "task_open_questions_not_resolved" "multi-diagnostic contract second diagnostic"
}

run_ambiguous_plan_surfaces_candidate_counts() {
  local repo="$REPO_DIR/ambiguous-plan-structured"
  local spec_path="$repo/docs/superpowers/specs/2026-03-22-ambiguous-plan-structured-design.md"
  local plan_a="$repo/docs/superpowers/plans/2026-03-22-ambiguous-plan-a.md"
  local plan_b="$repo/docs/superpowers/plans/2026-03-22-ambiguous-plan-b.md"
  local output

  init_repo "$repo"
  copy_fixture \
    "$WORKFLOW_FIXTURE_DIR/specs/2026-03-22-runtime-integration-hardening-design.md" \
    "$spec_path"
  copy_fixture \
    "$WORKFLOW_FIXTURE_DIR/plans/2026-03-22-runtime-integration-hardening.md" \
    "$plan_a"
  copy_fixture \
    "$WORKFLOW_FIXTURE_DIR/plans/2026-03-22-runtime-integration-hardening.md" \
    "$plan_b"
  node - "$plan_a" "$plan_b" <<'NODE'
const fs = require("fs");
for (const file of process.argv.slice(2)) {
  const source = fs.readFileSync(file, "utf8");
  fs.writeFileSync(
    file,
    source.replace(
      "tests/codex-runtime/fixtures/workflow-artifacts/specs/2026-03-22-runtime-integration-hardening-design.md",
      "docs/superpowers/specs/2026-03-22-ambiguous-plan-structured-design.md",
    ),
  );
}
NODE

  output="$(run_status_refresh_with_env \
    "$repo" \
    "ambiguous plan exposes candidate counts" \
    "superpowers:writing-plans" \
    "SUPERPOWERS_WORKFLOW_STATUS_FALLBACK_LIMIT=5")"
  assert_json_equals "$output" "status" "spec_approved_needs_plan" "ambiguous plan status"
  assert_json_equals "$output" "plan_candidate_count" "2" "ambiguous plan candidate count"
  assert_json_nonempty "$output" "schema_version" "ambiguous plan schema version"
  assert_json_equals "$output" "reason_codes.0" "ambiguous_plan_candidates" "ambiguous plan reason codes"
}

run_repo_root_mismatch_recovery() {
  local repo_old="$REPO_DIR/repo-root-mismatch-old"
  local repo_new="$REPO_DIR/repo-root-mismatch-new"
  local spec_rel="docs/superpowers/specs/2026-03-17-root-mismatch-spec.md"
  local manifest_path
  local manifest_json
  local output
  local actual_repo_root

  init_repo "$repo_old" "https://example.com/example/workflow-status-root-mismatch.git"
  write_file "$repo_old/$spec_rel" <<'EOF'
# Root Mismatch Draft Spec

**Workflow State:** Draft
**Spec Revision:** 1
**Last Reviewed By:** brainstorming
EOF
  run_command_succeeds "$repo_old" "repo root mismatch bootstrap" status --refresh >/dev/null
  manifest_path="$(manifest_path_for_branch "$repo_old")"

  mv "$repo_old" "$repo_new"
  output="$(run_command_succeeds "$repo_new" "repo root mismatch recovery" status --refresh)"
  assert_contains "$output" '"status":"spec_draft"' "repo root mismatch status"
  assert_contains "$output" 'repo_root_mismatch' "repo root mismatch reason"

  actual_repo_root="$(git -C "$repo_new" rev-parse --show-toplevel)"
  manifest_json="$(cat "$manifest_path")"
  assert_contains "$manifest_json" "\"repo_root\":\"$actual_repo_root\"" "repo root mismatch manifest repo_root update"
}

run_cross_slug_recovery() {
  local repo="$REPO_DIR/cross-slug-recovery"
  local approved_spec="docs/superpowers/specs/2026-03-17-cross-slug-design.md"
  local expected_plan="docs/superpowers/plans/2026-03-17-cross-slug-plan.md"
  local old_manifest
  local new_manifest
  local manifest_json
  local output

  init_repo "$repo" "https://example.com/example/workflow-status-old-slug.git"
  write_file "$repo/$approved_spec" <<'EOF'
# Cross Slug Approved Spec

**Workflow State:** CEO Approved
**Spec Revision:** 1
**Last Reviewed By:** plan-ceo-review
EOF

  run_command_succeeds "$repo" "cross slug expect missing plan" expect --artifact plan --path "$expected_plan" >/dev/null
  old_manifest="$(manifest_path_for_branch "$repo")"

  git -C "$repo" remote set-url origin "https://example.com/example/workflow-status-new-slug.git"
  output="$(run_command_succeeds "$repo" "cross slug recovery" status --refresh)"
  new_manifest="$(manifest_path_for_branch "$repo")"

  assert_contains "$output" '"status":"spec_approved_needs_plan"' "cross slug recovery status"
  assert_contains "$output" 'repo_slug_recovered' "cross slug recovery reason"
  assert_contains "$output" "$expected_plan" "cross slug recovery expected plan path"

  if [[ "$old_manifest" == "$new_manifest" ]]; then
    echo "Expected remote slug change to produce a new manifest path"
    echo "old: $old_manifest"
    echo "new: $new_manifest"
    exit 1
  fi
  if [[ ! -f "$new_manifest" ]]; then
    echo "Expected recovered manifest to be written at the new slug path"
    exit 1
  fi
  manifest_json="$(cat "$new_manifest")"
  assert_contains "$manifest_json" "$expected_plan" "cross slug recovery manifest preserves expected plan"
}

run_cross_slug_recovery_budget_limit() {
  local repo="$REPO_DIR/cross-slug-budget-limit"
  local approved_spec="docs/superpowers/specs/2026-03-17-budget-limit-design.md"
  local expected_plan="docs/superpowers/plans/2026-03-17-budget-limit-plan.md"
  local repo_root
  local filename
  local output
  local manifest_path
  local manifest_json
  local i
  local slug
  local branch

  init_repo "$repo" "https://example.com/example/current-budget-slug.git"
  write_file "$repo/$approved_spec" <<'EOF'
# Approved Spec For Budget-Limited Recovery

**Workflow State:** CEO Approved
**Spec Revision:** 1
**Last Reviewed By:** plan-ceo-review
EOF

  repo_root="$(git -C "$repo" rev-parse --show-toplevel)"
  IFS=$'\t' read -r slug branch < <(slug_identity_for_repo "$repo")
  filename="${USER_NAME}-${branch}-workflow-state.json"

  for i in 01 02 03 04 05 06 07 08 09 10 11 12; do
    write_file "$STATE_DIR/projects/decoy-$i/$filename" <<EOF
{"version":1,"repo_root":"/tmp/not-the-current-repo-$i","branch":"$branch","expected_spec_path":"","expected_plan_path":"","status":"needs_brainstorming","next_skill":"superpowers:brainstorming","reason":"decoy","note":"decoy","updated_at":"2026-03-17T00:00:00Z"}
EOF
  done

  write_file "$STATE_DIR/projects/zzz-old-slug/$filename" <<EOF
{"version":1,"repo_root":"$repo_root","branch":"$branch","expected_spec_path":"$approved_spec","expected_plan_path":"$expected_plan","status":"spec_approved_needs_plan","next_skill":"superpowers:writing-plans","reason":"repo_slug_recovered","note":"repo_slug_recovered","updated_at":"2026-03-17T00:00:00Z"}
EOF

  output="$(run_command_succeeds "$repo" "cross slug recovery budget limit" status --refresh)"
  assert_contains "$output" '"status":"spec_approved_needs_plan"' "cross slug budget status"
  assert_not_contains "$output" "$expected_plan" "cross slug budget should not inspect 13th candidate"

  manifest_path="$(manifest_path_for_branch "$repo")"
  manifest_json="$(cat "$manifest_path")"
  assert_not_contains "$manifest_json" "$expected_plan" "cross slug budget manifest should not recover beyond limit"
}

run_runtime_bin_helper_overrides_repo_local_helper() {
  local repo="$REPO_DIR/runtime-bin-helper-overrides"
  local spec_path="$repo/docs/superpowers/specs/2026-03-17-runtime-bin-helper-design.md"
  local manifest_path
  local output
  local expected_manifest_path
  local bogus_manifest_path="$STATE_DIR/projects/repo-local-helper-bogus/${USER_NAME}-bogus-branch-workflow-state.json"
  local slug_dir="$repo/bin"

  init_repo "$repo" "https://example.com/example/runtime-bin-helper.git"
  write_file "$spec_path" <<'EOF'
# Runtime Bin Helper Spec

**Workflow State:** Draft
**Spec Revision:** 1
**Last Reviewed By:** brainstorming
EOF

  mkdir -p "$slug_dir"
  cat > "$slug_dir/superpowers-slug" <<'EOF'
#!/usr/bin/env bash
printf 'SLUG=%q\nBRANCH=%q\n' "repo-local-helper-bogus" "bogus-branch"
EOF
  chmod +x "$slug_dir/superpowers-slug"

  expected_manifest_path="$(manifest_path_for_branch "$repo")"
  output="$(run_status_refresh "$repo" "runtime bin helper overrides repo-local helper" "superpowers:plan-ceo-review")"

  assert_contains "$output" "$expected_manifest_path" "runtime-bin helper manifest path"
  assert_not_contains "$output" "repo-local-helper-bogus" "runtime-bin helper should ignore repo-local slug helper"

  manifest_path="$(manifest_path_for_branch "$repo")"
  if [[ ! -f "$manifest_path" ]]; then
    echo "Expected manifest at runtime helper-derived path"
    exit 1
  fi
  if [[ -e "$bogus_manifest_path" ]]; then
    echo "Expected repo-local bogus helper path to remain unused"
    echo "$bogus_manifest_path"
    exit 1
  fi
}

run_out_of_repo_expect() {
  local repo="$REPO_DIR/out-of-repo-path"
  local outside_path="$REPO_DIR/../../outside.md"
  printf 'outside path\n' > "$outside_path"

  init_repo "$repo"
  run_command_fails "$repo" "out-of-repo artifact" "Invalid" expect --artifact spec --path "$outside_path"
  run_command_fails "$repo" "out-of-repo sync artifact" "Invalid" sync --artifact plan --path "$outside_path"
}

run_branch_isolated_manifests() {
  local base_repo="$REPO_DIR/branch-isolation/base"
  local worktree_root="$REPO_DIR/branch-isolation/worktrees"
  local branch_a="$worktree_root/branch-a"
  local branch_b="$worktree_root/branch-b"
  local manifest_a
  local manifest_b

  mkdir -p "$worktree_root"
  init_repo "$base_repo" "https://example.com/example/workflow-status-repo.git"
  git -C "$base_repo" worktree add "$branch_a" -b user-branch-a >/dev/null 2>&1
  git -C "$base_repo" worktree add "$branch_b" -b user-branch-b >/dev/null 2>&1

  manifest_a="$(manifest_path_for_branch "$branch_a")"
  manifest_b="$(manifest_path_for_branch "$branch_b")"

  run_status_refresh "$branch_a" "branch-a independent manifest" "superpowers:brainstorming"
  run_status_refresh "$branch_b" "branch-b independent manifest" "superpowers:brainstorming"

  if [[ ! -f "$manifest_a" ]]; then
    echo "Expected branch A manifest to be written"
    exit 1
  fi
  if [[ ! -f "$manifest_b" ]]; then
    echo "Expected branch B manifest to be written"
    exit 1
  fi
  if [[ "$manifest_a" == "$manifest_b" ]]; then
    echo "Expected separate manifest paths for different branches"
    echo "branch-a: $manifest_a"
    echo "branch-b: $manifest_b"
    exit 1
  fi
}

run_read_only_resolve_parity() {
  local repo="$REPO_DIR/read-only-resolve-parity"
  local spec_path="$repo/docs/superpowers/specs/2026-03-18-resolve-parity.md"
  local resolve_output

  init_repo "$repo"
  write_file "$spec_path" <<'EOF'
# Resolve Parity Spec

**Workflow State:** Draft
**Spec Revision:** 1
**Last Reviewed By:** brainstorming
EOF

  resolve_output="$(run_resolve_succeeds "$repo" "read-only resolve parity")"
  assert_contains "$resolve_output" '"status":"spec_draft"' "read-only resolve status"
  assert_contains "$resolve_output" '"next_skill":"superpowers:plan-ceo-review"' "read-only resolve next skill"
  assert_contains "$resolve_output" '2026-03-18-resolve-parity.md' "read-only resolve spec path"
}

run_read_only_resolve_outside_repo() {
  local outside_repo="$REPO_DIR/read-only-resolve-outside"
  mkdir -p "$outside_repo"

  run_command_fails "$outside_repo" "read-only resolve outside repo" "RepoContextUnavailable" resolve
}

run_read_only_resolve_invalid_command_input() {
  local repo="$REPO_DIR/read-only-resolve-invalid-input"
  init_repo "$repo"

  run_command_fails "$repo" "read-only resolve invalid input" "InvalidCommandInput" resolve --bogus
}

run_read_only_resolve_contract_violation() {
  local repo="$REPO_DIR/read-only-resolve-contract"
  init_repo "$repo"

  run_resolve_fails_with_env "$repo" "read-only resolve contract violation" "ResolverContractViolation" \
    SUPERPOWERS_WORKFLOW_RESOLVE_TEST_FAILPOINT=invalid_contract
}

run_read_only_resolve_runtime_failure() {
  local repo="$REPO_DIR/read-only-resolve-runtime-failure"
  init_repo "$repo"

  run_resolve_fails_with_env "$repo" "read-only resolve runtime failure" "ResolverRuntimeFailure" \
    SUPERPOWERS_WORKFLOW_RESOLVE_TEST_FAILPOINT=runtime_failure
}

run_read_only_resolve_avoids_manifest_mutation() {
  local repo="$REPO_DIR/read-only-resolve-no-mutation"
  local spec_path="$repo/docs/superpowers/specs/2026-03-18-resolve-no-mutation.md"
  local manifest_path
  local before_snapshot="$REPO_DIR/resolve-manifest-before.json"

  init_repo "$repo"
  write_file "$spec_path" <<'EOF'
# Resolve No Mutation Spec

**Workflow State:** Draft
**Spec Revision:** 1
**Last Reviewed By:** brainstorming
EOF

  run_status_refresh "$repo" "resolve manifest bootstrap" "superpowers:plan-ceo-review" >/dev/null
  manifest_path="$(manifest_path_for_branch "$repo")"
  cp "$manifest_path" "$before_snapshot"

  run_resolve_succeeds "$repo" "read-only resolve no mutation" >/dev/null
  if ! cmp -s "$before_snapshot" "$manifest_path"; then
    echo "Expected read-only resolve to leave the manifest byte-identical"
    exit 1
  fi
}

run_read_only_resolve_preserves_missing_expected_paths() {
  local repo_spec="$REPO_DIR/read-only-resolve-missing-expected-spec"
  local repo_plan="$REPO_DIR/read-only-resolve-missing-expected-plan"
  local missing_spec="docs/superpowers/specs/2026-03-18-missing-expected-spec.md"
  local missing_plan="docs/superpowers/plans/2026-03-18-missing-expected-plan.md"
  local resolve_output

  init_repo "$repo_spec"
  run_command_succeeds "$repo_spec" "set expected missing spec for read-only resolve" \
    expect --artifact spec --path "$missing_spec" >/dev/null
  resolve_output="$(run_resolve_succeeds "$repo_spec" "read-only resolve preserves missing expected spec")"
  assert_contains "$resolve_output" "\"spec_path\":\"$missing_spec\"" "read-only resolve missing expected spec path"
  assert_contains "$resolve_output" '"reason":"missing_expected_spec"' "read-only resolve missing expected spec reason"

  init_repo "$repo_plan"
  write_file "$repo_plan/docs/superpowers/specs/2026-03-18-approved-spec.md" <<'EOF'
# Approved Spec

**Workflow State:** CEO Approved
**Spec Revision:** 1
**Last Reviewed By:** plan-ceo-review
EOF

  run_command_succeeds "$repo_plan" "set expected missing plan for read-only resolve" \
    expect --artifact plan --path "$missing_plan" >/dev/null
  resolve_output="$(run_resolve_succeeds "$repo_plan" "read-only resolve preserves missing expected plan")"
  assert_contains "$resolve_output" "\"plan_path\":\"$missing_plan\"" "read-only resolve missing expected plan path"
  assert_contains "$resolve_output" '"reason":"missing_expected_plan"' "read-only resolve missing expected plan reason"
}

run_implementation_ready() {
  local repo="$REPO_DIR/implementation-ready"
  local spec_path="$repo/docs/superpowers/specs/2026-03-17-implementation-ready-design.md"
  local plan_path="$repo/docs/superpowers/plans/2026-03-17-implementation-ready.md"
  local output

  init_repo "$repo"
  write_file "$spec_path" <<'EOF'
# Implementation Ready Spec

**Workflow State:** CEO Approved
**Spec Revision:** 3
**Last Reviewed By:** plan-ceo-review

## Requirement Index

- [REQ-001][behavior] Fully valid approved plans still route to execution preflight.
- [VERIFY-001][verification] Implementation-ready fixtures preserve manifest parity and route-time readiness.
EOF
  write_file "$plan_path" <<'EOF'
# Implementation Ready Plan

**Workflow State:** Engineering Approved
**Plan Revision:** 1
**Execution Mode:** none
**Source Spec:** `docs/superpowers/specs/2026-03-17-implementation-ready-design.md`
**Source Spec Revision:** 3
**Last Reviewed By:** plan-eng-review

## Requirement Coverage Matrix

- REQ-001 -> Task 1
- VERIFY-001 -> Task 1

## Task 1: Preserve implementation-ready routing

**Spec Coverage:** REQ-001, VERIFY-001
**Task Outcome:** A fully valid approved plan can still route to execution preflight.
**Plan Constraints:**
- Keep the fixture minimal.
**Open Questions:** none

**Files:**
- Test: `bash tests/codex-runtime/test-superpowers-workflow-status.sh`

- [ ] **Step 1: Emit implementation-ready status**
EOF

  output="$(run_command_succeeds "$repo" "implementation-ready status" status --refresh)"
  assert_contains "$output" '"status":"implementation_ready"' "implementation-ready status"
  assert_contains "$output" '"next_skill":""' "implementation-ready empty next_skill"
  assert_contains "$output" "implementation_ready" "implementation-ready reason"

  local manifest_path
  local manifest_json
  local branch
  local actual_repo_root
  manifest_path="$(manifest_path_for_branch "$repo")"
  manifest_json="$(cat "$manifest_path")"
  IFS=$'\t' read -r _ branch < <(slug_identity_for_repo "$repo")
  actual_repo_root="$(git -C "$repo" rev-parse --show-toplevel)"
  assert_contains "$manifest_json" "\"repo_root\":\"$actual_repo_root\"" "implementation-ready manifest repo_root"
  assert_contains "$manifest_json" "\"branch\":\"$branch\"" "implementation-ready manifest branch"
  assert_contains "$manifest_json" '"reason":"implementation_ready"' "implementation-ready manifest canonical reason"
  assert_contains "$manifest_json" '"note":"implementation_ready"' "implementation-ready manifest compatibility note"
}

run_full_contract_implementation_ready_exposes_structured_diagnostics() {
  local repo="$REPO_DIR/full-contract-implementation-ready"
  local spec_path="$repo/docs/superpowers/specs/2026-03-22-runtime-integration-hardening-design.md"
  local plan_path="$repo/docs/superpowers/plans/2026-03-22-runtime-integration-hardening.md"
  local output

  init_repo "$repo"
  copy_fixture \
    "$WORKFLOW_FIXTURE_DIR/specs/2026-03-22-runtime-integration-hardening-design.md" \
    "$spec_path"
  copy_fixture \
    "$WORKFLOW_FIXTURE_DIR/plans/2026-03-22-runtime-integration-hardening.md" \
    "$plan_path"
  node - "$plan_path" <<'NODE'
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

  output="$(run_command_succeeds "$repo" "full contract implementation-ready status" status --refresh)"
  assert_json_equals "$output" "status" "implementation_ready" "full contract implementation-ready status"
  assert_json_equals "$output" "next_skill" "" "full contract implementation-ready next skill"
  assert_json_equals "$output" "contract_state" "valid" "full contract implementation-ready contract state"
  assert_json_equals "$output" "spec_path" "docs/superpowers/specs/2026-03-22-runtime-integration-hardening-design.md" "full contract implementation-ready spec path"
  assert_json_equals "$output" "plan_path" "docs/superpowers/plans/2026-03-22-runtime-integration-hardening.md" "full contract implementation-ready plan path"
  assert_json_nonempty "$output" "schema_version" "full contract implementation-ready schema version"
  assert_json_equals "$output" "scan_truncated" "false" "full contract implementation-ready scan truncation"
  assert_json_equals "$output" "spec_candidate_count" "1" "full contract implementation-ready spec candidate count"
  assert_json_equals "$output" "plan_candidate_count" "1" "full contract implementation-ready plan candidate count"
  assert_json_equals "$output" "reason_codes.0" "implementation_ready" "full contract implementation-ready reason codes"
  assert_json_equals "$output" "diagnostics" "[]" "full contract implementation-ready diagnostics"
  assert_contains "$output" '"reason":"implementation_ready"' "full contract implementation-ready compatibility reason"
}

run_full_contract_implementation_ready_stays_fast() {
  local repo="$REPO_DIR/full-contract-implementation-ready-fast"
  local spec_path="$repo/docs/superpowers/specs/2026-03-22-runtime-integration-hardening-design.md"
  local plan_path="$repo/docs/superpowers/plans/2026-03-22-runtime-integration-hardening.md"
  local output

  init_repo "$repo"
  copy_fixture \
    "$WORKFLOW_FIXTURE_DIR/specs/2026-03-22-runtime-integration-hardening-design.md" \
    "$spec_path"
  copy_fixture \
    "$WORKFLOW_FIXTURE_DIR/plans/2026-03-22-runtime-integration-hardening.md" \
    "$plan_path"
  node - "$plan_path" <<'NODE'
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

  if ! (cd "$repo" && "$STATUS_BIN" status --refresh >/dev/null 2>&1); then
    echo "Expected command to succeed for: full contract implementation-ready status warmup"
    exit 1
  fi
  output="$(run_command_succeeds_with_timeout "$repo" "full contract implementation-ready status stays fast" 1 status --refresh)"
  assert_json_equals "$output" "status" "implementation_ready" "full contract implementation-ready fast status"
}

run_repo_runtime_integration_status_stays_fast() {
  local output

  run_command_succeeds "$REPO_ROOT" "repo runtime expect spec" expect --artifact spec --path docs/superpowers/specs/2026-03-22-runtime-integration-hardening-design.md >/dev/null
  run_command_succeeds "$REPO_ROOT" "repo runtime expect plan" expect --artifact plan --path docs/superpowers/plans/2026-03-22-runtime-integration-hardening.md >/dev/null
  if ! (cd "$REPO_ROOT" && "$STATUS_BIN" status --refresh >/dev/null 2>&1); then
    echo "Expected command to succeed for: repo runtime integration status warmup"
    exit 1
  fi
  output="$(run_command_succeeds_with_timeout "$REPO_ROOT" "repo runtime integration status stays fast" 1 status --refresh)"
  assert_json_equals "$output" "status" "implementation_ready" "repo runtime integration fast status"
}

require_helper

run_bootstrap_no_docs
run_draft_spec
run_approved_spec_no_plan
run_draft_plan
run_stale_approved_plan
run_packet_buildability_failure_surfaces_structured_contract
run_bounded_refresh
run_expected_path_survives_refresh
run_missing_manifest_path_falls_forward
run_ambiguous_fallback_discovery
run_corrupted_manifest
run_single_retry_conflict
run_expect_sync_retry_conflict
run_sync_missing_artifact_behavior
run_sync_preserves_manifest_missing_expectation
run_expect_normalizes_repo_relative_paths
run_sync_missing_plan_preserves_stage
run_out_of_repo_expect
run_branch_isolated_manifests
run_status_summary_matches_json
run_repo_root_mismatch_recovery
run_cross_slug_recovery
run_cross_slug_recovery_budget_limit
run_runtime_bin_helper_overrides_repo_local_helper
run_malformed_spec_headers
run_malformed_plan_headers
run_missing_plan_revision_routes_plan_draft
run_invalid_execution_mode_routes_plan_draft
run_malformed_task_contract_routes_plan_draft
run_malformed_task_structure_routes_plan_draft
run_contract_analysis_surfaces_multiple_diagnostics
run_ambiguous_plan_surfaces_candidate_counts
run_read_only_resolve_parity
run_read_only_resolve_outside_repo
run_read_only_resolve_invalid_command_input
run_read_only_resolve_contract_violation
run_read_only_resolve_runtime_failure
run_read_only_resolve_avoids_manifest_mutation
run_read_only_resolve_preserves_missing_expected_paths
run_implementation_ready
run_full_contract_implementation_ready_exposes_structured_diagnostics
run_full_contract_implementation_ready_stays_fast
run_repo_runtime_integration_status_stays_fast

echo "superpowers-workflow-status regression scaffold passed."
