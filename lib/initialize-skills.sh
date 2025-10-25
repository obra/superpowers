#!/usr/bin/env bash
set -euo pipefail

SKILLS_DIR="${HOME}/.config/bestpractice/skills"
SKILLS_REPO="https://github.com/obra/bestpractice-skills.git"

# Check if skills directory exists and is a valid git repo
if [ -d "$SKILLS_DIR/.git" ]; then
    cd "$SKILLS_DIR"

    # Get the remote name for the current tracking branch
    TRACKING_REMOTE=$(git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null | cut -d'/' -f1 || echo "")

    # Fetch from tracking remote if set, otherwise try upstream then origin
    if [ -n "$TRACKING_REMOTE" ]; then
        git fetch "$TRACKING_REMOTE" 2>/dev/null || true
    else
        git fetch upstream 2>/dev/null || git fetch origin 2>/dev/null || true
    fi

    # Check if we can fast-forward
    LOCAL=$(git rev-parse @ 2>/dev/null || echo "")
    REMOTE=$(git rev-parse @{u} 2>/dev/null || echo "")
    BASE=$(git merge-base @ @{u} 2>/dev/null || echo "")

    # Try to fast-forward merge first
    if [ -n "$LOCAL" ] && [ -n "$REMOTE" ] && [ "$LOCAL" != "$REMOTE" ]; then
        # Check if we can fast-forward (local is ancestor of remote)
        if [ "$LOCAL" = "$BASE" ]; then
            # Fast-forward merge is possible - local is behind
            echo "Updating skills to latest version..."
            if git merge --ff-only @{u} 2>&1; then
                echo "✓ Skills updated successfully"
                echo "SKILLS_UPDATED=true"
            else
                echo "Failed to update skills"
            fi
        elif [ "$REMOTE" != "$BASE" ]; then
            # Remote has changes (local is behind or diverged)
            echo "SKILLS_BEHIND=true"
        fi
        # If REMOTE = BASE, local is ahead - no action needed
    fi

    exit 0
fi

# Skills directory doesn't exist or isn't a git repo - initialize it
echo "Initializing skills repository..."

# Handle migration from old installation
if [ -d "${HOME}/.config/bestpractice/.git" ]; then
    echo "Found existing installation. Backing up..."
    mv "${HOME}/.config/bestpractice/.git" "${HOME}/.config/bestpractice/.git.bak"

    if [ -d "${HOME}/.config/bestpractice/skills" ]; then
        mv "${HOME}/.config/bestpractice/skills" "${HOME}/.config/bestpractice/skills.bak"
        echo "Your old skills are in ~/.config/bestpractice/skills.bak"
    fi
fi

# Clone the skills repository
mkdir -p "${HOME}/.config/bestpractice"
git clone "$SKILLS_REPO" "$SKILLS_DIR"

cd "$SKILLS_DIR"

# Offer to fork if gh is installed
if command -v gh &> /dev/null; then
    echo ""
    echo "GitHub CLI detected. Would you like to fork bestpractice-skills?"
    echo "Forking allows you to share skill improvements with the community."
    echo ""
    read -p "Fork bestpractice-skills? (y/N): " -n 1 -r
    echo

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        gh repo fork obra/bestpractice-skills --remote=true
        echo "Forked! You can now contribute skills back to the community."
    else
        git remote add upstream "$SKILLS_REPO"
    fi
else
    # No gh, just set up upstream remote
    git remote add upstream "$SKILLS_REPO"
fi

echo "Skills repository initialized at $SKILLS_DIR"
