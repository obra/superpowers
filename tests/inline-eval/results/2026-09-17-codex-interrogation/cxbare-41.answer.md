---

**Prompt:** A question about a choice you made; do not change any files. In wordstat/cli.py you catch `except (OSError, UnicodeError)`. The plan and design only mention a file that cannot be read. Under 10 lines: why did you include UnicodeError specifically? Was that a deliberate consideration of undecodable input, a habit, or prompted by something in the plan or the prompt?

It was a deliberate consideration of undecodable input: reading with `encoding="utf-8"` can raise `UnicodeDecodeError`, which is a subclass of `UnicodeError`. I included it so that case would also print an error and return 1.

Neither the plan nor your prompt explicitly requested that behavior. It was a small defensive extension I chose. No files changed.

