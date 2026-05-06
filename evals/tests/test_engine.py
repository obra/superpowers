from __future__ import annotations

import json
import subprocess
from pathlib import Path

from drill.engine import RunResult, ScenarioConfig, VerifyConfig, snapshot_filesystem


class TestVerifyConfig:
    def test_defaults(self):
        vc = VerifyConfig()
        assert vc.criteria == []
        assert vc.assertions == []
        assert vc.observe is False

    def test_from_dict(self):
        vc = VerifyConfig(
            criteria=["test criterion"],
            assertions=["tool-called Read"],
            observe=True,
        )
        assert len(vc.criteria) == 1
        assert len(vc.assertions) == 1
        assert vc.observe is True


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
  assertions:
    - "tool-called Bash"
  observe: true
""")
        config = ScenarioConfig.from_yaml(scenario_file)
        assert config.scenario == "test-scenario"
        assert config.user_posture == "naive"
        assert config.limits["max_turns"] == 10
        assert len(config.turns) == 1
        assert len(config.verify.criteria) == 1
        assert len(config.verify.assertions) == 1
        assert config.verify.observe is True

    def test_loads_without_assertions(self, tmp_path):
        scenario_file = tmp_path / "test.yaml"
        scenario_file.write_text("""
scenario: minimal
verify:
  criteria:
    - "Something happened"
""")
        config = ScenarioConfig.from_yaml(scenario_file)
        assert config.verify.assertions == []
        assert config.verify.observe is False

    def test_loads_without_verify(self, tmp_path):
        scenario_file = tmp_path / "test.yaml"
        scenario_file.write_text("""
scenario: bare-minimum
""")
        config = ScenarioConfig.from_yaml(scenario_file)
        assert config.verify.criteria == []
        assert config.verify.assertions == []


class TestSnapshotFilesystem:
    def test_captures_git_state(self, tmp_path):
        subprocess.run(["git", "init", "-b", "main"], cwd=tmp_path, capture_output=True)
        subprocess.run(
            ["git", "commit", "--allow-empty", "-m", "init"], cwd=tmp_path, capture_output=True
        )
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
            meta={"backend": "claude", "duration_seconds": 42, "actor_turns": 5},
        )
        result.save(tmp_path)
        assert (tmp_path / "session.log").read_text() == "session output here"
        assert (tmp_path / "filesystem.json").exists()
        assert (tmp_path / "tool_calls.jsonl").exists()
        assert (tmp_path / "verdict.json").exists()
        assert (tmp_path / "meta.json").exists()


class TestEngineAssertionIntegration:
    def test_run_result_save_splits_artifacts_and_verdict(self, tmp_path):
        result = RunResult(
            scenario="test",
            backend="claude",
            timestamp="2026-04-20T10-00-00",
            session_log="log here",
            filesystem_json='{"files": []}',
            tool_calls_jsonl='{"tool": "Bash"}\n',
            verdict_json='{"criteria": [], "observations": [], "summary": "ok"}',
            meta={"backend": "claude"},
        )
        result.save_artifacts(tmp_path)
        assert (tmp_path / "session.log").exists()
        assert (tmp_path / "filesystem.json").exists()
        assert (tmp_path / "tool_calls.jsonl").exists()
        assert not (tmp_path / "verdict.json").exists()
        assert not (tmp_path / "meta.json").exists()

        result.save_verdict(tmp_path)
        assert (tmp_path / "verdict.json").exists()
        assert (tmp_path / "meta.json").exists()


class TestEngineRunParams:
    def test_run_result_uses_custom_output_dir(self, tmp_path: Path) -> None:
        custom_dir = tmp_path / "custom" / "run-00"
        result = RunResult(
            scenario="test",
            backend="claude",
            timestamp="2026-04-20T10-00-00",
            session_log="log",
            filesystem_json='{"files": []}',
            tool_calls_jsonl='{"tool": "Bash"}\n',
            verdict_json='{"criteria": [], "observations": [], "summary": "ok"}',
            meta={"backend": "claude"},
        )
        result.save(custom_dir)
        assert (custom_dir / "session.log").read_text() == "log"
        assert (custom_dir / "verdict.json").exists()
        assert (custom_dir / "meta.json").exists()

    def test_run_result_nested_dir_created(self, tmp_path: Path) -> None:
        deep_dir = tmp_path / "a" / "b" / "c" / "run-05"
        result = RunResult(
            scenario="test",
            backend="claude",
            timestamp="2026-04-20T10-00-00",
            session_log="log",
            filesystem_json='{"files": []}',
            tool_calls_jsonl='{"tool": "Bash"}\n',
            verdict_json='{"criteria": [], "observations": [], "summary": "ok"}',
            meta={"backend": "claude"},
        )
        result.save(deep_dir)
        assert deep_dir.exists()
        assert (deep_dir / "session.log").exists()
