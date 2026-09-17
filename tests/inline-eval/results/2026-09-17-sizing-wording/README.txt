Task/step sizing wording test, planning half. writing-plans run from
design.md alone (wpplan arm) under four wordings of the sizing rule, Opus 5
via Bedrock, 3 reps x 2 fixtures each. Variant diffs in *.diff, every plan
in plans/, counts in summary.txt. Rep numbering: <variant><fixture><rep>,
fixture 1 = wordstat (3 modules), 2 = ledgerlite (6 modules).

  S0  control: "Each step is one action (2-5 minutes)"
  S1  no time unit: "one action with a checkable result"
  S2  S1 + task ceiling "at most one context window of work"
  S3  "(10-20 minutes)"

               wordstat lines/steps/tests      ledgerlite lines/steps/tests
  S0           449-494 / 17 / 23-26            1331-1650 / 43-48 / 70-97
  S1           437-512 / 16-17 / 24-27         1157-1469 / 28-33 / 77-82
  S2           488-523 / 16-17 / 25-30         1219-1379 / 37-41 / 66-89
  S3           494-556 / 17-18 / 30-32         1363-1416 / 33-48 / 79-100

Task count is 3 on wordstat and 5-7 on ledgerlite under every wording: the
time unit and the context-window ceiling do not change how Opus draws task
boundaries. Plan length and test count are within rep noise across arms.
The one movement is steps per plan on the six-task design: 43-48 with the
2-5 minute unit versus 28-33 without one (S1), with S2 and S3 in between;
three reps, so treat it as a lead, not a result. The execution half was
not run: plans that do not differ cannot measure a wording through
execution.

Where the volume comes from, from reading the plans: Opus's own TDD
granularity (a five-step cycle per behavior, ~3 tests per function), and
the Review Focus list (10-19 lines, each with a test). Neither is keyed to
the sizing sentence.
