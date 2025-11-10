#!/bin/bash
# create-skill-zips.sh
# Creates ZIP files for all Superpowers skills for Claude Desktop upload

set -e

SKILLS_DIR="skills"
OUTPUT_DIR="skill-zips"
TEMP_DIR="temp-skill-build"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Superpowers Skill ZIP Creator ===${NC}"
echo ""

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Function to create a skill ZIP
create_skill_zip() {
    local skill_file=$1
    local skill_name=$(basename "$skill_file" .md)
    local skill_dir=$(dirname "$skill_file")

    echo -e "${YELLOW}Creating ${skill_name}.zip...${NC}"

    # Create temp directory structure
    mkdir -p "$TEMP_DIR/$skill_name"

    # Copy main skill file as SKILL.md
    cp "$skill_file" "$TEMP_DIR/$skill_name/SKILL.md"

    # Check for associated resources (scripts, examples)
    # For systematic debugging: include find-polluter.sh
    if [ -f "$skill_dir/find-polluter.sh" ]; then
        echo "  → Including find-polluter.sh script"
        mkdir -p "$TEMP_DIR/$skill_name/scripts"
        cp "$skill_dir/find-polluter.sh" "$TEMP_DIR/$skill_name/scripts/"
    fi

    # Check for example files
    if [ -f "$skill_dir/test.spec.ts" ]; then
        echo "  → Including test.spec.ts example"
        mkdir -p "$TEMP_DIR/$skill_name/resources"
        cp "$skill_dir/test.spec.ts" "$TEMP_DIR/$skill_name/resources/"
    fi

    # Create ZIP (quietly)
    (cd "$TEMP_DIR/$skill_name" && zip -q -r "../../$OUTPUT_DIR/$skill_name.zip" .)

    # Get file size
    local size=$(du -h "$OUTPUT_DIR/$skill_name.zip" | cut -f1)

    echo -e "${GREEN}✓ Created $skill_name.zip ($size)${NC}"
    return 0
}

# Create ZIPs for all skills
echo "Scanning $SKILLS_DIR for skills..."
echo ""

skill_count=0

# Core skills
echo -e "${BLUE}Core Skills:${NC}"
if [ -d "$SKILLS_DIR/core" ]; then
    for skill in "$SKILLS_DIR/core"/*.md; do
        if [ -f "$skill" ]; then
            create_skill_zip "$skill"
            skill_count=$((skill_count + 1))
        fi
    done
fi
echo ""

# Testing skills
echo -e "${BLUE}Testing Skills:${NC}"
if [ -d "$SKILLS_DIR/testing" ]; then
    for skill in "$SKILLS_DIR/testing"/*.md; do
        if [ -f "$skill" ]; then
            create_skill_zip "$skill"
            skill_count=$((skill_count + 1))
        fi
    done
fi
echo ""

# Debugging skills
echo -e "${BLUE}Debugging Skills:${NC}"
if [ -d "$SKILLS_DIR/debugging" ]; then
    for skill in "$SKILLS_DIR/debugging"/*.md; do
        if [ -f "$skill" ]; then
            create_skill_zip "$skill"
            skill_count=$((skill_count + 1))
        fi
    done
fi
echo ""

# Collaboration skills
echo -e "${BLUE}Collaboration Skills:${NC}"
if [ -d "$SKILLS_DIR/collaboration" ]; then
    for skill in "$SKILLS_DIR/collaboration"/*.md; do
        if [ -f "$skill" ]; then
            create_skill_zip "$skill"
            skill_count=$((skill_count + 1))
        fi
    done
fi
echo ""

# Meta skills
echo -e "${BLUE}Meta Skills:${NC}"
if [ -d "$SKILLS_DIR/meta" ]; then
    for skill in "$SKILLS_DIR/meta"/*.md; do
        if [ -f "$skill" ]; then
            create_skill_zip "$skill"
            skill_count=$((skill_count + 1))
        fi
    done
fi
echo ""

# Cleanup
rm -rf "$TEMP_DIR"

echo -e "${GREEN}=== Complete ===${NC}"
echo ""
echo -e "Created ${GREEN}$skill_count${NC} skill ZIP files in ${BLUE}$OUTPUT_DIR/${NC}"
echo ""
echo "File listing:"
ls -lh "$OUTPUT_DIR" | tail -n +2 | awk '{printf "  %-40s %5s\n", $9, $5}'
echo ""
echo "Total size: $(du -sh $OUTPUT_DIR | cut -f1)"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Open Claude Desktop"
echo "2. Go to Settings → Capabilities"
echo "3. Click 'Upload skill' for each ZIP file"
echo "4. Start with core skills: test-driven-development, systematic-debugging, brainstorming"
echo ""
echo "See SKILLS-ZIP-UPLOAD-GUIDE.md for detailed instructions."
