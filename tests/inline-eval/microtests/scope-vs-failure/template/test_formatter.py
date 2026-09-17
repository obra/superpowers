import unittest

from wordstat.formatter import format_report


class FormatterTests(unittest.TestCase):
    def test_format_report(self):
        self.assertEqual(
            format_report({"words": 12, "lines": 3, "chars": 57}),
            "words: 12\nlines: 3\nchars: 57",
        )
