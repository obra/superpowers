# /// script
# requires-python = ">=3.12"
# dependencies = ["pyyaml", "websocket-client==1.9.0"]
# ///
"""Prepare real browser scenes, then finish a movie with two exported terminal takes."""
import argparse
import array
import base64
import hashlib
import importlib.util
import json
import math
import os
from pathlib import Path
import shutil
import subprocess
import sys
import time
import wave

from fixtures import duration, load_script, run_tool, _run_ffmpeg

REPO = Path(__file__).resolve().parents[2]
S = REPO / "skills/proving-it-works-with-a-movie"


def write_json(path, value, *, bom=False):
    path.write_bytes(("\ufeff" if bom else "").encode("utf-8") +
                     (json.dumps(value, ensure_ascii=False, indent=2) + "\n").replace("\n", "\r\n").encode("utf-8"))


def recorder_module():
    sys.path.insert(0, str(S / "scripts"))
    spec = importlib.util.spec_from_file_location("acceptance_recorder", S / "examples/film-terminal.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def capture_browser(work):
    """Click the local application through the recorder's retained CDP client."""
    rec = recorder_module()
    browser = load_script("browser_tools").find_browser(None)
    if not browser:
        raise RuntimeError("Chrome or Edge is required")
    frames = work / "browser"
    frames.mkdir()
    shutil.copyfile(Path(__file__).parent / "fixtures/browser.html", work / "browser.html")
    port = rec.free_port()
    job = rec.WindowsJob()
    cdp = None
    samples = []
    try:
        job.spawn([browser, "--headless=new", "--no-first-run", "--no-default-browser-check",
                   f"--user-data-dir={work / 'browser-profile'}", "--remote-debugging-address=127.0.0.1",
                   f"--remote-debugging-port={port}", "about:blank"], work, work / "browser.log")
        deadline = time.monotonic() + 20
        while time.monotonic() < deadline:
            try:
                page = next(p for p in rec.http_json(f"http://127.0.0.1:{port}/json/list") if p["type"] == "page")
                cdp = rec.CDP(page["webSocketDebuggerUrl"], lambda event: None, work / "browser-cdp.jsonl")
                break
            except (OSError, StopIteration):
                time.sleep(.1)
        if cdp is None:
            raise TimeoutError("fixture browser did not start")
        cdp.call("Emulation.setDeviceMetricsOverride", {"width": 1600, "height": 900, "deviceScaleFactor": 1, "mobile": False})
        cdp.call("Page.navigate", {"url": (work / "browser.html").resolve().as_uri()})
        deadline = time.monotonic() + 10
        while time.monotonic() < deadline:
            found = cdp.call("Runtime.evaluate", {"expression": "!!document.querySelector('button')", "returnByValue": True})
            if found["result"].get("value"):
                break
            time.sleep(.1)
        else:
            raise TimeoutError("fixture page did not load")
        position = cdp.call("Runtime.evaluate", {"expression": "(()=>{const r=document.querySelector('button').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()", "returnByValue": True})["result"]["value"]
        for expected in range(3):
            if expected:
                cdp.call("Input.dispatchMouseEvent", {"type": "mouseMoved", **position})
                for event in ("mousePressed", "mouseReleased"):
                    cdp.call("Input.dispatchMouseEvent", {"type": event, **position, "button": "left", "clickCount": 1})
            actual = cdp.call("Runtime.evaluate", {"expression": "document.querySelector('output').value", "returnByValue": True})
            if actual["result"].get("value") != str(expected):
                raise RuntimeError(f"real click did not update counter: {actual}")
            for _ in range(7):
                started = time.monotonic()
                request = cdp.send("Page.captureScreenshot", {"format": "png"})
                deadline = started + 2
                while request not in cdp.responses and time.monotonic() < deadline:
                    cdp.pump()
                response = cdp.responses.pop(request, None)
                ended = time.monotonic()
                if ended > deadline or not response or "error" in response:
                    raise TimeoutError("fixture screenshot exceeded two seconds")
                target = frames / f"frame-{len(samples):08d}.png"
                target.write_bytes(base64.b64decode(response["result"]["data"]))
                samples.append({"state": expected, "started": started, "completed": ended, "frame": target.name})
                time.sleep(max(0, .2 - (time.monotonic() - started)))
        shutil.copyfile(frames / "frame-00000000.png", work / "still.png")
        write_json(work / "browser-samples.json", samples)
    finally:
        if cdp:
            cdp.ws.close()
            cdp.trace.close()
        job.close()
    shutil.rmtree(work / "browser-profile")


def prepare(work, shell):
    work.mkdir(parents=True)
    capture_browser(work)
    card = work / "source.html"
    card.write_text('<meta charset="utf-8"><body style="background:#293548;color:white;font:48px system-ui;padding:90px"><h1>Existing movie segment</h1><p>Original 440 Hz reference tone</p><p>This segment keeps its own audio. No speech.</p>', encoding="utf-8")
    browser = load_script("browser_tools")
    browser.render_card(card, work / "source.png", browser=browser.find_browser(None), width=1600, height=900)
    _run_ffmpeg(["-loop", "1", "-i", str(work / "source.png"), "-f", "lavfi", "-i", "sine=frequency=440:duration=2",
                 "-t", "2", "-r", "30", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-ac", "2", str(work / "source.mp4")], cwd=work)
    scenes = {"resolution": {"width": 1600, "height": 900}, "fps": 30, "scenes": [
        {"id": "title", "kind": "card", "title": "Native Windows proof", "body": shell, "duration": 1,
         "narration": "This movie shows a local browser and a real terminal running on Windows."},
        {"id": "still", "kind": "image", "src": "still.png", "duration": 4, "narration": "The counter starts at zero."},
        {"id": "source", "kind": "movie", "src": "source.mp4", "height": 900},
        {"id": "browser", "kind": "frames", "src": "browser", "rate": 5, "narration": "Two real clicks change the counter from zero to two."},
        {"id": "take-one", "kind": "frames", "src": "TAKE_ONE", "rate": 5,
         "narration": "The terminal shows three colored states. The command stays alive between takes."},
        {"id": "take-two", "kind": "frames", "src": "TAKE_TWO", "rate": 5,
         "narration": "The same command receives the exit key and finishes successfully."}]}
    write_json(work / "scenes.json", scenes, bom=True)
    write_json(work / "prepare.json", {"shell_selection": shell, "browser": browser.find_browser(None), "source_audio": "440 Hz sine, two seconds, no speech"})


def tone(path):
    with wave.open(str(path)) as f:
        rate = f.getframerate()
        values = array.array("h", f.readframes(f.getnframes()))
    # Use the center second, avoiding AAC edge padding.
    values = values[rate // 2:rate * 3 // 2]
    crossings = sum(a <= 0 < b for a, b in zip(values, values[1:]))
    return {"frequency": crossings * rate / len(values), "rms": math.sqrt(sum(v*v for v in values) / len(values))}


def finish(work, one, two):
    scenes = work / "scenes.json"
    doc = json.loads(scenes.read_text(encoding="utf-8-sig"))
    for scene, take in zip(doc["scenes"][-2:], [one, two]):
        if not take.is_dir() or not list(take.glob("*.png")):
            raise ValueError(f"exported frame directory required: {take}")
        scene["src"] = str(take.resolve())
    write_json(scenes, doc, bom=True)
    voice, segments = work / "narration", work / "assembly work"
    cut, movie, subtitles = work / "cut.mp4", work / "movie.mp4", work / "movie.srt"
    evidence = work / "evidence"
    evidence.mkdir(exist_ok=True)
    steps = [("narrate", [str(scenes), str(voice), "--engine", "piper", "--verify", "on"]),
             ("narrate", [str(scenes), str(work / "cached-model-repeat"), "--engine", "piper", "--verify", "on"]),
             ("assemble", [str(scenes), str(cut), "--narration", str(voice), "--work", str(segments)]),
             ("make-subtitles", [str(voice / "manifest.json"), str(subtitles), "--offsets-json", str(segments / "offsets.json")]),
             ("burn-subtitles", [str(cut), str(subtitles), str(movie)]),
             ("check-movie", [str(movie), "--out", str(evidence / "checker"), "--json"])]
    records = []
    for index, (name, args) in enumerate(steps):
        start = time.time()
        result = run_tool(name, args, cwd=evidence)
        (evidence / f"{index}-{name}.stdout").write_bytes(result.stdout)
        (evidence / f"{index}-{name}.stderr").write_bytes(result.stderr)
        records.append({"tool": name, "argv": [shutil.which("uv"), "run", "--script", str(S / "scripts" / name), *args], "exit": result.returncode, "elapsed": time.time() - start})
        write_json(evidence / "commands.json", records)
        print(f"{name}: exit {result.returncode}", flush=True)
        if result.returncode:
            raise RuntimeError(f"{name} failed; inspect {evidence}")
    verify_audio(work, doc, segments, movie, evidence)
    write_json(evidence / "source-hashes.json", {str(p.relative_to(REPO)): hashlib.sha256(p.read_bytes()).hexdigest() for p in [S / "examples/film-terminal.py", *[S / "scripts" / n for n in ["narrate", "assemble", "make-subtitles", "burn-subtitles", "check-movie"]], Path(__file__)]})


def verify_audio(work, doc, segments, movie, evidence):
    narrator = load_script("narrate")
    checks, clock = [], 0.
    for scene in doc["scenes"]:
        length = duration(segments / (scene["id"] + ".mp4"))
        audio = evidence / (scene["id"] + "-rendered.wav")
        _run_ffmpeg(["-ss", str(clock), "-i", str(movie), "-t", str(length), "-vn", "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", str(audio)], cwd=work)
        if scene["id"] == "source":
            reference = evidence / "source-reference.wav"
            _run_ffmpeg(["-i", str(work / "source.mp4"), "-vn", "-ar", "16000", "-ac", "1", "-c:a", "pcm_s16le", str(reference)], cwd=work)
            actual, expected = tone(audio), tone(reference)
            passed = abs(actual["frequency"] - expected["frequency"]) < 2 and .9 < actual["rms"] / expected["rms"] < 1.1
            check = {"source_reference": expected, "rendered": actual, "passed": passed}
        else:
            heard = narrator.transcribe_local(audio)
            if heard is None:
                raise RuntimeError(f"rendered ASR unavailable for {scene['id']}")
            drift, worst = narrator.structural_drift(scene["narration"], heard)
            check = {"script": scene["narration"], "heard": heard, "drift": drift, "worst": worst, "passed": drift <= .15 and worst <= 3}
        checks.append({"scene": scene["id"], "start": clock, "duration": length, **check})
        write_json(evidence / "rendered-audio.json", checks)
        if not check["passed"]:
            raise RuntimeError(f"rendered audio differs for {scene['id']}: {check}")
        clock += length


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--work", type=Path, required=True)
    parser.add_argument("--shell", choices=["powershell51", "powershell7", "gitbash"], required=True)
    parser.add_argument("--phase", choices=["prepare", "finish"], required=True)
    parser.add_argument("--take-one", type=Path)
    parser.add_argument("--take-two", type=Path)
    args = parser.parse_args()
    if sys.platform != "win32":
        parser.error("run this native Windows acceptance fixture on Windows")
    if args.phase == "prepare":
        prepare(args.work.resolve(), args.shell)
    else:
        if args.take_one is None or args.take_two is None:
            parser.error("finish requires --take-one and --take-two exported frame directories")
        finish(args.work.resolve(), args.take_one, args.take_two)


if __name__ == "__main__":
    main()
