#!/usr/bin/env bash
# Lint skill files for pattern compliance
# Usage: ./tools/lint-skill.sh [skill-path]
#        ./tools/lint-skill.sh --all

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

errors=0
warnings=0

lint_skill() {
    local skill_file="$1"
    local skill_name=$(basename "$(dirname "$skill_file")")

    echo "Linting: $skill_name"

    # Check 1: YAML frontmatter exists
    if ! head -1 "$skill_file" | grep -q '^---$'; then
        echo -e "  ${RED}[ERROR]${NC} Missing YAML frontmatter"
        ((errors++))
    fi

    # Check 2: name field format (lowercase, hyphens, numbers only)
    local name=$(grep '^name:' "$skill_file" | head -1 | sed 's/name: *//')
    if [ -n "$name" ]; then
        if ! echo "$name" | grep -qE '^[a-z0-9-]+$'; then
            echo -e "  ${RED}[ERROR]${NC} name must be lowercase with hyphens only: '$name'"
            ((errors++))
        fi
        if [ ${#name} -gt 64 ]; then
            echo -e "  ${RED}[ERROR]${NC} name exceeds 64 chars: ${#name}"
            ((errors++))
        fi
    else
        echo -e "  ${RED}[ERROR]${NC} Missing name field"
        ((errors++))
    fi

    # Check 3: description starts with "Use when"
    local desc=$(grep '^description:' "$skill_file" | head -1 | sed 's/description: *//')
    if [ -n "$desc" ]; then
        if ! echo "$desc" | grep -qi '^Use when'; then
            echo -e "  ${YELLOW}[WARN]${NC} description should start with 'Use when...'"
            ((warnings++))
        fi
        if [ ${#desc} -gt 1024 ]; then
            echo -e "  ${RED}[ERROR]${NC} description exceeds 1024 chars: ${#desc}"
            ((errors++))
        fi
    else
        echo -e "  ${RED}[ERROR]${NC} Missing description field"
        ((errors++))
    fi

    # Check 4: Line count (warn if >400, except writing-skills)
    local lines
    lines=$(wc -l < "$skill_file" | tr -d ' ')
    if [ "$skill_name" != "writing-skills" ] && [ "$lines" -gt 400 ]; then
        echo -e "  ${YELLOW}[WARN]${NC} Skill has $lines lines (target: <400)"
        ((warnings++))
    fi

    # Check 5: Aggressive language count
    local aggressive_count=$(grep -ciE '\bMUST\b|\bCRITICAL\b|\bCOMPULSORY\b|\bALWAYS\b' "$skill_file" || echo "0")
    if [ "$aggressive_count" -gt 6 ]; then
        echo -e "  ${YELLOW}[WARN]${NC} High reinforcement count: $aggressive_count (target: 3-4)"
        ((warnings++))
    fi

    # Check 6: Has at least one gate (for discipline skills)
    if grep -qi 'discipline\|require\|verification' "$skill_file"; then
        if ! grep -q 'Gate.*:' "$skill_file"; then
            echo -e "  ${YELLOW}[WARN]${NC} Discipline skill without gate structure"
            ((warnings++))
        fi
    fi

    # Check 7: STOP CONDITION follows gates
    local gates
    gates=$(grep -c 'Gate.*:' "$skill_file" 2>/dev/null) || gates=0
    local stops
    stops=$(grep -c 'STOP CONDITION' "$skill_file" 2>/dev/null) || stops=0
    if [ "$gates" -gt 0 ] && [ "$stops" -lt "$gates" ]; then
        echo -e "  ${YELLOW}[WARN]${NC} Gates without STOP CONDITIONS ($gates gates, $stops stops)"
        ((warnings++))
    fi

    echo -e "  ${GREEN}[DONE]${NC}"
}

# Main
if [ "${1:-}" = "--all" ]; then
    for skill in skills/*/SKILL.md; do
        lint_skill "$skill"
        echo ""
    done
else
    if [ -z "${1:-}" ]; then
        echo "Usage: $0 <skill-path> | --all"
        exit 1
    fi
    lint_skill "$1"
fi

echo ""
echo "Summary: $errors errors, $warnings warnings"
[ "$errors" -eq 0 ] || exit 1
