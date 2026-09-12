import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

import fixtures
from PIL import Image


def run_ffmpeg(args: list[str], *, cwd: Path) -> subprocess.CompletedProcess[bytes]:
    ffmpeg = shutil.which("ffmpeg")
    if ffmpeg is None:
        raise RuntimeError("ffmpeg is required for assembly fixtures")
    result = subprocess.run(
        [ffmpeg, "-nostdin", "-y", "-v", "error", *args],
        cwd=cwd,
        capture_output=True,
        timeout=fixtures.TIMEOUT_SECONDS,
    )
    if result.returncode != 0:
        raise RuntimeError(
            f"ffmpeg fixture generation failed: {fixtures.output_text(result)}"
        )
    return result


def make_tone(path: Path, duration: float, frequency: int, *, cwd: Path) -> None:
    run_ffmpeg(
        [
            "-f",
            "lavfi",
            "-i",
            f"sine=frequency={frequency}:sample_rate=8000:duration={duration}",
            "-c:a",
            "pcm_s16le",
            str(path),
        ],
        cwd=cwd,
    )


def make_movie(path: Path, duration: float, frequency: int, *, cwd: Path) -> None:
    run_ffmpeg(
        [
            "-f",
            "lavfi",
            "-i",
            f"color=c=green:size=160x90:rate=10:duration={duration}",
            "-f",
            "lavfi",
            "-i",
            f"sine=frequency={frequency}:sample_rate=8000:duration={duration}",
            "-c:v",
            "libx264",
            "-pix_fmt",
            "yuv420p",
            "-c:a",
            "aac",
            "-shortest",
            str(path),
        ],
        cwd=cwd,
    )


def decoded_pixel(path: Path, timestamp: float, *, cwd: Path) -> tuple[int, int, int]:
    result = run_ffmpeg(
        [
            "-ss",
            str(timestamp),
            "-i",
            str(path),
            "-frames:v",
            "1",
            "-vf",
            "scale=1:1",
            "-f",
            "rawvideo",
            "-pix_fmt",
            "rgb24",
            "-",
        ],
        cwd=cwd,
    )
    if len(result.stdout) < 3:
        raise AssertionError(f"no decoded pixel from {path}")
    return tuple(result.stdout[:3])


def decoded_frequency(path: Path, *, cwd: Path) -> float:
    sample_rate = 8000
    result = run_ffmpeg(
        [
            "-ss",
            "0.1",
            "-t",
            "0.5",
            "-i",
            str(path),
            "-map",
            "0:a:0",
            "-f",
            "s16le",
            "-acodec",
            "pcm_s16le",
            "-ac",
            "1",
            "-ar",
            str(sample_rate),
            "-",
        ],
        cwd=cwd,
    )
    samples = [
        int.from_bytes(result.stdout[index:index + 2], "little", signed=True)
        for index in range(0, len(result.stdout) - 1, 2)
    ]
    nonzero = [sample for sample in samples if sample]
    crossings = sum(
        (left < 0 <= right) or (left > 0 >= right)
        for left, right in zip(nonzero, nonzero[1:])
    )
    seconds = len(samples) / sample_rate
    return crossings / (2 * seconds)


def available_browser() -> str | None:
    return fixtures.load_script("browser_tools").find_browser(os.environ.get("MOVIE_BROWSER"))


class AssemblyRegression(unittest.TestCase):
    def test_narration_padding_and_offsets(self):
        missing = fixtures.missing_executables("uv", "ffmpeg", "ffprobe")
        if missing:
            self.skipTest(f"required executable(s) not on PATH: {', '.join(missing)}")

        with tempfile.TemporaryDirectory() as directory:
            work = Path(directory)
            scenes = fixtures.assembly_fixture(work)
            result = fixtures.run_tool(
                "assemble", [str(scenes), str(work / "out.mp4")], cwd=work
            )
            self.assertEqual(result.returncode, 0, fixtures.output_text(result))
            self.assertAlmostEqual(
                fixtures.duration(work / "out.mp4"), 8, delta=0.4
            )
            offsets = json.loads(
                (work / "segments/offsets.json").read_text(encoding="utf-8")
            )
            self.assertAlmostEqual(offsets["body"], 2, delta=0.3)

            subtitles = fixtures.run_tool(
                "make-subtitles",
                [
                    str(work / "narration/manifest.json"),
                    str(work / "out.srt"),
                    "--offsets-json",
                    str(work / "segments/offsets.json"),
                ],
                cwd=work,
            )
            self.assertEqual(
                subtitles.returncode, 0, fixtures.output_text(subtitles)
            )
            srt = (work / "out.srt").read_text(encoding="utf-8")
            timing_line = next(line for line in srt.splitlines() if "-->" in line)
            start = timing_line.partition("-->")[0].strip()
            hours, minutes, seconds_millis = start.split(":")
            seconds, millis = seconds_millis.split(",")
            first_cue_start = (
                int(hours) * 3600
                + int(minutes) * 60
                + int(seconds)
                + int(millis) / 1000
            )
            self.assertAlmostEqual(
                first_cue_start,
                offsets["body"],
                delta=0.001,
            )

    def test_image_frames_and_movie_paths_timing_order_and_cleanup(self):
        missing = fixtures.missing_executables("uv", "ffmpeg", "ffprobe")
        if missing:
            self.skipTest(f"required executable(s) not on PATH: {', '.join(missing)}")

        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            launch = root / "launch"
            launch.mkdir()
            project = root / "movie O'Brien λ & [take]"
            assets = project / "assets"
            frames = assets / "frames"
            subtitles = assets / "subtitles" / "nested"
            narration = project / "narration"
            frames.mkdir(parents=True)
            subtitles.mkdir(parents=True)
            narration.mkdir()

            still = assets / "still image.png"
            Image.new("RGB", (160, 90), (230, 230, 230)).save(still)
            Image.new("RGB", (160, 90), (255, 0, 0)).save(frames / "a.png")
            Image.new("RGB", (160, 90), (0, 0, 255)).save(frames / "b.png")
            source_pngs = {
                path: path.read_bytes() for path in [still, *sorted(frames.glob("*.png"))]
            }

            source_movie = assets / "source movie.mp4"
            make_movie(source_movie, 0.8, 440, cwd=launch)
            make_tone(narration / "image.wav", 0.8, 660, cwd=launch)
            make_tone(narration / "frames.wav", 1.4, 770, cwd=launch)
            make_tone(narration / "movie.wav", 1.6, 880, cwd=launch)
            (narration / "manifest.json").write_text(json.dumps([
                {"id": "image", "text": "Image narration", "wav": "image.wav", "duration": 0.8},
                {"id": "frames", "text": "Frames narration", "wav": "frames.wav", "duration": 1.4},
            ]), encoding="utf-8")

            nested_srt = subtitles / "captions.srt"
            nested_srt.write_bytes(
                b"1\r\n00:00:00,000 --> 00:00:00,500\r\nPortable paths\r\n"
            )
            scenes = project / "scenes.yaml"
            yaml_text = f"""resolution: {{ width: 160, height: 90 }}
fps: 10
scenes:
  - id: image
    kind: image
    src: assets/still image.png
    duration: 0.3
    narration: Image narration
  - id: frames
    kind: frames
    src: {frames.resolve().as_posix()}
    rate: 2.0
    narration: Frames narration
  - id: movie
    kind: movie
    src: assets/source movie.mp4
"""
            scenes.write_bytes(yaml_text.replace("\n", "\r\n").encode("utf-8"))

            work = root / "generated outside launch"
            output = project / "assembled output.mp4"
            result = fixtures.run_tool(
                "assemble",
                [
                    os.path.relpath(scenes, launch),
                    os.path.relpath(output, launch),
                    "--narration",
                    str(narration.resolve()),
                    "--work",
                    str(work.resolve()),
                ],
                cwd=launch,
            )
            self.assertEqual(result.returncode, 0, fixtures.output_text(result))

            image_duration = fixtures.duration(work / "image.mp4")
            frames_duration = fixtures.duration(work / "frames.mp4")
            movie_duration = fixtures.duration(work / "movie.mp4")
            self.assertAlmostEqual(
                image_duration,
                max(fixtures.duration(narration / "image.wav"), 0.3),
                delta=0.25,
            )
            self.assertAlmostEqual(
                frames_duration,
                max(fixtures.duration(narration / "frames.wav"), 1.0),
                delta=0.25,
            )
            self.assertAlmostEqual(
                movie_duration,
                fixtures.duration(source_movie),
                delta=0.25,
            )
            self.assertLess(movie_duration, fixtures.duration(narration / "movie.wav") - 0.4)
            self.assertAlmostEqual(
                decoded_frequency(work / "movie.mp4", cwd=launch),
                440,
                delta=15,
            )

            offsets = json.loads(
                (work / "offsets.json").read_text(encoding="utf-8")
            )
            self.assertAlmostEqual(offsets["image"], 0.0, delta=0.001)
            self.assertAlmostEqual(offsets["frames"], image_duration, delta=0.001)
            self.assertNotIn("movie", offsets)

            first = decoded_pixel(work / "frames.mp4", 0.2, cwd=launch)
            second = decoded_pixel(work / "frames.mp4", 0.7, cwd=launch)
            self.assertGreater(first[0], first[2] + 100)
            self.assertGreater(second[2], second[0] + 100)
            self.assertEqual(
                {path: path.read_bytes() for path in source_pngs},
                source_pngs,
            )
            self.assertEqual(list(work.glob("frames-frames-*")), [])

            subtitled = project / "subtitled output.mp4"
            subtitle_result = fixtures.run_tool(
                "burn-subtitles",
                [
                    str(output.resolve()),
                    os.path.relpath(nested_srt, launch),
                    str(subtitled.resolve()),
                    "--soft",
                ],
                cwd=launch,
            )
            self.assertEqual(
                subtitle_result.returncode,
                0,
                fixtures.output_text(subtitle_result),
            )
            self.assertTrue(subtitled.is_file())

    def test_card_uses_longer_narration_duration(self):
        missing = fixtures.missing_executables("uv", "ffmpeg", "ffprobe")
        if missing:
            self.skipTest(f"required executable(s) not on PATH: {', '.join(missing)}")
        browser = available_browser()
        if browser is None:
            self.skipTest("required browser unavailable for card assembly")

        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            narration = root / "narration"
            narration.mkdir()
            make_tone(narration / "card.wav", 0.8, 550, cwd=root)
            (narration / "manifest.json").write_text(json.dumps([
                {"id": "card", "text": "Card narration", "wav": "card.wav", "duration": 0.8}
            ]), encoding="utf-8")
            scenes = root / "scenes.yaml"
            scenes.write_bytes(
                b"\xef\xbb\xbfresolution: { width: 160, height: 90 }\r\n"
                b"fps: 10\r\n"
                b"scenes:\r\n"
                b"  - id: card\r\n"
                b"    kind: card\r\n"
                b"    title: Portable\r\n"
                b"    subtitle: paths\r\n"
                b"    duration: 0.3\r\n"
                b"    narration: Card narration\r\n"
            )
            work = root / "work"
            result = fixtures.run_tool(
                "assemble",
                [
                    str(scenes),
                    str(root / "out.mp4"),
                    "--work",
                    str(work),
                    "--browser",
                    browser,
                ],
                cwd=root,
            )
            self.assertEqual(result.returncode, 0, fixtures.output_text(result))
            self.assertAlmostEqual(
                fixtures.duration(work / "card.mp4"),
                max(fixtures.duration(narration / "card.wav"), 0.3),
                delta=0.25,
            )
            offsets = json.loads(
                (work / "offsets.json").read_text(encoding="utf-8")
            )
            self.assertAlmostEqual(offsets["card"], 0.0, delta=0.001)

    def test_frame_sources_survive_failed_assembly_cleanup(self):
        missing = fixtures.missing_executables("uv", "ffmpeg", "ffprobe")
        if missing:
            self.skipTest(f"required executable(s) not on PATH: {', '.join(missing)}")

        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / "movie O'Brien λ & [take]" / "frames"
            source.mkdir(parents=True)
            bad_frame = source / "a.png"
            bad_frame.write_bytes(b"not a PNG")
            scenes = root / "scenes.yaml"
            scenes.write_text(
                f"""resolution: {{ width: 160, height: 90 }}
fps: 10
scenes:
  - id: broken
    kind: frames
    src: {source.resolve().as_posix()}
    rate: 1.0
""",
                encoding="utf-8",
            )
            work = root / "work"
            result = fixtures.run_tool(
                "assemble",
                [str(scenes), str(root / "out.mp4"), "--work", str(work)],
                cwd=root,
            )
            self.assertNotEqual(result.returncode, 0)
            self.assertEqual(bad_frame.read_bytes(), b"not a PNG")
            self.assertEqual(list(work.glob("frames-broken-*")), [])


if __name__ == "__main__":
    unittest.main()
