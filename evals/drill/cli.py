"""Drill CLI: run, compare, list."""

from __future__ import annotations

import os
import secrets
from pathlib import Path

import click
from dotenv import load_dotenv

PROJECT_ROOT: Path = Path(__file__).parent.parent

load_dotenv(PROJECT_ROOT / ".env")


def _set_superpowers_root_default() -> None:
    """Default SUPERPOWERS_ROOT to the parent of evals/ if not already set.

    Drill historically required contributors to export SUPERPOWERS_ROOT
    pointing at the superpowers checkout. After lifting drill into
    superpowers/evals/, the parent of PROJECT_ROOT is always the
    superpowers root, so we can supply this default automatically.

    Existing SUPERPOWERS_ROOT environment values are respected as overrides.
    """
    os.environ.setdefault("SUPERPOWERS_ROOT", str(PROJECT_ROOT.parent))


_set_superpowers_root_default()


@click.group()
def main() -> None:
    """Drill: Superpowers skill compliance benchmark."""
    pass


@main.command()
@click.argument("scenario")
@click.option("--backend", "-b", default=None, help="Backend name (e.g., claude, codex)")
@click.option("--models", "-m", default=None, help="Comma-separated backend names for sweep")
@click.option("--n", "n_runs", type=int, default=1, help="Number of repetitions per backend")
@click.option(
    "--backends-dir",
    type=click.Path(exists=True, path_type=Path),
    default=PROJECT_ROOT / "backends",
)
@click.option(
    "--scenarios-dir",
    type=click.Path(exists=True, path_type=Path),
    default=PROJECT_ROOT / "scenarios",
)
@click.option(
    "--fixtures-dir",
    type=click.Path(exists=True, path_type=Path),
    default=PROJECT_ROOT / "fixtures",
)
@click.option("--results-dir", type=click.Path(path_type=Path), default=PROJECT_ROOT / "results")
def run(
    scenario: str,
    backend: str | None,
    models: str | None,
    n_runs: int,
    backends_dir: Path,
    scenarios_dir: Path,
    fixtures_dir: Path,
    results_dir: Path,
) -> None:
    """Run a scenario against one or more backends."""
    if n_runs < 1:
        raise click.ClickException("--n must be at least 1")

    if models:
        backend_names = [b.strip() for b in models.split(",") if b.strip()]
    elif backend:
        backend_names = [backend]
    else:
        raise click.ClickException("Either --backend or --models is required")

    scenario_path = scenarios_dir / f"{scenario}.yaml"
    if not scenario_path.exists():
        raise click.ClickException(f"Scenario not found: {scenario_path}")

    sweep_id = secrets.token_hex(4)

    from drill.sweep import Sweep

    sweep = Sweep(
        scenario_path=scenario_path,
        backend_names=backend_names,
        backends_dir=backends_dir,
        fixtures_dir=fixtures_dir,
        results_dir=results_dir,
        n=n_runs,
        sweep_id=sweep_id,
    )

    total = len(backend_names) * n_runs
    click.echo(
        f"Running {scenario} | backends: {', '.join(backend_names)} | "
        f"n={n_runs} | total runs: {total} | sweep: {sweep_id}"
    )

    groups = sweep.run_all()

    for group in groups:
        passed = sum(1 for r in group.runs if r.status == "pass")
        failed = sum(1 for r in group.runs if r.status == "fail")
        errored = sum(1 for r in group.runs if r.status == "error")
        click.echo(f"\n{group.backend}: {passed} passed, {failed} failed, {errored} errors")
        if group.partial:
            click.echo("  (interrupted — partial results)")


@main.command("list")
@click.option(
    "--scenarios-dir",
    type=click.Path(exists=True, path_type=Path),
    default=PROJECT_ROOT / "scenarios",
)
def list_scenarios(scenarios_dir: Path) -> None:
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
@click.option("--sweep", "sweep_id", default=None, help="Filter by sweep ID")
@click.option(
    "--results-dir",
    type=click.Path(exists=True, path_type=Path),
    default=PROJECT_ROOT / "results",
)
def compare(scenario: str, sweep_id: str | None, results_dir: Path) -> None:
    """Compare results across backends for a scenario."""
    from drill.compare import format_compare_output, load_scenario_results

    scenario_dir = results_dir / scenario
    if not scenario_dir.exists():
        raise click.ClickException(f"No results found for: {scenario}")

    results = load_scenario_results(scenario_dir, sweep_id=sweep_id)
    if not results:
        raise click.ClickException(f"No results found for: {scenario}")

    click.echo(format_compare_output(scenario, results))
