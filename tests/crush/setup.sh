#!/usr/bin/env bash
# Setup script for Crush tests
# Creates an isolated test environment with proper installation
set -euo pipefail

# Get the repository root (two levels up from tests/crush/)
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

# Create temp home directory for isolation
export TEST_HOME=$(mktemp -d)
export HOME="$TEST_HOME"
export XDG_CONFIG_HOME="$TEST_HOME/.config"
export CRUSH_GLOBAL_CONFIG="$TEST_HOME/.config/crush"
export CRUSH_GLOBAL_DATA="$TEST_HOME/.local/share/crush"

# Simulate installation: clone superpowers to ~/.config/crush/superpowers
mkdir -p "$HOME/.config/crush/superpowers"
cp -r "$REPO_ROOT/skills" "$HOME/.config/crush/superpowers/"
cp -r "$REPO_ROOT/.crush" "$HOME/.config/crush/superpowers/"

# Create skills symlink
mkdir -p "$HOME/.config/crush/skills"
ln -s "$HOME/.config/crush/superpowers/skills" "$HOME/.config/crush/skills/superpowers"

# Create a personal test skill fixture
mkdir -p "$HOME/.config/crush/skills/personal-test"
cat > "$HOME/.config/crush/skills/personal-test/SKILL.md" <<'EOF'
---
name: personal-test
description: Test personal skill for verification
---
# Personal Test Skill

This is a personal skill used for testing.

PERSONAL_SKILL_MARKER_12345
EOF

echo "Setup complete: $TEST_HOME"
echo "Skills installed at: $HOME/.config/crush/skills/superpowers"

# Cleanup helper
cleanup_test_env() {
    if [ -n "${TEST_HOME:-}" ] && [ -d "$TEST_HOME" ]; then
        rm -rf "$TEST_HOME"
    fi
}

export -f cleanup_test_env
export REPO_ROOT
