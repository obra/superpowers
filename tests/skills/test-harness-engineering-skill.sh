#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SKILL_FILE="$REPO_ROOT/skills/harness-engineering/SKILL.md"

[[ -f "$SKILL_FILE" ]] || { echo "[FAIL] SKILL.md not found: $SKILL_FILE" >&2; exit 1; }
grep -q '^name: harness-engineering$' "$SKILL_FILE" || { echo "[FAIL] name not found" >&2; exit 1; }
grep -q 'Failure Taxonomy' "$SKILL_FILE" || { echo "[FAIL] Failure Taxonomy section not found" >&2; exit 1; }
echo "[PASS] harness-engineering skill smoke check"
