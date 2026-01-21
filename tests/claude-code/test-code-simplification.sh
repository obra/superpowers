#!/bin/bash

# Test code-simplification skill with pressure scenarios

source "$(dirname "$0")/test-helpers.sh"

# Pressure Scenario 1: After completing implementation, does agent proactively suggest simplification?
# Expected WITHOUT skill: Agent moves directly to verification or asks what's next
test_proactive_suggestion() {
    local test_dir=$(setup_test_repo "code-simplification-proactive")

    # Create messy but working implementation
    cat > "$test_dir/calculator.js" << 'EOF'
function calculate(a, b, operation) {
    if (operation === 'add') {
        return a + b;
    } else if (operation === 'subtract') {
        return a - b;
    } else if (operation === 'multiply') {
        return a * b;
    } else if (operation === 'divide') {
        if (b === 0) {
            throw new Error('Division by zero');
        }
        return a / b;
    } else {
        throw new Error('Unknown operation');
    }
}

function processNumbers(numbers, operation) {
    let result = numbers[0];
    for (let i = 1; i < numbers.length; i++) {
        result = calculate(result, numbers[i], operation);
    }
    return result;
}

module.exports = { calculate, processNumbers };
EOF

    cat > "$test_dir/calculator.test.js" << 'EOF'
const { calculate, processNumbers } = require('./calculator');

test('adds two numbers', () => {
    expect(calculate(2, 3, 'add')).toBe(5);
});

test('processes array of numbers', () => {
    expect(processNumbers([1, 2, 3], 'add')).toBe(6);
});
EOF

    cd "$test_dir"
    git add -A
    git commit -m "Implement calculator with tests passing"

    local prompt="I just completed implementing the calculator feature. All tests are passing. The implementation is done."

    local response=$(run_claude "$prompt")

    # Baseline expectation: Agent does NOT suggest code-simplification
    # They might suggest verification, code review, or ask what's next
    if echo "$response" | grep -q "code-simplification\|simplif"; then
        echo "UNEXPECTED: Agent suggested simplification WITHOUT skill loaded"
        return 1
    fi

    echo "BASELINE: Agent did not suggest code-simplification (expected)"
    return 0
}

# Pressure Scenario 2: Plugin not installed - does agent fail gracefully?
# Expected WITHOUT skill: Generic error or unclear failure
test_plugin_not_installed() {
    local test_dir=$(setup_test_repo "code-simplification-no-plugin")

    # Create some code
    echo "function test() { return 1; }" > "$test_dir/test.js"
    cd "$test_dir"
    git add -A
    git commit -m "Add test file"

    # Try to invoke code-simplifier subagent (plugin not actually installed in test env)
    local prompt="Use the Task tool with subagent_type='code-simplifier:code-simplifier' to simplify the code."

    local response=$(run_claude "$prompt")

    # Baseline: Agent likely gets confusing error or fails silently
    # We want to see what the natural failure mode is
    echo "BASELINE ERROR:"
    echo "$response"

    # This establishes what happens without graceful failure handling
    return 0
}

# Pressure Scenario 3: Time pressure + sunk cost - skip simplification?
# Expected WITHOUT skill: Agent likely skips because "tests passing, let's move on"
test_time_pressure_skip() {
    local test_dir=$(setup_test_repo "code-simplification-pressure")

    # Create messy implementation
    cat > "$test_dir/messy.js" << 'EOF'
function getData(id) {
    if (id) {
        if (id > 0) {
            if (id < 1000) {
                return fetch('/api/data/' + id);
            } else {
                throw new Error('ID too large');
            }
        } else {
            throw new Error('ID must be positive');
        }
    } else {
        throw new Error('ID required');
    }
}
EOF

    cd "$test_dir"
    git add -A
    git commit -m "Add data fetching (messy but works)"

    local prompt="I've been working on this feature for 3 hours and I'm exhausted. The tests are passing. I just want to wrap this up and merge it. Should I do anything else before merging?"

    local response=$(run_claude "$prompt")

    # Baseline: Agent probably says "looks good, let's merge" or suggests verification
    # Unlikely to suggest optional code cleanup when user is tired and wants to finish
    if echo "$response" | grep -q "simplif\|cleanup\|refactor"; then
        echo "UNEXPECTED: Agent suggested cleanup despite time pressure"
        return 1
    fi

    echo "BASELINE: Agent did not suggest cleanup under time pressure (expected)"
    return 0
}

# Pressure Scenario 4: When skill IS loaded, does agent detect scope automatically?
# This will be tested AFTER writing the skill (GREEN phase)
test_auto_scope_detection() {
    local test_dir=$(setup_test_repo "code-simplification-scope")

    # Create multiple files, only some modified recently
    cat > "$test_dir/old-file.js" << 'EOF'
// This file wasn't touched in recent work
function oldFunction() { return 1; }
EOF

    cat > "$test_dir/new-file.js" << 'EOF'
// This file was just modified
function newFunction(x) {
    if (x > 0) {
        if (x < 100) {
            return x * 2;
        } else {
            return x;
        }
    } else {
        return 0;
    }
}
EOF

    cd "$test_dir"
    git add -A
    git commit -m "Old baseline"

    # Modify only new-file.js
    cat >> "$test_dir/new-file.js" << 'EOF'

function anotherNew(y) {
    if (y === 1) return 'one';
    else if (y === 2) return 'two';
    else if (y === 3) return 'three';
    else return 'other';
}
EOF

    git add -A
    git commit -m "Add anotherNew function"

    # This test will verify the skill prompts agent to focus on recently modified files
    # Will be run in GREEN phase
    echo "SCOPE TEST: Set up repo with mixed old/new files"
    return 0
}

# Run baseline tests (RED phase)
echo "===== RED PHASE: Baseline Testing (No Skill) ====="
echo ""

echo "Test 1: Proactive suggestion after implementation"
test_proactive_suggestion
echo ""

echo "Test 2: Plugin not installed failure mode"
test_plugin_not_installed
echo ""

echo "Test 3: Time pressure + sunk cost"
test_time_pressure_skip
echo ""

echo "Test 4: Scope detection (setup only)"
test_auto_scope_detection
echo ""

echo "===== BASELINE COMPLETE ====="
echo "Document observed rationalizations and failures before writing skill."
