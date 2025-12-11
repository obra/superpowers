#!/bin/bash
# Setup script for code-style-review skill
# Run this once to install dependencies

set -euo pipefail  # Exit on error, undefined vars, pipe failures

echo "=== Installing code-style-review dependencies ==="

# Check for pip
if command -v pip3 &> /dev/null; then
    PIP="pip3"
elif command -v pip &> /dev/null; then
    PIP="pip"
else
    echo "Error: pip not found. Please install Python first."
    exit 1
fi

# Install ruff with pinned version to user directory
if ! command -v ruff &> /dev/null; then
    echo "Installing ruff..."
    # Use --user to install to user directory, avoiding system changes
    $PIP install --user ruff==0.1.9 2>/dev/null || {
        echo "Warning: User installation failed, trying without --user"
        $PIP install ruff==0.1.9
    }
else
    echo "ruff already installed: $(ruff --version)"
fi

# Verify ruff is now available
if ! command -v ruff &> /dev/null; then
    echo "Error: ruff installation failed - not found in PATH"
    echo "Please ensure ~/.local/bin is in your PATH"
    exit 1
fi

echo ""
echo "=== Setup complete ==="
echo "You can now use the code style review skill."
