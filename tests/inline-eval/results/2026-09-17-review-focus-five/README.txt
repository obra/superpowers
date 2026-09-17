writing-plans with the five-line Review Focus wording (commit dbf9687),
run from design.md alone, Opus 5 via Bedrock, 3 reps per fixture.

              lines      tests   RF lines  probes
wordstat      472-521    25-26   5 5 5     decode named + tested 3/3
ledgerlite    1371-1475  66-79   5 5 5     header 3/3, encoding 3/3

Old wording, same fixtures: wordstat 449-525 lines / 23-27 tests / 8-11
RF lines; ledgerlite 1215-1365 lines / 68-87 tests / 12-15 RF lines.

The count is respected 6/6 and recall of the implied cases held (Opus
packs neighbours into one line: "a directory, a permission-denied file,
non-UTF-8 bytes"). Plan length and test count did not move: the Review
Focus list was never the bulk of the plan; Opus's own per-function TDD
cycle is. GREEN for the list; the plan-volume question stays open.
