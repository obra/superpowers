# Hermes Version-Bump Wiring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the Hermes YAML manifest version synchronized with every other declared release manifest.

**Spec:** `docs/superpowers/specs/2026-08-05-hermes-version-bump-wiring-design.md`

**Architecture:** Extend the existing release script with a small extension-based dispatcher: JSON continues through `jq`, while `.yaml` uses Mike Farah `yq` v4. Before the mutating bump loop, read every present manifest through that dispatcher so deterministic format or field failures occur before the first write.

**Tech Stack:** Bash 3.2-compatible shell, `jq`, Mike Farah `yq` v4, existing shell-lint tooling.

## Global Constraints

- Support only `.json` and `.yaml`; `.yml` and other extensions remain unsupported.
- YAML fields are present top-level strings; nested YAML fields are out of scope.
- Pass the YAML field and new value through environment data, never interpolate either into a `yq` expression.
- Keep `yq` confined to maintainer release tooling; do not add a plugin runtime dependency.
- Preserve the existing missing-file behavior: `--check` reports missing files and a bump skips them.
- Preflight only the mutating bump path; do not add rollback or transactional writes.
- Do not change audit status behavior, version validation, or the existing JSON field-expression implementation.

---

## File Map

- Create: `tests/version-bump/test-bump-version.sh`
  - Exercise the real script in temporary JSON/YAML fixtures and check the real registry.
- Modify: `scripts/bump-version.sh`
  - Add YAML read/write helpers, format dispatch, and bump-only read preflight.
- Modify: `.version-bump.json`
  - Register `.hermes-plugin/plugin.yaml` at top-level field `version`.

### Task 1: Wire Hermes Into The Existing Version-Bump Script

**Files:**
- Create: `tests/version-bump/test-bump-version.sh`
- Modify: `scripts/bump-version.sh`
- Modify: `.version-bump.json`

**Interfaces:**
- Consumes: `.version-bump.json` records shaped as `{ "path": string, "field": string }`.
- Produces: `read_manifest_field FILE FIELD`, `write_manifest_field FILE FIELD VALUE`, and `preflight_manifests` Bash helpers.

- [ ] **Step 1: Fetch the current development base**

Run:

```bash
git fetch origin dev
```

Expected: command exits 0 and refreshes `origin/dev`.

- [ ] **Step 2: Rebase the task branch**

Run:

```bash
git rebase origin/dev
```

Expected: command exits 0, and `git status --short --branch` no longer reports the branch behind `origin/dev`.

- [ ] **Step 3: Add the initial failing behavioral test**

Create `tests/version-bump/test-bump-version.sh` with the happy-path fixture and real registry assertion:

```bash
#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SCRIPT_SOURCE="$REPO_ROOT/scripts/bump-version.sh"
TEST_ROOT="$(mktemp -d)"

cleanup() {
  rm -rf "$TEST_ROOT"
}
trap cleanup EXIT

fail() {
  echo "FAIL: $*" >&2
  exit 1
}

make_fixture() {
  local repo="$1"
  local yaml_body="$2"

  mkdir -p "$repo/scripts" "$repo/.hermes-plugin"
  cp "$SCRIPT_SOURCE" "$repo/scripts/bump-version.sh"
  cat >"$repo/.version-bump.json" <<'JSON'
{
  "files": [
    { "path": "package.json", "field": "version" },
    { "path": ".hermes-plugin/plugin.yaml", "field": "version" }
  ],
  "audit": { "exclude": [] }
}
JSON
  cat >"$repo/package.json" <<'JSON'
{
  "name": "fixture",
  "version": "1.2.3"
}
JSON
  printf '%s\n' "$yaml_body" >"$repo/.hermes-plugin/plugin.yaml"
}

happy_repo="$TEST_ROOT/happy"
make_fixture "$happy_repo" $'name: superpowers\nversion: 1.2.3'

/bin/bash "$happy_repo/scripts/bump-version.sh" --check >"$TEST_ROOT/check.out"
/bin/bash "$happy_repo/scripts/bump-version.sh" --audit >"$TEST_ROOT/audit.out"
/bin/bash "$happy_repo/scripts/bump-version.sh" 2.3.4 >"$TEST_ROOT/bump.out"

[[ "$(jq -r '.version' "$happy_repo/package.json")" == "2.3.4" ]] \
  || fail "JSON manifest was not bumped"
[[ "$(yq -r '.version' "$happy_repo/.hermes-plugin/plugin.yaml")" == "2.3.4" ]] \
  || fail "YAML manifest was not bumped"

jq -e '
  any(.files[];
    .path == ".hermes-plugin/plugin.yaml" and .field == "version")
' "$REPO_ROOT/.version-bump.json" >/dev/null \
  || fail "Hermes manifest is not registered"

echo "Version-bump tests passed"
```

- [ ] **Step 4: Run the test to verify RED**

Run:

```bash
/bin/bash tests/version-bump/test-bump-version.sh
```

Expected: FAIL before `Version-bump tests passed`; the current JSON-only reader cannot process the YAML fixture.

- [ ] **Step 5: Add minimal YAML dispatch and register Hermes**

In `scripts/bump-version.sh`, add these helpers after `write_json_field`:

```bash
require_tool() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "error: required tool '$1' is not on PATH" >&2
    return 1
  }
}

read_yaml_field() {
  local file="$1" field="$2"
  require_tool yq || return 1
  FIELD="$field" yq -er '.[strenv(FIELD)] | select(tag == "!!str")' "$file"
}

write_yaml_field() {
  local file="$1" field="$2" value="$3"
  FIELD="$field" VALUE="$value" \
    yq -i '.[strenv(FIELD)] = strenv(VALUE)' "$file"
}

read_manifest_field() {
  local file="$1"

  case "$file" in
    *.json) read_json_field "$@" ;;
    *.yaml) read_yaml_field "$@" ;;
    *)
      echo "error: unsupported manifest format: $file" >&2
      return 1
      ;;
  esac
}

write_manifest_field() {
  local file="$1"

  case "$file" in
    *.json) write_json_field "$@" ;;
    *.yaml) write_yaml_field "$@" ;;
    *)
      echo "error: unsupported manifest format: $file" >&2
      return 1
      ;;
  esac
}
```

Replace the three command-path calls to `read_json_field` with `read_manifest_field`, and replace the bump-path call to `write_json_field` with `write_manifest_field`.

Add this exact entry to `.version-bump.json` immediately after `package.json`:

```json
{ "path": ".hermes-plugin/plugin.yaml", "field": "version" },
```

- [ ] **Step 6: Run the initial test to verify GREEN**

Run:

```bash
/bin/bash tests/version-bump/test-bump-version.sh
```

Expected: PASS with `Version-bump tests passed`.

- [ ] **Step 7: Add the failing no-partial-write regression**

Insert this block before the final success message in `tests/version-bump/test-bump-version.sh`:

```bash
invalid_repo="$TEST_ROOT/invalid"
make_fixture "$invalid_repo" $'name: superpowers\nversion: 123'
cp "$invalid_repo/package.json" "$TEST_ROOT/package.before"
cp "$invalid_repo/.hermes-plugin/plugin.yaml" "$TEST_ROOT/plugin.before"

if /bin/bash "$invalid_repo/scripts/bump-version.sh" 2.3.4 \
  >"$TEST_ROOT/invalid.out" 2>&1; then
  fail "bump accepted a non-string YAML version"
fi

cmp -s "$TEST_ROOT/package.before" "$invalid_repo/package.json" \
  || fail "JSON manifest changed before YAML validation failed"
cmp -s "$TEST_ROOT/plugin.before" "$invalid_repo/.hermes-plugin/plugin.yaml" \
  || fail "invalid YAML manifest changed"
```

- [ ] **Step 8: Run the regression to verify RED**

Run:

```bash
/bin/bash tests/version-bump/test-bump-version.sh
```

Expected: FAIL with `JSON manifest changed before YAML validation failed`; without preflight, the JSON manifest is written before the later YAML reader rejects its non-string version.

- [ ] **Step 9: Add the bump-only preflight**

Add this helper after `declared_files` in `scripts/bump-version.sh`:

```bash
preflight_manifests() {
  local path field fullpath

  require_tool jq || return 1
  while IFS=$'\t' read -r path field; do
    fullpath="$REPO_ROOT/$path"
    [[ -f "$fullpath" ]] || continue

    if ! read_manifest_field "$fullpath" "$field" >/dev/null; then
      echo "error: cannot read declared manifest: $path ($field)" >&2
      return 1
    fi
  done < <(declared_files)
}
```

Call it in `cmd_bump` after version-format validation and before the first bump output or write:

```bash
  preflight_manifests

  echo "Bumping all declared files to $new_version..."
```

- [ ] **Step 10: Run focused verification**

Run:

```bash
/bin/bash tests/version-bump/test-bump-version.sh
scripts/lint-shell.sh scripts/bump-version.sh tests/version-bump/test-bump-version.sh
scripts/bump-version.sh --check
git diff --check
```

Expected:

- The behavioral test prints `Version-bump tests passed`.
- Shell lint reports both scripts with no errors.
- `--check` lists eight declared manifests, including `.hermes-plugin/plugin.yaml`, all at `6.2.0`.
- `git diff --check` prints nothing.

- [ ] **Step 11: Review and commit the implementation**

Run:

```bash
git status --short
git diff -- .version-bump.json scripts/bump-version.sh tests/version-bump/test-bump-version.sh
git add .version-bump.json scripts/bump-version.sh tests/version-bump/test-bump-version.sh
git commit \
  -m "fix(release): wire Hermes into version bumps" \
  -m "Register the Hermes YAML manifest alongside the existing JSON manifests. Route manifest reads and writes by extension through jq or Mike Farah yq v4, with field names and values passed as data." \
  -m "Preflight every present manifest before the mutating bump loop so a deterministic YAML read failure cannot leave earlier JSON manifests partially updated. Cover check, audit, bump, registry wiring, and byte-for-byte no-partial-write behavior with one focused fixture test."
```

Expected: the commit succeeds with only the three implementation paths staged.
