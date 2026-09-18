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

Wave 2 (inline, wordstat) and the SDD half (terse / full / loosened
isolation, Sonnet 5 implementers) follow below when they land.
