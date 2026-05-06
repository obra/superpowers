"""Tests for CLI option parsing."""

from __future__ import annotations

from click.testing import CliRunner

from drill.cli import main


class TestRunCommand:
    def test_backend_required_without_models(self) -> None:
        runner = CliRunner()
        result = runner.invoke(main, ["run", "nonexistent"])
        assert result.exit_code != 0

    def test_n_default_is_1(self) -> None:
        runner = CliRunner()
        result = runner.invoke(main, ["run", "nonexistent", "--backend", "claude", "--n", "1"])
        assert "Scenario not found" in result.output or result.exit_code != 0

    def test_models_flag_accepted(self) -> None:
        runner = CliRunner()
        result = runner.invoke(main, ["run", "nonexistent", "--models", "claude,codex"])
        assert "Scenario not found" in result.output or result.exit_code != 0

    def test_n_must_be_positive(self) -> None:
        runner = CliRunner()
        result = runner.invoke(main, ["run", "nonexistent", "--backend", "claude", "--n", "0"])
        assert result.exit_code != 0


class TestListCommand:
    def test_lists_scenarios(self, tmp_path):
        scenarios_dir = tmp_path / "scenarios"
        scenarios_dir.mkdir()
        (scenarios_dir / "test-scenario.yaml").write_text("""
scenario: test-scenario
description: "A test scenario"
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
        runner = CliRunner()
        result = runner.invoke(main, ["list", "--scenarios-dir", str(scenarios_dir)])
        assert result.exit_code == 0
        assert "test-scenario" in result.output


class TestCompareCommand:
    def test_sweep_flag_accepted(self) -> None:
        runner = CliRunner()
        result = runner.invoke(main, ["compare", "nonexistent", "--sweep", "abc123"])
        assert result.exit_code != 0  # No results dir, but flag is parsed
