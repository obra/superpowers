# Junie Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Junie (JetBrains) as a supported superpowers harness via a user-level install script that injects the bootstrap into `~/.junie/guidelines.md` and symlinks skills into `~/.junie/skills/superpowers/`.

**Architecture:** Since Junie has no SessionStart hooks, the bootstrap is injected into `~/.junie/guidelines.md`, which Junie loads automatically at every session start. The install script is idempotent: it uses HTML comment sentinels to find and replace the superpowers block on re-runs without touching surrounding content. Skills are symlinked (not copied) so updates to the repo are reflected immediately.

**Tech Stack:** Bash (install/uninstall scripts, tests), Markdown (docs, tool mapping)

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `skills/using-superpowers/references/junie-tools.md` | Create | Tool name mapping for Junie (same pattern as `gemini-tools.md`) |
| `scripts/install-junie.sh` | Create | User-level install: symlink skills + inject bootstrap |
| `scripts/uninstall-junie.sh` | Create | Reverse install: remove symlinks + remove sentinel block |
| `tests/junie/setup.sh` | Create | Isolated test environment helpers |
| `tests/junie/test-install.sh` | Create | Verify install creates correct structure |
| `tests/junie/test-bootstrap.sh` | Create | Verify idempotency, content preservation, uninstall |
| `docs/README.junie.md` | Create | Junie-specific install + usage guide |
| `README.md` | Modify | Add Junie to Quickstart list and Installation section |

---

### Task 1: Create junie-tools.md

**Files:**
- Create: `skills/using-superpowers/references/junie-tools.md`

- [ ] **Step 1: Create the tool mapping file**

```markdown
# Junie Tool Mapping

Skills use Claude Code tool names. When you encounter these in a skill, use your platform equivalent:

| Skill references | Junie equivalent |
|-----------------|-----------------|
| `Read` (file reading) | `Read` |
| `Write` (file creation) | `Write` |
| `Edit` (file editing) | `Edit` |
| `Bash` (run commands) | `Bash` |
| `Grep` (search file content) | `Grep` |
| `Glob` (search files by name) | `Glob` |
| `WebSearch` | `WebSearch` |
| `AskUserQuestion` | `AskUserQuestion` |
| `Skill` tool (invoke a skill) | Read the skill file at `~/.junie/skills/superpowers/<skill-name>/SKILL.md` then follow it |
| `TodoWrite` (task tracking) | Use your native task tracking if available, otherwise maintain a checklist in conversation |
| `Task` tool (dispatch subagent) | Not natively supported — execute the subagent task inline in the current session |

## Loading Skills

Superpowers skills are installed at `~/.junie/skills/superpowers/`. To load a skill:

1. Read the file at `~/.junie/skills/superpowers/<skill-name>/SKILL.md`
2. Follow the skill's instructions exactly

Example: to load the `brainstorming` skill, read `~/.junie/skills/superpowers/brainstorming/SKILL.md`.
```

- [ ] **Step 2: Commit (include spec and plan docs)**

```bash
git add skills/using-superpowers/references/junie-tools.md \
        docs/superpowers/specs/2026-05-05-junie-integration-design.md \
        docs/superpowers/plans/2026-05-05-junie-integration.md
git commit -m "feat(junie): add junie tool mapping reference and design docs"
```

---

### Task 2: Write install script tests (TDD — write tests first)

**Files:**
- Create: `tests/junie/setup.sh`
- Create: `tests/junie/test-install.sh`

- [ ] **Step 1: Create setup.sh**

```bash
#!/usr/bin/env bash
# Setup helpers for Junie integration tests — creates isolated ~/.junie equivalent
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

export TEST_HOME
TEST_HOME=$(mktemp -d)
export HOME="$TEST_HOME"

# install-junie.sh respects JUNIE_HOME if set
export JUNIE_HOME="$TEST_HOME/.junie"

cleanup_test_env() {
    if [ -n "${TEST_HOME:-}" ] && [ -d "$TEST_HOME" ]; then
        rm -rf "$TEST_HOME"
    fi
}

export -f cleanup_test_env
export REPO_ROOT
```

- [ ] **Step 2: Create test-install.sh**

```bash
#!/usr/bin/env bash
# Test: install-junie.sh creates the correct directory and symlink structure
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/setup.sh"
trap cleanup_test_env EXIT

echo "=== Test: Junie Install Script ==="

# --- run install ---
"$REPO_ROOT/scripts/install-junie.sh"

# Test 1: skills directory created
echo "Test 1: Skills directory created..."
if [ -d "$JUNIE_HOME/skills/superpowers" ]; then
    echo "  [PASS] $JUNIE_HOME/skills/superpowers exists"
else
    echo "  [FAIL] Skills directory not found"
    exit 1
fi

# Test 2: every skill in the repo is symlinked
echo "Test 2: Skill symlinks..."
skill_count=0
for skill_dir in "$REPO_ROOT/skills"/*/; do
    [ -d "$skill_dir" ] || continue
    skill_name=$(basename "$skill_dir")
    link="$JUNIE_HOME/skills/superpowers/$skill_name"
    if [ -L "$link" ] && [ -e "$link" ]; then
        skill_count=$((skill_count + 1))
    else
        echo "  [FAIL] Missing or broken symlink for: $skill_name"
        exit 1
    fi
done
if [ "$skill_count" -gt 0 ]; then
    echo "  [PASS] All $skill_count skills symlinked"
else
    echo "  [FAIL] No skills found to symlink"
    exit 1
fi

# Test 3: using-superpowers skill symlinked (critical for bootstrap)
echo "Test 3: using-superpowers skill symlinked..."
if [ -L "$JUNIE_HOME/skills/superpowers/using-superpowers" ]; then
    echo "  [PASS] using-superpowers symlinked"
else
    echo "  [FAIL] using-superpowers not symlinked"
    exit 1
fi

# Test 4: guidelines.md has sentinel markers
echo "Test 4: guidelines.md sentinel markers..."
if grep -qF "<!-- BEGIN SUPERPOWERS -->" "$JUNIE_HOME/guidelines.md"; then
    echo "  [PASS] BEGIN sentinel present"
else
    echo "  [FAIL] BEGIN sentinel missing"
    exit 1
fi
if grep -qF "<!-- END SUPERPOWERS -->" "$JUNIE_HOME/guidelines.md"; then
    echo "  [PASS] END sentinel present"
else
    echo "  [FAIL] END sentinel missing"
    exit 1
fi

# Test 5: bootstrap content includes using-superpowers key phrase
echo "Test 5: Bootstrap content..."
if grep -qF "You have superpowers" "$JUNIE_HOME/guidelines.md"; then
    echo "  [PASS] Bootstrap content present"
else
    echo "  [FAIL] Bootstrap content missing from guidelines.md"
    exit 1
fi

echo ""
echo "All tests passed."
```

- [ ] **Step 3: Make scripts executable**

```bash
chmod +x tests/junie/setup.sh tests/junie/test-install.sh
```

- [ ] **Step 4: Run tests and confirm they fail (no install script yet)**

```bash
bash tests/junie/test-install.sh
```

Expected: FAIL — `install-junie.sh: No such file or directory`

- [ ] **Step 5: Commit the failing tests**

```bash
git add tests/junie/setup.sh tests/junie/test-install.sh
git commit -m "test(junie): add install script tests"
```

---

### Task 3: Implement install-junie.sh

**Files:**
- Create: `scripts/install-junie.sh`

- [ ] **Step 1: Create the install script**

```bash
#!/usr/bin/env bash
# Install superpowers for Junie (user-level)
#
# Symlinks all skills into ~/.junie/skills/superpowers/ and injects the
# using-superpowers bootstrap into ~/.junie/guidelines.md using sentinel
# markers so the operation is idempotent.
#
# Override install location for testing:
#   JUNIE_HOME=/tmp/test-junie bash scripts/install-junie.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLUGIN_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

JUNIE_DIR="${JUNIE_HOME:-${HOME}/.junie}"
JUNIE_SKILLS_DIR="${JUNIE_DIR}/skills/superpowers"
JUNIE_GUIDELINES="${JUNIE_DIR}/guidelines.md"
SUPERPOWERS_SKILLS_DIR="${PLUGIN_ROOT}/skills"

SENTINEL_START="<!-- BEGIN SUPERPOWERS -->"
SENTINEL_END="<!-- END SUPERPOWERS -->"

echo "Installing superpowers for Junie..."
echo "Target: $JUNIE_DIR"
echo ""

# --- skills ---
mkdir -p "$JUNIE_SKILLS_DIR"

for skill_dir in "$SUPERPOWERS_SKILLS_DIR"/*/; do
    [ -d "$skill_dir" ] || continue
    skill_name=$(basename "$skill_dir")
    target="$JUNIE_SKILLS_DIR/$skill_name"
    [ -L "$target" ] && rm "$target"
    ln -s "$skill_dir" "$target"
    echo "  Linked: $skill_name"
done

echo ""

# --- bootstrap ---
bootstrap_content=$(cat "$SUPERPOWERS_SKILLS_DIR/using-superpowers/SKILL.md")
tools_content=$(cat "$SUPERPOWERS_SKILLS_DIR/using-superpowers/references/junie-tools.md")

bootstrap_block="${SENTINEL_START}
${bootstrap_content}

${tools_content}
${SENTINEL_END}"

touch "$JUNIE_GUIDELINES"

# Remove existing block if present
if grep -qF "$SENTINEL_START" "$JUNIE_GUIDELINES"; then
    tmp=$(mktemp)
    awk "
        /^<!-- BEGIN SUPERPOWERS -->/ { skip=1; next }
        skip && /^<!-- END SUPERPOWERS -->/ { skip=0; next }
        skip { next }
        { print }
    " "$JUNIE_GUIDELINES" > "$tmp"
    mv "$tmp" "$JUNIE_GUIDELINES"
fi

printf '\n%s\n' "$bootstrap_block" >> "$JUNIE_GUIDELINES"
echo "Bootstrap written to: $JUNIE_GUIDELINES"

echo ""
echo "Done. Start a fresh Junie session and send 'Let's make a react todo list'"
echo "The brainstorming skill should auto-trigger before any code is written."
```

- [ ] **Step 2: Make executable**

```bash
chmod +x scripts/install-junie.sh
```

- [ ] **Step 3: Run tests and confirm they pass**

```bash
bash tests/junie/test-install.sh
```

Expected:
```
=== Test: Junie Install Script ===
  [PASS] ...skills/superpowers exists
  [PASS] All N skills symlinked
  [PASS] using-superpowers symlinked
  [PASS] BEGIN sentinel present
  [PASS] END sentinel present
  [PASS] Bootstrap content present

All tests passed.
```

- [ ] **Step 4: Commit**

```bash
git add scripts/install-junie.sh
git commit -m "feat(junie): add install script"
```

---

### Task 4: Write idempotency + uninstall tests (TDD — write tests first)

**Files:**
- Create: `tests/junie/test-bootstrap.sh`

- [ ] **Step 1: Create test-bootstrap.sh**

```bash
#!/usr/bin/env bash
# Test: idempotency, content preservation, and uninstall
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/setup.sh"
trap cleanup_test_env EXIT

echo "=== Test: Idempotency ==="

"$REPO_ROOT/scripts/install-junie.sh"
"$REPO_ROOT/scripts/install-junie.sh"

begin_count=$(grep -cF "<!-- BEGIN SUPERPOWERS -->" "$JUNIE_HOME/guidelines.md")
end_count=$(grep -cF "<!-- END SUPERPOWERS -->" "$JUNIE_HOME/guidelines.md")

if [ "$begin_count" -eq 1 ] && [ "$end_count" -eq 1 ]; then
    echo "  [PASS] Exactly one sentinel block after two installs"
else
    echo "  [FAIL] Found $begin_count BEGIN and $end_count END sentinels (expected 1 each)"
    exit 1
fi

echo ""
echo "=== Test: Pre-existing content is preserved ==="

# Write pre-existing content then re-install
printf '# My guidelines\n\nAlways use TypeScript.\n' > "$JUNIE_HOME/guidelines.md"
"$REPO_ROOT/scripts/install-junie.sh"

if grep -qF "Always use TypeScript." "$JUNIE_HOME/guidelines.md"; then
    echo "  [PASS] Pre-existing content preserved after install"
else
    echo "  [FAIL] Pre-existing content was overwritten"
    exit 1
fi

echo ""
echo "=== Test: Uninstall ==="

"$REPO_ROOT/scripts/uninstall-junie.sh"

if grep -qF "<!-- BEGIN SUPERPOWERS -->" "$JUNIE_HOME/guidelines.md" 2>/dev/null; then
    echo "  [FAIL] Sentinel block still present after uninstall"
    exit 1
else
    echo "  [PASS] Sentinel block removed"
fi

if grep -qF "Always use TypeScript." "$JUNIE_HOME/guidelines.md"; then
    echo "  [PASS] Pre-existing content preserved after uninstall"
else
    echo "  [FAIL] Pre-existing content was removed by uninstall"
    exit 1
fi

if [ -d "$JUNIE_HOME/skills/superpowers" ] && find "$JUNIE_HOME/skills/superpowers" -maxdepth 1 -mindepth 1 | grep -q .; then
    echo "  [FAIL] Skill symlinks still present after uninstall"
    exit 1
else
    echo "  [PASS] Skill symlinks removed"
fi

echo ""
echo "All tests passed."
```

- [ ] **Step 2: Make executable**

```bash
chmod +x tests/junie/test-bootstrap.sh
```

- [ ] **Step 3: Run and confirm it fails (no uninstall script yet)**

```bash
bash tests/junie/test-bootstrap.sh
```

Expected: FAIL — `uninstall-junie.sh: No such file or directory`

- [ ] **Step 4: Commit the failing test**

```bash
git add tests/junie/test-bootstrap.sh
git commit -m "test(junie): add idempotency and uninstall tests"
```

---

### Task 5: Implement uninstall-junie.sh

**Files:**
- Create: `scripts/uninstall-junie.sh`

- [ ] **Step 1: Create the uninstall script**

```bash
#!/usr/bin/env bash
# Uninstall superpowers from Junie (user-level)
#
# Removes skill symlinks from ~/.junie/skills/superpowers/ and strips the
# superpowers sentinel block from ~/.junie/guidelines.md without touching
# any surrounding content.
#
# Override install location for testing:
#   JUNIE_HOME=/tmp/test-junie bash scripts/uninstall-junie.sh

set -euo pipefail

JUNIE_DIR="${JUNIE_HOME:-${HOME}/.junie}"
JUNIE_SKILLS_DIR="${JUNIE_DIR}/skills/superpowers"
JUNIE_GUIDELINES="${JUNIE_DIR}/guidelines.md"

SENTINEL_START="<!-- BEGIN SUPERPOWERS -->"

echo "Uninstalling superpowers from Junie..."
echo "Target: $JUNIE_DIR"
echo ""

# --- skills ---
if [ -d "$JUNIE_SKILLS_DIR" ]; then
    find "$JUNIE_SKILLS_DIR" -maxdepth 1 -mindepth 1 -type l | while read -r link; do
        rm "$link"
        echo "  Removed: $(basename "$link")"
    done
    rmdir "$JUNIE_SKILLS_DIR" 2>/dev/null || true
    rmdir "$JUNIE_DIR/skills" 2>/dev/null || true
fi

# --- bootstrap ---
if [ -f "$JUNIE_GUIDELINES" ] && grep -qF "$SENTINEL_START" "$JUNIE_GUIDELINES"; then
    tmp=$(mktemp)
    awk "
        /^<!-- BEGIN SUPERPOWERS -->/ { skip=1; next }
        skip && /^<!-- END SUPERPOWERS -->/ { skip=0; next }
        skip { next }
        { print }
    " "$JUNIE_GUIDELINES" > "$tmp"
    mv "$tmp" "$JUNIE_GUIDELINES"
    echo "Sentinel block removed from: $JUNIE_GUIDELINES"
else
    echo "No superpowers block found in guidelines.md (nothing to remove)"
fi

echo ""
echo "Done."
```

- [ ] **Step 2: Make executable**

```bash
chmod +x scripts/uninstall-junie.sh
```

- [ ] **Step 3: Run tests and confirm they pass**

```bash
bash tests/junie/test-bootstrap.sh
```

Expected:
```
=== Test: Idempotency ===
  [PASS] Exactly one sentinel block after two installs

=== Test: Pre-existing content is preserved ===
  [PASS] Pre-existing content preserved after install

=== Test: Uninstall ===
  [PASS] Sentinel block removed
  [PASS] Pre-existing content preserved after uninstall
  [PASS] Skill symlinks removed

All tests passed.
```

- [ ] **Step 4: Also run test-install.sh to confirm nothing regressed**

```bash
bash tests/junie/test-install.sh
```

Expected: all pass

- [ ] **Step 5: Commit**

```bash
git add scripts/uninstall-junie.sh
git commit -m "feat(junie): add uninstall script"
```

---

### Task 6: Create docs/README.junie.md

**Files:**
- Create: `docs/README.junie.md`

- [ ] **Step 1: Create the doc**

```markdown
# Superpowers for Junie

Junie is JetBrains' AI coding agent, available as a CLI tool and IDE integration.

## Installation

Junie has no plugin marketplace, so installation uses a shell script that:

1. Symlinks all superpowers skills into `~/.junie/skills/superpowers/`
2. Injects the bootstrap into `~/.junie/guidelines.md` (loaded automatically at every session start)

### Steps

```bash
# Clone the superpowers repo (skip if already cloned)
git clone https://github.com/obra/superpowers ~/.superpowers

# Run the install script
~/.superpowers/scripts/install-junie.sh
```

### Updating

```bash
cd ~/.superpowers && git pull
~/.superpowers/scripts/install-junie.sh
```

The install is idempotent — running it again updates the bootstrap block in place.

### Uninstalling

```bash
~/.superpowers/scripts/uninstall-junie.sh
```

## How it works

Junie has no SessionStart hook mechanism. Instead, `install-junie.sh` writes the
`using-superpowers` bootstrap into `~/.junie/guidelines.md`. Junie loads this file
at the start of every session, so the bootstrap is always in context without any
user action.

Skills are symlinked (not copied) so a `git pull` in the repo is all you need to
update skill content.

## Verifying the integration

After installing, open a fresh Junie session and send:

```
Let's make a react todo list
```

The `brainstorming` skill should auto-trigger before Junie writes any code.

## Testing locally

```bash
# Test install
bash tests/junie/test-install.sh

# Test idempotency and uninstall
bash tests/junie/test-bootstrap.sh
```

Both tests use an isolated temp directory and do not modify `~/.junie`.

## Known differences from hook-based harnesses

- **No real-time bootstrap updates:** Changes to `skills/using-superpowers/SKILL.md`
  are not picked up automatically — re-run `install-junie.sh` to refresh the
  bootstrap in `guidelines.md`. Skill files under `~/.junie/skills/superpowers/`
  are symlinks so those update immediately.

- **Skill invocation:** Junie does not have a native `Skill` tool like Claude Code.
  The `junie-tools.md` reference (included in the bootstrap) instructs the agent to
  load skills by reading the SKILL.md file directly from
  `~/.junie/skills/superpowers/<skill-name>/SKILL.md`.

- **Subagents:** Junie's subagent support differs from Claude Code's. Skills that
  dispatch parallel subagents (e.g., `subagent-driven-development`) will execute
  those tasks inline rather than in parallel.
```

- [ ] **Step 2: Commit**

```bash
git add docs/README.junie.md
git commit -m "docs(junie): add Junie installation and usage guide"
```

---

### Task 7: Update README.md

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add Junie to the Quickstart list**

In `README.md`, find the line:

```
Give your agent Superpowers: [Claude Code](#claude-code), [Codex CLI](#codex-cli), [Codex App](#codex-app), [Factory Droid](#factory-droid), [Gemini CLI](#gemini-cli), [OpenCode](#opencode), [Cursor](#cursor), [GitHub Copilot CLI](#github-copilot-cli).
```

Replace with:

```
Give your agent Superpowers: [Claude Code](#claude-code), [Codex CLI](#codex-cli), [Codex App](#codex-app), [Factory Droid](#factory-droid), [Gemini CLI](#gemini-cli), [Junie](#junie), [OpenCode](#opencode), [Cursor](#cursor), [GitHub Copilot CLI](#github-copilot-cli).
```

- [ ] **Step 2: Add Junie installation section**

Find the `### GitHub Copilot CLI` section header in README.md and insert the following **before** it:

```markdown
### Junie

- Clone the superpowers repo (skip if already cloned):

  ```bash
  git clone https://github.com/obra/superpowers ~/.superpowers
  ```

- Run the install script:

  ```bash
  ~/.superpowers/scripts/install-junie.sh
  ```

- Detailed docs: [docs/README.junie.md](docs/README.junie.md)

```

- [ ] **Step 3: Verify the README renders correctly**

```bash
grep -n "Junie" README.md
```

Expected output includes two lines: one in the Quickstart list and one as a `### Junie` heading.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: add Junie to README quickstart and installation sections"
```

---

### Task 8: Run all tests and verify

- [ ] **Step 1: Run all Junie tests**

```bash
bash tests/junie/test-install.sh && bash tests/junie/test-bootstrap.sh
```

Expected: all tests pass in both files.

- [ ] **Step 2: Run the live acceptance test in Junie**

Start a fresh Junie session (no prior context) and send exactly:

```
Let's make a react todo list
```

Confirm the `brainstorming` skill auto-triggers before any code is written. Copy the full session transcript — it is required for the PR.

- [ ] **Step 3: Final commit if anything was tweaked during testing**

```bash
git add -p
git commit -m "fix(junie): address issues found during live acceptance test"
```

(Skip this step if nothing changed.)

- [ ] **Step 4: Push the branch**

```bash
git push -u origin junie-integration
```
