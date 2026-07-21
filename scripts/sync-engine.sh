#!/usr/bin/env bash
# Sync the Superpowers engine (skills/, hooks/) from upstream and pin its version.
# Usage: scripts/sync-engine.sh [--dry-run] <upstream-ref>
set -euo pipefail
DRY=0
[ "${1:-}" = "--dry-run" ] && { DRY=1; shift; }
REF="${1:-}"
if [ -z "$REF" ]; then
  echo "usage: scripts/sync-engine.sh [--dry-run] <upstream-ref>   e.g. v6.2.0" >&2
  exit 2
fi
echo "Will checkout 'skills hooks' from upstream/$REF and bump the superpowers version."
if [ "$DRY" -eq 1 ]; then echo "(dry-run) no changes made"; exit 0; fi
git remote get-url upstream >/dev/null 2>&1 || \
  git remote add upstream https://github.com/obra/superpowers.git
git fetch upstream --tags
git checkout "$REF" -- skills hooks
# Bump the superpowers entry version in marketplace.json to match the ref (strip leading v).
VER="${REF#v}"
python3 - "$VER" <<'PY'
import json,sys
ver=sys.argv[1]
p=".claude-plugin/marketplace.json"
m=json.load(open(p))
for plug in m["plugins"]:
    if plug["name"]=="superpowers":
        plug["version"]=ver
json.dump(m,open(p,"w"),indent=2); open(p,"a").write("\n")
print("bumped superpowers ->",ver)
PY
git add skills hooks .claude-plugin/marketplace.json
echo "Staged engine sync to $REF. Review with 'git diff --cached' then commit."
