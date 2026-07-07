#!/usr/bin/env python3
"""ACE Eureka System — reflect + auto-evolve at session end.

1. Reflect: traces → insight markdown + checkpoint
2. Evolve: if thresholds met, run pattern extraction → store insights, decay old ones

No manual intervention needed. The system decides and executes automatically.
"""
import asyncio
import hashlib
import json
import re
import sys
import os
from datetime import datetime, timezone, timedelta
from pathlib import Path

ACE_ROOT = os.environ.get("CLAUDE_PROJECT_DIR", "")
_ACE_HOME = Path.home() / ".ace"
TRACE_DIR = _ACE_HOME / "traces"
INSIGHT_DIR = _ACE_HOME / "insights"
SESSION_FAILURES_FILE = _ACE_HOME / ".session_failures.json"
EVOLUTION_STATE_FILE = _ACE_HOME / ".evolution_state.json"

# Threshold for suggesting traceback at session end
_TRACEBACK_SUGGEST_FAILURE_THRESHOLD = 3

# Evolution thresholds — single source of truth lives in _ace_config (which
# also reads ~/.ace/config.json overrides). Importing here means a project
# can lower min_traces for dev or raise it for batch runs without editing
# this hook.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _ace_config import (  # noqa: E402
    MIN_TRACES_FOR_EVOLUTION,
    MIN_HOURS_BETWEEN_EVOLUTIONS,
    CONFIDENCE_THRESHOLD,
    log_hook_error,
)


# ── Phase 1: Reflect (traces → insight markdown + checkpoint) ──────────

def load_traces() -> tuple[list[dict], list[dict]]:
    """Load today's error traces (PCFL) and eureka traces (CDSI)."""
    if not TRACE_DIR or not TRACE_DIR.exists():
        return [], []

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    trace_file = TRACE_DIR / f"{today}.jsonl"
    if not trace_file.exists():
        return [], []

    errors = []
    eurekas = []
    with open(trace_file) as f:
        for line in f:
            if not line.strip():
                continue
            try:
                trace = json.loads(line)
                if trace.get("status") == "eureka" and (trace.get("challenge") or trace.get("insight")):
                    eurekas.append(trace)
                elif trace.get("status") == "failed" and (trace.get("problem") or trace.get("lesson")):
                    errors.append(trace)
            except json.JSONDecodeError:
                continue
    return errors, eurekas


# Quality filter and content-dedup — kept local to the hook to avoid
# import-failure risk in production sessions. Mirrors the canonical
# logic in src/core/evolution/reflection_extractor.py; tests for both
# live alongside the library version.

_GENERIC_LESSON_RE = re.compile(r"^investigate\s+failures?\s+in\s+", re.IGNORECASE)
_VAGUE_CAUSES = {"", "unknown", "see trace error"}
_SIG_RE = re.compile(r"<!--\s*sig:\s*([0-9a-f]{12})\s*-->")


def _is_actionable(t: dict) -> bool:
    """True when a trace carries enough signal to be worth storing.

    Drops auto-generated drivel (Cause: Unknown + Lesson: 'Investigate
    failures in X') that previously poisoned ~/.ace/insights/.
    """
    if t.get("status") == "eureka":
        return bool(t.get("challenge") or t.get("solution") or t.get("insight"))

    cause = (t.get("cause") or "").strip()
    fix = (t.get("fix") or "").strip()
    error = (t.get("error") or "").strip()

    has_cause = cause.lower() not in _VAGUE_CAUSES
    has_fix = bool(fix)
    has_error = len(error) > 20
    return has_cause or has_fix or has_error


def _entry_signature(t: dict) -> str:
    """12-char content signature; same problem+cause → same signature."""
    parts = [
        (t.get("status") or "").strip(),
        (t.get("problem") or "").strip(),
        (t.get("cause") or "").strip(),
        (t.get("challenge") or "").strip(),
        (t.get("solution") or "").strip(),
    ]
    return hashlib.md5("|".join(parts).encode("utf-8")).hexdigest()[:12]


def write_insight_markdown(error_traces: list[dict], eureka_traces: list[dict]) -> list[str]:
    """Write/update insight markdown files per entity, applying quality
    filter and content-based dedup.
    """
    if not INSIGHT_DIR or (not error_traces and not eureka_traces):
        return []

    INSIGHT_DIR.mkdir(parents=True, exist_ok=True)

    by_entity: dict[str, list[dict]] = {}
    for t in error_traces + eureka_traces:
        if not _is_actionable(t):
            continue
        entity = t.get("entity_id", "unknown")
        by_entity.setdefault(entity, []).append(t)

    updated = []
    for entity_id, entity_traces in by_entity.items():
        safe_name = entity_id.replace("/", "_").replace(" ", "_")
        md_path = INSIGHT_DIR / f"{safe_name}.md"

        existing_content = ""
        existing_sigs: set[str] = set()
        if md_path.exists():
            existing_content = md_path.read_text(encoding="utf-8")
            existing_sigs = set(_SIG_RE.findall(existing_content))

        new_entries = []
        for t in entity_traces:
            ts = t.get("timestamp", "")
            sig = _entry_signature(t)
            if ts and ts in existing_content:
                continue
            if sig in existing_sigs:
                continue
            existing_sigs.add(sig)  # within-batch dedup

            if t.get("status") == "eureka":
                entry = _format_eureka_entry(t, sig)
            else:
                entry = _format_error_entry(t, sig)
            new_entries.append(entry)

        if not new_entries:
            continue

        if not md_path.exists():
            with open(md_path, "w", encoding="utf-8") as f:
                f.write(f"# Insight: {entity_id}\n\n")
                f.write("Auto-generated from traces (errors + eureka moments).\n\n")
                for entry in new_entries:
                    f.write(entry + "\n\n")
        else:
            with open(md_path, "a", encoding="utf-8") as f:
                for entry in new_entries:
                    f.write("\n" + entry + "\n\n")

        updated.append(entity_id)

    return updated


def _format_error_entry(t: dict, sig: str) -> str:
    ts = t.get("timestamp", "")
    problem = t.get("problem", "Error")
    cause = t.get("cause", "Unknown")
    fix = t.get("fix", "")
    lesson = t.get("lesson", "")
    error = t.get("error", "")

    lines = [f"## [{ts}] {problem}", f"<!-- sig: {sig} -->", ""]
    lines.append(f"- **Problem**: {problem}")
    lines.append(f"- **Cause**: {cause}")
    if fix:
        lines.append(f"- **Fix**: {fix}")
    if lesson and not _GENERIC_LESSON_RE.match(lesson):
        lines.append(f"- **Lesson**: {lesson}")
    if error and error != cause and len(error) > 10:
        lines.append(f"- **Error**: `{error[:200]}`")

    return "\n".join(lines)


def _format_eureka_entry(t: dict, sig: str) -> str:
    ts = t.get("timestamp", "")
    entity_id = t.get("entity_id", "unknown")
    challenge = t.get("challenge", "")
    detours = t.get("detours", "")
    solution = t.get("solution", "")
    insight = t.get("insight", "")
    prior_count = t.get("prior_failure_count", 0)

    header = f"EUREKA: {entity_id} succeeded"
    if prior_count:
        header += f" after {prior_count} attempt{'s' if prior_count > 1 else ''}"

    lines = [f"## [{ts}] {header}", f"<!-- sig: {sig} -->", ""]
    if challenge:
        lines.append(f"- **Challenge**: {challenge}")
    if detours:
        lines.append(f"- **Detours**: {detours}")
    if solution:
        lines.append(f"- **Solution**: {solution}")
    if insight:
        lines.append(f"- **Insight**: {insight}")
    lines.append("- **Polarity**: positive")

    return "\n".join(lines)


def write_checkpoint(error_traces: list[dict], eureka_traces: list[dict]) -> Path | None:
    if not TRACE_DIR or (not error_traces and not eureka_traces):
        return None

    TRACE_DIR.mkdir(parents=True, exist_ok=True)
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    md_path = TRACE_DIR / f"{today}.md"
    now = datetime.now(timezone.utc).strftime("%H:%M:%S UTC")

    lines = [f"\n## Checkpoint {now}\n"]

    seen = set()
    discoveries = []
    for t in error_traces:
        entity = t.get("entity_id", "unknown")
        lesson = t.get("lesson", "")
        if lesson and entity not in seen:
            seen.add(entity)
            discoveries.append(f"- **{entity}**: {lesson}")

    if discoveries:
        lines.append("### Discoveries")
        lines.extend(discoveries)
        lines.append("")

    decisions = []
    for t in error_traces:
        cause = t.get("cause", "")
        if cause and cause not in ("Unknown", "See trace error"):
            decisions.append(f"- {t.get('entity_id', '?')}: {cause}")
    if decisions:
        lines.append("### Decisions")
        lines.extend(decisions[:10])
        lines.append("")

    if eureka_traces:
        lines.append("### Eureka Moments")
        for t in eureka_traces:
            entity = t.get("entity_id", "unknown")
            insight = t.get("insight", "breakthrough")
            n = t.get("prior_failure_count", 0)
            suffix = f" (after {n} attempt{'s' if n > 1 else ''})" if n else ""
            lines.append(f"- **{entity}**: {insight}{suffix}")
        lines.append("")

    content = "\n".join(lines)

    if not md_path.exists():
        content = f"# Session Checkpoint — {today}\n" + content

    with open(md_path, "a", encoding="utf-8") as f:
        f.write(content)

    return md_path


# ── Phase 2: Auto-evolve (pattern extraction + decay) ─────────────────

def _load_evolution_state() -> dict:
    if EVOLUTION_STATE_FILE and EVOLUTION_STATE_FILE.exists():
        try:
            with open(EVOLUTION_STATE_FILE) as f:
                return json.load(f)
        except (json.JSONDecodeError, OSError):
            pass
    return {"last_run": None, "last_trace_count": 0}


def _save_evolution_state(state: dict) -> None:
    if not EVOLUTION_STATE_FILE:
        return
    EVOLUTION_STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(EVOLUTION_STATE_FILE, "w") as f:
        json.dump(state, f)


def _count_traces_since(since_iso: str | None) -> tuple[int, int]:
    """Count (total, failed) traces since a timestamp."""
    if not TRACE_DIR or not TRACE_DIR.exists():
        return 0, 0

    total = failures = 0
    for fpath in sorted(TRACE_DIR.glob("*.jsonl")):
        try:
            with open(fpath) as fh:
                for line in fh:
                    trace = json.loads(line)
                    ts = trace.get("timestamp", "")
                    if since_iso and ts <= since_iso:
                        continue
                    total += 1
                    if trace.get("status") == "failed":
                        failures += 1
        except (json.JSONDecodeError, OSError):
            continue
    return total, failures


def _should_evolve() -> tuple[bool, str]:
    """Decide whether to run evolution. Returns (should_run, reason)."""
    state = _load_evolution_state()
    new_traces, new_failures = _count_traces_since(state.get("last_run"))

    if new_traces < MIN_TRACES_FOR_EVOLUTION:
        return False, ""

    last_run = state.get("last_run")
    if last_run:
        try:
            last_dt = datetime.fromisoformat(last_run)
            hours_since = (datetime.now(timezone.utc) - last_dt).total_seconds() / 3600
            if hours_since < MIN_HOURS_BETWEEN_EVOLUTIONS:
                return False, ""
        except ValueError:
            pass

    return True, f"{new_traces} traces ({new_failures} failures)"


def _run_evolution() -> str | None:
    """Run the evolution engine. Returns summary or None on failure."""
    try:
        # Add project root to path so we can import ace.core
        if ACE_ROOT:
            sys.path.insert(0, ACE_ROOT)

        from ace.core.evolution.trace import TraceStore, ExecutionTrace
        from ace.core.evolution.patterns import extract_all_patterns
        from ace.core.knowledge.manager import KnowledgeManager
        from ace.core.storage.file_storage import FileStorage
        from ace.core.memory.evolution_bridge import EvolutionBridge
        from ace.core.memory.manager import MemoryManager

        store = TraceStore()
        state = _load_evolution_state()
        since = state.get("last_run")
        if not since:
            since = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()

        traces = store.query(since=since, limit=5000)
        if not traces:
            return None

        # Pattern extraction
        candidates = extract_all_patterns(traces)
        if not candidates:
            _save_evolution_state({
                "last_run": datetime.now(timezone.utc).isoformat(),
                "last_trace_count": len(traces),
            })
            return None

        # Store insights that pass the confidence threshold
        km = KnowledgeManager(FileStorage())
        created = 0

        async def store_candidates():
            nonlocal created
            for c in candidates:
                if c.confidence >= CONFIDENCE_THRESHOLD:
                    try:
                        await km.create_knowledge_versioned(c.to_knowledge_dict())
                        created += 1
                    except Exception as ex:
                        log_hook_error("stop-reflect/store_candidate", ex)
            # Decay old insights
            try:
                await km.decay_all()
            except Exception as ex:
                log_hook_error("stop-reflect/decay_all", ex)

        asyncio.run(store_candidates())

        # Sync to entity memories
        memory_count = 0
        try:
            bridge = EvolutionBridge(MemoryManager())
            all_knowledge = asyncio.run(km.list_knowledge(page_size=1000))
            recent_knowledge = [
                item for item in all_knowledge.get("items", [])
                if item.get("created_at", "") >= since
            ]
            memory_count, _memory_ids = bridge.sync_insights_batch(recent_knowledge)
        except Exception as ex:
            log_hook_error("stop-reflect/memory_sync", ex)

        _save_evolution_state({
            "last_run": datetime.now(timezone.utc).isoformat(),
            "last_trace_count": len(traces),
        })

        parts = []
        if created:
            parts.append(f"{len(candidates)} patterns → {created} new insights")
        if memory_count:
            parts.append(f"{memory_count} memories synced")
        if parts:
            return f"{' | '.join(parts)} from {len(traces)} traces"
        return None

    except Exception as ex:
        # Evolution failure should never block the hook, but it must be
        # visible — silent failures are the reason the loop went unnoticed
        # for so long.
        log_hook_error("stop-reflect/run_evolution", ex)
        return None


# ── Cleanup ────────────────────────────────────────────────────────────

def cleanup_session_state() -> None:
    if SESSION_FAILURES_FILE and SESSION_FAILURES_FILE.exists():
        try:
            SESSION_FAILURES_FILE.unlink()
        except OSError:
            pass


def _total_session_failures() -> int:
    """Count total failures recorded in the session failures file."""
    if not SESSION_FAILURES_FILE or not SESSION_FAILURES_FILE.exists():
        return 0
    try:
        data = json.loads(SESSION_FAILURES_FILE.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return 0
    if isinstance(data, int):
        return data
    if not isinstance(data, dict):
        return 0
    total = 0
    for value in data.values():
        if isinstance(value, int):
            total += value
        elif isinstance(value, dict):
            total += sum(v for v in value.values() if isinstance(v, int))
    return total


def _maybe_traceback_suggestion() -> str | None:
    """Suggest traceback upload if the session ended with repeated failures."""
    total = _total_session_failures()
    if total < _TRACEBACK_SUGGEST_FAILURE_THRESHOLD:
        return None
    return (
        "[ACE] 本 session 记录了多次失败。"
        "需要运行 /ace:doctor 做本地诊断或 /ace:traceback 上报售后团队吗？"
    )


# ── Main ───────────────────────────────────────────────────────────────

def main():
    try:
        json.load(sys.stdin)
    except (json.JSONDecodeError, EOFError):
        pass

    # Phase 1: Reflect
    error_traces, eureka_traces = load_traces()
    reflect_summary = ""

    if error_traces or eureka_traces:
        updated_entities = write_insight_markdown(error_traces, eureka_traces)
        write_checkpoint(error_traces, eureka_traces)

        if updated_entities:
            n_errors = len(error_traces)
            n_eurekas = len(eureka_traces)
            parts = []
            if n_errors:
                parts.append(f"{n_errors} error{'s' if n_errors > 1 else ''}")
            if n_eurekas:
                parts.append(f"{n_eurekas} eureka{'s' if n_eurekas > 1 else ''}")
            entities_str = ", ".join(updated_entities[:5])
            reflect_summary = f"{', '.join(parts)} → insights for: {entities_str}"

    # Phase 2: Auto-evolve
    evolve_summary = ""
    should_evolve, reason = _should_evolve()
    if should_evolve:
        evolve_summary = _run_evolution() or ""

    # Clean up
    cleanup_session_state()

    # Report
    parts = []
    if reflect_summary:
        parts.append(reflect_summary)
    if evolve_summary:
        parts.append(f"evolved: {evolve_summary}")

    system_messages: list[str] = []
    if parts:
        system_messages.append(f"[ACE] {' | '.join(parts)}")

    traceback_suggestion = _maybe_traceback_suggestion()
    if traceback_suggestion:
        system_messages.append(traceback_suggestion)

    if system_messages:
        print(json.dumps({
            "systemMessage": " ".join(system_messages)
        }))

    sys.exit(0)


if __name__ == "__main__":
    main()
