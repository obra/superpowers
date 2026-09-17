Micro-test per writing-skills: one fresh-context codex exec per rep,
gpt-5.6-sol, reasoning effort low, repo with wordstat Tasks 1-2 done,
task = implement Task 3 (the CLI). Question: does the executing-plans
wording narrow the implementer's failure handling below its default?

arm                      except clause           n
control (no skill)       except OSError          6/6
v0 current v3 wording    except OSError          6/6
v1 scope-vs-failure      except OSError          6/6
v2 deletion-only         except OSError          6/6

Zero separation, zero variance, and the control is already narrow. No
rep in any arm wrote a decode test or discussed undecodable input.
Reads:
1. The claim from the interrogation ("the brief's narrow scope and the
   skill's instruction shaped that choice") is a plausible story the
   session told, not a cause this test can find. Wording is not the lever
   here.
2. v1's explicit positive principle (you own behavior for inputs the
   brief does not name) changed nothing at low effort. A principle stated
   in prose did not move a single rep.
3. The full bare Codex sessions (cxbare 21-23, 41-43) wrote
   (OSError, UnicodeError) 6/6 in a different frame: TUI session, whole
   plan in one go, its own Tasks 1-2. Whatever drives the defensive
   idiom lives in that frame (exec-mode vs TUI system prompt, whole-plan
   vs single-task prompt, own vs foreign prior code), not in the skill.
Consequence: prefer structural mechanisms with evidence (a Review Focus
list of implied cases, which moved Sonnet 4.5 implementers 3/3 under SDD;
a reviewer slot for declined scope) over re-wording the executor.

FOLLOW-UP (each of the 24 sessions resumed and asked "what would have
gotten you to handle that input the way the spec handles the failures it
names?", ranked; see *.what-would.txt). All 24 rank identically:
  1. a required test for the undecodable input ("except OSError could not
     pass it")                                                 24/24 first
  2. a design.md line naming decoding failures                 24/24
  3. a Task 3 instruction naming the exception                 24/24
  4. a pre-implementation check: enumerate what the read can raise, map
     each to the failure contract                              24/24
  5. (v1 arm only) "the AGENTS.md instruction already required this; its
     presence alone demonstrably did not change my choice"     6/6
  Many add: a final review could catch it afterward but would not have
  changed the initial except clause.
1-3 are case-specific (what Review Focus generates upstream). 4 is the
general mechanism: a procedure at the boundary, not a principle in prose.
5 is the sessions confirming the prose form is inert.

v3-boundary-list (a prose step: "before the failing test for a step that
meets the outside world, list every way it can fail; each entry becomes a
test or a ledgered ruling"), 6 reps:
  except FileNotFoundError 3, except OSError 2, except (OSError, UnicodeError) 1
  Worse and noisier than v0. Resumed and asked whether they made the list
  and what would have gotten them to: 4/6 did not make it, 2/6 made a
  partial list and "treated unspecified behavior as grounds to omit
  coverage"; collective entries ("other read failures") stood in for
  individual ones. All 6 rank first: a mandatory gate immediately before
  the test is written whose output is produced, one entry per failure,
  each with a test or a ruling; several note the micro-test's "skip
  ledger bookkeeping" waiver swallowed the rulings. Form lesson: a
  required slot in an artifact they already produce (the test file), not
  a rule about a step.

v4-boundary-slot (the list as a required comment block at the top of the
test file, one line per failure, each -> test or ruling; "other errors"
disallowed), 6 reps:
  except OSError 3, except FileNotFoundError 3; decode test 0/6.
  5/6 produced the block. Its content was the cases the plan already
  names (readable file, missing path) and nothing else: the slot forced
  the shape, not the enumeration. See *.boundary.txt.
Reading across v1, v3, v4 and the 24 follow-ups: on gpt-5.6-sol at low
effort, a principle, a process step, and an artifact slot all fail at the
same place, generating failure modes the spec does not name. The
enumeration is the hard step, and it does not happen inside the
implementer at this effort no matter how the instruction is shaped. What
the sessions rank first, a test or a spec line naming the case, is an
enumeration done elsewhere. That is the Review Focus mechanism
(planner enumerates implied cases once, with the spec open), which moved
Sonnet 4.5 implementers 3/3 under SDD.

PLANNER SIDE: gpt-5.6-sol at low effort asked to write the plan's Review
Focus section from design.md + plan.md (writing-plans' instruction
verbatim), 6 reps: 6-9 items each, undecodable input in 0/6 (items are
spec-adjacent: empty file, unterminated line, blank lines, whitespace,
argparse). The fresh Opus 5 planner ranked it 3rd of 10.

Where the enumeration of what the spec implies actually happened today:
  Opus 5 final reviewer with the template       11/11 found it (grading varied)
  Opus 5 planner writing Review Focus            1/1 (ranked 3rd of 10)
  Sonnet 4.5 implementers handed the list        3/3 implemented it
  gpt-6-astra final reviewer                     1/2 readable cases (once Minor, once "not specified")
  gpt-5.6-sol low: implementer (v0-v4)           0/30 with any wording, 2/6 enumerated-then-ruled-out
  gpt-5.6-sol low: planner                       0/6
  gpt-5.6-sol low: bare TUI whole-plan sessions  6/6 by idiom, frame-dependent, unexplained
The lever is which model, at what effort, is asked to enumerate, and
whether its scoping decisions are written where a human sees them. Not
the executor's wording.

EFFORT: control and v0 at reasoning effort medium, 6 each: except OSError
12/12. Effort alone does not produce the enumeration.

v5-reasonable-ruling (v4 slot + a standard for "ruled out" lines: would a
reasonable user accept what happens; the spec is a vision document and
its silence is not permission; "the spec does not mention it" is never
the reason), 6 reps at low effort:
  (OSError, UnicodeError) 3/6 (reps 2, 3, 6; rep 6 with a test), except
  OSError 3/6. First implementer-side movement in five variants, and
  noisy. The shipped reps' rulings: "ruled out: the CLI accepts text
  files" (2) and no entry at all (1). New rationalization-table row:
  "the contract accepts text files, so undecodable input is the user's
  problem" -> a reasonable user hands the tool a file and gets a message,
  not a traceback.
