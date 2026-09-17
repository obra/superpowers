## Fix pass

- **Critical** — No executable entry point (`wordstat/cli.py:27`): `python3 -m wordstat.cli <path>` exits 0 printing nothing, so the tool's sole advertised interface silently does nothing for anyone who installs it; needs `if __name__ == "__main__": sys.exit(main(sys.argv[1:]))` plus a subprocess test.
- **Important** — Universal-newline translation corrupts the character count (`wordstat/cli.py:15`): any CRLF file reports one fewer char per line (`a\r\nb\r\n` → 4, not 6), contradicting "characters including whitespace"; open with `newline=""` and add a CRLF test.
- **Important** (reviewer: Minor) — Non-UTF-8 input raises an unhandled `UnicodeDecodeError` traceback (`wordstat/cli.py:16`): pointing the CLI at a latin-1 or binary file crashes with a stack trace instead of the controlled stderr-message-and-return-1 path that already exists next to it; the spec's silence on encoding doesn't change what the user sees.

## Deferred minors

- None.
