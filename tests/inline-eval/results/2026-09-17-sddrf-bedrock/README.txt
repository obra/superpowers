SDD with the plan carrying a Review Focus section (sddrf), wordstat
fixture, Bedrock backend, 3 reps. Controller on us.anthropic.claude-opus-5;
Bedrock resolves the skill's "sonnet"/"haiku" dispatches to Sonnet 4.5 and
Haiku 4.5 (the direct-API SDD runs used Sonnet 5 / Haiku 4.5), so cost is
not directly comparable to 2026-09-16-clean/sdd-*.

Outcome: utf8 probe handled 3/3. In every rep the Task 3 IMPLEMENTER
(Sonnet 4.5) wrote (OSError, UnicodeDecodeError) handling with a test
before any reviewer saw it; the per-task reviewers confirm it as already
present ("catches exactly (OSError, UnicodeDecodeError) as specified").
Without the section, no implementer in 21 clean reps and no per-task
reviewer in 9 SDD dispatches touched the decode case. The final Opus
reviewer graded the residual encoding discussion Important (rep 2) and
Minor (rep 3); rep 1's final reviewer discussed it without a finding.

Read with the inline result (spikerf: reviewer graded it Critical 3/3):
the section's effect is to move the implied defect upstream, to the
implementer when the brief carries it and to the reviewer's grading when
it does not.
