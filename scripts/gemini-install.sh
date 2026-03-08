#!/bin/bash
# Gemini CLI - Superpowers Mass Installer
# This script links all available skills from the superpowers repository to Gemini CLI.

set -e

SKILLS_DIR="$(cd "$(dirname "$0")/../skills" && pwd)"

echo "🚀 Starting Superpowers installation for Gemini CLI..."
echo "📂 Skills directory: $SKILLS_DIR"

count=0
for skill_dir in "$SKILLS_DIR"/*/; do
    if [ -f "${skill_dir}SKILL.md" ]; then
        skill_name=$(basename "$skill_dir")
        echo "🔗 Linking skill: $skill_name"
        gemini skills link "$skill_dir"
        count=$((count + 1))
    fi
done

echo "✅ Success! $count skills have been linked to Gemini CLI."
echo "💡 Run '/skills list' in a Gemini session to verify."
