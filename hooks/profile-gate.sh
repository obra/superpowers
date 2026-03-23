#!/usr/bin/env bash
# Profile gating for ultrapowers hooks.
# Source this from any hook, then call: profile_gate <minimum_level>
#   1 = minimal, 2 = standard, 3 = strict
# Returns 0 (run) or 1 (skip).

ULTRAPOWERS_PROFILE="${ULTRAPOWERS_HOOK_PROFILE:-standard}"

case "$ULTRAPOWERS_PROFILE" in
  minimal)  _UP_LEVEL=1 ;;
  standard) _UP_LEVEL=2 ;;
  strict)   _UP_LEVEL=3 ;;
  *)        _UP_LEVEL=2 ;;
esac

profile_gate() {
  [ "$_UP_LEVEL" -ge "$1" ] && return 0 || return 1
}
