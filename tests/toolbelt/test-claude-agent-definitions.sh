#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)

python3 - "$repo_root" <<'PY'
from pathlib import Path
import re
import sys

root = Path(sys.argv[1])
expected = {
    "opus-5-5-low": ("Claude Opus 5.5 on low effort.", "claude-opus-5-5", "low"),
    "opus-5-5-medium": ("Claude Opus 5.5 on medium effort.", "claude-opus-5-5", "medium"),
    "opus-5-5-high": ("Claude Opus 5.5 on high effort.", "claude-opus-5-5", "high"),
    "fable-5-1-low": ("Claude Fable 5.1 on low effort.", "claude-fable-5-1", "low"),
    "fable-5-1-medium": ("Claude Fable 5.1 on medium effort.", "claude-fable-5-1", "medium"),
    "fable-5-1-high": ("Claude Fable 5.1 on high effort.", "claude-fable-5-1", "high"),
    "fable-5-1-xhigh": ("Claude Fable 5.1 on xhigh effort.", "claude-fable-5-1", "xhigh"),
    "sonnet-5-5-low": ("Claude Sonnet 5.5 on low effort.", "claude-sonnet-5-5", "low"),
    "sonnet-5-5-medium": ("Claude Sonnet 5.5 on medium effort.", "claude-sonnet-5-5", "medium"),
    "sonnet-5-5-high": ("Claude Sonnet 5.5 on high effort.", "claude-sonnet-5-5", "high"),
    "sonnet-5-5-xhigh": ("Claude Sonnet 5.5 on xhigh effort.", "claude-sonnet-5-5", "xhigh"),
    "haiku-5-5-medium": ("Claude Haiku 5.5 on medium effort.", "claude-haiku-5-5", "medium"),
    "haiku-5-5-high": ("Claude Haiku 5.5 on high effort.", "claude-haiku-5-5", "high"),
    "haiku-5-5-xhigh": ("Claude Haiku 5.5 on xhigh effort.", "claude-haiku-5-5", "xhigh"),
}

agent_dir = root / "agents"
actual_files = {path.stem for path in agent_dir.glob("*.md")} if agent_dir.exists() else set()
if actual_files != set(expected):
    raise SystemExit(
        f"not ok - agent files\nexpected: {sorted(expected)}\nactual: {sorted(actual_files)}"
    )

for name, (description, model, effort) in expected.items():
    path = agent_dir / f"{name}.md"
    match = re.fullmatch(r"---\n(.*?)\n---\n?", path.read_text(), re.DOTALL)
    if not match:
        raise SystemExit(f"not ok - {name} has only YAML frontmatter")
    fields = {}
    for line in match.group(1).splitlines():
        key, separator, value = line.partition(": ")
        if not separator:
            raise SystemExit(f"not ok - {name} malformed frontmatter line: {line}")
        fields[key] = value
    wanted = {
        "name": name,
        "description": description,
        "model": model,
        "effort": effort,
    }
    if fields != wanted:
        raise SystemExit(f"not ok - {name}\nexpected: {wanted}\nactual: {fields}")
    print(f"ok - {name}")
PY

# A match means an obsolete model name survived. No match is the passing case.
# Any other grep status is a broken scan, and must not read as a pass.
scan_for_obsolete_models() {
  local failure=$1
  shift
  local status=0
  grep -rniE 'opus[ -]?4[.-]?8|opus-4-8|sonnet[ -]?4' "$@" >/dev/null || status=$?
  case "$status" in
    0)
      echo "not ok - $failure" >&2
      exit 1
      ;;
    1) ;;
    *)
      echo "not ok - scan for '$failure' failed, grep exited $status" >&2
      exit 1
      ;;
  esac
}

scan_for_obsolete_models "obsolete operational models remain" \
  --exclude=anthropic-best-practices.md \
  "$repo_root/agents" \
  "$repo_root/skills" \
  "$repo_root/.claude-plugin" \
  "$repo_root/.codex-plugin"
echo "ok - obsolete operational models are absent"

# The vendored authoring reference is guidance too, but historical release and
# issue text plus regex guard tests are intentionally outside this operational scan.
# It carries no --exclude: grep skips a named file that matches one.
scan_for_obsolete_models "obsolete model guidance remains in the authoring reference" \
  "$repo_root/skills/writing-skills/anthropic-best-practices.md"
echo "ok - obsolete model guidance is absent"

echo "PASS"
