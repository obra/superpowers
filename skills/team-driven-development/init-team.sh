#!/usr/bin/env bash
# init-team.sh — Initialize a team-driven-development directory structure
#
# Usage: ./init-team.sh <team-name> <member1> [member2] [member3] ...
#
# Creates:
#   ~/.claude/teams/<team-name>/
#     tasks.json          — empty task list
#     inboxes/
#       <member>.json     — empty inbox per member
#
# Example:
#   ./init-team.sh feature-auth lead implementer-1 implementer-2 reviewer-1

set -euo pipefail

if [[ $# -lt 2 ]]; then
    echo "Usage: $0 <team-name> <member1> [member2] ..."
    echo "Example: $0 feature-auth lead implementer-1 reviewer-1"
    exit 1
fi

TEAM_NAME="$1"
shift
MEMBERS=("$@")

# Validate team name and member names (letters, digits, hyphens, underscores only)
if [[ ! "$TEAM_NAME" =~ ^[a-zA-Z0-9_-]+$ ]]; then
    echo "Error: team-name must contain only letters, digits, hyphens, and underscores"
    exit 1
fi
for MEMBER in "${MEMBERS[@]}"; do
    if [[ ! "$MEMBER" =~ ^[a-zA-Z0-9_-]+$ ]]; then
        echo "Error: member name '$MEMBER' must contain only letters, digits, hyphens, and underscores"
        exit 1
    fi
done

TEAM_DIR="${HOME}/.claude/teams/${TEAM_NAME}"
INBOX_DIR="${TEAM_DIR}/inboxes"

if [[ -d "$TEAM_DIR" ]]; then
    echo "Team directory already exists: $TEAM_DIR"
    echo "Remove it first if you want to reinitialize."
    exit 1
fi

# Create directory structure
mkdir -p "$INBOX_DIR"

# Initialize tasks.json with an empty task list
cat > "${TEAM_DIR}/tasks.json" << 'EOF'
{
  "tasks": []
}
EOF

# Create an empty inbox file for each member
for MEMBER in "${MEMBERS[@]}"; do
    cat > "${INBOX_DIR}/${MEMBER}.json" << 'EOF'
{
  "messages": []
}
EOF
done

echo "Team '${TEAM_NAME}' initialized at ${TEAM_DIR}"
echo ""
echo "Members:"
for MEMBER in "${MEMBERS[@]}"; do
    echo "  - ${MEMBER}"
done
echo ""
echo "Next steps:"
echo "  1. Add tasks to ${TEAM_DIR}/tasks.json"
echo "  2. Spawn agents using the team-*-prompt.md templates"
echo "  3. Lead assigns tasks to teammates via messages"
