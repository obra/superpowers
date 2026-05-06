"""End-to-end smoke test using a mock 'bash' backend."""

import shutil
from pathlib import Path

import pytest

from drill.engine import Engine, ScenarioConfig


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
        fixtures_dir = Path(__file__).parent.parent / "fixtures"
        engine = Engine(
            scenario_path=mock_scenario,
            backend_name="mock",
            backends_dir=mock_backend,
            fixtures_dir=fixtures_dir,
            results_dir=Path("/tmp/drill-test-results"),
        )
        workdir = Path("/tmp/drill-e2e-smoke")
        if workdir.exists():
            shutil.rmtree(workdir)
        engine._setup(workdir)
        assert (workdir / "package.json").exists()
        assert (workdir / "src" / "index.js").exists()
        # Verify git state
        import subprocess

        result = subprocess.run(
            ["git", "branch", "--show-current"], cwd=workdir, capture_output=True, text=True
        )
        assert result.stdout.strip() == "main"
        result = subprocess.run(
            ["git", "log", "--oneline"], cwd=workdir, capture_output=True, text=True
        )
        assert "initial commit" in result.stdout
        # Cleanup
        shutil.rmtree(workdir, ignore_errors=True)
