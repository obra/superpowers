"""Sweep orchestrator: runs scenarios N times across multiple backends."""

from __future__ import annotations

import glob as glob_mod
import json
import shutil
import time
from dataclasses import asdict, dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any

import yaml

from drill.engine import Engine, RunResult
from drill.verifier import Verdict


@dataclass
class RunStatus:
    index: int
    status: str  # "pass", "fail", "error"
    duration: float
    error: str | None = None


@dataclass
class RunGroup:
    scenario: str
    backend: str
    n: int
    timestamp: str
    sweep_id: str
    runs: list[RunStatus] = field(default_factory=list)
    partial: bool = False


def write_run_group(group: RunGroup, output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    data: dict[str, Any] = {
        "scenario": group.scenario,
        "backend": group.backend,
        "n": group.n,
        "timestamp": group.timestamp,
        "sweep_id": group.sweep_id,
        "partial": group.partial,
        "runs": [
            {k: v for k, v in asdict(r).items() if k != "error" or v is not None}
            for r in group.runs
        ],
    }
    (output_dir / "run-group.json").write_text(json.dumps(data, indent=2))


class Sweep:
    def __init__(
        self,
        scenario_path: Path,
        backend_names: list[str],
        backends_dir: Path,
        fixtures_dir: Path,
        results_dir: Path,
        n: int,
        sweep_id: str,
    ) -> None:
        self.scenario_path = scenario_path
        self.backend_names = backend_names
        self.backends_dir = backends_dir
        self.fixtures_dir = fixtures_dir
        self.results_dir = results_dir
        self.n = n
        self.sweep_id = sweep_id
        self._scenario_name_cache: str | None = None

    def validate_backends(self) -> None:
        for name in self.backend_names:
            path = self.backends_dir / f"{name}.yaml"
            if not path.exists():
                raise FileNotFoundError(f"Backend config not found: {path}")

    def run_all(self) -> list[RunGroup]:
        self.validate_backends()
        groups: list[RunGroup] = []
        for backend_name in self.backend_names:
            group = self._run_backend(backend_name)
            groups.append(group)
        return groups

    def _run_backend(self, backend_name: str) -> RunGroup:
        timestamp = datetime.now().strftime("%Y-%m-%dT%H-%M-%S")
        group_dir = (
            self.results_dir / self.scenario_name / backend_name / f"{timestamp}-{self.sweep_id}"
        )
        group_dir.mkdir(parents=True, exist_ok=True)

        group = RunGroup(
            scenario=self.scenario_name,
            backend=backend_name,
            n=self.n,
            timestamp=timestamp,
            sweep_id=self.sweep_id,
        )

        try:
            for i in range(self.n):
                run_status = self._run_single(backend_name, group_dir, i, timestamp)
                group.runs.append(run_status)
        except KeyboardInterrupt:
            group.partial = True
        finally:
            write_run_group(group, group_dir)

        return group

    def _run_single(
        self, backend_name: str, group_dir: Path, index: int, timestamp: str
    ) -> RunStatus:
        run_suffix = f"-run-{index:02d}"
        run_dir = group_dir / f"run-{index:02d}"
        start = time.time()

        try:
            engine = Engine(
                scenario_path=self.scenario_path,
                backend_name=backend_name,
                backends_dir=self.backends_dir,
                fixtures_dir=self.fixtures_dir,
                results_dir=self.results_dir,
            )
            result: RunResult = engine.run(output_dir=run_dir, run_suffix=run_suffix)
            verdict = Verdict.model_validate_json(result.verdict_json)
            duration = time.time() - start
            status = "pass" if verdict.passed else "fail"
            return RunStatus(index=index, status=status, duration=round(duration, 1))
        except KeyboardInterrupt:
            raise
        except Exception as e:
            duration = time.time() - start
            return RunStatus(
                index=index,
                status="error",
                duration=round(duration, 1),
                error=str(e),
            )
        finally:
            pattern = f"/tmp/drill-*-{timestamp}{run_suffix}"
            for d in glob_mod.glob(pattern):
                p = Path(d)
                if p.is_dir():
                    shutil.rmtree(p, ignore_errors=True)

    @property
    def scenario_name(self) -> str:
        if self._scenario_name_cache is None:
            with open(self.scenario_path) as f:
                data = yaml.safe_load(f)
            self._scenario_name_cache = data["scenario"]
        return self._scenario_name_cache
