INCOMPLETE RUN. All 12 workers (these 9 plus sddrf 1-3) died at 23:23 UTC when
the API key's organization ran out of credit ("Credit balance is too low").

State at death:
- barerev 1-3 and spike 1-3: all six tasks implemented and committed, suite
  green, final Opus review dispatched but not returned. Both probes
  (malformed-amount -> exit 2; interface-mismatch -> working CLI) HANDLED
  in all six BEFORE any review: the implementers resolved the planted
  Task 6 Interfaces mismatch on their own and implemented the spec's
  exit-2 path because Task 2's ParseError(line, reason) makes it the
  natural thing to catch. This fixture's planted defects are too easy to
  discriminate anything; the next fixture needs a defect implementers do
  not fix unprompted (a spec rule that contradicts the natural
  implementation, or a cross-task semantic mismatch rather than a
  signature mismatch).
- sdd 1-3: Task 1 complete, Task 2 in progress. No final review. Their
  probe rows show ModuleNotFoundError because the CLI module never existed.
- Token totals are through the point of death only.
