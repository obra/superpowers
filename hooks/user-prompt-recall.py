#!/usr/bin/env python3
"""ACE Per-turn Experience Recall — UserPromptSubmit hook.

Before each user message, query gbrain for experience hits relevant to the
current prompt and inject them via ``additionalContext`` (mem0-style retrieve).
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _ace_config import (  # noqa: E402
    ACE_ROOT,
    PROJECT_DIR,
    ensure_ace_importable,
    load_recall_state,
    log_hook_error,
    save_recall_state,
)


def _reexec_into_ace_venv() -> None:
    """Re-exec with the framework venv python before touching stdin.

    Prefer env/config ``ACE_ROOT``, then a Claude project that is itself an
    ACE checkout. No-op when already re-exec'd or when no venv exists.
    """
    if os.environ.get("_ACE_HOOK_REEXEC"):
        return
    for root in (ACE_ROOT, PROJECT_DIR):
        if not root:
            continue
        venv_py = Path(root) / ".venv" / "bin" / "python3"
        if not venv_py.is_file():
            continue
        os.environ["_ACE_HOOK_REEXEC"] = "1"
        try:
            os.execv(str(venv_py), [str(venv_py), os.path.abspath(__file__), *sys.argv[1:]])
        except OSError:
            return  # fall through: best-effort with the current interpreter


_reexec_into_ace_venv()

if ACE_ROOT:
    sys.path.insert(0, ACE_ROOT)

RECALL_STATE_NAME = "recall_state.json"
WORK_DIR_STATE_NAME = ".ace_recall_state.json"


def _truthy(name: str, *, default: bool = True) -> bool:
    raw = os.environ.get(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def _load_recall_state(cwd: str) -> dict:
    """Load slug dedup + pending application state.

    Prefers project ``.ace/recall_state.json`` (shared with stop-reflect).
    Falls back to Claude Code workdir state files when present.
    """
    if cwd:
        state = load_recall_state(cwd)
        path = Path(cwd) / ".ace" / RECALL_STATE_NAME
        if path.is_file():
            return state
    ace_home = os.environ.get("ACE_USER_DIR", "").strip()
    base = Path(os.path.expanduser(ace_home)) if ace_home else Path.home() / ".ace"
    claude_root = base / "claude_code"
    if claude_root.is_dir():
        for path in claude_root.rglob(WORK_DIR_STATE_NAME):
            try:
                if path.is_file():
                    data = json.loads(path.read_text(encoding="utf-8"))
                    return {
                        "startup_slugs": list(data.get("startup_slugs") or []),
                        "turn_slugs": list(data.get("turn_slugs") or []),
                        "pending_applications": list(
                            data.get("pending_applications") or []
                        ),
                    }
            except (json.JSONDecodeError, OSError):
                continue
    return {"startup_slugs": [], "turn_slugs": [], "pending_applications": []}


def _save_recall_state(cwd: str, state: dict) -> None:
    """Best-effort persist turn slugs + pending applications for stop-reflect."""
    if not cwd:
        return
    if not save_recall_state(cwd, state):
        log_hook_error(
            "user-prompt-recall/save_state",
            OSError(f"failed to write recall state under {cwd}"),
        )


def _seen_slugs(state: dict) -> set[str]:
    startup = state.get("startup_slugs") or []
    turns = state.get("turn_slugs") or []
    return {s for s in (*startup, *turns) if isinstance(s, str) and s}


def _entry_id_from_slug(slug: str) -> str:
    """Strip ``experience/`` prefix so ExperienceService.get can resolve the id."""
    s = (slug or "").strip()
    if s.startswith("experience/"):
        return s[len("experience/") :]
    return s


def _turn_top_k() -> int:
    raw = os.environ.get("ACE_TURN_RECALL_TOP_K", "").strip()
    if not raw:
        return 3
    try:
        return max(0, int(raw))
    except ValueError:
        return 3


def main() -> None:
    if not _truthy("ACE_TURN_RECALL", default=True):
        sys.exit(0)

    try:
        data = json.load(sys.stdin)
    except (json.JSONDecodeError, EOFError):
        sys.exit(0)

    prompt = (data.get("prompt") or "").strip()
    # 超短输入（如 "ok"、"继续"）与斜杠命令没有语义召回价值
    if len(prompt) < 6 or prompt.startswith("/"):
        sys.exit(0)

    cwd = (data.get("cwd") or "").strip()
    state = _load_recall_state(cwd)
    exclude = _seen_slugs(state)

    try:
        if not ensure_ace_importable():
            sys.exit(0)
        from ace.core.brain.inject import render_turn_recall

        # gateway 缺省走 inject 的召回专用 gateway：2.5s 硬性总预算 + 60s 熔断。
        # 不要显式传 resolve_gateway()——那是 15s 超时的通用 gateway，gbrain
        # 卡住时会顶满 5s hook 超时，每轮拖慢用户输入。
        block, new_slugs = render_turn_recall(
            user_message=prompt,
            cwd=cwd,
            exclude_slugs=exclude or None,
            top_k=_turn_top_k(),
        )
    except Exception as ex:  # noqa: BLE001 — must never block the session
        log_hook_error("user-prompt-recall/query", ex)
        sys.exit(0)

    if not block:
        sys.exit(0)

    if new_slugs:
        turn_slugs = list(state.get("turn_slugs") or [])
        seen = set(turn_slugs)
        pending = list(state.get("pending_applications") or [])
        pending_seen = set(pending)
        for slug in new_slugs:
            if slug not in seen:
                turn_slugs.append(slug)
                seen.add(slug)
            entry_id = _entry_id_from_slug(slug)
            if entry_id and entry_id not in pending_seen:
                pending.append(entry_id)
                pending_seen.add(entry_id)
        state["turn_slugs"] = turn_slugs
        state["pending_applications"] = pending
        _save_recall_state(cwd, state)

    print(
        json.dumps(
            {
                "hookSpecificOutput": {
                    "hookEventName": "UserPromptSubmit",
                    "additionalContext": block,
                }
            }
        )
    )
    sys.exit(0)


if __name__ == "__main__":
    try:
        main()
    except Exception as ex:
        log_hook_error("user-prompt-recall", ex)
        sys.exit(0)
