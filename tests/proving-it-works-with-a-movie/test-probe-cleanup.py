#!/usr/bin/env python3
"""Focused native Windows cleanup failures, verified with real process handles."""
import argparse
import contextlib
import ctypes
import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import time
import traceback
from unittest.mock import patch


def exercise(probe, root, case):
    directory = root / case
    supervisor = probe.Supervisor(argparse.Namespace(directory=directory, shell_kind="powershell51",
                                                     launch_host="workerbee"))
    terminal, job = supervisor.terminal, supervisor.terminal.job
    real_close = terminal.close
    handles = []
    observed = {"case": case, "passed": False, "token": supervisor.report["environment"]["token"]}

    def fail(label):
        def injected(*args, **kwargs):
            raise PermissionError(f"injected persistent {label} failure")
        return injected

    try:
        job.spawn([sys.executable, str(Path(probe.__file__).resolve()), "--worker", "parent",
                   "--directory", str(directory / "heartbeats")], directory, directory / "worker.log")
        supervisor.sentinel = subprocess.Popen([sys.executable, str(Path(probe.__file__).resolve()),
                                               "--worker", "sentinel", "--directory", str(directory / "sentinel")],
                                              stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        deadline = time.monotonic() + 10
        while time.monotonic() < deadline:
            before = probe.heartbeats(directory / "heartbeats")
            if set(before) == {"parent", "child", "grandchild"} and probe.heartbeats(directory / "sentinel"):
                break
            time.sleep(0.05)
        assert set(before) == {"parent", "child", "grandchild"}, before
        handles = job.snapshot()  # Independent verifier retains handles before injecting faults.
        assert {entry["pid"] for entry in before.values()} <= {entry["pid"] for entry in handles}
        sentinel_handle = job.open_process(supervisor.sentinel.pid)
        try:
            member = ctypes.c_long()
            assert job.k.IsProcessInJob(sentinel_handle, job.handle, ctypes.byref(member))
            assert member.value == 0, "Sentinel must be outside the owned job"
        finally:
            job.k.CloseHandle(sentinel_handle)
        supervisor.pending = {"id": 1, "command": "native heartbeat parent fixture"}
        supervisor.report["close_operation"] = "close"
        observed["before"] = before
        with contextlib.ExitStack() as faults:
            if case == "snapshot":
                faults.enter_context(patch.object(job, "snapshot", fail("snapshot")))
            elif case == "heartbeat":
                faults.enter_context(patch.object(probe, "heartbeats", fail("heartbeat access")))
            elif case == "pending_reply":
                faults.enter_context(patch.object(supervisor, "reply", fail("pending reply")))
            elif case == "terminal_job":
                faults.enter_context(patch.object(terminal, "close", fail("terminal close")))

                def termination_failure(*args):
                    ctypes.set_last_error(5)  # Access denied; real CloseHandle must still kill the job.
                    return 0

                faults.enter_context(patch.object(job.k, "TerminateJobObject", termination_failure))
            elif case == "report_write":
                real_write = probe.write_json

                def report_failure(path, value):
                    if path.name == "probe.json":
                        raise PermissionError("injected persistent report write failure")
                    return real_write(path, value)

                faults.enter_context(patch.object(probe, "write_json", report_failure))
            started = time.monotonic()
            try:
                observed["cleanup_return"] = supervisor.cleanup(None)
            except BaseException as error:
                observed.update(escaped_error=repr(error), escaped_traceback=traceback.format_exc())
            observed["cleanup_seconds"] = time.monotonic() - started
        observed["owned_alive_after_cleanup"] = [p["pid"] for p in handles if job.k.WaitForSingleObject(p["handle"], 0) != 0]
        observed["sentinel_alive_after_cleanup"] = supervisor.sentinel.poll() is None
        after = probe.heartbeats(directory / "heartbeats")
        time.sleep(0.3)
        observed["heartbeats_stopped"] = after == probe.heartbeats(directory / "heartbeats")
        observed["probe_report_exists"] = (directory / "probe.json").exists()
        observed["report"] = supervisor.report
        assert observed["owned_alive_after_cleanup"] == [], observed
        assert not observed["sentinel_alive_after_cleanup"], observed
        assert observed["heartbeats_stopped"], observed
        assert observed["cleanup_seconds"] < 10, observed
        assert "escaped_error" not in observed, observed
        assert observed["cleanup_return"] is (case == "normal"), observed
        expected_status = "passed" if case == "normal" else "failed"
        assert supervisor.report["checks"]["normal_cleanup"]["status"] == expected_status, observed
        if case != "normal":
            assert supervisor.report["cleanup_diagnostics"], observed
            expected = {"snapshot": {"snapshot"}, "heartbeat": {"heartbeats_before", "heartbeats_after"},
                        "pending_reply": {"pending_reply"}, "terminal_job": {"terminal_close", "job_close"},
                        "report_write": {"report_write"}}[case]
            assert expected <= {d["stage"] for d in supervisor.report["cleanup_diagnostics"]}, observed
        assert observed["probe_report_exists"] is (case != "report_write"), observed
        if case != "report_write":
            assert probe.read_json(directory / "probe.json")["checks"]["normal_cleanup"]["status"] == expected_status
        observed["passed"] = True
    except BaseException as error:
        observed.update(assertion_error=repr(error), assertion_traceback=traceback.format_exc())
    finally:
        # Emergency verifier teardown is outside the code under test. The above
        # observations are captured before it, so RED cannot borrow this cleanup.
        try:
            real_close()
        finally:
            if supervisor.sentinel and supervisor.sentinel.poll() is None:
                supervisor.sentinel.terminate()
                supervisor.sentinel.wait(timeout=5)
            for process in handles:
                job.k.WaitForSingleObject(process["handle"], 5000)
                job.k.CloseHandle(process["handle"])
        probe.write_json(directory / "test-observation.json", observed)
    return observed


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--directory", type=Path, required=True)
    parser.add_argument("--probe", type=Path, default=Path(__file__).with_name("probe-windows.py"))
    args = parser.parse_args()
    if sys.platform != "win32":
        parser.error("Native Windows is required; this test cannot be skipped green")
    args.directory.mkdir(parents=True, exist_ok=False)
    spec = importlib.util.spec_from_file_location("windows_probe", args.probe)
    probe = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(probe)
    cases = [exercise(probe, args.directory, case) for case in
             ("snapshot", "heartbeat", "pending_reply", "terminal_job", "report_write", "normal")]
    report = {"probe_sha256": hashlib.sha256(args.probe.read_bytes()).hexdigest(),
              "test_sha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
              "cases": cases, "passed": sum(case["passed"] for case in cases), "total": len(cases)}
    probe.write_json(args.directory / "cleanup-tests.json", report)
    print(json.dumps({"passed": report["passed"], "total": report["total"],
                      "cases": [{key: c.get(key) for key in ("case", "passed", "owned_alive_after_cleanup",
                                                             "sentinel_alive_after_cleanup", "escaped_error")} for c in cases]}), flush=True)
    return 0 if report["passed"] == report["total"] else 1


if __name__ == "__main__":
    sys.exit(main())
