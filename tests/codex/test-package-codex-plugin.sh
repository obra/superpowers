#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SCRIPT_UNDER_TEST="$REPO_ROOT/scripts/package-codex-plugin.sh"

FAILURES=0
TEST_ROOT="$(mktemp -d)"
linked_worktree=""

cleanup() {
  if [[ -n "$linked_worktree" && -e "$linked_worktree/.git" ]]; then
    git -C "$REPO_ROOT" worktree remove --force "$linked_worktree"
  fi
  rm -rf "$TEST_ROOT"
}
trap cleanup EXIT

pass() {
  echo "  [PASS] $1"
}

fail() {
  echo "  [FAIL] $1"
  FAILURES=$((FAILURES + 1))
}

assert_equals() {
  local actual="$1"
  local expected="$2"
  local description="$3"

  if [[ "$actual" == "$expected" ]]; then
    pass "$description"
  else
    fail "$description"
    echo "    expected: $expected"
    echo "    actual:   $actual"
  fi
}

assert_contains() {
  local haystack="$1"
  local needle="$2"
  local description="$3"

  if printf '%s' "$haystack" | grep -Fq -- "$needle"; then
    pass "$description"
  else
    fail "$description"
    echo "    expected to find: $needle"
  fi
}

assert_not_matches() {
  local haystack="$1"
  local pattern="$2"
  local description="$3"

  if printf '%s' "$haystack" | grep -Eq -- "$pattern"; then
    fail "$description"
    echo "    did not expect to match: $pattern"
  else
    pass "$description"
  fi
}

list_archive() {
  local archive_path="$1"

  case "$archive_path" in
    *.tar.gz|*.tgz)
      tar -tzf "$archive_path"
      ;;
    *.zip)
      unzip -Z1 "$archive_path"
      ;;
    *)
      unzip -Z1 "$archive_path"
      ;;
  esac
}

normalize_archive_paths() {
  sed 's#/$##' | LC_ALL=C sort
}

extract_archive() {
  local archive_path="$1"
  local destination="$2"

  mkdir -p "$destination"
  case "$archive_path" in
    *.tar.gz|*.tgz)
      tar -xzf "$archive_path" -C "$destination"
      ;;
    *.zip)
      unzip -q "$archive_path" -d "$destination"
      ;;
    *)
      unzip -q "$archive_path" -d "$destination"
      ;;
  esac
}

read_archive_file() {
  local archive_path="$1"
  local file_path="$2"

  case "$archive_path" in
    *.tar.gz|*.tgz)
      tar -xOf "$archive_path" "$file_path"
      ;;
    *.zip)
      unzip -p "$archive_path" "$file_path"
      ;;
    *)
      unzip -p "$archive_path" "$file_path"
      ;;
  esac
}

write_metadata_fixture() {
  local destination="$1"
  local skill

  while IFS= read -r skill; do
    if [[ "$skill" == "agent-routing" ]]; then
      continue
    fi
    mkdir -p "$destination/skills/$skill/agents"
    cat >"$destination/skills/$skill/agents/openai.yaml" <<EOF
interface:
  display_name: "$skill"
  short_description: "Fixture metadata for $skill"
EOF
  done < <(find "$REPO_ROOT/skills" -mindepth 1 -maxdepth 1 -type d -print | sed 's#.*/##' | sort)
}

echo "Codex package archive tests"

metadata_source="$TEST_ROOT/metadata-source"
archive="$TEST_ROOT/toolbelt"
tar_archive="$TEST_ROOT/toolbelt.tar.gz"
extracted="$TEST_ROOT/extracted"
tar_extracted="$TEST_ROOT/tar-extracted"
write_metadata_fixture "$metadata_source"

source_hooks="$(python3 -c 'import json; print(json.load(open("'"$REPO_ROOT"'/.codex-plugin/plugin.json")).get("hooks"))')"
assert_equals "$source_hooks" "{}" "source Codex manifest suppresses local hook auto-discovery"

enclosing_repo="$TEST_ROOT/enclosing-repo"
nested_source="$enclosing_repo/nested-source"
git -C "$TEST_ROOT" init -q "$enclosing_repo"
git -C "$enclosing_repo" config user.email "test@example.com"
git -C "$enclosing_repo" config user.name "Test User"
printf 'outer checkout\n' >"$enclosing_repo/README.md"
git -C "$enclosing_repo" add README.md
git -C "$enclosing_repo" commit -qm "outer checkout"
mkdir -p "$nested_source/scripts"
cp "$SCRIPT_UNDER_TEST" "$nested_source/scripts/package-codex-plugin.sh"

set +e
nested_output="$("$nested_source/scripts/package-codex-plugin.sh" --allow-dirty --metadata-source "$metadata_source" --output "$TEST_ROOT/nested.zip" 2>&1)"
nested_status=$?
set -e
if [[ "$nested_status" -ne 0 ]]; then
  pass "package script rejects a source tree nested in another checkout"
else
  fail "package script rejects a source tree nested in another checkout"
fi
assert_contains "$nested_output" "ERROR: repo root is not a git checkout: $nested_source" "nested source rejection identifies the invalid repository root"

linked_worktree="$TEST_ROOT/linked-worktree"
git -C "$REPO_ROOT" worktree add --detach -q "$linked_worktree" HEAD
cp "$SCRIPT_UNDER_TEST" "$linked_worktree/scripts/package-codex-plugin.sh"
if linked_output="$("$linked_worktree/scripts/package-codex-plugin.sh" --allow-dirty --metadata-source "$metadata_source" --output "$TEST_ROOT/linked.zip" 2>&1)"; then
  pass "package script accepts a linked worktree repository root"
else
  fail "package script accepts a linked worktree repository root"
  printf '%s\n' "$linked_output" | sed 's/^/      /'
fi
git -C "$REPO_ROOT" worktree remove --force "$linked_worktree"
linked_worktree=""

if output="$("$SCRIPT_UNDER_TEST" --allow-dirty --metadata-source "$metadata_source" --output "$archive" 2>&1)"; then
  pass "package script exits successfully"
else
  fail "package script exits successfully"
  printf '%s\n' "$output" | sed 's/^/      /'
fi

if [[ -f "$archive" ]]; then
  pass "package script writes archive"
else
  fail "package script writes archive"
fi

assert_contains "$output" "Archive:" "reports archive path"
assert_contains "$output" "Format:  zip" "reports default zip format"
assert_contains "$output" "SHA-256:" "reports archive checksum"

extract_archive "$archive" "$extracted"

archive_paths="$(list_archive "$archive" | normalize_archive_paths)"
unexpected_pattern='(^toolbelt/|^\.agents/|^hooks/|package\.json$|^\.git|^\.pytest_cache|^\.ruff_cache|^scripts/|^tests/|^docs/|^evals/|^lib/|^\.claude|^\.cursor|^\.kimi|^\.opencode|^\.pi|^AGENTS\.md$|^CLAUDE\.md$|^GEMINI\.md$|^RELEASE-NOTES\.md$|^CHANGELOG\.md$)'
assert_not_matches "$archive_paths" "$unexpected_pattern" "archive excludes source-only paths"
assert_contains "$archive_paths" ".codex-plugin/plugin.json" "archive includes Codex manifest"
assert_contains "$archive_paths" "skills/brainstorming/SKILL.md" "archive includes skills"
assert_contains "$archive_paths" "skills/brainstorming/agents/openai.yaml" "archive includes OpenAI skill metadata"
assert_contains "$archive_paths" "skills/agent-routing/SKILL.md" "archive includes routing skill"
assert_contains "$archive_paths" "skills/agent-routing/routing/claude.md" "archive includes Claude routing default"
assert_contains "$archive_paths" "skills/agent-routing/routing/codex.md" "archive includes Codex routing default"
assert_contains "$archive_paths" "skills/agent-routing/agents/openai.yaml" "archive includes committed routing metadata"
for ws_skill in quick-task pr-monitor ux-gate delivery; do
  assert_contains "$archive_paths" "skills/$ws_skill/SKILL.md" "archive includes $ws_skill skill"
  assert_contains "$archive_paths" "skills/$ws_skill/agents/openai.yaml" "archive includes committed $ws_skill metadata"
done
assert_not_matches "$archive_paths" '^skills/workstack-(start|resume|spec-review|slice-gate)(/|$)' "archive excludes superseded skills"
assert_contains "$archive_paths" "assets/app-icon.png" "archive includes app icon"
assert_contains "$archive_paths" "assets/toolbelt-small.svg" "archive includes composer icon"

packaged_routing_metadata="$(read_archive_file "$archive" skills/agent-routing/agents/openai.yaml)"
committed_routing_metadata="$(git -C "$REPO_ROOT" show HEAD:skills/agent-routing/agents/openai.yaml)"
assert_equals "$packaged_routing_metadata" "$committed_routing_metadata" "committed routing metadata is retained without an external fixture entry"

manifest_summary="$(read_archive_file "$archive" .codex-plugin/plugin.json | python3 -c 'import json,sys; data=json.load(sys.stdin); print("\t".join([data["name"], data["version"], data["skills"], str(data.get("hooks"))]))')"
expected_version="$(python3 -c 'import json; print(json.load(open("'"$REPO_ROOT"'/.codex-plugin/plugin.json"))["version"])')"
assert_equals "$manifest_summary" "toolbelt	$expected_version	./skills/	$source_hooks" "archive manifest preserves source hooks"

skill_count="$(find "$extracted/skills" -mindepth 1 -maxdepth 1 -type d | wc -l | tr -d ' ')"
metadata_count="$(find "$extracted/skills" -path '*/agents/openai.yaml' -type f | wc -l | tr -d ' ')"
assert_equals "$metadata_count" "$skill_count" "every packaged skill has OpenAI metadata"

if [[ -x "$extracted/skills/delivery/scripts/task-brief" ]]; then
  pass "archive preserves executable script mode"
else
  fail "archive preserves executable script mode"
fi

zip_times="$(python3 - "$archive" <<'PY'
import sys
import zipfile

with zipfile.ZipFile(sys.argv[1]) as archive:
    print("\n".join(sorted({str(info.date_time) for info in archive.infolist()})))
PY
)"
assert_equals "$zip_times" "(1980, 1, 1, 0, 0, 0)" "zip archive normalizes entry timestamps"

if tar_output="$("$SCRIPT_UNDER_TEST" --allow-dirty --metadata-source "$metadata_source" --format tar.gz --output "$tar_archive" 2>&1)"; then
  pass "package script writes explicit tar.gz archive"
else
  fail "package script writes explicit tar.gz archive"
  printf '%s\n' "$tar_output" | sed 's/^/      /'
fi
assert_contains "$tar_output" "Format:  tar.gz" "reports explicit tar.gz format"

extract_archive "$tar_archive" "$tar_extracted"
tar_archive_paths="$(list_archive "$tar_archive" | normalize_archive_paths)"
assert_equals "$tar_archive_paths" "$archive_paths" "zip and tar.gz archives contain the same paths"

tar_task_brief_mode="$(tar -tzvf "$tar_archive" skills/delivery/scripts/task-brief | awk '{print $1}')"
assert_equals "$tar_task_brief_mode" "-rwxr-xr-x" "tar.gz archive preserves executable script mode"

tar_metadata_times="$(python3 - "$tar_archive" <<'PY'
import sys
import tarfile

with tarfile.open(sys.argv[1]) as archive:
    print("\n".join(sorted({str(int(member.mtime)) for member in archive.getmembers()})))
PY
)"
assert_equals "$tar_metadata_times" "0" "tar.gz archive normalizes entry timestamps"

metadata_archive="$TEST_ROOT/metadata-source.tar.gz"
metadata_zip="$TEST_ROOT/metadata-source.zip"
archive_from_tar_source="$TEST_ROOT/toolbelt-from-tar-source.zip"
archive_from_zip_source="$TEST_ROOT/toolbelt-from-zip-source.zip"
(
  cd "$metadata_source"
  tar -czf "$metadata_archive" .
  zip -X -q -r "$metadata_zip" .
)

if output="$("$SCRIPT_UNDER_TEST" --allow-dirty --metadata-source "$metadata_archive" --output "$archive_from_tar_source" 2>&1)"; then
  pass "package script accepts tarball metadata source"
else
  fail "package script accepts tarball metadata source"
  printf '%s\n' "$output" | sed 's/^/      /'
fi

if cmp -s "$archive" "$archive_from_tar_source"; then
  pass "tarball metadata source produces identical archive"
else
  fail "tarball metadata source produces identical archive"
fi

if output="$("$SCRIPT_UNDER_TEST" --allow-dirty --metadata-source "$metadata_zip" --output "$archive_from_zip_source" 2>&1)"; then
  pass "package script accepts zip metadata source"
else
  fail "package script accepts zip metadata source"
  printf '%s\n' "$output" | sed 's/^/      /'
fi

if cmp -s "$archive" "$archive_from_zip_source"; then
  pass "zip metadata source produces identical archive"
else
  fail "zip metadata source produces identical archive"
fi

incomplete_metadata="$TEST_ROOT/incomplete-metadata"
mkdir -p "$incomplete_metadata/skills/brainstorming/agents"
cp "$metadata_source/skills/brainstorming/agents/openai.yaml" \
  "$incomplete_metadata/skills/brainstorming/agents/openai.yaml"

set +e
missing_output="$("$SCRIPT_UNDER_TEST" --allow-dirty --metadata-source "$incomplete_metadata" --output "$TEST_ROOT/missing.tar.gz" 2>&1)"
missing_status=$?
set -e
if [[ "$missing_status" -ne 0 ]]; then
  pass "package script rejects incomplete metadata source"
else
  fail "package script rejects incomplete metadata source"
fi
assert_contains "$missing_output" "ERROR: OpenAI agent metadata is unavailable from committed source or metadata source" "missing metadata reports both attempted sources"

dirty_repo="$TEST_ROOT/dirty-repo"
git clone -q --no-local "$REPO_ROOT" "$dirty_repo"
printf '\n# dirty fixture\n' >>"$dirty_repo/README.md"
set +e
dirty_output="$(
  cd "$dirty_repo"
  scripts/package-codex-plugin.sh \
    --metadata-source "$metadata_source" \
    --output "$TEST_ROOT/dirty.zip" 2>&1
)"
dirty_status=$?
set -e
if [[ "$dirty_status" -ne 0 ]]; then
  pass "package script rejects dirty worktree by default"
else
  fail "package script rejects dirty worktree by default"
fi
assert_contains "$dirty_output" "Working tree has uncommitted changes:" "dirty worktree reports changed files"

if [[ "$FAILURES" -eq 0 ]]; then
  echo "All Codex package archive tests passed"
else
  echo "$FAILURES Codex package archive test(s) failed"
  exit 1
fi
