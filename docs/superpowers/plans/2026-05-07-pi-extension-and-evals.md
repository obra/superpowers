# Pi Extension and Evals Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add first-class Pi package support for Superpowers and add Pi as a Drill eval backend.

**Architecture:** The Pi package is declared in the root `package.json` and loads existing `skills/` plus a small Pi extension. The extension injects the `using-superpowers` bootstrap into provider context as a user-role message on session startup and after compaction, with Pi-specific tool mapping. Drill gains a `pi` backend, Pi session-log normalization, and tests.

**Tech Stack:** Pi TypeScript extension API, Node built-in test runner, Drill Python eval harness, pytest.

---

### Task 1: Pi package manifest and extension tests

**Files:**
- Modify: `package.json`
- Create: `tests/pi/test-pi-extension.mjs`

- [ ] **Step 1: Write failing package/extension tests**

Create `tests/pi/test-pi-extension.mjs` with tests that import `extensions/superpowers.ts`, register fake Pi handlers, and assert:
- root `package.json` has `keywords` containing `pi-package`
- root `package.json` has `pi.skills: ["./skills"]`
- root `package.json` has `pi.extensions: ["./extensions/superpowers.ts"]`
- the extension registers `resources_discover`, `session_start`, `session_compact`, `context`, and `agent_end`
- startup `context` injects exactly one user-role bootstrap message
- `agent_end` clears startup injection
- `session_compact` re-enables injection
- the extension does not register `session_before_compact`

- [ ] **Step 2: Run tests and verify RED**

Run: `node --experimental-strip-types --test tests/pi/test-pi-extension.mjs`

Expected: FAIL because `extensions/superpowers.ts` does not exist and `package.json` lacks the `pi` manifest.

- [ ] **Step 3: Implement manifest fields**

Update `package.json` with `description`, `keywords`, `pi.extensions`, and `pi.skills` while preserving existing `name`, `version`, `type`, and `main`.

- [ ] **Step 4: Implement `extensions/superpowers.ts`**

Create a zero-runtime-dependency extension that:
- locates the package root from `import.meta.url`
- reads `skills/using-superpowers/SKILL.md`
- strips YAML frontmatter
- appends Pi-specific tool mapping
- exposes `resources_discover` with the skills path
- marks bootstrap pending on `session_start` and `session_compact`
- injects a user-role bootstrap message in `context`
- inserts post-compact bootstrap after leading `compactionSummary` messages
- clears pending bootstrap on `agent_end`

- [ ] **Step 5: Run tests and verify GREEN**

Run: `node --experimental-strip-types --test tests/pi/test-pi-extension.mjs`

Expected: PASS.

### Task 2: Pi tool mapping reference

**Files:**
- Create: `skills/using-superpowers/references/pi-tools.md`
- Modify: `tests/pi/test-pi-extension.mjs`

- [ ] **Step 1: Write failing test for Pi reference doc**

Add assertions that `skills/using-superpowers/references/pi-tools.md` exists and documents mappings for `Skill`, `Task`, `TodoWrite`, and built-in tool names.

- [ ] **Step 2: Run tests and verify RED**

Run: `node --experimental-strip-types --test tests/pi/test-pi-extension.mjs`

Expected: FAIL because `pi-tools.md` does not exist.

- [ ] **Step 3: Add Pi reference doc**

Create `skills/using-superpowers/references/pi-tools.md` explaining Pi-native skills, optional `pi-subagents`, no canonical todo/tasklist plugin, and built-in lowercase tools.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `node --experimental-strip-types --test tests/pi/test-pi-extension.mjs`

Expected: PASS.

### Task 3: Drill Pi backend and session log normalization

**Files:**
- Create: `evals/backends/pi.yaml`
- Modify: `evals/drill/backend.py`
- Modify: `evals/drill/engine.py`
- Modify: `evals/drill/normalizer.py`
- Modify: `evals/tests/test_backend.py`
- Modify: `evals/tests/test_normalizer.py`

- [ ] **Step 1: Write failing backend/normalizer tests**

Add pytest coverage for:
- `load_backend("pi")` returns `family == "pi"`
- Pi backend command starts with `pi` and includes `-e ${SUPERPOWERS_ROOT}`
- `_resolve_log_dir()` for Pi points under `~/.pi/agent/sessions`
- `filter_pi_logs_by_cwd()` keeps only session files whose header `cwd` matches the scenario workdir
- `normalize_pi_logs()` extracts `toolCall` blocks from Pi assistant session entries and maps built-in lowercase tools to canonical names

- [ ] **Step 2: Run tests and verify RED**

Run: `uv run pytest evals/tests/test_backend.py evals/tests/test_normalizer.py -q`

Expected: FAIL because the Pi backend and normalizer do not exist.

- [ ] **Step 3: Add `evals/backends/pi.yaml`**

Configure the backend to run `pi -e ${SUPERPOWERS_ROOT}`, use permissive TUI readiness, `/quit` shutdown, and Pi session log location.

- [ ] **Step 4: Implement Pi family support**

Update `Backend.family`, `Engine._resolve_log_dir`, `Engine._collect_tool_calls`, and `normalizer.py` with Pi log filtering and normalizing.

- [ ] **Step 5: Run tests and verify GREEN**

Run: `uv run pytest evals/tests/test_backend.py evals/tests/test_normalizer.py -q`

Expected: PASS.

### Task 4: Documentation and full verification

**Files:**
- Modify: `README.md`
- Modify: `evals/README.md`

- [ ] **Step 1: Document Pi install and eval backend**

Add Pi to README quickstart/install list and add backend entry/usage to `evals/README.md`.

- [ ] **Step 2: Run verification**

Run:
```bash
node --experimental-strip-types --test tests/pi/test-pi-extension.mjs
uv run pytest evals/tests/test_backend.py evals/tests/test_setup.py evals/tests/test_normalizer.py -q
```

Expected: all tests pass.
