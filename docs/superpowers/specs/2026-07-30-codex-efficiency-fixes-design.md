# Codex Efficiency Fixes — Design

Date: 2026-07-30
Status: approved by Jesse (in-session)
Branch: `codex-efficiency-fixes` off `dev`

## Sources

- Eval campaign closeout: `superpowers-autoresearch/reports/2026-07-codex-efficiency-campaign.md`
  (treatment table §4; every treatment below has a scorer and a measured
  `dev` baseline).
- Codex source recon: `superpowers-autoresearch/docs/2026-07-29-codex-multiagent-v2-capabilities.md`
  (file:line citations against the Codex CLI source; grounds T2, T3, T5).
- Published experiment write-ups: `superpowers-evals/docs/experiments/`.
- Drew's spinout stack (PRs #2036, #2035) is **evidence, not adopted text**:
  Jesse wants to dig into those fixes in more detail before adopting any
  of them; they inform the problem statements only.

## Goal

Ship the five evidence-strong treatments from the codex-efficiency eval
campaign as superpowers skill/doc changes, each graded against its
pre-registered criterion by the campaign's scorers before its PR is cut.
Phase 2 (everything else in the closeout treatment table) follows, each
item gated on new baseline work first.

## Scope decisions (settled with Jesse)

- **Phase 1 = the evidence-strong five** (T1–T5 below). Phase 2 items
  each need a failing baseline before any fix ships (discrimination
  rule: inconclusive-by-zero is a stop).
- **One branch, PR per treatment.** Development and batteries happen on
  `codex-efficiency-fixes`; when a treatment beats its criterion, it is
  cut into its own PR against `dev` with its eval evidence. No merge
  without Jesse's per-PR approval.
- **T4 ships cross-harness with a global regression battery** (Claude
  Code, Codex, Gemini), variant C shape: ceremony scales, approval never
  does.

## The five treatments

### T1. SDD worker-review prohibition

**Evidence:** 9/9 depth-2 spawns across 4 corpora were implementer-issued
reviewers; all 9 were same-task duplicates of the review the controller
dispatches anyway. The dispatch contract never says review is not the
worker's job; "self-review" in the implementer prompt gets reified into a
reviewer subagent on harnesses where children can spawn (Codex).

**Changes:**
- `skills/subagent-driven-development/implementer-prompt.md`: an explicit
  "You do not dispatch subagents" clause — self-review means reading your
  own diff; the controller owns all review dispatch; a reviewer you spawn
  duplicates a review the process already provides.
- `skills/subagent-driven-development/SKILL.md`: one dispatch-contract
  line in the task loop, plus a Red Flags row: "An independent review
  would strengthen my report" → review is the controller's next step;
  your reviewer is a duplicate seat.
- Harness-agnostic wording (no-op where children cannot spawn).

**Graded by:** `score_e6.py` (depth-2 spawns by spawner role, duplicate
review families); `score_e5.py` for the same-scope variant.
**Baseline:** 9/9 worker-issued, 0 counter-examples.
**Criterion:** 0 worker-issued depth-2 spawns AND review coverage
preserved (every task still gets exactly one controller-dispatched task
review).

### T2. Event-driven waiting

**Evidence:** 60–78% of `wait_agent` calls time out in every corpus
(dev 67.1%, spinout 60.2%). Source recon: V2 waits are event
subscriptions, not polls — one long wait has the same wake latency as a
10s poll at ~1/90th the calls; a completed child's FINAL_ANSWER is pushed
into the parent's mailbox and drained into the next model request with no
wait at all.

**Changes** (`skills/using-superpowers/references/codex-tools.md`):
- Never short-timeout poll.
- While local work remains, do not wait — child results arrive with your
  next turn via the mailbox.
- When genuinely idle, issue ONE `wait_agent` with a long `timeout_ms`
  (900000+; harness max 3600000).
- V2 caveat stated: completion mail carries `trigger_turn=false` and will
  not wake an idle controller — that is the one job `wait_agent` has.

**Graded by:** `score_e7.py` (timeout rate, inter-poll cadence,
cache-rebill estimate — the rebill figure stays labeled as an estimate).
**Baseline:** dev 67.1% timeout rate.
**Criterion:** timeout rate < 25% with no loss of task completion.

### T3. codex-tools.md corrections

**Evidence:** five claims in the current guidance are contradicted by the
Codex source (all file:line-cited in the capabilities doc):
1. `close_agent` does not exist in multi-agent V2 (V1-only). V2 LRU-evicts
   finished children automatically; not closing costs nothing;
   `followup_task` transparently reloads an evicted child.
2. Fix rounds can always resume the implementer via `followup_task` —
   dev's "if your harness cannot send another message to a spawned agent,
   dispatch each fix round as a fresh implementer" branch is dead on V2.
3. Role files (`~/.codex/agents/**.toml`) DO attach to spawns via
   `agent_type` on isolated forks (0.145+).
4. Full-history forks accept `model`/`reasoning_effort` overrides; only
   `agent_type` is refused. (Isolated forks remain the SDD guidance for
   context-hygiene reasons, stated accurately.)
5. Dispatch guidance must never name non-V2 model presets — the V2 spawn
   allowlist is v2 presets only; others hard-error.

**Changes:** rewrite the multi-agent paragraph of
`skills/using-superpowers/references/codex-tools.md` to be
version-honest (V1 vs V2 behavior labeled where they differ).

**Graded by:** source citation (already verified); no scorer regressions
on the shared battery. `score_e8.py` is retained as a V1/V2 schema
detector, not a hygiene grader — no `close_agent` checklist ships.

### T4. Brainstorming three-path router (variant C: approval always)

**Evidence:** micro — the current HARD-GATE text pushes a bounded task to
FULL ceremony 5/5, while Z-null (no guidance) and a three-path router
both differentiate 5/5: the absolute wording suppresses discrimination
the model draws natively. FULL battery — ceremony volume scales
moderately (16.7 vs 24.0 tool calls, bounded vs arch), but the
two-document ritual (spec file → plan file) ran unconditionally in every
rep. The measured waste is the unconditional artifact ritual, not the
approval gate.

**Design (variant C):** three paths scale the ARTIFACT; every path keeps
human approval before implementation:
- **Spike** (feasibility question, explicitly throwaway): present the
  question and the intended probe in 2–3 sentences, get a nod, go. No
  docs. Findings return as a recommendation; anything built stays labeled
  throwaway.
- **Bounded** (well-scoped change to an existing, understood flow):
  present a short design in chat, get approval, implement. No spec file,
  no writing-plans invocation.
- **Architectural** (restructures components, new subsystem, public
  interface change): the full current flow — spec doc, review,
  writing-plans.

**Guards (all ship with the router):**
- Classification is said out loud ("this looks bounded, so I'll present a
  short design here rather than write a spec") so the human can override.
- When in doubt between two paths, take the heavier one.
- One-way ratchet: hidden complexity discovered mid-path upgrades the
  path; never downgrade mid-task.
- New Red Flags rows targeting classification-as-escape-hatch ("I'll call
  it bounded to skip the doc").

**Changes** (`skills/brainstorming/SKILL.md`): HARD-GATE keeps "no
implementation before approval" and drops "regardless of perceived
simplicity" as the ceremony driver; anti-pattern section reframed (the
sin is skipping approval, not skipping documents); checklist steps 6–9
become the architectural path; process-flow graph gains the router; Red
Flags rows added. This is carefully-tuned content — the edit follows
writing-skills methodology and ships only with the full eval evidence
below.

**Graded by (three layers):**
1. **Micro** (`ceremony-path-micro.py`, adapted): variant C literal text,
   plus adversarially ambiguous briefs the campaign never tested (a task
   that pattern-matches bounded but hides a public interface change).
   Criteria: spike/bounded/arch differentiate (≥4/5 per cell); ambiguous
   briefs escalate to FULL (≥4/5); arch never downgrades (5/5).
2. **Codex ceremony battery:** `cx-ceremony-{spike,bounded,arch}` on the
   fix arm, 3 reps each, `score_e4.py` census. Criteria: bounded reps
   show an approval turn but zero committed spec files and zero
   writing-plans ritual; arch reps keep the full two-doc flow; spike reps
   stay minimal.
3. **Global regression battery:** the same three ceremony scenarios on
   Claude Code and Gemini (rig work: those scenarios are currently
   codex-gated), 3 reps each; plus the triggering acceptance check
   ("Let's make a react todo list" auto-triggers brainstorming into the
   full/architectural path) on all three harnesses.

### T5. Explicit model on child-issued spawns

**Evidence:** root spawns are 100% explicit-model at CLI 0.146 (dev
14/14); the live gap is depth-2 — 2/2 child-issued spawns omitted
`model`. Source recon: `model` without `reasoning_effort` resets effort
to the MODEL's default, not the parent's.

**Changes** (`skills/using-superpowers/references/codex-tools.md`):
- Every spawn you issue — including as a child — sets `model` AND
  `reasoning_effort`; the effort-reset trap is named.
- Advise `[agents].default_subagent_model` and
  `[agents].default_subagent_reasoning_effort` in `~/.codex/config.toml`
  as the machine-level backstop for anything that slips through.

**Graded by:** `score_e1.py` (per-spawn explicit-model rate, by depth) on
the shared battery.
**Baseline:** depth-2: 0/2 explicit.
**Criterion:** every spawn at every depth carries explicit model +
effort. Pre-registered caveat: if T1 eliminates depth-2 spawns entirely,
T5 grades as root-spawn regression (hold 100%) plus doc correctness and
is recorded inconclusive-by-zero at depth-2 — the config backstop is then
the operative mechanism.

## Grading plan

- **Shared SDD battery** carries T1, T2, T5: `cx-sdd-small`, fix-branch
  arm (`/tmp/sp-arm-fix`), 8 reps across both container lanes. Dev
  baselines are already measured; no baseline re-runs.
- **T4 batteries** as listed above (micro + codex ceremony + global
  regression).
- **Pre-registration:** every battery gets a hypothesis-log entry
  (prediction, scorer, criterion) in
  `superpowers-autoresearch/logs/2026-07-30-codex-efficiency-fixes.md`
  BEFORE it runs. Standing rules carry over: append-only log, manual
  inspection of scorer matches on fix-arm runs (non-circular
  verification), no raw rollouts committed, correctness rides beside
  cost in every verdict.
- **Attribution:** orthogonal scorers on one combined branch; unexpected
  regressions bisect by treatment commit.
- **Budget:** shared battery ~$40, codex ceremony ~$40, global
  regression ~$40–80, micros ~$5 → phase 1 ≈ $150–200 of the ~$850
  remaining from the campaign's $1000.

## Process

- Work happens in the `codex-efficiency-fixes` worktree (branched off
  `dev`); execution via subagent-driven-development from a written plan.
- Skill-text changes follow writing-skills methodology.
- Scenario/rig changes (un-gating ceremony scenarios for Claude
  Code/Gemini, adversarial micro briefs) land in `superpowers-evals`
  main, as authorized.
- PR-per-treatment against `dev`, each with its eval evidence and the
  standard identification block; merges only on Jesse's per-PR approval.

## Phase 2 queue (baseline-first; not in this plan's tasks)

Each item requires a failing baseline before any fix ships:
1. **Dispatch routing / long-session drift** — needs a long-session
   elicitation rig (fresh sessions don't reproduce the pathology at CLI
   0.146). Drew's stack informs the treatment shape.
2. **Verification leases / evidence receipts** — needs the
   substring-aware duplicate counter added to `score_e3.py` first
   (current baseline 1/23 exact-string pairs is too weak).
3. **Remediation cap** — small-n baseline (2/3 reps) needs more reps.
4. **Cross-task-race probe redesign** — `score_e5.py`'s probe is
   inconclusive-by-zero by design tradeoff; needs a stronger probe.
5. **E5 D4 shell-command parser** — fix-review-scope classifier cannot
   parse compound commands; scorer work, not skill work.

## Out of scope

- Adopting Drew's spinout stack (#2036/#2035) or its text.
- RoboRev, Codex token telemetry (separate codebases).
- A `close_agent` hygiene checklist (V2 has no such tool — closed as
  do-not-ship in the campaign).
- Claude Code/Gemini-specific efficiency treatments beyond the T4
  regression battery.
