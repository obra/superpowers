"""Setup helper for the explicit-skill-request and mid-conversation
skill-invocation drill scenarios.

Both scenarios have the user say something like "the plan at
docs/superpowers/plans/auth-system.md is ready — subagent-driven-
development, please." So the helper drops a plan file at the same
path the bash test family used (no date prefix).

The plan content is intentionally trivial. These scenarios measure
whether the skill *fires* when explicitly invoked — they don't run
the full plan to completion.
"""

from __future__ import annotations

from pathlib import Path

from setup_helpers.base import _git

PLAN_BODY = """\
# Auth System Implementation Plan

A short stub plan used by the explicit-skill-request and
mid-conversation-skill-invocation drill scenarios.

## Task 1: Add User model

**File:** `src/models/User.js`

Export a `User` class with an `email` field and a `passwordHash` field.
Add a one-line test in `test/models/User.test.js` asserting the class is
constructable with `{ email, passwordHash }`.

## Task 2: Add register/login routes

**File:** `src/routes/auth.js`

Export Express-style handlers `register(req, res)` and `login(req, res)`.
Stubs are fine — return JSON `{ ok: true }` from each.

## Task 3: Add JWT middleware

**File:** `src/middleware/jwt.js`

Export `requireJWT(req, res, next)`. If no `Authorization` header,
respond `401`. Otherwise call `next()`.

## Task 4: Wire it up

**File:** `src/index.js`

Import the routes and middleware. Wire the routes to `/auth/*` paths
and apply `requireJWT` to a placeholder `/protected` route.

The plan is intentionally tiny; the scenarios only measure whether the
SDD skill loads and starts dispatching subagents in response to the
user's request, not whether the implementation completes.
"""


def add_sdd_auth_plan(workdir: Path) -> None:
    workdir = Path(workdir)
    plans_dir = workdir / "docs" / "superpowers" / "plans"
    plans_dir.mkdir(parents=True, exist_ok=True)
    (plans_dir / "auth-system.md").write_text(PLAN_BODY)
    _git(["git", "add", "docs"], cwd=workdir)
    _git(["git", "commit", "-m", "draft auth-system plan"], cwd=workdir)
