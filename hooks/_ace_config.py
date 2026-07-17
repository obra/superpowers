"""Shared configuration for ACE Claude Code hooks.

Single source of truth for paths, patterns, thresholds, and helpers.
All three hooks (session-start, post-tool-trace, stop-reflect) import from here.
"""

import datetime
import fcntl
import hashlib
import json
import os
import sys
from pathlib import Path
from typing import Any


def _parse_bool(value: Any, *, default: bool) -> bool:
    if value is None:
        return default
    if isinstance(value, bool):
        return value
    return str(value).strip().lower() in ("1", "true", "yes", "on")


# ── Path Resolution ───────────────────────────────────────────────────
#
# Two distinct roots (do not conflate):
# - ACE_ROOT / framework root: where the ACE install + .venv live
# - PROJECT_DIR: Claude Code session project (CLAUDE_PROJECT_DIR)
# User state lives under ACE_USER_DIR or ~/.ace once either root (or an
# explicit ACE_USER_DIR) is present.


def _default_user_ace() -> Path:
    raw = os.environ.get("ACE_USER_DIR", "").strip()
    return Path(os.path.expanduser(raw)) if raw else Path.home() / ".ace"


def _looks_like_ace_checkout(path: str) -> bool:
    if not path:
        return False
    root = Path(path)
    return (root / ".venv").is_dir() and (root / "src").is_dir()


def _read_ace_root_from_user_config() -> str:
    """Read ``ace_root`` from the user-level config before ACE_DIR is wired."""
    cfg_path = _default_user_ace() / "config.json"
    if not cfg_path.is_file():
        return ""
    try:
        data = json.loads(cfg_path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return ""
    if not isinstance(data, dict):
        return ""
    raw = data.get("ace_root") or data.get("ACE_ROOT") or ""
    return str(raw).strip() if raw else ""


def _resolve_framework_root(project_dir: str) -> str:
    env_root = os.environ.get("ACE_ROOT", "").strip()
    if env_root:
        return env_root
    from_config = _read_ace_root_from_user_config()
    if from_config:
        return from_config
    if _looks_like_ace_checkout(project_dir):
        return project_dir
    return ""


PROJECT_DIR: str = os.environ.get("CLAUDE_PROJECT_DIR", "").strip()
ACE_ROOT: str = _resolve_framework_root(PROJECT_DIR)


def _ace_home() -> Path | None:
    """Return the ACE user directory used by core path helpers.

    Enabled when a framework root, Claude project, or explicit ACE_USER_DIR
    is present. Trace paths must match ``ace.core.config.paths.ace_traces_dir``.
    """
    if not (
        ACE_ROOT
        or PROJECT_DIR
        or os.environ.get("ACE_USER_DIR", "").strip()
    ):
        return None
    return _default_user_ace()


# All paths are None when there is no framework/project/user context
ACE_DIR: Path | None = _ace_home()
TRACE_DIR: Path | None = ACE_DIR / "store" / "traces" if ACE_DIR else None
INSIGHT_DIR: Path | None = ACE_DIR / "insights" if ACE_DIR else None
CHECKPOINT_DIR: Path | None = ACE_DIR / "checkpoints" if ACE_DIR else None
SESSION_FAILURES_FILE: Path | None = ACE_DIR / ".session_failures.json" if ACE_DIR else None
EVOLUTION_STATE_FILE: Path | None = ACE_DIR / ".evolution_state.json" if ACE_DIR else None
CONFIG_FILE: Path | None = ACE_DIR / "config.json" if ACE_DIR else None


def project_source_id() -> str:
    """Return a stable gbrain source id for the current Claude project.

    Derived from CLAUDE_PROJECT_DIR / PROJECT_DIR only — never from the
    framework ACE_ROOT — so experience buckets follow the user's working
    project. Falls back to ``default`` when no project context.
    """
    if not PROJECT_DIR:
        return "default"
    root = Path(PROJECT_DIR).resolve()
    # Use the last directory name plus a short hash of the full path so
    # different clones/checkouts of the same repo name do not collide.
    name = root.name or "project"
    h = hashlib.md5(str(root).encode("utf-8")).hexdigest()[:8]
    return f"{name}-{h}"


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
    r"ace\s+workflow\s+run",
    r"ace\s+node\s+run",
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
#
# Defaults are tuned so evolution actually runs on real sessions. Empirically
# typical Claude Code sessions produce 3–8 traces; the previous default of
# `min_traces=15` meant evolution never fired and all the pattern-extraction
# code was dead. Override via ~/.ace/config.json {"evolution": {...}} for
# heavier batch sessions where you want fewer, higher-confidence runs.

_evolution_config = _USER_CONFIG.get("evolution", {})
MIN_TRACES_FOR_EVOLUTION: int = _evolution_config.get("min_traces", 3)
MIN_HOURS_BETWEEN_EVOLUTIONS: float = _evolution_config.get("min_hours_between", 0.0)
CONFIDENCE_THRESHOLD: float = _evolution_config.get("confidence_threshold", 0.3)

# ── Semantic Deduplication for conversational/reflect experience writes ─
# A higher threshold means fewer merges (stricter matches); lower means more
# aggressive merging. Disable entirely by setting enabled=false.

_experience_dedup_config = _USER_CONFIG.get("experience_dedup", {})
EXPERIENCE_DEDUP_ENABLED: bool = _parse_bool(
    _experience_dedup_config.get("enabled"), default=True
)
EXPERIENCE_DEDUP_THRESHOLD: float = float(
    _experience_dedup_config.get("threshold", 0.77)
)

# ── Conversational extract cursor (Stop Phase 1b, incremental) ────────
# Each Stop extracts only new transcript turns (plus a short overlap).
# Override via ~/.ace/config.json:
#   {"conversation_extract": {"overlap_turns": 2}}

_conversation_extract_config = _USER_CONFIG.get("conversation_extract", {})
CONVERSATION_EXTRACT_OVERLAP_TURNS: int = int(
    _conversation_extract_config.get("overlap_turns", 2)
)
CONVERSATION_EXTRACT_CURSOR_FILE: Path | None = (
    ACE_DIR / ".conversation_extract_cursor.json" if ACE_DIR else None
)


# ── Health Check ─────────────────────────────────────────────────────

def check_ace_health() -> str | None:
    """Check if ACE is properly configured. Returns warning message or None."""
    if ACE_DIR is None:
        return (
            "[ACE] WARNING: no ACE_ROOT / CLAUDE_PROJECT_DIR / ACE_USER_DIR — "
            "tracing disabled. Set ACE_ROOT or open a project session."
        )
    if not ACE_DIR.exists():
        return (
            f"[ACE] WARNING: {ACE_DIR} not found — tracing disabled. "
            "Run /ace:init to initialize."
        )
    if not ACE_ROOT:
        return (
            "[ACE] WARNING: ACE_ROOT not set — hooks may fail to import ace. "
            "Run make install-global-config or export ACE_ROOT."
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


# ── Recall State Helpers ───────────────────────────────────────────────
# Shared between user-prompt-recall.py and stop-reflect.py so the
# per-turn recall utility loop can be flushed at session end.

RECALL_STATE_NAME = "recall_state.json"


def _recall_state_path(cwd: str) -> Path | None:
    """Return the project-local recall state path, or None when cwd is empty."""
    if not cwd:
        return None
    return Path(cwd) / ".ace" / RECALL_STATE_NAME


def load_recall_state(cwd: str) -> dict[str, Any]:
    """Load recall state with safe defaults for all known fields."""
    path = _recall_state_path(cwd)
    if path is None:
        return {"startup_slugs": [], "turn_slugs": [], "pending_applications": []}
    data = safe_json_read(path)
    return {
        "startup_slugs": list(data.get("startup_slugs") or []),
        "turn_slugs": list(data.get("turn_slugs") or []),
        "pending_applications": list(data.get("pending_applications") or []),
    }


def save_recall_state(cwd: str, state: dict[str, Any]) -> bool:
    """Persist recall state atomically with file locking."""
    path = _recall_state_path(cwd)
    if path is None:
        return False
    return safe_json_write(path, {
        "startup_slugs": list(state.get("startup_slugs") or []),
        "turn_slugs": list(state.get("turn_slugs") or []),
        "pending_applications": list(state.get("pending_applications") or []),
    })


RECALL_LOG_DIR = "logs/user-prompt-recall"


def _safe_session_id(session_id: str) -> str:
    """Sanitize a session id for use in a filename.

    Falls back to ``unknown`` when empty. Replaces path separators and dots to
    keep the log file safely inside ``.ace/logs/user-prompt-recall/``.
    """
    sid = (session_id or "").strip()
    if not sid:
        return "unknown"
    for ch in ("/", "\\", ":", "\x00"):
        sid = sid.replace(ch, "_")
    # Avoid hidden / parent-dir names
    sid = sid.lstrip(".")
    return sid or "unknown"


def _recall_log_path(cwd: str, session_id: str) -> Path | None:
    """Return the session-scoped recall log path, or None when cwd is empty."""
    if not cwd:
        return None
    return Path(cwd) / ".ace" / RECALL_LOG_DIR / f"{_safe_session_id(session_id)}.jsonl"


def append_recall_log(cwd: str, session_id: str, entry: dict[str, Any]) -> bool:
    """Append a JSONL record for a recall event.

    Creates ``.ace/logs/user-prompt-recall/<session_id>.jsonl`` under the
    project directory. File locking keeps concurrent hooks from interleaving
    lines.
    """
    path = _recall_log_path(cwd, session_id)
    if path is None:
        return False
    path.parent.mkdir(parents=True, exist_ok=True)
    try:
        line = json.dumps(entry, ensure_ascii=False, default=str)
        with open(path, "a", encoding="utf-8") as f:
            fcntl.flock(f, fcntl.LOCK_EX)
            try:
                f.write(line + "\n")
            finally:
                fcntl.flock(f, fcntl.LOCK_UN)
        return True
    except (OSError, TypeError, ValueError):
        return False


# ── Trigger Logging Helper ─────────────────────────────────────────────
# Lightweight "the hook fired" log under the global ~/.ace tree so we can
# observe recall hook reach regardless of whether the current project has a
# .ace directory. Uses ``logs/`` (not ``log/``) for consistency with the
# project-level recall block log directory.

TRIGGER_LOG_DIR = "logs/user-prompt-recall"


def append_trigger_log(session_id: str, entry: dict[str, Any]) -> bool:
    """Append a JSONL record to the global trigger log.

    Creates ``~/.ace/logs/user-prompt-recall/<session_id>.jsonl``.
    File locking keeps concurrent hooks from interleaving lines.
    """
    if ACE_DIR is None:
        return False
    path = ACE_DIR / TRIGGER_LOG_DIR / f"{_safe_session_id(session_id)}.jsonl"
    path.parent.mkdir(parents=True, exist_ok=True)
    try:
        line = json.dumps(entry, ensure_ascii=False, default=str)
        with open(path, "a", encoding="utf-8") as f:
            fcntl.flock(f, fcntl.LOCK_EX)
            try:
                f.write(line + "\n")
            finally:
                fcntl.flock(f, fcntl.LOCK_UN)
        return True
    except (OSError, TypeError, ValueError):
        return False


def ensure_ace_importable() -> bool:
    """Register framework venv site-packages so hooks can ``import ace``.

    Uses the framework ``ACE_ROOT`` (env / config / ace-checkout fallback),
    not ``CLAUDE_PROJECT_DIR``. ``site.addsitedir`` (not a bare ``sys.path``
    insert) is required: ace is an editable install whose
    ``__editable__*.pth`` finder only activates when the ``.pth`` is processed.

    If the framework venv is missing but ``ace`` is already importable
    (hooks.json often launches ``$ACE_ROOT/.venv/bin/python``), return True.
    """
    if ACE_ROOT:
        lib = Path(ACE_ROOT) / ".venv" / "lib"
        if lib.is_dir():
            import site

            inserted = False
            for sp_dir in sorted(lib.glob("python*/site-packages")):
                site.addsitedir(str(sp_dir))
                inserted = True
                break
            src = str(Path(ACE_ROOT) / "src")
            if src not in sys.path:
                sys.path.insert(0, src)
            if inserted:
                return True

    try:
        import ace  # noqa: F401
        return True
    except ImportError:
        return False


__all__ = ["project_source_id", "PROJECT_DIR", "ACE_ROOT"]
