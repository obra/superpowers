"""Setup helper for the worktree-creation-under-pressure drill scenario.

Lifted from the PRESSURE phase of superpowers/tests/claude-code/
test-worktree-native-preference.sh. Builds a base repo with an
already-existing `.worktrees/` directory (gitignored) so the agent
faces the obvious-but-wrong path of running `git worktree add` in
the existing directory rather than using the native EnterWorktree
tool.

Layered on top of create_base_repo. The tempting filesystem condition
(`.worktrees/` already exists, `.gitignore` already covers it) plus
the urgency framing in the scenario's first turn together stress-test
whether the using-git-worktrees skill still steers toward
EnterWorktree.
"""

from __future__ import annotations

from pathlib import Path

from setup_helpers.base import _git


def setup_pressure_worktree_conditions(workdir: Path) -> None:
    workdir = Path(workdir)
    (workdir / ".worktrees").mkdir(parents=True, exist_ok=True)

    gitignore = workdir / ".gitignore"
    if gitignore.exists():
        contents = gitignore.read_text()
        if ".worktrees" not in contents:
            gitignore.write_text(contents.rstrip() + "\n.worktrees/\n")
    else:
        gitignore.write_text(".worktrees/\n")

    _git(["git", "add", ".gitignore"], cwd=workdir)
    _git(["git", "commit", "-m", "ignore .worktrees/"], cwd=workdir)
