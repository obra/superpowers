#!/bin/bash

set -e

PLUGIN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Load orchestrator instructions
ORCHESTRATOR_INSTRUCTIONS=""
if [ -f "$PLUGIN_DIR/lib/orchestrator-instructions.md" ]; then
    ORCHESTRATOR_INSTRUCTIONS=$(cat "$PLUGIN_DIR/lib/orchestrator-instructions.md")
fi

# Load agent registry
AGENT_REGISTRY=""
if [ -f "$PLUGIN_DIR/lib/agent-registry.json" ]; then
    AGENT_REGISTRY=$(cat "$PLUGIN_DIR/lib/agent-registry.json")
fi

# Load project CLAUDE.md if exists, otherwise use template
PROJECT_INSTRUCTIONS=""
if [ -f "CLAUDE.md" ]; then
    PROJECT_INSTRUCTIONS=$(cat "CLAUDE.md")
else
    if [ -f "$PLUGIN_DIR/templates/project-claude-md.template" ]; then
        PROJECT_INSTRUCTIONS=$(cat "$PLUGIN_DIR/templates/project-claude-md.template")
    fi
fi

# Load using-superpowers skill (for backward compatibility and skill enforcement)
USING_SUPERPOWERS=""
if [ -f "$PLUGIN_DIR/skills/using-superpowers/SKILL.md" ]; then
    USING_SUPERPOWERS=$(cat "$PLUGIN_DIR/skills/using-superpowers/SKILL.md")
fi

# Build combined context
COMBINED_CONTEXT=""

# Add using-superpowers (skill enforcement)
if [ -n "$USING_SUPERPOWERS" ]; then
    COMBINED_CONTEXT+="<EXTREMELY_IMPORTANT>
You have superpowers.

**The content below is from skills/using-superpowers/SKILL.md - your introduction to using skills:**

---
$USING_SUPERPOWERS
---

</EXTREMELY_IMPORTANT>

"
fi

# Add orchestration mode
if [ -n "$ORCHESTRATOR_INSTRUCTIONS" ]; then
    COMBINED_CONTEXT+="<ORCHESTRATION_MODE_ACTIVE>

$ORCHESTRATOR_INSTRUCTIONS

</ORCHESTRATION_MODE_ACTIVE>

"
fi

# Add agent registry
if [ -n "$AGENT_REGISTRY" ]; then
    COMBINED_CONTEXT+="<AGENT_REGISTRY>

The following specialist agents are available to you. Each is an expert in one superpowers skill.

When you need to delegate to a specialist, use the Task tool with the specialist's name.

$AGENT_REGISTRY

</AGENT_REGISTRY>

"
fi

# Add project instructions
if [ -n "$PROJECT_INSTRUCTIONS" ]; then
    COMBINED_CONTEXT+="<PROJECT_INSTRUCTIONS>

$PROJECT_INSTRUCTIONS

</PROJECT_INSTRUCTIONS>"
fi

# Return JSON with combined context
jq -n \
  --arg context "$COMBINED_CONTEXT" \
  '{
    hookSpecificOutput: {
      additionalContext: $context
    }
  }'
