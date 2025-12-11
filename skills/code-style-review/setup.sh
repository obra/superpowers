#!/bin/bash
# Setup script for code-style-review skill
# Run this once to install dependencies

set -e

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

# Install ruff
if ! command -v ruff &> /dev/null; then
    echo "Installing ruff..."
    $PIP install ruff --break-system-packages 2>/dev/null || $PIP install ruff --user
else
    echo "ruff already installed: $(ruff --version)"
fi

echo ""
echo "=== Setup complete ==="
echo "You can now use the code style review skill."
