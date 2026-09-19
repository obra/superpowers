#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
HOOK_UNDER_TEST="$REPO_ROOT/hooks/session-start"
WRAPPER_UNDER_TEST="$REPO_ROOT/hooks/run-hook.cmd"

FAILURES=0
TEST_ROOT="$(mktemp -d)"

cleanup() {
    rm -rf "$TEST_ROOT"
}
trap cleanup EXIT

pass() {
    echo "  [PASS] $1"
}

fail() {
    echo "  [FAIL] $1"
    FAILURES=$((FAILURES + 1))
}

make_home() {
    local name="$1"
    local home="$TEST_ROOT/$name/home"
    mkdir -p "$home"
    printf '%s\n' "$home"
}

assert_command_output() {
    local description="$1"
    local shape="$2"
    local contains="$3"
    local not_contains="$4"
    local home="$5"
    shift 5

    local output
    if ! output="$(env -i PATH="${PATH:-}" HOME="$home" "$@" 2>&1)"; then
        fail "$description"
        echo "    hook exited non-zero"
        echo "$output" | sed 's/^/      /'
        return
    fi

    if printf '%s' "$output" | \
        EXPECT_SHAPE="$shape" \
        EXPECT_CONTAINS="$contains" \
        EXPECT_NOT_CONTAINS="$not_contains" \
        node -e '
const fs = require("fs");

const input = fs.readFileSync(0, "utf8");
let payload;
try {
  payload = JSON.parse(input);
} catch (error) {
  console.error(`invalid JSON: ${error.message}`);
  process.exit(1);
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

const shape = process.env.EXPECT_SHAPE;
let context;

if (shape === "nested") {
  if (!hasOwn(payload, "hookSpecificOutput")) {
    fail("missing hookSpecificOutput");
  }
  if (hasOwn(payload, "additional_context") || hasOwn(payload, "additionalContext")) {
    fail("nested output also included a top-level context field");
  }
  const hookOutput = payload.hookSpecificOutput;
  if (!hookOutput || typeof hookOutput !== "object" || Array.isArray(hookOutput)) {
    fail("hookSpecificOutput is not an object");
  }
  if (hookOutput.hookEventName !== "SessionStart") {
    fail(`unexpected hookEventName: ${hookOutput.hookEventName}`);
  }
  context = hookOutput.additionalContext;
} else if (shape === "cursor") {
  if (hasOwn(payload, "hookSpecificOutput")) {
    fail("cursor output included hookSpecificOutput");
  }
  if (!hasOwn(payload, "additional_context")) {
    fail("cursor output missing additional_context");
  }
  if (hasOwn(payload, "additionalContext")) {
    fail("cursor output included additionalContext");
  }
  context = payload.additional_context;
} else if (shape === "sdk") {
  if (hasOwn(payload, "hookSpecificOutput")) {
    fail("sdk output included hookSpecificOutput");
  }
  if (!hasOwn(payload, "additionalContext")) {
    fail("sdk output missing additionalContext");
  }
  if (hasOwn(payload, "additional_context")) {
    fail("sdk output included additional_context");
  }
  context = payload.additionalContext;
} else {
  fail(`unknown expected shape: ${shape}`);
}

if (typeof context !== "string" || context.trim() === "") {
  fail("injected context was empty");
}

const expectedText = process.env.EXPECT_CONTAINS || "";
if (expectedText && !context.includes(expectedText)) {
  fail(`context did not contain expected text: ${expectedText}`);
}

const forbiddenTexts = (process.env.EXPECT_NOT_CONTAINS || "")
  .split("\u001f")
  .filter(Boolean);
for (const forbiddenText of forbiddenTexts) {
  if (context.includes(forbiddenText)) {
    fail(`context contained forbidden text: ${forbiddenText}`);
  }
}
'; then
        pass "$description"
    else
        fail "$description"
        echo "    output:"
        echo "$output" | sed 's/^/      /'
    fi
}

echo "SessionStart hook output tests"

# Registration shape: the hook must declare shell:"bash" so Claude Code on
# Windows dispatches via Git Bash (or fails with an actionable error) instead
# of PowerShell/cmd.exe, whose parsers break on the quoted command string
# (PowerShell ParserError; cmd.exe quote-stripping on paths with metacharacters).
if node -e '
const hooks = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
const entry = hooks.hooks.SessionStart[0].hooks[0];
if (entry.shell !== "bash") {
  console.error(`SessionStart hook shell is ${JSON.stringify(entry.shell)}, expected "bash"`);
  process.exit(1);
}
if (!entry.command.includes("wslpath -u") || !entry.command.includes("CLAUDE_PLUGIN_ROOT")) {
  console.error(`unexpected SessionStart command shape: ${entry.command}`);
  process.exit(1);
}
' "$REPO_ROOT/hooks/hooks.json"; then
    pass "hooks.json registers SessionStart with shell:bash dispatch"
else
    fail "hooks.json registers SessionStart with shell:bash dispatch"
fi

# VS Code resolves CLAUDE_PLUGIN_ROOT on the Windows extension host before
# dispatching the hook to the remote WSL shell. The command must translate that
# Windows path before bash attempts to execute the wrapper.
wsl_home="$(make_home vscode-remote-wsl)"
wsl_bin="$TEST_ROOT/vscode-remote-wsl/bin"
wsl_log="$TEST_ROOT/vscode-remote-wsl/executed-path"
mkdir -p "$wsl_bin"
cat > "$wsl_bin/wslpath" <<'EOF'
#!/usr/bin/env bash
if [[ "$1" != "-u" ]]; then
  exit 1
fi
printf '%s\n' "$WSL_TRANSLATED_PLUGIN_ROOT"
EOF
chmod +x "$wsl_bin/wslpath"

windows_plugin_root='C:\Users\developer\.vscode\agent-plugins\github.com\obra\superpowers'
translated_plugin_root="$TEST_ROOT/vscode-remote-wsl/plugin"
mkdir -p "$translated_plugin_root/hooks"
cat > "$translated_plugin_root/hooks/run-hook.cmd" <<'EOF'
printf '%s\n' "$0" > "$WSL_EXECUTED_PATH_LOG"
EOF

hook_command="$(node -e '
const hooks = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
const command = hooks.hooks.SessionStart[0].hooks[0].command;
process.stdout.write(command.replace("${CLAUDE_PLUGIN_ROOT}", process.argv[2]));
' "$REPO_ROOT/hooks/hooks.json" "$windows_plugin_root")"

if env -i \
  PATH="$wsl_bin:/usr/bin:/bin" \
  HOME="$wsl_home" \
  WSL_DISTRO_NAME=Ubuntu \
  WSL_TRANSLATED_PLUGIN_ROOT="$translated_plugin_root" \
  WSL_EXECUTED_PATH_LOG="$wsl_log" \
  /bin/sh -c "$hook_command" >/dev/null 2>&1 && \
  [[ "$(cat "$wsl_log" 2>/dev/null)" == "$translated_plugin_root/hooks/run-hook.cmd" ]]; then
  pass "hooks.json translates Windows plugin paths before WSL bash dispatch"
else
  fail "hooks.json translates Windows plugin paths before WSL bash dispatch"
fi

unix_home="$(make_home unix-hook-command)"
unix_hook_command="$(node -e '
const hooks = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
const command = hooks.hooks.SessionStart[0].hooks[0].command;
process.stdout.write(command.replace("${CLAUDE_PLUGIN_ROOT}", process.argv[2]));
' "$REPO_ROOT/hooks/hooks.json" "$REPO_ROOT")"

if output="$(env -i \
  PATH="${PATH:-}" \
  HOME="$unix_home" \
  CLAUDE_PLUGIN_ROOT="$REPO_ROOT" \
  /bin/sh -c "$unix_hook_command" 2>&1)" && \
  printf '%s' "$output" | node -e '
const input = require("fs").readFileSync(0, "utf8");
const payload = JSON.parse(input);
if (!payload.hookSpecificOutput?.additionalContext) process.exit(1);
'; then
  pass "hooks.json dispatches Unix plugin paths without WSL translation"
else
  fail "hooks.json dispatches Unix plugin paths without WSL translation"
fi

claude_home="$(make_home claude-code)"
assert_command_output \
    "Claude Code emits nested SessionStart additionalContext" \
    "nested" \
    "" \
    "" \
    "$claude_home" \
    CLAUDE_PLUGIN_ROOT="$REPO_ROOT" \
    bash "$HOOK_UNDER_TEST"

wrapper_home="$(make_home run-hook-wrapper)"
assert_command_output \
    "run-hook.cmd wrapper dispatches to the named session-start script" \
    "nested" \
    "" \
    "" \
    "$wrapper_home" \
    CLAUDE_PLUGIN_ROOT="$REPO_ROOT" \
    bash "$WRAPPER_UNDER_TEST" session-start

cursor_home="$(make_home cursor)"
assert_command_output \
    "Cursor emits top-level additional_context only" \
    "cursor" \
    "" \
    "" \
    "$cursor_home" \
    CURSOR_PLUGIN_ROOT="$REPO_ROOT" \
    CLAUDE_PLUGIN_ROOT="$REPO_ROOT" \
    bash "$HOOK_UNDER_TEST"

copilot_home="$(make_home copilot-cli)"
assert_command_output \
    "Copilot CLI emits top-level additionalContext only" \
    "sdk" \
    "" \
    "" \
    "$copilot_home" \
    COPILOT_CLI=1 \
    CLAUDE_PLUGIN_ROOT="$REPO_ROOT" \
    bash "$HOOK_UNDER_TEST"

legacy_home="$(make_home legacy-warning-removed)"
mkdir -p "$legacy_home/.config/superpowers/skills"
assert_command_output \
    "SessionStart omits obsolete legacy custom-skill warning" \
    "nested" \
    "" \
    "Superpowers now uses"$'\037'"~/.config/superpowers/skills"$'\037'"~/.claude/skills"$'\037'"legacy" \
    "$legacy_home" \
    CLAUDE_PLUGIN_ROOT="$REPO_ROOT" \
    bash "$HOOK_UNDER_TEST"

if [[ "$FAILURES" -gt 0 ]]; then
    echo "STATUS: FAILED ($FAILURES failure(s))"
    exit 1
fi

echo "STATUS: PASSED"
