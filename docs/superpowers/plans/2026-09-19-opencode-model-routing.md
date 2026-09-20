# OpenCode Model Routing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add installable OpenCode V2 model-role agents and route delegated Superpowers work to them without changing V1 or other harnesses.

**Architecture:** Four Markdown profiles are bundled with the fork. A dependency-free Node installer copies them only when the operator explicitly supplies an OpenCode configuration directory. The existing V2 bootstrap receives the role-selection policy and safe `general` fallback; V1 remains unchanged.

**Tech Stack:** Node.js ESM, OpenCode V2 Markdown agent frontmatter, Bash, Node test scripts.

**Spec:** `docs/superpowers/specs/2026-09-19-opencode-model-routing-design.md`

## Global Constraints

- Require OpenCode V2 2.0.4 or later; preserve the V1 mapping byte-for-byte semantically.
- Use exactly: `zai-org/GLM-5.3`, `z-ai/glm-5.3-flash`, `xiaomi/mimo-v2.5`, `deepseek/deepseek-v4-flash`.
- Add no dependency, provider, credential, catalog, or automatic edit of `opencode.json`/`opencode.jsonc`.
- Require `--config-dir <path>` and never overwrite a profile; invalid input and collisions return non-zero.
- Change only OpenCode assets; do not edit shared skills or another harness.
- Apply RED-GREEN-REFACTOR before every implementation change.

---

## File Structure

| Path | Responsibility |
| --- | --- |
| `opencode/model-routing/agents/superpowers-*.md` | Four V2 profile definitions. |
| `scripts/install-opencode-model-routing.mjs` | Opt-in, collision-safe profile installer. |
| `.opencode/plugins/superpowers.js` | V2 bootstrap routing policy. |
| `tests/opencode/test-model-routing.mjs` | Installer, metadata, collision, bootstrap and docs contract. |
| `tests/opencode/test-model-routing.sh` | Test entry point. |
| `tests/opencode/run-tests.sh` | Static suite registration. |
| `.opencode/INSTALL.md`, `docs/README.opencode.md` | Operator instructions. |

### Task 1: Profiles and collision-safe installer

**Files:**
- Create: `tests/opencode/test-model-routing.mjs`
- Create: `tests/opencode/test-model-routing.sh`
- Create: `opencode/model-routing/agents/superpowers-expert.md`
- Create: `opencode/model-routing/agents/superpowers-main.md`
- Create: `opencode/model-routing/agents/superpowers-economic.md`
- Create: `opencode/model-routing/agents/superpowers-economic-fast.md`
- Create: `scripts/install-opencode-model-routing.mjs`
- Modify: `tests/opencode/run-tests.sh:48-53`

**Interfaces:**
- Consumes: `--config-dir <path>` and four package profile files.
- Produces: `<config-dir>/agents/superpowers-*.md`; `0` only after all copies succeed.

- [ ] **Step 1: Write the failing contract**

Create `tests/opencode/test-model-routing.mjs` using `assert`, `fs.mkdtempSync`, and `spawnSync`. It runs the installer against a temporary configuration directory and checks this exact list:

```js
const expectedProfiles = [
  ['superpowers-expert.md', 'zai-org/GLM-5.3'],
  ['superpowers-main.md', 'z-ai/glm-5.3-flash'],
  ['superpowers-economic.md', 'xiaomi/mimo-v2.5'],
  ['superpowers-economic-fast.md', 'deepseek/deepseek-v4-flash'],
];
```

For a successful run, require every target to have `mode: all`, the exact `model:` value, and a nonempty `description:`. Replace the installed expert profile with `user-owned`, run again, require non-zero, and require the sentinel remains. Invoke with no arguments and require non-zero stderr containing `--config-dir`. Create the Bash runner with `set -euo pipefail` that runs `node "$SCRIPT_DIR/test-model-routing.mjs" "$(cd "$SCRIPT_DIR/../.." && pwd)"`.

- [ ] **Step 2: Prove red**

Run: `node tests/opencode/test-model-routing.mjs "$(pwd)"`

Expected: FAIL because installer and profile sources do not exist, not because of a malformed test.

- [ ] **Step 3: Implement the smallest installer and profiles**

Use this exact profile frontmatter shape, with each role's matching model and purpose:

```markdown
---
description: <routing purpose>
mode: all
model: <provider/model>
---
```

The profile IDs and responsibilities are `superpowers-expert` (architecture, difficult debugging, security, final review), `superpowers-main` (implementation), `superpowers-economic` (exploration and routine work), and `superpowers-economic-fast` (short low-risk checks).

Implement the script with Node built-ins. It accepts exactly one `--config-dir <path>` pair; rejects a missing/duplicate flag, missing value, or positional input; resolves the path; creates it plus `agents/` if absent; and verifies each is a directory. Keep one list: `['superpowers-expert.md', 'superpowers-main.md', 'superpowers-economic.md', 'superpowers-economic-fast.md']`. Before copying, confirm all package sources exist and every destination is absent. On conflict print all paths to stderr and exit `1` before a copy. Otherwise use `fs.copyFileSync` and print all installed destinations.

- [ ] **Step 4: Prove green and register the test**

Run: `node tests/opencode/test-model-routing.mjs "$(pwd)"`

Expected: PASS for success, metadata, collision preservation, and CLI validation. Add `"test-model-routing.sh"` after `test-bootstrap-caching.sh` in the runner's non-integration `tests` array. Run: `bash tests/opencode/run-tests.sh --test test-model-routing.sh`. Expected: one passing test and zero failures.

- [ ] **Step 5: Commit**

Run: `git add opencode/model-routing/agents scripts/install-opencode-model-routing.mjs tests/opencode/test-model-routing.mjs tests/opencode/test-model-routing.sh tests/opencode/run-tests.sh`

Run: `git commit -m "feat(opencode): add model routing profiles"`

### Task 2: V2-only routing policy

**Files:**
- Modify: `tests/opencode/test-model-routing.mjs`
- Modify: `.opencode/plugins/superpowers.js:95-108`

**Interfaces:**
- Consumes: the four Task 1 IDs.
- Produces: `V2_MAPPING` role guidance; V1 still uses `task` with `subagent_type: "general"`.

- [ ] **Step 1: Add failing mapping assertions**

Import `.opencode/plugins/superpowers.js` by `pathToFileURL`. Require `V2_MAPPING` to include `superpowers-expert`, `superpowers-main`, `superpowers-economic`, `superpowers-economic-fast`, `architecture`, `implementation`, `exploration`, and `general`. Require `V1_MAPPING` to include `` `task` with `subagent_type: "general"` `` and not include `superpowers-expert`.

- [ ] **Step 2: Prove red**

Run: `node tests/opencode/test-model-routing.mjs "$(pwd)"`

Expected: only the added V2 mapping assertions fail; Task 1 stays green.

- [ ] **Step 3: Implement minimal V2 instructions**

In `V2_MAPPING`, immediately after the current general-purpose subagent line, state: `superpowers-expert` handles architecture, difficult debugging, security analysis, and final review; `superpowers-main` handles implementation; `superpowers-economic` handles exploration and routine work; `superpowers-economic-fast` handles short low-risk checks. State that the controller only selects an available catalog profile; otherwise it invokes `agent: "general"` and says model routing is uninstalled. Do not alter `V1_MAPPING`, existing V2 tool mappings, cache, or child-session behavior.

- [ ] **Step 4: Prove green**

Run: `node tests/opencode/test-model-routing.mjs "$(pwd)"`

Run: `bash tests/opencode/test-bootstrap-caching.sh`

Expected: both PASS; the second test still sees one V1 and one V2 insertion with no V1-only tool name in V2 output.

- [ ] **Step 5: Commit**

Run: `git add .opencode/plugins/superpowers.js tests/opencode/test-model-routing.mjs`

Run: `git commit -m "feat(opencode): route delegated work by model role"`

### Task 3: Installation documentation

**Files:**
- Modify: `.opencode/INSTALL.md:29-39,120-150`
- Modify: `docs/README.opencode.md:27-34,130-154`
- Modify: `tests/opencode/test-model-routing.mjs`

**Interfaces:**
- Consumes: Tasks 1 and 2.
- Produces: copy-pasteable setup, verification, fallback, and removal guidance.

- [ ] **Step 1: Add documentation assertions first**

Extend the Node test to read both guides. Require each to contain `install-opencode-model-routing.mjs`, `opencode models`, `superpowers-expert`, `superpowers-economic-fast`, `zai-org/GLM-5.3`, and `deepseek/deepseek-v4-flash`. Also require `does not modify` beside `opencode.jsonc`.

- [ ] **Step 2: Prove red**

Run: `node tests/opencode/test-model-routing.mjs "$(pwd)"`

Expected: only new documentation assertions fail.

- [ ] **Step 3: Write precise operator guidance**

Add `Model routing (OpenCode V2)` to both files. Include the PowerShell command `node .\node_modules\superpowers\scripts\install-opencode-model-routing.mjs --config-dir "$HOME\.config\opencode"` and POSIX command `node ./node_modules/superpowers/scripts/install-opencode-model-routing.mjs --config-dir "$HOME/.config/opencode"`, each followed by `opencode models`. List all four roles and model IDs. State that providers must enable models, the installer only copies profiles and does not modify `opencode.json` or `opencode.jsonc`, collisions are refused, missing profiles fall back to `general`, and only the four copied `agents/superpowers-*.md` files should be removed to uninstall.

- [ ] **Step 4: Prove green**

Run: `node tests/opencode/test-model-routing.mjs "$(pwd)"`

Run: `bash tests/opencode/run-tests.sh`

Expected: all non-integration OpenCode tests PASS. Report real-runtime testing separately if the host lacks OpenCode or any configured model.

- [ ] **Step 5: Commit**

Run: `git add .opencode/INSTALL.md docs/README.opencode.md tests/opencode/test-model-routing.mjs`

Run: `git commit -m "docs(opencode): explain model routing setup"`

### Task 4: Final verification and handoff

**Files:**
- Verify only: all Task 1-3 files plus the approved design.

**Interfaces:**
- Consumes: completed implementation.
- Produces: explicit static and runtime evidence.

- [ ] **Step 1: Check final scope**

Run: `git status --short`

Run: `git diff HEAD~3..HEAD --check`

Run: `git log --oneline -4`

Expected: only planned changes and no whitespace errors.

- [ ] **Step 2: Repeat the static suite**

Run: `bash tests/opencode/run-tests.sh`

Expected: all static tests, including `test-model-routing.sh`, pass with zero failures.

- [ ] **Step 3: Attempt runtime evidence only when available**

Run: `opencode models`

Run: `opencode run --standalone --model z-ai/glm-5.3-flash "Delegate a short repository exploration task using the installed Superpowers economic profile."`

Expected: catalog lists the four IDs and the session can select `superpowers-economic`. If OpenCode, credentials, or a model is unavailable, report this as unperformed, not passed.

- [ ] **Step 4: Deliver**

Report the installer command, all four mappings, static suite result, and separate runtime result.
