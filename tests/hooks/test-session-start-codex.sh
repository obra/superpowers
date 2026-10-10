#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
HOOK_UNDER_TEST="$REPO_ROOT/hooks/session-start-codex"
CONFIG_UNDER_TEST="$REPO_ROOT/hooks/hooks-codex.json"

FAILURES=0

pass() {
    echo "  [PASS] $1"
}

fail() {
    echo "  [FAIL] $1"
    FAILURES=$((FAILURES + 1))
}

# run_hook <stdin-payload> — echoes hook stdout; fails the calling test on
# non-zero exit. env -i mirrors the codex hook executor's clean environment.
run_hook() {
    printf '%s' "$1" | env -i PATH="${PATH:-}" bash "$HOOK_UNDER_TEST"
}

echo "Codex SessionStart hook tests"

startup_payload='{"session_id":"s","hook_event_name":"SessionStart","model":"gpt-5.6-terra","source":"startup"}'
if output="$(run_hook "$startup_payload")" && [ -z "$output" ]; then
    pass "source=startup emits nothing and exits 0"
else
    fail "source=startup emits nothing and exits 0"
    printf '%s\n' "$output" | head -3 | sed 's/^/    /'
fi

compact_payload='{"session_id":"s","hook_event_name":"SessionStart","model":"gpt-5.6-terra","source":"compact"}'
if output="$(run_hook "$compact_payload")"; then
    ok=1
    for needle in \
        "<EXTREMELY_IMPORTANT>" \
        "You have superpowers." \
        "name: using-superpowers" \
        "<CONTEXT_RESTORED>" \
        "subagent-driven-development/SKILL.md" \
        "references/codex-tools.md"; do
        if [[ "$output" != *"$needle"* ]]; then
            ok=0
            echo "    missing: $needle"
        fi
    done
    if [ "$ok" -eq 1 ]; then
        pass "source=compact emits bootstrap plus re-read addendum"
    else
        fail "source=compact emits bootstrap plus re-read addendum"
    fi
else
    fail "source=compact emits bootstrap plus re-read addendum (hook exited non-zero)"
fi

# Whitespace-tolerant source matching (serializers vary).
spaced_payload='{"hook_event_name":"SessionStart", "source" : "compact"}'
if output="$(run_hook "$spaced_payload")" && [[ "$output" == *"<CONTEXT_RESTORED>"* ]]; then
    pass "whitespace around the source key still triggers injection"
else
    fail "whitespace around the source key still triggers injection"
fi

if output="$(printf '' | env -i PATH="${PATH:-}" bash "$HOOK_UNDER_TEST")" && [ -z "$output" ]; then
    pass "empty stdin fails open to no output, exit 0"
else
    fail "empty stdin fails open to no output, exit 0"
fi

if output="$(run_hook 'not json at all {{{')" && [ -z "$output" ]; then
    pass "garbage stdin fails open to no output, exit 0"
else
    fail "garbage stdin fails open to no output, exit 0"
fi

# A compact mention inside some other field must not trigger injection.
decoy_payload='{"hook_event_name":"SessionStart","source":"startup","cwd":"/tmp/compact"}'
if output="$(run_hook "$decoy_payload")" && [ -z "$output" ]; then
    pass "compact appearing outside the source field does not trigger"
else
    fail "compact appearing outside the source field does not trigger"
fi

if node -e '
const config = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
const group = config.hooks.SessionStart[0];
if (group.matcher !== "compact") {
  console.error(`hook matcher is ${JSON.stringify(group.matcher)}, expected "compact"`);
  process.exit(1);
}
const entry = group.hooks[0];
if (entry.type !== "command") {
  console.error(`hook type is ${JSON.stringify(entry.type)}, expected "command"`);
  process.exit(1);
}
if (!entry.command.includes("${PLUGIN_ROOT}") || !/run-hook\.cmd" session-start-codex$/.test(entry.command)) {
  console.error(`unexpected command shape: ${entry.command}`);
  process.exit(1);
}
' "$CONFIG_UNDER_TEST"; then
    pass "hooks-codex.json runs session-start-codex via \${PLUGIN_ROOT} on compact"
else
    fail "hooks-codex.json runs session-start-codex via \${PLUGIN_ROOT} on compact"
fi

if [[ "$FAILURES" -gt 0 ]]; then
    echo "STATUS: FAILED ($FAILURES failure(s))"
    exit 1
fi

echo "STATUS: PASSED"
