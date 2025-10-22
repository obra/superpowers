#!/bin/bash
# Inventory a repository and list all features

REPO_PATH="$1"
REPO_NAME=$(basename "$REPO_PATH")

echo "# Inventory: $REPO_NAME"
echo ""
echo "**Path:** $REPO_PATH"
echo ""

# Find skills
if [ -d "$REPO_PATH/skills" ]; then
    echo "## Skills"
    find "$REPO_PATH/skills" -name "SKILL.md" -o -name "*.md" | while read file; do
        rel_path=${file#$REPO_PATH/}
        echo "- $rel_path"
    done
    echo ""
fi

# Find commands
if [ -d "$REPO_PATH/commands" ]; then
    echo "## Commands"
    find "$REPO_PATH/commands" -name "*.md" | while read file; do
        rel_path=${file#$REPO_PATH/}
        echo "- $rel_path"
    done
    echo ""
fi

# Find hooks
if [ -d "$REPO_PATH/hooks" ]; then
    echo "## Hooks"
    find "$REPO_PATH/hooks" -name "*.md" -o -name "*.sh" | while read file; do
        rel_path=${file#$REPO_PATH/}
        echo "- $rel_path"
    done
    echo ""
fi

# Find agents
if [ -d "$REPO_PATH/agents" ]; then
    echo "## Agents"
    find "$REPO_PATH/agents" -name "*.md" -o -name "*.txt" | while read file; do
        rel_path=${file#$REPO_PATH/}
        echo "- $rel_path"
    done
    echo ""
fi

# Find scripts
if [ -d "$REPO_PATH/scripts" ]; then
    echo "## Scripts"
    find "$REPO_PATH/scripts" -type f | while read file; do
        rel_path=${file#$REPO_PATH/}
        echo "- $rel_path"
    done
    echo ""
fi

# Find other directories
echo "## Other Directories"
ls -d "$REPO_PATH"/*/ 2>/dev/null | while read dir; do
    dirname=$(basename "$dir")
    if [[ ! "$dirname" =~ ^(skills|commands|hooks|agents|scripts|\.git)$ ]]; then
        echo "- $dirname/"
    fi
done
