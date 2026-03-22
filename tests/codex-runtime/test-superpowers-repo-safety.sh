#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
HELPER_BIN="$REPO_ROOT/bin/superpowers-repo-safety"
STATE_DIR="$(mktemp -d)"
REPO_DIR="$(mktemp -d)"
trap 'rm -rf "$STATE_DIR" "$REPO_DIR"' EXIT
export SUPERPOWERS_STATE_DIR="$STATE_DIR"

USER_NAME="$(whoami 2>/dev/null || echo user)"

require_helper() {
  if [[ ! -x "$HELPER_BIN" ]]; then
    echo "Expected helper to exist and be executable: $HELPER_BIN"
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

require_absent_pattern() {
  local path="$1"
  local pattern="$2"
  if rg -n -e "$pattern" "$path" >/dev/null; then
    echo "Expected pattern to be absent from ${path}: ${pattern}"
    exit 1
  fi
}

run_json_command() {
  local repo_dir="$1"
  local label="$2"
  shift 2
  local output
  local status=0
  output="$(cd "$repo_dir" && "$HELPER_BIN" "$@" 2>&1)" || status=$?
  if [[ $status -ne 0 ]]; then
    echo "Expected command to succeed for: $label"
    printf '%s\n' "$output"
    exit 1
  fi
  printf '%s\n' "$output"
}

run_command_fails() {
  local repo_dir="$1"
  local label="$2"
  local expected_class="$3"
  shift 3
  local output
  local status=0
  output="$(cd "$repo_dir" && "$HELPER_BIN" "$@" 2>&1)" || status=$?
  if [[ $status -eq 0 ]]; then
    echo "Expected command to fail for: $label"
    printf '%s\n' "$output"
    exit 1
  fi
  assert_contains "$output" "\"failure_class\":\"$expected_class\"" "$label"
  printf '%s\n' "$output"
}

hash_text() {
  local value="$1"
  if command -v shasum >/dev/null 2>&1; then
    printf '%s' "$value" | shasum -a 256 | awk '{print substr($1, 1, 16)}'
    return
  fi
  if command -v sha256sum >/dev/null 2>&1; then
    printf '%s' "$value" | sha256sum | awk '{print substr($1, 1, 16)}'
    return
  fi
  printf '%s' "$value" | cksum | awk '{print $1}'
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

approval_path_for() {
  local repo_dir="$1"
  local stage="$2"
  local task_id="$3"
  local slug
  local branch
  local task_hash
  IFS=$'\t' read -r slug branch < <(slug_identity_for_repo "$repo_dir")
  task_hash="$(hash_text "$stage"$'\n'"$task_id")"
  printf '%s\n' "$STATE_DIR/projects/$slug/${USER_NAME}-${branch}-repo-safety/${task_hash}.json"
}

write_file() {
  local path="$1"
  mkdir -p "$(dirname "$path")"
  cat > "$path"
}

init_repo() {
  local repo_dir="$1"
  local branch="$2"
  local remote_url="${3:-}"

  mkdir -p "$repo_dir"
  git -C "$repo_dir" init >/dev/null 2>&1
  git -C "$repo_dir" config user.name "Superpowers Test"
  git -C "$repo_dir" config user.email "superpowers-tests@example.com"
  printf '# repo safety fixture\n' > "$repo_dir/README.md"
  git -C "$repo_dir" add README.md
  git -C "$repo_dir" commit -m "init" >/dev/null 2>&1
  git -C "$repo_dir" checkout -B "$branch" >/dev/null 2>&1
  if [[ -n "$remote_url" ]]; then
    git -C "$repo_dir" remote add origin "$remote_url"
  fi
}

populate_decoy_approval_tree() {
  local count="$1"
  local i
  local safe_branch="main"
  for ((i=1; i<=count; i++)); do
    write_file "$STATE_DIR/projects/decoy-$i/${USER_NAME}-${safe_branch}-repo-safety/decoy-$i.json" <<EOF
{"repo_root":"/tmp/decoy-$i","branch":"main","stage":"superpowers:brainstorming","task_id":"decoy-$i","paths":[],"write_targets":["spec-artifact-write"],"approval_fingerprint":"decoy-$i","approval_reason":"decoy","approved_at":"2026-03-21T00:00:00Z"}
EOF
  done
}

rewrite_record_field() {
  local path="$1"
  local field="$2"
  local value="$3"
  node -e '
    const fs = require("fs");
    const path = process.argv[1];
    const field = process.argv[2];
    const value = process.argv[3];
    const data = JSON.parse(fs.readFileSync(path, "utf8"));
    data[field] = value;
    fs.writeFileSync(path, JSON.stringify(data));
  ' "$path" "$field" "$value"
}

# Red contract expectations:
# expect_json_field outcome blocked
# expect_json_field failure_class ProtectedBranchDetected
# expect_json_field failure_class ApprovalFingerprintMismatch
# expect_json_field protected_by default
# populate_decoy_approval_tree 100
# expect_json_field approval_path "$EXPECTED_APPROVAL_PATH"

run_read_intent_allows_protected_branch() {
  local repo="$REPO_DIR/read-intent-main"
  local output

  init_repo "$repo" "main" "https://example.com/acme/repo-safety.git"
  output="$(run_json_command "$repo" "read intent on protected branch" check --intent read --stage superpowers:brainstorming --task-id read-task --path docs/spec.md --write-target spec-artifact-write)"
  assert_json_equals "$output" "outcome" "allowed" "read intent on protected branch"
  assert_json_equals "$output" "protected" "true" "read intent on protected branch"
  assert_json_equals "$output" "protected_by" "default" "read intent on protected branch"
}

run_write_blocked_on_protected_branch_by_default() {
  local repo="$REPO_DIR/write-blocked-main"
  local output
  local expected_path

  init_repo "$repo" "main" "https://example.com/acme/repo-safety.git"
  expected_path="$(approval_path_for "$repo" "superpowers:brainstorming" "spec-task")"
  output="$(run_json_command "$repo" "protected branch blocked by default" check --intent write --stage superpowers:brainstorming --task-id spec-task --path docs/superpowers/specs/new-spec.md --write-target spec-artifact-write)"
  assert_json_equals "$output" "outcome" "blocked" "protected branch blocked by default"
  assert_json_equals "$output" "failure_class" "ProtectedBranchDetected" "protected branch blocked by default"
  assert_json_equals "$output" "protected_by" "default" "protected branch blocked by default"
  assert_json_equals "$output" "approval_path" "$expected_path" "protected branch blocked by default"
  assert_json_equals "$output" "suggested_next_skill" "superpowers:using-git-worktrees" "protected branch blocked by default"
}

run_feature_branch_write_allowed() {
  local repo="$REPO_DIR/feature-branch-allowed"
  local output

  init_repo "$repo" "feature/repo-safety" "https://example.com/acme/repo-safety.git"
  output="$(run_json_command "$repo" "feature branch allowed" check --intent write --stage superpowers:brainstorming --task-id feature-task --path docs/superpowers/specs/new-spec.md --write-target spec-artifact-write)"
  assert_json_equals "$output" "outcome" "allowed" "feature branch allowed"
  assert_json_equals "$output" "protected" "false" "feature branch allowed"
  assert_json_equals "$output" "protected_by" "default" "feature branch allowed"
}

run_root_agents_override_protects_branch() {
  local repo="$REPO_DIR/root-agents-override-protected"
  local output

  init_repo "$repo" "release" "https://example.com/acme/repo-safety.git"
  write_file "$repo/AGENTS.override.md" <<'EOF'
Superpowers protected branches: release
EOF
  output="$(run_json_command "$repo" "root AGENTS.override branch protection" check --intent write --stage superpowers:brainstorming --task-id release-task --path docs/superpowers/specs/release-spec.md --write-target spec-artifact-write)"
  assert_json_equals "$output" "outcome" "blocked" "root AGENTS.override branch protection"
  assert_json_equals "$output" "failure_class" "ProtectedBranchDetected" "root AGENTS.override branch protection"
  assert_json_equals "$output" "protected_by" "instructions" "root AGENTS.override branch protection"
}

run_nested_agents_override_protects_branch() {
  local repo="$REPO_DIR/nested-agents-override-protected"
  local output

  init_repo "$repo" "release" "https://example.com/acme/repo-safety.git"
  mkdir -p "$repo/apps/cli"
  write_file "$repo/apps/AGENTS.override.md" <<'EOF'
Superpowers protected branches: release
EOF
  output="$(run_json_command "$repo/apps/cli" "nested AGENTS.override branch protection" check --intent write --stage superpowers:brainstorming --task-id nested-release-task --path docs/superpowers/specs/release-spec.md --write-target spec-artifact-write)"
  assert_json_equals "$output" "outcome" "blocked" "nested AGENTS.override branch protection"
  assert_json_equals "$output" "failure_class" "ProtectedBranchDetected" "nested AGENTS.override branch protection"
  assert_json_equals "$output" "protected_by" "instructions" "nested AGENTS.override branch protection"
}

run_invalid_instruction_branch_entry_fails_closed() {
  local repo="$REPO_DIR/invalid-instruction-branch-entry"

  init_repo "$repo" "release" "https://example.com/acme/repo-safety.git"
  write_file "$repo/AGENTS.override.md" <<'EOF'
Superpowers protected branches: release/*
EOF
  run_command_fails "$repo" "invalid instruction branch entry" "InstructionParseFailed" check --intent write --stage superpowers:brainstorming --task-id release-task --path docs/superpowers/specs/release-spec.md --write-target spec-artifact-write >/dev/null
}

run_matching_approval_allows_write() {
  local repo="$REPO_DIR/matching-approval"
  local approval
  local check

  init_repo "$repo" "main" "https://example.com/acme/repo-safety.git"
  approval="$(run_json_command "$repo" "approve matching scope" approve --stage superpowers:brainstorming --task-id spec-task --reason "User explicitly approved writing the spec on main." --path docs/superpowers/specs/new-spec.md --write-target spec-artifact-write)"
  check="$(run_json_command "$repo" "matching approval allows write" check --intent write --stage superpowers:brainstorming --task-id spec-task --path docs/superpowers/specs/new-spec.md --write-target spec-artifact-write)"
  assert_json_equals "$approval" "approval_path" "$(json_value "$check" "approval_path")" "matching approval allows write"
  assert_json_equals "$check" "outcome" "allowed" "matching approval allows write"
  assert_json_equals "$check" "protected" "true" "matching approval allows write"
  assert_json_nonempty "$check" "approval_fingerprint" "matching approval allows write"
}

run_full_scope_approval_allows_follow_on_git_phase() {
  local repo="$REPO_DIR/full-scope-approval"
  local approval
  local check

  init_repo "$repo" "main" "https://example.com/acme/repo-safety.git"
  approval="$(run_json_command "$repo" "approve full protected-branch scope" approve --stage superpowers:brainstorming --task-id spec-task --reason "User explicitly approved the spec write and same-slice commit on main." --path docs/superpowers/specs/new-spec.md --write-target spec-artifact-write --write-target git-commit)"
  check="$(run_json_command "$repo" "full-scope approval reused for follow-on git phase" check --intent write --stage superpowers:brainstorming --task-id spec-task --path docs/superpowers/specs/new-spec.md --write-target spec-artifact-write --write-target git-commit)"
  assert_json_equals "$approval" "approval_path" "$(json_value "$check" "approval_path")" "full-scope approval reused for follow-on git phase"
  assert_json_equals "$check" "outcome" "allowed" "full-scope approval reused for follow-on git phase"
  assert_json_equals "$check" "protected" "true" "full-scope approval reused for follow-on git phase"
}

run_mismatched_path_blocks_with_fingerprint_mismatch() {
  local repo="$REPO_DIR/mismatched-path"
  local output

  init_repo "$repo" "main" "https://example.com/acme/repo-safety.git"
  run_json_command "$repo" "approve original path" approve --stage superpowers:brainstorming --task-id spec-task --reason "User explicitly approved the original spec path." --path docs/superpowers/specs/original.md --write-target spec-artifact-write >/dev/null
  output="$(run_json_command "$repo" "mismatched path blocked" check --intent write --stage superpowers:brainstorming --task-id spec-task --path docs/superpowers/specs/other.md --write-target spec-artifact-write)"
  assert_json_equals "$output" "outcome" "blocked" "mismatched path blocked"
  assert_json_equals "$output" "failure_class" "ApprovalFingerprintMismatch" "mismatched path blocked"
}

run_mismatched_target_blocks_with_fingerprint_mismatch() {
  local repo="$REPO_DIR/mismatched-target"
  local output

  init_repo "$repo" "main" "https://example.com/acme/repo-safety.git"
  run_json_command "$repo" "approve original target" approve --stage superpowers:finishing-a-development-branch --task-id finish-task --reason "User explicitly approved the commit only." --write-target git-commit >/dev/null
  output="$(run_json_command "$repo" "mismatched target blocked" check --intent write --stage superpowers:finishing-a-development-branch --task-id finish-task --write-target git-push)"
  assert_json_equals "$output" "outcome" "blocked" "mismatched target blocked"
  assert_json_equals "$output" "failure_class" "ApprovalFingerprintMismatch" "mismatched target blocked"
}

run_malformed_scope_record_blocks() {
  local repo="$REPO_DIR/malformed-scope-record"
  local approval_path
  local output

  init_repo "$repo" "main" "https://example.com/acme/repo-safety.git"
  run_json_command "$repo" "approve valid scope" approve --stage superpowers:brainstorming --task-id spec-task --reason "User explicitly approved this spec write." --path docs/superpowers/specs/new-spec.md --write-target spec-artifact-write >/dev/null
  approval_path="$(approval_path_for "$repo" "superpowers:brainstorming" "spec-task")"
  rewrite_record_field "$approval_path" "stage" "superpowers:writing-plans"
  output="$(run_json_command "$repo" "scope mismatch blocked" check --intent write --stage superpowers:brainstorming --task-id spec-task --path docs/superpowers/specs/new-spec.md --write-target spec-artifact-write)"
  assert_json_equals "$output" "outcome" "blocked" "scope mismatch blocked"
  assert_json_equals "$output" "failure_class" "ApprovalScopeMismatch" "scope mismatch blocked"
}

run_invalid_write_target_fails_closed() {
  local repo="$REPO_DIR/invalid-write-target"

  init_repo "$repo" "main" "https://example.com/acme/repo-safety.git"
  run_command_fails "$repo" "invalid write target" "InvalidWriteTarget" check --intent write --stage superpowers:brainstorming --task-id spec-task --write-target totally-unknown-target >/dev/null
}

run_whitespace_only_task_id_fails_closed() {
  local repo="$REPO_DIR/whitespace-task-id"

  init_repo "$repo" "main" "https://example.com/acme/repo-safety.git"
  run_command_fails "$repo" "whitespace-only task id" "InvalidCommandInput" check --intent write --stage superpowers:brainstorming --task-id "   " --path docs/superpowers/specs/new-spec.md --write-target spec-artifact-write >/dev/null
}

run_windows_absolute_path_fails_closed() {
  local repo="$REPO_DIR/windows-absolute-path"

  init_repo "$repo" "main" "https://example.com/acme/repo-safety.git"
  run_command_fails "$repo" "windows absolute path" "InvalidCommandInput" check --intent write --stage superpowers:brainstorming --task-id spec-task --path 'C:\repo\docs\superpowers\specs\new-spec.md' --write-target spec-artifact-write >/dev/null
}

run_hot_path_uses_deterministic_approval_file() {
  local repo="$REPO_DIR/hot-path-approval"
  local output
  local expected_path

  init_repo "$repo" "main" "https://example.com/acme/repo-safety.git"
  expected_path="$(approval_path_for "$repo" "superpowers:brainstorming" "spec-task")"
  run_json_command "$repo" "approve deterministic approval path" approve --stage superpowers:brainstorming --task-id spec-task --reason "User explicitly approved this scope." --path docs/superpowers/specs/new-spec.md --write-target spec-artifact-write >/dev/null
  populate_decoy_approval_tree 100
  output="$(run_json_command "$repo" "hot path deterministic approval file" check --intent write --stage superpowers:brainstorming --task-id spec-task --path docs/superpowers/specs/new-spec.md --write-target spec-artifact-write)"
  assert_json_equals "$output" "approval_path" "$expected_path" "hot path deterministic approval file"
  assert_json_equals "$output" "outcome" "allowed" "hot path deterministic approval file"
}

require_helper
run_read_intent_allows_protected_branch
run_write_blocked_on_protected_branch_by_default
run_feature_branch_write_allowed
run_root_agents_override_protects_branch
run_nested_agents_override_protects_branch
run_invalid_instruction_branch_entry_fails_closed
run_matching_approval_allows_write
run_full_scope_approval_allows_follow_on_git_phase
run_mismatched_path_blocks_with_fingerprint_mismatch
run_mismatched_target_blocks_with_fingerprint_mismatch
run_malformed_scope_record_blocks
run_invalid_write_target_fails_closed
run_whitespace_only_task_id_fails_closed
run_windows_absolute_path_fails_closed
run_hot_path_uses_deterministic_approval_file
require_absent_pattern "$HELPER_BIN" 'find .*repo-safety'

echo "repo-safety helper regression test passed."
