#!/usr/bin/env bash
# Test: OpenCode skill-ID convention (#2583)
# OpenCode registers skills under bare ids (e.g. "brainstorming"), so the
# qualified form "superpowers:brainstorming" can never resolve there. The
# using-superpowers skill must point OpenCode at a reference file that states
# the bare-id convention.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SKILL="$REPO_ROOT/skills/using-superpowers/SKILL.md"
REF="$REPO_ROOT/skills/using-superpowers/references/opencode-tools.md"

fail=0

if grep -q "OpenCode" "$SKILL" && grep -q "references/opencode-tools.md" "$SKILL"; then
  echo "  [PASS] using-superpowers points OpenCode at a reference file"
else
  echo "  [FAIL] using-superpowers does not point OpenCode at references/opencode-tools.md"
  fail=1
fi

if [ -f "$REF" ]; then
  echo "  [PASS] references/opencode-tools.md exists"
else
  echo "  [FAIL] references/opencode-tools.md missing"
  fail=1
fi

if [ -f "$REF" ] && grep -q "bare" "$REF" && grep -qi "skill" "$REF"; then
  echo "  [PASS] opencode-tools.md documents the bare skill-id convention"
else
  echo "  [FAIL] opencode-tools.md does not document the bare skill-id convention"
  fail=1
fi

exit $fail
