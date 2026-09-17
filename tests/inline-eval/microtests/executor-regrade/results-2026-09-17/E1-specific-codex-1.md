## Fix pass

- **Important:** File reading normalizes CRLF, producing incorrect character counts on valid input.
- **Important:** The CLI module has no executable entry point, so `python3 -m wordstat.cli` prints nothing.
- **Important:** Invalid UTF-8 causes an unhandled `UnicodeDecodeError` traceback.

## Deferred minors

- None.
