#!/usr/bin/env python3
"""
Real-time monitor for Claude Code integration test sessions.

Watches *.jsonl session files and prints timestamped events as they are
written. Discovers background agent sessions automatically by scanning
~/.claude/projects/ for new files.

Usage:
  # Auto-detect most recent session dir:
  python3 tests/claude-code/monitor-session.py

  # Watch a specific test project path:
  python3 tests/claude-code/monitor-session.py /private/var/folders/.../tmp.XYZ

  # Also show tool result content:
  python3 tests/claude-code/monitor-session.py --results
"""

import json
import os
import sys
import time
from datetime import datetime
from pathlib import Path

# Unbuffered output so events appear immediately
sys.stdout.reconfigure(line_buffering=True)

# ANSI colors
RESET  = "\033[0m"
BOLD   = "\033[1m"
DIM    = "\033[2m"
RED    = "\033[31m"
GREEN  = "\033[32m"
YELLOW = "\033[33m"
BLUE   = "\033[34m"
MAGENTA = "\033[35m"
CYAN   = "\033[36m"
WHITE  = "\033[37m"

# Color per session file (cycles for multiple agents)
FILE_COLORS = [CYAN, GREEN, YELLOW, MAGENTA, BLUE, WHITE]

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
        subj = inp.get("subject", "")[:60]
        return f"TaskCreate: \"{subj}\""
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
        extras = []
        if inp.get("run_in_background"): extras.append("background")
        if inp.get("team_name"): extras.append(f"team={inp['team_name']}")
        if inp.get("subagent_type"): extras.append(f"type={inp['subagent_type']}")
        suffix = f" [{', '.join(extras)}]" if extras else ""
        return f"Agent: \"{desc}\"{suffix}"
    elif name == "SendMessage":
        msg_type = inp.get("type", "")
        recipient = inp.get("recipient", "all" if msg_type == "broadcast" else "?")
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
    elif name in ("Read", "Write", "Edit"):
        path = inp.get("file_path", "")
        return f"{name}({os.path.basename(str(path)[:50])})"
    elif name in ("Glob", "Grep"):
        pattern = inp.get("pattern", "")[:50]
        return f"{name}({pattern})"
    elif name == "Bash":
        cmd = inp.get("command", "")[:80]
        return f"Bash({cmd})"
    elif name == "EnterPlanMode":
        return "EnterPlanMode"
    elif name == "ExitPlanMode":
        return "ExitPlanMode"
    else:
        return f"{name}({str(inp)[:60]})"

def fmt_tool_result(result_content, is_error):
    """Format a tool result, highlighting errors."""
    if isinstance(result_content, list):
        texts = [c.get("text", "") for c in result_content if isinstance(c, dict)]
        result_content = " ".join(texts)
    s = str(result_content).strip()
    if len(s) > 150:
        s = s[:150] + "…"
    return s

def resolve_session_dir(arg):
    """Turn a raw project path into a Claude Code session directory path."""
    claude_projects = Path.home() / ".claude" / "projects"
    p = Path(arg)
    if p.exists() and any(p.glob("*.jsonl")):
        return p
    # Resolve symlinks (macOS /var → /private/var)
    canonical = str(p.resolve()) if p.exists() else str(p)
    escaped = canonical.replace("/", "-").replace(".", "-")
    session_dir = claude_projects / escaped
    return session_dir if session_dir.exists() else None

def find_session_dir(arg=None):
    """Resolve the session directory from argument or auto-detect."""
    if arg and not arg.startswith("-"):
        resolved = resolve_session_dir(arg)
        if resolved:
            return resolved
        print(f"{RED}Could not find session dir for: {arg}{RESET}", file=sys.stderr)

    # Auto-detect: most recently modified session dir with *.jsonl files
    claude_projects = Path.home() / ".claude" / "projects"
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

def scan_related_sessions(start_time, known_files, primary_dir):
    """Scan project dirs related to the primary dir for new JSONL files.
    'Related' means the dir name shares a common prefix with the primary dir,
    which catches agent sessions that cd into subdirectories of the test project.
    Returns list of new Path objects not already in known_files."""
    claude_projects = Path.home() / ".claude" / "projects"
    # Extract the base temp dir prefix to match related sessions.
    # e.g. "-private-var-folders-b1-...-T-tmp-NeCPpIDjvD" → match any dir
    # that starts with the same prefix up to the temp dir name.
    primary_name = primary_dir.name
    # Match dirs that share the same project directory name.
    # Agent sessions cd into the test project, so their session dir name
    # will contain the same tmp dir name (e.g. "tmp-NeCPpIDjvD").
    # We match on the full primary name to avoid picking up unrelated temp dirs.
    prefix = primary_name
    new_files = []
    try:
        for d in claude_projects.iterdir():
            if not d.is_dir():
                continue
            if d == primary_dir:
                continue
            # Only scan dirs related to the same project area
            if not d.name.startswith(prefix):
                continue
            # Top-level JSONL files
            for f in d.glob("*.jsonl"):
                if f in known_files:
                    continue
                try:
                    mtime = f.stat().st_mtime
                    if mtime >= start_time:
                        new_files.append(f)
                except OSError:
                    pass
            # Subagent JSONL files in {session-id}/subagents/
            for f in d.glob("*/subagents/*.jsonl"):
                if f in known_files:
                    continue
                try:
                    mtime = f.stat().st_mtime
                    if mtime >= start_time:
                        new_files.append(f)
                except OSError:
                    pass
    except OSError:
        pass
    return new_files

def follow_file(path, offset):
    """Read new lines from a file starting at offset."""
    try:
        with open(path, "r", errors="replace") as f:
            f.seek(offset)
            new_lines = f.readlines()
            new_offset = f.tell()
        return new_lines, new_offset
    except (OSError, IOError):
        return [], offset

def short_session_name(path):
    """Return short display name for a session file."""
    stem = path.stem
    # For subagent files like agent-a090ee6f5130e46ed, use shorter suffix
    if stem.startswith("agent-"):
        return stem[6:14]  # e.g. "a090ee6f"
    return stem[:8]

def dir_label(path):
    """Return a short label for the project directory (for cross-dir sessions)."""
    dirname = path.parent.name
    # Extract the meaningful suffix (last segment of the temp dir name)
    parts = dirname.split("-")
    if len(parts) > 3:
        return parts[-1][:8]  # e.g. "NeCPpIDj" from tmp-NeCPpIDjvD
    return dirname[:20]

def process_line(line, color, session_label, show_results):
    """Parse one JSONL line and print formatted output."""
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
                print(f"{DIM}{ts()}{RESET} {color}{BOLD}[{session_label}]{RESET} {color}→ {formatted}{RESET}")
                printed = True
            elif btype == "text":
                text = block.get("text", "").strip()
                if text:
                    preview = text[:200].replace("\n", " ↵ ")
                    if len(text) > 200:
                        preview += "…"
                    print(f"{DIM}{ts()}{RESET} {color}{BOLD}[{session_label}]{RESET} {DIM}TEXT: {preview}{RESET}")
                    printed = True

    elif msg_type == "tool" and show_results:
        content = msg.get("message", {}).get("content", [])
        for block in content:
            if block.get("type") == "tool_result":
                is_error = block.get("is_error", False)
                result = block.get("content", "")
                formatted = fmt_tool_result(result, is_error)
                if is_error:
                    print(f"{DIM}{ts()}{RESET} {color}{BOLD}[{session_label}]{RESET} {RED}  ✗ ERROR: {formatted}{RESET}")
                    printed = True
                elif formatted and len(formatted) > 2:
                    print(f"{DIM}{ts()}{RESET} {color}{BOLD}[{session_label}]{RESET} {DIM}  ↩ {formatted}{RESET}")
                    printed = True

    elif msg_type == "user":
        content = msg.get("message", {}).get("content", [])
        for block in content:
            if isinstance(block, dict):
                if block.get("type") == "tool_result":
                    is_error = block.get("is_error", False)
                    if is_error and show_results:
                        result = block.get("content", "")
                        formatted = fmt_tool_result(result, is_error)
                        print(f"{DIM}{ts()}{RESET} {color}{BOLD}[{session_label}]{RESET} {RED}  ✗ ERROR: {formatted}{RESET}")
                        printed = True

    return printed

def main():
    args = [a for a in sys.argv[1:] if not a.startswith("-")]
    flags = [a for a in sys.argv[1:] if a.startswith("-")]
    show_results = "--results" in flags or "-r" in flags
    arg = args[0] if args else None

    primary_dir = find_session_dir(arg)
    if not primary_dir:
        print(f"{RED}No active session found in ~/.claude/projects/ (modified in last 2h){RESET}")
        print("Usage: python3 monitor-session.py [SESSION_DIR_OR_PROJECT_PATH] [--results]")
        sys.exit(1)

    start_time = time.time() - 3600  # pick up files from the last hour

    print(f"{BOLD}Monitoring:{RESET} {primary_dir}")
    print(f"{DIM}Also scanning for related agent/team sessions in same project area{RESET}")
    print(f"{DIM}Ctrl-C to stop. Use --results / -r for tool result content.{RESET}")
    print()

    # Track: Path → {offset, color, label}
    tracked = {}
    color_idx = 0
    scan_counter = 0

    def add_file(f, label_prefix=""):
        nonlocal color_idx
        if f in tracked:
            return
        color = FILE_COLORS[color_idx % len(FILE_COLORS)]
        color_idx += 1
        name = short_session_name(f)
        # If from a different directory, include the dir hint
        if f.parent != primary_dir:
            proj_label = dir_label(f)
            label = f"{name}/{proj_label}"
        else:
            label = name
        if label_prefix:
            label = f"{label_prefix}{label}"
        tracked[f] = {"offset": 0, "color": color, "label": label}
        print(f"{DIM}{ts()}{RESET} {color}{BOLD}[{label}]{RESET} {BOLD}Session opened: {f.name}{RESET} ({f.parent.name[-20:]})")

    try:
        while True:
            # Discover new JSONL files in primary directory
            try:
                for f in sorted(primary_dir.glob("*.jsonl")):
                    add_file(f)
            except OSError:
                pass

            # Discover subagent sessions: {session-id}/subagents/agent-*.jsonl
            try:
                for f in sorted(primary_dir.glob("*/subagents/*.jsonl")):
                    add_file(f, "agent:")
            except OSError:
                pass

            # Every ~5 seconds, scan related project dirs for agent/team sessions
            scan_counter += 1
            if scan_counter % 10 == 0:
                new_files = scan_related_sessions(start_time, tracked, primary_dir)
                for f in sorted(new_files):
                    add_file(f, "agent:")

            # Read new lines from each tracked file
            for f, state in list(tracked.items()):
                new_lines, new_offset = follow_file(f, state["offset"])
                if new_lines:
                    tracked[f]["offset"] = new_offset
                    for line in new_lines:
                        process_line(line, state["color"], state["label"], show_results)

            time.sleep(0.5)

    except KeyboardInterrupt:
        print(f"\n{DIM}Monitor stopped.{RESET}")
        # Print summary
        print(f"\n{BOLD}Sessions tracked: {len(tracked)}{RESET}")
        for f, state in tracked.items():
            size = f.stat().st_size if f.exists() else 0
            print(f"  {state['color']}{BOLD}[{state['label']}]{RESET} {f.name} ({size//1024}K)")

if __name__ == "__main__":
    main()
