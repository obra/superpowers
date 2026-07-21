#!/usr/bin/env bash
# Zero-dependency test assertions for team-template. Source this in tests.
FAILED=0
assert_present()  { [ -e "$1" ] && echo "ok: present $1" || { echo "FAIL: missing $1"; FAILED=1; }; }
assert_absent()   { [ ! -e "$1" ] && echo "ok: absent $1" || { echo "FAIL: still present $1"; FAILED=1; }; }
assert_contains() { grep -qF -- "$2" "$1" && echo "ok: '$2' in $1" || { echo "FAIL: '$2' not in $1"; FAILED=1; }; }
assert_json_valid(){ python3 -c "import json,sys; json.load(open(sys.argv[1]))" "$1" && echo "ok: json $1" || { echo "FAIL: bad json $1"; FAILED=1; }; }
finish() { [ "$FAILED" -eq 0 ] && { echo "ALL PASS"; exit 0; } || { echo "FAILURES"; exit 1; }; }
