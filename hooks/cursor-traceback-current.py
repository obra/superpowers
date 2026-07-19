#!/usr/bin/env python3
"""Cursor preToolUse hook — inject current conversation metadata into traceback CLI."""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

HOOKS_DIR = str(Path(__file__).resolve().parent)
if HOOKS_DIR not in sys.path:
    sys.path.insert(0, HOOKS_DIR)

from traceback_hook_common import CommandMatch, classify_command, rewrite_command

TARGET_TOKENS = ("ace", "traceback", "--cursor-current")

MISSING_CONVERSATION_MESSAGE = (
    "无法获取当前 Cursor 会话 ID（conversation_id），已拒绝执行 ace traceback --cursor-current。"
)
MISSING_TRANSCRIPT_MESSAGE = (
    "无法获取当前 Cursor 会话 transcript 路径（transcript_path），"
    "已拒绝执行 ace traceback --cursor-current。"
)
INVALID_COMMAND_MESSAGE = (
    "Shell 命令解析失败，无法安全校验 ace traceback --cursor-current，已拒绝执行。"
)
HOOK_FAILURE_MESSAGE = (
    "Cursor traceback hook 处理失败，已拒绝执行该 Shell 命令。"
)


def _allow() -> dict[str, Any]:
    return {"permission": "allow"}


def _deny(user_message: str) -> dict[str, Any]:
    return {"permission": "deny", "user_message": user_message}


def rewrite_payload(payload: dict[str, Any]) -> dict[str, Any]:
    if payload.get("tool_name") != "Shell":
        return _allow()

    tool_input = payload.get("tool_input")
    if not isinstance(tool_input, dict):
        return _deny(HOOK_FAILURE_MESSAGE)

    command = tool_input.get("command")
    if not isinstance(command, str) or not command.strip():
        return _deny(HOOK_FAILURE_MESSAGE)

    command_match = classify_command(command, TARGET_TOKENS)
    if command_match is CommandMatch.MALFORMED_TARGET:
        return _deny(INVALID_COMMAND_MESSAGE)
    if command_match is CommandMatch.NON_TARGET:
        # Only direct calls whose first token is "ace" are in scope.
        # Subshell forms such as "(ace ...)" intentionally start with "(".
        return _allow()

    conversation_id = payload.get("conversation_id")
    if not isinstance(conversation_id, str) or not conversation_id.strip():
        return _deny(MISSING_CONVERSATION_MESSAGE)

    transcript_path = payload.get("transcript_path")
    if not isinstance(transcript_path, str) or not transcript_path.strip():
        return _deny(MISSING_TRANSCRIPT_MESSAGE)

    rewritten_command = rewrite_command(
        command,
        (
            ("ACE_CURSOR_CONVERSATION_ID", conversation_id.strip()),
            ("ACE_CURSOR_TRANSCRIPT_PATH", transcript_path.strip()),
        ),
    )
    return {
        "permission": "allow",
        "updated_input": {
            **tool_input,
            "command": rewritten_command,
        },
    }


def main() -> int:
    try:
        raw = sys.stdin.read()
        payload = json.loads(raw)
        if not isinstance(payload, dict):
            raise ValueError("hook payload must be a JSON object")
        result = rewrite_payload(payload)
    except Exception:
        result = _deny(HOOK_FAILURE_MESSAGE)

    json.dump(result, sys.stdout, ensure_ascii=False)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
