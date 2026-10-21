#!/usr/bin/env python3
"""Flag suspicious content in GitHub issues/comments and post a Slack alert.

Design notes (see PR description for full rationale):

- stdlib only, no third-party deps, no network calls except the single
  Slack webhook POST (and only if a webhook is configured).
- No model calls. Purely regex/heuristic pattern matching.
- Never echoes the matched text or any URL *found inside* the suspicious
  content back to Slack -- only rule names and the (trusted) issue/comment
  permalink are included, so Slack never unfurls an attacker-controlled
  link.
- All untrusted content (title/body/author/url/association/user-type)
  arrives via environment variables set by the workflow's `env:` block
  from the `github.event.*` context -- never interpolated into a `run:`
  shell string. This script only *reads* that text; it never evaluates,
  execs, or shells out with it.
"""

from __future__ import annotations

import json
import os
import re
import sys
import urllib.error
import urllib.request
from urllib.parse import urlsplit

# ---------------------------------------------------------------------------
# Rule patterns
# ---------------------------------------------------------------------------

# powershell-iex: classic "download and execute" one-liners.
_POWERSHELL_IEX_PATTERNS = [
    r"\biex\b",
    r"\birm\b",
    r"invoke-expression",
    r"invoke-webrequest",
    r"downloadstring",
]

# powershell-encoded: base64-encoded payloads passed to powershell.
_POWERSHELL_ENCODED_PATTERNS = [
    r"powershell(\.exe)?\s+.*-(e|enc|encodedcommand)\b",
    r"frombase64string",
]

# pipe-to-shell: curl/wget piped straight into a shell.
_PIPE_TO_SHELL_PATTERN = r"(curl|wget)\b[^\n|]*\|\s*(sudo\s+)?(ba|z)?sh\b"

# string-built-host: host strings assembled via string concatenation to
# dodge naive link scanners, e.g. "gitrm" + ".sbs".
_STRING_BUILT_HOST_PATTERN = r'"[a-z0-9-]+"\s*\+\s*"\.[a-z]{2,}"'

# IPv4 octet validator (0-255 per octet), used by bare-ip-url and known-ioc.
_IPV4_OCTET = r"(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)"
_IPV4 = rf"(?:{_IPV4_OCTET}\.){{3}}{_IPV4_OCTET}"

_BARE_IP_URL_PATTERNS = [
    rf"https?://{_IPV4}(?::\d+)?\b",
    rf"\b{_IPV4}:\d{{2,5}}\b",
]

# known-ioc: specific indicators of compromise, stored defanged /
# string-concatenated in source so this file contains no live link or
# complete raw IP that a naive scanner (or this very tool, recursively)
# would treat as a clickable/working indicator.
_KNOWN_IOCS = [
    "gitrm" + ".sbs",
    "mops" + ".to",
    "45.91.202" + ".47",
]

# unknown-link: allowlisted hosts. Exact matches and wildcard suffixes.
_ALLOWLIST_EXACT = {
    "github.com",
    "githubusercontent.com",
    "anthropic.com",
    "claude.ai",
    "openai.com",
    "npmjs.com",
    "pypi.org",
    "python.org",
    "microsoft.com",
    "google.com",
    "stackoverflow.com",
    "x.com",
    "twitter.com",
    "youtube.com",
    "primeradiant.com",
}
_ALLOWLIST_SUFFIXES = (
    ".github.com",
    ".githubusercontent.com",
    ".anthropic.com",
    ".openai.com",
    ".npmjs.com",
    ".microsoft.com",
    ".google.com",
    ".primeradiant.com",
)

_EXEC_EXTENSIONS = (".ps1", ".exe", ".sh", ".bat", ".msi", ".zip", ".dmg", ".scr")

_URL_RE = re.compile(r"https?://[^\s<>\"'\)\]]+", re.IGNORECASE)

# author_association values that mean "trusted, don't bother flagging".
_TRUSTED_ASSOCIATIONS = {"OWNER", "MEMBER", "COLLABORATOR"}


def _host_of(url: str) -> str:
    try:
        host = urlsplit(url).hostname or ""
    except ValueError:
        return ""
    return host.lower()


def _is_allowlisted(host: str) -> bool:
    if not host:
        return False
    if host in _ALLOWLIST_EXACT:
        return True
    return any(host.endswith(suffix) for suffix in _ALLOWLIST_SUFFIXES)


def _check_bare_ip_url(text: str) -> bool:
    return any(re.search(p, text, re.IGNORECASE) for p in _BARE_IP_URL_PATTERNS)


def _check_known_ioc(text: str) -> bool:
    low = text.lower()
    return any(ioc in low for ioc in _KNOWN_IOCS)


def _check_unknown_link(text: str):
    """Return (has_unknown_link, has_unknown_link_to_executable)."""
    has_unknown = False
    has_unknown_exec = False
    for url in _URL_RE.findall(text):
        host = _host_of(url)
        if _is_allowlisted(host):
            continue
        has_unknown = True
        path = urlsplit(url).path.lower()
        if path.endswith(_EXEC_EXTENSIONS):
            has_unknown_exec = True
    return has_unknown, has_unknown_exec


def match_rules(text: str) -> list:
    """Return the list of matched rule names for the given text, in a
    stable order. Pure function, no I/O."""
    text = text or ""
    matched = []

    if any(re.search(p, text, re.IGNORECASE) for p in _POWERSHELL_IEX_PATTERNS):
        matched.append("powershell-iex")

    if any(re.search(p, text, re.IGNORECASE) for p in _POWERSHELL_ENCODED_PATTERNS):
        matched.append("powershell-encoded")

    if re.search(_PIPE_TO_SHELL_PATTERN, text, re.IGNORECASE):
        matched.append("pipe-to-shell")

    if re.search(_STRING_BUILT_HOST_PATTERN, text, re.IGNORECASE):
        matched.append("string-built-host")

    if _check_bare_ip_url(text):
        matched.append("bare-ip-url")

    if _check_known_ioc(text):
        matched.append("known-ioc")

    # unknown-link is low-signal alone: only counts if combined with
    # another already-matched rule, or if it points at an executable.
    had_other_signal = bool(matched)
    has_unknown, has_unknown_exec = _check_unknown_link(text)
    if has_unknown_exec or (has_unknown and had_other_signal):
        matched.append("unknown-link")

    return matched


def _is_bot(author_type: str) -> bool:
    return (author_type or "").strip().lower() == "bot"


def _is_trusted_association(association: str) -> bool:
    return (association or "").strip().upper() in _TRUSTED_ASSOCIATIONS


def _slack_escape(text: str) -> str:
    """Escape Slack mrkdwn special characters. Also strip pipes/newlines
    so text is safe to embed inside a <url|label> link token."""
    text = text or ""
    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    text = text.replace("|", "/").replace("\n", " ").replace("\r", " ")
    return text.strip()


def build_slack_message(url: str, title: str, author: str, matched: list) -> str:
    safe_title = _slack_escape(title)[:200] or "(no title)"
    safe_author = _slack_escape(author)[:100] or "(unknown)"
    safe_url = (url or "").strip()
    rule_names = ", ".join(matched)
    return (
        f":warning: possible malicious content in <{safe_url}|{safe_title}> "
        f"by {safe_author}: matched {rule_names}"
    )


def post_to_slack(webhook_url: str, text: str) -> None:
    payload = json.dumps({"text": text}).encode("utf-8")
    req = urllib.request.Request(
        webhook_url,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        resp.read()


def main() -> int:
    author_type = os.environ.get("AUTHOR_TYPE", "")
    author_association = os.environ.get("AUTHOR_ASSOCIATION", "")

    if _is_bot(author_type):
        print(f"Skipping: author type is bot ({author_type!r}).")
        return 0

    if _is_trusted_association(author_association):
        print(f"Skipping: trusted author_association ({author_association!r}).")
        return 0

    title = os.environ.get("CONTENT_TITLE", "")
    body = os.environ.get("CONTENT_BODY", "")
    url = os.environ.get("CONTENT_URL", "")
    author = os.environ.get("CONTENT_AUTHOR", "")

    combined = f"{title}\n{body}"
    matched = match_rules(combined)

    if not matched:
        print("No suspicious patterns matched.")
        return 0

    print(f"Matched rules: {', '.join(matched)}")

    webhook_url = os.environ.get("SLACK_WEBHOOK_URL", "").strip()
    if not webhook_url:
        print("SLACK_WEBHOOK_URL is not configured; skipping Slack post (no-op).")
        return 0

    message = build_slack_message(url, title, author, matched)
    try:
        post_to_slack(webhook_url, message)
    except urllib.error.URLError as exc:
        # Don't fail the workflow run just because Slack is unreachable.
        print(f"Failed to post to Slack: {exc}")
        return 0

    print("Posted alert to Slack.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
