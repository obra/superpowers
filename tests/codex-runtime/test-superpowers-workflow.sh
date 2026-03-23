#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
WORKFLOW_BIN="$REPO_ROOT/bin/superpowers-workflow"
STATUS_BIN="$REPO_ROOT/bin/superpowers-workflow-status"
PLAN_EXECUTION_BIN="$REPO_ROOT/bin/superpowers-plan-execution"
WORKFLOW_FIXTURE_DIR="$REPO_ROOT/tests/codex-runtime/fixtures/workflow-artifacts"
STATE_DIR="$(mktemp -d)"
REPO_DIR="$(mktemp -d)"
trap 'rm -rf "$STATE_DIR" "$REPO_DIR"' EXIT
export SUPERPOWERS_STATE_DIR="$STATE_DIR"

USER_NAME="$(whoami 2>/dev/null || echo user)"
COMPACT_SPEC_REL="docs/superpowers/specs/2026-03-22-workflow-cli-phase-fixture-design.md"
COMPACT_PLAN_REL="docs/superpowers/plans/2026-03-22-workflow-cli-phase-fixture.md"
WORKFLOW_SESSION_KEY="workflow-cli-tests"
export SUPERPOWERS_SESSION_KEY="$WORKFLOW_SESSION_KEY"

enable_workflow_session_entry() {
  local decision_path="$STATE_DIR/session-flags/using-superpowers/$WORKFLOW_SESSION_KEY"
  mkdir -p "$(dirname "$decision_path")"
  printf 'enabled\n' > "$decision_path"
}

enable_workflow_session_entry

require_helpers() {
  if [[ ! -x "$WORKFLOW_BIN" ]]; then
    echo "Expected workflow CLI to exist and be executable: $WORKFLOW_BIN"
    exit 1
  fi
  if [[ ! -x "$STATUS_BIN" ]]; then
    echo "Expected internal workflow helper to exist and be executable: $STATUS_BIN"
    exit 1
  fi
  if [[ ! -x "$PLAN_EXECUTION_BIN" ]]; then
    echo "Expected plan-execution helper to exist and be executable: $PLAN_EXECUTION_BIN"
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

assert_same_bytes() {
  local before="$1"
  local after="$2"
  local label="$3"
  if ! cmp -s "$before" "$after"; then
    echo "Expected ${label} to remain byte-identical"
    exit 1
  fi
}

json_field() {
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
  actual="$(json_field "$json" "$path")"
  if [[ "$actual" != "$expected" ]]; then
    echo "Expected ${label} JSON field ${path} to equal '${expected}'"
    printf 'Actual: %s\n' "$actual"
    printf '%s\n' "$json"
    exit 1
  fi
}

assert_json_nonempty() {
  local json="$1"
  local path="$2"
  local label="$3"
  local actual
  actual="$(json_field "$json" "$path")"
  if [[ -z "$actual" || "$actual" == "null" ]]; then
    echo "Expected ${label} JSON field ${path} to be non-empty"
    printf '%s\n' "$json"
    exit 1
  fi
}

assert_json_not_equals() {
  local json="$1"
  local path="$2"
  local unexpected="$3"
  local label="$4"
  local actual
  actual="$(json_field "$json" "$path")"
  if [[ "$actual" == "$unexpected" ]]; then
    echo "Expected ${label} JSON field ${path} to not equal '${unexpected}'"
    printf '%s\n' "$json"
    exit 1
  fi
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

init_repo() {
  local repo_dir="$1"
  local remote_url="${2:-}"
  mkdir -p "$repo_dir"
  git -C "$repo_dir" init >/dev/null 2>&1
  git -C "$repo_dir" config user.name "Superpowers Test"
  git -C "$repo_dir" config user.email "superpowers-tests@example.com"
  printf '# workflow CLI regression fixture\n' > "$repo_dir/README.md"
  git -C "$repo_dir" add README.md
  git -C "$repo_dir" commit -m "init" >/dev/null 2>&1
  if [[ -n "$remote_url" ]]; then
    git -C "$repo_dir" remote add origin "$remote_url"
  fi
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

load_slug_context() {
  local repo_dir="$1"
  local slug_env

  slug_env="$(cd "$repo_dir" && "$REPO_ROOT/bin/superpowers-slug")"
  eval "$slug_env"
  PROJECT_ARTIFACT_SLUG="$SLUG"
  PROJECT_ARTIFACT_SAFE_BRANCH="$BRANCH"
}

install_full_contract_ready_artifacts() {
  local repo_dir="$1"
  local spec_rel="docs/superpowers/specs/2026-03-22-runtime-integration-hardening-design.md"
  local plan_rel="docs/superpowers/plans/2026-03-22-runtime-integration-hardening.md"
  copy_fixture \
    "$WORKFLOW_FIXTURE_DIR/specs/2026-03-22-runtime-integration-hardening-design.md" \
    "$repo_dir/$spec_rel"
  copy_fixture \
    "$WORKFLOW_FIXTURE_DIR/plans/2026-03-22-runtime-integration-hardening.md" \
    "$repo_dir/$plan_rel"
  node - "$repo_dir/$plan_rel" "$spec_rel" <<'NODE'
const fs = require("fs");
const [file, specRel] = process.argv.slice(2);
const source = fs.readFileSync(file, "utf8");
fs.writeFileSync(
  file,
  source.replace(
    "tests/codex-runtime/fixtures/workflow-artifacts/specs/2026-03-22-runtime-integration-hardening-design.md",
    specRel,
  ),
);
NODE
}

compact_evidence_rel_path() {
  printf 'docs/superpowers/execution-evidence/%s-r1-evidence.md\n' "$(basename "$COMPACT_PLAN_REL" .md)"
}

install_compact_full_contract_ready_artifacts() {
  local repo_dir="$1"

  write_file "$repo_dir/$COMPACT_SPEC_REL" <<EOF
# Workflow CLI Phase Fixture Design

**Workflow State:** CEO Approved
**Spec Revision:** 1
**Last Reviewed By:** plan-ceo-review

## Requirement Index

- [REQ-001][behavior] The wrapper must expose preflight before execution starts.
- [REQ-002][behavior] The wrapper must route blocked review state to final review instead of pretending execution is still active.
- [VERIFY-001][verification] Regression coverage must pin late-stage workflow phases.
EOF

  write_file "$repo_dir/$COMPACT_PLAN_REL" <<EOF
# Workflow CLI Phase Fixture Plan

**Workflow State:** Engineering Approved
**Plan Revision:** 1
**Execution Mode:** superpowers:executing-plans
**Source Spec:** \`${COMPACT_SPEC_REL}\`
**Source Spec Revision:** 1
**Last Reviewed By:** plan-eng-review

## Requirement Coverage Matrix

- REQ-001 -> Task 1
- REQ-002 -> Task 2
- VERIFY-001 -> Task 1, Task 2

## Task 1: Preflight and execution

**Spec Coverage:** REQ-001, VERIFY-001
**Task Outcome:** The wrapper exposes preflight and active execution state coherently.
**Plan Constraints:**
- Keep execution state helper-owned.
- Keep file proofs grounded in repo-visible files.
**Open Questions:** none

**Files:**
- Modify: \`docs/example-output.md\`
- Test: \`tests/codex-runtime/test-superpowers-workflow.sh\`

- [ ] **Step 1: Begin execution**
- [ ] **Step 2: Complete the first task**

## Task 2: Post-execution routing

**Spec Coverage:** REQ-002, VERIFY-001
**Task Outcome:** The wrapper exposes review, QA, release, and finish-ready phases coherently.
**Plan Constraints:**
- Keep finish routing fail-closed on stale artifacts.
- Preserve exact approved-plan provenance in every late-stage check.
**Open Questions:** none

**Files:**
- Modify: \`docs/example-output.md\`
- Test: \`tests/codex-runtime/test-superpowers-workflow.sh\`

- [ ] **Step 1: Finish the second task**
- [ ] **Step 2: Prepare late-stage routing**
EOF

  write_file "$repo_dir/docs/example-output.md" <<'EOF'
workflow wrapper fixture
EOF
}

write_test_plan_artifact() {
  local repo_dir="$1"
  local plan_rel="${2:-docs/superpowers/plans/2026-03-22-runtime-integration-hardening.md}"
  local browser_required="${3:-no}"
  local artifact_dir artifact_path branch_name

  load_slug_context "$repo_dir"
  artifact_dir="$STATE_DIR/projects/$PROJECT_ARTIFACT_SLUG"
  branch_name="$(git -C "$repo_dir" rev-parse --abbrev-ref HEAD)"
  mkdir -p "$artifact_dir"
  artifact_path="$artifact_dir/tester-$PROJECT_ARTIFACT_SAFE_BRANCH-test-plan-20260322-170500.md"
  write_file "$artifact_path" <<EOF
# Test Plan
**Source Plan:** \`${plan_rel}\`
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
  local plan_rel="$2"
  local source_test_plan="$3"
  local result_value="${4:-pass}"
  local artifact_dir artifact_path head_sha branch_name

  load_slug_context "$repo_dir"
  artifact_dir="$STATE_DIR/projects/$PROJECT_ARTIFACT_SLUG"
  branch_name="$(git -C "$repo_dir" rev-parse --abbrev-ref HEAD)"
  head_sha="$(git -C "$repo_dir" rev-parse HEAD)"
  mkdir -p "$artifact_dir"
  artifact_path="$artifact_dir/tester-$PROJECT_ARTIFACT_SAFE_BRANCH-test-outcome-20260322-171000.md"
  write_file "$artifact_path" <<EOF
# QA Result
**Source Plan:** \`${plan_rel}\`
**Source Plan Revision:** 1
**Branch:** ${branch_name}
**Repo:** ${PROJECT_ARTIFACT_SLUG}
**Head SHA:** ${head_sha}
**Source Test Plan:** \`${source_test_plan}\`
**Result:** ${result_value}
**Generated By:** superpowers:qa-only
**Generated At:** 2026-03-22T17:10:00Z
EOF
}

write_release_readiness_artifact() {
  local repo_dir="$1"
  local plan_rel="$2"
  local result_value="${3:-pass}"
  local artifact_dir artifact_path head_sha branch_name base_branch

  load_slug_context "$repo_dir"
  artifact_dir="$STATE_DIR/projects/$PROJECT_ARTIFACT_SLUG"
  branch_name="$(git -C "$repo_dir" rev-parse --abbrev-ref HEAD)"
  head_sha="$(git -C "$repo_dir" rev-parse HEAD)"
  base_branch="$(git -C "$repo_dir" rev-parse --abbrev-ref HEAD 2>/dev/null || printf 'main')"
  if [[ "$base_branch" == "HEAD" || -z "$base_branch" ]]; then
    base_branch="main"
  fi
  mkdir -p "$artifact_dir"
  artifact_path="$artifact_dir/releaser-$PROJECT_ARTIFACT_SAFE_BRANCH-release-readiness-20260322-171500.md"
  write_file "$artifact_path" <<EOF
# Release Readiness Result
**Source Plan:** \`${plan_rel}\`
**Source Plan Revision:** 1
**Branch:** ${branch_name}
**Repo:** ${PROJECT_ARTIFACT_SLUG}
**Base Branch:** ${base_branch}
**Head SHA:** ${head_sha}
**Result:** ${result_value}
**Generated By:** superpowers:document-release
**Generated At:** 2026-03-22T17:15:00Z
EOF
}

repo_slug_for_manifest() {
  local repo_dir="$1"
  local repo_root remote_url slug repo_base hash

  repo_root="$(git -C "$repo_dir" rev-parse --show-toplevel 2>/dev/null || printf '%s' "$repo_dir")"
  remote_url="$(git -C "$repo_dir" remote get-url origin 2>/dev/null || true)"
  slug="$(printf '%s' "$remote_url" | sed -E 's|.*[:/]+([^/]+/[^/]+)\.git$|\1|; s|.*[:/]+([^/]+/[^/]+)$|\1|')"
  if [[ -z "$slug" || "$slug" == "$remote_url" ]]; then
    repo_base="$(basename "$repo_root")"
    if command -v shasum >/dev/null 2>&1; then
      hash="$(printf '%s' "$repo_root" | shasum -a 256 | awk '{print substr($1, 1, 12)}')"
    elif command -v sha256sum >/dev/null 2>&1; then
      hash="$(printf '%s' "$repo_root" | sha256sum | awk '{print substr($1, 1, 12)}')"
    else
      hash="$(printf '%s' "$repo_root" | cksum | awk '{print $1}')"
    fi
    slug="${repo_base}-${hash}"
  fi
  printf '%s' "$slug" | tr '/' '-'
}

manifest_path_for_branch() {
  local repo_dir="$1"
  local branch safe_branch slug
  branch="$(git -C "$repo_dir" rev-parse --abbrev-ref HEAD 2>/dev/null || echo main)"
  if [[ "$branch" == "HEAD" || -z "$branch" ]]; then
    branch="main"
  fi
  safe_branch="$(printf '%s' "$branch" | sed 's#[^A-Za-z0-9._-]#-#g')"
  slug="$(repo_slug_for_manifest "$repo_dir")"
  printf '%s\n' "$STATE_DIR/projects/$slug/${USER_NAME}-${safe_branch}-workflow-state.json"
}

snapshot_if_exists() {
  local path="$1"
  local snapshot="$2"
  if [[ -e "$path" ]]; then
    cp "$path" "$snapshot"
  else
    : > "$snapshot"
  fi
}

run_workflow() {
  local repo_dir="$1"
  local label="$2"
  local output
  local status=0
  shift 2
  output="$(cd "$repo_dir" && "$WORKFLOW_BIN" "$@" 2>&1)" || status=$?
  if [[ $status -ne 0 ]]; then
    echo "Expected command to succeed for: $label"
    printf '%s\n' "$output"
    exit 1
  fi
  printf '%s\n' "$output"
}

create_workflow_bin_with_plan_contract_stub() {
  local contract_json="$1"
  local tool_dir

  tool_dir="$(mktemp -d "$STATE_DIR/workflow-bin.XXXXXX")"
  ln -s "$WORKFLOW_BIN" "$tool_dir/superpowers-workflow"
  ln -s "$STATUS_BIN" "$tool_dir/superpowers-workflow-status"
  ln -s "$PLAN_EXECUTION_BIN" "$tool_dir/superpowers-plan-execution"
  ln -s "$REPO_ROOT/bin/superpowers-runtime-common.sh" "$tool_dir/superpowers-runtime-common.sh"
  ln -s "$REPO_ROOT/bin/superpowers-plan-structure-common" "$tool_dir/superpowers-plan-structure-common"
  ln -s "$REPO_ROOT/bin/superpowers-session-entry" "$tool_dir/superpowers-session-entry"
  ln -s "$REPO_ROOT/bin/superpowers-slug" "$tool_dir/superpowers-slug"
  ln -s "$REPO_ROOT/bin/superpowers-repo-safety" "$tool_dir/superpowers-repo-safety"
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

run_plan_execution() {
  local repo_dir="$1"
  local label="$2"
  local output
  local status=0
  shift 2
  output="$(cd "$repo_dir" && "$PLAN_EXECUTION_BIN" "$@" 2>&1)" || status=$?
  if [[ $status -ne 0 ]]; then
    echo "Expected plan-execution command to succeed for: $label"
    printf '%s\n' "$output"
    exit 1
  fi
  printf '%s\n' "$output"
}

begin_started_execution_for_ready_plan() {
  local repo_dir="$1"
  local plan_rel="docs/superpowers/plans/2026-03-22-runtime-integration-hardening.md"
  local status_output

  status_output="$(run_plan_execution "$repo_dir" "status before begin" status --plan "$plan_rel")"
  run_plan_execution "$repo_dir" "begin started execution" begin --plan "$plan_rel" --task 1 --step 1 --execution-mode superpowers:executing-plans --expect-execution-fingerprint "$(json_field "$status_output" "execution_fingerprint")" >/dev/null
}

complete_compact_execution_plan() {
  local repo_dir="$1"
  local status_output execution_fingerprint task step

  for task in 1 1 2 2; do
    case "$task:${task_step_index:-0}" in
      1:0) step=1; task_step_index=1 ;;
      1:1) step=2; task_step_index=2 ;;
      2:2) step=1; task_step_index=3 ;;
      2:3) step=2; task_step_index=4 ;;
      *) echo "Unexpected compact execution state while building workflow fixture"; exit 1 ;;
    esac

    status_output="$(run_plan_execution "$repo_dir" "compact status before begin $task.$step" status --plan "$COMPACT_PLAN_REL")"
    execution_fingerprint="$(json_field "$status_output" "execution_fingerprint")"
    run_plan_execution "$repo_dir" "compact begin $task.$step" begin --plan "$COMPACT_PLAN_REL" --task "$task" --step "$step" --execution-mode superpowers:executing-plans --expect-execution-fingerprint "$execution_fingerprint" >/dev/null

    printf 'task %s step %s\n' "$task" "$step" >> "$repo_dir/docs/example-output.md"
    status_output="$(run_plan_execution "$repo_dir" "compact status before complete $task.$step" status --plan "$COMPACT_PLAN_REL")"
    execution_fingerprint="$(json_field "$status_output" "execution_fingerprint")"
    run_plan_execution \
      "$repo_dir" \
      "compact complete $task.$step" \
      complete \
      --plan "$COMPACT_PLAN_REL" \
      --task "$task" \
      --step "$step" \
      --source superpowers:executing-plans \
      --claim "Completed workflow fixture task $task step $step." \
      --manual-verify-summary "Validated workflow fixture step $task.$step." \
      --file docs/example-output.md \
      --expect-execution-fingerprint "$execution_fingerprint" >/dev/null
  done

  unset task_step_index
}

run_workflow_with_timeout() {
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

  stdout_file="$(mktemp "${TMPDIR:-/tmp}/superpowers-workflow-stdout.XXXXXX")"
  stderr_file="$(mktemp "${TMPDIR:-/tmp}/superpowers-workflow-stderr.XXXXXX")"
  TIMEFORMAT='%R'
  timing="$({ time (cd "$repo_dir" && "$WORKFLOW_BIN" "$@" >"$stdout_file" 2>"$stderr_file"); } 2>&1)" || status=$?
  timing="${timing##*$'\n'}"

  output="$(cat "$stdout_file")"
  error_output="$(cat "$stderr_file")"
  rm -f "$stdout_file" "$stderr_file"

  if awk -v actual="$timing" -v limit="$timeout_seconds" 'BEGIN { exit !((actual + 0) > (limit + 0)) }'; then
    echo "Expected command to stay under ${timeout_seconds}s for: $label"
    echo "Command timed out: $WORKFLOW_BIN $*"
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

run_workflow_fails() {
  local repo_dir="$1"
  local label="$2"
  local expected_output="$3"
  local output
  local status=0
  shift 3
  output="$(cd "$repo_dir" && "$WORKFLOW_BIN" "$@" 2>&1)" || status=$?
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
  printf '%s\n' "$output"
}

run_workflow_fails_json() {
  local repo_dir="$1"
  local label="$2"
  local output
  local status=0
  shift 2
  output="$(cd "$repo_dir" && "$WORKFLOW_BIN" "$@" 2>&1)" || status=$?
  if [[ $status -eq 0 ]]; then
    echo "Expected command to fail for: $label"
    printf '%s\n' "$output"
    exit 1
  fi
  printf '%s\n' "$output"
}

duplicate_active_execution_note() {
  local path="$1"

  node - <<'NODE' "$path"
const fs = require("fs");
const file = process.argv[2];
const source = fs.readFileSync(file, "utf8");
const match = source.match(/^(\s+\*\*Execution Note:\*\* Active - .+)$/m);
if (!match) {
  throw new Error(`Could not find an active execution note in ${file}`);
}
fs.writeFileSync(file, source.replace(match[1], `${match[1]}\n${match[1]}`));
NODE
}

run_help_outside_repo() {
  local outside_repo="$REPO_DIR/help-outside"
  mkdir -p "$outside_repo"
  local output
  output="$(run_workflow "$outside_repo" "help outside repo" help)"
  assert_contains "$output" "superpowers-workflow status" "help outside repo"
  assert_contains "$output" "--debug" "help outside repo"
}

run_status_draft_spec() {
  local repo="$REPO_DIR/status-draft-spec"
  init_repo "$repo"
  write_file "$repo/docs/superpowers/specs/2026-03-18-draft-spec.md" <<'EOF'
# Draft Spec

**Workflow State:** Draft
**Spec Revision:** 1
**Last Reviewed By:** brainstorming
EOF

  local output
  output="$(run_workflow "$repo" "status draft spec" status)"
  assert_contains "$output" "Workflow status: Spec review needed" "status draft spec"
  assert_contains "$output" "Next: Use superpowers:plan-ceo-review" "status draft spec"
  assert_contains "$output" "Spec: docs/superpowers/specs/2026-03-18-draft-spec.md" "status draft spec"
}

run_status_bootstrap_no_docs() {
  local repo="$REPO_DIR/status-bootstrap-no-docs"
  init_repo "$repo"

  local output
  output="$(run_workflow "$repo" "status bootstrap no docs" status)"
  assert_contains "$output" "Workflow status: Brainstorming needed" "status bootstrap no docs"
  assert_contains "$output" "Why: No current workflow artifacts are available yet." "status bootstrap no docs"
  assert_contains "$output" "Next: Use superpowers:brainstorming" "status bootstrap no docs"
  assert_contains "$output" "Spec: none" "status bootstrap no docs"
  assert_contains "$output" "Plan: none" "status bootstrap no docs"
}

run_phase_reports_needs_brainstorming_json() {
  local repo="$REPO_DIR/phase-needs-brainstorming"
  local output

  init_repo "$repo"

  output="$(run_workflow "$repo" "phase needs brainstorming json" phase --json)"
  assert_contains "$output" '"phase":"needs_brainstorming"' "phase needs brainstorming json"
  assert_contains "$output" '"route_status":"needs_brainstorming"' "phase needs brainstorming json"
  assert_contains "$output" '"next_action":"use_next_skill"' "phase needs brainstorming json"
}

run_status_approved_spec_no_plan() {
  local repo="$REPO_DIR/status-approved-spec-no-plan"
  local spec_path="$repo/docs/superpowers/specs/2026-01-22-document-review-system-design.md"
  init_repo "$repo"
  copy_fixture \
    "$WORKFLOW_FIXTURE_DIR/specs/2026-01-22-document-review-system-design.md" \
    "$spec_path"

  local output
  output="$(run_workflow "$repo" "status approved spec no plan" status)"
  assert_contains "$output" "Workflow status: Plan writing needed" "status approved spec no plan"
  assert_contains "$output" "Why: The spec is approved, but no current approved plan is available." "status approved spec no plan"
  assert_contains "$output" "Next: Use superpowers:writing-plans" "status approved spec no plan"
  assert_contains "$output" "Spec: docs/superpowers/specs/2026-01-22-document-review-system-design.md" "status approved spec no plan"
  assert_contains "$output" "Plan: none" "status approved spec no plan"
}

run_next_draft_plan() {
  local repo="$REPO_DIR/next-draft-plan"
  init_repo "$repo"
  write_file "$repo/docs/superpowers/specs/2026-03-18-draft-plan-spec.md" <<'EOF'
# Draft Plan Spec

**Workflow State:** CEO Approved
**Spec Revision:** 1
**Last Reviewed By:** plan-ceo-review
EOF
  write_file "$repo/docs/superpowers/plans/2026-03-18-draft-plan.md" <<'EOF'
# Draft Plan

**Workflow State:** Draft
**Source Spec:** `docs/superpowers/specs/2026-03-18-draft-plan-spec.md`
**Source Spec Revision:** 1
**Last Reviewed By:** writing-plans
EOF

  local output
  output="$(run_workflow "$repo" "next draft plan" next)"
  assert_contains "$output" "Next safe step: Use superpowers:plan-eng-review" "next draft plan"
  assert_contains "$output" "current plan exists but it is not engineering-approved yet" "next draft plan"
  assert_contains "$output" "Current plan: docs/superpowers/plans/2026-03-18-draft-plan.md" "next draft plan"
}

run_status_stale_plan() {
  local repo="$REPO_DIR/status-stale-plan"
  init_repo "$repo"
  write_file "$repo/docs/superpowers/specs/2026-03-18-stale-spec.md" <<'EOF'
# Stale Spec

**Workflow State:** CEO Approved
**Spec Revision:** 2
**Last Reviewed By:** plan-ceo-review

## Requirement Index

- [REQ-001][behavior] Stale approved plans must route back to plan writing.
EOF
  write_file "$repo/docs/superpowers/plans/2026-03-18-stale-plan.md" <<'EOF'
# Stale Plan

**Workflow State:** Engineering Approved
**Plan Revision:** 1
**Execution Mode:** superpowers:executing-plans
**Source Spec:** `docs/superpowers/specs/2026-03-18-stale-spec.md`
**Source Spec Revision:** 1
**Last Reviewed By:** plan-eng-review

## Requirement Coverage Matrix

- REQ-001 -> Task 1

## Task 1: Preserve stale linkage

**Spec Coverage:** REQ-001
**Task Outcome:** The stale-plan fixture isolates source-spec revision drift.
**Plan Constraints:**
- Keep the stale state isolated to the source-spec revision mismatch.
**Open Questions:** none

**Files:**
- Test: `bash tests/codex-runtime/test-superpowers-workflow.sh`

- [ ] **Step 1: Report stale source-spec linkage**
EOF

  local output
  output="$(run_workflow "$repo" "status stale plan" status)"
  assert_contains "$output" "Workflow status: Plan update needed" "status stale plan"
  assert_contains "$output" "Next: Use superpowers:writing-plans" "status stale plan"
  assert_contains "$output" "Plan: docs/superpowers/plans/2026-03-18-stale-plan.md" "status stale plan"
}

run_phase_routes_stale_plan_to_plan_writing_json() {
  local repo="$REPO_DIR/phase-stale-plan"
  init_repo "$repo"
  write_file "$repo/docs/superpowers/specs/2026-03-18-stale-spec.md" <<'EOF'
# Stale Spec

**Workflow State:** CEO Approved
**Spec Revision:** 2
**Last Reviewed By:** plan-ceo-review

## Requirement Index

- [REQ-001][behavior] Stale approved plans must route back to plan writing.
EOF
  write_file "$repo/docs/superpowers/plans/2026-03-18-stale-plan.md" <<'EOF'
# Stale Plan

**Workflow State:** Engineering Approved
**Plan Revision:** 1
**Execution Mode:** superpowers:executing-plans
**Source Spec:** `docs/superpowers/specs/2026-03-18-stale-spec.md`
**Source Spec Revision:** 1
**Last Reviewed By:** plan-eng-review

## Requirement Coverage Matrix

- REQ-001 -> Task 1

## Task 1: Preserve stale linkage

**Spec Coverage:** REQ-001
**Task Outcome:** The stale-plan fixture isolates source-spec revision drift.
**Plan Constraints:**
- Keep the stale state isolated to the source-spec revision mismatch.
**Open Questions:** none

**Files:**
- Test: `bash tests/codex-runtime/test-superpowers-workflow.sh`

- [ ] **Step 1: Report stale source-spec linkage**
EOF

  local output
  output="$(run_workflow "$repo" "phase stale plan json" phase --json)"
  assert_contains "$output" '"phase":"plan_writing"' "phase stale plan json"
  assert_contains "$output" '"route_status":"stale_plan"' "phase stale plan json"
  assert_contains "$output" '"next_action":"use_next_skill"' "phase stale plan json"
}

run_next_implementation_ready() {
  local repo="$REPO_DIR/next-implementation-ready"
  init_repo "$repo"
  write_file "$repo/docs/superpowers/specs/2026-03-18-ready-spec.md" <<'EOF'
# Ready Spec

**Workflow State:** CEO Approved
**Spec Revision:** 2
**Last Reviewed By:** plan-ceo-review

## Requirement Index

- [REQ-001][behavior] Ready workflow fixtures preserve execution preflight through the public wrapper.
- [VERIFY-001][verification] The public wrapper continues to expose execution preflight for a valid approved plan.
EOF
  write_file "$repo/docs/superpowers/plans/2026-03-18-ready-plan.md" <<'EOF'
# Ready Plan

**Workflow State:** Engineering Approved
**Plan Revision:** 1
**Execution Mode:** none
**Source Spec:** `docs/superpowers/specs/2026-03-18-ready-spec.md`
**Source Spec Revision:** 2
**Last Reviewed By:** plan-eng-review

## Requirement Coverage Matrix

- REQ-001 -> Task 1
- VERIFY-001 -> Task 1

## Task 1: Preserve wrapper handoff

**Spec Coverage:** REQ-001, VERIFY-001
**Task Outcome:** The public wrapper keeps exposing execution preflight for a valid approved plan.
**Plan Constraints:**
- Keep the fixture minimal.
**Open Questions:** none

**Files:**
- Test: `bash tests/codex-runtime/test-superpowers-workflow.sh`

- [ ] **Step 1: Report execution preflight**
EOF

  local output
  output="$(run_workflow "$repo" "next implementation ready" next)"
  assert_contains "$output" "Next safe step: Return to execution preflight for the approved plan:" "next implementation ready"
  assert_contains "$output" "docs/superpowers/plans/2026-03-18-ready-plan.md" "next implementation ready"
  assert_not_contains "$output" "recommend" "next implementation ready"
}

run_status_implementation_ready_points_to_execution_preflight() {
  local repo="$REPO_DIR/status-implementation-ready"
  local output

  init_repo "$repo"
  install_full_contract_ready_artifacts "$repo"

  output="$(run_workflow "$repo" "status implementation ready" status)"
  assert_contains "$output" "Workflow status: Ready for implementation" "status implementation ready"
  assert_contains "$output" "ready for execution preflight" "status implementation ready"
  assert_contains "$output" "Next: Return to execution preflight for the approved plan:" "status implementation ready"
  assert_not_contains "$output" "implementation handoff" "status implementation ready"
  assert_not_contains "$output" "execution handoff" "status implementation ready"
}

run_explain_implementation_ready_points_to_execution_preflight() {
  local repo="$REPO_DIR/explain-implementation-ready"
  local output

  init_repo "$repo"
  install_full_contract_ready_artifacts "$repo"

  output="$(run_workflow "$repo" "explain implementation ready" explain)"
  assert_contains "$output" "ready for execution preflight" "explain implementation ready"
  assert_contains "$output" "Return to execution preflight for the approved plan:" "explain implementation ready"
  assert_not_contains "$output" "execution handoff" "explain implementation ready"
}

run_next_returns_to_current_execution_after_started_execution() {
  local repo="$REPO_DIR/next-started-execution"
  local output

  init_repo "$repo"
  install_full_contract_ready_artifacts "$repo"
  begin_started_execution_for_ready_plan "$repo"

  output="$(run_workflow "$repo" "next started execution" next)"
  assert_contains "$output" "Return to the current execution flow for the approved plan:" "next started execution"
  assert_not_contains "$output" "Use the approved plan for execution handoff:" "next started execution"
  assert_contains "$output" "Execution already started for the approved plan and should continue through the current execution flow." "next started execution"
  assert_not_contains "$output" "ready for execution handoff" "next started execution"
}

run_phase_reports_execution_preflight_json() {
  local repo="$REPO_DIR/phase-execution-preflight"
  init_repo "$repo"
  install_full_contract_ready_artifacts "$repo"

  local output
  output="$(run_workflow "$repo" "phase execution preflight json" phase --json)"
  assert_contains "$output" '"phase":"execution_preflight"' "phase execution preflight json"
  assert_contains "$output" '"plan_path":"docs/superpowers/plans/2026-03-22-runtime-integration-hardening.md"' "phase execution preflight json"
}

run_phase_reports_implementation_handoff_when_preflight_blocked_json() {
  local repo="$REPO_DIR/phase-implementation-handoff-blocked"
  local output

  init_repo "$repo"
  install_full_contract_ready_artifacts "$repo"
  git -C "$repo" checkout --detach >/dev/null 2>&1

  output="$(run_workflow "$repo" "phase implementation handoff blocked json" phase --json)"
  assert_contains "$output" '"phase":"implementation_handoff"' "phase implementation handoff blocked json"
  assert_contains "$output" '"plan_path":"docs/superpowers/plans/2026-03-22-runtime-integration-hardening.md"' "phase implementation handoff blocked json"
}

run_phase_reports_needs_user_choice_when_session_unresolved_json() {
  local repo="$REPO_DIR/phase-needs-user-choice"
  local output

  init_repo "$repo"

  output="$(cd "$repo" && env SUPERPOWERS_STATE_DIR="$STATE_DIR" SUPERPOWERS_SESSION_KEY="phase-needs-user-choice" "$WORKFLOW_BIN" phase --json 2>&1)"
  assert_contains "$output" '"phase":"needs_user_choice"' "phase needs user choice json"
  assert_contains "$output" '"next_action":"session_entry_gate"' "phase needs user choice json"
  assert_contains "$output" '"session_entry":{"outcome":"needs_user_choice"' "phase needs user choice json"
}

run_phase_wraps_resolve_failure_json() {
  local repo="$REPO_DIR/phase-resolve-runtime-failure"
  local output

  init_repo "$repo"

  output="$(cd "$repo" && env SUPERPOWERS_WORKFLOW_RESOLVE_TEST_FAILPOINT=runtime_failure "$WORKFLOW_BIN" phase --json 2>&1)" || true
  assert_json_equals "$output" "outcome" "runtime_failure" "phase resolve runtime failure json"
  assert_json_equals "$output" "failure_class" "WrappedHelperFailure" "phase resolve runtime failure json"
  assert_json_equals "$output" "helper_failure_class" "ResolverRuntimeFailure" "phase resolve runtime failure json"
  assert_json_nonempty "$output" "message" "phase resolve runtime failure json"
}

run_phase_wraps_session_entry_failure_json() {
  local repo="$REPO_DIR/phase-session-entry-runtime-failure"
  local output

  init_repo "$repo"

  output="$(cd "$repo" && env SUPERPOWERS_SESSION_ENTRY_TEST_FAILPOINT=instruction_parse_failure "$WORKFLOW_BIN" phase --json 2>&1)" || true
  assert_json_equals "$output" "outcome" "runtime_failure" "phase session-entry runtime failure json"
  assert_json_equals "$output" "failure_class" "WrappedHelperFailure" "phase session-entry runtime failure json"
  assert_json_equals "$output" "helper_failure_class" "InstructionParseFailed" "phase session-entry runtime failure json"
  assert_json_nonempty "$output" "message" "phase session-entry runtime failure json"
}

run_phase_reports_executing_after_started_execution_json() {
  local repo="$REPO_DIR/phase-started-execution"
  local output

  init_repo "$repo"
  install_full_contract_ready_artifacts "$repo"
  begin_started_execution_for_ready_plan "$repo"

  output="$(run_workflow "$repo" "phase started execution json" phase --json)"
  assert_contains "$output" '"phase":"executing"' "phase started execution json"
  assert_contains "$output" '"route_status":"implementation_ready"' "phase started execution json"
}

run_doctor_surfaces_invalid_contract_json() {
  local repo="$REPO_DIR/doctor-invalid-contract"
  local spec_path="$repo/docs/superpowers/specs/2026-03-22-doctor-invalid-contract-design.md"
  local plan_path="$repo/docs/superpowers/plans/2026-03-22-doctor-invalid-contract.md"
  local output

  init_repo "$repo"
  write_file "$spec_path" <<'EOF'
# Doctor Invalid Contract Spec

**Workflow State:** CEO Approved
**Spec Revision:** 1
**Last Reviewed By:** plan-ceo-review
EOF
  write_file "$plan_path" <<'EOF'
# Doctor Invalid Contract Plan

**Workflow State:** Engineering Approved
**Source Spec:** `docs/superpowers/specs/2026-03-22-doctor-invalid-contract-design.md`
**Source Spec Revision:** 1
**Last Reviewed By:** plan-eng-review
EOF

  output="$(run_workflow "$repo" "doctor invalid contract json" doctor --json)"
  assert_contains "$output" '"route_status":"plan_draft"' "doctor invalid contract json"
  assert_contains "$output" '"contract_state":"invalid"' "doctor invalid contract json"
  assert_json_equals "$output" "route.reason_codes.0" "missing_plan_revision" "doctor invalid contract json"
  assert_json_equals "$output" "route.diagnostics.0.code" "missing_plan_revision" "doctor invalid contract json"
}

run_doctor_surfaces_bounded_scan_json() {
  local repo="$REPO_DIR/doctor-bounded-scan"
  local older_spec="$repo/docs/superpowers/specs/2026-03-16-approved-design.md"
  local newest_spec="$repo/docs/superpowers/specs/2026-03-17-newest-draft-design.md"
  local output

  init_repo "$repo"
  write_file "$older_spec" <<'EOF'
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

  output="$(cd "$repo" && env SUPERPOWERS_WORKFLOW_STATUS_FALLBACK_LIMIT=1 "$WORKFLOW_BIN" doctor --json 2>&1)"
  assert_json_equals "$output" "route.scan_truncated" "true" "doctor bounded scan json"
  assert_json_equals "$output" "route.spec_candidate_count" "2" "doctor bounded scan json"
  assert_json_equals "$output" "route.plan_candidate_count" "0" "doctor bounded scan json"
}

run_doctor_surfaces_review_gate_details_json() {
  local repo="$REPO_DIR/doctor-review-blocked"
  local output

  init_repo "$repo"
  install_compact_full_contract_ready_artifacts "$repo"
  complete_compact_execution_plan "$repo"
  printf 'drift after completion\n' >> "$repo/docs/example-output.md"

  output="$(run_workflow "$repo" "doctor review blocked json" doctor --json)"
  assert_json_equals "$output" "phase" "review_blocked" "doctor review blocked json"
  assert_json_equals "$output" "gate_review.failure_class" "MissedReopenRequired" "doctor review blocked json"
  assert_json_equals "$output" "gate_review.reason_codes.0" "files_proven_drifted" "doctor review blocked json"
  assert_json_equals "$output" "gate_review.diagnostics.0.code" "files_proven_drifted" "doctor review blocked json"
}

run_doctor_surfaces_finish_gate_details_json() {
  local repo="$REPO_DIR/doctor-finish-blocked"
  local output

  init_repo "$repo"
  install_compact_full_contract_ready_artifacts "$repo"
  complete_compact_execution_plan "$repo"
  write_test_plan_artifact "$repo" "$COMPACT_PLAN_REL" no >/dev/null

  output="$(run_workflow "$repo" "doctor finish blocked json" doctor --json)"
  assert_json_equals "$output" "phase" "document_release_pending" "doctor finish blocked json"
  assert_json_equals "$output" "gate_finish.failure_class" "ReleaseArtifactNotFresh" "doctor finish blocked json"
  assert_json_equals "$output" "gate_finish.reason_codes.0" "release_artifact_missing" "doctor finish blocked json"
  assert_json_equals "$output" "gate_finish.diagnostics.0.code" "release_artifact_missing" "doctor finish blocked json"
}

run_doctor_surfaces_human_aggregates() {
  local repo="$REPO_DIR/doctor-human-aggregates"
  local output

  init_repo "$repo"
  install_compact_full_contract_ready_artifacts "$repo"
  complete_compact_execution_plan "$repo"
  printf 'drift after completion\n' >> "$repo/docs/example-output.md"

  output="$(run_workflow "$repo" "doctor human aggregates" doctor)"
  assert_contains "$output" "Route next skill:" "doctor human aggregates"
  assert_contains "$output" "Route reason codes:" "doctor human aggregates"
  assert_contains "$output" "Route diagnostics:" "doctor human aggregates"
  assert_contains "$output" "Scan truncated:" "doctor human aggregates"
  assert_contains "$output" "Manifest path:" "doctor human aggregates"
  assert_contains "$output" "Manifest source:" "doctor human aggregates"
  assert_contains "$output" "Repo root:" "doctor human aggregates"
  assert_contains "$output" "Contract state: valid" "doctor human aggregates"
  assert_contains "$output" 'Plan contract reason codes: []' "doctor human aggregates"
  assert_contains "$output" 'Plan contract diagnostics: []' "doctor human aggregates"
  assert_contains "$output" "Execution started: yes" "doctor human aggregates"
  assert_contains "$output" "Gate review allowed: false" "doctor human aggregates"
  assert_contains "$output" "Gate review failure: MissedReopenRequired" "doctor human aggregates"
}

run_doctor_surfaces_human_invalid_contract_values() {
  local repo="$REPO_DIR/doctor-human-invalid-contract"
  local spec_path="$repo/docs/superpowers/specs/2026-03-22-doctor-human-invalid-contract-design.md"
  local plan_path="$repo/docs/superpowers/plans/2026-03-22-doctor-human-invalid-contract.md"
  local output

  init_repo "$repo"
  mkdir -p "$(dirname "$spec_path")" "$(dirname "$plan_path")"
  cat > "$spec_path" <<'EOF_SPEC'
# Runtime Integration Hardening

**Workflow State:** CEO Approved
**Spec Revision:** 1
**Last Reviewed By:** plan-ceo-review

## Requirement Index
- [REQ-001][behavior] Preserve fail-closed workflow routing.
EOF_SPEC
  cat > "$plan_path" <<'EOF_PLAN'
# Runtime Integration Hardening

**Workflow State:** Draft
**Source Spec:** `docs/superpowers/specs/2026-03-22-doctor-human-invalid-contract-design.md`
**Source Spec Revision:** 1
**Plan Revision:**
**Execution Mode:** none
**Last Reviewed By:** writing-plans

## Requirement Coverage Matrix
| Requirement | Covered By | Notes |
| --- | --- | --- |
| REQ-001 | Task 1 | Maintains fail-closed routing. |

## Task 1: Example Task
**Spec Coverage:** REQ-001
**Files:** `bin/example`
**Validation:** `true`
**Task Outcome:** Example outcome
**Plan Constraints:** none
**Open Questions:** none
EOF_PLAN

  output="$(run_workflow "$repo" "doctor human invalid contract" doctor)"
  assert_contains "$output" 'Route reason codes: ["missing_plan_revision"]' "doctor human invalid contract"
  assert_contains "$output" 'Route diagnostics: [{"code":"missing_plan_revision"' "doctor human invalid contract"
}

run_doctor_surfaces_human_bounded_scan_values() {
  local repo="$REPO_DIR/doctor-human-bounded-scan"
  local output

  init_repo "$repo"
  mkdir -p "$repo/docs/superpowers/specs"
  cat > "$repo/docs/superpowers/specs/2026-03-22-alpha-design.md" <<'EOF_SPEC'
# Alpha

**Workflow State:** Draft
**Spec Revision:** 1
**Last Reviewed By:** brainstorming
EOF_SPEC
  cat > "$repo/docs/superpowers/specs/2026-03-22-beta-design.md" <<'EOF_SPEC'
# Beta

**Workflow State:** Draft
**Spec Revision:** 1
**Last Reviewed By:** brainstorming
EOF_SPEC

  output="$(cd "$repo" && env SUPERPOWERS_WORKFLOW_STATUS_FALLBACK_LIMIT=1 "$WORKFLOW_BIN" doctor 2>&1)"
  assert_contains "$output" "Scan truncated: true" "doctor human bounded scan"
  assert_contains "$output" "Spec candidates: 2" "doctor human bounded scan"
  assert_contains "$output" "Plan candidates: 0" "doctor human bounded scan"
}

run_doctor_requires_session_entry_before_normal_stack_json() {
  local repo="$REPO_DIR/doctor-needs-session-entry"
  local output

  init_repo "$repo"
  install_full_contract_ready_artifacts "$repo"

  output="$(cd "$repo" && env SUPERPOWERS_STATE_DIR="$STATE_DIR" SUPERPOWERS_SESSION_KEY="doctor-needs-session-entry" "$WORKFLOW_BIN" doctor --json 2>&1)"
  assert_json_equals "$output" "phase" "needs_user_choice" "doctor needs session entry json"
  assert_json_equals "$output" "route_status" "implementation_ready" "doctor needs session entry json"
  assert_json_equals "$output" "session_entry.outcome" "needs_user_choice" "doctor needs session entry json"
  assert_json_equals "$output" "plan_contract" "null" "doctor needs session entry json"
  assert_json_equals "$output" "preflight" "null" "doctor needs session entry json"
  assert_json_equals "$output" "gate_review" "null" "doctor needs session entry json"
  assert_json_equals "$output" "gate_finish" "null" "doctor needs session entry json"
}

run_handoff_reports_plan_and_recommendation_json() {
  local repo="$REPO_DIR/handoff-implementation-ready"
  init_repo "$repo"
  install_full_contract_ready_artifacts "$repo"

  local output
  output="$(run_workflow "$repo" "handoff implementation ready json" handoff --json)"
  assert_contains "$output" '"phase":"execution_preflight"' "handoff implementation ready json"
  assert_contains "$output" '"route_status":"implementation_ready"' "handoff implementation ready json"
  assert_contains "$output" '"contract_state":"valid"' "handoff implementation ready json"
  assert_contains "$output" '"plan_path":"docs/superpowers/plans/2026-03-22-runtime-integration-hardening.md"' "handoff implementation ready json"
  assert_contains "$output" '"next_action":"execution_preflight"' "handoff implementation ready json"
  assert_contains "$output" '"recommended_skill":"superpowers:executing-plans"' "handoff implementation ready json"
  assert_contains "$output" '"session_entry":{"outcome":"enabled"' "handoff implementation ready json"
}

run_handoff_blocks_unbuildable_packets_json() {
  local repo="$REPO_DIR/handoff-unbuildable-packets"
  local spec_path="$repo/docs/superpowers/specs/2026-03-22-handoff-unbuildable-design.md"
  local plan_path="$repo/docs/superpowers/plans/2026-03-22-handoff-unbuildable.md"
  local output

  init_repo "$repo"
  write_file "$spec_path" <<'EOF'
# Handoff Unbuildable Spec

**Workflow State:** CEO Approved
**Spec Revision:** 1
**Last Reviewed By:** plan-ceo-review

## Requirement Index

- [REQ-001][behavior] Public handoff must block when approved-plan packets are not buildable.
EOF
  write_file "$plan_path" <<'EOF'
# Handoff Unbuildable Plan

**Workflow State:** Engineering Approved
**Plan Revision:** 1
**Execution Mode:** none
**Source Spec:** `docs/superpowers/specs/2026-03-22-handoff-unbuildable-design.md`
**Source Spec Revision:** 1
**Last Reviewed By:** plan-eng-review

## Requirement Coverage Matrix

- REQ-001 -> Task 1

## Task 1: Break packet buildability

**Spec Coverage:** REQ-001
**Task Outcome:** The public handoff must refuse approved plans with malformed packet scope.
**Plan Constraints:**
- Keep the failure isolated to the Files block.
**Open Questions:** none

**Files:**
- Modify: docs/example-output.md

- [ ] **Step 1: Surface malformed packet scope**
EOF

  output="$(run_workflow "$repo" "handoff unbuildable packets json" handoff --json)"
  assert_contains "$output" '"phase":"plan_review"' "handoff unbuildable packets json"
  assert_contains "$output" '"route_status":"plan_draft"' "handoff unbuildable packets json"
  assert_contains "$output" '"contract_state":"invalid"' "handoff unbuildable packets json"
  assert_contains "$output" '"next_action":"use_next_skill"' "handoff unbuildable packets json"
  assert_contains "$output" '"recommended_skill":""' "handoff unbuildable packets json"
  assert_contains "$output" '"next_skill":"superpowers:plan-eng-review"' "handoff unbuildable packets json"
  assert_contains "$output" '"code":"malformed_files_block"' "handoff unbuildable packets json"
}

run_handoff_blocks_packet_buildability_failures_json() {
  local repo="$REPO_DIR/handoff-packet-buildability-failure"
  local tool_dir
  local output

  init_repo "$repo"
  install_full_contract_ready_artifacts "$repo"
  tool_dir="$(create_workflow_bin_with_plan_contract_stub '{"contract_state":"valid","task_count":2,"packet_buildable_tasks":1,"reason_codes":[],"diagnostics":[]}')"

  output="$(cd "$repo" && "$tool_dir/superpowers-workflow" handoff --json 2>&1)"
  assert_contains "$output" '"phase":"plan_review"' "handoff packet buildability failure json"
  assert_contains "$output" '"route_status":"plan_draft"' "handoff packet buildability failure json"
  assert_contains "$output" '"contract_state":"invalid"' "handoff packet buildability failure json"
  assert_contains "$output" '"next_action":"use_next_skill"' "handoff packet buildability failure json"
  assert_contains "$output" '"recommended_skill":""' "handoff packet buildability failure json"
  assert_contains "$output" '"next_skill":"superpowers:plan-eng-review"' "handoff packet buildability failure json"
  assert_contains "$output" '"code":"packet_buildability_failure"' "handoff packet buildability failure json"
}

run_handoff_preserves_execution_status_failure_json() {
  local repo="$REPO_DIR/handoff-malformed-execution-status"
  local output
  local plan_path="$repo/docs/superpowers/plans/2026-03-22-runtime-integration-hardening.md"

  init_repo "$repo"
  install_full_contract_ready_artifacts "$repo"
  begin_started_execution_for_ready_plan "$repo"
  duplicate_active_execution_note "$plan_path"

  output="$(run_workflow_fails_json "$repo" "handoff malformed execution status json" handoff --json)"
  assert_json_equals "$output" "outcome" "runtime_failure" "handoff malformed execution status json"
  assert_json_equals "$output" "failure_class" "WrappedHelperFailure" "handoff malformed execution status json"
  assert_json_equals "$output" "helper_failure_class" "MalformedExecutionState" "handoff malformed execution status json"
  assert_json_nonempty "$output" "message" "handoff malformed execution status json"
}

run_handoff_requires_session_entry_before_recommendation_json() {
  local repo="$REPO_DIR/handoff-needs-session-entry"
  local output

  init_repo "$repo"
  install_full_contract_ready_artifacts "$repo"

  output="$(cd "$repo" && env SUPERPOWERS_STATE_DIR="$STATE_DIR" SUPERPOWERS_SESSION_KEY="handoff-needs-session-entry" "$WORKFLOW_BIN" handoff --json 2>&1)"
  assert_json_equals "$output" "phase" "needs_user_choice" "handoff needs session entry json"
  assert_json_equals "$output" "route_status" "implementation_ready" "handoff needs session entry json"
  assert_json_equals "$output" "next_action" "session_entry_gate" "handoff needs session entry json"
  assert_json_equals "$output" "session_entry.outcome" "needs_user_choice" "handoff needs session entry json"
  assert_json_equals "$output" "contract_state" "valid" "handoff needs session entry json"
  assert_json_equals "$output" "plan_contract" "null" "handoff needs session entry json"
  assert_json_equals "$output" "recommendation" "null" "handoff needs session entry json"
  assert_json_equals "$output" "recommended_skill" "" "handoff needs session entry json"
}

run_handoff_routes_to_safe_stage_before_execution_json() {
  local repo="$REPO_DIR/handoff-plan-review"
  local spec_path="$repo/docs/superpowers/specs/2026-03-22-handoff-plan-review-design.md"
  local plan_path="$repo/docs/superpowers/plans/2026-03-22-handoff-plan-review.md"
  local output

  init_repo "$repo"
  write_file "$spec_path" <<'EOF'
# Handoff Plan Review Design

**Workflow State:** CEO Approved
**Spec Revision:** 1
**Last Reviewed By:** plan-ceo-review

## Requirement Index

- [REQ-001][behavior] Draft plans must route back to engineering review.
EOF
  write_file "$plan_path" <<'EOF'
# Handoff Plan Review

**Workflow State:** Draft
**Plan Revision:** 1
**Execution Mode:** superpowers:executing-plans
**Source Spec:** `docs/superpowers/specs/2026-03-22-handoff-plan-review-design.md`
**Source Spec Revision:** 1
**Last Reviewed By:** writing-plans
EOF

  output="$(run_workflow "$repo" "handoff plan review json" handoff --json)"
  assert_contains "$output" '"phase":"plan_review"' "handoff plan review json"
  assert_contains "$output" '"route_status":"plan_draft"' "handoff plan review json"
  assert_contains "$output" '"next_action":"use_next_skill"' "handoff plan review json"
  assert_not_contains "$output" '"next_action":"return_to_execution"' "handoff plan review json"
}

run_handoff_returns_to_current_execution_after_started_execution_json() {
  local repo="$REPO_DIR/handoff-started-execution"
  local output

  init_repo "$repo"
  install_full_contract_ready_artifacts "$repo"
  begin_started_execution_for_ready_plan "$repo"

  output="$(run_workflow "$repo" "handoff started execution json" handoff --json)"
  assert_contains "$output" '"phase":"executing"' "handoff started execution json"
  assert_contains "$output" '"execution_started":"yes"' "handoff started execution json"
  assert_contains "$output" '"next_action":"return_to_execution"' "handoff started execution json"
  assert_contains "$output" '"recommended_skill":"superpowers:executing-plans"' "handoff started execution json"
  assert_contains "$output" '"recommendation_reason":"Execution already started for the approved plan revision; continue with the current execution flow."' "handoff started execution json"
}

run_next_routes_to_requesting_code_review_after_review_block() {
  local repo="$REPO_DIR/next-review-blocked"
  local output

  init_repo "$repo"
  install_compact_full_contract_ready_artifacts "$repo"
  complete_compact_execution_plan "$repo"
  printf 'drift after completion\n' >> "$repo/docs/example-output.md"

  output="$(run_workflow "$repo" "next review blocked" next)"
  assert_contains "$output" "superpowers:requesting-code-review" "next review blocked"
  assert_contains "$output" "Execution finished, but the final review gate is not yet satisfied." "next review blocked"
}

run_phase_reports_qa_pending_after_finished_execution_json() {
  local repo="$REPO_DIR/phase-qa-pending"
  local output

  init_repo "$repo"
  install_compact_full_contract_ready_artifacts "$repo"
  complete_compact_execution_plan "$repo"
  write_test_plan_artifact "$repo" "$COMPACT_PLAN_REL" yes >/dev/null

  output="$(run_workflow "$repo" "phase qa pending json" phase --json)"
  assert_contains "$output" '"phase":"qa_pending"' "phase qa pending json"
}

run_phase_reports_document_release_pending_after_finished_execution_json() {
  local repo="$REPO_DIR/phase-document-release-pending"
  local output

  init_repo "$repo"
  install_compact_full_contract_ready_artifacts "$repo"
  complete_compact_execution_plan "$repo"
  write_test_plan_artifact "$repo" "$COMPACT_PLAN_REL" no >/dev/null

  output="$(run_workflow "$repo" "phase document release pending json" phase --json)"
  assert_contains "$output" '"phase":"document_release_pending"' "phase document release pending json"
}

run_handoff_routes_to_branch_finish_after_finish_ready_json() {
  local repo="$REPO_DIR/handoff-finish-ready"
  local test_plan_path output

  init_repo "$repo"
  install_compact_full_contract_ready_artifacts "$repo"
  complete_compact_execution_plan "$repo"
  test_plan_path="$(write_test_plan_artifact "$repo" "$COMPACT_PLAN_REL" yes)"
  write_qa_result_artifact "$repo" "$COMPACT_PLAN_REL" "$test_plan_path" pass
  write_release_readiness_artifact "$repo" "$COMPACT_PLAN_REL" pass

  output="$(run_workflow "$repo" "handoff finish ready json" handoff --json)"
  assert_contains "$output" '"phase":"ready_for_branch_completion"' "handoff finish ready json"
  assert_contains "$output" '"next_action":"finish_branch"' "handoff finish ready json"
}

run_preflight_wraps_execution_helper_json() {
  local repo="$REPO_DIR/workflow-preflight"
  init_repo "$repo"
  install_full_contract_ready_artifacts "$repo"

  local output
  output="$(run_workflow "$repo" "workflow preflight json" preflight --plan docs/superpowers/plans/2026-03-22-runtime-integration-hardening.md --json)"
  assert_contains "$output" '"allowed":true' "workflow preflight json"
  assert_json_equals "$output" "reason_codes" "[]" "workflow preflight json"
  assert_json_equals "$output" "diagnostics" "[]" "workflow preflight json"
}

run_gate_review_wraps_execution_helper_json() {
  local repo="$REPO_DIR/workflow-gate-review"
  init_repo "$repo"
  install_full_contract_ready_artifacts "$repo"

  local output
  output="$(run_workflow "$repo" "workflow gate review json" gate review --plan docs/superpowers/plans/2026-03-22-runtime-integration-hardening.md --json)"
  assert_contains "$output" '"allowed":false' "workflow gate review json"
  assert_contains "$output" '"failure_class":"ExecutionStateNotReady"' "workflow gate review json"
  assert_contains "$output" '"reason_codes":["unfinished_steps_remaining"]' "workflow gate review json"
  assert_json_equals "$output" "diagnostics.0.code" "unfinished_steps_remaining" "workflow gate review json"
}

run_gate_finish_blocks_missing_release_artifact_json() {
  local repo="$REPO_DIR/workflow-gate-finish"
  init_repo "$repo"
  install_compact_full_contract_ready_artifacts "$repo"
  complete_compact_execution_plan "$repo"
  write_test_plan_artifact "$repo" "$COMPACT_PLAN_REL" no >/dev/null

  local output
  output="$(run_workflow "$repo" "workflow gate finish json" gate finish --plan "$COMPACT_PLAN_REL" --json)"
  assert_contains "$output" '"allowed":false' "workflow gate finish json"
  assert_contains "$output" '"failure_class":"ReleaseArtifactNotFresh"' "workflow gate finish json"
  assert_contains "$output" '"reason_codes":["release_artifact_missing"]' "workflow gate finish json"
  assert_json_equals "$output" "diagnostics.0.code" "release_artifact_missing" "workflow gate finish json"
}

run_artifacts_empty() {
  local repo="$REPO_DIR/artifacts-empty"
  init_repo "$repo"
  local output
  output="$(run_workflow "$repo" "artifacts empty" artifacts)"
  assert_contains "$output" "Workflow artifacts" "artifacts empty"
  assert_contains "$output" "- Spec: none" "artifacts empty"
  assert_contains "$output" "- Plan: none" "artifacts empty"
}

run_artifacts_expected_missing_plan() {
  local repo="$REPO_DIR/artifacts-expected-missing-plan"
  local missing_plan="docs/superpowers/plans/2026-03-18-missing-plan.md"
  init_repo "$repo"
  write_file "$repo/docs/superpowers/specs/2026-03-18-approved-for-missing-plan.md" <<'EOF'
# Approved Spec For Missing Plan

**Workflow State:** CEO Approved
**Spec Revision:** 1
**Last Reviewed By:** plan-ceo-review
EOF
  (cd "$repo" && "$STATUS_BIN" expect --artifact plan --path "$missing_plan" >/dev/null 2>&1)

  local output
  output="$(run_workflow "$repo" "artifacts expected missing plan" artifacts)"
  assert_contains "$output" "- Spec: docs/superpowers/specs/2026-03-18-approved-for-missing-plan.md (from repo docs)" "artifacts expected missing plan"
  assert_contains "$output" "- Plan: ${missing_plan} (expected, missing)" "artifacts expected missing plan"
}

run_artifacts_from_subdir_uses_repo_root() {
  local repo="$REPO_DIR/artifacts-from-subdir"
  init_repo "$repo"
  write_file "$repo/docs/superpowers/specs/2026-03-18-subdir-spec.md" <<'EOF'
# Subdir Spec

**Workflow State:** Draft
**Spec Revision:** 1
**Last Reviewed By:** brainstorming
EOF
  mkdir -p "$repo/subdir"

  local output
  output="$(cd "$repo/subdir" && "$WORKFLOW_BIN" artifacts 2>&1)"
  assert_contains "$output" "- Spec: docs/superpowers/specs/2026-03-18-subdir-spec.md (from repo docs)" "artifacts from subdir"
  assert_not_contains "$output" "(expected, missing)" "artifacts from subdir"
}

run_explain_uses_stable_rerun_command() {
  local repo="$REPO_DIR/explain-stable-rerun"
  init_repo "$repo"
  local output
  output="$(run_workflow "$repo" "explain stable rerun" explain)"
  assert_contains "$output" "2. Re-run: superpowers-workflow status" "explain stable rerun"
}

run_explain_ambiguity() {
  local repo="$REPO_DIR/explain-ambiguity"
  init_repo "$repo"
  write_file "$repo/docs/superpowers/specs/2026-03-18-spec-a.md" <<'EOF'
# Spec A

**Workflow State:** Draft
**Spec Revision:** 1
**Last Reviewed By:** brainstorming
EOF
  write_file "$repo/docs/superpowers/specs/2026-03-18-spec-b.md" <<'EOF'
# Spec B

**Workflow State:** CEO Approved
**Spec Revision:** 1
**Last Reviewed By:** plan-ceo-review
EOF

  local output
  output="$(run_workflow "$repo" "explain ambiguity" explain)"
  assert_contains "$output" "Why Superpowers chose this state" "explain ambiguity"
  assert_contains "$output" "multiple plausible specs" "explain ambiguity"
}

run_explain_ambiguous_plan() {
  local repo="$REPO_DIR/explain-ambiguous-plan"
  local spec_rel="docs/superpowers/specs/2026-03-18-ambiguous-plan-spec.md"
  local plan_a="$repo/docs/superpowers/plans/2026-03-18-plan-a.md"
  local plan_b="$repo/docs/superpowers/plans/2026-03-18-plan-b.md"
  init_repo "$repo"
  copy_fixture \
    "$WORKFLOW_FIXTURE_DIR/specs/2026-03-22-runtime-integration-hardening-design.md" \
    "$repo/$spec_rel"
  copy_fixture \
    "$WORKFLOW_FIXTURE_DIR/plans/2026-03-22-runtime-integration-hardening.md" \
    "$plan_a"
  copy_fixture \
    "$WORKFLOW_FIXTURE_DIR/plans/2026-03-22-runtime-integration-hardening.md" \
    "$plan_b"
  node - "$plan_a" "$plan_b" "$spec_rel" <<'NODE'
const fs = require("fs");
const [planA, planB, specRel] = process.argv.slice(2);
for (const file of [planA, planB]) {
  const source = fs.readFileSync(file, "utf8");
  fs.writeFileSync(
    file,
    source.replace(
      "tests/codex-runtime/fixtures/workflow-artifacts/specs/2026-03-22-runtime-integration-hardening-design.md",
      specRel,
    ),
  );
}
NODE

  local output
  output="$(run_workflow "$repo" "explain ambiguous plan" explain)"
  assert_contains "$output" "multiple plausible plans" "explain ambiguous plan"
  assert_contains "$output" "Use superpowers:writing-plans" "explain ambiguous plan"
}

run_explain_malformed_spec() {
  local repo="$REPO_DIR/explain-malformed-spec"
  init_repo "$repo"
  write_file "$repo/docs/superpowers/specs/2026-03-18-malformed-spec.md" <<'EOF'
# Malformed Spec

**Workflow State:** CEO Approved
**Last Reviewed By:** plan-ceo-review
EOF

  local output
  output="$(run_workflow "$repo" "explain malformed spec" explain)"
  assert_contains "$output" "current spec headers are missing or malformed" "explain malformed spec"
  assert_contains "$output" "Use superpowers:plan-ceo-review" "explain malformed spec"
}

run_explain_malformed_plan() {
  local repo="$REPO_DIR/explain-malformed-plan"
  init_repo "$repo"
  write_file "$repo/docs/superpowers/specs/2026-03-18-malformed-plan-spec.md" <<'EOF'
# Approved Spec

**Workflow State:** CEO Approved
**Spec Revision:** 1
**Last Reviewed By:** plan-ceo-review
EOF
  write_file "$repo/docs/superpowers/plans/2026-03-18-malformed-plan.md" <<'EOF'
# Malformed Plan

**Workflow State:** Engineering Approved
**Source Spec:** `docs/superpowers/specs/2026-03-18-malformed-plan-spec.md`
**Last Reviewed By:** plan-eng-review
EOF

  local output
  output="$(run_workflow "$repo" "explain malformed plan" explain)"
  assert_contains "$output" "current plan headers are missing or malformed" "explain malformed plan"
  assert_contains "$output" "Use superpowers:plan-eng-review" "explain malformed plan"
}

run_status_missing_expected_spec() {
  local repo="$REPO_DIR/status-missing-expected-spec"
  local missing_spec="docs/superpowers/specs/2026-03-18-missing-spec.md"
  init_repo "$repo"
  (cd "$repo" && "$STATUS_BIN" expect --artifact spec --path "$missing_spec" >/dev/null 2>&1)

  local output
  output="$(run_workflow "$repo" "status missing expected spec" status)"
  assert_contains "$output" "Workflow status: Brainstorming needed" "status missing expected spec"
  assert_contains "$output" "Why: A previously expected spec is missing." "status missing expected spec"
  assert_contains "$output" "Spec: ${missing_spec}" "status missing expected spec"
}

run_status_missing_expected_plan() {
  local repo="$REPO_DIR/status-missing-expected-plan"
  local missing_plan="docs/superpowers/plans/2026-03-18-missing-plan.md"
  init_repo "$repo"
  write_file "$repo/docs/superpowers/specs/2026-03-18-approved-with-missing-plan.md" <<'EOF'
# Approved Spec

**Workflow State:** CEO Approved
**Spec Revision:** 1
**Last Reviewed By:** plan-ceo-review
EOF
  (cd "$repo" && "$STATUS_BIN" expect --artifact plan --path "$missing_plan" >/dev/null 2>&1)

  local output
  output="$(run_workflow "$repo" "status missing expected plan" status)"
  assert_contains "$output" "Workflow status: Plan writing needed" "status missing expected plan"
  assert_contains "$output" "Why: A previously expected plan is missing." "status missing expected plan"
  assert_contains "$output" "Plan: ${missing_plan}" "status missing expected plan"
}

run_status_repo_root_mismatch() {
  local repo_old="$REPO_DIR/repo-root-mismatch-old"
  local repo_new="$REPO_DIR/repo-root-mismatch-new"
  local manifest_path before_snapshot="$REPO_DIR/repo-root-mismatch-before.json"
  init_repo "$repo_old" "https://example.com/example/workflow-cli-root-mismatch.git"
  write_file "$repo_old/docs/superpowers/specs/2026-03-18-root-mismatch.md" <<'EOF'
# Root Mismatch Spec

**Workflow State:** Draft
**Spec Revision:** 1
**Last Reviewed By:** brainstorming
EOF
  (cd "$repo_old" && "$STATUS_BIN" status --refresh >/dev/null 2>&1)
  manifest_path="$(manifest_path_for_branch "$repo_old")"
  snapshot_if_exists "$manifest_path" "$before_snapshot"

  mv "$repo_old" "$repo_new"

  local output
  output="$(run_workflow "$repo_new" "status repo root mismatch" status)"
  assert_contains "$output" "Why: The local workflow manifest belongs to a different checkout path." "status repo root mismatch"
  assert_same_bytes "$before_snapshot" "$manifest_path" "repo root mismatch manifest"
}

run_status_branch_mismatch() {
  local repo="$REPO_DIR/status-branch-mismatch"
  local manifest_path expected_snapshot="$REPO_DIR/branch-mismatch-expected.json"
  local branch
  init_repo "$repo" "https://example.com/example/workflow-cli-branch-mismatch.git"
  write_file "$repo/docs/superpowers/specs/2026-03-18-branch-mismatch.md" <<'EOF'
# Branch Mismatch Spec

**Workflow State:** Draft
**Spec Revision:** 1
**Last Reviewed By:** brainstorming
EOF
  (cd "$repo" && "$STATUS_BIN" status --refresh >/dev/null 2>&1)
  manifest_path="$(manifest_path_for_branch "$repo")"
  branch="$(git -C "$repo" rev-parse --abbrev-ref HEAD)"
  sed "s/\"branch\":\"${branch}\"/\"branch\":\"other-branch\"/" "$manifest_path" > "$expected_snapshot"
  cp "$expected_snapshot" "$manifest_path"

  local output
  output="$(run_workflow "$repo" "status branch mismatch" status)"
  assert_contains "$output" "Why: The local workflow manifest belongs to a different branch." "status branch mismatch"
  assert_same_bytes "$expected_snapshot" "$manifest_path" "branch mismatch manifest"
}

run_explain_prior_manifest_recovery() {
  local repo="$REPO_DIR/explain-prior-manifest-recovery"
  local missing_plan="docs/superpowers/plans/2026-03-18-recovered-plan.md"
  local old_manifest new_manifest
  init_repo "$repo" "https://example.com/example/workflow-cli-old-slug.git"
  write_file "$repo/docs/superpowers/specs/2026-03-18-recovered-spec.md" <<'EOF'
# Recovered Spec

**Workflow State:** CEO Approved
**Spec Revision:** 1
**Last Reviewed By:** plan-ceo-review
EOF
  (cd "$repo" && "$STATUS_BIN" expect --artifact plan --path "$missing_plan" >/dev/null 2>&1)
  old_manifest="$(manifest_path_for_branch "$repo")"

  git -C "$repo" remote set-url origin "https://example.com/example/workflow-cli-new-slug.git"
  new_manifest="$(manifest_path_for_branch "$repo")"

  local output
  output="$(run_workflow "$repo" "explain prior manifest recovery" explain)"
  assert_contains "$output" "recovered matching prior manifest state from an older repo slug" "explain prior manifest recovery"
  assert_contains "$output" "Plan: ${missing_plan}" "explain prior manifest recovery"
  if [[ -e "$new_manifest" ]]; then
    echo "Expected read-only public CLI to avoid writing a recovered manifest at the new slug path"
    echo "old: $old_manifest"
    echo "new: $new_manifest"
    exit 1
  fi
}

run_explain_corrupt_manifest() {
  local repo="$REPO_DIR/explain-corrupt-manifest"
  local manifest_path before_snapshot="$REPO_DIR/corrupt-manifest-before.json"
  init_repo "$repo"
  write_file "$repo/docs/superpowers/specs/2026-03-18-corrupt-manifest-spec.md" <<'EOF'
# Corrupt Manifest Spec

**Workflow State:** Draft
**Spec Revision:** 1
**Last Reviewed By:** brainstorming
EOF
  (cd "$repo" && "$STATUS_BIN" status --refresh >/dev/null 2>&1)
  manifest_path="$(manifest_path_for_branch "$repo")"
  printf '%s\n' '{ "broken": true' > "$manifest_path"
  snapshot_if_exists "$manifest_path" "$before_snapshot"

  local output
  output="$(run_workflow "$repo" "explain corrupt manifest" explain)"
  assert_contains "$output" "local workflow manifest is corrupt" "explain corrupt manifest"
  assert_same_bytes "$before_snapshot" "$manifest_path" "corrupt manifest explain"
}

run_outside_repo_status_failure() {
  local outside_repo="$REPO_DIR/outside-repo"
  mkdir -p "$outside_repo"
  run_workflow_fails "$outside_repo" "outside repo status" "Read-only workflow resolution requires a git repo" status >/dev/null
}

run_invalid_command_failure() {
  local repo="$REPO_DIR/invalid-command"
  init_repo "$repo"
  run_workflow_fails "$repo" "invalid command" "Unsupported command" nonsense >/dev/null
}

run_debug_failure_class() {
  local repo="$REPO_DIR/debug-failure"
  init_repo "$repo"
  local output
  local status=0
  output="$(cd "$repo" && env SUPERPOWERS_WORKFLOW_RESOLVE_TEST_FAILPOINT=runtime_failure "$WORKFLOW_BIN" status --debug 2>&1)" || status=$?
  if [[ $status -eq 0 ]]; then
    echo "Expected debug failure-class scenario to fail"
    printf '%s\n' "$output"
    exit 1
  fi
  assert_contains "$output" "Workflow inspection failed:" "debug failure-class output"
  assert_contains "$output" "Helper failure: ResolverRuntimeFailure" "debug failure-class output"
  assert_contains "$output" "failure_class=WrappedHelperFailure" "debug failure-class output"
}

run_no_manifest_creation() {
  local repo="$REPO_DIR/no-manifest-creation"
  local manifest_path
  init_repo "$repo"
  manifest_path="$(manifest_path_for_branch "$repo")"

  if [[ -e "$manifest_path" ]]; then
    echo "Expected no manifest before running public status"
    exit 1
  fi

  run_workflow "$repo" "no manifest creation" status >/dev/null

  if [[ -e "$manifest_path" ]]; then
    echo "Expected public status command to avoid creating a manifest"
    exit 1
  fi
}

run_corrupt_manifest_no_backup() {
  local repo="$REPO_DIR/corrupt-manifest"
  local manifest_path
  local before_snapshot="$REPO_DIR/corrupt-before.json"
  init_repo "$repo"
  manifest_path="$(manifest_path_for_branch "$repo")"
  mkdir -p "$(dirname "$manifest_path")"
  printf '%s\n' '{ "broken": true' > "$manifest_path"
  snapshot_if_exists "$manifest_path" "$before_snapshot"

  run_workflow "$repo" "corrupt manifest no backup" status >/dev/null

  assert_same_bytes "$before_snapshot" "$manifest_path" "corrupt manifest"
  if compgen -G "${manifest_path}.corrupt-*" >/dev/null; then
    echo "Expected public CLI to avoid writing corrupt manifest backups"
    exit 1
  fi
}

run_existing_manifest_unchanged() {
  local repo="$REPO_DIR/existing-manifest"
  local manifest_path
  local before_snapshot="$REPO_DIR/existing-before.json"
  init_repo "$repo"
  write_file "$repo/docs/superpowers/specs/2026-03-18-existing-spec.md" <<'EOF'
# Existing Spec

**Workflow State:** Draft
**Spec Revision:** 1
**Last Reviewed By:** brainstorming
EOF

  (cd "$repo" && "$STATUS_BIN" status --refresh >/dev/null 2>&1) || true
  manifest_path="$(manifest_path_for_branch "$repo")"
  snapshot_if_exists "$manifest_path" "$before_snapshot"

  run_workflow "$repo" "existing manifest unchanged" artifacts >/dev/null
  assert_same_bytes "$before_snapshot" "$manifest_path" "existing manifest"
}

run_repo_docs_unchanged() {
  local repo="$REPO_DIR/repo-docs-unchanged"
  local spec_path="$repo/docs/superpowers/specs/2026-03-18-red-spec.md"
  local spec_snapshot="$REPO_DIR/repo-docs-before.md"
  init_repo "$repo"
  write_file "$spec_path" <<'EOF'
# Red Spec

**Workflow State:** Draft
**Spec Revision:** 1
**Last Reviewed By:** brainstorming
EOF
  snapshot_if_exists "$spec_path" "$spec_snapshot"

  run_workflow "$repo" "repo docs unchanged" explain >/dev/null
  assert_same_bytes "$spec_snapshot" "$spec_path" "repo-tracked spec"
}

run_phase_json_stays_fast() {
  local repo="$REPO_DIR/phase-fast"
  local output

  init_repo "$repo"
  install_full_contract_ready_artifacts "$repo"

  if ! (cd "$repo" && "$WORKFLOW_BIN" phase --json >/dev/null 2>&1); then
    echo "Expected command to succeed for: phase json warmup"
    exit 1
  fi
  output="$(run_workflow_with_timeout "$repo" "phase json stays fast" 2 phase --json)"
  assert_json_equals "$output" "phase" "execution_preflight" "phase json fast output"
  assert_json_equals "$output" "route_status" "implementation_ready" "phase json fast output"
}

run_repo_phase_json_stays_fast() {
  local output

  (cd "$REPO_ROOT" && "$STATUS_BIN" expect --artifact spec --path docs/superpowers/specs/2026-03-22-runtime-integration-hardening-design.md >/dev/null 2>&1)
  (cd "$REPO_ROOT" && "$STATUS_BIN" expect --artifact plan --path docs/superpowers/plans/2026-03-22-runtime-integration-hardening.md >/dev/null 2>&1)
  if ! (cd "$REPO_ROOT" && "$WORKFLOW_BIN" phase --json >/dev/null 2>&1); then
    echo "Expected command to succeed for: repo phase json warmup"
    exit 1
  fi
  output="$(run_workflow_with_timeout "$REPO_ROOT" "repo phase json stays fast" 2 phase --json)"
  assert_json_nonempty "$output" "phase" "repo phase json fast output"
  assert_json_not_equals "$output" "phase" "implementation_ready" "repo phase json fast output"
  assert_json_equals "$output" "route_status" "implementation_ready" "repo phase json fast output"
}

require_helpers

run_help_outside_repo
run_status_bootstrap_no_docs
run_phase_reports_needs_brainstorming_json
run_status_draft_spec
run_status_approved_spec_no_plan
run_status_implementation_ready_points_to_execution_preflight
run_next_draft_plan
run_status_stale_plan
run_phase_routes_stale_plan_to_plan_writing_json
run_next_implementation_ready
run_next_returns_to_current_execution_after_started_execution
run_phase_reports_execution_preflight_json
run_phase_reports_implementation_handoff_when_preflight_blocked_json
run_phase_reports_needs_user_choice_when_session_unresolved_json
run_phase_wraps_resolve_failure_json
run_phase_wraps_session_entry_failure_json
run_phase_reports_executing_after_started_execution_json
run_doctor_surfaces_invalid_contract_json
run_doctor_surfaces_bounded_scan_json
run_doctor_surfaces_review_gate_details_json
run_doctor_surfaces_finish_gate_details_json
run_doctor_surfaces_human_aggregates
run_doctor_surfaces_human_invalid_contract_values
run_doctor_surfaces_human_bounded_scan_values
run_doctor_requires_session_entry_before_normal_stack_json
run_handoff_reports_plan_and_recommendation_json
run_handoff_blocks_unbuildable_packets_json
run_handoff_blocks_packet_buildability_failures_json
run_handoff_preserves_execution_status_failure_json
run_handoff_requires_session_entry_before_recommendation_json
run_handoff_routes_to_safe_stage_before_execution_json
run_handoff_returns_to_current_execution_after_started_execution_json
run_next_routes_to_requesting_code_review_after_review_block
run_phase_reports_qa_pending_after_finished_execution_json
run_phase_reports_document_release_pending_after_finished_execution_json
run_handoff_routes_to_branch_finish_after_finish_ready_json
run_preflight_wraps_execution_helper_json
run_gate_review_wraps_execution_helper_json
run_gate_finish_blocks_missing_release_artifact_json
run_artifacts_empty
run_artifacts_expected_missing_plan
run_artifacts_from_subdir_uses_repo_root
run_explain_uses_stable_rerun_command
run_explain_ambiguity
run_explain_ambiguous_plan
run_explain_implementation_ready_points_to_execution_preflight
run_explain_malformed_spec
run_explain_malformed_plan
run_status_missing_expected_spec
run_status_missing_expected_plan
run_status_repo_root_mismatch
run_status_branch_mismatch
run_explain_prior_manifest_recovery
run_explain_corrupt_manifest
run_outside_repo_status_failure
run_invalid_command_failure
run_debug_failure_class
run_no_manifest_creation
run_corrupt_manifest_no_backup
run_existing_manifest_unchanged
run_repo_docs_unchanged
run_phase_json_stays_fast
run_repo_phase_json_stays_fast

echo "superpowers-workflow regression scaffold passed."
