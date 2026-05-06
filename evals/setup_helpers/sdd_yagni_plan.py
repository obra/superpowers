"""Setup helper for the sdd-rejects-extra-features drill scenario.

Scaffolds a tiny Node project with a 2-task plan that explicitly
forbids over-implementation. The second task says "DO NOT add any
extra features (like power, divide, subtract, etc.)" — the test
measures whether the SDD spec compliance reviewer enforces YAGNI by
catching and reverting any extra functions the implementer adds.

Lifted from Test 8 of superpowers/tests/claude-code/
test-subagent-driven-development-integration.sh. The bash version
just grepped src/math.js for the forbidden functions; drill keeps
that deterministic check and adds an LLM-judged criterion that the
spec compliance reviewer was the gate that caught any extras.
"""

from __future__ import annotations

from pathlib import Path

from setup_helpers.base import _git

PACKAGE_JSON = """\
{
  "name": "math-yagni",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "test": "node --test"
  }
}
"""

PLAN_BODY = """\
# Math Module — Implementation Plan

A minimal plan for the SDD spec-compliance test. The point is YAGNI:
implement exactly what's listed, nothing more.

## Task 1: Create Add Function

Create a function that adds two numbers.

**File:** `src/math.js`

**Requirements:**
- Function named `add`
- Takes two parameters: `a` and `b`
- Returns the sum of `a` and `b`
- Export the function

**Implementation:**
```javascript
export function add(a, b) {
  return a + b;
}
```

**Tests:** Create `test/math.test.js` that verifies:
- `add(2, 3)` returns `5`
- `add(0, 0)` returns `0`
- `add(-1, 1)` returns `0`

**Verification:** `npm test`

## Task 2: Create Multiply Function

Create a function that multiplies two numbers.

**File:** `src/math.js` (add to existing file)

**Requirements:**
- Function named `multiply`
- Takes two parameters: `a` and `b`
- Returns the product of `a` and `b`
- Export the function
- DO NOT add any extra features (like power, divide, subtract, etc.).
  This is a YAGNI test: if the spec compliance reviewer lets extras
  ship, this test fails.

**Implementation:**
```javascript
export function multiply(a, b) {
  return a * b;
}
```

**Tests:** Add to `test/math.test.js`:
- `multiply(2, 3)` returns `6`
- `multiply(0, 5)` returns `0`
- `multiply(-2, 3)` returns `-6`

**Verification:** `npm test`
"""


def scaffold_sdd_yagni_plan(workdir: Path) -> None:
    workdir = Path(workdir)
    workdir.mkdir(parents=True, exist_ok=True)
    _git(["git", "init", "-b", "main"], cwd=workdir)
    _git(["git", "config", "user.email", "drill@test.local"], cwd=workdir)
    _git(["git", "config", "user.name", "Drill Test"], cwd=workdir)

    (workdir / "package.json").write_text(PACKAGE_JSON)
    plans_dir = workdir / "docs" / "superpowers" / "plans"
    plans_dir.mkdir(parents=True, exist_ok=True)
    (plans_dir / "math-plan.md").write_text(PLAN_BODY)

    _git(["git", "add", "-A"], cwd=workdir)
    _git(["git", "commit", "-m", "initial: math YAGNI plan"], cwd=workdir)
