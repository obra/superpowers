#!/usr/bin/env python3
"""
Real-time monitor for Claude Code integration test sessions.

Watches all *.jsonl session files in a directory and prints timestamped
events as they are written. Useful for observing agent team progress.

Usage:
  # Auto-detect most recent session dir matching test project temp paths:
  python3 tests/claude-code/monitor-session.py

  # Watch a specific session directory:
  python3 tests/claude-code/monitor-session.py ~/.claude/projects/-private-var-folders-...

  # Watch the session dir for a specific test project path:
  python3 tests/claude-code/monitor-session.py /private/var/folders/.../tmp.XYZ
"""

import json
import os
import sys
import time
import glob
from datetime import datetime
from pathlib import Path

# ANSI colors
RESET  = "\033[0m"
BOLD   = "\033[1m"
DIM    = "\033[2m"
RED    = "\033[31m"
GREEN  = "\033[32m"
YELLOW = "\033[33m"
BLUE   = "\033[34m"
CYAN   = "\033[36m"
WHITE  = "\033[37m"

# Color per session file (cycles for multiple agents)
FILE_COLORS = [CYAN, GREEN, YELLOW, BLUE, WHITE]

def ts():
    return datetime.now().strftime("%H:%M:%S")

def fmt_tool(name, inp):
    """Format a tool call to a readable one-liner."""
    if name == "Skill":
        return f"Skill({inp.get('skill', '')})"
    elif name == "TeamCreate":
        return f"TeamCreate(name={inp.get('team_name', '')})"
    elif name == "TeamDelete":
        return "TeamDelete"
    elif name == "TaskCreate":
        return f"TaskCreate: \"{inp.get('subject', '')[:60]}\""
    elif name == "TaskUpdate":
        parts = [f"id={inp.get('taskId','')}"]
        if "status" in inp: parts.append(f"status={inp['status']}")
        if "owner" in inp: parts.append(f"owner={inp['owner']}")
        return f"TaskUpdate({', '.join(parts)})"
    elif name == "TaskList":
        return "TaskList"
    elif name == "TaskGet":
        return f"TaskGet(id={inp.get('taskId','')})"
    elif name == "Agent":
        desc = inp.get("description", inp.get("name", ""))[:60]
        bg = " [background]" if inp.get("run_in_background") else ""
        return f"Agent: \"{desc}\"{bg}"
    elif name == "SendMessage":
        msg_type = inp.get("type", "")
        recipient = inp.get("recipient", "")
        summary = inp.get("summary", "")[:40]
        content_preview = str(inp.get("content", ""))[:40]
        return f"SendMessage({msg_type} → {recipient}: {summary or content_preview})"
    elif name == "TodoWrite":
        todos = inp.get("todos", [])
        if todos:
            counts = {}
            for t in todos:
                s = t.get("status", "?")
                counts[s] = counts.get(s, 0) + 1
            summary = ", ".join(f"{v}x{k}" for k, v in counts.items())
            return f"TodoWrite([{summary}])"
        return "TodoWrite"
    elif name in ("Read", "Write", "Edit", "Glob", "Grep"):
        path = inp.get("file_path", inp.get("pattern", inp.get("path", "")))
        return f"{name}({os.path.basename(str(path)[:50])})"
    elif name == "Bash":
        cmd = inp.get("command", "")[:60]
        return f"Bash({cmd})"
    else:
        # Generic: show first 60 chars of input
        return f"{name}({str(inp)[:60]})"

def fmt_tool_result(result_content, is_error):
    """Format a tool result, highlighting errors."""
    if isinstance(result_content, list):
        texts = [c.get("text", "") for c in result_content if isinstance(c, dict)]
        result_content = " ".join(texts)
    s = str(result_content).strip()
    # Truncate but show beginning
    if len(s) > 120:
        s = s[:120] + "…"
    return s

def find_session_dir(arg=None):
    """Resolve the session directory from argument or auto-detect."""
    claude_projects = Path.home() / ".claude" / "projects"

    if arg:
        # Could be a raw project path or already a session dir
        p = Path(arg)
        if p.exists() and any(p.glob("*.jsonl")):
            return p
        # Treat as project path → convert to session dir name
        canonical = str(p.resolve())
        escaped = canonical.replace("/", "-").replace(".", "-")
        session_dir = claude_projects / escaped
        if session_dir.exists():
            return session_dir
        print(f"Could not find session dir for: {arg}", file=sys.stderr)
        print(f"Tried: {session_dir}", file=sys.stderr)

    # Auto-detect: find the most recently modified session dir that contains
    # a *.jsonl file modified in the last 2 hours
    best = None
    best_mtime = 0
    for d in claude_projects.iterdir():
        if not d.is_dir():
            continue
        for f in d.glob("*.jsonl"):
            mtime = f.stat().st_mtime
            if mtime > best_mtime and (time.time() - mtime) < 7200:
                best_mtime = mtime
                best = d

    return best

def follow_file(path, offset):
    """Read new lines from a file starting at offset. Returns (new_lines, new_offset)."""
    try:
        with open(path, "r", errors="replace") as f:
            f.seek(offset)
            new_lines = f.readlines()
            new_offset = f.tell()
        return new_lines, new_offset
    except (OSError, IOError):
        return [], offset

def short_session_name(path):
    """Return a short display name for a session file."""
    return path.stem[:8]  # first 8 chars of UUID

def process_line(line, color, session_name, show_results):
    """Parse one JSONL line and print formatted output. Returns True if something was printed."""
    line = line.strip()
    if not line:
        return False
    try:
        msg = json.loads(line)
    except json.JSONDecodeError:
        return False

    msg_type = msg.get("type", "")
    printed = False

    if msg_type == "assistant":
        content = msg.get("message", {}).get("content", [])
        for block in content:
            btype = block.get("type", "")
            if btype == "tool_use":
                name = block.get("name", "")
                inp = block.get("input", {})
                formatted = fmt_tool(name, inp)
                print(f"{DIM}{ts()}{RESET} {color}{BOLD}[{session_name}]{RESET} {color}→ {formatted}{RESET}")
                printed = True
            elif btype == "text":
                text = block.get("text", "").strip()
                if text:
                    # Print first 200 chars, wrapping at ~100
                    preview = text[:200].replace("\n", " ")
                    if len(text) > 200:
                        preview += "…"
                    print(f"{DIM}{ts()}{RESET} {color}{BOLD}[{session_name}]{RESET} {DIM}TEXT: {preview}{RESET}")
                    printed = True

    elif msg_type == "tool" and show_results:
        content = msg.get("message", {}).get("content", [])
        for block in content:
            if block.get("type") == "tool_result":
                is_error = block.get("is_error", False)
                result = block.get("content", "")
                formatted = fmt_tool_result(result, is_error)
                if is_error:
                    print(f"{DIM}{ts()}{RESET} {color}{BOLD}[{session_name}]{RESET} {RED}  ✗ ERROR: {formatted}{RESET}")
                    printed = True
                elif formatted:
                    # Only show non-trivial results (skip empty/whitespace)
                    if len(formatted) > 2:
                        print(f"{DIM}{ts()}{RESET} {color}{BOLD}[{session_name}]{RESET} {DIM}  ↩ {formatted}{RESET}")
                        printed = True

    elif msg_type == "user":
        # Check for tool results embedded in user messages (agent messages)
        content = msg.get("message", {}).get("content", [])
        for block in content:
            if isinstance(block, dict) and block.get("type") == "tool_result":
                is_error = block.get("is_error", False)
                result = block.get("content", "")
                formatted = fmt_tool_result(result, is_error)
                if is_error:
                    print(f"{DIM}{ts()}{RESET} {color}{BOLD}[{session_name}]{RESET} {RED}  ✗ ERROR: {formatted}{RESET}")
                    printed = True

    return printed

def main():
    arg = sys.argv[1] if len(sys.argv) > 1 else None
    show_results = "--results" in sys.argv or "-r" in sys.argv

    session_dir = find_session_dir(arg)
    if not session_dir:
        print(f"{RED}No active session found in ~/.claude/projects/ (modified in last 2h){RESET}")
        print("Usage: python3 monitor-session.py [SESSION_DIR_OR_PROJECT_PATH]")
        sys.exit(1)

    print(f"{BOLD}Monitoring:{RESET} {session_dir}")
    print(f"{DIM}Sessions will appear as they are written. Ctrl-C to stop.{RESET}")
    if not show_results:
        print(f"{DIM}(Use --results / -r to also show tool result content){RESET}")
    print()

    # Track file → {offset, color, name, seen}
    tracked = {}
    color_idx = 0

    try:
        while True:
            # Discover new JSONL files
            try:
                current_files = set(session_dir.glob("*.jsonl"))
            except OSError:
                time.sleep(1)
                continue

            for f in sorted(current_files):
                if f not in tracked:
                    color = FILE_COLORS[color_idx % len(FILE_COLORS)]
                    color_idx += 1
                    name = short_session_name(f)
                    tracked[f] = {"offset": 0, "color": color, "name": name}
                    print(f"{DIM}{ts()}{RESET} {color}{BOLD}[{name}]{RESET} {BOLD}Session file opened: {f.name}{RESET}")

            # Read new lines from each file
            for f, state in list(tracked.items()):
                new_lines, new_offset = follow_file(f, state["offset"])
                if new_lines:
                    tracked[f]["offset"] = new_offset
                    for line in new_lines:
                        process_line(line, state["color"], state["name"], show_results)

            time.sleep(0.5)

    except KeyboardInterrupt:
        print(f"\n{DIM}Monitor stopped.{RESET}")

if __name__ == "__main__":
    main()
