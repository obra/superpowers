#!/usr/bin/env bash
cd "$(dirname "$0")/../.." || exit 1
source tests/team-template/assert.sh
assert_present scripts/sync-engine.sh
[ -x scripts/sync-engine.sh ] && echo "ok: executable" || { echo "FAIL: not executable"; FAILED=1; }
# Dry-run must not error and must mention the two engine dirs and refuse a missing ref.
out=$(scripts/sync-engine.sh --dry-run v6.1.1 2>&1)
echo "$out" | grep -q "skills hooks" && echo "ok: targets skills hooks" || { echo "FAIL: dry-run missing target"; FAILED=1; }
scripts/sync-engine.sh 2>&1 | grep -qi "usage" && echo "ok: usage on no arg" || { echo "FAIL: no usage guard"; FAILED=1; }
finish
