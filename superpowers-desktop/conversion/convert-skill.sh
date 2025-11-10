#!/usr/bin/env bash
set -euo pipefail

# Convert a Superpowers skill for Claude Desktop use
# Usage: ./convert-skill.sh <input-skill.md> <output-skill.md>

if [ $# -ne 2 ]; then
    echo "Usage: $0 <input-skill.md> <output-skill.md>"
    exit 1
fi

INPUT="$1"
OUTPUT="$2"

if [ ! -f "$INPUT" ]; then
    echo "Error: Input file '$INPUT' not found"
    exit 1
fi

# Create output directory if needed
mkdir -p "$(dirname "$OUTPUT")"

# Process the file with sed
sed '
# Strip Skill tool references
s/Use the Skill tool to read and run the skill/Reference the skill from project knowledge/g
s/Skill tool/skill reference/g

# Strip Task tool references
s/Task tool/manual task breakdown/g
s/dispatch.*subagent/break down into sequential tasks/g
s/subagent/separate task/g

# Strip TodoWrite references
s/TodoWrite/explicit checklist tracking/g
s/create TodoWrite todos/track checklist items explicitly in your responses/g
s/YOU MUST create TodoWrite todos/you must track checklist items explicitly/g

# Strip SessionStart hook references
s/SessionStart Hook/custom instructions (Pro) or manual reminder (Free)/g
s/SessionStart hook/custom instructions/g

# Rewrite cross-references from superpowers: format
s/superpowers:\([a-z-]*\)/\1.md (in project knowledge)/g

# Rewrite REQUIRED SUB-SKILL references
s/\*\*REQUIRED SUB-SKILL:\*\* Use superpowers:\([a-z-]*\)/**REQUIRED:** Reference \1.md from project knowledge/g

# Rewrite @ file references (but keep @graphviz-conventions as example)
s/@\([a-z-]*\)\.md/\1.md (in project knowledge)/g

# Add desktop-specific notes after frontmatter
/^---$/ {
    N
    /^---\n$/ {
        a\
\
> **Note for Claude Desktop:** This skill has been adapted from the Claude Code plugin. Some automation features (like automatic activation and TodoWrite tracking) require manual implementation. Track checklists explicitly in your responses.
    }
}
' "$INPUT" > "$OUTPUT"

echo "✓ Converted: $INPUT → $OUTPUT"
