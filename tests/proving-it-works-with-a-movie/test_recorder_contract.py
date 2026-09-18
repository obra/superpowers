"""Recorder decisions with fake processes/CDP and byte-token captures only."""
import contextlib
import importlib.util
import io
import json
import subprocess
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

import fixtures

SCRIPT = Path(__file__).resolve().parents[2] / "skills/proving-it-works-with-a-movie/examples/film-terminal.py"


def recorder():
    spec = importlib.util.spec_from_file_location("recorder_contract", SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class Clock:
    def __init__(self):
        self.now = 0.0

    def monotonic(self):
        return self.now

    def sleep(self, seconds):
        self.now += seconds


class Process:
    def __init__(self, pid):
        self.pid = pid
        self.returncode = None

    def poll(self):
        return self.returncode

    def wait(self, timeout):
        if self.returncode is None:
            raise subprocess.TimeoutExpired("fake child", timeout)
        return self.returncode


@contextlib.contextmanager
def serving(failure=None, stop_at=None, relative=False):
    module, clock = recorder(), Clock()
    with tempfile.TemporaryDirectory() as temp, contextlib.ExitStack() as stack:
        root = Path(temp)
        directory = root / "session"
        args = SimpleNamespace(session=directory, cwd=root, shell="bash", shell_exe=None,
                               ttyd="fake-ttyd", browser="fake-browser")
        if relative:
            import os
            args.session = Path(os.path.relpath(directory))
        handles, children, launches, tokens = [], [], [], []
        original_open, original_write = Path.open, module.write_json
        stopped = False

        def open_file(path, *positional, **kwargs):
            if positional == ("ab",):
                if failure == path.name:
                    raise OSError("injected " + path.name)
                handle = original_open(path, *positional, **kwargs)
                handles.append(handle)
                return handle
            return original_open(path, *positional, **kwargs)

        def popen(argv, **kwargs):
            index = len(children)
            if failure == ("ttyd launch" if index == 0 else "browser launch"):
                raise OSError("injected launch")
            child = Process(1100 + index)
            children.append(child)
            launches.append((argv, kwargs))
            if index == 1:
                (directory / "profile").mkdir()
            return child

        def kill(pid):
            for child in children:
                if child.pid == pid:
                    if child.poll() is not None:
                        raise AssertionError("cannot use an exited leader's PID")
                    if failure != "child wait":
                        child.returncode = -9

        def write_json(path, value):
            if failure == "session metadata" and path.name == "session.json":
                raise OSError("injected metadata failure")
            original_write(path, value)

        def stop(phase):
            nonlocal stopped
            if stop_at == phase and not stopped:
                (directory / "stop").write_text("")
                stopped = True

        class FakeCDP:
            def __init__(self, url):
                if failure == "connection":
                    raise RuntimeError("injected connection failure")
                self.n = 0
                self.on_event = None
                self.ws = SimpleNamespace(close=lambda: None)

            def recv(self, timeout):
                clock.sleep(timeout)
                if (directory / "ready.json").exists():
                    stop("ready")
                    if failure == "exited leader":
                        children[0].returncode = 0
                    if failure == "later connection":
                        raise ConnectionError("injected later disconnect")
                else:
                    stop("pump" if self.n == 0 else "quiet")
                return None

            def call(self, method, params=None, **kwargs):
                if getattr(self, "before_call", None):
                    self.before_call()
                if stop_at == "call":
                    stop("call")
                    clock.sleep(10)
                if method == "Input.dispatchKeyEvent" and params["type"] == "keyDown":
                    self.n += 1
                return {}

        cdp = None

        def connect(url):
            nonlocal cdp
            cdp = FakeCDP(url)
            return cdp

        def page_url(port):
            stop("retry")
            if stop_at == "retry":
                raise OSError("not listening yet")
            return "fake-url"

        def tail(path):
            if cdp and cdp.n:
                return f"\x1b]0;MOVIE;{cdp.n};1;0;{root}\x07$ ".encode()
            return b"$ "

        for obj, name, value in (
            (module, "shell_argv", lambda *a: ["fake-bash"]),
            (module, "find_browser", lambda *a: "fake-browser"),
            (module, "free_port", lambda: 1234),
            (module.subprocess, "Popen", popen),
            (module, "kill_process_tree", kill),
            (module, "page_url", page_url),
            (module, "CDP", connect),
            (module, "write_json", write_json),
            (module, "tail", tail),
            (module, "screenshot", lambda *a: b"capture-token"),
            (module, "lit_fraction", lambda *a: 0.01),
            (module.time, "monotonic", clock.monotonic),
            (module.time, "sleep", clock.sleep),
            (Path, "open", open_file),
            (Path, "write_bytes", lambda path, token: tokens.append((path.name, token))),
        ):
            stack.enter_context(patch.object(obj, name, value))
        if failure == "profile removal":
            stack.enter_context(patch.object(module.shutil, "rmtree", side_effect=PermissionError("locked")))
        stack.enter_context(contextlib.redirect_stdout(io.StringIO()))
        stack.enter_context(contextlib.redirect_stderr(io.StringIO()))
        try:
            yield SimpleNamespace(module=module, args=args, directory=directory, children=children,
                                  handles=handles, launches=launches, clock=clock)
        finally:
            # Release the test's log handles even when ownership assertions fail.
            for handle in handles:
                handle.close()


class ServeLifecycleTests(unittest.TestCase):
    def test_tree_cleanup_failure_keeps_failure_after_leader_exits_and_cleans_other_resources(self):
        with serving(stop_at="ready") as rig:
            browser = fixtures.load_script("browser_tools")
            terminated = []

            def taskkill(argv, **kwargs):
                pid = int(argv[-1])
                terminated.append(pid)
                child = next(child for child in rig.children if child.pid == pid)
                child.returncode = 0 if pid == 1100 else -9
                return subprocess.CompletedProcess(argv, 1 if pid == 1100 else 0, b"", b"tree termination failed")

            with patch.object(rig.module, "kill_process_tree", browser.kill_process_tree), \
                 patch.object(browser.sys, "platform", "win32"), \
                 patch.object(browser.subprocess, "run", taskkill):
                self.assertEqual(rig.module.serve(rig.args), 1)
            session = rig.module.read_json(rig.directory / "session.json")
            self.assertEqual(session["pids"], [1100, 1101])
            self.assertFalse(session.get("closed", False))
            self.assertEqual(terminated, [1100, 1101])
            self.assertTrue(all(child.poll() is not None for child in rig.children))
            self.assertTrue(all(handle.closed for handle in rig.handles))
            self.assertFalse((rig.directory / "profile").exists())
            self.assertFalse((rig.directory / "ready.json").exists())
            self.assertTrue(all((rig.directory / name).exists()
                                for name in ("ttyd.log", "browser.log", "terminal.log")))

    def test_every_acquisition_failure_releases_owned_resources(self):
        for failure in ("ttyd.log", "browser.log", "ttyd launch", "browser launch",
                        "session metadata", "terminal.log", "connection", "later connection"):
            with self.subTest(failure=failure), serving(failure) as rig:
                try:
                    code = rig.module.serve(rig.args)
                except Exception as error:
                    code = error
                self.assertEqual(code, 1)
                self.assertTrue(all(p.poll() is not None for p in rig.children))
                self.assertTrue(all(h.closed for h in rig.handles))
                self.assertFalse((rig.directory / "profile").exists())
                self.assertFalse((rig.directory / "ready.json").exists())
                for name in ("ttyd.log", "browser.log", "terminal.log"):
                    if any(Path(h.name).name == name for h in rig.handles):
                        self.assertTrue((rig.directory / name).exists(), "logs are evidence")

    def test_relative_session_path_matches_browser_profile_and_cwd(self):
        with serving("connection", relative=True) as rig:
            self.assertEqual(rig.module.serve(rig.args), 1)
            argv, kwargs = rig.launches[1]
            profile_arg = next(a.split("=", 1)[1] for a in argv if a.startswith("--user-data-dir="))
            self.assertEqual(Path(kwargs["cwd"]) / profile_arg, (rig.directory / "profile").resolve())
            self.assertTrue(Path(kwargs["cwd"]).is_absolute())

    def test_stop_requests_interrupt_startup_and_finish_owned_cleanup(self):
        for phase in ("retry", "pump", "quiet", "ready"):
            with self.subTest(phase=phase), serving(stop_at=phase) as rig:
                self.assertEqual(rig.module.serve(rig.args), 0)
                self.assertLess(rig.clock.now, 5)
                self.assertTrue(all(p.poll() is not None for p in rig.children))
                self.assertTrue(all(h.closed for h in rig.handles))
                session = rig.module.read_json(rig.directory / "session.json")
                self.assertEqual(session["pids"], [])
                self.assertTrue(session["closed"])
                self.assertFalse((rig.directory / "ready.json").exists())
                self.assertFalse((rig.directory / "profile").exists())

    def test_stop_during_one_startup_call_prevents_another_bounded_call(self):
        with serving(stop_at="call") as rig:
            self.assertEqual(rig.module.serve(rig.args), 0)
            self.assertLessEqual(rig.clock.now, 10)
            self.assertTrue(rig.module.read_json(rig.directory / "session.json")["closed"])

    def test_pid_retirement_is_atomic_and_follows_resource_cleanup(self):
        with serving(stop_at="ready") as rig:
            replace = Path.replace
            observed = []

            def publish(path, target):
                session = rig.module.read_json(target)
                observed.append(session["pids"])
                self.assertEqual(session["pids"], [1100, 1101])
                self.assertTrue(all(p.poll() is not None for p in rig.children))
                self.assertTrue(all(h.closed for h in rig.handles))
                self.assertFalse((rig.directory / "profile").exists())
                self.assertFalse((rig.directory / "ready.json").exists())
                return replace(path, target)

            with patch.object(Path, "replace", publish):
                self.assertEqual(rig.module.serve(rig.args), 0)
            self.assertEqual(observed, [[1100, 1101]])
            self.assertEqual(rig.module.read_json(rig.directory / "session.json")["pids"], [])

    def test_failed_cleanup_does_not_retire_owned_ids_or_claim_closed(self):
        for failure in ("child wait", "profile removal"):
            with self.subTest(failure=failure), serving(failure, stop_at="ready") as rig:
                self.assertEqual(rig.module.serve(rig.args), 1)
                session = rig.module.read_json(rig.directory / "session.json")
                self.assertEqual(session["pids"], [1100, 1101])
                self.assertFalse(session.get("closed", False))
                self.assertFalse((rig.directory / "ready.json").exists())

    def test_exited_leader_cannot_confirm_descendant_cleanup(self):
        with serving("exited leader", stop_at="ready") as rig:
            self.assertEqual(rig.module.serve(rig.args), 1)
            session = rig.module.read_json(rig.directory / "session.json")
            self.assertEqual(session["pids"], [1100, 1101])
            self.assertFalse(session.get("closed", False))
            self.assertEqual(rig.children[0].returncode, 0)
            self.assertEqual(rig.children[1].returncode, -9)
            self.assertTrue(all(h.closed for h in rig.handles))
            self.assertFalse((rig.directory / "ready.json").exists())


class CloseContractTests(unittest.TestCase):
    def test_close_waits_for_owner_cleanup_and_repeated_close_never_kills(self):
        module, clock = recorder(), Clock()
        with tempfile.TemporaryDirectory() as temp:
            directory = Path(temp)
            module.write_json(directory / "session.json", {"pids": [987654]})
            (directory / "ready.json").write_text("{}")
            (directory / "profile").mkdir()
            (directory / "terminal.log").write_text("retain evidence")

            def sleep(seconds):
                clock.sleep(seconds)
                self.assertTrue((directory / "stop").exists())
                if clock.now >= 12:
                    (directory / "profile").rmdir()
                    (directory / "ready.json").unlink()
                    module.write_json(directory / "session.json", {"pids": [], "closed": True})

            with patch.object(module, "kill_process_tree", side_effect=AssertionError("historical PID kill")), \
                 patch.object(module.time, "monotonic", clock.monotonic), \
                 patch.object(module.time, "sleep", sleep), contextlib.redirect_stdout(io.StringIO()):
                self.assertEqual(module.close(SimpleNamespace(session=directory)), 0)
                self.assertGreaterEqual(clock.now, 12)
                self.assertEqual(module.close(SimpleNamespace(session=directory)), 0)
            self.assertEqual((directory / "terminal.log").read_text(), "retain evidence")

    def test_incomplete_or_unavailable_cleanup_is_not_success(self):
        for state in ("missing", "unreadable", "unavailable owner", "profile remains", "ready remains"):
            with self.subTest(state=state), tempfile.TemporaryDirectory() as temp:
                module, clock, directory = recorder(), Clock(), Path(temp)
                if state != "missing":
                    module.write_json(directory / "session.json", {"pids": [987654]})
                if state == "unreadable":
                    (directory / "session.json").write_text("invalid json")
                if state in ("profile remains", "ready remains"):
                    module.write_json(directory / "session.json", {"pids": [], "closed": True})
                    if state == "profile remains":
                        (directory / "profile").mkdir()
                    else:
                        (directory / "ready.json").write_text("{}")
                with patch.object(module, "kill_process_tree", lambda pid: None), \
                     patch.object(module.time, "monotonic", clock.monotonic), \
                     patch.object(module.time, "sleep", clock.sleep), \
                     contextlib.redirect_stdout(io.StringIO()) as out, \
                     contextlib.redirect_stderr(io.StringIO()):
                    try:
                        code = module.close(SimpleNamespace(session=directory))
                    except Exception as error:
                        code = error
                self.assertEqual(code, 1)
                self.assertNotIn('"closed": true', out.getvalue())
                self.assertLessEqual(clock.now, 30.1)
                if state == "unavailable owner":
                    self.assertGreaterEqual(clock.now, 30)


class CDPCallTests(unittest.TestCase):
    def test_stop_during_response_prevents_the_next_call_from_being_sent(self):
        module, sent, stopped = recorder(), [], []

        def recv():
            stopped.append(True)
            return json.dumps({"id": len(sent), "result": {}})

        ws = SimpleNamespace(settimeout=lambda timeout: None, recv=recv,
                             send=lambda data: sent.append(json.loads(data)["method"]))
        websocket = SimpleNamespace(create_connection=lambda *a, **kw: ws,
                                    WebSocketTimeoutException=TimeoutError)
        def check_active():
            if stopped:
                raise InterruptedError("stop requested")

        with patch.dict("sys.modules", websocket=websocket):
            cdp = module.CDP("fake-url")
            cdp.before_call = check_active
            self.assertEqual(cdp.call("Network.enable"), {})
            with self.assertRaises(InterruptedError):
                cdp.call("Page.enable")
        self.assertEqual(sent, ["Network.enable"])


class ObservationTests(unittest.TestCase):
    def observe(self, action, completed=False, seconds=0.2, cp1252=False):
        module, clock = recorder(), Clock()
        with tempfile.TemporaryDirectory() as temp:
            directory = Path(temp)
            log = directory / "terminal.log"
            initial = b"\x1b]0;MOVIE;1;1;0;/work\x07"
            final = "\x1b]0;MOVIE;2;0;7;C:/René/λ\x1b\\".encode()
            log.write_bytes(initial + (final if completed else b""))
            (directory / "ready.json").write_text("{}")
            module.write_json(directory / "session.json", {"pids": [1100, 1101]})
            calls = []

            def recv(timeout):
                calls.append(timeout)
                clock.sleep(timeout)
                if action == "disconnect":
                    raise ConnectionError("browser connection closed")
                if action == "session loss":
                    (directory / "ready.json").unlink(missing_ok=True)
                if action == "prompt arrives":
                    log.write_bytes(initial + final)
                if action == "prompt then disconnect":
                    log.write_bytes(initial + final)
                    raise ConnectionError("browser connection closed")
                return None

            cdp = SimpleNamespace(recv=recv)
            args = SimpleNamespace(session=directory, record=None, seconds=seconds, hold=0)
            raw = io.BytesIO()
            out = io.TextIOWrapper(raw, encoding="cp1252" if cp1252 else "utf-8")
            with patch.object(module.time, "monotonic", clock.monotonic), \
                 patch.object(module.time, "sleep", clock.sleep), contextlib.redirect_stdout(out):
                code = module.observe(args, cdp, 1)
            out.flush()
            result = json.loads(raw.getvalue().decode("ascii" if cp1252 else "utf-8"))
            return code, result, calls

    def test_disconnected_browser_is_failure_without_recording(self):
        code, result, calls = self.observe("disconnect")
        self.assertEqual(code, 1)
        self.assertEqual(result["outcome"], "failed")
        self.assertTrue(calls)

    def test_lost_terminal_session_is_failure_even_with_live_browser(self):
        code, result, calls = self.observe("session loss")
        self.assertEqual(code, 1)
        self.assertEqual(result["outcome"], "failed")
        self.assertTrue(calls)

    def test_only_live_unfinished_command_returns_two(self):
        for seconds in (0, 0.2):
            with self.subTest(seconds=seconds):
                code, result, calls = self.observe("alive", seconds=seconds)
                self.assertEqual((code, result), (2, {"outcome": "running"}))
                self.assertTrue(calls, "even an expired observation must establish liveness")

    def test_new_prompt_retains_native_failure_status(self):
        for action in ("prompt arrives", "prompt then disconnect"):
            with self.subTest(action=action):
                code, result, _ = self.observe(action)
                self.assertEqual(code, 1)
                self.assertEqual(result, {"outcome": "completed", "ok": False,
                                          "exit_code": 7, "cwd": "C:/René/λ"})

    def test_completed_prompt_is_not_consumed_by_later_disconnect(self):
        code, result, _ = self.observe("disconnect", completed=True)
        self.assertEqual((code, result["outcome"], result["exit_code"]), (1, "completed", 7))

    def test_stdout_json_round_trips_non_ascii_paths_on_cp1252(self):
        try:
            code, result, _ = self.observe("alive", completed=True, cp1252=True)
        except UnicodeError as error:
            self.fail(f"stdout JSON was not portable: {error}")
        self.assertEqual((code, result["cwd"]), (1, "C:/René/λ"))

    def test_capture_disconnect_during_hold_preserves_completed_command_status(self):
        for ok, exit_code in ((True, 0), (False, 7)):
            with self.subTest(ok=ok), tempfile.TemporaryDirectory() as temp:
                module, clock, writes = recorder(), Clock(), []
                marker = f"\x1b]0;MOVIE;2;{int(ok)};{exit_code};C:/René/λ\x07".encode()
                args = SimpleNamespace(session=Path(temp), record=Path(temp) / "take",
                                       seconds=10, hold=0.6)
                real_film = module.film

                def film(*args):
                    return real_film(*args, clock=clock.monotonic, sleep=clock.sleep)

                def capture(cdp):
                    if clock.now >= 0.2:
                        raise ConnectionError("capture connection closed")
                    return b"capture-token"

                with patch.object(module, "film", film), \
                     patch.object(module, "screenshot", capture), \
                     patch.object(module, "tail", lambda path: marker), \
                     patch.object(Path, "write_bytes", lambda path, token: writes.append(token)), \
                     patch.object(module, "write_json", side_effect=AssertionError("failed take publication")), \
                     contextlib.redirect_stdout(io.StringIO()) as out:
                    code = module.observe(args, SimpleNamespace(), 1)
                self.assertEqual(code, 1)
                self.assertEqual(json.loads(out.getvalue()), {
                    "outcome": "failed", "error": "capture connection closed",
                    "ok": ok, "exit_code": exit_code, "cwd": "C:/René/λ",
                })
                self.assertEqual(writes, [b"capture-token"])


class VisibleTextTests(unittest.TestCase):
    def test_visible_prompt_survives_bel_and_st_title_markers(self):
        module = recorder()
        for terminator in (b"\x07", b"\x1b\\"):
            with self.subTest(terminator=terminator):
                log = b"\x1b[32m/work $ \x1b]0;MOVIE;2;1;0;/work" + terminator
                self.assertTrue(module.at_prompt(log))
                self.assertFalse(module.at_prompt(log + b"busy"))


class CaptureTimingTests(unittest.TestCase):
    def film(self, durations, seconds=1, hold=0, complete_at=None):
        module, clock, writes, shots = recorder(), Clock(), [], []
        def capture():
            token = bytes([len(shots) + 1])
            clock.sleep(durations[len(shots)] if len(shots) < len(durations) else 0)
            shots.append(token)
            return token
        with tempfile.TemporaryDirectory() as temp, \
             patch.object(Path, "write_bytes", lambda path, token: writes.append((path.name, token))):
            frames = module.film(Path(temp), seconds, hold, capture,
                                 lambda: complete_at is not None and clock.now >= complete_at,
                                 clock.monotonic, clock.sleep)
        self.assertEqual(len(writes), frames)
        return frames, writes

    def test_capture_crossing_hard_endpoint_fills_exactly_five_slots(self):
        frames, writes = self.film([1.2])
        self.assertEqual(frames, 5)
        self.assertEqual(writes, [("f00000.png", b"\x01"), ("f00001.png", b"\x01"),
                                  ("f00002.png", b"\x01"), ("f00003.png", b"\x01"),
                                  ("f00004.png", b"\x01")])

    def test_capture_crossing_hold_endpoint_is_bounded(self):
        frames, writes = self.film([1.2], seconds=10, hold=0.6, complete_at=0)
        self.assertEqual(frames, 3)
        self.assertEqual([name for name, _ in writes], ["f00000.png", "f00001.png", "f00002.png"])

    def test_mid_capture_stall_repeats_previous_token_without_missing_slots(self):
        frames, writes = self.film([0.01, 0.5], seconds=1)
        self.assertEqual(frames, 5)
        self.assertEqual([token for _, token in writes], [b"\x01", b"\x02", b"\x02", b"\x03", b"\x04"])

    def test_completion_and_hold_keep_the_normal_grid(self):
        frames, _ = self.film([], seconds=10, hold=0.4, complete_at=1)
        self.assertEqual(frames, 7)

    def test_completion_without_hold_and_zero_duration_do_not_add_slots(self):
        self.assertEqual(self.film([], seconds=10, complete_at=0)[0], 0)
        self.assertEqual(self.film([], seconds=0)[0], 0)


if __name__ == "__main__":
    unittest.main()
