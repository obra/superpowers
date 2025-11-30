#!/bin/bash
# Superpowers Installer for Droid CLI (Factory)
# One-command installation script

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
FACTORY_DIR="${HOME}/.factory"
SUPERPOWERS_DIR="${FACTORY_DIR}/superpowers"
REPO_URL="https://github.com/obra/superpowers.git"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}       🦸 Superpowers Installer for Droid CLI (Factory)          ${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v git &> /dev/null; then
    echo -e "${RED}Error: git is not installed${NC}"
    exit 1
fi

if [[ ! -d "$FACTORY_DIR" ]]; then
    echo -e "${RED}Error: ~/.factory directory not found. Is Droid CLI installed?${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Prerequisites OK${NC}"
echo ""

# Step 1: Clone or update repository
echo -e "${YELLOW}[1/5] Setting up superpowers repository...${NC}"

if [[ -d "$SUPERPOWERS_DIR" ]]; then
    echo "  Repository exists, updating..."
    cd "$SUPERPOWERS_DIR"
    git pull --quiet
    echo -e "${GREEN}  ✓ Repository updated${NC}"
else
    echo "  Cloning repository..."
    git clone --quiet "$REPO_URL" "$SUPERPOWERS_DIR"
    echo -e "${GREEN}  ✓ Repository cloned${NC}"
fi

# Step 2: Install skills
echo -e "${YELLOW}[2/5] Installing skills...${NC}"

mkdir -p "${FACTORY_DIR}/skills"
cp -r "${SUPERPOWERS_DIR}/.factory/skills/"* "${FACTORY_DIR}/skills/" 2>/dev/null || true

skill_count=$(ls -d "${FACTORY_DIR}/skills/"*/ 2>/dev/null | wc -l | tr -d ' ')
echo -e "${GREEN}  ✓ Installed ${skill_count} skills${NC}"

# Step 3: Install droids
echo -e "${YELLOW}[3/5] Installing droids...${NC}"

mkdir -p "${FACTORY_DIR}/droids"
cp "${SUPERPOWERS_DIR}/.factory/droids/"* "${FACTORY_DIR}/droids/" 2>/dev/null || true

droid_count=$(ls "${FACTORY_DIR}/droids/"*.md 2>/dev/null | wc -l | tr -d ' ')
echo -e "${GREEN}  ✓ Installed ${droid_count} droids${NC}"

# Step 4: Install commands
echo -e "${YELLOW}[4/5] Installing commands...${NC}"

mkdir -p "${FACTORY_DIR}/commands"
cp "${SUPERPOWERS_DIR}/.factory/commands/"* "${FACTORY_DIR}/commands/" 2>/dev/null || true

cmd_count=$(ls "${FACTORY_DIR}/commands/"*.md 2>/dev/null | wc -l | tr -d ' ')
echo -e "${GREEN}  ✓ Installed ${cmd_count} commands${NC}"

# Step 5: Install/update AGENTS.md
echo -e "${YELLOW}[5/5] Installing protocol...${NC}"

AGENTS_FILE="${FACTORY_DIR}/AGENTS.md"
SUPERPOWERS_AGENTS="${SUPERPOWERS_DIR}/.factory/AGENTS.md"

if [[ -f "$AGENTS_FILE" ]]; then
    # Check if superpowers protocol already exists
    if grep -q "SUPERPOWERS" "$AGENTS_FILE" 2>/dev/null; then
        echo "  Protocol already installed in AGENTS.md"
        echo -e "${YELLOW}  ! To update, manually replace the superpowers section${NC}"
    else
        # Backup and append
        cp "$AGENTS_FILE" "${AGENTS_FILE}.backup"
        echo "" >> "$AGENTS_FILE"
        cat "$SUPERPOWERS_AGENTS" >> "$AGENTS_FILE"
        echo -e "${GREEN}  ✓ Protocol appended to existing AGENTS.md${NC}"
        echo -e "${BLUE}  ℹ Backup saved to AGENTS.md.backup${NC}"
    fi
else
    cp "$SUPERPOWERS_AGENTS" "$AGENTS_FILE"
    echo -e "${GREEN}  ✓ Protocol installed${NC}"
fi

# Done!
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}       ✅ Superpowers installed successfully!                     ${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "Next steps:"
echo -e "  1. ${YELLOW}Start a new Droid CLI session${NC}"
echo -e "  2. Try: ${BLUE}/brainstorm${NC} or ask to build something"
echo ""
echo -e "Available commands:"
echo -e "  ${BLUE}/brainstorm${NC}    - Start design refinement"
echo -e "  ${BLUE}/write-plan${NC}    - Create implementation plan"
echo -e "  ${BLUE}/execute-plan${NC}  - Execute plan with checkpoints"
echo ""
echo -e "Verify installation:"
echo -e "  1. Type ${BLUE}/brainstorm${NC} → should call Skill(\"brainstorming\") tool"
echo -e "  2. Say ${BLUE}\"build a todo app\"${NC} → should use brainstorming skill"
echo -e "  3. Say ${BLUE}\"help debug an error\"${NC} → should use systematic-debugging skill"
echo ""
echo -e "Documentation: ${BLUE}https://github.com/obra/superpowers/blob/main/docs/README.factory.md${NC}"
echo ""
