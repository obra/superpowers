#!/bin/bash
set -e

# Configuration
GEMINI_DIR="$HOME/.gemini"
SKILLS_LINK="$GEMINI_DIR/skills"
GEMINI_MD="$GEMINI_DIR/GEMINI.md"
REPO_SKILLS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../skills" && pwd)"

# Ensure .gemini directory exists
if [ ! -d "$GEMINI_DIR" ]; then
    echo "Creating $GEMINI_DIR..."
    mkdir -p "$GEMINI_DIR"
fi

# Create Symlink
echo "Linking skills from $REPO_SKILLS_DIR to $SKILLS_LINK..."
if [ -L "$SKILLS_LINK" ]; then
    rm "$SKILLS_LINK"
elif [ -d "$SKILLS_LINK" ]; then
    echo "Error: $SKILLS_LINK exists and is a directory. Please remove it first."
    exit 1
fi
ln -s "$REPO_SKILLS_DIR" "$SKILLS_LINK"

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

if grep -q "$CONTEXT_HEADER" "$GEMINI_MD"; then
    echo "Superpowers context already present in $GEMINI_MD. Skipping injection."
else
    echo "Injecting Superpowers context into $GEMINI_MD..."
    echo -e "\n$CONTEXT_BLOCK" >> "$GEMINI_MD"
fi

echo "Installation complete! Restart your session to activate Superpowers."
echo "Try asking: 'Do you have superpowers?'"
