#!/usr/bin/env bash
# Shared suite definitions for Claude Code skill tests

set -euo pipefail

DEFAULT_SUITE="smoke"

is_valid_suite() {
    case "${1:-}" in
        smoke|full|integration)
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

suite_description() {
    case "${1:-}" in
        smoke)
            echo "Fast compatibility checks for core skills"
            ;;
        full)
            echo "Deeper semantic checks for skill instructions"
            ;;
        integration)
            echo "Long-running end-to-end workflow validation"
            ;;
        *)
            return 1
            ;;
    esac
}

suite_default_timeout() {
    case "${1:-}" in
        smoke)
            echo 240
            ;;
        full)
            echo 900
            ;;
        integration)
            echo 2400
            ;;
        *)
            return 1
            ;;
    esac
}

suite_tests() {
    case "${1:-}" in
        smoke)
            cat <<'EOF'
test-brainstorming-smoke.sh
test-writing-plans-smoke.sh
test-tdd-smoke.sh
test-systematic-debugging-smoke.sh
test-subagent-driven-development-smoke.sh
EOF
            ;;
        full)
            cat <<'EOF'
test-brainstorming.sh
test-writing-plans.sh
test-tdd.sh
test-systematic-debugging.sh
test-subagent-driven-development.sh
test-automated-development-workflow.sh
test-upgrade.sh
EOF
            ;;
        integration)
            cat <<'EOF'
test-subagent-driven-development-integration.sh
EOF
            ;;
        *)
            return 1
            ;;
    esac
}

estimate_for_test() {
    case "${1:-}" in
        test-brainstorming-smoke.sh|test-writing-plans-smoke.sh|test-tdd-smoke.sh|test-systematic-debugging-smoke.sh)
            echo 60
            ;;
        test-subagent-driven-development-smoke.sh)
            echo 90
            ;;
        test-brainstorming.sh|test-writing-plans.sh|test-tdd.sh|test-systematic-debugging.sh|test-upgrade.sh)
            echo 600
            ;;
        test-subagent-driven-development.sh|test-automated-development-workflow.sh)
            echo 900
            ;;
        test-subagent-driven-development-integration.sh)
            echo 1800
            ;;
        *)
            echo 600
            ;;
    esac
}

print_suite_listing() {
    local suite="${1:-$DEFAULT_SUITE}"
    local test_name

    echo "Selected suite: $suite"
    echo "Description: $(suite_description "$suite")"
    echo "Default timeout: $(suite_default_timeout "$suite")s"
    echo "Tests:"

    while IFS= read -r test_name; do
        [ -n "$test_name" ] || continue
        echo "  - $test_name (~$(( $(estimate_for_test "$test_name") / 60 ))m)"
    done < <(suite_tests "$suite")
}
