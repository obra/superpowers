#!/usr/bin/env bash
# Unit test runner for superpowers-prepared Codex hooks
#
# Run from the repo root:
#   bash tests/codex/run-unit-tests.sh
#
# Or from within the tests/codex/ directory:
#   bash run-unit-tests.sh
#
# Requirements: node (any version >= 16), git

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

echo "=================================================="
echo " superpowers-prepared — Codex Hook Unit Tests"
echo "=================================================="
echo " Repo root: ${REPO_ROOT}"
echo " Node:      $(node --version 2>/dev/null || echo 'NOT FOUND')"
echo ""

PASS=0
FAIL=0
ERRORS=()

run_test() {
  local label="$1"
  local file="$2"
  echo "── ${label}"
  if node "${file}"; then
    PASS=$(( PASS + 1 ))
  else
    FAIL=$(( FAIL + 1 ))
    ERRORS+=("${label}")
  fi
  echo ""
}

run_test "pretool-bash-adapter" "${SCRIPT_DIR}/test-pretool-bash-adapter.js"
run_test "posttool-bash-compress-adapter" "${SCRIPT_DIR}/test-posttool-bash-compress-adapter.js"
run_test "stop-adapter"         "${SCRIPT_DIR}/test-stop-adapter.js"
run_test "stop-reminders (Claude Stop shape)" "${SCRIPT_DIR}/test-stop-reminders.js"
run_test "session-start-adapter" "${SCRIPT_DIR}/test-session-start-adapter.js"
run_test "skill-activator (UserPromptSubmit)" "${SCRIPT_DIR}/test-skill-activator.js"

echo "=================================================="
echo " Results: ${PASS} suites passed, ${FAIL} suites failed"
if [ "${FAIL}" -gt 0 ]; then
  echo " Failed suites:"
  for e in "${ERRORS[@]}"; do
    echo "   - ${e}"
  done
  echo "=================================================="
  exit 1
else
  echo " All unit tests passed."
  echo "=================================================="
fi
