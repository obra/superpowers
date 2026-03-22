normalize_repo_relative_path() {
  local input="${1:-}" part normalized=""
  case "$input" in
    ''|/*) return 1 ;;
  esac
  if [[ "$input" =~ ^([A-Za-z]:|\\\\) ]]; then
    return 1
  fi
  input="${input//\\//}"
  case "$input" in
    ''|/*|//*) return 1 ;;
  esac
  if [[ "$input" =~ ^[A-Za-z]:/ ]]; then
    return 1
  fi
  while IFS= read -r part; do
    case "$part" in
      ''|'.') continue ;;
      '..') return 1 ;;
      *) normalized="${normalized:+$normalized/}$part" ;;
    esac
  done < <(printf '%s\n' "$input" | tr '/' '\n')
  [ -n "$normalized" ] || return 1
  printf '%s\n' "$normalized"
}

normalize_whitespace() {
  printf '%s' "${1:-}" | tr '\r\n\t' '   ' | sed -E 's/[[:space:]]+/ /g; s/^ //; s/ $//'
}

normalize_whitespace_bounded() {
  local normalized
  local max_len="${2:-}"

  normalized="$(normalize_whitespace "${1:-}")"
  [ -n "$normalized" ] || return 1

  if [[ -n "$max_len" ]] && (( ${#normalized} > max_len )); then
    return 2
  fi

  printf '%s\n' "$normalized"
}

normalize_identifier_token() {
  local value normalized

  value="$(normalize_whitespace "${1:-}")"
  if [[ -z "$value" ]]; then
    printf '\n'
    return 0
  fi

  normalized="$(printf '%s\n' "$value" | sed 's/[^[:alnum:]._-]/-/g')"
  if [[ "$normalized" =~ ^-+$ ]]; then
    printf '\n'
    return 0
  fi

  printf '%s\n' "$normalized"
}

collect_active_instruction_files() {
  local repo_root="${1:-}"
  local start_dir="${2:-$(pwd)}"
  local dir
  local -a nested_dirs=()
  ACTIVE_INSTRUCTION_FILES=()

  [[ -n "$repo_root" && -d "$repo_root" ]] || return 1
  repo_root="$(cd "$repo_root" && pwd -P)"
  if [[ -n "$start_dir" && -d "$start_dir" ]]; then
    start_dir="$(cd "$start_dir" && pwd -P)"
  fi

  [[ -f "$repo_root/AGENTS.md" ]] && ACTIVE_INSTRUCTION_FILES+=("$repo_root/AGENTS.md")
  [[ -f "$repo_root/AGENTS.override.md" ]] && ACTIVE_INSTRUCTION_FILES+=("$repo_root/AGENTS.override.md")
  [[ -f "$repo_root/.github/copilot-instructions.md" ]] && ACTIVE_INSTRUCTION_FILES+=("$repo_root/.github/copilot-instructions.md")

  shopt -s nullglob
  for dir in "$repo_root"/.github/instructions/*.instructions.md; do
    ACTIVE_INSTRUCTION_FILES+=("$dir")
  done
  shopt -u nullglob

  case "$start_dir" in
    "$repo_root" | "$repo_root"/*) ;;
    *) start_dir="$repo_root" ;;
  esac

  dir="$start_dir"
  while :; do
    nested_dirs=("$dir" "${nested_dirs[@]:-}")
    [[ "$dir" == "$repo_root" ]] && break
    dir="$(dirname "$dir")"
  done

  for dir in "${nested_dirs[@]}"; do
    [[ "$dir" == "$repo_root" ]] && continue
    [[ -f "$dir/AGENTS.md" ]] && ACTIVE_INSTRUCTION_FILES+=("$dir/AGENTS.md")
    [[ -f "$dir/AGENTS.override.md" ]] && ACTIVE_INSTRUCTION_FILES+=("$dir/AGENTS.override.md")
  done

  return 0
}
