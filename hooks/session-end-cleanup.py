#!/usr/bin/env python3
"""ACE SessionEnd hook — 清理 session 级状态。

失败计数（.session_failures.json）之前在 Stop（每轮回复结束）时被删除，
导致跨轮累计永远归零、repeated_failures 触发器形同虚设；现在移到
SessionEnd（会话真正结束时）删除。

注意：该文件按 entity 分键、被并发 session 共享——先结束的 session 会
清掉其他 session 的记录。这是既有取舍（单用户场景影响很小），比每轮
清零好得多。

同时清理本 session 的 ACE Doctor 去重状态，并修剪 7 天前的历史残留。
"""
from __future__ import annotations

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _ace_doctor import (  # noqa: E402
    clear_session_state,
    prune_stale_sessions,
    session_failures_file,
)


def main() -> None:
    try:
        data = json.load(sys.stdin)
    except (json.JSONDecodeError, EOFError):
        data = {}

    failures = session_failures_file()
    try:
        failures.unlink(missing_ok=True)
    except OSError:
        pass

    session_id = data.get("session_id") or ""
    if session_id:
        clear_session_state(session_id)
    prune_stale_sessions(days=7)
    sys.exit(0)


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"[ACE Doctor] session-end-cleanup error (non-blocking): {e}", file=sys.stderr)
        sys.exit(0)
