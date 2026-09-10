#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.12"
# dependencies = ["websocket-client==1.9.0"]
# ///
"""Record one persistent native Windows terminal as timed PNG takes."""
import bisect
import math


def frame_sources(completed, start, end, rate=5):
    if not completed or completed[0] != start or end < start:
        raise ValueError("Invalid take boundaries")
    if completed != sorted(completed) or completed[-1] > end:
        raise ValueError("Invalid capture times")
    intervals = [b - a for a, b in zip(completed, completed[1:])]
    if max(intervals + [end - completed[-1]]) > 2:
        raise TimeoutError("Capture gap exceeds two seconds")
    count = max(1, math.ceil((end - start) * rate))
    return [bisect.bisect_right(completed, start + i / rate) - 1
            for i in range(count)]


def command_succeeded(result):
    return (result.get("outcome") == "completed"
            and result.get("shell_success") is True
            and result.get("shell_error") is None
            and (result.get("native_producer") is None
                 or result.get("producer_exit_code") == 0))


import argparse
import base64
import codecs
import json
import os
import re
import shutil
import shlex
import socket
import sys
import time
import urllib.request
import uuid
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from browser_tools import find_browser
from windows_jobs import WindowsJob

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
        self.text = (self.text + self.decoder.decode(data))[-131072:]
        clean = re.sub(r"\x1b\][^\x07]*(?:\x07|\x1b\\)|\x1b\[[0-?]*[ -/]*[@-~]", "", self.text)
        for match in re.finditer(r"\[MOVIE\|([A-Za-z0-9+/=\s]+)\|END\]", clean):
            try:
                record = json.loads(base64.b64decode(re.sub(r"\s", "", match[1]), validate=True).decode("utf-8"))
            except (ValueError, UnicodeError):
                continue
            if isinstance(record, dict) and record not in self.records:
                self.records.append(record)

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
        self.ws.settimeout(0.02)
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
        self.cdp = None
        self.raw = (directory / "network.jsonl").open("w", encoding="utf-8")
        self.output = (directory / "terminal.bin").open("wb")
        self.job = WindowsJob()
        self.launches = []
        self.take = None
        self.terminal_sizes = []

    def event(self, event):
        method, params = event["method"], event.get("params", {})
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
            data = ttyd_output(event)
            self.output.write(data)
            self.output.flush()
            self.parser.feed(data)

    def start(self):
        port, debug_port = free_port(), free_port()
        self.terminal_url = f"http://127.0.0.1:{port}/"
        shell_argv = [str(self.args.shell_exe)] + (["--noprofile", "--norc", "-i"] if self.args.shell_kind == "gitbash" else ["-NoLogo", "-NoProfile", "-NoExit"])
        # ttyd 1.7.7 needs -w but decodes its argv using the ANSI code page.
        # Inherit the Unicode cwd through CreateProcessW, then use a relative -w.
        ttyd_argv = [str(self.args.ttyd), "-i", "127.0.0.1", "-p", str(port), "-W", "-m", "1",
                     "-w", "."] + shell_argv
        browser_argv = [str(self.args.browser), "--headless=new", "--no-first-run", "--no-default-browser-check",
                        "--disable-background-networking", "--remote-debugging-address=127.0.0.1",
                        f"--remote-debugging-port={debug_port}", f"--user-data-dir={self.directory / 'profile'}",
                        "--window-size=1600,900", "about:blank"]
        for name, argv in (("ttyd", ttyd_argv), ("browser", browser_argv)):
            cwd = self.args.cwd if name == "ttyd" else self.directory
            pid = self.job.spawn(argv, cwd, self.directory / f"{name}.log")
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
        self.cdp.call("Emulation.setDeviceMetricsOverride", {"width": 1600, "height": 900, "deviceScaleFactor": 1, "mobile": False})
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
            code = "import base64,json,os;print('[MOVIE|'+base64.b64encode(json.dumps(dict(session=os.environ['MOVIE_SESSION'],pid=os.environ['MOVIE_SHELL_PID'],shell='gitbash',cwd=os.getcwd())).encode()).decode()+'|END]')"
            # Encode the Python payload to keep the complete framing out of input echo.
            payload = base64.b64encode(code.encode()).decode()
            command = "cd -- " + shlex.quote(str(self.args.cwd).replace("\\", "/")) + " && " + f"export MOVIE_SESSION={self.session} MOVIE_SHELL_PID=$$; '{python}' -c \"import base64;exec(base64.b64decode('{payload}'))\""
        else:
            script = "Set-Location -LiteralPath '" + str(self.args.cwd).replace("'", "''") + "' -ErrorAction Stop; $global:MovieSession='" + self.session + "'; $r=@{session=$MovieSession;pid=$PID;shell=$PSVersionTable.PSVersion.ToString();cwd=(Get-Location).Path}; [Console]::WriteLine('[MOVIE|'+[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes(($r|ConvertTo-Json -Compress)))+'|END]')"
            payload = base64.b64encode(script.encode("utf-8")).decode()
            command = ". ([scriptblock]::Create([Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('" + payload + "'))))"
        write_json(self.directory / "readiness-command.json", {"command": command, "session": self.session})
        self.type(command)
        deadline = time.monotonic() + 10
        while time.monotonic() < deadline:
            self.cdp.pump()
            matches = [r for r in self.parser.records if r.get("session") == self.session]
            if matches:
                if os.path.normcase(os.path.abspath(matches[-1].get("cwd", ""))) != os.path.normcase(str(self.args.cwd.resolve())):
                    raise RuntimeError("Recorded shell did not enter the requested cwd")
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
            script = f'''export MOVIE_SESSION={self.session}
MOVIE_PHASE=boot
movie_prompt() {{
    local movie_status=$? movie_pipeline=("${{PIPESTATUS[@]}}")
    if [[ -n "$MOVIE_PHASE" ]]; then
        MOVIE_STATUS="$movie_status" MOVIE_PIPELINE="${{movie_pipeline[*]}}" MOVIE_SHELL_PID=$$ MOVIE_CWD="$PWD" MOVIE_PHASE="$MOVIE_PHASE" MOVIE_REQUEST="$MOVIE_REQUEST" MOVIE_NATIVE="$MOVIE_NATIVE" '{python}' '{source}' --emit-bash
        if [[ "$MOVIE_PHASE" == arm ]]; then MOVIE_PHASE=run; else MOVIE_PHASE=; fi
    fi
    return "$movie_status"
}}
PROMPT_COMMAND=movie_prompt
PS1='MOVIE $ '
'''
            payload = base64.b64encode(script.encode()).decode()
            self.type(f'''eval "$('{python}' -c "import base64;print(base64.b64decode('{payload}').decode())")"''')
        else:
            script = r'''
$global:MovieErrorCount=$Error.Count
$global:MoviePhase='boot'
function global:prompt {
    $movieOK=$?
    $movieNative=$global:LASTEXITCODE
    if ($global:MoviePhase) {
        $movieError=$null
        $parseError=$false
        if ($Error.Count -gt 0 -and $Error.Count -gt $global:MovieErrorCount) {
            $movieError=$Error[0].ToString()
            $parseError=($Error[0] -is [System.Management.Automation.ParseException] -or $Error[0].Exception -is [System.Management.Automation.ParseException] -or $Error[0].CategoryInfo.Category -eq 'ParserError')
        }
        $record=@{session=$global:MovieSession;request=$global:MovieRequest;phase=$global:MoviePhase;pid=$PID;cwd=(Get-Location).Path;outcome='completed';shell_success=($movieOK -and -not $parseError);raw_shell_success=$movieOK;parse_error=$parseError;native_exit_code=$null;shell_error=$movieError;producer_exit_code=$null;producer_success=$null}
        if ($global:MovieNative -and -not $parseError) {$record.native_exit_code=$movieNative;$record.producer_exit_code=$movieNative;$record.producer_success=($movieNative -eq 0)}
        if ($global:MoviePhase -eq 'arm') {$global:MoviePhase='run'} else {$global:MoviePhase=$null}
        $encoded=[Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes(($record|ConvertTo-Json -Compress)))
        [Console]::WriteLine('[MOVIE|')
        for ($offset=0;$offset -lt $encoded.Length;$offset+=60) {[Console]::WriteLine($encoded.Substring($offset,[Math]::Min(60,$encoded.Length-$offset)))}
        [Console]::WriteLine('|END]')
    }
    return 'MOVIE PS> '
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
            command = f"MOVIE_REQUEST={request}; MOVIE_NATIVE={int(bool(native))}; MOVIE_PHASE=arm"
        else:
            reset_native = "$global:LASTEXITCODE=$null; " if native else ""
            command = reset_native + f"$global:MovieRequest={request}; $global:MovieNative=${str(bool(native)).lower()}; $global:MovieErrorCount=$Error.Count; $global:MoviePhase='arm'"
        self.type(command)
        self.wait_record(lambda r: r.get("phase") == "arm" and str(r.get("request")) == str(request))

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

def emit_bash():
    env = os.environ
    status = int(env["MOVIE_STATUS"])
    native = env.get("MOVIE_NATIVE") == "1"
    pipeline = [int(value) for value in env["MOVIE_PIPELINE"].split()]
    record = dict(session=env["MOVIE_SESSION"], request=env.get("MOVIE_REQUEST"),
                  phase=env["MOVIE_PHASE"], pid=env["MOVIE_SHELL_PID"],
                  pid_kind="msys", cwd=env["MOVIE_CWD"],
                  outcome="completed", shell_success=status == 0,
                  native_exit_code=pipeline[0] if native else None, shell_error=None,
                  pipeline_statuses=pipeline, producer_exit_code=pipeline[0] if native else None,
                  producer_success=pipeline[0] == 0 if native else None)
    encoded = base64.b64encode(json.dumps(record).encode()).decode()
    print("[MOVIE|\n" + "\n".join(encoded[offset:offset + 60] for offset in range(0, len(encoded), 60)) + "\n|END]", flush=True)


class Recorder:
    def __init__(self, args):
        self.args = args
        self.terminal = Terminal(args, args.directory)
        self.control = args.directory / 'control'
        self.control.mkdir()
        self.next_id = 1
        self.pending = None
        self.take = None
        self.capture = None
        self.capture_due = 0
        self.stopping = None
        self.geometry = None
        self.readiness = None
        self.closed = False

    def reply(self, number, value, suffix='result'):
        value = dict(value, id=number, session_id=self.terminal.session)
        write_json(self.control / f'{number:06d}.{suffix}.json', value)
        return value

    def status(self):
        value = dict(session_id=self.terminal.session, next_request_id=self.next_id,
                     pending=self.pending, active_take=self.take and self.take['name'],
                     geometry=self.geometry, readiness=self.readiness,
                     pid=os.getpid(), closed=self.closed)
        write_json(self.control / 'status.json', value)
        write_json(self.control / 'ready.json', value)
        return value

    def begin(self, name, number):
        if self.take is not None:
            raise ValueError('A take is already active')
        if not isinstance(name, str) or not re.fullmatch(r'[a-zA-Z0-9_-]+', name):
            raise ValueError('Take name must contain only letters, digits, underscore, or dash')
        directory = self.args.directory / name
        directory.mkdir()
        (directory / 'samples').mkdir()
        self.take = dict(name=name, directory=str(directory), samples=[], begin_request=number)
        self.capture_due = 0

    def capture_tick(self, schedule=True):
        if self.take is None:
            return
        now = time.monotonic()
        if self.capture is not None:
            number, requested = self.capture
            if now - requested > 2:
                raise TimeoutError('Screenshot response exceeded two seconds')
            response = self.terminal.cdp.responses.pop(number, None)
            if response is not None:
                if 'error' in response:
                    raise RuntimeError(f'Screenshot failed: {response["error"]}')
                samples = self.take['samples']
                path = Path(self.take['directory']) / 'samples' / f'{len(samples):06d}.png'
                path.write_bytes(base64.b64decode(response['result']['data']))
                samples.append(dict(requested=requested, completed=now, path=str(path)))
                write_json(Path(self.take['directory']) / 'capture.json', self.take)
                self.capture = None
                if len(samples) == 1:
                    self.take['start'] = now
                    self.status()
                    self.reply(self.take['begin_request'], dict(outcome='completed', success=True,
                               start=now, name=self.take['name']))
        if schedule and self.capture is None and now >= self.capture_due:
            self.capture = (self.terminal.cdp.send('Page.captureScreenshot', {'format': 'png'}), now)
            self.capture_due = now + .2

    def check_observation(self):
        if self.terminal.closed:
            raise ConnectionError('Terminal connection lost or reconnected')
        if any({k:size[k] for k in self.geometry} != self.geometry
               for size in self.terminal.terminal_sizes):
            raise RuntimeError('Terminal geometry changed; start a new fixed-viewport session')

    def end(self, incomplete=False):
        if self.take is None:
            raise ValueError('No take is active')
        if not incomplete:
            while self.capture is not None:
                self.terminal.cdp.pump()
                self.check_observation()
                self.capture_tick(schedule=False)
            self.check_observation()
        take = self.take
        end = time.monotonic()
        take['end'] = end
        take['incomplete'] = incomplete
        directory = Path(take['directory'])
        try:
            if not incomplete:
                completed = [sample['completed'] for sample in take['samples']]
                sources = frame_sources(completed, take.get('start'), end)
                for index, source in enumerate(sources):
                    shutil.copyfile(take['samples'][source]['path'], directory / f'{index:06d}.png')
                take.update(frame_sources=sources, duplicated_intervals=[i for i in range(1,len(sources)) if sources[i] == sources[i-1]],
                            duration=end-take['start'], kind='frames', src=str(directory), rate=5)
            write_json(directory / 'take.json', take)
        except BaseException:
            take['incomplete'] = True
            raise
        finally:
            self.take = None
            self.capture = None
        return dict(take, outcome='interrupted' if incomplete else 'completed', success=not incomplete)

    def finish_pending(self):
        if self.pending is None:
            return
        pending = self.pending
        records = [r for r in self.terminal.parser.records
                   if r.get('session') == self.terminal.session and r.get('phase') == 'run'
                   and str(r.get('request')) == str(pending['id'])]
        if records:
            result = dict(records[-1], native_producer=pending.get('native_producer'), command=pending['command'])
            result['success'] = command_succeeded(result)
            self.pending = None
            self.status()
            self.reply(pending['id'], result)
        elif time.monotonic() >= pending['deadline']:
            self.interrupt_pending('unknown', 'Command completion deadline expired')
            raise TimeoutError('Command completion deadline expired; session terminated')

    def interrupt_pending(self, outcome, reason):
        if self.pending:
            pending = self.pending
            self.pending = None
            self.reply(pending['id'], dict(outcome=outcome, shell_success=None, raw_shell_success=None,
                       shell_error=None, native_producer=pending.get('native_producer'),
                       producer_exit_code=None, success=False, reason=reason))

    def dispatch(self, request):
        number, operation = request['id'], request['operation']
        if operation == 'run':
            if self.pending is not None:
                raise ValueError('Another command still owns terminal input')
            command = request.get('command')
            timeout = request.get('timeout_seconds', 90)
            if not isinstance(command, str) or not command or not isinstance(timeout, (int,float)) or not math.isfinite(timeout) or timeout <= 0:
                raise ValueError('run requires a command and positive finite timeout_seconds')
            native = request.get('native_producer')
            if native is not None and (not isinstance(native,str) or not native):
                raise ValueError('native_producer must name the direct or first pipeline executable')
            self.terminal.arm(number, native)
            self.pending = dict(request, deadline=time.monotonic()+timeout)
            self.terminal.type(command)
        elif operation == 'begin-take':
            self.begin(request.get('name'), number)
        elif operation == 'end-take':
            if self.take is None or not self.take['samples']:
                raise ValueError('No started take is active')
        elif operation == 'key':
            validate_key(request.get('key'))
        elif operation not in ('inspect', 'close', 'cancel'):
            raise ValueError(f'Unknown operation: {operation}')
        self.status()
        self.reply(number, dict(accepted=True, operation=operation), 'ack')
        if operation in ('run', 'begin-take'):
            return
        if operation == 'end-take':
            value = self.end()
        elif operation == 'key':
            send_key(self.terminal, request['key'])
            value = dict(outcome='completed', success=True)
        elif operation == 'inspect':
            value = dict(self.status(), outcome='completed', success=True)
        else:
            self.stopping = request
            return
        self.status()
        self.reply(number, value)

    def read_request(self):
        path = self.control / f'{self.next_id:06d}.request.json'
        if not path.exists():
            return
        request = read_json(path)
        number = self.next_id
        self.next_id += 1
        try:
            if request.get('id') != number:
                raise ValueError('Request ID does not match ordered request file')
            self.dispatch(request)
        except (ValueError, FileExistsError) as error:
            self.status()
            self.reply(number, dict(accepted=False, reason=str(error)), 'ack')
            self.reply(number, dict(outcome='completed', success=False, reason=str(error)))

    def run(self):
        failure = None
        try:
            self.terminal.start()
            self.readiness = self.terminal.readiness()
            self.terminal.install_prompt()
            sizes = self.terminal.terminal_sizes
            if not sizes or sizes[-1]['columns'] < 80:
                raise RuntimeError('Terminal requires at least 80 columns at the fixed 1600x900 viewport')
            self.geometry = {k:sizes[-1][k] for k in ('columns','rows')}
            self.status()
            while self.stopping is None:
                self.terminal.cdp.pump()
                self.check_observation()
                self.finish_pending()
                self.capture_tick()
                self.read_request()
            self.interrupt_pending('interrupted', 'Session closed by controller')
            if self.take:
                self.end(incomplete=self.stopping['operation']=='cancel')
        except BaseException as error:
            failure = error
            try:
                self.interrupt_pending('unknown', str(error))
            except BaseException:
                pass
            if self.take:
                try:
                    self.end(incomplete=True)
                except BaseException:
                    pass
        finally:
            try:
                self.terminal.close()
            except BaseException as error:
                failure = failure or error
            self.closed = True
            try:
                self.status()
                if self.stopping:
                    self.reply(self.stopping['id'], dict(outcome='completed', success=failure is None,
                               reason=str(failure) if failure else None))
            except BaseException as error:
                failure = failure or error
        if failure:
            raise failure


SPECIAL_KEYS = {
    'Enter': dict(key='Enter', code='Enter', windowsVirtualKeyCode=13, text='\r'),
    'Escape': dict(key='Escape', code='Escape', windowsVirtualKeyCode=27),
    'Tab': dict(key='Tab', code='Tab', windowsVirtualKeyCode=9, text='\t'),
    'ArrowLeft': dict(key='ArrowLeft', code='ArrowLeft', windowsVirtualKeyCode=37),
    'ArrowUp': dict(key='ArrowUp', code='ArrowUp', windowsVirtualKeyCode=38),
    'ArrowRight': dict(key='ArrowRight', code='ArrowRight', windowsVirtualKeyCode=39),
    'ArrowDown': dict(key='ArrowDown', code='ArrowDown', windowsVirtualKeyCode=40),
    'Ctrl-C': dict(key='c', code='KeyC', windowsVirtualKeyCode=67, modifiers=2),
}


def validate_key(key):
    if not isinstance(key, str) or not (key in SPECIAL_KEYS or len(key)==1 and key.isprintable()):
        raise ValueError('key must be printable, Enter, Escape, Tab, ArrowLeft/Up/Right/Down, or Ctrl-C')


def send_key(terminal, key):
    validate_key(key)
    params = SPECIAL_KEYS.get(key, dict(key=key, text=key))
    terminal.cdp.call('Input.dispatchKeyEvent', dict(type='keyDown', **params))
    terminal.cdp.call('Input.dispatchKeyEvent', dict(type='keyUp', **{k:v for k,v in params.items() if k!='text'}))


def wait_reply(control, number, suffix, timeout):
    deadline = time.monotonic() + timeout
    path = control / f'{number:06d}.{suffix}.json'
    while True:
        if path.exists():
            return read_json(path)
        if time.monotonic() >= deadline:
            return dict(id=number, outcome='client-timeout', success=False,
                        reason='Client wait expired; the command was not cancelled. Use result --id to wait again.')
        time.sleep(.02)


def client(args):
    deadline = time.monotonic() + args.timeout
    control = args.directory / 'control'
    if args.action == 'request':
        request = read_json(args.file)
        status = read_json(control / 'status.json')
        number = request.get('id')
        if type(number) is not int or number != status['next_request_id'] or status.get('closed'):
            raise ValueError(f"Request ID must be next_request_id={status['next_request_id']} in an open session")
        path = control / f'{number:06d}.request.json'
        if path.exists():
            raise ValueError('Request ID already submitted; use result --id')
        write_json(path, request)
        reply = wait_reply(control, number, 'ack', max(0, deadline-time.monotonic()))
        if reply.get('accepted') is not True:
            return reply, 1
        if not args.wait_result:
            return reply, 0
    else:
        number = args.id
        if not (control / f'{number:06d}.request.json').exists():
            raise ValueError('No submitted request has this ID')
    reply = wait_reply(control, number, 'result', max(0, deadline-time.monotonic()))
    return reply, 0 if reply.get('success') is True and reply.get('outcome') == 'completed' else 1


def main():
    if sys.argv[1:] == ['--emit-bash']:
        emit_bash()
        return 0
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest='action', required=True)
    serve = commands.add_parser('serve')
    serve.add_argument('--shell', dest='shell_kind', required=True, choices=['powershell51','powershell7','gitbash'])
    serve.add_argument('--directory', type=Path, required=True)
    serve.add_argument('--cwd', type=Path, default=Path.cwd())
    serve.add_argument('--shell-exe')
    serve.add_argument('--browser')
    serve.add_argument('--ttyd')
    request = commands.add_parser('request')
    request.add_argument('--file', type=Path, required=True)
    request.add_argument('--wait-result', action='store_true')
    result = commands.add_parser('result')
    result.add_argument('--id', type=int, required=True)
    for command in (request, result):
        command.add_argument('--directory', type=Path, required=True)
        command.add_argument('--timeout', type=float, default=30)
    args = parser.parse_args()
    try:
        args.directory = args.directory.resolve()
        if args.action == 'serve':
            if sys.platform != 'win32':
                raise RuntimeError('This example requires native Windows; use the separate Unix tmux recipe')
            args.cwd = args.cwd.resolve(strict=True)
            defaults = {'powershell51': str(Path(os.environ['SystemRoot'])/'System32/WindowsPowerShell/v1.0/powershell.exe'),
                        'powershell7': shutil.which('pwsh.exe'),
                        'gitbash': shutil.which('bash.exe')}
            args.shell_exe = args.shell_exe or defaults[args.shell_kind]
            args.browser = find_browser(args.browser)
            args.ttyd = args.ttyd or shutil.which('ttyd.exe')
            for name in ('shell_exe','browser','ttyd'):
                if not getattr(args,name) or not Path(getattr(args,name)).is_file():
                    raise FileNotFoundError(f'Provide an existing executable for --{name.replace("_","-")}')
            Recorder(args).run()
            return 0
        if not math.isfinite(args.timeout) or args.timeout < 0:
            raise ValueError('Client timeout must be finite and nonnegative')
        reply, code = client(args)
        print(json.dumps(reply, ensure_ascii=True))
        return code
    except (Exception, KeyboardInterrupt) as error:
        print(json.dumps(dict(success=False, reason=str(error)), ensure_ascii=True), file=sys.stderr)
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
