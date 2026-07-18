#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

FAILURES=0

pass() {
    echo "  [PASS] $1"
}

fail() {
    echo "  [FAIL] $1"
    FAILURES=$((FAILURES + 1))
}

echo "ECA plugin structure tests"

MARKETPLACE="$REPO_ROOT/.eca-plugin/marketplace.json"
PLUGIN_JSON="$REPO_ROOT/.eca-plugin/superpowers/eca.json"
HOOKS_JSON="$REPO_ROOT/.eca-plugin/superpowers/hooks/hooks.json"
SESSION_START_LINK="$REPO_ROOT/.eca-plugin/superpowers/hooks/session-start"
SKILLS_LINK="$REPO_ROOT/.eca-plugin/superpowers/skills"
TOOLS_REF="$REPO_ROOT/skills/using-superpowers/references/eca-tools.md"

if [ ! -f "$MARKETPLACE" ]; then
    fail "marketplace.json missing at $MARKETPLACE"
else
    pass "marketplace.json exists"
fi

if ! python3 - "$MARKETPLACE" <<'PY'
import json, sys
from pathlib import Path

mp = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
plugins = mp.get("plugins", [])
if not isinstance(plugins, list) or len(plugins) != 1:
    raise AssertionError("marketplace.json must have exactly one plugin entry")
entry = plugins[0]
if entry.get("name") != "superpowers":
    raise AssertionError(f"plugin name: expected 'superpowers', got {entry.get('name')!r}")
if entry.get("source") != ".eca-plugin/superpowers":
    raise AssertionError(f"plugin source: expected '.eca-plugin/superpowers', got {entry.get('source')!r}")
PY
then
    fail "marketplace.json content invalid"
else
    pass "marketplace.json content valid"
fi

if [ ! -f "$PLUGIN_JSON" ]; then
    fail "eca.json missing at $PLUGIN_JSON"
else
    pass "eca.json exists"
fi

if ! python3 - "$PLUGIN_JSON" <<'PY'
import json, sys
from pathlib import Path

cfg = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
skills = cfg.get("skills")
if not isinstance(skills, list) or len(skills) != 1:
    raise AssertionError("eca.json skills must be a list with one entry")
if skills[0].get("path") != "skills":
    raise AssertionError(f"skills path: expected 'skills', got {skills[0].get('path')!r}")
PY
then
    fail "eca.json content invalid"
else
    pass "eca.json content valid"
fi

if [ ! -f "$HOOKS_JSON" ]; then
    fail "hooks.json missing at $HOOKS_JSON"
else
    pass "hooks.json exists"
fi

if ! python3 - "$HOOKS_JSON" <<'PY'
import json, sys
from pathlib import Path

hooks = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))

expected_hooks = {
    "superpowers-bootstrap": "chatStart",
    "superpowers-bootstrap-compact": "postCompact",
}

for name, hook_type in expected_hooks.items():
    hook = hooks.get(name)
    if not isinstance(hook, dict):
        raise AssertionError(f"hooks.json missing '{name}' object")
    if hook.get("type") != hook_type:
        raise AssertionError(
            f"{name} type: expected {hook_type!r}, got {hook.get('type')!r}"
        )
    actions = hook.get("actions")
    if not isinstance(actions, list) or len(actions) != 1:
        raise AssertionError(f"{name} actions must be a list with one entry")
    action = actions[0]
    if action.get("type") != "shell":
        raise AssertionError(
            f"{name} action type: expected 'shell', got {action.get('type')!r}"
        )
    if "${plugin:root}/hooks/session-start" not in action.get("file", ""):
        raise AssertionError(
            f"{name} action file should reference session-start, got {action.get('file')!r}"
        )
PY
then
    fail "hooks.json content invalid"
else
    pass "hooks.json content valid"
fi

if [ ! -L "$SESSION_START_LINK" ]; then
    fail "session-start symlink missing at $SESSION_START_LINK"
elif [ "$(readlink "$SESSION_START_LINK")" != "../../../hooks/session-start" ]; then
    fail "session-start symlink target is '$(readlink "$SESSION_START_LINK")', expected '../../../hooks/session-start'"
else
    pass "session-start symlink correct"
fi

if [ ! -L "$SKILLS_LINK" ]; then
    fail "skills symlink missing at $SKILLS_LINK"
elif [ "$(readlink "$SKILLS_LINK")" != "../../skills" ]; then
    fail "skills symlink target is '$(readlink "$SKILLS_LINK")', expected '../../skills'"
else
    pass "skills symlink correct"
fi

if [ ! -f "$TOOLS_REF" ]; then
    fail "eca-tools.md reference missing at $TOOLS_REF"
else
    pass "eca-tools.md reference exists"
fi

if [[ "$FAILURES" -gt 0 ]]; then
    echo "STATUS: FAILED ($FAILURES failure(s))"
    exit 1
fi

echo "STATUS: PASSED"
