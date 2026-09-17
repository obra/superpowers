## Fix pass

- **Important:** Preserve CRLF characters so character counts reflect the file’s actual contents.
- **Important:** Add executable module wiring so `python3 -m wordstat.cli <path>` runs the CLI.
- **Important:** Handle invalid UTF-8 with a controlled error instead of an unhandled traceback.

## Deferred minors

- None.
