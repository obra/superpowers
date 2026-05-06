# Lift drill into superpowers as `evals/` — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the standalone `obra/drill` skill-compliance benchmark into superpowers as a top-level `evals/` directory, delete redundant bash tests under `superpowers/tests/` after per-file subagent verification of drill scenario coverage, and update top-level docs so contributors land on the new structure.

**Architecture:** Single PR against `dev` on a new branch `f/evals-lift`. Drill source is copied verbatim with explicit rsync excludes to keep `.git/`, `.venv/`, etc. out of the new dir. A small helper in `drill/cli.py` defaults `SUPERPOWERS_ROOT` to the parent of the `evals/` directory, so contributors don't have to set the env var. Each bash-test deletion is gated by a subagent that compares the bash test's assertions to its claimed drill scenario's verify block. Historical references in plan docs and release notes are annotated, not rewritten.

**Tech Stack:** Python 3.11 + uv (drill's existing toolchain, unchanged); rsync; bash; git.

**Spec:** `docs/superpowers/specs/2026-05-06-lift-drill-into-evals-design.md` — read this first.

**Drill source location:** `/Users/jesse/Documents/GitHub/superpowers/drill/` (sibling to `superpowers/`).

---

## Task 1: Branch off dev

**Files:** none (git operation only)

- [ ] **Step 1: Verify clean working tree**

```bash
cd /Users/jesse/Documents/GitHub/superpowers/superpowers
git status --short
```

Expected: empty output (or only untracked `.opencode/package-lock.json`, which is fine).

- [ ] **Step 2: Fetch latest dev**

```bash
git fetch origin dev:dev
```

- [ ] **Step 3: Create the branch**

```bash
git checkout -b f/evals-lift dev
```

Expected: `Switched to a new branch 'f/evals-lift'`.

- [ ] **Step 4: Sanity check**

```bash
git log --oneline -1
```

Expected output begins with whatever commit `origin/dev` points to (currently `b4363df docs: turned the dash in "- Jesse" into an escape sequence (#1474)`).

---

## Task 2: Capture drill SHA at copy time

**Files:** none (records the value for the lift commit message)

- [ ] **Step 1: Get the current drill HEAD SHA**

```bash
cd /Users/jesse/Documents/GitHub/superpowers/drill
DRILL_SHA=$(git rev-parse HEAD)
echo "$DRILL_SHA"
```

- [ ] **Step 2: Verify drill has no uncommitted work**

```bash
cd /Users/jesse/Documents/GitHub/superpowers/drill
git status --short
```

Expected: empty (no untracked or modified files). If output is non-empty, stop and report — drill working tree must be clean before lift, otherwise the SHA-pin is meaningless.

- [ ] **Step 3: Save the SHA in shell env for next task**

```bash
echo "DRILL_SHA=$DRILL_SHA"  # write this down for use in Task 3
```

---

## Task 3: rsync drill into evals/

**Files:**
- Create: `evals/` (entire directory tree from drill, minus excludes)

- [ ] **Step 1: Verify source and destination paths**

```bash
cd /Users/jesse/Documents/GitHub/superpowers/superpowers
test -d /Users/jesse/Documents/GitHub/superpowers/drill && echo "drill source: OK"
test ! -d evals && echo "evals/ does not yet exist: OK"
```

Expected: both echoes print.

- [ ] **Step 2: rsync drill to evals/ with explicit excludes**

```bash
cd /Users/jesse/Documents/GitHub/superpowers/superpowers
rsync -a \
  --exclude=.git \
  --exclude=.venv \
  --exclude=results \
  --exclude=.env \
  --exclude=__pycache__ \
  --exclude='*.egg-info' \
  --exclude=.private-journal \
  --exclude='*.pyc' \
  /Users/jesse/Documents/GitHub/superpowers/drill/ \
  evals/
```

- [ ] **Step 3: Verify excludes worked**

```bash
find evals -name '.git' -type d
find evals -name '.venv' -type d
find evals -name 'results' -type d
find evals -name '.env'
find evals -name '__pycache__' -type d
find evals -name '*.egg-info' -type d
```

Expected: every command returns no output. If any returns a path, manually `rm -rf` it before continuing.

- [ ] **Step 4: Confirm the source SHA for the commit message**

```bash
cd /Users/jesse/Documents/GitHub/superpowers/drill
DRILL_SHA=$(git rev-parse HEAD)
echo "$DRILL_SHA"
```

Expected: the SHA from Task 2 step 1.

- [ ] **Step 5: Stage everything**

```bash
git add evals/
git status --short | head -20
```

Expected output starts with `A  evals/...` lines listing many added files. Many of these are in scenarios/, drill/, backends/, setup_helpers/, etc.

- [ ] **Step 6: Commit**

```bash
: "${DRILL_SHA:?Set DRILL_SHA from Task 2 before committing}"
git commit -m "$(cat <<EOF
Lift drill into evals/ at $DRILL_SHA

rsync of obra/drill@$DRILL_SHA into superpowers/evals/, excluding
.git/, .venv/, results/, .env/, __pycache__/, *.egg-info/,
.private-journal/.

The drill repo is unaffected by this commit; archival is a separate
manual step after this PR merges.

Source SHA recorded in this commit message for provenance.
EOF
)"
```

---

## Task 4: Verify the copy with checksums

**Files:** none (verification only)

- [ ] **Step 1: Get list of files that exist in drill but should NOT be in evals (the excludes)**

```bash
cd /Users/jesse/Documents/GitHub/superpowers/drill
find . \
  \( -name '.git' -prune \
  -o -name '.venv' -prune \
  -o -name 'results' -prune \
  -o -name '__pycache__' -prune \
  -o -name '*.egg-info' -prune \
  -o -name '.private-journal' -prune \
  -o -name '*.pyc' -prune \
  -o -name '.env' -prune \) \
  -o -type f -print | sort > /tmp/drill-files.txt
wc -l /tmp/drill-files.txt
```

- [ ] **Step 2: Get list of files in evals/**

```bash
cd /Users/jesse/Documents/GitHub/superpowers/superpowers
find evals -type f | sed 's|^evals/|./|' | sort > /tmp/evals-files.txt
wc -l /tmp/evals-files.txt
```

- [ ] **Step 3: Diff the two lists**

The file lists should match exactly after excluded paths are removed.

```bash
diff /tmp/drill-files.txt /tmp/evals-files.txt
```

Expected: no output.

- [ ] **Step 4: Per-file checksum verification**

```bash
cd /Users/jesse/Documents/GitHub/superpowers/drill
while read -r f; do
  sha1=$(shasum -a 256 "$f" | cut -d' ' -f1)
  sha2=$(shasum -a 256 "/Users/jesse/Documents/GitHub/superpowers/superpowers/evals/${f#./}" | cut -d' ' -f1)
  if [ "$sha1" != "$sha2" ]; then
    echo "MISMATCH: $f ($sha1 vs $sha2)"
  fi
done < /tmp/drill-files.txt | head -20
```

Expected: no output (every file's checksum matches between drill and evals).

- [ ] **Step 5: Smoke check - install dependencies**

```bash
cd /Users/jesse/Documents/GitHub/superpowers/superpowers/evals
uv sync
```

Expected: `Installed N packages` or similar. No errors.

- [ ] **Step 6: Smoke check - drill list**

```bash
cd /Users/jesse/Documents/GitHub/superpowers/superpowers/evals
uv run drill list 2>&1 | head -5
```

Expected: starts with scenario names. (Will likely error or warn about missing SUPERPOWERS_ROOT — that's fine, fixed in next task.)

- [ ] **Step 7: Dispatch verification subagent**

Dispatch a `general-purpose` subagent with this prompt:

```
You are verifying a verbatim copy of the drill repo at
/Users/jesse/Documents/GitHub/superpowers/drill into
/Users/jesse/Documents/GitHub/superpowers/superpowers/evals.

Verify:

1. The lift commit message records the SHA reported by:
  cd /Users/jesse/Documents/GitHub/superpowers/drill && git rev-parse HEAD

2. None of these excluded paths exist under evals/: .git/, .venv/,
results/, .env/, __pycache__/, *.egg-info/, .private-journal/.

3. Every non-excluded file in drill has a SHA-256-identical
counterpart in evals/, and there are no extra files in evals/.

4. The pyproject.toml, uv.lock, scenarios/*.yaml, backends/*.yaml,
setup_helpers/*.py, drill/*.py, prompts/*.md, fixtures/, bin/, and
docs/ are all present.

Report each check with PASS/FAIL. If any FAIL, dump enough detail
that the parent can fix.
```

If the subagent reports any FAIL, fix the underlying issue (delete the leaked file, re-rsync, etc.) before continuing.

---

## Task 5: Add `SUPERPOWERS_ROOT` default helper

**Files:**
- Modify: `evals/drill/cli.py:11-14`

- [ ] **Step 1: Read the current cli.py header**

```bash
sed -n '1,20p' /Users/jesse/Documents/GitHub/superpowers/superpowers/evals/drill/cli.py
```

Expected output:

```python
"""Drill CLI: run, compare, list."""

from __future__ import annotations

import secrets
from pathlib import Path

import click
from dotenv import load_dotenv

PROJECT_ROOT: Path = Path(__file__).parent.parent

load_dotenv(PROJECT_ROOT / ".env")
```

- [ ] **Step 2: Write a failing test for the helper**

Open `evals/tests/test_cli.py` and add this test at the end:

```python
def test_set_superpowers_root_default_when_unset(monkeypatch, tmp_path):
    """When SUPERPOWERS_ROOT is unset, helper sets it to PROJECT_ROOT.parent."""
    monkeypatch.delenv("SUPERPOWERS_ROOT", raising=False)
    from drill.cli import _set_superpowers_root_default, PROJECT_ROOT

    _set_superpowers_root_default()

    import os
    assert os.environ["SUPERPOWERS_ROOT"] == str(PROJECT_ROOT.parent)


def test_set_superpowers_root_default_respects_existing(monkeypatch):
    """When SUPERPOWERS_ROOT is already set, helper does not override."""
    monkeypatch.setenv("SUPERPOWERS_ROOT", "/custom/path")
    from drill.cli import _set_superpowers_root_default

    _set_superpowers_root_default()

    import os
    assert os.environ["SUPERPOWERS_ROOT"] == "/custom/path"
```

- [ ] **Step 3: Run the test and watch it fail**

```bash
cd /Users/jesse/Documents/GitHub/superpowers/superpowers/evals
uv run pytest tests/test_cli.py -k set_superpowers_root_default -v
```

Expected: 2 tests fail with `AttributeError: module 'drill.cli' has no attribute '_set_superpowers_root_default'`.

- [ ] **Step 4: Add the helper to cli.py**

Edit `/Users/jesse/Documents/GitHub/superpowers/superpowers/evals/drill/cli.py`. Replace lines 1–14 with:

```python
"""Drill CLI: run, compare, list."""

from __future__ import annotations

import os
import secrets
from pathlib import Path

import click
from dotenv import load_dotenv

PROJECT_ROOT: Path = Path(__file__).parent.parent

load_dotenv(PROJECT_ROOT / ".env")


def _set_superpowers_root_default() -> None:
    """Default SUPERPOWERS_ROOT to the parent of evals/ if not already set.

    Drill historically required contributors to export SUPERPOWERS_ROOT
    pointing at the superpowers checkout. After lifting drill into
    superpowers/evals/, the parent of PROJECT_ROOT is always the
    superpowers root, so we can supply this default automatically.

    Existing SUPERPOWERS_ROOT environment values are respected as overrides.
    """
    os.environ.setdefault("SUPERPOWERS_ROOT", str(PROJECT_ROOT.parent))


_set_superpowers_root_default()
```

The bottom-of-module call to `_set_superpowers_root_default()` runs at import time, immediately after `load_dotenv()`. This ensures both `engine.py` and `setup.py` (which read `os.environ["SUPERPOWERS_ROOT"]` directly) and the YAML interpolation (which reads `os.environ` when the backend YAML is loaded) all see the value.

- [ ] **Step 5: Run the test and watch it pass**

```bash
cd /Users/jesse/Documents/GitHub/superpowers/superpowers/evals
uv run pytest tests/test_cli.py -k set_superpowers_root_default -v
```

Expected: 2 tests pass.

- [ ] **Step 6: Commit**

```bash
cd /Users/jesse/Documents/GitHub/superpowers/superpowers
git add evals/drill/cli.py evals/tests/test_cli.py
git commit -m "evals: default SUPERPOWERS_ROOT to parent of evals/ if unset

Adds _set_superpowers_root_default() to drill/cli.py, called at
module import after load_dotenv(). PROJECT_ROOT resolves to evals/
post-lift; its parent is the superpowers repo root, which is the
correct value for SUPERPOWERS_ROOT.

Existing env values are respected as overrides via os.environ.setdefault.

Tests:
- helper sets default when var is unset
- helper does not override when var is already set"
```

---

## Task 6: Update backend YAMLs to reflect the new env contract

**Files:**
- Modify: `evals/backends/codex.yaml` (drop `SUPERPOWERS_ROOT` from `required_env`)
- Modify: `evals/backends/gemini.yaml` (drop `SUPERPOWERS_ROOT` from `required_env`)

The five `claude*.yaml` backend configs interpolate `${SUPERPOWERS_ROOT}` into `args` for the `--plugin-dir` flag — they keep `SUPERPOWERS_ROOT` in `required_env` because the interpolation needs it. The codex/gemini configs only listed it for engine.py/setup.py's `os.environ` reads, which the helper now satisfies.

- [ ] **Step 1: Confirm current state**

```bash
grep -A3 'required_env:' /Users/jesse/Documents/GitHub/superpowers/superpowers/evals/backends/codex.yaml
grep -A2 'required_env:' /Users/jesse/Documents/GitHub/superpowers/superpowers/evals/backends/gemini.yaml
```

Expected outputs include `- SUPERPOWERS_ROOT` lines.

- [ ] **Step 2: Read codex.yaml fully**

```bash
cat /Users/jesse/Documents/GitHub/superpowers/superpowers/evals/backends/codex.yaml
```

- [ ] **Step 3: Edit codex.yaml — drop the `- SUPERPOWERS_ROOT` line under `required_env`**

Open `evals/backends/codex.yaml` and find:

```yaml
required_env:
  - OPENAI_API_KEY
  - SUPERPOWERS_ROOT
```

Replace with:

```yaml
required_env:
  - OPENAI_API_KEY
```

- [ ] **Step 4: Edit gemini.yaml — drop the `- SUPERPOWERS_ROOT` line under `required_env`**

Open `evals/backends/gemini.yaml` and find:

```yaml
required_env:
  - SUPERPOWERS_ROOT
```

Replace with:

```yaml
required_env: []
```

(Empty list rather than dropping the field, so YAML schema validation doesn't trip.)

- [ ] **Step 5: Run drill's pytest suite to ensure nothing broke**

```bash
cd /Users/jesse/Documents/GitHub/superpowers/superpowers/evals
uv run pytest -x 2>&1 | tail -20
```

Expected: all tests pass. If `tests/test_backend.py` complains about `required_env` membership for codex/gemini, see Task 7.

- [ ] **Step 6: Commit**

```bash
cd /Users/jesse/Documents/GitHub/superpowers/superpowers
git add evals/backends/codex.yaml evals/backends/gemini.yaml
git commit -m "evals: drop SUPERPOWERS_ROOT from codex/gemini required_env

These backends only read SUPERPOWERS_ROOT via engine.py/setup.py's
os.environ access, which the new cli.py default helper supplies
automatically. claude*.yaml keep SUPERPOWERS_ROOT in required_env
because they interpolate \${SUPERPOWERS_ROOT} into --plugin-dir args."
```

---

## Task 7: Update drill's pytest suite for the new contract

**Files:**
- Modify: `evals/tests/test_backend.py` (per-test updates if Task 6 step 5 surfaced failures)

- [ ] **Step 1: Run the test suite**

```bash
cd /Users/jesse/Documents/GitHub/superpowers/superpowers/evals
uv run pytest tests/test_backend.py -v 2>&1 | tail -30
```

If all tests pass, skip to step 5 (commit nothing, move to Task 8). Otherwise:

- [ ] **Step 2: Read failing tests**

For each failure, open the test in `evals/tests/test_backend.py` and read the assertion.

- [ ] **Step 3: Update assertions**

For tests that assert `SUPERPOWERS_ROOT` membership in `codex.yaml`'s or `gemini.yaml`'s `required_env`: invert the assertion to confirm absence. Example:

```python
# Before:
def test_codex_requires_superpowers_root():
    backend = load_backend("codex")
    assert "SUPERPOWERS_ROOT" in backend.required_env

# After:
def test_codex_does_not_require_superpowers_root():
    """codex.yaml dropped SUPERPOWERS_ROOT from required_env;
    the cli.py helper supplies the default."""
    backend = load_backend("codex")
    assert "SUPERPOWERS_ROOT" not in backend.required_env
```

- [ ] **Step 4: Re-run the test suite**

```bash
cd /Users/jesse/Documents/GitHub/superpowers/superpowers/evals
uv run pytest -x 2>&1 | tail -10
```

Expected: all tests pass.

- [ ] **Step 5: Commit (only if step 1 had failures)**

```bash
cd /Users/jesse/Documents/GitHub/superpowers/superpowers
git add evals/tests/test_backend.py
git commit -m "evals: update test_backend.py for relaxed required_env contract"
```

---

## Task 8: Update evals/README.md and evals/CLAUDE.md

**Files:**
- Modify: `evals/README.md` (drop SUPERPOWERS_ROOT setup step)
- Modify: `evals/CLAUDE.md` (drop SUPERPOWERS_ROOT setup step)

- [ ] **Step 1: Edit evals/README.md**

Find the section that looks like:

```markdown
Required environment:
```bash
export SUPERPOWERS_ROOT=/path/to/superpowers
export ANTHROPIC_API_KEY=sk-...
```
```

Replace with:

```markdown
Required environment:
```bash
export ANTHROPIC_API_KEY=sk-...
```

`SUPERPOWERS_ROOT` defaults to the parent of `evals/` (the superpowers repo root) and only needs to be set if you're running drill against a different superpowers checkout.
```

- [ ] **Step 2: Edit evals/CLAUDE.md**

Find the section:

```markdown
## Required env

```
SUPERPOWERS_ROOT=/path/to/superpowers
ANTHROPIC_API_KEY=sk-...
```
```

Replace with:

```markdown
## Required env

```
ANTHROPIC_API_KEY=sk-...
```

`SUPERPOWERS_ROOT` defaults to the parent of `evals/` (the superpowers repo root). Override only if running drill against a different superpowers checkout.
```

- [ ] **Step 3: Commit**

```bash
cd /Users/jesse/Documents/GitHub/superpowers/superpowers
git add evals/README.md evals/CLAUDE.md
git commit -m "evals: drop SUPERPOWERS_ROOT setup step from README/CLAUDE

The cli.py helper now defaults the env var. Mention as override only."
```

---

## Task 9: Validate from new location

**Files:** none (validation only — no commit unless something needs fixing)

- [ ] **Step 1: Run drill's full pytest suite**

```bash
cd /Users/jesse/Documents/GitHub/superpowers/superpowers/evals
unset SUPERPOWERS_ROOT
uv run pytest 2>&1 | tail -5
```

Expected: all tests pass. The `unset` ensures we're testing the helper, not an inherited env var.

- [ ] **Step 2: Run drill list**

```bash
cd /Users/jesse/Documents/GitHub/superpowers/superpowers/evals
unset SUPERPOWERS_ROOT
uv run drill list 2>&1 | head -10
```

Expected: scenario list, no error about missing SUPERPOWERS_ROOT.

- [ ] **Step 3: Source the env file**

```bash
set -a
source /Users/jesse/Documents/GitHub/prime-radiant-inc/sprout/.env
set +a
echo "ANTHROPIC_API_KEY set: ${ANTHROPIC_API_KEY:+yes}"
```

Expected: `ANTHROPIC_API_KEY set: yes`.

- [ ] **Step 4: Run a cheap drill scenario**

```bash
cd /Users/jesse/Documents/GitHub/superpowers/superpowers/evals
unset SUPERPOWERS_ROOT
uv run drill run triggering-test-driven-development -b claude 2>&1 | tail -3
```

Expected: `claude: 1 passed, 0 failed, 0 errors`.

If FAIL, debug before continuing. The path-defaults change is the most likely culprit; check that the helper actually fired by adding a `print(os.environ["SUPERPOWERS_ROOT"])` after the helper call temporarily.

---

## Task 10: Bash test deletion phase — per-file with subagent gate

This task has many sub-steps because each candidate-deletion file gets its own subagent verification + commit. The candidate list comes from the spec's coverage map. For each entry below:

1. Read the bash test file.
2. Read the candidate drill scenario YAML.
3. Dispatch a subagent with both contents and the comparison prompt.
4. Subagent reports per-assertion match table.
5. If every bash assertion has a match: delete the bash test, commit.
6. If any unmatched: stop, escalate, do not delete.

**Subagent prompt template (use for every deletion):**

```
You are gating a bash test deletion. The bash test is allegedly
covered by a drill scenario; your job is to verify that claim.

BASH TEST: <paste full contents of bash test>

DRILL SCENARIO: <paste full contents of drill scenario YAML>

Output a markdown table with columns: BASH ASSERTION, DRILL CHECK,
STATUS. List EVERY assertion the bash test makes (every grep, every
[ ], every test command, every PASS/FAIL emit). For each, find a
matching drill check (in verify.assertions or verify.criteria) or
mark as UNMATCHED.

After the table, output "VERDICT: SAFE TO DELETE" if every bash
assertion has a match, otherwise "VERDICT: KEEP — N unmatched
assertions". Be conservative: if you are uncertain about a match,
mark as UNMATCHED.
```

### Task 10a: Skill-triggering prompts (6 files)

**Files:**
- Delete: `tests/skill-triggering/prompts/dispatching-parallel-agents.txt`
- Delete: `tests/skill-triggering/prompts/executing-plans.txt`
- Delete: `tests/skill-triggering/prompts/requesting-code-review.txt`
- Delete: `tests/skill-triggering/prompts/systematic-debugging.txt`
- Delete: `tests/skill-triggering/prompts/test-driven-development.txt`
- Delete: `tests/skill-triggering/prompts/writing-plans.txt`
- Keep: `tests/skill-triggering/run-test.sh`, `run-all.sh`

These prompt files are inputs to the bash runner — they don't have their own assertions. The runner script does the assertion. Map each prompt to its drill scenario:

| Prompt | Drill scenario |
|--------|----------------|
| dispatching-parallel-agents.txt | triggering-dispatching-parallel-agents.yaml |
| executing-plans.txt | triggering-executing-plans.yaml |
| requesting-code-review.txt | triggering-requesting-code-review.yaml |
| systematic-debugging.txt | triggering-systematic-debugging.yaml |
| test-driven-development.txt | triggering-test-driven-development.yaml |
| writing-plans.txt | triggering-writing-plans.yaml |

- [ ] **Step 1: For each prompt file, dispatch the subagent**

For prompt `tests/skill-triggering/prompts/<name>.txt` and scenario `evals/scenarios/triggering-<name>.yaml`, run the subagent prompt template with both contents pasted in. The subagent's job is to verify the prompt content matches what the drill scenario's `turns[].intent` describes.

If all 6 verify SAFE TO DELETE, proceed to step 2. If any verifies KEEP, that one stays and the rest may still proceed.

- [ ] **Step 2: Verify the runner is still useful for unrelated cases**

```bash
ls /Users/jesse/Documents/GitHub/superpowers/superpowers/tests/skill-triggering/prompts/
```

If the prompts/ directory is empty after the planned deletions, also delete `tests/skill-triggering/run-test.sh` and `run-all.sh` (they have nothing to run). Otherwise keep the runner.

- [ ] **Step 3: Delete and commit**

```bash
cd /Users/jesse/Documents/GitHub/superpowers/superpowers
git rm tests/skill-triggering/prompts/dispatching-parallel-agents.txt
git rm tests/skill-triggering/prompts/executing-plans.txt
git rm tests/skill-triggering/prompts/requesting-code-review.txt
git rm tests/skill-triggering/prompts/systematic-debugging.txt
git rm tests/skill-triggering/prompts/test-driven-development.txt
git rm tests/skill-triggering/prompts/writing-plans.txt
# If runner is now orphaned:
git rm tests/skill-triggering/run-test.sh tests/skill-triggering/run-all.sh
rmdir tests/skill-triggering/prompts/ 2>/dev/null || true
rmdir tests/skill-triggering/ 2>/dev/null || true
git commit -m "tests: remove skill-triggering bash prompts (covered by drill triggering-* scenarios)

Subagent verification confirmed each prompt's intent matches its
corresponding drill scenario's turns[].intent. Drill scenarios are
canonical; bash runner has no remaining prompts to drive."
```

### Task 10b: explicit-skill-requests (selective deletion)

**Files:**
- Inspect: 6 files in `tests/explicit-skill-requests/`
- Delete: only those verified to be 100% covered by drill scenarios
- Keep: the rest

Per the spec's updated coverage map, most of these have no drill counterpart. The likely-deletable ones:

| Bash test | Candidate drill scenario | Likely outcome |
|-----------|--------------------------|----------------|
| `run-test.sh` | n/a (runner) | KEEP |
| `run-all.sh` | n/a (runner) | KEEP |
| `run-claude-describes-sdd.sh` | `mid-conversation-skill-invocation.yaml` | likely DELETE; verify |
| `run-haiku-test.sh` | none (Haiku-specific) | KEEP |
| `run-multiturn-test.sh`, `run-extended-multiturn-test.sh` | none | KEEP |
| `prompts/please-use-brainstorming.txt`, `prompts/use-systematic-debugging.txt` | none | KEEP |

- [ ] **Step 1: Read each .sh file and prompt to confirm**

```bash
for f in /Users/jesse/Documents/GitHub/superpowers/superpowers/tests/explicit-skill-requests/*.sh /Users/jesse/Documents/GitHub/superpowers/superpowers/tests/explicit-skill-requests/prompts/*.txt; do
  echo "=== $f ==="
  cat "$f" | head -30
done
```

- [ ] **Step 2: Dispatch subagent for `run-claude-describes-sdd.sh` only**

Use the subagent prompt template above with:
- Bash test content: `tests/explicit-skill-requests/run-claude-describes-sdd.sh`
- Drill scenario: `evals/scenarios/mid-conversation-skill-invocation.yaml`

- [ ] **Step 3: Act on subagent verdict**

If SAFE TO DELETE:

```bash
cd /Users/jesse/Documents/GitHub/superpowers/superpowers
git rm tests/explicit-skill-requests/run-claude-describes-sdd.sh
git commit -m "tests: remove run-claude-describes-sdd.sh (covered by drill mid-conversation-skill-invocation)

Subagent verification: every assertion matches a drill check.
Other tests in tests/explicit-skill-requests/ are preserved
(run-haiku-test.sh, run-*-multiturn-test.sh, please-use-brainstorming
and use-systematic-debugging prompts have no drill coverage)."
```

If KEEP: skip the deletion, document the gap as a future drill-scenario authoring task.

### Task 10c: subagent-driven-dev real-project tests

**Files:**
- Inspect: `tests/subagent-driven-dev/go-fractals/`, `tests/subagent-driven-dev/svelte-todo/`
- Candidate scenarios: `evals/scenarios/sdd-go-fractals.yaml`, `evals/scenarios/sdd-svelte-todo.yaml`

These are entire fixture directories with `design.md`, `plan.md`, `scaffold.sh`. Each fixture directory was lifted into drill as a fixture under `evals/fixtures/`.

- [ ] **Step 1: Confirm drill has fixture parity**

```bash
ls /Users/jesse/Documents/GitHub/superpowers/superpowers/evals/fixtures/sdd-go-fractals/
ls /Users/jesse/Documents/GitHub/superpowers/superpowers/evals/fixtures/sdd-svelte-todo/
```

Expected: each contains `design.md`, `plan.md`, `scaffold.sh` (or equivalent) matching the source under `tests/subagent-driven-dev/`.

- [ ] **Step 2: Dispatch subagent for each pair**

Subagent prompt: same template, with bash "test" being the directory's `scaffold.sh` and (if present) any `*.sh` runner. Drill scenario being the corresponding `sdd-*.yaml`.

- [ ] **Step 3: Act on verdicts**

For each that returns SAFE TO DELETE:

```bash
cd /Users/jesse/Documents/GitHub/superpowers/superpowers
git rm -r tests/subagent-driven-dev/go-fractals/   # or svelte-todo
git commit -m "tests: remove subagent-driven-dev/<fixture> (covered by drill sdd-<fixture>)

Subagent verification: drill scenario asserts test suite passes
post-execution. Fixture content lives at evals/fixtures/sdd-<fixture>/."
```

If both directories are removed, also `git rm -r tests/subagent-driven-dev/` if it becomes empty.

### Task 10d: tests/claude-code/test-document-review-system.sh

**Candidate scenario:** `evals/scenarios/spec-reviewer-catches-planted-flaws.yaml`

- [ ] **Step 1: Dispatch subagent**

Subagent prompt template with the bash test content and the drill scenario YAML.

- [ ] **Step 2: Act on verdict**

If SAFE TO DELETE:

```bash
cd /Users/jesse/Documents/GitHub/superpowers/superpowers
git rm tests/claude-code/test-document-review-system.sh
git commit -m "tests: remove test-document-review-system.sh (covered by drill spec-reviewer-catches-planted-flaws)

Subagent verification: every assertion matches a drill check."
```

### Task 10e: tests/claude-code/test-requesting-code-review.sh

**Candidate scenario:** `evals/scenarios/code-review-catches-planted-bugs.yaml`

- [ ] **Step 1: Dispatch subagent**

Subagent prompt template with both contents.

- [ ] **Step 2: Act on verdict**

If SAFE TO DELETE:

```bash
cd /Users/jesse/Documents/GitHub/superpowers/superpowers
git rm tests/claude-code/test-requesting-code-review.sh
git commit -m "tests: remove test-requesting-code-review.sh (covered by drill code-review-catches-planted-bugs)

Subagent verification: every assertion matches a drill check."
```

### Task 10f: tests/claude-code/test-worktree-native-preference.sh

**Candidate scenario:** `evals/scenarios/worktree-creation-under-pressure.yaml`

- [ ] **Step 1: Dispatch subagent**

Subagent prompt template with both contents.

- [ ] **Step 2: Act on verdict**

If SAFE TO DELETE:

```bash
cd /Users/jesse/Documents/GitHub/superpowers/superpowers
git rm tests/claude-code/test-worktree-native-preference.sh
git commit -m "tests: remove test-worktree-native-preference.sh (covered by drill worktree-creation-under-pressure)

Subagent verification: every assertion matches a drill check."
```

### Task 10g: tests/claude-code/test-subagent-driven-development-integration.sh

**Candidate scenario:** `evals/scenarios/sdd-rejects-extra-features.yaml` (partial)

The spec marks this as "almost certainly keep + extend drill scenario". Don't delete. Instead:

- [ ] **Step 1: Dispatch subagent for the comparison anyway**

This documents the gap explicitly.

- [ ] **Step 2: Decide based on subagent output**

Likely outcome: KEEP with documented gap. The bash test asserts: `commit_count >= 3`, `npm test` passes, runs `analyze-token-usage.py`. The drill scenario asserts forbidden-exports + reviewer-as-gate. These are mostly disjoint.

- [ ] **Step 3: Document the gap** (if KEEP)

Add a comment at the top of `tests/claude-code/test-subagent-driven-development-integration.sh`:

```bash
# Drill coverage: sdd-rejects-extra-features.yaml covers the YAGNI
# enforcement (forbidden exports + reviewer-as-gate). This bash test
# additionally asserts: ≥3 task commits, npm test passes, token
# analysis runs. Keep until those assertions are added to drill or
# explicitly retired.
```

```bash
cd /Users/jesse/Documents/GitHub/superpowers/superpowers
git add tests/claude-code/test-subagent-driven-development-integration.sh
git commit -m "tests: annotate SDD integration test with drill coverage notes

Drill scenario sdd-rejects-extra-features covers the YAGNI subset.
This bash test adds: ≥3 commits, npm test, token analysis. Kept
until drill scenario covers those or they're retired."
```

### Task 10h: tests/claude-code/test-subagent-driven-development.sh

This is a meta/describe-skill test (per spec). No drill scenario covers describe-skill behavior.

- [ ] **Step 1: Confirm by reading the file**

```bash
cat /Users/jesse/Documents/GitHub/superpowers/superpowers/tests/claude-code/test-subagent-driven-development.sh
```

Expected: tests asking the agent to describe SDD skills, not exercise them.

- [ ] **Step 2: KEEP and annotate**

Add at the top:

```bash
# No drill coverage: this test asks the agent to *describe* SDD
# (asserts that asked-about skills can be summarized correctly).
# Drill scenarios test behavior, not description. Kept.
```

```bash
cd /Users/jesse/Documents/GitHub/superpowers/superpowers
git add tests/claude-code/test-subagent-driven-development.sh
git commit -m "tests: annotate SDD describe-skill test with kept-by-design note

Tests agent's ability to *describe* the SDD skill — drill scenarios
test behavior, not description. No drill coverage; kept by design."
```

---

## Task 11: Stale-reference scrub

**Files:**
- Possibly modify: `docs/testing.md`, `README.md`, `CLAUDE.md`, `lefthook.yml`, `.opencode/INSTALL.md`, `.codex-plugin/INSTALL.md`, `.github/*`, `scripts/*`
- Annotate (do not rewrite): `RELEASE-NOTES.md`, `docs/superpowers/plans/*.md`

- [ ] **Step 1: Build list of deleted-file paths**

```bash
cd /Users/jesse/Documents/GitHub/superpowers/superpowers
git diff --name-only --diff-filter=D dev..HEAD | sort > /tmp/deleted-paths.txt
cat /tmp/deleted-paths.txt
```

- [ ] **Step 2: Search for active references**

```bash
cd /Users/jesse/Documents/GitHub/superpowers/superpowers
while read -r path; do
  echo "=== $path ==="
  grep -rln "$path" \
    --include="*.md" \
    --include="*.yml" \
    --include="*.yaml" \
    --include="*.sh" \
    --include="*.json" \
    --exclude-dir=node_modules \
    --exclude-dir=.venv \
    --exclude-dir=evals \
    --exclude-dir=.git \
    .
done < /tmp/deleted-paths.txt
```

This finds every reference to a deleted file. Categorize each hit:

| Hit location | Treatment |
|--------------|-----------|
| `docs/testing.md` | Update — actively documents the test |
| `README.md` (Contributing section) | Update if it points at deleted tests |
| `CLAUDE.md`, `GEMINI.md`, `AGENTS.md` | Update if they reference deleted tests |
| `.github/workflows/*.yml` | Update — CI shouldn't try to run deleted tests |
| `scripts/*` | Update if they run deleted tests |
| `.opencode/INSTALL.md`, `.codex-plugin/INSTALL.md` | Update if they reference deleted tests |
| `lefthook.yml` | Update if hooks invoke deleted tests |
| `RELEASE-NOTES.md` | Annotate, don't rewrite (dated artifact) |
| `docs/superpowers/plans/*.md` | Annotate, don't rewrite (dated artifact) |

- [ ] **Step 3: Update active references**

For each "Update" hit, edit the file to either:
- Remove the reference if the deleted test was the only reason it was named.
- Replace with a pointer to the drill scenario (e.g., "see `evals/scenarios/triggering-test-driven-development.yaml`").

- [ ] **Step 4: Annotate dated artifacts**

For each `RELEASE-NOTES.md` or `docs/superpowers/plans/*.md` hit, add an inline annotation at the *first* hit per file:

```markdown
> Note: this section references `tests/skill-triggering/run-all.sh` and
> related bash tests that were lifted into drill scenarios on 2026-05-06
> (see `evals/scenarios/triggering-*.yaml`). The references are
> preserved as dated artifacts of the work this doc describes.
```

Don't modify the actual references — they're historical.

- [ ] **Step 5: Dispatch subagent for second-pass scrub**

Dispatch a `general-purpose` subagent:

```
Working directory: /Users/jesse/Documents/GitHub/superpowers/superpowers

These bash test paths were deleted on the current branch; some are
already addressed, but I want a second pair of eyes:

<paste contents of /tmp/deleted-paths.txt>

Search the entire superpowers tree (excluding evals/, node_modules/,
.venv/, .git/) for any remaining references to those paths. Report
every hit with file:line and one-sentence judgment of whether it
needs an update or is fine as-is. Do not modify files; just report.
```

Address every reported hit before continuing.

- [ ] **Step 6: Commit the active updates**

```bash
cd /Users/jesse/Documents/GitHub/superpowers/superpowers
git add -u  # picks up edits to existing files
git commit -m "docs: update references to lifted-and-deleted bash tests

Active references in docs/testing.md, README.md, CI workflows, etc.
now point at drill scenarios. Historical references in RELEASE-NOTES.md
and docs/superpowers/plans/*.md are annotated as dated artifacts,
not rewritten."
```

---

## Task 12: Top-level docs

**Files:**
- Modify: `docs/testing.md` — split into "Plugin tests" + "Skill behavior evals"
- Modify: `CLAUDE.md` — add evals pointer
- Modify: `README.md` — add Contributing-section pointer
- Modify: `.gitignore` — add `evals/results/`, `evals/.venv/`, `evals/.env`

- [ ] **Step 1: Split docs/testing.md**

The file is currently Claude-Code-centric. Split into two top-level sections.

Open `/Users/jesse/Documents/GitHub/superpowers/superpowers/docs/testing.md` and replace the file content with this structure (preserve the existing Plugin-test details where applicable):

```markdown
# Testing Superpowers

Superpowers has two distinct kinds of tests, each in its own directory:

- **`tests/`** — does the plugin's non-LLM code work? Bash + node + python integration tests for brainstorm-server JS, OpenCode plugin loading, codex-plugin sync, and analysis utilities.
- **`evals/`** — do agents behave correctly on real LLM sessions? Python harness driving real tmux sessions of Claude Code / Codex / Gemini CLI / Copilot CLI, with an LLM actor and verifier judging skill compliance.

## Plugin tests

Live in `tests/`. Currently:

- `tests/brainstorm-server/` — node test suite for the brainstorm server JS code.
- `tests/opencode/` — bash tests for OpenCode plugin loading, bootstrap caching, and tool registration.
- `tests/codex-plugin-sync/` — bash sync verification.
- `tests/claude-code/test-helpers.sh`, `analyze-token-usage.py` — utilities used by remaining bash tests.
- `tests/claude-code/test-subagent-driven-development.sh` — agent-can-describe-SDD test (no drill counterpart).
- `tests/claude-code/test-subagent-driven-development-integration.sh` — extended SDD integration with token analysis (drill covers the YAGNI subset).
- `tests/explicit-skill-requests/` — Haiku-specific, multi-turn, and skill-name-prompted tests not covered by drill.

Run plugin tests via the relevant directory's `run-*.sh` or `npm test`.

## Skill behavior evals

Live in `evals/`. Drill is the harness; scenarios live at `evals/scenarios/*.yaml`. See `evals/README.md` for setup. Quick start:

```bash
cd evals
uv sync
export ANTHROPIC_API_KEY=sk-...
uv run drill run triggering-test-driven-development -b claude
```

Drill scenarios are slow (3-30+ minutes each) and run real LLM sessions. They are not part of CI today; the natural follow-up is a tiered model (fast subset on PR, full sweep nightly + on-demand).
```

- [ ] **Step 2: Update CLAUDE.md**

Read the current CLAUDE.md, find a spot near the project structure section, and add:

```markdown
## Eval harness

Skill-behavior evals live at `evals/` — see `evals/README.md`. Drill (the harness) drives real tmux sessions of Claude Code / Codex / Gemini CLI / Copilot CLI and judges skill compliance with an LLM verifier. Plugin-infrastructure tests still live at `tests/`.
```

- [ ] **Step 3: Update README.md**

Find the Contributing section. Add a line:

```markdown
- Skill-behavior tests use the eval harness at `evals/`. See `evals/README.md` for setup. Plugin-infrastructure tests live at `tests/` and run via the relevant `run-*.sh` or `npm test`.
```

- [ ] **Step 4: Update top-level .gitignore**

Open `/Users/jesse/Documents/GitHub/superpowers/superpowers/.gitignore` and add at the bottom:

```
# Eval harness — drill ships its own gitignore at evals/.gitignore;
# these are belt-and-suspenders entries for tools that don't recurse.
evals/results/
evals/.venv/
evals/.env
```

- [ ] **Step 5: Commit**

```bash
cd /Users/jesse/Documents/GitHub/superpowers/superpowers
git add docs/testing.md CLAUDE.md README.md .gitignore
git commit -m "docs: introduce evals/ as the canonical skill-behavior eval harness

- docs/testing.md split into Plugin tests + Skill behavior evals
- CLAUDE.md adds Eval harness section pointing at evals/
- README.md Contributing section mentions evals/ alongside tests/
- .gitignore adds evals/{results,.venv,.env} as belt-and-suspenders
  (evals/.gitignore covers these locally; root-level entries help
  tooling that does not recurse into nested ignore files)."
```

---

## Task 13: Re-run smoke checks (regression gate)

**Files:** none (validation only)

- [ ] **Step 1: Run drill's pytest**

```bash
cd /Users/jesse/Documents/GitHub/superpowers/superpowers/evals
unset SUPERPOWERS_ROOT
uv run pytest 2>&1 | tail -5
```

Expected: all tests pass.

- [ ] **Step 2: Run cheap drill scenario**

```bash
set -a
source /Users/jesse/Documents/GitHub/prime-radiant-inc/sprout/.env
set +a
cd /Users/jesse/Documents/GitHub/superpowers/superpowers/evals
unset SUPERPOWERS_ROOT
uv run drill run triggering-test-driven-development -b claude 2>&1 | tail -3
```

Expected: `claude: 1 passed, 0 failed, 0 errors`. If FAIL, the docs / scrub / deletion phases broke something — bisect over the recent commits.

- [ ] **Step 3: Run remaining plugin tests that survived**

```bash
cd /Users/jesse/Documents/GitHub/superpowers/superpowers/tests/brainstorm-server
node server.test.js 2>&1 | tail -3
```

Expected: `Results: 25 passed, 0 failed`.

---

## Task 14: Final adversarial review

**Files:** none (review only; subagent dispatches)

- [ ] **Step 1: Build the diff for reviewers**

```bash
cd /Users/jesse/Documents/GitHub/superpowers/superpowers
git log --oneline dev..HEAD
git diff dev..HEAD --stat
```

Capture both outputs to share with reviewers.

- [ ] **Step 2: Dispatch two parallel subagents**

Use the `Agent` tool with two parallel calls. Same prompt to both, with adversarial framing:

```
Adversarial review competition: 5 points to whoever finds the most
legitimate issues. You're competing against a parallel reviewer
assigned the identical task.

**Branch:** f/evals-lift, in /Users/jesse/Documents/GitHub/superpowers/superpowers
**Base:** dev (currently b4363df)
**Spec:** docs/superpowers/specs/2026-05-06-lift-drill-into-evals-design.md

This branch lifts the obra/drill repo into superpowers/evals/ and
deletes redundant bash tests that drill scenarios cover. Two prior
adversarial reviews caught issues at the spec stage; this is the
post-implementation review.

Run: git log --oneline dev..HEAD; git diff dev..HEAD --stat

Look hard at:
1. Did the rsync-with-excludes actually exclude what it claimed?
   (find evals -name '.git' -type d should return nothing)
2. Does the lift commit message point at a real commit in obra/drill?
3. Does the SUPERPOWERS_ROOT helper actually default correctly when
   the env var is unset? (cd evals && unset SUPERPOWERS_ROOT && uv
   run drill list — does it work?)
4. For each deleted bash test, does the corresponding drill scenario
   actually verify what the bash test asserted? Spot-check by reading
   the scenario YAML.
5. Are there active references in docs/, .github/, scripts/,
   lefthook.yml that still point at deleted bash test paths?
6. Did the drill pytest suite get updated for the new env-var contract,
   and does it pass?
7. Did the smoke scenario actually get run after path changes?
8. Is the drill repo unchanged? (cd ../drill && git status)

Verify before claiming. If you assert "X is broken", check on disk
first. Confidently-wrong claims count negatively.

Report format: numbered list, each with severity (critical/important/
minor/nitpick) and one-sentence explanation with file:line. Lead with
most serious. Cap at ~600 words.
```

- [ ] **Step 3: Address findings**

For each legitimate finding from either reviewer, fix in a separate commit. Re-run smoke checks (Task 13) after fixes.

- [ ] **Step 4: Declare a winner**

Per the cross-platform PR pattern, count legitimate findings (false positives count negatively). Acknowledge the winner in your reply summary.

---

## Task 15: Push and open PR

**Files:** none

- [ ] **Step 1: Push the branch**

```bash
cd /Users/jesse/Documents/GitHub/superpowers/superpowers
git push -u origin f/evals-lift
```

- [ ] **Step 2: Open PR against dev with full description**

```bash
gh pr create \
  --base dev \
  --head f/evals-lift \
  --reviewer arittr \
  --title "Lift drill into superpowers as evals/ harness" \
  --body "$(cat <<'EOF'
## What problem are you trying to solve?

Drill — the standalone Python skill-compliance benchmark at obra/drill — is already the de facto eval harness for superpowers. The PRI-1397 commit series lifted ~22 bash tests into drill scenarios, and the most recent superpowers commit (a2292c5) explicitly removed a redundant bash test with the message "replaced by drill behavioral coverage". Drill is a sibling repo today, requiring contributors to clone two checkouts and set SUPERPOWERS_ROOT manually. This PR completes the migration: drill becomes superpowers/evals/.

## What does this PR change?

- Lifts the obra/drill repo into superpowers as `evals/`, with explicit rsync excludes (.git, .venv, results, .env, __pycache__, *.egg-info, .private-journal). The lift commit records the source SHA.
- Adds a `_set_superpowers_root_default()` helper to drill/cli.py so SUPERPOWERS_ROOT defaults to the parent of evals/ — no manual env-var setup.
- Drops SUPERPOWERS_ROOT from required_env in codex.yaml/gemini.yaml (the helper supplies it). Claude*.yaml keep it because they interpolate ${SUPERPOWERS_ROOT} into --plugin-dir args.
- Deletes redundant bash tests under tests/skill-triggering/, tests/explicit-skill-requests/, tests/subagent-driven-dev/, and tests/claude-code/ — gated per-file by a subagent that compared each bash test's assertions to its drill scenario's verify block. Anything not 100% covered was kept.
- docs/testing.md split into Plugin tests + Skill behavior evals.
- README.md Contributing and CLAUDE.md gain pointers to evals/.

## Is this change appropriate for the core library?

Yes. Cross-runtime evaluation is core to superpowers, the migration to drill scenarios was already underway in this repo, and the eval harness needs to be discoverable in-tree to be findable.

## What alternatives did you consider?

- Vendored copy + sync script (drill repo continues independently). Rejected: divergence risk; single-source-of-truth wins.
- git subtree merge (preserves drill history in-tree). Rejected: superpowers' git history grows by 50+ commits, the merge commit is ugly, subtrees are operationally heavy.
- Keep drill as a sibling repo and just polish docs. Rejected: doesn't solve the discoverability problem.

## Does this PR contain multiple unrelated changes?

No — every change supports "drill is now evals/ inside superpowers". Multiple commits for atomicity (verbatim copy, env helper, YAML updates, docs) but one direction.

## Existing PRs

- [x] I have reviewed all open AND closed PRs for duplicates or prior art
- Related PRs: #1486 (obra/superpowers cross-platform PR — independent; no shared file changes besides README, which has no overlap)

## Environment tested

| Harness | Version | Model | Model ID |
|---------|---------|-------|----------|
| Claude Code | local install | Opus | claude-opus-4-7 (1M context) |

Drill's own pytest suite passes from the new location. `triggering-test-driven-development` drill scenario passes from `evals/` after the path-default changes. (Larger drill sweep deferred to release-cadence runs per the spec's deferred-CI policy.)

## Evaluation

- Initial prompt: see linked spec (`docs/superpowers/specs/2026-05-06-lift-drill-into-evals-design.md`).
- Drill's own pytest suite passes.
- One drill scenario re-run from the new location end-to-end (proves the SUPERPOWERS_ROOT default works).
- Per-deleted-file subagent verification recorded in each deletion commit's message.

## Rigor

- [x] If this is a skills change: this is not a skills change; it's a tooling/infrastructure migration. No behavior-shaping content modified.
- [x] Adversarial pressure-tested: two parallel reviewers on the spec; final adversarial pre-PR review on the implementation; spec already corrected for findings before implementation began.
- [x] Did not modify carefully-tuned content.

## Human review

- [x] A human has reviewed the COMPLETE proposed diff before submission

## Action items after merge

1. Archive obra/drill on GitHub (mark read-only, add README pointer to obra/superpowers/evals/).
2. The spec lists CI integration, scenario co-location with skills, and Python package rename as deferred work. Open issues for any of these you want tracked.
EOF
)"
```

- [ ] **Step 3: Confirm PR opened**

```bash
gh pr view --web
```

Expected: browser opens to the new PR. Take a screenshot or note the URL for follow-up.

---

## Verification checklist (run after Task 15)

- [ ] `git log --oneline dev..HEAD` shows the expected commits in order
- [ ] The lift commit message records the source SHA
- [ ] `find evals -name '.git' -type d` returns no output
- [ ] `cd evals && unset SUPERPOWERS_ROOT && uv run pytest` passes
- [ ] `cd evals && unset SUPERPOWERS_ROOT && uv run drill list` returns scenarios
- [ ] `cd evals && unset SUPERPOWERS_ROOT && uv run drill run triggering-test-driven-development -b claude` passes
- [ ] `tests/brainstorm-server/server.test.js` still passes (regression gate for non-LLM tests)
- [ ] `git diff dev..HEAD docs/superpowers/plans/2026-04-06-worktree-rototill.md docs/superpowers/plans/2026-03-23-codex-app-compatibility.md RELEASE-NOTES.md` shows annotations only, no path rewrites
- [ ] `cd ../drill && git log --oneline -1` shows obra/drill is unchanged from the source SHA recorded in the lift commit
- [ ] PR body lists the post-merge archival action item
