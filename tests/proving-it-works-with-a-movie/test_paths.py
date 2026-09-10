import shutil
import subprocess
import sys
import tempfile
import unittest
import wave
from pathlib import Path


SCRIPTS = (
    Path(__file__).resolve().parents[2]
    / "skills/proving-it-works-with-a-movie/scripts"
)
sys.path.insert(0, str(SCRIPTS))

import media_paths


class MediaPathRegression(unittest.TestCase):
    def test_frame_staging_uses_ordinary_ordered_files(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / "movie O'Brien λ & [take]"
            source.mkdir()
            (source / "b.png").write_bytes(b"second")
            (source / "a.png").write_bytes(b"first")

            staged = media_paths.stage_frames(source, root / "staged")

            self.assertEqual(
                [path.read_bytes() for path in staged],
                [b"first", b"second"],
            )
            self.assertTrue(all(not path.is_symlink() for path in staged))
            self.assertEqual(len(list(source.iterdir())), 2)

    def test_frame_staging_rejects_an_empty_source(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / "empty"
            source.mkdir()

            with self.assertRaisesRegex(ValueError, "no PNG frames"):
                media_paths.stage_frames(source, root / "staged")

            self.assertFalse((root / "staged").exists())

    def test_ffconcat_entry_is_accepted_by_ffmpeg(self):
        ffmpeg = shutil.which("ffmpeg")
        if ffmpeg is None:
            self.skipTest("required executable not on PATH: ffmpeg")

        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory) / "movie O'Brien λ & [take]"
            nested = root / "subtitles" / "nested"
            nested.mkdir(parents=True)
            audio = nested / "tone.wav"
            with wave.open(str(audio), "wb") as output:
                output.setnchannels(1)
                output.setsampwidth(2)
                output.setframerate(8000)
                output.writeframes(b"\x00\x00" * 800)

            if sys.platform == "win32":
                self.assertRegex(str(audio.resolve()), r"^[A-Za-z]:\\")

            listing = root / "concat.txt"
            listing.write_text(
                "ffconcat version 1.0\n" + media_paths.ffconcat_entry(audio),
                encoding="utf-8",
            )
            result = subprocess.run(
                [
                    ffmpeg,
                    "-nostdin",
                    "-v",
                    "error",
                    "-f",
                    "concat",
                    "-safe",
                    "0",
                    "-i",
                    str(listing),
                    "-f",
                    "null",
                    "-",
                ],
                cwd=Path(directory),
                capture_output=True,
                timeout=30,
            )
            self.assertEqual(
                result.returncode,
                0,
                (result.stdout + result.stderr).decode("utf-8", errors="replace"),
            )

    def test_ffconcat_entry_rejects_line_breaks(self):
        with self.assertRaisesRegex(ValueError, "cannot contain line breaks"):
            media_paths.ffconcat_entry(Path("bad\nname.wav"))


if __name__ == "__main__":
    unittest.main()
