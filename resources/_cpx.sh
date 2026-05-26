# Shared resolver for cpx_press.py (source from seal-*.sh).
_resolve_cpx_press() {
  local start="${1:-}"
  local d="$start"
  while [[ -n "$d" && "$d" != "/" ]]; do
    if [[ -f "${d}/skills/code-presser/scripts/cpx_press.py" ]]; then
      echo "${d}/skills/code-presser/scripts/cpx_press.py"
      return 0
    fi
    if [[ -f "${d}/superpowers/skills/code-presser/scripts/cpx_press.py" ]]; then
      echo "${d}/superpowers/skills/code-presser/scripts/cpx_press.py"
      return 0
    fi
    d="$(dirname "$d")"
  done
  local fallback="${ISAAC_REPO:-${HOME}/workspace/isaac}/superpowers/skills/code-presser/scripts/cpx_press.py"
  if [[ -f "$fallback" ]]; then
    echo "$fallback"
    return 0
  fi
  return 1
}
