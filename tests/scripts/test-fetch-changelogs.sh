#!/usr/bin/env bash
# Tests for skills/rails-upgrade/scripts/fetch-changelogs.sh
#
# Usage: ./test-fetch-changelogs.sh
#
# Requires: bash, curl (for network tests)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT="$SCRIPT_DIR/../../skills/rails-upgrade/scripts/fetch-changelogs.sh"

PASSED=0
FAILED=0

pass() { echo "  ✅ $1"; PASSED=$((PASSED + 1)); }
fail() { echo "  ❌ $1"; FAILED=$((FAILED + 1)); }

# ──────────────────────────────────────────────
# Syntax check
# ──────────────────────────────────────────────

echo ""
echo "=== Syntax ==="

if bash -n "$SCRIPT" 2>/dev/null; then
  pass "Script parses without syntax errors"
else
  fail "Script has syntax errors"
fi

# ──────────────────────────────────────────────
# Help / no-args behavior
# ──────────────────────────────────────────────

echo ""
echo "=== Help and no-args ==="

output=$("$SCRIPT" 2>&1 || true)
if echo "$output" | grep -q "fetch-changelogs.sh"; then
  pass "--help / no-args shows help text"
else
  fail "--help / no-args did not show help text"
fi

output=$("$SCRIPT" --help 2>&1 || true)
if echo "$output" | grep -q "fetch-changelogs.sh"; then
  pass "--help flag works"
else
  fail "--help flag did not show help text"
fi

# ──────────────────────────────────────────────
# Version validation
# ──────────────────────────────────────────────

echo ""
echo "=== Version validation ==="

exit_code=0
"$SCRIPT" not-a-version > /dev/null 2>&1 || exit_code=$?
if [ "$exit_code" -ne 0 ]; then
  pass "Rejects invalid version string 'not-a-version'"
else
  fail "Should reject invalid version string"
fi

exit_code=0
"$SCRIPT" --unknown-flag > /dev/null 2>&1 || exit_code=$?
if [ "$exit_code" -ne 0 ]; then
  pass "Rejects unknown flag"
else
  fail "Should reject unknown flag"
fi

# ──────────────────────────────────────────────
# extract_version_section logic (via sourcing helper)
# ──────────────────────────────────────────────

echo ""
echo "=== Version section extraction ==="

# Source only the extract_version_section function by temporarily wrapping
# We do this without running main() by checking if the function can be called.
SAMPLE_CHANGELOG=$(cat <<'CHANGELOG'
## Rails 8.1.0 (January 22, 2025) ##

*   Add some feature.

*   Fix some bug.

## Rails 8.0.1 (November 7, 2024) ##

*   Old change.

CHANGELOG
)

# Re-implement the awk extraction inline so we can test it without sourcing the script
extract_section() {
  local content="$1"
  local version="$2"
  echo "$content" | awk -v ver="$version" '
    /^## Rails [[:space:]]*/ && $0 ~ ("Rails " ver) { found = 1; print; next }
    found && /^## Rails [0-9]/ { exit }
    found { print }
  '
}

section=$(extract_section "$SAMPLE_CHANGELOG" "8.1.0")
if echo "$section" | grep -q "Add some feature"; then
  pass "Extracts correct version section"
else
  fail "Did not extract correct version section"
fi

if ! echo "$section" | grep -q "Old change"; then
  pass "Does not include content from prior version"
else
  fail "Incorrectly included content from prior version"
fi

section=$(extract_section "$SAMPLE_CHANGELOG" "9.9.9")
if [ -z "$section" ]; then
  pass "Returns empty for non-existent version"
else
  fail "Should return empty for non-existent version"
fi

# ──────────────────────────────────────────────
# Network test (skipped if no curl / offline)
# ──────────────────────────────────────────────

echo ""
echo "=== Network tests (skipped if offline) ==="

if ! command -v curl > /dev/null 2>&1; then
  echo "  ⚠️  SKIP: curl not found"
elif ! curl --silent --head --fail "https://raw.githubusercontent.com" > /dev/null 2>&1; then
  echo "  ⚠️  SKIP: Network unreachable"
else
  TMPDIR_TEST=$(mktemp -d)
  exit_code=0
  "$SCRIPT" 99.99.99 "$TMPDIR_TEST" > /dev/null 2>&1 || exit_code=$?
  if [ "$exit_code" -ne 0 ]; then
    pass "Exits non-zero for non-existent Rails version"
  else
    fail "Should fail for non-existent Rails version"
  fi
  rm -rf "$TMPDIR_TEST"
fi

# ──────────────────────────────────────────────
# Summary
# ──────────────────────────────────────────────

echo ""
echo "=== Summary ==="
echo "  Passed: $PASSED"
echo "  Failed: $FAILED"
echo ""

if [ $FAILED -gt 0 ]; then
  exit 1
fi
