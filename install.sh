#!/bin/bash
# Superpowers 로컬 설치 스크립트
# 사용법: bash install.sh
# 로컬 Claude Code에 superpowers 스킬/커맨드/훅을 영구 설치합니다.
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Superpowers 로컬 설치 시작 ==="

# 1. 스킬 설치
mkdir -p "${HOME}/.claude/skills"
for skill_dir in "${REPO_DIR}/skills"/*/; do
  skill_name=$(basename "$skill_dir")
  mkdir -p "${HOME}/.claude/skills/${skill_name}"
  cp -r "${skill_dir}"* "${HOME}/.claude/skills/${skill_name}/"
done
echo "✓ 스킬 설치 완료 ($(ls "${REPO_DIR}/skills" | wc -l)개)"

# 2. 커맨드 설치
mkdir -p "${HOME}/.claude/commands"
for cmd_file in "${REPO_DIR}/commands"/*.md; do
  [ -f "$cmd_file" ] || continue
  cp "$cmd_file" "${HOME}/.claude/commands/"
done
echo "✓ 커맨드 설치 완료 ($(ls "${REPO_DIR}/commands"/*.md 2>/dev/null | wc -l)개)"

# 3. settings.json에 superpowers SessionStart 훅 등록
SETTINGS_FILE="${HOME}/.claude/settings.json"
HOOK_CMD="${REPO_DIR}/hooks/run-hook.cmd"

if [ -f "${SETTINGS_FILE}" ]; then
  # 기존 settings.json 백업
  cp "${SETTINGS_FILE}" "${SETTINGS_FILE}.backup"
  echo "✓ 기존 settings.json 백업됨 (${SETTINGS_FILE}.backup)"
fi

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
        ]
    },
    "permissions": {
        "allow": ["Skill"]
    }
}
EOF
echo "✓ ~/.claude/settings.json 설정 완료"

# 4. worktrunk 설치 (선택)
if ! command -v wt &>/dev/null; then
  if command -v cargo &>/dev/null; then
    echo "worktrunk 설치 중..."
    cargo install worktrunk
    echo "✓ worktrunk 설치 완료"
  else
    echo "⚠️  worktrunk 설치 건너뜀 (cargo 없음 - Rust 설치 후 'cargo install worktrunk' 실행)"
  fi
else
  echo "✓ worktrunk 이미 설치됨"
fi

echo ""
echo "=== 설치 완료 ==="
echo ""
echo "사용 방법:"
echo "  /brainstorm   — 아이디어 설계 대화"
echo "  /write-plan   — 구현 계획서 작성"
echo "  /execute-plan — 계획 단계별 실행"
echo "  wt switch <branch> — 병렬 worktree 전환"
echo ""
echo "새 Claude Code 세션을 시작하면 superpowers가 자동으로 활성화됩니다."
