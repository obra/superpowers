#!/usr/bin/env bash
# Test: automated-development-workflow skill
# Verifies that the skill is loaded and follows correct workflow
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "=== Test: automated-development-workflow skill ==="
echo ""

# Test 1: Verify skill can be loaded
echo "Test 1: Skill loading..."

output=$(run_claude "What is the automated-development-workflow skill? Describe its purpose briefly." 30)

if assert_contains "$output" "automated-development-workflow\|自动化开发工作流" "Skill is recognized"; then
    : # pass
else
    exit 1
fi

if assert_contains "$output" "Git\|git\|commit\|提交\|workflow\|工作流" "Mentions git workflow"; then
    : # pass
else
    exit 1
fi

echo ""

# Test 2: Verify skill describes correct workflow steps
echo "Test 2: Workflow steps..."

output=$(run_claude "In the automated-development-workflow skill, what are the main steps? List them in order." 30)

if assert_contains "$output" "Step 1\|步骤 1\|status\|状态" "Mentions step 1 (show status)"; then
    : # pass
else
    exit 1
fi

if assert_contains "$output" "commit\|提交" "Mentions commit"; then
    : # pass
else
    exit 1
fi

echo ""

# Test 3: Verify commit message generation
echo "Test 3: Commit message generation..."

output=$(run_claude "How does the automated-development-workflow skill generate commit messages? What types can it use?" 30)

if assert_contains "$output" "feat\|fix\|docs\|chore\|type\|类型" "Mentions commit types"; then
    : # pass
else
    exit 1
fi

echo ""

# Test 4: Verify conflict resolution strategy
echo "Test 4: Conflict resolution..."

output=$(run_claude "In automated-development-workflow, how are merge conflicts resolved? What's the strategy for package.json?" 30)

if assert_contains "$output" "package\.json.*merge\|merge.*package\.json\|合并" "Mentions package.json merge strategy"; then
    : # pass
else
    exit 1
fi

if assert_contains "$output" "code.*file\|代码文件\|ours\|theirs\|infra-priority" "Mentions file-specific strategies"; then
    : # pass
else
    exit 1
fi

echo ""

# Test 5: Verify relationship with using-git-worktrees
echo "Test 5: Relationship with using-git-worktrees..."

output=$(run_claude "How does automated-development-workflow relate to using-git-worktrees? When should you use each?" 30)

if assert_contains "$output" "complement\|alternative\|替代\|互补" "Mentions relationship"; then
    : # pass
else
    exit 1
fi

if assert_contains "$output" "single.*branch\|one.*branch\|单分支\|parallel\|multi.*branch\|多分支" "Distinguishes use cases"; then
    : # pass
else
    exit 1
fi

echo ""

# Test 6: Verify quick commit mode
echo "Test 6: Quick commit mode..."

output=$(run_claude "What is quick commit mode in automated-development-workflow? What does it skip?" 30)

if assert_contains "$output" "quick.*commit\|快速.*提交\|skip\|跳过" "Mentions quick commit"; then
    : # pass
else
    exit 1
fi

if assert_contains "$output" "check\|检查\|quality" "Mentions what is skipped"; then
    : # pass
else
    exit 1
fi

echo ""

# Test 7: Verify configuration system
echo "Test 7: Configuration system..."

output=$(run_claude "How does automated-development-workflow read configuration? What file does it look for?" 30)

if assert_contains "$output" "config\|配置\|\.workflow-config\.json\|session.*context" "Mentions configuration"; then
    : # pass
else
    exit 1
fi

echo ""

# Test 8: Verify HEREDOC usage for commits
echo "Test 8: HEREDOC usage in commits..."

output=$(run_claude "In automated-development-workflow, how should multi-line commit messages be formatted? Why is this important?" 30)

if assert_contains "$output" "HEREDOC\|heredoc\|<<'EOF'\|cat <<'EOF'" "Mentions HEREDOC"; then
    : # pass
else
    exit 1
fi

if assert_contains "$output" "format\|格式\|multi.*line\|多行" "Mentions formatting importance"; then
    : # pass
else
    exit 1
fi

echo ""

# Test 9: Verify merge to develop workflow
echo "Test 9: Merge to develop workflow..."

output=$(run_claude "Describe the merge-to-develop workflow in automated-development-workflow. What are the key steps?" 30)

if assert_contains "$output" "checkout\|切换\|pull\|拉取\|merge\|合并" "Mentions merge steps"; then
    : # pass
else
    exit 1
fi

echo ""

# Test 10: Verify Chinese triggers
echo "Test 10: Chinese trigger phrases..."

output=$(run_claude "What Chinese phrases trigger the automated-development-workflow skill? Give me at least 3 examples." 30)

if assert_contains "$output" "下班\|提交\|工作流\|合并\|同步" "Mentions Chinese triggers"; then
    : # pass
else
    exit 1
fi

echo ""

echo "=== All automated-development-workflow skill tests passed ==="
