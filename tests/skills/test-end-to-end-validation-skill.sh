#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SKILL_FILE="$REPO_ROOT/skills/end-to-end-validation/SKILL.md"

[[ -f "$SKILL_FILE" ]] || { echo "[FAIL] SKILL.md not found: $SKILL_FILE" >&2; exit 1; }
grep -q '^name: end-to-end-validation$' "$SKILL_FILE" || { echo "[FAIL] name not found" >&2; exit 1; }
grep -q 'Failure taxonomy' "$SKILL_FILE" || { echo "[FAIL] Failure taxonomy section not found" >&2; exit 1; }
echo "[PASS] end-to-end-validation skill smoke check"
