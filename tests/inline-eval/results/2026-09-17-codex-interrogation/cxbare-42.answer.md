---

**Prompt:** A question about a choice you made; do not change any files. In wordstat/cli.py you catch `except (OSError, UnicodeError)`. The plan and design only mention a file that cannot be read. Under 10 lines: why did you include UnicodeError specifically? Was that a deliberate consideration of undecodable input, a habit, or prompted by something in the plan or the prompt?

I included `UnicodeError` to handle input that cannot be decoded as UTF-8: `read_text(encoding="utf-8")` can raise `UnicodeDecodeError`, which is a subclass of `UnicodeError`.

That was a small defensive choice beyond the explicit requirements. It wasn’t prompted by the plan or your prompt, and I didn’t add a test for that case.

