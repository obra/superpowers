"""tmux session management for driving agent CLI sessions."""

from __future__ import annotations

import subprocess
import time


class TmuxSession:
    def __init__(self, name: str, cols: int = 200, rows: int = 50) -> None:
        self.name = name
        self.cols = cols
        self.rows = rows

    def create(self) -> None:
        subprocess.run(
            [
                "tmux",
                "new-session",
                "-d",
                "-s",
                self.name,
                "-x",
                str(self.cols),
                "-y",
                str(self.rows),
            ],
            check=True,
        )

    def launch(self, command: list[str], cwd: str) -> None:
        cmd_str = " ".join(command)
        self.send_keys(f"cd {cwd} && {cmd_str}")

    def send_keys(self, text: str) -> None:
        if text:
            buffer_name = f"{self.name}-input"
            subprocess.run(
                ["tmux", "set-buffer", "-b", buffer_name, text],
                check=True,
            )
            subprocess.run(
                ["tmux", "paste-buffer", "-d", "-b", buffer_name, "-t", self.name],
                check=True,
            )
            time.sleep(0.1)

        subprocess.run(
            ["tmux", "send-keys", "-t", self.name, "Enter"],
            check=True,
        )

    def send_special_key(self, key: str) -> None:
        key_map = {
            "ctrl-c": "C-c",
            "ctrl-d": "C-d",
            "ctrl-z": "C-z",
            "enter": "Enter",
            "escape": "Escape",
        }
        tmux_key = key_map.get(key, key)
        subprocess.run(
            ["tmux", "send-keys", "-t", self.name, tmux_key],
            check=True,
        )

    def capture(self) -> str:
        result = subprocess.run(
            ["tmux", "capture-pane", "-t", self.name, "-p"],
            capture_output=True,
            text=True,
            check=True,
        )
        return result.stdout

    def is_process_alive(self) -> bool:
        result = subprocess.run(
            ["tmux", "list-panes", "-t", self.name, "-F", "#{pane_dead}"],
            capture_output=True,
            text=True,
        )
        return result.stdout.strip() == "0"

    def kill(self) -> None:
        subprocess.run(
            ["tmux", "kill-session", "-t", self.name],
            capture_output=True,
        )
