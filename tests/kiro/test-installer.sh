#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
INSTALLER="$REPO_ROOT/scripts/install-kiro.sh"
TEST_ROOT="$(mktemp -d)"
FAILURES=0

cleanup() { rm -rf "$TEST_ROOT"; }
trap cleanup EXIT
pass() { echo "  [PASS] $1"; }
fail() { echo "  [FAIL] $1"; FAILURES=$((FAILURES + 1)); }
assert_file_contains() {
  local file="$1" text="$2" label="$3"
  if grep -Fq -- "$text" "$file"; then pass "$label"; else fail "$label"; fi
}
assert_absent() {
  local path="$1" label="$2"
  if [ -e "$path" ]; then fail "$label"; else pass "$label"; fi
}
assert_file_not_contains() {
  local file="$1" text="$2" label="$3"
  if grep -Fq -- "$text" "$file" 2>/dev/null; then fail "$label"; else pass "$label"; fi
}
# The installed agent must be the tracked repository profile with three defined
# changes: resource URIs made absolute, the `{{SUPERPOWERS_SKILLS_DIR}}`
# placeholder substituted with `<install_root>/skills`, and the ownership marker
# inserted. Reversing all three must reproduce the tracked file byte-for-byte, so
# any other drift — body, frontmatter, permissions — fails this check.
assert_matches_tracked() {
  local name="$1"
  local generated="$home/.kiro/agents/$name.md"
  local tracked="$REPO_ROOT/.kiro/agents/$name.md"
  if [ ! -f "$generated" ]; then fail "generates $name.md"; return; fi
  assert_file_contains "$generated" '<!-- Managed by the Superpowers Kiro installer. -->' \
    "$name.md carries the ownership marker"
  # The placeholder must be substituted with the absolute skills directory, and
  # no unsubstituted placeholder may leak into the installed agent.
  assert_file_contains "$generated" "$install_root/skills/<skill-name>/" \
    "$name.md resolves reference files under the install root"
  assert_file_not_contains "$generated" '{{SUPERPOWERS_SKILLS_DIR}}' \
    "$name.md has no unsubstituted skills-dir placeholder"
  # Non-vacuity: the transform must change something.
  if diff -q "$generated" "$tracked" >/dev/null 2>&1; then
    fail "$name.md differs from the tracked profile before normalization"
  else
    pass "$name.md differs from the tracked profile before normalization"
  fi
  # Reverse the three transforms: URI absolutization first (only resource lines
  # carry `://<root>/`), then the placeholder substitution (only the body now
  # carries `<root>/skills`), then drop the marker line.
  local normalized
  normalized="$(sed -e "s#://$install_root/#://#g" "$generated" \
    | sed -e "s#$install_root/skills#{{SUPERPOWERS_SKILLS_DIR}}#g" \
          -e '/^<!-- Managed by the Superpowers Kiro installer\. -->$/d')"
  if [ "$normalized" = "$(cat "$tracked")" ]; then
    pass "$name.md equals the tracked profile after reversing the transforms"
  else
    fail "$name.md equals the tracked profile after reversing the transforms"
    diff <(printf '%s\n' "$normalized") "$tracked" | sed 's/^/    /' | head -20
  fi
}

make_release() {
  local version="$1" release_marker="$2"
  local root="$TEST_ROOT/build-$version/superpowers-$version"
  rm -rf "$TEST_ROOT/build-$version"
  mkdir -p "$root/.kiro/agents" "$root/skills/using-superpowers/references"
  cp -R "$REPO_ROOT/skills/." "$root/skills/"
  cp "$REPO_ROOT/.kiro/agents/superpowers.md" \
     "$REPO_ROOT/.kiro/agents/superpowers-worker-default-model.md" \
     "$REPO_ROOT/.kiro/agents/superpowers-worker-lite-model.md" \
     "$root/.kiro/agents/"
  printf '{\n  "name": "superpowers",\n  "version": "%s"\n}\n' "$version" >"$root/package.json"
  printf '%s\n' "$release_marker" >"$root/release-marker.txt"
  tar -czf "$TEST_ROOT/superpowers-$version.tar.gz" -C "$TEST_ROOT/build-$version" "superpowers-$version"
  printf '%s\n' "$TEST_ROOT/superpowers-$version.tar.gz"
}

make_release_without_kiro_mapping() {
  local version="$1" release_marker="$2"
  local archive
  archive="$(make_release "$version" "$release_marker")"
  tar -xzf "$archive" -C "$TEST_ROOT"
  rm "$TEST_ROOT/superpowers-$version/skills/using-superpowers/references/kiro-tools.md"
  tar -czf "$TEST_ROOT/invalid-$version.tar.gz" -C "$TEST_ROOT" "superpowers-$version"
  rm -rf "$TEST_ROOT/superpowers-$version"
  printf '%s\n' "$TEST_ROOT/invalid-$version.tar.gz"
}

mkdir -p "$TEST_ROOT/fakebin"
cat >"$TEST_ROOT/fakebin/curl" <<'CURL'
#!/usr/bin/env bash
set -euo pipefail
out=""
url=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    -o) out="$2"; shift 2 ;;
    -*) shift ;;
    *) url="$1"; shift ;;
  esac
done
printf '%s\n' "$url" >>"$KIRO_TEST_CURL_LOG"
if [[ "$url" == *'/releases/latest' ]]; then
  printf '{"tag_name":"%s"}\n' "$KIRO_TEST_LATEST_TAG"
else
  cp "$KIRO_TEST_ARCHIVE" "$out"
fi
CURL
chmod +x "$TEST_ROOT/fakebin/curl"

run_installer() {
  local home="$1" archive="$2"
  shift 2
  HOME="$home" \
  XDG_DATA_HOME="$home/data" \
  PATH="$TEST_ROOT/fakebin:$PATH" \
  KIRO_TEST_ARCHIVE="$archive" \
  KIRO_TEST_LATEST_TAG="v1.2.3" \
  KIRO_TEST_CURL_LOG="$TEST_ROOT/curl.log" \
    sh "$INSTALLER" "$@"
}

fixture_version="1.2.3"
archive_123="$(make_release "$fixture_version" release-123)"
home="$TEST_ROOT/home"
mkdir -p "$home"
: >"$TEST_ROOT/curl.log"

if output="$(run_installer "$home" "$archive_123" v1.2.3 2>&1)"; then
  pass "installs an explicit stable release"
else
  fail "installs an explicit stable release"
  printf '%s\n' "$output"
fi
install_root="$home/data/superpowers/kiro"
agent="$home/.kiro/agents/superpowers.md"

# XDG_DATA_HOME must be absolute. A relative value would write the payload into
# the current directory and emit relative resource URIs, defeating the absolute
# path profile while still reporting success.
relative_home="$TEST_ROOT/relative-home"
mkdir -p "$relative_home" "$TEST_ROOT/relative-cwd"
if (cd "$TEST_ROOT/relative-cwd" \
  && HOME="$relative_home" XDG_DATA_HOME="relative-data" \
     PATH="$TEST_ROOT/fakebin:$PATH" KIRO_TEST_ARCHIVE="$archive_123" \
     KIRO_TEST_LATEST_TAG="v1.2.3" KIRO_TEST_CURL_LOG="$TEST_ROOT/curl.log" \
     sh "$INSTALLER" v1.2.3 >/dev/null 2>&1); then
  fail "refuses a relative XDG_DATA_HOME"
else
  pass "refuses a relative XDG_DATA_HOME"
fi
assert_absent "$TEST_ROOT/relative-cwd/relative-data" \
  "relative XDG_DATA_HOME writes nothing into the working directory"

# These characters would make the generated double-quoted YAML resources
# invalid or split them across lines, so reject them before any download or
# filesystem changes.
quoted_data_home="$TEST_ROOT/data\"quoted"
quoted_home="$TEST_ROOT/quoted-home"
mkdir -p "$quoted_home"
if HOME="$quoted_home" XDG_DATA_HOME="$quoted_data_home" \
  PATH="$TEST_ROOT/fakebin:$PATH" KIRO_TEST_ARCHIVE="$archive_123" \
  KIRO_TEST_LATEST_TAG="v1.2.3" KIRO_TEST_CURL_LOG="$TEST_ROOT/curl.log" \
  sh "$INSTALLER" v1.2.3 >/dev/null 2>&1; then
  fail "refuses a quote in the install path"
else
  pass "refuses a quote in the install path"
fi
assert_absent "$quoted_data_home" "quoted install path writes no payload"

newline_data_home="$TEST_ROOT/data"$'\n'"newline"
newline_home="$TEST_ROOT/newline-home"
mkdir -p "$newline_home"
if HOME="$newline_home" XDG_DATA_HOME="$newline_data_home" \
  PATH="$TEST_ROOT/fakebin:$PATH" KIRO_TEST_ARCHIVE="$archive_123" \
  KIRO_TEST_LATEST_TAG="v1.2.3" KIRO_TEST_CURL_LOG="$TEST_ROOT/curl.log" \
  sh "$INSTALLER" v1.2.3 >/dev/null 2>&1; then
  fail "refuses a newline in the install path"
else
  pass "refuses a newline in the install path"
fi
assert_absent "$newline_data_home" "newline install path writes no payload"

# A failed "latest" lookup must not be reported as a malformed argument: the
# user passed no argument at all.
mkdir -p "$TEST_ROOT/failbin"
printf '%s\n' '#!/bin/sh' 'exit 22' >"$TEST_ROOT/failbin/curl"
chmod +x "$TEST_ROOT/failbin/curl"
latest_fail_home="$TEST_ROOT/latest-fail-home"
mkdir -p "$latest_fail_home"
latest_fail_output="$(HOME="$latest_fail_home" \
  XDG_DATA_HOME="$latest_fail_home/data" PATH="$TEST_ROOT/failbin:$PATH" \
  sh "$INSTALLER" 2>&1 || true)"
if printf '%s' "$latest_fail_output" | grep -Fq 'could not resolve the latest release'; then
  pass "reports a failed latest lookup accurately"
else
  fail "reports a failed latest lookup accurately (got: $latest_fail_output)"
fi

assert_file_contains "$install_root/.superpowers-kiro-install" "$fixture_version" "records installed version"
# The installed main agent must be the tracked profile with only absolute
# resource URIs and the ownership marker added.
assert_matches_tracked superpowers
assert_file_contains "$agent" "file://$install_root/skills/using-superpowers/SKILL.md" \
  "absolutizes the bootstrap file resource"
assert_file_contains "$agent" "file://$install_root/skills/using-superpowers/references/kiro-tools.md" \
  "absolutizes the tool-mapping file resource"
assert_file_contains "$agent" "skill://$install_root/skills/**/SKILL.md" \
  "absolutizes the skill discovery glob"
assert_file_contains "$install_root/release-marker.txt" 'release-123' "installs release payload"
assert_file_contains "$TEST_ROOT/curl.log" '/archive/refs/tags/v1.2.3.tar.gz' "downloads selected tag"

# Neutral workers give the skills a general-purpose dispatch target, so the
# reviewer template is not substituted with a purpose-built agent. Each is the
# tracked worker profile with only absolute skill discovery and the marker added.
worker_default="$home/.kiro/agents/superpowers-worker-default-model.md"
worker_lite="$home/.kiro/agents/superpowers-worker-lite-model.md"
assert_matches_tracked superpowers-worker-default-model
assert_matches_tracked superpowers-worker-lite-model
assert_file_contains "$worker_lite" 'model: claude-sonnet-5' "lite worker pins the cheaper model"
if [ -f "$worker_default" ] && grep -q '^model:' "$worker_default"; then
  fail "default-model worker omits model"
else
  pass "default-model worker omits model"
fi

archive_130="$(make_release 1.3.0 release-130)"
if run_installer "$home" "$archive_130" v1.3.0 >/dev/null 2>&1; then
  pass "replaces a managed installation"
else
  fail "replaces a managed installation"
fi
assert_file_contains "$install_root/.superpowers-kiro-install" '1.3.0' "updates version marker"
assert_file_contains "$install_root/release-marker.txt" 'release-130' "replaces old payload"

latest_home="$TEST_ROOT/latest-home"
mkdir -p "$latest_home"
: >"$TEST_ROOT/curl.log"
if run_installer "$latest_home" "$archive_123" >/dev/null 2>&1; then
  pass "resolves the latest release"
else
  fail "resolves the latest release"
fi
assert_file_contains "$TEST_ROOT/curl.log" '/releases/latest' "queries GitHub latest release"

unmanaged_agent_home="$TEST_ROOT/unmanaged-agent-home"
mkdir -p "$unmanaged_agent_home/.kiro/agents"
printf '%s\n' 'personal agent content' >"$unmanaged_agent_home/.kiro/agents/superpowers.md"
if run_installer "$unmanaged_agent_home" "$archive_123" v1.2.3 >/dev/null 2>&1; then
  fail "refuses unmanaged agent collision"
else
  pass "refuses unmanaged agent collision"
fi
assert_file_contains "$unmanaged_agent_home/.kiro/agents/superpowers.md" 'personal agent content' "preserves unmanaged agent"

unmanaged_payload_home="$TEST_ROOT/unmanaged-payload-home"
mkdir -p "$unmanaged_payload_home/data/superpowers/kiro"
printf '%s\n' 'personal payload content' >"$unmanaged_payload_home/data/superpowers/kiro/personal.txt"
if run_installer "$unmanaged_payload_home" "$archive_123" v1.2.3 >/dev/null 2>&1; then
  fail "refuses unmanaged payload collision"
else
  pass "refuses unmanaged payload collision"
fi
assert_file_contains "$unmanaged_payload_home/data/superpowers/kiro/personal.txt" 'personal payload content' "preserves unmanaged payload"

unmanaged_worker_home="$TEST_ROOT/unmanaged-worker-home"
mkdir -p "$unmanaged_worker_home/.kiro/agents"
printf '%s\n' 'personal worker content' \
  >"$unmanaged_worker_home/.kiro/agents/superpowers-worker-lite-model.md"
if run_installer "$unmanaged_worker_home" "$archive_123" v1.2.3 >/dev/null 2>&1; then
  fail "refuses unmanaged worker collision"
else
  pass "refuses unmanaged worker collision"
fi
assert_file_contains "$unmanaged_worker_home/.kiro/agents/superpowers-worker-lite-model.md" \
  'personal worker content' "preserves unmanaged worker"
# The guard runs before the download, so a refusal must install nothing at all.
assert_absent "$unmanaged_worker_home/data/superpowers/kiro" \
  "refused run installs no payload"
assert_absent "$unmanaged_worker_home/.kiro/agents/superpowers.md" \
  "refused run creates no main agent"
assert_absent "$unmanaged_worker_home/.kiro/agents/superpowers-worker-default-model.md" \
  "refused run creates no other worker"

# Both worker paths must be guarded, not just the one.
unmanaged_default_home="$TEST_ROOT/unmanaged-default-home"
mkdir -p "$unmanaged_default_home/.kiro/agents"
printf '%s\n' 'personal default worker content' \
  >"$unmanaged_default_home/.kiro/agents/superpowers-worker-default-model.md"
if run_installer "$unmanaged_default_home" "$archive_123" v1.2.3 >/dev/null 2>&1; then
  fail "refuses unmanaged default-model worker collision"
else
  pass "refuses unmanaged default-model worker collision"
fi
assert_file_contains "$unmanaged_default_home/.kiro/agents/superpowers-worker-default-model.md" \
  'personal default worker content' "preserves unmanaged default-model worker"

# A same-named .json config defines the same agent and wins over the Markdown
# one this installer writes, so installing beside it would silently shadow the
# new agent. Manual and pre-Markdown setups look exactly like this.
for shadow in superpowers superpowers-worker-default-model superpowers-worker-lite-model; do
  shadow_home="$TEST_ROOT/shadow-home-$shadow"
  mkdir -p "$shadow_home/.kiro/agents"
  printf '%s\n' "{\"name\":\"$shadow\",\"description\":\"hand-written\"}" \
    >"$shadow_home/.kiro/agents/$shadow.json"
  if run_installer "$shadow_home" "$archive_123" v1.2.3 >/dev/null 2>&1; then
    fail "refuses shadowing $shadow.json"
  else
    pass "refuses shadowing $shadow.json"
  fi
  assert_file_contains "$shadow_home/.kiro/agents/$shadow.json" 'hand-written' \
    "preserves hand-written $shadow.json"
  assert_absent "$shadow_home/.kiro/agents/superpowers.md" \
    "shadowed run creates no Markdown agent for $shadow.json"
  assert_absent "$shadow_home/data/superpowers/kiro" \
    "shadowed run installs no payload for $shadow.json"
done

invalid_home="$TEST_ROOT/invalid-home"
mkdir -p "$invalid_home"
run_installer "$invalid_home" "$archive_123" v1.2.3 >/dev/null
invalid_archive="$(make_release_without_kiro_mapping 6.4.0 invalid-release)"
if run_installer "$invalid_home" "$invalid_archive" v6.4.0 >/dev/null 2>&1; then
  fail "rejects archive missing Kiro mapping"
else
  pass "rejects archive missing Kiro mapping"
fi
assert_file_contains "$invalid_home/data/superpowers/kiro/release-marker.txt" 'release-123' "preserves managed payload after invalid archive"

# Literal paths must survive both awk variable passing and replacement.
for suffix in 'data&more' 'data\backslash'; do
  special_home="$TEST_ROOT/$suffix"
  mkdir -p "$special_home"
  if run_installer "$special_home" "$archive_123" v1.2.3 >/dev/null 2>&1; then
    for name in superpowers superpowers-worker-default-model superpowers-worker-lite-model; do
      assert_file_contains "$special_home/.kiro/agents/$name.md" \
        "skill://$special_home/data/superpowers/kiro/skills/**/SKILL.md" \
        "$name preserves literal path $suffix"
      assert_file_contains "$special_home/.kiro/agents/$name.md" \
        "$special_home/data/superpowers/kiro/skills/<skill-name>/" \
        "$name preserves literal reference path $suffix"
    done
  else
    fail "installs at literal path $suffix"
  fi
done

if [[ "$FAILURES" -ne 0 ]]; then
  echo "$FAILURES Kiro installer test(s) failed"
  exit 1
fi
echo "PASS: Kiro installer happy path and replacement"
