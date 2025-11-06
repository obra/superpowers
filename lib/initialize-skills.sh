#!/usr/bin/env bash
set -euo pipefail

SKILLS_DIR="${HOME}/.config/superpowers/skills"
SKILLS_REPO="https://github.com/obra/superpowers-skills.git"
# Optional: GPG key fingerprint for repository verification
# SKILLS_REPO_GPG_KEY="your-gpg-key-fingerprint-here"

# Function to validate git output
validate_git_ref() {
    local ref="$1"
    if [ -z "$ref" ]; then
        return 1
    fi
    # Validate it's a valid git SHA
    if [[ ! "$ref" =~ ^[0-9a-f]{40}$ ]] && [[ ! "$ref" =~ ^[0-9a-f]{7,40}$ ]]; then
        return 1
    fi
    return 0
}

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

    # Validate git refs before using them
    if ! validate_git_ref "$LOCAL" && [ -n "$LOCAL" ]; then
        echo "Warning: Invalid local git ref detected" >&2
        exit 1
    fi
    if ! validate_git_ref "$REMOTE" && [ -n "$REMOTE" ]; then
        echo "Warning: Invalid remote git ref detected" >&2
        exit 1
    fi
    if ! validate_git_ref "$BASE" && [ -n "$BASE" ]; then
        echo "Warning: Invalid base git ref detected" >&2
        exit 1
    fi

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

# Handle migration from old installation with timestamped backups
if [ -d "${HOME}/.config/superpowers/.git" ]; then
    echo "Found existing installation. Backing up..."
    BACKUP_TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_DIR="${HOME}/.config/superpowers/backups/${BACKUP_TIMESTAMP}"

    # Create secure backup directory with restricted permissions
    mkdir -p "$BACKUP_DIR"
    chmod 700 "$BACKUP_DIR"

    mv "${HOME}/.config/superpowers/.git" "${BACKUP_DIR}/.git.bak"

    if [ -d "${HOME}/.config/superpowers/skills" ]; then
        mv "${HOME}/.config/superpowers/skills" "${BACKUP_DIR}/skills.bak"
        echo "Your old installation backed up to: $BACKUP_DIR"
    fi
fi

# Create secure temporary directory for cloning
TEMP_CLONE_DIR=$(mktemp -d -t superpowers-clone.XXXXXX)
chmod 700 "$TEMP_CLONE_DIR"

# Cleanup function for error handling
cleanup_temp() {
    if [ -d "$TEMP_CLONE_DIR" ]; then
        rm -rf "$TEMP_CLONE_DIR"
    fi
}
trap cleanup_temp EXIT

# Clone the skills repository to temp directory first
echo "Cloning skills repository..."
if ! git clone --depth 1 "$SKILLS_REPO" "$TEMP_CLONE_DIR"; then
    echo "Error: Failed to clone skills repository" >&2
    exit 1
fi

# Verify clone was successful and has expected structure
if [ ! -d "$TEMP_CLONE_DIR/.git" ]; then
    echo "Error: Cloned repository is invalid" >&2
    exit 1
fi

# Move to final location
mkdir -p "$(dirname "$SKILLS_DIR")"
mv "$TEMP_CLONE_DIR" "$SKILLS_DIR"

# Verify final location
if [ ! -d "$SKILLS_DIR/.git" ]; then
    echo "Error: Skills installation failed" >&2
    exit 1
fi

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
        gh repo fork obra/superpowers-skills --remote=true
        echo "Forked! You can now contribute skills back to the community."
    else
        git remote add upstream "$SKILLS_REPO"
    fi
else
    # No gh, just set up upstream remote
    git remote add upstream "$SKILLS_REPO"
fi

echo "Skills repository initialized at $SKILLS_DIR"
