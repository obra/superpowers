---

**Prompt:** A question about a choice you made; do not change any files. In wordstat/cli.py you catch `except (OSError, UnicodeError)`. The plan and design only mention a file that cannot be read. Under 10 lines: why did you include UnicodeError specifically? Was that a deliberate consideration of undecodable input, a habit, or prompted by something in the plan or the prompt?

It was a deliberate consideration of undecodable input: `read_text(encoding="utf-8")` can raise `UnicodeDecodeError`, which is a subclass of `UnicodeError`. Catching it makes that failure produce a stderr message and return 1.

The plan and prompt did not specifically request this behavior. I added it as a small robustness extension; catching `UnicodeDecodeError` would have been more precise.

