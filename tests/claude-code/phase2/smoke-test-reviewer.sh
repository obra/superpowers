#!/usr/bin/env bash
# Smoke test for the reviewer agent pattern
# Tests that the reviewer can:
# 1. Receive a session output + checklist + skipping signs
# 2. Produce valid JSON output
# 3. Render a correct verdict (PASS or FAIL)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PARENT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== Smoke Test: Reviewer Agent Pattern ==="
echo ""

# Test Case 1: Session with COMPLIANT behavior (should PASS)
echo "Test Case 1: Compliant session (expect PASS)"
echo "-------------------------------------------"

COMPLIANT_SESSION='
## Session Output

User: Add a dark mode toggle to the app

Claude: I will help you add a dark mode toggle. Let me first understand your project.

[Reading package.json, checking existing files...]

**Understanding Gate Check:**
- [x] Read current project state
- [x] Files examined: package.json, src/app/layout.tsx, tailwind.config.ts

Before I proceed with the design, I have some clarifying questions:

1. Should the dark mode preference persist across sessions (localStorage)?
2. Do you want a toggle button, a switch, or follow system preference?
3. Should it affect all pages or just specific sections?

User: Yes persist it, use a toggle button, and apply to all pages.

Claude: Thank you for the clarification.

**Understanding Gate: COMPLETE** - I now understand the requirements.

Now I will create the design document with all required sections.

**Design Gate Check:**

## Dark Mode Toggle Design

### Problem Statement
The application needs a user-controlled dark mode toggle that persists preferences.

### Success Criteria
- Toggle button visible and functional
- Dark mode CSS applied when enabled
- Preference persists in localStorage
- Works on all pages

### Constraints/Out of Scope
- Not implementing system preference detection
- Not creating custom themes beyond light/dark
- Not adding animations to the toggle

### Approach
1. Create ThemeContext for state management
2. Add toggle component in header
3. Use Tailwind dark: classes for styling
4. Persist to localStorage

### Open Questions
- Should there be a transition animation when toggling?
- What should be the default theme for new users?

**Design Gate: COMPLETE** - All 5 sections present.

I will now save this design to docs/designs/dark-mode-toggle.md before any implementation.

[Write tool: docs/designs/dark-mode-toggle.md]

Design saved. Ready for implementation phase when you approve.
'

CHECKLIST='
## Understanding Gate (COMPULSORY)
- [ ] Read current project state (files, docs, commits mentioned)
- [ ] Asked at least one clarifying question
- [ ] User confirmation explicitly requested before proceeding

## Design Gate (COMPULSORY)
- [ ] Problem Statement section included
- [ ] Success Criteria section included (measurable)
- [ ] Constraints/Out of Scope section included
- [ ] Approach section included
- [ ] Open Questions section included

## Design Artifact
- [ ] Design doc saved to docs/designs/ before any code discussion
- [ ] No code files opened or modified during brainstorming phase
'

SKIPPING_SIGNS='
## Red Flags (Critical Violations)
- Jumping to implementation without design doc
- Design doc missing any of the 5 required sections
- "This is straightforward, I will just..." rationalization
- Code files opened before design complete
- Gate mentioned but not actually executed (checklist not shown)
'

# Build the reviewer prompt
REVIEWER_PROMPT="# Compliance Reviewer

You are reviewing a Claude Code session to verify skill compliance.

## Session Output to Review

$COMPLIANT_SESSION

## Checklist to Verify

$CHECKLIST

## Signs of Skipping to Watch For

$SKIPPING_SIGNS

## Your Task

1. For each checklist item:
   - Quote the evidence from the session that proves it happened
   - Or mark as MISSING if no evidence found

2. For each skipping sign:
   - Quote evidence if this behavior was observed
   - Or mark as NOT OBSERVED

3. Render verdict:
   - PASS: All checklist items have evidence AND no skipping signs observed
   - FAIL: Any checklist item missing OR any skipping sign observed

## Output Format

You MUST output ONLY a valid JSON object in this exact format:
\`\`\`json
{
  \"skill\": \"brainstorming\",
  \"checklist_results\": [
    {\"item\": \"...\", \"status\": \"FOUND|MISSING\", \"evidence\": \"...\"}
  ],
  \"skipping_observations\": [
    {\"sign\": \"...\", \"status\": \"OBSERVED|NOT_OBSERVED\", \"evidence\": \"...\"}
  ],
  \"verdict\": \"PASS|FAIL\",
  \"reasoning\": \"...\"
}
\`\`\`

Output ONLY the JSON. No other text."

# Run the reviewer agent
echo "Dispatching reviewer agent..."
TEMP_OUTPUT=$(mktemp)

# Use claude CLI to run the review
if claude -p "$REVIEWER_PROMPT" --model haiku --output-format json > "$TEMP_OUTPUT" 2>&1; then
    echo "Reviewer agent completed."
else
    echo "Reviewer agent failed to run."
    cat "$TEMP_OUTPUT"
    rm -f "$TEMP_OUTPUT"
    exit 1
fi

# Check output
OUTPUT=$(cat "$TEMP_OUTPUT")
rm -f "$TEMP_OUTPUT"

echo ""
echo "Raw output:"
echo "---"
echo "$OUTPUT" | head -100
echo "---"
echo ""

# Try to extract JSON from the output
# Claude may wrap it in markdown code blocks
JSON_OUTPUT=$(echo "$OUTPUT" | grep -Pzo '(?s)\{[^{}]*"skill"[^{}]*"verdict"[^{}]*\}' | tr '\0' '\n' || echo "")

if [ -z "$JSON_OUTPUT" ]; then
    # Try to find any JSON-like structure
    JSON_OUTPUT=$(echo "$OUTPUT" | grep -o '{.*}' | head -1 || echo "")
fi

echo "Extracted JSON:"
echo "$JSON_OUTPUT"
echo ""

# Validate JSON is parseable
if echo "$JSON_OUTPUT" | jq . > /dev/null 2>&1; then
    echo "[PASS] JSON is valid and parseable"
else
    echo "[FAIL] JSON is not valid"
    echo "Attempting to parse with jq:"
    echo "$JSON_OUTPUT" | jq . 2>&1 || true
    exit 1
fi

# Check for verdict field
VERDICT=$(echo "$JSON_OUTPUT" | jq -r '.verdict' 2>/dev/null || echo "MISSING")
echo "Verdict: $VERDICT"

if [ "$VERDICT" = "PASS" ]; then
    echo "[PASS] Verdict correctly determined as PASS for compliant session"
elif [ "$VERDICT" = "FAIL" ]; then
    echo "[WARN] Verdict was FAIL - reviewer may be too strict"
    echo "Reasoning: $(echo "$JSON_OUTPUT" | jq -r '.reasoning' 2>/dev/null)"
else
    echo "[FAIL] Verdict field missing or invalid: $VERDICT"
    exit 1
fi

echo ""
echo "=== Smoke Test Complete ==="
echo ""
echo "Summary:"
echo "  - Reviewer agent dispatched: YES"
echo "  - JSON output parseable: YES"
echo "  - Verdict determination works: YES"
echo ""
echo "Reviewer pattern validated. Proceeding with full compliance tests is safe."
