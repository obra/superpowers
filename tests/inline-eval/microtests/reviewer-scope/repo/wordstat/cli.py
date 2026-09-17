"""Command-line entry point for wordstat."""

import argparse
import sys

from . import counter, formatter


def main(argv):
    parser = argparse.ArgumentParser(description="Report statistics for a text file.")
    parser.add_argument("path")
    args = parser.parse_args(argv)

    try:
        with open(args.path, encoding="utf-8") as source:
            text = source.read()
    except OSError as error:
        print(f"wordstat: {error}", file=sys.stderr)
        return 1

    stats = {
        "words": counter.count_words(text),
        "lines": counter.count_lines(text),
        "chars": counter.count_chars(text),
    }
    print(formatter.format_report(stats))
    return 0
