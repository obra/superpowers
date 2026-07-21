#!/usr/bin/env bash
cd "$(dirname "$0")" || exit 1
rc=0
for t in test-*.sh; do echo "== $t =="; bash "$t" || rc=1; done
[ "$rc" -eq 0 ] && echo "SUITE PASS" || echo "SUITE FAIL"
exit $rc
