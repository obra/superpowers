#!/usr/bin/env bash
# Setup script for OpenCode plugin tests
# Creates an isolated test environment with proper plugin installation
set -euo pipefail

# Get the repository root (two levels up from tests/opencode/)
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

# Validate required repository paths early so failures are actionable.
required_dir="$REPO_ROOT/skills"
required_plugin="$REPO_ROOT/.opencode/plugins/superpowers.js"

if [ ! -d "$required_dir" ]; then
    echo "ERROR: Expected skills directory not found at $required_dir" >&2
    echo "Hint: run tests from a full superpowers checkout." >&2
    exit 1
fi

if [ ! -f "$required_plugin" ]; then
    echo "ERROR: Expected OpenCode plugin not found at $required_plugin" >&2
    echo "Hint: ensure .opencode/plugins/superpowers.js exists." >&2
    exit 1
fi

# Create temp home directory for isolation
export TEST_HOME=$(mktemp -d)
export HOME="$TEST_HOME"
export XDG_CONFIG_HOME="$TEST_HOME/.config"
export OPENCODE_CONFIG_DIR="$TEST_HOME/.config/opencode"

# Install plugin to test location
mkdir -p "$HOME/.config/opencode/superpowers"
cp -r "$required_dir" "$HOME/.config/opencode/superpowers/"

# Copy plugin directory
mkdir -p "$HOME/.config/opencode/superpowers/.opencode/plugins"
cp "$required_plugin" "$HOME/.config/opencode/superpowers/.opencode/plugins/"

# Register plugin via symlink
mkdir -p "$HOME/.config/opencode/plugins"
ln -sf "$HOME/.config/opencode/superpowers/.opencode/plugins/superpowers.js" \
       "$HOME/.config/opencode/plugins/superpowers.js"

# Create test skills in different locations for testing

# Personal test skill
mkdir -p "$HOME/.config/opencode/skills/personal-test"
cat > "$HOME/.config/opencode/skills/personal-test/SKILL.md" <<'EOF'
---
name: personal-test
description: Test personal skill for verification
---
# Personal Test Skill

This is a personal skill used for testing.

PERSONAL_SKILL_MARKER_12345
EOF

# Create a project directory for project-level skill tests
mkdir -p "$TEST_HOME/test-project/.opencode/skills/project-test"
cat > "$TEST_HOME/test-project/.opencode/skills/project-test/SKILL.md" <<'EOF'
---
name: project-test
description: Test project skill for verification
---
# Project Test Skill

This is a project skill used for testing.

PROJECT_SKILL_MARKER_67890
EOF

echo "Setup complete: $TEST_HOME"
echo "Plugin installed to: $HOME/.config/opencode/superpowers/.opencode/plugins/superpowers.js"
echo "Plugin registered at: $HOME/.config/opencode/plugins/superpowers.js"
echo "Test project at: $TEST_HOME/test-project"

# Helper function for cleanup (call from tests or trap)
cleanup_test_env() {
    if [ -n "${TEST_HOME:-}" ] && [ -d "$TEST_HOME" ]; then
        rm -rf "$TEST_HOME"
    fi
}

# Export for use in tests
export -f cleanup_test_env
export REPO_ROOT
