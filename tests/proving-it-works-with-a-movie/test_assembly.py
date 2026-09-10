import json
import tempfile
import unittest
from pathlib import Path

import fixtures


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
            self.assertRegex(
                (work / "out.srt").read_text(encoding="utf-8"),
                r"00:00:0[2-9]",
            )


if __name__ == "__main__":
    unittest.main()
