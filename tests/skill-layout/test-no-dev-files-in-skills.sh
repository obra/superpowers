#!/usr/bin/env bash
# Fails when a skill directory ships files meant for developing the skill.
#
# Everything under skills/<name>/ is installed next to SKILL.md, and agents
# read and grep those directories during normal work. Pressure-test scenarios
# open with lines like "This is a real scenario. You must choose and act", and
# an agent that finds one there can take it as live instructions (#2277).
# Scenarios and creation logs belong under tests/ instead.
#
# Usage: tests/skill-layout/test-no-dev-files-in-skills.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

found=$(find "$REPO_ROOT/skills" -type f \( -name 'CREATION-LOG.md' -o -name 'test-*.md' \) | sort)

if [[ -n "$found" ]]; then
  while IFS= read -r file; do
    echo "FAIL: ${file#"$REPO_ROOT"/} is skill-development material inside an installed skill" >&2
  done <<<"$found"
  echo "Move pressure scenarios and creation logs under tests/<skill>/." >&2
  exit 1
fi
echo "PASS: no skill ships pressure scenarios or creation logs"
