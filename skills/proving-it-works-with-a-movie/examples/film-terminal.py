#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.10"
# dependencies = ["websocket-client==1.9.0", "pillow"]
# ///
"""Film a shell on native Windows, where there is no tmux.

ttyd serves the shell over HTTP and a headless Chrome or Edge page renders
it: the same picture the Unix route in recording-a-terminal.md gets. `serve`
stands in for tmux: it holds the only ttyd client open so the shell survives
between tool calls, and appends the raw terminal output to
SESSION/terminal.log. Every other verb is one short CDP call against that
browser.

  serve SESSION --shell powershell51|powershell7|gitbash [--cwd DIR]
        hold the session open; run it in a background task
  run   SESSION 'command' [--record OUT] [--seconds 60] [--hold 1.5]
        type the command, film until the prompt returns, print its status
  key   SESSION Enter|Escape|Tab|Ctrl-C|ArrowDown|q [--record OUT]
        press one key
  watch SESSION --record OUT [--seconds 30]
        film without typing: a TUI after a key, or the tail of long work
  close SESSION
        kill ttyd, the browser, and everything they started

The prompt `serve` installs reports each command's status through the
window title, which the picture never shows, so `run` can print it.
"""
import argparse
import base64
import io
import json
import os
import re
import shutil
import socket
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))
from browser_tools import find_browser, kill_process_tree  # noqa: E402

FPS = 5
WIDTH, HEIGHT = 1600, 900
# Title set by the installed prompt: MOVIE;<count>;<ok>;<native exit>;<cwd>
MARKER = re.compile(rb"\x1b\][012];MOVIE;(\d+);([01]);(-?\d*);([^\x07\x1b]*)(?:\x07|\x1b\\)")
SHELLS = {
    "powershell51": (["-NoLogo", "-NoProfile", "-NoExit"], "powershell"),
    "powershell7": (["-NoLogo", "-NoProfile", "-NoExit"], "pwsh"),
    "gitbash": (["--noprofile", "--norc", "-i"], "bash"),
    "bash": (["--noprofile", "--norc", "-i"], "bash"),
}
PROMPTS = {
    "powershell": r'''$global:MovieN = 0
function global:prompt {
    $ok = $?; $native = $global:LASTEXITCODE; $global:MovieN++
    $Host.UI.RawUI.WindowTitle = "MOVIE;$global:MovieN;$([int]$ok);$native;$PWD"
    "PS $PWD> "
}
Clear-Host''',
    "bash": r'''MOVIE_N=0
movie_prompt() { local s=$?; MOVIE_N=$((MOVIE_N + 1)); printf '\033]0;MOVIE;%s;%s;%s;%s\a' "$MOVIE_N" "$((s == 0))" "$s" "$PWD"; }
PROMPT_COMMAND=movie_prompt
PS1='\w \$ '
clear''',
}
KEYS = {
    "Enter": dict(key="Enter", code="Enter", windowsVirtualKeyCode=13, text="\r"),
    "Escape": dict(key="Escape", code="Escape", windowsVirtualKeyCode=27),
    "Tab": dict(key="Tab", code="Tab", windowsVirtualKeyCode=9, text="\t"),
    "ArrowLeft": dict(key="ArrowLeft", code="ArrowLeft", windowsVirtualKeyCode=37),
    "ArrowUp": dict(key="ArrowUp", code="ArrowUp", windowsVirtualKeyCode=38),
    "ArrowRight": dict(key="ArrowRight", code="ArrowRight", windowsVirtualKeyCode=39),
    "ArrowDown": dict(key="ArrowDown", code="ArrowDown", windowsVirtualKeyCode=40),
    "Ctrl-C": dict(key="c", code="KeyC", windowsVirtualKeyCode=67, modifiers=2),
}


def shell_family(kind):
    return "bash" if kind in ("bash", "gitbash") else "powershell"


def shell_argv(kind, explicit=None):
    flags, default = SHELLS[kind]
    exe = explicit
    if not exe and kind == "gitbash":
        # PATH may hold WSL's bash.exe; only Git's is a native Windows shell.
        for root in (os.environ.get("ProgramFiles"), os.environ.get("ProgramW6432")):
            if root and (Path(root) / "Git/bin/bash.exe").is_file():
                exe = str(Path(root) / "Git/bin/bash.exe")
    exe = exe or shutil.which(default)
    if not exe:
        raise SystemExit(f"cannot find the {kind} executable; pass --shell-exe")
    return [str(Path(exe).resolve()), *flags]


def prompt_script(kind, cwd):
    """Enter the cwd (ttyd's own -w is unreliable), install the status prompt, clear."""
    if shell_family(kind) == "bash":
        quoted = "'" + str(cwd).replace("\\", "/").replace("'", "'\\''") + "'"
        return f"cd -- {quoted}\n" + PROMPTS["bash"]
    quoted = "'" + str(cwd).replace("'", "''") + "'"
    return f"Set-Location -LiteralPath {quoted}\n" + PROMPTS["powershell"]


def prompt_command(kind, cwd):
    """One typed line that runs prompt_script without any quoting hazards."""
    encoded = base64.b64encode(prompt_script(kind, cwd).encode("utf-8")).decode()
    if shell_family(kind) == "bash":
        return f'eval "$(printf %s {encoded} | base64 -d)"'
    return (". ([scriptblock]::Create([Text.Encoding]::UTF8.GetString("
            f"[Convert]::FromBase64String('{encoded}'))))")


VISIBLE = re.compile(rb"\x1b\][^\x07\x1b]*(?:\x07|\x1b\\\\)|\x1b\[[0-?]*[ -/]*[@-~]|\r")


def at_prompt(log):
    """True when the visible text so far ends in a shell prompt (`$` or `>`)."""
    return VISIBLE.sub(b"", log).rstrip(b" \t\n").endswith((b"$", b">"))


def prompts(log):
    """Every status the installed prompt has reported in these bytes, oldest first."""
    return [dict(n=int(m[1]), ok=m[2] == b"1", exit_code=int(m[3]) if m[3] else None,
                 cwd=m[4].decode("utf-8", "replace")) for m in MARKER.finditer(log)]


def key_params(key):
    if key in KEYS:
        return dict(KEYS[key])
    if len(key) == 1 and key.isprintable():
        return dict(key=key, text=key)
    raise SystemExit(f"unknown key {key!r}: use one character or one of {', '.join(KEYS)}")


def film(out, seconds, hold, capture, finished, clock=time.monotonic, sleep=time.sleep):
    """Write PNG frames on the FPS grid until `finished()` plus `hold` seconds,
    or `seconds` in all. A slow capture repeats the previous frame, so the
    directory plays back at exactly FPS. Returns the frame count."""
    out.mkdir(parents=True, exist_ok=True)
    start, index, last, stop = clock(), -1, None, None
    while True:
        now = clock()
        if stop is None and finished():
            stop = now + hold
        if now - start >= seconds or (stop is not None and now >= stop):
            return index + 1
        slot = int((now - start) * FPS)
        if slot > index:
            png = capture()
            for missed in range(index + 1, slot):
                (out / f"f{missed:05d}.png").write_bytes(last or png)
            (out / f"f{slot:05d}.png").write_bytes(png)
            index, last = slot, png
        sleep(0.02)


class CDP:
    def __init__(self, url):
        import websocket

        self.ws = websocket.create_connection(url, timeout=5, suppress_origin=True)
        self.count, self.on_event = 0, None

    def recv(self, timeout):
        import websocket

        self.ws.settimeout(timeout)
        try:
            raw = self.ws.recv()
        except websocket.WebSocketTimeoutException:
            return None
        if not raw:
            raise ConnectionError("browser connection closed")
        message = json.loads(raw)
        if "id" not in message and self.on_event:
            self.on_event(message)
        return message

    def call(self, method, params=None, timeout=10):
        self.count += 1
        self.ws.send(json.dumps({"id": self.count, "method": method, "params": params or {}}))
        deadline = time.monotonic() + timeout
        while time.monotonic() < deadline:
            message = self.recv(0.05)
            if message and message.get("id") == self.count:
                if "error" in message:
                    raise RuntimeError(f"{method}: {message['error']}")
                return message.get("result", {})
        raise TimeoutError(f"{method} took longer than {timeout:g}s")


def free_port():
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


def page_url(debug_port):
    with urllib.request.urlopen(f"http://127.0.0.1:{debug_port}/json/list", timeout=2) as response:
        pages = json.load(response)
    return next(page["webSocketDebuggerUrl"] for page in pages if page["type"] == "page")


def connect(session):
    return CDP(page_url(session["debug_port"]))


def type_text(cdp, text):
    cdp.call("Runtime.evaluate", {"expression": "document.querySelector('.xterm-helper-textarea').focus()"})
    cdp.call("Input.insertText", {"text": text})


def press(cdp, key):
    params = key_params(key)
    cdp.call("Input.dispatchKeyEvent", dict(type="keyDown", **params))
    cdp.call("Input.dispatchKeyEvent", dict(type="keyUp", **{k: v for k, v in params.items() if k != "text"}))


def screenshot(cdp):
    return base64.b64decode(cdp.call("Page.captureScreenshot", {"format": "png"}, timeout=5)["data"])


def tail(path, size=262144):
    with path.open("rb") as handle:
        handle.seek(max(0, handle.seek(0, os.SEEK_END) - size))
        return handle.read()


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2), encoding="utf-8")


def load_session(directory):
    if not (directory / "ready.json").is_file():
        raise SystemExit(f"{directory} has no ready.json: is `serve` running there?")
    return read_json(directory / "session.json")


def lit_fraction(png):
    from PIL import Image

    image = Image.open(io.BytesIO(png)).convert("L")
    return sum(image.histogram()[91:]) / (image.width * image.height)


def serve(args):
    directory = args.session
    if directory.exists() and any(directory.iterdir()):
        raise SystemExit(f"{directory} is not empty: use a new session directory")
    directory.mkdir(parents=True, exist_ok=True)
    cwd = Path(args.cwd or os.getcwd()).resolve()
    if not cwd.is_dir():
        raise SystemExit(f"--cwd is not a directory: {cwd}")
    shell = shell_argv(args.shell, args.shell_exe)
    ttyd = args.ttyd or shutil.which("ttyd")
    if not ttyd:
        raise SystemExit("ttyd is not on PATH; pass --ttyd")
    browser = find_browser(args.browser)
    if not browser:
        raise SystemExit("no Chrome or Edge found; pass --browser")
    port, debug_port = free_port(), free_port()
    unix = os.name != "nt"
    # ttyd 1.7 on Windows needs -w but decodes it in the ANSI code page, so
    # pass "." and let the shell inherit this process's Unicode cwd; the
    # installed prompt script then cds there explicitly and reports back.
    ttyd_argv = [ttyd, "-i", "127.0.0.1", "-p", str(port), "-W", "-m", "1", "-w", ".",
                 "-t", "fontSize=17", *shell]
    # Software GL: without it a GPU-less session paints the xterm canvas empty.
    browser_argv = [browser, "--headless=new", "--no-first-run", "--no-default-browser-check",
                    "--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
                    "--disable-background-networking", "--remote-debugging-address=127.0.0.1",
                    f"--remote-debugging-port={debug_port}", f"--user-data-dir={directory / 'profile'}",
                    f"--window-size={WIDTH},{HEIGHT}", "--hide-scrollbars", "about:blank"]
    logs = [(directory / "ttyd.log").open("ab"), (directory / "browser.log").open("ab")]
    processes = [
        subprocess.Popen(ttyd_argv, cwd=cwd, stdin=subprocess.DEVNULL, stdout=logs[0],
                         stderr=subprocess.STDOUT, start_new_session=unix),
        subprocess.Popen(browser_argv, cwd=directory, stdin=subprocess.DEVNULL, stdout=logs[1],
                         stderr=subprocess.STDOUT, start_new_session=unix),
    ]
    session = dict(shell=args.shell, cwd=str(cwd), terminal_url=f"http://127.0.0.1:{port}/",
                   debug_port=debug_port, pids=[process.pid for process in processes])
    write_json(directory / "session.json", session)
    output = (directory / "terminal.log").open("ab")
    state = {"closed": False}

    def on_event(event):
        if event["method"] == "Network.webSocketFrameReceived":
            frame = event["params"]["response"]
            raw = base64.b64decode(frame["payloadData"]) if frame["opcode"] == 2 else frame["payloadData"].encode()
            if raw[:1] == b"0":  # ttyd frame type 0 is terminal output
                output.write(raw[1:])
                output.flush()
        elif event["method"] == "Network.webSocketClosed":
            state["closed"] = True

    def pump_until(condition, timeout, failure):
        deadline = time.monotonic() + timeout
        while time.monotonic() < deadline:
            cdp.recv(0.05)
            if state["closed"]:
                raise ConnectionError("the terminal connection closed")
            if condition():
                return
        (directory / "timeout.png").write_bytes(screenshot(cdp))
        raise TimeoutError(f"{failure}; terminal output so far: {tail(directory / 'terminal.log')[-300:]!r}")

    def pump_while_output_flows(quiet):
        # A shell's banner and first prompt can trickle out; type only once
        # it has been silent for `quiet` seconds.
        deadline, seen = time.monotonic() + quiet, output.tell()
        while time.monotonic() < deadline:
            cdp.recv(0.05)
            if state["closed"]:
                raise ConnectionError("the terminal connection closed")
            if output.tell() != seen:
                deadline, seen = time.monotonic() + quiet, output.tell()

    code = 1
    try:
        deadline = time.monotonic() + 20
        while True:
            try:
                cdp = CDP(page_url(debug_port))
                break
            except (OSError, StopIteration) as error:
                if time.monotonic() > deadline:
                    raise TimeoutError(f"browser did not start: {error}") from None
                time.sleep(0.1)
        cdp.on_event = on_event
        cdp.call("Network.enable")  # before navigation, or the terminal socket is never reported
        cdp.call("Page.enable")
        cdp.call("Emulation.setDeviceMetricsOverride",
                 {"width": WIDTH, "height": HEIGHT, "deviceScaleFactor": 1, "mobile": False})
        cdp.call("Page.navigate", {"url": session["terminal_url"]})
        # Type only once the shell is reading input: its own prompt is on
        # screen and nothing more has arrived for a moment.
        pump_until(lambda: at_prompt(tail(directory / "terminal.log")), 20, "the shell never showed a prompt")
        pump_while_output_flows(0.5)
        # Git Bash under ConPTY can lose the first keystroke of a session.
        # Spend it on a bare Enter, which only repaints the prompt.
        press(cdp, "Enter")
        pump_while_output_flows(0.5)
        type_text(cdp, prompt_command(args.shell, cwd))
        press(cdp, "Enter")
        pump_until(lambda: prompts(tail(directory / "terminal.log")), 15,
                   "the shell never showed the installed prompt")
        prompt = prompts(tail(directory / "terminal.log"))[-1]
        if shell_family(args.shell) == "powershell":
            entered = os.path.normcase(os.path.normpath(prompt["cwd"])) == os.path.normcase(str(cwd))
        else:  # Git Bash reports /c/... paths, so compare the leaf directory
            entered = Path(prompt["cwd"]).name == cwd.name
        if not entered:
            raise RuntimeError(f"the shell is in {prompt['cwd']!r}, not {str(cwd)!r}")

        def typed(text):  # type one line and wait for the prompt after it
            before = prompts(tail(directory / "terminal.log"))[-1]["n"]
            type_text(cdp, text)
            press(cdp, "Enter")
            pump_until(lambda: prompts(tail(directory / "terminal.log"))[-1]["n"] > before, 15,
                       f"no prompt after typing {text[:24]!r}")

        # Preflight as the Unix route does: print something dense, refuse a blank canvas.
        typed("echo '" + "#" * 120 + "'")
        time.sleep(0.3)
        png = screenshot(cdp)
        (directory / "ready.png").write_bytes(png)
        lit = lit_fraction(png)
        if lit < 0.002:
            raise RuntimeError(f"the terminal renders blank ({lit:.4%} lit pixels); see ready.png")
        typed("clear")
        time.sleep(0.3)
        prompt = prompts(tail(directory / "terminal.log"))[-1]
        write_json(directory / "ready.json", dict(session, prompt=prompt, lit=round(lit, 4)))
        print(json.dumps({"ready": True, "session": str(directory), "cwd": prompt["cwd"]},
                         ensure_ascii=False), flush=True)
        while not (directory / "stop").exists():
            cdp.recv(0.2)
            if state["closed"]:
                raise ConnectionError("the terminal connection closed")
        code = 0
    except KeyboardInterrupt:
        code = 0
    except Exception as error:  # noqa: BLE001 - report, then clean up below
        print(f"serve: {error}", file=sys.stderr)
        code = 0 if (directory / "stop").exists() else 1
    finally:
        for process in processes:
            kill_process_tree(process.pid)
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                pass
        for handle in (output, *logs):
            handle.close()
    return code


def observe(args, cdp, n0):
    """Film or wait until the prompt after `n0` appears; print the status."""
    log = args.session / "terminal.log"

    def latest():
        return next((p for p in reversed(prompts(tail(log))) if p["n"] > n0), None)

    frames = 0
    if args.record:
        frames = film(args.record, args.seconds, args.hold, lambda: screenshot(cdp), lambda: latest() is not None)
    else:
        deadline = time.monotonic() + args.seconds
        while latest() is None and time.monotonic() < deadline:
            time.sleep(0.05)
    prompt = latest()
    result = {"outcome": "completed" if prompt else "running"}
    if prompt:
        result.update(ok=prompt["ok"], exit_code=prompt["exit_code"], cwd=prompt["cwd"])
    if args.record:
        result["frames"] = frames
        result["scene"] = {"kind": "frames", "src": str(args.record.resolve()), "rate": FPS}
        write_json(args.record / "take.json", result)
    print(json.dumps(result, ensure_ascii=False))
    return 2 if not prompt else 0 if prompt["ok"] else 1


def last_prompt_number(directory):
    reported = prompts(tail(directory / "terminal.log"))
    return reported[-1]["n"] if reported else 0


def run(args):
    session = load_session(args.session)
    n0 = last_prompt_number(args.session)
    cdp = connect(session)
    type_text(cdp, args.command)
    press(cdp, "Enter")
    write_json(args.session / "mark.json", {"n": n0})
    return observe(args, cdp, n0)


def key(args):
    session = load_session(args.session)
    n0 = last_prompt_number(args.session)
    cdp = connect(session)
    cdp.call("Runtime.evaluate", {"expression": "document.querySelector('.xterm-helper-textarea').focus()"})
    press(cdp, args.key)
    write_json(args.session / "mark.json", {"n": n0})
    return observe(args, cdp, n0)


def watch(args):
    session = load_session(args.session)
    # Wait for the prompt after the last run/key, even if it already returned.
    mark = args.session / "mark.json"
    n0 = read_json(mark)["n"] if mark.exists() else last_prompt_number(args.session)
    return observe(args, connect(session), n0)


def close(args):
    session = read_json(args.session / "session.json")
    (args.session / "stop").write_text("")
    for pid in session["pids"]:
        kill_process_tree(pid)
    for _ in range(50):  # the browser releases its profile shortly after dying
        try:
            shutil.rmtree(args.session / "profile")
            break
        except FileNotFoundError:
            break
        except OSError:
            time.sleep(0.1)
    print(json.dumps({"closed": True}))
    return 0


def main():
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(errors="backslashreplace")
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    verbs = parser.add_subparsers(dest="verb", required=True)

    def filming(sub, seconds):
        sub.add_argument("--record", type=Path, help="write PNG frames here at 5 fps")
        sub.add_argument("--seconds", type=float, default=seconds, help="give up waiting after this long")
        sub.add_argument("--hold", type=float, default=1.5, help="keep filming this long after the prompt returns")

    sub = verbs.add_parser("serve")
    sub.add_argument("session", type=Path)
    sub.add_argument("--shell", choices=list(SHELLS), required=True)
    sub.add_argument("--cwd", type=Path)
    sub.add_argument("--shell-exe")
    sub.add_argument("--ttyd")
    sub.add_argument("--browser")
    sub = verbs.add_parser("run")
    sub.add_argument("session", type=Path)
    sub.add_argument("command")
    filming(sub, 60)
    sub = verbs.add_parser("key")
    sub.add_argument("session", type=Path)
    sub.add_argument("key")
    filming(sub, 30)
    sub = verbs.add_parser("watch")
    sub.add_argument("session", type=Path)
    filming(sub, 30)
    sub = verbs.add_parser("close")
    sub.add_argument("session", type=Path)
    args = parser.parse_args()
    if args.verb == "watch" and not args.record:
        parser.error("watch needs --record")
    return {"serve": serve, "run": run, "key": key, "watch": watch, "close": close}[args.verb](args)


if __name__ == "__main__":
    sys.exit(main())
