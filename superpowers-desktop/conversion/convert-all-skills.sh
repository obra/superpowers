#!/usr/bin/env bash
set -euo pipefail

# Convert all Superpowers skills for Claude Desktop
# Organizes into categories for better project knowledge navigation

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILLS_DIR="/home/user/superpowers/skills"
OUTPUT_DIR="$SCRIPT_DIR/../pro-setup/skills"

echo "Converting Superpowers skills for Claude Desktop..."
echo "Source: $SKILLS_DIR"
echo "Output: $OUTPUT_DIR"
echo

# Create category directories
mkdir -p "$OUTPUT_DIR"/{core,testing,debugging,collaboration,meta}

# Core skills (highest priority)
echo "Converting core skills..."
CORE_SKILLS=(
    "using-superpowers"
    "test-driven-development"
    "systematic-debugging"
    "brainstorming"
)

for skill in "${CORE_SKILLS[@]}"; do
    if [ -f "$SKILLS_DIR/$skill/SKILL.md" ]; then
        "$SCRIPT_DIR/convert-skill.sh" \
            "$SKILLS_DIR/$skill/SKILL.md" \
            "$OUTPUT_DIR/core/$skill.md"
    fi
done

# Testing skills
echo "Converting testing skills..."
TESTING_SKILLS=(
    "condition-based-waiting"
    "testing-anti-patterns"
)

for skill in "${TESTING_SKILLS[@]}"; do
    if [ -f "$SKILLS_DIR/$skill/SKILL.md" ]; then
        "$SCRIPT_DIR/convert-skill.sh" \
            "$SKILLS_DIR/$skill/SKILL.md" \
            "$OUTPUT_DIR/testing/$skill.md"
    fi
done

# Debugging skills
echo "Converting debugging skills..."
DEBUGGING_SKILLS=(
    "root-cause-tracing"
    "verification-before-completion"
    "defense-in-depth"
)

for skill in "${DEBUGGING_SKILLS[@]}"; do
    if [ -f "$SKILLS_DIR/$skill/SKILL.md" ]; then
        "$SCRIPT_DIR/convert-skill.sh" \
            "$SKILLS_DIR/$skill/SKILL.md" \
            "$OUTPUT_DIR/debugging/$skill.md"
    fi
done

# Collaboration skills
echo "Converting collaboration skills..."
COLLABORATION_SKILLS=(
    "writing-plans"
    "executing-plans"
    "dispatching-parallel-agents"
    "requesting-code-review"
    "receiving-code-review"
    "using-git-worktrees"
    "finishing-a-development-branch"
    "subagent-driven-development"
)

for skill in "${COLLABORATION_SKILLS[@]}"; do
    if [ -f "$SKILLS_DIR/$skill/SKILL.md" ]; then
        "$SCRIPT_DIR/convert-skill.sh" \
            "$SKILLS_DIR/$skill/SKILL.md" \
            "$OUTPUT_DIR/collaboration/$skill.md"
    fi
done

# Meta skills
echo "Converting meta skills..."
META_SKILLS=(
    "writing-skills"
    "sharing-skills"
    "testing-skills-with-subagents"
)

for skill in "${META_SKILLS[@]}"; do
    if [ -f "$SKILLS_DIR/$skill/SKILL.md" ]; then
        "$SCRIPT_DIR/convert-skill.sh" \
            "$SKILLS_DIR/$skill/SKILL.md" \
            "$OUTPUT_DIR/meta/$skill.md"
    fi
done

# Copy example files if they exist
echo "Copying example files..."
if [ -f "$SKILLS_DIR/condition-based-waiting/example.ts" ]; then
    cp "$SKILLS_DIR/condition-based-waiting/example.ts" \
       "$OUTPUT_DIR/testing/condition-based-waiting-example.ts"
fi

if [ -f "$SKILLS_DIR/root-cause-tracing/find-polluter.sh" ]; then
    cp "$SKILLS_DIR/root-cause-tracing/find-polluter.sh" \
       "$OUTPUT_DIR/debugging/find-polluter.sh"
fi

echo
echo "✓ Conversion complete!"
echo "  Core skills: ${#CORE_SKILLS[@]}"
echo "  Testing skills: ${#TESTING_SKILLS[@]}"
echo "  Debugging skills: ${#DEBUGGING_SKILLS[@]}"
echo "  Collaboration skills: ${#COLLABORATION_SKILLS[@]}"
echo "  Meta skills: ${#META_SKILLS[@]}"
echo
echo "Skills ready in: $OUTPUT_DIR"
