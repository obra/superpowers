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
