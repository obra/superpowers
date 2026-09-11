#!/usr/bin/env bash
# Static contract test for bounded general delegation and authoring workflows.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

PARALLEL="$REPO_ROOT/skills/dispatching-parallel-agents/SKILL.md"
WRITING="$REPO_ROOT/skills/writing-skills/SKILL.md"
TESTING="$REPO_ROOT/skills/writing-skills/testing-skills-with-subagents.md"
EXAMPLE="$REPO_ROOT/skills/writing-skills/examples/CLAUDE_MD_TESTING.md"
BRAINSTORMING="$REPO_ROOT/skills/brainstorming/SKILL.md"
SPEC_REVIEWER="$REPO_ROOT/skills/brainstorming/spec-document-reviewer-prompt.md"
PLANNING="$REPO_ROOT/skills/writing-plans/SKILL.md"
PLAN_REVIEWER="$REPO_ROOT/skills/writing-plans/plan-document-reviewer-prompt.md"
README="$REPO_ROOT/README.md"
RUNNER="$REPO_ROOT/tests/claude-code/run-skill-tests.sh"

assert_has() {
    local file="$1"
    local pattern="$2"
    local label="$3"

    if grep -Eiq "$pattern" "$file"; then
        printf '  [PASS] %s\n' "$label"
    else
        printf '  [FAIL] %s\n' "$label"
        printf '         missing /%s/ in %s\n' "$pattern" "${file#"$REPO_ROOT/"}"
        return 1
    fi
}

assert_lacks() {
    local file="$1"
    local pattern="$2"
    local label="$3"

    if grep -Eiq "$pattern" "$file"; then
        printf '  [FAIL] %s\n' "$label"
        grep -Ein "$pattern" "$file" | sed 's/^/         /'
        return 1
    else
        printf '  [PASS] %s\n' "$label"
    fi
}

echo "=== Bounded authoring and delegation contract ==="

for field in 'agent.*role' 'model.*provider' 'reasoning effort' 'context tier' \
    'scope' 'independen' 'maximum.*(dispatch|activation)'; do
    assert_has "$PARALLEL" "$field" \
        "parallel proposal discloses $field"
done
assert_has "$PARALLEL" 'explicit approval' \
    "parallel dispatch requires explicit approval"
assert_has "$PARALLEL" 'children must not.*(delegate|create agents|create sessions)' \
    "parallel children cannot delegate"
assert_has "$PARALLEL" 'same (checkout|branch|worktree)|overlapping mutable scope' \
    "parallel writers cannot overlap"
assert_has "$PARALLEL" 'sequential|subagent-driven-development' \
    "dependent work routes away from fan-out"
assert_has "$PARALLEL" 'Never.*most capable available model' \
    "parallel workflow prohibits capability-based model routing"
assert_has "$PARALLEL" 'Do not automatically add a Rubber Duck, review swarm' \
    "parallel workflow prohibits automatic reviewer expansion"

for file in "$WRITING" "$TESTING"; do
    assert_has "$file" 'bounded test topology' \
        "$(basename "$file") requires a bounded test topology"
    assert_has "$file" 'one persistent test executor' \
        "$(basename "$file") reuses one test executor"
    assert_has "$file" 'same test executor performs revisions' \
        "$(basename "$file") keeps revisions with the executor"
    assert_has "$file" 'persistent independent read-only evaluator' \
        "$(basename "$file") limits evaluation to one read-only role"
    assert_has "$file" 'at most three total.*(evaluation|review) passes' \
        "$(basename "$file") caps evaluation passes"
    assert_has "$file" 'every.*(activation|resume).*counts' \
        "$(basename "$file") counts every child activation"
    assert_has "$file" 'stop for reapproval' \
        "$(basename "$file") stops before budget exhaustion"
    assert_has "$file" 'children must not.*(delegate|create agents|create sessions)' \
        "$(basename "$file") prohibits nested delegation"
done
assert_lacks "$WRITING" 'one fresh-context sample per call|single-shot subagent' \
    "writing workflow does not require fresh test agents"
assert_lacks "$TESTING" 'continue REFACTOR cycle|re-test until bulletproof' \
    "testing reference does not prescribe open-ended loops"
assert_has "$EXAMPLE" 'bounded test topology' \
    "worked example starts with an approved bounded topology"
assert_lacks "$EXAMPLE" 'Create subagent test harness' \
    "worked example does not end with an automatic test swarm"

assert_has "$BRAINSTORMING" 'direct.*self-review' \
    "brainstorming defaults to direct self-review"
assert_has "$BRAINSTORMING" 'approved persistent read-only reviewer' \
    "brainstorming permits only an approved persistent reviewer"
assert_has "$BRAINSTORMING" 'at most three total.*passes' \
    "brainstorming caps delegated document review"
assert_has "$PLANNING" 'direct.*self-review' \
    "plan authoring defaults to direct self-review"
assert_has "$PLANNING" 'approved persistent read-only reviewer' \
    "plan authoring permits only an approved persistent reviewer"
assert_has "$PLANNING" 'at most three total.*passes' \
    "plan authoring caps delegated document review"

for prompt in "$SPEC_REVIEWER" "$PLAN_REVIEWER"; do
    for field in 'AGENT_ROLE' 'EXACT_MODEL_AND_PROVIDER' 'REASONING_EFFORT' 'CONTEXT_TIER' \
        'ACTIVATION_BUDGET' 'ARTIFACT_PATH'; do
        assert_has "$prompt" "$field" \
            "$(basename "$prompt") requires $field"
    done
    assert_has "$prompt" 'read-only' \
        "$(basename "$prompt") is read-only"
    assert_has "$prompt" 'at most three total.*passes' \
        "$(basename "$prompt") caps review passes"
    assert_has "$prompt" 'must not.*(delegate|create agents|create sessions)' \
        "$(basename "$prompt") prohibits nested delegation"
    assert_has "$prompt" 'every activation or resume counts' \
        "$(basename "$prompt") counts every activation"
done

assert_has "$README" 'bounded parallel' \
    "README describes parallel delegation as bounded"
assert_has "$RUNNER" 'test-bounded-authoring-contract\.sh' \
    "fast test runner includes the bounded authoring contract"

echo "=== Bounded authoring and delegation contract passed ==="
