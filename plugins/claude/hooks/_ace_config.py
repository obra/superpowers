"""Shared configuration for ACE Claude Code hooks.

Single source of truth for paths, patterns, thresholds, and helpers.
All three hooks (session-start, post-tool-trace, stop-reflect) import from here.
"""

import fcntl
import json
import os
import sys
from pathlib import Path
from typing import Any

# ── Path Resolution ───────────────────────────────────────────────────

ACE_ROOT = os.environ.get("CLAUDE_PROJECT_DIR", "")

# All paths are None when ACE_ROOT is unset (hooks become no-ops)
ACE_DIR: Path | None = Path(ACE_ROOT) / ".ace" if ACE_ROOT else None
TRACE_DIR: Path | None = ACE_DIR / "traces" if ACE_DIR else None
INSIGHT_DIR: Path | None = ACE_DIR / "insights" if ACE_DIR else None
CHECKPOINT_DIR: Path | None = ACE_DIR / "checkpoints" if ACE_DIR else None
SESSION_FAILURES_FILE: Path | None = ACE_DIR / ".session_failures.json" if ACE_DIR else None
EVOLUTION_STATE_FILE: Path | None = ACE_DIR / ".evolution_state.json" if ACE_DIR else None
CONFIG_FILE: Path | None = ACE_DIR / "config.json" if ACE_DIR else None


# ── User Config (loaded from .ace/config.json if present) ────────────

def _load_user_config() -> dict[str, Any]:
    """Load optional user configuration from .ace/config.json."""
    if not CONFIG_FILE or not CONFIG_FILE.exists():
        return {}
    try:
        return json.loads(CONFIG_FILE.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {}


_USER_CONFIG = _load_user_config()

# ── Command Patterns (extensible via config) ─────────────────────────

_DEFAULT_MEANINGFUL_PATTERNS = [
    r"python.*-m\s+pytest",
    r"python.*ace.*run",
    r"python.*workflow.*execute",
    r"python.*node.*run",
    r"python.*simulate",
    r"ace\s+(run|execute|simulate)",
]

MEANINGFUL_PATTERNS: list[str] = (
    _USER_CONFIG.get("meaningful_patterns", _DEFAULT_MEANINGFUL_PATTERNS)
)

# ── Transient Causes (extensible via config) ─────────────────────────

_DEFAULT_TRANSIENT_CAUSES = {"Timeout", "Connection error"}

TRANSIENT_CAUSES: set[str] = set(
    _USER_CONFIG.get("transient_causes", list(_DEFAULT_TRANSIENT_CAUSES))
)

# ── Cause Analysis Patterns (extensible via config) ──────────────────

_DEFAULT_CAUSE_PATTERNS: list[tuple[str, str]] = [
    ("AssertionError", "Assertion failure"),
    ("assert", "Assertion failure"),
    ("ImportError", "Missing dependency"),
    ("ModuleNotFoundError", "Missing dependency"),
    ("TypeError", "Type mismatch"),
    ("KeyError", "Missing key"),
    ("FileNotFoundError", "File not found"),
    ("timeout", "Timeout"),
]

CAUSE_PATTERNS: list[tuple[str, str]] = _USER_CONFIG.get(
    "cause_patterns", _DEFAULT_CAUSE_PATTERNS
)

# ── Evolution Thresholds (configurable via config) ───────────────────

_evolution_config = _USER_CONFIG.get("evolution", {})
MIN_TRACES_FOR_EVOLUTION: int = _evolution_config.get("min_traces", 15)
MIN_HOURS_BETWEEN_EVOLUTIONS: int = _evolution_config.get("min_hours_between", 2)
CONFIDENCE_THRESHOLD: float = _evolution_config.get("confidence_threshold", 0.3)


# ── Health Check ─────────────────────────────────────────────────────

def check_ace_health() -> str | None:
    """Check if ACE is properly configured. Returns warning message or None."""
    if not ACE_ROOT:
        return (
            "[ACE] WARNING: CLAUDE_PROJECT_DIR not set — tracing disabled. "
            "Run /ace-init to set up."
        )
    if not ACE_DIR or not ACE_DIR.exists():
        return (
            f"[ACE] WARNING: {ACE_DIR} not found — tracing disabled. "
            "Run /ace-init to initialize."
        )
    return None


# ── File Locking Helpers ─────────────────────────────────────────────

def safe_json_read(filepath: Path) -> dict[str, Any]:
    """Read a JSON file with shared (read) lock. Returns {} on any error."""
    if not filepath.exists():
        return {}
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            fcntl.flock(f, fcntl.LOCK_SH)
            try:
                return json.load(f)
            finally:
                fcntl.flock(f, fcntl.LOCK_UN)
    except (json.JSONDecodeError, OSError):
        return {}


def safe_json_write(filepath: Path, data: dict[str, Any]) -> bool:
    """Write a JSON file with exclusive lock. Returns True on success."""
    filepath.parent.mkdir(parents=True, exist_ok=True)
    try:
        with open(filepath, "w", encoding="utf-8") as f:
            fcntl.flock(f, fcntl.LOCK_EX)
            try:
                json.dump(data, f, indent=2)
            finally:
                fcntl.flock(f, fcntl.LOCK_UN)
        return True
    except OSError:
        return False


# ── Error Logging Helper ─────────────────────────────────────────────

def log_hook_error(hook_name: str, error: Exception) -> None:
    """Log a non-blocking hook error to stderr (visible in Claude Code output)."""
    print(f"[ACE] {hook_name} error (non-blocking): {error}", file=sys.stderr)
