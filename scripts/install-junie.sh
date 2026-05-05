#!/usr/bin/env bash
# Install superpowers for Junie (user-level)
#
# Symlinks all skills into ~/.junie/skills/superpowers-<name> and injects the
# using-superpowers bootstrap into ~/.junie/AGENTS.md using sentinel
# markers so the operation is idempotent.
#
# Override install location for testing:
#   JUNIE_HOME=/tmp/test-junie bash scripts/install-junie.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLUGIN_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

JUNIE_DIR="${JUNIE_HOME:-${HOME}/.junie}"
JUNIE_SKILLS_DIR="${JUNIE_DIR}/skills"
JUNIE_AGENTS_GUIDELINES="${JUNIE_DIR}/AGENTS.md"
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
    target="$JUNIE_SKILLS_DIR/superpowers-$skill_name"
    
    # Clean up previous install (might be a symlink or a directory)
    rm -rf "$target"
    mkdir -p "$target"
    
    # Copy and modify SKILL.md to include the superpowers: prefix for Junie
    if [ -f "$skill_dir/SKILL.md" ]; then
        sed '1,/^name: /s/^name: /name: superpowers:/' "$skill_dir/SKILL.md" > "$target/SKILL.md"
    fi
    
    # Symlink all other files/directories from the skill folder
    for item in "$skill_dir"*; do
        [ -e "$item" ] || continue
        item_name=$(basename "$item")
        if [ "$item_name" != "SKILL.md" ]; then
            ln -s "$item" "$target/$item_name"
        fi
    done
    
    echo "  Installed: $skill_name (prefixed for Junie)"
done

echo ""

# --- bootstrap ---
bootstrap_content=$(sed '1,/^name: /s/^name: /name: superpowers:/' "$SUPERPOWERS_SKILLS_DIR/using-superpowers/SKILL.md")
tools_content=$(cat "$SUPERPOWERS_SKILLS_DIR/using-superpowers/references/junie-tools.md")

bootstrap_block="${SENTINEL_START}
<EXTREMELY_IMPORTANT>
You have superpowers.

**Below is the full content of your 'superpowers:using-superpowers' skill - your introduction to using skills. For all other skills, use the 'agent_skill_read_doc' tool:**

${bootstrap_content}

${tools_content}
</EXTREMELY_IMPORTANT>
${SENTINEL_END}"

touch "$JUNIE_AGENTS_GUIDELINES"

# Remove existing block if present
if grep -qF "$SENTINEL_START" "$JUNIE_AGENTS_GUIDELINES"; then
    if ! grep -qF "$SENTINEL_END" "$JUNIE_AGENTS_GUIDELINES"; then
        echo "Error: found $SENTINEL_START without matching $SENTINEL_END in $JUNIE_AGENTS_GUIDELINES" >&2
        echo "The file may be corrupted. Fix it manually before re-running." >&2
        exit 1
    fi
    tmp=$(mktemp)
    awk -v begin="$SENTINEL_START" -v end="$SENTINEL_END" '
        $0 == begin { skip=1; next }
        skip && $0 == end { skip=0; next }
        skip { next }
        { print }
    ' "$JUNIE_AGENTS_GUIDELINES" > "$tmp"
    mv "$tmp" "$JUNIE_AGENTS_GUIDELINES"
fi

printf '\n%s\n' "$bootstrap_block" >> "$JUNIE_AGENTS_GUIDELINES"
echo "Bootstrap written to: $JUNIE_AGENTS_GUIDELINES"

echo ""
echo "Done. Start a fresh Junie session and send 'Let's make a react todo list'"
echo "The brainstorming skill should auto-trigger before any code is written."
