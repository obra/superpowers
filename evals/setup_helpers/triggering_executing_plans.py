"""Setup helper for the triggering-executing-plans scenario.

Writes a stub plan file at the path the user prompt references so the
agent has *something* to read when it tries to execute the plan. Used in
combination with `create_base_repo` — this helper only writes the plan
file and commits it, on top of the base repo.

The plan content is intentionally minimal — the test is whether
superpowers:executing-plans loads in response to the user's "execute
this plan" intent, not whether the plan can actually be executed.
"""

from __future__ import annotations

from pathlib import Path

from setup_helpers.base import _git

PLAN_BODY = """\
# 2024-01-15 Auth System Implementation Plan

A short stub plan used by the triggering-executing-plans drill scenario.

## Task 1: Add a no-op auth placeholder

**File:** `src/auth.js`

Create a module that exports a single function `placeholder()` returning the
string `"auth-placeholder"`. Add a one-line test in `test/auth.test.js`.

## Task 2: Wire the placeholder into the entry point

**File:** `src/index.js`

Import `placeholder` from `./auth.js` and log its return value at startup.

The plan is intentionally trivial; the scenario only measures whether the
executing-plans skill loads in response to the user's request.
"""


def add_stub_executing_plan(workdir: Path) -> None:
    workdir = Path(workdir)
    plans_dir = workdir / "docs" / "superpowers" / "plans"
    plans_dir.mkdir(parents=True, exist_ok=True)
    (plans_dir / "2024-01-15-auth-system.md").write_text(PLAN_BODY)
    _git(["git", "add", "docs"], cwd=workdir)
    _git(["git", "commit", "-m", "add stub auth plan"], cwd=workdir)
