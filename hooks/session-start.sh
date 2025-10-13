#!/usr/bin/env bash
# SessionStart hook for superpowers plugin

set -euo pipefail

# Set SUPERPOWERS_SKILLS_ROOT environment variable
export SUPERPOWERS_SKILLS_ROOT="${HOME}/.config/superpowers/skills"

# Run skills initialization script (handles clone/fetch/auto-update)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
PLUGIN_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
init_output=$("${PLUGIN_ROOT}/lib/initialize-skills.sh" 2>&1 || echo "")

# Extract status flags
skills_updated=$(echo "$init_output" | grep "SKILLS_UPDATED=true" || echo "")
skills_behind=$(echo "$init_output" | grep "SKILLS_BEHIND=true" || echo "")
# Remove status flags from display output
init_output=$(echo "$init_output" | grep -v "SKILLS_UPDATED=true" | grep -v "SKILLS_BEHIND=true" || true)

# Run find-skills to show all available skills
find_skills_output=$("${SUPERPOWERS_SKILLS_ROOT}/skills/using-skills/find-skills" 2>&1 || echo "Error running find-skills")

# Read using-skills content (renamed from getting-started)
using_skills_content=$(cat "${SUPERPOWERS_SKILLS_ROOT}/skills/using-skills/SKILL.md" 2>&1 || echo "Error reading using-skills")

# Escape outputs for JSON
init_escaped=$(echo "$init_output" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g' | awk '{printf "%s\\n", $0}')
find_skills_escaped=$(echo "$find_skills_output" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g' | awk '{printf "%s\\n", $0}')
using_skills_escaped=$(echo "$using_skills_content" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g' | awk '{printf "%s\\n", $0}')

# Build initialization output message if present
init_message=""
if [ -n "$init_escaped" ]; then
    init_message="${init_escaped}\n\n"
fi

# Build status messages that go at the end
status_message=""
if [ -n "$skills_behind" ]; then
    status_message="\n\n⚠️ New skills available from upstream. Ask me to use the pulling-updates-from-skills-repository skill."
fi

# Output context injection as JSON
cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "<EXTREMELY_IMPORTANT>\nYou have superpowers.\n\n${init_message}**The content below is from skills/using-skills/SKILL.md - your introduction to using skills:**\n\n${using_skills_escaped}\n\n**Tool paths (use these when you need to search for or run skills):**\n- find-skills: ${SUPERPOWERS_SKILLS_ROOT}/skills/using-skills/find-skills\n- skill-run: ${SUPERPOWERS_SKILLS_ROOT}/skills/using-skills/skill-run\n\n**Skills live in:** ${SUPERPOWERS_SKILLS_ROOT}/skills/ (you work on your own branch and can edit any skill)\n\n**Available skills (output of find-skills):**\n\n${find_skills_escaped}${status_message}\n</EXTREMELY_IMPORTANT>"
  }
}
EOF

exit 0
