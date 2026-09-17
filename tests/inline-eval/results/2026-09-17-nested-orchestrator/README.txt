Nested-orchestrator shape from using-superpowers/references/claude-code-tools.md
(sddnest arm): the partner asks for SDD and says the session model is too
expensive for coordination. wordstat fixture, Opus 5 session via Bedrock,
3 reps. Compare sddrf (SDD run by the session itself, same backend, same
fixture, plan with a Review Focus section): $5.64 median, probe 3/3.

Shape followed 3/3: each session read the reference and dispatched ONE
Sonnet orchestrator, which ran SDD end to end one layer down — Haiku
implementers, Sonnet task reviewers, an Opus final review, a fix wave and
a re-review — 10-11 dispatches and 9-10 SDD script calls per rep.

                 USD    of which Opus   probe        rulings relayed
sddnest-1        3.09   0.98            handled      yes
sddnest-2        2.64   0.95            SHIPPED      no
sddnest-3        3.49   1.19            handled      yes
median           3.09  (55% of sddrf's $5.64)

Rep 2 shipped the crash through the final fix wave: the implementer had
written `except Exception` (which happened to catch the decode error);
the Opus final review filed "over-broad exception handling" and the fix
agent narrowed it to `except OSError`, creating the crash; the Sonnet
re-reviewer confirmed the finding "ADDRESSED" without running the input.
The orchestrator's closing message carried "Rulings I Made: None" but the
session's own final message did not relay it.

Reading: the shape works and costs about half of session-run SDD, with
the Opus share down to about a dollar. Its risks are the ones the
reference names — a mid-tier orchestrator, a fix wave whose re-review
does not re-probe — and one it does not: the rulings list has to survive
two hand-offs to reach the partner.
