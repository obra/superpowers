#!/usr/bin/env python3
"""agent-hub router — classify tasks, route to free-tier AI providers, track usage."""

import argparse  # noqa: F401 — used in Task 4 (CLI)
import json
import os  # noqa: F401 — used in Task 3 (API calls)
import sys  # noqa: F401 — used in Tasks 2-4
import time  # noqa: F401 — used in Task 3 (retry)
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Dict, Optional, Tuple  # Optional/Tuple: noqa: F401 — used in Tasks 2-4

import requests  # noqa: F401 — used in Task 3 (API calls)
from dotenv import load_dotenv  # noqa: F401 — used in Task 3 (API calls)

# ── Paths ──────────────────────────────────────────────────────────────────────
SKILL_DIR = Path(__file__).parent
DATA_DIR = Path.home() / ".claude" / "agent-hub"
ENV_FILE = DATA_DIR / ".env"
USAGE_FILE = DATA_DIR / "usage.json"

# ── Provider config ────────────────────────────────────────────────────────────
PROVIDERS: Dict = {
    "groq": {
        "used_key": "requests_used",
        "limit_key": "requests_limit",
        "limit": 14400,
        "reset_window": "daily",
        "fallback": "gemini",
        "model": "llama-3.3-70b-versatile",
    },
    "codex": {
        "used_key": "requests_used",
        "limit_key": "requests_limit",
        "limit": 500,
        "reset_window": "monthly",
        "fallback": "groq",
        "model": "gpt-4o-mini",
    },
    "gemini": {
        "used_key": "tokens_used",
        "limit_key": "tokens_limit",
        "limit": 1000000,
        "reset_window": "daily",
        "fallback": "minimax",
        "model": "gemini-2.0-flash",
    },
    "minimax": {
        "used_key": "tokens_used",
        "limit_key": "tokens_limit",
        "limit": 1000000,
        "reset_window": "monthly",
        "fallback": "gemini",
        "model": "abab6.5s-chat",
    },
}

TASK_TO_PROVIDER: Dict[str, str] = {
    "code": "codex",
    "research": "gemini",
    "creative": "minimax",
    "fast": "groq",
    "general": "groq",
}

REQUIRED_ENV_KEYS = [
    "GROQ_API_KEY",
    "OPENAI_API_KEY",
    "GEMINI_API_KEY",
    "MINIMAX_API_KEY",
    "MINIMAX_GROUP_ID",
]

FALLBACK_THRESHOLD = 0.10  # below 10% remaining → trigger fallback


# ── Usage state ────────────────────────────────────────────────────────────────

def _window_start(window: str) -> datetime:
    """Return the UTC start of the current reset window."""
    now = datetime.now(timezone.utc)
    if window == "daily":
        return now.replace(hour=0, minute=0, second=0, microsecond=0)
    return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


def _init_usage() -> Dict:
    """Return a fresh usage dict with all counters at zero."""
    daily_start = _window_start("daily").isoformat()
    monthly_start = _window_start("monthly").isoformat()
    return {
        "groq": {
            "requests_used": 0,
            "requests_limit": PROVIDERS["groq"]["limit"],
            "reset_window": "daily",
            "last_reset": daily_start,
        },
        "codex": {
            "requests_used": 0,
            "requests_limit": PROVIDERS["codex"]["limit"],
            "reset_window": "monthly",
            "last_reset": monthly_start,
        },
        "gemini": {
            "tokens_used": 0,
            "tokens_limit": PROVIDERS["gemini"]["limit"],
            "reset_window": "daily",
            "last_reset": daily_start,
        },
        "minimax": {
            "tokens_used": 0,
            "tokens_limit": PROVIDERS["minimax"]["limit"],
            "reset_window": "monthly",
            "last_reset": monthly_start,
        },
    }


def _save_usage(data: Dict) -> None:
    """Atomically write usage state to USAGE_FILE via a .tmp intermediate."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    tmp = USAGE_FILE.with_suffix(".tmp")
    try:
        tmp.write_text(json.dumps(data, indent=2))
        tmp.replace(USAGE_FILE)
    except Exception:
        tmp.unlink(missing_ok=True)
        raise


def _auto_reset(data: Dict) -> Dict:
    """Zero any provider whose reset window has elapsed. Saves if changed."""
    changed = False
    for name, cfg in PROVIDERS.items():
        last_str = data[name]["last_reset"].replace("Z", "+00:00")
        last = datetime.fromisoformat(last_str)
        window_start = _window_start(cfg["reset_window"])
        if last < window_start:
            data[name][cfg["used_key"]] = 0
            data[name]["last_reset"] = window_start.isoformat()
            changed = True
    if changed:
        _save_usage(data)
    return data


def load_usage() -> Dict:
    """Load usage.json. Reinitialize if missing or malformed. Apply auto-resets."""
    try:
        raw = USAGE_FILE.read_text()
        data = json.loads(raw)
        for name in PROVIDERS:
            if name not in data:
                raise ValueError(f"missing provider: {name}")
    except (FileNotFoundError, json.JSONDecodeError, ValueError):
        data = _init_usage()
        _save_usage(data)
    return _auto_reset(data)


def increment_usage(data: Dict, provider: str, amount: int) -> Dict:
    """Increment the usage counter for a provider and persist."""
    cfg = PROVIDERS[provider]
    data[provider][cfg["used_key"]] += amount
    _save_usage(data)
    return data


# ── Classification ─────────────────────────────────────────────────────────────

def classify(task: str) -> str:
    """Classify task text into one of 5 task types."""
    t = task.lower()
    code_signals = [
        "code", "function", "class", "debug", "refactor", "bug", "syntax",
        "implement", "def ", "import ", "return ", "error:", "traceback",
        "write a function", "fix this", "what's wrong with",
    ]
    research_signals = [
        "explain", "summarize", "what is", "how does", "compare", "research",
        "document", "overview", "describe", "analyze", "what are",
    ]
    creative_signals = [
        "story", "creative", "dialogue", "character", "write a story",
        "narrative", "poem", "fiction", "roleplay",
    ]
    fast_signals = [
        "yes or no", "how many", "when was", "who is", "define ",
        "what's the capital", "spell ", "quick question",
    ]
    for s in code_signals:
        if s in t:
            return "code"
    for s in creative_signals:
        if s in t:
            return "creative"
    for s in research_signals:
        if s in t:
            return "research"
    for s in fast_signals:
        if s in t:
            return "fast"
    return "general"


# ── Provider selection ─────────────────────────────────────────────────────────

def _remaining_pct(data: Dict, provider: str) -> float:
    """Return the fraction of budget remaining for a provider (0.0–1.0)."""
    cfg = PROVIDERS[provider]
    used = data[provider][cfg["used_key"]]
    limit = data[provider][cfg["limit_key"]]
    if limit == 0:
        return 0.0
    return (limit - used) / limit


def _is_available(data: Dict, provider: str) -> bool:
    return _remaining_pct(data, provider) > 0


def _needs_fallback(data: Dict, provider: str) -> bool:
    return _remaining_pct(data, provider) <= FALLBACK_THRESHOLD


def select_provider(data: Dict, task_type: str) -> Tuple[str, Optional[str]]:
    """
    Return (provider_to_use, warning_message).
    warning_message is non-None when a fallback is triggered.
    Raises SystemExit when both primary and fallback are exhausted.
    """
    primary = TASK_TO_PROVIDER[task_type]
    fallback = PROVIDERS[primary]["fallback"]

    if _is_available(data, primary) and not _needs_fallback(data, primary):
        return primary, None

    if not _is_available(data, primary):
        if _is_available(data, fallback):
            msg = (
                f"⚠ {primary.capitalize()} at limit — "
                f"routing {task_type} task to {fallback.capitalize()}"
            )
            return fallback, msg
        sys.exit(
            f"[agent-hub] Hard stop: {primary} and {fallback} both exhausted. "
            f"Reset with: python3 router.py reset {primary} && python3 router.py reset {fallback}"
        )

    # primary below threshold but not fully exhausted → use fallback preemptively
    pct = int(_remaining_pct(data, primary) * 100)
    if _is_available(data, fallback):
        msg = (
            f"⚠ {primary.capitalize()} at {pct}% remaining — "
            f"routing {task_type} task to {fallback.capitalize()}"
        )
        return fallback, msg

    # fallback also unavailable — stay on primary while it still has anything
    return primary, f"⚠ {primary.capitalize()} at {pct}% remaining, {fallback} unavailable"


# ── Status bar ─────────────────────────────────────────────────────────────────

def _fmt_number(n: int) -> str:
    if n >= 1_000_000:
        return f"{n // 1_000_000}M"
    if n >= 1_000:
        return f"{n // 1_000}K"
    return str(n)


def format_count(data: Dict, provider: str) -> str:
    """Return 'used/limit' string for a provider.

    The used value is abbreviated with K/M; the limit is abbreviated only
    when it is an exact multiple of 1 000 000 (e.g. 1000000 → '1M'), and
    kept as a raw integer otherwise (e.g. 14400 stays '14400').
    """
    cfg = PROVIDERS[provider]
    used = data[provider][cfg["used_key"]]
    limit = data[provider][cfg["limit_key"]]
    # Abbreviate limit only when it is a clean million
    if limit >= 1_000_000 and limit % 1_000_000 == 0:
        limit_str = f"{limit // 1_000_000}M"
    else:
        limit_str = str(limit)
    return f"{_fmt_number(used)}/{limit_str}"


def _indicator(data: Dict, provider: str) -> str:
    """Return ● (available) or ○ (exhausted) for a provider."""
    pct = _remaining_pct(data, provider)
    if pct <= 0:
        return "○"
    return "●"


def build_status_bar(data: Dict, active_provider: str, warning: Optional[str] = None) -> str:
    """
    Build the status bar string.
    Normal: [PROVIDER ●] Groq: x/y · Codex: x/y · Gemini: x/y · Minimax: x/y
    Fallback (abbreviated): [PROVIDER ●] ⚠ message · Provider: x/y
    """
    ind = _indicator(data, active_provider)
    prefix = f"[{active_provider.upper()} {ind}]"
    fixed_order = ["groq", "codex", "gemini", "minimax"]

    if warning:
        return f"{prefix} {warning} · {active_provider.capitalize()}: {format_count(data, active_provider)}"

    counts = " · ".join(
        f"{p.capitalize()}: {format_count(data, p)}" for p in fixed_order
    )
    return f"{prefix} {counts}"


# ── API calls ──────────────────────────────────────────────────────────────────

def _ensure_env() -> None:
    """Load .env file once. Safe to call multiple times — python-dotenv skips if already loaded."""
    load_dotenv(ENV_FILE)


def call_groq(task: str) -> Tuple[str, int]:
    """Call Groq llama-3.3-70b-versatile. Returns (response_text, request_count=1)."""
    _ensure_env()
    key = os.environ.get("GROQ_API_KEY", "")
    if not key:
        raise ValueError("GROQ_API_KEY not set")
    resp = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={"Authorization": f"Bearer {key}"},
        json={"model": "llama-3.3-70b-versatile",
              "messages": [{"role": "user", "content": task}]},
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()["choices"][0]["message"]["content"], 1


def call_codex(task: str) -> Tuple[str, int]:
    """Call OpenAI gpt-4o-mini. Returns (response_text, request_count=1)."""
    _ensure_env()
    key = os.environ.get("OPENAI_API_KEY", "")
    if not key:
        raise ValueError("OPENAI_API_KEY not set")
    resp = requests.post(
        "https://api.openai.com/v1/chat/completions",
        headers={"Authorization": f"Bearer {key}"},
        json={"model": "gpt-4o-mini",
              "messages": [{"role": "user", "content": task}]},
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()["choices"][0]["message"]["content"], 1


def call_gemini(task: str) -> Tuple[str, int]:
    """Call Gemini 1.5 Flash. Returns (response_text, total_tokens)."""
    _ensure_env()
    key = os.environ.get("GEMINI_API_KEY", "")
    if not key:
        raise ValueError("GEMINI_API_KEY not set")
    resp = requests.post(
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"gemini-2.0-flash:generateContent?key={key}",  # Gemini requires key in URL, not header
        json={"contents": [{"parts": [{"text": task}]}]},
        timeout=30,
    )
    resp.raise_for_status()
    data = resp.json()
    text = data["candidates"][0]["content"]["parts"][0]["text"]
    tokens = data.get("usageMetadata", {}).get("totalTokenCount", 0)
    return text, tokens


def call_minimax(task: str) -> Tuple[str, int]:
    """Call MiniMax abab6.5s-chat. Returns (response_text, total_tokens)."""
    _ensure_env()
    key = os.environ.get("MINIMAX_API_KEY", "")
    group_id = os.environ.get("MINIMAX_GROUP_ID", "")
    if not key:
        raise ValueError("MINIMAX_API_KEY not set")
    if not group_id:
        raise ValueError("MINIMAX_GROUP_ID not set")
    resp = requests.post(
        "https://api.minimax.chat/v1/text/chatcompletion_v2",
        headers={"Authorization": f"Bearer {key}"},
        json={
            "model": "abab6.5s-chat",
            "messages": [{"role": "user", "content": task}],
            "GroupId": group_id,
        },
        timeout=30,
    )
    resp.raise_for_status()
    data = resp.json()
    text = data["choices"][0]["message"]["content"]
    tokens = data.get("usage", {}).get("total_tokens", 0)
    return text, tokens


CALL_MAP: Dict = {
    "groq": call_groq,
    "codex": call_codex,
    "gemini": call_gemini,
    "minimax": call_minimax,
}


def call_with_retry(provider: str, task: str) -> Tuple[str, int]:
    """Call provider with one retry after 1s backoff on transient failures.

    Config errors (ValueError for missing keys) propagate immediately.
    Network/HTTP errors (requests.exceptions.RequestException) are retried once.
    """
    fn = CALL_MAP[provider]
    try:
        return fn(task)
    except requests.exceptions.RequestException:
        time.sleep(1)
        return fn(task)


# ── CLI commands ───────────────────────────────────────────────────────────────

def cmd_route(args: argparse.Namespace) -> None:
    """Route a task: classify → select provider → call → track usage → print response."""
    task = args.task
    task_type = args.type if args.type else classify(task)

    data = load_usage()
    provider, warning = select_provider(data, task_type)

    try:
        response, increment = call_with_retry(provider, task)
    except ValueError as e:
        # Config error (missing API key) — warn and try fallback
        fallback = PROVIDERS[provider]["fallback"]
        print(f"[agent-hub] {provider.capitalize()} key error: {e}. Trying {fallback}...", file=sys.stderr)
        try:
            response, increment = call_with_retry(fallback, task)
            warning = f"⚠ {provider.capitalize()} key missing — used {fallback.capitalize()} instead"
            provider = fallback
        except Exception as e2:
            print(f"[agent-hub] Both {provider} and {fallback} failed: {e2}", file=sys.stderr)
            sys.exit(1)
    except requests.exceptions.RequestException as e:
        # Network/HTTP error — fallback was already attempted by call_with_retry, try next provider
        fallback = PROVIDERS[provider]["fallback"]
        try:
            response, increment = call_with_retry(fallback, task)
            warning = f"⚠ {provider.capitalize()} failed — used {fallback.capitalize()} instead"
            provider = fallback
        except Exception as e2:
            print(f"[agent-hub] Both {provider} and {fallback} failed: {e2}", file=sys.stderr)
            sys.exit(1)

    data = increment_usage(data, provider, increment)
    bar = build_status_bar(data, provider, warning)
    print(bar, file=sys.stderr)
    print(response)


def cmd_status(args: argparse.Namespace) -> None:
    """Print current token usage across all providers."""
    data = load_usage()
    print("[agent-hub] Token Usage")
    for p in ["groq", "codex", "gemini", "minimax"]:
        ind = _indicator(data, p)
        print(f"  {p.capitalize()}: {format_count(data, p)} {ind}")


def cmd_reset(args: argparse.Namespace) -> None:
    """Reset a provider's usage counter to zero."""
    provider = args.provider
    data = load_usage()
    cfg = PROVIDERS[provider]
    data[provider][cfg["used_key"]] = 0
    data[provider]["last_reset"] = datetime.now(timezone.utc).isoformat()
    _save_usage(data)
    print(f"[agent-hub] Reset {provider} usage to 0")


def cmd_set_key(args: argparse.Namespace) -> None:
    """Write an API key to ~/.claude/agent-hub/.env."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    KEY_MAP = {
        "groq": "GROQ_API_KEY",
        "codex": "OPENAI_API_KEY",
        "gemini": "GEMINI_API_KEY",
        "minimax": "MINIMAX_API_KEY",
        "minimax-group-id": "MINIMAX_GROUP_ID",
    }
    env_key = KEY_MAP.get(args.key_name)
    if not env_key:
        print(f"[agent-hub] Unknown key name: {args.key_name}. Valid: {', '.join(KEY_MAP)}")
        sys.exit(1)

    existing: Dict[str, str] = {}
    if ENV_FILE.exists():
        for line in ENV_FILE.read_text().splitlines():
            if "=" in line and not line.startswith("#"):
                k, _, v = line.partition("=")
                existing[k.strip()] = v.strip()

    existing[env_key] = args.key_value.strip()
    ENV_FILE.write_text("\n".join(f"{k}={v}" for k, v in existing.items()) + "\n")
    ENV_FILE.chmod(0o600)
    print(f"[agent-hub] Set {env_key} in {ENV_FILE}")


# ── Entry point ────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(description="agent-hub router")
    sub = parser.add_subparsers(dest="command", required=True)

    p_route = sub.add_parser("route", help="Route a task to the best provider")
    p_route.add_argument("task", help="The task text to route")
    p_route.add_argument(
        "--type",
        choices=["code", "research", "creative", "fast", "general"],
        help="Override automatic task classification",
    )
    p_route.set_defaults(func=cmd_route)

    p_status = sub.add_parser("status", help="Show current token usage")
    p_status.set_defaults(func=cmd_status)

    p_reset = sub.add_parser("reset", help="Manually reset a provider counter")
    p_reset.add_argument("provider", choices=list(PROVIDERS))
    p_reset.set_defaults(func=cmd_reset)

    p_set_key = sub.add_parser("set-key", help="Store an API key in ~/.claude/agent-hub/.env")
    p_set_key.add_argument("key_name", help="groq | codex | gemini | minimax | minimax-group-id")
    p_set_key.add_argument("key_value", help="The key value")
    p_set_key.set_defaults(func=cmd_set_key)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
