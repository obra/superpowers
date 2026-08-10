# Codex Efficiency Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the five evidence-strong treatments (T1–T5) from the codex-efficiency eval campaign as skill/doc changes on `codex-efficiency-fixes`, grade each against its pre-registered criterion with the campaign's scorers, and cut one PR per passing treatment against `dev`.

**Architecture:** Skill-text edits land in this worktree (`.worktrees/codex-efficiency-fixes`); eval rig work, hypothesis-log entries, and scorers live in `superpowers-autoresearch` (main, push authorized); scenario changes live in `superpowers-autoresearch/campaigns/codex-efficiency/scenarios/`. Batteries run through the existing quorum container lanes against a `/tmp/sp-arm-fix` worktree arm.

**Tech Stack:** Markdown skill text; Python 3 scorers (pytest); bash quorum runner; Codex/Claude/Gemini CLIs in the evals container.

**Spec:** `docs/superpowers/specs/2026-07-30-codex-efficiency-fixes-design.md` (approved). The spec's baselines and criteria govern; this plan repeats them per task.

## Global Constraints

- The hypothesis log (`superpowers-autoresearch/logs/2026-07-30-codex-efficiency-fixes.md`) is append-only; corrections are new dated entries, never edits. Every battery gets a pre-registration entry BEFORE it runs.
- Raw rollouts and session content never enter any repo. Aggregates, scorer outputs, and distilled scenarios only.
- Before every autoresearch/evals commit: substring-aware grep of staged text AND the commit-message file against the campaign name-sets (client names, hostnames, ticket IDs). Oblique references only.
- Scenario post-checks (`checks.sh`) must never assert a behavioral choice a scorer measures. Measurement is scorer-side.
- Smoke-test ONE rep of any scenario/arm/harness combination before its battery.
- Scorer output files use rep-range names; existing aggregates are never overwritten without `FORCE=1`.
- Every scorer verdict requires manual inspection of matches (non-circular: never verify with the scorer's own helper).
- Brainstorming's frontmatter `description:` must not change (triggering depends on it).
- Skill edits must not alter files outside the named targets; no whitespace-only churn.
- PRs are cut per treatment ONLY after its criterion passes; merges require Jesse's per-PR approval. The codex-tools.md PRs declare merge order T3 → T2 → T5.
- Subagents running batteries poll in-session with long timeouts; no monitors.

---

### Task 1: T1 — SDD worker-review prohibition

**Files:**
- Modify: `skills/subagent-driven-development/implementer-prompt.md` (insert new section before `## Code Organization`)
- Modify: `skills/subagent-driven-development/SKILL.md` (dispatch bullet + Red Flags row)

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: commit `fix(sdd): implementers never dispatch subagents` — the T1 PR cherry-picks exactly this commit.

- [ ] **Step 1: Insert the implementer-prompt section**

In `skills/subagent-driven-development/implementer-prompt.md`, immediately after the paragraph ending `run the full suite once before committing, not after every edit.` and before `    ## Code Organization`, insert (keeping the template's 4-space body indent):

```
    ## You Do Not Dispatch Subagents

    Do all of this task's work yourself. Never spawn a subagent to
    implement part of the task, and above all never spawn a reviewer to
    check your work. Self-review (below) means reading your own diff.
    Review is the controller's job: after you report, it dispatches a
    fresh reviewer against your diff. A reviewer you spawn duplicates
    that review at full cost, and its approval counts for nothing in
    the process. If you catch yourself thinking "an independent review
    would strengthen my report" — that review is already scheduled.
    Report instead.
```

- [ ] **Step 2: Add the dispatch-contract bullet to SKILL.md**

In `skills/subagent-driven-development/SKILL.md`, section `### 1. Dispatch the implementer`, after the bullet beginning `- A dispatch prompt describes one task, not the session's history.`, add:

```
- The dispatch carries the no-subagents contract (it is in the
  implementer template): the implementer never dispatches subagents —
  not helpers, and never a reviewer. Review arrives from you, after the
  report. In real sessions, every reviewer a worker spawned duplicated
  the task review the controller dispatched anyway — a full extra
  review seat per task.
```

- [ ] **Step 3: Add the Red Flags row**

In the same file's Red Flags table (`## Red Flags`), after the row `| "Ledger bookkeeping is overhead" | ... |`, add:

```
| "The implementer spawned its own reviewer — free extra assurance" | It's a duplicate seat reviewing the same diff; the task review is the gate. A worker-spawned reviewer is a defect to flag, not rigor. |
```

- [ ] **Step 4: Verify**

Run: `grep -c "You Do Not Dispatch Subagents" skills/subagent-driven-development/implementer-prompt.md` → expect `1`. Run: `grep -c "no-subagents contract\|spawned its own reviewer" skills/subagent-driven-development/SKILL.md` → expect `2`.

- [ ] **Step 5: Commit**

```bash
git add skills/subagent-driven-development/implementer-prompt.md skills/subagent-driven-development/SKILL.md
git commit -m "fix(sdd): implementers never dispatch subagents

Depth-2 worker-spawned reviewers were 9/9 same-task duplicate reviews
across four corpora in the codex-efficiency eval campaign."
```

---

### Task 2: T3 — codex-tools.md version-honest multi-agent rewrite

**Files:**
- Modify: `skills/using-superpowers/references/codex-tools.md` (replace the paragraph after the config block)

**Interfaces:**
- Consumes: nothing.
- Produces: the rewritten base section Tasks 3 and 4 append after; commit `fix(codex): correct multi-agent guidance against Codex source` (T3 PR).

- [ ] **Step 1: Replace the multi-agent paragraph**

In `skills/using-superpowers/references/codex-tools.md`, replace the entire single paragraph beginning `This enables \`spawn_agent\`, \`wait_agent\`, and \`close_agent\`` (and ending `...carrying the brief, the report file, and the findings.`) with:

```
This enables the multi-agent tools that skills like
`dispatching-parallel-agents` and `subagent-driven-development` use.
Which tools you get depends on the multi-agent version your model
preset selects (current presets run V2; older ones run V1). Trust your
actual tool list over any table — including this one — when they
disagree.

- **Spawning:** give children a clean context with
  `spawn_agent {fork_turns: "none"}`; the default `"all"` copies your
  entire transcript into the child. On Codex 0.145+, role files under
  `~/.codex/agents/` attach to isolated forks via `agent_type`.
  Full-history forks accept `model` and `reasoning_effort` overrides
  (only `agent_type` is refused there) — isolated forks are the SDD
  default for context hygiene, not because overrides require them.
- **Fix rounds:** resume the implementer with `followup_task` — it
  delivers your message, triggers a turn, and transparently reloads a
  child the harness evicted. Never dispatch a fresh implementer on the
  theory that a spawned agent cannot be messaged again; on V2 it
  always can.
- **Lifecycle:** V2 has no `close_agent`. Finished children are
  evicted automatically when slots are needed; leaving them unclosed
  costs nothing. Only V1 sessions have `close_agent` — there, close
  reviewers when their review returns, and close each implementer
  after its task's review passes.
- **Model names:** never copy a model name from a skill, table, or old
  session into `spawn_agent` without checking it against your current
  spawn allowlist — V2 accepts only V2-capable presets and hard-errors
  on the rest.
```

- [ ] **Step 2: Verify**

Run: `grep -c "close_agent" skills/using-superpowers/references/codex-tools.md` → expect `2` (both inside the Lifecycle bullet). Run: `grep -c "cannot be messaged again" skills/using-superpowers/references/codex-tools.md` → expect `1`.

- [ ] **Step 3: Commit**

```bash
git add skills/using-superpowers/references/codex-tools.md
git commit -m "fix(codex): correct multi-agent guidance against Codex source

Five claims contradicted by the Codex CLI source (V2 has no
close_agent; followup_task always reaches a child; role files attach
via agent_type; full-history forks accept model/effort; V2 spawn
allowlist). Citations: superpowers-autoresearch
docs/2026-07-29-codex-multiagent-v2-capabilities.md."
```

---

### Task 3: T2 — codex-tools.md event-driven waiting section

**Files:**
- Modify: `skills/using-superpowers/references/codex-tools.md` (new section after Task 2's block, before `## Environment Detection`)

**Interfaces:**
- Consumes: Task 2's rewritten base section (append directly after it).
- Produces: commit `fix(codex): event-driven waiting instead of short polls` (T2 PR; declares dependency on T3's PR).

- [ ] **Step 1: Insert the section**

Immediately before `## Environment Detection`, insert:

```
## Waiting on children

`wait_agent` is an event subscription, not a poll: a long wait wakes
the moment a child produces mailbox activity, with the same latency as
a short one. Short-timeout polling buys nothing and costs a tool call —
and a context rebill — per poll. In measured sessions, roughly
two-thirds of all wait calls were short polls that timed out.

- While you still have local work, do not wait at all. A completed
  child's final answer is pushed into your mailbox and arrives with
  your next turn.
- When you are genuinely idle with children outstanding, issue ONE
  `wait_agent` with a long `timeout_ms` — 900000 (15 minutes) or more —
  and let the event wake you.
- Completion mail cannot wake an idle controller (it is delivered
  without triggering a turn); covering that idle window is
  `wait_agent`'s only job. If a long wait times out, check
  `list_agents` for stuck children — do not fall back to short polls.
```

- [ ] **Step 2: Verify**

Run: `grep -c "Waiting on children" skills/using-superpowers/references/codex-tools.md` → expect `1`. Run: `grep -n "900000" skills/using-superpowers/references/codex-tools.md` → expect one hit.

- [ ] **Step 3: Commit**

```bash
git add skills/using-superpowers/references/codex-tools.md
git commit -m "fix(codex): event-driven waiting instead of short polls

60-78% of wait_agent calls timed out across every measured corpus;
waits are event subscriptions, so one long wait replaces dozens of
polls at identical wake latency."
```

---

### Task 4: T5 — codex-tools.md model routing on spawns

**Files:**
- Modify: `skills/using-superpowers/references/codex-tools.md` (new section after Task 3's, before `## Environment Detection`)

**Interfaces:**
- Consumes: Tasks 2–3 in place.
- Produces: commit `fix(codex): explicit model+effort on every spawn, config backstop` (T5 PR; declares dependency on T3's and T2's PRs).

- [ ] **Step 1: Insert the section**

Immediately before `## Environment Detection`, insert:

````
## Model routing on spawns

Every `spawn_agent` you issue — including when you are yourself a
spawned child running a fan-out — sets `model` AND `reasoning_effort`
explicitly, per the Model Selection rules of the skill you are
executing. Setting `model` alone is a trap: the child's effort
silently resets to that model's default, not to yours.

Ask your human partner to add a machine-level backstop to
`~/.codex/config.toml` so any spawn that slips through still routes to
a deliberate tier instead of silently inheriting the session's most
expensive model:

```toml
[agents]
default_subagent_model = "<a mid-tier model from your spawn allowlist>"
default_subagent_reasoning_effort = "medium"
```
````

- [ ] **Step 2: Verify**

Run: `grep -c "Model routing on spawns" skills/using-superpowers/references/codex-tools.md` → expect `1`. Run: `grep -c "default_subagent_model" skills/using-superpowers/references/codex-tools.md` → expect `1`.

- [ ] **Step 3: Commit**

```bash
git add skills/using-superpowers/references/codex-tools.md
git commit -m "fix(codex): explicit model+effort on every spawn, config backstop

Depth-2 child-issued spawns omitted model 2/2 at CLI 0.146; model
without reasoning_effort resets effort to the model default."
```

---

### Task 5: T4 — brainstorming three-path router (variant C)

**Files:**
- Modify: `skills/brainstorming/SKILL.md`

The frontmatter `description:` is untouched. Edits below are complete replacements for the named regions; everything not named stays byte-identical.

- [ ] **Step 1: Replace intro sentence, HARD-GATE, and anti-pattern section**

Replace from the line `Start by understanding the current project context, ...` through the end of the `## Anti-Pattern: "This Is Too Simple To Need A Design"` section (i.e., up to but not including `## Checklist`) with:

```
Start by classifying how much process the request needs, then work
through your path: understand the context, refine the idea, present a
design, and get your human partner's approval.

<HARD-GATE>
Do NOT invoke any implementation skill, write any code, scaffold any
project, or take any implementation action until you have told your
human partner what you intend and they have approved it. This applies
to EVERY task on EVERY path below — the ceremony scales with the task;
the approval gate never does.
</HARD-GATE>

## Three Paths

Before your first question, classify the request and say the
classification out loud — "this looks bounded, so I'll present a short
design here rather than write a spec" — so your human partner can
override it:

- **Spike** — a feasibility question ("can we...", "is it possible...",
  "quick and dirty is fine") whose output is an answer, not code you
  keep. Present the question and what you'll try in 2-3 sentences, get
  a nod, then find out as cheaply as correctness allows. No design
  doc, no spec file. Report findings as a recommendation; anything you
  built stays labeled throwaway.
- **Bounded** — a well-scoped change to an existing, understood flow: a
  new flag, a small endpoint, a one-file fix. Ask the clarifying
  questions that matter, present a short design IN CHAT (a few
  sentences to a few short paragraphs), and get approval. No spec
  file, no implementation plan document.
- **Architectural** — new projects, new subsystems, changes that
  restructure how components fit together or alter interfaces others
  depend on. Follow the full process: questions, approaches, sectioned
  design, written spec, then the writing-plans skill.

When in doubt between two paths, take the heavier one. The ratchet is
one-way: hidden complexity discovered mid-task upgrades the path —
stop, say so, and step up. Nothing downgrades mid-task.

## Anti-Pattern: "Too Simple To Need Approval"

Every path ends with your human partner approving your intent before
implementation. A todo list, a single-function utility, a config
change — the design may be two sentences in chat, but you MUST present
it and get approval. "Simple" tasks are where unexamined assumptions
cause the most wasted work. What scales with simplicity is the
artifact, never the approval.

## Red Flags

| Thought | Reality |
|---------|---------|
| "This is too simple to need a design" | Simple means a short design, not no design. Two sentences in chat, then approval. |
| "I'll call it bounded and skip the spec" | Reaching for a label to skip work IS the doubt — take the heavier path. |
| "The spike works, so I'll keep the code" | A spike's output is an answer. Keeping the code is a new request — classify it. |
| "It grew, but I'm almost done — no need to re-classify" | Hidden complexity upgrades the path mid-task. Stop and say so. |
| "They approved the spike, so the follow-up change is approved too" | Each task gets its own classification and its own approval. |
```

- [ ] **Step 2: Replace the Checklist section**

Replace the `## Checklist` section body (from `You MUST create a task...` through item 9) with:

```
Classify first, announce the path, then create a task for each item on
your path and complete them in order.

**Spike:**
1. **Explore project context** — enough to frame the probe
2. **Present question + probe plan** — 2-3 sentences
3. **Get approval** — a nod is enough
4. **Investigate** — as cheaply as correctness allows
5. **Report findings** — a recommendation; label anything built as throwaway

**Bounded:**
1. **Explore project context** — check files, docs, recent commits
2. **Ask clarifying questions** — one at a time, the ones that matter
3. **Present short design in chat** — approach, files touched, testing
4. **Get approval** — explicit, before any implementation
5. **Implement** — proceed with the normal development workflow (TDD applies); no plan document

**Architectural:**
1. **Explore project context** — check files, docs, recent commits
2. **Offer the visual companion just-in-time** — NOT upfront. The first time a question would genuinely be clearer shown than described, offer it then (its own message); on approval its browser tab opens for you. If no visual question ever arises, never offer it. See the Visual Companion section below.
3. **Ask clarifying questions** — one at a time, understand purpose/constraints/success criteria
4. **Propose 2-3 approaches** — with trade-offs and your recommendation
5. **Present design** — in sections scaled to their complexity, get user approval after each section
6. **Write design doc** — save to `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md` and commit
7. **Spec self-review** — quick inline check for placeholders, contradictions, ambiguity, scope (see below)
8. **User reviews written spec** — ask user to review the spec file before proceeding
9. **Transition to implementation** — invoke writing-plans skill to create implementation plan
```

- [ ] **Step 3: Replace the Process Flow graph**

Replace the entire ```dot ... ``` block under `## Process Flow` with:

```
digraph brainstorming {
    "Classify: spike / bounded / architectural" [shape=diamond];
    "Present question + probe (2-3 sentences)" [shape=box];
    "Ask clarifying questions (bounded)" [shape=box];
    "Present short design in chat" [shape=box];
    "Human approves?" [shape=diamond];
    "Investigate; report recommendation" [shape=doublecircle];
    "Implement via normal workflow (no plan doc)" [shape=doublecircle];
    "Explore project context" [shape=box];
    "Ask clarifying questions" [shape=box];
    "Propose 2-3 approaches" [shape=box];
    "Present design sections" [shape=box];
    "User approves design?" [shape=diamond];
    "Write design doc" [shape=box];
    "Spec self-review\n(fix inline)" [shape=box];
    "User reviews spec?" [shape=diamond];
    "Invoke writing-plans skill" [shape=doublecircle];
    "Hidden complexity? Upgrade path" [shape=box];

    "Classify: spike / bounded / architectural" -> "Present question + probe (2-3 sentences)" [label="spike"];
    "Classify: spike / bounded / architectural" -> "Ask clarifying questions (bounded)" [label="bounded"];
    "Classify: spike / bounded / architectural" -> "Explore project context" [label="architectural"];
    "Present question + probe (2-3 sentences)" -> "Human approves?";
    "Ask clarifying questions (bounded)" -> "Present short design in chat";
    "Present short design in chat" -> "Human approves?";
    "Human approves?" -> "Investigate; report recommendation" [label="spike: yes"];
    "Human approves?" -> "Implement via normal workflow (no plan doc)" [label="bounded: yes"];
    "Hidden complexity? Upgrade path" -> "Classify: spike / bounded / architectural";
    "Explore project context" -> "Ask clarifying questions";
    "Ask clarifying questions" -> "Propose 2-3 approaches";
    "Propose 2-3 approaches" -> "Present design sections";
    "Present design sections" -> "User approves design?";
    "User approves design?" -> "Present design sections" [label="no, revise"];
    "User approves design?" -> "Write design doc" [label="yes"];
    "Write design doc" -> "Spec self-review\n(fix inline)";
    "Spec self-review\n(fix inline)" -> "User reviews spec?";
    "User reviews spec?" -> "Write design doc" [label="changes requested"];
    "User reviews spec?" -> "Invoke writing-plans skill" [label="approved"];
}
```

- [ ] **Step 4: Replace the terminal-state paragraph**

Replace the paragraph `**The terminal state is invoking writing-plans.** Do NOT invoke frontend-design, mcp-builder, or any other implementation skill. The ONLY skill you invoke after brainstorming is writing-plans.` with:

```
**Terminal states are path-bound.** Architectural: the ONLY skill you
invoke after brainstorming is writing-plans — never frontend-design,
mcp-builder, or any other implementation skill. Bounded: after
approval, implementation proceeds directly through the normal
development workflow; no plan document. Spike: the terminal state is a
reported recommendation.
```

- [ ] **Step 5: Scope the long-form sections to their paths**

(a) Immediately under `## The Process`, insert as the first line:

```
The subsections below serve the bounded and architectural paths (a
spike stops at "present the probe, get a nod"). Sections from
**Exploring approaches** onward are architectural-path depth — for
bounded work, context plus a few questions plus a short in-chat design
is the whole process.
```

(b) Rename the heading `## After the Design` to `## After the Design (architectural path)`.

- [ ] **Step 6: Verify**

Run: `grep -c "Three Paths" skills/brainstorming/SKILL.md` → `1`; `grep -c "regardless of perceived simplicity" skills/brainstorming/SKILL.md` → `0`; `grep -c "^description:" skills/brainstorming/SKILL.md` unchanged vs `git show origin/dev:skills/brainstorming/SKILL.md | grep -c "^description:"`; confirm `git diff origin/dev -- skills/brainstorming/SKILL.md` shows no frontmatter hunk. If `dot` is installed: `awk '/^```dot$/,/^```$/' skills/brainstorming/SKILL.md | sed '1d;$d' | dot -Tcanon >/dev/null` → exit 0.

- [ ] **Step 7: Commit**

```bash
git add skills/brainstorming/SKILL.md
git commit -m "feat(brainstorming): three-path router — ceremony scales, approval never does

Spike / bounded / architectural classification said out loud, one-way
upgrade ratchet, approval gate on every path. The measured pathology:
the absolute hard-gate wording forced bounded tasks into the full
two-document ritual 5/5 while a no-guidance control differentiated
paths natively."
```

---

### Task 6: Fix arm + hypothesis log

**Files:**
- Create: `superpowers-autoresearch/logs/2026-07-30-codex-efficiency-fixes.md`
- Create (filesystem, not committed): `/tmp/sp-arm-fix` worktree

**Interfaces:**
- Consumes: Tasks 1–5 committed on `codex-efficiency-fixes`.
- Produces: the arm every battery runs against; the log every later task appends to.

- [ ] **Step 1: Create the arm**

```bash
git -C /Users/jesse/git/superpowers/superpowers worktree add --detach /tmp/sp-arm-fix codex-efficiency-fixes
git -C /tmp/sp-arm-fix log --oneline -1   # must show Task 5's commit
```

(Before any LATER battery, refresh with `git -C /tmp/sp-arm-fix checkout --detach codex-efficiency-fixes`.)

- [ ] **Step 2: Create the log**

Write `superpowers-autoresearch/logs/2026-07-30-codex-efficiency-fixes.md` with: title `# Codex efficiency fix cycle — hypothesis log`; a header block stating it is append-only, naming the spec path (`superpowers/docs/superpowers/specs/2026-07-30-codex-efficiency-fixes-design.md`), the branch, the arm (`/tmp/sp-arm-fix`), and the carried-over standing rules (pre-registration before batteries, manual match inspection, no raw rollouts, discrimination rule); and a `## Pre-registered criteria (from the approved spec)` section reproducing verbatim the five criterion lines from the spec's treatment sections (T1: 0 worker-issued depth-2 spawns AND review coverage preserved; T2: timeout rate < 25%, no completion loss; T3: source-cited corrections, no scorer regressions; T4: the three-layer criteria; T5: explicit model+effort at every depth, with the pre-registered inconclusive-by-zero caveat).

- [ ] **Step 3: Privacy sweep and commit (autoresearch)**

```bash
cd /Users/jesse/git/superpowers/superpowers-autoresearch
git add logs/2026-07-30-codex-efficiency-fixes.md
git diff --cached | grep -iE 'paradise|magic-kingdom|flower|pallas|web1|teststrip|PRI-[0-9]' && echo LEAK || echo clean   # must print clean
git commit -m "docs: open the codex-efficiency fix-cycle hypothesis log"
```

---

### Task 7: Micro — variant C + adversarial briefs

**Files:**
- Modify: `superpowers-autoresearch/campaigns/codex-efficiency/ceremony-path-micro.py`
- Create: `superpowers-autoresearch/campaigns/codex-efficiency/out/` micro outputs (NOT committed; aggregates go in the log)

**Interfaces:**
- Consumes: Task 5's shipped router text (the variant must quote it), Task 6's log.
- Produces: micro verdict for T4 layer 1.

- [ ] **Step 1: Extend the script**

Read the current script first. Then: (a) add a variant `C-approval` whose text is the Three Paths block from Task 5 Step 1 (the three bullets plus the doubt/ratchet paragraph, verbatim); (b) neutralize the shared SYSTEM answer definitions so classification measures the ARTIFACT level, not the approval step — replace the three definition bullets with: SPIKE = "dive straight into a minimal throwaway investigation — no design document"; BOUNDED = "make the change after at most brief clarification and a short in-chat design — no design document, no implementation plan"; FULL = "run the complete design process — written design document and implementation plan before touching code"; (c) add two briefs after the existing three:

`ambig-interface`: "Add a --json flag to our export CLI command so output can be piped to jq. The current text output of export is parsed line-by-line by three downstream scripts in tools/ that other teams run in their pipelines."

`ambig-crosscut`: "Fix the timezone bug in report_generator.py where daily rollups are off by one day for users west of UTC. Rollup boundaries are also computed independently in the billing exporter and the retention job, which must stay consistent with reports."

Matrix: 3 variants (Z-null, A-current, C-approval) × 5 briefs × 5 reps = 75 calls, model `claude-opus-4-8`, same one-word regex scoring and answer-file verification as the campaign run.

- [ ] **Step 2: Pre-register in the log**

Append an entry BEFORE running: the taxonomy change (new SYSTEM definitions — within-run comparisons only; not comparable cell-by-cell to the campaign's micro), the matrix, and predictions: C-approval — spike→SPIKE ≥4/5, bounded→BOUNDED ≥4/5, arch→FULL 5/5, both ambig→FULL ≥4/5; A-current — bounded→FULL persists; Z-null on ambig briefs recorded as an observation (does unguided judgment escalate?). Commit the entry.

- [ ] **Step 3: Run and verify**

Run the sweep. Independently verify every answer file is exactly one word via a separate command (e.g. `awk 'NF!=1' out/micro-c/*.txt`), not the scorer's own parser.

- [ ] **Step 4: Verdict entry + commit**

Append the results table and verdict to the log (criteria from Step 2). Privacy-sweep, commit script + log entry. If C-approval fails a cell, STOP: report to the controller — the router text needs revision before any battery spends on it.

---

### Task 8: Shared SDD battery (T1, T2, T5)

**Files:**
- Create: `superpowers-autoresearch/campaigns/codex-efficiency/out/` fix-arm aggregates (rep-range filenames)
- Modify: `superpowers-autoresearch/logs/2026-07-30-codex-efficiency-fixes.md` (pre-registration + verdicts)
- Possibly modify: `superpowers-autoresearch/campaigns/codex-efficiency/run-quorum.sh` (only if the `fix` arm name needs wiring — read it first; the campaign convention maps ARM → `/tmp/sp-arm-$ARM`)

**Interfaces:**
- Consumes: Tasks 1–6.
- Produces: T1/T2/T5 verdicts; the runs Task 11's regression comparison may reuse.

- [ ] **Step 1: Pre-register** — append the battery entry (arm=fix @ the arm's SHA, scenario `cx-sdd-small`, 8 reps across lanes A and B, JOBS=2, scorers e6/e7/e1, criteria verbatim from the log's criteria section, budget estimate ~$40). Commit.

- [ ] **Step 2: Smoke test** — 1 rep: `EVALS_ROOT=<lane A> JOBS=1 bash run-quorum.sh fix cx-sdd-small 1`. Inspect the verdict and one rollout by hand: session ran, spawns present, no setup failure. Any infra anomaly stops the battery.

- [ ] **Step 3: Run the battery** — 7 more reps split across lanes (`REP_START` per the runner's convention, e.g. reps 2–4 lane A, 5–8 lane B). Poll in-session with long timeouts; no monitors.

- [ ] **Step 4: Score** — run `score_e6.py`, `score_e7.py`, `score_e1.py` over the fix-arm runs with rep-range output names. Manually inspect: every depth-2 spawn (should be none worker-issued), every wait call classification for 2+ runs, every spawn tuple for 2+ runs — against raw rollouts, not scorer helpers.

- [ ] **Step 5: Verdict entries** — per treatment, against pre-registered criteria; record the T5 inconclusive-by-zero branch honestly if depth-2 spawns vanished. Ledger row with measured cost. Privacy-sweep; commit aggregates + log.

---

### Task 9: Codex ceremony battery (T4 layer 2)

**Files:**
- Modify: log (pre-registration + verdict); `out/` aggregates.

**Interfaces:**
- Consumes: Tasks 5, 6; Task 7 must have PASSED.
- Produces: T4 layer-2 verdict.

- [ ] **Step 1: Pre-register** — arm=fix, `cx-ceremony-{spike,bounded,arch}`, 3 reps each, scorer `score_e4.py`; criteria: bounded — approval turn present, 0 committed spec/plan docs, 0 writing-plans ritual; arch — two-doc flow intact 3/3; spike — no docs, minimal ceremony; plus gauntlet task completion preserved per cell. Budget ~$40. Commit.

- [ ] **Step 2: Smoke test** — 1 bounded rep; hand-inspect the rollout for scenario health (not for the measured behavior).

- [ ] **Step 3: Run remaining 8 runs across lanes.**

- [ ] **Step 4: Score + manually verify** — `score_e4.py` census; hand-verify one rep per class against raw timestamps (the campaign's hand-recount method: doc patches vs first non-doc patch).

- [ ] **Step 5: Verdict entry** — versus criteria; ledger row; sweep; commit.

---

### Task 10: ATIF ceremony census scorer (for the global battery)

**Files:**
- Create: `superpowers-autoresearch/campaigns/codex-efficiency/score_t4_regression.py`
- Create: `superpowers-autoresearch/campaigns/codex-efficiency/test_score_t4_regression.py`
- Create: `superpowers-autoresearch/campaigns/codex-efficiency/fixtures/atif-ceremony/` (synthetic `trajectory.json` fixtures)

**Interfaces:**
- Consumes: quorum's per-run `trajectory.json` (ATIF v1.7; tool calls with file paths and step timestamps — see `superpowers/evals/src/atif/types.ts` for the shape).
- Produces: per-run census dict: `{spec_docs_written: int, plan_docs_written: int, doc_writes_before_first_code: int, first_code_file: str|null, user_turns_before_first_code: int, writing_plans_invoked: bool}`; consumed by Task 11.

- [ ] **Step 1: Write failing tests** — build three synthetic trajectory fixtures: (a) full-ceremony (writes `docs/superpowers/specs/x-design.md` then `docs/superpowers/plans/x.md` then `src/app.py`), (b) bounded-lean (writes `src/app.py` first, no docs), (c) doc-only-readme (writes `README.md` then code — README is NOT a ceremony doc). Assert the census fields for each, including `writing_plans_invoked` detection via a tool call reading a path containing `skills/writing-plans` (fixture (a) true, others false). Run `python3 -m pytest test_score_t4_regression.py` → all FAIL (module missing).

- [ ] **Step 2: Implement** — ceremony docs are paths matching `docs/superpowers/(specs|plans)/`; code files are any other write outside `docs/` and not `*.md` at repo root; count user turns from ATIF steps preceding the first code write. Run tests → PASS.

- [ ] **Step 3: Commit** (autoresearch, after sweep): `feat: ATIF ceremony census scorer for cross-harness T4 regression`.

---

### Task 11: Global regression battery (T4 layer 3) — Claude Code + Gemini

**Files:**
- Create: `superpowers-autoresearch/campaigns/codex-efficiency/scenarios/cc-ceremony-{spike,bounded,arch}/` (copies of the `cx-` scenarios with the `# coding-agents:` line set to `claude,gemini`; strip any codex-only setup)
- Modify: log (pre-registration + verdict); `out/` aggregates.

**Interfaces:**
- Consumes: Task 10's scorer; Tasks 5–6; lane containers with Claude/Gemini auth (Claude: `ANTHROPIC_API_KEY`; Gemini: `GEMINI_API_KEY` — see `superpowers/evals/README.md` and `coding-agents/*-context/HOWTO.md`).
- Produces: T4 layer-3 verdict (the cross-harness regression evidence the T4 PR requires).

- [ ] **Step 1: Port the scenarios** — copy each `cx-ceremony-*`, retarget the agents line, review `setup.sh`/`checks.sh` for codex-isms (post-checks must stay behavior-neutral). `bun run quorum check` (in the lane's evals checkout) must pass.

- [ ] **Step 2: Pre-register** — matrix: {dev, fix} arms × {claude, gemini} × 3 scenarios × 3 reps = 36 runs (~$40–80; Claude/Gemini runs are the cheap side). Criteria: (a) per-cell gauntlet pass rate fix ≥ dev; (b) fix-arm arch cells keep `spec_docs_written ≥ 1` and `writing_plans_invoked` 3/3; (c) fix-arm bounded cells show `spec_docs_written = 0` and `writing_plans_invoked = false`; (d) dev-arm bounded behavior recorded as the baseline (expected: two-doc ritual). Commit.

- [ ] **Step 3: Smoke test** — 1 rep per harness (2 runs) before the matrix.

- [ ] **Step 4: Run the matrix across both lanes; score with `score_t4_regression.py`; manually inspect one trajectory per harness per arm.**

- [ ] **Step 5: Verdict entry** — versus criteria; ledger row; sweep; commit scenarios + aggregates + log.

---

### Task 12: Triggering acceptance check (all three harnesses)

**Files:**
- Modify: log (pre-registration + verdict).

**Interfaces:**
- Consumes: `/tmp/sp-arm-fix`; the containerized triggering approach (host runs are confounded — `superpowers-autoresearch` docs and `scripts/evals-container`).
- Produces: the "brainstorming still auto-triggers" evidence line every T4 PR cites.

- [ ] **Step 1: Pre-register** — prompt: exactly `Let's make a react todo list`; fix arm; 3 reps × {codex, claude, gemini}; criterion: brainstorming loads before any implementation action AND the session heads down the architectural path (new project), 3/3 per harness. Commit.

- [ ] **Step 2: Run** — containerized, per the campaign's triggering method; verify skill load from transcripts/rollouts by hand.

- [ ] **Step 3: Verdict entry; sweep; commit.**

---

### Task 13: Cut the treatment PRs

**Files:**
- Create: five branches `fix/t1-sdd-no-worker-reviewers`, `fix/t3-codex-tools-corrections`, `fix/t2-codex-event-waits`, `fix/t5-codex-spawn-routing`, `fix/t4-brainstorming-three-paths`, each cherry-picked from `codex-efficiency-fixes` onto `origin/dev`
- Create: PR body files under the SDD workspace (drafted from `.github/PULL_REQUEST_TEMPLATE.md`)

**Interfaces:**
- Consumes: verdicts from Tasks 7–12; only treatments whose criteria PASSED get a PR.
- Produces: pushed branches + draft PR bodies. **STOP before opening PRs: present the PR set (diffs + bodies + verdict table) to Jesse. PRs open only on his go; merges are his.**

- [ ] **Step 1:** For each passing treatment: branch off `origin/dev`, cherry-pick its commit(s), verify `git diff` matches the treatment's slice of the fix branch.
- [ ] **Step 2:** Draft each PR body: full template, identification block (model, harness, plugins), problem statement from the campaign evidence, eval results from the log's verdict entries, related-PR section citing #2036/#2035 as prior art NOT adopted (and why), merge-order note on the codex-tools trio (T3 → T2 → T5).
- [ ] **Step 3:** Push branches. Present everything to Jesse and STOP.

---

### Task 14: Campaign closeout

**Files:**
- Modify: `superpowers-autoresearch/logs/2026-07-30-codex-efficiency-fixes.md` (closing summary + final ledger)
- Create: `superpowers-autoresearch/reports/2026-07-codex-efficiency-fix-cycle.md` (verdict table: five treatments × criterion × result × PR link; phase-2 queue restated with what each item still needs)

**Interfaces:**
- Consumes: everything above.
- Produces: the record phase 2 starts from.

- [ ] **Step 1:** Write the report; totals in the ledger; note any criterion that failed and what was NOT shipped as a result.
- [ ] **Step 2:** Privacy sweep; commit; push autoresearch main (authorized).

---

## Amendment 1 (2026-07-30, Jesse-approved after the first shared battery)

The first shared SDD battery (Task 8, n=6) returned FAIL on T1/T2/T5. Root
causes and approved responses: (a) the no-subagents contract reached only
implementer-prompt.md — the final reviewer spawned two sub-reviewers
(T1's miss, and both of T5's); extend the contract to every dispatched
role. (b) Docs-only wait guidance in codex-tools.md produced no behavior
change (65.1% vs 67.1% baseline timeouts); move the wait discipline into
the SDD controller text. Then re-run the battery.

### Task 15: T1-ext — no-subagents contract in all reviewer templates

**Files:**
- Modify: `skills/subagent-driven-development/task-reviewer-prompt.md`
- Modify: `skills/subagent-driven-development/re-review-prompt.md`
- Modify: `skills/requesting-code-review/code-reviewer.md`

**Interfaces:**
- Consumes: Task 1's implementer-prompt contract (same intent, reviewer flavor).
- Produces: commit `fix(sdd): reviewers never dispatch subagents either` — joins the T1 PR with Task 1's commit.

- [ ] **Step 1: Insert the reviewer-flavor section into both SDD reviewer templates**

In `skills/subagent-driven-development/task-reviewer-prompt.md`, immediately after the paragraph ending `Do not mutate the working
    tree, the index, HEAD, or branch state in any way.` and before `    ## Do Not Trust the Report`, insert (4-space body indent):

```
    ## You Do Not Dispatch Subagents

    Do all of this review yourself. Never spawn a subagent to review part
    of the diff, and never spawn another reviewer for a second opinion.
    This process already provides every review seat the work gets; a
    reviewer you spawn duplicates one of them at full cost, and its
    verdict counts for nothing. If the diff feels too large for one
    pass, review it in passes yourself and say so in your report.
```

In `skills/subagent-driven-development/re-review-prompt.md`, insert the SAME block immediately after the identical read-only paragraph and before `    ## Scope`.

- [ ] **Step 2: Insert into code-reviewer.md**

In `skills/requesting-code-review/code-reviewer.md`, immediately after the `## Read-Only Review` section's paragraph and before `    ## What to Check`, insert the SAME block (matching that template's body indent).

- [ ] **Step 3: Verify**

`grep -c "You Do Not Dispatch Subagents" skills/subagent-driven-development/task-reviewer-prompt.md skills/subagent-driven-development/re-review-prompt.md skills/requesting-code-review/code-reviewer.md` → each file reports `1`.

- [ ] **Step 4: Commit**

```bash
git add skills/subagent-driven-development/task-reviewer-prompt.md skills/subagent-driven-development/re-review-prompt.md skills/requesting-code-review/code-reviewer.md
git commit -m "fix(sdd): reviewers never dispatch subagents either

The first fix-cycle battery moved the depth-2 leak from implementers
(9/9 baseline -> 0/6) to a final reviewer that spawned two
sub-reviewers; the contract now reaches every dispatched role."
```

### Task 16: T2-strong — wait discipline in the SDD controller text

**Files:**
- Modify: `skills/subagent-driven-development/SKILL.md`

**Interfaces:**
- Consumes: nothing new.
- Produces: commit `fix(sdd): controllers wait long or not at all` — joins the T2 PR.

- [ ] **Step 1: Insert the wait-discipline paragraph**

In `skills/subagent-driven-development/SKILL.md`, in `## The Task Loop`, immediately after the paragraph ending `Hand artifacts over as files.` insert:

```
**Waiting on dispatched subagents:** never poll a wait interface with
short timeouts. While you have local work — ledger updates, packaging
the next review, reading reports — keep working; child results arrive
on their own. Wait only when you are genuinely idle, and then issue one
long wait (fifteen minutes or more, where your platform allows it)
instead of many short ones: a long wait wakes just as fast and costs
one call instead of dozens.
```

- [ ] **Step 2: Verify**

`grep -c "Waiting on dispatched subagents" skills/subagent-driven-development/SKILL.md` → `1`.

- [ ] **Step 3: Commit**

```bash
git add skills/subagent-driven-development/SKILL.md
git commit -m "fix(sdd): controllers wait long or not at all

Docs-only wait guidance in the platform reference changed nothing
(65.1% vs 67.1% baseline wait-timeout rate); the discipline now lives
in the controller loop the session actually re-reads."
```

### Task 8b: re-run the shared SDD battery

Repeat Task 8 exactly (same scenario, criteria, scorers, n=8, both lanes)
against a refreshed `/tmp/sp-arm-fix` containing Tasks 15-16. New
pre-registration entry required (new arm SHA). Blocked until Docker is
restored. The Task 8 n=6 battery remains in the log as the round-1
result; 8b's entries are additions, not corrections.

---

## Amendment 2 (2026-07-30, after battery round 2 and the ceremony battery)

Round-2 findings driving this amendment: (a) T2's long-wait fix eliminated
wait timeouts (65.1%→0.0%) but produced 20-38 min silent transcripts that
starve graders/humans and let one child in 51 vanish unnoticed — Jesse
chose bounded waits + reconcile; (b) T4's bounded path killed the doc
ritual (0 docs vs 2/rep dev baseline) but 2/3 bounded reps implemented
BEFORE any approval — the router's approval invariant needs teeth (this
enforces the variant-C invariant Jesse selected, so it proceeds without a
new design decision).

### Task 17: T2 round 3 — bounded waits + reconcile

**Files:**
- Modify: `skills/subagent-driven-development/SKILL.md` (replace Task 16's paragraph)
- Modify: `skills/using-superpowers/references/codex-tools.md` (revise two bullets of `## Waiting on children`)

- [ ] **Step 1: Replace the SKILL.md wait paragraph**

Replace the entire paragraph beginning `**Waiting on dispatched subagents:**` (Task 16's insertion) with:

```
**Waiting on dispatched subagents:** never poll a wait interface with
short timeouts, and never sit in one silent, open-ended wait either.
While you have local work — ledger updates, packaging the next review,
reading reports — keep working; child results arrive on their own.
When you are genuinely idle, wait in bounded stretches (five to ten
minutes, where your platform allows), and between stretches post one
line of status and reconcile your live children: list them, and chase
any that finished without reporting. A bounded stretch keeps nearly
all of a long wait's efficiency while guaranteeing a stuck or lost
child is noticed within minutes, not at the end of the session.
```

- [ ] **Step 2: Revise codex-tools.md's waiting bullets**

In `## Waiting on children`, replace the second bullet (`- When you are genuinely idle with children outstanding, issue ONE ... let the event wake you.`) with:

```
- When you are genuinely idle with children outstanding, wait in
  bounded stretches: `wait_agent` with `timeout_ms` 300000-600000
  (5-10 minutes). After each stretch — wake or timeout — post one
  status line, run `list_agents`, and chase any child that finished
  without reporting. Never stack polls shorter than five minutes; the
  event subscription wakes a bounded stretch just as fast as a short
  one.
```

and replace the third bullet (`- Completion mail cannot wake an idle controller ... do not fall back to short polls.`) with:

```
- Completion mail cannot wake an idle controller (it is delivered
  without triggering a turn); covering that idle window is
  `wait_agent`'s only job. A stretch that times out with no activity
  is your cue to reconcile, not to shorten the next stretch.
```

- [ ] **Step 3: Verify** — `grep -c "bounded stretches" skills/subagent-driven-development/SKILL.md skills/using-superpowers/references/codex-tools.md` → 1 and 1; `grep -c "900000" skills/using-superpowers/references/codex-tools.md` → 0.

- [ ] **Step 4: Commit**

```bash
git add skills/subagent-driven-development/SKILL.md skills/using-superpowers/references/codex-tools.md
git commit -m "fix(sdd,codex): bounded wait stretches with reconciliation

Round 2 proved the long-wait mechanism (65.1%->0.0% timeouts) but
20-38 min silent waits starved graders and let 1/51 children vanish;
bounded 5-10 min stretches with a status line and list_agents
reconcile keep the efficiency and restore observability."
```

### Task 18: T4 round 2 — approval-gate teeth on the bounded path

**Files:**
- Modify: `skills/brainstorming/SKILL.md`

- [ ] **Step 1: Strengthen the bounded bullet in `## Three Paths`**

Replace the sentence `Ask the clarifying
  questions that matter, present a short design IN CHAT (a few
  sentences to a few short paragraphs), and get approval. No spec
  file, no implementation plan document.` with:

```
Ask the clarifying
  questions that matter, present a short design IN CHAT (a few
  sentences to a few short paragraphs), and STOP. Implementation
  starts only after your human partner says yes to that design — a
  bounded task's approval is as hard a gate as an architectural
  one. No spec file, no implementation plan document.
```

- [ ] **Step 2: Strengthen Bounded checklist item 4**

Replace `4. **Get approval** — explicit, before any implementation` with:

```
4. **Get approval** — STOP and wait for an explicit yes; presenting the design and starting in the same breath is skipping the gate
```

- [ ] **Step 3: Add a Red Flags row**

After the row `| "I'll call it bounded and skip the spec" | ... |` add:

```
| "It's bounded and the design is obvious — I'll start while they read it" | The gate is the approval, not the design's length. Present, then stop until you hear yes. |
```

- [ ] **Step 4: Verify** — `grep -c "as hard a gate" skills/brainstorming/SKILL.md` → 1; `grep -c "start while they read it" skills/brainstorming/SKILL.md` → 1; frontmatter untouched (`git diff HEAD -- skills/brainstorming/SKILL.md` shows no frontmatter hunk after the edit vs prior commit).

- [ ] **Step 5: Commit**

```bash
git add skills/brainstorming/SKILL.md
git commit -m "fix(brainstorming): bounded-path approval is a hard stop

Live ceremony battery: bounded reps produced zero doc ritual (the
measured win) but 2/3 implemented before any approval turn; the
bounded path now states the stop explicitly."
```

### Task 8c: shared SDD battery round 3

Repeat Task 8b (new pre-registration, refreshed arm, n=8, same criteria)
after Tasks 17-18. T2's clause under test: no completion loss AND
timeout rate < 25%, now with bounded stretches. T1/T5 re-verified as
regression guards on the same runs.

### Task 9b: ceremony battery round 2 (bounded focus)

After Tasks 17-18 and arm refresh: bounded 3 reps + arch 3 reps + spike
1 smoke rep (spike text untouched; the shared Red Flags row is the only
common edit). Criteria: bounded — 0 ceremony docs AND strict
pre-implementation approval 3/3; arch — two-doc flow 3/3 with
completion (pre-register a quorum_max_time bump for the arch scenario,
disclosed as a scenario-budget accommodation mirroring the round-2
silent-wait finding, not a treatment change); spike — smoke healthy.

---

## Amendment 3 (2026-07-30, Jesse: prefer non-blocking subscriptions)

### Task 19: wait guidance — non-blocking delivery preferred

**Files:**
- Modify: `skills/subagent-driven-development/SKILL.md` (one sentence added inside the wait paragraph)

- [ ] **Step 1: Insert the preference sentence**

In the `**Waiting on dispatched subagents:**` paragraph, immediately after the sentence ending `child results arrive
on their own.` insert:

```
Prefer non-blocking delivery wherever your platform offers it —
completion notifications, results pushed into your next turn — and
treat blocking waits as the fallback for platforms (or idle moments)
that cannot wake you otherwise.
```

(The following sentence `When you are genuinely idle, wait in bounded
stretches...` continues the paragraph unchanged.)

- [ ] **Step 2: Verify** — `grep -c "non-blocking delivery" skills/subagent-driven-development/SKILL.md` → 1.

- [ ] **Step 3: Commit**

```bash
git add skills/subagent-driven-development/SKILL.md
git commit -m "fix(sdd): prefer non-blocking child-result delivery over any wait

Blocking waits are the fallback for platforms that cannot wake an
idle controller, not the default; harnesses with completion
notifications never need to block at all."
```

Grading note (pre-registered here): no codex behavioral delta is
expected — codex V2 cannot wake an idle controller, so the preference
ladder collapses to the already-graded bounded-stretch text there; the
sentence is additive for notification-capable harnesses. Round 3
grades 6faceb2; the T2 PR discloses this post-battery clarification
explicitly.

---

## Amendment 4 (2026-07-31, after the triggering check)

Task 12 findings: gemini routes a new project architectural 3/3; claude
triggers brainstorming 3/3 but self-classifies the new project "bounded"
3/3 through the bounded bullet's "existing, understood flow" wording
("understood" read as familiarity with the app genre, not presence of
code in the repo); codex leg blocked on exhausted subscription credits.
Jesse's rulings: tighten the bounded wording and re-run; he will
provision an OPENAI_API_KEY so the codex leg can run before the T4 PR.

### Task 20: router tightening — bounded measures the repo

**Files:**
- Modify: `skills/brainstorming/SKILL.md`

- [ ] **Step 1: Tighten the bounded bullet's definition**

In `## Three Paths`, replace the bounded bullet's opening `- **Bounded** — a well-scoped change to an existing, understood flow: a
  new flag, a small endpoint, a one-file fix.` with:

```
- **Bounded** — a well-scoped change to code that already exists in
  this repo: a new flag, a small endpoint, a one-file fix.
  Understanding the kind of app is not enough — bounded means the flow
  you are changing is already here to read. If there is no existing
  flow to change, the task is not bounded.
```

(The rest of the bullet — `Ask the clarifying questions that matter...` — continues unchanged.)

- [ ] **Step 2: Add the familiarity Red Flags row**

After the row `| "It's bounded and the design is obvious — I'll start while they read it" | ... |` add:

```
| "I understand this kind of app, so it's bounded" | Bounded measures the repo, not your familiarity. A new project has no existing flow — it is architectural. |
```

- [ ] **Step 3: Verify** — `grep -c "already here to read" skills/brainstorming/SKILL.md` → 1; `grep -c "measures the repo" skills/brainstorming/SKILL.md` → 1; frontmatter untouched.

- [ ] **Step 4: Commit**

```bash
git add skills/brainstorming/SKILL.md
git commit -m "fix(brainstorming): bounded means existing code in this repo, not a familiar app genre

Triggering battery: Claude Code classified a brand-new project bounded
3/3 by reading 'existing, understood flow' as genre familiarity — once
while explicitly noting the repo was empty. Gemini routed the same
prompt architectural 3/3."
```

### Task 12b: triggering re-run (claude + gemini) and codex leg

After Task 20 and arm refresh: claude 3 reps + gemini 1 smoke rep on
`triggering-react-todo`; criteria: claude — brainstorming loads before
implementation AND architectural classification 3/3; gemini smoke stays
architectural. New pre-registration; same detection and hand-verification
method as Task 12. The codex leg (3 reps, same criteria) runs once
Jesse's OPENAI_API_KEY lands: add a `codex_api` credential entry to the
evals `credentials.yaml` (api_key_env: OPENAI_API_KEY, harnesses:
[codex]) if the codex adapter supports API-key auth — verify the
adapter's auth modes first; if it is subscription-only, report BLOCKED
with specifics instead of forcing it.
