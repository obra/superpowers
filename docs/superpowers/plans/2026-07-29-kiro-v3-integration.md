# Kiro CLI v3 Integration Implementation Plan

## PR #2126 revision — September 2026

The original implementation record below is historical. Its embedded installer
and installation recipes are superseded by the current files and this revision;
do not replay them over the revised implementation. The current specification is
`docs/superpowers/specs/2026-07-29-kiro-v3-integration-design.md`.

- [x] Fix literal install-path substitution in `scripts/install-kiro.sh`; prove
  ampersand and backslash preservation for all three profiles in
  `tests/kiro/test-installer.sh`.
- [x] Add mutually exclusive `--source <directory>`; copy a checkout snapshot
  into staging and record local provenance. Verify no-network operation,
  uncommitted changes, compact version metadata, ownership guards, and invalid
  sources in `tests/kiro/test-local-source.sh`.
- [x] Generate the complete installation before changing live destinations;
  retain temporary backups during replacement and restore on handled failure.
  Verify first installs and upgrades, generation and replacement failures,
  backup-rename failure, SIGTERM, and failed-rollback backup preservation in
  `tests/kiro/test-recovery.sh`.
- [x] Update `README.md`, `docs/README.kiro.md`, and the porting guide: persistent
  CLI default activation, same-tag download-inspect-run installation, pre-release
  checkout support, and accurate recovery limits. Keep IDE claims separately scoped.
- [ ] Run Kiro v3 validation for all tracked and installed profiles; verify native
  resources and permissions on the tested binary. Current official docs support
  `skill` permissions and relative resources without `./`; do not change these
  based solely on the original review's documentation concern.
- [ ] Capture complete fresh default-agent acceptance sessions outside the checkout,
  record model/Kiro versions, and verify IDE persistence before broadening its claim.
- [ ] Attach raw runtime evidence and the corrected environment table to the PR.

Automated validation: `bash tests/kiro/run-tests.sh`,
`bash tests/codex-plugin-sync/test-sync-to-codex-plugin.sh`,
`sh -n scripts/install-kiro.sh`, and `git diff --check`.
The requested runtime evidence cannot be replaced with these shell tests.

## Original implementation record

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an upstream Kiro CLI v3 integration with native skill loading, a repository-local agent, and a deliberately small archive-based global installer.

**Architecture:** Kiro loads `using-superpowers` and a Kiro tool mapping as startup `file://` resources, then discovers all workflow skills through a native `skill://` glob. A small POSIX installer downloads one tagged release into a fixed namespaced directory and generates a global agent with absolute resource URIs; the repository profile uses relative URIs for development and acceptance testing.

**Tech Stack:** Kiro CLI v3 Markdown agents, Agent Skills, POSIX shell, Bash test scripts, `curl`, `tar`, standard Unix text tools.

## Global Constraints

- Implement only Kiro CLI v3; do not add v2 compatibility.
- Installer platforms are macOS, Linux, and WSL; do not claim native Windows support.
- Add no third-party runtime dependencies, Kiro Power, package manager, update daemon, rollback history, status command, doctor command, or built-in uninstaller.
- Keep `scripts/install-kiro.sh` roughly 100 lines of straightforward POSIX shell excluding comments; this is a review goal, not an automated line-count check.
- ~~The installer may create only `${XDG_DATA_HOME:-$HOME/.local/share}/superpowers/kiro` and `$HOME/.kiro/agents/superpowers.md`; it must refuse unmanaged collisions.~~ **Superseded during implementation:** it creates four paths — that payload plus three agents, `superpowers.md` and the two neutral workers `superpowers-worker-default-model.md` and `superpowers-worker-lite-model.md`. It must refuse unmanaged collisions on all of them, and must also refuse when a same-named `.json` config would shadow a managed Markdown agent. See the design spec's *Neutral worker agents* and *Shadowing guard* sections for why.
- Do not modify any `skills/*/SKILL.md` behavior-shaping content.
- Do not add release assets, checksum infrastructure, or `.version-bump.json` entries unless implementation proves a versioned Kiro manifest exists.
- Kiro v3 TUI acceptance is mandatory; classic and non-interactive modes remain unsupported.
- Use superpowers:using-git-worktrees before implementation so work occurs on a feature branch based on the upstream `dev` branch rather than the current `main` checkout.
- The approved spec and this plan are currently untracked; after creating the worktree, copy `docs/superpowers/specs/2026-07-29-kiro-v3-integration-design.md` and `docs/superpowers/plans/2026-07-29-kiro-v3-integration.md` into the same paths in the worktree with file-write tools.
- Do not create commits or a pull request unless the human partner explicitly requests them. The commit commands below are gated suggestions only.
- Pull request work remains out of scope until automated tests, both manual acceptance paths, and human diff review are complete.

---

### Task 1: Repository Agent and Canonical Kiro Tool Mapping

**Files:**
- Create: `.kiro/agents/superpowers.md`
- Create: `skills/using-superpowers/references/kiro-tools.md`
- Create: `tests/kiro/test-agent-config.sh`
- Create: `tests/kiro/run-tests.sh`

**Interfaces:**
- Consumes: Kiro v3 agent frontmatter; existing `skills/using-superpowers/SKILL.md`; upstream `skills/**/SKILL.md` tree.
- Produces: repository agent named `superpowers`; canonical mapping at `skills/using-superpowers/references/kiro-tools.md`; test entry point `bash tests/kiro/run-tests.sh`.

- [ ] **Step 1: Write the failing profile and mapping test**

Create `tests/kiro/test-agent-config.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
AGENT="$REPO_ROOT/.kiro/agents/superpowers.md"
MAPPING="$REPO_ROOT/skills/using-superpowers/references/kiro-tools.md"

fail() { echo "FAIL: $*" >&2; exit 1; }
assert_contains() {
  local file="$1" text="$2" label="$3"
  grep -Fq -- "$text" "$file" || fail "$label: missing $text"
}
assert_not_contains() {
  local file="$1" text="$2" label="$3"
  if grep -Fq -- "$text" "$file"; then
    fail "$label: unexpectedly contains $text"
  fi
}

[ -f "$AGENT" ] || fail "repository Kiro agent missing"
[ -f "$MAPPING" ] || fail "Kiro tool mapping missing"

for text in \
  'tools: ["*"]' \
  'file://skills/using-superpowers/SKILL.md' \
  'file://skills/using-superpowers/references/kiro-tools.md' \
  'skill://skills/**/SKILL.md' \
  'capability: fs_read' \
  'capability: skill' \
  'welcomeMessage: Superpowers is active.'; do
  assert_contains "$AGENT" "$text" "repository agent"
done
assert_contains "$AGENT" 'follows the loaded Superpowers bootstrap' "agent prompt"
assert_not_contains "$AGENT" 'vendor/superpowers' "upstream paths must not use the outer vendor checkout"

for text in \
  'Native `Load skill` tool' \
  'Subagent tools' \
  'Todo-list tools' \
  'Web tools' \
  '"task_description": "Explore project context"' \
  'objects using `description`'; do
  assert_contains "$MAPPING" "$text" "Kiro mapping"
done
assert_not_contains "$MAPPING" '{"description":' "invalid todo payload example"
assert_not_contains "$MAPPING" 'vendor/superpowers/skills/' "mapping must describe the upstream layout"

echo "PASS: Kiro repository agent and tool mapping"
```

Create `tests/kiro/run-tests.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

for test_script in "$SCRIPT_DIR"/test-*.sh; do
  echo ">>> $test_script"
  bash "$test_script"
done
```

Mark both test entry points executable:

```bash
chmod +x tests/kiro/test-agent-config.sh tests/kiro/run-tests.sh
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
bash tests/kiro/run-tests.sh
```

Expected: FAIL with `repository Kiro agent missing` because the upstream checkout does not yet contain `.kiro/agents/superpowers.md`.

- [ ] **Step 3: Add the repository-local agent**

Create `.kiro/agents/superpowers.md`:

```markdown
---
description: Superpowers-enabled agent with native Kiro v3 skill activation for brainstorming, TDD, debugging, planning, and review.
tools: ["*"]
resources:
  - file://skills/using-superpowers/SKILL.md
  - file://skills/using-superpowers/references/kiro-tools.md
  - skill://skills/**/SKILL.md
permissions:
  rules:
    - capability: fs_read
      effect: allow
    - capability: skill
      effect: allow
welcomeMessage: Superpowers is active. Relevant workflow skills load automatically.
---

You are a software-engineering agent that follows the loaded Superpowers bootstrap and Kiro tool-mapping instructions.
```

- [ ] **Step 4: Add the canonical mapping, including the todo schema workaround**

Create `skills/using-superpowers/references/kiro-tools.md`:

````markdown
# Superpowers — Kiro CLI v3 tool mapping

This is the Kiro adaptation referenced by the `using-superpowers` skill. The
bootstrap and this mapping are loaded as startup resources by the
`superpowers` agent.

## Loading skills

- Superpowers skills are registered as native Kiro `skill://` resources. Kiro
  exposes their names and descriptions at session start and loads full content
  on demand.
- Invoke relevant skills with Kiro's native **Load skill** mechanism. Never read
  a `SKILL.md` manually to activate it.
- `using-superpowers` is already loaded as a startup resource; do not load it a
  second time.
- After loading another skill, announce "Using [skill] to [purpose]", then
  follow it exactly.

## Action mapping

Superpowers skills use platform-neutral actions. On Kiro CLI v3:

| Skill action | Kiro capability |
|--------------|-----------------|
| Load or invoke a skill | Native `Load skill` tool |
| Read or search files | Read tools |
| Create or edit files | Write tools |
| Run a command | Shell tools |
| Search symbols or navigate code | Code-intelligence tools |
| Dispatch an independent worker | Subagent tools |
| Track checklist items | Todo-list tools |
| Search or fetch current information | Web tools |

Use the most specific available tool. Run independent reads and subagents in
parallel; keep dependent work sequential.

### Todo-list payloads

Kiro may expose the `tasks` argument with an underspecified type. When creating
tasks, pass an array of objects containing `task_description`; do not pass
strings or objects using `description`.

```json
{
  "command": "create",
  "task_list_description": "Design the integration",
  "tasks": [
    {"task_description": "Explore project context"},
    {"task_description": "Present the design"}
  ]
}
```

## Subagent dispatch

Skills such as `subagent-driven-development`, `dispatching-parallel-agents`, and
`requesting-code-review` reference prompt templates in their own directories.

1. Read the referenced template.
2. Fill every placeholder with the task's actual context.
3. Dispatch it with Kiro's subagent capability.
4. Parallelize independent tasks only.

If subagents or todo lists are unavailable in a session, follow the equivalent
workflow inline rather than blocking.

## Conventions

- "Your instructions file" means `AGENTS.md` on Kiro CLI.
- This repository's skills live under `skills/`.
- Kiro's native workspace and global skill locations are `.kiro/skills/` and
  `~/.kiro/skills/`, respectively.
````

> **Superseded during implementation:** step 3 of the *Subagent dispatch* block
> above ships as "Dispatch it to a neutral worker — `superpowers-worker-default-model`,
> or `superpowers-worker-lite-model` for the cheap tier — passing the filled
> template as the prompt. Never dispatch a general-purpose template to a
> purpose-built agent." The shipped `kiro-tools.md` also adds *General-purpose
> dispatch targets* and *Model tiers* sections. Local testing showed that without
> a named neutral target the agent substitutes a purpose-built reviewer and
> silently discards the template's contract. Treat the shipped file, not this
> excerpt, as authoritative.

- [ ] **Step 5: Run the profile tests and shell syntax checks**

Run:

```bash
bash tests/kiro/run-tests.sh
bash -n tests/kiro/test-agent-config.sh tests/kiro/run-tests.sh
```

Expected: all commands exit 0 and print `PASS: Kiro repository agent and tool mapping`.

- [ ] **Step 6: Pause at the commit boundary**

Do not commit without explicit approval. If the human partner requests this checkpoint commit, run:

```bash
git add .kiro/agents/superpowers.md skills/using-superpowers/references/kiro-tools.md tests/kiro/test-agent-config.sh tests/kiro/run-tests.sh
git commit -m "feat: add Kiro v3 agent profile"
```

### Task 2: Absolute Resource URI Runtime Gate

**Files:**
- Temporary only: an isolated test project's `.kiro/agents/superpowers-absolute-path-test.md`
- No tracked repository changes.

**Interfaces:**
- Consumes: Task 1's bootstrap, mapping, and skill tree using absolute filesystem paths.
- Produces: acceptance evidence that Kiro v3 can discover and load skills through an absolute `skill://` glob from outside the Superpowers checkout.

- [ ] **Step 1: Resolve the isolated worktree root**

Run from the Superpowers worktree:

```bash
pwd -P
```

Expected: an absolute path ending in the isolated Superpowers worktree. Record this exact value as `REPO_ROOT` for the next step.

- [ ] **Step 2: Create the isolated absolute-path test agent with file-write tools**

Create a temporary project directory outside the worktree and write `.kiro/agents/superpowers-absolute-path-test.md` inside it. Interpolate the exact `REPO_ROOT` returned in Step 1 before writing; do not leave `${REPO_ROOT}` literally in the file.

```markdown
---
description: Temporary acceptance agent for absolute Kiro resource URIs.
tools: ["*"]
resources:
  - "file://${REPO_ROOT}/skills/using-superpowers/SKILL.md"
  - "file://${REPO_ROOT}/skills/using-superpowers/references/kiro-tools.md"
  - "skill://${REPO_ROOT}/skills/**/SKILL.md"
permissions:
  rules:
    - capability: fs_read
      effect: allow
    - capability: skill
      effect: allow
welcomeMessage: Superpowers absolute-resource acceptance agent is active.
---

You are a software-engineering agent that follows the loaded Superpowers bootstrap and Kiro tool-mapping instructions.
```

Because `REPO_ROOT` begins with `/`, the resulting URIs must begin with `file:///` and `skill:///`.

- [ ] **Step 3: Run the hard-gate TUI acceptance prompt**

From the temporary project directory, run:

```bash
kiro-cli chat --agent superpowers-absolute-path-test --agent-engine v3
```

Send exactly:

```text
Let's make a react todo list
```

Expected evidence, in this order:

1. The temporary agent loads without a resource error.
2. Kiro invokes `Load skill: brainstorming`.
3. The response announces use of brainstorming and asks a design question.
4. No implementation or source file creation occurs first.

Capture the complete transcript locally. If absolute `skill://` loading fails, stop implementation, preserve the error, and return to brainstorming; do not proceed to the installer and do not copy skills into `~/.kiro/skills/`.

- [ ] **Step 4: Remove the temporary test project with file-delete tools**

Delete only the temporary project created in Step 2. Confirm the Superpowers worktree and all global Kiro agents are unchanged.

### Task 3: Minimal Installer Happy Path and Replacement

> **Superseded during implementation.** The embedded installer and test listings
> below are the original plan of record; the shipped `scripts/install-kiro.sh`
> and `tests/kiro/test-installer.sh` extended them with the two neutral worker
> agents, the `.json` shadow guard, absolute-path quote/newline rejection,
> `curl --proto-redir =https`, `tar --no-same-owner`, and a resource-parity
> assertion over the whole tracked resource list. Read the shipped files as
> authoritative; the version tags here are illustrative (`v1.2.3`/`v1.3.0`).

**Files:**
- Create: `scripts/install-kiro.sh`
- Create: `tests/kiro/test-installer.sh`

**Interfaces:**
- Consumes: release archives rooted at `superpowers-<version>/`, `package.json` version, Task 1 repository agent and mapping.
- Produces: `scripts/install-kiro.sh [vMAJOR.MINOR.PATCH]`; payload marker `.superpowers-kiro-install`; generated global agent with absolute resource URIs.

- [ ] **Step 1: Write failing installer happy-path tests**

Create `tests/kiro/test-installer.sh` with a temporary `HOME`, a local release archive builder, and a fake `curl` placed first on `PATH`. The test must implement these exact cases:

```bash
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

make_release() {
  local version="$1" release_marker="$2"
  local root="$TEST_ROOT/build-$version/superpowers-$version"
  rm -rf "$TEST_ROOT/build-$version"
  mkdir -p "$root/.kiro/agents" "$root/skills/using-superpowers/references"
  cp -R "$REPO_ROOT/skills/." "$root/skills/"
  cp "$REPO_ROOT/.kiro/agents/superpowers.md" "$root/.kiro/agents/superpowers.md"
  printf '{\n  "name": "superpowers",\n  "version": "%s"\n}\n' "$version" >"$root/package.json"
  printf '%s\n' "$release_marker" >"$root/release-marker.txt"
  tar -czf "$TEST_ROOT/superpowers-$version.tar.gz" -C "$TEST_ROOT/build-$version" "superpowers-$version"
  printf '%s\n' "$TEST_ROOT/superpowers-$version.tar.gz"
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

archive_620="$(make_release 1.2.3 release-620)"
home="$TEST_ROOT/home"
mkdir -p "$home"
: >"$TEST_ROOT/curl.log"

if output="$(run_installer "$home" "$archive_620" v1.2.3 2>&1)"; then
  pass "installs an explicit stable release"
else
  fail "installs an explicit stable release"
  printf '%s\n' "$output"
fi
install_root="$home/data/superpowers/kiro"
agent="$home/.kiro/agents/superpowers.md"
assert_file_contains "$install_root/.superpowers-kiro-install" '1.2.3' "records installed version"
assert_file_contains "$agent" "file://$install_root/skills/using-superpowers/SKILL.md" "generates absolute bootstrap URI"
assert_file_contains "$agent" "skill://$install_root/skills/**/SKILL.md" "generates absolute skill URI"
assert_file_contains "$agent" '<!-- Managed by the Superpowers Kiro installer. -->' "marks generated agent"
for text in \
  'tools: ["*"]' \
  'capability: fs_read' \
  'capability: skill' \
  'welcomeMessage: Superpowers is active. Relevant workflow skills load automatically.' \
  'follows the loaded Superpowers bootstrap and Kiro tool-mapping instructions.'; do
  assert_file_contains "$agent" "$text" "keeps repository and installed agent semantics aligned"
done
assert_file_contains "$install_root/release-marker.txt" 'release-620' "installs release payload"
assert_file_contains "$TEST_ROOT/curl.log" '/archive/refs/tags/v1.2.3.tar.gz' "downloads selected tag"

archive_630="$(make_release 6.3.0 release-630)"
if run_installer "$home" "$archive_630" v6.3.0 >/dev/null 2>&1; then
  pass "replaces a managed installation"
else
  fail "replaces a managed installation"
fi
assert_file_contains "$install_root/.superpowers-kiro-install" '6.3.0' "updates version marker"
assert_file_contains "$install_root/release-marker.txt" 'release-630' "replaces old payload"

latest_home="$TEST_ROOT/latest-home"
mkdir -p "$latest_home"
: >"$TEST_ROOT/curl.log"
if run_installer "$latest_home" "$archive_620" >/dev/null 2>&1; then
  pass "resolves the latest release"
else
  fail "resolves the latest release"
fi
assert_file_contains "$TEST_ROOT/curl.log" '/releases/latest' "queries GitHub latest release"

if [[ "$FAILURES" -ne 0 ]]; then
  echo "$FAILURES Kiro installer test(s) failed"
  exit 1
fi
echo "PASS: Kiro installer happy path and replacement"
```

Mark the installer test executable:

```bash
chmod +x tests/kiro/test-installer.sh
```

- [ ] **Step 2: Run the Kiro tests and verify RED**

Run:

```bash
bash tests/kiro/run-tests.sh
```

Expected: `test-agent-config.sh` passes, then `test-installer.sh` fails because `scripts/install-kiro.sh` does not exist.

- [ ] **Step 3: Implement the minimal installer happy path**

Create `scripts/install-kiro.sh` as a `#!/bin/sh` script using `set -eu`. Implement these concrete operations:

```sh
#!/bin/sh
set -eu

REPOSITORY="obra/superpowers"
PAYLOAD_MARKER=".superpowers-kiro-install"
AGENT_MARKER="<!-- Managed by the Superpowers Kiro installer. -->"

die() { echo "error: $*" >&2; exit 1; }
for tool in cat curl dirname tar grep sed mkdir rm mv; do
  command -v "$tool" >/dev/null 2>&1 || die "required tool '$tool' is not on PATH"
done
[ "$#" -le 1 ] || die "usage: $0 [vMAJOR.MINOR.PATCH]"

tag="${1:-}"
if [ -z "$tag" ]; then
  tag="$(curl -fsSL "https://api.github.com/repos/$REPOSITORY/releases/latest" \
    | sed -n 's/.*"tag_name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' \
    | sed -n '1p')"
fi
printf '%s\n' "$tag" | grep -Eq '^v[0-9]+\.[0-9]+\.[0-9]+$' \
  || die "release must look like v1.2.3"
version="${tag#v}"

install_root="${XDG_DATA_HOME:-$HOME/.local/share}/superpowers/kiro"
agent_path="$HOME/.kiro/agents/superpowers.md"
work_dir="${TMPDIR:-/tmp}/superpowers-kiro.$$"
(umask 077 && mkdir "$work_dir") || die "cannot create temporary directory"
agent_tmp="$agent_path.tmp.$$"
cleanup() { rm -rf "$work_dir"; rm -f "$agent_tmp"; }
trap cleanup 0
trap 'exit 1' 1 2 15

archive="$work_dir/release.tar.gz"
curl -fsSL "https://github.com/$REPOSITORY/archive/refs/tags/$tag.tar.gz" -o "$archive"
tar -xzf "$archive" -C "$work_dir"
source_root="$work_dir/superpowers-$version"
for required in \
  package.json \
  .kiro/agents/superpowers.md \
  skills/using-superpowers/SKILL.md \
  skills/using-superpowers/references/kiro-tools.md \
  skills/brainstorming/SKILL.md; do
  [ -f "$source_root/$required" ] || die "release is missing $required"
done
archive_version="$(sed -n 's/^[[:space:]]*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$source_root/package.json" | sed -n '1p')"
[ "$archive_version" = "$version" ] || die "release version does not match $tag"
printf '%s\n' "$version" >"$source_root/$PAYLOAD_MARKER"

mkdir -p "$(dirname "$install_root")" "$(dirname "$agent_path")"
rm -rf "$install_root"
mv "$source_root" "$install_root"

(umask 077 && : >"$agent_tmp")
cat >"$agent_tmp" <<EOF
---
description: Superpowers-enabled agent with native Kiro v3 skill activation for brainstorming, TDD, debugging, planning, and review.
tools: ["*"]
resources:
  - "file://$install_root/skills/using-superpowers/SKILL.md"
  - "file://$install_root/skills/using-superpowers/references/kiro-tools.md"
  - "skill://$install_root/skills/**/SKILL.md"
permissions:
  rules:
    - capability: fs_read
      effect: allow
    - capability: skill
      effect: allow
welcomeMessage: Superpowers is active. Relevant workflow skills load automatically.
---

$AGENT_MARKER
You are a software-engineering agent that follows the loaded Superpowers bootstrap and Kiro tool-mapping instructions.
EOF
mv "$agent_tmp" "$agent_path"
printf 'Installed Superpowers %s for Kiro CLI v3.\n' "$version"
printf 'Start it with: kiro-cli chat --agent superpowers --agent-engine v3\n'
```

Mark the installer executable:

```bash
chmod +x scripts/install-kiro.sh
```

Do not add collision checks yet; Task 4 drives those through failing tests. Keep the script POSIX—no arrays, `[[ ... ]]`, `local`, or Bash-only parameter expansion.

- [ ] **Step 4: Run installer tests and verify GREEN**

Run:

```bash
bash tests/kiro/run-tests.sh
sh -n scripts/install-kiro.sh
```

Expected: all Kiro tests pass, both explicit and latest URLs are exercised through fake `curl`, and `sh -n` exits 0.

- [ ] **Step 5: Pause at the commit boundary**

Do not commit without explicit approval. If requested:

```bash
git add scripts/install-kiro.sh tests/kiro/test-installer.sh
git commit -m "feat: add minimal Kiro installer"
```

### Task 4: Installer Collision and Invalid-Archive Safety

> **Superseded during implementation.** The single-agent guard sketched below
> shipped as a loop over three managed agents (`superpowers.md` plus the two
> workers), each also refusing a same-named `.json` shadow. The shipped tests
> assert that a refused run installs nothing at all. Read the shipped files as
> authoritative.

**Files:**
- Modify: `scripts/install-kiro.sh`
- Modify: `tests/kiro/test-installer.sh`

**Interfaces:**
- Consumes: payload ownership file `.superpowers-kiro-install`; agent ownership text `<!-- Managed by the Superpowers Kiro installer. -->`.
- Produces: refusal behavior for unmanaged destinations and staged validation before managed replacement.

- [ ] **Step 1: Add failing unmanaged-collision tests**

Before the final `FAILURES` check in `tests/kiro/test-installer.sh`, add cases that:

```bash
unmanaged_agent_home="$TEST_ROOT/unmanaged-agent-home"
mkdir -p "$unmanaged_agent_home/.kiro/agents"
printf '%s\n' 'personal agent content' >"$unmanaged_agent_home/.kiro/agents/superpowers.md"
if run_installer "$unmanaged_agent_home" "$archive_620" v1.2.3 >/dev/null 2>&1; then
  fail "refuses unmanaged agent collision"
else
  pass "refuses unmanaged agent collision"
fi
assert_file_contains "$unmanaged_agent_home/.kiro/agents/superpowers.md" 'personal agent content' "preserves unmanaged agent"

unmanaged_payload_home="$TEST_ROOT/unmanaged-payload-home"
mkdir -p "$unmanaged_payload_home/data/superpowers/kiro"
printf '%s\n' 'personal payload content' >"$unmanaged_payload_home/data/superpowers/kiro/personal.txt"
if run_installer "$unmanaged_payload_home" "$archive_620" v1.2.3 >/dev/null 2>&1; then
  fail "refuses unmanaged payload collision"
else
  pass "refuses unmanaged payload collision"
fi
assert_file_contains "$unmanaged_payload_home/data/superpowers/kiro/personal.txt" 'personal payload content' "preserves unmanaged payload"
```

- [ ] **Step 2: Add a failing invalid-archive preservation test**

Add a helper that creates `superpowers-6.4.0.tar.gz` without `skills/using-superpowers/references/kiro-tools.md`. Install a valid managed fixture first, then run the invalid archive and assert:

```bash
invalid_home="$TEST_ROOT/invalid-home"
mkdir -p "$invalid_home"
run_installer "$invalid_home" "$archive_620" v1.2.3 >/dev/null
invalid_archive="$(make_release 6.4.0 invalid-release)"
tar -xzf "$invalid_archive" -C "$TEST_ROOT"
rm "$TEST_ROOT/superpowers-6.4.0/skills/using-superpowers/references/kiro-tools.md"
tar -czf "$TEST_ROOT/invalid-6.4.0.tar.gz" -C "$TEST_ROOT" superpowers-6.4.0
rm -rf "$TEST_ROOT/superpowers-6.4.0"
if run_installer "$invalid_home" "$TEST_ROOT/invalid-6.4.0.tar.gz" v6.4.0 >/dev/null 2>&1; then
  fail "rejects archive missing Kiro mapping"
else
  pass "rejects archive missing Kiro mapping"
fi
assert_file_contains "$invalid_home/data/superpowers/kiro/release-marker.txt" 'release-620' "preserves managed payload after invalid archive"
```

- [ ] **Step 3: Run the focused test and verify RED**

Run:

```bash
bash tests/kiro/test-installer.sh
```

Expected: unmanaged-agent and unmanaged-payload cases fail because the Task 3 installer currently overwrites both. The invalid-archive preservation case should already pass because archive validation precedes replacement.

- [ ] **Step 4: Add minimal ownership checks before network or deletion**

In `scripts/install-kiro.sh`, calculate `install_root` and `agent_path` before resolving the tag, then add:

```sh
if { [ -e "$agent_path" ] || [ -L "$agent_path" ]; } \
  && ! grep -Fq "$AGENT_MARKER" "$agent_path" 2>/dev/null; then
  die "refusing to overwrite unmanaged agent: $agent_path"
fi
if { [ -e "$install_root" ] || [ -L "$install_root" ]; } \
  && [ ! -f "$install_root/$PAYLOAD_MARKER" ]; then
  die "refusing to overwrite unmanaged payload: $install_root"
fi
```

Keep all download and extraction work after these checks. Do not add backup retention, locking, rollback history, or an uninstall command.

- [ ] **Step 5: Run safety, syntax, and shell-quality validation**

Run:

```bash
bash tests/kiro/run-tests.sh
sh -n scripts/install-kiro.sh
bash -n tests/kiro/test-agent-config.sh tests/kiro/test-installer.sh tests/kiro/run-tests.sh
scripts/lint-shell.sh scripts/install-kiro.sh tests/kiro/test-agent-config.sh tests/kiro/test-installer.sh tests/kiro/run-tests.sh
```

Expected: tests pass; syntax checks exit 0; ShellCheck reports no warning-or-higher findings. If `shellcheck` is unavailable, record that limitation and run the syntax checks rather than claiming lint passed.

- [ ] **Step 6: Pause at the commit boundary**

Do not commit without explicit approval. If requested:

```bash
git add scripts/install-kiro.sh tests/kiro/test-installer.sh
git commit -m "test: protect Kiro installer destinations"
```

### Task 5: Kiro User Documentation

> **Superseded during implementation.** The embedded guide below is the original
> draft; the shipped `docs/README.kiro.md` is authoritative. The removal section
> covers all three managed agents plus the payload, and the integration also
> registers the port in `docs/porting-to-a-new-harness.md` (new Shape D) and
> `docs/testing.md`, and excludes `/.kiro/` from the Codex plugin sync
> (`scripts/sync-to-codex-plugin.sh`), each with test coverage.

**Files:**
- Create: `docs/README.kiro.md`
- Create: `tests/kiro/test-docs.sh`
- Modify: `README.md:12-14`
- Modify: `README.md` installation section between Kimi Code and OpenCode

**Interfaces:**
- Consumes: installer command and paths from Tasks 3–4; runtime behavior from Tasks 1–2.
- Produces: concise main README entry and complete Kiro install/update/removal/troubleshooting guide.

- [ ] **Step 1: Write the failing documentation contract test**

Create `tests/kiro/test-docs.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
README="$REPO_ROOT/README.md"
DOC="$REPO_ROOT/docs/README.kiro.md"

fail() { echo "FAIL: $*" >&2; exit 1; }
[ -f "$DOC" ] || fail "docs/README.kiro.md missing"
for text in \
  '### Kiro CLI' \
  'scripts/install-kiro.sh' \
  'docs/README.kiro.md'; do
  grep -Fq -- "$text" "$README" || fail "README missing $text"
done
for text in \
  'Kiro CLI v3' \
  'kiro-cli chat --agent superpowers --agent-engine v3' \
  'XDG_DATA_HOME' \
  '.superpowers-kiro-install' \
  'Native Windows is not supported' \
  'Kiro Powers' \
  'Load skill' \
  'TUI'; do
  grep -Fq -- "$text" "$DOC" || fail "Kiro guide missing $text"
done

echo "PASS: Kiro documentation contract"
```

Mark the documentation test executable:

```bash
chmod +x tests/kiro/test-docs.sh
```

- [ ] **Step 2: Run documentation tests and verify RED**

Run:

```bash
bash tests/kiro/run-tests.sh
```

Expected: existing Kiro tests pass, then `test-docs.sh` fails with `docs/README.kiro.md missing`.

- [ ] **Step 3: Add the concise root README entry**

Add `Kiro CLI` to the Quickstart link list between `Kimi Code` and `OpenCode`. Add this installation section between the existing Kimi and OpenCode sections:

````markdown
### Kiro CLI

Kiro CLI v3 uses a native custom agent and native Agent Skills. Install the
latest stable Superpowers release:

```bash
curl -fsSL https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/scripts/install-kiro.sh | sh
```

Start Kiro with:

```bash
kiro-cli chat --agent superpowers --agent-engine v3
```

See [the complete Kiro guide](docs/README.kiro.md) for pinned versions,
updates, removal, repository-local development, and current limitations.
````

- [ ] **Step 4: Write the complete Kiro guide**

Create `docs/README.kiro.md` with these concrete sections and commands:

````markdown
# Superpowers for Kiro CLI v3

This integration uses a Kiro v3 Markdown custom agent, startup `file://`
resources, and native `skill://` discovery. It does not support Kiro CLI v2.

## Requirements

- Kiro CLI with the v3 agent engine
- macOS, Linux, or WSL
- `curl` and `tar`

Native Windows is not supported by the initial installer.

## Installation

Install the latest stable release:

```bash
curl -fsSL https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/scripts/install-kiro.sh | sh
```

Install a specific release:

```bash
curl -fsSL https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/scripts/install-kiro.sh | sh -s -- v1.2.3
```

To inspect the installer before running it:

```bash
curl -fsSL https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/scripts/install-kiro.sh -o /tmp/install-kiro.sh
less /tmp/install-kiro.sh
sh /tmp/install-kiro.sh
```

The payload is installed at
`${XDG_DATA_HOME:-$HOME/.local/share}/superpowers/kiro`. The generated agent is
`$HOME/.kiro/agents/superpowers.md`. The installer refuses to replace either
path unless it carries the Superpowers ownership marker.

## Usage

Start a v3 TUI session in any project:

```bash
kiro-cli chat --agent superpowers --agent-engine v3
```

Kiro loads `using-superpowers` and the Kiro tool mapping at startup. It exposes
skill metadata from `skill://` resources and uses its native Load skill action
to load full skill instructions on demand.

Only file reads and skill loading are pre-approved by the profile. Writes,
shell commands, network access, and other consequential actions retain Kiro's
normal permission behavior.

## Updating or changing versions

Rerun the installation command. With no argument it installs the latest stable
release; with a tag such as `v1.2.3` it installs that release. The installer
replaces the one managed payload and does not retain rollback versions.

## Removal

Inspect both ownership markers before deleting anything:

```bash
cat "${XDG_DATA_HOME:-$HOME/.local/share}/superpowers/kiro/.superpowers-kiro-install"
grep -F '<!-- Managed by the Superpowers Kiro installer. -->' "$HOME/.kiro/agents/superpowers.md"
```

If both commands show the expected markers, remove only these paths:

```bash
rm -rf "${XDG_DATA_HOME:-$HOME/.local/share}/superpowers/kiro"
rm -f "$HOME/.kiro/agents/superpowers.md"
```

## Repository-local development

From a Superpowers checkout, use the tracked `.kiro/agents/superpowers.md`:

```bash
kiro-cli chat --agent superpowers --agent-engine v3
```

The repository profile uses relative resources. The installed profile uses
absolute resources so it works from unrelated project directories.

## Why this is not a Kiro Power

Kiro Powers currently do not provide a supported CLI package that installs a
custom agent, native Agent Skills, startup resources, and updates as one unit.
The shell installer is transitional and should be replaced when Kiro provides a
native package mechanism.

## Current limitations

- Kiro's v3 workflow currently requires the TUI; classic and non-interactive
  acceptance are not claimed.
- The installer supports macOS, Linux, and WSL, not native Windows.
- GitHub release archives are downloaded over HTTPS and checked for required
  files and matching version metadata, but no separate checksum or signature is
  published.
- A tag predating Kiro support cannot be installed because its archive lacks the
  required Kiro files.

## Troubleshooting

### The installer refuses an existing agent or payload

The destination exists without the ownership marker. Move or rename it after
reviewing its contents; the installer intentionally will not overwrite it.

### Skills do not trigger

Start a clean v3 session and send `Let's make a react todo list`. A working
installation invokes `Load skill: brainstorming` before writing code. Confirm
the generated agent contains absolute `file:///` and `skill:///` resources that
point at the managed payload.

### The requested version is rejected

Use a stable tag in `vMAJOR.MINOR.PATCH` form. The archive's `package.json`
version must match the tag without its leading `v`.
````

- [ ] **Step 5: Run documentation and full Kiro tests**

Run:

```bash
bash tests/kiro/run-tests.sh
git diff --check
```

Expected: all Kiro tests pass and `git diff --check` produces no output.

- [ ] **Step 6: Pause at the commit boundary**

Do not commit without explicit approval. If requested:

```bash
git add README.md docs/README.kiro.md tests/kiro/test-docs.sh
git commit -m "docs: document Kiro v3 integration"
```

### Task 6: Full Validation and Both TUI Acceptance Paths

**Files:**
- Verify only; modify implementation files only if validation exposes a real defect.
- Keep acceptance transcripts outside tracked files until later PR preparation.

**Interfaces:**
- Consumes: all tracked deliverables from Tasks 1–5.
- Produces: automated test evidence, repository-profile transcript, installed-profile transcript, and a human-reviewable diff; no PR.

- [ ] **Step 1: Run the complete automated validation set**

Run:

```bash
bash tests/kiro/run-tests.sh
sh -n scripts/install-kiro.sh
bash -n tests/kiro/test-agent-config.sh tests/kiro/test-installer.sh tests/kiro/test-docs.sh tests/kiro/run-tests.sh
scripts/lint-shell.sh scripts/install-kiro.sh tests/kiro/test-agent-config.sh tests/kiro/test-installer.sh tests/kiro/test-docs.sh tests/kiro/run-tests.sh
bash tests/kimi/test-plugin-manifest.sh
bash tests/antigravity/test-antigravity-tools.sh
node --test tests/pi/test-pi-extension.mjs
bash tests/hooks/test-session-start.sh
git diff --check
```

Expected: all commands exit 0. If a required optional validator such as `shellcheck` is unavailable, record exactly which command could not run; do not report it as passing.

- [ ] **Step 2: Run repository-local clean-session acceptance**

From the isolated Superpowers worktree:

```bash
kiro-cli chat --agent superpowers --agent-engine v3
```

Send exactly:

```text
Let's make a react todo list
```

Capture the complete transcript. Verify `Load skill: brainstorming` appears before implementation and that the response begins the brainstorming workflow rather than creating code.

- [ ] **Step 3: Build a complete local release archive for installed-profile acceptance**

Run from the Superpowers worktree to derive the current package version and build a GitHub-shaped archive without `.git`:

```bash
ACCEPTANCE_ROOT="$(mktemp -d)"
ACCEPTANCE_HOME="$ACCEPTANCE_ROOT/home"
ACCEPTANCE_FAKEBIN="$ACCEPTANCE_ROOT/bin"
ACCEPTANCE_VERSION="$(sed -n 's/^[[:space:]]*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' package.json | sed -n '1p')"
ACCEPTANCE_TAG="v$ACCEPTANCE_VERSION"
ACCEPTANCE_SOURCE="$ACCEPTANCE_ROOT/source/superpowers-$ACCEPTANCE_VERSION"
ACCEPTANCE_ARCHIVE="$ACCEPTANCE_ROOT/superpowers-$ACCEPTANCE_VERSION.tar.gz"
mkdir -p "$ACCEPTANCE_HOME" "$ACCEPTANCE_FAKEBIN" "$ACCEPTANCE_SOURCE"
tar --exclude='.git' -cf - . | tar -xf - -C "$ACCEPTANCE_SOURCE"
tar -czf "$ACCEPTANCE_ARCHIVE" -C "$ACCEPTANCE_ROOT/source" "superpowers-$ACCEPTANCE_VERSION"
```

Create `$ACCEPTANCE_FAKEBIN/curl` with executable mode and this exact content:

```bash
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
```

Mark the shim executable:

```bash
chmod +x "$ACCEPTANCE_FAKEBIN/curl"
```

Run the installer against the local archive and isolated home:

```bash
HOME="$ACCEPTANCE_HOME" \
XDG_DATA_HOME="$ACCEPTANCE_HOME/data" \
PATH="$ACCEPTANCE_FAKEBIN:$PATH" \
KIRO_TEST_ARCHIVE="$ACCEPTANCE_ARCHIVE" \
KIRO_TEST_LATEST_TAG="$ACCEPTANCE_TAG" \
KIRO_TEST_CURL_LOG="$ACCEPTANCE_ROOT/curl.log" \
  sh scripts/install-kiro.sh "$ACCEPTANCE_TAG"
```

Expected: the installer prints the installed version and Kiro invocation command; the generated agent contains absolute paths under `$ACCEPTANCE_HOME/data/superpowers/kiro`.

- [ ] **Step 4: Run installed-profile clean-session acceptance from an unrelated project**

Create an empty project outside both the worktree and installed payload:

```bash
ACCEPTANCE_PROJECT="$ACCEPTANCE_ROOT/project"
mkdir -p "$ACCEPTANCE_PROJECT"
```

Run this command with `$ACCEPTANCE_PROJECT` as the shell tool's working directory:

```bash
HOME="$ACCEPTANCE_HOME" kiro-cli chat --agent superpowers --agent-engine v3
```

If the isolated home has no Kiro credentials, authenticate that temporary home through Kiro's normal login flow before retrying; do not copy secret files into the repository.

Send exactly:

```text
Let's make a react todo list
```

Capture the complete transcript outside `$ACCEPTANCE_ROOT`. Verify the agent loads both absolute `file://` resources, discovers the absolute `skill://` glob, invokes `Load skill: brainstorming`, and begins brainstorming before implementation. This is a hard completion gate. After preserving the transcript, delete only `$ACCEPTANCE_ROOT` with the file-delete tool.

- [ ] **Step 5: Review the final local diff and installer size**

Run:

```bash
git status --short
git diff --stat
git diff -- README.md
for new_file in \
  .kiro/agents/superpowers.md \
  skills/using-superpowers/references/kiro-tools.md \
  scripts/install-kiro.sh \
  tests/kiro/*.sh \
  docs/README.kiro.md \
  docs/superpowers/specs/2026-07-29-kiro-v3-integration-design.md \
  docs/superpowers/plans/2026-07-29-kiro-v3-integration.md; do
  git diff --no-index -- /dev/null "$new_file" || test "$?" -eq 1
done
awk 'BEGIN { n=0 } /^[[:space:]]*#/ { next } /^[[:space:]]*$/ { next } { n++ } END { print n }' scripts/install-kiro.sh
```

Expected: only the approved Kiro integration, tests, docs, spec, and plan are changed. Treat the line count as a maintainer-review signal, not a pass/fail threshold. Show the complete diff and both transcripts to the human partner.

- [ ] **Step 6: Stop before commits or pull-request work**

Do not commit, push, or create a PR without a new explicit request. Record any unverified item accurately. PR preparation later requires searching open and closed prior PRs, completing every PR-template field, targeting `dev`, and obtaining explicit human approval of the complete diff.

The shipped installer is 116 non-comment lines rather than the ~100 this plan targets, because of the two worker configs and the shadowing guard added during implementation. The line target was a review signal, not a threshold.
