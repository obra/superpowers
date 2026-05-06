import subprocess
import time
from unittest.mock import call, patch

from drill.session import TmuxSession


class TestTmuxSession:
    def test_create_and_kill(self):
        session = TmuxSession(name="drill-test-create", cols=80, rows=24)
        session.create()
        result = subprocess.run(
            ["tmux", "has-session", "-t", "drill-test-create"],
            capture_output=True,
        )
        assert result.returncode == 0
        session.kill()
        result = subprocess.run(
            ["tmux", "has-session", "-t", "drill-test-create"],
            capture_output=True,
        )
        assert result.returncode != 0

    def test_send_keys_and_capture(self):
        session = TmuxSession(name="drill-test-keys", cols=80, rows=24)
        session.create()
        try:
            session.send_keys("echo hello-drill-test")
            time.sleep(0.5)
            output = session.capture()
            assert "hello-drill-test" in output
        finally:
            session.kill()

    def test_send_keys_pastes_text_then_submits(self):
        session = TmuxSession(name="drill-test-command-shape")

        with (
            patch("drill.session.subprocess.run") as run,
            patch("drill.session.time.sleep") as sleep,
        ):
            session.send_keys("hello `weird` text")

        assert run.call_args_list == [
            call(
                [
                    "tmux",
                    "set-buffer",
                    "-b",
                    "drill-test-command-shape-input",
                    "hello `weird` text",
                ],
                check=True,
            ),
            call(
                [
                    "tmux",
                    "paste-buffer",
                    "-d",
                    "-b",
                    "drill-test-command-shape-input",
                    "-t",
                    "drill-test-command-shape",
                ],
                check=True,
            ),
            call(["tmux", "send-keys", "-t", "drill-test-command-shape", "Enter"], check=True),
        ]
        sleep.assert_called_once_with(0.1)

    def test_launch_command(self, tmp_path):
        session = TmuxSession(name="drill-test-launch", cols=80, rows=24)
        session.create()
        try:
            session.launch(["python3", "-c", "import time; time.sleep(30)"], cwd=str(tmp_path))
            time.sleep(0.5)
            assert session.is_process_alive()
        finally:
            session.kill()

    def test_send_special_key(self, tmp_path):
        session = TmuxSession(name="drill-test-special", cols=80, rows=24)
        proof_file = tmp_path / "after-ctrl-c"
        session.create()
        try:
            session.send_keys("cat")
            time.sleep(0.3)
            session.send_special_key("ctrl-c")
            time.sleep(0.3)
            session.send_keys(f"touch {proof_file}")
            time.sleep(0.3)
            assert proof_file.exists()
        finally:
            session.kill()
