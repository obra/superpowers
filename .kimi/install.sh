#!/usr/bin/env bash
# Install Superpowers for Kimi Code (no symlinks)
# Copies skills to ~/.config/agents/skills/ and configures a SessionStart hook.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
SKILLS_SOURCE="${REPO_ROOT}/skills"
SKILLS_TARGET="${HOME}/.config/agents/skills"
CONFIG_FILE="${HOME}/.kimi/config.toml"
HOOK_COMMAND="'${REPO_ROOT}/.kimi/hooks/session-start'"

echo "=== Installing Superpowers for Kimi Code ==="
echo ""

# 1. Copy skills to the generic cross-compatible path
mkdir -p "${SKILLS_TARGET}"

# Remove old superpowers skills first to ensure clean update
for skill_dir in "${SKILLS_SOURCE}"/*; do
    if [ -d "${skill_dir}" ]; then
        skill_name="$(basename "${skill_dir}")"
        target_dir="${SKILLS_TARGET}/${skill_name}"
        if [ -d "${target_dir}" ]; then
            rm -rf "${target_dir}"
        fi
        cp -r "${skill_dir}" "${target_dir}"
        echo "  Installed skill: ${skill_name}"
    fi
done

echo ""
echo "Skills installed to: ${SKILLS_TARGET}"

# 2. Configure ~/.kimi/config.toml
#    - Remove any existing merge_all_available_skills to avoid duplicates
#    - Remove any existing inline hooks = [...] to avoid conflict with [[hooks]] table arrays
#    - Append our settings cleanly

if [ -f "${CONFIG_FILE}" ]; then
    # Remove duplicate/conflicting lines in one pass
    grep -vE '^\s*merge_all_available_skills\s*=' "${CONFIG_FILE}" | \
    grep -vE '^\s*hooks\s*=\s*\[' > "${CONFIG_FILE}.tmp" && \
    mv "${CONFIG_FILE}.tmp" "${CONFIG_FILE}"
else
    echo ""
    echo "Creating ${CONFIG_FILE}..."
    mkdir -p "$(dirname "${CONFIG_FILE}")"
fi

echo ""
echo "Enabling merge_all_available_skills in ${CONFIG_FILE}..."
echo "merge_all_available_skills = true" >> "${CONFIG_FILE}"

# 3. Add SessionStart hook if not already present
if ! grep -qF "${HOOK_COMMAND}" "${CONFIG_FILE}" 2>/dev/null; then
    echo ""
    echo "Adding SessionStart hook to ${CONFIG_FILE}..."
    echo "" >> "${CONFIG_FILE}"
    echo "[[hooks]]" >> "${CONFIG_FILE}"
    echo "event = \"SessionStart\"" >> "${CONFIG_FILE}"
    echo "command = ${HOOK_COMMAND}" >> "${CONFIG_FILE}"
fi

echo ""
echo "=== Installation complete ==="
echo ""
echo "To verify, start Kimi Code and ask:"
echo "  Tell me about your superpowers"
echo ""
echo "To update later, run:"
echo "  ${REPO_ROOT}/.kimi/update.sh"
