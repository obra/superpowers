"""Tests for Sweep orchestrator."""

from __future__ import annotations

import json
from dataclasses import asdict
from pathlib import Path
from unittest.mock import patch

from drill.engine import Engine, RunResult
from drill.sweep import RunGroup, RunStatus, Sweep, write_run_group


class TestRunStatus:
    def test_pass_status(self) -> None:
        rs = RunStatus(index=0, status="pass", duration=10.5)
        assert rs.error is None
        assert rs.status == "pass"

    def test_error_status(self) -> None:
        rs = RunStatus(index=2, status="error", duration=1.2, error="tmux crashed")
        assert rs.error == "tmux crashed"

    def test_serializes_to_dict(self) -> None:
        rs = RunStatus(index=0, status="pass", duration=10.5)
        d = asdict(rs)
        assert d["index"] == 0
        assert d["status"] == "pass"
        assert d["duration"] == 10.5
        assert d["error"] is None


class TestRunGroup:
    def test_creates_with_defaults(self) -> None:
        rg = RunGroup(
            scenario="test",
            backend="claude",
            n=3,
            timestamp="2026-04-20T14-30-00",
            sweep_id="abc12345",
            runs=[],
        )
        assert rg.partial is False

    def test_partial_flag(self) -> None:
        rg = RunGroup(
            scenario="test",
            backend="claude",
            n=3,
            timestamp="2026-04-20T14-30-00",
            sweep_id="abc12345",
            runs=[RunStatus(index=0, status="pass", duration=10.0)],
            partial=True,
        )
        assert rg.partial is True
        assert len(rg.runs) == 1


class TestWriteRunGroup:
    def test_writes_json(self, tmp_path: Path) -> None:
        rg = RunGroup(
            scenario="test-scenario",
            backend="claude",
            n=2,
            timestamp="2026-04-20T14-30-00",
            sweep_id="abc12345",
            runs=[
                RunStatus(index=0, status="pass", duration=100.0),
                RunStatus(index=1, status="fail", duration=95.0),
            ],
        )
        write_run_group(rg, tmp_path)
        path = tmp_path / "run-group.json"
        assert path.exists()
        data = json.loads(path.read_text())
        assert data["scenario"] == "test-scenario"
        assert data["sweep_id"] == "abc12345"
        assert data["partial"] is False
        assert len(data["runs"]) == 2
        assert data["runs"][0]["status"] == "pass"
        assert data["runs"][1]["status"] == "fail"

    def test_writes_partial(self, tmp_path: Path) -> None:
        rg = RunGroup(
            scenario="test",
            backend="claude",
            n=5,
            timestamp="2026-04-20T14-30-00",
            sweep_id="abc12345",
            runs=[RunStatus(index=0, status="pass", duration=100.0)],
            partial=True,
        )
        write_run_group(rg, tmp_path)
        data = json.loads((tmp_path / "run-group.json").read_text())
        assert data["partial"] is True
        assert len(data["runs"]) == 1

    def test_omits_null_errors(self, tmp_path: Path) -> None:
        rg = RunGroup(
            scenario="test",
            backend="claude",
            n=1,
            timestamp="2026-04-20T14-30-00",
            sweep_id="abc12345",
            runs=[RunStatus(index=0, status="pass", duration=50.0)],
        )
        write_run_group(rg, tmp_path)
        data = json.loads((tmp_path / "run-group.json").read_text())
        run_data = data["runs"][0]
        assert "error" not in run_data


class TestSweepIntegration:
    def test_full_sweep_writes_run_group(self, tmp_path: Path) -> None:
        """Test that Sweep creates run dirs and writes run-group.json."""
        scenario_file = tmp_path / "scenarios" / "test.yaml"
        scenario_file.parent.mkdir(parents=True)
        scenario_file.write_text(
            "scenario: test-scenario\n"
            "description: test\n"
            "user_posture: naive\n"
            "setup: {}\n"
            "turns:\n  - intent: do the thing\n"
            "limits:\n  max_turns: 5\n"
            "verify:\n  criteria:\n    - thing was done\n"
        )

        backends_dir = tmp_path / "backends"
        backends_dir.mkdir()
        (backends_dir / "mock-backend.yaml").write_text(
            "name: mock-backend\n"
            "cli: echo\n"
            "args: []\n"
            "required_env: []\n"
            "hooks:\n  pre_run: []\n  post_run: []\n"
            "shutdown: /exit\n"
            "idle:\n  quiescence_seconds: 1\n  ready_pattern: '.'\n"
            "startup_timeout: 5\n"
            "terminal:\n  cols: 80\n  rows: 24\n"
            "session_logs: {}\n"
        )

        results_dir = tmp_path / "results"
        fixtures_dir = tmp_path / "fixtures"
        fixtures_dir.mkdir()

        fake_verdict = json.dumps(
            {
                "criteria": [
                    {
                        "criterion": "thing was done",
                        "verdict": "pass",
                        "evidence": "yes",
                        "rationale": "it was done",
                    }
                ],
                "observations": [],
                "summary": "ok",
            }
        )

        fake_result = RunResult(
            scenario="test-scenario",
            backend="mock-backend",
            timestamp="2026-04-20T14-30-00",
            session_log="log",
            filesystem_json='{"files": []}',
            tool_calls_jsonl='{"tool": "Bash"}',
            verdict_json=fake_verdict,
            meta={"actor_turns": 3},
        )

        sweep = Sweep(
            scenario_path=scenario_file,
            backend_names=["mock-backend"],
            backends_dir=backends_dir,
            fixtures_dir=fixtures_dir,
            results_dir=results_dir,
            n=3,
            sweep_id="test1234",
        )

        with patch.object(Engine, "run", return_value=fake_result):
            groups = sweep.run_all()

        assert len(groups) == 1
        group = groups[0]
        assert group.scenario == "test-scenario"
        assert len(group.runs) == 3
        assert all(r.status == "pass" for r in group.runs)
        assert group.partial is False

        # Verify run-group.json was written
        scenario_results = results_dir / "test-scenario" / "mock-backend"
        assert scenario_results.exists()
        group_dirs = list(scenario_results.iterdir())
        assert len(group_dirs) == 1
        rg_path = group_dirs[0] / "run-group.json"
        assert rg_path.exists()
        rg_data = json.loads(rg_path.read_text())
        assert rg_data["sweep_id"] == "test1234"
        assert len(rg_data["runs"]) == 3
