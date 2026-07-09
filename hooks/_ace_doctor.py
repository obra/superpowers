#!/usr/bin/env python3
"""ACE Doctor — shared helpers for traceback-suggestion hooks.

"ACE Doctor" 是面向用户的诊断/上报助手品牌名。所有触发点共享本模块：
- detect-frustration.py（UserPromptSubmit：--fast 同步短路 + async LLM 判定）
- post-tool-trace.py（PostToolUseFailure：连续失败、工作流执行失败）
- stop-doctor.py（Stop：会话收尾分析）
- session-end-cleanup.py（SessionEnd：清理 session 级状态）

共享内容：
- 每 session 去重状态与连续失败计数（~/.ace/.traceback_suggest_state.json）
- 统一的用户提示（systemMessage）与 Claude 指令（additionalContext / wake）文案

本模块不依赖 CLAUDE_PROJECT_DIR/ACE_ROOT，直接解析 ~/.ace（ACE_USER_DIR 可覆盖）。
"""
from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable

DOCTOR_PREFIX = "🩺 [ACE Doctor]"

# judge 冷却时间戳在 state 文件里的保留键（下划线开头，不会与 trigger 名冲突）
JUDGED_AT_KEY = "_judged_at"
# 连续工具失败计数（int，同上为保留键）
CONSECUTIVE_KEY = "_consecutive_failures"

VALID_TRIGGERS = {
    "frustration",
    "repeated_failures",
    "consecutive_failures",
    "workflow_failure",
    "long_session",
    "session_end",
}

_TRIGGER_LABELS = {
    "frustration": "你可能遇到了困扰",
    "repeated_failures": "工具反复失败",
    "consecutive_failures": "工具连续失败",
    "workflow_failure": "工作流执行失败",
    "long_session": "会话异常漫长",
    "session_end": "本次会话多次失败",
}

_DEFAULT_FAILURE_THRESHOLD = 3
_DEFAULT_CONSECUTIVE_THRESHOLD = 5


def ace_home() -> Path:
    raw = os.environ.get("ACE_USER_DIR", "").strip()
    return Path(os.path.expanduser(raw)) if raw else Path.home() / ".ace"


def suggest_state_file() -> Path:
    return ace_home() / ".traceback_suggest_state.json"


def session_failures_file() -> Path:
    return ace_home() / ".session_failures.json"


def doctor_config() -> dict[str, Any]:
    """读取 ~/.ace/config.json 的 doctor 段（frustration 段作为向后兼容来源）。"""
    cfg: dict[str, Any] = {}
    try:
        data = json.loads((ace_home() / "config.json").read_text(encoding="utf-8"))
        if isinstance(data, dict):
            legacy = data.get("frustration")
            if isinstance(legacy, dict):
                cfg.update(legacy)
            current = data.get("doctor")
            if isinstance(current, dict):
                cfg.update(current)
    except (OSError, json.JSONDecodeError):
        pass
    cfg.setdefault("failure_threshold", _DEFAULT_FAILURE_THRESHOLD)
    cfg.setdefault("consecutive_failure_threshold", _DEFAULT_CONSECUTIVE_THRESHOLD)
    return cfg


# ── Session state (per-session dedup + counters) ──────────────────────

def _lock(fd: int) -> None:
    try:
        import fcntl

        fcntl.flock(fd, fcntl.LOCK_EX)
    except Exception:
        pass


def _unlock(fd: int) -> None:
    try:
        import fcntl

        fcntl.flock(fd, fcntl.LOCK_UN)
    except Exception:
        pass


def read_session_state(session_id: str) -> dict[str, Any]:
    """读取本 session 的提示/判定状态（无锁快照）。"""
    try:
        state = json.loads(suggest_state_file().read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}
    if not isinstance(state, dict):
        return {}
    session_state = state.get(session_id, {})
    return session_state if isinstance(session_state, dict) else {}


def _update_state(mutate: Callable[[dict[str, Any]], Any]) -> Any:
    """带文件锁地读-改-写整个 state 文件，返回 mutate 的返回值。"""
    path = suggest_state_file()
    path.parent.mkdir(parents=True, exist_ok=True)
    try:
        fd = os.open(str(path), os.O_RDWR | os.O_CREAT)
    except OSError:
        return None
    try:
        _lock(fd)
        try:
            state = json.loads(os.read(fd, 1024 * 1024).decode("utf-8", errors="replace"))
        except (OSError, json.JSONDecodeError, ValueError):
            state = {}
        if not isinstance(state, dict):
            state = {}
        result = mutate(state)
        payload = json.dumps(state, indent=2, ensure_ascii=False)
        os.lseek(fd, 0, os.SEEK_SET)
        os.ftruncate(fd, 0)
        os.write(fd, payload.encode("utf-8"))
        os.fsync(fd)
        return result
    finally:
        _unlock(fd)
        try:
            os.close(fd)
        except OSError:
            pass


def _session_slot(state: dict[str, Any], session_id: str) -> dict[str, Any]:
    slot = state.setdefault(session_id, {})
    if not isinstance(slot, dict):
        slot = {}
        state[session_id] = slot
    return slot


def record_session_key(session_id: str, key: str) -> None:
    """记录本 session 的一个状态键（trigger 或 _judged_at），值为当前时间戳。"""

    def mutate(state: dict[str, Any]) -> None:
        _session_slot(state, session_id)[key] = datetime.now(tz=timezone.utc).isoformat()

    _update_state(mutate)


def bump_consecutive_failures(session_id: str, failed: bool) -> int:
    """失败则连续计数 +1，成功则清零。返回更新后的计数。"""

    def mutate(state: dict[str, Any]) -> int:
        slot = _session_slot(state, session_id)
        count = slot.get(CONSECUTIVE_KEY, 0) if failed else 0
        if not isinstance(count, int):
            count = 0
        if failed:
            count += 1
        slot[CONSECUTIVE_KEY] = count
        return count

    result = _update_state(mutate)
    return result if isinstance(result, int) else 0


def clear_session_state(session_id: str) -> None:
    """SessionEnd 清理：移除本 session 的状态槽。"""

    def mutate(state: dict[str, Any]) -> None:
        state.pop(session_id, None)

    _update_state(mutate)


def prune_stale_sessions(days: int = 7) -> None:
    """修剪历史 session 残留（最新时间戳早于 cutoff 的状态槽）。"""
    cutoff = datetime.now(tz=timezone.utc).timestamp() - days * 86400

    def mutate(state: dict[str, Any]) -> None:
        for sid in list(state.keys()):
            slot = state.get(sid)
            if not isinstance(slot, dict):
                state.pop(sid, None)
                continue
            newest = 0.0
            for value in slot.values():
                if isinstance(value, str):
                    try:
                        newest = max(newest, datetime.fromisoformat(value).timestamp())
                    except ValueError:
                        pass
            if newest and newest < cutoff:
                state.pop(sid, None)

    _update_state(mutate)


def within_cooldown(session_state: dict[str, Any], cooldown_seconds: int) -> bool:
    raw = session_state.get(JUDGED_AT_KEY)
    if not isinstance(raw, str):
        return False
    try:
        judged_at = datetime.fromisoformat(raw)
    except ValueError:
        return False
    elapsed = (datetime.now(tz=timezone.utc) - judged_at).total_seconds()
    return 0 <= elapsed < cooldown_seconds


def total_session_failures() -> int:
    """统计 .session_failures.json 中的失败记录总数（entity → [records]）。"""
    try:
        data = json.loads(session_failures_file().read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return 0
    if not isinstance(data, dict):
        return 0
    return sum(
        len(v)
        for k, v in data.items()
        if isinstance(v, list) and not str(k).startswith("_")
    )


# ── Messages ───────────────────────────────────────────────────────────

_OPTIONS_TEXT = "可运行 /ace:doctor 做纯本地诊断，或 /ace:traceback 上报脱敏后的 session 日志给 ACE 团队。"


def user_hint(trigger: str, detail: str) -> str:
    """systemMessage：直接显示给用户的一行提示。"""
    label = _TRIGGER_LABELS.get(trigger, trigger)
    detail_part = f"（{detail}）" if detail else ""
    return f"{DOCTOR_PREFIX} 检测到{label}{detail_part}。{_OPTIONS_TEXT}"


def claude_context(trigger: str, detail: str) -> str:
    """additionalContext：告知 Claude 用户已看到提示，如何跟进。"""
    return (
        f"[ACE Doctor] 已向用户展示提示：检测到 {trigger}（{detail}）。"
        "如果用户对诊断或上报表现出兴趣，用以 「🩺 [ACE Doctor]」 开头的一段话说明两个选项："
        "1) /ace:doctor 纯本地诊断；2) /ace:traceback 上报脱敏日志。"
        "说明上报前会先预览和脱敏。不要替用户做决定；用户未回应时不要反复提起。"
    )


def wake_message(session_id: str, trigger: str, reason: str, failure_count: int) -> str:
    """asyncRewake 唤醒消息：要求 Claude 用固定署名向用户转述。"""
    return (
        f"[ACE Doctor] 后台判定：当前 session（{session_id[:8]}）可能存在困扰"
        f"（trigger={trigger}，依据：{reason}，失败计数：{failure_count}）。"
        "请在下一次回复的开头，用单独一行以 「🩺 [ACE Doctor]」 开头，"
        "告知用户后台诊断发现了上述情况，并提供两个选项："
        "1) 运行 /ace:doctor 做纯本地诊断；"
        "2) 运行 /ace:traceback 把脱敏后的 session 上下文上报给 ACE 团队。"
        "说明隐私和上报流程，不要替用户做决定。"
    )
