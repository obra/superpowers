"""Tests for compare module."""

from __future__ import annotations

import json
from pathlib import Path

from drill.compare import BackendResult, format_compare_output, load_scenario_results


def _write_verdict(path: Path, criteria: list[dict[str, str]]) -> None:
    verdict = {
        "criteria": criteria,
        "observations": ["test obs"],
        "summary": "ok",
    }
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(verdict))


def _write_meta(path: Path, **kwargs: object) -> None:
    meta = {"scenario": "test", "backend": "claude", "actor_turns": 4, **kwargs}
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(meta))


def _write_run_group(
    path: Path, n: int, runs: list[dict[str, object]], sweep_id: str = "abc12345"
) -> None:
    data = {
        "scenario": "test",
        "backend": "claude",
        "n": n,
        "timestamp": "2026-04-20T14-30-00",
        "sweep_id": sweep_id,
        "partial": False,
        "runs": runs,
    }
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data))


class TestLoadScenarioResults:
    def test_loads_new_format_single_run(self, tmp_path: Path) -> None:
        scenario_dir = tmp_path / "test-scenario" / "claude" / "2026-04-20T14-30-00-abc12345"
        run_dir = scenario_dir / "run-00"
        criteria = [{"criterion": "c1", "verdict": "pass", "evidence": "e", "rationale": "r"}]
        _write_verdict(run_dir / "verdict.json", criteria)
        _write_meta(run_dir / "meta.json")
        _write_run_group(
            scenario_dir / "run-group.json",
            n=1,
            runs=[{"index": 0, "status": "pass", "duration": 10.0}],
        )
        results = load_scenario_results(tmp_path / "test-scenario")
        assert "claude" in results
        assert results["claude"].total_runs == 1
        assert results["claude"].passed_runs == 1

    def test_loads_new_format_multi_run(self, tmp_path: Path) -> None:
        scenario_dir = tmp_path / "test-scenario" / "claude" / "2026-04-20T14-30-00-abc12345"
        for i in range(3):
            run_dir = scenario_dir / f"run-{i:02d}"
            verdict_val = "pass" if i < 2 else "fail"
            criteria = [
                {"criterion": "c1", "verdict": verdict_val, "evidence": "e", "rationale": "r"}
            ]
            _write_verdict(run_dir / "verdict.json", criteria)
            _write_meta(run_dir / "meta.json")
        _write_run_group(
            scenario_dir / "run-group.json",
            n=3,
            runs=[
                {"index": 0, "status": "pass", "duration": 10.0},
                {"index": 1, "status": "pass", "duration": 11.0},
                {"index": 2, "status": "fail", "duration": 12.0},
            ],
        )
        results = load_scenario_results(tmp_path / "test-scenario")
        assert results["claude"].total_runs == 3
        assert results["claude"].passed_runs == 2
        assert len(results["claude"].criterion_counts) == 1
        assert results["claude"].criterion_counts["c1"] == (2, 3)

    def test_loads_old_format_backwards_compat(self, tmp_path: Path) -> None:
        scenario_dir = tmp_path / "test-scenario" / "claude" / "2026-04-20T14-30-00"
        criteria = [{"criterion": "c1", "verdict": "pass", "evidence": "e", "rationale": "r"}]
        _write_verdict(scenario_dir / "verdict.json", criteria)
        _write_meta(scenario_dir / "meta.json")
        results = load_scenario_results(tmp_path / "test-scenario")
        assert "claude" in results
        assert results["claude"].total_runs == 1
        assert results["claude"].passed_runs == 1

    def test_sweep_filter(self, tmp_path: Path) -> None:
        base = tmp_path / "test-scenario" / "claude"
        # Sweep A
        dir_a = base / "2026-04-20T14-30-00-aaaa1111"
        _write_run_group(
            dir_a / "run-group.json",
            n=1,
            runs=[{"index": 0, "status": "pass", "duration": 10.0}],
            sweep_id="aaaa1111",
        )
        criteria = [{"criterion": "c1", "verdict": "pass", "evidence": "e", "rationale": "r"}]
        _write_verdict(dir_a / "run-00" / "verdict.json", criteria)
        _write_meta(dir_a / "run-00" / "meta.json")
        # Sweep B
        dir_b = base / "2026-04-20T15-00-00-bbbb2222"
        _write_run_group(
            dir_b / "run-group.json",
            n=1,
            runs=[{"index": 0, "status": "fail", "duration": 10.0}],
            sweep_id="bbbb2222",
        )
        criteria_b = [{"criterion": "c1", "verdict": "fail", "evidence": "e", "rationale": "r"}]
        _write_verdict(dir_b / "run-00" / "verdict.json", criteria_b)
        _write_meta(dir_b / "run-00" / "meta.json")

        results_a = load_scenario_results(tmp_path / "test-scenario", sweep_id="aaaa1111")
        assert results_a["claude"].passed_runs == 1
        results_b = load_scenario_results(tmp_path / "test-scenario", sweep_id="bbbb2222")
        assert results_b["claude"].passed_runs == 0


class TestBackendResult:
    def test_pass_rate(self) -> None:
        br = BackendResult(
            backend="claude",
            total_runs=10,
            passed_runs=8,
            errored_runs=0,
            avg_turns=4.2,
            criterion_counts={"c1": (10, 10), "c2": (8, 10)},
            sweep_id="abc12345",
            timestamp="2026-04-20T14-30-00",
            partial=False,
        )
        assert br.pass_rate == 0.8

    def test_pass_rate_zero_runs(self) -> None:
        br = BackendResult(
            backend="claude",
            total_runs=0,
            passed_runs=0,
            errored_runs=0,
            avg_turns=0.0,
            criterion_counts={},
            sweep_id=None,
            timestamp=None,
            partial=False,
        )
        assert br.pass_rate == 0.0


def _make_backend_result(
    backend: str = "claude",
    total_runs: int = 10,
    passed_runs: int = 8,
    errored_runs: int = 0,
    avg_turns: float = 4.2,
    criterion_counts: dict[str, tuple[int, int]] | None = None,
    sweep_id: str | None = "abc12345",
    timestamp: str | None = "2026-04-20T14-30-00",
    partial: bool = False,
) -> BackendResult:
    return BackendResult(
        backend=backend,
        total_runs=total_runs,
        passed_runs=passed_runs,
        errored_runs=errored_runs,
        avg_turns=avg_turns,
        criterion_counts=criterion_counts or {"c1": (passed_runs, total_runs)},
        sweep_id=sweep_id,
        timestamp=timestamp,
        partial=partial,
    )


class TestFormatCompareOutput:
    def test_no_results(self) -> None:
        output = format_compare_output("test", {})
        assert "No results found" in output

    def test_multi_run_includes_pass_rate_and_ci(self) -> None:
        results = {"claude": _make_backend_result(total_runs=10, passed_runs=8)}
        output = format_compare_output("test", results)
        assert "Overall pass rate" in output
        assert "95% CI" in output
        assert "80.0%" in output

    def test_multi_run_sweep_header_includes_date(self) -> None:
        results = {"claude": _make_backend_result()}
        output = format_compare_output("test", results)
        assert "Sweep: abc12345 | 2026-04-20" in output

    def test_single_run_simple_table(self) -> None:
        results = {
            "claude": _make_backend_result(
                total_runs=1,
                passed_runs=1,
                criterion_counts={"c1": (1, 1)},
            )
        }
        output = format_compare_output("test", results)
        assert "PASS" in output
        assert "Overall pass rate" not in output

    def test_partial_warning(self) -> None:
        results = {"claude": _make_backend_result(partial=True)}
        output = format_compare_output("test", results)
        assert "incomplete" in output.lower() or "interrupted" in output.lower()

    def test_small_n_note(self) -> None:
        results = {"claude": _make_backend_result(total_runs=5, passed_runs=3)}
        output = format_compare_output("test", results)
        assert "--n 10+" in output
