#!/usr/bin/env bash
# .bob-plugin/scripts/install-bob.sh
#
# Install Superpowers into IBM Bob.
#
# Usage:
#   bash .bob-plugin/scripts/install-bob.sh            # project-level (.bob/)
#   bash .bob-plugin/scripts/install-bob.sh --global   # global (~/.bob/)
#
# What this does:
#   1. Copies all skills from skills/ into the target .bob/skills/ directory.
#   2. Wires the SessionStart hook into .bob/settings.json (creating it if absent).
#
# Idempotent: re-running after `git pull` updates existing skill copies and
# does not double-add the hook stanza.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLUGIN_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# ---------------------------------------------------------------------------
# Parse arguments
# ---------------------------------------------------------------------------

GLOBAL=0
while [[ $# -gt 0 ]]; do
    case "$1" in
        --global) GLOBAL=1; shift ;;
        -h|--help)
            sed -n '/^# Usage:/,/^# What this does:/s/^# \{0,1\}//p' "$0"
            exit 0 ;;
        *) echo "Unknown argument: $1" >&2; exit 1 ;;
    esac
done

# ---------------------------------------------------------------------------
# Determine target directories
# ---------------------------------------------------------------------------

if [[ $GLOBAL -eq 1 ]]; then
    BOB_DIR="${HOME}/.bob"
    SETTINGS_FILE="${HOME}/.bob/settings/settings.json"
    HOOK_COMMAND="${PLUGIN_ROOT}/hooks/session-start-bob"
    INSTALL_LABEL="global (~/.bob/)"
else
    BOB_DIR="${PWD}/.bob"
    SETTINGS_FILE="${PWD}/.bob/settings.json"
    HOOK_COMMAND="hooks/session-start-bob"
    INSTALL_LABEL="project (.bob/)"
fi

SKILLS_TARGET="${BOB_DIR}/skills"

echo "Installing Superpowers for Bob IDE (${INSTALL_LABEL})..."
echo ""

# ---------------------------------------------------------------------------
# Step 1: Copy skills
# ---------------------------------------------------------------------------

mkdir -p "${SKILLS_TARGET}"

skill_count=0
for skill_dir in "${PLUGIN_ROOT}/skills"/*/; do
    skill_name="$(basename "${skill_dir}")"
    target="${SKILLS_TARGET}/${skill_name}"
    rm -rf "${target}"
    cp -r "${skill_dir}" "${target}"
    skill_count=$((skill_count + 1))
done

echo "  Copied ${skill_count} skills to ${SKILLS_TARGET}"

# ---------------------------------------------------------------------------
# Step 2: Wire the SessionStart hook in settings.json
# ---------------------------------------------------------------------------

# Ensure the parent directory exists
mkdir -p "$(dirname "${SETTINGS_FILE}")"

# If the file doesn't exist yet, start with a minimal valid JSON object
if [[ ! -f "${SETTINGS_FILE}" ]]; then
    printf '{}\n' > "${SETTINGS_FILE}"
    echo "  Created ${SETTINGS_FILE}"
fi

# Idempotency check — skip if the hook command is already present
if grep -qF "${HOOK_COMMAND}" "${SETTINGS_FILE}" 2>/dev/null; then
    echo "  Hook already wired in ${SETTINGS_FILE} (no changes)"
else
    # Use python3 to merge the hook stanza into existing JSON.
    # This preserves any settings the user already has.
    python3 - "${SETTINGS_FILE}" "${HOOK_COMMAND}" <<'PYEOF'
import json, sys

settings_file = sys.argv[1]
hook_command  = sys.argv[2]

with open(settings_file, "r") as f:
    settings = json.load(f)

hook_entry = {
    "type": "command",
    "command": f"sh {hook_command}",
    "timeout": 10
}

hook_group = {"hooks": [hook_entry]}

settings.setdefault("hooks", {})
settings["hooks"].setdefault("SessionStart", [])
settings["hooks"]["SessionStart"].append(hook_group)

with open(settings_file, "w") as f:
    json.dump(settings, f, indent=2)
    f.write("\n")

print(f"  Wired SessionStart hook in {settings_file}")
PYEOF
fi

# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------

echo ""
echo "Installation complete."
echo ""
echo "Smoke check — start a fresh Bob session and ask:"
echo "  What are your superpowers?"
echo ""
echo "Acceptance test — send exactly:"
echo "  Let's make a react todo list"
echo "Bob should invoke the 'brainstorming' skill before writing any code."
echo ""
echo "To update after 'git pull':"
echo "  bash .bob-plugin/scripts/install-bob.sh${GLOBAL:+ --global}"
