#!/usr/bin/env bash
cd "$(dirname "$0")/../.." || exit 1
source tests/team-template/assert.sh
# README attribution + purpose + install
assert_contains README.md "Superpowers Team Template"
assert_contains README.md "github.com/obra/superpowers"
assert_contains README.md "MIT"
assert_contains README.md "/plugin marketplace add"
assert_contains README.md "team-workflow"
finish
