#!/usr/bin/env bash
# Integration Test: lifecycle extensions
# Verifies that Claude actually invokes extension skills at ALL 7 lifecycle events
# during real workflow execution (not just that it knows about them)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-helpers.sh"

echo "========================================"
echo " Integration Test: lifecycle extensions"
echo "========================================"
echo ""
echo "This test verifies the canary extension is invoked at all 7 lifecycle events:"
echo "  Session 1 (executing-plans): pre-task, post-task, post-execution"
echo "  Session 2 (writing-plans):   post-plan"
echo "  Session 3 (code review):     post-review"
echo "  Session 4 (finish branch):   pre-finish"
echo "  Session 5 (brainstorming):   post-brainstorm"
echo ""
echo "WARNING: This test runs 5 Claude sessions and may take 15-30 minutes."
echo ""

# Create test project
TEST_PROJECT=$(create_test_project)
echo "Test project: $TEST_PROJECT"

# Paths for canary skill and extensions manifest
CANARY_SKILL_DIR="$HOME/.claude/skills/lifecycle-canary"
EXTENSIONS_DIR="$HOME/.superpowers"
EXTENSIONS_FILE="$EXTENSIONS_DIR/extensions.yaml"
BACKUP_EXTENSIONS=""
CANARY_EXISTED=false

cleanup() {
    if [ -n "$BACKUP_EXTENSIONS" ] && [ -f "$BACKUP_EXTENSIONS" ]; then
        mkdir -p "$EXTENSIONS_DIR"
        mv "$BACKUP_EXTENSIONS" "$EXTENSIONS_FILE"
    else
        rm -f "$EXTENSIONS_FILE"
        [ -d "$EXTENSIONS_DIR" ] && rmdir "$EXTENSIONS_DIR" 2>/dev/null || true
    fi
    if [ "$CANARY_EXISTED" = false ] && [ -d "$CANARY_SKILL_DIR" ]; then
        rm -rf "$CANARY_SKILL_DIR"
    fi
    cleanup_test_project "$TEST_PROJECT"
}
trap cleanup EXIT

if [ -f "$EXTENSIONS_FILE" ]; then
    BACKUP_EXTENSIONS=$(mktemp)
    cp "$EXTENSIONS_FILE" "$BACKUP_EXTENSIONS"
fi
[ -d "$CANARY_SKILL_DIR" ] && CANARY_EXISTED=true

# --- Create canary extension skill ---
mkdir -p "$CANARY_SKILL_DIR"
cat > "$CANARY_SKILL_DIR/SKILL.md" << 'SKILLEOF'
---
name: lifecycle-canary
description: Test-only extension that outputs a marker when invoked at a lifecycle event
---

# Lifecycle Canary

You have been invoked as a lifecycle extension canary.

Output exactly this line:

**LIFECYCLE_CANARY_EXECUTED**

That is all. Do not modify files, run commands, or take any other action.
SKILLEOF

# --- Register canary at ALL 7 lifecycle events ---
mkdir -p "$EXTENSIONS_DIR"
cat > "$EXTENSIONS_FILE" << 'YAML'
extensions:
  post-brainstorm:
    - lifecycle-canary
  post-plan:
    - lifecycle-canary
  pre-task:
    - lifecycle-canary
  post-task:
    - lifecycle-canary
  post-execution:
    - lifecycle-canary
  post-review:
    - lifecycle-canary
  pre-finish:
    - lifecycle-canary
YAML

# --- Set up test project ---
cd "$TEST_PROJECT"

cat > package.json << 'PKGJSON'
{
  "name": "test-extensions-integration",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "test": "node --test"
  }
}
PKGJSON

mkdir -p src test docs/superpowers/plans docs/superpowers/specs

cat > docs/superpowers/plans/test-plan.md << 'PLAN'
# Test Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a hello function with tests

**Architecture:** Single module with one exported function

**Tech Stack:** Node.js with built-in test runner

---

### Task 1: Create Hello Function

**Files:**
- Create: `src/hello.js`
- Create: `test/hello.test.js`

- [ ] **Step 1: Create the implementation**

Create `src/hello.js`:
```javascript
export function hello(name) {
  return `Hello, ${name}!`;
}
```

- [ ] **Step 2: Create the test**

Create `test/hello.test.js`:
```javascript
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { hello } from '../src/hello.js';

describe('hello', () => {
  it('greets by name', () => {
    assert.strictEqual(hello('World'), 'Hello, World!');
  });
});
```

- [ ] **Step 3: Run tests**

Run: `npm test`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/hello.js test/hello.test.js
git commit -m "feat: add hello function"
```
PLAN

git init --quiet
git config user.email "test@test.com"
git config user.name "Test User"
git add .
git commit -m "Initial commit" --quiet

SUPERPOWERS_DIR="$SCRIPT_DIR/../.."

# Session transcript directory (matches Claude Code's path escaping)
SESSION_DIR="$HOME/.claude/projects/$(cd "$SUPERPOWERS_DIR" && pwd | sed 's/\//-/g')"

# Verify session directory exists
if [ ! -d "$SESSION_DIR" ]; then
    echo "ERROR: Session directory not found: $SESSION_DIR"
    exit 1
fi

FAILED=0
EVENTS_VERIFIED=0

# Helper: run a session, find its transcript, and verify canary invocations
# Usage: run_and_verify SESSION_NAME PROMPT TIMEOUT MIN_CANARY_CALLS EVENT_NAMES...
run_and_verify() {
    local session_name="$1" prompt="$2" session_timeout="$3" min_calls="$4"
    shift 4
    local events=("$@")

    # Verify extensions file exists before each session
    if [ ! -f "$EXTENSIONS_FILE" ]; then
        echo "  [ERROR] Extensions file missing before $session_name! Recreating..."
        mkdir -p "$EXTENSIONS_DIR"
        cat > "$EXTENSIONS_FILE" << 'YAMLEOF'
extensions:
  post-brainstorm:
    - lifecycle-canary
  post-plan:
    - lifecycle-canary
  pre-task:
    - lifecycle-canary
  post-task:
    - lifecycle-canary
  post-execution:
    - lifecycle-canary
  post-review:
    - lifecycle-canary
  pre-finish:
    - lifecycle-canary
YAMLEOF
    fi

    # Record timestamp before session
    local ts_file
    ts_file=$(mktemp)
    touch "$ts_file"
    sleep 1

    # Run Claude session
    cd "$SUPERPOWERS_DIR" && timeout "$session_timeout" claude -p "$prompt" \
        --allowed-tools=all \
        --add-dir "$TEST_PROJECT" \
        --permission-mode bypassPermissions \
        2>&1 | tee "$TEST_PROJECT/${session_name}-output.txt" || true

    # Allow JSONL to be fully flushed
    sleep 2

    # Find the new session transcript
    local session_file
    session_file=$(find "$SESSION_DIR" -maxdepth 1 -name "*.jsonl" -type f -newer "$ts_file" 2>/dev/null | sort -r | head -1)
    rm -f "$ts_file"

    echo ""
    echo "--- $session_name Results ---"

    if [ -z "$session_file" ]; then
        echo "  [FAIL] No session transcript found"
        for event in "${events[@]}"; do
            FAILED=$((FAILED + 1))
        done
        return
    fi

    echo "  Transcript: $(basename "$session_file")"

    # Count canary Skill invocations in transcript (matches repo pattern)
    local canary_count
    canary_count=$(grep -c '"skill":"lifecycle-canary"' "$session_file" 2>/dev/null || true)
    canary_count=${canary_count:-0}
    echo "  Canary Skill calls: $canary_count (expected >= $min_calls)"

    if [ "$canary_count" -ge "$min_calls" ]; then
        for event in "${events[@]}"; do
            echo "  [PASS] $event: canary invoked ($canary_count total)"
            EVENTS_VERIFIED=$((EVENTS_VERIFIED + 1))
        done
    else
        # Show diagnostic info
        echo "  Transcript Skill calls:"
        grep '"name":"Skill"' "$session_file" 2>/dev/null | python3 -c "
import sys, json
for line in sys.stdin:
    try:
        obj = json.loads(line)
        for b in obj.get('message',{}).get('content',[]):
            if isinstance(b,dict) and b.get('type')=='tool_use' and b.get('name')=='Skill':
                print(f\"    {json.dumps(b.get('input',{}))}\")
    except: pass
" 2>/dev/null || true
        echo "  Output snippet:"
        head -5 "$TEST_PROJECT/${session_name}-output.txt" 2>/dev/null | sed 's/^/    /'
        for event in "${events[@]}"; do
            echo "  [FAIL] $event: canary NOT invoked"
            FAILED=$((FAILED + 1))
        done
    fi
}

# ============================================================
# Session 1: executing-plans → pre-task, post-task, post-execution
# ============================================================
echo "========================================"
echo " Session 1: executing-plans"
echo " Events: pre-task, post-task, post-execution"
echo "========================================"
echo ""

PROMPT1="Change to directory $TEST_PROJECT and execute the plan at docs/superpowers/plans/test-plan.md using the executing-plans skill.

IMPORTANT:
- Use the executing-plans skill (not subagent-driven-development)
- Check the extensions registry at each lifecycle event as the skill instructs
- After all tasks complete and you have checked post-execution extensions, STOP
- Do NOT proceed to finishing-a-development-branch — just report that you are done"

run_and_verify "session1" "$PROMPT1" 900 3 pre-task post-task post-execution

# Also verify implementation works
if [ -f "$TEST_PROJECT/src/hello.js" ] && cd "$TEST_PROJECT" && npm test > /dev/null 2>&1; then
    echo "  [PASS] Implementation correct, tests pass"
else
    echo "  [FAIL] Implementation broken"
    FAILED=$((FAILED + 1))
fi
echo ""

# ============================================================
# Session 2: writing-plans → post-plan
# ============================================================
echo "========================================"
echo " Session 2: writing-plans"
echo " Events: post-plan"
echo "========================================"
echo ""

cat > "$TEST_PROJECT/docs/superpowers/specs/test-spec.md" << 'SPEC'
# Add Goodbye Function

## Problem
We need a goodbye function.

## Solution
Add a `goodbye(name)` function to `src/hello.js` that returns `Goodbye, {name}!`.

## Files Changed
| File | Change |
|------|--------|
| `src/hello.js` | Add goodbye function |
| `test/hello.test.js` | Add goodbye tests |
SPEC

PROMPT2="Change to directory $TEST_PROJECT. Use the writing-plans skill to write an implementation plan based on the spec at docs/superpowers/specs/test-spec.md.

IMPORTANT:
- Use the writing-plans skill
- Save the plan to docs/superpowers/plans/goodbye-plan.md
- After saving the plan, check the extensions registry for post-plan extensions as the skill instructs
- After checking post-plan extensions, STOP. Do not offer execution choices or proceed further.
- This is a very simple spec — keep the plan minimal (1 task is fine)"

run_and_verify "session2" "$PROMPT2" 600 1 post-plan
echo ""

# ============================================================
# Session 3: requesting-code-review → post-review
# ============================================================
echo "========================================"
echo " Session 3: requesting-code-review"
echo " Events: post-review"
echo "========================================"
echo ""

PROMPT3="Change to directory $TEST_PROJECT. Use the requesting-code-review skill to review the most recent commit.

IMPORTANT:
- Use the requesting-code-review skill
- After the review completes, check the extensions registry for post-review extensions as the skill instructs
- After checking post-review extensions, STOP and report the review results"

run_and_verify "session3" "$PROMPT3" 600 1 post-review
echo ""

# ============================================================
# Session 4: finishing-a-development-branch → pre-finish
# ============================================================
echo "========================================"
echo " Session 4: finishing-a-development-branch"
echo " Events: pre-finish"
echo "========================================"
echo ""

cd "$TEST_PROJECT"
git checkout -b feat/test-feature --quiet 2>/dev/null || true

PROMPT4="Change to directory $TEST_PROJECT. Use the finishing-a-development-branch skill.

IMPORTANT:
- Use the finishing-a-development-branch skill
- Tests should pass (run npm test)
- The skill has a Step 1.5 that checks pre-finish extensions — you MUST do this step
- Read the extensions registry at ~/.superpowers/extensions.yaml and invoke each pre-finish extension skill
- After invoking pre-finish extensions, choose option 3 (keep the branch as-is)
- STOP after that"

run_and_verify "session4" "$PROMPT4" 600 1 pre-finish
echo ""

# ============================================================
# Session 5: brainstorming → post-brainstorm
# ============================================================
echo "========================================"
echo " Session 5: brainstorming (transition)"
echo " Events: post-brainstorm"
echo "========================================"
echo ""

cat > "$TEST_PROJECT/docs/superpowers/specs/logging-spec.md" << 'SPEC'
# Add Logging

## Problem
We need basic logging.

## Solution
Add a `log(message)` function that writes to console.

## Files Changed
| File | Change |
|------|--------|
| `src/logger.js` | Create logger module |
| `test/logger.test.js` | Add tests |
SPEC

PROMPT5="Change to directory $TEST_PROJECT. You are in the brainstorming skill and have just completed the spec self-review step. The user has approved the spec at docs/superpowers/specs/logging-spec.md.

You are now at the Implementation step of the brainstorming skill. According to the brainstorming skill instructions, before invoking writing-plans you must check the extensions registry for post-brainstorm extensions and invoke each in order.

IMPORTANT:
- Check the extensions registry for post-brainstorm extensions NOW
- After invoking post-brainstorm extensions, STOP
- Do NOT invoke writing-plans or any other skill — just report that you checked post-brainstorm extensions"

run_and_verify "session5" "$PROMPT5" 300 1 post-brainstorm
echo ""

# ============================================================
# Summary
# ============================================================
echo "========================================"
echo " Test Summary: All 7 Lifecycle Events"
echo "========================================"
echo ""
echo "  Events verified: $EVENTS_VERIFIED / 7"
echo "  Failures: $FAILED"
echo ""
echo "  post-brainstorm  — Session 5 (brainstorming)"
echo "  post-plan        — Session 2 (writing-plans)"
echo "  pre-task         — Session 1 (executing-plans)"
echo "  post-task        — Session 1 (executing-plans)"
echo "  post-execution   — Session 1 (executing-plans)"
echo "  post-review      — Session 3 (requesting-code-review)"
echo "  pre-finish       — Session 4 (finishing-a-development-branch)"
echo ""

if [ "$FAILED" -eq 0 ]; then
    echo "STATUS: PASSED"
    echo ""
    echo "All 7 lifecycle events correctly invoke the canary extension."
    exit 0
else
    echo "STATUS: FAILED ($FAILED failure(s))"
    echo ""
    echo "Session outputs saved in: $TEST_PROJECT/"
    exit 1
fi
