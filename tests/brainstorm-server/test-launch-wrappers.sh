#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
START_SH="$REPO_ROOT/skills/brainstorming/scripts/start-server.sh"
STOP_SH="$REPO_ROOT/skills/brainstorming/scripts/stop-server.sh"
START_PS1="$REPO_ROOT/skills/brainstorming/scripts/start-server.ps1"
STOP_PS1="$REPO_ROOT/skills/brainstorming/scripts/stop-server.ps1"
COMPAT_BASH="$REPO_ROOT/compat/bash/superpowers"
COMPAT_PS1="$REPO_ROOT/compat/powershell/superpowers.ps1"

tmp_root="$(mktemp -d)"
shell_screen=""
pwsh_screen=""
pwsh_bin=""

cleanup() {
  if [[ -n "$shell_screen" ]]; then
    "$STOP_SH" "$shell_screen" >/dev/null 2>&1 || true
  fi

  if [[ -n "$pwsh_screen" ]]; then
    if [[ -n "$pwsh_bin" ]]; then
      "$pwsh_bin" -NoLogo -NoProfile -File "$STOP_PS1" "$pwsh_screen" >/dev/null 2>&1 || true
    else
      "$STOP_SH" "$pwsh_screen" >/dev/null 2>&1 || true
    fi
  fi

  rm -rf "$tmp_root"
}

trap cleanup EXIT

if [[ ! -f "$COMPAT_BASH" ]]; then
  echo "Expected canonical bash compat launcher to exist at $COMPAT_BASH"
  exit 1
fi

if [[ ! -f "$COMPAT_PS1" ]]; then
  echo "Expected canonical PowerShell compat launcher to exist at $COMPAT_PS1"
  exit 1
fi

json_field() {
  local json="$1"
  local field="$2"
  python3 - "$json" "$field" <<'PY'
import json
import sys

payload = json.loads(sys.argv[1])
print(payload[sys.argv[2]])
PY
}

shell_project="$tmp_root/shell-project"
mkdir -p "$shell_project"
shell_start_output="$("$START_SH" --project-dir "$shell_project" --background)"
shell_screen="$(json_field "$shell_start_output" screen_dir)"

if [[ ! -f "$shell_screen/.server-info" ]]; then
  echo "Expected shell wrapper launch to write .server-info"
  exit 1
fi

shell_stop_output="$("$STOP_SH" "$shell_screen")"
if [[ "$shell_stop_output" != *'"status": "stopped"'* ]]; then
  echo "Expected shell wrapper stop command to stop the brainstorm server"
  printf '%s\n' "$shell_stop_output"
  exit 1
fi
shell_screen=""

pwsh_bin="$(command -v pwsh || command -v powershell || true)"
if [[ -n "$pwsh_bin" ]]; then
  pwsh_project="$tmp_root/pwsh-project"
  mkdir -p "$pwsh_project"
  pwsh_start_output="$("$pwsh_bin" -NoLogo -NoProfile -File "$START_PS1" --project-dir "$pwsh_project" --background)"
  pwsh_screen="$(json_field "$pwsh_start_output" screen_dir)"

  if [[ ! -f "$pwsh_screen/.server-info" ]]; then
    echo "Expected PowerShell wrapper launch to write .server-info"
    exit 1
  fi

  pwsh_stop_output="$("$pwsh_bin" -NoLogo -NoProfile -File "$STOP_PS1" "$pwsh_screen")"
  if [[ "$pwsh_stop_output" != *'"status": "stopped"'* ]]; then
    echo "Expected PowerShell wrapper stop command to stop the brainstorm server"
    printf '%s\n' "$pwsh_stop_output"
    exit 1
  fi
  pwsh_screen=""

  captured_args_file="$tmp_root/captured-bash-args"
  fake_bash="$tmp_root/fake-bash"
  cat > "$fake_bash" <<'SH'
#!/usr/bin/env bash
printf '%s\n' "$@" > "$SUPERPOWERS_CAPTURED_ARGS"
printf '{"type":"server-started","port":52341,"url":"http://localhost:52341","screen_dir":"/c/repo with spaces/proj/.superpowers/brainstorm/session-1"}\n'
SH
  chmod +x "$fake_bash"

  pwsh_windows_project='C:\repo with spaces\proj'
  pwsh_windows_output="$(SUPERPOWERS_BASH_PATH="$fake_bash" SUPERPOWERS_CAPTURED_ARGS="$captured_args_file" "$pwsh_bin" -NoLogo -NoProfile -File "$START_PS1" --project-dir "$pwsh_windows_project" --background)"
  if [[ "$pwsh_windows_output" != *'"screen_dir":"C:\\repo with spaces\\proj\\.superpowers\\brainstorm\\session-1"'* ]]; then
    echo "Expected PowerShell wrapper to convert brainstorm screen_dir back to a Windows-native path"
    printf '%s\n' "$pwsh_windows_output"
    exit 1
  fi
  if ! rg -n -F '/c/repo with spaces/proj' "$captured_args_file" >/dev/null; then
    echo "Expected PowerShell wrapper to normalize Windows --project-dir paths before invoking bash"
    cat "$captured_args_file"
    exit 1
  fi

  pwsh_stop_output="$(SUPERPOWERS_BASH_PATH="$fake_bash" SUPERPOWERS_CAPTURED_ARGS="$captured_args_file" "$pwsh_bin" -NoLogo -NoProfile -File "$STOP_PS1" 'C:\repo with spaces\proj\.superpowers\brainstorm\session-1')"
  if [[ "$pwsh_stop_output" != *'"type":"server-started"'* ]]; then
    echo "Expected fake PowerShell stop-wrapper invocation to preserve bash stdout"
    printf '%s\n' "$pwsh_stop_output"
    exit 1
  fi
  if ! rg -n -F '/c/repo with spaces/proj/.superpowers/brainstorm/session-1' "$captured_args_file" >/dev/null; then
    echo "Expected PowerShell stop wrapper to normalize Windows screen_dir paths before invoking bash"
    cat "$captured_args_file"
    exit 1
  fi
else
  echo "Skipping PowerShell brainstorming wrapper smoke test: no pwsh or powershell binary found."
fi

echo "Brainstorm launch wrapper smoke test passed."
