#!/usr/bin/env bash
cd "$(dirname "$0")/../.." || exit 1
source tests/team-template/assert.sh
# Work on a throwaway copy so the repo isn't mutated.
TMP=$(mktemp -d)
cp -R team "$TMP/team"; cp -R .claude-plugin "$TMP/.claude-plugin"
( cd "$TMP" && bash "$OLDPWD/team/scripts/rename-plugin.sh" acme-workflow )
assert_contains "$TMP/team/.claude-plugin/plugin.json" "acme-workflow"
assert_contains "$TMP/.claude-plugin/marketplace.json" "acme-workflow"
grep -qF "team-workflow" "$TMP/team/.claude-plugin/plugin.json" && { echo "FAIL: placeholder left"; FAILED=1; } || echo "ok: placeholder replaced"
# Reject bad slug.
bash team/scripts/rename-plugin.sh "Bad Name" >/dev/null 2>&1 && { echo "FAIL: accepted bad slug"; FAILED=1; } || echo "ok: rejects bad slug"
rm -rf "$TMP"
finish
