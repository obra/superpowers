#!/usr/bin/env bash

# Review Nudge Stop Hook
# Reminds the agent to run code-review-pipeline after code changes.
# Non-blocking — injects context but never prevents exit.

set -euo pipefail

# If another stop hook is active, don't interfere
if [[ "${stop_hook_active:-}" == "true" ]]; then
    exit 0
fi

# Check for changed code files in the working tree
changed_files=$(git diff --name-only HEAD 2>/dev/null || true)

if [[ -z "$changed_files" ]]; then
    exit 0
fi

# Check if any code files changed (not just docs/config)
code_pattern='\.(ts|js|tsx|jsx|svelte|vue|py|rs|go|html|css|scss)$'
has_code=false
while IFS= read -r file; do
    if [[ "$file" =~ $code_pattern ]]; then
        has_code=true
        break
    fi
done <<< "$changed_files"

if [[ "$has_code" != "true" ]]; then
    exit 0
fi

# shellcheck source=../lib/escape-json.sh
source "$(cd "$(dirname "$0")" && pwd)/../lib/escape-json.sh"

message="You've made code changes. Consider running the code-review-pipeline skill to review your implementation before finalizing."
escaped=$(escape_for_json "$message")

cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "Stop",
    "additionalContext": "${escaped}"
  }
}
EOF

exit 0
