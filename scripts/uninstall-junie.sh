#!/usr/bin/env bash
# Uninstall superpowers from Junie (user-level)
#
# Removes skill symlinks from ~/.junie/skills/superpowers/ and strips the
# superpowers sentinel block from ~/.junie/guidelines.md without touching
# any surrounding content.
#
# Override install location for testing:
#   JUNIE_HOME=/tmp/test-junie bash scripts/uninstall-junie.sh

set -euo pipefail

JUNIE_DIR="${JUNIE_HOME:-${HOME}/.junie}"
JUNIE_SKILLS_DIR="${JUNIE_DIR}/skills/superpowers"
JUNIE_GUIDELINES="${JUNIE_DIR}/guidelines.md"

SENTINEL_START="<!-- BEGIN SUPERPOWERS -->"
SENTINEL_END="<!-- END SUPERPOWERS -->"

echo "Uninstalling superpowers from Junie..."
echo "Target: $JUNIE_DIR"
echo ""

# --- skills ---
if [ -d "$JUNIE_SKILLS_DIR" ]; then
    while IFS= read -r link; do
        rm "$link"
        echo "  Removed: $(basename "$link")"
    done < <(find "$JUNIE_SKILLS_DIR" -maxdepth 1 -mindepth 1 -type l)
    rmdir "$JUNIE_SKILLS_DIR" 2>/dev/null || true
    rmdir "$JUNIE_DIR/skills" 2>/dev/null || true
fi

# --- bootstrap ---
if [ -f "$JUNIE_GUIDELINES" ] && grep -qF "$SENTINEL_START" "$JUNIE_GUIDELINES"; then
    if ! grep -qF "$SENTINEL_END" "$JUNIE_GUIDELINES"; then
        echo "Error: found $SENTINEL_START without matching $SENTINEL_END in $JUNIE_GUIDELINES" >&2
        echo "The file may be corrupted. Fix it manually before re-running." >&2
        exit 1
    fi
    tmp=$(mktemp)
    awk -v begin="$SENTINEL_START" -v end="$SENTINEL_END" '
        $0 == begin { skip=1; next }
        skip && $0 == end { skip=0; next }
        skip { next }
        { print }
    ' "$JUNIE_GUIDELINES" > "$tmp"
    mv "$tmp" "$JUNIE_GUIDELINES"
    echo "Sentinel block removed from: $JUNIE_GUIDELINES"
else
    echo "No superpowers block found in guidelines.md (nothing to remove)"
fi

echo ""
echo "Done."
