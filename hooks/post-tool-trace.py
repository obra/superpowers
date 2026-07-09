#!/usr/bin/env python3
"""ACE PostToolUse/PostToolUseFailure hook — trace errors with PCFL + detect eureka moments.

Registered for BOTH events (hooks.json): Claude Code fires PostToolUse only
when a tool call succeeds; failures fire PostToolUseFailure instead. The real
payload carries `tool_response` (no exit_code) — the event name itself is the
failure signal. Legacy `tool_result` + `exit_code` payloads are still accepted
for tests and older harnesses.

Creates traces for two kinds of significant events:
1. Failures: errors with Problem→Cause→Fix→Lesson (PCFL) reflection
2. Eurekas: milestone successes after genuine struggle (CDSI reflection)

Also feeds ACE Doctor: consecutive tool-failure counting and workflow
execution failures produce an immediate user-visible suggestion
(systemMessage) to run /ace:doctor or /ace:traceback.

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

ACE_ROOT = os.environ.get("ACE_ROOT") or os.environ.get("CLAUDE_PROJECT_DIR", "")

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _ace_config import (  # noqa: E402
    TRACE_DIR,
    INSIGHT_DIR,
    SESSION_FAILURES_FILE,
    MEANINGFUL_PATTERNS,
    TRANSIENT_CAUSES,
)
from _ace_doctor import (  # noqa: E402
    bump_consecutive_failures,
    claude_context,
    doctor_config,
    read_session_state,
    record_session_key,
    user_hint,
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


def _capture_module():
    """Load the shared P2 capture policy from ace.core (multi-tool + sampling)."""
    if not ACE_ROOT:
        return None
    import importlib.util

    module_path = os.path.join(ACE_ROOT, "src", "core", "evolution", "capture.py")
    if os.path.isfile(module_path):
        spec = importlib.util.spec_from_file_location("ace_capture", module_path)
        if spec and spec.loader:
            mod = importlib.util.module_from_spec(spec)
            # Register before exec: @dataclass fields resolve cls.__module__
            # via sys.modules, which is None for an unregistered module.
            sys.modules[spec.name] = mod
            try:
                spec.loader.exec_module(mod)
                return mod
            except Exception:  # noqa: BLE001 — capture is best-effort
                sys.modules.pop(spec.name, None)
                return None
    src = os.path.join(ACE_ROOT, "src")
    if src not in sys.path:
        sys.path.insert(0, src)
    try:
        from ace.core.evolution import capture

        return capture
    except ImportError:
        return None


_BASH_PCFL = _bash_pcfl_module()
_CAPTURE = _capture_module()

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


def _tool_response(data: dict) -> dict:
    """兼容真实 payload（tool_response）与旧测试形状（tool_result）。"""
    resp = data.get("tool_response")
    if not isinstance(resp, dict):
        resp = data.get("tool_result")
    return resp if isinstance(resp, dict) else {}


def _is_failure(data: dict, tool_response: dict) -> bool:
    """判定本次工具调用是否失败。

    真实环境：失败走 PostToolUseFailure 事件（PostToolUse 只在成功时触发），
    事件名本身即失败信号；tool_response 里没有 exit_code。
    兼容旧形状：显式 exit_code != 0 也视为失败。
    """
    if data.get("hook_event_name") == "PostToolUseFailure":
        return True
    exit_code = tool_response.get("exit_code")
    return isinstance(exit_code, int) and exit_code != 0


_WORKFLOW_CMD_RE = re.compile(
    r"\bworkflow\b.*\b(run|execute)\b|\b(run|execute)\b.*\bworkflow\b|\bace\s+run\b",
    re.IGNORECASE,
)


def _is_workflow_command(cmd: str) -> bool:
    """判断命令是否是一次工作流执行。"""
    if _WORKFLOW_CMD_RE.search(cmd):
        return True
    entity_type, _ = _detect_entity(cmd)
    return entity_type == "workflow"


def should_trace(tool_name: str, tool_input: dict, failed: bool) -> str | None:
    """Determine trace type: None (skip), 'failure', or 'eureka'."""
    if tool_name != "Bash":
        return None

    cmd = tool_input.get("command", "")

    if not _is_meaningful_command(cmd):
        return None

    if failed:
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
    tool_response = _tool_response(data)

    cmd = tool_input.get("command", "")
    exit_code = tool_response.get("exit_code", 1)
    stdout = tool_response.get("stdout", "") or ""
    stderr = tool_response.get("stderr", "") or ""
    error = stderr[:500] or stdout[:500] or str(data.get("error") or "")[:500]

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
    tool_response = _tool_response(data)

    cmd = tool_input.get("command", "")
    stdout = tool_response.get("stdout", "") or ""

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


def handle_extended_capture(data: dict) -> bool:
    """P2 — capture beyond Bash failures: Edit/Write/API + sampled successes.

    Runs only when the Bash failure/eureka path did not fire. Delegates the
    policy (status, entity, sampling) to ``ace.core.evolution.capture`` so it
    stays testable. Returns True if a trace was written.
    """
    if _CAPTURE is None:
        return False

    tool_name = data.get("tool_name", "")
    tool_input = data.get("tool_input", {})
    tool_result = data.get("tool_result", {})

    # Bash meaningfulness is decided by MEANINGFUL_PATTERNS; non-Bash tools let
    # the capture module apply its own file/API gate.
    if tool_name == "Bash":
        meaningful = _is_meaningful_command(tool_input.get("command", ""))
    else:
        meaningful = None

    decision = _CAPTURE.classify_event(
        tool_name, tool_input, tool_result, meaningful=meaningful
    )
    if not decision.capture:
        return False

    if decision.kind == "success":
        trace = _CAPTURE.build_success_trace(tool_name, tool_input, tool_result, decision)
        trace["timestamp"] = datetime.now(timezone.utc).isoformat()
        append_trace(trace)
        return True

    if decision.kind == "failure":
        # Non-Bash (or Bash semantic-only) failure the rich PCFL path missed.
        result = tool_result or {}
        error = str(result.get("error") or result.get("stderr") or result.get("stdout") or "")[:500]
        trace = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "entity_type": decision.entity_type,
            "entity_id": decision.entity_id,
            "status": "failed",
            "inputs": (
                {"command": tool_input.get("command", "")}
                if tool_name == "Bash"
                else {"tool": tool_name, "target": decision.entity_id}
            ),
            "outputs": {},
            "error": error,
            "tags": decision.tags,
            "significance": decision.significance,
        }
        append_trace(trace)
        print(json.dumps({
            "systemMessage": f"[ACE] Traced {tool_name} failure: {decision.entity_type}/{decision.entity_id}"
        }))
        return True

    return False
def _doctor_checks(data: dict, failed: bool) -> tuple[list[str], list[str]]:
    """ACE Doctor 即时触发：连续失败达到阈值、工作流执行失败。

    返回 (给用户的 systemMessage 列表, 给 Claude 的 additionalContext 列表)。
    """
    session_id = data.get("session_id") or ""
    if not session_id or data.get("tool_name") != "Bash":
        return [], []

    count = bump_consecutive_failures(session_id, failed)
    if not failed:
        return [], []

    messages: list[str] = []
    contexts: list[str] = []
    cfg = doctor_config()
    state = read_session_state(session_id)

    threshold = int(cfg["consecutive_failure_threshold"])
    if count >= threshold and "consecutive_failures" not in state:
        record_session_key(session_id, "consecutive_failures")
        detail = f"连续 {count} 次工具调用失败"
        messages.append(user_hint("consecutive_failures", detail))
        contexts.append(claude_context("consecutive_failures", detail))

    cmd = (data.get("tool_input") or {}).get("command", "")
    if cmd and _is_workflow_command(cmd) and "workflow_failure" not in state:
        record_session_key(session_id, "workflow_failure")
        _, entity_id = _detect_entity(cmd)
        detail = f"workflow '{entity_id}' 执行失败"
        messages.append(user_hint("workflow_failure", detail))
        contexts.append(claude_context("workflow_failure", detail))

    return messages, contexts


def main():
    try:
        data = json.load(sys.stdin)
    except (json.JSONDecodeError, EOFError):
        sys.exit(0)

    tool_response = _tool_response(data)
    failed = _is_failure(data, tool_response)

    messages: list[str] = []

    trace_type = should_trace(
        data.get("tool_name", ""),
        data.get("tool_input", {}),
        failed,
    )

    if trace_type == "failure":
        trace = extract_failure_trace(data)
        append_trace(trace)
        messages.append(
            f"[ACE] Error traced: {trace['entity_type']}/{trace['entity_id']} — {trace['cause']}"
        )
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
        messages.append(
            f"[ACE] Eureka! {trace['entity_type']}/{trace['entity_id']} "
            f"succeeded after {n} attempt{'s' if n > 1 else ''} — {trace['insight']}"
        )
    else:
        # No significant Bash event — try the broadened P2 capture policy
        # (multi-tool failures + sampled positive successes). Best-effort.
        try:
            handle_extended_capture(data)
        except Exception:  # noqa: BLE001 — hooks must never break the tool call
            pass

    doctor_messages, doctor_contexts = _doctor_checks(data, failed)
    messages.extend(doctor_messages)

    output: dict = {}
    if messages:
        output["systemMessage"] = "\n".join(messages)
    if doctor_contexts:
        output["hookSpecificOutput"] = {
            "hookEventName": data.get("hook_event_name")
            or ("PostToolUseFailure" if failed else "PostToolUse"),
            "additionalContext": "\n".join(doctor_contexts),
        }
    if output:
        print(json.dumps(output, ensure_ascii=False))

    sys.exit(0)


if __name__ == "__main__":
    main()
