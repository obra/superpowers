#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Parse optional --tier flag
TIER=""
while [[ $# -gt 0 ]]; do
    case "$1" in
        --tier)
            TIER="$2"
            shift 2
            ;;
        --tier=*)
            TIER="${1#--tier=}"
            shift
            ;;
        *)
            echo "Unknown argument: $1"
            echo "Usage: $0 [--tier 1|2|3]"
            exit 1
            ;;
    esac
done

echo "============================================"
echo " Superpowers Test Suite"
echo "============================================"
if [ -n "$TIER" ]; then
    echo " Running: Tier $TIER only"
fi
echo ""

TOTAL_PASS=0
TOTAL_FAIL=0

run_suite() {
    local label="$1"
    local script="$2"

    echo "--- $label ---"
    if bash "$script"; then
        TOTAL_PASS=$((TOTAL_PASS + 1))
        echo "  Suite result: PASS"
    else
        TOTAL_FAIL=$((TOTAL_FAIL + 1))
        echo "  Suite result: FAIL"
    fi
    echo ""
}

# Tier 1: Skill Triggering + Explicit Requests
if [ -z "$TIER" ] || [ "$TIER" = "1" ]; then
    echo "=== Tier 1: Skill Triggering ==="
    echo ""
    run_suite "Skill Triggering" "$SCRIPT_DIR/skill-triggering/run-all.sh"
    run_suite "Explicit Skill Requests" "$SCRIPT_DIR/explicit-skill-requests/run-all.sh"
fi

# Tier 2: Pressure / Behavior Tests
if [ -z "$TIER" ] || [ "$TIER" = "2" ]; then
    echo "=== Tier 2: Pressure/Behavior Tests ==="
    echo ""
    run_suite "Pressure Tests" "$SCRIPT_DIR/pressure-tests/run-all.sh"
fi

# Tier 3: E2E Workflow Chains
if [ -z "$TIER" ] || [ "$TIER" = "3" ]; then
    echo "=== Tier 3: Workflow Chain Tests ==="
    echo ""
    run_suite "Workflow Chains" "$SCRIPT_DIR/workflow-chains/run-all.sh"
fi

echo "============================================"
echo " Final Summary"
echo "============================================"
echo "Suites passed: $TOTAL_PASS"
echo "Suites failed: $TOTAL_FAIL"
echo ""

if [ $TOTAL_FAIL -gt 0 ]; then
    echo "RESULT: FAIL ($TOTAL_FAIL suite(s) failed)"
    exit 1
else
    echo "RESULT: PASS"
    exit 0
fi
