#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "=== Test: Ralph status block parsing ==="

sample=$'Output text\n---RALPH_STATUS---\nSTATUS: IN_PROGRESS\nTASKS_COMPLETED_THIS_LOOP: 1\nFILES_MODIFIED: 2\nTESTS_STATUS: NOT_RUN\nWORK_TYPE: DOCUMENTATION\nEXIT_SIGNAL: false\nRECOMMENDATION: Continue with next task\n---END_RALPH_STATUS---\n'

status=$(extract_ralph_status "$sample")
verify_ralph_status_block "$status" "Status block fields + enums"

assert_contains "$status" "STATUS: IN_PROGRESS" "Status value present"

echo "=== All tests passed ==="
