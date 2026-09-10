import tempfile
import unittest
from pathlib import Path

from PIL import Image

import fixtures


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
