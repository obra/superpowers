#!/usr/bin/env bash
# Test: lifecycle extensions hook parsing
# Verifies that session-start hook correctly parses extensions manifests
# and injects the registry into session context
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
HOOK="$SCRIPT_DIR/../../hooks/session-start"

echo "=== Test: lifecycle extensions hook ==="
echo ""

PASSED=0
FAILED=0

pass() {
    echo "  [PASS] $1"
    PASSED=$((PASSED + 1))
}

fail() {
    echo "  [FAIL] $1"
    echo "  $2"
    FAILED=$((FAILED + 1))
}

check_present() {
    local output="$1" pattern="$2" name="$3"
    if echo "$output" | grep -qF "$pattern"; then
        pass "$name"
    else
        fail "$name" "Expected to find: $pattern"
    fi
}

check_absent() {
    local output="$1" pattern="$2" name="$3"
    if echo "$output" | grep -qF "$pattern"; then
        fail "$name" "Did not expect to find: $pattern"
    else
        pass "$name"
    fi
}

run_hook() {
    local home_dir="$1"
    local work_dir="${2:-$(mktemp -d)}"
    (cd "$work_dir" && HOME="$home_dir" CLAUDE_PLUGIN_ROOT=/fake bash "$HOOK" 2>&1)
}

# Test 1: No manifests — no extensions section
echo "Test 1: No manifests..."
tmpdir=$(mktemp -d)
output=$(run_hook "$tmpdir")
check_absent "$output" "Extensions Registry" "No extensions when no manifests"
rm -rf "$tmpdir"
echo ""

# Test 2: Personal manifest only
echo "Test 2: Personal manifest..."
tmpdir=$(mktemp -d)
mkdir -p "$tmpdir/.superpowers"
cat > "$tmpdir/.superpowers/extensions.yaml" << 'YAML'
extensions:
  post-execution:
    - compound-learning
  post-review:
    - security-audit
YAML
output=$(run_hook "$tmpdir")
check_present "$output" "Extensions Registry" "Registry header present"
check_present "$output" "post-execution: compound-learning" "post-execution extension parsed"
check_present "$output" "post-review: security-audit" "post-review extension parsed"
rm -rf "$tmpdir"
echo ""

# Test 3: Project manifest only
echo "Test 3: Project manifest..."
tmpdir=$(mktemp -d)
projdir=$(mktemp -d)
mkdir -p "$projdir/.superpowers"
cat > "$projdir/.superpowers/extensions.yaml" << 'YAML'
extensions:
  pre-task:
    - setup-env
  post-task:
    - lint-check
YAML
output=$(run_hook "$tmpdir" "$projdir")
check_present "$output" "pre-task: setup-env" "pre-task extension parsed"
check_present "$output" "post-task: lint-check" "post-task extension parsed"
rm -rf "$tmpdir" "$projdir"
echo ""

# Test 4: Both manifests merge (project appends to personal per-event)
echo "Test 4: Manifest merging..."
tmpdir=$(mktemp -d)
projdir=$(mktemp -d)
mkdir -p "$tmpdir/.superpowers" "$projdir/.superpowers"
cat > "$tmpdir/.superpowers/extensions.yaml" << 'YAML'
extensions:
  post-execution:
    - compound-learning
  post-review:
    - security-audit
YAML
cat > "$projdir/.superpowers/extensions.yaml" << 'YAML'
extensions:
  post-execution:
    - integration-smoke-test
  pre-finish:
    - changelog-generator
YAML
output=$(run_hook "$tmpdir" "$projdir")
check_present "$output" "post-execution: compound-learning, integration-smoke-test" "Personal + project merge for same event"
check_present "$output" "post-review: security-audit" "Personal-only event preserved"
check_present "$output" "pre-finish: changelog-generator" "Project-only event added"
rm -rf "$tmpdir" "$projdir"
echo ""

# Test 5: Empty manifest — no extensions section
echo "Test 5: Empty manifest..."
tmpdir=$(mktemp -d)
mkdir -p "$tmpdir/.superpowers"
touch "$tmpdir/.superpowers/extensions.yaml"
output=$(run_hook "$tmpdir")
check_absent "$output" "Extensions Registry" "No extensions from empty manifest"
rm -rf "$tmpdir"
echo ""

# Test 6: Comments and blank lines handled
echo "Test 6: Comments and blank lines..."
tmpdir=$(mktemp -d)
mkdir -p "$tmpdir/.superpowers"
cat > "$tmpdir/.superpowers/extensions.yaml" << 'YAML'
# My extensions config

extensions:

  # Post-execution hooks
  post-execution:
    - compound-learning

  # Review hooks
  post-review:
    - security-audit
YAML
output=$(run_hook "$tmpdir")
check_present "$output" "post-execution: compound-learning" "Parsed through comments/blanks"
check_present "$output" "post-review: security-audit" "Both events parsed"
rm -rf "$tmpdir"
echo ""

# Test 7: Multiple skills per event
echo "Test 7: Multiple skills per event..."
tmpdir=$(mktemp -d)
mkdir -p "$tmpdir/.superpowers"
cat > "$tmpdir/.superpowers/extensions.yaml" << 'YAML'
extensions:
  post-execution:
    - compound-learning
    - integration-smoke-test
    - metrics-collector
YAML
output=$(run_hook "$tmpdir")
check_present "$output" "post-execution: compound-learning, integration-smoke-test, metrics-collector" "All three skills listed in order"
rm -rf "$tmpdir"
echo ""

# Test 8: All 7 lifecycle events
echo "Test 8: All lifecycle events..."
tmpdir=$(mktemp -d)
mkdir -p "$tmpdir/.superpowers"
cat > "$tmpdir/.superpowers/extensions.yaml" << 'YAML'
extensions:
  post-brainstorm:
    - arch-review
  post-plan:
    - design-review
  pre-task:
    - setup-env
  post-task:
    - lint-check
  post-execution:
    - compound-learning
  post-review:
    - security-audit
  pre-finish:
    - changelog-gen
YAML
output=$(run_hook "$tmpdir")
check_present "$output" "post-brainstorm: arch-review" "post-brainstorm event"
check_present "$output" "post-plan: design-review" "post-plan event"
check_present "$output" "pre-task: setup-env" "pre-task event"
check_present "$output" "post-task: lint-check" "post-task event"
check_present "$output" "post-execution: compound-learning" "post-execution event"
check_present "$output" "post-review: security-audit" "post-review event"
check_present "$output" "pre-finish: changelog-gen" "pre-finish event"
rm -rf "$tmpdir"
echo ""

# Test 9: Valid JSON output
echo "Test 9: Valid JSON..."
tmpdir=$(mktemp -d)
mkdir -p "$tmpdir/.superpowers"
cat > "$tmpdir/.superpowers/extensions.yaml" << 'YAML'
extensions:
  post-execution:
    - compound-learning
YAML
output=$(run_hook "$tmpdir")
if echo "$output" | python3 -m json.tool > /dev/null 2>&1; then
    pass "Output is valid JSON with extensions"
else
    fail "Output is valid JSON with extensions" "JSON parse failed"
fi
rm -rf "$tmpdir"

# Also check valid JSON without extensions
tmpdir=$(mktemp -d)
output=$(run_hook "$tmpdir")
if echo "$output" | python3 -m json.tool > /dev/null 2>&1; then
    pass "Output is valid JSON without extensions"
else
    fail "Output is valid JSON without extensions" "JSON parse failed"
fi
rm -rf "$tmpdir"
echo ""

# Summary
echo "=== Results ==="
echo "  Passed: $PASSED"
echo "  Failed: $FAILED"
echo ""

if [ "$FAILED" -gt 0 ]; then
    echo "=== FAILED ==="
    exit 1
else
    echo "=== All lifecycle extensions hook tests passed ==="
    exit 0
fi
