#!/usr/bin/env python3
"""ACE SessionStart hook — inject evolution health context.

On session start, quickly summarize the ACE knowledge state so Claude
has context about what the system has learned.
"""
import json
import os
import sys
from datetime import datetime, timedelta, timezone

# Import shared config (relative import via sys.path)
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _ace_config import (
    ACE_ROOT,
    INSIGHT_DIR,
    TRACE_DIR,
    check_ace_health,
    log_hook_error,
)


def count_recent_traces(days: int = 7) -> int:
    """Count traces from the last N days."""
    if not TRACE_DIR or not TRACE_DIR.exists():
        return 0
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    count = 0
    for f in TRACE_DIR.glob("*.jsonl"):
        try:
            file_date = datetime.strptime(f.stem, "%Y-%m-%d").replace(tzinfo=timezone.utc)
            if file_date >= cutoff:
                with open(f) as fh:
                    count += sum(1 for _ in fh)
        except (ValueError, OSError):
            continue
    return count


def count_knowledge() -> dict:
    """Count knowledge entries by status."""
    if not INSIGHT_DIR or not INSIGHT_DIR.exists():
        return {"total": 0, "active": 0, "negative": 0}
    total = active = negative = 0
    for f in INSIGHT_DIR.glob("*.json"):
        try:
            with open(f) as fh:
                entry = json.load(fh)
            total += 1
            if entry.get("enabled", True):
                active += 1
            if entry.get("polarity") == "negative":
                negative += 1
        except (json.JSONDecodeError, OSError):
            continue
    return {"total": total, "active": active, "negative": negative}


def main():
    try:
        data = json.load(sys.stdin)
    except (json.JSONDecodeError, EOFError):
        sys.exit(0)

    # Only inject context on fresh session starts, not resumes
    source = data.get("source", "")
    if source not in ("startup", ""):
        sys.exit(0)

    # Health check — warn if ACE is not configured
    health_warning = check_ace_health()
    if health_warning:
        print(health_warning, file=sys.stderr)
        sys.exit(0)

    traces_7d = count_recent_traces(7)
    knowledge = count_knowledge()

    if traces_7d == 0 and knowledge["total"] == 0:
        # System cold — give actionable guidance instead of silence
        print(
            "[ACE] Health: 0 traces (7d), 0 insights — system cold. "
            "Run tests or workflows to start accumulating data.",
            file=sys.stderr,
        )
        sys.exit(0)

    summary_parts = []
    if traces_7d > 0:
        summary_parts.append(f"{traces_7d} traces (7d)")
    if knowledge["total"] > 0:
        summary_parts.append(
            f"{knowledge['active']}/{knowledge['total']} insights active"
        )
    if knowledge["negative"] > 0:
        summary_parts.append(f"{knowledge['negative']} negative patterns")

    summary = " | ".join(summary_parts)
    print(f"[ACE] Evolution state: {summary}", file=sys.stderr)

    # ── Pre-load Recent Memories ─────────────────────────────────────
    # 在会话开始时预加载最近使用的设备/工作流的 memories
    try:
        recent_memories = _load_recent_memories()
        if recent_memories:
            print(f"[ACE] Recent memories: {recent_memories}", file=sys.stderr)
    except Exception:
        pass  # Non-critical, ignore errors
    # ────────────────────────────────────────────────────────────────

    sys.exit(0)


def _load_recent_memories() -> str:
    """Load memories from recently used devices/workflows.

    Returns a summary string or empty string if no memories.
    """
    try:
        sys.path.insert(0, ACE_ROOT)
        from src.core.memory.manager import MemoryManager

        manager = MemoryManager()

        # Try to find recently active entities from traces
        recent_entities = _get_recent_entities_from_traces()

        all_warnings = []
        for entity_type, entity_id in recent_entities[:3]:  # Top 3 recent
            try:
                memories = manager.list(entity_type, entity_id)
                for m in memories:
                    if m.type.value == "pitfall":
                        all_warnings.append(f"{entity_id}: {m.title}")
            except Exception:
                continue

        if all_warnings:
            return f"{len(all_warnings)} pitfalls from recent entities"

    except Exception:
        pass

    return ""


def _get_recent_entities_from_traces() -> list:
    """Get recently active entities from trace files."""
    entities = []

    if not TRACE_DIR or not TRACE_DIR.exists():
        return entities

    # Read today's traces
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    trace_file = TRACE_DIR / f"{today}.jsonl"

    if not trace_file.exists():
        return entities

    seen = set()
    try:
        with open(trace_file) as f:
            for line in f:
                if not line.strip():
                    continue
                try:
                    trace = json.loads(line)
                    entity_type = trace.get("entity_type", "")
                    entity_id = trace.get("entity_id", "")

                    if entity_type and entity_id:
                        key = (entity_type, entity_id)
                        if key not in seen:
                            seen.add(key)
                            entities.append(key)
                except json.JSONDecodeError:
                    continue
    except OSError:
        pass

    return entities


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        log_hook_error("session-start-context", e)
        sys.exit(0)
