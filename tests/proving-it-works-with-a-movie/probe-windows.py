#!/usr/bin/env python3
# /// script
# requires-python = ">=3.12"
# dependencies = ["websocket-client==1.9.0"]
# ///
"""Native Windows terminal feasibility probe; a missing observation fails the gate."""
import argparse
import base64
import codecs
import ctypes
import hashlib
import json
import os
import platform
import re
import socket
import struct
import subprocess
import sys
import time
import traceback
import urllib.request
import uuid
from pathlib import Path


def assert_probe(result):
    assert result["terminal_client_count"] == 1
    assert result["observed_session_id"] == result["filmed_session_id"]
    assert result["nonce_before"] == result["nonce_after"]
    assert result["shell_pid_before"] == result["shell_pid_after"]
    assert result["variable_after"] == "persisted-λ"
    assert result["long_command_survived_take_boundary"]
    assert result["owned_children_remaining"] == []
    assert result["unrelated_sentinel_alive"]
    assert result["shutdown_seconds"] < 10


def assert_gate(result):
    assert set(result["shells"]) == {"powershell51", "powershell7", "gitbash"}
    for shell in result["shells"].values():
        assert_probe(shell)
    assert set(result["checks"]) == {"prerequisites"} | {
        f"{shell}.{check}" for shell in result["shells"]
        for check in (*REQUIRED, "ordinary_user", "interactive", "bounded_resize", "capture_artifacts")}
    assert all(check["status"] == "passed" for check in result["checks"].values())


def assert_outcomes(records):
    expected = {
        "native_success": (True, 0),
        "cmdlet_failure": (False, None),
        "native_failure": (False, 7),
        "cmdlet_success": (True, None),
        "terminating_error": (False, None),
        "nonterminating_error": (False, None),
        "parse_failure": (False, None),
    }
    for name, (success, native_exit) in expected.items():
        record = records[name]
        assert record["outcome"] == "completed", (name, record)
        assert record["shell_success"] is success, (name, record)
        assert record["native_exit_code"] == native_exit, (name, record)
    for name in ("cmdlet_failure", "terminating_error", "nonterminating_error", "parse_failure"):
        assert records[name]["shell_error"], (name, records[name])
    assert records["logging_failure"]["producer_exit_code"] == 7
    assert records["logging_failure"]["native_exit_code"] == 7
    assert records["logging_failure"]["producer_success"] is False


def file_handoff(operation):
    # A Windows reader can overlap an atomic replacement. Retry the operation,
    # never substitute old/empty evidence; persistent access errors still fail.
    deadline = time.monotonic() + 0.5
    while True:
        try:
            return operation()
        except PermissionError:
            if time.monotonic() >= deadline:
                raise
            time.sleep(0.01)


def read_json(path):
    return json.loads(file_handoff(lambda: path.read_text(encoding="utf-8")))


def write_json(path, value):
    temporary = path.with_suffix(".tmp")
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding="utf-8")
    file_handoff(lambda: temporary.replace(path))


def token_info():
    """Query this process's actual token, without changing it."""
    from ctypes import wintypes as W

    kernel = ctypes.WinDLL("kernel32", use_last_error=True)
    security = ctypes.WinDLL("advapi32", use_last_error=True)
    kernel.GetCurrentProcess.argtypes, kernel.GetCurrentProcess.restype = [], W.HANDLE
    kernel.CloseHandle.argtypes, kernel.CloseHandle.restype = [W.HANDLE], W.BOOL
    security.OpenProcessToken.argtypes = [W.HANDLE, W.DWORD, ctypes.POINTER(W.HANDLE)]
    security.OpenProcessToken.restype = W.BOOL
    security.GetTokenInformation.argtypes = [W.HANDLE, ctypes.c_int, ctypes.c_void_p, W.DWORD, ctypes.POINTER(W.DWORD)]
    security.GetTokenInformation.restype = W.BOOL
    security.GetSidSubAuthorityCount.argtypes = [ctypes.c_void_p]
    security.GetSidSubAuthorityCount.restype = ctypes.POINTER(W.BYTE)
    security.GetSidSubAuthority.argtypes = [ctypes.c_void_p, W.DWORD]
    security.GetSidSubAuthority.restype = ctypes.POINTER(W.DWORD)
    token = W.HANDLE()
    if not security.OpenProcessToken(kernel.GetCurrentProcess(), 8, ctypes.byref(token)):
        raise ctypes.WinError(ctypes.get_last_error())
    try:
        def query(kind):
            length = W.DWORD()
            security.GetTokenInformation(token, kind, None, 0, ctypes.byref(length))
            buffer = ctypes.create_string_buffer(length.value)
            if not security.GetTokenInformation(token, kind, buffer, len(buffer), ctypes.byref(length)):
                raise ctypes.WinError(ctypes.get_last_error())
            return buffer

        integrity = query(25)
        sid = ctypes.cast(integrity, ctypes.POINTER(ctypes.c_void_p))[0]
        count = security.GetSidSubAuthorityCount(sid)[0]
        rid = security.GetSidSubAuthority(sid, count - 1)[0]
        result = {"pid": os.getpid(), "elevated": bool(W.DWORD.from_buffer(query(20)).value),
                  "elevation_type": W.DWORD.from_buffer(query(18)).value,
                  "integrity_rid": rid, "integrity_sid": f"S-1-16-{rid}",
                  "desktop_session": W.DWORD.from_buffer(query(12)).value}
        result["ordinary_user"] = not result["elevated"] and rid == 8192
        whoami = Path(os.environ["SystemRoot"]) / "System32" / "whoami.exe"
        result["whoami_groups"] = subprocess.run([str(whoami), "/all"], capture_output=True, check=True).stdout.decode("utf-8", "replace")
        return result
    finally:
        kernel.CloseHandle(token)


def ttyd_output(event: dict) -> bytes:
    frame = event["params"]["response"]
    payload = frame["payloadData"]
    raw = base64.b64decode(payload) if frame["opcode"] == 2 else payload.encode("utf-8")
    return raw[1:] if raw[:1] == b"0" else b""


class CompletionParser:
    """Parse bounded multiline records; this is not a VT redraw emulator."""

    def __init__(self):
        self.decoder = codecs.getincrementaldecoder("utf-8")("replace")
        self.text = ""
        self.records = []

    def feed(self, data):
        self.text += self.decoder.decode(data)
        clean = re.sub(r"\x1b\][^\x07]*(?:\x07|\x1b\\)|\x1b\[[0-?]*[ -/]*[@-~]", "", self.text)
        for match in re.finditer(r"\[PROBE\|([A-Za-z0-9+/=\s]+)\|END\]", clean):
            record = json.loads(base64.b64decode(re.sub(r"\s", "", match[1]), validate=True).decode("utf-8"))
            if record not in self.records:
                self.records.append(record)


class WindowsJob:
    """Suspended roots enter an unnamed, non-inheritable job before resuming."""

    def __init__(self):
        from ctypes import wintypes as W

        if sys.platform != "win32" or struct.calcsize("P") != 8:
            raise RuntimeError("This probe requires native Windows x64 Python")
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
        assert list(self.sizes.values()) == [104, 24, 64, 48, 144], self.sizes
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
        self.roots = []

    def spawn(self, argv, directory, log, env=None):
        import msvcrt

        if not Path(argv[0]).is_absolute():
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
        self.roots.append((pi.dwProcessId, pi.hProcess))
        return pi.dwProcessId

    def pids(self):
        from ctypes import wintypes as W

        class PROCESS_LIST(ctypes.Structure):
            _fields_ = [("assigned", W.DWORD), ("count", W.DWORD), ("pids", ctypes.c_size_t * 1024)]

        info = PROCESS_LIST()
        if not self.k.QueryInformationJobObject(self.handle, 3, ctypes.byref(info), ctypes.sizeof(info), None):
            raise ctypes.WinError(ctypes.get_last_error())
        return list(info.pids[:info.count])

    def process_time(self, handle):
        from ctypes import wintypes as W

        times = [W.FILETIME() for _ in range(4)]
        if not self.k.GetProcessTimes(handle, *(ctypes.byref(value) for value in times)):
            raise ctypes.WinError(ctypes.get_last_error())
        return (times[0].dwHighDateTime << 32) | times[0].dwLowDateTime

    def open_process(self, pid, creation=None, terminate=False):
        handle = self.k.OpenProcess(0x100000 | 0x1000 | int(terminate), False, pid)
        if not handle:
            raise ctypes.WinError(ctypes.get_last_error())
        if creation is not None and self.process_time(handle) != creation:
            self.k.CloseHandle(handle)
            raise RuntimeError("Process creation time changed; refusing stale PID")
        return handle

    def snapshot(self):
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
                owned = W.BOOL()
                if not self.k.IsProcessInJob(handle, self.handle, ctypes.byref(owned)) or not owned.value:
                    self.k.CloseHandle(handle)
                    raise RuntimeError("Process is no longer a member of the owned job")
                processes.append({"pid": pid, "handle": handle, "creation": self.process_time(handle)})
            return processes
        except BaseException:
            for process in processes:
                self.k.CloseHandle(process["handle"])
            raise

    def close(self):
        if not self.handle:
            return
        try:
            if not self.k.TerminateJobObject(self.handle, 1):
                raise ctypes.WinError(ctypes.get_last_error())
            deadline = time.monotonic() + 5
            while self.pids() and time.monotonic() < deadline:
                time.sleep(0.05)
            if self.pids():
                raise TimeoutError("Owned processes remain after job termination")
        finally:
            self.k.CloseHandle(self.handle)
            self.handle = None
            for _, handle in self.roots:
                self.k.CloseHandle(handle)


def free_port():
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


def http_json(url):
    with urllib.request.urlopen(url, timeout=1) as response:
        return json.load(response)


class CDP:
    def __init__(self, url, on_event, trace_path):
        import websocket

        self.ws = websocket.create_connection(url, timeout=5, suppress_origin=True)
        self.ws.settimeout(0.1)
        self.on_event, self.counter, self.responses = on_event, 0, {}
        self.trace = trace_path.open("w", encoding="utf-8")

    def log(self, direction, **fields):
        self.trace.write(json.dumps({"time": time.time(), "direction": direction, **fields}) + "\n")
        self.trace.flush()

    def send(self, method, params=None):
        self.counter += 1
        self.ws.send(json.dumps({"id": self.counter, "method": method, "params": params or {}}))
        self.log("sent", id=self.counter, method=method,
                 frame_session_id=(params or {}).get("sessionId"))
        return self.counter

    def pump(self):
        import websocket

        try:
            raw = self.ws.recv()
        except websocket.WebSocketTimeoutException:
            self.log("receive_timeout")
            return
        if not raw:
            raise ConnectionError("Browser CDP connection closed")
        event = json.loads(raw)
        self.log("received", id=event.get("id"), method=event.get("method"),
                 frame_session_id=event.get("params", {}).get("sessionId"))
        if "id" in event:
            self.responses[event["id"]] = event
        else:
            self.on_event(event)

    def call(self, method, params=None, timeout=5):
        request = self.send(method, params)
        deadline = time.monotonic() + timeout
        while request not in self.responses and time.monotonic() < deadline:
            self.pump()
        response = self.responses.pop(request, None)
        if response is None or "error" in response:
            raise RuntimeError(f"CDP {method}: {response}")
        return response.get("result", {})


class Terminal:
    def __init__(self, args, directory):
        self.directory, self.args = directory, args
        directory.mkdir(parents=True, exist_ok=False)
        self.session = uuid.uuid4().hex
        self.parser = CompletionParser()
        self.request_id = None
        self.socket_ids = []
        self.closed = False
        self.frames = []
        self.cdp = None
        self.raw = (directory / "network.jsonl").open("w", encoding="utf-8")
        self.output = (directory / "terminal.bin").open("wb")
        self.job = WindowsJob()
        self.launches = []
        self.take = None
        self.take_frames = []
        self.terminal_sizes = []

    def event(self, event):
        method, params = event["method"], event.get("params", {})
        if method == "Page.screencastFrame":
            if self.take is not None:
                frame_path = self.directory / self.take / f"{len(self.take_frames):06d}.jpg"
                frame_path.write_bytes(base64.b64decode(params["data"]))
                self.take_frames.append({"path": str(frame_path), "received_at": time.time(),
                                         "metadata": params["metadata"], "page_id": self.page_id,
                                         "websocket_id": self.request_id, "session_id": self.session})
                write_json(self.directory / self.take / "frames.json", self.take_frames)
            self.cdp.send("Page.screencastFrameAck", {"sessionId": params["sessionId"]})
            return
        if method.startswith("Network.webSocket"):
            self.raw.write(json.dumps(event, ensure_ascii=False) + "\n")
            self.raw.flush()
        if method == "Network.webSocketCreated" and params["url"] == self.terminal_url.replace("http:", "ws:") + "ws":
            self.socket_ids.append(params["requestId"])
            if self.request_id is None:
                self.request_id = params["requestId"]
            else:
                self.closed = True  # A reconnect is never continuity.
        if params.get("requestId") != self.request_id or self.request_id is None:
            return
        if method == "Network.webSocketClosed":
            self.closed = True
        if method == "Network.webSocketFrameSent":
            frame = params["response"]
            raw = base64.b64decode(frame["payloadData"]) if frame["opcode"] == 2 else frame["payloadData"].encode("utf-8")
            payload = raw[1:] if raw[:1] == b"1" else raw
            if payload[:1] == b"{":
                size = json.loads(payload)
                if "columns" in size and "rows" in size:
                    self.terminal_sizes.append({"columns": size["columns"], "rows": size["rows"],
                                                "observed_at": time.time(), "request_id": self.request_id})
        if method == "Network.webSocketFrameReceived":
            frame = params["response"]
            raw = base64.b64decode(frame["payloadData"]) if frame["opcode"] == 2 else frame["payloadData"].encode("utf-8")
            self.frames.append({"opcode": frame["opcode"], "leading_byte": raw[:1].hex(), "bytes": len(raw)})
            data = ttyd_output(event)
            self.output.write(data)
            self.output.flush()
            self.parser.feed(data)

    def start(self):
        port, debug_port = free_port(), free_port()
        self.terminal_url = f"http://127.0.0.1:{port}/"
        shell_argv = [str(self.args.shell)] + (["--noprofile", "--norc", "-i"] if self.args.shell_kind == "gitbash" else ["-NoLogo", "-NoProfile", "-NoExit"])
        # ttyd 1.7.7 leaves its ConPTY cwd pointer uninitialized without -w.
        ttyd_argv = [str(self.args.ttyd), "-i", "127.0.0.1", "-p", str(port), "-W", "-m", "1",
                     "-w", str(self.directory)] + shell_argv
        browser_argv = [str(self.args.browser), "--headless=new", "--no-first-run", "--no-default-browser-check",
                        "--disable-background-networking", "--remote-debugging-address=127.0.0.1",
                        f"--remote-debugging-port={debug_port}", f"--user-data-dir={self.directory / 'profile'}",
                        "--window-size=1600,900", "about:blank"]
        for name, argv in (("ttyd", ttyd_argv), ("browser", browser_argv)):
            pid = self.job.spawn(argv, self.directory, self.directory / f"{name}.log")
            self.launches.append({"name": name, "argv": argv, "pid": pid})
        write_json(self.directory / "launches.json", self.launches)
        deadline = time.monotonic() + 20
        last_error = None
        while time.monotonic() < deadline:
            try:
                pages = http_json(f"http://127.0.0.1:{debug_port}/json/list")
                page = next(p for p in pages if p["type"] == "page")
                self.cdp = CDP(page["webSocketDebuggerUrl"], self.event, self.directory / "cdp-trace.jsonl")
                break
            except (OSError, StopIteration) as error:
                last_error = error
                time.sleep(0.1)
        if self.cdp is None:
            raise TimeoutError(f"Browser startup: {last_error}")
        self.page_id = page["id"]
        self.cdp.call("Network.enable")  # Must precede navigation and terminal socket creation.
        self.cdp.call("Page.enable")
        self.cdp.call("Page.navigate", {"url": self.terminal_url})
        deadline = time.monotonic() + 10
        while time.monotonic() < deadline:
            self.cdp.pump()
            if self.parser.text or self.closed:
                break
        self.screenshot("startup.png")
        if self.closed:
            raise ConnectionError("Terminal WebSocket closed before readiness")
        if not self.parser.text:
            raise TimeoutError("No ttyd output from the filmed terminal within 10 seconds")

    def screenshot(self, name):
        result = self.cdp.call("Page.captureScreenshot", {"format": "png"})
        (self.directory / name).write_bytes(base64.b64decode(result["data"]))

    def type(self, text):
        self.cdp.call("Runtime.evaluate", {"expression": "document.querySelector('.xterm-helper-textarea').focus()"})
        self.cdp.call("Input.insertText", {"text": text})
        self.cdp.call("Input.dispatchKeyEvent", {"type": "keyDown", "key": "Enter", "code": "Enter", "windowsVirtualKeyCode": 13, "text": "\r"})
        self.cdp.call("Input.dispatchKeyEvent", {"type": "keyUp", "key": "Enter", "code": "Enter", "windowsVirtualKeyCode": 13})

    def readiness(self):
        if self.args.shell_kind == "gitbash":
            # Native Windows Python is explicit even inside Git Bash.
            python = str(Path(sys.executable)).replace("\\", "/")
            code = "import base64,json,os;print('[PROBE|'+base64.b64encode(json.dumps(dict(session=os.environ['PROBE_SESSION'],pid=os.environ['PROBE_SHELL_PID'],shell='gitbash',cwd=os.getcwd())).encode()).decode()+'|END]')"
            command = f"export PROBE_SESSION={self.session} PROBE_SHELL_PID=$$; '{python}' -c '{code.replace(chr(39), chr(39)+chr(34)+chr(39)+chr(34)+chr(39))}'"
            # Encode the Python payload to keep the complete framing out of input echo.
            payload = base64.b64encode(code.encode()).decode()
            command = f"export PROBE_SESSION={self.session} PROBE_SHELL_PID=$$; '{python}' -c \"import base64;exec(base64.b64decode('{payload}'))\""
        else:
            script = "$global:ProbeSession='" + self.session + "'; $r=@{session=$ProbeSession;pid=$PID;shell=$PSVersionTable.PSVersion.ToString();cwd=(Get-Location).Path}; [Console]::WriteLine('[PROBE|'+[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes(($r|ConvertTo-Json -Compress)))+'|END]')"
            payload = base64.b64encode(script.encode("utf-8")).decode()
            command = ". ([scriptblock]::Create([Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('" + payload + "'))))"
        write_json(self.directory / "readiness-command.json", {"command": command, "session": self.session})
        self.type(command)
        deadline = time.monotonic() + 10
        while time.monotonic() < deadline:
            self.cdp.pump()
            matches = [r for r in self.parser.records if r.get("session") == self.session]
            if matches:
                self.screenshot("ready.png")
                return matches[-1]
            if self.closed:
                raise ConnectionError("Terminal connection lost during readiness")
        self.screenshot("readiness-timeout.png")
        raise TimeoutError("No nonce/shell/cwd completion record from the filmed terminal")

    def wait_record(self, predicate, timeout=10):
        deadline = time.monotonic() + timeout
        while time.monotonic() < deadline:
            matches = [record for record in self.parser.records if record.get("session") == self.session and predicate(record)]
            if matches:
                return matches[-1]
            if self.closed:
                raise ConnectionError("Terminal connection lost while waiting for completion")
            self.cdp.pump()
        raise TimeoutError("Missing terminal completion record")

    def install_prompt(self):
        if self.args.shell_kind == "gitbash":
            python = str(Path(sys.executable)).replace("\\", "/")
            source = str(Path(__file__).resolve()).replace("\\", "/")
            script = f'''export PROBE_SESSION={self.session}
PROBE_PHASE=boot
probe_prompt() {{
    local probe_status=$? probe_pipeline=("${{PIPESTATUS[@]}}")
    if [[ -n "$PROBE_PHASE" ]]; then
        PROBE_STATUS="$probe_status" PROBE_PIPELINE="${{probe_pipeline[*]}}" PROBE_SHELL_PID=$$ PROBE_CWD="$PWD" PROBE_VALUE="$PROBE_VALUE" PROBE_PHASE="$PROBE_PHASE" PROBE_REQUEST="$PROBE_REQUEST" PROBE_NATIVE="$PROBE_NATIVE" '{python}' '{source}' --emit-bash
        if [[ "$PROBE_PHASE" == arm ]]; then PROBE_PHASE=run; else PROBE_PHASE=; fi
    fi
    return "$probe_status"
}}
PROMPT_COMMAND=probe_prompt
PS1='PROBE $ '
'''
            payload = base64.b64encode(script.encode()).decode()
            self.type(f'''eval "$('{python}' -c "import base64;print(base64.b64decode('{payload}').decode())")"''')
        else:
            script = r'''
$global:ProbeErrorCount=$Error.Count
$global:ProbePhase='boot'
function global:prompt {
    $probeOK=$?
    $probeNative=$global:LASTEXITCODE
    if ($global:ProbePhase) {
        $probeError=$null
        $parseError=$false
        if ($Error.Count -gt 0 -and $Error.Count -gt $global:ProbeErrorCount) {
            $probeError=$Error[0].ToString()
            $parseError=($Error[0] -is [System.Management.Automation.ParseException] -or $Error[0].Exception -is [System.Management.Automation.ParseException] -or $Error[0].CategoryInfo.Category -eq 'ParserError')
        }
        $record=@{session=$global:ProbeSession;request=$global:ProbeRequest;phase=$global:ProbePhase;pid=$PID;cwd=(Get-Location).Path;variable=$global:ProbeValue;outcome='completed';shell_success=($probeOK -and -not $parseError);raw_shell_success=$probeOK;parse_error=$parseError;native_exit_code=$null;shell_error=$probeError;producer_exit_code=$null;producer_success=$null}
        if ($global:ProbeNative -and -not $parseError) {$record.native_exit_code=$probeNative;$record.producer_exit_code=$probeNative;$record.producer_success=($probeNative -eq 0)}
        if ($global:ProbePhase -eq 'arm') {$global:ProbePhase='run'} else {$global:ProbePhase=$null}
        $encoded=[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes(($record|ConvertTo-Json -Compress)))
        [Console]::WriteLine('[PROBE|')
        for ($offset=0;$offset -lt $encoded.Length;$offset+=60) {[Console]::WriteLine($encoded.Substring($offset,[Math]::Min(60,$encoded.Length-$offset)))}
        [Console]::WriteLine('|END]')
    }
    return 'PROBE PS> '
}
'''
            payload = base64.b64encode(script.encode()).decode()
            self.type(". ([scriptblock]::Create([Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('" + payload + "'))))")
        try:
            return self.wait_record(lambda r: r.get("phase") == "boot")
        except TimeoutError:
            if self.args.shell_kind != "gitbash":
                self.type("$Error | Select-Object -First 3 | Format-List * -Force")
                deadline = time.monotonic() + 2
                while time.monotonic() < deadline:
                    self.cdp.pump()
                self.screenshot("prompt-error.png")
            raise

    def arm(self, request, native):
        if self.args.shell_kind == "gitbash":
            command = f"PROBE_REQUEST={request}; PROBE_NATIVE={int(bool(native))}; PROBE_PHASE=arm"
        else:
            command = f"$global:ProbeRequest={request}; $global:ProbeNative=${str(bool(native)).lower()}; $global:ProbeErrorCount=$Error.Count; $global:ProbePhase='arm'"
        self.type(command)
        self.wait_record(lambda r: r.get("phase") == "arm" and str(r.get("request")) == str(request))

    def begin_take(self, name):
        if self.take is not None:
            raise RuntimeError("A take is already active")
        if not re.fullmatch(r"[a-zA-Z0-9_-]+", name):
            raise ValueError("Invalid take name")
        (self.directory / name).mkdir(exist_ok=False)
        self.take, self.take_frames = name, []
        self.cdp.call("Page.startScreencast", {"format": "jpeg", "quality": 80, "everyNthFrame": 1})

    def end_take(self):
        if self.take is None:
            raise RuntimeError("No take is active")
        self.cdp.call("Page.stopScreencast")
        self.screenshot(self.take + "-end.png")
        frames = self.take_frames
        write_json(self.directory / self.take / "frames.json", frames)
        self.take = None
        return frames

    def key(self, key):
        if key == "CTRL_C":
            params = {"key": "c", "code": "KeyC", "windowsVirtualKeyCode": 67, "modifiers": 2}
        elif key == "ENTER":
            params = {"key": "Enter", "code": "Enter", "windowsVirtualKeyCode": 13, "text": "\r"}
        else:
            params = {"key": key, "text": key, "windowsVirtualKeyCode": ord(key.upper())}
        self.cdp.call("Input.dispatchKeyEvent", {"type": "keyDown", **params})
        self.cdp.call("Input.dispatchKeyEvent", {"type": "keyUp", **{k: v for k, v in params.items() if k != "text"}})

    def close(self):
        start = time.monotonic()
        try:
            self.job.close()
        finally:
            if self.cdp is not None:
                self.cdp.ws.close()
                self.cdp.trace.close()
            self.output.close()
            self.raw.close()
        return time.monotonic() - start


REQUIRED = ("readiness", "framing", "command_outcomes", "two_takes", "extra_client",
            "browser_loss", "normal_cleanup", "cancel_cleanup", "crash_cleanup")


def emit_bash():
    env = os.environ
    status = int(env["PROBE_STATUS"])
    native = env.get("PROBE_NATIVE") == "1"
    pipeline = [int(value) for value in env["PROBE_PIPELINE"].split()]
    record = dict(session=env["PROBE_SESSION"], request=env.get("PROBE_REQUEST"),
                  phase=env["PROBE_PHASE"], pid=env["PROBE_SHELL_PID"],
                  pid_kind="msys", cwd=env["PROBE_CWD"], variable=env.get("PROBE_VALUE"),
                  outcome="completed", shell_success=status == 0,
                  native_exit_code=pipeline[0] if native else None, shell_error=None,
                  pipeline_statuses=pipeline, producer_exit_code=pipeline[0] if native else None,
                  producer_success=pipeline[0] == 0 if native else None)
    encoded = base64.b64encode(json.dumps(record).encode()).decode()
    print("[PROBE|\n" + "\n".join(encoded[offset:offset + 60] for offset in range(0, len(encoded), 60)) + "\n|END]", flush=True)


def native_command(args, code):
    # Each beat explicitly identifies the native producer; no stale LASTEXITCODE attribution.
    python = str(Path(sys.executable))
    prefix = "& " if args.shell_kind != "gitbash" else ""
    if args.shell_kind == "gitbash":
        python = python.replace("\\", "/")
    return f'''{prefix}'{python}' -c "{code}"'''


def outcome_commands(args):
    native = str(Path(sys.executable))
    commands = [("native_success", native_command(args, "import sys;sys.exit(0)"), native)]
    if args.shell_kind != "gitbash":
        commands += [
            ("cmdlet_failure", "Get-Item 'Z:\\probe-path-that-does-not-exist'", None),
            ("native_failure", native_command(args, "import sys;sys.exit(7)"), native),
            ("cmdlet_success", "Write-Output 'cmdlet success λ'", None),
            ("terminating_error", "throw 'probe terminating error'", None),
            ("nonterminating_error", "Write-Error 'probe nonterminating error'", None),
            ("parse_failure", "Write-Output )", None),
            ("logging_failure", native_command(args, "import sys;print('producer');sys.exit(7)") + " | Tee-Object -Variable ProbeLog", native),
            ("expression_wrapper", "(Write-Error 'probe expression wrapper')", None),
            ("script_exit", f"& '{args.shell}' -NoLogo -NoProfile -Command 'exit 9'", str(args.shell)),
        ]
    else:
        commands += [
            ("shell_failure", "test -e /probe-path-that-does-not-exist", None),
            ("native_failure", native_command(args, "import sys;sys.exit(7)"), native),
            ("shell_success", "printf 'shell success λ\\n'", None),
            ("parse_failure", "echo )", None),
            ("logging_failure", native_command(args, "import sys;print('producer');sys.exit(7)") + " | cat", native),
            ("script_exit", "bash --noprofile --norc -c 'exit 9'", "Git Bash"),
        ]
    return commands


def run_outcomes(terminal):
    records = {}
    terminal.install_prompt()
    terminal.begin_take("outcomes")
    for request, (name, command, native) in enumerate(outcome_commands(terminal.args), 1):
        terminal.arm(request, native)
        terminal.type(command)
        record = terminal.wait_record(lambda r: r.get("phase") == "run" and str(r.get("request")) == str(request))
        records[name] = {**record, "command": command, "native_producer": native}
        write_json(terminal.directory / "outcomes.json", records)
        print(json.dumps({"case": name, "record": records[name]}, ensure_ascii=False), flush=True)
    terminal.end_take()
    if terminal.args.shell_kind != "gitbash":
        assert_outcomes(records)
        assert records["expression_wrapper"]["shell_success"] is (terminal.args.shell_kind == "powershell51")
    else:
        assert records["native_success"]["native_exit_code"] == 0
        assert records["native_failure"]["native_exit_code"] == 7
        assert records["shell_failure"]["shell_success"] is False
        assert records["shell_success"]["shell_success"] is True
        assert records["parse_failure"]["shell_success"] is False
        assert records["logging_failure"]["pipeline_statuses"] == [7, 0]
    assert records["script_exit"]["native_exit_code"] == 9
    return records


def heartbeat_worker(directory, role):
    directory.mkdir(parents=True, exist_ok=True)
    if role in ("parent", "child"):
        child_role = "child" if role == "parent" else "grandchild"
        subprocess.Popen([sys.executable, str(Path(__file__).resolve()), "--worker", child_role,
                          "--directory", str(directory)], stdin=subprocess.DEVNULL)
    print(f"HEARTBEAT {role} {os.getpid()}", flush=True)
    while True:
        write_json(directory / f"{role}.json", {"pid": os.getpid(), "timestamp": time.time(), "role": role})
        time.sleep(0.1)


def heartbeats(directory):
    return {path.stem: read_json(path) for path in directory.glob("*.json")}


class Supervisor:
    def __init__(self, args):
        self.args = args
        self.terminal = Terminal(args, args.directory)
        self.control = args.directory / "control"
        self.control.mkdir()
        self.pending, self.last_request = None, 0
        self.results, self.takes = {}, []
        self.sentinel = None
        self.report = {"gate": "incomplete", "shell_kind": args.shell_kind,
                       "environment": {"launch_host": args.launch_host, "recording_host": platform.node(),
                                       "platform": platform.platform(), "python": sys.executable,
                                       "python_version": sys.version, "pointer_bits": struct.calcsize("P") * 8,
                                       "token": token_info()},
                       "session_id": self.terminal.session, "supervisor_pid": os.getpid(),
                       "artifacts": str(args.directory), "requests": [], "results": self.results,
                       "takes": self.takes, "checks": {name: {"status": "unavailable", "reason": "Not exercised in this session"} for name in REQUIRED}}

    def reply(self, request, value, suffix="result"):
        write_json(self.control / f"{request:06d}.{suffix}.json", value)

    def status(self):
        terminal = self.terminal
        processes = terminal.job.snapshot()
        try:
            owned = [{key: value for key, value in item.items() if key != "handle"} for item in processes]
        finally:
            for item in processes:
                terminal.job.k.CloseHandle(item["handle"])
        supervisor_handle = terminal.job.open_process(os.getpid())
        try:
            creation = terminal.job.process_time(supervisor_handle)
        finally:
            terminal.job.k.CloseHandle(supervisor_handle)
        sentinel_handle = terminal.job.open_process(self.sentinel.pid)
        try:
            sentinel = {"pid": self.sentinel.pid, "creation": terminal.job.process_time(sentinel_handle)}
        finally:
            terminal.job.k.CloseHandle(sentinel_handle)
        status = {"session": terminal.session, "control": str(self.control), "supervisor_pid": os.getpid(),
                  "supervisor_creation": creation, "owned": owned, "sentinel": sentinel,
                  "token": self.report["environment"]["token"],
                  "pending": self.pending, "last_request": self.last_request,
                  "terminal_sizes": terminal.terminal_sizes, "take": terminal.take,
                  "heartbeats": heartbeats(self.args.directory / "heartbeats")}
        write_json(self.control / "status.json", status)
        return status

    def finish_pending(self):
        if self.pending is None:
            return
        request = self.pending
        records = [r for r in self.terminal.parser.records if r.get("session") == self.terminal.session
                   and r.get("phase") == "run" and str(r.get("request")) == str(request["id"])]
        if records:
            result = {**records[-1], "command": request["command"], "native_producer": request.get("native_producer"),
                      "finished_at": time.time(), "page_id": self.terminal.page_id,
                      "websocket_id": self.terminal.request_id}
            self.results[str(request["id"])] = result
            self.reply(request["id"], result)
            self.pending = None
        elif time.time() > request["deadline"]:
            self.reply(request["id"], {"outcome": "unknown", "reason": "Completion deadline expired"})
            raise TimeoutError("An in-flight command has no completion record")

    def dispatch(self, request):
        terminal = self.terminal
        operation, number = request["operation"], request["id"]
        self.report["requests"].append({**request, "dispatched_at": time.time(), "active_take": terminal.take})
        if operation == "run":
            if self.pending is not None:
                raise RuntimeError("Another command still owns terminal input")
            terminal.arm(number, request.get("native_producer"))
            self.pending = {**request, "deadline": time.time() + request.get("timeout", 90)}
            terminal.type(request["command"])
            self.reply(number, {"accepted": True, "in_flight": True, "time": time.time()}, "ack")
            return
        self.reply(number, {"accepted": True, "time": time.time()}, "ack")
        value = {"operation": operation, "time": time.time()}
        if operation == "begin-take":
            terminal.begin_take(request["name"])
            self.takes.append({"name": request["name"], "begin": time.time(), "begin_request": number,
                               "pending_at_begin": self.pending, "session": terminal.session,
                               "page_id": terminal.page_id, "websocket_id": terminal.request_id})
        elif operation == "end-take":
            frames = terminal.end_take()
            self.takes[-1].update(end=time.time(), end_request=number, frames=len(frames), pending_at_end=self.pending)
            value["frames"] = len(frames)
        elif operation == "key":
            terminal.key(request["key"])
        elif operation == "resize":
            terminal.cdp.call("Emulation.setDeviceMetricsOverride", {"width": request["width"], "height": request["height"], "deviceScaleFactor": 1, "mobile": False})
            deadline = time.monotonic() + 2
            while time.monotonic() < deadline:
                terminal.cdp.pump()
            value["terminal_sizes"] = terminal.terminal_sizes
            assert terminal.terminal_sizes[-1]["columns"] >= 80, "Probe framing is only tested at >=80 columns"
        elif operation == "inspect":
            value.update(self.status())
        elif operation == "snapshot":
            name = request["name"]
            if not re.fullmatch(r"[a-zA-Z0-9_-]+", name):
                raise ValueError("Invalid snapshot name")
            assert request["expected_text"] in terminal.parser.text
            terminal.screenshot(name + ".png")
            value.update(screenshot=name + ".png", pending=self.pending,
                         observed_text=request["expected_text"])
        elif operation == "extra-client":
            import websocket

            candidate = None
            try:
                candidate = websocket.create_connection(terminal.terminal_url.replace("http:", "ws:") + "ws",
                    subprotocols=["tty"], timeout=2, origin=terminal.terminal_url.rstrip("/"))
                value.update(accepted=True, candidate_continuity=False, reason="Unexpected second WebSocket accepted; no continuity claimed")
            except (websocket.WebSocketBadStatusException, websocket.WebSocketConnectionClosedException) as error:
                value.update(accepted=False, candidate_continuity=False, http_status=getattr(error, "status_code", None), error=str(error))
            finally:
                if candidate:
                    candidate.close()
            self.report["extra_client"] = value
            if value.get("accepted") is False:
                terminal.arm(number, None)
                terminal.type("printf 'original still alive\\n'" if self.args.shell_kind == "gitbash" else "Write-Output 'original still alive'")
                value["original_round_trip"] = terminal.wait_record(lambda r: r.get("phase") == "run" and str(r.get("request")) == str(number))
            self.report["checks"]["extra_client"] = {"status": "passed" if value.get("accepted") is False else "failed"}
        elif operation == "browser-loss":
            terminal.screenshot("before-browser-loss.png")
            browser = next(entry for entry in terminal.launches if entry["name"] == "browser")
            handle = next(handle for pid, handle in terminal.job.roots if pid == browser["pid"])
            if not terminal.job.k.TerminateProcess(handle, 1):
                raise ctypes.WinError(ctypes.get_last_error())
            self.report["browser_loss_requested"] = True
        elif operation in ("close", "cancel"):
            self.report["close_operation"] = operation
        else:
            raise ValueError(f"Unknown operation: {operation}")
        self.reply(number, value)

    def run(self):
        terminal = self.terminal
        failure = None
        try:
            terminal.start()
            before = terminal.readiness()
            terminal.install_prompt()
            self.report["readiness"] = before
            self.report["checks"]["readiness"] = {"status": "passed", "screenshot": str(self.args.directory / "ready.png")}
            self.report["checks"]["framing"] = {"status": "passed" if any(f["leading_byte"] == "30" for f in terminal.frames) else "failed"}
            self.sentinel = subprocess.Popen([sys._base_executable, str(Path(__file__).resolve()), "--worker", "sentinel",
                                             "--directory", str(self.args.directory / "sentinel")],
                                            stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            ready = self.status()
            write_json(self.control / "ready.json", ready)
            print(json.dumps({"ready": ready, "directory": str(self.args.directory)}), flush=True)
            deadline = time.monotonic() + 1200
            while not self.report.get("close_operation"):
                if time.monotonic() > deadline:
                    raise TimeoutError("Supervisor maximum lifetime expired")
                terminal.cdp.pump()
                if terminal.closed:
                    raise ConnectionError("Recorded terminal disconnected")
                self.finish_pending()
                path = self.control / f"{self.last_request + 1:06d}.request.json"
                if path.exists():
                    request = json.loads(path.read_text(encoding="utf-8"))
                    if request["id"] != self.last_request + 1:
                        raise ValueError("Request id does not match its ordered filename")
                    self.last_request += 1
                    self.dispatch(request)
                    self.status()
        except BaseException as error:
            failure = repr(error)
            self.report["failure"] = {"error": failure, "traceback": traceback.format_exc()}
            if self.report["checks"]["readiness"]["status"] == "unavailable":
                self.report["checks"]["readiness"] = {"status": "failed", "error": failure}
            if self.report.get("browser_loss_requested"):
                self.report["checks"]["browser_loss"] = {"status": "passed", "continuity": False, "outcome": "interrupted", "observed_error": failure}
        finally:
            self.cleanup(failure)
        return 1 if failure and not self.report.get("browser_loss_requested") else 0

    def cleanup(self, failure):
        terminal, job = self.terminal, self.terminal.job
        started = time.monotonic()
        handles = job.snapshot()
        before_heartbeats = heartbeats(self.args.directory / "heartbeats")
        if self.pending is not None:
            result = {"outcome": "interrupted" if failure or self.report.get("close_operation") else "unknown",
                      "shell_success": None, "native_exit_code": None, "shell_error": failure,
                      "command": self.pending["command"]}
            self.results[str(self.pending["id"])] = result
            self.reply(self.pending["id"], result)
        try:
            if terminal.cdp and not failure:
                if terminal.take:
                    terminal.end_take()
                terminal.key("CTRL_C")
                deadline = time.monotonic() + 1.5
                while time.monotonic() < deadline:
                    terminal.cdp.pump()
                terminal.type("exit")
                deadline = time.monotonic() + 1.5
                while time.monotonic() < deadline and not terminal.closed:
                    terminal.cdp.pump()
        except Exception as error:
            self.report["graceful_shutdown_diagnostic"] = repr(error)
        try:
            terminal.close()
            # Job membership can reach zero before Windows signals every exiting
            # process handle. Retain and wait the verified handles as well.
            self.report["initial_unsignaled_handles"] = [item["pid"] for item in handles if job.k.WaitForSingleObject(item["handle"], 0) != 0]
            deadline = started + 8
            while time.monotonic() < deadline and any(job.k.WaitForSingleObject(item["handle"], 0) != 0 for item in handles):
                time.sleep(0.05)
            remaining = [item["pid"] for item in handles if job.k.WaitForSingleObject(item["handle"], 0) != 0]
            self.report["owned_children_remaining"] = remaining
            self.report["unrelated_sentinel_alive"] = self.sentinel is not None and self.sentinel.poll() is None
            self.report["shutdown_seconds"] = time.monotonic() - started
            after_heartbeats = heartbeats(self.args.directory / "heartbeats")
            time.sleep(0.4)
            stopped = after_heartbeats == heartbeats(self.args.directory / "heartbeats")
            self.report["cleanup"] = {"before": before_heartbeats, "after": after_heartbeats,
                                      "heartbeats_stopped": stopped,
                                      "owned_handles": [{k: v for k, v in item.items() if k != "handle"} for item in handles]}
            mode = "cancel_cleanup" if self.report.get("close_operation") == "cancel" else "normal_cleanup"
            passed = not remaining and self.report["unrelated_sentinel_alive"] and stopped and set(before_heartbeats) == {"parent", "child", "grandchild"} and self.report["shutdown_seconds"] < 10
            self.report["checks"][mode] = {"status": "passed" if passed else "failed"}
        finally:
            for item in handles:
                job.k.CloseHandle(item["handle"])
            if self.sentinel:
                self.sentinel.terminate()
                self.sentinel.wait(timeout=5)
            self.report.update(terminal_client_count=len(terminal.socket_ids), observed_session_id=terminal.session,
                               filmed_session_id=self.takes[0]["session"] if self.takes else None,
                               socket_ids=terminal.socket_ids, observed_frames=terminal.frames,
                               terminal_sizes=terminal.terminal_sizes, framing_chunk_columns=60,
                               framing_scope="Observed dimensions only; arbitrary resizing/redraw is unverified",
                               job_structure_sizes=job.sizes, launches=terminal.launches)
            write_json(self.args.directory / "probe.json", self.report)
            print(json.dumps({"finished": str(self.args.directory), "checks": self.report["checks"], "failure": failure}), flush=True)


def submit_request(args):
    request = json.loads(args.submit)
    number = request["id"]
    if not isinstance(number, int) or number < 1:
        raise ValueError("Request ids must be positive integers")
    path = args.directory / "control" / f"{number:06d}.request.json"
    if path.exists():
        raise FileExistsError("Request id already submitted; refusing replay")
    write_json(path, request)
    deadline = time.monotonic() + args.wait
    reply = path.with_name(f"{number:06d}.{'result' if args.wait_result else 'ack'}.json")
    while not reply.exists() and time.monotonic() < deadline:
        time.sleep(0.05)
    if not reply.exists():
        raise TimeoutError(f"No acknowledgment/result for request {number}")
    print(reply.read_text(encoding="utf-8"), flush=True)


def wait_json(path, timeout=60):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if path.exists():
            return read_json(path)
        time.sleep(0.05)
    raise TimeoutError(f"Missing artifact: {path}")


def drive_phase(args):
    """Run a bounded group of requests; invoke each phase in a separate harness call."""
    control = args.directory / "control"
    state = wait_json(control / "ready.json")
    submitted = list(control.glob("*.request.json"))
    number = max((int(path.name.split(".")[0]) for path in submitted), default=0)

    def send(operation, wait=True, **fields):
        nonlocal number
        number += 1
        request = {"id": number, "operation": operation, **fields}
        submit_request(argparse.Namespace(directory=args.directory, submit=json.dumps(request), wait=10, wait_result=wait))
        return number

    def native_fixture(role):
        prefix = "& " if args.shell_kind != "gitbash" else ""
        paths = [str(Path(sys.executable)), str(Path(__file__).resolve()), str(args.directory / "heartbeats")]
        if args.shell_kind == "gitbash":
            paths = [path.replace("\\", "/") for path in paths]
        return f"{prefix}'{paths[0]}' '{paths[1]}' --worker {role} --directory '{paths[2]}'"

    if args.phase == "first":
        send("begin-take", name="take-one")
        command = "PROBE_VALUE='persisted-λ'" if args.shell_kind == "gitbash" else "$global:ProbeValue='persisted-λ'"
        send("run", command=command)
        delayed = send("run", wait=False, command=native_command(args, "import time;print('LONG_STARTED',flush=True);time.sleep(45);print('LONG_FINISHED',flush=True)"), native_producer=sys.executable)
        send("end-take")
        write_json(control / "first-phase.json", {"delayed_request": delayed, "returned_at": time.time(), "session": state["session"]})
    elif args.phase == "second":
        first = wait_json(control / "first-phase.json")
        send("begin-take", name="take-two")
        inspect_id = send("inspect")
        inspection = wait_json(control / f"{inspect_id:06d}.result.json")
        assert inspection["pending"] and inspection["pending"]["id"] == first["delayed_request"], "Delayed command completed before the second take began"
        send("resize", width=1200, height=800)
        delayed = wait_json(control / f"{first['delayed_request']:06d}.result.json", 70)
        assert delayed["outcome"] == "completed" and delayed["shell_success"] is True
        command = "printf 'after λ\\n'" if args.shell_kind == "gitbash" else "Write-Output 'after λ'"
        after_id = send("run", command=command)
        after = wait_json(control / f"{after_id:06d}.result.json")
        assert after["variable"] == "persisted-λ"
        send("end-take")
        write_json(control / "second-phase.json", {"after": after, "delayed": delayed, "inspection": inspection,
                                                  "returned_at": time.time()})
    if args.phase in ("second", "interactive"):
        send("begin-take", name="interactive")
        prefix = "& " if args.shell_kind != "gitbash" else ""
        python, source = str(Path(sys.executable)), str(Path(__file__).resolve())
        if args.shell_kind == "gitbash":
            python, source = python.replace("\\", "/"), source.replace("\\", "/")
        tui = send("run", wait=False, command=f"{prefix}'{python}' '{source}' --tui", native_producer=sys.executable)
        # Application readiness is a native fixture artifact, not echoed command text.
        wait_json(args.directory / "tui-ready.json")
        # Give the recorded application a visible hold; the supervisor continues
        # draining CDP/screencast events while this separate driver waits.
        time.sleep(1)
        send("snapshot", name="tui-live", expected_text="Native Windows TUI λ")
        send("key", key="q")
        outcome = wait_json(control / f"{tui:06d}.result.json")
        assert outcome["shell_success"] is True
        send("end-take")
        send("extra-client")
        write_json(control / "interactive-phase.json", {"interactive": outcome, "returned_at": time.time()})
    elif args.phase == "prepare-cleanup":
        send("begin-take", name="ownership")
        send("run", wait=False, command=native_fixture("parent"), native_producer=sys.executable, timeout=600)
        deadline = time.monotonic() + 10
        while time.monotonic() < deadline:
            found = heartbeats(args.directory / "heartbeats")
            if set(found) == {"parent", "child", "grandchild"}:
                break
            time.sleep(0.1)
        assert set(found) == {"parent", "child", "grandchild"}, found
        send("inspect")
    elif args.phase in ("close", "cancel", "browser-loss"):
        send(args.phase)
        result = wait_json(args.directory / "probe.json", 15)
        print(json.dumps({"checks": result["checks"], "cleanup": result.get("cleanup")}), flush=True)


def tui_fixture():
    import msvcrt

    print("\x1b[2J\x1b[HNative Windows TUI λ\n[q] Finish this screen", flush=True)
    write_json(Path.cwd() / "tui-ready.json", {"pid": os.getpid(), "ready_at": time.time()})
    while True:
        key = msvcrt.getwch()
        if key == "q":
            print("\nTUI_EXIT:q", flush=True)
            return


def crash_check(args):
    """An independent harness call retains native handles before killing the supervisor."""
    state = wait_json(args.directory / "control" / "status.json")
    observer = WindowsJob()  # Empty observer job; no process is assigned to it.
    handles, sentinel, supervisor = [], None, None
    report = {"status": "failed", "state_before": state, "launch_host": args.launch_host,
              "recording_host": platform.node(), "prior_children_already_exited": []}
    try:
        supervisor = observer.open_process(state["supervisor_pid"], state["supervisor_creation"], terminate=True)
        sentinel = observer.open_process(state["sentinel"]["pid"], state["sentinel"]["creation"], terminate=True)
        for process in state["owned"]:
            try:
                handle = observer.open_process(process["pid"], process["creation"])
            except OSError as error:
                if error.winerror == 87:
                    report["prior_children_already_exited"].append(process)
                    continue
                raise
            handles.append({**process, "handle": handle})
        before = heartbeats(args.directory / "heartbeats")
        assert set(before) == {"parent", "child", "grandchild"}, before
        assert {record["pid"] for record in before.values()} <= {record["pid"] for record in handles}
        started = time.monotonic()
        if not observer.k.TerminateProcess(supervisor, 99):
            raise ctypes.WinError(ctypes.get_last_error())
        deadline = time.monotonic() + 5
        while time.monotonic() < deadline and any(observer.k.WaitForSingleObject(p["handle"], 0) != 0 for p in handles):
            time.sleep(0.05)
        remaining = [p["pid"] for p in handles if observer.k.WaitForSingleObject(p["handle"], 0) != 0]
        report["shutdown_seconds"] = time.monotonic() - started
        report["owned_children_remaining"] = remaining
        report["unrelated_sentinel_alive"] = observer.k.WaitForSingleObject(sentinel, 0) == 258
        after = heartbeats(args.directory / "heartbeats")
        sentinel_before = heartbeats(args.directory / "sentinel")
        time.sleep(0.5)
        report.update(heartbeats_before=before, heartbeats_after=after,
                      heartbeats_stopped=after == heartbeats(args.directory / "heartbeats"),
                      sentinel_heartbeat_advanced=heartbeats(args.directory / "sentinel") != sentinel_before)
        assert remaining == []
        assert report["heartbeats_stopped"] and report["unrelated_sentinel_alive"] and report["sentinel_heartbeat_advanced"]
        assert report["shutdown_seconds"] < 10
        report["status"] = "passed"
    except BaseException as error:
        report.update(error=repr(error), traceback=traceback.format_exc())
        raise
    finally:
        write_json(args.directory / "crash.json", report)
        if sentinel:
            observer.k.TerminateProcess(sentinel, 0)
            observer.k.WaitForSingleObject(sentinel, 5000)
            observer.k.CloseHandle(sentinel)
        if supervisor:
            observer.k.CloseHandle(supervisor)
        for process in handles:
            observer.k.CloseHandle(process["handle"])
        observer.close()
    print(json.dumps(report), flush=True)


def startup_probe(args):
    result = {"gate": "incomplete", "environment": {"launch_host": args.launch_host,
              "recording_host": platform.node(), "platform": platform.platform(),
              "python": sys.executable, "python_version": sys.version,
              "pointer_bits": struct.calcsize("P") * 8, "token": token_info()},
              "shell_kind": args.shell_kind, "shell_executable": str(args.shell),
              "checks": {name: {"status": "unavailable", "reason": "Not reached"} for name in REQUIRED},
              "artifacts": str(args.directory)}
    terminal = None
    try:
        terminal = Terminal(args, args.directory)
        terminal.start()
        result["readiness"] = terminal.readiness()
        result["checks"]["readiness"] = {"status": "passed", "screenshot": str(args.directory / "ready.png")}
        assert any(frame["leading_byte"] == "30" for frame in terminal.frames)
        result["checks"]["framing"] = {"status": "passed"}
        if args.outcomes:
            result["outcomes"] = run_outcomes(terminal)
            result["checks"]["command_outcomes"] = {"status": "passed"}
    except Exception as error:
        check = "command_outcomes" if args.outcomes and result["checks"]["readiness"]["status"] == "passed" else "readiness"
        result["checks"][check] = {"status": "failed", "error": repr(error), "traceback": traceback.format_exc()}
    finally:
        if terminal:
            result["socket_ids"] = terminal.socket_ids
            result["observed_frames"] = terminal.frames
            result["terminal_sizes"] = terminal.terminal_sizes
            result["framing_chunk_columns"] = 60
            result["framing_scope"] = "Bounded multiline records at the observed dimensions; arbitrary resize/redraw decoding is unverified"
            result["job_structure_sizes"] = terminal.job.sizes
            result["launches"] = terminal.launches
            result["terminal_text"] = terminal.parser.text
            try:
                result["forced_cleanup_seconds"] = terminal.close()
            except Exception as error:
                result["cleanup_error"] = repr(error)
        args.directory.mkdir(parents=True, exist_ok=True)
        write_json(args.directory / "probe.json", result)
        print(json.dumps({"directory": str(args.directory), "shell": args.shell_kind, "checks": result["checks"]}, ensure_ascii=False), flush=True)
    return 1  # Startup alone cannot open the full feasibility gate.


def aggregate(root):
    """Validate retained runtime evidence, including separate-call control artifacts."""
    result = {"gate": "incomplete", "shells": {}, "checks": {}, "artifacts": str(root),
              "scope": "Native Windows x64 at observed dimensions with an explicit same-page snapshot checkpoint",
              "required_production_work": ["Resize/redraw-aware completion decoding",
                                           "General capture freshness fix and acceptance tests in Tasks 8–9; stalled takes must fail"]}

    def check(name, operation):
        try:
            detail = operation()
            result["checks"][name] = {"status": "passed", "evidence": detail}
        except FileNotFoundError as error:
            result["checks"][name] = {"status": "unavailable", "error": str(error)}
        except Exception as error:
            result["checks"][name] = {"status": "failed", "error": repr(error), "traceback": traceback.format_exc()}

    def prerequisites():
        data = read_json(root / "prerequisites.json")
        expected = {"uv-version", "python-identity", "ffmpeg-version", "ffmpeg-filters", "ffmpeg-encoders",
                    "ffmpeg-devices", "ffprobe-version", "ttyd-version", "powershell51-version",
                    "powershell7-version", "gitbash-version", "gitbash-native-tools", "feature-libx264",
                    "feature- aac ", "feature-subtitles", "feature---enable-libass"}
        assert expected <= set(data["commands"])
        assert all(record["status"] == "passed" for record in data["commands"].values())
        assert all(record["pe_machine"] == "0x8664" for record in data["binaries"].values())
        return "prerequisites.json"

    check("prerequisites", prerequisites)
    for kind in ("powershell51", "powershell7", "gitbash"):
        normal_path = root / f"standard-normal-{kind}"

        def report(mode):
            return read_json(root / f"standard-{mode}-{kind}" / "probe.json")

        def recorded(mode, name):
            data = report(mode)
            assert data["checks"][name]["status"] == "passed", data["checks"][name]
            if mode != "loss":
                assert not data.get("failure"), data.get("failure")
            return f"standard-{mode}-{kind}/probe.json"

        for name, mode in (("readiness", "normal"), ("framing", "normal"), ("command_outcomes", "outcomes"),
                           ("extra_client", "normal"), ("normal_cleanup", "normal"), ("cancel_cleanup", "cancel")):
            check(f"{kind}.{name}", lambda name=name, mode=mode: recorded(mode, name))

        def continuity():
            normal = report("normal")
            first = read_json(normal_path / "control" / "first-phase.json")
            second = read_json(normal_path / "control" / "second-phase.json")
            before, after = normal["readiness"], second["after"]
            take1, take2 = normal["takes"][:2]
            delayed = first["delayed_request"]
            assert take1["pending_at_end"]["id"] == take2["pending_at_begin"]["id"] == second["inspection"]["pending"]["id"] == delayed
            assert take1["end"] <= first["returned_at"] < take2["begin"] < second["delayed"]["finished_at"]
            assert second["delayed"]["outcome"] == "completed" and second["delayed"]["shell_success"] is True
            assert take1["page_id"] == take2["page_id"] == after["page_id"]
            assert take1["websocket_id"] == take2["websocket_id"] == after["websocket_id"]
            original = normal["extra_client"]["original_round_trip"]
            assert normal["extra_client"]["accepted"] is False and normal["extra_client"]["candidate_continuity"] is False
            assert original["session"] == after["session"] and str(original["pid"]) == str(after["pid"])
            shell = {key: normal[key] for key in ("terminal_client_count", "owned_children_remaining", "unrelated_sentinel_alive", "shutdown_seconds")}
            shell.update(observed_session_id=after["session"], filmed_session_id=take2["session"],
                         nonce_before=before["session"], nonce_after=after["session"],
                         shell_pid_before=str(before["pid"]), shell_pid_after=str(after["pid"]),
                         variable_after=after["variable"], long_command_survived_take_boundary=True,
                         environment=normal["environment"], terminal_sizes=normal["terminal_sizes"],
                         artifacts=normal["artifacts"])
            assert_probe(shell)
            result["shells"][kind] = shell
            return {"delayed_request": delayed, "first_call_returned": first["returned_at"], "take_two_began": take2["begin"],
                    "command_finished": second["delayed"]["finished_at"], "page_id": after["page_id"], "websocket_id": after["websocket_id"]}

        check(f"{kind}.two_takes", continuity)

        def ordinary_user():
            tokens = [report(mode)["environment"]["token"] for mode in ("normal", "outcomes", "cancel", "loss")]
            tokens.append(read_json(root / f"standard-crash-{kind}" / "control" / "ready.json")["token"])
            assert all(not token["elevated"] and token["integrity_rid"] == 8192 for token in tokens)
            return [{key: token[key] for key in ("pid", "elevated", "integrity_sid", "elevation_type", "desktop_session")} for token in tokens]

        check(f"{kind}.ordinary_user", ordinary_user)

        def browser_loss():
            data = report("loss")
            recorded("loss", "browser_loss")
            recorded("loss", "normal_cleanup")
            assert data["checks"]["browser_loss"]["continuity"] is False
            assert data["failure"] and data["results"]
            assert all(record["outcome"] == "interrupted" and record["shell_success"] is None for record in data["results"].values())
            return data["checks"]["browser_loss"]

        check(f"{kind}.browser_loss", browser_loss)

        def crash():
            data = read_json(root / f"standard-crash-{kind}" / "crash.json")
            assert data["status"] == "passed" and data["owned_children_remaining"] == []
            assert data["heartbeats_stopped"] and data["unrelated_sentinel_alive"] and data["sentinel_heartbeat_advanced"]
            assert data["shutdown_seconds"] < 10
            return {key: data[key] for key in ("shutdown_seconds", "owned_children_remaining", "heartbeats_stopped", "unrelated_sentinel_alive")}

        check(f"{kind}.crash_cleanup", crash)

        def interactive():
            directory = root / f"tui-verified-{kind}"
            phase = read_json(directory / "control" / "interactive-phase.json")
            assert phase["interactive"]["outcome"] == "completed" and phase["interactive"]["shell_success"] is True
            assert read_json(directory / "tui-ready.json")["pid"] > 0
            data = read_json(directory / "probe.json")
            assert data["environment"]["token"]["ordinary_user"] and not data.get("failure")
            assert data["checks"]["normal_cleanup"]["status"] == "passed"
            frames = read_json(directory / "interactive" / "frames.json")
            assert frames and all(frame["session_id"] == data["readiness"]["session"] for frame in frames)
            snapshot = next(request for request in data["requests"] if request["operation"] == "snapshot")
            observed = read_json(directory / "control" / f"{snapshot['id']:06d}.result.json")
            assert observed["pending"]["id"] == int(phase["interactive"]["request"])
            assert (directory / observed["screenshot"]).stat().st_size > 0
            assert observed["time"] < phase["interactive"]["finished_at"]
            inspected = read_json(root / "active-tui-pixel-inspection.json")[kind]
            assert inspected["status"] == "passed" and inspected["pending_request"] == 2
            pixel_path = directory / "interactive" / f"{inspected['frame_index']:06d}.jpg"
            assert hashlib.sha256(pixel_path.read_bytes()).hexdigest() == inspected["sha256"]
            frame = frames[inspected["frame_index"]]
            assert inspected["snapshot_at"] < frame["received_at"] < inspected["q_at"]
            assert frame["metadata"]["timestamp"] < inspected["q_at"]
            assert inspected["all_hold_acks_replied"] and inspected["hold_receive_timeouts"] > 0
            text = (directory / "terminal.bin").read_bytes().decode("utf-8")
            assert "Native Windows TUI λ" in text and "TUI_EXIT:q" in text
            return {"directory": str(directory), "frames": len(frames), "native_TUI_and_non_ASCII": True}

        check(f"{kind}.interactive", interactive)

        def resize():
            data = report("normal")
            columns = [size["columns"] for size in data["terminal_sizes"]]
            assert columns == [217, 167] and data["framing_chunk_columns"] == 60
            return {"observed_columns": columns, "base64_chunk_columns": 60, "scope": data["framing_scope"]}

        check(f"{kind}.bounded_resize", resize)

        def captures():
            data = report("normal")
            counts = {}
            for take in data["takes"]:
                frames = read_json(normal_path / take["name"] / "frames.json")
                assert frames
                if "end_request" in take:
                    assert take["frames"] == len(frames)
                else:
                    # The ownership take is stopped by cleanup, not an end-take
                    # request. Its persisted frame manifest is the count source.
                    assert take["name"] == "ownership" and data["close_operation"] == "close"
                for index, frame in enumerate(frames):
                    assert frame["session_id"] == data["readiness"]["session"]
                    assert frame["page_id"] == take["page_id"] and frame["websocket_id"] == take["websocket_id"]
                    assert (normal_path / take["name"] / f"{index:06d}.jpg").stat().st_size > 0
                counts[take["name"]] = len(frames)
            assert (normal_path / "ready.png").stat().st_size > 0
            return counts

        check(f"{kind}.capture_artifacts", captures)
    try:
        assert_gate(result)
        result["gate"] = "passed"
    except (AssertionError, KeyError):
        result["gate"] = "failed" if any(c["status"] == "failed" for c in result["checks"].values()) else "incomplete"
    write_json(root / "probe.json", result)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0 if result["gate"] == "passed" else 1


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--assert-result", type=Path)
    parser.add_argument("--aggregate", type=Path)
    parser.add_argument("--startup", action="store_true")
    parser.add_argument("--outcomes", action="store_true")
    parser.add_argument("--emit-bash", action="store_true")
    parser.add_argument("--serve", action="store_true")
    parser.add_argument("--worker", choices=["parent", "child", "grandchild", "sentinel"])
    parser.add_argument("--tui", action="store_true")
    parser.add_argument("--crash-check", action="store_true")
    parser.add_argument("--phase", choices=["first", "second", "interactive", "prepare-cleanup", "close", "cancel", "browser-loss"])
    parser.add_argument("--submit")
    parser.add_argument("--wait", type=float, default=10)
    parser.add_argument("--wait-result", action="store_true")
    parser.add_argument("--ttyd", type=Path)
    parser.add_argument("--browser", type=Path)
    parser.add_argument("--shell", type=Path)
    parser.add_argument("--shell-kind", choices=["powershell51", "powershell7", "gitbash"])
    parser.add_argument("--directory", type=Path)
    parser.add_argument("--launch-host")
    args = parser.parse_args()
    if args.aggregate:
        return aggregate(args.aggregate)
    if args.emit_bash:
        emit_bash()
        return 0
    if args.worker:
        heartbeat_worker(args.directory, args.worker)
        return 0
    if args.tui:
        tui_fixture()
        return 0
    if args.crash_check:
        crash_check(args)
        return 0
    if args.phase:
        drive_phase(args)
        return 0
    if args.submit:
        submit_request(args)
        return 0
    if args.startup or args.outcomes or args.serve:
        for name in ("ttyd", "browser", "shell", "directory"):
            path = getattr(args, name)
            if path is None or not path.is_absolute():
                parser.error(f"--{name} requires an explicit absolute path")
        if not args.shell_kind or not args.launch_host:
            parser.error("--shell-kind and --launch-host are required")
        return Supervisor(args).run() if args.serve else startup_probe(args)
    assert_gate(json.loads(args.assert_result.read_text(encoding="utf-8"))
                if args.assert_result else {})


if __name__ == "__main__":
    sys.exit(main())
