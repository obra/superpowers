#!/usr/bin/env bash
# Test: using-git-worktrees native tool preference
# Verifies the skill prefers host-native worktree tools over manual git fallback
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

MODE="${1:-green}"

if [ "$MODE" != "green" ]; then
    echo "Usage: $0 green" >&2
    exit 2
fi

echo "=== Test: using-git-worktrees native tool preference ==="
echo ""

SKILL_PATH="skills/using-git-worktrees/SKILL.md"

if ! command -v claude > /dev/null 2>&1; then
    echo "SKIPPED: Claude Code CLI not found"
    exit 0
fi

echo "Test 1: Native worktree tools should be the default when available..."

output=$(run_claude "Read $SKILL_PATH in the current workspace and answer only from that file. If the platform exposes native worktree tools in context (for example EnterWorktree, WorktreeCreate, /worktree, or a --worktree flag), should the agent use those first or jump straight to git worktree add? Answer briefly and mention the fallback rule." 180)

if echo "$output" | grep -qiE "(EnterWorktree|WorktreeCreate|/worktree|--worktree|native worktree tool|built-in.*worktree|platform.*worktree|managed.*worktree|host-provided.*worktree|原生.*worktree|原生工具|内置.*worktree|平台.*worktree)"; then
    : # pass
else
    echo "  [FAIL] Should mention native worktree tools explicitly"
    echo "  Output: $(echo "$output" | head -30)"
    exit 1
fi

if echo "$output" | grep -qiE "(use.*first|prefer|default.*path|优先|先使用|默认.*原生)"; then
    : # pass
else
    echo "  [FAIL] Should state native tools are preferred when available"
    echo "  Output: $(echo "$output" | head -30)"
    exit 1
fi

if echo "$output" | grep -qiE "(fallback|last resort|manual git|only if.*no native|only when.*no native|not.*default|仅.*fallback|最后手段|手动.*git|只有.*没有原生|无原生工具.*才|不是默认)"; then
    : # pass
else
    echo "  [FAIL] Should limit git worktree add to fallback-only usage"
    echo "  Output: $(echo "$output" | head -30)"
    exit 1
fi

echo ""

echo "Test 2: User consent should authorize native worktree tool usage..."

output=$(run_claude "Read $SKILL_PATH in the current workspace and answer only from that file. If the user agrees to create an isolated workspace and native worktree tools are available, does that consent authorize using the native tool directly, or should the agent stop and ask again before using it? Answer in one or two sentences." 180)

if echo "$output" | grep -qiE "(consent|authorize|authorization|permission|agrees?|approves?|同意|授权|允许|许可|批准)"; then
    : # pass
else
    echo "  [FAIL] Should discuss user consent or authorization"
    echo "  Output: $(echo "$output" | head -30)"
    exit 1
fi

if echo "$output" | grep -qiE "(use.*directly|directly use|can use.*native|go ahead|proceed|enough to use|no need.*ask again|do not ask again|no extra confirmation|直接使用|可直接|继续使用|不用再次询问|无需再次确认|无需再次询问|不必再次确认)"; then
    : # pass
else
    echo "  [FAIL] Should bridge consent to direct native tool usage"
    echo "  Output: $(echo "$output" | head -30)"
    exit 1
fi

echo ""

echo "Test 3: Direct git fallback should be treated as wrong when native tools exist..."

output=$(run_claude "Read $SKILL_PATH in the current workspace and answer only from that file. If native worktree tools are available but the agent immediately answers with git worktree add, is that correct or a mistake? State why briefly." 180)

if echo "$output" | grep -qiE "(mistake|wrong|error|incorrect|should not|not correct|不对|错误|失误|不应该|不正确)"; then
    : # pass
else
    echo "  [FAIL] Should reject immediate git worktree add when native tools exist"
    echo "  Output: $(echo "$output" | head -30)"
    exit 1
fi

if echo "$output" | grep -qiE "(native tool|built-in|platform|managed|host-provided|manual git|fallback|原生工具|内置|平台|手动.*git|fallback|回退)"; then
    : # pass
else
    echo "  [FAIL] Should explain why native-managed isolation wins over manual fallback"
    echo "  Output: $(echo "$output" | head -30)"
    exit 1
fi

echo ""
echo "=== All using-git-worktrees native preference tests passed ==="
