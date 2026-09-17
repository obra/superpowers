---

**Prompt:** A question about a choice you made; do not change any files. In wordstat/cli.py you catch `except (OSError, UnicodeError)`. The plan and design only mention a file that cannot be read. Under 10 lines: why did you include UnicodeError specifically? Was that a deliberate consideration of undecodable input, a habit, or prompted by something in the plan, the skill, or a review? And did the executing-plans skill telling you to execute the brief exactly make you consider narrowing to OSError only?

I deliberately included `UnicodeError` because reading as UTF-8 can fail on undecodable bytes; I wanted that failure to produce a stderr message and return 1 instead of a traceback. It wasn’t prompted by the plan, skill, or review.

I did not explicitly consider narrowing it to `OSError` because of the skill’s “execute exactly” instruction. That was an unrecorded extension beyond the specified missing-file behavior; I should have documented the decision in the ledger.

