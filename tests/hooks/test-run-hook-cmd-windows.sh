#!/usr/bin/env bash
# Tests for the Windows (cmd) half of hooks/run-hook.cmd: how it finds bash
# and whether the hook's exit code survives. Run from Git Bash on Windows;
# skips anywhere cmd.exe isn't available (see the two `skip` calls below —
# that's the whole non-Windows code path, and it's expected to fire on
# Linux/macOS CI).
#
# Most cases need the fallback branches, which a machine with Git in
# Program Files never reaches. Those cases run a sandbox copy of the wrapper
# whose Program Files paths point at a directory that doesn't exist.
set -euo pipefail

# skip MESSAGE: print a SKIP line and exit 0. Used only for "this whole
# suite doesn't apply here" — never for an individual case further down
# (those use skip_case, defined after the pass/fail plumbing exists).
skip() {
    echo "SKIP: $1"
    exit 0
}

# This suite drives cmd.exe directly and needs cygpath to translate paths
# for it, so it only runs under Git Bash (on Windows or otherwise).
if ! command -v cmd >/dev/null 2>&1 || ! command -v cygpath >/dev/null 2>&1; then
    skip "cmd.exe not available (these tests run in Git Bash on Windows)"
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
PF_GIT='C:\Program Files\Git'
# Spelled out: inside Git Bash, cygpath maps its own install dir to "/".
PF_GIT_UNIX='/c/Program Files/Git'

# The sandbox wrapper below needs a real bash.exe to stand in for the
# per-user-install and bash-on-PATH cases. Git for Windows at the standard
# Program Files path is that stand-in, so it has to actually be there.
if [[ ! -e "$PF_GIT_UNIX/bin/bash.exe" ]]; then
    skip "needs Git for Windows in $PF_GIT to stand in for other installs"
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
# skip_case MESSAGE: one case can't run in this environment (e.g. a path it
# needs is already occupied). Unlike skip() at the top, this does not exit
# the suite — the remaining cases still run.
skip_case() { echo "  [SKIP] $1"; }

# report NAME OK DETAIL: the one place every case below turns its check
# into a pass/fail line, instead of each case repeating its own
# if/pass/else/fail block. OK is "1" or "0"; DETAIL is the diagnostic
# appended to a failure line (rc/output, or whatever the case needs to show).
report() {
    local name="$1" ok="$2" detail="$3"
    if [[ "$ok" == 1 ]]; then
        pass "$name"
    else
        fail "$name ($detail)"
    fi
}

# junction LINK TARGET: create a directory junction, Windows' no-admin-
# required stand-in for a symlink, and track it for cleanup.
#
# Fragile bit: Git Bash's MSYS path conversion rewrites a bare /J into a
# path before cmd ever sees it, which breaks mklink's switch parsing.
# MSYS2_ARG_CONV_EXCL="*" is the documented way to turn that off for one
# command. This is the only place that flag is needed, so it's scoped here
# rather than exported for the whole script.
junction() {
    local link="$1" target="$2"
    MSYS2_ARG_CONV_EXCL="*" cmd /c mklink /J "$link" "$target" >/dev/null
    JUNCTIONS+=("$link")
}

# make_plugin DIR MODE: lay out a plugin root with two probe hooks
# (probe-ok, probe-exit) and a copy of the wrapper under test.
#
# MODE=real copies run-hook.cmd unmodified — used by the one case that
# exercises the actual Program Files branch on whatever machine runs this
# suite. MODE=sandbox rewrites the copy's Program Files paths to a
# directory that doesn't exist, which forces every other case down into
# the per-user-install and PATH fallback branches that a real install on
# the test machine would otherwise shadow. The grep guard below exists
# because a silent failure to rewrite would make every "sandbox" case
# quietly re-test the real-install branch instead of the fallback it
# claims to cover.
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

# run_hook PLUGIN_DIR CWD PROBE [VAR=value...|-u VAR] -> sets OUT and RC
#
# Fragile bit: this is the one place that crosses from Git Bash into
# cmd.exe and back, so every quirk of that boundary lives here instead of
# being repeated at each call site.
#   - cygpath -w converts the plugin's Unix path to the Windows form cmd
#     needs; a bare Unix path would not resolve inside cmd.
#   - `exit "${PIPESTATUS[0]}"` captures cmd's exit code around the pipe to
#     tr — without it, $? after the pipeline would report tr's exit code,
#     which is always 0.
#   - `tr -d '\000'` strips NUL bytes: the WSL launcher's error message is
#     UTF-16, which bash captures as ASCII bytes interleaved with NULs.
run_hook() {
    local plugin="$1" cwd="$2" probe="$3"
    shift 3
    RC=0
    OUT="$(cd "$cwd" && env "$@" cmd //c "$(cygpath -w "$plugin")\\hooks\\run-hook.cmd" "$probe" 2>&1 | tr -d '\000'; exit "${PIPESTATUS[0]}")" || RC=$?
}

# fake_bash DIR: drop a bash.cmd into DIR that proves it ran.
fake_bash() {
    mkdir -p "$1"
    printf '@echo off\r\necho fake-bash-ran\r\n' > "$1/bash.cmd"
}

SYS32_PATH="/c/Windows/System32"
GIT_USR_BIN="$PF_GIT_UNIX/usr/bin"
NO_LA='C:\no-such-localappdata'

echo "run-hook.cmd (Windows) tests"

# --- Case: hook exit code propagates through run-hook.cmd ---
# Real (unmodified) wrapper; the test machine's own Program Files Git is
# what's found and run.
real="$TEST_ROOT/real"
make_plugin "$real" real
run_hook "$real" "$TEST_ROOT" probe-exit
ok=0; [[ "$RC" -eq 7 && "$OUT" == *probe-ran* ]] && ok=1
report "hook exit code propagates through run-hook.cmd" "$ok" "rc=$RC, out=$OUT"

sandbox="$TEST_ROOT/sandbox"
make_plugin "$sandbox" sandbox

# --- Case: per-user Git install (%LOCALAPPDATA%\Programs\Git) ---
# Junction LOCALAPPDATA\Programs\Git at the real Git install, so the
# per-user-install branch finds a working bash without one actually being
# installed per-user.
la="$TEST_ROOT/localappdata"
mkdir -p "$la/Programs"
junction "$(cygpath -w "$la/Programs/Git")" "$PF_GIT"
run_hook "$sandbox" "$TEST_ROOT" probe-exit \
    LOCALAPPDATA="$(cygpath -w "$la")" PATH="$SYS32_PATH"
ok=0; [[ "$RC" -eq 7 && "$OUT" == *probe-ran* ]] && ok=1
report "per-user Git install is found and its exit code propagates" "$ok" "rc=$RC, out=$OUT"

# --- Case: the System32 WSL launcher on PATH is skipped for a real bash ---
# PATH offers both System32's WSL launcher stub and Git's real usr/bin
# bash; the wrapper's where.exe filter must pick the real one.
run_hook "$sandbox" "$TEST_ROOT" probe-ok \
    LOCALAPPDATA="$NO_LA" PATH="$SYS32_PATH:$GIT_USR_BIN"
ok=0; [[ "$RC" -eq 0 && "$OUT" == *probe-ran* ]] && ok=1
report "System32 bash.exe (WSL launcher) is skipped in favor of Git's bash on PATH" "$ok" "rc=$RC, out=$OUT"

# --- Case: a bash under a WindowsApps directory (the Store WSL stub) is skipped ---
# A fake bash.cmd sits first on PATH under %LOCALAPPDATA%\Microsoft\WindowsApps
# (the Store's WSL stub location); if the filter missed it, it would run
# and leave apps_marker behind instead of falling through to Git's bash.
apps_la="$TEST_ROOT/apps-localappdata"
apps="$apps_la/Microsoft/WindowsApps"
mkdir -p "$apps"
apps_marker="$TEST_ROOT/windowsapps-ran"
printf '@echo off\r\necho stub> "%s"\r\n' "$(cygpath -w "$apps_marker")" > "$apps/bash.cmd"
run_hook "$sandbox" "$TEST_ROOT" probe-ok \
    LOCALAPPDATA="$(cygpath -w "$apps_la")" PATH="$apps:$SYS32_PATH:$GIT_USR_BIN"
ok=0; [[ ! -e "$apps_marker" && "$OUT" == *probe-ran* ]] && ok=1
report "bash under WindowsApps (Store WSL stub) is skipped" "$ok" \
    "stub ran: $([[ -e "$apps_marker" ]] && echo yes || echo no), out=$OUT"

# --- Case: nothing in the current directory is run: not bash, not where ---
# Plants a bash.cmd and a where.bat in the hook's working directory; the
# wrapper must find bash purely via where.exe + PATH, never via the CWD.
# One run_hook call, two assertions (one per planted file).
plant="$TEST_ROOT/planted-cwd"
mkdir -p "$plant"
for name in bash.cmd where.bat; do
    printf '@echo off\r\necho planted> "%s"\r\n' "$(cygpath -w "$TEST_ROOT/ran-$name")" > "$plant/$name"
done
run_hook "$sandbox" "$plant" probe-ok \
    LOCALAPPDATA="$NO_LA" PATH="$SYS32_PATH:$GIT_USR_BIN"
for name in bash.cmd where.bat; do
    ok=0; [[ ! -e "$TEST_ROOT/ran-$name" && "$OUT" == *probe-ran* ]] && ok=1
    report "$name in the current directory is not run" "$ok" \
        "ran: $([[ -e "$TEST_ROOT/ran-$name" ]] && echo yes || echo no), out=$OUT"
done

# --- Case: PATH entries whose names cmd could misparse still work ---
# Three PATH directory names that stress cmd's for/f parsing: a cmd
# metacharacter (^), a percent-escaped-looking segment (%OS%), a non-ASCII
# name, and (separately) an extensionless "bash" that must be skipped in
# favor of the next, properly-suffixed match on PATH.
for dir_name in 'caret^and%OS%percent' $'caf\u00e9-bin' 'extensionless'; do
    dir="$TEST_ROOT/$dir_name"
    case "$dir_name" in
        extensionless)
            # An extensionless "bash" first on PATH must be skipped.
            mkdir -p "$dir"
            printf 'not a program\n' > "$dir/bash"
            fake_bash "$TEST_ROOT/after-extensionless"
            path="$dir:$TEST_ROOT/after-extensionless:$SYS32_PATH"
            ;;
        *)
            fake_bash "$dir"
            path="$dir:$SYS32_PATH"
            ;;
    esac
    run_hook "$sandbox" "$TEST_ROOT" probe-ok LOCALAPPDATA="$NO_LA" PATH="$path"
    ok=0; [[ "$RC" -eq 0 && "$OUT" == *fake-bash-ran* ]] && ok=1
    report "bash on PATH is found under $dir_name" "$ok" "rc=$RC, out=$OUT"
done

# --- Case: unset SystemRoot must not let the WSL launcher through ---
# Without SystemRoot, the wrapper can't build the where.exe path it needs
# to search PATH at all; it must give up quietly rather than fall through
# to invoking a WSL launcher (whose failure prints "...Subsystem...").
run_hook "$sandbox" "$TEST_ROOT" probe-ok -u SystemRoot \
    LOCALAPPDATA="$NO_LA" PATH="$SYS32_PATH:$GIT_USR_BIN"
ok=0; [[ "$RC" -eq 0 && "$OUT" != *Subsystem* ]] && ok=1
report "unset SystemRoot does not run the WSL launcher" "$ok" "rc=$RC, out=$OUT"

# --- Case: unset LOCALAPPDATA must not probe \Programs\Git on the current drive ---
# With LOCALAPPDATA unset, "%LOCALAPPDATA%\Programs\Git" would collapse to
# "\Programs\Git" on the current drive if the wrapper's `defined` guard
# were missing — and any user can create that directory. Skipped (not
# failed) if C:\Programs already exists on the test machine, since this
# case can't safely run without owning that path.
drive_programs="/c/Programs"
if [[ -e "$drive_programs" ]]; then
    skip_case "unset LOCALAPPDATA: C:\\Programs already exists"
else
    mkdir "$drive_programs"
    junction 'C:\Programs\Git' "$PF_GIT"
    run_hook "$sandbox" "$TEST_ROOT" probe-ok -u LOCALAPPDATA PATH="$SYS32_PATH"
    cmd //c rmdir 'C:\Programs\Git' >/dev/null 2>&1 || true
    rmdir "$drive_programs"
    ok=0; [[ "$RC" -eq 0 && "$OUT" != *probe-ran* ]] && ok=1
    report "unset LOCALAPPDATA does not run \\Programs\\Git on the current drive" "$ok" "rc=$RC, out=$OUT"
fi

# --- Case: no usable bash: exit 0 quietly, without invoking the WSL launcher ---
# No Program Files Git, no per-user Git, and PATH offers only System32
# (filtered out as a WSL launcher) — nothing left to find.
run_hook "$sandbox" "$TEST_ROOT" probe-ok \
    LOCALAPPDATA="$NO_LA" PATH="$SYS32_PATH"
ok=0; [[ "$RC" -eq 0 && -z "$OUT" ]] && ok=1
report "no usable bash exits 0 with no output" "$ok" "rc=$RC, out=$OUT"

if [[ "$FAILURES" -gt 0 ]]; then
    echo "STATUS: FAILED ($FAILURES failure(s))"
    exit 1
fi
echo "STATUS: PASSED"
