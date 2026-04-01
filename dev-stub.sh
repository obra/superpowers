#!/usr/bin/env bash
# Development stub: writes fake .pp-context/ files so pp-superpowers skills
# can read project context before pp-devenv is built.
#
# Usage: source this script or run it from the project root before starting
#        a Claude Code session.
#
# What this simulates:
#   The pp-superpowers session-start hook will eventually write .pp-context/
#   files automatically by reading PAC CLI state, solution metadata, and
#   environment config. This stub provides static placeholder values so
#   skills that depend on .pp-context/ can be developed and tested.
#
# What this does NOT simulate:
#   The session-start hook also injects conversation context via JSON output
#   (hookSpecificOutput.additionalContext). That injection is handled by the
#   hook itself, not this stub. This stub only covers the file-writing side.
#
# Delete this file once pp-devenv is built and the real hook is operational.

set -euo pipefail

CONTEXT_DIR=".pp-context"

mkdir -p "$CONTEXT_DIR"

# Solution identity — consumed by all skills at INIT stage
cat > "$CONTEXT_DIR/solution.md" << 'EOF'
solutionName: ProjectCentral
solutionUniqueName: sdfx_ProjectCentral
publisherPrefix: sdfx
publisherDisplayName: SDFX Studios
EOF

# Target environment — consumed by deployment and environment-aware skills
cat > "$CONTEXT_DIR/environment.md" << 'EOF'
targetEnv: https://dev-org.crm.dynamics.com
envType: development
envDisplayName: SDFX Dev
EOF

# PAC CLI state — consumed by skills that invoke PAC commands
# Note: cliVersion uses command substitution; if pac is not installed,
# falls back to "not-available"
cat > "$CONTEXT_DIR/pac-state.md" << EOF
authStatus: connected
publisherPrefix: sdfx
cliVersion: $(powershell.exe -Command "pac help" 2>/dev/null | head -2 | grep -oP 'Version: \K[^\s]+' || echo "not-available")
EOF

# Skill state — tracks which skills have been completed in this project.
# Empty at dev-stub creation; skills populate this as they complete.
cat > "$CONTEXT_DIR/skill-state.json" << 'EOF'
{
  "activeSkill": null,
  "lastCompleted": null,
  "suggestedNext": "solution-discovery",
  "completedSkills": [],
  "artifacts": []
}
EOF

echo "✓ $CONTEXT_DIR/ written for development session."
echo "  solution:    sdfx_ProjectCentral"
echo "  environment: dev-org (development)"
echo "  pac-state:   $(cat "$CONTEXT_DIR/pac-state.md" | grep cliVersion | cut -d: -f2 | xargs)"
