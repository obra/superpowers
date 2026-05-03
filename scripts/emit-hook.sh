#!/usr/bin/env bash
# emit-hook.sh — Lifecycle event dispatcher for Superpowers plugins.
#
# Usage: emit-hook.sh <EventName> [key=value ...]
#
# Reads $SUPERPOWERS_HOOK_DIRS (colon-separated, like $PATH). For each
# dir, runs <dir>/<EventName>.sh if it exists and is executable, with
# key=value pairs translated to SP_<KEY> env vars (uppercased).
#
# Failures (nonzero exit, timeout, missing exec bit) log a warning to
# stderr and skip to the next dir. emit-hook.sh always exits 0.

set -uo pipefail

readonly DEFAULT_TIMEOUT=10

# Resolve timeout command (Linux: timeout; macOS w/ coreutils: gtimeout).
TIMEOUT_CMD=""
if command -v timeout >/dev/null 2>&1; then
  TIMEOUT_CMD="timeout"
elif command -v gtimeout >/dev/null 2>&1; then
  TIMEOUT_CMD="gtimeout"
fi

# Always exit 0; never propagate plugin failures to caller.
trap 'exit 0' EXIT

if [[ $# -lt 1 ]]; then
  echo "[hook warn] emit-hook.sh: missing event name" >&2
  exit 0
fi

if [[ -z "${SUPERPOWERS_HOOK_DIRS:-}" ]]; then
  exit 0
fi

event_name="$1"; shift

declare -a env_assignments=()
for arg in "$@"; do
  if [[ "$arg" != *"="* ]]; then
    echo "[hook warn] emit-hook.sh: malformed arg '$arg' (expected key=value)" >&2
    continue
  fi
  key="${arg%%=*}"
  val="${arg#*=}"
  upper_key="SP_$(printf '%s' "$key" | tr '[:lower:]' '[:upper:]')"
  env_assignments+=("$upper_key=$val")
done

IFS=':' read -ra dirs <<< "$SUPERPOWERS_HOOK_DIRS"
for dir in "${dirs[@]}"; do
  [[ -z "$dir" ]] && continue
  hook_script="$dir/${event_name}.sh"

  [[ ! -e "$hook_script" ]] && continue

  if [[ ! -x "$hook_script" ]]; then
    echo "[hook warn] $event_name in $dir: not executable" >&2
    continue
  fi

  hook_timeout="${SUPERPOWERS_HOOK_TIMEOUT:-$DEFAULT_TIMEOUT}"

  if [[ -n "$TIMEOUT_CMD" ]]; then
    env "${env_assignments[@]}" \
      "$TIMEOUT_CMD" --kill-after=1 "$hook_timeout" "$hook_script" </dev/null >/dev/null
    rc=$?
    if [[ "$rc" -eq 124 || "$rc" -eq 137 ]]; then
      echo "[hook warn] $event_name in $dir: timed out after ${hook_timeout}s" >&2
    elif [[ "$rc" -ne 0 ]]; then
      echo "[hook warn] $event_name in $dir: exit $rc" >&2
    fi
  else
    # No timeout(1) available — run unbounded with one-time warning.
    if [[ -z "${EMIT_HOOK_TIMEOUT_WARNED:-}" ]]; then
      echo "[hook warn] timeout(1) not available; hooks run unbounded" >&2
      EMIT_HOOK_TIMEOUT_WARNED=1
      export EMIT_HOOK_TIMEOUT_WARNED
    fi
    env "${env_assignments[@]}" "$hook_script" </dev/null >/dev/null
    rc=$?
    if [[ "$rc" -ne 0 ]]; then
      echo "[hook warn] $event_name in $dir: exit $rc" >&2
    fi
  fi
done

exit 0
