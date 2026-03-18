#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
WORKFLOW_BIN="$REPO_ROOT/bin/superpowers-workflow"
STATUS_BIN="$REPO_ROOT/bin/superpowers-workflow-status"
WORKFLOW_FIXTURE_DIR="$REPO_ROOT/tests/codex-runtime/fixtures/workflow-artifacts"
STATE_DIR="$(mktemp -d)"
REPO_DIR="$(mktemp -d)"
trap 'rm -rf "$STATE_DIR" "$REPO_DIR"' EXIT
export SUPERPOWERS_STATE_DIR="$STATE_DIR"

USER_NAME="$(whoami 2>/dev/null || echo user)"

require_helpers() {
  if [[ ! -x "$WORKFLOW_BIN" ]]; then
    echo "Expected workflow CLI to exist and be executable: $WORKFLOW_BIN"
    exit 1
  fi
  if [[ ! -x "$STATUS_BIN" ]]; then
    echo "Expected internal workflow helper to exist and be executable: $STATUS_BIN"
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
EOF
  write_file "$repo/docs/superpowers/plans/2026-03-18-stale-plan.md" <<'EOF'
# Stale Plan

**Workflow State:** Engineering Approved
**Source Spec:** `docs/superpowers/specs/2026-03-18-stale-spec.md`
**Source Spec Revision:** 1
**Last Reviewed By:** plan-eng-review
EOF

  local output
  output="$(run_workflow "$repo" "status stale plan" status)"
  assert_contains "$output" "Workflow status: Plan update needed" "status stale plan"
  assert_contains "$output" "Next: Use superpowers:writing-plans" "status stale plan"
  assert_contains "$output" "Plan: docs/superpowers/plans/2026-03-18-stale-plan.md" "status stale plan"
}

run_next_implementation_ready() {
  local repo="$REPO_DIR/next-implementation-ready"
  init_repo "$repo"
  write_file "$repo/docs/superpowers/specs/2026-03-18-ready-spec.md" <<'EOF'
# Ready Spec

**Workflow State:** CEO Approved
**Spec Revision:** 2
**Last Reviewed By:** plan-ceo-review
EOF
  write_file "$repo/docs/superpowers/plans/2026-03-18-ready-plan.md" <<'EOF'
# Ready Plan

**Workflow State:** Engineering Approved
**Source Spec:** `docs/superpowers/specs/2026-03-18-ready-spec.md`
**Source Spec Revision:** 2
**Last Reviewed By:** plan-eng-review
EOF

  local output
  output="$(run_workflow "$repo" "next implementation ready" next)"
  assert_contains "$output" "Next safe step: Use the approved plan for execution handoff:" "next implementation ready"
  assert_contains "$output" "docs/superpowers/plans/2026-03-18-ready-plan.md" "next implementation ready"
  assert_not_contains "$output" "recommend" "next implementation ready"
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
  init_repo "$repo"
  write_file "$repo/docs/superpowers/specs/2026-03-18-ambiguous-plan-spec.md" <<'EOF'
# Ambiguous Plan Spec

**Workflow State:** CEO Approved
**Spec Revision:** 1
**Last Reviewed By:** plan-ceo-review
EOF
  write_file "$repo/docs/superpowers/plans/2026-03-18-plan-a.md" <<'EOF'
# Plan A

**Workflow State:** Draft
**Source Spec:** `docs/superpowers/specs/2026-03-18-ambiguous-plan-spec.md`
**Source Spec Revision:** 1
**Last Reviewed By:** writing-plans
EOF
  write_file "$repo/docs/superpowers/plans/2026-03-18-plan-b.md" <<'EOF'
# Plan B

**Workflow State:** Engineering Approved
**Source Spec:** `docs/superpowers/specs/2026-03-18-ambiguous-plan-spec.md`
**Source Spec Revision:** 1
**Last Reviewed By:** plan-eng-review
EOF

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
  assert_contains "$output" "failure_class=ResolverRuntimeFailure" "debug failure-class output"
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

require_helpers

run_help_outside_repo
run_status_bootstrap_no_docs
run_status_draft_spec
run_status_approved_spec_no_plan
run_next_draft_plan
run_status_stale_plan
run_next_implementation_ready
run_artifacts_empty
run_artifacts_expected_missing_plan
run_artifacts_from_subdir_uses_repo_root
run_explain_uses_stable_rerun_command
run_explain_ambiguity
run_explain_ambiguous_plan
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

echo "superpowers-workflow regression scaffold passed."
