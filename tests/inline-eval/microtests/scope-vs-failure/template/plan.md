# Implementation plan: `wordstat`

Design context in `design.md`. Build the package with test-driven development:
for each task write the failing test first, then the implementation, then make it
pass, then commit. Standard library only; tests run with `python3 -m unittest`.

## Task 1 — `wordstat/counter.py`

Pure statistics functions.

1. Write `test_counter.py` (failing) covering:
   - `count_words("the quick brown fox")` == 4; `count_words("")` == 0.
   - `count_lines("a\nb")` == 2; `count_lines("a\nb\n")` == 2; `count_lines("")` == 0.
   - `count_chars("abc")` == 3; `count_chars("a b")` == 3.
2. Implement `wordstat/counter.py` with `count_words`, `count_lines`,
   `count_chars`.
3. Run `python3 -m unittest test_counter` → green. Commit.

## Task 2 — `wordstat/formatter.py`

Render a stats dict to a report string.

1. Write `test_formatter.py` (failing) covering:
   - `format_report({"words": 12, "lines": 3, "chars": 57})` ==
     `"words: 12\nlines: 3\nchars: 57"`.
2. Implement `wordstat/formatter.py` with `format_report(stats)`.
3. Run `python3 -m unittest test_formatter` → green. Commit.

## Task 3 — `wordstat/cli.py`

Entry point composing the previous two modules. Read `wordstat/counter.py` and
`wordstat/formatter.py` to use their real function signatures.

1. Write `test_cli.py` (failing) covering:
   - `main([path])` for a temp file with known content prints the expected
     report and returns 0.
   - `main(["/no/such/file"])` returns 1.
2. Implement `wordstat/cli.py` with `main(argv)` using `argparse`, calling
   `counter` then `formatter`.
3. Run `python3 -m unittest` (whole suite) → green. Commit.
