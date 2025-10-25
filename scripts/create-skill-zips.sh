#!/usr/bin/env bash
# Create ZIP files for all skills for Claude Desktop distribution

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
SKILLS_DIR="${REPO_ROOT}/skills"

echo "Creating ZIP files for all skills..."

# Counter for created ZIPs
created=0
skipped=0

# Loop through all skill directories
for skill_dir in "${SKILLS_DIR}"/*; do
    if [ -d "$skill_dir" ]; then
        skill_name=$(basename "$skill_dir")

        # Skip the commands directory (not a skill)
        if [ "$skill_name" = "commands" ]; then
            continue
        fi

        skill_file="${skill_dir}/SKILL.md"
        zip_file="${skill_dir}/${skill_name}-skill.zip"

        if [ -f "$skill_file" ]; then
            # Create ZIP file containing only SKILL.md
            (cd "$skill_dir" && zip -q -r "${skill_name}-skill.zip" SKILL.md)
            echo "✓ Created: ${skill_name}-skill.zip"
            ((created++))
        else
            echo "⚠ Skipped: $skill_name (no SKILL.md found)"
            ((skipped++))
        fi
    fi
done

echo ""
echo "Summary:"
echo "  Created: $created ZIP files"
if [ $skipped -gt 0 ]; then
    echo "  Skipped: $skipped directories"
fi
echo ""
echo "ZIP files can be imported into Claude Desktop via:"
echo "  Profile → Skills → Import Skill → Select ZIP file"
