"""Compare: load and aggregate drill results across backends and runs."""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from drill.stats import wilson_ci
from drill.verifier import Verdict


@dataclass
class BackendResult:
    backend: str
    total_runs: int
    passed_runs: int
    errored_runs: int
    avg_turns: float
    criterion_counts: dict[str, tuple[int, int]]  # criterion -> (passed, total)
    sweep_id: str | None
    timestamp: str | None
    partial: bool

    @property
    def pass_rate(self) -> float:
        if self.total_runs == 0:
            return 0.0
        return self.passed_runs / self.total_runs


def load_scenario_results(
    scenario_dir: Path,
    *,
    sweep_id: str | None = None,
) -> dict[str, BackendResult]:
    results: dict[str, BackendResult] = {}
    for backend_dir in sorted(scenario_dir.iterdir()):
        if not backend_dir.is_dir():
            continue
        timestamp_dirs = sorted(backend_dir.iterdir())
        if not timestamp_dirs:
            continue

        target_dir: Path | None = None
        if sweep_id:
            for d in timestamp_dirs:
                rg_path = d / "run-group.json"
                if rg_path.exists():
                    rg = json.loads(rg_path.read_text())
                    if rg.get("sweep_id") == sweep_id:
                        target_dir = d
                        break
        else:
            target_dir = timestamp_dirs[-1]

        if target_dir is None:
            continue

        result = _load_backend_result(backend_dir.name, target_dir)
        if result is not None:
            results[backend_dir.name] = result

    return results


def _load_backend_result(backend_name: str, timestamp_dir: Path) -> BackendResult | None:
    rg_path = timestamp_dir / "run-group.json"

    if rg_path.exists():
        return _load_new_format(backend_name, timestamp_dir, rg_path)
    elif (timestamp_dir / "verdict.json").exists():
        return _load_old_format(backend_name, timestamp_dir)
    return None


def _load_new_format(backend_name: str, timestamp_dir: Path, rg_path: Path) -> BackendResult:
    rg: dict[str, Any] = json.loads(rg_path.read_text())
    run_dirs = sorted(
        d for d in timestamp_dir.iterdir() if d.is_dir() and d.name.startswith("run-")
    )

    verdicts: list[Verdict] = []
    metas: list[dict[str, Any]] = []
    for run_dir in run_dirs:
        verdict_path = run_dir / "verdict.json"
        meta_path = run_dir / "meta.json"
        if verdict_path.exists():
            verdicts.append(Verdict.model_validate_json(verdict_path.read_text()))
        if meta_path.exists():
            metas.append(json.loads(meta_path.read_text()))

    passed_runs = sum(1 for v in verdicts if v.passed)
    errored_runs = sum(1 for r in rg.get("runs", []) if r.get("status") == "error")
    avg_turns = sum(m.get("actor_turns", 0) for m in metas) / len(metas) if metas else 0.0

    criterion_counts: dict[str, tuple[int, int]] = {}
    for v in verdicts:
        for c in v.criteria:
            prev_passed, prev_total = criterion_counts.get(c.criterion, (0, 0))
            criterion_counts[c.criterion] = (
                prev_passed + (1 if c.verdict == "pass" else 0),
                prev_total + 1,
            )

    return BackendResult(
        backend=backend_name,
        total_runs=len(verdicts),
        passed_runs=passed_runs,
        errored_runs=errored_runs,
        avg_turns=round(avg_turns, 1),
        criterion_counts=criterion_counts,
        sweep_id=rg.get("sweep_id"),
        timestamp=rg.get("timestamp"),
        partial=rg.get("partial", False),
    )


def _load_old_format(backend_name: str, timestamp_dir: Path) -> BackendResult:
    verdict = Verdict.model_validate_json((timestamp_dir / "verdict.json").read_text())
    meta: dict[str, Any] = {}
    meta_path = timestamp_dir / "meta.json"
    if meta_path.exists():
        meta = json.loads(meta_path.read_text())

    criterion_counts: dict[str, tuple[int, int]] = {}
    for c in verdict.criteria:
        criterion_counts[c.criterion] = (1 if c.verdict == "pass" else 0, 1)

    return BackendResult(
        backend=backend_name,
        total_runs=1,
        passed_runs=1 if verdict.passed else 0,
        errored_runs=0,
        avg_turns=float(meta.get("actor_turns", 0)),
        criterion_counts=criterion_counts,
        sweep_id=None,
        timestamp=None,
        partial=False,
    )


def format_compare_output(
    scenario: str,
    results: dict[str, BackendResult],
) -> str:
    if not results:
        return f"No results found for: {scenario}"

    lines: list[str] = []
    is_multi_run = any(r.total_runs > 1 for r in results.values())

    if is_multi_run:
        first = next(iter(results.values()))
        lines.append(f"Scenario: {scenario}")
        if first.sweep_id:
            sweep_label = f"Sweep: {first.sweep_id}"
            if first.timestamp:
                date_str = first.timestamp.split("T")[0]
                sweep_label += f" | {date_str}"
            lines.append(sweep_label)
        lines.append("")

        header = f"{'':40s}"
        sub_header = f"{'':40s}"
        for name, r in results.items():
            header += f" {name:>12s}"
            sub_header += f" {'(n=' + str(r.total_runs) + ')':>12s}"
        lines.append(header)
        lines.append(sub_header)
        lines.append("-" * len(header))

        rate_line = f"{'Overall pass rate':40s}"
        ci_line = f"{'  95% CI':40s}"
        for r in results.values():
            pct = f"{r.pass_rate * 100:.1f}%"
            rate_line += f" {pct:>12s}"
            lo, hi = wilson_ci(r.passed_runs, r.total_runs)
            ci_str = f"[{lo * 100:.0f}, {hi * 100:.0f}]"
            ci_line += f" {ci_str:>12s}"
        lines.append(rate_line)
        lines.append(ci_line)
        lines.append("")

        all_criteria: list[str] = []
        seen: set[str] = set()
        for r in results.values():
            for crit in r.criterion_counts:
                if crit not in seen:
                    all_criteria.append(crit)
                    seen.add(crit)

        for crit in all_criteria:
            crit_line = f"{crit[:40]:40s}"
            for r in results.values():
                passed, total = r.criterion_counts.get(crit, (0, 0))
                crit_line += f" {str(passed) + '/' + str(total):>12s}"
            lines.append(crit_line)

        lines.append("")
        avg_line = f"{'Avg turns':40s}"
        err_line = f"{'Errors':40s}"
        for r in results.values():
            avg_line += f" {str(r.avg_turns):>12s}"
            err_line += f" {str(r.errored_runs):>12s}"
        lines.append(avg_line)
        lines.append(err_line)

        if any(r.total_runs < 10 for r in results.values()):
            lines.append("")
            lines.append("Note: CI is wide due to small sample size; consider --n 10+")

        if any(r.partial for r in results.values()):
            lines.append("")
            lines.append("Warning: Sweep was interrupted — results are incomplete.")

    else:
        lines.append(f"Scenario: {scenario}")
        lines.append("")
        lines.append(f"{'Backend':20s} {'Result':8s} {'Score':7s} {'Turns':5s}")
        lines.append("-" * 42)
        for name, r in results.items():
            result_str = "PASS" if r.passed_runs == r.total_runs else "FAIL"
            total_criteria = sum(t for _, t in r.criterion_counts.values())
            passed_criteria = sum(p for p, _ in r.criterion_counts.values())
            score = f"{passed_criteria}/{total_criteria}"
            turns_str = (
                str(int(r.avg_turns)) if r.avg_turns == int(r.avg_turns) else str(r.avg_turns)
            )
            lines.append(f"{name:20s} {result_str:8s} {score:7s} {turns_str:5s}")

        all_criteria = []
        seen = set()
        for r in results.values():
            for crit in r.criterion_counts:
                if crit not in seen:
                    all_criteria.append(crit)
                    seen.add(crit)

        lines.append("")
        header = f"{'':40s}"
        for name in results:
            header += f" {name:>12s}"
        lines.append(header)
        lines.append("-" * len(header))
        for crit in all_criteria:
            crit_line = f"{crit[:40]:40s}"
            for r in results.values():
                p, t = r.criterion_counts.get(crit, (0, 0))
                icon = "PASS" if p == t and t > 0 else "FAIL"
                crit_line += f" {icon:>12s}"
            lines.append(crit_line)

    return "\n".join(lines)
