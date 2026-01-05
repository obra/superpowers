#!/usr/bin/env bash
# Test: writing-plans skill should trigger context gathering phases
# Scenario: User invokes /write-plan for a feature
# Expected: Claude announces context gathering, dispatches codebase explorers
# Baseline behavior: Jumps straight to writing plan without exploration
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "=== Test: writing-plans context gathering phases ==="
echo ""

# Test 1: Verify skill describes context gathering phases
echo "Test 1: Context gathering phases exist..."

output=$(run_claude "What are the context gathering phases in the writing-plans skill? List them." 30)

if assert_contains "$output" "Context Gathering\|context gathering" "Mentions context gathering"; then
    : # pass
else
    exit 1
fi

if assert_contains "$output" "Phase 1\|Codebase Exploration" "Phase 1: Codebase Exploration"; then
    : # pass
else
    exit 1
fi

if assert_contains "$output" "Phase 2\|Documentation Exploration" "Phase 2: Documentation Exploration"; then
    : # pass
else
    exit 1
fi

if assert_contains "$output" "Phase 3\|Best Practices\|Examples" "Phase 3: Best Practices & Examples"; then
    : # pass
else
    exit 1
fi

echo ""

# Test 2: Verify codebase exploration uses parallel subagents
echo "Test 2: Codebase exploration uses parallel subagents..."

output=$(run_claude "In the writing-plans skill, how does Phase 1 (Codebase Exploration) work? Does it use parallel subagents?" 30)

if assert_contains "$output" "parallel\|Parallel" "Uses parallel subagents"; then
    : # pass
else
    exit 1
fi

if assert_contains "$output" "3-5\|3 to 5\|three to five" "Dispatches 3-5 subagents"; then
    : # pass
else
    exit 1
fi

if assert_contains "$output" "handoff\|handoffs" "Writes to handoff files"; then
    : # pass
else
    exit 1
fi

echo ""

# Test 3: Verify documentation exploration follows codebase exploration
echo "Test 3: Documentation exploration follows codebase..."

output=$(run_claude "In the writing-plans skill, does Phase 2 use findings from Phase 1?" 60)

if assert_contains "$output" "from.*codebase\|based on.*codebase\|codebase.*findings\|yes\|Yes" "Docs phase uses codebase findings"; then
    : # pass
else
    exit 1
fi

echo ""

# Test 4: Verify all three phases must complete before plan writing
echo "Test 4: All phases required before plan writing..."

output=$(run_claude "In the writing-plans skill, can you start writing the plan before completing all three context gathering phases?" 60)

if assert_contains "$output" "after.*all\|After.*all\|complete.*all.*phases\|all three phases" "Must complete all phases"; then
    : # pass
else
    exit 1
fi

if assert_contains "$output" "summary\|summaries" "Reads summary files"; then
    : # pass
else
    exit 1
fi

echo ""

# Test 5: Verify handoff file structure
echo "Test 5: Handoff file structure..."

output=$(run_claude "In the writing-plans skill context gathering phases, where do subagents write their findings?" 60)

if assert_contains "$output" "docs/handoffs\|docs\/handoffs" "Uses docs/handoffs directory"; then
    : # pass
else
    exit 1
fi

if assert_contains "$output" "context-codebase\|context-docs\|context-web" "Uses structured naming"; then
    : # pass
else
    exit 1
fi

echo ""

# Test 6: Verify synthesis files are created between phases
echo "Test 6: Synthesis files mentioned between phases..."

output=$(run_claude "In the writing-plans skill, what happens after each context gathering phase completes?" 60)

if assert_contains "$output" "summary\|synthesis" "Creates summary/synthesis files"; then
    : # pass
else
    exit 1
fi

if assert_contains "$output" "context-codebase-summary\|context-docs-summary\|context-web-summary" "Creates specific summary files"; then
    : # pass
else
    exit 1
fi

if assert_contains "$output" "Read.*handoff\|reads.*handoff" "Reads handoff files"; then
    : # pass
else
    exit 1
fi

echo ""

# Test 7: Verify plan header includes "Context Gathered From" section
echo "Test 7: Plan header includes Context Gathered From..."

output=$(run_claude "In the writing-plans skill, what should the plan document header include?" 60)

if assert_contains "$output" "Context Gathered From" "Has 'Context Gathered From' section"; then
    : # pass
else
    exit 1
fi

if assert_contains "$output" "context-codebase-summary\|Codebase.*summary" "References codebase summary"; then
    : # pass
else
    exit 1
fi

if assert_contains "$output" "context-docs-summary\|Documentation.*summary" "References docs summary"; then
    : # pass
else
    exit 1
fi

if assert_contains "$output" "context-web-summary\|Best Practices.*summary" "References web summary"; then
    : # pass
else
    exit 1
fi

echo ""

# Test 8: Verify codebase-explorer-prompt.md exists and has required sections
echo "Test 8: Codebase explorer prompt template exists..."

PROMPT_FILE="$SCRIPT_DIR/../../skills/writing-plans/codebase-explorer-prompt.md"

if [ ! -f "$PROMPT_FILE" ]; then
    echo "FAIL: codebase-explorer-prompt.md does not exist"
    exit 1
fi

content=$(cat "$PROMPT_FILE")

if echo "$content" | grep -q "Codebase Explorer Subagent Prompt Template"; then
    echo "PASS: Has correct title"
else
    echo "FAIL: Missing correct title"
    exit 1
fi

if echo "$content" | grep -q "Your Exploration Focus"; then
    echo "PASS: Has 'Your Exploration Focus' section"
else
    echo "FAIL: Missing 'Your Exploration Focus' section"
    exit 1
fi

if echo "$content" | grep -q "Write Handoff File"; then
    echo "PASS: Has 'Write Handoff File' section"
else
    echo "FAIL: Missing 'Write Handoff File' section"
    exit 1
fi

if echo "$content" | grep -q "docs/handoffs/context-codebase-{aspect}.md"; then
    echo "PASS: Specifies correct handoff file path"
else
    echo "FAIL: Missing correct handoff file path"
    exit 1
fi

echo ""

echo "=== All writing-plans context gathering tests passed ==="
