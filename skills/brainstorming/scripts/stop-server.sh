#!/usr/bin/env bash
# Stop the brainstorm server and clean up
# Usage: stop-server.sh <session_dir>
#
# Kills the server process. Only deletes session directory if it's
# under /tmp (ephemeral). Persistent directories (.superpowers/) are
# kept so mockups can be reviewed later.

SESSION_DIR="$1"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SERVER_SCRIPT="${SCRIPT_DIR}/server.cjs"

if [[ -z "$SESSION_DIR" ]]; then
  echo '{"error": "Usage: stop-server.sh <session_dir>"}'
  exit 1
fi

STATE_DIR="${SESSION_DIR}/state"
PID_FILE="${STATE_DIR}/server.pid"

canonical_dir() {
  local dir="${1//\\//}"
  if [[ ! -d "$dir" ]]; then
    printf '%s' "$dir"
    return
  fi

  (
    cd "$dir" || exit 1
    pwd -W 2>/dev/null || pwd -P
  )
}

physical_dir() {
  local dir="${1//\\//}"
  if [[ ! -d "$dir" ]]; then
    printf '%s' "$dir"
    return
  fi

  (
    cd "$dir" || exit 1
    pwd -P
  )
}

same_dir() {
  local actual="$1"
  local expected="$2"
  local actual_canonical
  local actual_physical
  local expected_canonical
  local expected_physical

  actual_canonical="$(canonical_dir "$actual")"
  actual_physical="$(physical_dir "$actual")"
  expected_canonical="$(canonical_dir "$expected")"
  expected_physical="$(physical_dir "$expected")"

  [[ "$actual" == "$expected" ||
     "$actual" == "$expected_canonical" ||
     "$actual" == "$expected_physical" ||
     "$actual_canonical" == "$expected_canonical" ||
     "$actual_canonical" == "$expected_physical" ||
     "$actual_physical" == "$expected_canonical" ||
     "$actual_physical" == "$expected_physical" ]]
}

canonical_path() {
  local path="${1//\\//}"
  local dir
  local base

  dir="$(dirname "$path")"
  base="$(basename "$path")"
  if [[ ! -d "$dir" ]]; then
    printf '%s' "$path"
    return
  fi

  printf '%s/%s' "$(canonical_dir "$dir")" "$base"
}

physical_path() {
  local path="${1//\\//}"
  local dir
  local base

  dir="$(dirname "$path")"
  base="$(basename "$path")"
  if [[ ! -d "$dir" ]]; then
    printf '%s' "$path"
    return
  fi

  printf '%s/%s' "$(physical_dir "$dir")" "$base"
}

strip_outer_quotes() {
  local value="$1"
  value="${value#\"}"
  value="${value%\"}"
  printf '%s' "$value"
}

same_file() {
  local actual="$1"
  local expected="$2"
  local actual_canonical
  local actual_physical
  local expected_canonical
  local expected_physical

  actual_canonical="$(canonical_path "$actual")"
  actual_physical="$(physical_path "$actual")"
  expected_canonical="$(canonical_path "$expected")"
  expected_physical="$(physical_path "$expected")"

  [[ "${actual//\\//}" == "${expected//\\//}" ||
     "${actual//\\//}" == "$expected_canonical" ||
     "${actual//\\//}" == "$expected_physical" ||
     "$actual_canonical" == "$expected_canonical" ||
     "$actual_canonical" == "$expected_physical" ||
     "$actual_physical" == "$expected_canonical" ||
     "$actual_physical" == "$expected_physical" ]]
}

process_command() {
  local pid="$1"
  if [[ -r "/proc/$pid/cmdline" ]]; then
    tr '\0' ' ' < "/proc/$pid/cmdline"
    return
  fi
  if ps -p "$pid" -o args= >/dev/null 2>&1; then
    ps -p "$pid" -o args= 2>/dev/null
    return
  fi
  if ps -p "$pid" -o command= >/dev/null 2>&1; then
    ps -p "$pid" -o command= 2>/dev/null
    return
  fi
  ps -p "$pid" 2>/dev/null | sed -n '2p'
}

process_environment() {
  local pid="$1"
  if [[ -r "/proc/$pid/environ" ]]; then
    tr '\0' '\n' < "/proc/$pid/environ"
    return
  fi
  if ps eww -p "$pid" >/dev/null 2>&1; then
    ps eww -p "$pid" 2>/dev/null
    return
  fi
  return 1
}

process_cwd() {
  local pid="$1"
  local cwd
  if [[ -d "/proc/$pid/cwd" ]]; then
    canonical_dir "/proc/$pid/cwd"
    return
  fi
  if command -v lsof >/dev/null 2>&1; then
    cwd="$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -1)"
    if [[ -n "$cwd" ]]; then
      printf '%s' "$cwd"
      return
    fi
  fi
  return 1
}

brainstorm_dir_from_environment() {
  local env_text="$1"
  local value

  value="$(printf '%s\n' "$env_text" | sed -n 's/^BRAINSTORM_DIR=//p' | head -1)"
  if [[ -n "$value" ]]; then
    printf '%s' "$value"
    return 0
  fi

  if [[ "$env_text" =~ (^|[[:space:]])BRAINSTORM_DIR=([^[:space:]]+)($|[[:space:]]) ]]; then
    printf '%s' "${BASH_REMATCH[2]}"
    return 0
  fi

  return 1
}

server_info_value() {
  local key="$1"
  local info_file="${STATE_DIR}/server-info"

  [[ -r "$info_file" ]] || return 1
  node -e '
    const fs = require("fs");
    const key = process.argv[1];
    const file = process.argv[2];
    const info = JSON.parse(fs.readFileSync(file, "utf8"));
    if (info[key] === undefined || info[key] === null) process.exit(1);
    process.stdout.write(String(info[key]));
  ' "$key" "$info_file" 2>/dev/null
}

server_info_owns_pid() {
  local pid="$1"
  local session_dir="$2"
  local port
  local state_dir
  local listener_pid
  local expected_state_dir="${session_dir}/state"

  command -v lsof >/dev/null 2>&1 || return 1

  port="$(server_info_value port)" || return 1
  state_dir="$(server_info_value state_dir)" || return 1
  [[ "$port" =~ ^[0-9]+$ ]] || return 1
  same_dir "$state_dir" "$expected_state_dir" || return 1

  while IFS= read -r listener_pid; do
    [[ "$listener_pid" == "$pid" ]] && return 0
  done < <(lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null | sort -u)

  return 1
}

resolve_process_path() {
  local arg="${1//\\//}"
  local cwd="$2"

  if [[ "$arg" == /* || "$arg" =~ ^[A-Za-z]:/ ]]; then
    printf '%s' "$arg"
  else
    printf '%s/%s' "$cwd" "$arg"
  fi
}

command_has_node_entrypoint() {
  local command="${1//\\//}"
  local entry="${2//\\//}"
  local node_name

  for node_name in node node.exe; do
    [[ "$command" == "$node_name $entry" ||
       "$command" == "$node_name $entry "* ||
       "$command" == "$node_name \"$entry\"" ||
       "$command" == "$node_name \"$entry\" "* ||
       "$command" == "$node_name '$entry'" ||
       "$command" == "$node_name '$entry' "* ||
       "$command" == *" $node_name $entry" ||
       "$command" == *" $node_name $entry "* ||
       "$command" == *" $node_name \"$entry\"" ||
       "$command" == *" $node_name \"$entry\" "* ||
       "$command" == *" $node_name '$entry'" ||
       "$command" == *" $node_name '$entry' "* ||
       "$command" == *"/$node_name $entry" ||
       "$command" == *"/$node_name $entry "* ||
       "$command" == *"/$node_name \"$entry\"" ||
       "$command" == *"/$node_name \"$entry\" "* ||
       "$command" == *"/$node_name '$entry'" ||
       "$command" == *"/$node_name '$entry' "* ]] && return 0
  done

  return 1
}

process_runs_server_script() {
  local pid="$1"
  local argv=()
  local arg
  local executable
  local script_arg
  local cwd
  local command
  local server_canonical
  local server_physical

  if [[ -r "/proc/$pid/cmdline" ]]; then
    while IFS= read -r -d '' arg || [[ -n "$arg" ]]; do
      argv+=("$(strip_outer_quotes "$arg")")
    done < "/proc/$pid/cmdline"

    [[ ${#argv[@]} -ge 2 ]] || return 1
    executable="$(basename "${argv[0]//\\//}")"
    executable="${executable%.exe}"
    [[ "$executable" == "node" || "$executable" == "nodejs" ]] || return 1

    script_arg="${argv[1]}"
    [[ "$script_arg" == -* ]] && return 1

    cwd="$(process_cwd "$pid")" || return 1
    same_file "$(resolve_process_path "$script_arg" "$cwd")" "$SERVER_SCRIPT"
    return
  fi

  command="$(process_command "$pid")"
  server_canonical="$(canonical_path "$SERVER_SCRIPT")"
  server_physical="$(physical_path "$SERVER_SCRIPT")"

  if command_has_node_entrypoint "$command" "$SERVER_SCRIPT" ||
     command_has_node_entrypoint "$command" "$server_canonical" ||
     command_has_node_entrypoint "$command" "$server_physical"; then
    return 0
  fi

  command_has_node_entrypoint "$command" "server.cjs" || return 1
  cwd="$(process_cwd "$pid")" || return 1
  same_dir "$cwd" "$SCRIPT_DIR"
}

owns_pid() {
  local pid="$1"
  local session_dir="$2"
  local env
  local actual_dir

  kill -0 "$pid" 2>/dev/null || return 1

  process_runs_server_script "$pid" || return 1

  if [[ -r "/proc/$pid/environ" ]]; then
    env="$(tr '\0' '\n' < "/proc/$pid/environ")" || return 1
    actual_dir="$(brainstorm_dir_from_environment "$env")" || return 1
    same_dir "$actual_dir" "$session_dir"
    return
  fi

  if env="$(process_environment "$pid")" &&
     actual_dir="$(brainstorm_dir_from_environment "$env")"; then
    same_dir "$actual_dir" "$session_dir" && return 0
  fi

  server_info_owns_pid "$pid" "$session_dir"
}

if [[ -f "$PID_FILE" ]]; then
  pid=$(cat "$PID_FILE")

  if [[ ! "$pid" =~ ^[0-9]+$ ]] || ! owns_pid "$pid" "$SESSION_DIR"; then
    rm -f "$PID_FILE" "${STATE_DIR}/server.log"
    echo '{"status": "stale_pid"}'
    exit 0
  fi

  # Try to stop gracefully, fallback to force if still alive
  kill "$pid" 2>/dev/null || true

  # Wait for graceful shutdown (up to ~2s)
  for i in {1..20}; do
    if ! kill -0 "$pid" 2>/dev/null; then
      break
    fi
    sleep 0.1
  done

  # If still running, escalate to SIGKILL
  if kill -0 "$pid" 2>/dev/null; then
    if ! owns_pid "$pid" "$SESSION_DIR"; then
      rm -f "$PID_FILE" "${STATE_DIR}/server.log"
      echo '{"status": "stale_pid"}'
      exit 0
    fi

    kill -9 "$pid" 2>/dev/null || true

    # Give SIGKILL a moment to take effect
    sleep 0.1
  fi

  if kill -0 "$pid" 2>/dev/null; then
    echo '{"status": "failed", "error": "process still running"}'
    exit 1
  fi

  rm -f "$PID_FILE" "${STATE_DIR}/server.log"

  # Only delete ephemeral /tmp directories
  if [[ "$SESSION_DIR" == /tmp/* ]]; then
    rm -rf "$SESSION_DIR"
  fi

  echo '{"status": "stopped"}'
else
  echo '{"status": "not_running"}'
fi
