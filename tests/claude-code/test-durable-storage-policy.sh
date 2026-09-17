#!/usr/bin/env bash
# Regression check: durable-storage skill exists with the documented
# structure/naming rules, and brainstorming/writing-plans route through it
# instead of hardcoding the old date-prefixed default path.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

DURABLE_STORAGE_SKILL="$REPO_ROOT/skills/durable-storage/SKILL.md"
BRAINSTORMING_SKILL="$REPO_ROOT/skills/brainstorming/SKILL.md"
WRITING_PLANS_SKILL="$REPO_ROOT/skills/writing-plans/SKILL.md"

failures=0

assert_contains() {
    local file="$1"
    local pattern="$2"
    local label="$3"

    if grep -Fq "$pattern" "$file"; then
        echo "  [PASS] $label"
    else
        echo "  [FAIL] $label"
        echo "    Expected to find: $pattern"
        echo "    In file: $file"
        failures=$((failures + 1))
    fi
}

assert_not_contains() {
    local file="$1"
    local pattern="$2"
    local label="$3"

    if grep -Fq "$pattern" "$file"; then
        echo "  [FAIL] $label"
        echo "    Did not expect to find: $pattern"
        echo "    In file: $file"
        failures=$((failures + 1))
    else
        echo "  [PASS] $label"
    fi
}

echo "=== Durable Storage Policy Test ==="
echo ""

# The skill file exists with the documented frontmatter and rules.
assert_contains "$DURABLE_STORAGE_SKILL" "name: durable-storage" "durable-storage skill has correct frontmatter name"
assert_contains "$DURABLE_STORAGE_SKILL" 'docs/superpowers/specs/<filename>.md' "durable-storage documents the filesystem default for specs"
assert_contains "$DURABLE_STORAGE_SKILL" 'docs/superpowers/plans/<filename>.md' "durable-storage documents the filesystem default for plans"
assert_contains "$DURABLE_STORAGE_SKILL" '<root>/<ProjectName>/Specs/<filename>.md' "durable-storage documents the ObsidianRAG specs path shape"
assert_contains "$DURABLE_STORAGE_SKILL" '<root>/<ProjectName>/Plans/<filename>.md' "durable-storage documents the ObsidianRAG plans path shape"
assert_not_contains "$DURABLE_STORAGE_SKILL" '/Projects/' "durable-storage never introduces a Projects/ directory"
assert_contains "$DURABLE_STORAGE_SKILL" "don't guess" "durable-storage refuses to silently guess an ambiguous Jira key"
assert_contains "$DURABLE_STORAGE_SKILL" "never a filesystem path" "durable-storage vault is a logical name, not a hardcoded path"
assert_contains "$DURABLE_STORAGE_SKILL" "never a dedicated storage-decision or configuration subagent" "durable-storage is primary-agent-performed, not a mandatory subagent"
assert_not_contains "$DURABLE_STORAGE_SKILL" "must invoke a subagent" "durable-storage does not mandate a subagent"

# brainstorming and writing-plans route through the shared skill instead of
# hardcoding the old date-prefixed path.
assert_contains "$BRAINSTORMING_SKILL" "superpowers:durable-storage" "brainstorming consults durable-storage for spec destination"
assert_not_contains "$BRAINSTORMING_SKILL" 'YYYY-MM-DD-<topic>-design.md' "brainstorming no longer hardcodes the old date-prefixed spec filename"

assert_contains "$WRITING_PLANS_SKILL" "superpowers:durable-storage" "writing-plans consults durable-storage for plan destination"
assert_not_contains "$WRITING_PLANS_SKILL" 'YYYY-MM-DD-<feature-name>.md' "writing-plans no longer hardcodes the old date-prefixed plan filename"

echo ""

if [ "$failures" -gt 0 ]; then
    echo "STATUS: FAILED ($failures failures)"
    exit 1
fi

echo "STATUS: PASSED"
