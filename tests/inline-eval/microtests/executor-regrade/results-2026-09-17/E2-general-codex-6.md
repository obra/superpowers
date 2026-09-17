## Fix pass

- **Critical:** No executable CLI entry point; invoking `python3 -m wordstat.cli` silently produces no report.
- **Important:** Universal-newline translation makes character counts incorrect for CRLF files.
- **Important:** Invalid UTF-8 causes an unhandled traceback instead of a controlled CLI error.

## Deferred minors

- None.
