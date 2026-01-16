#!/usr/bin/env bash
# Stop hook for skill workflow suggestions
# Reminds Claude to suggest next skills after completing workflows

set -euo pipefail

# This hook uses a prompt-based approach to intelligently detect
# when Claude has completed a skill and suggest the next logical step

# The prompt will be sent to Haiku, which has access to:
# - The full conversation context
# - The using-superpowers skill content (injected at session start)
# - The Common Workflow Chains table

# Output reminder as JSON with additionalContext
cat <<'EOF'
{
  "hookSpecificOutput": {
    "hookEventName": "Stop",
    "additionalContext": "<skill-workflow-reminder>\n**IMPORTANT:** Check if you just completed a skill workflow step. If yes, consult the \"Common Workflow Chains\" table in using-superpowers and proactively suggest the next logical skill.\n\nFormat: \"✅ [skill] complete. **Next step:** Use `superpowers:[next-skill]` to [purpose]\"\n\nBe directive, not passive. This is mandatory workflow discipline.\n</skill-workflow-reminder>"
  }
}
EOF

exit 0
