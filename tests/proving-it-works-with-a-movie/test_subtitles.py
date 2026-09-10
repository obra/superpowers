import tempfile
import sys
import io
from contextlib import redirect_stderr, redirect_stdout
import unittest
from pathlib import Path
from unittest.mock import patch

import fixtures


class SubtitlePathRegression(unittest.TestCase):
    def test_hard_burn_runs_from_safe_directory_with_absolute_media(self):
        module = fixtures.load_script("burn-subtitles")
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory) / "movie O'Brien λ"
            root.mkdir()
            movie, subs, output = root / "in.mp4", root / "nested" / "captions.srt", root / "out.mp4"
            subs.parent.mkdir()
            movie.write_bytes(b"movie")
            subs.write_bytes("\ufeff1\r\n00:00:00,000 --> 00:00:01,000\r\nλ\r\n".encode("utf-8"))
            calls = []

            def fake_run(cmd, *, cwd=None):
                calls.append((cmd, cwd))
                if cwd is not None:
                    self.assertEqual((cwd / "captions.srt").read_bytes(), subs.read_bytes())
                return True

            with patch.object(sys, "argv", ["burn-subtitles", str(movie), str(subs), str(output)]), patch.object(module, "has_libass", return_value=True), patch.object(module, "run", side_effect=fake_run):
                self.assertEqual(module.main(), 0)
            command, cwd = calls[0]
            self.assertEqual(cwd.name.startswith("movie-subtitles-"), True)
            self.assertIn(str(movie.resolve()), command)
            self.assertIn(str(output.resolve()), command)
            self.assertTrue(any(value.startswith("subtitles=filename=captions.srt") for value in command))
            self.assertFalse(cwd.exists())

    def test_burn_failure_is_reported_separately_from_missing_libass(self):
        module = fixtures.load_script("burn-subtitles")
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            movie, subs, output = root / "in.mp4", root / "captions.srt", root / "out.mp4"
            movie.write_bytes(b"movie")
            subs.write_text("1\n00:00:00,000 --> 00:00:01,000\ncaption\n", encoding="utf-8")
            with patch.object(sys, "argv", ["burn-subtitles", str(movie), str(subs), str(output)]), patch.object(module, "has_libass", return_value=True), patch.object(module, "run", return_value=False):
                self.assertEqual(module.main(), 1)

class SubtitleIntegrationRegression(unittest.TestCase):
    def test_bom_manifest_and_offsets_write_utf8_under_legacy_console(self):
        import json
        import os
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            manifest, offsets, out = root / "manifest.json", root / "offsets.json", root / "λ.srt"
            manifest.write_bytes(('\ufeff' + json.dumps([{"id": "clip", "text": "Unicode λ café", "duration": 1}], ensure_ascii=False) + '\r\n').encode('utf-8'))
            offsets.write_text('{"clip": 2}', encoding="utf-8-sig")
            env = dict(os.environ, PYTHONIOENCODING="cp1252", PYTHONUTF8="0")
            result = fixtures.run_tool("make-subtitles", [str(manifest), str(out), "--offsets-json", str(offsets)], cwd=root, env=env)
            self.assertEqual(result.returncode, 0, fixtures.output_text(result))
            text = out.read_text(encoding="utf-8")
            self.assertIn("Unicode λ café", text)
            self.assertIn("00:00:02,000 --> 00:00:03,000", text)
            self.assertFalse(out.read_bytes().startswith(b'\xef\xbb\xbf'))

    def test_hard_subtitles_are_pixels_in_nested_special_path(self):
        import subprocess
        module = fixtures.load_script("burn-subtitles")
        if not module.has_libass():
            self.skipTest("libass FFmpeg is required for hard subtitle pixels")
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory) / "O'Brien λ # %"
            root.mkdir()
            movie, subs, output = root / "in.mp4", root / "nested" / "O'Brien.srt", root / "out.mp4"
            subs.parent.mkdir()
            subs.write_bytes("\ufeff1\r\n00:00:00,000 --> 00:00:01,000\r\nVisible caption\r\n".encode("utf-8"))
            fixtures._run_ffmpeg(["-f", "lavfi", "-i", "color=c=black:s=640x360:d=1", "-c:v", "libx264", str(movie)], cwd=root)
            result = fixtures.run_tool("burn-subtitles", [str(movie), str(subs), str(output)], cwd=Path(directory))
            self.assertEqual(result.returncode, 0, fixtures.output_text(result))
            self.assertIn("burned into the picture", fixtures.output_text(result))
            frame = subprocess.run(["ffmpeg", "-v", "error", "-ss", "0.5", "-i", str(output), "-frames:v", "1", "-pix_fmt", "gray", "-f", "rawvideo", "-"], capture_output=True, check=True).stdout
            self.assertGreater(sum(value > 180 for value in frame), 50)

    def test_burn_failure_fallback_does_not_claim_missing_libass(self):
        module = fixtures.load_script("burn-subtitles")
        for libass in (True, False):
            with self.subTest(libass=libass), tempfile.TemporaryDirectory() as directory:
                root = Path(directory)
                movie, subs = root / "in.mp4", root / "in.srt"
                movie.touch(); subs.touch()
                stdout, stderr = io.StringIO(), io.StringIO()
                with patch.object(sys, "argv", ["burn-subtitles", str(movie), str(subs), str(root / "out.mp4")]), patch.object(module, "has_libass", return_value=libass), patch.object(module, "run", side_effect=[False, True] if libass else [True]), redirect_stdout(stdout), redirect_stderr(stderr):
                    self.assertEqual(module.main(), 0)
                self.assertEqual("no libass" in stdout.getvalue(), not libass)
                self.assertEqual("burn failed" in stderr.getvalue(), libass)


if __name__ == "__main__":
    unittest.main()
