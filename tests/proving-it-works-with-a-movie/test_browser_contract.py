"""Browser cleanup decisions with fake processes and a completed-output token."""
import contextlib
import os
import subprocess
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

import fixtures


class CompletedOutput:
    """Stand in for the completed-output observation without creating an image."""
    def startswith(self, prefix):
        return True

    def endswith(self, suffix):
        return True


@contextlib.contextmanager
def rendering(*, exited=False, taskkill_status=0, wait_timeout=False, locked_profile=False):
    module = fixtures.load_script("browser_tools")
    with tempfile.TemporaryDirectory() as temp, contextlib.ExitStack() as stack:
        html, png = Path(temp).resolve() / "card.html", Path(temp).resolve() / "card.png"
        html.write_text("<p>card</p>")
        process = SimpleNamespace(pid=1100, returncode=0 if exited else None)
        process.poll = lambda: process.returncode
        calls, profiles = [], []
        original_is_file, original_unlink = Path.is_file, os.unlink

        def popen(argv, **kwargs):
            profiles.append(Path(kwargs["cwd"]))
            return process

        def taskkill(argv, **kwargs):
            calls.append(argv)
            if taskkill_status == 0 and not wait_timeout:
                process.returncode = -9
            return subprocess.CompletedProcess(argv, taskkill_status, b"", b"termination failed")

        def wait(timeout):
            if process.returncode is None:
                raise subprocess.TimeoutExpired("fake browser", timeout)
            return process.returncode

        def unlink(path, *args, **kwargs):
            if locked_profile and Path(path).name == "browser.log":
                raise PermissionError("locked browser profile")
            return original_unlink(path, *args, **kwargs)

        process.wait = wait
        for obj, name, value in (
            (module.sys, "platform", "win32"),
            (module.subprocess, "Popen", popen),
            (module.subprocess, "run", taskkill),
            (Path, "is_file", lambda path: True if path == png else original_is_file(path)),
            (Path, "read_bytes", lambda path: CompletedOutput()),
            (os, "unlink", unlink),
        ):
            stack.enter_context(patch.object(obj, name, value))
        try:
            yield SimpleNamespace(render=lambda: module.render_card(html, png, browser="fake-browser", width=640, height=360),
                                  process=process, calls=calls, profiles=profiles)
        finally:
            stack.close()
            for profile in profiles:
                if profile.exists():
                    module.shutil.rmtree(profile)


class BrowserCleanupContract(unittest.TestCase):
    def test_windows_tree_termination_failure_reaches_caller_as_oserror(self):
        module = fixtures.load_script("browser_tools")
        with patch.object(module.sys, "platform", "win32"), \
             patch.object(module.subprocess, "run", return_value=subprocess.CompletedProcess([], 1, b"", b"access denied")):
            with self.assertRaises(OSError):
                module.kill_process_tree(1100)

    def test_completed_output_does_not_hide_tree_termination_failure(self):
        with rendering(taskkill_status=1) as rig:
            with self.assertRaises(OSError):
                rig.render()

    def test_completed_output_does_not_hide_owned_child_wait_timeout(self):
        with rendering(wait_timeout=True) as rig:
            with self.assertRaises(subprocess.TimeoutExpired):
                rig.render()

    def test_completed_output_does_not_hide_locked_profile(self):
        with rendering(locked_profile=True) as rig:
            with self.assertRaises(PermissionError):
                rig.render()

    def test_normally_exited_completed_card_succeeds_without_numeric_pid_cleanup(self):
        with rendering(exited=True, taskkill_status=1) as rig:
            self.assertIsNone(rig.render())
            self.assertEqual(rig.calls, [])
            self.assertFalse(rig.profiles[0].exists())

    def test_completed_card_releases_live_browser_and_profile(self):
        with rendering() as rig:
            self.assertIsNone(rig.render())
            self.assertEqual(rig.process.poll(), -9)
            self.assertEqual(len(rig.calls), 1)
            self.assertFalse(rig.profiles[0].exists())


if __name__ == "__main__":
    unittest.main()
