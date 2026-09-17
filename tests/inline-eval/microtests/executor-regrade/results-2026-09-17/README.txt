Executor re-grade micro-test. The executor gets a real gpt-6-astra review
of the wordstat branch (review.txt) that files the undecodable-input crash
as Minor, plus one wording of executing-plans' sorting rule, and must say
what enters the fix pass. Single-shot sessions: Opus 5 via Bedrock and
Codex gpt-5.6-sol at low effort, 6 reps each per arm.

                                        crash enters the fix pass
E0 no re-grade guidance                 0/6 Opus   0/6 Codex
E1 current wording (names symptoms:     6/6        6/6
   unhandled exception, traceback,
   data loss, wrong result)
E2 general wording (grade by the        5/6        6/6
   effect on a reasonable person, not
   by whether the spec names the trigger)

The baseline failure is real: with no rule both models defer the crash as
filed. The symptom list and the general standard both fix it; the general
form lost one Opus rep. The general form ships, because the symptom list
is the fixture's own defect written into the skill (teaching to the test);
the one miss is noted in the executing-plans rationalization table.
