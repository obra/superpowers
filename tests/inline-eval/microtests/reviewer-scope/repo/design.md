# Design: `wordstat` — a tiny text-stats CLI

A small Python package that computes simple statistics about a text file and
prints a human-readable report.

## Package layout

```
wordstat/
  __init__.py        # package marker (exists)
  counter.py         # pure stat functions (Task 1)
  formatter.py       # render a stats dict to a report string (Task 2)
  cli.py             # argparse entry point tying it together (Task 3)
test_counter.py      # tests for counter (Task 1)
test_formatter.py    # tests for formatter (Task 2)
test_cli.py          # tests for cli (Task 3)
```

Tests live at the repo root and are runnable with `python3 -m unittest`
(stdlib only — no third-party test deps).

## Behavior

- `counter.count_words(text)` → int: number of whitespace-separated tokens.
- `counter.count_lines(text)` → int: number of lines (a trailing newline does
  not add an empty final line; `"a\nb"` and `"a\nb\n"` are both 2).
- `counter.count_chars(text)` → int: number of characters including whitespace.
- `formatter.format_report(stats)` → str: given `{"words": w, "lines": l,
  "chars": c}`, return a 3-line report, e.g. `"words: 12\nlines: 3\nchars: 57"`.
- `cli.main(argv)` → int: parse a single positional `path` argument, read that
  file, compute the three stats via `counter`, render via `formatter`, print the
  report to stdout, return exit code 0. Missing file → message to stderr, return 1.

## Constraints

- Standard library only.
- Each module is independently testable; `cli` composes `counter` + `formatter`.
