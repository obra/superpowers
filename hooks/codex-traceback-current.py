#!/usr/bin/env python3
"""Codex PreToolUse hook — inject current session metadata into traceback CLI."""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

HOOKS_DIR = str(Path(__file__).resolve().parent)
if HOOKS_DIR not in sys.path:
    sys.path.insert(0, HOOKS_DIR)

from traceback_hook_common import CommandMatch, classify_command, rewrite_command

TARGET_TOKENS = ("ace", "traceback", "--codex-current")

MISSING_SESSION_MESSAGE = (
    "无法获取当前 Codex 会话 ID（session_id），已拒绝执行 ace traceback --codex-current。"
)
MISSING_TRANSCRIPT_MESSAGE = (
    "无法获取当前 Codex 会话 transcript 路径（transcript_path），"
    "已拒绝执行 ace traceback --codex-current。"
)
INVALID_COMMAND_MESSAGE = (
    "Bash 命令解析失败，无法安全校验 ace traceback --codex-current，已拒绝执行。"
)

# Command rewriting requires a POSIX-compatible shell. Native Windows shells
# are not fully supported; the leading `env` command makes target invocations
# fail safely. The traceback skill checks and explains this limitation.


def _output(decision: str, **fields: Any) -> dict[str, Any]:
    return {
        "hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": decision,
            **fields,
        },
    }


def _allow(updated_input: dict[str, Any]) -> dict[str, Any]:
    return _output("allow", updatedInput=updated_input)


def _deny(reason: str) -> dict[str, Any]:
    return _output("deny", permissionDecisionReason=reason)


def rewrite_payload(payload: dict[str, Any]) -> dict[str, Any] | None:
    if payload.get("tool_name") != "Bash":
        return None

    tool_input = payload.get("tool_input")
    if not isinstance(tool_input, dict):
        return None

    command = tool_input.get("command")
    if not isinstance(command, str) or not command.strip():
        return None

    command_match = classify_command(command, TARGET_TOKENS)
    if command_match is CommandMatch.MALFORMED_TARGET:
        return _deny(INVALID_COMMAND_MESSAGE)
    if command_match is CommandMatch.NON_TARGET:
        return None

    session_id = payload.get("session_id")
    if not isinstance(session_id, str) or not session_id.strip():
        return _deny(MISSING_SESSION_MESSAGE)

    transcript_path = payload.get("transcript_path")
    if not isinstance(transcript_path, str) or not transcript_path.strip():
        return _deny(MISSING_TRANSCRIPT_MESSAGE)

    rewritten_command = rewrite_command(
        command,
        (
            ("ACE_CODEX_SESSION_ID", session_id.strip()),
            ("ACE_CODEX_TRANSCRIPT_PATH", transcript_path.strip()),
        ),
    )
    return _allow(
        {
            **tool_input,
            "command": rewritten_command,
        },
    )


def main() -> int:
    try:
        raw = sys.stdin.read()
        payload = json.loads(raw)
        if not isinstance(payload, dict):
            raise ValueError("hook payload must be a JSON object")
        result = rewrite_payload(payload)
    except Exception:
        return 0

    if result is not None:
        json.dump(result, sys.stdout, ensure_ascii=False)
        sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
