"""Owned Windows process trees for movie capture, extracted from the native probe."""

import os
import subprocess
import sys
import time
from pathlib import Path


class WindowsJob:
    """Suspended roots enter an unnamed, non-inheritable job before resuming."""

    def __init__(self):
        if sys.platform != "win32":
            raise RuntimeError("WindowsJob requires native Windows")
        import ctypes
        from ctypes import wintypes as W
        self.ctypes = ctypes
        U64, SIZE = ctypes.c_ulonglong, ctypes.c_size_t

        class STARTUPINFOW(ctypes.Structure):
            _fields_ = [("cb", W.DWORD), ("lpReserved", W.LPWSTR),
                        ("lpDesktop", W.LPWSTR), ("lpTitle", W.LPWSTR),
                        ("dwX", W.DWORD), ("dwY", W.DWORD), ("dwXSize", W.DWORD),
                        ("dwYSize", W.DWORD), ("dwXCountChars", W.DWORD),
                        ("dwYCountChars", W.DWORD), ("dwFillAttribute", W.DWORD),
                        ("dwFlags", W.DWORD), ("wShowWindow", W.WORD),
                        ("cbReserved2", W.WORD), ("lpReserved2", ctypes.POINTER(W.BYTE)),
                        ("hStdInput", W.HANDLE), ("hStdOutput", W.HANDLE), ("hStdError", W.HANDLE)]

        class PROCESS_INFORMATION(ctypes.Structure):
            _fields_ = [("hProcess", W.HANDLE), ("hThread", W.HANDLE),
                        ("dwProcessId", W.DWORD), ("dwThreadId", W.DWORD)]

        class BASIC_LIMIT(ctypes.Structure):
            _fields_ = [("PerProcessUserTimeLimit", ctypes.c_longlong),
                        ("PerJobUserTimeLimit", ctypes.c_longlong), ("LimitFlags", W.DWORD),
                        ("MinimumWorkingSetSize", SIZE), ("MaximumWorkingSetSize", SIZE),
                        ("ActiveProcessLimit", W.DWORD), ("Affinity", SIZE),
                        ("PriorityClass", W.DWORD), ("SchedulingClass", W.DWORD)]

        class IO_COUNTERS(ctypes.Structure):
            _fields_ = [(name, U64) for name in ("ReadOperationCount", "WriteOperationCount",
                        "OtherOperationCount", "ReadTransferCount", "WriteTransferCount", "OtherTransferCount")]

        class EXTENDED_LIMIT(ctypes.Structure):
            _fields_ = [("BasicLimitInformation", BASIC_LIMIT), ("IoInfo", IO_COUNTERS),
                        ("ProcessMemoryLimit", SIZE), ("JobMemoryLimit", SIZE),
                        ("PeakProcessMemoryUsed", SIZE), ("PeakJobMemoryUsed", SIZE)]

        self.sizes = {"STARTUPINFOW": ctypes.sizeof(STARTUPINFOW),
                      "PROCESS_INFORMATION": ctypes.sizeof(PROCESS_INFORMATION),
                      "BASIC_LIMIT": ctypes.sizeof(BASIC_LIMIT),
                      "IO_COUNTERS": ctypes.sizeof(IO_COUNTERS),
                      "EXTENDED_LIMIT": ctypes.sizeof(EXTENDED_LIMIT)}
        self.SI, self.PI = STARTUPINFOW, PROCESS_INFORMATION
        self.k = ctypes.WinDLL("kernel32", use_last_error=True)
        signatures = {
            "CreateJobObjectW": ([ctypes.c_void_p, W.LPCWSTR], W.HANDLE),
            "SetInformationJobObject": ([W.HANDLE, ctypes.c_int, ctypes.c_void_p, W.DWORD], W.BOOL),
            "QueryInformationJobObject": ([W.HANDLE, ctypes.c_int, ctypes.c_void_p, W.DWORD, ctypes.POINTER(W.DWORD)], W.BOOL),
            "CreateProcessW": ([W.LPCWSTR, W.LPWSTR, ctypes.c_void_p, ctypes.c_void_p, W.BOOL,
                                W.DWORD, ctypes.c_void_p, W.LPCWSTR, ctypes.POINTER(STARTUPINFOW),
                                ctypes.POINTER(PROCESS_INFORMATION)], W.BOOL),
            "AssignProcessToJobObject": ([W.HANDLE, W.HANDLE], W.BOOL),
            "ResumeThread": ([W.HANDLE], W.DWORD),
            "TerminateProcess": ([W.HANDLE, W.UINT], W.BOOL),
            "TerminateJobObject": ([W.HANDLE, W.UINT], W.BOOL),
            "CloseHandle": ([W.HANDLE], W.BOOL),
            "WaitForSingleObject": ([W.HANDLE, W.DWORD], W.DWORD),
            "GetExitCodeProcess": ([W.HANDLE, ctypes.POINTER(W.DWORD)], W.BOOL),
            "OpenProcess": ([W.DWORD, W.BOOL, W.DWORD], W.HANDLE),
            "GetProcessTimes": ([W.HANDLE] + [ctypes.POINTER(W.FILETIME)] * 4, W.BOOL),
            "IsProcessInJob": ([W.HANDLE, W.HANDLE, ctypes.POINTER(W.BOOL)], W.BOOL),
        }
        for name, (arguments, returns) in signatures.items():
            function = getattr(self.k, name)
            function.argtypes, function.restype = arguments, returns
        self.handle = self.k.CreateJobObjectW(None, None)
        if not self.handle:
            raise ctypes.WinError(ctypes.get_last_error())
        limits = EXTENDED_LIMIT()
        limits.BasicLimitInformation.LimitFlags = 0x2000  # KILL_ON_JOB_CLOSE; no breakaway
        if not self.k.SetInformationJobObject(self.handle, 9, ctypes.byref(limits), ctypes.sizeof(limits)):
            error = ctypes.get_last_error()
            self.k.CloseHandle(self.handle)
            raise ctypes.WinError(error)
        self.roots = {}

    def spawn(self, argv: list[str], directory: Path, log: Path,
              env: dict[str, str] | None = None) -> int:
        import msvcrt
        ctypes = self.ctypes
        if not self.handle:
            raise RuntimeError("Job is closed")

        if not argv or not Path(argv[0]).is_absolute():
            raise ValueError("An absolute executable path is required")
        environment = dict(os.environ) if env is None else env
        block = ctypes.create_unicode_buffer("\0".join(f"{k}={v}" for k, v in sorted(environment.items())) + "\0\0")
        si, pi = self.SI(), self.PI()
        si.cb, si.dwFlags = ctypes.sizeof(si), 0x100  # STARTF_USESTDHANDLES
        with open(os.devnull, "rb") as stdin, log.open("ab", buffering=0) as output:
            handles = [msvcrt.get_osfhandle(f.fileno()) for f in (stdin, output)]
            for handle in handles:
                os.set_handle_inheritable(handle, True)
            si.hStdInput, si.hStdOutput, si.hStdError = handles[0], handles[1], handles[1]
            try:
                created = self.k.CreateProcessW(argv[0], ctypes.create_unicode_buffer(subprocess.list2cmdline(argv)),
                    None, None, True, 0x404, block, str(directory), ctypes.byref(si), ctypes.byref(pi))
            finally:
                for handle in handles:
                    os.set_handle_inheritable(handle, False)
        if not created:
            raise ctypes.WinError(ctypes.get_last_error())
        try:
            if not self.k.AssignProcessToJobObject(self.handle, pi.hProcess):
                raise ctypes.WinError(ctypes.get_last_error())
            if self.k.ResumeThread(pi.hThread) == 0xFFFFFFFF:
                raise ctypes.WinError(ctypes.get_last_error())
        except BaseException:
            self.k.TerminateProcess(pi.hProcess, 1)
            self.k.WaitForSingleObject(pi.hProcess, 5000)
            self.k.CloseHandle(pi.hProcess)
            raise
        finally:
            self.k.CloseHandle(pi.hThread)
        self.roots[pi.dwProcessId] = pi.hProcess
        return pi.dwProcessId

    def wait(self, pid: int, timeout: float) -> int:
        handle = self.roots[pid]
        result = self.k.WaitForSingleObject(handle, max(0, int(timeout * 1000)))
        if result == 258:
            raise TimeoutError(f"Owned process {pid} exceeded {timeout:g}s")
        if result != 0:
            raise self.ctypes.WinError(self.ctypes.get_last_error())
        from ctypes import wintypes as W
        code = W.DWORD()
        if not self.k.GetExitCodeProcess(handle, self.ctypes.byref(code)):
            raise self.ctypes.WinError(self.ctypes.get_last_error())
        return int(code.value)

    def pids(self):
        ctypes = self.ctypes
        from ctypes import wintypes as W

        class PROCESS_LIST(ctypes.Structure):
            _fields_ = [("assigned", W.DWORD), ("count", W.DWORD), ("pids", ctypes.c_size_t * 1024)]

        info = PROCESS_LIST()
        if not self.k.QueryInformationJobObject(self.handle, 3, ctypes.byref(info), ctypes.sizeof(info), None):
            raise ctypes.WinError(ctypes.get_last_error())
        return list(info.pids[:info.count])

    def process_time(self, handle):
        ctypes = self.ctypes
        from ctypes import wintypes as W

        times = [W.FILETIME() for _ in range(4)]
        if not self.k.GetProcessTimes(handle, *(ctypes.byref(value) for value in times)):
            raise ctypes.WinError(ctypes.get_last_error())
        return (times[0].dwHighDateTime << 32) | times[0].dwLowDateTime

    def open_process(self, pid, creation=None, terminate=False):
        ctypes = self.ctypes
        handle = self.k.OpenProcess(0x100000 | 0x1000 | int(terminate), False, pid)
        if not handle:
            raise ctypes.WinError(ctypes.get_last_error())
        try:
            if creation is not None and self.process_time(handle) != creation:
                raise RuntimeError("Process creation time changed; refusing stale PID")
        except BaseException:
            self.k.CloseHandle(handle)
            raise
        return handle

    def snapshot(self):
        ctypes = self.ctypes
        from ctypes import wintypes as W

        processes = []
        try:
            for pid in self.pids():
                try:
                    handle = self.open_process(pid)
                except OSError as error:
                    if error.winerror == 87:  # Exited between enumeration and open.
                        continue
                    raise
                try:
                    owned = W.BOOL()
                    if not self.k.IsProcessInJob(handle, self.handle, ctypes.byref(owned)) or not owned.value:
                        raise RuntimeError("Process is no longer a member of the owned job")
                    creation = self.process_time(handle)
                except BaseException:
                    self.k.CloseHandle(handle)
                    raise
                processes.append({"pid": pid, "handle": handle, "creation": creation})
            return processes
        except BaseException:
            for process in processes:
                self.k.CloseHandle(process["handle"])
            raise

    def close(self) -> None:
        ctypes = self.ctypes
        if not self.handle:
            return
        processes = []
        try:
            # The job's active PID list can empty before terminated processes
            # finish releasing files. Retain identities and wait for exit too.
            processes = self.snapshot()
            if not self.k.TerminateJobObject(self.handle, 1):
                raise ctypes.WinError(ctypes.get_last_error())
            deadline = time.monotonic() + 5
            for process in processes:
                remaining = max(0, int((deadline - time.monotonic()) * 1000))
                status = self.k.WaitForSingleObject(process["handle"], remaining)
                if status == 258:
                    raise TimeoutError("Owned process did not finish termination")
                if status != 0:
                    raise ctypes.WinError(ctypes.get_last_error())
            while self.pids() and time.monotonic() < deadline:
                time.sleep(0.05)
            if self.pids():
                raise TimeoutError("Owned processes remain after job termination")
        finally:
            self.k.CloseHandle(self.handle)
            self.handle = None
            for process in processes:
                self.k.CloseHandle(process["handle"])
            for handle in self.roots.values():
                self.k.CloseHandle(handle)
            self.roots.clear()
