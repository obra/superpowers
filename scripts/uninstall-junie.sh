#!/usr/bin/env bash
# Uninstall superpowers from Junie (user-level)
#
# Removes superpowers- prefixed skill symlinks from ~/.junie/skills/ and strips
# the superpowers sentinel block from ~/.junie/AGENTS.md without touching
# any surrounding content.
#
# Override install location for testing:
#   JUNIE_HOME=/tmp/test-junie bash scripts/uninstall-junie.sh

set -euo pipefail

JUNIE_DIR="${JUNIE_HOME:-${HOME}/.junie}"
JUNIE_SKILLS_DIR="${JUNIE_DIR}/skills"
JUNIE_AGENTS_GUIDELINES="${JUNIE_DIR}/guidelines.md"

SENTINEL_START="<!-- BEGIN SUPERPOWERS -->"
SENTINEL_END="<!-- END SUPERPOWERS -->"

echo "Uninstalling superpowers from Junie..."
echo "Target: $JUNIE_DIR"
echo ""

# --- skills ---
if [ -d "$JUNIE_SKILLS_DIR/superpowers" ]; then
    rm -rf "$JUNIE_SKILLS_DIR/superpowers"
    echo "  Removed: superpowers/ skills directory"
    rmdir "$JUNIE_SKILLS_DIR" 2>/dev/null || true
fi

# --- bootstrap ---
if [ -f "$JUNIE_AGENTS_GUIDELINES" ] && grep -qF "$SENTINEL_START" "$JUNIE_AGENTS_GUIDELINES"; then
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
    echo "Sentinel block removed from: $JUNIE_AGENTS_GUIDELINES"
else
    echo "No superpowers block found in guidelines.md (nothing to remove)"
fi

echo ""
echo "Done."
