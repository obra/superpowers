#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SYNC_SCRIPT_SOURCE="$REPO_ROOT/scripts/sync-to-codex-plugin.sh"
BASH_UNDER_TEST="/bin/bash"
PACKAGE_VERSION="1.2.3"
MANIFEST_VERSION="9.8.7"

FAILURES=0
TEST_ROOT=""

pass() {
    echo "  [PASS] $1"
}

fail() {
    echo "  [FAIL] $1"
    FAILURES=$((FAILURES + 1))
}

assert_equals() {
    local actual="$1"
    local expected="$2"
    local description="$3"

    if [[ "$actual" == "$expected" ]]; then
        pass "$description"
    else
        fail "$description"
        echo "    expected: $expected"
        echo "    actual:   $actual"
    fi
}

assert_contains() {
    local haystack="$1"
    local needle="$2"
    local description="$3"

    if printf '%s' "$haystack" | grep -Fq -- "$needle"; then
        pass "$description"
    else
        fail "$description"
        echo "    expected to find: $needle"
    fi
}

assert_not_contains() {
    local haystack="$1"
    local needle="$2"
    local description="$3"

    if printf '%s' "$haystack" | grep -Fq -- "$needle"; then
        fail "$description"
        echo "    did not expect to find: $needle"
    else
        pass "$description"
    fi
}

assert_matches() {
    local haystack="$1"
    local pattern="$2"
    local description="$3"

    if printf '%s' "$haystack" | grep -Eq -- "$pattern"; then
        pass "$description"
    else
        fail "$description"
        echo "    expected to match: $pattern"
    fi
}

assert_not_matches() {
    local haystack="$1"
    local pattern="$2"
    local description="$3"

    if printf '%s' "$haystack" | grep -Eq -- "$pattern"; then
        fail "$description"
        echo "    did not expect to match: $pattern"
    else
        pass "$description"
    fi
}

assert_path_absent() {
    local path="$1"
    local description="$2"

    if [[ ! -e "$path" ]]; then
        pass "$description"
    else
        fail "$description"
        echo "    did not expect path to exist: $path"
    fi
}

assert_branch_absent() {
    local repo="$1"
    local pattern="$2"
    local description="$3"
    local branches

    branches="$(git -C "$repo" branch --list "$pattern")"

    if [[ -z "$branches" ]]; then
        pass "$description"
    else
        fail "$description"
        echo "    did not expect matching branches:"
        echo "$branches" | sed 's/^/      /'
    fi
}

assert_current_branch() {
    local repo="$1"
    local expected="$2"
    local description="$3"
    local actual

    actual="$(git -C "$repo" branch --show-current)"
    assert_equals "$actual" "$expected" "$description"
}

assert_file_equals() {
    local path="$1"
    local expected="$2"
    local description="$3"
    local actual

    actual="$(cat "$path")"
    assert_equals "$actual" "$expected" "$description"
}

cleanup() {
    if [[ -n "$TEST_ROOT" && -d "$TEST_ROOT" ]]; then
        rm -rf "$TEST_ROOT"
    fi
}

configure_git_identity() {
    local repo="$1"

    git -C "$repo" config user.name "Test Bot"
    git -C "$repo" config user.email "test@example.com"
}

init_repo() {
    local repo="$1"

    git init -q -b main "$repo"
    configure_git_identity "$repo"
}

commit_fixture() {
    local repo="$1"
    local message="$2"

    git -C "$repo" commit -q -m "$message"
}

checkout_fixture_branch() {
    local repo="$1"
    local branch="$2"

    git -C "$repo" checkout -q -b "$branch"
}

write_upstream_fixture() {
    local repo="$1"
    local with_pure_ignored="${2:-1}"

    mkdir -p \
        "$repo/.codex-plugin" \
        "$repo/.private-journal" \
        "$repo/assets" \
        "$repo/scripts" \
        "$repo/skills/example"

    if [[ "$with_pure_ignored" == "1" ]]; then
        mkdir -p "$repo/ignored-cache/tmp"
    fi

    cp "$SYNC_SCRIPT_SOURCE" "$repo/scripts/sync-to-codex-plugin.sh"

    cat > "$repo/package.json" <<EOF
{
  "name": "fixture-upstream",
  "version": "$PACKAGE_VERSION"
}
EOF

    cat > "$repo/.gitignore" <<'EOF'
.private-journal/
EOF

    if [[ "$with_pure_ignored" == "1" ]]; then
        cat >> "$repo/.gitignore" <<'EOF'
ignored-cache/
EOF
    fi

    cat > "$repo/.codex-plugin/plugin.json" <<EOF
{
  "name": "superpowers",
  "version": "$MANIFEST_VERSION"
}
EOF

    cat > "$repo/assets/superpowers-small.svg" <<'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"></svg>
EOF

    printf 'png fixture\n' > "$repo/assets/app-icon.png"

    cat > "$repo/skills/example/SKILL.md" <<'EOF'
# Example Skill

Fixture content.
EOF

    printf 'tracked keep\n' > "$repo/.private-journal/keep.txt"
    printf 'ignored leak\n' > "$repo/.private-journal/leak.txt"
    if [[ "$with_pure_ignored" == "1" ]]; then
        printf 'ignored cache state\n' > "$repo/ignored-cache/tmp/state.json"
    fi

    git -C "$repo" add \
        .codex-plugin/plugin.json \
        .gitignore \
        assets/app-icon.png \
        assets/superpowers-small.svg \
        package.json \
        scripts/sync-to-codex-plugin.sh \
        skills/example/SKILL.md
    git -C "$repo" add -f .private-journal/keep.txt

    commit_fixture "$repo" "Initial upstream fixture"
}

write_destination_fixture() {
    local repo="$1"

    mkdir -p "$repo/plugins/superpowers/skills/example"
    printf 'fixture keep\n' > "$repo/plugins/superpowers/.fixture-keep"
    cat > "$repo/plugins/superpowers/skills/example/SKILL.md" <<'EOF'
# Example Skill

Fixture content.
EOF
    git -C "$repo" add plugins/superpowers/.fixture-keep
    git -C "$repo" add plugins/superpowers/skills/example/SKILL.md

    commit_fixture "$repo" "Initial destination fixture"
}

add_openai_agent_metadata_fixture() {
    local repo="$1"

    mkdir -p "$repo/plugins/superpowers/skills/example/agents"

    cat > "$repo/plugins/superpowers/skills/example/agents/openai.yaml" <<'EOF'
interface:
  display_name: "Example"
  short_description: "Destination-owned OpenAI metadata"
EOF

    git -C "$repo" add plugins/superpowers/skills/example/agents/openai.yaml

    commit_fixture "$repo" "Add OpenAI agent metadata fixture"
}

dirty_tracked_destination_skill() {
    local repo="$1"

    cat > "$repo/plugins/superpowers/skills/example/SKILL.md" <<'EOF'
# Example Skill

Locally modified fixture content.
EOF
}

write_synced_destination_fixture() {
    local repo="$1"

    mkdir -p \
        "$repo/plugins/superpowers/.codex-plugin" \
        "$repo/plugins/superpowers/.private-journal" \
        "$repo/plugins/superpowers/assets" \
        "$repo/plugins/superpowers/skills/example/agents" \
        "$repo/plugins/superpowers/skills/example"

    cat > "$repo/plugins/superpowers/.codex-plugin/plugin.json" <<EOF
{
  "name": "superpowers",
  "version": "$MANIFEST_VERSION"
}
EOF

    cat > "$repo/plugins/superpowers/assets/superpowers-small.svg" <<'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"></svg>
EOF

    printf 'png fixture\n' > "$repo/plugins/superpowers/assets/app-icon.png"

    cat > "$repo/plugins/superpowers/skills/example/SKILL.md" <<'EOF'
# Example Skill

Fixture content.
EOF

    cat > "$repo/plugins/superpowers/skills/example/agents/openai.yaml" <<'EOF'
interface:
  display_name: "Example"
  short_description: "Destination-owned OpenAI metadata"
EOF

    printf 'tracked keep\n' > "$repo/plugins/superpowers/.private-journal/keep.txt"

    git -C "$repo" add \
        plugins/superpowers/.codex-plugin/plugin.json \
        plugins/superpowers/assets/app-icon.png \
        plugins/superpowers/assets/superpowers-small.svg \
        plugins/superpowers/skills/example/agents/openai.yaml \
        plugins/superpowers/skills/example/SKILL.md \
        plugins/superpowers/.private-journal/keep.txt

    commit_fixture "$repo" "Initial synced destination fixture"
}

write_stale_ignored_destination_fixture() {
    local repo="$1"

    mkdir -p "$repo/plugins/superpowers/.private-journal"
    printf 'fixture keep\n' > "$repo/plugins/superpowers/.fixture-keep"
    printf 'stale ignored leak\n' > "$repo/plugins/superpowers/.private-journal/leak.txt"
    git -C "$repo" add plugins/superpowers/.fixture-keep

    commit_fixture "$repo" "Initial stale ignored destination fixture"
}

write_fake_gh() {
    local bin_dir="$1"

    mkdir -p "$bin_dir"

    cat > "$bin_dir/gh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

if [[ "${1:-}" == "auth" && "${2:-}" == "status" ]]; then
    exit 0
fi

echo "unexpected gh invocation: $*" >&2
exit 1
EOF

    chmod +x "$bin_dir/gh"
}

run_preview() {
    local upstream="$1"
    local dest="$2"
    local fake_bin="$3"

    PATH="$fake_bin:$PATH" "$BASH_UNDER_TEST" "$upstream/scripts/sync-to-codex-plugin.sh" -n --local "$dest" 2>&1
}

run_bootstrap_preview() {
    local upstream="$1"
    local dest="$2"
    local fake_bin="$3"

    PATH="$fake_bin:$PATH" "$BASH_UNDER_TEST" "$upstream/scripts/sync-to-codex-plugin.sh" -n --bootstrap --local "$dest" 2>&1
}

run_preview_without_manifest() {
    local upstream="$1"
    local dest="$2"
    local fake_bin="$3"

    rm -f "$upstream/.codex-plugin/plugin.json"
    PATH="$fake_bin:$PATH" "$BASH_UNDER_TEST" "$upstream/scripts/sync-to-codex-plugin.sh" -n --local "$dest" 2>&1
}

run_preview_with_stale_ignored_destination() {
    local upstream="$1"
    local dest="$2"
    local fake_bin="$3"

    PATH="$fake_bin:$PATH" "$BASH_UNDER_TEST" "$upstream/scripts/sync-to-codex-plugin.sh" -n --local "$dest" 2>&1
}

run_apply() {
    local upstream="$1"
    local dest="$2"
    local fake_bin="$3"

    PATH="$fake_bin:$PATH" "$BASH_UNDER_TEST" "$upstream/scripts/sync-to-codex-plugin.sh" -y --local "$dest" 2>&1
}

run_help() {
    local upstream="$1"
    local fake_bin="$2"

    PATH="$fake_bin:$PATH" "$BASH_UNDER_TEST" "$upstream/scripts/sync-to-codex-plugin.sh" --help 2>&1
}

write_bootstrap_destination_fixture() {
    local repo="$1"

    printf 'bootstrap fixture\n' > "$repo/README.md"
    git -C "$repo" add README.md

    commit_fixture "$repo" "Initial bootstrap destination fixture"
}

main() {
    local upstream
    local mixed_only_upstream
    local dest
    local dest_branch
    local mixed_only_dest
    local stale_dest
    local dirty_apply_dest
    local dirty_apply_dest_branch
    local noop_apply_dest
    local noop_apply_dest_branch
    local fake_bin
    local bootstrap_dest
    local bootstrap_dest_branch
    local preview_status
    local preview_output
    local preview_section
    local bootstrap_status
    local bootstrap_output
    local missing_manifest_status
    local missing_manifest_output
    local mixed_only_status
    local mixed_only_output
    local stale_preview_status
    local stale_preview_output
    local stale_preview_section
    local dirty_apply_status
    local dirty_apply_output
    local noop_apply_status
    local noop_apply_output
    local help_output
    local script_source
    local dirty_skill_path
    local noop_openai_metadata_path

    echo "=== Test: sync-to-codex-plugin dry-run regression ==="

    TEST_ROOT="$(mktemp -d)"
    trap cleanup EXIT

    upstream="$TEST_ROOT/upstream"
    mixed_only_upstream="$TEST_ROOT/mixed-only-upstream"
    dest="$TEST_ROOT/destination"
    mixed_only_dest="$TEST_ROOT/mixed-only-destination"
    stale_dest="$TEST_ROOT/stale-destination"
    dirty_apply_dest="$TEST_ROOT/dirty-apply-destination"
    dirty_apply_dest_branch="fixture/dirty-apply-target"
    noop_apply_dest="$TEST_ROOT/noop-apply-destination"
    noop_apply_dest_branch="fixture/noop-apply-target"
    bootstrap_dest="$TEST_ROOT/bootstrap-destination"
    dest_branch="fixture/preview-target"
    bootstrap_dest_branch="fixture/bootstrap-preview-target"
    fake_bin="$TEST_ROOT/bin"

    init_repo "$upstream"
    write_upstream_fixture "$upstream"

    init_repo "$mixed_only_upstream"
    write_upstream_fixture "$mixed_only_upstream" 0

    init_repo "$dest"
    write_destination_fixture "$dest"
    add_openai_agent_metadata_fixture "$dest"
    checkout_fixture_branch "$dest" "$dest_branch"
    dirty_tracked_destination_skill "$dest"

    init_repo "$mixed_only_dest"
    write_destination_fixture "$mixed_only_dest"

    init_repo "$stale_dest"
    write_stale_ignored_destination_fixture "$stale_dest"

    init_repo "$dirty_apply_dest"
    write_synced_destination_fixture "$dirty_apply_dest"
    checkout_fixture_branch "$dirty_apply_dest" "$dirty_apply_dest_branch"
    dirty_tracked_destination_skill "$dirty_apply_dest"

    init_repo "$noop_apply_dest"
    write_synced_destination_fixture "$noop_apply_dest"
    checkout_fixture_branch "$noop_apply_dest" "$noop_apply_dest_branch"

    init_repo "$bootstrap_dest"
    write_bootstrap_destination_fixture "$bootstrap_dest"
    checkout_fixture_branch "$bootstrap_dest" "$bootstrap_dest_branch"

    write_fake_gh "$fake_bin"

    # This regression test is about dry-run content, so capture the preview
    # output even if the current script exits nonzero in --local mode.
    set +e
    preview_output="$(run_preview "$upstream" "$dest" "$fake_bin")"
    preview_status=$?
    bootstrap_output="$(run_bootstrap_preview "$upstream" "$bootstrap_dest" "$fake_bin")"
    bootstrap_status=$?
    mixed_only_output="$(run_preview "$mixed_only_upstream" "$mixed_only_dest" "$fake_bin")"
    mixed_only_status=$?
    stale_preview_output="$(run_preview_with_stale_ignored_destination "$upstream" "$stale_dest" "$fake_bin")"
    stale_preview_status=$?
    dirty_apply_output="$(run_apply "$upstream" "$dirty_apply_dest" "$fake_bin")"
    dirty_apply_status=$?
    noop_apply_output="$(run_apply "$upstream" "$noop_apply_dest" "$fake_bin")"
    noop_apply_status=$?
    missing_manifest_output="$(run_preview_without_manifest "$upstream" "$dest" "$fake_bin")"
    missing_manifest_status=$?
    set -e
    help_output="$(run_help "$upstream" "$fake_bin")"
    script_source="$(cat "$upstream/scripts/sync-to-codex-plugin.sh")"
    preview_section="$(printf '%s\n' "$preview_output" | sed -n '/^=== Preview (rsync --dry-run) ===$/,/^=== End preview ===$/p')"
    stale_preview_section="$(printf '%s\n' "$stale_preview_output" | sed -n '/^=== Preview (rsync --dry-run) ===$/,/^=== End preview ===$/p')"
    dirty_skill_path="$dirty_apply_dest/plugins/superpowers/skills/example/SKILL.md"
    noop_openai_metadata_path="$noop_apply_dest/plugins/superpowers/skills/example/agents/openai.yaml"

    echo ""
    echo "Preview assertions..."
    assert_equals "$preview_status" "0" "Preview exits successfully"
    assert_contains "$preview_output" "Version:  $MANIFEST_VERSION" "Preview uses manifest version"
    assert_not_contains "$preview_output" "Version:  $PACKAGE_VERSION" "Preview does not use package.json version"
    assert_contains "$preview_section" ".codex-plugin/plugin.json" "Preview includes manifest path"
    assert_contains "$preview_section" "assets/superpowers-small.svg" "Preview includes SVG asset"
    assert_contains "$preview_section" "assets/app-icon.png" "Preview includes PNG asset"
    assert_contains "$preview_section" ".private-journal/keep.txt" "Preview includes tracked ignored file"
    assert_not_contains "$preview_section" ".private-journal/leak.txt" "Preview excludes ignored untracked file"
    assert_not_contains "$preview_section" "ignored-cache/" "Preview excludes pure ignored directories"
    assert_not_contains "$preview_output" "Overlay file (.codex-plugin/plugin.json) will be regenerated" "Preview omits overlay regeneration note"
    assert_not_contains "$preview_output" "Assets (superpowers-small.svg, app-icon.png) will be seeded from" "Preview omits assets seeding note"
    assert_contains "$preview_section" "skills/example/SKILL.md" "Preview reflects dirty tracked destination file"
    assert_not_matches "$preview_section" "\\*deleting +skills/example/agents/openai\\.yaml" "Preview preserves destination-owned OpenAI agent metadata"
    assert_current_branch "$dest" "$dest_branch" "Preview leaves destination checkout on its original branch"
    assert_branch_absent "$dest" "sync/superpowers-*" "Preview does not create sync branch in destination checkout"

    echo ""
    echo "Mixed-directory assertions..."
    assert_equals "$mixed_only_status" "0" "Mixed ignored directory preview exits successfully under /bin/bash"
    assert_contains "$mixed_only_output" ".private-journal/keep.txt" "Mixed ignored directory preview still includes tracked ignored file"
    assert_not_contains "$mixed_only_output" "ignored-cache/" "Mixed ignored directory preview has no pure ignored directory fixture"

    echo ""
    echo "Convergence assertions..."
    assert_equals "$stale_preview_status" "0" "Stale ignored destination preview exits successfully"
    assert_matches "$stale_preview_section" "\\*deleting +\\.private-journal/leak\\.txt" "Preview deletes stale ignored destination file"

    echo ""
    echo "Bootstrap assertions..."
    assert_equals "$bootstrap_status" "0" "Bootstrap preview exits successfully"
    assert_contains "$bootstrap_output" "Mode:     BOOTSTRAP (creating plugins/superpowers/ when absent)" "Bootstrap preview describes directory creation"
    assert_not_contains "$bootstrap_output" "Assets:" "Bootstrap preview omits external assets path"
    assert_contains "$bootstrap_output" "Dry run only. Nothing was changed or pushed." "Bootstrap preview remains dry-run only"
    assert_path_absent "$bootstrap_dest/plugins/superpowers" "Bootstrap preview does not create destination plugin directory"
    assert_current_branch "$bootstrap_dest" "$bootstrap_dest_branch" "Bootstrap preview leaves destination checkout on its original branch"
    assert_branch_absent "$bootstrap_dest" "bootstrap/superpowers-*" "Bootstrap preview does not create bootstrap branch in destination checkout"

    echo ""
    echo "Apply assertions..."
    assert_equals "$dirty_apply_status" "1" "Dirty local apply exits with failure"
    assert_contains "$dirty_apply_output" "ERROR: local checkout has uncommitted changes under 'plugins/superpowers'" "Dirty local apply reports protected destination path"
    assert_current_branch "$dirty_apply_dest" "$dirty_apply_dest_branch" "Dirty local apply leaves destination checkout on its original branch"
    assert_branch_absent "$dirty_apply_dest" "sync/superpowers-*" "Dirty local apply does not create sync branch in destination checkout"
    assert_file_equals "$dirty_skill_path" "# Example Skill

Locally modified fixture content." "Dirty local apply preserves tracked working-tree file content"
    assert_equals "$noop_apply_status" "0" "Clean no-op local apply exits successfully"
    assert_contains "$noop_apply_output" "No changes — embedded plugin was already in sync with upstream" "Clean no-op local apply reports no changes"
    assert_current_branch "$noop_apply_dest" "$noop_apply_dest_branch" "Clean no-op local apply leaves destination checkout on its original branch"
    assert_branch_absent "$noop_apply_dest" "sync/superpowers-*" "Clean no-op local apply does not create sync branch in destination checkout"
    assert_file_equals "$noop_openai_metadata_path" "interface:
  display_name: \"Example\"
  short_description: \"Destination-owned OpenAI metadata\"" "Clean no-op local apply preserves OpenAI agent metadata"

    echo ""
    echo "Missing manifest assertions..."
    assert_equals "$missing_manifest_status" "1" "Missing manifest exits with failure"
    assert_contains "$missing_manifest_output" "ERROR: committed Codex manifest missing at" "Missing manifest reports committed manifest path"

    echo ""
    echo "Help assertions..."
    assert_not_contains "$help_output" "--assets-src" "Help omits --assets-src"

    echo ""
    echo "Source assertions..."
    assert_not_contains "$script_source" "regenerated inline" "Source drops regenerated inline phrasing"
    assert_not_contains "$script_source" "Brand Assets directory" "Source drops Brand Assets directory phrasing"
    assert_not_contains "$script_source" "--assets-src" "Source drops --assets-src"

    if [[ $FAILURES -ne 0 ]]; then
        echo ""
        echo "FAILED: $FAILURES assertion(s) failed."
        exit 1
    fi

    echo ""
    echo "PASS"
}

main "$@"
