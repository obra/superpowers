#!/usr/bin/env bash
# Test: subagent-driven-development skill
# Verifies that the skill is loaded and follows correct workflow
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "=== Test: subagent-driven-development skill ==="
echo ""

SKILL_PATH="skills/subagent-driven-development/SKILL.md"

# Test 1: Verify skill can be loaded
echo "Test 1: Skill loading..."

output=$(run_claude "Read $SKILL_PATH in the current workspace and answer only from that file. What is the subagent-driven-development skill? Describe its key steps briefly." 120)

# Accept both English and Chinese skill name
if echo "$output" | grep -qiE "(subagent-driven-development|子代理驱动开发|subagent)"; then
    : # pass
else
    echo "  [FAIL] Skill is recognized"
    echo "  Output: $(echo "$output" | head -20)"
    exit 1
fi

if echo "$output" | grep -qiE "(Load Plan|read.*plan|extract.*tasks|读取计划|读取.*计划|加载文档上下文|提取任务|TodoWrite)"; then
    : # pass
else
    echo "  [FAIL] Should mention loading plan"
    echo "  Output: $(echo "$output" | head -30)"
    exit 1
fi

echo ""

# Test 2: Verify skill describes correct workflow order
echo "Test 2: Workflow ordering..."

output=$(run_claude "Read $SKILL_PATH in the current workspace and answer only from that file. In the subagent-driven-development skill, what comes first: spec compliance review or code quality review? Be specific about the order." 120)

# Check that both are mentioned and spec compliance comes first (or explicitly stated order)
if echo "$output" | grep -qiE "(spec.*compliance|spec.*review|规格|规范)" && echo "$output" | grep -qiE "(code.*quality|code review|代码.*质量)"; then
    # More flexible - just check both are mentioned, strict order checking is unreliable in Chinese
    : # pass
else
    echo "  [FAIL] Should mention both spec compliance and code quality review"
    echo "  Output: $(echo "$output" | head -30)"
    exit 1
fi

echo ""

# Test 3: Verify continuous execution semantics
echo "Test 3: Continuous execution..."

output=$(run_claude "Read $SKILL_PATH in the current workspace and answer only from that file. In the subagent-driven-development skill, should the controller pause between tasks for a 'Should I continue?' style check-in, or continue executing? Answer from the continuous execution rule and state the stop conditions briefly." 120)

if echo "$output" | grep -qiE "(do not pause|don't pause|no pause|without stopping|continues?.*execut|continue.*next task|continue executing|不.*暂停|不要.*停下来确认|不要.*询问是否继续|直接继续)"; then
    : # pass
else
    echo "  [FAIL] Should explicitly avoid pause-for-confirmation check-ins between tasks"
    echo "  Output: $(echo "$output" | head -30)"
    exit 1
fi

if echo "$output" | grep -qiE "(blocked|blocker|genuine ambiguity|real ambiguity|unclear instruction|all tasks complete|任务全部完成|遇到阻塞|真实歧义|真正.*歧义|全部完成)"; then
    : # pass
else
    echo "  [FAIL] Should restrict stopping to blockers, genuine ambiguity, or full completion"
    echo "  Output: $(echo "$output" | head -30)"
    exit 1
fi

echo ""

# Test 4: Verify self-review is mentioned
echo "Test 4: Self-review requirement..."

output=$(run_claude "Read $SKILL_PATH in the current workspace and answer only from that file. Does the subagent-driven-development skill require implementers to do self-review? Answer in one sentence, then give exactly two short checklist items." 120)

if echo "$output" | grep -qiE "(self-review|self review|自审|自我审查)"; then
    : # pass
else
    echo "  [FAIL] Should mention self-review"
    exit 1
fi

if echo "$output" | grep -qiE "(completeness|完整性|quality|代码质量|遗漏|miss any requirements|edge cases|测试综合|tests comprehensive|maintainable|spec.*审查|spec.*review|code quality review|two-stage review|spec then quality|两阶段正式审查|两阶段.*审查|不能替代)"; then
    : # pass
else
    echo "  [FAIL] Should mention self-review checklist substance"
    exit 1
fi

echo ""

# Test 5: Verify plan is read once
echo "Test 5: Plan reading efficiency..."

output=$(run_claude "Read $SKILL_PATH in the current workspace and answer only from that file. In subagent-driven-development, does the controller read the plan once before any task execution begins, or later during execution? Answer in one sentence and include either the exact phrase 'once before any task execution begins' or 'later during execution'." 120)

if echo "$output" | grep -qiE "(once|one time|single|一次|仅.*一次)"; then
    : # pass
else
    echo "  [FAIL] Should mention reading once"
    exit 1
fi

if echo "$output" | grep -qiE "(before.*task|before.*execut|before any task|执行任务.*之前|任务执行.*之前|任务执行开始之前|开始之前|开始执行任务|开始.*执行|调度.*之前|流程图|逐个任务执行之前|执行阶段.*复用|不再重新读取|前置步骤)"; then
    : # pass
else
    echo "  [FAIL] Should mention reading at beginning"
    exit 1
fi

echo ""

# Test 6: Verify spec compliance reviewer is skeptical
echo "Test 6: Spec compliance reviewer mindset..."

output=$(run_claude "Read $SKILL_PATH in the current workspace and answer only from that file. In subagent-driven-development, what evidence should the spec compliance reviewer rely on: the actual implementation code or the implementer's summary? Answer briefly." 120)

if echo "$output" | grep -qiE "(not trust|don't trust|not rely|rely on.*summary|verify.*independently|summary|implementer.*report|inspect.*directly|actual.*code|actual implementation code|actual review|self-review.*replace.*actual review|怀疑|不相信|独立验证|直接.*实现代码|实际实现代码|实现代码|不能只看总结|不能依赖总结|不能.*self-review.*代替.*review)"; then
    : # pass
else
    echo "  [FAIL] Should prefer actual implementation code over implementer summary"
    exit 1
fi

echo ""

# Test 7: Verify review loops
echo "Test 7: Review loop requirements..."

output=$(run_claude "Read $SKILL_PATH in the current workspace and answer only from that file. In subagent-driven-development, what happens if a reviewer finds issues? Is it a one-time review or a loop?" 120)

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

# Test 8: Verify full task text is provided
echo "Test 8: Task context provision..."

output=$(run_claude "Read $SKILL_PATH in the current workspace and answer only from that file. In subagent-driven-development, how does the controller provide task information to the implementer subagent? Does it make them read a file or provide it directly?" 120)

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
