"""Backend config loader and command builder."""

from __future__ import annotations

import os
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import yaml


@dataclass
class Backend:
    name: str
    cli: str
    args: list[str]
    required_env: list[str]
    hooks: dict[str, list[str]]
    shutdown: str
    idle: dict[str, Any]
    startup_timeout: int
    terminal: dict[str, int]
    session_logs: dict[str, str]
    turn_timeout: int | None = None
    busy_pattern: str = ""
    max_busy_seconds: int = 1800

    def build_command(self, workdir: str) -> list[str]:
        resolved = [_interpolate_env(arg) for arg in self.args]
        return [self.cli, *resolved]

    def validate_env(self) -> None:
        missing = [v for v in self.required_env if not os.environ.get(v)]
        if missing:
            raise OSError(
                f"Missing required environment variables for {self.name} backend: "
                + ", ".join(missing)
            )

    def is_ready_line(self, line: str) -> bool:
        pattern = self.idle.get("ready_pattern", "")
        return bool(re.search(pattern, line))

    def is_busy_line(self, line: str) -> bool:
        if not self.busy_pattern:
            return False
        return bool(re.search(self.busy_pattern, line))

    @property
    def quiescence_seconds(self) -> float:
        return self.idle.get("quiescence_seconds", 5)

    @property
    def cols(self) -> int:
        return self.terminal.get("cols", 200)

    @property
    def rows(self) -> int:
        return self.terminal.get("rows", 50)

    @property
    def model(self) -> str | None:
        """Model name from args (looks for --model or -m flag)."""
        for i, arg in enumerate(self.args):
            if arg in ("--model", "-m") and i + 1 < len(self.args):
                return self.args[i + 1]
        return None

    @property
    def family(self) -> str:
        """Normalize backend name to a family for log-dir / normalizer dispatch."""
        for fam in ("claude", "codex", "gemini"):
            if self.name == fam or self.name.startswith(f"{fam}-"):
                return fam
        return "other"


def load_backend(name: str, backends_dir: Path) -> Backend:
    path = backends_dir / f"{name}.yaml"
    if not path.exists():
        raise FileNotFoundError(f"Backend config not found: {path}")
    with open(path) as f:
        data = yaml.safe_load(f)
    return Backend(
        name=data["name"],
        cli=data["cli"],
        args=data.get("args", []),
        required_env=data.get("required_env", []),
        hooks=data.get("hooks", {"pre_run": [], "post_run": []}),
        shutdown=data.get("shutdown", "/exit"),
        idle=data.get("idle", {}),
        startup_timeout=data.get("startup_timeout", 30),
        terminal=data.get("terminal", {"cols": 200, "rows": 50}),
        session_logs=data.get("session_logs", {}),
        turn_timeout=data.get("turn_timeout"),
        busy_pattern=data.get("busy_pattern", ""),
        max_busy_seconds=data.get("max_busy_seconds", 1800),
    )


def _interpolate_env(value: str) -> str:
    def replacer(match: re.Match[str]) -> str:
        var = match.group(1)
        val = os.environ.get(var)
        if val is None:
            raise OSError(f"Environment variable {var} not set")
        return val

    return re.sub(r"\$\{(\w+)\}", replacer, value)
