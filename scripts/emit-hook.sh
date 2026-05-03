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

# Always exit 0; never propagate plugin failures to caller.
trap 'exit 0' EXIT

if [[ $# -lt 1 ]]; then
  echo "[hook warn] emit-hook.sh: missing event name" >&2
  exit 0
fi

# Silent no-op if no plugins are registered.
if [[ -z "${SUPERPOWERS_HOOK_DIRS:-}" ]]; then
  exit 0
fi

# Further behavior added in Task 2.
exit 0
