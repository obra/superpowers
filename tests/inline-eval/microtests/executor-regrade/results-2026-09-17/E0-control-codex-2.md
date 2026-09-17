## Fix pass

- **Important:** Preserve CRLF characters when reading files so character counts include all original whitespace.

## Deferred minors

- Final: minor (deferred): Add executable `python -m wordstat.cli` wiring; the specified `cli.main(argv)` contract is already satisfied.
- Final: minor (deferred): Handle invalid UTF-8 with a controlled error instead of a traceback.
