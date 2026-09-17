import io
import tempfile
import unittest
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path

from wordstat.cli import main


class CliTests(unittest.TestCase):
    def test_main_prints_report_for_file(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "sample.txt"
            path.write_text("the quick\nbrown fox\n", encoding="utf-8")
            stdout = io.StringIO()

            with redirect_stdout(stdout):
                result = main([str(path)])

        self.assertEqual(result, 0)
        self.assertEqual(stdout.getvalue(), "words: 4\nlines: 2\nchars: 20\n")

    def test_main_returns_one_for_missing_file(self):
        stderr = io.StringIO()

        with redirect_stderr(stderr):
            result = main(["/no/such/file"])

        self.assertEqual(result, 1)
        self.assertTrue(stderr.getvalue())
