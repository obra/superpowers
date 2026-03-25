#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

LEGACY_WORD='super'
LEGACY_WORD+='powers'
LEGACY_ENV='SUPER'
LEGACY_ENV+='POWERS_'
LEGACY_PATTERN="${LEGACY_WORD}|using_${LEGACY_WORD}_skill|using-${LEGACY_WORD}|\\.${LEGACY_WORD}|${LEGACY_ENV}"
README_ALLOWED_REGEX='^README\.md:[0-9]+:FeatureForge began from upstream [Ss]uperpowers: https://github\.com/obra/[sS]uperpowers$'
SPEC_ARCHIVE_PATH='docs/archive/featureforge/specs/2026-03-24-featureforge-rename-reset-design.md'
PLAN_ARCHIVE_PATH='docs/archive/featureforge/plans/2026-03-24-featureforge-rename-reset.md'
ACTIVE_SPEC_PATH='docs/featureforge/specs/2026-03-24-featureforge-rename-reset-design.md'
ACTIVE_PLAN_PATH='docs/featureforge/plans/2026-03-24-featureforge-rename-reset.md'
ACTIVE_SURFACES=(
  Cargo.toml
  README.md
  RELEASE-NOTES.md
  TODOS.md
  .codex
  .copilot
  agents
  review
  skills
  src
  scripts
  docs
  tests/evals
  tests/differential/README.md
)

fail() {
  printf 'cutover check failed: %s\n' "$1" >&2
  exit 1
}

path_hits="$(
  git ls-files -- "${ACTIVE_SURFACES[@]}" |
    rg -i "$LEGACY_PATTERN" |
    rg -v '^docs/archive/' || true
)"
if [[ -n "$path_hits" ]]; then
  printf 'Forbidden active path names:\n%s\n' "$path_hits" >&2
  fail 'active tracked paths still contain legacy names'
fi

content_hits="$(
  git grep -n -I -E "$LEGACY_PATTERN" -- "${ACTIVE_SURFACES[@]}" ':(exclude)docs/archive/**' |
    grep -E -v "$README_ALLOWED_REGEX" || true
)"
if [[ -n "$content_hits" ]]; then
  printf 'Forbidden active content references:\n%s\n' "$content_hits" >&2
  fail 'active tracked files still contain legacy references'
fi

retired_install_hits="$(
  git grep -n -I -E 'PendingMigration|install migrate|migrate-install' -- \
    .codex/INSTALL.md \
    .copilot/INSTALL.md \
    README.md \
    docs/README.codex.md \
    docs/README.copilot.md || true
)"
if [[ -n "$retired_install_hits" ]]; then
  printf 'Forbidden active migration references:\n%s\n' "$retired_install_hits" >&2
  fail 'active install and operator docs still advertise migration surfaces'
fi

[[ -x bin/featureforge ]] || fail 'bin/featureforge must exist and be executable'
[[ -f bin/prebuilt/darwin-arm64/featureforge ]] || fail 'darwin prebuilt runtime must exist'
[[ -f bin/prebuilt/darwin-arm64/featureforge.sha256 ]] || fail 'darwin checksum must exist'
[[ -f bin/prebuilt/windows-x64/featureforge.exe ]] || fail 'windows prebuilt runtime must exist'
[[ -f bin/prebuilt/windows-x64/featureforge.exe.sha256 ]] || fail 'windows checksum must exist'
grep -Fq 'bin/prebuilt/darwin-arm64/featureforge' bin/prebuilt/manifest.json || fail 'manifest must reference darwin featureforge binary'
grep -Fq 'bin/prebuilt/windows-x64/featureforge.exe' bin/prebuilt/manifest.json || fail 'manifest must reference windows featureforge binary'
if rg -n '[sS]uperpowers' bin/prebuilt/manifest.json >/dev/null; then
  fail 'manifest must not reference retired prebuilt names'
fi

[[ -f "$SPEC_ARCHIVE_PATH" ]] || fail 'rename design spec must be archived under docs/archive/featureforge/specs'
[[ -f "$PLAN_ARCHIVE_PATH" ]] || fail 'rename implementation plan must be archived under docs/archive/featureforge/plans'
[[ ! -e "$ACTIVE_SPEC_PATH" ]] || fail 'active rename design spec copy must be removed after archival'
[[ ! -e "$ACTIVE_PLAN_PATH" ]] || fail 'active rename plan copy must be removed after archival'

printf 'featureforge cutover checks passed\n'
