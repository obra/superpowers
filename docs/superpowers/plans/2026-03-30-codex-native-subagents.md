# Codex Native Subagents Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add native Codex reviewer roles under `.codex/agents`, install them through the Codex install flow, and make Superpowers' Codex docs and tests prefer those roles over the legacy `worker`-plus-inline-prompt fallback.

**Architecture:** Introduce four read-only custom Codex reviewer roles in `.codex/agents/` and keep implementation work on the built-in `worker` role. Then update Codex-facing install docs, tool-mapping docs, and skill guidance so `superpowers_*` roles are the primary path, followed by Codex test-harness and integration-test updates that install the role catalog and assert native role usage through structured session evidence.

**Tech Stack:** TOML, Markdown, Bash, Codex CLI test harness

**Spec:** `docs/superpowers/specs/2026-03-30-codex-native-subagents-design.md`

---

## File Structure

| File | Responsibility | Action |
|---|---|---|
| `.codex/agents/superpowers_reviewer.toml` | Native Codex role for code-quality review | Create |
| `.codex/agents/superpowers_spec_reviewer.toml` | Native Codex role for strict spec-compliance review | Create |
| `.codex/agents/superpowers_plan_reviewer.toml` | Native Codex role for plan review | Create |
| `.codex/agents/superpowers_doc_reviewer.toml` | Native Codex role for spec/document completeness review | Create |
| `.codex/INSTALL.md` | Canonical Codex installation instructions | Modify |
| `docs/README.codex.md` | User-facing Codex README | Modify |
| `skills/using-superpowers/references/codex-tools.md` | Codex tool and role mapping reference | Modify |
| `skills/requesting-code-review/SKILL.md` | Reviewer dispatch guidance | Modify |
| `skills/subagent-driven-development/SKILL.md` | Reviewer role mapping guidance for Codex | Modify |
| `tests/codex/test-helpers.sh` | Isolated Codex test environment setup | Modify |
| `tests/codex/README.md` | Codex test-suite usage notes | Modify |
| `docs/testing.md` | Top-level test documentation | Modify |
| `tests/codex/test-subagent-driven-development.sh` | Fast semantic Codex workflow assertions | Modify |
| `tests/codex/test-subagent-driven-development-integration.sh` | Real Codex subagent workflow integration test | Modify |

---

### Task 1: Create the Native Codex Agent Catalog

**Files:**
- Create: `.codex/agents/superpowers_reviewer.toml`
- Create: `.codex/agents/superpowers_spec_reviewer.toml`
- Create: `.codex/agents/superpowers_plan_reviewer.toml`
- Create: `.codex/agents/superpowers_doc_reviewer.toml`

- [ ] **Step 1: Verify the role catalog does not exist yet**

Run:

```bash
test -d .codex/agents && test "$(find .codex/agents -maxdepth 1 -name '*.toml' | wc -l | tr -d ' ')" -eq 4
```

Expected: FAIL

- [ ] **Step 2: Create the agent directory**

Run:

```bash
mkdir -p .codex/agents
```

Expected: command succeeds with no output

- [ ] **Step 3: Create `.codex/agents/superpowers_reviewer.toml`**

Write exactly:

```toml
name = "superpowers_reviewer"
description = "Superpowers code reviewer focused on correctness, maintainability, security, and missing tests."
sandbox_mode = "read-only"
developer_instructions = """
Review completed implementation work against the requested plan and coding standards.

Always:
- compare the implementation against the stated task, plan, or requirements
- prioritize correctness risks, behavioral regressions, missing tests, and maintainability issues
- acknowledge what was done well before listing problems
- categorize findings as Critical, Important, or Suggestions
- include specific file references when possible

When reviewing code:
- assess plan alignment
- assess code quality and test coverage
- assess architecture, file boundaries, and responsibility splits
- assess whether comments and documentation remain accurate

Be thorough but concise. Favor findings over summary.
"""
```

- [ ] **Step 4: Create `.codex/agents/superpowers_spec_reviewer.toml`**

Write exactly:

```toml
name = "superpowers_spec_reviewer"
description = "Strict read-only reviewer that verifies implementation matches approved requirements exactly."
sandbox_mode = "read-only"
developer_instructions = """
Review whether an implementation matches its approved specification.

Do not trust the implementer's report.
Read the actual code.
Compare the implementation against the supplied requirements line by line.

Look for:
- missing requirements
- extra or unrequested features
- misunderstandings of the requested behavior

When issues exist:
- cite specific files and lines when possible
- explain exactly what is missing, extra, or misinterpreted
- do not soften clear noncompliance

Output either:
- "PASS: Spec compliant" when the implementation matches exactly
- "FAIL: Issues found:" followed by specific findings
"""
```

- [ ] **Step 5: Create `.codex/agents/superpowers_plan_reviewer.toml`**

Write exactly:

```toml
name = "superpowers_plan_reviewer"
description = "Read-only reviewer that checks whether an implementation plan is complete, aligned to the spec, and ready to execute."
sandbox_mode = "read-only"
developer_instructions = """
Review an implementation plan for completeness, spec alignment, decomposition quality, and buildability.

Only flag issues that would cause real implementation problems:
- missing requirements from the spec
- contradictory steps
- placeholders or incomplete instructions
- tasks so vague an implementer would get stuck

Do not block approval for wording preferences or minor stylistic opinions.

Output format:
- Status: Approved | Issues Found
- Issues: specific blocking problems with file or section references
- Recommendations: optional non-blocking improvements
"""
```

- [ ] **Step 6: Create `.codex/agents/superpowers_doc_reviewer.toml`**

Write exactly:

```toml
name = "superpowers_doc_reviewer"
description = "Read-only reviewer that checks whether a design or specification document is complete, consistent, and ready for planning."
sandbox_mode = "read-only"
developer_instructions = """
Review a design or specification document for planning readiness.

Check for:
- placeholder markers or incomplete sections
- internal contradictions
- requirements that are ambiguous enough to cause the wrong implementation
- scope that is too broad for a single implementation plan
- unrequested complexity or over-engineering

Only flag issues that would lead to a flawed implementation plan.

Output format:
- Status: Approved | Issues Found
- Issues: specific planning blockers with section references
- Recommendations: optional non-blocking improvements
"""
```

- [ ] **Step 7: Verify the four TOML files exist and expose the required fields**

Run:

```bash
test "$(find .codex/agents -maxdepth 1 -name '*.toml' | wc -l | tr -d ' ')" -eq 4 \
  && rg -n '^name = "|^description = "|^sandbox_mode = "read-only"|^developer_instructions = """' .codex/agents/*.toml
```

Expected: PASS and `rg` prints matches from all four files

- [ ] **Step 8: Commit**

```bash
git add .codex/agents/superpowers_reviewer.toml \
  .codex/agents/superpowers_spec_reviewer.toml \
  .codex/agents/superpowers_plan_reviewer.toml \
  .codex/agents/superpowers_doc_reviewer.toml
git commit -m "feat(codex): add native Superpowers reviewer roles"
```

---

### Task 2: Rewrite `.codex/INSTALL.md` for Skills Plus Agents

**Files:**
- Modify: `.codex/INSTALL.md`

- [ ] **Step 1: Confirm the current install doc does not mention native agents**

Run:

```bash
rg -n '~/.codex/agents|multi_agent = true' .codex/INSTALL.md
```

Expected: no matches

- [ ] **Step 2: Replace `.codex/INSTALL.md` with the native-role install flow**

Replace the entire file with:

````markdown
# Installing Superpowers for Codex

Enable Superpowers skills and native Codex subagents through symlinks.

## Prerequisites

- Git

## Installation

1. **Clone the superpowers repository:**
   ```bash
   git clone https://github.com/obra/superpowers.git ~/.codex/superpowers
   ```

2. **Create the skills symlink:**
   ```bash
   mkdir -p ~/.agents/skills
   ln -s ~/.codex/superpowers/skills ~/.agents/skills/superpowers
   ```

3. **Create the agents symlink:**
   ```bash
   mkdir -p ~/.codex/agents
   ln -s ~/.codex/superpowers/.codex/agents ~/.codex/agents/superpowers
   ```

   **Windows (PowerShell):**
   ```powershell
   New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.agents\skills"
   cmd /c mklink /J "$env:USERPROFILE\.agents\skills\superpowers" "$env:USERPROFILE\.codex\superpowers\skills"
   New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.codex\agents"
   cmd /c mklink /J "$env:USERPROFILE\.codex\agents\superpowers" "$env:USERPROFILE\.codex\superpowers\.codex\agents"
   ```

4. **Restart Codex** (quit and relaunch the CLI) to discover both the skills and the native agent roles.

## Migrating from old bootstrap

If you installed superpowers before native skill discovery, you need to:

1. **Update the repo:**
   ```bash
   cd ~/.codex/superpowers && git pull
   ```

2. **Create the skills symlink** (step 2 above).

3. **Create the agents symlink** (step 3 above).

4. **Remove the old bootstrap block** from `~/.codex/AGENTS.md` - any block referencing `superpowers-codex bootstrap` is no longer needed.

5. **Restart Codex.**

## Verify

```bash
ls -la ~/.agents/skills/superpowers
find ~/.codex/agents/superpowers -maxdepth 1 -name '*.toml' | sort
```

You should see:

- a symlink (or junction on Windows) for the skills directory
- four native Codex agent TOMLs under `~/.codex/agents/superpowers`

## Updating

```bash
cd ~/.codex/superpowers && git pull
```

Skills and agents update through the symlinks after you restart Codex.

## Uninstalling

```bash
rm ~/.agents/skills/superpowers
rm ~/.codex/agents/superpowers
```

Optionally delete the clone: `rm -rf ~/.codex/superpowers`.
````

- [ ] **Step 3: Verify the install doc now covers both symlinks and verification commands**

Run:

```bash
rg -n '~/.agents/skills/superpowers|~/.codex/agents/superpowers|find ~/.codex/agents/superpowers -maxdepth 1 -name' .codex/INSTALL.md
```

Expected: PASS with matches for all three patterns

- [ ] **Step 4: Commit**

```bash
git add .codex/INSTALL.md
git commit -m "docs(codex): install native Superpowers agents"
```

---

### Task 3: Rewrite `docs/README.codex.md` Around the Native Role Model

**Files:**
- Modify: `docs/README.codex.md`

- [ ] **Step 1: Confirm the README still documents the old `multi_agent` framing**

Run:

```bash
rg -n 'multi_agent = true|~/.codex/agents|native Codex subagent roles' docs/README.codex.md
```

Expected:
- one match for `multi_agent = true`
- no matches for `~/.codex/agents`
- no matches for `native Codex subagent roles`

- [ ] **Step 2: Replace the manual install, how-it-works, and troubleshooting sections**

Make these exact content changes:

1. Replace the "### Steps" subsection under "## Manual Installation" with:

````markdown
### Steps

1. Clone the repo:
   ```bash
   git clone https://github.com/obra/superpowers.git ~/.codex/superpowers
   ```

2. Create the skills symlink:
   ```bash
   mkdir -p ~/.agents/skills
   ln -s ~/.codex/superpowers/skills ~/.agents/skills/superpowers
   ```

3. Create the agents symlink:
   ```bash
   mkdir -p ~/.codex/agents
   ln -s ~/.codex/superpowers/.codex/agents ~/.codex/agents/superpowers
   ```

4. Restart Codex.
````

2. Replace the Windows section with:

````markdown
### Windows

Use junctions instead of symlinks (works without Developer Mode):

```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.agents\skills"
cmd /c mklink /J "$env:USERPROFILE\.agents\skills\superpowers" "$env:USERPROFILE\.codex\superpowers\skills"
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.codex\agents"
cmd /c mklink /J "$env:USERPROFILE\.codex\agents\superpowers" "$env:USERPROFILE\.codex\superpowers\.codex\agents"
```
````

3. Replace the "## How It Works" section with:

````markdown
## How It Works

Codex loads two Superpowers integration surfaces at startup:

```
~/.agents/skills/superpowers/ -> ~/.codex/superpowers/skills/
~/.codex/agents/superpowers/ -> ~/.codex/superpowers/.codex/agents/
```

- the skills directory exposes SKILL.md files for native skill discovery
- the agents directory exposes native Codex reviewer roles such as `superpowers_reviewer` and `superpowers_spec_reviewer`

The `using-superpowers` skill is discovered automatically and enforces skill usage discipline. When subagent workflows need specialized reviewers on Codex, Superpowers can now use native `superpowers_*` roles instead of treating `worker` plus inline prompts as the primary design.
````

4. In "## Troubleshooting", replace the existing subsection with these two subsections:

````markdown
### Skills not showing up

1. Verify the symlink: `ls -la ~/.agents/skills/superpowers`
2. Check skills exist: `find ~/.codex/superpowers/skills -maxdepth 2 -name SKILL.md | head`
3. Restart Codex - skills are discovered at startup

### Agents not showing up

1. Verify the symlink: `ls -la ~/.codex/agents/superpowers`
2. Check TOMLs exist: `find ~/.codex/agents/superpowers -maxdepth 1 -name '*.toml' | sort`
3. Restart Codex - agent roles are loaded at startup
````

5. Delete the old paragraph that says subagent skills require users to add:

```toml
[features]
multi_agent = true
```

- [ ] **Step 3: Verify the README now documents native agents and no longer treats `multi_agent` as the normal install path**

Run:

```bash
! rg -n 'multi_agent = true' docs/README.codex.md \
  && rg -n '~/.codex/agents/superpowers|native Codex reviewer roles|Agents not showing up' docs/README.codex.md
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add docs/README.codex.md
git commit -m "docs(codex): document native Superpowers agent roles"
```

---

### Task 4: Rewrite the Codex Mapping Reference and Skill Guidance

**Files:**
- Modify: `skills/using-superpowers/references/codex-tools.md`
- Modify: `skills/requesting-code-review/SKILL.md`
- Modify: `skills/subagent-driven-development/SKILL.md`

- [ ] **Step 1: Confirm the reference still documents the old workaround as primary**

Run:

```bash
rg -n 'multi_agent = true|does not have a named agent registry|spawn_agent\\(agent_type="worker"' \
  skills/using-superpowers/references/codex-tools.md
```

Expected: all three old patterns match

- [ ] **Step 2: Replace `skills/using-superpowers/references/codex-tools.md` with native-role guidance**

Replace the entire file with:

````markdown
# Codex Tool Mapping

Skills use Claude Code tool names. When you encounter these in a skill, use your platform equivalent:

| Skill references | Codex equivalent |
|-----------------|------------------|
| `Task` tool (dispatch subagent) | `spawn_agent` |
| Multiple `Task` calls (parallel) | Multiple `spawn_agent` calls |
| Task returns result | `wait_agent` |
| Task completes automatically | `close_agent` to free slot |
| `TodoWrite` (task tracking) | `update_plan` |
| `Skill` tool (invoke a skill) | Skills load natively - just follow the instructions |
| `Read`, `Write`, `Edit` (files) | Use your native file tools |
| `Bash` (run commands) | Use your native shell tools |

## Native Superpowers Codex Roles

Superpowers for Codex installs native reviewer roles under:

- `~/.codex/agents/superpowers`

Current native roles:

- `superpowers_reviewer`
- `superpowers_spec_reviewer`
- `superpowers_plan_reviewer`
- `superpowers_doc_reviewer`

These are standard Codex custom roles, not a separate plugin-only mechanism.

## Preferred Dispatch Model

When a skill references a specialized Superpowers reviewer on Codex:

- use the matching native `superpowers_*` role if it appears in the `spawn_agent` role list
- keep implementation work on the built-in `worker` role
- keep read-heavy codebase exploration on the built-in `explorer` role

| Skill instruction | Preferred Codex mapping |
|-------------------|-------------------------|
| `Task tool (superpowers:code-reviewer)` | `spawn_agent(agent_type="superpowers_reviewer", message=...)` |
| Spec-compliance reviewer in `subagent-driven-development` | `spawn_agent(agent_type="superpowers_spec_reviewer", message=...)` |
| Plan document reviewer | `spawn_agent(agent_type="superpowers_plan_reviewer", message=...)` |
| Spec/design document reviewer | `spawn_agent(agent_type="superpowers_doc_reviewer", message=...)` |

## Compatibility Fallback

If the native Superpowers role is not available in the current Codex installation:

1. find the prompt source (`agents/code-reviewer.md` or the skill-local reviewer prompt)
2. fill any placeholders
3. dispatch `worker` or `default` with the filled instructions in `message`

Fallback is compatibility behavior, not the primary design.

## Message Framing for Fallback

The `message` parameter is user-level input, not a system prompt. Structure fallback dispatches like this:

```
Your task is to perform the following. Follow the instructions below exactly.

<agent-instructions>
[filled prompt content from the agent's .md file]
</agent-instructions>

Execute this now. Output ONLY the structured response following the format specified in the instructions above.
```

## Role Naming Guidance

Do not redefine built-ins such as `worker` or `explorer` for Superpowers. Codex lets custom roles override built-ins with the same name, so Superpowers uses namespaced `superpowers_*` role names to avoid collisions.

## Environment Detection

Skills that create worktrees or finish branches should detect their environment with read-only git commands before proceeding:

```bash
GIT_DIR=$(cd "$(git rev-parse --git-dir)" 2>/dev/null && pwd -P)
GIT_COMMON=$(cd "$(git rev-parse --git-common-dir)" 2>/dev/null && pwd -P)
BRANCH=$(git branch --show-current)
```

- `GIT_DIR != GIT_COMMON` -> already in a linked worktree
- `BRANCH` empty -> detached HEAD

See `using-git-worktrees` and `finishing-a-development-branch` for how Superpowers uses these signals.

## Codex App Finishing

When the sandbox blocks branch or push operations in an externally managed worktree, the agent can still run tests, stage files, and prepare suggested branch names, commit messages, and PR descriptions for the user to apply with the host application's own controls.
````

- [ ] **Step 3: Update `skills/requesting-code-review/SKILL.md` to mention the native Codex role**

Make these exact content changes:

1. Replace the first paragraph under `# Requesting Code Review` with:

```markdown
Dispatch superpowers:code-reviewer subagent to catch issues before they cascade. The reviewer gets precisely crafted context for evaluation - never your session's history. This keeps the reviewer focused on the work product, not your thought process, and preserves your own context for continued work.

On Codex, prefer the native `superpowers_reviewer` role when it is installed. Fall back to `worker` plus the filled reviewer prompt only when the native role is unavailable.
```

2. Replace the `**2. Dispatch code-reviewer subagent:**` block with:

```markdown
**2. Dispatch code-reviewer subagent:**

Use Task tool with superpowers:code-reviewer type, fill template at `code-reviewer.md`.

On Codex:
- preferred: `spawn_agent(agent_type="superpowers_reviewer", message=...)`
- fallback: `spawn_agent(agent_type="worker", message=...)` with the same filled review instructions
```

3. In the Example section, replace:

```markdown
[Dispatch superpowers:code-reviewer subagent]
```

with:

```markdown
[Dispatch superpowers:code-reviewer subagent]
  Codex preferred mapping: `spawn_agent(agent_type="superpowers_reviewer", ...)`
```

- [ ] **Step 4: Add a Codex native role mapping section to `skills/subagent-driven-development/SKILL.md`**

Insert the following immediately after the `## Prompt Templates` section:

```markdown
## Codex Native Role Mapping

When this workflow runs on Codex and the native Superpowers roles are installed:

- implementer -> built-in `worker`
- spec compliance reviewer -> `superpowers_spec_reviewer`
- code quality reviewer -> `superpowers_reviewer`
- final code reviewer -> `superpowers_reviewer`

If a native Superpowers reviewer role is unavailable, fall back to the existing prompt-driven dispatch using `worker` or `default`.
```

- [ ] **Step 5: Verify all three files now describe the native-role-first model**

Run:

```bash
rg -n 'superpowers_reviewer|superpowers_spec_reviewer|Compatibility Fallback|native `superpowers_\\*` role' \
  skills/using-superpowers/references/codex-tools.md \
  skills/requesting-code-review/SKILL.md \
  skills/subagent-driven-development/SKILL.md
```

Expected: PASS with matches in all three files

- [ ] **Step 6: Commit**

```bash
git add skills/using-superpowers/references/codex-tools.md \
  skills/requesting-code-review/SKILL.md \
  skills/subagent-driven-development/SKILL.md
git commit -m "docs(codex): prefer native Superpowers reviewer roles"
```

---

### Task 5: Update the Codex Test Harness and Test Docs

**Files:**
- Modify: `tests/codex/test-helpers.sh`
- Modify: `tests/codex/README.md`
- Modify: `docs/testing.md`

- [ ] **Step 1: Replace the Codex test environment setup so it installs agents and stops forcing `multi_agent`**

In `tests/codex/test-helpers.sh`, replace the entire `setup_codex_test_env()` function with:

```bash
setup_codex_test_env() {
    export TEST_ROOT
    TEST_ROOT="$(mktemp -d)"
    export HOME="$TEST_ROOT/home"
    export CODEX_HOME="$TEST_ROOT/codex-home"

    mkdir -p "$HOME/.agents/skills" "$CODEX_HOME/agents"
    ln -s "$REPO_ROOT/skills" "$HOME/.agents/skills/superpowers"
    ln -s "$REPO_ROOT/.codex/agents" "$CODEX_HOME/agents/superpowers"

    if [ -f "$ORIGINAL_CODEX_HOME/auth.json" ]; then
        cp "$ORIGINAL_CODEX_HOME/auth.json" "$CODEX_HOME/auth.json"
    fi
}
```

- [ ] **Step 2: Verify the harness no longer writes `multi_agent = true` and now installs agents**

Run:

```bash
! rg -n 'multi_agent = true' tests/codex/test-helpers.sh \
  && rg -n '\\$CODEX_HOME/agents|\\.codex/agents|ln -s "\\$REPO_ROOT/\\.codex/agents"' tests/codex/test-helpers.sh
```

Expected: PASS

- [ ] **Step 3: Rewrite `tests/codex/README.md` to describe skills plus agents**

Replace the paragraph under `## Overview` with:

```markdown
The tests run Codex in an isolated environment with temporary `HOME` and
`CODEX_HOME`, copy `auth.json` from the original Codex home when present, then
install:

- the repository's `skills/` directory into `$HOME/.agents/skills/superpowers`
- the repository's `.codex/agents/` directory into `$CODEX_HOME/agents/superpowers`
```

In `## Evidence Sources`, change the structured-event bullets to:

```markdown
- `todo_list` indicates `update_plan`
- `collab_tool_call` indicates subagent activity
- subagent session files can expose `agent_role` values such as `superpowers_spec_reviewer`
- `turn.completed` indicates a real completed agent turn
```

In `## Troubleshooting`, append this subsection:

````markdown
### Agents not loaded in tests

Verify:

```bash
find "$CODEX_HOME/agents/superpowers" -maxdepth 1 -name '*.toml' | sort
```

The isolated test environment should include the native Superpowers Codex role catalog.
````

- [ ] **Step 4: Update the Codex sections in `docs/testing.md`**

Make these exact content changes:

1. Under `## Overview`, replace the Codex bullet with:

```markdown
- Codex tests use `codex exec --json` output plus isolated session rollouts under temporary `$CODEX_HOME/sessions`, with both skills and native agent TOMLs installed into the isolated environment
```

2. Under `### Codex Environment Notes`, replace:

```markdown
- Skills are installed into the isolated home at `$HOME/.agents/skills/superpowers`
```

with:

```markdown
- Skills are installed into the isolated home at `$HOME/.agents/skills/superpowers`
- Native Superpowers Codex role TOMLs are installed into `$CODEX_HOME/agents/superpowers`
```

3. In the same Codex section, append:

```markdown
- Current Codex releases already expose subagents by default in normal setups; the test harness no longer forces `features.multi_agent = true` as its default assumption
```

- [ ] **Step 5: Verify docs now describe isolated native-agent installation**

Run:

```bash
rg -n '\\$CODEX_HOME/agents/superpowers|native Superpowers Codex role TOMLs|agent_role values such as `superpowers_spec_reviewer`' \
  tests/codex/README.md docs/testing.md
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add tests/codex/test-helpers.sh tests/codex/README.md docs/testing.md
git commit -m "test(codex): install native Superpowers agents in isolated harness"
```

---

### Task 6: Update Codex Tests to Prove the Native Reviewer Path

**Files:**
- Modify: `tests/codex/test-subagent-driven-development.sh`
- Modify: `tests/codex/test-subagent-driven-development-integration.sh`

- [ ] **Step 1: Add a fast semantic test for the native Codex reviewer mapping**

Append this test block near the end of `tests/codex/test-subagent-driven-development.sh`, immediately before the final `"=== All subagent-driven-development skill tests passed ==="` line:

```bash
echo ""
echo "Test 6: Codex native reviewer mapping..."
CODEX_TOOLS_SOURCE=$(cat "$REPO_ROOT/skills/using-superpowers/references/codex-tools.md")
REQUEST_REVIEW_SOURCE=$(cat "$REPO_ROOT/skills/requesting-code-review/SKILL.md")
native_roles_answer=$(run_codex "On Codex, when Superpowers needs reviewer-style subagents, what should it do when native Superpowers roles are installed, and what is the fallback when they are not? Answer in no more than 6 bullets." "$TEST_PROJECT" 90)
assert_semantic_judgment \
    "$CODEX_TOOLS_SOURCE

$REQUEST_REVIEW_SOURCE

$SKILL_SOURCE" \
    "How should Superpowers dispatch reviewer-style subagents on Codex?" \
    "$native_roles_answer" \
    "- Says Codex should prefer native Superpowers roles such as superpowers_reviewer or superpowers_spec_reviewer when they are available.
- Says implementation work still uses the built-in worker role.
- Says the fallback is worker or default with inline reviewer instructions when the native role is unavailable." \
    "$TEST_PROJECT" \
    "Codex native role mapping is preserved" \
    120 || exit 1
```

- [ ] **Step 2: Verify the updated fast test script is syntactically valid**

Run:

```bash
bash -n tests/codex/test-subagent-driven-development.sh
```

Expected: PASS

- [ ] **Step 3: Update the real integration test prompt to prefer native roles when available**

In `tests/codex/test-subagent-driven-development-integration.sh`, add this sentence inside the `PROMPT=$(cat <<'EOF'` block, directly after `use subagents for implementation and review`:

```text
- if native Superpowers Codex reviewer roles are available in this environment, use them instead of the legacy worker-inline fallback
```

- [ ] **Step 4: Add a native-role evidence assertion to the integration test**

In `tests/codex/test-subagent-driven-development-integration.sh`, after the existing "Test 2: Subagents spawned..." block, insert:

```bash
echo "Test 3: Native reviewer roles captured in session metadata..."
native_role_hits=$(find "$CODEX_HOME/sessions" -name "*.jsonl" -type f -print0 \
  | xargs -0 cat \
  | rg -o '"agent_role":"superpowers_(spec_reviewer|reviewer)"' \
  | wc -l | tr -d ' ')
worker_role_hits=$(find "$CODEX_HOME/sessions" -name "*.jsonl" -type f -print0 \
  | xargs -0 cat \
  | rg -o '"agent_role":"worker"' \
  | wc -l | tr -d ' ')
if [ "$native_role_hits" -ge 2 ] && [ "$worker_role_hits" -ge 1 ]; then
    echo "  [PASS] Found native reviewer roles ($native_role_hits) and worker role ($worker_role_hits)"
else
    echo "  [FAIL] Expected native reviewer roles and worker role in session metadata (native=$native_role_hits, worker=$worker_role_hits)"
    FAILED=$((FAILED + 1))
fi
echo ""
```

Then renumber the subsequent test headings so they stay sequential.

- [ ] **Step 5: Verify both Codex test scripts are syntactically valid**

Run:

```bash
bash -n tests/codex/test-subagent-driven-development.sh
bash -n tests/codex/test-subagent-driven-development-integration.sh
```

Expected: PASS

- [ ] **Step 6: Run the fast Codex test**

Run:

```bash
./tests/codex/run-skill-tests.sh --test test-subagent-driven-development.sh --timeout 300
```

Expected: PASS

- [ ] **Step 7: Run the real subagent integration test**

Run:

```bash
./tests/codex/run-skill-tests.sh --integration --test test-subagent-driven-development-integration.sh --timeout 1800
```

Expected: PASS, including the new native-role evidence assertion

- [ ] **Step 8: Run the document-review integration test to confirm the harness still works**

Run:

```bash
./tests/codex/run-skill-tests.sh --integration --test test-document-review-system.sh --timeout 1800
```

Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add tests/codex/test-subagent-driven-development.sh \
  tests/codex/test-subagent-driven-development-integration.sh
git commit -m "test(codex): verify native Superpowers reviewer roles"
```

---

## Self-Review Checklist

- Spec coverage:
  - native `.codex/agents/*.toml` role catalog -> Task 1
  - install flow for `~/.codex/agents/superpowers` -> Tasks 2 and 3
  - Codex role mapping becomes primary, fallback remains documented -> Task 4
  - isolated Codex test harness installs agents and stops assuming `multi_agent = true` -> Task 5
  - Codex tests assert native role usage -> Task 6

- Placeholder scan:
  - no placeholder shortcuts or shorthand cross-task references remain
  - every file path is explicit
  - every edit step includes concrete content or exact replacement text

- Type consistency:
  - role names are consistent everywhere: `superpowers_reviewer`, `superpowers_spec_reviewer`, `superpowers_plan_reviewer`, `superpowers_doc_reviewer`
  - install path is consistent everywhere: `~/.codex/agents/superpowers`
  - fallback wording is consistent everywhere: built-in `worker` or `default` plus inline prompt
