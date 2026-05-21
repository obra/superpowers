#!/usr/bin/env bash
# Regression check for #939: README should show an explicit Output Paths
# override example so users can override Superpowers' default artifact paths
# from their agent instruction file.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
README="$REPO_ROOT/README.md"

failures=0

assert_contains() {
    local pattern="$1"
    local label="$2"

    if grep -Fq "$pattern" "$README"; then
        echo "  [PASS] $label"
    else
        echo "  [FAIL] $label"
        echo "    Expected to find: $pattern"
        failures=$((failures + 1))
    fi
}

echo "=== README Output Paths Example Test ==="
echo ""

assert_contains "## Customizing Output Paths" "README has an output path customization section"
assert_contains "## Output Paths" "README example includes an Output Paths heading"
assert_contains '| Design specs | `docs/design-docs/` |' "README example shows a custom design spec path"
assert_contains '| Execution plans (active) | `docs/exec-plans/active/` |' "README example shows a custom execution plan path"
assert_contains 'Design specs MUST be saved to `docs/design-docs/`, NOT `docs/superpowers/specs/`.' "README example uses imperative design spec override text"
assert_contains 'Execution plans MUST be saved to `docs/exec-plans/active/`, NOT `docs/superpowers/plans/`.' "README example uses imperative plan override text"

echo ""

if [ "$failures" -gt 0 ]; then
    echo "STATUS: FAILED ($failures failures)"
    exit 1
fi

echo "STATUS: PASSED"
