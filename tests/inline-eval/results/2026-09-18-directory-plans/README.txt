Plan-as-directory format (variant D1: 00-header.md + NN-<task>.md per task;
task-brief, sdd-workspace, review-package, plan-boundary accept a file or a
directory; writing-plans writes the directory). Diff in
../2026-09-17-writing-plans-variants/D1-dirplan.diff.

Execution half: the hand-written terse ledgerlite plan split into 7 files
(fixtures/ledgerlite-dir), same three planted-defect probes.
  inline, Sonnet 5 session, 3 reps:  9/9 probes, suite green,
    $2.98 / $2.83 / $2.66, 15-18 min, 2-3 helper-script calls each
    (file-form plan, same session model: 9/9 at $2.85-3.27)
  SDD, Sonnet 5 implementers, 2 reps: 6/6 probes, suite green,
    $9.28 / $17.54, 69 / 106 min, 12-13 script calls each (the brief
    script assembled header + task file per dispatch)
    (file-form plan: $9.59-17.98)
Execution holds and costs the same. Planning half (writing-plans emitting
the directory from both designs) and the gated plan-set run follow.

Planning half: writing-plans (D1) from the designs, Opus 5.
  ledgerlite, 3 reps: 6 files each (a 34-41 line header + 5 task files),
    620 / 666 / 686 lines, 47-48 tests, $0.87-1.00. Same volume as the
    single-file form under the same wording; the directory changes shape,
    not size.
  cosmic (capped 40 min), 2 reps, both finished on their own:
    wpplans-101  4 plan directories, 36 files, 3,595 lines, 1,527 Go, $5.54
    wpplans-102  3 plan directories, 34 files, 3,747 lines, 1,257 Go, $4.69
Execution of wpplan-131's directory plan, inline on Sonnet 5, 3 reps:
  9/9 probes, suite green, $3.54 / $3.60 / $2.80.
Reading: the format is a wash on volume and outcome, and a win on the
things it was for: a task is one file an implementer reads, a ruling that
touches a later plan is an edit to one small file, and a session resuming
after compaction has the task in front of it, not line 2,900 of a document.
The gated plan-set run (boundary script before each next plan) follows.
