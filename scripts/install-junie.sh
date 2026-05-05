#!/usr/bin/env bash
# Install superpowers for Junie (user-level)
#
# Symlinks all skills into ~/.junie/skills/superpowers/ and injects the
# using-superpowers bootstrap into ~/.junie/guidelines.md using sentinel
# markers so the operation is idempotent.
#
# Override install location for testing:
#   JUNIE_HOME=/tmp/test-junie bash scripts/install-junie.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLUGIN_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

JUNIE_DIR="${JUNIE_HOME:-${HOME}/.junie}"
JUNIE_SKILLS_DIR="${JUNIE_DIR}/skills/superpowers"
JUNIE_GUIDELINES="${JUNIE_DIR}/guidelines.md"
SUPERPOWERS_SKILLS_DIR="${PLUGIN_ROOT}/skills"

SENTINEL_START="<!-- BEGIN SUPERPOWERS -->"
SENTINEL_END="<!-- END SUPERPOWERS -->"

echo "Installing superpowers for Junie..."
echo "Target: $JUNIE_DIR"
echo ""

# --- skills ---
mkdir -p "$JUNIE_SKILLS_DIR"

for skill_dir in "$SUPERPOWERS_SKILLS_DIR"/*/; do
    [ -d "$skill_dir" ] || continue
    skill_name=$(basename "$skill_dir")
    target="$JUNIE_SKILLS_DIR/$skill_name"
    [ -L "$target" ] && rm "$target"
    ln -s "$skill_dir" "$target"
    echo "  Linked: $skill_name"
done

echo ""

# --- bootstrap ---
bootstrap_content=$(cat "$SUPERPOWERS_SKILLS_DIR/using-superpowers/SKILL.md")
tools_content=$(cat "$SUPERPOWERS_SKILLS_DIR/using-superpowers/references/junie-tools.md")

bootstrap_block="${SENTINEL_START}
<EXTREMELY_IMPORTANT>
You have superpowers.

**Below is the full content of your 'superpowers:using-superpowers' skill - your introduction to using skills. For all other skills, use the 'Skill' tool:**

${bootstrap_content}

${tools_content}
</EXTREMELY_IMPORTANT>
${SENTINEL_END}"

touch "$JUNIE_GUIDELINES"

# Remove existing block if present
if grep -qF "$SENTINEL_START" "$JUNIE_GUIDELINES"; then
    tmp=$(mktemp)
    awk "
        /^<!-- BEGIN SUPERPOWERS -->/ { skip=1; next }
        skip && /^<!-- END SUPERPOWERS -->/ { skip=0; next }
        skip { next }
        { print }
    " "$JUNIE_GUIDELINES" > "$tmp"
    mv "$tmp" "$JUNIE_GUIDELINES"
fi

printf '\n%s\n' "$bootstrap_block" >> "$JUNIE_GUIDELINES"
echo "Bootstrap written to: $JUNIE_GUIDELINES"

echo ""
echo "Done. Start a fresh Junie session and send 'Let's make a react todo list'"
echo "The brainstorming skill should auto-trigger before any code is written."
