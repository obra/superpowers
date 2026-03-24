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
direct_shell_screen=""
launcher_shell_screen=""
foreground_shell_screen=""

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

  if [[ -n "$direct_shell_screen" ]]; then
    "$STOP_SH" "$direct_shell_screen" >/dev/null 2>&1 || true
  fi

  if [[ -n "$launcher_shell_screen" ]]; then
    "$STOP_SH" "$launcher_shell_screen" >/dev/null 2>&1 || true
  fi

  if [[ -n "$foreground_shell_screen" ]]; then
    "$STOP_SH" "$foreground_shell_screen" >/dev/null 2>&1 || true
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
if [[ -f "$shell_screen/.server-info" ]]; then
  echo "Expected shell wrapper stop command to remove .server-info"
  exit 1
fi
if [[ ! -f "$shell_screen/.server-stopped" ]]; then
  echo "Expected shell wrapper stop command to write .server-stopped"
  exit 1
fi
shell_screen=""

foreground_project="$tmp_root/foreground-shell-project"
mkdir -p "$foreground_project"
foreground_output_file="$tmp_root/foreground-shell-output.json"
"$START_SH" --project-dir "$foreground_project" --foreground > "$foreground_output_file" 2>&1 &
foreground_launcher_pid=$!
for _ in {1..50}; do
  if grep -q "server-started" "$foreground_output_file" 2>/dev/null; then
    break
  fi
  sleep 0.1
done
if ! grep -q "server-started" "$foreground_output_file" 2>/dev/null; then
  echo "Expected foreground brainstorm launch to emit server-started JSON"
  cat "$foreground_output_file"
  exit 1
fi
foreground_start_output="$(grep "server-started" "$foreground_output_file" | head -1)"
foreground_shell_screen="$(json_field "$foreground_start_output" screen_dir)"
foreground_stop_output="$("$STOP_SH" "$foreground_shell_screen")"
if [[ "$foreground_stop_output" != *'"status": "stopped"'* ]]; then
  echo "Expected foreground brainstorm server to stop cleanly through stop-server.sh"
  printf '%s\n' "$foreground_stop_output"
  exit 1
fi
wait "$foreground_launcher_pid"
if [[ -f "$foreground_shell_screen/.server-info" ]]; then
  echo "Expected foreground brainstorm stop to remove .server-info"
  exit 1
fi
if [[ ! -f "$foreground_shell_screen/.server-stopped" ]]; then
  echo "Expected foreground brainstorm stop to write .server-stopped"
  exit 1
fi
foreground_shell_screen=""

direct_project="$tmp_root/direct-shell-project"
mkdir -p "$direct_project"
direct_output_file="$tmp_root/direct-shell-output.json"
direct_parent_script="$tmp_root/direct-shell-parent.sh"
printf '%s\n' \
  '#!/usr/bin/env bash' \
  'set -euo pipefail' \
  "export BRAINSTORM_LIFECYCLE_POLL_MS=200" \
  "\"$START_SH\" --project-dir \"$direct_project\" --background > \"$direct_output_file\"" \
  > "$direct_parent_script"
chmod +x "$direct_parent_script"
"$direct_parent_script"
direct_start_output="$(<"$direct_output_file")"
direct_shell_screen="$(json_field "$direct_start_output" screen_dir)"
for _ in {1..40}; do
  if [[ -f "$direct_shell_screen/.server-stopped" ]]; then
    break
  fi
  sleep 0.1
done
if [[ ! -f "$direct_shell_screen/.server-stopped" ]]; then
  echo "Expected brainstorm server launched from a direct shell parent to stop after that parent exits"
  exit 1
fi
if [[ -f "$direct_shell_screen/.server-info" ]]; then
  echo "Expected direct-shell parent shutdown to clear .server-info"
  exit 1
fi
direct_shell_screen=""

ephemeral_output_file="$tmp_root/ephemeral-shell-output.json"
ephemeral_parent_script="$tmp_root/ephemeral-shell-parent.sh"
printf '%s\n' \
  '#!/usr/bin/env bash' \
  'set -euo pipefail' \
  "export BRAINSTORM_LIFECYCLE_POLL_MS=200" \
  "\"$START_SH\" --background > \"$ephemeral_output_file\"" \
  > "$ephemeral_parent_script"
chmod +x "$ephemeral_parent_script"
"$ephemeral_parent_script"
ephemeral_start_output="$(<"$ephemeral_output_file")"
ephemeral_shell_screen="$(json_field "$ephemeral_start_output" screen_dir)"
for _ in {1..60}; do
  if [[ ! -d "$ephemeral_shell_screen" ]]; then
    break
  fi
  sleep 0.1
done
if [[ -d "$ephemeral_shell_screen" ]]; then
  echo "Expected ephemeral brainstorm session directory to be removed after owner-exit shutdown"
  exit 1
fi

launcher_project="$tmp_root/launcher-shell-project"
mkdir -p "$launcher_project"
launcher_output_file="$tmp_root/launcher-shell-output.json"
BRAINSTORM_LIFECYCLE_POLL_MS=200 bash -lc "\"$START_SH\" --project-dir \"$launcher_project\" --background" > "$launcher_output_file"
launcher_start_output="$(<"$launcher_output_file")"
launcher_shell_screen="$(json_field "$launcher_start_output" screen_dir)"
sleep 0.6
if [[ ! -f "$launcher_shell_screen/.server-info" ]]; then
  echo "Expected brainstorm server launched from a bash -lc shell to stay alive for the owning session"
  exit 1
fi
launcher_stop_output="$("$STOP_SH" "$launcher_shell_screen")"
if [[ "$launcher_stop_output" != *'"status": "stopped"'* ]]; then
  echo "Expected launcher-shell brainstorm server to be stoppable after the owner-liveness check"
  printf '%s\n' "$launcher_stop_output"
  exit 1
fi
launcher_shell_screen=""

stale_pid_dir="$tmp_root/stale-pid-session"
mkdir -p "$stale_pid_dir"
: > "$stale_pid_dir/.ephemeral"
sleep 30 &
stale_pid=$!
printf '%s\n' "$stale_pid" > "$stale_pid_dir/.server.pid"
stale_stop_output="$("$STOP_SH" "$stale_pid_dir")"
if [[ "$stale_stop_output" != *'"status": "not_running"'* ]] || [[ "$stale_stop_output" != *'"reason": "stale_pid"'* ]]; then
  echo "Expected stop-server.sh to fail closed on stale pid files"
  printf '%s\n' "$stale_stop_output"
  kill "$stale_pid" >/dev/null 2>&1 || true
  wait "$stale_pid" 2>/dev/null || true
  exit 1
fi
if ! kill -0 "$stale_pid" 2>/dev/null; then
  echo "Expected stale pid handling to leave unrelated processes alive"
  exit 1
fi
kill "$stale_pid" >/dev/null 2>&1 || true
wait "$stale_pid" 2>/dev/null || true
if [[ -d "$stale_pid_dir" ]]; then
  echo "Expected stale ephemeral session directory to be removed during cleanup"
  exit 1
fi

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
  if [[ -f "$pwsh_screen/.server-info" ]]; then
    echo "Expected PowerShell wrapper stop command to remove .server-info"
    exit 1
  fi
  if [[ ! -f "$pwsh_screen/.server-stopped" ]]; then
    echo "Expected PowerShell wrapper stop command to write .server-stopped"
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

  streaming_bash="$tmp_root/fake-streaming-bash"
  cat > "$streaming_bash" <<'SH'
#!/usr/bin/env bash
printf '{"type":"server-started","port":52341,"url":"http://localhost:52341","screen_dir":"/c/repo with spaces/proj/.superpowers/brainstorm/session-stream"}\n'
sleep 30
SH
  chmod +x "$streaming_bash"

  streaming_output="$tmp_root/pwsh-streaming.out"
  SUPERPOWERS_BASH_PATH="$streaming_bash" CODEX_CI=1 "$pwsh_bin" -NoLogo -NoProfile -File "$START_PS1" --project-dir "$pwsh_windows_project" >"$streaming_output" 2>&1 &
  streaming_pid=$!
  streaming_seen=0
  for _ in $(seq 1 20); do
    if rg -n -F '"screen_dir":"C:\\repo with spaces\\proj\\.superpowers\\brainstorm\\session-stream"' "$streaming_output" >/dev/null; then
      streaming_seen=1
      break
    fi
    sleep 0.2
  done
  if [[ "$streaming_seen" != "1" ]]; then
    echo "Expected PowerShell start wrapper to stream converted startup JSON before foreground exit"
    cat "$streaming_output"
    kill "$streaming_pid" >/dev/null 2>&1 || true
    wait "$streaming_pid" 2>/dev/null || true
    exit 1
  fi
  if ! kill -0 "$streaming_pid" 2>/dev/null; then
    echo "Expected PowerShell start wrapper foreground test process to still be running after streaming startup JSON"
    cat "$streaming_output"
    exit 1
  fi
  kill "$streaming_pid" >/dev/null 2>&1 || true
  wait "$streaming_pid" 2>/dev/null || true
else
  echo "Skipping PowerShell brainstorming wrapper smoke test: no pwsh or powershell binary found."
fi

echo "Brainstorm launch wrapper smoke test passed."
