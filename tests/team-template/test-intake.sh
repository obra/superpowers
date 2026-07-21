#!/usr/bin/env bash
cd "$(dirname "$0")/../.." || exit 1
source tests/team-template/assert.sh
for f in what-we-do what-we-use our-conventions testing connectors; do
  assert_present "team/intake/$f.md"
done
assert_contains team/intake/what-we-do.md "## What we build"
assert_contains team/intake/what-we-use.md "## Tools and services"
assert_contains team/intake/our-conventions.md "## Code style"
assert_contains team/intake/testing.md "## How we test"
assert_contains team/intake/connectors.md "## Documentation sources"
finish
