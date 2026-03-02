#!/usr/bin/env bash
# run-all.sh — Unified test runner for all h-superpowers test suites
#
# Usage:
#   ./tests/run-all.sh              # Claude Code unit tests only (fastest)
#   ./tests/run-all.sh --opencode   # + OpenCode unit tests
#   ./tests/run-all.sh --triggers   # + skill triggering tests
#   ./tests/run-all.sh --all        # Everything (requires Claude API access, ~10 min)
#
# Individual suites can also be run directly:
#   tests/claude-code/run-skill-tests.sh       Claude Code behavioral tests
#   tests/opencode/run-tests.sh                OpenCode plugin tests
#   tests/skill-triggering/run-all.sh          Skill auto-triggering tests
#   tests/explicit-skill-requests/run-all.sh   Explicit invocation tests

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# --- Argument parsing ---
RUN_OPENCODE=false
RUN_TRIGGERS=false
RUN_EXPLICIT=false

for arg in "$@"; do
    case "$arg" in
        --opencode) RUN_OPENCODE=true ;;
        --triggers) RUN_TRIGGERS=true ;;
        --explicit) RUN_EXPLICIT=true ;;
        --all)
            RUN_OPENCODE=true
            RUN_TRIGGERS=true
            RUN_EXPLICIT=true
            ;;
        --help|-h)
            sed -n '2,14p' "$0" | sed 's/^# \{0,1\}//'
            exit 0
            ;;
        *)
            echo "Unknown argument: $arg  (use --help for usage)"
            exit 1
            ;;
    esac
done

# --- Summary tracking ---
SUITES_RUN=0
SUITES_PASSED=0
SUITES_FAILED=0
FAILED_SUITES=()

run_suite() {
    local name="$1"
    local script="$2"
    shift 2
    local extra_args=("$@")

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo " Suite: $name"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    SUITES_RUN=$((SUITES_RUN + 1))
    if bash "$script" "${extra_args[@]}"; then
        SUITES_PASSED=$((SUITES_PASSED + 1))
        echo "  ✓ $name passed"
    else
        SUITES_FAILED=$((SUITES_FAILED + 1))
        FAILED_SUITES+=("$name")
        echo "  ✗ $name FAILED"
    fi
}

echo "========================================"
echo " h-superpowers Unified Test Runner"
echo "========================================"
echo ""
echo "Repository: $REPO_ROOT"
echo "Date: $(date)"
echo ""

# --- Suite: Claude Code behavioral tests (always run) ---
if command -v claude &>/dev/null; then
    run_suite "Claude Code unit tests" "$SCRIPT_DIR/claude-code/run-skill-tests.sh"
else
    echo "[SKIP] Claude Code unit tests — 'claude' CLI not found"
fi

# --- Suite: OpenCode plugin tests ---
if $RUN_OPENCODE; then
    if command -v opencode &>/dev/null; then
        run_suite "OpenCode plugin tests" "$SCRIPT_DIR/opencode/run-tests.sh"
    else
        echo "[SKIP] OpenCode plugin tests — 'opencode' CLI not found"
    fi
else
    echo "[SKIP] OpenCode tests — pass --opencode to enable"
fi

# --- Suite: Skill triggering tests ---
if $RUN_TRIGGERS; then
    if command -v claude &>/dev/null; then
        run_suite "Skill triggering tests" "$SCRIPT_DIR/skill-triggering/run-all.sh"
    else
        echo "[SKIP] Skill triggering tests — 'claude' CLI not found"
    fi
else
    echo "[SKIP] Skill triggering tests — pass --triggers to enable"
fi

# --- Suite: Explicit skill request tests ---
if $RUN_EXPLICIT; then
    if command -v claude &>/dev/null; then
        run_suite "Explicit skill request tests" "$SCRIPT_DIR/explicit-skill-requests/run-all.sh"
    else
        echo "[SKIP] Explicit skill request tests — 'claude' CLI not found"
    fi
else
    echo "[SKIP] Explicit skill request tests — pass --explicit to enable"
fi

# --- Summary ---
echo ""
echo "========================================"
echo " Summary: $SUITES_PASSED/$SUITES_RUN suites passed"
echo "========================================"

if [[ ${#FAILED_SUITES[@]} -gt 0 ]]; then
    echo "FAILED suites:"
    for suite in "${FAILED_SUITES[@]}"; do
        echo "  - $suite"
    done
    exit 1
fi

echo "All suites passed."
