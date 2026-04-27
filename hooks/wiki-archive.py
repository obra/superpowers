#!/usr/bin/env python3
"""
Project wiki archiver for sspower.
Triggered by PreCompact/SessionEnd via wiki-archive.sh.

Per-project: writes to <cwd>/.claude/wiki/sessions/
Fallback: if cwd missing/unwritable, writes to ~/.claude/wiki/<basename>-<hash>/sessions/

Produces:
  - YYMMDD_HH-MM_Event.json  (structured, full extraction)
  - YYMMDD_HH-MM_Event.md    (human-readable session summary)

Adapted from session_archive.py. Core extraction logic preserved; output
location made project-relative and a markdown summary added for wiki browsing.
"""

import json
import sys
import os
import re
import hashlib
from datetime import datetime
from collections import defaultdict
from pathlib import Path

COST_TABLE = {
    "opus":   {"input": 15.0, "output": 75.0, "cache_read": 1.875, "cache_create": 18.75},
    "sonnet": {"input": 3.0,  "output": 15.0, "cache_read": 0.375, "cache_create": 3.75},
    "haiku":  {"input": 0.80, "output": 4.0,  "cache_read": 0.08,  "cache_create": 1.0},
}


def get_cost_rates(model: str) -> dict:
    for key in COST_TABLE:
        if key in model:
            return COST_TABLE[key]
    return COST_TABLE["sonnet"]


def fmt_duration(minutes: float) -> str:
    if minutes < 1:
        return "<1m"
    if minutes < 60:
        return f"{int(minutes)}m"
    h, m = divmod(int(minutes), 60)
    return f"{h}h{m}m" if m else f"{h}h"


def rel_path(fpath: str, cwd: str) -> str:
    if cwd and fpath.startswith(cwd + "/"):
        return fpath[len(cwd) + 1:]
    home = str(Path.home())
    if fpath.startswith(home + "/"):
        return "~/" + fpath[len(home) + 1:]
    return fpath


def truncate(s: str, n: int = 500) -> str:
    if not s or len(s) <= n:
        return s or ""
    return s[:n] + f"… ({len(s) - n} more chars)"


def parse_ts(ts: str):
    if not ts:
        return None
    try:
        return datetime.fromisoformat(ts.replace("Z", "+00:00"))
    except (ValueError, TypeError):
        return None


def resolve_out_dir(cwd: str) -> Path:
    """Per-project wiki dir, or central fallback if cwd unusable."""
    if cwd:
        project_dir = Path(cwd) / ".claude" / "wiki" / "sessions"
        try:
            project_dir.mkdir(parents=True, exist_ok=True)
            # Writability check — some cwd are read-only (container volumes etc.)
            probe = project_dir / ".write-probe"
            probe.touch()
            probe.unlink()
            return project_dir
        except (OSError, PermissionError):
            pass

    # Fallback: ~/.claude/wiki/<basename>-<hash8>/sessions/
    basename = os.path.basename(cwd) if cwd else "unknown"
    slug_hash = hashlib.sha256(cwd.encode("utf-8") if cwd else b"unknown").hexdigest()[:8]
    fallback = Path.home() / ".claude" / "wiki" / f"{basename}-{slug_hash}" / "sessions"
    fallback.mkdir(parents=True, exist_ok=True)
    return fallback


def parse_events(path: str) -> list:
    events = []
    with open(path, "r") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                events.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    return events


def count_tool_uses(events: list) -> int:
    count = 0
    for e in events:
        if e.get("type") != "assistant":
            continue
        for c in (e.get("message", {}).get("content") or []):
            if isinstance(c, dict) and c.get("type") == "tool_use":
                count += 1
    return count


def extract_all(events: list, session_id: str, cwd: str, event_name: str) -> dict:
    model = ""
    git_branch = ""
    first_ts = None
    last_ts = None
    timestamps = []

    total_input = 0
    total_output = 0
    total_cache_read = 0
    total_cache_create = 0
    per_request = {}

    conversation = []
    edits = []
    commands = []
    searches = []
    agents = []
    web_activity = []
    errors = []
    file_ops = defaultdict(lambda: {"read": 0, "edit": 0, "write": 0})
    git_ops = []
    tool_counts = defaultdict(int)
    tool_use_map = {}
    request_contents = defaultdict(list)
    request_meta = {}

    for e in events:
        etype = e.get("type")
        ts = e.get("timestamp", "")

        if ts:
            dt = parse_ts(ts)
            if dt:
                timestamps.append(dt)
                if first_ts is None:
                    first_ts = dt
                last_ts = dt

        if not git_branch and e.get("gitBranch"):
            git_branch = e["gitBranch"]

        if etype == "assistant":
            msg = e.get("message", {})
            if not isinstance(msg, dict):
                continue

            m = msg.get("model", "")
            if m and not model:
                model = m

            rid = e.get("requestId", "")
            stop = msg.get("stop_reason")
            usage = msg.get("usage", {})

            content = msg.get("content", [])
            if isinstance(content, list):
                for block in content:
                    if not isinstance(block, dict):
                        continue
                    request_contents[rid].append(block)

                    btype = block.get("type")

                    if btype == "thinking" and block.get("thinking"):
                        conversation.append({"type": "thinking", "ts": ts, "text": block["thinking"]})

                    elif btype == "text" and block.get("text"):
                        conversation.append({"type": "assistant", "ts": ts, "text": block["text"]})

                    elif btype == "tool_use":
                        tool_name = block.get("name", "unknown")
                        tool_input = block.get("input", {})
                        tool_id = block.get("id", "")

                        tool_counts[tool_name] += 1
                        tool_use_map[tool_id] = {"name": tool_name, "input": tool_input, "ts": ts}

                        fp_raw = tool_input.get("file_path", "") or tool_input.get("path", "")
                        file_path = rel_path(fp_raw, cwd) if fp_raw else ""

                        conversation.append({
                            "type": "tool_call", "ts": ts, "tool": tool_name,
                            "input": _summarize_tool_input(tool_name, tool_input, cwd),
                            "file_path": file_path, "raw_input": tool_input,
                        })

                        _collect_tool_data(
                            tool_name, tool_input, ts, cwd,
                            edits, commands, searches, agents,
                            web_activity, git_ops, file_ops,
                        )

            if stop and rid:
                inp = usage.get("input_tokens", 0)
                out = usage.get("output_tokens", 0)
                cr = usage.get("cache_read_input_tokens", 0)
                cc = usage.get("cache_creation_input_tokens", 0)
                total_input += inp
                total_output += out
                total_cache_read += cr
                total_cache_create += cc
                per_request[rid] = {
                    "request_id": rid, "stop_reason": stop,
                    "input": inp, "output": out,
                    "cache_read": cr, "cache_create": cc,
                }
                request_meta[rid] = {"model": m, "stop_reason": stop, "ts": ts}

        elif etype == "user":
            msg = e.get("message")
            tool_result = e.get("toolUseResult")
            source_uuid = e.get("sourceToolAssistantUUID")

            if tool_result is not None:
                _collect_tool_result(tool_result, msg, ts, source_uuid, conversation, errors, commands)
            else:
                text = _extract_user_text(msg)
                if text:
                    conversation.append({"type": "user", "ts": ts, "text": text})

        elif etype == "system":
            msg_text = e.get("message", "")
            if isinstance(msg_text, str) and msg_text:
                if re.search(r"error|api_error", msg_text, re.I):
                    errors.append({"type": "system_error", "ts": ts, "message": truncate(msg_text, 300)})

    active_min = 0
    wall_min = 0
    if timestamps:
        timestamps.sort()
        wall_min = (timestamps[-1] - timestamps[0]).total_seconds() / 60
        for i in range(1, len(timestamps)):
            gap = (timestamps[i] - timestamps[i - 1]).total_seconds()
            if 0 < gap < 300:
                active_min += gap
        active_min /= 60

    rates = get_cost_rates(model)
    cost = (
        total_input * rates["input"] / 1_000_000
        + total_output * rates["output"] / 1_000_000
        + total_cache_read * rates["cache_read"] / 1_000_000
        + total_cache_create * rates["cache_create"] / 1_000_000
    )

    project_name = os.path.basename(cwd) if cwd else "unknown"
    user_turns = sum(1 for c in conversation if c["type"] == "user")
    assistant_turns = sum(1 for c in conversation if c["type"] == "assistant")

    now = datetime.now().astimezone()

    return {
        "meta": {
            "session_id": session_id[:20] if session_id else "",
            "session_id_full": session_id,
            "date": now.strftime("%Y-%m-%d"),
            "time": now.strftime("%H:%M"),
            "event": event_name,
            "project": project_name,
            "cwd": cwd,
            "git_branch": git_branch if git_branch != "HEAD" else "",
            "model": model,
            "duration_active": fmt_duration(active_min),
            "duration_active_min": round(active_min, 1),
            "duration_wall_min": round(wall_min, 1),
        },
        "tokens": {
            "input": total_input,
            "output": total_output,
            "cache_read": total_cache_read,
            "cache_create": total_cache_create,
            "cost_estimate": round(cost, 2),
            "per_request": list(per_request.values()),
        },
        "conversation": conversation,
        "edits": edits,
        "commands": commands,
        "searches": searches,
        "agents": agents,
        "web_activity": web_activity,
        "errors": errors,
        "files": {path: ops for path, ops in sorted(file_ops.items())},
        "git_ops": git_ops,
        "tool_counts": dict(sorted(tool_counts.items(), key=lambda x: -x[1])),
        "stats": {
            "user_turns": user_turns,
            "assistant_turns": assistant_turns,
            "total_tools": sum(tool_counts.values()),
            "total_edits": len(edits),
            "total_commands": len(commands),
            "total_searches": len(searches),
            "total_agents": len(agents),
            "total_errors": len(errors),
            "total_files": len(file_ops),
        },
    }


def _extract_user_text(msg) -> str:
    if isinstance(msg, str):
        return msg
    if not isinstance(msg, dict):
        return ""
    content = msg.get("content", "")
    if isinstance(content, str):
        if content.startswith("<") or content.startswith("[SYSTEM"):
            return ""
        return content
    if isinstance(content, list):
        parts = []
        for item in content:
            if isinstance(item, dict):
                if item.get("type") == "text":
                    t = item.get("text", "")
                    if t and not t.startswith("<system-reminder>"):
                        parts.append(t)
            elif isinstance(item, str) and not item.startswith("<"):
                parts.append(item)
        return "\n".join(parts)
    return ""


def _summarize_tool_input(name: str, inp: dict, cwd: str) -> str:
    if name == "Read":
        return f'`{rel_path(inp.get("file_path", "?"), cwd)}`'
    if name == "Write":
        return f'`{rel_path(inp.get("file_path", "?"), cwd)}`'
    if name == "Edit":
        fp = rel_path(inp.get("file_path", "?"), cwd)
        old = truncate(inp.get("old_string", ""), 60)
        return f'`{fp}` — replace "{old}"'
    if name == "Bash":
        cmd = inp.get("command", "")
        return f'`{truncate(cmd, 120)}`'
    if name == "Grep":
        return f'pattern=`{inp.get("pattern", "?")}` path=`{inp.get("path", ".")}`'
    if name == "Glob":
        return f'`{inp.get("pattern", "?")}` in `{inp.get("path", ".")}`'
    if name == "Agent":
        return f'{inp.get("description", "?")} ({inp.get("subagent_type", "general")})'
    if name in ("WebSearch", "WebFetch"):
        return inp.get("query", "") or inp.get("url", "") or str(inp)[:80]
    return str(inp)[:100]


def _collect_tool_data(name, inp, ts, cwd, edits, commands, searches, agents, web_activity, git_ops, file_ops):
    if name == "Edit":
        fp = rel_path(inp.get("file_path", ""), cwd)
        edits.append({
            "ts": ts, "file": fp,
            "old": inp.get("old_string", ""), "new": inp.get("new_string", ""),
            "replace_all": inp.get("replace_all", False),
        })
        file_ops[fp]["edit"] += 1
    elif name == "Read":
        fp = rel_path(inp.get("file_path", ""), cwd)
        file_ops[fp]["read"] += 1
    elif name == "Write":
        fp = rel_path(inp.get("file_path", ""), cwd)
        file_ops[fp]["write"] += 1
    elif name == "Bash":
        cmd = inp.get("command", "")
        commands.append({
            "ts": ts, "command": cmd,
            "description": inp.get("description", ""),
            "stdout": None, "stderr": None, "exit_code": None,
        })
        if re.search(r"git\s+(commit|push|merge|rebase|tag|cherry-pick)", cmd):
            git_ops.append({"ts": ts, "command": truncate(cmd, 200)})
    elif name in ("Grep", "Glob"):
        searches.append({
            "ts": ts, "tool": name,
            "pattern": inp.get("pattern", ""),
            "path": rel_path(inp.get("path", "."), cwd),
            "output_mode": inp.get("output_mode", ""),
        })
    elif name == "Agent":
        agents.append({
            "ts": ts,
            "description": inp.get("description", ""),
            "prompt": inp.get("prompt", ""),
            "subagent_type": inp.get("subagent_type", "general"),
        })
    elif name in ("WebSearch", "WebFetch"):
        web_activity.append({
            "ts": ts, "tool": name,
            "query": inp.get("query", ""),
            "url": inp.get("url", ""),
        })


def _collect_tool_result(tool_result, msg, ts, source_uuid, conversation, errors, commands):
    if isinstance(tool_result, str):
        if "reject" in tool_result.lower():
            errors.append({"type": "rejection", "ts": ts, "message": tool_result})
            conversation.append({"type": "rejection", "ts": ts, "text": tool_result})
        elif "error" in tool_result.lower():
            errors.append({"type": "tool_error", "ts": ts, "message": tool_result})
            conversation.append({"type": "error", "ts": ts, "text": tool_result})
        return

    if not isinstance(tool_result, dict):
        return

    if "stdout" in tool_result:
        stdout = tool_result.get("stdout", "")
        stderr = tool_result.get("stderr", "")
        for cmd in reversed(commands):
            if cmd["stdout"] is None:
                cmd["stdout"] = truncate(stdout, 1000)
                cmd["stderr"] = truncate(stderr, 500)
                cmd["exit_code"] = _infer_exit_code(stderr, tool_result)
                break
        conversation.append({
            "type": "tool_result", "ts": ts, "tool": "Bash",
            "output": truncate(stdout, 300),
            "error": truncate(stderr, 200) if stderr else "",
        })
    elif "numFiles" in tool_result:
        conversation.append({
            "type": "tool_result", "ts": ts, "tool": "Glob",
            "output": f'{tool_result.get("numFiles", 0)} files ({tool_result.get("durationMs", 0)}ms)',
        })
    elif "file" in tool_result and "type" in tool_result:
        file_info = tool_result.get("file", {})
        if isinstance(file_info, dict):
            fname = os.path.basename(file_info.get("filePath", "?"))
            lines = file_info.get("totalLines", "?")
            output = f"`{fname}` ({lines} lines)"
        else:
            output = str(file_info)
        conversation.append({"type": "tool_result", "ts": ts, "tool": "Read", "output": output})
    elif "structuredPatch" in tool_result or "filePath" in tool_result:
        user_modified = tool_result.get("userModified", False)
        conversation.append({
            "type": "tool_result", "ts": ts, "tool": "Edit",
            "output": f'Applied to `{os.path.basename(tool_result.get("filePath", "?"))}`'
                      + (" (user modified)" if user_modified else ""),
        })
    else:
        dur = tool_result.get("durationMs")
        conversation.append({
            "type": "tool_result", "ts": ts, "tool": "unknown",
            "output": f"Completed" + (f" ({dur}ms)" if dur else ""),
        })

    if isinstance(msg, dict):
        content = msg.get("content", [])
        if isinstance(content, list):
            for item in content:
                if isinstance(item, dict) and item.get("type") == "tool_result":
                    if item.get("is_error"):
                        err_content = item.get("content", "")
                        if isinstance(err_content, str):
                            errors.append({
                                "type": "tool_error", "ts": ts,
                                "message": truncate(err_content, 300),
                            })


def _infer_exit_code(stderr: str, result: dict):
    if result.get("interrupted"):
        return -1
    if stderr and re.search(r"error|fail|not found|command not found", stderr, re.I):
        return 1
    return 0


def write_json(data: dict, path: Path):
    clean_conversation = []
    for entry in data["conversation"]:
        e = dict(entry)
        e.pop("raw_input", None)
        if "text" in e and isinstance(e["text"], str) and len(e["text"]) > 5000:
            e["text"] = e["text"][:5000] + f"… ({len(entry['text']) - 5000} more)"
        clean_conversation.append(e)

    out = {
        "meta": data["meta"],
        "tokens": data["tokens"],
        "stats": data["stats"],
        "conversation": clean_conversation,
        "edits": [
            {**ed, "old": truncate(ed["old"], 500), "new": truncate(ed["new"], 500)}
            for ed in data["edits"]
        ],
        "commands": data["commands"],
        "searches": data["searches"],
        "agents": [{**a, "prompt": truncate(a["prompt"], 1000)} for a in data["agents"]],
        "web_activity": data["web_activity"],
        "errors": data["errors"],
        "files": data["files"],
        "git_ops": data["git_ops"],
        "tool_counts": data["tool_counts"],
    }

    with open(path, "w") as f:
        json.dump(out, f, indent=2, ensure_ascii=False, default=str)


def write_markdown(data: dict, path: Path):
    """Human-readable session summary for wiki browsing."""
    meta = data["meta"]
    tokens = data["tokens"]
    stats = data["stats"]

    lines = []
    lines.append(f"# {meta['date']} {meta['time']} — {meta['event']}")
    lines.append("")
    lines.append(f"- **Project:** `{meta['project']}`")
    if meta.get("git_branch"):
        lines.append(f"- **Branch:** `{meta['git_branch']}`")
    lines.append(f"- **Model:** {meta['model']}")
    lines.append(f"- **Duration:** {meta['duration_active']} active / {meta['duration_wall_min']}m wall")
    lines.append(f"- **Cost:** ${tokens['cost_estimate']}")
    lines.append(f"- **Tokens:** {tokens['input']:,} in / {tokens['output']:,} out "
                 f"/ {tokens['cache_read']:,} cache-read")
    lines.append("")
    lines.append(f"## Stats")
    lines.append(f"- Turns: {stats['user_turns']} user / {stats['assistant_turns']} assistant")
    lines.append(f"- Tools: {stats['total_tools']} calls "
                 f"({stats['total_edits']} edits, {stats['total_commands']} bash, "
                 f"{stats['total_searches']} searches, {stats['total_agents']} agents)")
    lines.append(f"- Files touched: {stats['total_files']}")
    if stats["total_errors"]:
        lines.append(f"- **Errors:** {stats['total_errors']}")
    lines.append("")

    # Top files by activity
    files = data["files"]
    if files:
        lines.append("## Files touched")
        ranked = sorted(files.items(), key=lambda x: -(x[1]["read"] + x[1]["edit"] + x[1]["write"]))
        for fp, ops in ranked[:20]:
            parts = []
            if ops["read"]: parts.append(f"{ops['read']}r")
            if ops["edit"]: parts.append(f"{ops['edit']}e")
            if ops["write"]: parts.append(f"{ops['write']}w")
            lines.append(f"- `{fp}` ({'/'.join(parts)})")
        if len(ranked) > 20:
            lines.append(f"- … +{len(ranked) - 20} more")
        lines.append("")

    # Git ops
    if data["git_ops"]:
        lines.append("## Git operations")
        for g in data["git_ops"]:
            lines.append(f"- `{g['command']}`")
        lines.append("")

    # User turns (prompts only) — shows what user asked
    prompts = [c for c in data["conversation"] if c["type"] == "user"]
    if prompts:
        lines.append("## User prompts")
        for p in prompts[:30]:
            t = p.get("text", "").strip().replace("\n", " ")
            lines.append(f"- {truncate(t, 160)}")
        if len(prompts) > 30:
            lines.append(f"- … +{len(prompts) - 30} more")
        lines.append("")

    # Errors
    if data["errors"]:
        lines.append("## Errors")
        for err in data["errors"][:10]:
            lines.append(f"- **{err['type']}:** {err['message']}")
        lines.append("")

    path.write_text("\n".join(lines), encoding="utf-8")


WIKI_DECISIONS_SEED = """# Decisions

Architectural calls, tradeoffs, and "we picked X because Y" notes for this project.
Append entries with date + one-line summary + reasoning. Read by `brainstorming` and
`writing-plans` skills before proposing new work.
"""

WIKI_GOTCHAS_SEED = """# Gotchas

Bugs, footguns, and "watch out for X" notes for this project. Read by
`systematic-debugging` skill before investigating new failures — match symptoms
against known gotchas first.
"""

WIKI_INDEX_HEADER = """# Session Index

Auto-appended by `wiki-archive.py` on PreCompact / SessionEnd. Newest at the bottom.

| Date | Event | Duration | Tools | Cost | Top files |
|------|-------|----------|-------|------|-----------|
"""


def seed_wiki_files(wiki_root: Path):
    """Create decisions.md / gotchas.md heading templates if missing."""
    decisions = wiki_root / "decisions.md"
    gotchas = wiki_root / "gotchas.md"
    if not decisions.exists():
        try:
            decisions.write_text(WIKI_DECISIONS_SEED, encoding="utf-8")
        except OSError:
            pass
    if not gotchas.exists():
        try:
            gotchas.write_text(WIKI_GOTCHAS_SEED, encoding="utf-8")
        except OSError:
            pass


def fan_out_to_central_sidecars(json_path: Path):
    """Symlink per-project JSON sidecar into ~/.claude/sessions/ so the
    /daily skill (which reads ~/.claude/sessions/*.json) keeps working
    after the old session_archive hook is retired.

    Best-effort: skipped silently on filesystems without symlink support."""
    central = Path.home() / ".claude" / "sessions"
    try:
        central.mkdir(parents=True, exist_ok=True)
    except OSError:
        return

    link = central / json_path.name
    try:
        if link.is_symlink() or link.exists():
            link.unlink()
        link.symlink_to(json_path.resolve())
    except (OSError, NotImplementedError):
        # Symlinks unsupported (Windows w/o privilege, exotic FS) — just skip.
        # Old session_archive may still write here if user kept dual-hook setup.
        pass


def append_index_entry(wiki_root: Path, data: dict, md_path: Path):
    """Append one-line summary row to <wiki_root>/index.md."""
    index = wiki_root / "index.md"
    if not index.exists():
        try:
            index.write_text(WIKI_INDEX_HEADER, encoding="utf-8")
        except OSError:
            return

    meta = data["meta"]
    stats = data["stats"]
    tokens = data["tokens"]
    files = data.get("files", {})

    ranked = sorted(
        files.items(),
        key=lambda x: -(x[1]["read"] + x[1]["edit"] + x[1]["write"]),
    )
    top = [os.path.basename(fp) for fp, _ in ranked[:3]]
    top_str = ", ".join(f"`{t}`" for t in top) if top else "—"

    rel_md = f"sessions/{md_path.name}"
    row = (
        f"| {meta['date']} {meta['time']} "
        f"| [{meta['event']}]({rel_md}) "
        f"| {meta['duration_active']} "
        f"| {stats['total_tools']} "
        f"| ${tokens['cost_estimate']} "
        f"| {top_str} |\n"
    )
    try:
        with open(index, "a", encoding="utf-8") as f:
            f.write(row)
    except OSError:
        pass


def main():
    try:
        payload = json.loads(sys.stdin.read())
    except (json.JSONDecodeError, ValueError):
        sys.exit(0)

    session_id = payload.get("session_id", "")
    transcript_path = payload.get("transcript_path", "")
    cwd = payload.get("cwd", "")
    event = payload.get("hook_event_name", "Unknown")

    if transcript_path:
        transcript_path = str(Path(transcript_path).expanduser())

    if not transcript_path or not os.path.isfile(transcript_path):
        sys.exit(0)

    events = parse_events(transcript_path)

    # Skip only empty transcripts. Short real sessions (1-2 edits, a decision)
    # are still worth archiving for the project wiki.
    if not events:
        sys.exit(0)

    data = extract_all(events, session_id, cwd, event)

    out_dir = resolve_out_dir(cwd)

    now = datetime.now().astimezone()
    prefix = now.strftime("%y%m%d_%H-%M")
    base = f"{prefix}_{event}"

    json_path = out_dir / f"{base}.json"
    md_path = out_dir / f"{base}.md"

    # Dedupe
    if json_path.exists():
        short_id = session_id[:12] if session_id else "unk"
        json_path = out_dir / f"{base}_{short_id}.json"
        md_path = out_dir / f"{base}_{short_id}.md"

    write_json(data, json_path)
    write_markdown(data, md_path)

    wiki_root = out_dir.parent
    seed_wiki_files(wiki_root)
    append_index_entry(wiki_root, data, md_path)
    fan_out_to_central_sidecars(json_path)


if __name__ == "__main__":
    main()
