import os
import tempfile
import unittest
from pathlib import Path

import fixtures


class IdentityFailureTests(unittest.TestCase):
    def job(self):
        import ctypes
        from unittest.mock import Mock
        module = fixtures.load_script("windows_jobs")
        job = module.WindowsJob.__new__(module.WindowsJob)
        job.ctypes = ctypes
        job.k = Mock()
        job.handle = 10
        return job

    def test_open_identity_failure_closes_current_handle(self):
        from unittest.mock import Mock
        job = self.job()
        job.k.OpenProcess.return_value = 21
        job.process_time = Mock(side_effect=RuntimeError("identity unavailable"))
        with self.assertRaisesRegex(RuntimeError, "identity unavailable"):
            job.open_process(3, creation=123)
        job.k.CloseHandle.assert_called_once_with(21)

    def test_snapshot_identity_failure_closes_current_and_previous_handles(self):
        from unittest.mock import Mock, call
        job = self.job()
        job.pids = Mock(return_value=[1, 2])
        job.open_process = Mock(side_effect=[21, 22])
        def owned(handle, parent, output):
            output._obj.value = True
            return True
        job.k.IsProcessInJob.side_effect = owned
        job.process_time = Mock(side_effect=[123, RuntimeError("identity unavailable")])
        with self.assertRaisesRegex(RuntimeError, "identity unavailable"):
            job.snapshot()
        self.assertCountEqual(job.k.CloseHandle.call_args_list, [call(21), call(22)])


@unittest.skipUnless(os.name == "nt", "Windows Job ownership is native Windows only")
class WindowsJobRegression(unittest.TestCase):
    def test_job_wait_and_close_own_child_process(self):
        module = fixtures.load_script("windows_jobs")
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            log = root / "child.log"
            job = module.WindowsJob()
            try:
                pid = job.spawn([str(Path(os.environ["ComSpec"])), "/c", "exit 7"], root, log)
                self.assertEqual(job.wait(pid, 10), 7)
            finally:
                job.close()

@unittest.skipUnless(os.name == "nt", "Windows Job ownership is native Windows only")
class WindowsJobCleanupRegression(unittest.TestCase):
    def test_timeout_closes_descendants_without_touching_sentinel(self):
        import subprocess
        import sys
        import time
        module = fixtures.load_script("windows_jobs")
        sentinel = subprocess.Popen([sys.executable, "-c", "import time; time.sleep(60)"])
        try:
            with tempfile.TemporaryDirectory() as directory:
                root = Path(directory)
                child = "import time; time.sleep(60)"
                code = f"import subprocess,sys,time; subprocess.Popen([sys.executable, '-c', {child!r}]); time.sleep(60)"
                job = module.WindowsJob()
                snapshot = []
                try:
                    pid = job.spawn([sys.executable, "-c", code], root, root / "log")
                    with self.assertRaises(TimeoutError):
                        job.wait(pid, 0.05)
                    deadline = time.monotonic() + 5
                    while len(job.pids()) < 2 and time.monotonic() < deadline:
                        time.sleep(0.05)
                    snapshot = job.snapshot()
                    self.assertGreaterEqual(len(snapshot), 2)
                    start = time.monotonic()
                    job.close()
                    job.close()
                    self.assertLess(time.monotonic() - start, 10)
                    for process in snapshot:
                        self.assertEqual(job.k.WaitForSingleObject(process["handle"], 0), 0)
                    self.assertIsNone(sentinel.poll())
                finally:
                    job.close()
                    for process in snapshot:
                        job.k.CloseHandle(process["handle"])
        finally:
            sentinel.terminate()
            sentinel.wait(timeout=10)


if __name__ == "__main__":
    unittest.main()
