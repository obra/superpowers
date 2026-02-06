#!/usr/bin/env bash
# SessionStart hook for superpowers plugin

set -euo pipefail

# Check if legacy skills directory exists and build warning
warning_message=""
legacy_skills_dir="${HOME}/.config/superpowers/skills"
if [ -d "$legacy_skills_dir" ]; then
    warning_message="\n\n<important-reminder>IN YOUR FIRST REPLY AFTER SEEING THIS MESSAGE YOU MUST TELL THE USER: **WARNING:** Superpowers now uses Claude Code's skills system. Custom skills in ~/.config/superpowers/skills will not be read. Move custom skills to ~/.claude/skills instead. To make this message go away, remove ~/.config/superpowers/skills</important-reminder>"
fi

# shellcheck source=../lib/escape-json.sh
source "$(cd "$(dirname "$0")" && pwd)/../lib/escape-json.sh"

warning_escaped=$(escape_for_json "$warning_message")

# Output context injection as JSON with lightweight skill list
cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "<EXTREMELY_IMPORTANT>\nYou have superpowers. Use the Skill tool to invoke any skill BEFORE responding.\n\n**Available skills:**\n- **planning** — Use before implementing non-trivial features (researches approaches with Context7, Serper, GitHub MCPs)\n- **research** — Use for deep research requiring 20+ sources with confidence tracking\n- **test-driven-development** — Use when implementing any feature or bugfix (red-green-refactor)\n- **verification-before-completion** — Use before claiming work is complete (evidence before assertions)\n- **subagent-driven-development** — Use when executing plans with independent tasks via subagents\n- **systematic-debugging** — Use when encountering bugs or test failures (root cause first)\n- **code-review-pipeline** — Use after implementing features to catch bugs, a11y issues, and missing tests\n- **finishing-a-development-branch** — Use when implementation is complete and ready to integrate\n\nIf there is a reasonable chance (20%+) a skill applies, invoke it.${warning_escaped}\n</EXTREMELY_IMPORTANT>"
  }
}
EOF

exit 0
