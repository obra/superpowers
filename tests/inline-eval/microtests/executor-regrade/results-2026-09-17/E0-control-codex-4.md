## Fix pass

- Important: Preserve CRLF characters when reading files so character counts include the original whitespace.
- Important: Add executable module wiring so `python3 -m wordstat.cli <path>` invokes `main`.

## Deferred minors

- Final: minor (deferred): Handle invalid UTF-8 with a concise error instead of an unhandled traceback.
