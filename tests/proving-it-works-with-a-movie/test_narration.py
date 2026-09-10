import tempfile
import unittest
from pathlib import Path

import fixtures


SCRIPT = (
    "This is smevals studio. Every eval on the shelf is a folder of tasks and "
    "graders."
)


class NarrationDriftRegression(unittest.TestCase):
    def drift(self, expected_exit: int, heard: str) -> None:
        missing = fixtures.missing_executables("uv")
        if missing:
            self.skipTest(
                f"required executable(s) not on PATH: {', '.join(missing)}"
            )
        with tempfile.TemporaryDirectory() as directory:
            work = Path(directory)
            script_path = work / "script.txt"
            heard_path = work / "heard.txt"
            script_path.write_text(SCRIPT, encoding="utf-8")
            heard_path.write_text(heard, encoding="utf-8")
            result = fixtures.run_tool(
                "narrate",
                ["--drift-check", str(script_path), str(heard_path)],
                cwd=work,
            )
            self.assertEqual(
                result.returncode, expected_exit, fixtures.output_text(result)
            )

    def test_mispronounced_jargon_passes(self):
        self.drift(
            0,
            "This is Mevil studio. Every Yvel on the shelf is a folder of tasks "
            "and graders.",
        )

    def test_exact_transcript_passes(self):
        self.drift(0, SCRIPT)

    def test_dropped_clause_fails(self):
        self.drift(1, "This is smevals studio.")

    def test_invented_preamble_fails(self):
        self.drift(
            1,
            "Sure, here it is, happy to help with that. This is smevals studio. "
            "Every eval on the shelf is a folder of tasks and graders.",
        )

    def test_empty_clip_fails(self):
        self.drift(1, "you")


if __name__ == "__main__":
    unittest.main()
