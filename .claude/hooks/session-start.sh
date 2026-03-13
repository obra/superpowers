#!/bin/bash
# SessionStart hook for superpowers repo
# Runs on every Claude Code on the web session to re-install superpowers
set -euo pipefail

# Only run in remote (web) environment
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

REPO_DIR="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"

echo "=== Installing superpowers ===" >&2

# 1. Install skills
mkdir -p "${HOME}/.claude/skills"
for skill_dir in "${REPO_DIR}/skills"/*/; do
  skill_name=$(basename "$skill_dir")
  mkdir -p "${HOME}/.claude/skills/${skill_name}"
  cp -r "${skill_dir}"* "${HOME}/.claude/skills/${skill_name}/" 2>/dev/null || true
done
echo "✓ Skills installed ($(ls "${REPO_DIR}/skills" | wc -l)개)" >&2

# 2. Install commands
mkdir -p "${HOME}/.claude/commands"
for cmd_file in "${REPO_DIR}/commands"/*.md; do
  [ -f "$cmd_file" ] || continue
  cp "$cmd_file" "${HOME}/.claude/commands/"
done
echo "✓ Commands installed ($(ls "${REPO_DIR}/commands"/*.md 2>/dev/null | wc -l)개)" >&2

# 3. Register superpowers SessionStart hook in ~/.claude/settings.json
SETTINGS_FILE="${HOME}/.claude/settings.json"
HOOK_CMD="${REPO_DIR}/hooks/run-hook.cmd"

# Build the settings JSON with both Stop hook (existing) and superpowers SessionStart hook
cat > "${SETTINGS_FILE}" << EOF
{
    "\$schema": "https://json.schemastore.org/claude-code-settings.json",
    "hooks": {
        "SessionStart": [
            {
                "matcher": "startup|resume|clear|compact",
                "hooks": [
                    {
                        "type": "command",
                        "command": "${HOOK_CMD} session-start",
                        "async": false
                    }
                ]
            }
        ],
        "Stop": [
            {
                "matcher": "",
                "hooks": [
                    {
                        "type": "command",
                        "command": "~/.claude/stop-hook-git-check.sh"
                    }
                ]
            }
        ]
    },
    "permissions": {
        "allow": ["Skill"]
    }
}
EOF
echo "✓ ~/.claude/settings.json 업데이트됨" >&2

# 4. Install worktrunk if not present
if ! command -v wt &>/dev/null; then
  if command -v cargo &>/dev/null; then
    echo "worktrunk 설치 중..." >&2
    cargo install worktrunk --quiet 2>&1 | tail -3 >&2 || echo "⚠️ worktrunk 설치 실패 (무시)" >&2
  fi
else
  echo "✓ worktrunk 이미 설치됨" >&2
fi

echo "=== superpowers 설치 완료 ===" >&2
