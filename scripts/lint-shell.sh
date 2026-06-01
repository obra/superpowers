#!/usr/bin/env bash
#
# Lint shell scripts in this repository.
#
# Usage:
#   scripts/lint-shell.sh [--all] [--format] [--strict] [file ...]
#
# By default, runs ShellCheck and shell syntax checks on changed shell scripts.
# Use --format to format with shfmt before linting. Use --all for the full tracked
# baseline, or pass files explicitly to lint a smaller set.
set -euo pipefail

usage() {
  sed -n '2,9p' "$0" | sed 's/^# \{0,1\}//'
}

die() {
  echo "error: $*" >&2
  exit 1
}

require_tool() {
  command -v "$1" >/dev/null 2>&1 || die "required tool '$1' is not on PATH"
}

is_shell_file() {
  local path="$1"
  local first_line=""

  [[ -f "$path" ]] || return 1

  case "$path" in
    *.sh)
      return 0
      ;;
  esac

  IFS= read -r first_line <"$path" || true
  [[ "$first_line" =~ ^#!.*[/[:space:]](bash|dash|ksh|sh)([[:space:]]|$) ]]
}

ensure_git_work_tree() {
  git rev-parse --is-inside-work-tree >/dev/null 2>&1 \
    || die "run this from inside a git work tree, or pass files explicitly"
}

add_shell_file() {
  local path
  local existing

  path="$1"
  if ! is_shell_file "$path"; then
    return 0
  fi

  if [[ "${#files[@]}" -gt 0 ]]; then
    for existing in "${files[@]}"; do
      if [[ "$existing" == "$path" ]]; then
        return 0
      fi
    done
  fi

  files+=("$path")
}

collect_all_shell_files() {
  local path

  ensure_git_work_tree

  while IFS= read -r -d '' path; do
    add_shell_file "$path"
  done < <(git ls-files -z)
}

collect_changed_shell_files() {
  local path

  ensure_git_work_tree

  if git rev-parse --verify HEAD >/dev/null 2>&1; then
    while IFS= read -r -d '' path; do
      add_shell_file "$path"
    done < <(git diff --name-only -z --diff-filter=ACMR HEAD)

    while IFS= read -r -d '' path; do
      add_shell_file "$path"
    done < <(git diff --cached --name-only -z --diff-filter=ACMR)
  else
    collect_all_shell_files
  fi

  while IFS= read -r -d '' path; do
    add_shell_file "$path"
  done < <(git ls-files --others --exclude-standard -z)
}

collect_requested_shell_files() {
  local path

  for path in "$@"; do
    add_shell_file "$path"
  done
}

syntax_shell_for() {
  local path="$1"
  local first_line=""

  IFS= read -r first_line <"$path" || true

  case "$first_line" in
    *"/sh"* | *" env sh"* | *"/dash"* | *" env dash"*)
      printf 'sh'
      ;;
    *)
      printf 'bash'
      ;;
  esac
}

run_syntax_checks() {
  local file
  local shell_name

  for file in "$@"; do
    shell_name="$(syntax_shell_for "$file")"
    case "$shell_name" in
      sh)
        sh -n "$file"
        ;;
      bash)
        bash -n "$file"
        ;;
      *)
        die "unsupported shell for syntax check: $shell_name"
        ;;
    esac
  done
}

format=false
strict=false
all=false
requested_files=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --all)
      all=true
      ;;
    --format)
      format=true
      ;;
    --strict)
      strict=true
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    --)
      shift
      requested_files+=("$@")
      break
      ;;
    -*)
      die "unknown option: $1"
      ;;
    *)
      requested_files+=("$1")
      ;;
  esac
  shift
done

require_tool shellcheck
if [[ "$format" == true ]]; then
  require_tool shfmt
fi

files=()
if [[ "${#requested_files[@]}" -gt 0 ]]; then
  collect_requested_shell_files "${requested_files[@]}"
elif [[ "$all" == true ]]; then
  collect_all_shell_files
else
  collect_changed_shell_files
fi

if [[ "${#files[@]}" -eq 0 ]]; then
  echo "No shell files found."
  exit 0
fi

if [[ "$format" == true ]]; then
  echo "Formatting ${#files[@]} shell files"
  shfmt_args=(-i 2 -ci -bn)
  shfmt "${shfmt_args[@]}" -w "${files[@]}"
fi

echo "Linting ${#files[@]} shell files"

shellcheck_args=(--severity=warning --external-sources --source-path=SCRIPTDIR)
if [[ "$strict" == true ]]; then
  shellcheck_args+=("--enable=check-extra-masked-returns,check-set-e-suppressed,quote-safe-variables,deprecate-which,avoid-nullary-conditions")
fi

shellcheck "${shellcheck_args[@]}" "${files[@]}"
run_syntax_checks "${files[@]}"
