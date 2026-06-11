# Strict-Cost SDD — Design Spec

**Status:** Proposed experiment ladder (not implementation). Each rung ships
only with its gate evidence; abort any rung whose gates fail.
**Objective:** minimize dollars per plan-execution. Wall-clock is
unconstrained; token count matters only as a cost driver.
**Hard invariant:** quality. Concretely: `sdd-quality-reviewer-catches-
planted-defect` pass rate over **N=5 runs** (not 1 — single-run gates were
this campaign's weakest methodology), `sdd-rejects-extra-features` pass,
all end-to-end scenarios pass, blind A/B deliverable parity with the
current config. Any quality regression kills the rung, full stop.

## Where the dollars are (final 2026-06-10 config, go-fractals, ~$13/run)

| Component | $ | Driver |
|---|---|---|
| Controller (session model, opus) | ~6-7 | ~150 turns × resident context; prompt-immune turn floor (46% thinking/narration) |
| Implementers (sonnet, 10-13 dispatches) | ~5-6 | the actual work; ~25 turns each; ~13 pre-edit exploration calls each |
| Task reviewers (sonnet, 10) | ~1-1.5 | 3-9 turns each with package |
| Final review + fixes | ~1 | 6 turns with branch package |

Review-loop count (2-4 per run) is the biggest run-to-run cost variance;
loops are mostly caused by plan ambiguity the implementer resolved wrongly.

## Judgment guardrail (co-invariant with quality)

**Cheapen mechanics, never judgment.** Every rung must enumerate which
decisions it moves to a cheaper model and show each is *mechanical* —
deterministic, scriptable, or cheaply verifiable after the fact. Judgment
stays at the highest tier or with the human. The judgment points in SDD,
explicitly:

- **BLOCKED / NEEDS_CONTEXT handling** — diagnosing why a subagent is stuck
  and choosing the remedy
- **⚠️ "cannot verify from diff" resolution** — the controller adjudicating
  with cross-task context
- **Dispatch curation** — ambiguity resolution and task-boundary drawing
  (measured load-bearing: the Task 5 gradient-direction note prevented a
  wrong implementation)
- **Review verdicts and severity calibration** — what is Important vs Minor
- **Review-loop adjudication** — deciding a finding is a false positive
- **Escalate-to-human recognition** — knowing the plan itself is wrong

A rung that would move any of these to a cheaper model must either (a)
restructure so the decision is made once by the expensive model at plan
time, (b) add an explicit escalation rule routing it back up at execution
time, or (c) die. "The cheap model usually gets it right" is not
acceptance evidence — judgment failures are rare-event, high-blast-radius,
and largely invisible to pass/fail gates, which is why every tier change
below carries a judgment audit (session-resume interrogation of each
judgment point in the gate runs, compared against the expensive-controller
baseline) in addition to the N=5 scenario gates.

## Thesis guardrail

SDD's thesis: **a fresh subagent per task with precisely curated context,
gated per task.** Rungs below must preserve it. Dispatch-time task batching
(one implementer dispatch handling several plan tasks) is **counter-thesis**
— it pollutes the fresh-context property and coarsens the gates — and is
deliberately NOT on the ladder. The thesis-compatible route to the same
dispatch economics is plan-time task right-sizing (L1): if the plan defines
fewer, better-sized tasks, SDD still runs one fresh subagent per task.

## The ladder (in expected $/leverage order)

### L1 — Plan-side crispness (writing-plans changes; est. −$1.5-3/run, plus variance reduction)

**Status 2026-06-11 (final): elicitation tested end-to-end; claims
re-attributed.** Micro-tests: constraints header and Interfaces blocks
elicit deterministically (0→5/5, 0→100% of tasks, exact values);
right-sizing is modest and scale-dependent (9.4→8.4 tasks at svelte
scale, nothing to move at fractals scale). Full runs: an elicited plan
executed at $6.34/$8.49 — but the no-guidance control (opus plan,
complete code) hit $7.59/$7.73, inside that range. **The cost win
belongs to opus-written complete-code plans; the hand-written prose
fixture plans all prior numbers used are unrepresentative and ~2×
costlier to execute.** The guidance owns fidelity and variance instead:
deterministic constraints propagation (the one elicited-run fix was a
version-floor catch), exact cross-task interfaces, fix waves 1 vs 2-4
(the control plan shipped a real Sierpinski bug both runs had to fix).
The writing-plans PR claims those grounds, not dollars. Draft at
/tmp/sdd-exp/writing-plans-l1 (branch writing-plans-crisp).

The plan is upstream of every cost: task count sets dispatch count; plan
ambiguity sets review-loop count; plan completeness sets implementer
exploration. Current writing-plans optimizes for implementer success, not
execution economics. Changes to test:

1. **Task right-sizing guidance.** Today's plans produce tasks as small as
   "create .gitignore" — each costing a full dispatch + review cycle
   (~$0.60-1.00 fixed overhead). Add: "A task is the smallest unit that
   carries its own test cycle and is worth a fresh reviewer's gate. Merge
   setup/config steps into the task that needs them; split only at
   boundaries where a reviewer could meaningfully reject." Fractals' plan
   would drop from 10 tasks to ~7. Validate: dispatch count falls, gates
   hold, review granularity still catches the planted defect.
2. **Structured `## Global Constraints` section** in the plan header
   (version floors, naming/copy rules, platform requirements). Today these
   live in design.md prose and reach reviewers only if the controller
   remembers to paste them (a `go 1.26.1` floor violation shipped because
   none did). A fixed heading makes them mechanically extractable —
   `task-brief` can append them to every brief automatically (small script
   change), removing a controller responsibility entirely.
3. **Per-task `Interfaces:` line** (consumes/produces, exact signatures).
   The controller currently re-derives cross-task interfaces per dispatch
   (its main legitimate "restating"), and implementers spend ~13 tool calls
   re-discovering context. The planner already knows the interfaces; one
   line per task moves the work to where it is done once.
4. **Per-task model-tier recommendation** from the planner ("mechanical /
   standard / judgment"). The planner has the best information for the
   Model Selection decision the controller currently re-makes per dispatch;
   the controller keeps override authority.

Validation: micro-test the planner output shape (recipe-style, per the
instruction-design doctrine), then full runs. Note the 2026-06-10 result:
plan *placeholders* cannot be elicited from current opus — these changes
target economics and ambiguity, not placeholder hygiene.

### L2 — Controller tier (est. −$4-5/run; the biggest single lever, gated hardest)

**Status 2026-06-11 (final): DIED AT THE GATES, as pre-registered — with
useful anatomy.** Recon was positive ($6.68/$8.05, n=2, mechanics clean).
The full battery split the judgment surface: the new
`sdd-escalates-broken-plan` scenario (explicit plan self-contradiction;
the human never volunteers it) passed **5/5 at sonnet** ($1.02-1.37/run;
opus baseline 2/2) — explicit conflicts get escalated. But the
planted-defect battery failed decisively: under a sonnet controller the
per-task quality gate collapsed into plan-compliance advocacy ("no
assertion, as required" listed under Strengths), the defect shipped in
4/5 runs (deterministic check), and only the tier-pinned opus final
reviewer ever caught it — while the same sonnet-tier reviewers under an
opus controller flagged it 5/5. Cheap controllers handle explicit
escalation; they absorb implicit authority-vs-quality adjudication.
A possible L2b (discrete rule: "a reviewer finding that conflicts with
the plan's text is the human's decision — escalate it") would route the
failing judgment through the escalation behavior that held.

**L2b tested 2026-06-11 (E35/E36, evals
`docs/experiments/2026-06-11-build-loop-autoresearch.md`): improves the
opus stack, does NOT rescue the sonnet rung.** Two rules: a reviewer
tripwire (a plan-mandated defect IS a finding — Important, labeled
plan-mandated; the human decides) and a controller escalation rule
(plan-mandated findings go to the human like any plan contradiction).
Micro on frozen sonnet-composed inputs: 0/6 → 6/6 labeled findings.
Full battery: opus controllers 2/2 internalized the rule, caught their
reviewer's miss as self-described backstop, and escalated for a
sanctioned fix (the 4241 ad-hoc behavior made structural); escalation
sanity 2/2 unbroken. Sonnet controllers: 1/5 full pass — paraphrase
drops the tripwire from dispatches (2/5 transmitted), transmission
alone doesn't fire it live (read-once dilution across the reviewer's
tool reads; placement within the dispatch refuted as the variable),
and no sonnet controller showed backstop behavior; 1/5 shipped the
defect. The L2b rules are a candidate commit for the opus stack.
A future L2c for the sonnet rung would pair the SKILL.md
constraints-recipe (the one channel sonnet transmits verbatim) with a
mandatory output-format slot for plan-mandated findings (the skeleton
survives every observed paraphrase and is consulted at composition
time); untested. Original recon notes follow.

**Recon (superseded):**
Sonnet-controller runs (claude-sonnet coding-agent): all gates green at
**$6.68 and $8.05** / 31-41 min (combo band $11.67-14.84), tokens inside
the combo band — no cheap-controller turn inflation. 26/26 and 31/31
dispatches model-explicit, with heavier (and sane) haiku tiering than
opus controllers showed; review loops, per-task Important→fix→re-review,
and omnibus-fixer rules followed in both runs; the run-1 controller
caught a fixer side-effect (`go mod tidy` removed cobra) before
re-review — real adjudication, not silent absorption. But neither run
surfaced a BLOCKED/⚠️ event (the escalation points were never stressed)
and final reviews ran on sonnet rather than the most capable tier. The
N=5 quality gates + full judgment audit below remain mandatory before
any skill change.

The controller is half the dollars solely because it inherits the session
model. Its turn floor is prompt-immune, so the lever is the rate per turn —
but the controller is also where most judgment points live, so this rung is
designed judgment-first:

1. **Primary form — judgment moved up front, mechanics cheapened:** the
   expensive model does the judgment-dense work at plan time (L1's
   Interfaces lines, ambiguity resolutions, per-task constraints — i.e.
   the dispatch curation is pre-written into the plan). The mid-tier
   execution session then runs a loop that is genuinely mechanical:
   extract brief, dispatch, run script, route verdicts. Explicit
   escalation rules in the skill: on BLOCKED, on any ⚠️ item, on a
   suspected false positive, or on anything the plan does not already
   answer, the cheap controller STOPS and escalates (to the human, or to
   a fresh expensive-model consultation dispatch) — it never resolves
   judgment alone.
2. **Gates beyond the standard N=5:** a judgment audit — every
   BLOCKED/⚠️/adjudication event in the gate runs interrogated via
   session-resume and scored against how the opus-controller baseline
   handled the same class of event; any silently-absorbed judgment call
   (cheap controller resolving what it should have escalated) fails the
   rung regardless of scenario verdicts.
3. **User authority preserved:** the skill recommends, never enforces, the
   execution-session tier.

Caveat from this campaign: cheap-model turn inflation was measured on
multi-step *work*, not dispatch loops; whether a mid-tier controller holds
~150 turns is part of what the experiment determines.

### L3 — Reviewer tier (est. −$0.7-1/run; most likely rung to die on the judgment guardrail)

**Status 2026-06-11: DEAD, as pre-registered.** Planted-defect ×5 with
forced-haiku task reviewers: 2 pass / 1 indeterminate / 2 fail (baseline
5/5); per-task haiku cleanly flagged 0 of 10 planted defects at correct
severity — 1 found-but-downgraded with the exact prohibited rationale,
9 missed or rationalized (DRY praised as YAGNI; assert-nothing test
called plan-compliant). Cheap reviewers fail by *advocating* for
defects; passing runs survived only on controller redundancy or the
final review. Recorded in the experiments log, Batch A-E. Do not
re-propose without a structurally different design.

The package reviewer is near-single-step mechanically (3 turns / 1 Read
when calm), which invalidates the original turn-inflation rationale for the
mid-tier floor — but reviewing is judgment through and through: severity
calibration, spec verdicts, knowing what not to flag. Mechanical cheapness
does not make the decisions mechanical. Test haiku-with-package only with
the full judgment battery: planted-defect ×5, a severity-calibration check
(seeded Minor-vs-Important pairs; miscalibration fails the rung), and the
escape-hatch variance re-measured at that tier. Prior expectation: this
rung dies, and that is a fine outcome — it converts "we suspect cheap
reviewers are bad" into recorded evidence.

### L4 — Resident-context diet (est. −$0.5-1/run)

- `task-brief --list` mode: controller reads task headings + Global
  Constraints, never the full plan (the plan body is already delivered via
  briefs).
- Reports trim 15 → 8 lines.
- SKILL.md minification pass (every section added this week re-justified
  at composition-recipe density; Codex pays ~10k chars × ~500 re-reads per
  long session).

### L5 — Re-litigations (explicitly flagged, maintainer-vetoed or counter-thesis)

Recorded for completeness; each requires Jesse's explicit reversal before
any experiment:
- **Scoped re-reviews** (verify fix + regression scan instead of full
  re-review): vetoed 2026-06-09; worth ~$0.50/run at most.
- **Dispatch-time task batching**: counter-thesis (see guardrail). L1.1
  is the sanctioned form.

## Budget and sequencing

L1 and L2.1 are independent — run both first (~$80: micro-tests + 2×5-run
gates + A/B). L3 after L2 settles the controller (reviewer behavior depends
on dispatch quality; ~$25 — planted-defect runs are $2-3 each). L4 last
(cheap, but re-gate once after the stack; ~$30). Total ≲ $150 for the full
ladder with honest N=5 gates. Expected end state if every rung survives its gates: **$5-7/run on
fractals (from $12-15)**; if the judgment-sensitive rungs (L2 beyond its
primary form, L3) die as expected, **$8-10/run** — the honest target, since
the guardrail prices judgment above dollars by construction.

## Relationship to existing work

Builds on the 2026-06-09 task-scoped review dispatch design (PR #1717) and
the 2026-06-10 experiment campaign (evals
`docs/experiments/2026-06-10-sdd-cost-experiments.md` — consult the
negative-results section before adding rungs; turn-discipline and
parallel-call mechanisms are dead). Instruction wording for any new prose
follows the positive-instruction doctrine spec and gets micro-tested before
full runs. L1 is a writing-plans change → its own PR with eval evidence;
L2-L4 are SDD changes → separate PR(s).
