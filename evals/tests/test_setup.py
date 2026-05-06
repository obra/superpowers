import subprocess
from pathlib import Path
from unittest.mock import call, patch

import pytest

from drill.setup import clone_template, run_assertions
from setup_helpers.base import create_base_repo
from setup_helpers.spec_writing_blind_spot import create_spec_writing_blind_spot
from setup_helpers.worktree import (
    add_worktree,
    create_caller_consent_plan,
    detach_head,
    link_gemini_extension,
    symlink_superpowers,
)


@pytest.fixture
def fixtures_dir():
    return Path(__file__).parent.parent / "fixtures"


@pytest.fixture
def work_dir(tmp_path):
    return tmp_path / "test-repo"


class TestCloneTemplate:
    def test_clones_template_repo(self, fixtures_dir, work_dir):
        clone_template(fixtures_dir / "template-repo", work_dir)
        assert (work_dir / "package.json").exists()
        assert (work_dir / "src" / "index.js").exists()
        result = subprocess.run(
            ["git", "log", "--oneline"],
            cwd=work_dir,
            capture_output=True,
            text=True,
        )
        assert "initial commit" in result.stdout


class TestCreateBaseRepo:
    def test_creates_base_repo(self, fixtures_dir, work_dir):
        create_base_repo(work_dir, fixtures_dir / "template-repo")
        assert (work_dir / "package.json").exists()
        result = subprocess.run(
            ["git", "branch", "--show-current"],
            cwd=work_dir,
            capture_output=True,
            text=True,
        )
        assert result.stdout.strip() == "main"


class TestWorktreeHelpers:
    def test_add_worktree(self, fixtures_dir, work_dir):
        create_base_repo(work_dir, fixtures_dir / "template-repo")
        wt_path = work_dir.parent / "feature-wt"
        add_worktree(work_dir, "feature-branch", str(wt_path))
        assert wt_path.exists()
        result = subprocess.run(
            ["git", "worktree", "list"],
            cwd=work_dir,
            capture_output=True,
            text=True,
        )
        assert "feature-branch" in result.stdout

    def test_detach_head(self, fixtures_dir, work_dir):
        create_base_repo(work_dir, fixtures_dir / "template-repo")
        wt_path = work_dir.parent / "detached-wt"
        add_worktree(work_dir, "tmp-branch", str(wt_path))
        detach_head(str(wt_path))
        result = subprocess.run(
            ["git", "branch", "--show-current"],
            cwd=wt_path,
            capture_output=True,
            text=True,
        )
        assert result.stdout.strip() == ""

    def test_symlink_superpowers(self, fixtures_dir, work_dir, tmp_path):
        create_base_repo(work_dir, fixtures_dir / "template-repo")
        fake_sp = tmp_path / "superpowers" / "skills"
        fake_sp.mkdir(parents=True)
        symlink_superpowers(work_dir, str(tmp_path / "superpowers"))
        link = work_dir / ".agents" / "skills" / "superpowers"
        assert link.is_symlink()

    def test_link_gemini_extension_relinks_requested_root(self, work_dir, tmp_path):
        work_dir.mkdir()
        fake_sp = tmp_path / "superpowers"
        (fake_sp / "skills" / "using-superpowers" / "references").mkdir(parents=True)
        (fake_sp / "gemini-extension.json").write_text('{"name": "custom-superpowers"}')

        with patch("setup_helpers.worktree.subprocess.run") as run:
            link_gemini_extension(work_dir, str(fake_sp))

        assert run.call_args_list == [
            call(["gemini", "extensions", "uninstall", "custom-superpowers"], capture_output=True),
            call(
                ["gemini", "extensions", "link", str(fake_sp)],
                capture_output=True,
                input="y\n",
                text=True,
                check=True,
            ),
        ]
        assert (work_dir / "GEMINI.md").read_text() == (
            f"@{fake_sp}/skills/using-superpowers/SKILL.md\n"
            f"@{fake_sp}/skills/using-superpowers/references/gemini-tools.md\n"
        )

    def test_create_caller_consent_plan(self, fixtures_dir, work_dir):
        create_base_repo(work_dir, fixtures_dir / "template-repo")
        create_caller_consent_plan(work_dir)

        plan = work_dir / "docs" / "superpowers" / "plans" / "custom-greeting.md"
        assert plan.exists()
        assert "REQUIRED SUB-SKILL" in plan.read_text()

        result = subprocess.run(
            ["git", "status", "--short"],
            cwd=work_dir,
            capture_output=True,
            text=True,
        )
        assert result.stdout.strip() == ""


class TestSpecWritingBlindSpot:
    def test_creates_repo_structure(self, tmp_path):
        workdir = tmp_path / "blind-spot-repo"
        create_spec_writing_blind_spot(workdir)

        assert (workdir / "src" / "components" / "AdminPanel.tsx").exists()
        assert (workdir / "src" / "components" / "TeamOverview.tsx").exists()
        assert (workdir / "src" / "router.tsx").exists()
        assert (workdir / "CLAUDE.md").exists()
        assert not (workdir / "src" / "components" / "ActivityFeed.tsx").exists()

        result = subprocess.run(
            ["git", "branch", "--show-current"],
            cwd=workdir,
            capture_output=True,
            text=True,
        )
        assert result.stdout.strip() == "main"

        result = subprocess.run(
            ["git", "log", "--oneline"],
            cwd=workdir,
            capture_output=True,
            text=True,
        )
        assert result.stdout.count("\n") >= 3


class TestRunAssertions:
    def test_passing_assertions(self, fixtures_dir, work_dir):
        create_base_repo(work_dir, fixtures_dir / "template-repo")
        assertions = [
            "git rev-parse --is-inside-work-tree",
            "git branch --show-current | grep main",
        ]
        run_assertions(assertions, work_dir)

    def test_failing_assertion_raises(self, fixtures_dir, work_dir):
        create_base_repo(work_dir, fixtures_dir / "template-repo")
        with pytest.raises(AssertionError, match="Setup assertion failed"):
            run_assertions(["git branch --show-current | grep nonexistent"], work_dir)
