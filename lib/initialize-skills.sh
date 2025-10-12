#!/usr/bin/env bash
set -euo pipefail

SKILLS_DIR="${HOME}/.config/superpowers/skills"
SKILLS_REPO="https://github.com/joegoldin/superpowers-skills.git"

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
            # Fast-forward merge is possible
            echo "Updating skills to latest version..."
            if git merge --ff-only @{u} 2>&1; then
                echo "✓ Skills updated successfully"
                echo "SKILLS_UPDATED=true"
            else
                echo "Failed to update skills"
            fi
        else
            # Can't fast-forward - will be reported at the end
            echo "SKILLS_BEHIND=true"
        fi
    fi

    exit 0
fi

# Skills directory doesn't exist or isn't a git repo - initialize it
echo "Initializing skills repository..."

# Handle migration from old installation
if [ -d "${HOME}/.config/superpowers/.git" ]; then
    echo "Found existing installation. Backing up..."
    mv "${HOME}/.config/superpowers/.git" "${HOME}/.config/superpowers/.git.bak"

    if [ -d "${HOME}/.config/superpowers/skills" ]; then
        mv "${HOME}/.config/superpowers/skills" "${HOME}/.config/superpowers/skills.bak"
        echo "Your old skills are in ~/.config/superpowers/skills.bak"
    fi
fi

# Clone the skills repository
mkdir -p "${HOME}/.config/superpowers"
git clone "$SKILLS_REPO" "$SKILLS_DIR"

cd "$SKILLS_DIR"

# Offer to fork if gh is installed
if command -v gh &> /dev/null; then
    echo ""
    echo "GitHub CLI detected. Would you like to fork superpowers-skills?"
    echo "Forking allows you to share skill improvements with the community."
    echo ""
    read -p "Fork superpowers-skills? (y/N): " -n 1 -r
    echo

    if [[ $REPLY =~ ^[Yy]$ ]]; then
        gh repo fork joegoldin/superpowers-skills --remote=true
        echo "Forked! You can now contribute skills back to the community."
    else
        git remote add upstream "$SKILLS_REPO"
    fi
else
    # No gh, just set up upstream remote
    git remote add upstream "$SKILLS_REPO"
fi

echo "Skills repository initialized at $SKILLS_DIR"
