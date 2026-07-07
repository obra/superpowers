#!/usr/bin/env python3
"""ACE SessionStart hook — pull inbox and notify about unread messages.

挂 SessionStart(startup)，不依赖 CLAUDE_PROJECT_DIR/ACE_ROOT：
- 尝试运行 `ace inbox pull --quiet --min-interval 600`
- 然后读取 ~/.ace/inbox/messages.jsonl 和 state.json
- 有未读则输出 systemMessage + additionalContext
- 任何失败静默，绝不阻塞 session 启动
"""
from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

_ACE_HOME = Path.home() / ".ace"
_MESSAGES_FILE = _ACE_HOME / "inbox" / "messages.jsonl"
_STATE_FILE = _ACE_HOME / "inbox" / "state.json"
_DEFAULT_MIN_INTERVAL = 600


def _find_ace_binary() -> str | None:
    """在 PATH 或 ~/.ace/bin/ace 中查找 ace CLI。"""
    ace = shutil.which("ace")
    if ace:
        return ace
    fallback = _ACE_HOME / "bin" / "ace"
    if fallback.is_file():
        return str(fallback)
    return None


def _run_pull() -> bool:
    """运行 ace inbox pull --quiet --min-interval 600，4s 超时。"""
    ace = _find_ace_binary()
    if not ace:
        return False
    try:
        result = subprocess.run(
            [ace, "inbox", "pull", "--quiet", "--min-interval", str(_DEFAULT_MIN_INTERVAL)],
            capture_output=True,
            text=True,
            timeout=4,
        )
        return result.returncode == 0
    except (subprocess.TimeoutExpired, OSError):
        return False


def _read_jsonl(path: Path) -> list[dict[str, Any]]:
    """读取 messages.jsonl。"""
    if not path.is_file():
        return []
    messages: list[dict[str, Any]] = []
    try:
        with path.open(encoding="utf-8", errors="replace") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    obj = json.loads(line)
                    if isinstance(obj, dict):
                        messages.append(obj)
                except json.JSONDecodeError:
                    continue
    except OSError:
        pass
    return messages


def _read_state() -> dict[str, Any]:
    try:
        data = json.loads(_STATE_FILE.read_text(encoding="utf-8"))
        if isinstance(data, dict):
            return data
    except (OSError, json.JSONDecodeError):
        pass
    return {}


def _unread_messages() -> list[dict[str, Any]]:
    messages = _read_jsonl(_MESSAGES_FILE)
    state = _read_state()
    read_ids = set(state.get("read_ids", [])) if isinstance(state.get("read_ids"), list) else set()
    unread = [m for m in messages if m.get("id") not in read_ids]
    unread.sort(key=lambda m: m.get("created_at", ""), reverse=True)
    return unread


def _format_time(iso: str | None) -> str:
    if not iso:
        return ""
    try:
        dt = datetime.fromisoformat(iso)
        return dt.astimezone(timezone.utc).strftime("%Y-%m-%d %H:%M")
    except ValueError:
        return iso


def main() -> None:
    try:
        data = json.load(sys.stdin)
    except (json.JSONDecodeError, EOFError):
        data = {}

    source = data.get("source", "")
    # 只在全新 session startup 触发，避免 resume 时重复打扰
    if source not in ("startup", ""):
        sys.exit(0)

    # best-effort pull
    _run_pull()

    unread = _unread_messages()
    if not unread:
        sys.exit(0)

    count = len(unread)
    system_message = f"[ACE] 你有 {count} 条售后进展消息，运行 `ace inbox` 查看。"

    lines = [f"未读售后消息（{count} 条）："]
    for m in unread[:5]:
        title = m.get("title", "")
        level = m.get("level", "info")
        created = _format_time(m.get("created_at"))
        body = (m.get("body") or "")[:120]
        lines.append(f"- [{level}] {created} {title}\n  {body}")
    if count > 5:
        lines.append(f"... 还有 {count - 5} 条")

    additional_context = "\n".join(lines)

    print(
        json.dumps(
            {
                "systemMessage": system_message,
                "additionalContext": additional_context,
            },
            ensure_ascii=False,
        )
    )
    sys.exit(0)


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"[ACE] inbox-notify error (non-blocking): {e}", file=sys.stderr)
        sys.exit(0)
