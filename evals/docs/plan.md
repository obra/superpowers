# Drill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a tmux-based harness that drives AI coding agents through worktree scenarios and evaluates whether they follow superpowers skills.

**Architecture:** CLI (`click`) orchestrates an engine that sets up a test repo, launches an agent in tmux, drives it via an LLM actor (Anthropic SDK, structured tool_use), collects session logs + filesystem state, then evaluates compliance via an LLM verifier. Backend configs (YAML) define how to launch each agent CLI. Scenarios (YAML) define what to test.

**Tech Stack:** Python 3.11+, click, pyyaml, anthropic SDK, jinja2, pydantic, tmux

---

## File Structure

```
drill/
├── drill/
│   ├── __init__.py          # Package init, version
│   ├── cli.py               # click CLI: run, compare, list
│   ├── engine.py            # Orchestrates full run lifecycle (7 steps)
│   ├── session.py           # tmux session management (create, send-keys, capture, kill)
│   ├── actor.py             # Actor LLM: rolling context, structured tool_use output
│   ├── verifier.py          # Verifier LLM: per-criterion evaluation, pydantic schema
│   ├── setup.py             # Template repo cloning, helper dispatch, assertion runner
│   ├── backend.py           # Loads backend YAML, builds CLI commands, idle detection
│   └── normalizer.py        # Normalizes backend-specific session logs to common schema
├── backends/
│   ├── claude.yaml          # Claude Code backend config
│   └── codex.yaml           # Codex backend config
├── prompts/
│   ├── actor.md             # Actor system prompt (jinja2 template)
│   └── verifier.md          # Verifier system prompt (jinja2 template)
├── scenarios/
│   ├── worktree-creation-from-main.yaml
│   ├── worktree-already-inside.yaml
│   ├── worktree-codex-detached-head.yaml
│   └── worktree-consent-flow.yaml
├── fixtures/
│   └── template-repo/       # Minimal git repo cloned per run
│       ├── package.json
│       ├── src/
│       │   ├── index.js
│       │   └── utils.js
│       └── README.md
├── setup_helpers/
│   ├── __init__.py          # Exports helper registry
│   ├── base.py              # create_base_repo
│   └── worktree.py          # add_worktree, detach_head, symlink_superpowers
├── tests/
│   ├── test_backend.py
│   ├── test_setup.py
│   ├── test_session.py
│   ├── test_actor.py
│   ├── test_verifier.py
│   ├── test_normalizer.py
│   ├── test_engine.py
│   └── test_cli.py
├── pyproject.toml
├── .gitignore
└── README.md
```

---

### Task 1: Project Scaffold

**Files:**
- Create: `pyproject.toml`
- Create: `drill/__init__.py`
- Create: `.gitignore`
- Create: `README.md`

- [ ] **Step 1: Create pyproject.toml**

```toml
[build-system]
requires = ["setuptools>=68.0"]
build-backend = "setuptools.backends._legacy:_Backend"

[project]
name = "drill"
version = "0.1.0"
description = "Superpowers skill compliance benchmark"
requires-python = ">=3.11"
dependencies = [
    "click>=8.1",
    "pyyaml>=6.0",
    "anthropic>=0.42",
    "jinja2>=3.1",
    "pydantic>=2.0",
]

[project.optional-dependencies]
dev = ["pytest>=8.0"]

[project.scripts]
drill = "drill.cli:main"

[tool.setuptools.packages.find]
include = ["drill*", "setup_helpers*"]
```

- [ ] **Step 2: Create drill/__init__.py**

```python
"""Drill: Superpowers skill compliance benchmark."""

__version__ = "0.1.0"
```

- [ ] **Step 3: Create .gitignore**

```
results/
__pycache__/
*.pyc
*.egg-info/
dist/
build/
.venv/
```

- [ ] **Step 4: Create README.md**

```markdown
# Drill

Superpowers skill compliance benchmark. Drives AI coding agents through
tmux sessions and evaluates whether they follow superpowers workflows.

See [docs/design.md](docs/design.md) for the full design spec.

## Setup

```bash
pip install -e ".[dev]"
```

## Usage

```bash
export SUPERPOWERS_ROOT=/path/to/superpowers
export ANTHROPIC_API_KEY=sk-...

drill run worktree-creation-from-main --backend claude
drill compare worktree-creation-from-main
drill list
```
```

- [ ] **Step 5: Install in dev mode and verify**

Run: `cd /Users/drewritter/prime-rad/drill && pip install -e ".[dev]"`
Expected: Installs successfully, `drill --help` shows usage

- [ ] **Step 6: Commit**

```bash
git add pyproject.toml drill/__init__.py .gitignore README.md
git commit -m "chore: project scaffold with pyproject.toml and drill entry point"
```

---

### Task 2: Backend Config Loader

**Files:**
- Create: `drill/backend.py`
- Create: `backends/claude.yaml`
- Create: `backends/codex.yaml`
- Create: `tests/test_backend.py`

- [ ] **Step 1: Write the failing test**

```python
# tests/test_backend.py
import os
import pytest
from pathlib import Path

from drill.backend import Backend, load_backend


@pytest.fixture
def backends_dir():
    return Path(__file__).parent.parent / "backends"


class TestLoadBackend:
    def test_loads_claude_backend(self, backends_dir):
        backend = load_backend("claude", backends_dir)
        assert backend.name == "claude"
        assert backend.cli == "claude"
        assert "--dangerously-skip-permissions" in backend.args

    def test_loads_codex_backend(self, backends_dir):
        backend = load_backend("codex", backends_dir)
        assert backend.name == "codex"
        assert backend.cli == "codex"

    def test_unknown_backend_raises(self, backends_dir):
        with pytest.raises(FileNotFoundError):
            load_backend("nonexistent", backends_dir)


class TestBackendBuildCommand:
    def test_claude_build_command(self, backends_dir, monkeypatch):
        monkeypatch.setenv("SUPERPOWERS_ROOT", "/tmp/superpowers")
        backend = load_backend("claude", backends_dir)
        cmd = backend.build_command("/tmp/workdir")
        assert cmd[0] == "claude"
        assert "--plugin-dir" in cmd
        assert "/tmp/superpowers" in cmd

    def test_codex_build_command(self, backends_dir, monkeypatch):
        monkeypatch.setenv("SUPERPOWERS_ROOT", "/tmp/superpowers")
        backend = load_backend("codex", backends_dir)
        cmd = backend.build_command("/tmp/workdir")
        assert cmd[0] == "codex"


class TestBackendEnvValidation:
    def test_missing_env_raises(self, backends_dir, monkeypatch):
        monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
        monkeypatch.delenv("SUPERPOWERS_ROOT", raising=False)
        backend = load_backend("claude", backends_dir)
        with pytest.raises(EnvironmentError, match="ANTHROPIC_API_KEY"):
            backend.validate_env()


class TestBackendIdleDetection:
    def test_ready_pattern_matches(self, backends_dir):
        backend = load_backend("claude", backends_dir)
        assert backend.is_ready_line("❯ ")
        assert backend.is_ready_line("Human: ")
        assert not backend.is_ready_line("Running tool...")
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/drewritter/prime-rad/drill && pytest tests/test_backend.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'drill.backend'`

- [ ] **Step 3: Create backend YAML files**

Create `backends/claude.yaml`:

```yaml
name: claude
cli: claude
args:
  - "--dangerously-skip-permissions"
  - "--plugin-dir"
  - "${SUPERPOWERS_ROOT}"
required_env:
  - ANTHROPIC_API_KEY
  - SUPERPOWERS_ROOT
hooks:
  pre_run: []
  post_run: []
shutdown: "/exit"
idle:
  quiescence_seconds: 3
  ready_pattern: "^❯|^\\$|Human:"
startup_timeout: 30
terminal:
  cols: 200
  rows: 50
session_logs:
  pattern: "~/.claude/projects/**/session-*.jsonl"
```

Create `backends/codex.yaml`:

```yaml
name: codex
cli: codex
args:
  - "--dangerously-bypass-approvals-and-sandbox"
required_env:
  - OPENAI_API_KEY
  - SUPERPOWERS_ROOT
hooks:
  pre_run:
    - symlink_superpowers
  post_run: []
shutdown: "<<KEY:ctrl-d>>"
idle:
  quiescence_seconds: 5
  ready_pattern: "codex>|^>"
startup_timeout: 30
terminal:
  cols: 200
  rows: 50
session_logs:
  pattern: "~/.codex/sessions/rollout-*.jsonl"
```

- [ ] **Step 4: Write the implementation**

```python
# drill/backend.py
"""Backend config loader and command builder."""

from __future__ import annotations

import os
import re
from dataclasses import dataclass, field
from pathlib import Path

import yaml


@dataclass
class Backend:
    name: str
    cli: str
    args: list[str]
    required_env: list[str]
    hooks: dict[str, list[str]]
    shutdown: str
    idle: dict[str, any]
    startup_timeout: int
    terminal: dict[str, int]
    session_logs: dict[str, str]

    def build_command(self, workdir: str) -> list[str]:
        """Build the full CLI invocation with env var interpolation."""
        resolved = []
        for arg in self.args:
            resolved.append(_interpolate_env(arg))
        return [self.cli, *resolved]

    def validate_env(self) -> None:
        """Raise EnvironmentError if any required env vars are missing."""
        missing = [v for v in self.required_env if not os.environ.get(v)]
        if missing:
            raise EnvironmentError(
                f"Missing required environment variables for {self.name} backend: "
                + ", ".join(missing)
            )

    def is_ready_line(self, line: str) -> bool:
        """Check if a terminal line matches the idle ready pattern."""
        pattern = self.idle.get("ready_pattern", "")
        return bool(re.search(pattern, line))

    @property
    def quiescence_seconds(self) -> float:
        return self.idle.get("quiescence_seconds", 5)

    @property
    def cols(self) -> int:
        return self.terminal.get("cols", 200)

    @property
    def rows(self) -> int:
        return self.terminal.get("rows", 50)


def load_backend(name: str, backends_dir: Path) -> Backend:
    """Load a backend config from YAML."""
    path = backends_dir / f"{name}.yaml"
    if not path.exists():
        raise FileNotFoundError(f"Backend config not found: {path}")
    with open(path) as f:
        data = yaml.safe_load(f)
    return Backend(
        name=data["name"],
        cli=data["cli"],
        args=data.get("args", []),
        required_env=data.get("required_env", []),
        hooks=data.get("hooks", {"pre_run": [], "post_run": []}),
        shutdown=data.get("shutdown", "/exit"),
        idle=data.get("idle", {}),
        startup_timeout=data.get("startup_timeout", 30),
        terminal=data.get("terminal", {"cols": 200, "rows": 50}),
        session_logs=data.get("session_logs", {}),
    )


def _interpolate_env(value: str) -> str:
    """Replace ${VAR} with environment variable values."""
    def replacer(match):
        var = match.group(1)
        val = os.environ.get(var)
        if val is None:
            raise EnvironmentError(f"Environment variable {var} not set")
        return val
    return re.sub(r"\$\{(\w+)\}", replacer, value)
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd /Users/drewritter/prime-rad/drill && pytest tests/test_backend.py -v`
Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add drill/backend.py backends/ tests/test_backend.py
git commit -m "feat: backend config loader with YAML parsing and env validation"
```

---

### Task 3: tmux Session Manager

**Files:**
- Create: `drill/session.py`
- Create: `tests/test_session.py`

- [ ] **Step 1: Write the failing test**

```python
# tests/test_session.py
import subprocess
import time
import pytest

from drill.session import TmuxSession


class TestTmuxSession:
    def test_create_and_kill(self):
        session = TmuxSession(name="drill-test-create", cols=80, rows=24)
        session.create()
        # Verify session exists
        result = subprocess.run(
            ["tmux", "has-session", "-t", "drill-test-create"],
            capture_output=True,
        )
        assert result.returncode == 0
        session.kill()
        # Verify session is gone
        result = subprocess.run(
            ["tmux", "has-session", "-t", "drill-test-create"],
            capture_output=True,
        )
        assert result.returncode != 0

    def test_send_keys_and_capture(self):
        session = TmuxSession(name="drill-test-keys", cols=80, rows=24)
        session.create()
        try:
            session.send_keys("echo hello-drill-test")
            time.sleep(0.5)
            output = session.capture()
            assert "hello-drill-test" in output
        finally:
            session.kill()

    def test_launch_command(self, tmp_path):
        session = TmuxSession(name="drill-test-launch", cols=80, rows=24)
        session.create()
        try:
            session.launch(["python3", "-c", "import time; time.sleep(30)"], cwd=str(tmp_path))
            time.sleep(0.5)
            output = session.capture()
            # Process should be running, not showing shell prompt
            assert session.is_process_alive()
        finally:
            session.kill()

    def test_send_special_key(self):
        session = TmuxSession(name="drill-test-special", cols=80, rows=24)
        session.create()
        try:
            session.send_keys("cat")  # start cat, which reads stdin
            time.sleep(0.3)
            session.send_special_key("ctrl-c")
            time.sleep(0.3)
            # After ctrl-c, cat should have exited
            output = session.capture()
            assert "^C" in output or output.endswith("$")
        finally:
            session.kill()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/drewritter/prime-rad/drill && pytest tests/test_session.py -v`
Expected: FAIL — `ModuleNotFoundError: No module named 'drill.session'`

- [ ] **Step 3: Write the implementation**

```python
# drill/session.py
"""tmux session management for driving agent CLI sessions."""

from __future__ import annotations

import subprocess
import time


class TmuxSession:
    """Manages a tmux session for driving an agent CLI."""

    def __init__(self, name: str, cols: int = 200, rows: int = 50):
        self.name = name
        self.cols = cols
        self.rows = rows

    def create(self) -> None:
        """Create a new detached tmux session."""
        subprocess.run(
            [
                "tmux", "new-session",
                "-d",
                "-s", self.name,
                "-x", str(self.cols),
                "-y", str(self.rows),
            ],
            check=True,
        )

    def launch(self, command: list[str], cwd: str) -> None:
        """Launch a command inside the tmux session."""
        cmd_str = " ".join(command)
        self.send_keys(f"cd {cwd} && {cmd_str}")

    def send_keys(self, text: str) -> None:
        """Send keystrokes to the tmux session, followed by Enter."""
        subprocess.run(
            ["tmux", "send-keys", "-t", self.name, text, "Enter"],
            check=True,
        )

    def send_special_key(self, key: str) -> None:
        """Send a special key like ctrl-c, ctrl-d."""
        key_map = {
            "ctrl-c": "C-c",
            "ctrl-d": "C-d",
            "ctrl-z": "C-z",
            "enter": "Enter",
            "escape": "Escape",
        }
        tmux_key = key_map.get(key, key)
        subprocess.run(
            ["tmux", "send-keys", "-t", self.name, tmux_key],
            check=True,
        )

    def capture(self) -> str:
        """Capture the current terminal pane content."""
        result = subprocess.run(
            ["tmux", "capture-pane", "-t", self.name, "-p"],
            capture_output=True,
            text=True,
            check=True,
        )
        return result.stdout

    def is_process_alive(self) -> bool:
        """Check if the process in the pane is still running."""
        result = subprocess.run(
            [
                "tmux", "list-panes", "-t", self.name,
                "-F", "#{pane_dead}",
            ],
            capture_output=True,
            text=True,
        )
        return result.stdout.strip() == "0"

    def kill(self) -> None:
        """Kill the tmux session."""
        subprocess.run(
            ["tmux", "kill-session", "-t", self.name],
            capture_output=True,  # don't fail if already dead
        )
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/drewritter/prime-rad/drill && pytest tests/test_session.py -v`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add drill/session.py tests/test_session.py
git commit -m "feat: tmux session manager with send-keys, capture, and special key support"
```

---

### Task 4: Setup Helpers and Template Repo

**Files:**
- Create: `setup_helpers/__init__.py`
- Create: `setup_helpers/base.py`
- Create: `setup_helpers/worktree.py`
- Create: `fixtures/template-repo/` (with contents)
- Create: `drill/setup.py`
- Create: `tests/test_setup.py`

- [ ] **Step 1: Create the template repo fixture**

```bash
cd /Users/drewritter/prime-rad/drill
mkdir -p fixtures/template-repo/src
```

Create `fixtures/template-repo/package.json`:
```json
{
  "name": "drill-test-project",
  "version": "1.0.0",
  "description": "Test project for Drill scenarios",
  "main": "src/index.js"
}
```

Create `fixtures/template-repo/src/index.js`:
```javascript
const { greet } = require('./utils');

function main() {
  console.log(greet('world'));
}

main();
```

Create `fixtures/template-repo/src/utils.js`:
```javascript
function greet(name) {
  return `Hello, ${name}!`;
}

module.exports = { greet };
```

Create `fixtures/template-repo/README.md`:
```markdown
# Test Project

A minimal project for Drill test scenarios.
```

Initialize git history:
```bash
cd fixtures/template-repo
git init
git add package.json README.md
git commit -m "initial commit"
git add src/utils.js
git commit -m "add utils module"
git add src/index.js
git commit -m "add entry point"
cd ../..
```

- [ ] **Step 2: Write the failing test**

```python
# tests/test_setup.py
import os
import subprocess
import pytest
from pathlib import Path

from drill.setup import clone_template, run_assertions
from setup_helpers.base import create_base_repo
from setup_helpers.worktree import add_worktree, detach_head, symlink_superpowers


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
        # Should have git history
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
        assert result.stdout.strip() == ""  # detached = no branch

    def test_symlink_superpowers(self, fixtures_dir, work_dir, tmp_path):
        create_base_repo(work_dir, fixtures_dir / "template-repo")
        fake_superpowers = tmp_path / "superpowers" / "skills"
        fake_superpowers.mkdir(parents=True)
        symlink_superpowers(work_dir, str(tmp_path / "superpowers"))
        link = work_dir / ".agents" / "skills" / "superpowers"
        assert link.is_symlink()


class TestRunAssertions:
    def test_passing_assertions(self, fixtures_dir, work_dir):
        create_base_repo(work_dir, fixtures_dir / "template-repo")
        assertions = [
            "git rev-parse --is-inside-work-tree",
            "git branch --show-current | grep main",
        ]
        # Should not raise
        run_assertions(assertions, work_dir)

    def test_failing_assertion_raises(self, fixtures_dir, work_dir):
        create_base_repo(work_dir, fixtures_dir / "template-repo")
        assertions = ["git branch --show-current | grep nonexistent"]
        with pytest.raises(AssertionError, match="Setup assertion failed"):
            run_assertions(assertions, work_dir)
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd /Users/drewritter/prime-rad/drill && pytest tests/test_setup.py -v`
Expected: FAIL — `ModuleNotFoundError`

- [ ] **Step 4: Write setup_helpers**

Create `setup_helpers/__init__.py`:
```python
"""Setup helpers for Drill scenarios."""

from setup_helpers.base import create_base_repo
from setup_helpers.worktree import add_worktree, detach_head, symlink_superpowers

HELPER_REGISTRY = {
    "create_base_repo": create_base_repo,
    "add_worktree": add_worktree,
    "detach_head": detach_head,
    "symlink_superpowers": symlink_superpowers,
}
```

Create `setup_helpers/base.py`:
```python
"""Base setup helpers."""

from __future__ import annotations

import subprocess
from pathlib import Path


def create_base_repo(workdir: Path, template_dir: Path) -> None:
    """Clone the template repo to workdir."""
    subprocess.run(
        ["git", "clone", str(template_dir), str(workdir)],
        check=True,
        capture_output=True,
    )
```

Create `setup_helpers/worktree.py`:
```python
"""Worktree-specific setup helpers."""

from __future__ import annotations

import os
import subprocess
from pathlib import Path


def add_worktree(repo_dir: Path, branch: str, worktree_path: str) -> None:
    """Create a git worktree at the given path."""
    subprocess.run(
        ["git", "worktree", "add", "-b", branch, worktree_path],
        cwd=repo_dir,
        check=True,
        capture_output=True,
    )


def detach_head(worktree_path: str) -> None:
    """Detach HEAD in a worktree (simulates Codex App state)."""
    # Get current commit hash
    result = subprocess.run(
        ["git", "rev-parse", "HEAD"],
        cwd=worktree_path,
        capture_output=True,
        text=True,
        check=True,
    )
    commit = result.stdout.strip()
    # Get the branch name so we can delete it after detaching
    result = subprocess.run(
        ["git", "branch", "--show-current"],
        cwd=worktree_path,
        capture_output=True,
        text=True,
        check=True,
    )
    branch = result.stdout.strip()
    # Detach HEAD
    subprocess.run(
        ["git", "checkout", "--detach", commit],
        cwd=worktree_path,
        check=True,
        capture_output=True,
    )
    # Delete the temporary branch
    if branch:
        subprocess.run(
            ["git", "branch", "-D", branch],
            cwd=worktree_path,
            capture_output=True,
        )


def symlink_superpowers(workdir: Path, superpowers_root: str) -> None:
    """Create .agents/skills/superpowers symlink for Codex discovery."""
    skills_dir = Path(workdir) / ".agents" / "skills"
    skills_dir.mkdir(parents=True, exist_ok=True)
    target = Path(superpowers_root) / "skills"
    link = skills_dir / "superpowers"
    link.symlink_to(target)
```

- [ ] **Step 5: Write drill/setup.py**

```python
# drill/setup.py
"""Test repo setup: template cloning, helper dispatch, assertion runner."""

from __future__ import annotations

import subprocess
from pathlib import Path

from setup_helpers import HELPER_REGISTRY


def clone_template(template_dir: Path, workdir: Path) -> None:
    """Clone the template repo to a working directory."""
    subprocess.run(
        ["git", "clone", str(template_dir), str(workdir)],
        check=True,
        capture_output=True,
    )


def run_helpers(
    helper_names: list[str],
    workdir: Path,
    fixtures_dir: Path,
) -> None:
    """Run named setup helpers against the working directory."""
    for name in helper_names:
        helper = HELPER_REGISTRY.get(name)
        if helper is None:
            raise ValueError(f"Unknown setup helper: {name}")
        if name == "create_base_repo":
            helper(workdir, fixtures_dir / "template-repo")
        elif name == "symlink_superpowers":
            import os
            helper(workdir, os.environ["SUPERPOWERS_ROOT"])
        else:
            # All other helpers take workdir as single arg
            helper(workdir)


def run_assertions(assertions: list[str], workdir: Path) -> None:
    """Run shell assertion commands. Raise if any fail."""
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
                f"stdout: {result.stdout}\n"
                f"stderr: {result.stderr}"
            )
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd /Users/drewritter/prime-rad/drill && pytest tests/test_setup.py -v`
Expected: All tests PASS

- [ ] **Step 7: Commit**

```bash
git add fixtures/ setup_helpers/ drill/setup.py tests/test_setup.py
git commit -m "feat: template repo, setup helpers, and assertion runner"
```

---

### Task 5: Actor LLM

**Files:**
- Create: `drill/actor.py`
- Create: `prompts/actor.md`
- Create: `tests/test_actor.py`

- [ ] **Step 1: Write the failing test**

```python
# tests/test_actor.py
import json
import pytest
from unittest.mock import MagicMock, patch

from drill.actor import Actor, ActorAction


class TestActorAction:
    def test_parse_type_action(self):
        action = ActorAction.from_tool_result({"action": "type", "text": "create a worktree"})
        assert action.action == "type"
        assert action.text == "create a worktree"

    def test_parse_done_action(self):
        action = ActorAction.from_tool_result({"action": "done"})
        assert action.action == "done"

    def test_parse_stuck_action(self):
        action = ActorAction.from_tool_result({"action": "stuck"})
        assert action.action == "stuck"

    def test_parse_key_action(self):
        action = ActorAction.from_tool_result({"action": "key", "key": "ctrl-c"})
        assert action.action == "key"
        assert action.key == "ctrl-c"


class TestActorPrompt:
    def test_builds_system_prompt_naive(self):
        actor = Actor(model="claude-sonnet-4-6", temperature=0.7)
        prompt = actor.build_system_prompt(
            posture="naive",
            intents=["Ask the agent to create a worktree"],
        )
        assert "naive" in prompt.lower() or "plain language" in prompt.lower()
        assert "create a worktree" in prompt

    def test_builds_system_prompt_spec_aware(self):
        actor = Actor(model="claude-sonnet-4-6", temperature=0.7)
        prompt = actor.build_system_prompt(
            posture="spec-aware",
            intents=["Use the worktree skill to create an isolated workspace"],
        )
        assert "spec" in prompt.lower() or "skill" in prompt.lower()


class TestActorContext:
    def test_appends_terminal_captures(self):
        actor = Actor(model="claude-sonnet-4-6", temperature=0.7)
        actor.append_capture("Screen 1: Welcome to Claude")
        actor.append_capture("Screen 2: ❯ ")
        messages = actor.build_messages()
        assert len(messages) == 2
        assert "Screen 1" in messages[0]["content"]
        assert "Screen 2" in messages[1]["content"]
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/drewritter/prime-rad/drill && pytest tests/test_actor.py -v`
Expected: FAIL — `ModuleNotFoundError`

- [ ] **Step 3: Create the actor prompt template**

Create `prompts/actor.md`:

```markdown
You are simulating a user interacting with an AI coding agent in a terminal.

{% if posture == "naive" %}
You are a developer who wants to accomplish a task. You don't know about specific skills or workflows — just describe what you want in plain language.
{% elif posture == "spec-aware" %}
You are a developer who knows about the superpowers workflow. You may reference specific skills or conventions by name (e.g., "use the worktree skill", "follow the using-git-worktrees pattern").
{% endif %}

Goals (in rough priority order):
{% for intent in intents %}
- {{ intent }}
{% endfor %}

Rules:
- Decide what to do based on what's currently on screen.
- Goals are not a script — some are conditional. Act on them when relevant.
- Type natural, concise messages like a real developer would.
- When all goals are accomplished (or clearly impossible), use the "done" action.
- If you're stuck and cannot make progress, use the "stuck" action.
```

- [ ] **Step 4: Write the implementation**

```python
# drill/actor.py
"""Actor LLM: simulates a user driving an agent session."""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

import anthropic
from jinja2 import Template


ACTOR_TOOL = {
    "name": "terminal_action",
    "description": "Send an action to the terminal session.",
    "input_schema": {
        "type": "object",
        "properties": {
            "action": {
                "type": "string",
                "enum": ["type", "done", "stuck", "key"],
                "description": "The action to take.",
            },
            "text": {
                "type": "string",
                "description": "Text to type (only for 'type' action).",
            },
            "key": {
                "type": "string",
                "description": "Special key to send (only for 'key' action, e.g., 'ctrl-c').",
            },
        },
        "required": ["action"],
    },
}


@dataclass
class ActorAction:
    action: str  # "type", "done", "stuck", "key"
    text: str | None = None
    key: str | None = None

    @classmethod
    def from_tool_result(cls, data: dict) -> ActorAction:
        return cls(
            action=data["action"],
            text=data.get("text"),
            key=data.get("key"),
        )


class Actor:
    """Drives agent sessions by deciding what a simulated user would type."""

    def __init__(self, model: str = "claude-sonnet-4-6", temperature: float = 0.7):
        self.model = model
        self.temperature = temperature
        self.captures: list[str] = []
        self._system_prompt: str | None = None
        self._client = anthropic.Anthropic()

    def build_system_prompt(self, posture: str, intents: list[str]) -> str:
        """Render the actor system prompt from template."""
        template_path = Path(__file__).parent.parent / "prompts" / "actor.md"
        template = Template(template_path.read_text())
        self._system_prompt = template.render(posture=posture, intents=intents)
        return self._system_prompt

    def append_capture(self, terminal_output: str) -> None:
        """Append a terminal capture to the rolling context."""
        self.captures.append(terminal_output)

    def build_messages(self) -> list[dict]:
        """Build the message list from terminal captures."""
        messages = []
        for capture in self.captures:
            messages.append({"role": "user", "content": capture})
        return messages

    def decide(self) -> ActorAction:
        """Call the LLM to decide the next action."""
        response = self._client.messages.create(
            model=self.model,
            max_tokens=1024,
            temperature=self.temperature,
            system=self._system_prompt,
            tools=[ACTOR_TOOL],
            tool_choice={"type": "tool", "name": "terminal_action"},
            messages=self.build_messages(),
        )
        # Extract the tool use block
        for block in response.content:
            if block.type == "tool_use":
                return ActorAction.from_tool_result(block.input)
        raise RuntimeError("Actor did not return a tool_use block")
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd /Users/drewritter/prime-rad/drill && pytest tests/test_actor.py -v`
Expected: All tests PASS (no live API calls — only testing parsing and prompt building)

- [ ] **Step 6: Commit**

```bash
git add drill/actor.py prompts/actor.md tests/test_actor.py
git commit -m "feat: actor LLM with structured tool_use output and prompt template"
```

---

### Task 6: Verifier LLM

**Files:**
- Create: `drill/verifier.py`
- Create: `prompts/verifier.md`
- Create: `tests/test_verifier.py`

- [ ] **Step 1: Write the failing test**

```python
# tests/test_verifier.py
import json
import pytest
from unittest.mock import MagicMock, patch

from drill.verifier import Verifier, Verdict, CriterionResult


class TestVerdict:
    def test_parse_valid_verdict(self):
        data = {
            "criteria": [
                {
                    "criterion": "Agent detected on main",
                    "verdict": "pass",
                    "evidence": "Terminal showed 'main branch detected'",
                    "rationale": "Agent correctly identified the branch",
                }
            ],
            "observations": ["Agent was very fast"],
            "summary": "Passed all checks",
        }
        verdict = Verdict.model_validate(data)
        assert len(verdict.criteria) == 1
        assert verdict.criteria[0].verdict == "pass"
        assert verdict.score == "1/1"

    def test_score_calculation(self):
        data = {
            "criteria": [
                {"criterion": "A", "verdict": "pass", "evidence": "e", "rationale": "r"},
                {"criterion": "B", "verdict": "fail", "evidence": "e", "rationale": "r"},
                {"criterion": "C", "verdict": "pass", "evidence": "e", "rationale": "r"},
            ],
            "observations": [],
            "summary": "Mixed results",
        }
        verdict = Verdict.model_validate(data)
        assert verdict.score == "2/3"
        assert verdict.passed is False

    def test_all_pass(self):
        data = {
            "criteria": [
                {"criterion": "A", "verdict": "pass", "evidence": "e", "rationale": "r"},
            ],
            "observations": [],
            "summary": "Good",
        }
        verdict = Verdict.model_validate(data)
        assert verdict.passed is True


class TestVerifierPrompt:
    def test_builds_system_prompt(self):
        verifier = Verifier(model="claude-sonnet-4-6", temperature=0.0)
        prompt = verifier.build_system_prompt()
        assert "criterion" in prompt.lower()
        assert "evidence" in prompt.lower()
        assert "JSON" in prompt
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/drewritter/prime-rad/drill && pytest tests/test_verifier.py -v`
Expected: FAIL — `ModuleNotFoundError`

- [ ] **Step 3: Create the verifier prompt template**

Create `prompts/verifier.md`:

```markdown
You are evaluating whether an AI coding agent correctly followed a workflow specification during a terminal session.

You will receive:
1. Terminal session log (what was displayed on screen)
2. Filesystem state after the session (file tree, git state, worktree list)
3. Tool call log (structured record of every tool the agent invoked)

Evaluate each criterion independently. For each, respond with:
- verdict: pass or fail
- evidence: specific quotes from the logs or filesystem state
- rationale: why this constitutes a pass or fail

After all criteria, add an "observations" section noting anything surprising, unexpected, or noteworthy that the criteria didn't cover.

Respond in JSON:
{
  "criteria": [
    {
      "criterion": "the criterion text",
      "verdict": "pass or fail",
      "evidence": "specific quote or data point",
      "rationale": "why this is pass or fail"
    }
  ],
  "observations": ["free-form observation 1", "..."],
  "summary": "one-line overall assessment"
}
```

- [ ] **Step 4: Write the implementation**

```python
# drill/verifier.py
"""Verifier LLM: evaluates agent session against criteria."""

from __future__ import annotations

import json
from pathlib import Path

import anthropic
from jinja2 import Template
from pydantic import BaseModel


class CriterionResult(BaseModel):
    criterion: str
    verdict: str  # "pass" or "fail"
    evidence: str
    rationale: str


class Verdict(BaseModel):
    criteria: list[CriterionResult]
    observations: list[str]
    summary: str

    @property
    def score(self) -> str:
        passed = sum(1 for c in self.criteria if c.verdict == "pass")
        return f"{passed}/{len(self.criteria)}"

    @property
    def passed(self) -> bool:
        return all(c.verdict == "pass" for c in self.criteria)


class Verifier:
    """Evaluates agent sessions against verification criteria."""

    MAX_RETRIES = 3

    def __init__(self, model: str = "claude-sonnet-4-6", temperature: float = 0.0):
        self.model = model
        self.temperature = temperature
        self._client = anthropic.Anthropic()

    def build_system_prompt(self) -> str:
        """Render the verifier system prompt from template."""
        template_path = Path(__file__).parent.parent / "prompts" / "verifier.md"
        return template_path.read_text()

    def verify(
        self,
        session_log: str,
        filesystem_json: str,
        tool_calls_jsonl: str,
        criteria: list[str],
    ) -> Verdict:
        """Run the verifier against a completed session."""
        system = self.build_system_prompt()
        user_content = (
            "## Terminal Session Log\n\n"
            f"```\n{session_log}\n```\n\n"
            "## Filesystem State\n\n"
            f"```json\n{filesystem_json}\n```\n\n"
            "## Tool Call Log\n\n"
            f"```jsonl\n{tool_calls_jsonl}\n```\n\n"
            "## Criteria to Evaluate\n\n"
            + "\n".join(f"- {c}" for c in criteria)
        )

        for attempt in range(self.MAX_RETRIES):
            response = self._client.messages.create(
                model=self.model,
                max_tokens=4096,
                temperature=self.temperature,
                system=system,
                messages=[{"role": "user", "content": user_content}],
            )
            text = response.content[0].text
            # Extract JSON from response (may be wrapped in markdown fences)
            json_str = _extract_json(text)
            try:
                return Verdict.model_validate_json(json_str)
            except Exception:
                if attempt == self.MAX_RETRIES - 1:
                    raise
                continue

        raise RuntimeError("Verifier failed to return valid JSON")


def _extract_json(text: str) -> str:
    """Extract JSON from text that may be wrapped in markdown code fences."""
    # Try to find JSON in code fences
    if "```json" in text:
        start = text.index("```json") + 7
        end = text.index("```", start)
        return text[start:end].strip()
    if "```" in text:
        start = text.index("```") + 3
        end = text.index("```", start)
        return text[start:end].strip()
    # Try raw JSON
    start = text.index("{")
    end = text.rindex("}") + 1
    return text[start:end]
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd /Users/drewritter/prime-rad/drill && pytest tests/test_verifier.py -v`
Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add drill/verifier.py prompts/verifier.md tests/test_verifier.py
git commit -m "feat: verifier LLM with pydantic verdict schema and retry logic"
```

---

### Task 7: Log Normalizer

**Files:**
- Create: `drill/normalizer.py`
- Create: `tests/test_normalizer.py`

- [ ] **Step 1: Write the failing test**

```python
# tests/test_normalizer.py
import json
import pytest
from pathlib import Path

from drill.normalizer import normalize_claude_logs, normalize_codex_logs, snapshot_log_dir, collect_new_logs


class TestSnapshotAndCollect:
    def test_snapshot_and_collect_new_files(self, tmp_path):
        log_dir = tmp_path / "logs"
        log_dir.mkdir()
        # Pre-existing file
        (log_dir / "old.jsonl").write_text('{"old": true}\n')
        snapshot = snapshot_log_dir(log_dir)
        # Simulate new file created during session
        (log_dir / "new.jsonl").write_text('{"new": true}\n')
        new_files = collect_new_logs(log_dir, snapshot)
        assert len(new_files) == 1
        assert new_files[0].name == "new.jsonl"

    def test_empty_dir_returns_empty(self, tmp_path):
        log_dir = tmp_path / "logs"
        log_dir.mkdir()
        snapshot = snapshot_log_dir(log_dir)
        new_files = collect_new_logs(log_dir, snapshot)
        assert new_files == []


class TestNormalizeClaudeLogs:
    def test_normalizes_tool_use(self):
        lines = [
            json.dumps({
                "type": "tool_use",
                "name": "EnterWorktree",
                "input": {"branch": "add-login"},
            }),
            json.dumps({
                "type": "tool_use",
                "name": "Bash",
                "input": {"command": "git status"},
            }),
            json.dumps({
                "type": "text",
                "text": "I'll create a worktree",
            }),
        ]
        raw = "\n".join(lines)
        normalized = normalize_claude_logs(raw)
        assert len(normalized) == 2
        assert normalized[0]["tool"] == "EnterWorktree"
        assert normalized[0]["source"] == "native"
        assert normalized[1]["tool"] == "Bash"
        assert normalized[1]["source"] == "shell"


class TestNormalizeCodexLogs:
    def test_normalizes_local_shell_call(self):
        lines = [
            json.dumps({
                "type": "response_item",
                "item": {
                    "type": "local_shell_call",
                    "action": {"command": ["git", "worktree", "add", "feature"]},
                    "status": "completed",
                }
            }),
            json.dumps({
                "type": "response_item",
                "item": {
                    "type": "message",
                    "content": [{"text": "Creating worktree"}],
                }
            }),
        ]
        raw = "\n".join(lines)
        normalized = normalize_codex_logs(raw)
        assert len(normalized) == 1
        assert normalized[0]["tool"] == "Bash"
        assert "git worktree add" in normalized[0]["args"]["command"]
        assert normalized[0]["source"] == "shell"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/drewritter/prime-rad/drill && pytest tests/test_normalizer.py -v`
Expected: FAIL — `ModuleNotFoundError`

- [ ] **Step 3: Write the implementation**

```python
# drill/normalizer.py
"""Normalizes backend-specific session logs to a common tool call schema."""

from __future__ import annotations

import json
from pathlib import Path

# Tools that are native (not shell commands)
NATIVE_TOOLS = {
    "EnterWorktree", "ExitWorktree", "EnterPlanMode", "ExitPlanMode",
    "TaskCreate", "TaskUpdate", "TaskList", "TaskGet",
    "Skill", "Agent", "Read", "Write", "Edit", "Glob", "Grep",
}


def snapshot_log_dir(log_dir: Path) -> set[str]:
    """Snapshot the current files in a log directory."""
    if not log_dir.exists():
        return set()
    return {f.name for f in log_dir.iterdir() if f.is_file()}


def collect_new_logs(log_dir: Path, snapshot: set[str]) -> list[Path]:
    """Find files created after the snapshot was taken."""
    if not log_dir.exists():
        return []
    current = {f.name for f in log_dir.iterdir() if f.is_file()}
    new_names = current - snapshot
    return [log_dir / name for name in sorted(new_names)]


def normalize_claude_logs(raw_content: str) -> list[dict]:
    """Normalize Claude Code session log to common schema."""
    results = []
    for line in raw_content.strip().split("\n"):
        if not line.strip():
            continue
        try:
            entry = json.loads(line)
        except json.JSONDecodeError:
            continue
        if entry.get("type") == "tool_use":
            tool_name = entry.get("name", "")
            source = "native" if tool_name in NATIVE_TOOLS else "shell"
            results.append({
                "tool": tool_name,
                "args": entry.get("input", {}),
                "source": source,
            })
    return results


def normalize_codex_logs(raw_content: str) -> list[dict]:
    """Normalize Codex rollout log to common schema."""
    results = []
    for line in raw_content.strip().split("\n"):
        if not line.strip():
            continue
        try:
            entry = json.loads(line)
        except json.JSONDecodeError:
            continue
        if entry.get("type") != "response_item":
            continue
        item = entry.get("item", {})
        item_type = item.get("type", "")
        if item_type == "local_shell_call":
            action = item.get("action", {})
            cmd = action.get("command", [])
            cmd_str = " ".join(cmd) if isinstance(cmd, list) else str(cmd)
            results.append({
                "tool": "Bash",
                "args": {"command": cmd_str},
                "source": "shell",
            })
        elif item_type == "function_call":
            name = item.get("name", "")
            source = "native" if name in NATIVE_TOOLS else "shell"
            results.append({
                "tool": name,
                "args": item.get("arguments", {}),
                "source": source,
            })
    return results


NORMALIZERS = {
    "claude": normalize_claude_logs,
    "codex": normalize_codex_logs,
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/drewritter/prime-rad/drill && pytest tests/test_normalizer.py -v`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add drill/normalizer.py tests/test_normalizer.py
git commit -m "feat: log normalizer for Claude Code and Codex session logs"
```

---

### Task 8: Engine (Full Lifecycle Orchestrator)

**Files:**
- Create: `drill/engine.py`
- Create: `tests/test_engine.py`

- [ ] **Step 1: Write the failing test**

```python
# tests/test_engine.py
import json
import pytest
from pathlib import Path
from unittest.mock import MagicMock, patch
from datetime import datetime

from drill.engine import Engine, RunResult, ScenarioConfig, snapshot_filesystem


class TestScenarioConfig:
    def test_loads_from_yaml(self, tmp_path):
        scenario_file = tmp_path / "test.yaml"
        scenario_file.write_text("""
scenario: test-scenario
description: "A test"
user_posture: naive
setup:
  helpers:
    - create_base_repo
  assertions:
    - "git rev-parse --is-inside-work-tree"
turns:
  - intent: "Do the thing"
limits:
  max_turns: 10
  turn_timeout: 60
verify:
  criteria:
    - "Thing was done"
  observe: true
""")
        config = ScenarioConfig.from_yaml(scenario_file)
        assert config.scenario == "test-scenario"
        assert config.user_posture == "naive"
        assert config.limits["max_turns"] == 10
        assert len(config.turns) == 1
        assert len(config.verify["criteria"]) == 1


class TestSnapshotFilesystem:
    def test_captures_git_state(self, tmp_path):
        import subprocess
        subprocess.run(["git", "init"], cwd=tmp_path, capture_output=True)
        subprocess.run(["git", "commit", "--allow-empty", "-m", "init"],
                       cwd=tmp_path, capture_output=True)
        snapshot = snapshot_filesystem(tmp_path)
        data = json.loads(snapshot)
        assert "git_status" in data
        assert "branch" in data
        assert "worktree_list" in data
        assert "files" in data


class TestRunResult:
    def test_serializes_to_dir(self, tmp_path):
        result = RunResult(
            scenario="test",
            backend="claude",
            timestamp="2026-04-07T14-30-00",
            session_log="session output here",
            filesystem_json='{"files": []}',
            tool_calls_jsonl='{"tool": "Bash"}\n',
            verdict_json='{"criteria": [], "observations": [], "summary": "ok"}',
            meta={
                "backend": "claude",
                "duration_seconds": 42,
                "actor_turns": 5,
            },
        )
        result.save(tmp_path)
        assert (tmp_path / "session.log").read_text() == "session output here"
        assert (tmp_path / "filesystem.json").exists()
        assert (tmp_path / "tool_calls.jsonl").exists()
        assert (tmp_path / "verdict.json").exists()
        assert (tmp_path / "meta.json").exists()
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/drewritter/prime-rad/drill && pytest tests/test_engine.py -v`
Expected: FAIL — `ModuleNotFoundError`

- [ ] **Step 3: Write the implementation**

```python
# drill/engine.py
"""Engine: orchestrates the full Drill run lifecycle."""

from __future__ import annotations

import json
import os
import subprocess
import time
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path

import yaml

from drill.actor import Actor, ActorAction
from drill.backend import Backend, load_backend
from drill.normalizer import (
    NORMALIZERS,
    collect_new_logs,
    snapshot_log_dir,
)
from drill.session import TmuxSession
from drill.setup import clone_template, run_assertions, run_helpers
from drill.verifier import Verdict, Verifier


@dataclass
class ScenarioConfig:
    scenario: str
    description: str
    user_posture: str
    setup: dict
    turns: list[dict]
    limits: dict
    verify: dict

    @classmethod
    def from_yaml(cls, path: Path) -> ScenarioConfig:
        with open(path) as f:
            data = yaml.safe_load(f)
        return cls(
            scenario=data["scenario"],
            description=data.get("description", ""),
            user_posture=data.get("user_posture", "naive"),
            setup=data.get("setup", {}),
            turns=data.get("turns", []),
            limits=data.get("limits", {"max_turns": 20, "turn_timeout": 120}),
            verify=data.get("verify", {"criteria": [], "observe": False}),
        )


@dataclass
class RunResult:
    scenario: str
    backend: str
    timestamp: str
    session_log: str
    filesystem_json: str
    tool_calls_jsonl: str
    verdict_json: str
    meta: dict

    def save(self, output_dir: Path) -> None:
        output_dir.mkdir(parents=True, exist_ok=True)
        (output_dir / "session.log").write_text(self.session_log)
        (output_dir / "filesystem.json").write_text(self.filesystem_json)
        (output_dir / "tool_calls.jsonl").write_text(self.tool_calls_jsonl)
        (output_dir / "verdict.json").write_text(self.verdict_json)
        (output_dir / "meta.json").write_text(json.dumps(self.meta, indent=2))


def snapshot_filesystem(workdir: Path) -> str:
    """Capture filesystem state as JSON."""
    files = []
    for f in sorted(workdir.rglob("*")):
        if ".git" in f.parts:
            continue
        if f.is_file():
            files.append(str(f.relative_to(workdir)))

    git_status = _git_cmd(workdir, ["git", "status", "--short"])
    branch = _git_cmd(workdir, ["git", "branch", "--show-current"])
    worktree_list = _git_cmd(workdir, ["git", "worktree", "list"])

    return json.dumps({
        "files": files,
        "git_status": git_status,
        "branch": branch,
        "worktree_list": worktree_list,
    }, indent=2)


class Engine:
    """Orchestrates the full Drill run lifecycle."""

    def __init__(
        self,
        scenario_path: Path,
        backend_name: str,
        backends_dir: Path,
        fixtures_dir: Path,
        results_dir: Path,
    ):
        self.scenario = ScenarioConfig.from_yaml(scenario_path)
        self.backend = load_backend(backend_name, backends_dir)
        self.fixtures_dir = fixtures_dir
        self.results_dir = results_dir

    def run(self) -> RunResult:
        """Execute the full 7-step lifecycle."""
        start_time = time.time()
        timestamp = datetime.now().strftime("%Y-%m-%dT%H-%M-%S")

        # 1. LOAD — validate env
        self.backend.validate_env()

        # 2. SETUP
        workdir = Path(f"/tmp/drill-{self.scenario.scenario}-{timestamp}")
        self._setup(workdir)

        # 3-4. SESSION + ACTOR LOOP
        session_name = f"drill-{self.scenario.scenario}-{timestamp}"
        session = TmuxSession(
            name=session_name,
            cols=self.backend.cols,
            rows=self.backend.rows,
        )

        # Snapshot log dir before session
        log_dir = self._resolve_log_dir()
        log_snapshot = snapshot_log_dir(log_dir) if log_dir else set()

        session_log, actor_turns = self._run_session(session, workdir)

        # 5. COLLECT
        filesystem_json = snapshot_filesystem(workdir)
        tool_calls = self._collect_tool_calls(log_dir, log_snapshot)
        tool_calls_jsonl = "\n".join(json.dumps(tc) for tc in tool_calls)

        # 6. VERIFY
        verifier = Verifier()
        verdict = verifier.verify(
            session_log=session_log,
            filesystem_json=filesystem_json,
            tool_calls_jsonl=tool_calls_jsonl,
            criteria=self.scenario.verify["criteria"],
        )

        # 7. RESULTS
        duration = time.time() - start_time
        meta = {
            "scenario": self.scenario.scenario,
            "backend": self.backend.name,
            "user_posture": self.scenario.user_posture,
            "timestamp": timestamp,
            "duration_seconds": round(duration, 1),
            "actor_turns": actor_turns,
            "actor_model": "claude-sonnet-4-6",
            "verifier_model": "claude-sonnet-4-6",
        }

        result = RunResult(
            scenario=self.scenario.scenario,
            backend=self.backend.name,
            timestamp=timestamp,
            session_log=session_log,
            filesystem_json=filesystem_json,
            tool_calls_jsonl=tool_calls_jsonl,
            verdict_json=verdict.model_dump_json(indent=2),
            meta=meta,
        )

        output_dir = (
            self.results_dir
            / self.scenario.scenario
            / self.backend.name
            / timestamp
        )
        result.save(output_dir)
        return result

    def _setup(self, workdir: Path) -> None:
        """Step 2: Setup."""
        helpers = self.scenario.setup.get("helpers", [])

        # Run backend pre_run hooks
        for hook_name in self.backend.hooks.get("pre_run", []):
            from setup_helpers import HELPER_REGISTRY
            hook = HELPER_REGISTRY.get(hook_name)
            if hook and hook_name == "symlink_superpowers":
                hook(workdir, os.environ["SUPERPOWERS_ROOT"])
            elif hook:
                hook(workdir)

        # Run scenario helpers
        run_helpers(helpers, workdir, self.fixtures_dir)

        # Run assertions
        assertions = self.scenario.setup.get("assertions", [])
        if assertions:
            run_assertions(assertions, workdir)

    def _run_session(
        self, session: TmuxSession, workdir: Path
    ) -> tuple[str, int]:
        """Steps 3-4: Session + Actor loop. Returns (session_log, turn_count)."""
        session.create()
        try:
            cmd = self.backend.build_command(str(workdir))
            session.launch(cmd, str(workdir))

            # Wait for startup
            self._wait_for_ready(session, timeout=self.backend.startup_timeout)

            # Actor loop
            actor = Actor()
            intents = [t["intent"] for t in self.scenario.turns]
            actor.build_system_prompt(
                posture=self.scenario.user_posture,
                intents=intents,
            )

            max_turns = self.scenario.limits.get("max_turns", 20)
            turn_timeout = self.scenario.limits.get("turn_timeout", 120)
            all_captures = []
            turn_count = 0

            for turn in range(max_turns):
                # Wait for agent idle
                self._wait_for_ready(session, timeout=turn_timeout)

                # Capture and send to actor
                capture = session.capture()
                all_captures.append(f"=== Turn {turn + 1} ===\n{capture}")
                actor.append_capture(f"Terminal output:\n{capture}")

                action = actor.decide()
                turn_count += 1

                if action.action == "done":
                    break
                elif action.action == "stuck":
                    break
                elif action.action == "type":
                    session.send_keys(action.text)
                elif action.action == "key":
                    session.send_special_key(action.key)

            # Collect final state
            final_capture = session.capture()
            all_captures.append(f"=== Final ===\n{final_capture}")

            # Shutdown
            if self.backend.shutdown.startswith("<<KEY:"):
                key = self.backend.shutdown[6:-2]
                session.send_special_key(key)
            else:
                session.send_keys(self.backend.shutdown)

            # Wait for exit
            time.sleep(3)

            return "\n".join(all_captures), turn_count
        finally:
            session.kill()

    def _wait_for_ready(self, session: TmuxSession, timeout: float) -> None:
        """Wait for quiescence + ready pattern."""
        quiescence = self.backend.quiescence_seconds
        start = time.time()
        last_output = ""
        stable_since = None

        while time.time() - start < timeout:
            current = session.capture()
            if current != last_output:
                last_output = current
                stable_since = time.time()
            elif stable_since and (time.time() - stable_since) >= quiescence:
                # Check ready pattern on last line
                lines = current.strip().split("\n")
                if lines and self.backend.is_ready_line(lines[-1]):
                    return
            time.sleep(0.5)

        # Timeout — proceed anyway (actor can handle it)

    def _resolve_log_dir(self) -> Path | None:
        """Resolve the log directory from backend config."""
        pattern = self.backend.session_logs.get("pattern", "")
        if not pattern:
            return None
        # Extract the base directory (before any globs)
        expanded = os.path.expanduser(pattern)
        parts = expanded.split("*")[0].rstrip("/")
        path = Path(parts)
        return path if path.exists() else None

    def _collect_tool_calls(
        self, log_dir: Path | None, snapshot: set[str]
    ) -> list[dict]:
        """Collect and normalize tool calls from backend logs."""
        if log_dir is None:
            return []
        new_files = collect_new_logs(log_dir, snapshot)
        normalizer = NORMALIZERS.get(self.backend.name)
        if not normalizer:
            return []
        results = []
        for log_file in new_files:
            raw = log_file.read_text()
            results.extend(normalizer(raw))
        return results


def _git_cmd(workdir: Path, cmd: list[str]) -> str:
    """Run a git command and return stdout."""
    result = subprocess.run(
        cmd, cwd=workdir, capture_output=True, text=True
    )
    return result.stdout.strip()
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/drewritter/prime-rad/drill && pytest tests/test_engine.py -v`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add drill/engine.py tests/test_engine.py
git commit -m "feat: engine orchestrator with full 7-step run lifecycle"
```

---

### Task 9: CLI

**Files:**
- Create: `drill/cli.py`
- Create: `tests/test_cli.py`

- [ ] **Step 1: Write the failing test**

```python
# tests/test_cli.py
import json
import pytest
from pathlib import Path
from click.testing import CliRunner

from drill.cli import main


@pytest.fixture
def scenarios_dir():
    return Path(__file__).parent.parent / "scenarios"


class TestListCommand:
    def test_lists_scenarios(self, scenarios_dir):
        # Create a test scenario
        scenarios_dir.mkdir(exist_ok=True)
        test_scenario = scenarios_dir / "_test-list.yaml"
        test_scenario.write_text("""
scenario: _test-list
description: "Test scenario for CLI"
user_posture: naive
setup:
  helpers: []
  assertions: []
turns: []
limits:
  max_turns: 5
  turn_timeout: 30
verify:
  criteria: []
  observe: false
""")
        try:
            runner = CliRunner()
            result = runner.invoke(main, ["list"])
            assert result.exit_code == 0
            assert "_test-list" in result.output
        finally:
            test_scenario.unlink()


class TestCompareCommand:
    def test_compare_with_results(self, tmp_path):
        # Set up fake results
        results_dir = tmp_path / "results"
        for backend in ["claude", "codex"]:
            d = results_dir / "test-scenario" / backend / "2026-04-07T14-00-00"
            d.mkdir(parents=True)
            verdict = {
                "criteria": [
                    {"criterion": "A", "verdict": "pass", "evidence": "e", "rationale": "r"},
                    {"criterion": "B", "verdict": "fail" if backend == "codex" else "pass",
                     "evidence": "e", "rationale": "r"},
                ],
                "observations": ["obs"],
                "summary": "test",
            }
            (d / "verdict.json").write_text(json.dumps(verdict))
            (d / "meta.json").write_text(json.dumps({
                "actor_turns": 5,
                "user_posture": "naive",
            }))

        runner = CliRunner()
        result = runner.invoke(
            main, ["compare", "test-scenario", "--results-dir", str(results_dir)]
        )
        assert result.exit_code == 0
        assert "claude" in result.output
        assert "codex" in result.output
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/drewritter/prime-rad/drill && pytest tests/test_cli.py -v`
Expected: FAIL — `ModuleNotFoundError`

- [ ] **Step 3: Write the implementation**

```python
# drill/cli.py
"""Drill CLI: run, compare, list."""

from __future__ import annotations

import json
from pathlib import Path

import click

from drill.engine import Engine
from drill.verifier import Verdict


PROJECT_ROOT = Path(__file__).parent.parent


@click.group()
def main():
    """Drill: Superpowers skill compliance benchmark."""
    pass


@main.command()
@click.argument("scenario")
@click.option("--backend", "-b", required=True, help="Backend name (e.g., claude, codex)")
@click.option("--backends-dir", type=click.Path(exists=True, path_type=Path),
              default=PROJECT_ROOT / "backends")
@click.option("--scenarios-dir", type=click.Path(exists=True, path_type=Path),
              default=PROJECT_ROOT / "scenarios")
@click.option("--fixtures-dir", type=click.Path(exists=True, path_type=Path),
              default=PROJECT_ROOT / "fixtures")
@click.option("--results-dir", type=click.Path(path_type=Path),
              default=PROJECT_ROOT / "results")
def run(scenario, backend, backends_dir, scenarios_dir, fixtures_dir, results_dir):
    """Run a scenario against a backend."""
    scenario_path = scenarios_dir / f"{scenario}.yaml"
    if not scenario_path.exists():
        raise click.ClickException(f"Scenario not found: {scenario_path}")

    engine = Engine(
        scenario_path=scenario_path,
        backend_name=backend,
        backends_dir=backends_dir,
        fixtures_dir=fixtures_dir,
        results_dir=results_dir,
    )

    click.echo(f"Running {scenario} with {backend}...")
    result = engine.run()

    verdict = Verdict.model_validate_json(result.verdict_json)
    click.echo(f"\nResult: {'PASS' if verdict.passed else 'FAIL'} ({verdict.score})")
    for c in verdict.criteria:
        icon = "✓" if c.verdict == "pass" else "✗"
        click.echo(f"  {icon} {c.criterion}")
    if verdict.observations:
        click.echo(f"\nObservations:")
        for obs in verdict.observations:
            click.echo(f"  - {obs}")


@main.command("list")
@click.option("--scenarios-dir", type=click.Path(exists=True, path_type=Path),
              default=PROJECT_ROOT / "scenarios")
def list_scenarios(scenarios_dir):
    """List available scenarios."""
    import yaml
    for f in sorted(scenarios_dir.glob("*.yaml")):
        with open(f) as fh:
            data = yaml.safe_load(fh)
        name = data.get("scenario", f.stem)
        desc = data.get("description", "")
        click.echo(f"  {name:40s} {desc}")


@main.command()
@click.argument("scenario")
@click.option("--results-dir", type=click.Path(exists=True, path_type=Path),
              default=PROJECT_ROOT / "results")
def compare(scenario, results_dir):
    """Compare results across backends for a scenario."""
    scenario_dir = results_dir / scenario
    if not scenario_dir.exists():
        raise click.ClickException(f"No results found for: {scenario}")

    # Collect latest result per backend
    backends = {}
    for backend_dir in sorted(scenario_dir.iterdir()):
        if not backend_dir.is_dir():
            continue
        # Get most recent run
        runs = sorted(backend_dir.iterdir())
        if not runs:
            continue
        latest = runs[-1]
        verdict_file = latest / "verdict.json"
        meta_file = latest / "meta.json"
        if not verdict_file.exists():
            continue
        verdict = Verdict.model_validate_json(verdict_file.read_text())
        meta = json.loads(meta_file.read_text()) if meta_file.exists() else {}
        backends[backend_dir.name] = {"verdict": verdict, "meta": meta}

    if not backends:
        raise click.ClickException(f"No results found for: {scenario}")

    # Get posture from first result's meta
    first_meta = next(iter(backends.values()))["meta"]
    posture = first_meta.get("user_posture", "unknown")

    # Summary table
    click.echo(f"\nScenario: {scenario} ({posture} posture)\n")
    click.echo(f"{'Backend':12s} {'Result':8s} {'Score':7s} {'Turns':5s}")
    click.echo("-" * 35)
    for name, data in backends.items():
        v = data["verdict"]
        turns = data["meta"].get("actor_turns", "?")
        result = "PASS" if v.passed else "FAIL"
        click.echo(f"{name:12s} {result:8s} {v.score:7s} {str(turns):5s}")

    # Detail table
    all_criteria = set()
    for data in backends.values():
        for c in data["verdict"].criteria:
            all_criteria.add(c.criterion)

    click.echo(f"\n{'Criterion':40s}", nl=False)
    for name in backends:
        click.echo(f" {name:8s}", nl=False)
    click.echo()
    click.echo("-" * (40 + 9 * len(backends)))

    for criterion in sorted(all_criteria):
        click.echo(f"{criterion[:40]:40s}", nl=False)
        for name, data in backends.items():
            match = next(
                (c for c in data["verdict"].criteria if c.criterion == criterion),
                None,
            )
            icon = "✓" if match and match.verdict == "pass" else "✗"
            click.echo(f" {icon:8s}", nl=False)
        click.echo()

    # Observations
    click.echo("\nObservations:")
    for name, data in backends.items():
        for obs in data["verdict"].observations:
            click.echo(f"  {name}: {obs}")
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/drewritter/prime-rad/drill && pytest tests/test_cli.py -v`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add drill/cli.py tests/test_cli.py
git commit -m "feat: CLI with run, compare, and list commands"
```

---

### Task 10: Scenarios

**Files:**
- Create: `scenarios/worktree-creation-from-main.yaml`
- Create: `scenarios/worktree-already-inside.yaml`
- Create: `scenarios/worktree-codex-detached-head.yaml`
- Create: `scenarios/worktree-consent-flow.yaml`

- [ ] **Step 1: Create worktree-creation-from-main scenario**

```yaml
# scenarios/worktree-creation-from-main.yaml
scenario: worktree-creation-from-main
description: "Agent creates an isolated worktree from main branch"
user_posture: naive

setup:
  helpers:
    - create_base_repo
  assertions:
    - "git rev-parse --is-inside-work-tree"
    - "git branch --show-current | grep main"
    - "git worktree list | wc -l | tr -d ' ' | grep 1"

turns:
  - intent: >
      Ask the agent to create an isolated workspace
      for building a login feature.
  - intent: "Confirm consent if the agent asks."

limits:
  max_turns: 20
  turn_timeout: 120

verify:
  criteria:
    - "Agent detected it was on main, not in an existing worktree"
    - "Agent asked for consent before creating the worktree"
    - "A worktree or isolated workspace now exists with a feature branch"
    - "Agent used the most appropriate tool available for its platform to create the worktree"
  observe: true
```

- [ ] **Step 2: Create worktree-already-inside scenario**

```yaml
# scenarios/worktree-already-inside.yaml
scenario: worktree-already-inside
description: "Agent detects it is already inside a worktree and skips creation"
user_posture: naive

setup:
  helpers:
    - create_base_repo
  assertions:
    - "git rev-parse --is-inside-work-tree"
    - "test $(git worktree list | wc -l) -ge 2"

turns:
  - intent: >
      Ask the agent to create an isolated workspace
      for building a signup feature.

limits:
  max_turns: 15
  turn_timeout: 120

verify:
  criteria:
    - "Agent detected it was already inside a worktree"
    - "Agent did NOT create a new worktree"
    - "Agent communicated that the current worktree is sufficient"
  observe: true
```

Note: this scenario needs the `add_worktree` helper called before `create_base_repo`'s assertions. The setup helpers list needs to include worktree setup. Update the setup block:

```yaml
setup:
  helpers:
    - create_base_repo
  post_helpers:
    # These run after create_base_repo, modifying the repo
    - name: add_worktree
      args:
        branch: existing-feature
        worktree_path: "${WORKDIR}/../existing-worktree"
  start_in: "${WORKDIR}/../existing-worktree"
  assertions:
    - "git rev-parse --is-inside-work-tree"
    - "test $(git worktree list | wc -l) -ge 2"
```

Actually, this introduces complexity in the setup format. Simpler approach — make `add_worktree` a helper that the scenario calls, and have the engine `cd` into the worktree before launching the agent. Revise:

```yaml
# scenarios/worktree-already-inside.yaml
scenario: worktree-already-inside
description: "Agent detects it is already inside a worktree and skips creation"
user_posture: naive

setup:
  helpers:
    - create_base_repo
    - add_existing_worktree
  workdir_override: "../existing-worktree"
  assertions:
    - "git rev-parse --is-inside-work-tree"
    - "git worktree list | wc -l | tr -d ' ' | grep 2"

turns:
  - intent: >
      Ask the agent to create an isolated workspace
      for building a signup feature.

limits:
  max_turns: 15
  turn_timeout: 120

verify:
  criteria:
    - "Agent detected it was already inside a worktree"
    - "Agent did NOT create a new worktree"
    - "Agent communicated that the current worktree is sufficient"
  observe: true
```

- [ ] **Step 3: Create worktree-codex-detached-head scenario**

```yaml
# scenarios/worktree-codex-detached-head.yaml
scenario: worktree-codex-detached-head
description: "Agent detects externally managed worktree with detached HEAD"
user_posture: naive

setup:
  helpers:
    - create_base_repo
    - add_existing_worktree
    - detach_worktree_head
  workdir_override: "../existing-worktree"
  assertions:
    - "git rev-parse --is-inside-work-tree"
    - "test -z $(git branch --show-current)"

turns:
  - intent: >
      Ask the agent to create an isolated workspace
      for building a dashboard feature.

limits:
  max_turns: 15
  turn_timeout: 120

verify:
  criteria:
    - "Agent detected it was in an externally managed worktree (detached HEAD)"
    - "Agent did NOT attempt to create a new worktree"
    - "Agent suggested using the current workspace or handing off to the harness"
  observe: true
```

- [ ] **Step 4: Create worktree-consent-flow scenario**

```yaml
# scenarios/worktree-consent-flow.yaml
scenario: worktree-consent-flow
description: "Agent asks for consent before creating a worktree"
user_posture: spec-aware

setup:
  helpers:
    - create_base_repo
  assertions:
    - "git rev-parse --is-inside-work-tree"
    - "git branch --show-current | grep main"

turns:
  - intent: >
      Ask the agent to use the worktree skill to create
      an isolated workspace for a notifications feature.
  - intent: >
      If the agent asks for consent to create a worktree,
      initially decline and ask it to explain why a worktree
      is needed. Then approve on the second ask.

limits:
  max_turns: 25
  turn_timeout: 120

verify:
  criteria:
    - "Agent explicitly asked for consent before creating any worktree"
    - "Agent explained the purpose of the worktree when asked"
    - "Agent waited for approval before proceeding with creation"
    - "A worktree was eventually created after consent was given"
  observe: true
```

- [ ] **Step 5: Update setup_helpers to support new helpers**

Add to `setup_helpers/worktree.py`:

```python
def add_existing_worktree(workdir: Path) -> None:
    """Create an existing worktree (for 'already inside' scenarios)."""
    wt_path = workdir.parent / "existing-worktree"
    add_worktree(workdir, "existing-feature", str(wt_path))


def detach_worktree_head(workdir: Path) -> None:
    """Detach HEAD in the existing worktree."""
    wt_path = workdir.parent / "existing-worktree"
    detach_head(str(wt_path))
```

Update `setup_helpers/__init__.py` to register new helpers:

```python
from setup_helpers.base import create_base_repo
from setup_helpers.worktree import (
    add_worktree, detach_head, symlink_superpowers,
    add_existing_worktree, detach_worktree_head,
)

HELPER_REGISTRY = {
    "create_base_repo": create_base_repo,
    "add_worktree": add_worktree,
    "detach_head": detach_head,
    "symlink_superpowers": symlink_superpowers,
    "add_existing_worktree": add_existing_worktree,
    "detach_worktree_head": detach_worktree_head,
}
```

- [ ] **Step 6: Update engine to handle workdir_override**

In `drill/engine.py`, update `_setup` and `run` to handle `workdir_override`:

```python
# In Engine.run(), after _setup(workdir):
actual_workdir = workdir
override = self.scenario.setup.get("workdir_override")
if override:
    actual_workdir = (workdir / override).resolve()
```

Then pass `actual_workdir` to `_run_session` instead of `workdir`.

- [ ] **Step 7: Commit**

```bash
git add scenarios/ setup_helpers/
git commit -m "feat: four PRI-974 worktree scenarios with setup helpers"
```

---

### Task 11: End-to-End Smoke Test

**Files:**
- Create: `tests/test_e2e.py`

This test uses a mock backend that runs `bash` instead of a real agent, to verify the full pipeline works without needing API keys or agent CLIs installed.

- [ ] **Step 1: Write the smoke test**

```python
# tests/test_e2e.py
"""End-to-end smoke test using a mock 'bash' backend."""

import json
import pytest
from pathlib import Path
from unittest.mock import patch, MagicMock

from drill.engine import Engine, ScenarioConfig
from drill.actor import ActorAction
from drill.verifier import Verdict


@pytest.fixture
def mock_scenario(tmp_path):
    scenario = tmp_path / "test-scenario.yaml"
    scenario.write_text("""
scenario: e2e-smoke-test
description: "Smoke test"
user_posture: naive
setup:
  helpers:
    - create_base_repo
  assertions:
    - "git rev-parse --is-inside-work-tree"
turns:
  - intent: "List files in the current directory"
limits:
  max_turns: 3
  turn_timeout: 10
verify:
  criteria:
    - "Agent listed the files"
  observe: true
""")
    return scenario


@pytest.fixture
def mock_backend(tmp_path):
    backend_dir = tmp_path / "backends"
    backend_dir.mkdir()
    (backend_dir / "mock.yaml").write_text("""
name: mock
cli: bash
args: []
required_env: []
hooks:
  pre_run: []
  post_run: []
shutdown: "exit"
idle:
  quiescence_seconds: 1
  ready_pattern: "\\\\$"
startup_timeout: 5
terminal:
  cols: 80
  rows: 24
session_logs:
  pattern: ""
""")
    return backend_dir


class TestE2ESmoke:
    def test_scenario_config_loads(self, mock_scenario):
        config = ScenarioConfig.from_yaml(mock_scenario)
        assert config.scenario == "e2e-smoke-test"

    def test_engine_setup_works(self, mock_scenario, mock_backend):
        """Verify setup phase works without live LLM calls."""
        fixtures_dir = Path(__file__).parent.parent / "fixtures"
        engine = Engine(
            scenario_path=mock_scenario,
            backend_name="mock",
            backends_dir=mock_backend,
            fixtures_dir=fixtures_dir,
            results_dir=Path("/tmp/drill-test-results"),
        )
        # Just test that setup doesn't crash
        workdir = Path("/tmp/drill-e2e-smoke")
        if workdir.exists():
            import shutil
            shutil.rmtree(workdir)
        engine._setup(workdir)
        assert (workdir / "package.json").exists()
        # Cleanup
        import shutil
        shutil.rmtree(workdir, ignore_errors=True)
```

- [ ] **Step 2: Run the smoke test**

Run: `cd /Users/drewritter/prime-rad/drill && pytest tests/test_e2e.py -v`
Expected: All tests PASS

- [ ] **Step 3: Commit**

```bash
git add tests/test_e2e.py
git commit -m "test: end-to-end smoke test with mock backend"
```

---

### Task 12: Final Integration — First Real Run

This is a manual integration task, not TDD. It validates the full pipeline against a real agent.

- [ ] **Step 1: Set environment variables**

```bash
export SUPERPOWERS_ROOT=/Users/drewritter/prime-rad/superpowers
export ANTHROPIC_API_KEY=<your-key>
```

- [ ] **Step 2: Install drill**

```bash
cd /Users/drewritter/prime-rad/drill
pip install -e ".[dev]"
```

- [ ] **Step 3: Run the simplest scenario against Claude Code**

```bash
drill run worktree-creation-from-main --backend claude
```

Expected: The harness should:
1. Clone the template repo
2. Launch Claude Code in a tmux session
3. Actor types a message asking to create a worktree
4. Agent responds and (hopefully) creates a worktree
5. Session ends, logs collected
6. Verifier evaluates and prints results

- [ ] **Step 4: Inspect the results**

```bash
ls results/worktree-creation-from-main/claude/
cat results/worktree-creation-from-main/claude/*/verdict.json | python -m json.tool
cat results/worktree-creation-from-main/claude/*/session.log
```

- [ ] **Step 5: Tune idle detection if needed**

If the actor fires too early or too late, adjust `quiescence_seconds` and `ready_pattern` in `backends/claude.yaml`.

- [ ] **Step 6: Run against Codex**

```bash
export OPENAI_API_KEY=<your-key>
drill run worktree-creation-from-main --backend codex
```

- [ ] **Step 7: Compare**

```bash
drill compare worktree-creation-from-main
```

- [ ] **Step 8: Commit any tuning changes**

```bash
git add backends/ 
git commit -m "tune: idle detection patterns from first real runs"
```
