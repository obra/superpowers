#!/bin/bash

# Test code-simplification skill with pressure scenarios

source "$(dirname "$0")/test-helpers.sh"

# Setup a test repo with git initialized
setup_git_repo() {
    local name="$1"
    local test_dir=$(create_test_project)
    cd "$test_dir"
    git init -q
    git config user.email "test@example.com"
    git config user.name "Test User"
    echo "$test_dir"
}

# Pressure Scenario 1: After completing implementation, does agent proactively suggest simplification?
# Expected WITHOUT skill: Agent moves directly to verification or asks what's next
test_proactive_suggestion() {
    echo "Setting up test repo..."
    local test_dir=$(setup_git_repo "code-simplification-proactive")

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
    git commit -q -m "Implement calculator with tests passing"

    local prompt="I just completed implementing the calculator feature in $test_dir. All tests are passing. The implementation is done."

    echo "Running Claude..."
    local response=$(run_claude "$prompt" 90)

    # Baseline expectation: Agent does NOT suggest code-simplification
    # They might suggest verification, code review, or ask what's next
    if echo "$response" | grep -qi "code-simplif"; then
        echo "UNEXPECTED: Agent suggested code-simplification WITHOUT skill loaded"
        cleanup_test_project "$test_dir"
        return 1
    fi

    echo "BASELINE RESPONSE:"
    echo "$response" | head -20
    echo ""
    echo "BASELINE: Agent did not suggest code-simplification (expected)"
    cleanup_test_project "$test_dir"
    return 0
}

# Pressure Scenario 2: Time pressure + sunk cost - skip simplification?
# Expected WITHOUT skill: Agent likely skips because "tests passing, let's move on"
test_time_pressure_skip() {
    echo "Setting up test repo..."
    local test_dir=$(setup_git_repo "code-simplification-pressure")

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
module.exports = { getData };
EOF

    cd "$test_dir"
    git add -A
    git commit -q -m "Add data fetching (messy but works)"

    local prompt="I've been working on this feature in $test_dir for 3 hours and I'm exhausted. The tests are passing. I just want to wrap this up and merge it. Should I do anything else before merging?"

    echo "Running Claude..."
    local response=$(run_claude "$prompt" 90)

    echo "BASELINE RESPONSE:"
    echo "$response" | head -20
    echo ""

    # Baseline: Agent probably says "looks good, let's merge" or suggests verification
    # Unlikely to suggest optional code cleanup when user is tired and wants to finish
    if echo "$response" | grep -qi "simplif\|cleanup\|refactor"; then
        echo "NOTE: Agent suggested cleanup despite time pressure"
    else
        echo "BASELINE: Agent did not suggest cleanup under time pressure (expected)"
    fi

    cleanup_test_project "$test_dir"
    return 0
}

# Run baseline tests (RED phase)
echo "===== RED PHASE: Baseline Testing (No Skill) ====="
echo ""

echo "Test 1: Proactive suggestion after implementation"
echo "=================================================="
test_proactive_suggestion
echo ""

echo "Test 2: Time pressure + sunk cost"
echo "=================================="
test_time_pressure_skip
echo ""

echo "===== BASELINE COMPLETE ====="
echo "Document observed rationalizations and failures before writing skill."
