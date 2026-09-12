"""Headless browser discovery, bounded card screenshots, and process-tree cleanup."""

from __future__ import annotations

import os
import shutil
import signal
import subprocess
import sys
import tempfile
import time
from pathlib import Path


UNIX_BROWSERS = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "chromium", "chromium-browser", "google-chrome", "google-chrome-stable",
]


def _windows_browsers() -> list[Path]:
    locations = []
    for variable in ("LOCALAPPDATA", "PROGRAMFILES", "PROGRAMFILES(X86)", "PROGRAMW6432"):
        value = os.environ.get(variable)
        if value:
            root = Path(value)
            locations.extend([
                root / "Google/Chrome/Application/chrome.exe",
                root / "Microsoft/Edge/Application/msedge.exe",
            ])
    return locations


def _resolve(candidate: str | Path) -> str | None:
    path = Path(candidate).expanduser()
    if path.is_file() and (sys.platform == "win32" or os.access(path, os.X_OK)):
        return str(path.resolve())
    return shutil.which(str(candidate))


def find_browser(explicit: str | None) -> str | None:
    """Return a usable Chrome-family executable, honoring explicit values."""
    if explicit:
        found = _resolve(explicit)
        if found:
            return found
        raise FileNotFoundError(f"explicit browser is not usable: {explicit}")
    candidates: list[str | Path] = (
        _windows_browsers() + ["chrome.exe", "msedge.exe"]
        if sys.platform == "win32" else UNIX_BROWSERS
    )
    for candidate in candidates:
        found = _resolve(candidate)
        if found:
            return found
    return None


def _descendants(pid: int) -> list[int]:
    pids, index = [pid], 0
    while index < len(pids):
        listed = subprocess.run(["pgrep", "-P", str(pids[index])], capture_output=True, text=True).stdout
        pids.extend(int(child) for child in listed.split())
        index += 1
    return pids


def kill_process_tree(pid: int) -> None:
    """Kill a process this tool started and everything it spawned. A browser
    or ttyd leaves helpers behind otherwise, and on Unix a pty child starts
    its own session, so a process group is not enough."""
    if sys.platform == "win32":
        subprocess.run(["taskkill", "/T", "/F", "/PID", str(pid)], capture_output=True)
        return
    for victim in reversed(_descendants(pid)):
        try:
            os.kill(victim, signal.SIGKILL)
        except ProcessLookupError:
            pass


def render_card(html: Path, png: Path, *, browser: str, width: int,
                height: int, timeout: float = 20) -> None:
    """Render one local HTML page and release every process it launched."""
    html = Path(html).resolve()
    png = Path(png).resolve()
    if not html.is_file():
        raise FileNotFoundError(f"card HTML does not exist: {html}")
    png.parent.mkdir(parents=True, exist_ok=True)
    png.unlink(missing_ok=True)
    with tempfile.TemporaryDirectory(prefix="movie-browser-", ignore_cleanup_errors=True) as profile:
        profile_path = Path(profile)
        log = profile_path / "browser.log"
        argv = [
            str(Path(browser).resolve()) if Path(browser).is_file() else browser,
            "--headless=new", "--disable-gpu", "--hide-scrollbars",
            "--no-first-run", "--no-default-browser-check",
            f"--user-data-dir={profile_path}", f"--screenshot={png}",
            f"--window-size={width},{height}", "--force-device-scale-factor=1",
            html.as_uri(),
        ]
        with log.open("wb") as output:
            process = subprocess.Popen(argv, cwd=profile_path, stdin=subprocess.DEVNULL,
                                       stdout=output, stderr=subprocess.STDOUT,
                                       start_new_session=sys.platform != "win32")
        try:
            deadline = time.monotonic() + timeout
            while time.monotonic() < deadline:
                # A fresh profile may keep background services alive after
                # taking the screenshot. A complete PNG is the render result.
                if png.is_file():
                    data = png.read_bytes()
                    if data.startswith(b"\x89PNG\r\n\x1a\n") and data.endswith(b"IEND\xaeB`\x82"):
                        return
                elif process.poll() is not None:
                    detail = log.read_text(encoding="utf-8", errors="replace")[-1000:]
                    raise RuntimeError(f"Browser exited with status {process.returncode} "
                                       f"without a complete PNG: {detail}")
                time.sleep(0.05)
            raise TimeoutError(f"Browser exceeded {timeout:g}s")
        finally:
            kill_process_tree(process.pid)
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                pass
