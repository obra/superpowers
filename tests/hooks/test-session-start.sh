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
#
# VS Code Copilot ignores shell:"bash" and runs the `command` string through
# PowerShell regardless (#2189). The optional `powershell` key supplies a
# PowerShell-native form of the same dispatch: the `&` call operator makes the
# quoted plugin-root path parse as a command invocation instead of a string
# expression followed by the bareword `session-start`.
if node -e '
const hooks = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
const entry = hooks.hooks.SessionStart[0].hooks[0];
if (entry.shell !== "bash") {
  console.error(`SessionStart hook shell is ${JSON.stringify(entry.shell)}, expected "bash"`);
  process.exit(1);
}
if (!/run-hook\.cmd" session-start$/.test(entry.command)) {
  console.error(`unexpected SessionStart command shape: ${entry.command}`);
  process.exit(1);
}
if (typeof entry.powershell !== "string") {
  console.error(`SessionStart hook missing powershell key for VS Code Copilot (#2189)`);
  process.exit(1);
}
if (!/^& "/.test(entry.powershell) || !/run-hook\.cmd" session-start$/.test(entry.powershell)) {
  console.error(`unexpected SessionStart powershell shape: ${entry.powershell}`);
  process.exit(1);
}
' "$REPO_ROOT/hooks/hooks.json"; then
    pass "hooks.json registers SessionStart with shell:bash dispatch"
else
    fail "hooks.json registers SessionStart with shell:bash dispatch"
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

zero_arg_out="$TEST_ROOT/zero-arg.out"
zero_arg_rc=0
bash "$WRAPPER_UNDER_TEST" >"$zero_arg_out" 2>&1 || zero_arg_rc=$?
if [[ "$zero_arg_rc" -eq 0 && ! -s "$zero_arg_out" ]]; then
    pass "zero-arg run-hook.cmd exits 0 with empty stdout/stderr"
else
    fail "zero-arg run-hook.cmd exits 0 with empty stdout/stderr (rc=$zero_arg_rc)"
fi

# Heredocs deadlock bash >= 5.1 on macOS under pipe pressure (#571), so
# neither the wrapper nor the hook may contain one outside a comment line
# (# or REM). The operator is split so this file does not match itself.
heredoc_op='<''<'
for hook_file in "$WRAPPER_UNDER_TEST" "$HOOK_UNDER_TEST"; do
    if grep -q -- "$heredoc_op" <(grep -v -E '^[[:space:]]*(#|REM([[:space:]]|$))' "$hook_file"); then
        fail "${hook_file##*/} contains no heredoc"
    else
        pass "${hook_file##*/} contains no heredoc"
    fi
done

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

# Regression for #2310: Claude Code can spawn SessionStart:startup hooks with
# a broken/empty PATH (anthropics/claude-code#43127). session-start and
# run-hook.cmd's Unix half both shell out to external binaries (dirname, cat)
# that an empty PATH cannot resolve, even though bash itself was invoked by
# absolute path. Every call here should use bash's own builtins/redirection
# instead, so an empty PATH must not change the result.
bash_bin="$(command -v bash)"

broken_path_home="$(make_home broken-path)"
assert_command_output \
    "session-start with empty PATH still emits nested additionalContext" \
    "nested" \
    "" \
    "" \
    "$broken_path_home" \
    PATH="" \
    CLAUDE_PLUGIN_ROOT="$REPO_ROOT" \
    "$bash_bin" "$HOOK_UNDER_TEST"

broken_path_wrapper_home="$(make_home broken-path-wrapper)"
assert_command_output \
    "run-hook.cmd with empty PATH still dispatches session-start" \
    "nested" \
    "" \
    "" \
    "$broken_path_wrapper_home" \
    PATH="" \
    CLAUDE_PLUGIN_ROOT="$REPO_ROOT" \
    "$bash_bin" "$WRAPPER_UNDER_TEST" session-start

# On a Unix system with zsh but no bash (#2503), the harness can't honour
# shell:"bash" and runs run-hook.cmd with zsh or sh. $BASH is unset there, so
# the wrapper must find zsh, which runs session-start unchanged. sh only
# counts when it isn't bash (Git Bash's and macOS's sh are bash, which sets
# $BASH and never reaches the fallback).
posix_sh=""
for candidate in dash ash sh; do
    if cand_bin="$(command -v "$candidate" 2>/dev/null)" \
        && [[ -z "$(env -i "$cand_bin" -c 'echo "${BASH_VERSION:-}${ZSH_VERSION:-}"' 2>/dev/null)" ]]; then
        posix_sh="$cand_bin"
        break
    fi
done
no_bash_bin="$TEST_ROOT/no-bash/bin"
mkdir -p "$no_bash_bin"
if zsh_bin="$(command -v zsh)"; then
    ln -s "$zsh_bin" "$no_bash_bin/zsh"
    for runner_bin in "$zsh_bin" ${posix_sh:+"$posix_sh"}; do
        assert_command_output \
            "run-hook.cmd run by ${runner_bin##*/} without bash dispatches session-start through zsh" \
            "nested" \
            "" \
            "" \
            "$(make_home "no-bash-${runner_bin##*/}")" \
            PATH="$no_bash_bin" \
            CLAUDE_PLUGIN_ROOT="$REPO_ROOT" \
            "$runner_bin" "$WRAPPER_UNDER_TEST" session-start
    done
else
    echo "  [SKIP] run-hook.cmd without bash: zsh not installed"
fi

# On sh/ash/dash-only systems (neither bash nor zsh installed), run-hook.cmd
# falls back to sh (or /bin/sh on empty PATH) and session-start still injects
# full context.
if [[ -n "$posix_sh" ]]; then
    sh_only_bin="$TEST_ROOT/sh-only/bin"
    mkdir -p "$sh_only_bin"
    ln -s "$posix_sh" "$sh_only_bin/sh"
    assert_command_output \
        "run-hook.cmd with only sh (${posix_sh##*/}) dispatches session-start" \
        "nested" \
        "" \
        "" \
        "$(make_home sh-only-wrapper)" \
        PATH="$sh_only_bin" \
        CLAUDE_PLUGIN_ROOT="$REPO_ROOT" \
        "$posix_sh" "$WRAPPER_UNDER_TEST" session-start

    assert_command_output \
        "session-start run directly by ${posix_sh##*/} with empty PATH emits nested additionalContext" \
        "nested" \
        "" \
        "" \
        "$(make_home sh-direct-empty-path)" \
        PATH="" \
        CLAUDE_PLUGIN_ROOT="$REPO_ROOT" \
        "$posix_sh" "$HOOK_UNDER_TEST"

    if [[ -x /bin/sh ]]; then
        assert_command_output \
            "run-hook.cmd with empty PATH falls back cleanly via /bin/sh" \
            "nested" \
            "" \
            "" \
            "$(make_home sh-wrapper-empty-path)" \
            PATH="" \
            CLAUDE_PLUGIN_ROOT="$REPO_ROOT" \
            "$posix_sh" "$WRAPPER_UNDER_TEST" session-start
    fi

    # Adversarial escaping test under POSIX sh (backslashes, quotes, tabs, globs, CRLF)
    tricky_root="$TEST_ROOT/tricky-plugin"
    mkdir -p "$tricky_root/hooks" "$tricky_root/skills/using-superpowers"
    cp "$HOOK_UNDER_TEST" "$tricky_root/hooks/session-start"
    printf 'Line1: C:\\Users\\new\\tab"quote\\*?[foo]\\bar\r\nLine2:\twith\ttabs and ""quotes""\n\n' > "$tricky_root/skills/using-superpowers/SKILL.md"
    tricky_json="$(env -i PATH="" HOME="$(make_home sh-tricky)" CLAUDE_PLUGIN_ROOT="$tricky_root" \
        "$posix_sh" "$tricky_root/hooks/session-start")"
    if node -e '
        const fs = require("fs");
        const raw = fs.readFileSync(process.argv[1], "utf8").replace(/\n+$/, "");
        const parsed = JSON.parse(process.argv[2]);
        const ctx = parsed && parsed.hookSpecificOutput && parsed.hookSpecificOutput.additionalContext;
        if (!ctx || !ctx.includes(raw)) {
            console.error("tricky roundtrip mismatch");
            process.exit(1);
        }
    ' "$tricky_root/skills/using-superpowers/SKILL.md" "$tricky_json"; then
        pass "POSIX sh (${posix_sh##*/}) round-trips backslashes, quotes, tabs, globs, and CRLF in JSON"
    else
        fail "POSIX sh (${posix_sh##*/}) round-trips backslashes, quotes, tabs, globs, and CRLF in JSON"
    fi
else
    echo "  [SKIP] run-hook.cmd/session-start sh-only tests: no non-bash/non-zsh POSIX sh found"
fi

# Run by bare filename from inside hooks/ ($0 has no slash), the plugin root
# must still resolve.
bare_name_home="$(make_home bare-name)"
assert_command_output \
    "session-start run by bare filename from hooks/ still emits nested additionalContext" \
    "nested" \
    "" \
    "" \
    "$bare_name_home" \
    CLAUDE_PLUGIN_ROOT="$REPO_ROOT" \
    "$bash_bin" -c 'cd "$1" && exec "$2" session-start' _ "$REPO_ROOT/hooks" "$bash_bin"

bare_name_wrapper_home="$(make_home bare-name-wrapper)"
assert_command_output \
    "run-hook.cmd run by bare filename from hooks/ still dispatches session-start" \
    "nested" \
    "" \
    "" \
    "$bare_name_wrapper_home" \
    CLAUDE_PLUGIN_ROOT="$REPO_ROOT" \
    "$bash_bin" -c 'cd "$1" && exec "$2" run-hook.cmd session-start' _ "$REPO_ROOT/hooks" "$bash_bin"

# run-hook.cmd's Windows half starts bash with a backslash path
# (C:\...\hooks\session-start), so $0 can use \ as its separator. The skill
# must still be found. On Windows use the real Windows path; elsewhere build
# a plugin root whose hook is reached through a name containing a backslash.
backslash_home="$(make_home backslash)"
if command -v cygpath >/dev/null 2>&1; then
    backslash_cwd="$REPO_ROOT"
    backslash_hook="$(cygpath -w "$HOOK_UNDER_TEST")"
else
    backslash_cwd="$TEST_ROOT/backslash/root"
    mkdir -p "$backslash_cwd"
    ln -s "$REPO_ROOT/hooks" "$backslash_cwd/hooks"
    ln -s "$REPO_ROOT/skills" "$backslash_cwd/skills"
    ln -s "$REPO_ROOT/hooks/session-start" "$backslash_cwd/hooks\\session-start"
    backslash_hook='hooks\session-start'
fi
assert_command_output \
    "session-start reached through a backslash path still reads the skill" \
    "nested" \
    "" \
    "Error reading using-superpowers skill" \
    "$backslash_home" \
    CLAUDE_PLUGIN_ROOT="$REPO_ROOT" \
    "$bash_bin" -c 'cd "$1" && exec "$2" "$3"' _ "$backslash_cwd" "$bash_bin" "$backslash_hook"

# EPIPE on Windows + Git Bash (#1612): the harness can close the hook's stdout
# before the JSON is written. The hook must still exit 0 with nothing on
# stderr, directly and through run-hook.cmd. The reader (:) exits without
# reading, so the write usually lands on a closed pipe.
assert_closed_stdout() {
    local description="$1"
    shift
    local err_file="$TEST_ROOT/closed-stdout.err"
    local status
    set +e
    env -i PATH="${PATH:-}" HOME="$TEST_ROOT" CLAUDE_PLUGIN_ROOT="$REPO_ROOT" "$@" 2>"$err_file" | :
    status="${PIPESTATUS[0]}"
    set -e
    if [[ "$status" -eq 0 && ! -s "$err_file" ]]; then
        pass "$description"
    else
        fail "$description"
        echo "    exit $status, stderr:"
        sed 's/^/      /' "$err_file"
    fi
}

for _ in 1 2 3; do
    assert_closed_stdout \
        "session-start exits 0 silently when stdout is closed early" \
        "$bash_bin" "$HOOK_UNDER_TEST"
    assert_closed_stdout \
        "run-hook.cmd exits 0 silently when stdout is closed early" \
        "$bash_bin" "$WRAPPER_UNDER_TEST" session-start
done

# Each fork costs tens of milliseconds under Git Bash on Windows, and this hook
# runs on every startup, /clear and compaction (#2081). Neither the hook nor
# the wrapper may start a child process. Counted with Linux strace (Git for
# Windows ships an unrelated strace.exe with other options).
if [[ "$(uname -s)" == Linux ]] && command -v strace >/dev/null 2>&1; then
    fork_log="$TEST_ROOT/forks.log"
    for target in "$HOOK_UNDER_TEST" "$WRAPPER_UNDER_TEST session-start"; do
        # shellcheck disable=SC2086 # split the wrapper's argument off its path
        env -i PATH="${PATH:-}" HOME="$TEST_ROOT" CLAUDE_PLUGIN_ROOT="$REPO_ROOT" \
            strace -f -qq -e trace=fork,vfork,clone,clone3 -o "$fork_log" \
            "$bash_bin" $target > /dev/null
        forks="$(grep -c -E '(fork|clone3?)\(' "$fork_log" || true)"
        if [[ "$forks" -eq 0 ]]; then
            pass "${target##*/} starts no child processes"
        else
            fail "${target##*/} starts no child processes ($forks started)"
        fi
    done
else
    echo "  [SKIP] child-process count: needs Linux strace"
fi

if [[ "$FAILURES" -gt 0 ]]; then
    echo "STATUS: FAILED ($FAILURES failure(s))"
    exit 1
fi

echo "STATUS: PASSED"
