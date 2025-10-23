#!/bin/bash

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SKILLS_DIR="$REPO_ROOT/skills"
AGENTS_DIR="$REPO_ROOT/agents"
TEMPLATE_FILE="$REPO_ROOT/templates/specialist-agent.template"
REGISTRY_FILE="$REPO_ROOT/lib/agent-registry.json"

echo "Generating specialist agents from skills..."

# Ensure agents directory exists
mkdir -p "$AGENTS_DIR"

# Initialize registry
echo "[" > "$REGISTRY_FILE"

first_entry=true

# Process each skill
for skill_dir in "$SKILLS_DIR"/*; do
    if [ ! -d "$skill_dir" ]; then
        continue
    fi

    skill_file="$skill_dir/SKILL.md"
    if [ ! -f "$skill_file" ]; then
        echo "Warning: No SKILL.md found in $skill_dir"
        continue
    fi

    # Extract skill name from directory
    skill_name=$(basename "$skill_dir")

    # Parse YAML frontmatter - remove newlines from description
    skill_description=$(sed -n '/^---$/,/^---$/p' "$skill_file" | grep "^description:" | sed 's/^description: *//' | tr '\n' ' ')

    # Skip if no description
    if [ -z "$skill_description" ]; then
        echo "Warning: No description in $skill_file"
        continue
    fi

    # Read full skill content (everything after second ---)
    skill_content=$(awk 'BEGIN{p=0} /^---$/{p++; next} p>=2' "$skill_file")

    # Create display name (capitalize, replace hyphens with spaces)
    skill_display_name=$(echo "$skill_name" | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) tolower(substr($i,2))}1')

    # Generate agent file
    agent_file="$AGENTS_DIR/${skill_name}-specialist.md"

    echo "Generating $agent_file..."

    # Process template with substitutions
    sed -e "s|{{SKILL_NAME}}|$skill_name|g" \
        -e "s|{{SKILL_DESCRIPTION}}|$skill_description|g" \
        -e "s|{{SKILL_DISPLAY_NAME}}|$skill_display_name|g" \
        "$TEMPLATE_FILE" > "$agent_file.tmp"

    # Insert skill content using sed with temp file
    # First, extract content after second ---
    awk 'BEGIN{p=0} /^---$/{p++; next} p>=2' "$skill_file" > "$agent_file.content"

    # Replace {{SKILL_CONTENT}} placeholder with actual content
    sed -e '/{{SKILL_CONTENT}}/r '"$agent_file.content" -e '/{{SKILL_CONTENT}}/d' "$agent_file.tmp" > "$agent_file"

    rm "$agent_file.tmp" "$agent_file.content"

    # Add to registry
    if [ "$first_entry" = false ]; then
        echo "," >> "$REGISTRY_FILE"
    fi
    first_entry=false

    cat >> "$REGISTRY_FILE" <<EOF
  {
    "name": "${skill_name}-specialist",
    "description": "$skill_description",
    "agent_file": "agents/${skill_name}-specialist.md",
    "skill_name": "$skill_name"
  }
EOF
done

# Close registry
echo "]" >> "$REGISTRY_FILE"

echo "Generated specialist agents in $AGENTS_DIR"
echo "Generated agent registry at $REGISTRY_FILE"
