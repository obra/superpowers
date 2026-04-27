#!/usr/bin/env bash
# Verify that the Kimi SessionStart hook injects the correct bootstrap content,
# including explicit instructions to auto-read skills via ReadFile.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
HOOK_SCRIPT="$REPO_ROOT/.kimi/hooks/session-start"

echo "=== Kimi Bootstrap Content Test ==="
echo ""

errors=0

# 1. Hook script exists and is executable
if [ -x "$HOOK_SCRIPT" ]; then
    echo "PASS: Hook script exists and is executable"
else
    echo "FAIL: Hook script missing or not executable: $HOOK_SCRIPT" >&2
    ((errors++))
fi

# 2. Hook output contains Kimi-specific auto-read instructions
OUTPUT=$("$HOOK_SCRIPT" 2>/dev/null)

if echo "$OUTPUT" | grep -q "read its full SKILL.md file automatically"; then
    echo "PASS: Bootstrap contains auto-read instruction"
else
    echo "FAIL: Bootstrap missing auto-read instruction" >&2
    ((errors++))
fi

if echo "$OUTPUT" | grep -q "ReadFile"; then
    echo "PASS: Bootstrap mentions ReadFile for skill loading"
else
    echo "FAIL: Bootstrap missing ReadFile instruction" >&2
    ((errors++))
fi

if echo "$OUTPUT" | grep -q "When a skill's description matches"; then
    echo "PASS: Bootstrap contains description-matching trigger"
else
    echo "FAIL: Bootstrap missing description-matching trigger" >&2
    ((errors++))
fi

# 3. Hook output is valid JSON (check structure)
if echo "$OUTPUT" | grep -q '"hookSpecificOutput"' && \
   echo "$OUTPUT" | grep -q '"hookEventName"' && \
   echo "$OUTPUT" | grep -q '"additionalContext"'; then
    echo "PASS: Hook output has valid JSON structure"
else
    echo "FAIL: Hook output missing expected JSON fields" >&2
    ((errors++))
fi

# 4. AGENTS.md contains the same instructions
AGENTS_FILE="$REPO_ROOT/.kimi/AGENTS.md"
if [ -f "$AGENTS_FILE" ]; then
    if grep -q "read its full SKILL.md file automatically" "$AGENTS_FILE"; then
        echo "PASS: AGENTS.md contains auto-read instruction"
    else
        echo "FAIL: AGENTS.md missing auto-read instruction" >&2
        ((errors++))
    fi
else
    echo "FAIL: AGENTS.md not found" >&2
    ((errors++))
fi

echo ""
if [[ $errors -eq 0 ]]; then
    echo "All bootstrap content checks passed!"
    exit 0
else
    echo "$errors check(s) failed."
    exit 1
fi
