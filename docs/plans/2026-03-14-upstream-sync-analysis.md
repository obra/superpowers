# Upstream Sync Analysis: obra/superpowers → superpowers-optimized

**Date:** 2026-03-14
**Status:** Analysis complete — awaiting decision on each item
**Scope:** 69 commits behind `obra/superpowers:main`

---

## Executive Summary

After a thorough cross-reference of all 69 upstream commits against our complete plugin (19 skills, 7 hooks, 1 agent), the changes fall into three categories:

- **6 changes we should adopt** — fix real bugs or close real gaps in our plugin
- **4 changes worth considering** — could improve our plugin but need adaptation
- **~59 commits to skip** — visual brainstorming server (25+ commits), README/docs churn, release notes, gitignore, and features that don't fit our architecture

---

## ADOPT — Real bugs or gaps in our plugin

### 1. Subagent Context Isolation — Explicit "Never Inherit Session History"

**Upstream commit:** `9ccce3b` — "Add context isolation principle to all delegation skills"

**What upstream did:** Added an explicit instruction to all delegation skills: "Subagents should never inherit the parent session's context or history. The dispatcher constructs exactly what each subagent needs."

**Our current state:** We have *functional* context isolation in three skills:
- `subagent-driven-development`: "include only task text, acceptance criteria, file paths, constraints. Exclude unrelated prior analysis."
- `dispatching-parallel-agents`: specifies exact scope/criteria/constraints per agent
- `using-superpowers`: "avoid carrying forward long assistant reasoning chains"

**Gap:** We describe *what to include*, but never explicitly say "do NOT inherit/forward session history." Upstream's phrasing is more defensive — it's a prohibition rather than an allowlist. LLMs respond better to explicit prohibitions on dangerous defaults.

**Recommendation:** Add to `subagent-driven-development`, `dispatching-parallel-agents`, and `executing-plans`:
> "Never forward parent session context or history to subagents. Construct each subagent's prompt from scratch using only the items listed above."

**Effort:** Small — one sentence added to 3 skills.

---

### 2. SUBAGENT-STOP Gate — Prevent Skill Leakage

**Upstream commit:** `1c53f5d` — "Add SUBAGENT-STOP gate to prevent subagent skill leakage"

**What upstream did:** Subagents launched by the plugin can discover superpowers skills via native filesystem discovery (they inherit filesystem access from the parent). This means a subagent dispatched for a simple implementation task could discover and invoke workflow-routing skills like `using-superpowers`, causing it to behave as a full workflow orchestrator instead of a focused implementer.

**Our current state:** We have NO protection against this. Our subagent prompts specify scope but don't prevent the subagent from discovering and invoking our own skills.

**Gap:** This is a real safety issue. A code-quality reviewer subagent that discovers `brainstorming` or `executing-plans` could derail into planning mode instead of reviewing.

**Recommendation:** Add a SubagentStop hook or add explicit instructions to all subagent prompt templates:
> "You are a focused subagent. Do NOT invoke any skills from the superpowers-optimized plugin. Do NOT use the Skill tool. Your only job is the task described below."

This should be added to:
- `subagent-driven-development/implementer-prompt.md`
- `subagent-driven-development/spec-reviewer-prompt.md`
- `subagent-driven-development/code-quality-reviewer-prompt.md`
- `dispatching-parallel-agents/SKILL.md` (in the per-agent prompt requirements)

**Effort:** Small-medium — add instruction to 4 files + optionally add a SubagentStop hook.

---

### 3. Instruction Priority Hierarchy

**Upstream commit:** `b23c084` — "Add instruction priority hierarchy to using-superpowers skill"

**What upstream did:** Added explicit clarification that user instructions always take precedence over Superpowers skills. This prevents the LLM from rigidly following skill instructions when the user wants something different.

**Our current state:** No skill explicitly states this. The closest we have is `receiving-code-review` validating suggestions against requirements, and `subagent-driven-development` escalating blocked tasks to the user. But there's no global declaration.

**Gap:** Without this, the LLM might refuse a user's explicit request because a skill says otherwise. For example, a user who says "just fix it without tests" might get blocked by `test-driven-development`'s Iron Law even though the user explicitly overrode it.

**Recommendation:** Add to `using-superpowers/SKILL.md` a priority hierarchy section:
> **Instruction Priority (highest to lowest):**
> 1. Explicit user instructions in the current conversation
> 2. Project-level CLAUDE.md / AGENTS.md
> 3. Superpowers skill instructions
>
> If a user explicitly overrides a skill's behavior, follow the user. Skills are defaults, not mandates.

**Effort:** Small — one section added to one file.

---

### 4. Windows/Linux Hook Quote Fix

**Upstream commit:** `ad716b8` — "fix: use double quotes for CLAUDE_PLUGIN_ROOT in SessionStart hook"

**What upstream did:** Replaced single quotes with escaped double quotes around `${CLAUDE_PLUGIN_ROOT}` in `hooks.json`. Single quotes prevent shell variable expansion on Linux, causing "No such file or directory" errors.

**Our current state:** Our `hooks.json` uses single quotes: `"'${CLAUDE_PLUGIN_ROOT}/hooks/run-hook.cmd' session-start"` (line 9). This same pattern appears in ALL 7 hook entries.

**Gap:** If `${CLAUDE_PLUGIN_ROOT}` is expanded by Claude Code before passing to the shell (as a template variable), single quotes are fine for handling spaces in paths. But if it's passed as-is to bash, single quotes prevent expansion on Linux. This needs verification, but the upstream fix addressed real user reports (issue #577).

**Recommendation:** Test on Linux to confirm whether this is a real issue for us. If `CLAUDE_PLUGIN_ROOT` is a Claude Code template variable (expanded before shell), our current approach works. If it's a shell variable, we need to switch to escaped double quotes: `"\"${CLAUDE_PLUGIN_ROOT}/hooks/run-hook.cmd\" session-start"`.

**Effort:** Small — change quotes in 7 entries in hooks.json. But requires Linux testing to confirm the fix is needed.

**Note:** Upstream also had additional Windows fixes (`5fbefbd`, `31bbbe2`) for polyglot wrapper and POSIX-safe path resolution. Our `run-hook.cmd` already handles Windows correctly, so these are likely already covered.

---

### 5. Project-Level Scope Decomposition in Brainstorming

**Upstream commit:** `d48b14e` — "Add project-level scope assessment to brainstorming pipeline"

**What upstream did:** Brainstorming now assesses whether a project is too large for a single spec and helps decompose it into sub-projects/sub-specs. This prevents the common failure mode of trying to design an entire large system in one spec document.

**Our current state:** Our `brainstorming` skill has scope/non-goals and inspects project context, but it doesn't explicitly assess whether the request is too large for a single design document. It will happily try to design a massive system in one pass.

**Gap:** For large projects, a single monolithic design document leads to worse outcomes — the LLM loses focus, the user can't meaningfully review it, and the resulting plan is too large to execute coherently.

**Recommendation:** Add to `brainstorming/SKILL.md` checklist, after inspecting project context:
> - Assess scope: if the project touches 4+ independent subsystems or would require 20+ implementation tasks, decompose into sub-projects. Design each sub-project as a separate spec. Present the decomposition to the user for approval before designing individual specs.

**Effort:** Small — one checklist item added to brainstorming.

---

### 6. Spec/Plan Review Loop in writing-plans

**Upstream commits:** `ee14cae`, `6c274dc`, `7b99c39` — Spec reviewer prompt, plan reviewer prompt, plan review loop

**What upstream did:** Added a review loop to `writing-plans` that dispatches a reviewer subagent to check specs and plans before execution begins. The reviewer checks for gaps, ambiguities, and structural issues.

**Our current state:** We have `spec-reviewer-prompt.md` in `subagent-driven-development` (used AFTER implementation, per task), but we don't have a pre-execution review of the plan itself. Plans go directly from `writing-plans` → execution without an intermediate quality gate.

**Gap:** A bad plan produces bad implementation. Catching plan issues (vague steps, missing dependencies, incorrect file paths) before execution starts is significantly cheaper than catching them during execution.

**Recommendation:** Add a plan review step to `writing-plans/SKILL.md` before the handoff to execution:
> After saving the plan, dispatch a plan-reviewer subagent to check for: vague or ambiguous steps, missing file paths, hidden dependencies between tasks, missing verification commands, incorrect TDD ordering. If the reviewer finds issues, revise the plan before offering execution options.

Optionally create a `plan-reviewer-prompt.md` template for the reviewer subagent.

**Effort:** Medium — new prompt template + update to writing-plans skill.

---

## CONSIDER — Worth evaluating but not urgent

### 7. Remove Batch-and-Stop from executing-plans

**Upstream commit:** `3bdd66e` — "Remove batch-and-stop pattern from executing-plans skill"

**What upstream did:** Removed the "pause every 3 tasks for review" pattern. Added a note encouraging users to use subagent-capable platforms for better quality.

**Our current state:** Our `executing-plans` still has: "execute next batch (default 3 tasks), run verification for each task, report + wait for feedback, continue."

**Assessment:** The batch pattern has pros and cons:
- **Pro:** Gives the user control points, prevents runaway execution, catches drift early
- **Con:** Slows execution, breaks flow, and `subagent-driven-development` already has per-task review gates that are more granular

**Recommendation:** Keep the batch pattern for now but make it user-configurable. The batch pattern is a safety feature that aligns with our "proportional overhead" philosophy. If users find it too slow, they should use `subagent-driven-development` instead. Consider adding a note: "For faster execution with automated review gates, use `subagent-driven-development` instead."

**Effort:** Small — add one note to executing-plans.

---

### 8. Deprecate Slash Commands in Favor of Skills

**Upstream commit:** `c3ecc1b` — "Deprecate slash commands in favor of skills"

**What upstream did:** Removed slash commands since skills are now the primary mechanism in Claude Code.

**Our current state:** We still have 3 commands in `commands/`:
- `brainstorm.md`
- `execute-plan.md`
- `write-plan.md`

**Assessment:** These commands are convenience shortcuts that invoke the corresponding skills. They're not harmful, but they add maintenance surface. With skill-activator.js routing and the `Skill` tool, they're redundant.

**Recommendation:** Keep them for now — they provide a familiar entry point for users who prefer explicit `/brainstorm` over natural language. Consider deprecating in a future version if metrics show low usage.

**Effort:** N/A — no change needed now.

---

### 9. Architecture Guidance & Capability-Aware Escalation

**Upstream commit:** `daa3fb2` — "Add architecture guidance and capability-aware escalation"

**What upstream did:** Added design-for-isolation and working-in-existing-codebases guidance to brainstorming. Also added capability-aware escalation (recognizing when a task exceeds the agent's capabilities and escalating to the user).

**Our current state:** Our brainstorming has engineering rigor (requirements verification, edge cases, trade-offs) but doesn't explicitly guide on designing for isolation or working within existing codebases. Our blocked-task protocol in `subagent-driven-development` handles escalation but only after 2 failed attempts.

**Recommendation:** Add to `brainstorming/SKILL.md`:
> - For existing codebases: study existing patterns before proposing new ones. Match the project's conventions unless there's a compelling reason to diverge.
> - Design for isolation: prefer changes that don't require coordinating across many files. Minimize the blast radius of each change.

**Effort:** Small — 2-3 lines added to brainstorming.

---

### 10. Enforce Subagent-Driven-Development on Capable Harnesses

**Upstream commit:** `5e51c3e` — "enforce subagent-driven-development on capable harnesses"

**What upstream did:** Made subagent-driven-development mandatory (not optional) when the harness supports subagent dispatching.

**Our current state:** `writing-plans` presents two options: (1) `subagent-driven-development` in this session, (2) `executing-plans` in a separate session. The user chooses.

**Assessment:** Subagent-driven-development produces better results (isolated context per task, two-stage review gates, parallel execution). But forcing it removes user choice, which conflicts with our instruction priority hierarchy.

**Recommendation:** Make `subagent-driven-development` the **recommended default** but preserve user choice. Update the handoff in `writing-plans` to recommend option 1 as the preferred path:
> Recommended: (1) `subagent-driven-development` — parallel execution with per-task review gates (best quality)
> Alternative: (2) `executing-plans` — sequential batch execution (simpler, works in any session)

**Effort:** Small — reword the handoff options.

---

## SKIP — Not applicable or not worth porting

### Visual Brainstorming Companion (25+ commits)

Commits: `02b3d7c`, `3c220d0`, `866f2bd`, `e4226df`, `4180afb`, `7024401`, `aba2542`, `9c98e01`, `8d6d876`, `7f6380d`, `8d9b94e`, `7619570`, `85cab6e`, `263e326`, `ec99b7c`, `b484bae`, `7446c84`, `5e2a89e`, `7f8edd9`, `81acbcd`, `e02842e`, `d3c028e`

A WebSocket-based visual companion server that renders brainstorming sessions in a browser. Was initially 714 npm packages, then rewritten to zero-dep (~340 lines). Includes auto-shutdown, PID tracking, cross-platform launch scripts.

**Why skip:** Heavy maintenance surface for a nice-to-have visual feature. Our plugin focuses on workflow quality and token efficiency. The 25+ commits and ongoing iteration show this feature requires significant ongoing maintenance. If users want it, they can use the original Superpowers plugin alongside ours (it's a UI feature, not a workflow one — no overlap risk).

### Gemini CLI Support (5 commits)

Commits: `5f14c1a`, `715e18e`, `f0a4538`, `81acbcd`, `c070e6b`

Tool mapping and install instructions for Gemini CLI.

**Why skip:** Our plugin targets Claude Code and Cursor primarily. Gemini CLI support is a "nice to have" that adds maintenance surface without benefiting our core user base. Can be reconsidered if demand emerges.

### README/Docs/Release Notes (~10 commits)

Various README updates, marketplace instructions, release notes, gitignore changes.

**Why skip:** Our README is substantially different. Our release notes are our own. These don't port.

### Directory Restructure (1 commit)

Commit `f57638a` — moved specs/plans to `docs/superpowers/specs/` and `docs/superpowers/plans/`.

**Why skip:** We already use `docs/plans/` which works fine. Restructuring would break existing references in state.md files and user muscle memory.

### Cursor Install Fix (1 commit)

Commit `f7b6107` — "fix: update install cursor command."

**Why skip:** Our Cursor install command may already be correct. Verify independently if Cursor users report issues.

### OpenCode TodoWrite Fix (1 commit)

Commit `c070e6b` — "fix(opencode): correct TodoWrite tool mapping to todowrite."

**Why skip:** OpenCode-specific fix. If we support OpenCode, verify independently.

---

## Implementation Priority

If we adopt the recommended changes, here's the suggested order:

| Priority | Item | Effort | Impact |
|----------|------|--------|--------|
| 1 | SUBAGENT-STOP gate (item 2) | Small-Medium | High — prevents skill leakage |
| 2 | Subagent context isolation (item 1) | Small | High — prevents context pollution |
| 3 | Instruction priority hierarchy (item 3) | Small | High — user trust and correctness |
| 4 | Spec/plan review loop (item 6) | Medium | High — catches plan issues early |
| 5 | Scope decomposition in brainstorming (item 5) | Small | Medium — better large project handling |
| 6 | Windows/Linux hook fix (item 4) | Small | Medium — cross-platform reliability |
| 7 | Architecture guidance (item 9) | Small | Medium — better designs |
| 8 | Recommend subagent-driven-dev (item 10) | Small | Low — quality nudge |
| 9 | Batch-and-stop note (item 7) | Small | Low — user guidance |

**Total estimated effort:** ~3-4 hours for all high-priority items (1-4).

---

## What We Already Do Better Than Upstream

For context, here's what superpowers-optimized already has that the original does NOT:

1. **Safety hooks** — `block-dangerous-commands.js` (30+ patterns, 3 severity tiers) and `protect-secrets.js` (50+ patterns with allowlisting). The original has no safety hooks.
2. **Self-consistency reasoning** — Multi-path hypothesis testing in debugging and verification. Research-backed (Wang et al. ICLR 2023). Original has single-chain reasoning only.
3. **Error recovery intelligence** — `known-issues.md` system for cross-session bug memory. Original has nothing equivalent.
4. **Token efficiency** — Always-on operational standard with specific anti-patterns and exploration tracking. Original relies on verbose prose.
5. **Skill-activator hook** — Confidence-threshold routing with micro-task detection. Original has no prompt-time routing.
6. **Session tracking** — Edit logs, session stats, TDD reminders, commit nudges. Original has no tracking.
7. **Frontend craftsmanship** — WCAG AA, semantic HTML, fluid typography standards. Original has no frontend skill.
8. **Testing anti-patterns** — Gate functions with code examples for 6 common mocking failures. Original has basic TDD only.
9. **Research-grounded design** — Three academic papers informing design decisions. Original is experience-driven.
10. **Auto-update notifications** — Session-start checks for new versions with 24h cache. Original has no update mechanism.
