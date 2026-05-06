from __future__ import annotations

import subprocess
from pathlib import Path

from setup_helpers import HELPER_REGISTRY
from setup_helpers.base import create_base_repo


def clone_template(template_dir: Path, workdir: Path) -> None:
    """Clone (or build) template_dir into workdir with full git history."""
    create_base_repo(workdir, template_dir)


def run_helpers(helper_names: list[str], workdir: Path, fixtures_dir: Path) -> None:
    for name in helper_names:
        helper = HELPER_REGISTRY.get(name)
        if helper is None:
            raise ValueError(f"Unknown setup helper: {name}")
        if name == "create_base_repo":
            helper(workdir, fixtures_dir / "template-repo")  # ty: ignore[invalid-argument-type, too-many-positional-arguments, missing-argument]
        elif name == "symlink_superpowers":
            import os

            helper(workdir, os.environ["SUPERPOWERS_ROOT"])  # ty: ignore[invalid-argument-type, too-many-positional-arguments, missing-argument]
        else:
            helper(workdir)  # ty: ignore[invalid-argument-type, missing-argument]


def run_assertions(assertions: list[str], workdir: Path) -> None:
    for assertion in assertions:
        result = subprocess.run(
            assertion,
            shell=True,
            cwd=workdir,
            capture_output=True,
            text=True,
        )
        if result.returncode != 0:
            raise AssertionError(
                f"Setup assertion failed: {assertion}\n"
                f"stdout: {result.stdout}\nstderr: {result.stderr}"
            )
