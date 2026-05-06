"""Post-session deterministic assertions for drill scenarios."""

from __future__ import annotations

import os
import subprocess
from dataclasses import dataclass
from pathlib import Path

from drill.verifier import CriterionResult


@dataclass
class AssertionResult:
    command: str
    passed: bool
    exit_code: int
    stdout: str
    stderr: str

    def to_criterion_result(self) -> CriterionResult:
        evidence = f"exit code {self.exit_code}"
        if self.stdout:
            evidence += f"\nstdout: {self.stdout}"
        if self.stderr:
            evidence += f"\nstderr: {self.stderr}"
        return CriterionResult(
            criterion=f"[assertion] {self.command}",
            verdict="pass" if self.passed else "fail",
            evidence=evidence,
            rationale="Deterministic assertion " + ("passed" if self.passed else "failed"),
            source="assertion",
        )


def run_verify_assertions(
    assertions: list[str],
    results_dir: Path,
    workdir: Path,
    *,
    timeout_seconds: int = 10,
) -> list[AssertionResult]:
    bin_dir = Path(__file__).parent.parent / "bin"
    env = {
        **os.environ,
        "DRILL_WORKDIR": str(workdir),
        "PATH": f"{bin_dir}:{os.environ.get('PATH', '')}",
    }
    results: list[AssertionResult] = []
    for cmd in assertions:
        try:
            proc = subprocess.run(
                ["bash", "-c", cmd],
                cwd=results_dir,
                capture_output=True,
                text=True,
                env=env,
                timeout=timeout_seconds,
            )
            results.append(
                AssertionResult(
                    command=cmd,
                    passed=proc.returncode == 0,
                    exit_code=proc.returncode,
                    stdout=proc.stdout.strip(),
                    stderr=proc.stderr.strip(),
                )
            )
        except subprocess.TimeoutExpired:
            results.append(
                AssertionResult(
                    command=cmd,
                    passed=False,
                    exit_code=124,
                    stdout="",
                    stderr=f"Timed out after {timeout_seconds}s",
                )
            )
        except Exception as e:
            results.append(
                AssertionResult(
                    command=cmd,
                    passed=False,
                    exit_code=-1,
                    stdout="",
                    stderr=str(e),
                )
            )
    return results
