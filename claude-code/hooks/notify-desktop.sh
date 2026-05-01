#!/bin/bash
# Desktop notification hook for Claude Code
# Supports macOS (osascript) and Linux (notify-send)

INPUT=$(cat)
EVENT=$(echo "$INPUT" | jq -r '.hook_event_name')
MESSAGE=""

case "$EVENT" in
  "Notification")
    TYPE=$(echo "$INPUT" | jq -r '.notification_type // empty')
    case "$TYPE" in
      "idle_prompt") MESSAGE="입력을 기다리고 있습니다" ;;
      "permission_prompt") MESSAGE="권한 승인이 필요합니다" ;;
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
  if command -v osascript &>/dev/null; then
    osascript -e "display notification \"$MESSAGE\" with title \"Claude Code\""
  elif command -v notify-send &>/dev/null; then
    notify-send "Claude Code" "$MESSAGE"
  fi
fi
