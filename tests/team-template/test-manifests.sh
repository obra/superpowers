#!/usr/bin/env bash
cd "$(dirname "$0")/../.." || exit 1
source tests/team-template/assert.sh
# README attribution + purpose + install
assert_contains README.md "Superpowers Team Template"
assert_contains README.md "github.com/obra/superpowers"
assert_contains README.md "MIT"
assert_contains README.md "/plugin marketplace add"
assert_contains README.md "team-workflow"
# CLAUDE.md team-facing overwrite
assert_contains CLAUDE.md "Superpowers Team Template"
assert_contains CLAUDE.md "skills/ and hooks/ are the upstream engine"
assert_absent_string() { grep -qF -- "$2" "$1" && { echo "FAIL: '$2' should be gone from $1"; FAILED=1; } || echo "ok: '$2' absent from $1"; }
assert_absent_string CLAUDE.md "94% PR rejection"
finish
