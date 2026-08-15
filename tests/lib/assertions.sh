#!/usr/bin/env bash
# Assertions for stream-json Claude Code integration tests.

SKILL_TOOL_PATTERN='"name":"Skill"'
PREMATURE_TOOL_EXCLUSIONS='"name":"(TodoWrite|TaskCreate|TaskUpdate|TaskList|TaskGet)"'

skill_pattern_for() {
    local skill_name="$1"
    printf '"skill":"([^"]*:)?%s"' "$skill_name"
}

list_triggered_skills() {
    local log_file="$1"
    grep -o '"skill":"[^"]*"' "$log_file" 2>/dev/null | sort -u || true
}

assert_skill_triggered() {
    local log_file="$1"
    local skill_name="$2"

    local pattern
    pattern="$(skill_pattern_for "$skill_name")"

    if grep -q "$SKILL_TOOL_PATTERN" "$log_file" && grep -qE "$pattern" "$log_file"; then
        echo "PASS: Skill '$skill_name' was triggered"
        return 0
    fi

    echo "FAIL: Skill '$skill_name' was NOT triggered"
    return 1
}

assert_no_premature_tools() {
    local log_file="$1"
    local label="${2:-run}"

    local first_skill_line
    first_skill_line=$(grep -n "$SKILL_TOOL_PATTERN" "$log_file" | head -1 | cut -d: -f1)

    if [ -z "$first_skill_line" ]; then
        echo "WARNING: No Skill invocation found in $label"
        return 0
    fi

    local premature_tools
    premature_tools=$(head -n "$first_skill_line" "$log_file" | \
        grep '"type":"tool_use"' | \
        grep -v "$SKILL_TOOL_PATTERN" | \
        grep -vE "$PREMATURE_TOOL_EXCLUSIONS" || true)

    if [ -n "$premature_tools" ]; then
        echo "WARNING: Tools invoked BEFORE Skill tool in $label:"
        echo "$premature_tools" | head -5
        echo ""
        echo "This indicates Claude started working before loading the requested skill."
        return 0
    fi

    echo "OK: No premature tool invocations detected in $label"
    return 0
}

show_first_assistant_message() {
    local log_file="$1"
    local label="${2:-run}"

    echo ""
    echo "$label first assistant response (truncated):"
    grep '"type":"assistant"' "$log_file" | head -1 | \
        jq -r '.message.content[0].text // .message.content' 2>/dev/null | head -c 500 || \
        echo "  (could not extract)"
}

print_skill_trigger_summary() {
    local log_file="$1"
    local label="${2:-this run}"

    echo ""
    echo "Skills triggered in $label:"
    local skills
    skills=$(list_triggered_skills "$log_file")
    if [ -n "$skills" ]; then
        echo "$skills"
    else
        echo "  (none)"
    fi
}
