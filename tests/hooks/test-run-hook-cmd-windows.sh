#!/usr/bin/env bash
# Tests for the Windows (cmd) half of hooks/run-hook.cmd: how it finds bash
# and whether the hook's exit code survives. Run from Git Bash on Windows;
# skips anywhere cmd.exe isn't available.
#
# Most cases need the fallback branches, which a machine with Git in
# Program Files never reaches. Those cases run a sandbox copy of the wrapper
# whose Program Files paths point at a directory that doesn't exist.
set -euo pipefail

if ! command -v cmd >/dev/null 2>&1 || ! command -v cygpath >/dev/null 2>&1; then
    echo "SKIP: cmd.exe not available (these tests run in Git Bash on Windows)"
    exit 0
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
PF_GIT='C:\Program Files\Git'
# Spelled out: inside Git Bash, cygpath maps its own install dir to "/".
PF_GIT_UNIX='/c/Program Files/Git'

if [[ ! -e "$PF_GIT_UNIX/bin/bash.exe" ]]; then
    echo "SKIP: needs Git for Windows in $PF_GIT to stand in for other installs"
    exit 0
fi

FAILURES=0
TEST_ROOT="$(mktemp -d)"
JUNCTIONS=()

cleanup() {
    # Remove junctions with cmd's rmdir first, which never touches the
    # target, so nothing below can recurse into the real Git install.
    local j left=0
    for j in "${JUNCTIONS[@]}"; do
        cmd //c rmdir "$j" >/dev/null 2>&1 || true
        if [[ -e "$(cygpath "$j")" ]]; then
            echo "WARNING: junction $j still exists; not deleting $TEST_ROOT" >&2
            left=1
        fi
    done
    [[ "$left" -eq 0 ]] && rm -rf "$TEST_ROOT"
}
trap cleanup EXIT

pass() { echo "  [PASS] $1"; }
fail() { echo "  [FAIL] $1"; FAILURES=$((FAILURES + 1)); }

junction() {
    local link="$1" target="$2"
    # Keep Git Bash from rewriting /J into a path.
    MSYS2_ARG_CONV_EXCL="*" cmd /c mklink /J "$link" "$target" >/dev/null
    JUNCTIONS+=("$link")
}

# A plugin root with probe hooks. $1 = "real" keeps the wrapper as is;
# "sandbox" points its Program Files paths at nothing.
make_plugin() {
    local dir="$1" mode="$2"
    mkdir -p "$dir/hooks"
    if [[ "$mode" == sandbox ]]; then
        sed -e 's#C:\\Program Files\\Git\\#C:\\no-such-program-files\\Git\\#g' \
            -e 's#C:\\Program Files (x86)\\Git\\#C:\\no-such-program-files\\Git\\#g' \
            "$REPO_ROOT/hooks/run-hook.cmd" > "$dir/hooks/run-hook.cmd"
        if grep -q 'Program Files' "$dir/hooks/run-hook.cmd"; then
            echo "sandbox wrapper still mentions Program Files" >&2
            exit 1
        fi
    else
        cp "$REPO_ROOT/hooks/run-hook.cmd" "$dir/hooks/run-hook.cmd"
    fi
    printf 'echo probe-ran\n' > "$dir/hooks/probe-ok"
    printf 'echo probe-ran\nexit 7\n' > "$dir/hooks/probe-exit"
}

# run_hook PLUGIN_DIR CWD PROBE [VAR=value...] -> sets OUT and RC
run_hook() {
    local plugin="$1" cwd="$2" probe="$3"
    shift 3
    RC=0
    # tr drops the NUL bytes the WSL launcher prints (UTF-16 text).
    OUT="$(cd "$cwd" && env "$@" cmd //c "$(cygpath -w "$plugin")\\hooks\\run-hook.cmd" "$probe" 2>&1 | tr -d '\000'; exit "${PIPESTATUS[0]}")" || RC=$?
}

SYS32_PATH="/c/Windows/System32"
GIT_USR_BIN="$PF_GIT_UNIX/usr/bin"
NO_LA='C:\no-such-localappdata'

echo "run-hook.cmd (Windows) tests"

# --- exit code of the hook survives the wrapper ---
real="$TEST_ROOT/real"
make_plugin "$real" real
run_hook "$real" "$TEST_ROOT" probe-exit
if [[ "$RC" -eq 7 && "$OUT" == *probe-ran* ]]; then
    pass "hook exit code propagates through run-hook.cmd"
else
    fail "hook exit code propagates through run-hook.cmd (rc=$RC, out=$OUT)"
fi

sandbox="$TEST_ROOT/sandbox"
make_plugin "$sandbox" sandbox

# --- per-user Git install (%LOCALAPPDATA%\Programs\Git) ---
la="$TEST_ROOT/localappdata"
mkdir -p "$la/Programs"
junction "$(cygpath -w "$la/Programs/Git")" "$PF_GIT"
run_hook "$sandbox" "$TEST_ROOT" probe-exit \
    LOCALAPPDATA="$(cygpath -w "$la")" PATH="$SYS32_PATH"
if [[ "$RC" -eq 7 && "$OUT" == *probe-ran* ]]; then
    pass "per-user Git install is found and its exit code propagates"
else
    fail "per-user Git install is found and its exit code propagates (rc=$RC, out=$OUT)"
fi

# --- the System32 WSL launcher on PATH is skipped for a real bash ---
run_hook "$sandbox" "$TEST_ROOT" probe-ok \
    LOCALAPPDATA="$NO_LA" PATH="$SYS32_PATH:$GIT_USR_BIN"
if [[ "$RC" -eq 0 && "$OUT" == *probe-ran* ]]; then
    pass "System32 bash.exe (WSL launcher) is skipped in favor of Git's bash on PATH"
else
    fail "System32 bash.exe (WSL launcher) is skipped in favor of Git's bash on PATH (rc=$RC, out=$OUT)"
fi

# --- a bash under a WindowsApps directory (the Store WSL stub) is skipped ---
apps="$TEST_ROOT/Microsoft/WindowsApps"
mkdir -p "$apps"
apps_marker="$TEST_ROOT/windowsapps-ran"
printf '@echo off\r\necho stub> "%s"\r\n' "$(cygpath -w "$apps_marker")" > "$apps/bash.cmd"
run_hook "$sandbox" "$TEST_ROOT" probe-ok \
    LOCALAPPDATA="$NO_LA" PATH="$apps:$SYS32_PATH:$GIT_USR_BIN"
if [[ ! -e "$apps_marker" && "$OUT" == *probe-ran* ]]; then
    pass "bash under WindowsApps (Store WSL stub) is skipped"
else
    fail "bash under WindowsApps (Store WSL stub) is skipped (stub ran: $([[ -e $apps_marker ]] && echo yes || echo no), out=$OUT)"
fi

# --- a bash.cmd in the current directory is never run ---
plant="$TEST_ROOT/planted-cwd"
mkdir -p "$plant"
marker="$TEST_ROOT/planted-cwd-ran"
printf '@echo off\r\necho planted> "%s"\r\n' "$(cygpath -w "$marker")" > "$plant/bash.cmd"
run_hook "$sandbox" "$plant" probe-ok \
    LOCALAPPDATA="$NO_LA" PATH="$SYS32_PATH:$GIT_USR_BIN"
if [[ ! -e "$marker" && "$OUT" == *probe-ran* ]]; then
    pass "bash.cmd in the current directory is not run"
else
    fail "bash.cmd in the current directory is not run (marker exists: $([[ -e $marker ]] && echo yes || echo no), out=$OUT)"
fi

# --- unset LOCALAPPDATA must not probe \Programs\Git on the current drive ---
drive_programs="/c/Programs"
if [[ -e "$drive_programs" ]]; then
    echo "  [SKIP] unset LOCALAPPDATA: C:\\Programs already exists"
else
    mkdir "$drive_programs"
    junction 'C:\Programs\Git' "$PF_GIT"
    run_hook "$sandbox" "$TEST_ROOT" probe-ok -u LOCALAPPDATA PATH="$SYS32_PATH"
    cmd //c rmdir 'C:\Programs\Git' >/dev/null 2>&1 || true
    rmdir "$drive_programs"
    if [[ "$RC" -eq 0 && "$OUT" != *probe-ran* ]]; then
        pass "unset LOCALAPPDATA does not run \\Programs\\Git on the current drive"
    else
        fail "unset LOCALAPPDATA does not run \\Programs\\Git on the current drive (rc=$RC, out=$OUT)"
    fi
fi

# --- no usable bash: exit 0 quietly, without invoking the WSL launcher ---
run_hook "$sandbox" "$TEST_ROOT" probe-ok \
    LOCALAPPDATA="$NO_LA" PATH="$SYS32_PATH"
if [[ "$RC" -eq 0 && -z "$OUT" ]]; then
    pass "no usable bash exits 0 with no output"
else
    fail "no usable bash exits 0 with no output (rc=$RC, out=$OUT)"
fi

if [[ "$FAILURES" -gt 0 ]]; then
    echo "STATUS: FAILED ($FAILURES failure(s))"
    exit 1
fi
echo "STATUS: PASSED"
