#!/usr/bin/env bash
# Install superpowers as a Trae IDE rule
#
# Creates a bootstrap rule in .trae/rules/ that loads the superpowers
# skill system. The rule uses alwaysApply: true so it activates on
# every conversation automatically.
#
# Usage:
#   ~/.trae/superpowers/.trae/install.sh [project_dir]
#
# If project_dir is omitted, installs to the current directory.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SUPERPOWERS_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
SKILLS_DIR="${SUPERPOWERS_ROOT}/skills"

PROJECT_DIR="${1:-.}"
RULES_DIR="${PROJECT_DIR}/.trae/rules"

# Verify skills directory exists
if [[ ! -d "$SKILLS_DIR" ]]; then
  echo "Error: Skills directory not found at ${SKILLS_DIR}"
  echo "Make sure superpowers is properly cloned."
  exit 1
fi

# Create rules directory if needed
mkdir -p "$RULES_DIR"

# Read the using-superpowers skill content
USING_SUPERPOWERS="${SKILLS_DIR}/using-superpowers/SKILL.md"
if [[ ! -f "$USING_SUPERPOWERS" ]]; then
  echo "Error: using-superpowers skill not found at ${USING_SUPERPOWERS}"
  exit 1
fi

# Build list of available skills from SKILL.md frontmatter
skill_list=""
for skill_dir in "${SKILLS_DIR}"/*/; do
  skill_file="${skill_dir}SKILL.md"
  if [[ -f "$skill_file" ]]; then
    # Extract name and description from YAML frontmatter
    skill_name=$(sed -n 's/^name: *//p' "$skill_file" | head -1)
    skill_desc=$(sed -n 's/^description: *//p' "$skill_file" | head -1)
    if [[ -n "$skill_name" ]]; then
      skill_list="${skill_list}\n- **${skill_name}**: ${skill_desc}"
    fi
  fi
done

# Read the using-superpowers content (strip frontmatter)
using_content=$(sed '1{/^---$/d}; /^---$/,/^---$/d' "$USING_SUPERPOWERS")

# Generate the bootstrap rule
cat > "${RULES_DIR}/superpowers-bootstrap.md" << RULEEOF
---
description: Superpowers skill system bootstrap - loads development workflow skills
alwaysApply: true
---

# Superpowers

You have superpowers. You are equipped with a comprehensive software development workflow system.

## Available Skills
${skill_list}

## How to Use Skills

When a task matches a skill's description, read the full skill file before proceeding.
Skills are located in: ${SKILLS_DIR}/

To load a skill, read the SKILL.md file in the corresponding directory. For example:
- Planning: ${SKILLS_DIR}/writing-plans/SKILL.md
- TDD: ${SKILLS_DIR}/test-driven-development/SKILL.md
- Debugging: ${SKILLS_DIR}/systematic-debugging/SKILL.md

## Core Skill: Using Superpowers

${using_content}
RULEEOF

echo "Superpowers installed for Trae IDE."
echo "  Rule: ${RULES_DIR}/superpowers-bootstrap.md"
echo "  Skills: ${SKILLS_DIR}/"
echo ""
echo "Start a new conversation in Trae to activate."
