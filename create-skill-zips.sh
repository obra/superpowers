#!/bin/bash
# Script to create ZIP files for all Claude Code skills

SKILLS_DIR="/home/user/superpowers/skills"
OUTPUT_DIR="/home/user/superpowers/skill-zips"

# Create output directory
mkdir -p "$OUTPUT_DIR"

echo "Creating ZIP files for all skills..."
echo "======================================"

# Counter
count=0

# Loop through each directory in skills/ (excluding the 'commands' folder)
for skill_dir in "$SKILLS_DIR"/*; do
    # Skip if not a directory
    if [ ! -d "$skill_dir" ]; then
        continue
    fi

    # Get the skill name (directory name)
    skill_name=$(basename "$skill_dir")

    # Skip the 'commands' folder as it's not a skill
    if [ "$skill_name" = "commands" ]; then
        echo "Skipping: $skill_name (not a skill)"
        continue
    fi

    # Check if SKILL.md exists
    if [ ! -f "$skill_dir/SKILL.md" ]; then
        echo "WARNING: $skill_name missing SKILL.md - skipping"
        continue
    fi

    # Create ZIP file
    zip_file="$OUTPUT_DIR/${skill_name}.zip"

    echo -n "Creating $skill_name.zip... "

    # Change to skills directory and zip the skill folder
    cd "$SKILLS_DIR" || exit 1
    zip -r -q "$zip_file" "$skill_name"

    if [ $? -eq 0 ]; then
        echo "✓ Done"
        ((count++))
    else
        echo "✗ Failed"
    fi
done

echo "======================================"
echo "Created $count skill ZIP files in $OUTPUT_DIR"
