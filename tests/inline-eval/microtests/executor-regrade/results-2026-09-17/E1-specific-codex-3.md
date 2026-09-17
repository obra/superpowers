## Fix pass

- Important: File reading normalizes CRLF to LF, producing an incorrect character count.
- Important: The module lacks executable CLI wiring, so `python3 -m wordstat.cli` prints nothing.
- Important: Invalid UTF-8 causes an unhandled `UnicodeDecodeError` traceback.

## Deferred minors

- None.
