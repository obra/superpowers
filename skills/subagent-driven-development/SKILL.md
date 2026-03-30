---
name: subagent-driven-development
description: Use when executing an engineering-approved FeatureForge implementation plan with mostly independent tasks in the current session
---
<!-- AUTO-GENERATED from SKILL.md.tmpl — do not edit directly -->
<!-- Regenerate: node scripts/gen-skill-docs.mjs -->

## Preamble (run first)

```bash
_REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
_BRANCH_RAW=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo current)
[ -n "$_BRANCH_RAW" ] || _BRANCH_RAW="current"
[ "$_BRANCH_RAW" != "HEAD" ] || _BRANCH_RAW="current"
_BRANCH="$_BRANCH_RAW"
_FEATUREFORGE_INSTALL_ROOT="$HOME/.featureforge/install"
_FEATUREFORGE_ROOT=""
_FEATUREFORGE_BIN="$_FEATUREFORGE_INSTALL_ROOT/bin/featureforge"
if [ ! -x "$_FEATUREFORGE_BIN" ] && [ -f "$_FEATUREFORGE_INSTALL_ROOT/bin/featureforge.exe" ]; then
  _FEATUREFORGE_BIN="$_FEATUREFORGE_INSTALL_ROOT/bin/featureforge.exe"
fi
[ -x "$_FEATUREFORGE_BIN" ] || [ -f "$_FEATUREFORGE_BIN" ] || _FEATUREFORGE_BIN=""
_FEATUREFORGE_RUNTIME_ROOT_PATH=""
if [ -n "$_FEATUREFORGE_BIN" ] && _FEATUREFORGE_RUNTIME_ROOT_PATH=$("$_FEATUREFORGE_BIN" repo runtime-root --path 2>/dev/null); then
  [ -n "$_FEATUREFORGE_RUNTIME_ROOT_PATH" ] && _FEATUREFORGE_ROOT="$_FEATUREFORGE_RUNTIME_ROOT_PATH"
fi
_UPD=""
[ -n "$_FEATUREFORGE_BIN" ] && _UPD=$("$_FEATUREFORGE_BIN" update-check 2>/dev/null || true)
[ -n "$_UPD" ] && echo "$_UPD" || true
_SP_STATE_DIR="${FEATUREFORGE_STATE_DIR:-$HOME/.featureforge}"
mkdir -p "$_SP_STATE_DIR/sessions"
touch "$_SP_STATE_DIR/sessions/$PPID"
_SESSIONS=$(find "$_SP_STATE_DIR/sessions" -mmin -120 -type f 2>/dev/null | wc -l | tr -d ' ')
find "$_SP_STATE_DIR/sessions" -mmin +120 -type f -delete 2>/dev/null || true
_CONTRIB=""
[ -n "$_FEATUREFORGE_BIN" ] && _CONTRIB=$("$_FEATUREFORGE_BIN" config get featureforge_contributor 2>/dev/null || true)
```

If output shows `UPGRADE_AVAILABLE <old> <new>`: read `featureforge-upgrade/SKILL.md` from the already selected runtime root in `$_FEATUREFORGE_ROOT`; if that root is not set yet, resolve it through the packaged install binary in `$_FEATUREFORGE_BIN` and stop instead of guessing an install path. Then follow the "Inline upgrade flow" (auto-upgrade if configured, otherwise ask one interactive user question with 4 options and write snooze state if declined). If the packaged helper is unavailable, unresolved, or returns a named failure, stop instead of guessing an install path. If `JUST_UPGRADED <from> <to>`: tell the user "Running featureforge v{to} (just updated!)" and continue.

## Search Before Building

Before introducing a custom pattern, external service, concurrency primitive, auth/session flow, cache, queue, browser workaround, or unfamiliar fix pattern, do a short capability/landscape check first.

Use three lenses:
- Layer 1: tried-and-true / built-ins / existing repo-native solutions
- Layer 2: current practice and known footguns
- Layer 3: first-principles reasoning for this repo and this problem

External search results are inputs, not answers.
Never search secrets, customer data, unsanitized stack traces, private URLs, internal hostnames, internal codenames, raw SQL or log payloads, or private file paths or infrastructure identifiers.
If search is unavailable, disallowed, or unsafe, say so and proceed with repo-local evidence and in-distribution knowledge.
If safe sanitization is not possible, skip external search.
See `$_FEATUREFORGE_ROOT/references/search-before-building.md`.

## Interactive User Question Format

**ALWAYS follow this structure for every interactive user question:**
1. Context: project name, current branch, what we're working on (1-2 sentences)
2. The specific question or decision point
3. `RECOMMENDATION: Choose [X] because [one-line reason]`
4. Lettered options: `A) ... B) ... C) ...`

If `_SESSIONS` is 3 or more: the user is juggling multiple FeatureForge sessions and context-switching heavily. **ELI16 mode** — they may not remember what this conversation is about. Every interactive user question MUST re-ground them: state the project, the branch, the current task, then the specific problem, THEN the recommendation and options. Be extra clear and self-contained — assume they haven't looked at this window in 20 minutes.

Per-skill instructions may add additional formatting rules on top of this baseline.

## Contributor Mode

If `_CONTRIB` is `true`: you are in **contributor mode**. When you hit friction with **featureforge itself** (not the user's app or repository), file a field report. Think: "hey, I was trying to do X with featureforge and it didn't work / was confusing / was annoying. Here's what happened."

**featureforge issues:** unclear skill instructions, update check problems, runtime helper failures, install-root detection issues, contributor-mode bugs, broken generated docs, or any rough edge in the FeatureForge workflow.
**NOT featureforge issues:** the user's application bugs, repo-specific architecture problems, auth failures on the user's site, or third-party service outages unrelated to FeatureForge tooling.

**To file:** write `~/.featureforge/contributor-logs/{slug}.md` with this structure:

```
# {Title}

Hey featureforge team — ran into this while using /{skill-name}:

**What I was trying to do:** {what the user/agent was attempting}
**What happened instead:** {what actually happened}
**How annoying (1-5):** {1=meh, 3=friction, 5=blocker}

## Steps to reproduce
1. {step}

## Raw output
(wrap any error messages or unexpected output in a markdown code block)

**Date:** {YYYY-MM-DD} | **Version:** {featureforge version} | **Skill:** /{skill}
```

Then run:

```bash
mkdir -p ~/.featureforge/contributor-logs
if command -v open >/dev/null 2>&1; then
  open ~/.featureforge/contributor-logs/{slug}.md
elif command -v xdg-open >/dev/null 2>&1; then
  xdg-open ~/.featureforge/contributor-logs/{slug}.md >/dev/null 2>&1 || true
fi
```

Slug: lowercase, hyphens, max 60 chars (for example `skill-trigger-missed`). Skip if the file already exists. Max 3 reports per session. File inline and continue — don't stop the workflow. Tell the user: "Filed featureforge field report: {title}"


# Subagent-Driven Development

Execute plan by dispatching a fresh sub-agent or custom agent per task, with two-stage review after each (spec compliance first, then code quality), then task-scoped verification-before-completion before any next-task advancement. The runtime-selected topology still wins: when it chooses worktree-backed parallel execution, follow the worktree-first orchestration model and keep each task in its isolated workspace.

**Why isolated agents:** You delegate tasks to specialized agents with isolated context. By precisely crafting their instructions and context, you ensure they stay focused and succeed at their task. They should never inherit your session's context or history — you construct exactly what they need. This also preserves your own context for coordination work.

**Core principle:** Fresh isolated agent per task + two-stage review (spec then quality) = high quality, fast iteration

**Platform note:** Current Codex releases enable subagent workflows by default, so this skill does not require a separate `multi_agent` feature flag. In Codex, prefer the built-in `worker` agent for implementation and fix tasks, the built-in `explorer` agent for read-heavy review and codebase analysis, and project or personal `.codex/agents/*.toml` custom agents only when the built-ins do not fit. FeatureForge installs a `code-reviewer` custom agent for Codex review passes. In GitHub Copilot local installs, use the platform's native custom-agent or sub-agent support.

## Nested Session Marker

When you dispatch a child that will start a fresh FeatureForge conversation, set `FEATUREFORGE_SPAWNED_SUBAGENT=1` in the child environment so the runtime bypasses first-turn bootstrap by default for that nested context. Add `FEATUREFORGE_SPAWNED_SUBAGENT_OPT_IN=1` only when you intentionally want the nested child to re-enter FeatureForge and allow the runtime to persist an enabled decision.

## When to Use

```dot
digraph when_to_use {
    "Have engineering-approved implementation plan?" [shape=diamond];
    "Tasks mostly independent?" [shape=diamond];
    "Stay in this session?" [shape=diamond];
    "subagent-driven-development" [shape=box];
    "executing-plans" [shape=box];
    "Return to using-featureforge artifact-state routing" [shape=box];

    "Have engineering-approved implementation plan?" -> "Tasks mostly independent?" [label="yes"];
    "Have engineering-approved implementation plan?" -> "Return to using-featureforge artifact-state routing" [label="no"];
    "Tasks mostly independent?" -> "Stay in this session?" [label="yes"];
    "Tasks mostly independent?" -> "executing-plans" [label="no - tightly coupled or better handled in one coordinator session"];
    "Stay in this session?" -> "subagent-driven-development" [label="yes"];
    "Stay in this session?" -> "executing-plans" [label="no - parallel session"];
}
```

**vs. Executing Plans (parallel session):**
- Same session (no context switch)
- Fresh isolated agent per task (no context pollution)
- Two-stage review after each task: spec compliance first, then code quality
- Faster iteration (no human-in-loop between tasks)

## The Process

### Task-Boundary Closure Loop (Mandatory)

For each task, enforce this exact order before dispatching the next task:
1. Complete the task's implementation steps.
2. MUST dispatch dedicated-independent fresh-context task review loops (spec compliance, then code quality); implementer or coordinator self-review never satisfies this gate.
3. If review fails, reopen/remediate/re-review until green.
4. When remediation churn reaches 3 cycles for the same task, follow runtime cycle-break handling before retry.
5. After review is green, run `verification-before-completion` and persist the task verification receipt.
6. Only then dispatch implementation for Task `N+1`.

```dot
digraph process {
    rankdir=TB;

    subgraph cluster_per_task {
        label="Per Task";
        "Build task packet + dispatch implementer subagent (./implementer-prompt.md)" [shape=box];
        "Implementer subagent asks questions?" [shape=diamond];
        "Answer from packet or escalate ambiguity" [shape=box];
        "Implementer subagent implements, tests, self-reviews, prepares handoff" [shape=box];
        "Dispatch spec reviewer subagent (./spec-reviewer-prompt.md)" [shape=box];
        "Spec reviewer subagent confirms code matches spec?" [shape=diamond];
        "Implementer subagent fixes spec gaps" [shape=box];
        "Dispatch code quality reviewer subagent (./code-quality-reviewer-prompt.md)" [shape=box];
        "Code quality reviewer subagent approves?" [shape=diamond];
        "Implementer subagent fixes quality issues" [shape=box];
        "Run verification-before-completion, record task verification receipt, and confirm task plan steps are checked off" [shape=box];
    }

    "Read plan, build a task packet per task" [shape=box];
    "More tasks remain?" [shape=diamond];
    "Use featureforge:requesting-code-review for final review gate" [shape=box];
    "Use featureforge:finishing-a-development-branch" [shape=box style=filled fillcolor=lightgreen];

    "Read plan, build a task packet per task" -> "Build task packet + dispatch implementer subagent (./implementer-prompt.md)";
    "Build task packet + dispatch implementer subagent (./implementer-prompt.md)" -> "Implementer subagent asks questions?";
    "Implementer subagent asks questions?" -> "Answer from packet or escalate ambiguity" [label="yes"];
    "Answer from packet or escalate ambiguity" -> "Build task packet + dispatch implementer subagent (./implementer-prompt.md)";
    "Implementer subagent asks questions?" -> "Implementer subagent implements, tests, self-reviews, prepares handoff" [label="no"];
    "Implementer subagent implements, tests, self-reviews, prepares handoff" -> "Dispatch spec reviewer subagent (./spec-reviewer-prompt.md)";
    "Dispatch spec reviewer subagent (./spec-reviewer-prompt.md)" -> "Spec reviewer subagent confirms code matches spec?";
    "Spec reviewer subagent confirms code matches spec?" -> "Implementer subagent fixes spec gaps" [label="no"];
    "Implementer subagent fixes spec gaps" -> "Dispatch spec reviewer subagent (./spec-reviewer-prompt.md)" [label="re-review"];
    "Spec reviewer subagent confirms code matches spec?" -> "Dispatch code quality reviewer subagent (./code-quality-reviewer-prompt.md)" [label="yes"];
    "Dispatch code quality reviewer subagent (./code-quality-reviewer-prompt.md)" -> "Code quality reviewer subagent approves?";
    "Code quality reviewer subagent approves?" -> "Implementer subagent fixes quality issues" [label="no"];
    "Implementer subagent fixes quality issues" -> "Dispatch code quality reviewer subagent (./code-quality-reviewer-prompt.md)" [label="re-review"];
    "Code quality reviewer subagent approves?" -> "Run verification-before-completion, record task verification receipt, and confirm task plan steps are checked off" [label="yes"];
    "Run verification-before-completion, record task verification receipt, and confirm task plan steps are checked off" -> "More tasks remain?";
    "More tasks remain?" -> "Build task packet + dispatch implementer subagent (./implementer-prompt.md)" [label="yes"];
    "More tasks remain?" -> "Use featureforge:requesting-code-review for final review gate" [label="no"];
    "Use featureforge:requesting-code-review for final review gate" -> "Use featureforge:finishing-a-development-branch";
}
```

## Implementation Preflight

Before dispatching any implementation subagent:

1. Require the exact approved plan path as input. If you are not given one, stop and ask for it or route back to `featureforge:plan-eng-review`.
2. Read that plan first and confirm these exact header lines:
   - `**Workflow State:** Engineering Approved`
   - `**Source Spec:** <path>`
   - `**Source Spec Revision:** <integer>`
3. Read the source spec named in the plan and confirm it is still `CEO Approved`, and that the latest approved spec still matches that exact source-spec path and revision.
4. Stop immediately and redirect:
   - to `featureforge:plan-eng-review` if the plan is draft or malformed
   - to `featureforge:writing-plans` if the source spec path or revision is stale
5. Verify workspace readiness before dispatching subagents:
   - stop on a default protected branch (`main`, `master`, `dev`, or `develop`) unless the user explicitly approves in-place execution
   - stop on detached HEAD
   - stop if merge conflicts, unresolved index entries, rebase, or cherry-pick state is present
   - if the working tree is dirty, stop unless the helper-selected topology and workspace-prepared context explicitly support isolated worktree-backed execution for this run
6. Do not auto-clean the workspace. If the helper-selected topology or protected-branch gate requires isolated execution, provision or route through a worktree-backed workspace before dispatching repo-writing subagents.
7. The later repo-safety checks still govern any additional protected branches declared through repo or user instructions.
8. Run `featureforge plan execution preflight --plan <approved-plan-path>` before dispatching implementation subagents.
9. If the preflight helper returns `allowed` `false`, stop and resolve the reported `failure_class`, `reason_codes`, and `diagnostics` before dispatching work.
10. Treat execution start as a hard gate, not a reminder:
   - no code edits and no test edits are allowed after successful preflight and before the first `begin` for the active step
   - do not dispatch implementation subagents for repo-writing work until that first `begin` is recorded
   - if the workspace becomes dirty before the first `begin`, expect later preflight retries to fail closed (for example `tracked_worktree_dirty`) until the workspace is reconciled or isolated
   - retroactive execution tracking is recovery-only and must never be treated as the normal execution path
   - five-step recovery runbook for dirty-before-begin failures:
     1. reconcile or isolate the workspace
     2. rerun preflight and confirm fresh acceptance for the current approved plan revision
     3. read helper-backed `status` before any recovery mutation
     4. backfill only factual-only completed steps using authoritative helper mutations; never infer completion from dirty diffs
     5. resume from the task-boundary review and verification gate before any next-task `begin`

## Helper-Owned Execution State

- calls `status --plan ...` during preflight
- calls `preflight --plan ...` before dispatching implementation subagents
- calls `begin` before starting work on a plan step
- calls `complete` after each completed step
- calls `note` when work is interrupted or blocked
- On the first `begin` for a revision whose plan still says `**Execution Mode:** none`, initialize execution with `--execution-mode featureforge:subagent-driven-development`
- The approved plan checklist is the execution progress record; do not create or maintain a separate authoritative task tracker.

## Runtime Strategy Checkpoints (Automatic, Runtime-Owned)

- Runtime strategy checkpoints are execution-owned state, not workflow-stage transitions. Keep public workflow phase in execution (`executing` or `repairing`) while strategy checkpoints change.
- The approved plan/spec scope is fixed during execution. Runtime strategy checkpoints may change topology, lane/worktree allocation, subagent assignment, and remediation order, but must not change approved scope, source plan revision, or required coverage.
- Required checkpoint kinds:
  - `initial_dispatch`: required before repo-writing implementation starts. Runtime records it automatically on first dispatch/begin when missing.
  - `review_remediation`: required after actionable independent-review findings and before remediation starts. Runtime records it automatically for each `gate-review` dispatch that targets reviewable execution work and when remediation reopens execution work.
  - `cycle_break`: required when churn is detected. Runtime records it automatically when the same task hits three review-dispatch/reopen cycles in one run.
- Cycle-break trigger: cap remediation churn at 3 cycles per task. On the third cycle, transition to `cycle_break` strategy automatically (no human replanning loopback).
- Unit-review receipts and downstream final-review evidence must reference the checkpoint fingerprint from the runtime status for traceability.
- Surface and respect runtime strategy status from `featureforge plan execution status --plan ...`:
  - `strategy_state`
  - `strategy_checkpoint_kind`
  - `last_strategy_checkpoint_fingerprint`
  - `strategy_reset_required`

## Execution-Phase Subagent Dispatch Policy

- Once execution is active for an approved plan (`execution_started` is `yes`), runtime-selected implementation and review subagent dispatch is authorized and does not require per-dispatch user-consent prompts.
- This authorization is limited to execution-phase dispatch performed by workflow-owned execution skills (`featureforge:executing-plans` and `featureforge:subagent-driven-development`).
- Non-execution ad-hoc delegation still follows normal user-consent policy.

## Authoritative Mutation Boundary (Coordinator/Runtime/Harness Owned)

- Task packets, candidate edits, and handoff notes are candidate artifacts. They are input context, not authoritative runtime mutation state.
- Implementer helpers/subagents must not directly invoke `record-contract`; the coordinator/runtime/harness owns this authoritative mutation command.
- Implementer helpers/subagents must not directly invoke `record-evaluation`; the coordinator/runtime/harness owns this authoritative mutation command.
- Implementer helpers/subagents must not directly invoke `record-handoff`; the coordinator/runtime/harness owns this authoritative mutation command.
- Implementer helpers/subagents must not directly invoke `begin`; the coordinator/runtime helper owns this authoritative execution-state mutation.
- Implementer helpers/subagents must not directly invoke `note`; the coordinator/runtime helper owns this authoritative execution-state mutation.
- Implementer helpers/subagents must not directly invoke `complete`; the coordinator/runtime helper owns this authoritative execution-state mutation.
- Implementer helpers/subagents must not directly invoke `reopen`; the coordinator/runtime helper owns this authoritative execution-state mutation.
- Implementer helpers/subagents must not directly invoke `transfer`; the coordinator/runtime helper owns this authoritative execution-state mutation.
- If packet context conflicts with helper-reported execution state, fail closed and defer to coordinator-owned runtime checks instead of mutating state directly.

## Protected-Branch Repo-Write Gate

The main agent owns the protected-branch gate for every repo-writing task slice, even when an implementer subagent does the coding.
The coordinator owns every `git commit`, `git merge`, and `git push` for this workflow, even when an implementer subagent does the coding.

Before dispatching or applying any repo-writing task slice, run the shared repo-safety preflight for that exact scope:

```bash
featureforge repo-safety check --intent write --stage featureforge:subagent-driven-development --task-id <current-task-slice> --path <repo-relative-path> --write-target execution-task-slice
```

- Use one stable task id per repo-writing task slice and pass the concrete repo-relative paths when they are known.
- If the helper returns `allowed`, continue with that task slice.
- If it returns `blocked`, name the branch, the stage, and the blocking `failure_class`, then route to either a feature branch / `featureforge:using-git-worktrees` or explicit user approval for this exact task slice.
- If the user explicitly approves the protected-branch write, approve the full task-slice scope you intend to use on that branch, including the repo-relative paths and any follow-on git targets that are part of the same slice:

```bash
featureforge repo-safety approve --stage featureforge:subagent-driven-development --task-id <current-task-slice> --reason "<explicit user approval>" --path <repo-relative-path> --write-target execution-task-slice [--write-target git-commit] [--write-target git-merge] [--write-target git-push]
featureforge repo-safety check --intent write --stage featureforge:subagent-driven-development --task-id <current-task-slice> --path <repo-relative-path> --write-target execution-task-slice [--write-target git-commit] [--write-target git-merge] [--write-target git-push]
```

- Continue only if the re-check returns `allowed`.
- Before a coordinator-owned follow-on `git commit`, `git merge`, or `git push` on the same protected-branch task slice, re-run the gate with the same task id, the same repo-relative paths, and the same approved write-target set.
- If the protected-branch task scope changes, run a new `approve` plus full-scope `check` before continuing.
- Do not treat a worktree on `main`, `master`, `dev`, or `develop` as safe by itself; the branch must be non-protected or explicitly approved.

## Model Selection

Use the least powerful model that can handle each role to conserve cost and increase speed.

**Mechanical implementation tasks** (isolated functions, clear specs, 1-2 files): use a fast, cheap model. Most implementation tasks are mechanical when the plan is well-specified.

**Integration and judgment tasks** (multi-file coordination, pattern matching, debugging): use a standard model.

**Architecture, design, and review tasks**: use the most capable available model.

**Task complexity signals:**
- Touches 1-2 files with a complete spec → cheap model
- Touches multiple files with integration concerns → standard model
- Requires design judgment or broad codebase understanding → most capable model

**Codex role mapping:**
- Implementer → built-in `worker`
- Spec reviewer → built-in `explorer` for read-heavy passes, or `default` when the review needs broader judgment
- Code-quality reviewer → installed `code-reviewer` custom agent for the standard FeatureForge review flow
- Custom agent → only when you need task-specific instructions that the built-ins do not cover

## Handling Implementer Status

Implementer subagents report one of four statuses. Handle each appropriately:

**DONE:** Proceed to spec compliance review.

**DONE_WITH_CONCERNS:** The implementer completed the work but flagged doubts. Read the concerns before proceeding. If the concerns are about correctness or scope, address them before review. If they're observations (e.g., "this file is getting large"), note them and proceed to review.

**NEEDS_CONTEXT:** The implementer needs information that wasn't provided. Provide the missing context and re-dispatch.

If the question is already answered by the packet, answer directly from the packet. If the packet does not answer it, the task is ambiguous and execution must stop or route back to review.

**BLOCKED:** The implementer cannot complete the task. Assess the blocker:
1. If it's a context problem, provide more context and re-dispatch with the same model
2. If the task requires more reasoning, re-dispatch with a more capable model
3. If the task is too large, break it into smaller pieces
4. If the plan itself is wrong, escalate to the human

**Never** ignore an escalation or force the same model to retry without changes. If the implementer said it's stuck, something needs to change.

## Prompt Templates

- `./implementer-prompt.md` - Dispatch implementer subagent
- `./spec-reviewer-prompt.md` - Dispatch spec compliance reviewer subagent
- `./code-quality-reviewer-prompt.md` - Dispatch code quality reviewer subagent

## Packet Contract

- Build a task packet from the approved plan/spec pair before every implementation or review dispatch.
- pass the packet verbatim to implementer and reviewers.
- Treat packet content as the authoritative execution contract for that task slice; do not paraphrase or weaken requirement statements.
- Controllers may add transient logistics such as branch, working directory, or base commit, but they may not add new semantic requirements.
- If the packet does not answer it, the task is ambiguous and execution must stop or route back to review.

## Example Workflow

```
You: I'm using Subagent-Driven Development to execute this plan.

[Read plan file once: docs/featureforge/plans/feature-plan.md]
[Build the task packet for Task 1 from the approved plan/spec pair]
[Use the approved plan as the execution-progress record]

Task 1: Shared install migration docs

[Dispatch implementation subagent with the packet verbatim]

Implementer: "Before I begin - should the migration docs include both Unix shell and PowerShell commands?"

You: "The packet already requires both shells. Keep the shared install root at ~/.featureforge/install and document both shells."

Implementer: "Got it. Implementing now..."
[Later] Implementer:
  - Updated shared-root migration docs
  - Added tests, 5/5 passing
  - Self-review: Found I missed the PowerShell temp-clone cleanup, added it
  - Ready for coordinator-owned git actions

[Dispatch spec compliance reviewer]
Spec reviewer: ✅ Spec compliant - all requirements met, nothing extra

[Get git SHAs, dispatch code quality reviewer]
Code reviewer: Strengths: Good test coverage, clean. Issues: None. Approved.

[Confirm Task 1's plan steps are checked off in the approved plan]

Task 2: Recovery modes

[Build the task packet for Task 2]
[Dispatch implementation subagent with the packet verbatim]

Implementer: [No questions, proceeds]
Implementer:
  - Added verify/repair modes
  - 8/8 tests passing
  - Self-review: All good
  - Ready for coordinator-owned git actions

[Dispatch spec compliance reviewer]
Spec reviewer: ❌ Issues:
  - Missing: Progress reporting (spec says "report every 100 items")
  - Extra: Added --json flag (not requested)

[Implementer fixes issues]
Implementer: Removed --json flag, added progress reporting

[Spec reviewer reviews again]
Spec reviewer: ✅ Spec compliant now

[Dispatch code quality reviewer]
Code reviewer: Strengths: Solid. Issues (Important): Magic number (100)

[Implementer fixes]
Implementer: Extracted PROGRESS_INTERVAL constant

[Code reviewer reviews again]
Code reviewer: ✅ Approved

[Mark Task 2 complete]

...

[After all tasks]
[Announce: I'm using the requesting-code-review skill for the final review pass.]
[Invoke featureforge:requesting-code-review]
[Resolve any Critical or Important findings]

[Announce: I'm using the finishing-a-development-branch skill to complete this work.]
[Invoke featureforge:finishing-a-development-branch]
[Let that skill require qa-only when browser QA is warranted, require document-release for workflow-routed work, then present merge/PR/keep/discard options and follow the chosen path]
```

## Advantages

**vs. Manual execution:**
- Subagents follow TDD naturally
- Fresh context per task (no confusion)
- Parallel-safe (subagents don't interfere)
- Subagent can ask questions (before AND during work)

**vs. Executing Plans:**
- Same session (no handoff)
- Continuous progress (no waiting)
- Review checkpoints automatic

**Efficiency gains:**
- No repeated artifact parsing per subagent (controller provides the helper-built packet)
- Semantic context stays packet-backed instead of drifting into controller summaries
- Subagent gets the exact approved task contract upfront
- Questions surfaced before work begins (not after)

**Quality gates:**
- Self-review catches issues before handoff
- Two-stage review: spec compliance, then code quality
- Review loops ensure fixes actually work
- Spec compliance prevents over/under-building
- Code quality ensures implementation is well-built
- Those per-task review loops satisfy the "review early" rule during execution; `featureforge:requesting-code-review` remains the final whole-diff gate unless you intentionally want an extra interim checkpoint

**Cost:**
- More subagent invocations (implementer + 2 reviewers per task)
- Controller does more prep work (building packets and coordinating reviewers)
- Review loops add iterations
- But catches issues early (cheaper than debugging later)

## Red Flags

**Never:**
- Start implementation on a default protected branch (`main`, `master`, `dev`, or `develop`) without explicit user consent
- Skip reviews (spec compliance OR code quality)
- Proceed with unfixed issues
- Dispatch multiple implementation subagents in parallel without helper-selected topology, isolated worktrees, and disjoint lane ownership
- Make subagent re-read the plan/spec when the helper-built packet already defines the task contract
- Replace the packet with controller-written semantic summaries or extra "scene-setting" requirements
- Ignore subagent questions (answer before letting them proceed)
- Accept "close enough" on spec compliance (spec reviewer found issues = not done)
- Skip review loops (reviewer found issues = implementer fixes = review again)
- Let implementer self-review replace actual review (both are needed)
- **Start code quality review before spec compliance is ✅** (wrong order)
- Move to next task while either review has open issues

**If subagent asks questions:**
- Answer clearly and completely
- Provide additional context if needed
- Don't rush them into implementation

**If reviewer finds issues:**
- Implementer (same subagent) fixes them
- Reviewer reviews again
- Repeat until approved
- Don't skip the re-review

**If subagent fails task:**
- Dispatch fix subagent with specific instructions
- Don't try to fix manually (context pollution)

## Integration

**Required workflow skills:**
- **featureforge:writing-plans** - Creates the plan this skill executes
- **featureforge:plan-eng-review** - Provides the approved plan and the execution preflight handoff
- **featureforge:requesting-code-review** - REQUIRED: Final review gate after execution completes
- **featureforge:finishing-a-development-branch** - Complete development after all tasks

**Conditional completion gate:**
- **featureforge:qa-only** - Required when browser QA is warranted by the branch change surface or test-plan artifact; optional otherwise
- **featureforge:document-release** - Required release-readiness pass for workflow-routed work before completion

**Subagents should use:**
- **featureforge:test-driven-development** - Subagents follow TDD for each task

**Optional direct invocation:**
- **featureforge:using-git-worktrees** - Use when the user explicitly wants isolated workspace management before execution, or when runtime-directed remediation says to prepare the workspace first

**Alternative workflow:**
- **featureforge:executing-plans** - Use for parallel session instead of same-session execution
