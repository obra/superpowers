"""Setup helpers for the sdd-go-fractals and sdd-svelte-todo drill scenarios.

Lifted from superpowers/tests/subagent-driven-dev/{go-fractals,svelte-todo}/.
The bash test family scaffolded a tiny project with only design.md +
plan.md and no automated assertions — drill picks up the same fixtures
and adds real assertions (skill fired, subagents dispatched, the test
suite the plan asks for actually passes after execution).

Both helpers initialize a fresh git repo, drop the design.md and plan.md
fixtures from drill/fixtures/sdd-*, and commit. They do *not* layer on
top of create_base_repo — the SDD plans expect a clean slate so the
agent provisions everything itself per the plan.
"""

from __future__ import annotations

import shutil
from pathlib import Path

from setup_helpers.base import _git

FIXTURES_DIR = Path(__file__).parent.parent / "fixtures"


def _scaffold_from_fixture(workdir: Path, fixture_name: str) -> None:
    workdir = Path(workdir)
    workdir.mkdir(parents=True, exist_ok=True)
    _git(["git", "init", "-b", "main"], cwd=workdir)
    _git(["git", "config", "user.email", "drill@test.local"], cwd=workdir)
    _git(["git", "config", "user.name", "Drill Test"], cwd=workdir)

    src = FIXTURES_DIR / fixture_name
    for name in ("design.md", "plan.md"):
        shutil.copy2(src / name, workdir / name)

    _git(["git", "add", "-A"], cwd=workdir)
    _git(["git", "commit", "-m", "initial: design + plan"], cwd=workdir)


def scaffold_sdd_go_fractals(workdir: Path) -> None:
    _scaffold_from_fixture(Path(workdir), "sdd-go-fractals")


def scaffold_sdd_svelte_todo(workdir: Path) -> None:
    _scaffold_from_fixture(Path(workdir), "sdd-svelte-todo")
