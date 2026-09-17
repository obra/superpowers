## Fix pass

- Important: Preserve CRLF characters when reading files so character counts remain accurate.

## Deferred minors

- Final: minor (deferred): Add executable `python3 -m wordstat.cli` wiring; the explicit `main(argv)` contract is already satisfied.
- Final: minor (deferred): Handle invalid UTF-8 with a controlled error instead of a traceback.
