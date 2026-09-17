import unittest

from wordstat.counter import count_chars, count_lines, count_words


class CounterTests(unittest.TestCase):
    def test_count_words(self):
        self.assertEqual(count_words("the quick brown fox"), 4)
        self.assertEqual(count_words(""), 0)

    def test_count_lines(self):
        self.assertEqual(count_lines("a\nb"), 2)
        self.assertEqual(count_lines("a\nb\n"), 2)
        self.assertEqual(count_lines(""), 0)

    def test_count_chars(self):
        self.assertEqual(count_chars("abc"), 3)
        self.assertEqual(count_chars("a b"), 3)
