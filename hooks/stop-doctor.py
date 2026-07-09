#!/usr/bin/env python3
"""ACE Doctor Stop hook — 会话收尾分析，判断是否建议上报 traceback。

Stop 在每轮回复结束时触发。当会话累计信号达到阈值且尚未提示过时，
输出 systemMessage 给用户一条可见提示（🩺 [ACE Doctor] 署名）。

触发条件（满足其一）：
- 会话累计工具失败数 ≥ failure_threshold（默认 3）
- 连续工具失败计数 ≥ consecutive_failure_threshold（默认 5）

工作流失败在发生当下已由 post-tool-trace.py 即时提示，这里只作为
收尾摘要的补充说明，不单独触发。

去重：每 session 最多提示一次（suggest state 的 session_end 键）。
"""
from __future__ import annotations

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _ace_doctor import (  # noqa: E402
    CONSECUTIVE_KEY,
    doctor_config,
    read_session_state,
    record_session_key,
    total_session_failures,
    user_hint,
)


def build_suggestion(session_id: str) -> str | None:
    """返回收尾提示文本；不满足条件或已提示过则返回 None。"""
    state = read_session_state(session_id)
    if "session_end" in state:
        return None

    cfg = doctor_config()
    total = total_session_failures()
    consecutive = state.get(CONSECUTIVE_KEY, 0)
    if not isinstance(consecutive, int):
        consecutive = 0
    workflow_failed = "workflow_failure" in state

    if (
        total < int(cfg["failure_threshold"])
        and consecutive < int(cfg["consecutive_failure_threshold"])
    ):
        return None

    record_session_key(session_id, "session_end")

    detail_parts = [f"累计 {total} 次工具失败"]
    if consecutive >= 2:
        detail_parts.append(f"最近连续失败 {consecutive} 次")
    if workflow_failed:
        detail_parts.append("包含工作流执行失败")
    return user_hint("session_end", "、".join(detail_parts))


def main() -> None:
    try:
        data = json.load(sys.stdin)
    except (json.JSONDecodeError, EOFError):
        sys.exit(0)

    session_id = data.get("session_id") or ""
    if not session_id:
        sys.exit(0)

    suggestion = build_suggestion(session_id)
    if suggestion:
        print(json.dumps({"systemMessage": suggestion}, ensure_ascii=False))
    sys.exit(0)


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"[ACE Doctor] stop-doctor error (non-blocking): {e}", file=sys.stderr)
        sys.exit(0)
