"""Engine: orchestrates the full Drill run lifecycle."""

from __future__ import annotations

import json
import os
import re
import subprocess
import time
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any

import yaml

from drill.actor import Actor
from drill.assertions import AssertionResult, run_verify_assertions
from drill.backend import load_backend
from drill.normalizer import (
    NORMALIZERS,
    collect_new_logs,
    filter_codex_logs_by_cwd,
    snapshot_log_dir,
)
from drill.session import TmuxSession
from drill.setup import run_assertions, run_helpers
from drill.verifier import Verifier


@dataclass
class VerifyConfig:
    criteria: list[str] = field(default_factory=list)
    assertions: list[str] = field(default_factory=list)
    observe: bool = False


@dataclass
class ScenarioConfig:
    scenario: str
    description: str
    user_posture: str
    setup: dict[str, Any]
    turns: list[dict[str, Any]]
    limits: dict[str, Any]
    verify: VerifyConfig

    @classmethod
    def from_yaml(cls, path: Path) -> ScenarioConfig:
        with open(path) as f:
            data = yaml.safe_load(f)
        verify_data = data.get("verify", {})
        return cls(
            scenario=data["scenario"],
            description=data.get("description", ""),
            user_posture=data.get("user_posture", "naive"),
            setup=data.get("setup", {}),
            turns=data.get("turns", []),
            limits=data.get("limits", {"max_turns": 20, "turn_timeout": 120}),
            verify=VerifyConfig(
                criteria=verify_data.get("criteria", []),
                assertions=verify_data.get("assertions", []),
                observe=verify_data.get("observe", False),
            ),
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
    meta: dict[str, Any]

    def save_artifacts(self, output_dir: Path) -> None:
        output_dir.mkdir(parents=True, exist_ok=True)
        (output_dir / "session.log").write_text(self.session_log)
        (output_dir / "filesystem.json").write_text(self.filesystem_json)
        (output_dir / "tool_calls.jsonl").write_text(self.tool_calls_jsonl)

    def save_verdict(self, output_dir: Path) -> None:
        output_dir.mkdir(parents=True, exist_ok=True)
        (output_dir / "verdict.json").write_text(self.verdict_json)
        (output_dir / "meta.json").write_text(json.dumps(self.meta, indent=2))

    def save(self, output_dir: Path) -> None:
        self.save_artifacts(output_dir)
        self.save_verdict(output_dir)


def snapshot_filesystem(workdir: Path) -> str:
    files: list[str] = []
    for f in sorted(workdir.rglob("*")):
        if ".git" in f.parts:
            continue
        if f.is_file():
            files.append(str(f.relative_to(workdir)))
    git_status = _git_cmd(workdir, ["git", "status", "--short"])
    branch = _git_cmd(workdir, ["git", "branch", "--show-current"])
    worktree_list = _git_cmd(workdir, ["git", "worktree", "list"])
    return json.dumps(
        {
            "files": files,
            "git_status": git_status,
            "branch": branch,
            "worktree_list": worktree_list,
        },
        indent=2,
    )


class Engine:
    def __init__(
        self,
        scenario_path: Path,
        backend_name: str,
        backends_dir: Path,
        fixtures_dir: Path,
        results_dir: Path,
    ) -> None:
        self.scenario = ScenarioConfig.from_yaml(scenario_path)
        self.backend = load_backend(backend_name, backends_dir)
        self.fixtures_dir = fixtures_dir
        self.results_dir = results_dir

    def run(self, *, output_dir: Path | None = None, run_suffix: str = "") -> RunResult:
        start_time = time.time()
        timestamp = datetime.now().strftime("%Y-%m-%dT%H-%M-%S")
        self.backend.validate_env()
        workdir = Path(f"/tmp/drill-{self.scenario.scenario}-{timestamp}{run_suffix}")
        self._setup(workdir)
        actual_workdir = workdir
        override = self.scenario.setup.get("workdir_override")
        if override:
            resolved = override.replace("${WORKDIR_NAME}", workdir.name)
            actual_workdir = (workdir / resolved).resolve()
        # Run assertions in the actual workdir (after override)
        assertions = self.scenario.setup.get("assertions", [])
        if assertions:
            run_assertions(assertions, actual_workdir)
        session_name = f"drill-{self.scenario.scenario}-{timestamp}{run_suffix}"
        session = TmuxSession(name=session_name, cols=self.backend.cols, rows=self.backend.rows)
        log_dir = self._resolve_log_dir(actual_workdir)
        log_snapshot = snapshot_log_dir(log_dir) if log_dir else set()
        session_log, actor_turns = self._run_session(session, actual_workdir)
        filesystem_json = snapshot_filesystem(actual_workdir)
        tool_calls = self._collect_tool_calls(log_dir, log_snapshot, actual_workdir)
        tool_calls_jsonl = "\n".join(json.dumps(tc) for tc in tool_calls)

        # Write artifacts to disk before assertions (assertions read from disk)
        if output_dir is None:
            output_dir = self.results_dir / self.scenario.scenario / self.backend.name / timestamp
        output_dir.mkdir(parents=True, exist_ok=True)
        (output_dir / "session.log").write_text(session_log)
        (output_dir / "filesystem.json").write_text(filesystem_json)
        (output_dir / "tool_calls.jsonl").write_text(tool_calls_jsonl)

        # Run deterministic assertions
        assertion_results: list[AssertionResult] = []
        if self.scenario.verify.assertions:
            if not tool_calls_jsonl.strip():
                assertion_results = [
                    AssertionResult(
                        command="<pre-check>",
                        passed=False,
                        exit_code=1,
                        stdout="",
                        stderr="tool_calls.jsonl is empty — session may have crashed",
                    )
                ]
            else:
                assertion_results = run_verify_assertions(
                    self.scenario.verify.assertions,
                    output_dir,
                    actual_workdir,
                )

        # Run LLM verifier
        verifier = Verifier()
        verdict = verifier.verify(
            session_log=session_log,
            filesystem_json=filesystem_json,
            tool_calls_jsonl=tool_calls_jsonl,
            criteria=self.scenario.verify.criteria,
        )

        # Merge assertion results into verdict
        for ar in assertion_results:
            verdict.criteria.append(ar.to_criterion_result())

        duration = time.time() - start_time
        meta: dict[str, Any] = {
            "scenario": self.scenario.scenario,
            "backend": self.backend.name,
            "backend_model": self.backend.model,
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
        # Write verdict + meta (artifacts already on disk)
        (output_dir / "verdict.json").write_text(result.verdict_json)
        (output_dir / "meta.json").write_text(json.dumps(result.meta, indent=2))
        return result

    def _setup(self, workdir: Path) -> None:
        # Scenario helpers first (create_base_repo needs to run before anything else)
        helpers = self.scenario.setup.get("helpers", [])
        run_helpers(helpers, workdir, self.fixtures_dir)
        # Backend pre_run hooks after (e.g., codex symlink needs workdir to exist)
        hooks_needing_superpowers_root = {"symlink_superpowers", "link_gemini_extension"}
        for hook_name in self.backend.hooks.get("pre_run", []):
            from setup_helpers import HELPER_REGISTRY

            hook = HELPER_REGISTRY.get(hook_name)
            if hook and hook_name in hooks_needing_superpowers_root:
                hook(workdir, os.environ["SUPERPOWERS_ROOT"])  # ty: ignore[invalid-argument-type, too-many-positional-arguments, missing-argument]
            elif hook:
                hook(workdir)  # ty: ignore[invalid-argument-type, missing-argument]

    def _run_session(self, session: TmuxSession, workdir: Path) -> tuple[str, int]:
        session.create()
        try:
            cmd = self.backend.build_command(str(workdir))
            session.launch(cmd, str(workdir))
            self._wait_for_ready(session, timeout=self.backend.startup_timeout)
            actor = Actor()
            intents = [t["intent"] for t in self.scenario.turns]
            actor.build_system_prompt(posture=self.scenario.user_posture, intents=intents)
            max_turns = self.scenario.limits.get("max_turns", 20)
            turn_timeout = self.backend.turn_timeout or self.scenario.limits.get(
                "turn_timeout", 120
            )
            all_captures: list[str] = []
            turn_count = 0
            for turn in range(max_turns):
                self._wait_for_ready(session, timeout=turn_timeout)
                capture = session.capture()
                all_captures.append(f"=== Turn {turn + 1} ===\n{capture}")
                actor.append_capture(f"Terminal output:\n{capture}")
                action = actor.decide()
                turn_count += 1
                if action.action == "done" or action.action == "stuck":
                    break
                elif action.action == "type":
                    session.send_keys(action.text or "")
                elif action.action == "key":
                    session.send_special_key(action.key or "")
            final_capture = session.capture()
            all_captures.append(f"=== Final ===\n{final_capture}")
            if self.backend.shutdown.startswith("<<KEY:"):
                key = self.backend.shutdown[6:-2]
                session.send_special_key(key)
            else:
                session.send_keys(self.backend.shutdown)
            time.sleep(3)
            return "\n".join(all_captures), turn_count
        finally:
            session.kill()

    def _wait_for_ready(self, session: TmuxSession, timeout: float) -> None:
        """Wait until the agent's terminal is ready for Actor input.

        Returns when the terminal is quiescent AND matches the backend's
        ready pattern. If the backend's busy pattern matches (spinner
        visible, "Thinking...", timer counting), the deadline is extended
        by small increments up to `max_busy_seconds` total. This prevents
        the Actor from interrupting long-running subagent work (multi-file
        implementation, parallel dispatch, etc.).

        Exits silently if the final deadline (timeout + busy extensions)
        passes without reaching a ready state.
        """
        quiescence = self.backend.quiescence_seconds
        max_busy_extension = float(self.backend.max_busy_seconds)
        start = time.time()
        deadline = start + timeout
        total_busy_extended = 0.0
        last_output: str = ""
        stable_since: float | None = None

        while time.time() < deadline:
            current = session.capture()
            lines = current.strip().split("\n")
            is_busy = any(self.backend.is_busy_line(line) for line in lines)

            # If the agent is actively busy, extend the deadline so we
            # don't time out mid-subagent-work. Extensions are capped at
            # max_busy_seconds total across all extensions combined.
            if is_busy:
                remaining_budget = max_busy_extension - total_busy_extended
                if remaining_budget > 0:
                    # Ensure we have at least 30 more seconds of headroom.
                    needed = 30.0 - (deadline - time.time())
                    if needed > 0:
                        grant = min(needed, remaining_budget)
                        deadline += grant
                        total_busy_extended += grant

            # Strip animated elements so they don't reset the quiescence timer:
            # - Time counters: "Thinking... (4m 1s)" or "(esc to cancel, 4m 1s)"
            # - Braille spinner characters that rotate every frame
            normalized = re.sub(r"\((?:esc to cancel, )?(?:\d+[hms]\s*)+\)", "(…)", current)
            normalized = re.sub(r"[⠇⠏⠋⠙⠹⠸⠼⠴⠦⠧⠶⠾⠽⠻⠿]", "·", normalized)
            if normalized != last_output:
                last_output = normalized
                stable_since = time.time()
            elif stable_since and (time.time() - stable_since) >= quiescence:
                if is_busy:
                    stable_since = None  # Reset — agent is still working
                elif any(self.backend.is_ready_line(line) for line in lines):
                    return
            time.sleep(0.5)

    def _resolve_log_dir(self, workdir: Path) -> Path | None:
        """Resolve the log directory for the given backend and workdir.

        Claude Code stores logs at ~/.claude/projects/<encoded-path>/
        where the path is the real workdir with / replaced by -.
        Codex stores logs at ~/.codex/sessions/.
        """
        if self.backend.family == "claude":
            real_workdir = workdir.resolve()
            encoded = str(real_workdir).replace("/", "-")
            log_dir = Path.home() / ".claude" / "projects" / encoded
            return log_dir
        elif self.backend.family == "codex":
            # Codex stores at ~/.codex/sessions/YYYY/MM/DD/rollout-*.jsonl
            return Path.home() / ".codex" / "sessions"
        elif self.backend.family == "gemini":
            # Gemini stores at ~/.gemini/tmp/<project-name>/chats/session-*.json
            # Project name is the workdir basename, lowercased
            project = workdir.resolve().name.lower()
            return Path.home() / ".gemini" / "tmp" / project
        pattern = self.backend.session_logs.get("pattern", "")
        if not pattern:
            return None
        expanded = os.path.expanduser(pattern)
        parts = expanded.split("*")[0].rstrip("/")
        return Path(parts)

    def _collect_tool_calls(
        self, log_dir: Path | None, snapshot: set[str], workdir: Path
    ) -> list[dict[str, Any]]:
        if log_dir is None:
            return []
        new_files = collect_new_logs(log_dir, snapshot)
        if self.backend.family == "codex":
            new_files = filter_codex_logs_by_cwd(new_files, str(workdir.resolve()))
        normalizer = NORMALIZERS.get(self.backend.family)
        if not normalizer:
            return []
        results: list[dict[str, Any]] = []
        for log_file in new_files:
            results.extend(normalizer(log_file.read_text()))
        return results


def _git_cmd(workdir: Path, cmd: list[str]) -> str:
    result = subprocess.run(cmd, cwd=workdir, capture_output=True, text=True)
    return result.stdout.strip()
