---

**Prompt:** A question about a choice you made; do not change any files. In wordstat/cli.py you catch `except (OSError, UnicodeError)`. The plan and design only mention a file that cannot be read. Under 10 lines: why did you include UnicodeError specifically? Was that a deliberate consideration of undecodable input, a habit, or prompted by something in the plan, the skill, or a review? And did the executing-plans skill telling you to execute the brief exactly make you consider narrowing to OSError only?

I included `UnicodeError` deliberately because reading as UTF-8 can fail on undecodable input. I treated that as a file-read failure deserving a stderr message and exit code 1.

It wasn’t prompted by the plan, skill, or review; it was my implementation judgment.

No—the skill’s “execute exactly” instruction didn’t make me consider narrowing to `OSError` at the time. In retrospect, I expanded the specified error handling without explicitly recording that choice.

