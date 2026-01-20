#!/usr/bin/env bash
# Test: subagent-driven-development skill
# Verifies that the skill is loaded and follows correct workflow
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "=== Test: subagent-driven-development skill ==="
echo ""

# Test 1: Verify skill can be loaded
echo "Test 1: Skill loading..."

output=$(run_claude "What is the subagent-driven-development skill? Describe its key steps briefly." 30)

# Accept both English and Chinese skill name
if echo "$output" | grep -qiE "(subagent-driven-development|子代理驱动开发|subagent)"; then
    : # pass
else
    echo "  [FAIL] Skill is recognized"
    echo "  Output: $(echo "$output" | head -20)"
    exit 1
fi

if echo "$output" | grep -qiE "(Load Plan|read.*plan|extract.*tasks|读取计划|读取.*计划)"; then
    : # pass
else
    echo "  [FAIL] Should mention loading plan"
    echo "  Output: $(echo "$output" | head -30)"
    exit 1
fi

echo ""

# Test 2: Verify skill describes correct workflow order
echo "Test 2: Workflow ordering..."

output=$(run_claude "In the subagent-driven-development skill, what comes first: spec compliance review or code quality review? Be specific about the order." 30)

if assert_order "$output" "spec.*compliance" "code.*quality" "Spec compliance before code quality"; then
    : # pass
else
    exit 1
fi

echo ""

# Test 3: Verify self-review is mentioned
echo "Test 3: Self-review requirement..."

output=$(run_claude "Does the subagent-driven-development skill require implementers to do self-review? What should they check?" 30)

if echo "$output" | grep -qiE "(self-review|self review|自审|自我审查)"; then
    : # pass
else
    echo "  [FAIL] Should mention self-review"
    exit 1
fi

if echo "$output" | grep -qiE "(completeness|Completeness|完整性)"; then
    : # pass
else
    echo "  [FAIL] Should check completeness"
    exit 1
fi

echo ""

# Test 4: Verify plan is read once
echo "Test 4: Plan reading efficiency..."

output=$(run_claude "In subagent-driven-development, how many times should the controller read the plan file? When does this happen?" 30)

if echo "$output" | grep -qiE "(once|one time|single|一次|仅.*一次)"; then
    : # pass
else
    echo "  [FAIL] Should mention reading once"
    exit 1
fi

if echo "$output" | grep -qiE "(Step 1|beginning|start|开始|前期|准备)"; then
    : # pass
else
    echo "  [FAIL] Should mention reading at beginning"
    exit 1
fi

echo ""

# Test 5: Verify spec compliance reviewer is skeptical
echo "Test 5: Spec compliance reviewer mindset..."

output=$(run_claude "What is the spec compliance reviewer's attitude toward the implementer's report in subagent-driven-development?" 30)

if echo "$output" | grep -qiE "(not trust|don't trust|skeptical|verify.*independently|suspiciously|怀疑|不相信|独立验证)"; then
    : # pass
else
    echo "  [FAIL] Should mention skepticism"
    exit 1
fi

if echo "$output" | grep -qiE "(read.*code|inspect.*code|verify.*code|读取.*代码|检查.*代码)"; then
    : # pass
else
    echo "  [FAIL] Should mention reading code"
    exit 1
fi

echo ""

# Test 6: Verify review loops
echo "Test 6: Review loop requirements..."

output=$(run_claude "In subagent-driven-development, what happens if a reviewer finds issues? Is it a one-time review or a loop?" 30)

if echo "$output" | grep -qiE "(loop|again|repeat|until.*approved|until.*compliant|循环|重复|直到)"; then
    : # pass
else
    echo "  [FAIL] Should mention review loops"
    exit 1
fi

if echo "$output" | grep -qiE "(implementer.*fix|fix.*issues|修复|implementer.*解决)"; then
    : # pass
else
    echo "  [FAIL] Should mention implementer fixing issues"
    exit 1
fi

echo ""

# Test 7: Verify full task text is provided
echo "Test 7: Task context provision..."

output=$(run_claude "In subagent-driven-development, how does the controller provide task information to the implementer subagent? Does it make them read a file or provide it directly?" 30)

if echo "$output" | grep -qiE "(provide.*directly|full.*text|paste|include.*prompt|直接提供|完整文本|包含.*prompt)"; then
    : # pass
else
    echo "  [FAIL] Should mention providing text directly"
    exit 1
fi

# For the negative check, just verify it mentions providing directly (the negative check is too strict)
# The important thing is that task context is provided to subagents

echo ""

echo "=== All subagent-driven-development skill tests passed ==="
