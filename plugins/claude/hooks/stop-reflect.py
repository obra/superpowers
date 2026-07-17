#!/usr/bin/env python3
"""ACE Eureka System — reflect + auto-evolve at each Stop (turn end).

Claude Code fires ``Stop`` after every assistant turn. Register with
``"async": true`` so Claude does not wait on this hook (mem0-style).

**Stop (every turn):**
1a. Reflect (traces): PCFL/CDSI → gbrain (exact-id skip only, no embedding)
1c. Flush pending recall applications (utility loop)
1b. Conversational extract + embedding dedup — incremental turns + overlap
2.  Evolve — when evolution thresholds are met (independent gate)

会话状态清理在 session-end-cleanup.py（SessionEnd）；traceback 收尾建议在
stop-doctor.py。此前两者都在这里：Stop 每轮触发导致失败计数每轮清零。
"""
import asyncio
import hashlib
import json
import sys
import os
from datetime import datetime, timezone, timedelta
from pathlib import Path

# Evolution thresholds — single source of truth lives in _ace_config (which
# also reads ~/.ace/config.json overrides). Importing here means a project
# can lower min_traces for dev or raise it for batch runs without editing
# this hook.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _ace_config import (  # noqa: E402
    MIN_TRACES_FOR_EVOLUTION,
    MIN_HOURS_BETWEEN_EVOLUTIONS,
    CONFIDENCE_THRESHOLD,
    EXPERIENCE_DEDUP_ENABLED,
    EXPERIENCE_DEDUP_THRESHOLD,
    CONVERSATION_EXTRACT_CURSOR_FILE,
    CONVERSATION_EXTRACT_OVERLAP_TURNS,
    TRACE_DIR,
    EVOLUTION_STATE_FILE,
    log_hook_error,
    ensure_ace_importable,
    project_source_id,
    load_recall_state,
    save_recall_state,
    safe_json_read,
    safe_json_write,
)

# Local aliases for historical call sites that used a private _ACE_HOME layout.
_ACE_HOME = TRACE_DIR.parent.parent if TRACE_DIR is not None else Path.home() / ".ace"
if TRACE_DIR is None:
    TRACE_DIR = _ACE_HOME / "store" / "traces"
if EVOLUTION_STATE_FILE is None:
    EVOLUTION_STATE_FILE = _ACE_HOME / ".evolution_state.json"


# ── Phase 1a: Reflect (traces → gbrain experiences + checkpoint) ──────

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
# import-failure risk in production sessions. Drops non-actionable
# reflections before they are synced to gbrain and derives a stable
# signature so re-runs of the same trace do not create duplicate pages.

_VAGUE_CAUSES = {"", "unknown", "see trace error"}


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


def _trace_to_reflect_insight(trace: dict) -> dict:
    """Build an insight-shaped dict from a reflect trace for ExperienceWriter."""
    entity_id = trace.get("entity_id", "unknown")
    entity_type = trace.get("entity_type", "global")
    if entity_type in ("test_run", "command", "env_setup", "simulation"):
        entity_type = "global"
    ts = trace.get("timestamp", "")
    insight_id = f"reflect-{_entry_signature(trace)}"

    if trace.get("status") == "eureka":
        return {
            "id": insight_id,
            "title": f"EUREKA: {entity_id}",
            "insight": trace.get("insight", ""),
            "solution": trace.get("solution", ""),
            "challenge": trace.get("challenge", ""),
            "entity_type": entity_type,
            "entity_id": entity_id,
            "polarity": "positive",
            "created_at": ts,
            "tags": ["reflect", "eureka"],
        }

    return {
        "id": insight_id,
        "title": trace.get("problem", "Error"),
        "problem": trace.get("problem", ""),
        "cause": trace.get("cause", ""),
        "fix": trace.get("fix", ""),
        "lesson": trace.get("lesson", ""),
        "error": trace.get("error", ""),
        "entity_type": entity_type,
        "entity_id": entity_id,
        "polarity": "negative",
        "created_at": ts,
        "tags": ["reflect"],
    }


def sync_reflect_traces_to_experience(
    traces: list[dict],
    *,
    source_id: str | None = None,
) -> list[str]:
    """Write actionable reflect traces to gbrain via ExperienceWriter.

    gbrain is the single source of truth, so this is the only reflect write
    path. Each trace maps to a deterministic ``reflect-<sig>`` page; if that
    page already exists we skip it so lifecycle state (fitness, enabled,
    application counters) is never clobbered by a re-sync of the same trace.

    Runs on the per-turn Stop path, so semantic embedding dedup is disabled —
    only exact id checks keep the write cheap.

    Returns the list of entity_ids that were newly written.
    """
    if not traces:
        return []

    try:
        ensure_ace_importable()
        from ace.core.knowledge.insight_sync import (
            experience_write_enabled,
            insight_to_experience_entry,
        )
        from ace.core.knowledge.experience_service import ExperienceService
        from ace.core.knowledge.semantic_dedup import maybe_merge_experience
    except Exception as ex:
        log_hook_error("stop-reflect/experience_import", ex)
        return []

    if not experience_write_enabled():
        return []

    try:
        service = ExperienceService(project_id=source_id or project_source_id())
    except Exception as ex:
        log_hook_error("stop-reflect/experience_service", ex)
        return []

    written: list[str] = []
    for trace in traces:
        if not _is_actionable(trace):
            continue
        insight = _trace_to_reflect_insight(trace)
        try:
            if service.get(insight["id"]):
                continue  # already on gbrain — don't clobber lifecycle state
        except Exception:
            pass
        try:
            entry = insight_to_experience_entry(insight, source="reflect")
            # Stop path: skip embedding — exact id gate above is enough.
            asyncio.run(
                maybe_merge_experience(
                    service,
                    entry,
                    enabled=False,
                )
            )
            written.append(trace.get("entity_id", "unknown"))
        except Exception as ex:
            log_hook_error("stop-reflect/experience_write", ex)
    return written


def reflect_to_experience(
    error_traces: list[dict],
    eureka_traces: list[dict],
    *,
    source_id: str | None = None,
) -> list[str]:
    """Reflect phase: persist actionable traces to gbrain only.

    Legacy per-entity insight markdown (③, ~/.ace/insights/*.md) is retired —
    reflect content now lives solely in gbrain. Returns the unique list of
    entity_ids that were written (for the session summary message).
    """
    written = sync_reflect_traces_to_experience(
        error_traces + eureka_traces,
        source_id=source_id,
    )
    # De-duplicate while preserving first-seen order for a stable message.
    seen: set[str] = set()
    unique: list[str] = []
    for entity_id in written:
        if entity_id not in seen:
            seen.add(entity_id)
            unique.append(entity_id)
    return unique


# ── Phase 1b: Conversational memory (transcript → preferences/facts/etc.) ──

def _load_extract_cursor_state() -> dict:
    if not CONVERSATION_EXTRACT_CURSOR_FILE:
        return {"sessions": {}}
    data = safe_json_read(CONVERSATION_EXTRACT_CURSOR_FILE)
    if not isinstance(data, dict):
        return {"sessions": {}}
    sessions = data.get("sessions")
    if not isinstance(sessions, dict):
        data["sessions"] = {}
    return data


def _save_extract_cursor_state(state: dict) -> None:
    if not CONVERSATION_EXTRACT_CURSOR_FILE:
        return
    safe_json_write(CONVERSATION_EXTRACT_CURSOR_FILE, state)


def _get_turns_processed(session_id: str) -> int:
    state = _load_extract_cursor_state()
    entry = state.get("sessions", {}).get(session_id or "") or {}
    try:
        return max(0, int(entry.get("turns_processed") or 0))
    except (TypeError, ValueError):
        return 0


def _set_turns_processed(session_id: str, turns_processed: int) -> None:
    state = _load_extract_cursor_state()
    sessions = state.setdefault("sessions", {})
    sessions[session_id or ""] = {"turns_processed": int(turns_processed)}
    _save_extract_cursor_state(state)


def reflect_conversation(
    hook_data: dict,
    *,
    source_id: str | None = None,
) -> str:
    """Mine new transcript turns for durable knowledge → gbrain experience.

    Incremental (mem0-style per-turn): only turns after the per-session cursor
    are sent to the LLM, plus a short overlap for multi-turn corrections.
    Advances the cursor only when the LLM call succeeds (including 0 candidates).
    Best-effort and LLM-gated. Returns a short summary string (or ``""``).
    """
    transcript_path = hook_data.get("transcript_path") or ""
    session_id = hook_data.get("session_id") or ""
    cwd = hook_data.get("cwd") or ""

    try:
        ensure_ace_importable()
        from ace.core.agent.jsonl_history import (
            load_session_messages,
            load_transcript_messages,
        )
        from ace.core.evolution.conversation_extractor import (
            extract_memories,
            gate_candidate,
            llm_configured,
            messages_to_turns,
        )
        from ace.core.knowledge.experience_service import ExperienceService
        from ace.core.knowledge.insight_sync import insight_to_experience_entry
        from ace.core.knowledge.semantic_dedup import maybe_merge_experience
    except Exception as ex:
        log_hook_error("stop-reflect/memory_import", ex)
        return ""

    # Extraction needs semantic understanding — nothing sensible to do offline.
    if not llm_configured():
        return ""

    messages = load_transcript_messages(transcript_path)
    if not messages and session_id:
        messages = load_session_messages(cwd or None, session_id)
    turns = messages_to_turns(messages)
    if not turns:
        return ""

    cursor = _get_turns_processed(session_id)
    if cursor >= len(turns):
        return ""

    overlap = max(0, int(CONVERSATION_EXTRACT_OVERLAP_TURNS))
    start = max(0, cursor - overlap)
    window = turns[start:]

    try:
        candidates = asyncio.run(extract_memories(window, session_id=session_id))
    except Exception as ex:
        log_hook_error("stop-reflect/memory_extract", ex)
        return ""

    # LLM succeeded (even with 0 candidates) — advance past all known turns.
    _set_turns_processed(session_id, len(turns))

    if not candidates:
        return ""

    try:
        service = ExperienceService(project_id=source_id or project_source_id())
    except Exception as ex:
        log_hook_error("stop-reflect/memory_service", ex)
        return ""

    written = 0
    for candidate in candidates:
        insight = gate_candidate(candidate)
        try:
            if service.get(insight["id"]):
                continue  # already captured — don't clobber lifecycle state
        except Exception:
            pass
        try:
            entry = insight_to_experience_entry(insight, source="reflect")
            created, _ = asyncio.run(
                maybe_merge_experience(
                    service,
                    entry,
                    enabled=EXPERIENCE_DEDUP_ENABLED,
                    threshold=EXPERIENCE_DEDUP_THRESHOLD,
                )
            )
            if created:
                written += 1
        except Exception as ex:
            log_hook_error("stop-reflect/memory_write", ex)

    if not written:
        return ""
    return f"{written} memor{'ies' if written > 1 else 'y'}"


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
        ensure_ace_importable()

        from ace.core.evolution.trace import TraceStore
        from ace.core.evolution.patterns import extract_all_patterns
        from ace.core.knowledge.experience_service import ExperienceService
        from ace.core.knowledge.experience_lifecycle import ExperienceLifecycle
        from ace.core.knowledge.insight_sync import insight_to_experience_entry

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

        # Persist candidates above threshold directly to gbrain — the single
        # source of truth. Recall, decay and the utility loop all operate here.
        service = ExperienceService(project_id=project_source_id())
        created = 0
        for c in candidates:
            if c.confidence >= CONFIDENCE_THRESHOLD:
                entry = c.to_knowledge_dict()
                try:
                    service.create(insight_to_experience_entry(entry, source="evolution"))
                    created += 1
                except Exception as ex:
                    log_hook_error("stop-reflect/store_candidate", ex)

        # Decay existing experience pages on gbrain.
        try:
            ExperienceLifecycle(service).decay_all()
        except Exception as ex:
            log_hook_error("stop-reflect/decay_all", ex)

        _save_evolution_state({
            "last_run": datetime.now(timezone.utc).isoformat(),
            "last_trace_count": len(traces),
        })

        if created:
            return f"{len(candidates)} patterns → {created} new insights from {len(traces)} traces"
        return None

    except Exception as ex:
        # Evolution failure should never block the hook, but it must be
        # visible — silent failures are the reason the loop went unnoticed
        # for so long.
        log_hook_error("stop-reflect/run_evolution", ex)
        return None


def _flush_pending_applications(cwd: str, source_id: str | None = None) -> str:
    """Record successful applications for per-turn recalled experiences.

    Per-turn recall injects lessons via ``additionalContext`` but has no
    synchronous outcome signal. At session end we treat every shown lesson
    as a successful application so the utility loop can update counters.
    Best-effort: errors are swallowed and pending ids are cleared regardless.
    """
    state = load_recall_state(cwd)
    pending = list(state.get("pending_applications") or [])
    if not pending:
        return ""

    recorded = 0
    try:
        ensure_ace_importable()
        from ace.core.knowledge.experience_service import ExperienceService
        from ace.core.knowledge.insight_sync import experience_write_enabled

        if experience_write_enabled():
            service = ExperienceService(project_id=source_id or project_source_id())
            for entry_id in pending:
                try:
                    service.record_application(entry_id, success=True)
                    recorded += 1
                except Exception as ex:
                    log_hook_error("stop-reflect/pending_application", ex)
    except Exception as ex:
        log_hook_error("stop-reflect/flush_pending", ex)

    state["pending_applications"] = []
    save_recall_state(cwd, state)

    if recorded:
        return f"{recorded} experience application(s) recorded"
    return ""


# ── Stop path (single entry; Claude registers with async:true) ────────

def _emit_summary(parts: list[str]) -> None:
    if parts:
        print(json.dumps({
            "systemMessage": f"[ACE] {' | '.join(parts)}"
        }))


def _run_conversation_extract(hook_data: dict) -> str:
    """Run Phase 1b with a flock so twin Stop hooks only extract once.

    Cursor advance happens inside ``reflect_conversation`` after a successful
    LLM call — this wrapper only serializes concurrent runners.
    """
    state_path = CONVERSATION_EXTRACT_CURSOR_FILE
    if state_path is None:
        try:
            return reflect_conversation(hook_data) or ""
        except Exception as ex:
            log_hook_error("stop-reflect/memory", ex)
            return ""

    lock_path = state_path.with_suffix(state_path.suffix + ".lock")
    state_path.parent.mkdir(parents=True, exist_ok=True)
    try:
        import fcntl

        with open(lock_path, "a+", encoding="utf-8") as lock_fh:
            fcntl.flock(lock_fh, fcntl.LOCK_EX)
            try:
                return reflect_conversation(hook_data) or ""
            finally:
                fcntl.flock(lock_fh, fcntl.LOCK_UN)
    except OSError as ex:
        log_hook_error("stop-reflect/memory_lock", ex)
        try:
            return reflect_conversation(hook_data) or ""
        except Exception as ex2:
            log_hook_error("stop-reflect/memory", ex2)
            return ""
    except Exception as ex:
        log_hook_error("stop-reflect/memory", ex)
        return ""


def _run_evolve_if_due() -> str:
    try:
        should_evolve, _reason = _should_evolve()
        if should_evolve:
            return _run_evolution() or ""
    except Exception as ex:
        log_hook_error("stop-reflect/evolve", ex)
    return ""


def _run_stop(hook_data: dict) -> list[str]:
    """Per-turn Stop: traces + pending flush + incremental extract + evolve."""
    parts: list[str] = []

    error_traces, eureka_traces = load_traces()
    if error_traces or eureka_traces:
        updated_entities = reflect_to_experience(error_traces, eureka_traces)
        write_checkpoint(error_traces, eureka_traces)
        if updated_entities:
            n_errors = len(error_traces)
            n_eurekas = len(eureka_traces)
            bits = []
            if n_errors:
                bits.append(f"{n_errors} error{'s' if n_errors > 1 else ''}")
            if n_eurekas:
                bits.append(f"{n_eurekas} eureka{'s' if n_eurekas > 1 else ''}")
            entities_str = ", ".join(updated_entities[:5])
            parts.append(f"{', '.join(bits)} → insights for: {entities_str}")

    try:
        pending_summary = _flush_pending_applications(hook_data.get("cwd") or "")
        if pending_summary:
            parts.append(pending_summary)
    except Exception as ex:
        log_hook_error("stop-reflect/pending_flush", ex)

    memory_summary = _run_conversation_extract(hook_data)
    if memory_summary:
        parts.append(memory_summary)

    evolve_summary = _run_evolve_if_due()
    if evolve_summary:
        parts.append(f"evolved: {evolve_summary}")

    return parts


# ── Main ───────────────────────────────────────────────────────────────

def main():
    try:
        hook_data = json.load(sys.stdin)
    except (json.JSONDecodeError, EOFError):
        hook_data = {}

    parts = _run_stop(hook_data)
    _emit_summary(parts)
    sys.exit(0)


if __name__ == "__main__":
    main()
