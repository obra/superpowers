#!/usr/bin/env bash
# SessionStart hook for superpowers plugin - SAFE VERSION

set -euo pipefail

# Set SUPERPOWERS_SKILLS_ROOT environment variable
export SUPERPOWERS_SKILLS_ROOT="${HOME}/.config/superpowers/skills"

# Run skills initialization script with timeout (handles clone/fetch/auto-update)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
init_output=$(timeout 10 "${PLUGIN_ROOT}/lib/initialize-skills.sh" 2>&1 || echo "")

# Extract status flags with timeout protection
skills_updated=$(timeout 1 bash -c "echo '$init_output' | grep 'SKILLS_UPDATED=true'" 2>/dev/null || echo "")
skills_behind=$(timeout 1 bash -c "echo '$init_output' | grep 'SKILLS_BEHIND=true'" 2>/dev/null || echo "")

# Run find-skills with timeout to show all available skills
find_skills_output=$(timeout 5 "${SUPERPOWERS_SKILLS_ROOT}/skills/using-skills/find-skills" </dev/null 2>&1 || echo "⚠️ find-skills timed out")

# Read using-skills content
using_skills_content=$(timeout 2 cat "${SUPERPOWERS_SKILLS_ROOT}/skills/using-skills/SKILL.md" 2>&1 || echo "Error reading using-skills")

# Build status message
status_message=""
if [ -n "$skills_behind" ]; then
    status_message="\n\n⚠️ New skills available from upstream. Ask me to use the pulling-updates-from-skills-repository skill."
fi

# Build the full message
full_context="<EXTREMELY_IMPORTANT>
You have superpowers.

**The content below is from skills/using-skills/SKILL.md - your introduction to using skills:**

${using_skills_content}

**Tool paths (use these when you need to search for or run skills):**
- find-skills: ${SUPERPOWERS_SKILLS_ROOT}/skills/using-skills/find-skills
- skill-run: ${SUPERPOWERS_SKILLS_ROOT}/skills/using-skills/skill-run

**Skills live in:** ${SUPERPOWERS_SKILLS_ROOT}/skills/ (you work on your own branch and can edit any skill)

**Available skills (output of find-skills):**

${find_skills_output}${status_message}
</EXTREMELY_IMPORTANT>"

# Use jq to properly escape for JSON
escaped_context=$(echo "$full_context" | jq -Rs .)

# Output context injection as JSON
cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": ${escaped_context}
  }
}
EOF

exit 0
