import io
import json
import subprocess
import sys
import tempfile
from contextlib import redirect_stdout
import unittest
from pathlib import Path
from unittest.mock import patch

from PIL import Image

import fixtures


class CheckerPolicyRegression(unittest.TestCase):
    def check(self, expected_exit, *options, audio=True, levels=None,
              embedded=None, sidecar=None, extraction_exit=0):
        module = fixtures.load_script("check-movie")
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            movie = root / "movie.mp4"
            movie.write_bytes(b"metadata fixture only")
            if sidecar is not None:
                movie.with_suffix(".srt").write_text(sidecar, encoding="utf-8-sig")
            streams = [{"index": 0, "codec_type": "video", "codec_name": "h264",
                        "width": 640, "height": 360}]
            if audio:
                streams.append({"index": 1, "codec_type": "audio", "codec_name": "aac"})
            if embedded is not None:
                streams.append({"index": 2, "codec_type": "subtitle", "codec_name": "mov_text"})
            levels = levels if levels is not None else [-20.0] * 20
            info = {"format": {"duration": str(len(levels))}, "streams": streams}

            def media_command(cmd, **kwargs):
                if cmd[0] == "ffprobe":
                    return subprocess.CompletedProcess(cmd, 0, json.dumps(info), "")
                if cmd[0] == "ffmpeg" and embedded is not None:
                    self.assertEqual(cmd[cmd.index("-i") + 1], str(movie))
                    self.assertEqual(cmd[cmd.index("-map") + 1], "0:s:0")
                    self.assertEqual(cmd[cmd.index("-f") + 1], "srt")
                    return subprocess.CompletedProcess(cmd, extraction_exit, embedded,
                                                       "subtitle decode failed" if extraction_exit else "")
                raise AssertionError(f"unexpected media command: {cmd}")

            output = root / "report"
            argv = ["check-movie", str(movie), "--out", str(output), "--json", *options]
            stdout = io.StringIO()
            with patch.object(sys, "argv", argv), \
                 patch.object(module.shutil, "which", return_value="test-tool"), \
                 patch.object(module.subprocess, "run", side_effect=media_command), \
                 patch.object(module, "sample_picture", return_value=([], [0.1] * (len(levels) - 1))), \
                 patch.object(module, "sample_sound", return_value=levels if audio else []), \
                 patch.object(module, "contact_sheet", return_value=[]), \
                 redirect_stdout(stdout):
                try:
                    code = module.main()
                except SystemExit as error:
                    code = error.code
            self.assertEqual(code, expected_exit, stdout.getvalue())
            report = output / "check.json"
            failures = json.loads(report.read_text(encoding="utf-8"))["failures"] if report.exists() else []
            return failures, stdout.getvalue()

    def test_silent_encoded_track_passes_when_audio_is_not_expected(self):
        failures, _ = self.check(0, "--no-expect-audio", levels=[-120.0] * 20)
        self.assertEqual(failures, [])

    def test_absent_audio_passes_when_audio_is_not_expected(self):
        failures, _ = self.check(0, "--no-expect-audio", audio=False)
        self.assertEqual(failures, [])

    def test_silent_encoded_track_fails_when_audio_is_expected(self):
        failures, _ = self.check(1, levels=[-120.0] * 20)
        self.assertTrue(any("silent" in failure for failure in failures))

    def test_audio_opt_out_still_requires_captions_for_audible_speech(self):
        failures, _ = self.check(1, "--no-expect-audio")
        self.assertTrue(any("no subtitles" in failure for failure in failures))

    def test_subtitle_opt_out_allows_audible_speech_without_captions(self):
        failures, _ = self.check(0, "--no-expect-audio", "--no-expect-subtitles")
        self.assertEqual(failures, [])

    def test_empty_embedded_track_fails_even_for_short_narration(self):
        for seconds in (2, 20):
            with self.subTest(seconds=seconds):
                failures, _ = self.check(1, embedded="", levels=[-20.0] * seconds)
                self.assertTrue(any("subtitle" in failure for failure in failures))

    def test_sidecar_and_embedded_cues_must_reach_the_end_of_speech(self):
        for source in ("sidecar", "embedded"):
            for end, expected_exit in (("06,000", 1), ("10,000", 0)):
                with self.subTest(source=source, end=end):
                    subtitles = f"1\n00:00:00,000 --> 00:00:{end}\nUnicode λ caption\n"
                    failures, _ = self.check(expected_exit, levels=[-20.0] * 10 + [-120.0] * 10,
                                             **{source: subtitles})
                    self.assertEqual(bool(failures), bool(expected_exit))

    def test_embedded_extraction_failure_is_not_accepted(self):
        _, diagnostics = self.check(2, embedded="", extraction_exit=1)
        self.assertIn("subtitle", diagnostics)

    def test_malformed_embedded_cue_is_a_reported_failure(self):
        _, diagnostics = self.check(2, embedded="1\n00:00:00,000 --> invalid\ncaption\n")
        self.assertIn("subtitle", diagnostics)


class CheckerRegression(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        missing = fixtures.missing_executables("uv", "ffmpeg", "ffprobe")
        if missing:
            raise unittest.SkipTest(
                f"required executable(s) not on PATH: {', '.join(missing)}"
            )
        cls._temporary_directory = tempfile.TemporaryDirectory()
        cls.addClassCleanup(cls._temporary_directory.cleanup)
        cls.work = Path(cls._temporary_directory.name)
        cls.movies = fixtures.checker_fixture(cls.work)

    def check(
        self, expected_exit: int, needle: str, movie: Path, *extra_args: str
    ) -> Path:
        output_directory = self.work / f"{movie.stem}-check"
        result = fixtures.run_tool(
            "check-movie",
            [str(movie), "--out", str(output_directory), *extra_args],
            cwd=self.work,
        )
        output = fixtures.output_text(result)
        self.assertEqual(result.returncode, expected_exit, output)
        self.assertIn(needle.casefold(), output.casefold())
        return output_directory

    def test_front_loaded_action_is_rejected(self):
        self.check(
            1,
            "every visible change happens in the first",
            self.movies["front-loaded"],
        )

    def test_paced_with_subtitles_is_accepted(self):
        self.check(0, "Mechanical checks pass", self.movies["paced"])

    def test_narrated_without_subtitles_is_rejected(self):
        self.check(
            1,
            "no subtitles",
            self.movies["paced"],
            "--subs",
            str(self.work / "nope.srt"),
        )

    def test_subtitles_that_stop_early_are_rejected(self):
        self.check(1, "subtitles stop at", self.movies["short"])

    def test_subtitle_check_is_opt_outable(self):
        self.check(
            0,
            "Mechanical checks pass",
            self.movies["paced"],
            "--subs",
            str(self.work / "nope.srt"),
            "--no-expect-subtitles",
        )

    def test_still_with_audio_is_rejected(self):
        self.check(1, "never reaches a new state", self.movies["still"])

    def test_missing_narration_is_rejected(self):
        self.check(1, "no audio stream", self.movies["silent"])

    def test_silent_movie_passes_when_unnarrated(self):
        self.check(
            0,
            "Mechanical checks pass",
            self.movies["silent"],
            "--no-expect-audio",
        )

    def test_contact_sheet_is_always_written(self):
        output_directory = self.check(
            0, "contact-sheet.png", self.movies["paced"]
        )
        sheet = output_directory / "contact-sheet.png"
        self.assertTrue(sheet.is_file(), f"missing contact sheet: {sheet}")
        with Image.open(sheet) as image:
            image.load()
            self.assertEqual(image.format, "PNG")


if __name__ == "__main__":
    unittest.main()
