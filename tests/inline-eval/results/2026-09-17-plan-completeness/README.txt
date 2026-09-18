Plan-completeness test: does an executor need the complete, code-in-every-
step plan that writing-plans asks for? Sonnet 5 does the implementation in
every arm (Bedrock: session on us.anthropic.claude-sonnet-5 for inline;
ANTHROPIC_DEFAULT_SONNET_MODEL for SDD implementers). Final review on Opus.

Wave 1: inline, ledgerlite, 3 reps per plan.
                      terse (287 lines, no code)   Opus-written (1394 lines, 79 tests)
probes handled        9/9                          9/9
USD median            $2.89 (Sonnet 2.04-2.35)     $3.71 (Sonnet 2.10-2.90)
wall clock            13.5-17.9 min                13.5-14.2 min
commits               9 9 9                        9 9 9
The terse plan produced the same outcome for 78% of the cost. The full
plan's extra spend is the executor reading and reproducing 1400 lines.
Confound noted in fixtures/ledgerlite-full/README.txt: the terse plan's
planted Interfaces mismatch is not in the Opus plan; the Sonnet 5 session
resolved it 3/3 anyway.

Wave 2: inline, wordstat, 3 reps per plan.
                      terse (40 lines)             Opus-written (515 lines, 25 tests)
utf8 probe handled    3/3                          3/3
USD median            $1.30                        $1.96
wall clock            6.5-9.0 min                  7.0-8.2 min
Same outcome, terse at 66% of the cost.

SDD half, arm 1: SDD's own model selection (Opus 5 controller; the skill
sent most implementers to Haiku 4.5 and the rest to Sonnet 5 via the alias
remap; Sonnet 5 task reviewers; Opus final review), ledgerlite, 3 reps
terse / 2 full (rep 63 lost to a waiter false-idle) / 3 loosened isolation.

                    terse              full               loosened (terse plan)
probes              9/9                6/6                9/9
USD                 9.13 11.22 13.93   11.25 11.40        9.96 11.86 12.40
  of which Opus     6.90-11.13         8.38-8.94          7.43-9.74
wall clock          66-100 min         67-90 min          69-78 min
dispatches          15-19              17-18              17-19
implementers that   3/12 5/13 3/12     1/14 1/11          9/12 9/13 10/12
  read design.md

Every arm handled every probe, including the terse plan's planted
Interfaces mismatch, under implementers that see only their brief. With
the full plan the skill's "mechanical task -> cheap model" rule sent every
implementer to Haiku, and outcomes held. The loosened isolation (brief
carries the plan header; implementer may read the spec) was taken up:
implementers read the spec 75-83% of the time versus 8-38%, at no change
in cost or outcome on this fixture. The Opus controller is 75-80% of every
rep's cost; the plan's size is not where SDD's money goes.

Wall clock is inflated: all nine SDD reps ran at once (a batch-script bug)
alongside two Opus planning sessions, and Bedrock throttled.

SDD half, arm 2 (Sonnet 5 for every implementer, haiku alias remapped too,
3 at a time) follows below when it lands.
