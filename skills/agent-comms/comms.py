#!/usr/bin/env python3
"""Agent communication helper for Claude Code cross-terminal coordination."""
import json
import sys
import time
from pathlib import Path
from datetime import datetime, timezone
from typing import List

STALE_SECONDS = 300  # 5 minutes


def _comms_dir() -> Path:
    return Path.cwd() / ".agent-comms"


def _read(path: Path):
    try:
        return json.loads(path.read_text())
    except Exception:
        return [] if "messages" in path.name else {}


def _write(path: Path, data):
    tmp = path.with_suffix(".tmp")
    tmp.write_text(json.dumps(data, indent=2))
    tmp.replace(path)


def _now_ts() -> str:
    return datetime.now(timezone.utc).isoformat()


def _now_epoch() -> float:
    return time.time()


def _bootstrap():
    d = _comms_dir()
    d.mkdir(exist_ok=True)
    for name, default in [
        ("registry.json", {}),
        ("announcements.json", {}),
        ("messages.json", []),
    ]:
        f = d / name
        if not f.exists():
            _write(f, default)
    # Add .agent-comms/ to .gitignore
    gitignore = Path.cwd() / ".gitignore"
    entry = ".agent-comms/\n"
    if gitignore.exists():
        content = gitignore.read_text()
        if ".agent-comms/" not in content:
            gitignore.write_text(content.rstrip("\n") + "\n" + entry)
    else:
        gitignore.write_text(entry)


def _clean_stale():
    d = _comms_dir()
    if not d.exists():
        return
    registry = _read(d / "registry.json")
    stale = [
        aid for aid, info in registry.items()
        if (_now_epoch() - info.get("last_seen", 0)) > STALE_SECONDS
    ]
    if stale:
        for aid in stale:
            registry.pop(aid, None)
        _write(d / "registry.json", registry)
        announcements = _read(d / "announcements.json")
        for aid in stale:
            announcements.pop(aid, None)
        _write(d / "announcements.json", announcements)


def cmd_register(agent_id: str, task: str):
    _bootstrap()
    _clean_stale()
    d = _comms_dir()
    registry = _read(d / "registry.json")
    registry[agent_id] = {
        "task": task,
        "started_at": _now_ts(),
        "last_seen": _now_epoch(),
    }
    _write(d / "registry.json", registry)
    print(f"[agent-comms] Registered '{agent_id}' — task: {task}")


def cmd_deregister(agent_id: str):
    d = _comms_dir()
    registry = _read(d / "registry.json")
    registry.pop(agent_id, None)
    _write(d / "registry.json", registry)
    announcements = _read(d / "announcements.json")
    announcements.pop(agent_id, None)
    _write(d / "announcements.json", announcements)
    print(f"[agent-comms] Deregistered '{agent_id}'")


def cmd_heartbeat(agent_id: str):
    d = _comms_dir()
    registry = _read(d / "registry.json")
    if agent_id in registry:
        registry[agent_id]["last_seen"] = _now_epoch()
        _write(d / "registry.json", registry)
        print(f"[agent-comms] Heartbeat: '{agent_id}'")
    else:
        print(f"[agent-comms] WARNING: '{agent_id}' not in registry")


def cmd_announce(agent_id: str, file_reason_pairs: List[str]):
    _clean_stale()
    d = _comms_dir()
    files = {}
    for pair in file_reason_pairs:
        idx = pair.index("|")  # split on FIRST pipe only
        path = pair[:idx]
        reason = pair[idx + 1:]
        files[path] = reason
    announcements = _read(d / "announcements.json")
    announcements[agent_id] = {
        "files": files,
        "announced_at": _now_ts(),
    }
    _write(d / "announcements.json", announcements)
    print(f"[agent-comms] Announced {len(files)} file(s) for '{agent_id}'")


def cmd_check_conflicts(agent_id: str):
    _clean_stale()
    d = _comms_dir()
    announcements = _read(d / "announcements.json")
    my_files = set(announcements.get(agent_id, {}).get("files", {}).keys())
    conflicts = []
    for other_id, info in announcements.items():
        if other_id == agent_id:
            continue
        overlap = my_files & set(info.get("files", {}).keys())
        for f in overlap:
            conflicts.append((other_id, f, info["files"][f]))
    if not conflicts:
        print("CLEAR")
    else:
        for other_id, f, reason in conflicts:
            print(f"CONFLICT: {other_id} also needs {f} — their reason: {reason}")


def cmd_send(from_agent: str, to_agent: str, message: str):
    d = _comms_dir()
    messages = _read(d / "messages.json")
    if not isinstance(messages, list):
        messages = []
    messages.append({
        "id": str(int(_now_epoch() * 1000)),
        "from": from_agent,
        "to": to_agent,
        "message": message,
        "sent_at": _now_ts(),
        "read": False,
    })
    _write(d / "messages.json", messages)
    print(f"[agent-comms] Sent from '{from_agent}' to '{to_agent}'")


def cmd_read_messages(agent_id: str):
    d = _comms_dir()
    messages = _read(d / "messages.json")
    if not isinstance(messages, list):
        messages = []
    unread = [m for m in messages if m.get("to") == agent_id and not m.get("read")]
    if not unread:
        print(f"[agent-comms] No new messages for '{agent_id}'")
        return
    for m in unread:
        print(f"  FROM [{m['from']}] @ {m['sent_at']}: {m['message']}")
        m["read"] = True
    _write(d / "messages.json", messages)


def cmd_status():
    _clean_stale()
    d = _comms_dir()
    if not d.exists():
        print("[agent-comms] No active session (.agent-comms/ not found)")
        return
    registry = _read(d / "registry.json")
    announcements = _read(d / "announcements.json")
    messages = _read(d / "messages.json")
    unread = sum(1 for m in messages if not m.get("read")) if isinstance(messages, list) else 0
    print(f"[agent-comms] Active agents: {len(registry)} | Unread messages: {unread}")
    for aid, info in registry.items():
        files = list(announcements.get(aid, {}).get("files", {}).keys())
        print(f"  [{aid}] {info['task']}")
        if files:
            print(f"    planned files: {', '.join(files)}")


def cmd_done(agent_id: str, modified_files: List[str]):
    d = _comms_dir()
    registry = _read(d / "registry.json")
    others = [aid for aid in registry if aid != agent_id]
    messages = _read(d / "messages.json")
    if not isinstance(messages, list):
        messages = []
    file_list = ", ".join(modified_files) if modified_files else "none"
    for other in others:
        messages.append({
            "id": str(int(_now_epoch() * 1000)) + f"-{other}",
            "from": agent_id,
            "to": other,
            "message": f"[DONE] {agent_id} finished. Modified: {file_list}",
            "sent_at": _now_ts(),
            "read": False,
        })
    _write(d / "messages.json", messages)
    registry.pop(agent_id, None)
    _write(d / "registry.json", registry)
    announcements = _read(d / "announcements.json")
    announcements.pop(agent_id, None)
    _write(d / "announcements.json", announcements)
    print(f"[agent-comms] '{agent_id}' done. Broadcast sent to {len(others)} agent(s).")


def main():
    if len(sys.argv) < 2:
        print("Usage: comms.py <command> [args...]")
        print("Commands: register, deregister, heartbeat, announce, check-conflicts,")
        print("          send, read-messages, status, done")
        sys.exit(1)
    cmd = sys.argv[1]
    args = sys.argv[2:]

    if cmd == "register" and len(args) >= 2:
        cmd_register(args[0], " ".join(args[1:]))
    elif cmd == "deregister" and len(args) >= 1:
        cmd_deregister(args[0])
    elif cmd == "heartbeat" and len(args) >= 1:
        cmd_heartbeat(args[0])
    elif cmd == "announce" and len(args) >= 2:
        cmd_announce(args[0], args[1:])
    elif cmd == "check-conflicts" and len(args) >= 1:
        cmd_check_conflicts(args[0])
    elif cmd == "send" and len(args) >= 3:
        cmd_send(args[0], args[1], " ".join(args[2:]))
    elif cmd == "read-messages" and len(args) >= 1:
        cmd_read_messages(args[0])
    elif cmd == "status":
        cmd_status()
    elif cmd == "done" and len(args) >= 1:
        cmd_done(args[0], args[1:])
    else:
        print(f"[agent-comms] Unknown command or missing args: {cmd}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
