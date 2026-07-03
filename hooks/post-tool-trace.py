#!/usr/bin/env python3
"""ACE PostToolUse hook — trace errors with PCFL + detect eureka moments.

Creates traces for two kinds of significant events:
1. Failures: errors with Problem→Cause→Fix→Lesson (PCFL) reflection
2. Eurekas: milestone successes after genuine struggle (CDSI reflection)

A eureka is NOT defined by failure count. Even 1 substantive failure
followed by success is a breakthrough — the resolution of real confusion.

What IS a eureka:
- Success for an entity that previously failed with a substantive cause
- A debugging journey that uncovered a fundamental issue

What is NOT a eureka:
- First-try success (no struggle = no insight)
- Retry of identical command that passes (flaky, not learned)
"""
import json
import sys
import os
import re
from datetime import datetime, timezone
from pathlib import Path

ACE_ROOT = os.environ.get("CLAUDE_PROJECT_DIR", "")

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _ace_config import (  # noqa: E402
    TRACE_DIR,
    INSIGHT_DIR,
    SESSION_FAILURES_FILE,
    MEANINGFUL_PATTERNS,
    TRANSIENT_CAUSES,
)


def _bash_pcfl_module():
    """Load shared PCFL helpers from ace.core when project root is set."""
    if not ACE_ROOT:
        return None
    import importlib.util

    module_path = os.path.join(ACE_ROOT, "src", "core", "evolution", "bash_pcfl.py")
    if os.path.isfile(module_path):
        spec = importlib.util.spec_from_file_location("ace_bash_pcfl", module_path)
        if spec and spec.loader:
            mod = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(mod)
            return mod

    src = os.path.join(ACE_ROOT, "src")
    if src not in sys.path:
        sys.path.insert(0, src)
    try:
        from ace.core.evolution import bash_pcfl

        return bash_pcfl
    except ImportError:
        return None


_BASH_PCFL = _bash_pcfl_module()

# Subset of MEANINGFUL_PATTERNS that block the main flow when they fail.
# These get an immediate insight write (don't wait for session Stop).
BLOCKER_PATTERNS = [
    r"git\s+(clone|submodule)",
    r"(pip|uv)\s+(pip\s+)?install",
    r"python.*-m\s+pip",
]

# Transient causes that don't represent genuine struggle
TRANSIENT_CAUSES = {"Timeout", "Connection error"}


def _is_meaningful_command(cmd: str) -> bool:
    """Check if command is worth tracing."""
    return any(re.search(p, cmd) for p in MEANINGFUL_PATTERNS)


def _is_blocker_command(cmd: str) -> bool:
    """Check if command is an environment setup step that blocks the main flow."""
    return any(re.search(p, cmd) for p in BLOCKER_PATTERNS)


def _detect_entity(cmd: str) -> tuple[str, str]:
    if _BASH_PCFL:
        return _BASH_PCFL.detect_entity(cmd)
    entity_type = "command"
    entity_id = cmd.split()[0] if cmd else "unknown"
    match = re.search(r"workflow\s+(?:run|execute)\s+(\S+)", cmd, re.IGNORECASE)
    if match:
        return "workflow", match.group(1)
    if "workflow" in cmd.lower():
        entity_type = "workflow"
        match = re.search(r"workflow\S*\s+(\S+)", cmd)
        entity_id = match.group(1) if match else "workflow_run"
    return entity_type, entity_id


def should_trace(tool_name: str, tool_input: dict, tool_result: dict) -> str | None:
    """Determine trace type: None (skip), 'failure', or 'eureka'."""
    if tool_name != "Bash":
        return None

    cmd = tool_input.get("command", "")
    exit_code = tool_result.get("exit_code", -1)

    if not _is_meaningful_command(cmd):
        return None

    if exit_code != 0:
        return "failure"

    # Success on meaningful command — check for prior struggle
    _, entity_id = _detect_entity(cmd)
    prior = _get_prior_failures(entity_id)
    if prior and _is_substantive_resolution(prior, cmd):
        return "eureka"

    return None  # trivial success, skip


def _get_prior_failures(entity_id: str) -> list[dict]:
    """Read prior failures for this entity from session state."""
    if not SESSION_FAILURES_FILE or not SESSION_FAILURES_FILE.exists():
        return []
    try:
        data = json.loads(SESSION_FAILURES_FILE.read_text(encoding="utf-8"))
        return data.get(entity_id, [])
    except (json.JSONDecodeError, OSError):
        return []


def _is_substantive_resolution(prior_failures: list[dict], success_cmd: str) -> bool:
    """A eureka requires genuine struggle, not trivial retry."""
    if not prior_failures:
        return False
    last = prior_failures[-1]
    # If only failure was transient and same command → not eureka (flaky)
    if (
        len(prior_failures) == 1
        and last.get("cause") in TRANSIENT_CAUSES
        and last.get("command") == success_cmd
    ):
        return False
    # Any substantive failure → eureka
    return True


def _record_session_failure(entity_id: str, cause: str, error: str, cmd: str) -> None:
    """Append a failure to the session state file."""
    if not SESSION_FAILURES_FILE:
        return
    SESSION_FAILURES_FILE.parent.mkdir(parents=True, exist_ok=True)

    data = {}
    if SESSION_FAILURES_FILE.exists():
        try:
            data = json.loads(SESSION_FAILURES_FILE.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            data = {}

    data.setdefault(entity_id, []).append({
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "cause": cause,
        "error_snippet": error[:200] if error else "",
        "command": cmd,
    })

    SESSION_FAILURES_FILE.write_text(json.dumps(data, indent=2), encoding="utf-8")


def _clear_session_failures(entity_id: str) -> None:
    """Clear failure history for an entity after eureka (struggle resolved)."""
    if not SESSION_FAILURES_FILE or not SESSION_FAILURES_FILE.exists():
        return
    try:
        data = json.loads(SESSION_FAILURES_FILE.read_text(encoding="utf-8"))
        if entity_id in data:
            del data[entity_id]
            SESSION_FAILURES_FILE.write_text(json.dumps(data, indent=2), encoding="utf-8")
    except (json.JSONDecodeError, OSError):
        pass


def extract_failure_trace(data: dict) -> dict:
    """Extract a failure trace with PCFL reflection."""
    tool_name = data.get("tool_name", "")
    tool_input = data.get("tool_input", {})
    tool_result = data.get("tool_result", {})

    cmd = tool_input.get("command", "")
    exit_code = tool_result.get("exit_code", -1)
    stdout = tool_result.get("stdout", "")
    stderr = tool_result.get("stderr", "")
    error = stderr[:500] if stderr else stdout[:500]

    # PCFL reflection on the error
    if _BASH_PCFL:
        pcfl = _BASH_PCFL.build_failure_pcfl(cmd, error)
        entity_type = pcfl["entity_type"]
        entity_id = pcfl["entity_id"]
        problem = pcfl["problem"]
        cause = pcfl["cause"]
        fix = pcfl["fix"]
        lesson = pcfl["lesson"]
    else:
        entity_type, entity_id = _detect_entity(cmd)
        problem = f"{entity_type} '{entity_id}' failed"
        cause = _analyze_cause(error)
        fix = ""
        lesson = _extract_lesson(entity_id, error)

    # Duration from output
    duration = None
    duration_match = re.search(r"(\d+\.\d+)s", stdout)
    if duration_match:
        duration = float(duration_match.group(1))

    _record_session_failure(entity_id, cause, error, cmd)

    trace = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "entity_type": entity_type,
        "entity_id": entity_id,
        "status": "failed",
        "inputs": {"command": cmd},
        "outputs": {"exit_code": exit_code, "stdout_preview": stdout[:200]},
        "error": error,
        "tags": [f"tool:{tool_name}", f"type:{entity_type}", "significance:high"],
        "significance": "high",
        # PCFL fields
        "problem": problem,
        "cause": cause,
        "fix": fix,
        "lesson": lesson,
    }
    if duration is not None:
        trace["duration_seconds"] = duration

    return trace


def extract_eureka_trace(data: dict) -> dict:
    """Extract a eureka trace with CDSI reflection."""
    tool_name = data.get("tool_name", "")
    tool_input = data.get("tool_input", {})
    tool_result = data.get("tool_result", {})

    cmd = tool_input.get("command", "")
    stdout = tool_result.get("stdout", "")

    entity_type, entity_id = _detect_entity(cmd)
    prior = _get_prior_failures(entity_id)
    n = len(prior)

    # Collect unique causes
    seen_causes = []
    for f in prior:
        cause = f.get("cause", "Unknown")
        if cause not in seen_causes:
            seen_causes.append(cause)

    # CDSI reflection
    challenge = f"{entity_type} '{entity_id}' needed to pass"

    if n == 1:
        detours = f"Hit: {seen_causes[0]}"
    elif len(seen_causes) == 1:
        detours = f"Failed {n} times: {seen_causes[0]}"
    else:
        cause_chain = " → ".join(seen_causes)
        detours = f"{cause_chain} ({n} attempts, explored {len(seen_causes)} different causes)"

    solution = f"{cmd} (exit 0)"

    # Insight: what the journey taught
    if len(seen_causes) == 1:
        insight = f"Resolved {seen_causes[0]} for {entity_id}"
    elif len(seen_causes) >= 2:
        insight = (
            f"Initial diagnosis was {seen_causes[0]}, "
            f"root issue was {seen_causes[-1]}"
        )
    else:
        insight = f"{entity_id} succeeded after {n} attempts"

    # Duration from output
    duration = None
    duration_match = re.search(r"(\d+\.\d+)s", stdout)
    if duration_match:
        duration = float(duration_match.group(1))

    trace = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "entity_type": entity_type,
        "entity_id": entity_id,
        "status": "eureka",
        "inputs": {"command": cmd},
        "outputs": {"exit_code": 0, "stdout_preview": stdout[:200]},
        "tags": [f"tool:{tool_name}", f"type:{entity_type}", "significance:eureka"],
        "significance": "eureka",
        # CDSI fields
        "challenge": challenge,
        "detours": detours,
        "solution": solution,
        "insight": insight,
        "prior_failure_count": n,
        "prior_failures": prior,
    }
    if duration is not None:
        trace["duration_seconds"] = duration

    # Clear session failures — this struggle is resolved
    _clear_session_failures(entity_id)

    return trace


def _analyze_cause(error: str) -> str:
    if not error:
        return "Unknown"
    # Network / connectivity
    if "No such device or address" in error or "could not read Username" in error:
        return "Network unavailable — HTTPS git requires network access; use SSH (git@)"
    if "Connection refused" in error or "connection refused" in error:
        return "Connection refused — service not running"
    if re.search(r"ssh.*Permission denied|Permission denied.*publickey", error):
        return "SSH key not configured — run: ssh-keygen and add key to GitHub"
    if "fatal: repository" in error and "not found" in error.lower():
        return "Repository not found — check URL or access permissions"
    # Package install
    if "build_editable" in error or "Cannot install" in error:
        return "Package not editable-installable — use non-editable install or copy files manually"
    if "No module named" in error:
        pkg = re.search(r"No module named '([^']+)'", error)
        return f"Missing module: {pkg.group(1)}" if pkg else "Missing dependency"
    if "ImportError" in error or "ModuleNotFoundError" in error:
        return "Missing dependency"
    # Python errors
    if "AssertionError" in error or "assert" in error.lower():
        return "Assertion failure"
    if "TypeError" in error:
        return "Type mismatch"
    if "KeyError" in error:
        return "Missing key"
    if "FileNotFoundError" in error:
        return "File not found"
    if "timeout" in error.lower():
        return "Timeout"
    for line in error.split("\n"):
        line = line.strip()
        if line and not line.startswith("Traceback") and not line.startswith("File "):
            return line[:120]
    return "See trace error"


def _extract_lesson(entity_id: str, error: str) -> str:
    if "AssertionError" in error:
        return f"Verify assertions in {entity_id}"
    if "ImportError" in error:
        return f"Check dependencies for {entity_id}"
    if "timeout" in error.lower():
        return f"Add timeout handling for {entity_id}"
    return f"Investigate failures in {entity_id}"


def append_trace(trace: dict) -> None:
    if TRACE_DIR is None:
        return
    TRACE_DIR.mkdir(parents=True, exist_ok=True)
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    with open(TRACE_DIR / f"{today}.jsonl", "a") as f:
        f.write(json.dumps(trace) + "\n")


def write_blocker_insight(trace: dict) -> None:
    """Immediately write a negative insight for blocker failures.

    Blockers (git clone, pip install) stop the entire workflow — they should
    surface as warnings in the NEXT session without waiting for Stop hook.
    """
    if INSIGHT_DIR is None:
        return
    INSIGHT_DIR.mkdir(parents=True, exist_ok=True)

    entity_id = trace.get("entity_id", "unknown")
    cause = trace.get("cause", "Unknown")
    lesson = trace.get("lesson", "")
    ts = trace.get("timestamp", "")
    cmd = trace.get("inputs", {}).get("command", "")
    error = trace.get("error", "")

    safe_name = entity_id.replace("/", "_").replace(" ", "_")
    md_path = INSIGHT_DIR / f"{safe_name}.md"

    entry_lines = [
        f"## [{ts}] BLOCKER: {entity_id}",
        "",
        f"- **Polarity**: negative",
        f"- **Type**: blocker",
        f"- **Cause**: {cause}",
        f"- **Lesson**: {lesson or cause}",
    ]
    if cmd:
        entry_lines.append(f"- **Command**: `{cmd[:120]}`")
    if error and error != cause:
        entry_lines.append(f"- **Error**: `{error[:200]}`")

    entry = "\n".join(entry_lines)

    if not md_path.exists():
        md_path.write_text(
            f"# Insight: {entity_id}\n\nAuto-generated blocker insights.\n\n{entry}\n\n",
            encoding="utf-8",
        )
    else:
        existing = md_path.read_text(encoding="utf-8")
        if ts not in existing:
            with open(md_path, "a", encoding="utf-8") as f:
                f.write("\n" + entry + "\n\n")


def main():
    try:
        data = json.load(sys.stdin)
    except (json.JSONDecodeError, EOFError):
        sys.exit(0)

    trace_type = should_trace(
        data.get("tool_name", ""),
        data.get("tool_input", {}),
        data.get("tool_result", {}),
    )

    if trace_type == "failure":
        trace = extract_failure_trace(data)
        append_trace(trace)
        print(json.dumps({
            "systemMessage": f"[ACE] Error traced: {trace['entity_type']}/{trace['entity_id']} — {trace['cause']}"
        }))
    elif trace_type == "eureka":
        trace = extract_eureka_trace(data)
        append_trace(trace)
        n = trace["prior_failure_count"]
        print(json.dumps({
            "systemMessage": (
                f"[ACE] Eureka! {trace['entity_type']}/{trace['entity_id']} "
                f"succeeded after {n} attempt{'s' if n > 1 else ''} — {trace['insight']}"
            )
        }))

    sys.exit(0)


if __name__ == "__main__":
    main()
