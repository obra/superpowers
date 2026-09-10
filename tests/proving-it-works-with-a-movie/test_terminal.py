"""The terminal recorder: prompt parsing and the frame grid anywhere; a real
ttyd session wherever ttyd and a Chrome-family browser exist."""
import importlib.util
import json
import os
import shlex
import shutil
import subprocess
import sys
import tempfile
import time
import unittest
from pathlib import Path

import fixtures

SCRIPT = Path(__file__).resolve().parents[2] / "skills/proving-it-works-with-a-movie/examples/film-terminal.py"
FIXTURE = Path(__file__).resolve().with_name("fixtures") / "terminal_app.py"
TTYD = os.environ.get("MOVIE_TEST_TTYD") or shutil.which("ttyd")
BROWSER = fixtures.load_script("browser_tools").find_browser(os.environ.get("MOVIE_TEST_BROWSER"))
SHELL = os.environ.get("MOVIE_TEST_SHELL") or ("powershell51" if os.name == "nt" else "bash")
BASH = SHELL in ("bash", "gitbash")


def recorder():
    spec = importlib.util.spec_from_file_location("film_terminal", SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def gone(pid, timeout=5):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if os.name == "nt":
            listed = subprocess.run(["tasklist", "/FI", f"PID eq {pid}", "/NH"],
                                    capture_output=True, text=True).stdout
            if str(pid) not in listed:
                return True
        else:
            try:
                os.kill(pid, 0)
            except ProcessLookupError:
                return True
        time.sleep(0.1)
    return False


class PromptTests(unittest.TestCase):
    def test_prompts_parse_both_terminators_and_paths_with_semicolons(self):
        module = recorder()
        log = (b"noise\x1b]0;MOVIE;1;1;;C:\\a;b\x07\x1b[0m"
               b"\x1b]2;MOVIE;2;0;7;/c/x\x1b\\tail"
               b"\x1b]0;MOVIE;3;1;0;/home/me\x07")
        self.assertEqual(module.prompts(log), [
            dict(n=1, ok=True, exit_code=None, cwd="C:\\a;b"),
            dict(n=2, ok=False, exit_code=7, cwd="/c/x"),
            dict(n=3, ok=True, exit_code=0, cwd="/home/me"),
        ])
        self.assertEqual(module.prompts(b"\x1b]0;something else\x07"), [])

    def test_prompt_install_is_one_typed_line_per_shell(self):
        module = recorder()
        cwd = Path("C:/Users/x/movie O'Brien λ")
        for kind in module.SHELLS:
            line = module.prompt_command(kind, cwd)
            self.assertEqual(len(line.splitlines()), 1, kind)
            self.assertNotIn("MOVIE;", line, "the marker text must not be echoed by the install line")
            self.assertIn("Brien λ", module.prompt_script(kind, cwd), "the script enters the cwd")

    def test_keys_are_named_or_single_characters(self):
        module = recorder()
        self.assertEqual(module.key_params("Ctrl-C")["modifiers"], 2)
        self.assertEqual(module.key_params("Enter")["text"], "\r")
        self.assertEqual(module.key_params("q"), dict(key="q", text="q"))
        with self.assertRaises(SystemExit):
            module.key_params("Bogus")


class FilmGridTests(unittest.TestCase):
    def test_a_slow_capture_repeats_the_previous_frame_and_filming_holds_after_the_prompt(self):
        module = recorder()
        clock = {"now": 0.0}
        shots = []

        def capture():
            shots.append(len(shots) + 1)
            clock["now"] += 0.5 if len(shots) == 2 else 0.01  # the second screenshot stalls
            return bytes([len(shots)])

        with tempfile.TemporaryDirectory() as directory:
            out = Path(directory) / "take"
            frames = module.film(out, seconds=10, hold=0.4, capture=capture,
                                 finished=lambda: clock["now"] >= 1.0,
                                 clock=lambda: clock["now"],
                                 sleep=lambda s: clock.__setitem__("now", clock["now"] + s))
            files = sorted(out.glob("f*.png"))
            self.assertEqual([f.name for f in files], [f"f{i:05d}.png" for i in range(frames)])
            self.assertEqual(files[2].read_bytes(), files[1].read_bytes(), "missed slot repeats the last frame")
            self.assertNotEqual(files[3].read_bytes(), files[2].read_bytes())
            self.assertEqual(frames, 7, "1.0 s to the prompt plus 0.4 s hold at 5 fps")

    def test_filming_stops_at_the_deadline_while_the_command_runs(self):
        module = recorder()
        clock = {"now": 0.0}
        with tempfile.TemporaryDirectory() as directory:
            frames = module.film(Path(directory), seconds=1.0, hold=5, capture=lambda: b"png",
                                 finished=lambda: False, clock=lambda: clock["now"],
                                 sleep=lambda s: clock.__setitem__("now", clock["now"] + s))
            self.assertEqual(frames, 5)


class ServeArgumentTests(unittest.TestCase):
    def test_serve_refuses_a_missing_cwd_before_launching_anything(self):
        with tempfile.TemporaryDirectory() as directory:
            result = subprocess.run([sys.executable, str(SCRIPT), "serve", str(Path(directory) / "session"),
                                     "--shell", "bash", "--cwd", str(Path(directory) / "missing")],
                                    capture_output=True, text=True, timeout=60)
            self.assertEqual(result.returncode, 1)
            self.assertIn("--cwd is not a directory", result.stderr)
            self.assertFalse((Path(directory) / "session" / "session.json").exists())


@unittest.skipUnless(TTYD and BROWSER, "ttyd and a Chrome-family browser are required")
class SessionTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(prefix="movie-terminal-", ignore_cleanup_errors=True)
        self.addCleanup(self.tmp.cleanup)
        self.work = Path(self.tmp.name) / "movie O'Brien λ"
        self.work.mkdir()
        self.session = Path(self.tmp.name) / "session"
        self.log = (Path(self.tmp.name) / "serve.log").open("wb")
        self.addCleanup(self.log.close)
        argv = [sys.executable, str(SCRIPT), "serve", str(self.session), "--shell", SHELL,
                "--cwd", str(self.work), "--ttyd", TTYD, "--browser", BROWSER]
        if os.environ.get("MOVIE_TEST_SHELL_EXE"):
            argv += ["--shell-exe", os.environ["MOVIE_TEST_SHELL_EXE"]]
        self.serve = subprocess.Popen(argv, stdout=self.log, stderr=subprocess.STDOUT)
        deadline = time.monotonic() + 45
        while not (self.session / "ready.json").exists() and self.serve.poll() is None \
                and time.monotonic() < deadline:
            time.sleep(0.1)
        if not (self.session / "ready.json").exists():
            report = "".join(f"--- {name}\n" + path.read_text(errors="replace") if path.exists() else ""
                             for name, path in (("serve.log", Path(self.tmp.name) / "serve.log"),
                                                ("ttyd.log", self.session / "ttyd.log"),
                                                ("browser.log", self.session / "browser.log")))
            self.fail(report)

    def tearDown(self):
        if self.serve.poll() is None:
            self.cli("close", str(self.session))
            try:
                self.serve.wait(15)
            except subprocess.TimeoutExpired:
                self.serve.kill()
                self.serve.wait()
        for pid in json.loads((self.session / "session.json").read_text(encoding="utf-8"))["pids"]:
            self.assertTrue(gone(pid), f"pid {pid} survived close")

    def cli(self, *args, timeout=120):
        result = subprocess.run([sys.executable, str(SCRIPT), *args], capture_output=True, timeout=timeout)
        return result.returncode, result.stdout.decode("utf-8", "replace"), result.stderr.decode("utf-8", "replace")

    def run_command(self, command, *extra):
        code, out, err = self.cli("run", str(self.session), command, *extra)
        self.assertTrue(out.strip(), err)
        return code, json.loads(out.strip().splitlines()[-1])

    def quoted(self, *words):
        if BASH:
            return " ".join(shlex.quote(w.replace("\\", "/")) for w in words)
        return "& " + " ".join("'" + w.replace("'", "''") + "'" for w in words)

    def native(self, code):
        return self.quoted(sys.executable) + f' -c "{code}"'

    def test_commands_report_status_and_the_shell_persists_between_calls(self):
        code, result = self.run_command("echo hello")
        self.assertEqual((code, result["outcome"], result["ok"]), (0, "completed", True), result)
        self.assertTrue(result["cwd"].endswith("movie O'Brien λ"), result["cwd"])
        if BASH:
            set_value, check_value, failing = "MOVIE_VALUE=kept", 'test "$MOVIE_VALUE" = kept', "false"
        else:
            set_value = "$global:MovieValue = 'kept'"
            check_value = "if ($global:MovieValue -ne 'kept') { throw 'lost' }"
            failing = "Get-Item 'Z:\\nowhere'"
        self.assertEqual(self.run_command(set_value)[0], 0)
        self.assertEqual(self.run_command(check_value)[0], 0, "state must survive separate calls")
        code, result = self.run_command(failing)
        self.assertEqual((code, result["ok"]), (1, False), result)
        code, result = self.run_command(self.native("import sys; sys.exit(7)"))
        self.assertEqual((code, result["ok"], result["exit_code"]), (1, False, 7), result)

    def test_a_tui_is_filmed_across_two_takes_and_a_long_command_across_calls(self):
        from PIL import Image

        take_one, take_two, take_three = (self.work / name for name in ("take-one", "take-two", "take-three"))
        code, result = self.run_command(self.quoted(sys.executable, str(FIXTURE)),
                                        "--record", str(take_one), "--seconds", "7")
        self.assertEqual((code, result["outcome"]), (2, "running"), result)
        frames = sorted(take_one.glob("f*.png"))
        self.assertGreaterEqual(len(frames), 30, "7 s at 5 fps")
        seen = []
        for frame in frames:
            with Image.open(frame) as image:
                r, g, b = image.convert("RGB").getpixel((300, 120))
            color = ("red" if r > 150 and g < 100 and b < 100 else
                     "green" if g > 120 and r < 100 and b < 140 else
                     "blue" if b > 150 and r < 100 and g < 140 else None)
            if color and (not seen or seen[-1] != color):
                seen.append(color)
        self.assertEqual(seen, ["red", "green", "blue"], "the three TUI states, in order, in the automatic frames")
        code, out, err = self.cli("key", str(self.session), "q", "--record", str(take_two), "--seconds", "10")
        result = json.loads(out.strip().splitlines()[-1])
        self.assertEqual((code, result["outcome"], result["ok"]), (0, "completed", True), (result, err))
        self.assertGreaterEqual(result["frames"], 7, "the exit plus the 1.5 s hold")
        self.assertEqual(len(json.loads((self.work / "states.json").read_text())), 3)

        code, result = self.run_command(self.native("import time; time.sleep(3)"), "--seconds", "1")
        self.assertEqual(result["outcome"], "running")
        code, out, err = self.cli("watch", str(self.session), "--record", str(take_three), "--seconds", "15")
        result = json.loads(out.strip().splitlines()[-1])
        self.assertEqual((code, result["outcome"], result["ok"]), (0, "completed", True), (result, err))
        self.assertGreaterEqual(result["frames"], 10, "about 2 s of waiting plus the hold")
        self.assertEqual(result["scene"], {"kind": "frames", "src": str(take_three.resolve()), "rate": 5})

    def test_close_kills_the_shell_tree_and_spares_unrelated_processes(self):
        sentinel = subprocess.Popen([sys.executable, "-c", "import time; time.sleep(120)"])
        self.addCleanup(sentinel.kill)
        tree = self.work / "tree"
        code, result = self.run_command(self.quoted(sys.executable, str(FIXTURE), "tree", str(tree)), "--seconds", "2")
        self.assertEqual(result["outcome"], "running")
        deadline = time.monotonic() + 20
        while len(list(tree.glob("*.json"))) < 3 and time.monotonic() < deadline:
            time.sleep(0.1)
        pids = [json.loads(path.read_text())["pid"] for path in tree.glob("*.json")]
        self.assertEqual(len(pids), 3)
        code, out, err = self.cli("close", str(self.session))
        self.assertEqual(code, 0, err)
        self.assertEqual(self.serve.wait(15), 0)
        for pid in pids:
            self.assertTrue(gone(pid), f"descendant {pid} survived close")
        self.assertIsNone(sentinel.poll(), "an unrelated process must survive")


if __name__ == "__main__":
    unittest.main()
