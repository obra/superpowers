#!/bin/bash
set -e

# Configuration
GEMINI_DIR="$HOME/.gemini"
SKILLS_LINK="$GEMINI_DIR/skills"
GEMINI_MD="$GEMINI_DIR/GEMINI.md"
REPO_SKILLS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../skills" && pwd)"

# Check if the repo skills directory actually exists
if [ ! -d "$REPO_SKILLS_DIR" ]; then
    echo "Error: Skills directory not found at $REPO_SKILLS_DIR"
    exit 1
fi

# Ensure .gemini directory exists
if [ ! -d "$GEMINI_DIR" ]; then
    echo "Creating $GEMINI_DIR..."
    mkdir -p "$GEMINI_DIR"
fi

# Link skills (Hub Pattern)
echo "Linking skills from $REPO_SKILLS_DIR to $SKILLS_LINK..."

# Ensure skills directory exists as a directory
if [ -L "$SKILLS_LINK" ]; then
    echo "Converting $SKILLS_LINK from symlink to directory..."
    rm "$SKILLS_LINK"
fi

if [ -e "$SKILLS_LINK" ] && [ ! -d "$SKILLS_LINK" ]; then
    echo "Error: $SKILLS_LINK exists but is not a directory."
    echo "Please remove this file/link and try again:"
    echo "  rm $SKILLS_LINK"
    exit 1
fi
mkdir -p "$SKILLS_LINK"

# iterate through skills in the repo and symlink them individually
for skill_path in "$REPO_SKILLS_DIR"/*; do
    if [ -d "$skill_path" ]; then
        skill_name=$(basename "$skill_path")
        target_path="$SKILLS_LINK/$skill_name"
        
        # Safety check: Only replace if it's a symlink or doesn't exist
        if [ -e "$target_path" ] || [ -L "$target_path" ]; then
            if [ -L "$target_path" ]; then
                rm "$target_path"
            else
                echo "Warning: $target_path exists and is not a symlink. Skipping to protect user data."
                continue
            fi
        fi
        
        ln -s "$skill_path" "$target_path"
        echo "  - Linked $skill_name"
    fi
done

# Context Injection Block
CONTEXT_HEADER="<!-- SUPERPOWERS-CONTEXT-START -->"
CONTEXT_FOOTER="<!-- SUPERPOWERS-CONTEXT-END -->"

read -r -d '' CONTEXT_BLOCK << EOM || true
$CONTEXT_HEADER
# Superpowers Configuration

You have been granted Superpowers. These are specialized skills located in \`~/.gemini/skills\`.

## Skill Discovery & Usage
- **ALWAYS** check for relevant skills in \`~/.gemini/skills\` before starting a task.
- If a skill applies (e.g., "brainstorming", "testing"), you **MUST** follow it.
- To "use" a skill, read its content and follow the instructions.

## Terminology Mapping (Bootstrap)
The skills were originally written for Claude Code. You will interpret them as follows:
- **"Claude"** or **"Claude Code"** -> **"Gemini"** (You).
- **"Task" tool** -> **Sequential Execution**. You do not have parallel sub-agents yet. Perform tasks sequentially yourself.
- **"Skill" tool** -> **ReadFile**. To "invoke" a skill, read the markdown file at \`~/.gemini/skills/<skill-name>/SKILL.md\`.

$CONTEXT_FOOTER
EOM

# Update GEMINI.md
if [ ! -f "$GEMINI_MD" ]; then
    echo "Creating $GEMINI_MD..."
    touch "$GEMINI_MD"
fi

# Remove existing context block if present (idempotent update)
if grep -q "$CONTEXT_HEADER" "$GEMINI_MD"; then
    echo "Updating Superpowers context in $GEMINI_MD..."
    # Use sed to delete the block. Handles both macOS (BSD) and GNU sed.
    # We create a backup file and then delete it to be portable.
    sed -i.bak "/$CONTEXT_HEADER/,/$CONTEXT_FOOTER/d" "$GEMINI_MD"
    rm "${GEMINI_MD}.bak"
else
    echo "Injecting Superpowers context into $GEMINI_MD..."
fi

# Trim trailing whitespace from the file to prevent accumulation of blank lines
# awk is used here as a portable way to trim trailing newlines
awk 'NF{p=1} p' "$GEMINI_MD" > "${GEMINI_MD}.tmp" && mv "${GEMINI_MD}.tmp" "$GEMINI_MD"

# Append the current/updated block with exactly one newline separator
echo -e "\n\n$CONTEXT_BLOCK" >> "$GEMINI_MD"

echo "Installation complete! Restart your session to activate Superpowers."
echo "Try asking: 'Do you have superpowers?'"
