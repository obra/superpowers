from __future__ import annotations
import shutil
import subprocess
from pathlib import Path


def _git(args: list[str], cwd: Path, **kwargs) -> subprocess.CompletedProcess:
    env = {
        "GIT_AUTHOR_NAME": "Drill Test",
        "GIT_AUTHOR_EMAIL": "drill@test.local",
        "GIT_COMMITTER_NAME": "Drill Test",
        "GIT_COMMITTER_EMAIL": "drill@test.local",
        **__import__("os").environ,
    }
    return subprocess.run(args, cwd=cwd, check=True, capture_output=True, env=env, **kwargs)


def create_base_repo(workdir: Path, template_dir: Path) -> None:
    """Clone template_dir into workdir with full 3-commit history.

    If template_dir has a .git, clone it directly.  Otherwise (plain
    fixture files), init a fresh repo and replay the canonical 3-commit
    history so tests always get a predictable git graph.
    """
    workdir = Path(workdir)
    template_dir = Path(template_dir)

    if (template_dir / ".git").exists():
        subprocess.run(
            ["git", "clone", str(template_dir), str(workdir)],
            check=True, capture_output=True,
        )
        return

    # Build repo from plain fixture files with 3 commits
    workdir.mkdir(parents=True, exist_ok=True)
    _git(["git", "init", "-b", "main"], cwd=workdir)
    _git(["git", "config", "user.email", "drill@test.local"], cwd=workdir)
    _git(["git", "config", "user.name", "Drill Test"], cwd=workdir)

    # Commit 1: package.json + README.md
    for name in ("package.json", "README.md"):
        src = template_dir / name
        if src.exists():
            shutil.copy2(src, workdir / name)
    _git(["git", "add", "package.json", "README.md"], cwd=workdir)
    _git(["git", "commit", "-m", "initial commit"], cwd=workdir)

    # Commit 2: src/utils.js
    src_dir = workdir / "src"
    src_dir.mkdir(exist_ok=True)
    utils_src = template_dir / "src" / "utils.js"
    if utils_src.exists():
        shutil.copy2(utils_src, src_dir / "utils.js")
    _git(["git", "add", "src/utils.js"], cwd=workdir)
    _git(["git", "commit", "-m", "add utils module"], cwd=workdir)

    # Commit 3: src/index.js
    index_src = template_dir / "src" / "index.js"
    if index_src.exists():
        shutil.copy2(index_src, src_dir / "index.js")
    _git(["git", "add", "src/index.js"], cwd=workdir)
    _git(["git", "commit", "-m", "add entry point"], cwd=workdir)
