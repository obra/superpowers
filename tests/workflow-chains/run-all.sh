#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=== Running Workflow Chain Tests ==="
echo ""

PASSED=0
FAILED=0
RESULTS=()

for chain_dir in "$SCRIPT_DIR"/chain-*/; do
    [ -d "$chain_dir" ] || continue
    chain_name=$(basename "$chain_dir")
    run_script="$chain_dir/run-chain.sh"

    if [ ! -f "$run_script" ]; then
        echo "  SKIP: $chain_name (no run-chain.sh)"
        continue
    fi

    echo "Running: $chain_name"
    if bash "$run_script"; then
        PASSED=$((PASSED + 1))
        RESULTS+=("PASS: $chain_name")
    else
        FAILED=$((FAILED + 1))
        RESULTS+=("FAIL: $chain_name")
    fi
    echo "---"
done

echo ""
echo "=== Workflow Chain Summary ==="
for result in "${RESULTS[@]:-}"; do
    echo "  $result"
done
echo ""
echo "Passed: $PASSED  Failed: $FAILED"
[ $FAILED -eq 0 ] || exit 1
