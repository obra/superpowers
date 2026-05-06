from __future__ import annotations

import json
import subprocess
from contextlib import suppress
from pathlib import Path

from setup_helpers.base import _git

CALLER_CONSENT_PLAN = """\
# Custom Greeting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a small greeting customization feature to the Node fixture.

---

### Task 1: Custom greeting

**Files:**
- Modify: `src/index.js`
- Modify: `src/utils.js`
- Create: `tests/greeting.test.js`

**Acceptance Criteria:**
- The app can greet a provided name instead of always greeting `world`.
- The default behavior remains `Hello, world!`.
- A test covers both the default and custom-name paths.

- [ ] **Step 1: Add tests for default and custom greetings.**
- [ ] **Step 2: Update the greeting implementation.**
- [ ] **Step 3: Run the relevant tests.**
"""


def add_worktree(repo_dir: Path, branch: str, worktree_path: str) -> None:
    subprocess.run(
        ["git", "worktree", "add", "-b", branch, worktree_path],
        cwd=repo_dir,
        check=True,
        capture_output=True,
    )


def detach_head(worktree_path: str) -> None:
    result = subprocess.run(
        ["git", "rev-parse", "HEAD"],
        cwd=worktree_path,
        capture_output=True,
        text=True,
        check=True,
    )
    commit = result.stdout.strip()
    result = subprocess.run(
        ["git", "branch", "--show-current"],
        cwd=worktree_path,
        capture_output=True,
        text=True,
        check=True,
    )
    branch = result.stdout.strip()
    subprocess.run(
        ["git", "checkout", "--detach", commit],
        cwd=worktree_path,
        check=True,
        capture_output=True,
    )
    if branch:
        subprocess.run(
            ["git", "branch", "-D", branch],
            cwd=worktree_path,
            capture_output=True,
        )


def add_existing_worktree(workdir: Path) -> None:
    """Create an existing worktree (for 'already inside' scenarios)."""
    wt_path = workdir.parent / f"{workdir.name}-existing-worktree"
    add_worktree(workdir, "existing-feature", str(wt_path))


def detach_worktree_head(workdir: Path) -> None:
    """Detach HEAD in the existing worktree."""
    wt_path = workdir.parent / f"{workdir.name}-existing-worktree"
    detach_head(str(wt_path))


def symlink_superpowers(workdir: Path, superpowers_root: str) -> None:
    skills_dir = Path(workdir) / ".agents" / "skills"
    skills_dir.mkdir(parents=True, exist_ok=True)
    target = Path(superpowers_root) / "skills"
    link = skills_dir / "superpowers"
    link.symlink_to(target)


def link_gemini_extension(workdir: Path, superpowers_root: str) -> None:
    """Link superpowers as a Gemini CLI extension and inject project context.

    Extensions are global, but GEMINI.md context loading is project-scoped.
    Temp workdirs need a GEMINI.md with absolute paths so Gemini loads
    the using-superpowers instructions that tell it to invoke skills.
    """
    extension_name = "superpowers"
    manifest = Path(superpowers_root) / "gemini-extension.json"
    if manifest.exists():
        with suppress(json.JSONDecodeError):
            extension_name = json.loads(manifest.read_text()).get("name", extension_name)

    # Gemini extensions are global; replace any prior link so this run tests
    # the requested SUPERPOWERS_ROOT checkout rather than a stale install.
    subprocess.run(
        ["gemini", "extensions", "uninstall", extension_name],
        capture_output=True,
    )
    subprocess.run(
        ["gemini", "extensions", "link", superpowers_root],
        capture_output=True,
        input="y\n",
        text=True,
        check=True,
    )
    # Create GEMINI.md with absolute @imports so context loads in the temp workdir
    skills_root = Path(superpowers_root) / "skills"
    gemini_md = workdir / "GEMINI.md"
    gemini_md.write_text(
        f"@{skills_root}/using-superpowers/SKILL.md\n"
        f"@{skills_root}/using-superpowers/references/gemini-tools.md\n"
    )


def create_caller_consent_plan(workdir: Path) -> None:
    """Add a committed implementation plan that should trigger caller-layer gating."""
    plan_path = workdir / "docs" / "superpowers" / "plans" / "custom-greeting.md"
    plan_path.parent.mkdir(parents=True, exist_ok=True)
    plan_path.write_text(CALLER_CONSENT_PLAN)

    _git(["git", "add", str(plan_path.relative_to(workdir))], cwd=workdir)
    _git(["git", "commit", "-m", "add caller consent gate plan"], cwd=workdir)
