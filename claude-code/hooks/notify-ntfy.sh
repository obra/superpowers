#!/bin/bash
# ntfy push notification hook for Claude Code
# Reads ntfy topic from .claude/settings.local.json

INPUT=$(cat)
EVENT=$(echo "$INPUT" | jq -r '.hook_event_name')

# Read ntfy topic URL from project-local settings (gitignored)
NTFY_TOPIC=$(jq -r '.ntfy_topic // empty' "${CLAUDE_PROJECT_DIR:-.}/.claude/settings.local.json" 2>/dev/null)

if [ -z "$NTFY_TOPIC" ]; then
  exit 0
fi

MESSAGE=""
PRIORITY="default"

case "$EVENT" in
  "Notification")
    TYPE=$(echo "$INPUT" | jq -r '.notification_type // empty')
    case "$TYPE" in
      "idle_prompt") MESSAGE="입력을 기다리고 있습니다"; PRIORITY="default" ;;
      "permission_prompt") MESSAGE="권한 승인이 필요합니다"; PRIORITY="high" ;;
    esac
    ;;
  "TaskCompleted")
    TASK=$(echo "$INPUT" | jq -r '.task_subject // "태스크"')
    MESSAGE="완료: $TASK"
    ;;
  "Stop")
    MESSAGE="작업 완료"
    ;;
esac

if [ -n "$MESSAGE" ]; then
  curl -s \
    -H "Title: Claude Code" \
    -H "Priority: $PRIORITY" \
    -d "$MESSAGE" \
    "$NTFY_TOPIC"
fi
