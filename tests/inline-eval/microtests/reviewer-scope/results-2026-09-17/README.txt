Reviewer-side micro-test. gpt-6-astra at reasoning effort low (the model
Codex sessions chose as "most capable" for the final review), codex exec
read-only, reviewing a wordstat branch whose CLI catches OSError only.
Prompt = requesting-code-review/code-reviewer.md body with placeholders
filled, plus a variant block inserted before "Read-Only Review". 6 reps
each. Scored on the final report's own findings (reviews quote the diff
and run probes, so raw mentions mislead; see *.review.txt).

                                where the decode case landed        n
R0 current template             Minor                               6/6
R1 + "Declined to judge" slot   Declined to judge ("unspecified")    6/6
R2 + spec-is-a-vision-document  Important                           6/6
   / reasonable-person standard
R3 both                         Important (+ other items Declined)  6/6

Every reviewer found the case, and most probed it with a b'\xff' file
during the review. What varied was the grade, and the grade is what the
executor's Critical/Important gate acts on. The current template ships it
6/6; the reasonable-person standard fixes it 6/6 with zero variance. The
slot alone makes the scoping visible (a ruling the executor must make)
without changing the grade. A prose principle moved the reviewer where
it moved no implementer: grading is a judgment the words can reach.
