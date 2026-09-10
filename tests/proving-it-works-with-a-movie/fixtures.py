"""Portable fixtures for the imported movie regression suites."""

import json
import importlib.util
import importlib.machinery
import shutil
import subprocess
import types
import sys
from pathlib import Path


TIMEOUT_SECONDS = 900


def missing_executables(*names: str) -> list[str]:
    """Return executable names that cannot be resolved on PATH."""
    return [name for name in names if shutil.which(name) is None]


def output_text(result: subprocess.CompletedProcess[bytes]) -> str:
    """Decode a captured command's combined output as UTF-8 evidence."""
    return (result.stdout + result.stderr).decode("utf-8", errors="replace")


def run_tool(
    name: str,
    args: list[str],
    *,
    cwd: Path,
    env: dict[str, str] | None = None,
) -> subprocess.CompletedProcess[bytes]:
    """Invoke one extensionless movie tool through its PEP 723 environment."""
    uv = shutil.which("uv")
    if uv is None:
        raise RuntimeError("uv is required for movie tool tests")
    script = (
        Path(__file__).resolve().parents[2]
        / "skills/proving-it-works-with-a-movie/scripts"
        / name
    )
    return subprocess.run(
        [uv, "run", "--script", str(script), *args],
        cwd=cwd,
        env=env,
        capture_output=True,
        timeout=TIMEOUT_SECONDS,
    )


def load_script(name: str) -> types.ModuleType:
    """Load an extensionless movie tool as a test module."""
    script = (
        Path(__file__).resolve().parents[2]
        / "skills/proving-it-works-with-a-movie/scripts"
        / name
    )
    if not script.exists():
        script = script.with_suffix(".py")
    sys.path.insert(0, str(script.parent))
    loader = importlib.machinery.SourceFileLoader(f"movie_tool_{name}", str(script))
    spec = importlib.util.spec_from_loader(loader.name, loader)
    if spec is None or spec.loader is None:
        raise ImportError(f"cannot load movie tool {name!r}")
    module = importlib.util.module_from_spec(spec)
    try:
        spec.loader.exec_module(module)
    finally:
        sys.path.pop(0)
    return module


def duration(path: Path) -> float:
    """Measure a media file's container duration with ffprobe."""
    ffprobe = shutil.which("ffprobe")
    if ffprobe is None:
        raise RuntimeError("ffprobe is required for movie tool tests")
    result = subprocess.run(
        [
            ffprobe,
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "csv=p=0",
            str(path),
        ],
        capture_output=True,
        timeout=TIMEOUT_SECONDS,
    )
    if result.returncode != 0:
        raise RuntimeError(f"ffprobe failed for {path}: {output_text(result)}")
    return float(result.stdout.decode("utf-8").strip())


def _run_ffmpeg(args: list[str], *, cwd: Path) -> None:
    ffmpeg = shutil.which("ffmpeg")
    if ffmpeg is None:
        raise RuntimeError("ffmpeg is required for movie tool tests")
    result = subprocess.run(
        [ffmpeg, "-nostdin", "-y", "-v", "error", *args],
        cwd=cwd,
        capture_output=True,
        timeout=TIMEOUT_SECONDS,
    )
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg fixture generation failed: {output_text(result)}")


def assembly_fixture(work: Path) -> Path:
    """Write the imported image/frames/synthetic-timing-audio assembly case."""
    shots = work / "shots"
    shots.mkdir(parents=True)
    for index in range(1, 5):
        _run_ffmpeg(
            [
                "-f",
                "lavfi",
                "-i",
                f"color=c=0x{index}0{index}0{index}0:size=320x180:d=0.1",
                "-frames:v",
                "1",
                str(shots / f"s0{index}.png"),
            ],
            cwd=work,
        )

    narration = work / "narration"
    narration.mkdir()
    wav = narration / "body.wav"
    _run_ffmpeg(
        [
            "-f",
            "lavfi",
            "-i",
            "sine=frequency=300:duration=6",
            str(wav),
        ],
        cwd=work,
    )
    manifest = [
        {
            "id": "body",
            "text": "one two three four five six seven eight nine ten",
            "wav": "body.wav",
            "duration": duration(wav),
        }
    ]
    (narration / "manifest.json").write_text(
        json.dumps(manifest), encoding="utf-8"
    )

    scenes = work / "scenes.yaml"
    scenes.write_text(
        """resolution: { width: 640, height: 360 }
fps: 30
scenes:
  - id: opener
    kind: image
    src: shots/s01.png
    duration: 2
  - id: body
    kind: frames
    src: shots
    rate: 1.0
""",
        encoding="utf-8",
    )
    return scenes


def checker_fixture(work: Path) -> dict[str, Path]:
    """Create the four imported checker movies and their subtitle sidecars."""
    front_loaded = work / "front-loaded.mp4"
    _run_ffmpeg(
        [
            "-f",
            "lavfi",
            "-i",
            "testsrc2=size=320x240:rate=10:d=2",
            "-f",
            "lavfi",
            "-i",
            "color=c=navy:size=320x240:rate=10:d=20",
            "-f",
            "lavfi",
            "-i",
            "sine=frequency=300:duration=22",
            "-filter_complex",
            "[0:v][1:v]concat=n=2:v=1:a=0[v]",
            "-map",
            "[v]",
            "-map",
            "2:a",
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            "-c:a",
            "aac",
            "-shortest",
            str(front_loaded),
        ],
        cwd=work,
    )

    paced = work / "paced.mp4"
    _run_ffmpeg(
        [
            "-f",
            "lavfi",
            "-i",
            "testsrc2=size=320x240:rate=10:d=22",
            "-f",
            "lavfi",
            "-i",
            "sine=frequency=300:duration=22",
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            "-c:a",
            "aac",
            "-shortest",
            str(paced),
        ],
        cwd=work,
    )

    still = work / "still.mp4"
    _run_ffmpeg(
        [
            "-f",
            "lavfi",
            "-i",
            "color=c=navy:size=320x240:rate=10:d=12",
            "-f",
            "lavfi",
            "-i",
            "sine=frequency=300:duration=12",
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            "-c:a",
            "aac",
            "-shortest",
            str(still),
        ],
        cwd=work,
    )

    silent = work / "silent.mp4"
    _run_ffmpeg(
        [
            "-f",
            "lavfi",
            "-i",
            "testsrc2=size=320x240:rate=10:d=12",
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            str(silent),
        ],
        cwd=work,
    )

    subtitles = """1
00:00:00,000 --> 00:00:07,000
A narrated movie needs subtitles:
plenty of people watch muted.

2
00:00:07,000 --> 00:00:14,000
The checker treats their absence
as a defect, not a nicety.

3
00:00:14,000 --> 00:00:21,500
And it notices when they stop
before the narration does.
"""
    (work / "paced.srt").write_text(subtitles, encoding="utf-8")
    (work / "short.srt").write_text(
        "\n".join(subtitles.splitlines()[:8]) + "\n", encoding="utf-8"
    )
    short = work / "short.mp4"
    shutil.copyfile(paced, short)

    return {
        "front-loaded": front_loaded,
        "paced": paced,
        "still": still,
        "silent": silent,
        "short": short,
    }
