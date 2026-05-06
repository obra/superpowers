"""Normalizes backend-specific session logs to a common tool call schema."""

from __future__ import annotations

import json
from collections.abc import Callable
from pathlib import Path
from typing import Any

NATIVE_TOOLS: set[str] = {
    "EnterWorktree",
    "ExitWorktree",
    "EnterPlanMode",
    "ExitPlanMode",
    "TaskCreate",
    "TaskUpdate",
    "TaskList",
    "TaskGet",
    "Skill",
    "Agent",
    "Read",
    "Write",
    "Edit",
    "Glob",
    "Grep",
}

LOG_EXTENSIONS: tuple[str, ...] = ("*.jsonl", "*.json")


def snapshot_log_dir(log_dir: Path) -> set[str]:
    """Snapshot all session log files in a log directory (recursive)."""
    if not log_dir.exists():
        return set()
    files: set[str] = set()
    for ext in LOG_EXTENSIONS:
        files.update(str(f.relative_to(log_dir)) for f in log_dir.rglob(ext))
    return files


def collect_new_logs(log_dir: Path, snapshot: set[str]) -> list[Path]:
    """Find session log files created after the snapshot (recursive)."""
    if not log_dir.exists():
        return []
    current: dict[str, Path] = {}
    for ext in LOG_EXTENSIONS:
        current.update({str(f.relative_to(log_dir)): f for f in log_dir.rglob(ext)})
    new_keys: set[str] = set(current.keys()) - snapshot
    return [current[k] for k in sorted(new_keys)]


def filter_codex_logs_by_cwd(paths: list[Path], target_cwd: str) -> list[Path]:
    """Drop codex rollouts whose session_meta.cwd doesn't match target_cwd.

    Codex stores all sessions under a shared ~/.codex/sessions/ tree, so when
    multiple drill scenarios run in parallel each one's snapshot diff sees every
    other run's rollouts. Each rollout's first line is a `session_meta` event
    that records the cwd the codex CLI was launched in — use it to attribute
    rollouts to the run that produced them.
    """
    matched: list[Path] = []
    for path in paths:
        try:
            with path.open() as f:
                first_line = f.readline()
            entry = json.loads(first_line)
        except (OSError, json.JSONDecodeError):
            continue
        if entry.get("type") != "session_meta":
            continue
        cwd = entry.get("payload", {}).get("cwd", "")
        if cwd == target_cwd:
            matched.append(path)
    return matched


def normalize_claude_logs(raw_content: str) -> list[dict[str, Any]]:
    """Normalize Claude Code session logs.

    CC logs are JSONL where assistant messages have:
    {"type": "assistant", "message": {"content": [{"type": "tool_use", "name": "...",
    "input": {...}}]}}
    """
    results: list[dict[str, Any]] = []
    for line in raw_content.strip().split("\n"):
        if not line.strip():
            continue
        try:
            entry = json.loads(line)
        except json.JSONDecodeError:
            continue
        # Handle nested CC format: assistant messages contain tool_use in content array
        if entry.get("type") == "assistant":
            message = entry.get("message", {})
            for block in message.get("content", []):
                if block.get("type") == "tool_use":
                    tool_name = block.get("name", "")
                    source = "native" if tool_name in NATIVE_TOOLS else "shell"
                    results.append(
                        {"tool": tool_name, "args": block.get("input", {}), "source": source}
                    )
        # Also handle flat format (for test compatibility)
        elif entry.get("type") == "tool_use":
            tool_name = entry.get("name", "")
            source = "native" if tool_name in NATIVE_TOOLS else "shell"
            results.append({"tool": tool_name, "args": entry.get("input", {}), "source": source})
    return results


def normalize_codex_logs(raw_content: str) -> list[dict[str, Any]]:
    """Normalize Codex rollout logs.

    Codex logs use: {"type": "response_item", "payload": {"type": "function_call", ...}}
    Tool calls are "function_call" with name "exec_command" (shell) or other names.
    """
    results: list[dict[str, Any]] = []
    for line in raw_content.strip().split("\n"):
        if not line.strip():
            continue
        try:
            entry = json.loads(line)
        except json.JSONDecodeError:
            continue
        if entry.get("type") != "response_item":
            continue
        # Codex uses "payload" not "item"
        payload = entry.get("payload", entry.get("item", {}))
        payload_type = payload.get("type", "")
        if payload_type == "function_call":
            name = payload.get("name", "")
            raw_args = payload.get("arguments", "{}")
            # Arguments are JSON-encoded strings in codex
            if isinstance(raw_args, str):
                try:
                    args = json.loads(raw_args)
                except json.JSONDecodeError:
                    args = {"raw": raw_args}
            else:
                args = raw_args
            # exec_command is codex's shell tool
            if name == "exec_command":
                results.append(
                    {"tool": "Bash", "args": {"command": args.get("cmd", "")}, "source": "shell"}
                )
            elif name == "apply_patch":
                results.append({"tool": "Edit", "args": args, "source": "native"})
            else:
                source = "native" if name in NATIVE_TOOLS else "shell"
                results.append({"tool": name, "args": args, "source": source})
        elif payload_type == "local_shell_call":
            action = payload.get("action", {})
            cmd = action.get("command", [])
            cmd_str = " ".join(cmd) if isinstance(cmd, list) else str(cmd)
            results.append({"tool": "Bash", "args": {"command": cmd_str}, "source": "shell"})
    return results


# Reverse mapping: Gemini tool names → Claude Code canonical names
GEMINI_TOOL_MAP: dict[str, str] = {
    "run_shell_command": "Bash",
    "read_file": "Read",
    "write_file": "Write",
    "replace": "Edit",
    "grep_search": "Grep",
    "glob": "Glob",
    "activate_skill": "Skill",
    "google_web_search": "WebSearch",
    "web_fetch": "WebFetch",
    "write_todos": "TodoWrite",
    "list_directory": "Glob",
    "enter_plan_mode": "EnterPlanMode",
    "exit_plan_mode": "ExitPlanMode",
}


def normalize_gemini_logs(raw_content: str) -> list[dict[str, Any]]:
    """Normalize Gemini CLI session logs.

    Gemini logs may be a single JSON file with a messages array, or JSONL
    session files in newer CLI versions. Each "gemini" message may have a
    toolCalls array:
    {"name": "run_shell_command", "args": {"command": "..."}, "status": "success"}
    """
    results: list[dict[str, Any]] = []
    messages: list[dict[str, Any]] = []
    try:
        data = json.loads(raw_content)
    except json.JSONDecodeError:
        for line in raw_content.strip().split("\n"):
            if not line.strip():
                continue
            try:
                entry = json.loads(line)
            except json.JSONDecodeError:
                continue
            if isinstance(entry, dict):
                messages.append(entry)
    else:
        if isinstance(data, dict) and "messages" in data:
            messages = [m for m in data.get("messages", []) if isinstance(m, dict)]
        elif isinstance(data, dict):
            messages = [data]
        elif isinstance(data, list):
            messages = [m for m in data if isinstance(m, dict)]

    seen_tool_calls: set[str] = set()
    for message in messages:
        if message.get("type") != "gemini":
            continue
        for tc in message.get("toolCalls", []):
            tool_call_id = tc.get("id")
            if tool_call_id and tool_call_id in seen_tool_calls:
                continue
            if tool_call_id:
                seen_tool_calls.add(tool_call_id)
            gemini_name = tc.get("name", "")
            canonical = GEMINI_TOOL_MAP.get(gemini_name, gemini_name)
            args = tc.get("args", {})
            source = "native" if canonical in NATIVE_TOOLS else "shell"
            results.append({"tool": canonical, "args": args, "source": source})
    return results


NORMALIZERS: dict[str, Callable[[str], list[dict[str, Any]]]] = {
    "claude": normalize_claude_logs,
    "codex": normalize_codex_logs,
    "gemini": normalize_gemini_logs,
}
