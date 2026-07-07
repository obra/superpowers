#!/usr/bin/env python3
"""ACE UserPromptSubmit hook — detect frustration and suggest traceback/doctor.

本 hook 不依赖 CLAUDE_PROJECT_DIR/ACE_ROOT，直接解析 ~/.ace 下的用户级状态。
触发信号：
1. 中英沮丧词表命中
2. 当前 session 失败数 >= 3
3. 长会话（transcript 年龄 >2h 或行数 >1500）

防打扰：按 session_id + trigger 每会话每触发器最多提示一次。
"""
from __future__ import annotations

import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

# 用户级 ACE 目录
_ACE_HOME = Path.home() / ".ace"
_SESSION_FAILURES_FILE = _ACE_HOME / ".session_failures.json"
_SUGGEST_STATE_FILE = _ACE_HOME / ".traceback_suggest_state.json"

# 默认中英沮丧词表
_DEFAULT_FRUSTRATION_WORDS = [
    # 中文
    "怎么又",
    "还是不行",
    "又报错",
    "到底为什么",
    "算了",
    "烦死",
    "崩溃",
    "搞不定",
    "救不了",
    "无力",
    "心累",
    # 英文
    "still broken",
    "not working",
    "wtf",
    "what the fuck",
    "give up",
    "gives up",
    "stuck again",
    "doesn't work",
    "not working",
    "broken again",
]

# 默认阈值
_DEFAULT_FAILURE_THRESHOLD = 3
_DEFAULT_SESSION_AGE_HOURS = 2
_DEFAULT_SESSION_LINE_THRESHOLD = 1500


def _load_user_config() -> dict[str, Any]:
    """读取 ~/.ace/config.json 中的覆盖配置。"""
    path = _ACE_HOME / "config.json"
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        if isinstance(data, dict):
            return data
    except (OSError, json.JSONDecodeError):
        pass
    return {}


def _get_config() -> dict[str, Any]:
    """合并默认与 user config 中的 frustration 段。"""
    cfg = _load_user_config().get("frustration", {})
    return {
        "words": cfg.get("words", _DEFAULT_FRUSTRATION_WORDS),
        "failure_threshold": cfg.get("failure_threshold", _DEFAULT_FAILURE_THRESHOLD),
        "session_age_hours": cfg.get("session_age_hours", _DEFAULT_SESSION_AGE_HOURS),
        "session_line_threshold": cfg.get("session_line_threshold", _DEFAULT_SESSION_LINE_THRESHOLD),
    }


def _lock_file(fd: int) -> None:
    try:
        import fcntl

        fcntl.flock(fd, fcntl.LOCK_EX)
    except Exception:
        pass


def _unlock_file(fd: int) -> None:
    try:
        import fcntl

        fcntl.flock(fd, fcntl.LOCK_UN)
    except Exception:
        pass


def _read_suggest_state() -> dict[str, Any]:
    try:
        return json.loads(_SUGGEST_STATE_FILE.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}


def _write_suggest_state(state: dict[str, Any]) -> None:
    _SUGGEST_STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    _SUGGEST_STATE_FILE.write_text(json.dumps(state, indent=2, ensure_ascii=False), encoding="utf-8")


def _already_suggested(session_id: str, trigger: str) -> bool:
    """检查本 session 本 trigger 是否已经提示过（带文件锁）。"""
    if not _SUGGEST_STATE_FILE.exists():
        return False
    try:
        fd = os.open(str(_SUGGEST_STATE_FILE), os.O_RDWR)
    except OSError:
        # 打不开时保守返回 False，允许提示
        return False
    try:
        _lock_file(fd)
        try:
            state = json.loads(os.read(fd, 1024 * 1024).decode("utf-8", errors="replace"))
        except (OSError, json.JSONDecodeError, ValueError):
            state = {}
        if not isinstance(state, dict):
            state = {}
        session_state = state.get(session_id, {})
        return isinstance(session_state, dict) and trigger in session_state
    finally:
        _unlock_file(fd)
        try:
            os.close(fd)
        except OSError:
            pass


def _record_suggested(session_id: str, trigger: str) -> None:
    """记录本 session 本 trigger 已提示（带文件锁）。"""
    _SUGGEST_STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    try:
        fd = os.open(str(_SUGGEST_STATE_FILE), os.O_RDWR | os.O_CREAT)
    except OSError:
        return
    try:
        _lock_file(fd)
        try:
            state = json.loads(os.read(fd, 1024 * 1024).decode("utf-8", errors="replace"))
        except (OSError, json.JSONDecodeError, ValueError):
            state = {}
        if not isinstance(state, dict):
            state = {}
        session_state = state.setdefault(session_id, {})
        if not isinstance(session_state, dict):
            session_state = {}
            state[session_id] = session_state
        session_state[trigger] = datetime.now(tz=timezone.utc).isoformat()
        payload = json.dumps(state, indent=2, ensure_ascii=False)
        os.lseek(fd, 0, os.SEEK_SET)
        os.ftruncate(fd, 0)
        os.write(fd, payload.encode("utf-8"))
        os.fsync(fd)
    finally:
        _unlock_file(fd)
        try:
            os.close(fd)
        except OSError:
            pass


def _detect_frustration_words(prompt: str, words: list[str]) -> bool:
    lowered = prompt.lower()
    for word in words:
        if word.lower() in lowered:
            return True
    # 连续多个感叹号也算信号
    if re.search(r"!{2,}", prompt):
        return True
    return False


def _count_session_failures(session_id: str) -> int:
    try:
        data = json.loads(_SESSION_FAILURES_FILE.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return 0
    if not isinstance(data, dict):
        return 0
    # .session_failures.json 结构为 {session_id: {entity_id: count}} 或 {session_id: count}
    session_data = data.get(session_id, {})
    if isinstance(session_data, int):
        return session_data
    if isinstance(session_data, dict):
        return sum(v for v in session_data.values() if isinstance(v, int))
    return 0


def _transcript_age_hours(transcript_path: Path) -> float:
    try:
        mtime = transcript_path.stat().st_mtime
        return (datetime.now(tz=timezone.utc).timestamp() - mtime) / 3600
    except OSError:
        return 0.0


def _transcript_line_count(transcript_path: Path) -> int:
    try:
        with transcript_path.open(encoding="utf-8", errors="replace") as f:
            return sum(1 for _ in f)
    except OSError:
        return 0


def _detect_long_session(transcript_path: str | None, threshold_hours: int, threshold_lines: int) -> bool:
    if not transcript_path:
        return False
    p = Path(transcript_path).expanduser()
    if not p.is_file():
        return False
    if _transcript_age_hours(p) > threshold_hours:
        return True
    if _transcript_line_count(p) > threshold_lines:
        return True
    return False


def _find_transcript_path(session_id: str) -> Path | None:
    """在 ~/.claude/projects/*/<session_id>.jsonl 中查找 transcript。"""
    projects_dir = Path.home() / ".claude" / "projects"
    if not projects_dir.is_dir():
        return None
    try:
        for project_dir in projects_dir.iterdir():
            candidate = project_dir / f"{session_id}.jsonl"
            if candidate.is_file():
                return candidate
    except OSError:
        pass
    return None


def main() -> None:
    try:
        data = json.load(sys.stdin)
    except (json.JSONDecodeError, EOFError):
        sys.exit(0)

    session_id = data.get("session_id") or ""
    prompt = data.get("prompt") or ""
    transcript_path = data.get("transcript_path") or ""
    if not session_id:
        sys.exit(0)

    cfg = _get_config()

    triggers: list[str] = []

    # 1. 沮丧词
    if prompt and _detect_frustration_words(prompt, cfg["words"]):
        triggers.append("frustration")

    # 2. 失败数
    failure_count = _count_session_failures(session_id)
    if failure_count >= cfg["failure_threshold"]:
        triggers.append("repeated_failures")

    # 3. 长会话
    if _detect_long_session(transcript_path, cfg["session_age_hours"], cfg["session_line_threshold"]):
        triggers.append("long_session")

    # 去重并选择第一个未提示的 trigger
    selected_trigger: str | None = None
    for trigger in triggers:
        if not _already_suggested(session_id, trigger):
            selected_trigger = trigger
            break

    if not selected_trigger:
        sys.exit(0)

    _record_suggested(session_id, selected_trigger)

    system_message = (
        f"[ACE] 检测到当前 session 可能存在困扰（{selected_trigger}）。"
        "需要我帮你做本地诊断（/ace:doctor）或直接上报 traceback（/ace:traceback）吗？"
    )
    additional_context = (
        f"用户当前 session（{session_id[:8]}）触发 '{selected_trigger}'。"
        f"失败计数：{failure_count}。"
        "请温和地提供两个选项："
        "1) 运行 /ace:doctor 做纯本地诊断；"
        "2) 运行 /ace:traceback 把脱敏后的 session 上下文上报给售后团队。"
        "不要替用户做决定，只提供选项并说明隐私和上报流程。"
    )

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
        print(f"[ACE] detect-frustration error (non-blocking): {e}", file=sys.stderr)
        sys.exit(0)
