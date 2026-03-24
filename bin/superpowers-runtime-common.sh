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

  while :; do
    if [[ "$input" == */* ]]; then
      part="${input%%/*}"
      input="${input#*/}"
    else
      part="$input"
      input=""
    fi
    case "$part" in
      ''|'.') ;;
      '..') return 1 ;;
      *) normalized="${normalized:+$normalized/}$part" ;;
    esac
    [[ -n "$input" ]] || break
  done
  [ -n "$normalized" ] || return 1
  printf '%s\n' "$normalized"
}

normalize_whitespace() {
  local value="${1:-}" normalized="" token
  local -a tokens=()

  value="${value//$'\r'/ }"
  value="${value//$'\n'/ }"
  value="${value//$'\t'/ }"
  value="${value//$'\v'/ }"
  value="${value//$'\f'/ }"

  read -r -a tokens <<< "$value"
  if ((${#tokens[@]} > 0)); then
    for token in "${tokens[@]}"; do
      normalized="${normalized:+$normalized }$token"
    done
  fi

  printf '%s\n' "$normalized"
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

trim_surrounding_whitespace() {
  local value="${1:-}"

  while [[ "$value" == [[:space:]]* ]]; do
    value="${value#?}"
  done
  while [[ "$value" == *[[:space:]] ]]; do
    value="${value%?}"
  done

  printf '%s\n' "$value"
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

resolve_superpowers_host_target() {
  local os arch
  os="$(uname -s)"
  arch="$(uname -m)"

  case "$os:$arch" in
    Darwin:arm64)
      printf '%s\n' "darwin-arm64"
      ;;
    MINGW*:x86_64|MSYS*:x86_64|CYGWIN*:x86_64)
      printf '%s\n' "windows-x64"
      ;;
    *)
      return 1
      ;;
  esac
}

read_superpowers_manifest_target_entry() {
  local manifest_path="${1:-}"
  local host_target="${2:-}"

  [[ -f "$manifest_path" && -n "$host_target" ]] || return 1

  awk -v target="$host_target" '
    BEGIN {
      in_target = 0
      depth = 0
      binary = ""
      checksum = ""
    }
    {
      line = $0
      if (!in_target && line ~ "\"" target "\"[[:space:]]*:[[:space:]]*\\{") {
        in_target = 1
        brace_line = line
        depth += gsub(/\{/, "{", brace_line)
        depth -= gsub(/\}/, "}", brace_line)
        next
      }
      if (!in_target) {
        next
      }
      if (binary == "" && line ~ /"binary_path"[[:space:]]*:/) {
        split(line, parts, "\"")
        if (length(parts) >= 4) {
          binary = parts[4]
        }
      }
      if (checksum == "" && line ~ /"checksum_path"[[:space:]]*:/) {
        split(line, parts, "\"")
        if (length(parts) >= 4) {
          checksum = parts[4]
        }
      }
      brace_line = line
      depth += gsub(/\{/, "{", brace_line)
      depth -= gsub(/\}/, "}", brace_line)
      if (depth <= 0) {
        if (binary != "" && checksum != "") {
          printf "%s\t%s\n", binary, checksum
          exit 0
        }
        exit 1
      }
    }
    END {
      if (binary == "" || checksum == "") {
        exit 1
      }
    }
  ' "$manifest_path"
}

read_superpowers_sha256_checksum() {
  local checksum_path="${1:-}" checksum=""

  [[ -f "$checksum_path" ]] || return 1
  checksum="$(awk 'NF { print $1; exit }' "$checksum_path")"
  [[ "$checksum" =~ ^[0-9A-Fa-f]{64}$ ]] || return 1
  printf '%s\n' "$checksum" | tr '[:upper:]' '[:lower:]'
}

superpowers_sha256_file() {
  local file_path="${1:-}"

  if command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "$file_path" | awk '{print $1}'
    return 0
  fi
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$file_path" | awk '{print $1}'
    return 0
  fi
  if command -v openssl >/dev/null 2>&1; then
    openssl dgst -sha256 "$file_path" | awk '{print $NF}'
    return 0
  fi

  return 1
}

resolve_superpowers_repo_runtime_binary() {
  local runtime_root="${1:-}"
  local host_target="${2:-}"
  local manifest_path entry binary_rel checksum_rel binary_path checksum_path expected_checksum actual_checksum

  manifest_path="$runtime_root/bin/prebuilt/manifest.json"
  [[ -f "$manifest_path" ]] || {
    printf 'Missing checked-in prebuilt manifest %s.\n' "$manifest_path" >&2
    return 1
  }

  entry="$(read_superpowers_manifest_target_entry "$manifest_path" "$host_target")" || {
    printf 'Checked-in prebuilt manifest %s does not define a runtime for host target %s.\n' "$manifest_path" "$host_target" >&2
    return 1
  }

  IFS=$'\t' read -r binary_rel checksum_rel <<< "$entry"
  binary_rel="$(normalize_repo_relative_path "$binary_rel")" || {
    printf 'Manifest binary path is invalid.\n' >&2
    return 1
  }
  checksum_rel="$(normalize_repo_relative_path "$checksum_rel")" || {
    printf 'Manifest checksum path is invalid.\n' >&2
    return 1
  }

  binary_path="$runtime_root/$binary_rel"
  checksum_path="$runtime_root/$checksum_rel"

  [[ -f "$binary_path" ]] || {
    printf 'Checked-in Superpowers runtime binary not found at manifest-selected path %s.\n' "$binary_path" >&2
    return 1
  }
  [[ -f "$checksum_path" ]] || {
    printf 'Checked-in Superpowers checksum file not found at manifest-selected path %s.\n' "$checksum_path" >&2
    return 1
  }

  expected_checksum="$(read_superpowers_sha256_checksum "$checksum_path")" || {
    printf 'Checked-in checksum file %s does not contain a valid sha256 digest.\n' "$checksum_path" >&2
    return 1
  }
  actual_checksum="$(superpowers_sha256_file "$binary_path")" || {
    printf 'Could not compute sha256 for checked-in runtime %s.\n' "$binary_path" >&2
    return 1
  }
  actual_checksum="$(printf '%s\n' "$actual_checksum" | tr '[:upper:]' '[:lower:]')"

  [[ "$actual_checksum" == "$expected_checksum" ]] || {
    printf 'Checked-in runtime checksum mismatch for %s: expected %s, got %s.\n' "$binary_path" "$expected_checksum" "$actual_checksum" >&2
    return 1
  }

  printf '%s\n' "$binary_path"
}
