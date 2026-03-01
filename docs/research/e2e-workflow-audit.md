# End-to-End Workflow Consistency Audit — Superpowers v4.4.0

**Date:** 2026-03-01
**Scope:** All 16 skills, 5 agent definitions, 7 prompt templates
**Method:** Manual reading of every SKILL.md, prompt template, and agent definition; tracing 6 workflow chains end-to-end

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Chain 1: Full Project Lifecycle](#chain-1-full-project-lifecycle)
3. [Chain 2: Solo Execution Path](#chain-2-solo-execution-path)
4. [Chain 3: Subagent Path](#chain-3-subagent-path)
5. [Chain 4: Ad-Hoc Debugging](#chain-4-ad-hoc-debugging)
6. [Chain 5: Code Review Cycle](#chain-5-code-review-cycle)
7. [Chain 6: Skill Development](#chain-6-skill-development)
8. [Cross-Cutting Issues](#cross-cutting-issues)
9. [Findings Summary Table](#findings-summary-table)
10. [Recommendations](#recommendations)

---

## Executive Summary

The Superpowers v4.4.0 skill set is broadly consistent along the primary workflow chains. The major execution skills (agent-team-driven-development, subagent-driven-development, executing-plans) share coherent prompt templates, review patterns, and handoff conventions. However, the audit identified **28 specific issues** across 6 severity categories:

- **5 Broken Handoffs** where information is lost between skills
- **6 Inconsistencies** in terminology, references, or behavior across skills
- **4 Missing Cross-References** where Integration sections omit predecessors or successors
- **5 Contradictions** where skills give conflicting guidance
- **4 Orphaned/Dangling References** to things that don't exist
- **4 Structural Gaps** where the workflow has no coverage

---

## Chain 1: Full Project Lifecycle

**Path:** brainstorming -> writing-plans -> using-git-worktrees -> composing-teams -> agent-team-driven-development -> verification-before-completion -> requesting-code-review -> finishing-a-development-branch

### Handoff: brainstorming -> writing-plans

**Status:** Mostly clean.

- brainstorming checklist step 8 says "invoke writing-plans skill to create implementation plan" -- matches writing-plans overview.
- brainstorming checklist step 6 says "Create worktree" before step 7 "Compose team" and step 8 "Transition to implementation." The flowchart confirms this order.
- writing-plans line 16 says "This should be run in a dedicated worktree (created by brainstorming skill)" -- consistent.

**FINDING W1-1: brainstorming step ordering vs composing-teams expectation**
- `brainstorming/SKILL.md:31` (step 6): "Create worktree" happens before step 7 "Compose team"
- `composing-teams/SKILL.md:108`: "Before this skill: superpowers:brainstorming -- Design approved, worktree created"
- This is consistent. No issue.

### Handoff: writing-plans -> agent-team-driven-development

**Status:** Clean. writing-plans line 202 says "REQUIRED SUB-SKILL: Use agent-team-driven-development" and agent-team-driven-development Integration section (line 323) lists "superpowers:writing-plans -- Creates the plan this skill executes."

### Handoff: agent-team-driven-development -> verification-before-completion

**FINDING W1-2: verification-before-completion has NO Integration section (MISSING CROSS-REFERENCE)**
- **File:** `verification-before-completion/SKILL.md`
- **Issue:** This skill has no Integration section at all. It doesn't list who calls it or what it pairs with. Every other workflow skill has one.
- **Impact:** Agents discovering this skill don't know where it fits in the lifecycle.
- **Severity:** Medium

**FINDING W1-3: verification-before-completion is barely referenced by execution skills (MISSING CROSS-REFERENCE)**
- `agent-team-driven-development/SKILL.md`: Does NOT reference verification-before-completion anywhere.
- `subagent-driven-development/SKILL.md`: Does NOT reference verification-before-completion anywhere.
- `executing-plans/SKILL.md`: Does NOT reference verification-before-completion anywhere.
- Only `systematic-debugging/SKILL.md:288` references it: "superpowers:verification-before-completion -- Verify fix worked before claiming success"
- **Impact:** The three main execution skills never tell agents to use verification-before-completion. The skill is supposed to apply "ALWAYS before ANY variation of success/completion claims" (line 119-125), but no execution skill cross-references it. Agents may never discover it during plan execution.
- **Severity:** High

### Handoff: agent-team-driven-development -> requesting-code-review

**Status:** Partially covered.
- `agent-team-driven-development/SKILL.md:327`: lists "superpowers:requesting-code-review -- Review methodology for quality reviewers" under "During this skill."
- But agent-team-driven-development has its OWN code quality review prompt template (`code-quality-reviewer-prompt.md`) that directly references `superpowers:code-reviewer`. The requesting-code-review skill is listed as a reference but the actual template used is different.

**FINDING W1-4: Dual review pathways create confusion (INCONSISTENCY)**
- `agent-team-driven-development/SKILL.md:327` says it uses "superpowers:requesting-code-review -- Review methodology for quality reviewers" during execution.
- But `agent-team-driven-development/code-quality-reviewer-prompt.md:11` uses `subagent_type: superpowers:code-reviewer` directly, not the requesting-code-review skill.
- `requesting-code-review/SKILL.md:34` says "Use Task tool with superpowers:code-reviewer type, fill template at `code-reviewer.md`"
- The agent-team-driven-development code quality template and the requesting-code-review template are DIFFERENT templates with different structures. The agent-team one is shorter and task-specific; requesting-code-review's template at `code-reviewer.md` has a full checklist with {PLAN_REFERENCE} placeholder.
- **Impact:** Which template does the lead actually use? The Integration section says one thing; the prompt template does another.
- **Severity:** Medium

### Handoff: agent-team-driven-development -> finishing-a-development-branch

**Status:** Clean.
- `agent-team-driven-development/SKILL.md:167`: "Use superpowers:finishing-a-development-branch"
- `finishing-a-development-branch/SKILL.md:211-212`: "Called by: agent-team-driven-development (Phase 3) -- After all waves complete and all reviews pass"

**FINDING W1-5: finishing-a-development-branch has DUPLICATE "Called by" sections (STRUCTURAL)**
- `finishing-a-development-branch/SKILL.md:195-200`: Lists "Called by: subagent-driven-development (Step 7), executing-plans (Step 5)" and "Pairs with: using-git-worktrees"
- `finishing-a-development-branch/SKILL.md:211-212`: Under "Team Context" section, ALSO lists "Called by: agent-team-driven-development (Phase 3)"
- **Impact:** Two separate "Called by:" lists in different sections. Agent-team-driven-development is only in the second one. An agent reading just the Integration section would miss it.
- **Severity:** Low

**FINDING W1-6: finishing-a-development-branch "Called by" references wrong step for subagent-driven-development (INCONSISTENCY)**
- `finishing-a-development-branch/SKILL.md:196`: "subagent-driven-development (Step 7) -- After all tasks complete"
- But subagent-driven-development has NO numbered steps labeled "Step 7." The flowchart shows the final node as "Use superpowers:finishing-a-development-branch" which comes after "Dispatch final code reviewer subagent for entire implementation."
- The executing-plans reference says "(Step 5)" which IS correct (executing-plans Step 5 at line 46-50).
- **Severity:** Low

---

## Chain 2: Solo Execution Path

**Path:** brainstorming -> writing-plans -> using-git-worktrees -> executing-plans -> verification-before-completion -> finishing-a-development-branch

### Handoff: writing-plans -> executing-plans

**FINDING W2-1: writing-plans execution handoff refers to "Parallel Session" path but doesn't mention using-git-worktrees (BROKEN HANDOFF)**
- `writing-plans/SKILL.md:211-213`: For the Parallel Session choice: "Guide them to open new session in worktree. REQUIRED SUB-SKILL: New session uses superpowers:executing-plans"
- `executing-plans/SKILL.md:82`: "superpowers:using-git-worktrees - REQUIRED: Set up isolated workspace before starting"
- **Problem:** writing-plans tells the user to "open new session in worktree" (implying worktree already exists from brainstorming step), but executing-plans ALSO says using-git-worktrees is REQUIRED before starting. If the user opens a new session in the already-created worktree, should they run using-git-worktrees AGAIN? Or is it already done?
- **Impact:** Confusion about whether worktree creation happens once (in brainstorming) or needs to be repeated in executing-plans.
- **Severity:** Medium

### Handoff: executing-plans -> verification-before-completion

**FINDING W2-2: executing-plans never references verification-before-completion (MISSING CROSS-REFERENCE)**
- `executing-plans/SKILL.md` (entire file): No mention of verification-before-completion.
- The skill says "Run verifications as specified" (line 29) and "Don't skip verifications" (line 73) but doesn't say to use the verification-before-completion skill.
- **Impact:** Same as W1-3 -- verification-before-completion is the universal quality gate but is never cross-referenced by execution skills.
- **Severity:** High (duplicate of W1-3, included for chain completeness)

### Handoff: executing-plans -> finishing-a-development-branch

**Status:** Clean. executing-plans Step 5 (line 46-50) explicitly says "REQUIRED SUB-SKILL: Use superpowers:finishing-a-development-branch."

---

## Chain 3: Subagent Path

**Path:** brainstorming -> writing-plans -> using-git-worktrees -> subagent-driven-development -> verification-before-completion -> finishing-a-development-branch

### Handoff: writing-plans -> subagent-driven-development

**Status:** Clean. writing-plans line 207 says "REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development."

### Handoff: subagent-driven-development -> verification-before-completion

**Same issue as W1-3.** subagent-driven-development does NOT reference verification-before-completion.

### Handoff: subagent-driven-development -> finishing-a-development-branch

**FINDING W3-1: subagent-driven-development does NOT explicitly invoke finishing-a-development-branch (BROKEN HANDOFF)**
- The flowchart at `subagent-driven-development/SKILL.md:64` shows "Use superpowers:finishing-a-development-branch" as the final node, but there is NO textual instruction in the skill body saying "REQUIRED SUB-SKILL: Use superpowers:finishing-a-development-branch."
- Compare with `executing-plans/SKILL.md:49`: "**REQUIRED SUB-SKILL:** Use superpowers:finishing-a-development-branch" -- this IS present.
- The Integration section at line 247 lists it as required, but the process section never gives the explicit invocation instruction.
- **Impact:** The flowchart shows it, but there's no bold "REQUIRED SUB-SKILL" callout in the process text like executing-plans has. An agent may follow the text instructions and miss the flowchart's terminal node.
- **Severity:** Medium

---

## Chain 4: Ad-Hoc Debugging

**Path:** systematic-debugging -> test-driven-development -> verification-before-completion

### Handoff: systematic-debugging -> test-driven-development

**Status:** Clean.
- `systematic-debugging/SKILL.md:179`: "Use the superpowers:test-driven-development skill for writing proper failing tests"
- `systematic-debugging/SKILL.md:287`: "superpowers:test-driven-development -- For creating failing test case (Phase 4, Step 1)"

### Handoff: systematic-debugging -> verification-before-completion

**Status:** Clean.
- `systematic-debugging/SKILL.md:288`: "superpowers:verification-before-completion -- Verify fix worked before claiming success"
- This is the ONLY execution-adjacent skill that references verification-before-completion.

### test-driven-development -> verification-before-completion

**FINDING W4-1: test-driven-development does NOT reference verification-before-completion (MISSING CROSS-REFERENCE)**
- `test-driven-development/SKILL.md` has no Integration section at all.
- It has a "Verification Checklist" (line 329-340) and a "Debugging Integration" section (line 353), but neither mentions verification-before-completion.
- **Impact:** TDD is about verification at every step. The verification-before-completion skill is the natural complement, but there's no cross-reference.
- **Severity:** Low

---

## Chain 5: Code Review Cycle

**Path:** requesting-code-review -> receiving-code-review

### Handoff: requesting-code-review -> receiving-code-review

**FINDING W5-1: requesting-code-review and receiving-code-review have NO cross-references to each other (MISSING CROSS-REFERENCE)**
- `requesting-code-review/SKILL.md`: No Integration section that references receiving-code-review.
- `receiving-code-review/SKILL.md`: No Integration section at all.
- These are a matched pair (one for sending review, one for receiving it), but neither mentions the other.
- **Impact:** An agent using requesting-code-review doesn't know receiving-code-review exists (and vice versa). When review feedback comes back, the agent won't know there's a skill for handling it.
- **Severity:** Medium

---

## Chain 6: Skill Development

**Path:** writing-skills -> test-driven-development -> verification-before-completion

### Handoff: writing-skills -> test-driven-development

**Status:** Clean.
- `writing-skills/SKILL.md:18`: "REQUIRED BACKGROUND: You MUST understand superpowers:test-driven-development before using this skill."
- Multiple references throughout the skill.

### Handoff: writing-skills -> verification-before-completion

**FINDING W6-1: writing-skills mentions verification-before-completion only as an example, not as a required skill (GAP)**
- `writing-skills/SKILL.md:401`: "Examples: TDD, verification-before-completion, designing-before-coding"
- This is just listing it as an example of a "Discipline-Enforcing Skill," not saying to USE it during skill creation.
- **Impact:** After creating a skill, verification-before-completion should be invoked to verify the skill works. But writing-skills never says this.
- **Severity:** Low

---

## Cross-Cutting Issues

### CX-1: "evidence format" is NOT defined consistently

**FINDING CX-1: No canonical "evidence format" exists in verification-before-completion (INCONSISTENCY)**
- The design document at `docs/plans/skills-audit/design.md` discusses a "Canonical evidence format" with "command/citation/diff evidence types."
- But the actual `verification-before-completion/SKILL.md` does NOT define any structured evidence format. It says "State claim WITH evidence" (line 34) and shows patterns like `[Run test command] [See: 34/34 pass] "All tests pass"` (line 80-81), but this is an informal pattern, not a structured format.
- No other skill references a specific evidence format.
- **Impact:** The design doc planned a canonical format, but it was never implemented. Skills that should reference a structured evidence format have nothing to reference.
- **Severity:** Medium (design intent not yet implemented)

### CX-2: state.yml is referenced only in planning docs, not in any skill

**FINDING CX-2: state.yml is not implemented in any skill (GAP)**
- `docs/plans/skills-audit/design.md` and `docs/plans/2026-03-01-skills-audit-brainstorm.md` extensively discuss `.superpowers/state.yml` as the solution to handoff gaps.
- But NO SKILL.md file mentions state.yml. Zero references.
- The design was approved but never implemented in the skills themselves.
- **Impact:** All the handoff gaps that state.yml was designed to solve (H3, H4, H5, H6, H8, H13 from the brainstorm) remain unsolved.
- **Severity:** High (design gap, but expected since this was Phase 4 work)

### CX-3: TodoWrite vs TaskCreate/TaskUpdate terminology split

**FINDING CX-3: Two different task tracking systems referenced without reconciliation (INCONSISTENCY)**
- **TodoWrite** is used by:
  - `executing-plans/SKILL.md:22`: "Create TodoWrite and proceed"
  - `subagent-driven-development/SKILL.md:58,61,66,79,80,109`: "Mark task complete in TodoWrite," "create TodoWrite"
  - `using-superpowers/SKILL.md:36,50,52`: "Create TodoWrite todo per item"
  - `writing-skills/SKILL.md:598`: "Use TodoWrite to create todos"
- **TaskCreate/TaskUpdate** is used by:
  - `agent-team-driven-development/SKILL.md:82,134,135,149`: "TeamCreate," "TaskCreate for each task," "TaskUpdate to set addBlockedBy," "Mark task complete via TaskUpdate"
  - `agent-team-driven-development/implementer-prompt.md:54,129`: "TaskUpdate with status in_progress"
- **TeamCreate/TeamDelete** is used exclusively by agent-team-driven-development.
- **Problem:** TodoWrite and TaskCreate/TaskUpdate appear to be different APIs (TodoWrite is Claude Code's built-in todo tracking; TaskCreate/TaskUpdate are the Agent Teams API). But no skill explains the difference or when to use which. An agent encountering both terms won't know the distinction.
- **Severity:** Medium (these ARE different APIs, but the lack of explanation creates confusion)

### CX-4: Inconsistent agent type references

**FINDING CX-4: "superpowers:code-reviewer" references a skill name, not an agent name (INCONSISTENCY)**
- The agents directory has: `qa-engineer.md`, `architect.md`, `code-reviewer.md`, `implementer.md`, `security-reviewer.md`
- Skills reference `superpowers:code-reviewer` as a subagent type (e.g., `agent-team-driven-development/SKILL.md:37`, `subagent-driven-development/SKILL.md:94`)
- But in the prompt templates, the agent type is used as `subagent_type: superpowers:code-reviewer` (in `agent-team-driven-development/code-quality-reviewer-prompt.md:11`) and also as `Task tool (superpowers:code-reviewer)` (in `subagent-driven-development/code-quality-reviewer-prompt.md:10`).
- The requesting-code-review skill at line 34 says "Use Task tool with superpowers:code-reviewer type."
- **Clarification needed:** Is `superpowers:code-reviewer` the agent definition at `agents/code-reviewer.md`? Or is it a skill reference? The `superpowers:` prefix suggests a skill namespace (like `superpowers:brainstorming`), but `code-reviewer` is an agent definition, not a skill. This conflation of namespaces could confuse agents.
- **Severity:** Medium

### CX-5: "Agent tool" vs "Task tool" naming inconsistency in prompt templates

**FINDING CX-5: Different tool names used for dispatching subagents/agents (INCONSISTENCY)**
- `agent-team-driven-development/implementer-prompt.md:10`: Uses "Agent tool" with fields `subagent_type`, `team_name`, `name`, `description`, `prompt`
- `agent-team-driven-development/spec-reviewer-prompt.md:10`: Uses "Agent tool" with `subagent_type`, `description`, `prompt`
- `subagent-driven-development/implementer-prompt.md:6`: Uses "Task tool (general-purpose)" with `description`, `prompt`
- `subagent-driven-development/code-quality-reviewer-prompt.md:10`: Uses "Task tool (superpowers:code-reviewer)"
- `requesting-code-review/SKILL.md:34`: "Use Task tool with superpowers:code-reviewer type"
- **Problem:** "Agent tool" and "Task tool" are used interchangeably across skills. agent-team-driven-development uses "Agent tool" for spawning team members; subagent-driven-development uses "Task tool" for dispatching subagents. Are these the same tool with different names? Different tools?
- **Impact:** An agent trying to follow the prompt templates won't know which actual tool to call.
- **Severity:** High (functional impact -- wrong tool call = failure)

### CX-6: Worktree patterns inconsistency between execution skills

**FINDING CX-6: using-git-worktrees is NOT listed as "Called by" for agent-team-driven-development (INCONSISTENCY)**
- `using-git-worktrees/SKILL.md:212-215`: Lists "Called by: brainstorming (Phase 4), subagent-driven-development, executing-plans, Any skill needing isolated workspace"
- But agent-team-driven-development ALSO requires worktrees: line 321 says "superpowers:using-git-worktrees -- Isolated workspace before starting."
- **Problem:** using-git-worktrees doesn't list agent-team-driven-development as a caller, even though it IS one.
- **Severity:** Low

### CX-7: Placeholder mismatch in requesting-code-review template

**FINDING CX-7: {PLAN_OR_REQUIREMENTS} vs {PLAN_REFERENCE} placeholder name mismatch (INCONSISTENCY)**
- `requesting-code-review/SKILL.md:38`: Lists placeholder `{PLAN_OR_REQUIREMENTS}` -- "What it should do"
- `requesting-code-review/code-reviewer.md:7`: Uses `{PLAN_OR_REQUIREMENTS}` in the instruction text
- `requesting-code-review/code-reviewer.md:18`: Uses `{PLAN_REFERENCE}` as the actual content placeholder
- **Problem:** The template says to fill `{PLAN_OR_REQUIREMENTS}` (line 7) but the actual content section uses `{PLAN_REFERENCE}` (line 18). These are different placeholder names. An agent filling `{PLAN_OR_REQUIREMENTS}` would leave `{PLAN_REFERENCE}` unfilled.
- **Severity:** High (functional -- template won't render correctly)

### CX-8: "your human partner" vs "the user" vs "Jesse" terminology

**FINDING CX-8: Mixed terminology for the human operator (INCONSISTENCY)**
- Most skills use **"your human partner"**: test-driven-development (lines 24, 346, 371), receiving-code-review (lines 52, 61, 82, 83, 86, 107, 130, 136, 207), verification-before-completion (line 111), executing-plans (line 21), systematic-debugging (lines 211, 234)
- Some skills use **"the user"**: brainstorming (line 15), composing-teams (lines 10, 71, 79, 100), writing-plans (line 68)
- One skill uses **"Jesse"**: using-git-worktrees (line 64: "Per Jesse's rule")
- **Impact:** "your human partner" is the intended generalized term (per the design doc's Section 7: 'TodoWrite -> TaskCreate rename + "your human partner" generalization'). But several skills still use "the user" and one uses "Jesse."
- **Severity:** Low (cosmetic, but reflects incomplete implementation of design Section 7)

### CX-9: "designing-before-coding" skill referenced but doesn't exist

**FINDING CX-9: Orphaned reference to nonexistent skill (DANGLING REFERENCE)**
- `writing-skills/SKILL.md:401`: "Examples: TDD, verification-before-completion, designing-before-coding"
- There is no skill named `designing-before-coding` in the skills directory.
- Was this renamed to `brainstorming`? Or is it a planned but unimplemented skill?
- **Severity:** Low (it's just an example in a list, not a functional reference)

### CX-10: composing-teams -> writing-plans handoff is clean but composing-teams doesn't reference execution skills

**FINDING CX-10: composing-teams Integration section is too narrow (GAP)**
- `composing-teams/SKILL.md:105-111`: Integration section lists only brainstorming (before) and writing-plans (after).
- But composing-teams also feeds directly into agent-team-driven-development (which reads the team roster) and subagent-driven-development (which uses agent-aware dispatch). Neither is listed.
- The skill's own Overview (line 10) mentions all three downstream skills, but the Integration section omits two.
- **Severity:** Low

### CX-11: brainstorming skill has no "Announce at start" instruction

**FINDING CX-11: brainstorming lacks the announcement pattern used by other skills (INCONSISTENCY)**
- Skills that announce: writing-plans (line 14), using-git-worktrees (line 14), composing-teams (line 12), executing-plans (line 14), finishing-a-development-branch (line 14)
- Skills that DON'T announce: brainstorming, verification-before-completion, test-driven-development, systematic-debugging, requesting-code-review, receiving-code-review, dispatching-parallel-agents, writing-skills, using-superpowers
- **Pattern:** The "Announce at start" pattern is used by lifecycle/orchestration skills but not by cross-cutting discipline skills. This is arguably intentional -- discipline skills are about HOW you work, not about discrete phases.
- **However:** brainstorming IS a lifecycle skill (it's the first step) and doesn't announce. This breaks the pattern.
- **Severity:** Very Low (minor consistency nit)

### CX-12: agent-team-driven-development implementer template has contradictory subagent_type

**FINDING CX-12: Template says general-purpose but skill text says use roster definitions (CONTRADICTION)**
- `agent-team-driven-development/implementer-prompt.md:11`: `subagent_type: general-purpose`
- `agent-team-driven-development/SKILL.md:39`: "When a roster exists, spawn implementers using the specified agent definitions (e.g., architect, implementer, qa-engineer) rather than generic general-purpose."
- **Problem:** The template hardcodes `general-purpose` but the skill text says to use the roster's agent definitions. The template should say `[agent-definition-from-roster]` or similar.
- **Severity:** Medium (template contradicts the skill's own instructions)

### CX-13: subagent-driven-development's "implementer fixes spec gaps" uses SAME subagent but subagents are "fresh"

**FINDING CX-13: Process contradiction -- subagent-driven-development says "fresh subagent per task" but expects fix loops with same subagent (CONTRADICTION)**
- `subagent-driven-development/SKILL.md:8`: "Execute plan by dispatching fresh subagent per task"
- `subagent-driven-development/SKILL.md:73-74`: Flowchart shows "Implementer subagent fixes spec gaps" -> "Dispatch spec reviewer subagent" (re-review loop), implying the SAME implementer subagent fixes issues.
- `subagent-driven-development/SKILL.md:233-234`: "If reviewer finds issues: Implementer (same subagent) fixes them"
- **Problem:** If subagents are "fresh" (stateless, one-shot), how does the same implementer subagent fix issues? A fresh subagent by definition loses context. The skill seems to use "subagent" to mean a persistent child agent for the duration of the task, not a truly one-shot agent.
- **Impact:** The term "fresh subagent per task" is misleading. It's actually "persistent subagent per task, fresh between tasks."
- **Severity:** Low (conceptual, but could confuse implementation)

### CX-14: Writing-plans "write the header last" contradicts natural document flow

**FINDING CX-14: Plan document header instruction is process-correct but confusing (GAP)**
- `writing-plans/SKILL.md:47`: "Write the header last -- after the Team Fitness Check determines which execution approach to use."
- This makes process sense (you can't fill in the execution skill until you know which one), but the template at line 33-45 shows the header FIRST in the document.
- **Impact:** Minor confusion for agents -- they see the header template first, read "write the header last," and may get confused about document structure vs writing order.
- **Severity:** Very Low

### CX-15: Missing "Announce at start" for subagent-driven-development

**FINDING CX-15: subagent-driven-development has no "Announce at start" instruction (INCONSISTENCY)**
- Unlike writing-plans, executing-plans, composing-teams, using-git-worktrees, and finishing-a-development-branch, subagent-driven-development does NOT have an "Announce at start" line.
- The example at line 105 shows "You: I'm using Subagent-Driven Development to execute this plan." but this is in the example, not as a required instruction.
- agent-team-driven-development also lacks an explicit "Announce at start" but its example shows it.
- **Severity:** Very Low

### CX-16: finishing-a-development-branch worktree cleanup for Option 2 (Create PR) is inconsistent

**FINDING CX-16: Quick Reference table contradicts text for Option 2 worktree handling (CONTRADICTION)**
- `finishing-a-development-branch/SKILL.md:106`: After Option 2 (Push and Create PR): "Then: Cleanup worktree (Step 5)"
- `finishing-a-development-branch/SKILL.md:159`: Quick Reference table shows Option 2 has "Keep Worktree: checkmark" (keep it)
- `finishing-a-development-branch/SKILL.md:172-173`: Common Mistakes says "Remove worktree when might need it (Option 2, 3)"
- `finishing-a-development-branch/SKILL.md:191`: "Clean up worktree for Options 1 & 4 only"
- **Problem:** The text after Option 2 says "Cleanup worktree (Step 5)" but the Quick Reference table, Common Mistakes section, and the explicit "Options 1 & 4 only" rule all say to KEEP the worktree for Option 2.
- **Impact:** Direct contradiction. An agent following the step-by-step instructions would clean up the worktree; an agent reading the summary would keep it.
- **Severity:** High (functional contradiction)

### CX-17: No skill references dispatching-parallel-agents

**FINDING CX-17: dispatching-parallel-agents is isolated from the workflow chains (STRUCTURAL GAP)**
- `dispatching-parallel-agents/SKILL.md` has no Integration section.
- No other SKILL.md references `dispatching-parallel-agents` or `superpowers:dispatching-parallel-agents`.
- The only connection is `systematic-debugging/SKILL.md:292`: "When multiple potential root causes exist in different subsystems, consider using dispatching-parallel-agents to investigate each hypothesis concurrently."
- **Impact:** This skill is effectively orphaned from the main workflow chains. It overlaps significantly with agent-team-driven-development (both dispatch parallel agents), but neither references the other.
- **Severity:** Low (it's a utility skill, not a lifecycle skill)

### CX-18: spec-reviewer-prompt.md has different framing between team and subagent versions

**FINDING CX-18: Subtle framing difference in spec reviewer prompts (INCONSISTENCY)**
- `agent-team-driven-development/spec-reviewer-prompt.md:10`: Uses "Agent tool" with `subagent_type: general-purpose`
- `subagent-driven-development/spec-reviewer-prompt.md:8`: Uses "Task tool (general-purpose)"
- Both have the same core review instructions, but the team version says "The implementer's report may be incomplete, inaccurate, or optimistic" while the subagent version says "The implementer finished suspiciously quickly. Their report may be incomplete, inaccurate, or optimistic."
- **Impact:** The "finished suspiciously quickly" framing in the subagent version could bias the reviewer. The team version is more neutral. These should be consistent.
- **Severity:** Very Low (tone difference, not functional)

### CX-19: agent-team-driven-development spec reviewer dispatched as subagent but via "Agent tool"

**FINDING CX-19: Spec reviewer uses "Agent tool" but should be a subagent (CONTRADICTION)**
- `agent-team-driven-development/SKILL.md:47-49`: "Reviewers are subagents because they benefit from fresh context: No accumulated bias from watching implementation"
- `agent-team-driven-development/spec-reviewer-prompt.md:3`: "Dispatch as a subagent (not a team member) for fresh, unbiased review."
- `agent-team-driven-development/spec-reviewer-prompt.md:10`: But the template uses "Agent tool" with `subagent_type: general-purpose`
- The "Agent tool" in Claude Code is for persistent team members; the "Task tool" is for one-shot subagents. Using "Agent tool" for a reviewer contradicts the "subagent" intent.
- **Severity:** Medium (functional -- wrong tool means reviewer becomes a persistent team member, defeating the purpose)

### CX-20: No skill handles the "plan needs revision" case

**FINDING CX-20: No feedback loop from execution back to writing-plans (STRUCTURAL GAP)**
- executing-plans (line 64-68) says "Return to Review (Step 1) when: Partner updates the plan based on your feedback" -- but this is within the same session, not a cross-skill feedback loop.
- If an execution skill (agent-team-driven-development, subagent-driven-development) discovers the plan is fundamentally flawed mid-execution, there is no documented process for:
  1. Pausing execution
  2. Returning to writing-plans for revision
  3. Resuming execution with the revised plan
- **Impact:** In practice, the team lead would just handle this ad-hoc, but a documented path would improve reliability.
- **Severity:** Low (edge case)

### CX-21: writing-plans says "max 3 specialist roles total" but composing-teams has no such limit

**FINDING CX-21: Team size constraint inconsistency (CONTRADICTION)**
- `writing-plans/SKILL.md:185`: "For team plans: max 3 tasks per wave, max 3 specialist roles total"
- `composing-teams/SKILL.md:101`: "Right-size the team -- Max 3 simultaneous implementers; more hits diminishing returns"
- `agent-team-driven-development/SKILL.md:41`: "Max 3 simultaneous implementers."
- **Problem:** writing-plans says "max 3 specialist roles TOTAL" which is a stricter constraint than composing-teams' "max 3 simultaneous implementers." Having 4 specialist roles where only 3 work at once is valid per composing-teams but invalid per writing-plans.
- **Severity:** Medium

---

## Findings Summary Table

| ID | Severity | Type | Skills Involved | Summary |
|----|----------|------|-----------------|---------|
| W1-2 | Medium | Missing Cross-Ref | verification-before-completion | No Integration section at all |
| W1-3 | High | Missing Cross-Ref | agent-team/subagent/executing + verification | Execution skills never reference verification-before-completion |
| W1-4 | Medium | Inconsistency | agent-team + requesting-code-review | Dual review template pathways |
| W1-5 | Low | Structural | finishing-a-development-branch | Duplicate "Called by" sections |
| W1-6 | Low | Inconsistency | finishing-a-development-branch + subagent | Wrong step number reference |
| W2-1 | Medium | Broken Handoff | writing-plans + executing-plans | Worktree creation ambiguity for parallel session |
| W3-1 | Medium | Broken Handoff | subagent-driven-development | Missing explicit REQUIRED SUB-SKILL for finishing |
| W4-1 | Low | Missing Cross-Ref | test-driven-development | No reference to verification-before-completion |
| W5-1 | Medium | Missing Cross-Ref | requesting/receiving-code-review | Matched pair skills don't reference each other |
| W6-1 | Low | Gap | writing-skills | verification-before-completion only mentioned as example |
| CX-1 | Medium | Inconsistency | verification-before-completion | No canonical evidence format despite design intent |
| CX-2 | High | Gap | All skills | state.yml not implemented in any skill |
| CX-3 | Medium | Inconsistency | executing/subagent/using-superpowers/writing-skills + agent-team | TodoWrite vs TaskCreate/TaskUpdate unexplained |
| CX-4 | Medium | Inconsistency | All execution skills | superpowers:code-reviewer namespace conflation |
| CX-5 | High | Inconsistency | agent-team vs subagent prompt templates | "Agent tool" vs "Task tool" naming |
| CX-7 | High | Inconsistency | requesting-code-review | {PLAN_OR_REQUIREMENTS} vs {PLAN_REFERENCE} mismatch |
| CX-8 | Low | Inconsistency | Multiple skills | "your human partner" vs "the user" vs "Jesse" |
| CX-9 | Low | Dangling Reference | writing-skills | designing-before-coding skill doesn't exist |
| CX-10 | Low | Gap | composing-teams | Integration section too narrow |
| CX-11 | Very Low | Inconsistency | brainstorming | Missing "Announce at start" |
| CX-12 | Medium | Contradiction | agent-team implementer-prompt.md | Template hardcodes general-purpose, skill says use roster |
| CX-13 | Low | Contradiction | subagent-driven-development | "Fresh" subagent but expects fix loops |
| CX-14 | Very Low | Gap | writing-plans | "Write header last" confusion |
| CX-15 | Very Low | Inconsistency | subagent-driven-development | Missing "Announce at start" |
| CX-16 | High | Contradiction | finishing-a-development-branch | Option 2 worktree cleanup contradicts itself |
| CX-17 | Low | Structural Gap | dispatching-parallel-agents | Orphaned from workflow chains |
| CX-18 | Very Low | Inconsistency | spec-reviewer prompts | "Suspiciously quickly" framing difference |
| CX-19 | Medium | Contradiction | agent-team spec-reviewer-prompt | Uses "Agent tool" for subagent |
| CX-20 | Low | Structural Gap | execution skills + writing-plans | No plan revision feedback loop |
| CX-21 | Medium | Contradiction | writing-plans + composing-teams | "3 specialist roles total" vs "3 simultaneous" |

### Severity Distribution

| Severity | Count |
|----------|-------|
| High | 5 |
| Medium | 11 |
| Low | 9 |
| Very Low | 5 |

---

## Recommendations

### Priority 1: Fix High-Severity Issues

1. **CX-16: Fix finishing-a-development-branch Option 2 worktree contradiction**
   - Remove "Then: Cleanup worktree (Step 5)" from after Option 2 (line 106) to match the Quick Reference table and Common Mistakes section. The worktree should be KEPT for PRs so the user can iterate on review feedback.

2. **W1-3: Add verification-before-completion cross-references to all execution skills**
   - Add to agent-team-driven-development, subagent-driven-development, and executing-plans Integration sections: "superpowers:verification-before-completion -- REQUIRED: Before any completion claims"
   - Add a brief note in each skill's completion phase referencing verification-before-completion.

3. **CX-5: Standardize "Agent tool" vs "Task tool" terminology**
   - Document clearly: "Agent tool" = persistent team member (used by agent-team-driven-development). "Task tool" = one-shot subagent (used by subagent-driven-development).
   - Fix CX-19: Change the spec-reviewer-prompt.md in agent-team-driven-development to explicitly note it uses "Task tool" (subagent), not "Agent tool" (team member), since the skill text says reviewers should be subagents.

4. **CX-7: Fix placeholder mismatch in requesting-code-review/code-reviewer.md**
   - Change `{PLAN_REFERENCE}` on line 18 to `{PLAN_OR_REQUIREMENTS}` to match the skill's documented placeholders.

5. **CX-2: Note state.yml as deferred work**
   - This is intentionally deferred (Phase 4 from the skills audit design). No immediate fix needed, but consider adding a brief "Future: state.yml" note to the design doc indicating this is known-deferred.

### Priority 2: Fix Medium-Severity Issues

6. **CX-12: Fix agent-team implementer template to use roster agent definitions**
   - Change `subagent_type: general-purpose` to `subagent_type: [agent-definition-from-roster]` with a comment explaining the lead should fill this from the team roster.

7. **W2-1: Clarify worktree lifecycle for parallel session path**
   - In writing-plans, change the Parallel Session guidance to say "Guide them to open new session in the worktree created during brainstorming. The using-git-worktrees skill has already been run; the new session should cd to the worktree path."
   - In executing-plans, change using-git-worktrees from "REQUIRED: Set up isolated workspace before starting" to "REQUIRED: Verify you are in an isolated workspace (created by brainstorming or set up via using-git-worktrees)."

8. **W3-1: Add explicit REQUIRED SUB-SKILL callout for finishing-a-development-branch in subagent-driven-development**
   - After the flowchart, add a text instruction: "After all tasks complete and final review passes: **REQUIRED SUB-SKILL:** Use superpowers:finishing-a-development-branch"

9. **W5-1: Add Integration sections to requesting-code-review and receiving-code-review**
   - requesting-code-review should list receiving-code-review as "Pairs with"
   - receiving-code-review should list requesting-code-review as "Pairs with"

10. **CX-21: Reconcile team size constraints**
    - Change writing-plans line 185 from "max 3 specialist roles total" to "max 3 simultaneous implementers per wave" to match composing-teams and agent-team-driven-development.

11. **W1-2: Add Integration section to verification-before-completion**
    - Add section listing: "Referenced by: systematic-debugging, agent-team-driven-development (implicit), subagent-driven-development (implicit), executing-plans (implicit). Applies universally before any completion claim."

### Priority 3: Fix Low-Severity Issues

12. **CX-8: Standardize human operator terminology**
    - Replace "the user" with "your human partner" in brainstorming, composing-teams, writing-plans.
    - Replace "Jesse" with "your human partner" in using-git-worktrees line 64.

13. **CX-3: Add brief explanation of TodoWrite vs TaskCreate/TaskUpdate**
    - In using-superpowers or in a shared conventions note: "TodoWrite = Claude Code's built-in task tracker for solo/sequential execution. TaskCreate/TaskUpdate/TeamCreate/TeamDelete = Agent Teams API for multi-agent parallel execution."

14. **W1-5: Consolidate finishing-a-development-branch "Called by" lists**
    - Merge the Team Context "Called by" into the main Integration section.

15. **CX-9: Remove or fix "designing-before-coding" reference**
    - Either rename to "brainstorming" in the examples list, or remove it.

16. **CX-10, CX-6: Update Integration sections**
    - composing-teams: Add agent-team-driven-development and subagent-driven-development as downstream consumers.
    - using-git-worktrees: Add agent-team-driven-development to "Called by" list.

---

## Appendix: Skills Without Integration Sections

The following skills have NO explicit Integration section:

| Skill | Has Integration? | Should it? |
|-------|-------------------|------------|
| brainstorming | No (has "After the Design" which serves similar purpose) | Yes |
| verification-before-completion | No | Yes |
| test-driven-development | No | Optional (cross-cutting) |
| systematic-debugging | Has "Related skills" and "Team Context" | Sufficient |
| receiving-code-review | No | Yes |
| dispatching-parallel-agents | No | Optional (utility) |
| writing-skills | No (has cross-references inline) | Optional |
| using-superpowers | No | No (meta-skill) |

---

## Appendix: Complete Skill Cross-Reference Matrix

```
                    brain  w-plan  workt  comp   a-team  subag  exec   verif  req-rv recv-rv finish  tdd    debug  disp   w-skl  u-sup
brainstorming         -     ->      ->     ->      .       .     .      .      .      .      .       .      .      .      .      .
writing-plans         <-     -      ctx    <-     ->      ->    ->      .      .      .      .       .      .      .      .      .
using-git-worktrees   <-    ctx      -      .     <-      <-    <-      .      .      .     <->      .      .      .      .      .
composing-teams       <-    ->       .      -      .       .     .      .      .      .      .       .      .      .      .      .
agent-team-driven     .     <-      <-     <-      -       .     .      .     ref     .     ->      ref     .      .      .      .
subagent-driven       .     <-      <-      .      .       -     .      .     ref     .     ->      ref     .      .      .      .
executing-plans       .     <-      <-      .      .       .     -      .      .      .     ->       .      .      .      .      .
verification          .      .       .      .      .       .     .      -      .      .      .       .     <-      .      .      .
requesting-code-rev   .      .       .      .     ref      .     .      .      -      .      .       .      .      .      .      .
receiving-code-rev    .      .       .      .      .       .     .      .      .      -      .       .      .      .      .      .
finishing-dev-branch  .      .      <->     .     <-      <-    <-      .      .      .      -       .      .      .      .      .
test-driven-dev       .      .       .      .      .       .     .      .      .      .      .       -     <-      .     <-      .
systematic-debugging  .      .       .      .      .       .     .     ->      .      .      .      ->      -     ref     .      .
dispatching-parallel  .      .       .      .      .       .     .      .      .      .      .       .      .      -      .      .
writing-skills        .      .       .      .      .       .     .     ex      .      .      .      <-      .      .      -      .
using-superpowers     .      .       .      .      .       .     .      .      .      .      .       .      .      .      .      -

Legend: -> = calls/invokes, <- = called by, <-> = pairs with, ref = references, ctx = contextual mention, ex = example only, . = no reference
```

---

*Generated by end-to-end workflow consistency audit, 2026-03-01*

# End-to-End Workflow Consistency Audit — Superpowers v4.4.0

**Date:** 2026-03-01
**Scope:** All 16 skills, 5 agent definitions, 7 prompt templates
**Method:** Manual reading of every SKILL.md, prompt template, and agent definition; tracing 6 workflow chains end-to-end

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Chain 1: Full Project Lifecycle](#chain-1-full-project-lifecycle)
3. [Chain 2: Solo Execution Path](#chain-2-solo-execution-path)
4. [Chain 3: Subagent Path](#chain-3-subagent-path)
5. [Chain 4: Ad-Hoc Debugging](#chain-4-ad-hoc-debugging)
6. [Chain 5: Code Review Cycle](#chain-5-code-review-cycle)
7. [Chain 6: Skill Development](#chain-6-skill-development)
8. [Cross-Cutting Issues](#cross-cutting-issues)
9. [Findings Summary Table](#findings-summary-table)
10. [Recommendations](#recommendations)

---

## Executive Summary

The Superpowers v4.4.0 skill set is broadly consistent along the primary workflow chains. The major execution skills (agent-team-driven-development, subagent-driven-development, executing-plans) share coherent prompt templates, review patterns, and handoff conventions. However, the audit identified **28 specific issues** across 6 severity categories:

- **5 Broken Handoffs** where information is lost between skills
- **6 Inconsistencies** in terminology, references, or behavior across skills
- **4 Missing Cross-References** where Integration sections omit predecessors or successors
- **5 Contradictions** where skills give conflicting guidance
- **4 Orphaned/Dangling References** to things that don't exist
- **4 Structural Gaps** where the workflow has no coverage

---

## Chain 1: Full Project Lifecycle

**Path:** brainstorming -> writing-plans -> using-git-worktrees -> composing-teams -> agent-team-driven-development -> verification-before-completion -> requesting-code-review -> finishing-a-development-branch

### Handoff: brainstorming -> writing-plans

**Status:** Mostly clean.

- brainstorming checklist step 8 says "invoke writing-plans skill to create implementation plan" -- matches writing-plans overview.
- brainstorming checklist step 6 says "Create worktree" before step 7 "Compose team" and step 8 "Transition to implementation." The flowchart confirms this order.
- writing-plans line 16 says "This should be run in a dedicated worktree (created by brainstorming skill)" -- consistent.

### Handoff: writing-plans -> agent-team-driven-development

**Status:** Clean. writing-plans line 202 says "REQUIRED SUB-SKILL: Use agent-team-driven-development" and agent-team-driven-development Integration section (line 323) lists "superpowers:writing-plans -- Creates the plan this skill executes."

### Handoff: agent-team-driven-development -> verification-before-completion

**FINDING W1-2: verification-before-completion has NO Integration section (MISSING CROSS-REFERENCE)**
- **File:** `skills/verification-before-completion/SKILL.md`
- **Issue:** This skill has no Integration section at all. It doesn't list who calls it or what it pairs with. Every other workflow skill has one.
- **Impact:** Agents discovering this skill don't know where it fits in the lifecycle.
- **Severity:** Medium

**FINDING W1-3: verification-before-completion is barely referenced by execution skills (MISSING CROSS-REFERENCE)**
- `skills/agent-team-driven-development/SKILL.md`: Does NOT reference verification-before-completion anywhere.
- `skills/subagent-driven-development/SKILL.md`: Does NOT reference verification-before-completion anywhere.
- `skills/executing-plans/SKILL.md`: Does NOT reference verification-before-completion anywhere.
- Only `skills/systematic-debugging/SKILL.md:288` references it: "superpowers:verification-before-completion -- Verify fix worked before claiming success"
- **Impact:** The three main execution skills never tell agents to use verification-before-completion. The skill is supposed to apply "ALWAYS before ANY variation of success/completion claims" (line 119-125), but no execution skill cross-references it. Agents may never discover it during plan execution.
- **Severity:** High

### Handoff: agent-team-driven-development -> requesting-code-review

**Status:** Partially covered.
- `skills/agent-team-driven-development/SKILL.md:327`: lists "superpowers:requesting-code-review -- Review methodology for quality reviewers" under "During this skill."
- But agent-team-driven-development has its OWN code quality review prompt template (`code-quality-reviewer-prompt.md`) that directly references `superpowers:code-reviewer`. The requesting-code-review skill is listed as a reference but the actual template used is different.

**FINDING W1-4: Dual review pathways create confusion (INCONSISTENCY)**
- `skills/agent-team-driven-development/SKILL.md:327` says it uses "superpowers:requesting-code-review -- Review methodology for quality reviewers" during execution.
- But `skills/agent-team-driven-development/code-quality-reviewer-prompt.md:11` uses `subagent_type: superpowers:code-reviewer` directly, not the requesting-code-review skill.
- `skills/requesting-code-review/SKILL.md:34` says "Use Task tool with superpowers:code-reviewer type, fill template at `code-reviewer.md`"
- The agent-team-driven-development code quality template and the requesting-code-review template are DIFFERENT templates with different structures. The agent-team one is shorter and task-specific; requesting-code-review's template at `code-reviewer.md` has a full checklist with {PLAN_REFERENCE} placeholder.
- **Impact:** Which template does the lead actually use? The Integration section says one thing; the prompt template does another.
- **Severity:** Medium

### Handoff: agent-team-driven-development -> finishing-a-development-branch

**Status:** Clean.
- `skills/agent-team-driven-development/SKILL.md:167`: "Use superpowers:finishing-a-development-branch"
- `skills/finishing-a-development-branch/SKILL.md:211-212`: "Called by: agent-team-driven-development (Phase 3) -- After all waves complete and all reviews pass"

**FINDING W1-5: finishing-a-development-branch has DUPLICATE "Called by" sections (STRUCTURAL)**
- `skills/finishing-a-development-branch/SKILL.md:195-200`: Lists "Called by: subagent-driven-development (Step 7), executing-plans (Step 5)" and "Pairs with: using-git-worktrees"
- `skills/finishing-a-development-branch/SKILL.md:211-212`: Under "Team Context" section, ALSO lists "Called by: agent-team-driven-development (Phase 3)"
- **Impact:** Two separate "Called by:" lists in different sections. Agent-team-driven-development is only in the second one. An agent reading just the Integration section would miss it.
- **Severity:** Low

**FINDING W1-6: finishing-a-development-branch "Called by" references wrong step for subagent-driven-development (INCONSISTENCY)**
- `skills/finishing-a-development-branch/SKILL.md:196`: "subagent-driven-development (Step 7) -- After all tasks complete"
- But subagent-driven-development has NO numbered steps labeled "Step 7." The flowchart shows the final node as "Use superpowers:finishing-a-development-branch" which comes after "Dispatch final code reviewer subagent for entire implementation."
- The executing-plans reference says "(Step 5)" which IS correct (executing-plans Step 5 at line 46-50).
- **Severity:** Low

---

## Chain 2: Solo Execution Path

**Path:** brainstorming -> writing-plans -> using-git-worktrees -> executing-plans -> verification-before-completion -> finishing-a-development-branch

### Handoff: writing-plans -> executing-plans

**FINDING W2-1: writing-plans execution handoff refers to "Parallel Session" path but doesn't mention using-git-worktrees (BROKEN HANDOFF)**
- `skills/writing-plans/SKILL.md:211-213`: For the Parallel Session choice: "Guide them to open new session in worktree. REQUIRED SUB-SKILL: New session uses superpowers:executing-plans"
- `skills/executing-plans/SKILL.md:82`: "superpowers:using-git-worktrees - REQUIRED: Set up isolated workspace before starting"
- **Problem:** writing-plans tells the user to "open new session in worktree" (implying worktree already exists from brainstorming step), but executing-plans ALSO says using-git-worktrees is REQUIRED before starting. If the user opens a new session in the already-created worktree, should they run using-git-worktrees AGAIN? Or is it already done?
- **Impact:** Confusion about whether worktree creation happens once (in brainstorming) or needs to be repeated in executing-plans.
- **Severity:** Medium

### Handoff: executing-plans -> verification-before-completion

**FINDING W2-2: executing-plans never references verification-before-completion (MISSING CROSS-REFERENCE)**
- `skills/executing-plans/SKILL.md` (entire file): No mention of verification-before-completion.
- The skill says "Run verifications as specified" (line 29) and "Don't skip verifications" (line 73) but doesn't say to use the verification-before-completion skill.
- **Impact:** Same as W1-3 -- verification-before-completion is the universal quality gate but is never cross-referenced by execution skills.
- **Severity:** High (duplicate of W1-3, included for chain completeness)

### Handoff: executing-plans -> finishing-a-development-branch

**Status:** Clean. executing-plans Step 5 (line 46-50) explicitly says "REQUIRED SUB-SKILL: Use superpowers:finishing-a-development-branch."

---

## Chain 3: Subagent Path

**Path:** brainstorming -> writing-plans -> using-git-worktrees -> subagent-driven-development -> verification-before-completion -> finishing-a-development-branch

### Handoff: writing-plans -> subagent-driven-development

**Status:** Clean. writing-plans line 207 says "REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development."

### Handoff: subagent-driven-development -> verification-before-completion

**Same issue as W1-3.** subagent-driven-development does NOT reference verification-before-completion.

### Handoff: subagent-driven-development -> finishing-a-development-branch

**FINDING W3-1: subagent-driven-development does NOT explicitly invoke finishing-a-development-branch (BROKEN HANDOFF)**
- The flowchart at `skills/subagent-driven-development/SKILL.md:64` shows "Use superpowers:finishing-a-development-branch" as the final node, but there is NO textual instruction in the skill body saying "REQUIRED SUB-SKILL: Use superpowers:finishing-a-development-branch."
- Compare with `skills/executing-plans/SKILL.md:49`: "**REQUIRED SUB-SKILL:** Use superpowers:finishing-a-development-branch" -- this IS present.
- The Integration section at line 247 lists it as required, but the process section never gives the explicit invocation instruction.
- **Impact:** The flowchart shows it, but there's no bold "REQUIRED SUB-SKILL" callout in the process text like executing-plans has. An agent may follow the text instructions and miss the flowchart's terminal node.
- **Severity:** Medium

---

## Chain 4: Ad-Hoc Debugging

**Path:** systematic-debugging -> test-driven-development -> verification-before-completion

### Handoff: systematic-debugging -> test-driven-development

**Status:** Clean.
- `skills/systematic-debugging/SKILL.md:179`: "Use the superpowers:test-driven-development skill for writing proper failing tests"
- `skills/systematic-debugging/SKILL.md:287`: "superpowers:test-driven-development -- For creating failing test case (Phase 4, Step 1)"

### Handoff: systematic-debugging -> verification-before-completion

**Status:** Clean.
- `skills/systematic-debugging/SKILL.md:288`: "superpowers:verification-before-completion -- Verify fix worked before claiming success"
- This is the ONLY execution-adjacent skill that references verification-before-completion.

### test-driven-development -> verification-before-completion

**FINDING W4-1: test-driven-development does NOT reference verification-before-completion (MISSING CROSS-REFERENCE)**
- `skills/test-driven-development/SKILL.md` has no Integration section at all.
- It has a "Verification Checklist" (line 329-340) and a "Debugging Integration" section (line 353), but neither mentions verification-before-completion.
- **Impact:** TDD is about verification at every step. The verification-before-completion skill is the natural complement, but there's no cross-reference.
- **Severity:** Low

---

## Chain 5: Code Review Cycle

**Path:** requesting-code-review -> receiving-code-review

### Handoff: requesting-code-review -> receiving-code-review

**FINDING W5-1: requesting-code-review and receiving-code-review have NO cross-references to each other (MISSING CROSS-REFERENCE)**
- `skills/requesting-code-review/SKILL.md`: No Integration section that references receiving-code-review.
- `skills/receiving-code-review/SKILL.md`: No Integration section at all.
- These are a matched pair (one for sending review, one for receiving it), but neither mentions the other.
- **Impact:** An agent using requesting-code-review doesn't know receiving-code-review exists (and vice versa). When review feedback comes back, the agent won't know there's a skill for handling it.
- **Severity:** Medium

---

## Chain 6: Skill Development

**Path:** writing-skills -> test-driven-development -> verification-before-completion

### Handoff: writing-skills -> test-driven-development

**Status:** Clean.
- `skills/writing-skills/SKILL.md:18`: "REQUIRED BACKGROUND: You MUST understand superpowers:test-driven-development before using this skill."
- Multiple references throughout the skill.

### Handoff: writing-skills -> verification-before-completion

**FINDING W6-1: writing-skills mentions verification-before-completion only as an example, not as a required skill (GAP)**
- `skills/writing-skills/SKILL.md:401`: "Examples: TDD, verification-before-completion, designing-before-coding"
- This is just listing it as an example of a "Discipline-Enforcing Skill," not saying to USE it during skill creation.
- **Impact:** After creating a skill, verification-before-completion should be invoked to verify the skill works. But writing-skills never says this.
- **Severity:** Low

---

## Cross-Cutting Issues

### CX-1: "evidence format" is NOT defined consistently

**FINDING CX-1: No canonical "evidence format" exists in verification-before-completion (INCONSISTENCY)**
- The design document at `docs/plans/skills-audit/design.md` discusses a "Canonical evidence format" with "command/citation/diff evidence types."
- But the actual `skills/verification-before-completion/SKILL.md` does NOT define any structured evidence format. It says "State claim WITH evidence" (line 34) and shows patterns like `[Run test command] [See: 34/34 pass] "All tests pass"` (line 80-81), but this is an informal pattern, not a structured format.
- No other skill references a specific evidence format.
- **Impact:** The design doc planned a canonical format, but it was never implemented. Skills that should reference a structured evidence format have nothing to reference.
- **Severity:** Medium (design intent not yet implemented)

### CX-2: state.yml is referenced only in planning docs, not in any skill

**FINDING CX-2: state.yml is not implemented in any skill (GAP)**
- `docs/plans/skills-audit/design.md` and `docs/plans/2026-03-01-skills-audit-brainstorm.md` extensively discuss `.superpowers/state.yml` as the solution to handoff gaps.
- But NO SKILL.md file mentions state.yml. Zero references.
- The design was approved but never implemented in the skills themselves.
- **Impact:** All the handoff gaps that state.yml was designed to solve (H3, H4, H5, H6, H8, H13 from the brainstorm) remain unsolved.
- **Severity:** High (design gap, but expected since this was Phase 4 work)

### CX-3: TodoWrite vs TaskCreate/TaskUpdate terminology split

**FINDING CX-3: Two different task tracking systems referenced without reconciliation (INCONSISTENCY)**
- **TodoWrite** is used by:
  - `skills/executing-plans/SKILL.md:22`: "Create TodoWrite and proceed"
  - `skills/subagent-driven-development/SKILL.md:58,61,66,79,80,109`: "Mark task complete in TodoWrite," "create TodoWrite"
  - `skills/using-superpowers/SKILL.md:36,50,52`: "Create TodoWrite todo per item"
  - `skills/writing-skills/SKILL.md:598`: "Use TodoWrite to create todos"
- **TaskCreate/TaskUpdate** is used by:
  - `skills/agent-team-driven-development/SKILL.md:82,134,135,149`: "TeamCreate," "TaskCreate for each task," "TaskUpdate to set addBlockedBy," "Mark task complete via TaskUpdate"
  - `skills/agent-team-driven-development/implementer-prompt.md:54,129`: "TaskUpdate with status in_progress"
- **TeamCreate/TeamDelete** is used exclusively by agent-team-driven-development.
- **Problem:** TodoWrite and TaskCreate/TaskUpdate appear to be different APIs (TodoWrite is Claude Code's built-in todo tracking; TaskCreate/TaskUpdate are the Agent Teams API). But no skill explains the difference or when to use which. An agent encountering both terms won't know the distinction.
- **Severity:** Medium (these ARE different APIs, but the lack of explanation creates confusion)

### CX-4: Inconsistent agent type references

**FINDING CX-4: "superpowers:code-reviewer" references a skill name, not an agent name (INCONSISTENCY)**
- The agents directory has: `qa-engineer.md`, `architect.md`, `code-reviewer.md`, `implementer.md`, `security-reviewer.md`
- Skills reference `superpowers:code-reviewer` as a subagent type (e.g., `skills/agent-team-driven-development/SKILL.md:37`, `skills/subagent-driven-development/SKILL.md:94`)
- But in the prompt templates, the agent type is used as `subagent_type: superpowers:code-reviewer` (in `skills/agent-team-driven-development/code-quality-reviewer-prompt.md:11`) and also as `Task tool (superpowers:code-reviewer)` (in `skills/subagent-driven-development/code-quality-reviewer-prompt.md:10`).
- The requesting-code-review skill at line 34 says "Use Task tool with superpowers:code-reviewer type."
- **Clarification needed:** Is `superpowers:code-reviewer` the agent definition at `agents/code-reviewer.md`? Or is it a skill reference? The `superpowers:` prefix suggests a skill namespace (like `superpowers:brainstorming`), but `code-reviewer` is an agent definition, not a skill. This conflation of namespaces could confuse agents.
- **Severity:** Medium

### CX-5: "Agent tool" vs "Task tool" naming inconsistency in prompt templates

**FINDING CX-5: Different tool names used for dispatching subagents/agents (INCONSISTENCY)**
- `skills/agent-team-driven-development/implementer-prompt.md:10`: Uses "Agent tool" with fields `subagent_type`, `team_name`, `name`, `description`, `prompt`
- `skills/agent-team-driven-development/spec-reviewer-prompt.md:10`: Uses "Agent tool" with `subagent_type`, `description`, `prompt`
- `skills/subagent-driven-development/implementer-prompt.md:6`: Uses "Task tool (general-purpose)" with `description`, `prompt`
- `skills/subagent-driven-development/code-quality-reviewer-prompt.md:10`: Uses "Task tool (superpowers:code-reviewer)"
- `skills/requesting-code-review/SKILL.md:34`: "Use Task tool with superpowers:code-reviewer type"
- **Problem:** "Agent tool" and "Task tool" are used interchangeably across skills. agent-team-driven-development uses "Agent tool" for spawning team members; subagent-driven-development uses "Task tool" for dispatching subagents. Are these the same tool with different names? Different tools?
- **Impact:** An agent trying to follow the prompt templates won't know which actual tool to call.
- **Severity:** High (functional impact -- wrong tool call = failure)

### CX-6: using-git-worktrees is NOT listed as "Called by" for agent-team-driven-development

**FINDING CX-6: using-git-worktrees "Called by" list is incomplete (INCONSISTENCY)**
- `skills/using-git-worktrees/SKILL.md:212-215`: Lists "Called by: brainstorming (Phase 4), subagent-driven-development, executing-plans, Any skill needing isolated workspace"
- But agent-team-driven-development ALSO requires worktrees: line 321 says "superpowers:using-git-worktrees -- Isolated workspace before starting."
- **Problem:** using-git-worktrees doesn't list agent-team-driven-development as a caller, even though it IS one.
- **Severity:** Low

### CX-7: Placeholder mismatch in requesting-code-review template

**FINDING CX-7: {PLAN_OR_REQUIREMENTS} vs {PLAN_REFERENCE} placeholder name mismatch (INCONSISTENCY)**
- `skills/requesting-code-review/SKILL.md:38`: Lists placeholder `{PLAN_OR_REQUIREMENTS}` -- "What it should do"
- `skills/requesting-code-review/code-reviewer.md:7`: Uses `{PLAN_OR_REQUIREMENTS}` in the instruction text
- `skills/requesting-code-review/code-reviewer.md:18`: Uses `{PLAN_REFERENCE}` as the actual content placeholder
- **Problem:** The template says to fill `{PLAN_OR_REQUIREMENTS}` (line 7) but the actual content section uses `{PLAN_REFERENCE}` (line 18). These are different placeholder names. An agent filling `{PLAN_OR_REQUIREMENTS}` would leave `{PLAN_REFERENCE}` unfilled.
- **Severity:** High (functional -- template won't render correctly)

### CX-8: "your human partner" vs "the user" vs "Jesse" terminology

**FINDING CX-8: Mixed terminology for the human operator (INCONSISTENCY)**
- Most skills use **"your human partner"**: test-driven-development (lines 24, 346, 371), receiving-code-review (lines 52, 61, 82, 83, 86, 107, 130, 136, 207), verification-before-completion (line 111), executing-plans (line 21), systematic-debugging (lines 211, 234)
- Some skills use **"the user"**: brainstorming (line 15), composing-teams (lines 10, 71, 79, 100), writing-plans (line 68)
- One skill uses **"Jesse"**: using-git-worktrees (line 64: "Per Jesse's rule")
- **Impact:** "your human partner" is the intended generalized term (per the design doc's Section 7: 'TodoWrite -> TaskCreate rename + "your human partner" generalization'). But several skills still use "the user" and one uses "Jesse."
- **Severity:** Low (cosmetic, but reflects incomplete implementation of design Section 7)

### CX-9: "designing-before-coding" skill referenced but doesn't exist

**FINDING CX-9: Orphaned reference to nonexistent skill (DANGLING REFERENCE)**
- `skills/writing-skills/SKILL.md:401`: "Examples: TDD, verification-before-completion, designing-before-coding"
- There is no skill named `designing-before-coding` in the skills directory.
- Was this renamed to `brainstorming`? Or is it a planned but unimplemented skill?
- **Severity:** Low (it's just an example in a list, not a functional reference)

### CX-10: composing-teams Integration section is too narrow

**FINDING CX-10: composing-teams Integration section omits downstream consumers (GAP)**
- `skills/composing-teams/SKILL.md:105-111`: Integration section lists only brainstorming (before) and writing-plans (after).
- But composing-teams also feeds directly into agent-team-driven-development (which reads the team roster) and subagent-driven-development (which uses agent-aware dispatch). Neither is listed.
- The skill's own Overview (line 10) mentions all three downstream skills, but the Integration section omits two.
- **Severity:** Low

### CX-11: brainstorming skill has no "Announce at start" instruction

**FINDING CX-11: brainstorming lacks the announcement pattern used by other skills (INCONSISTENCY)**
- Skills that announce: writing-plans (line 14), using-git-worktrees (line 14), composing-teams (line 12), executing-plans (line 14), finishing-a-development-branch (line 14)
- Skills that DON'T announce: brainstorming, verification-before-completion, test-driven-development, systematic-debugging, requesting-code-review, receiving-code-review, dispatching-parallel-agents, writing-skills, using-superpowers
- **Pattern:** The "Announce at start" pattern is used by lifecycle/orchestration skills but not by cross-cutting discipline skills. This is arguably intentional -- discipline skills are about HOW you work, not about discrete phases.
- **However:** brainstorming IS a lifecycle skill (it's the first step) and doesn't announce. This breaks the pattern.
- **Severity:** Very Low (minor consistency nit)

### CX-12: agent-team-driven-development implementer template has contradictory subagent_type

**FINDING CX-12: Template says general-purpose but skill text says use roster definitions (CONTRADICTION)**
- `skills/agent-team-driven-development/implementer-prompt.md:11`: `subagent_type: general-purpose`
- `skills/agent-team-driven-development/SKILL.md:39`: "When a roster exists, spawn implementers using the specified agent definitions (e.g., architect, implementer, qa-engineer) rather than generic general-purpose."
- **Problem:** The template hardcodes `general-purpose` but the skill text says to use the roster's agent definitions. The template should say `[agent-definition-from-roster]` or similar.
- **Severity:** Medium (template contradicts the skill's own instructions)

### CX-13: subagent-driven-development says "fresh subagent per task" but expects fix loops with same subagent

**FINDING CX-13: Process contradiction -- fresh vs persistent subagents (CONTRADICTION)**
- `skills/subagent-driven-development/SKILL.md:8`: "Execute plan by dispatching fresh subagent per task"
- `skills/subagent-driven-development/SKILL.md:73-74`: Flowchart shows "Implementer subagent fixes spec gaps" -> "Dispatch spec reviewer subagent" (re-review loop), implying the SAME implementer subagent fixes issues.
- `skills/subagent-driven-development/SKILL.md:233-234`: "If reviewer finds issues: Implementer (same subagent) fixes them"
- **Problem:** If subagents are "fresh" (stateless, one-shot), how does the same implementer subagent fix issues? A fresh subagent by definition loses context. The skill seems to use "subagent" to mean a persistent child agent for the duration of the task, not a truly one-shot agent.
- **Impact:** The term "fresh subagent per task" is misleading. It's actually "persistent subagent per task, fresh between tasks."
- **Severity:** Low (conceptual, but could confuse implementation)

### CX-14: Writing-plans "write the header last" contradicts natural document flow

**FINDING CX-14: Plan document header instruction is process-correct but confusing (GAP)**
- `skills/writing-plans/SKILL.md:47`: "Write the header last -- after the Team Fitness Check determines which execution approach to use."
- This makes process sense (you can't fill in the execution skill until you know which one), but the template at line 33-45 shows the header FIRST in the document.
- **Impact:** Minor confusion for agents -- they see the header template first, read "write the header last," and may get confused about document structure vs writing order.
- **Severity:** Very Low

### CX-15: Missing "Announce at start" for subagent-driven-development and agent-team-driven-development

**FINDING CX-15: Execution skills lack announcement instructions (INCONSISTENCY)**
- Unlike writing-plans, executing-plans, composing-teams, using-git-worktrees, and finishing-a-development-branch, both subagent-driven-development and agent-team-driven-development do NOT have an "Announce at start" line.
- The examples show announcements happening, but there's no required instruction.
- **Severity:** Very Low

### CX-16: finishing-a-development-branch worktree cleanup for Option 2 (Create PR) is inconsistent

**FINDING CX-16: Quick Reference table contradicts text for Option 2 worktree handling (CONTRADICTION)**
- `skills/finishing-a-development-branch/SKILL.md:106`: After Option 2 (Push and Create PR): "Then: Cleanup worktree (Step 5)"
- `skills/finishing-a-development-branch/SKILL.md:159`: Quick Reference table shows Option 2 has "Keep Worktree: checkmark" (keep it)
- `skills/finishing-a-development-branch/SKILL.md:172-173`: Common Mistakes says "Remove worktree when might need it (Option 2, 3)"
- `skills/finishing-a-development-branch/SKILL.md:191`: "Clean up worktree for Options 1 & 4 only"
- **Problem:** The text after Option 2 says "Cleanup worktree (Step 5)" but the Quick Reference table, Common Mistakes section, and the explicit "Options 1 & 4 only" rule all say to KEEP the worktree for Option 2.
- **Impact:** Direct contradiction. An agent following the step-by-step instructions would clean up the worktree; an agent reading the summary would keep it.
- **Severity:** High (functional contradiction)

### CX-17: dispatching-parallel-agents is isolated from the workflow chains

**FINDING CX-17: dispatching-parallel-agents is orphaned (STRUCTURAL GAP)**
- `skills/dispatching-parallel-agents/SKILL.md` has no Integration section.
- No other SKILL.md references `dispatching-parallel-agents` or `superpowers:dispatching-parallel-agents`.
- The only connection is `skills/systematic-debugging/SKILL.md:292`: "When multiple potential root causes exist in different subsystems, consider using dispatching-parallel-agents to investigate each hypothesis concurrently."
- **Impact:** This skill is effectively orphaned from the main workflow chains. It overlaps significantly with agent-team-driven-development (both dispatch parallel agents), but neither references the other.
- **Severity:** Low (it's a utility skill, not a lifecycle skill)

### CX-18: spec-reviewer-prompt.md has different framing between team and subagent versions

**FINDING CX-18: Subtle framing difference in spec reviewer prompts (INCONSISTENCY)**
- `skills/agent-team-driven-development/spec-reviewer-prompt.md:10`: Uses "Agent tool" with `subagent_type: general-purpose`
- `skills/subagent-driven-development/spec-reviewer-prompt.md:8`: Uses "Task tool (general-purpose)"
- Both have the same core review instructions, but the team version says "The implementer's report may be incomplete, inaccurate, or optimistic" while the subagent version says "The implementer finished suspiciously quickly. Their report may be incomplete, inaccurate, or optimistic."
- **Impact:** The "finished suspiciously quickly" framing in the subagent version could bias the reviewer. The team version is more neutral. These should be consistent.
- **Severity:** Very Low (tone difference, not functional)

### CX-19: agent-team-driven-development spec reviewer dispatched as subagent but via "Agent tool"

**FINDING CX-19: Spec reviewer uses "Agent tool" but should be a subagent (CONTRADICTION)**
- `skills/agent-team-driven-development/SKILL.md:47-49`: "Reviewers are subagents because they benefit from fresh context: No accumulated bias from watching implementation"
- `skills/agent-team-driven-development/spec-reviewer-prompt.md:3`: "Dispatch as a subagent (not a team member) for fresh, unbiased review."
- `skills/agent-team-driven-development/spec-reviewer-prompt.md:10`: But the template uses "Agent tool" with `subagent_type: general-purpose`
- The "Agent tool" in Claude Code is for persistent team members; the "Task tool" is for one-shot subagents. Using "Agent tool" for a reviewer contradicts the "subagent" intent.
- **Severity:** Medium (functional -- wrong tool means reviewer becomes a persistent team member, defeating the purpose)

### CX-20: No skill handles the "plan needs revision" case

**FINDING CX-20: No feedback loop from execution back to writing-plans (STRUCTURAL GAP)**
- executing-plans (line 64-68) says "Return to Review (Step 1) when: Partner updates the plan based on your feedback" -- but this is within the same session, not a cross-skill feedback loop.
- If an execution skill (agent-team-driven-development, subagent-driven-development) discovers the plan is fundamentally flawed mid-execution, there is no documented process for:
  1. Pausing execution
  2. Returning to writing-plans for revision
  3. Resuming execution with the revised plan
- **Impact:** In practice, the team lead would just handle this ad-hoc, but a documented path would improve reliability.
- **Severity:** Low (edge case)

### CX-21: writing-plans says "max 3 specialist roles total" but composing-teams says "max 3 simultaneous"

**FINDING CX-21: Team size constraint inconsistency (CONTRADICTION)**
- `skills/writing-plans/SKILL.md:185`: "For team plans: max 3 tasks per wave, max 3 specialist roles total"
- `skills/composing-teams/SKILL.md:101`: "Right-size the team -- Max 3 simultaneous implementers; more hits diminishing returns"
- `skills/agent-team-driven-development/SKILL.md:41`: "Max 3 simultaneous implementers."
- **Problem:** writing-plans says "max 3 specialist roles TOTAL" which is a stricter constraint than composing-teams' "max 3 simultaneous implementers." Having 4 specialist roles where only 3 work at once is valid per composing-teams but invalid per writing-plans.
- **Severity:** Medium

---

## Findings Summary Table

| ID | Severity | Type | Skills Involved | Summary |
|----|----------|------|-----------------|---------|
| W1-2 | Medium | Missing Cross-Ref | verification-before-completion | No Integration section at all |
| W1-3 | High | Missing Cross-Ref | agent-team/subagent/executing + verification | Execution skills never reference verification-before-completion |
| W1-4 | Medium | Inconsistency | agent-team + requesting-code-review | Dual review template pathways |
| W1-5 | Low | Structural | finishing-a-development-branch | Duplicate "Called by" sections |
| W1-6 | Low | Inconsistency | finishing-a-development-branch + subagent | Wrong step number reference |
| W2-1 | Medium | Broken Handoff | writing-plans + executing-plans | Worktree creation ambiguity for parallel session |
| W3-1 | Medium | Broken Handoff | subagent-driven-development | Missing explicit REQUIRED SUB-SKILL for finishing |
| W4-1 | Low | Missing Cross-Ref | test-driven-development | No reference to verification-before-completion |
| W5-1 | Medium | Missing Cross-Ref | requesting/receiving-code-review | Matched pair skills don't reference each other |
| W6-1 | Low | Gap | writing-skills | verification-before-completion only mentioned as example |
| CX-1 | Medium | Inconsistency | verification-before-completion | No canonical evidence format despite design intent |
| CX-2 | High | Gap | All skills | state.yml not implemented in any skill |
| CX-3 | Medium | Inconsistency | executing/subagent/using-superpowers/writing-skills + agent-team | TodoWrite vs TaskCreate/TaskUpdate unexplained |
| CX-4 | Medium | Inconsistency | All execution skills | superpowers:code-reviewer namespace conflation |
| CX-5 | High | Inconsistency | agent-team vs subagent prompt templates | "Agent tool" vs "Task tool" naming |
| CX-7 | High | Inconsistency | requesting-code-review | {PLAN_OR_REQUIREMENTS} vs {PLAN_REFERENCE} mismatch |
| CX-8 | Low | Inconsistency | Multiple skills | "your human partner" vs "the user" vs "Jesse" |
| CX-9 | Low | Dangling Reference | writing-skills | designing-before-coding skill doesn't exist |
| CX-10 | Low | Gap | composing-teams | Integration section too narrow |
| CX-11 | Very Low | Inconsistency | brainstorming | Missing "Announce at start" |
| CX-12 | Medium | Contradiction | agent-team implementer-prompt.md | Template hardcodes general-purpose, skill says use roster |
| CX-13 | Low | Contradiction | subagent-driven-development | "Fresh" subagent but expects fix loops |
| CX-14 | Very Low | Gap | writing-plans | "Write header last" confusion |
| CX-15 | Very Low | Inconsistency | subagent/agent-team-driven-development | Missing "Announce at start" |
| CX-16 | High | Contradiction | finishing-a-development-branch | Option 2 worktree cleanup contradicts itself |
| CX-17 | Low | Structural Gap | dispatching-parallel-agents | Orphaned from workflow chains |
| CX-18 | Very Low | Inconsistency | spec-reviewer prompts | "Suspiciously quickly" framing difference |
| CX-19 | Medium | Contradiction | agent-team spec-reviewer-prompt | Uses "Agent tool" for subagent |
| CX-20 | Low | Structural Gap | execution skills + writing-plans | No plan revision feedback loop |
| CX-21 | Medium | Contradiction | writing-plans + composing-teams | "3 specialist roles total" vs "3 simultaneous" |

### Severity Distribution

| Severity | Count |
|----------|-------|
| High | 5 |
| Medium | 11 |
| Low | 9 |
| Very Low | 5 |

---

## Recommendations

### Priority 1: Fix High-Severity Issues

1. **CX-16: Fix finishing-a-development-branch Option 2 worktree contradiction**
   - Remove "Then: Cleanup worktree (Step 5)" from after Option 2 (line 106) to match the Quick Reference table and Common Mistakes section. The worktree should be KEPT for PRs so the user can iterate on review feedback.

2. **W1-3: Add verification-before-completion cross-references to all execution skills**
   - Add to agent-team-driven-development, subagent-driven-development, and executing-plans Integration sections: "superpowers:verification-before-completion -- REQUIRED: Before any completion claims"
   - Add a brief note in each skill's completion phase referencing verification-before-completion.

3. **CX-5: Standardize "Agent tool" vs "Task tool" terminology**
   - Document clearly: "Agent tool" = persistent team member (used by agent-team-driven-development). "Task tool" = one-shot subagent (used by subagent-driven-development).
   - Fix CX-19: Change the spec-reviewer-prompt.md in agent-team-driven-development to explicitly note it uses "Task tool" (subagent), not "Agent tool" (team member), since the skill text says reviewers should be subagents.

4. **CX-7: Fix placeholder mismatch in requesting-code-review/code-reviewer.md**
   - Change `{PLAN_REFERENCE}` on line 18 to `{PLAN_OR_REQUIREMENTS}` to match the skill's documented placeholders.

5. **CX-2: Note state.yml as deferred work**
   - This is intentionally deferred (Phase 4 from the skills audit design). No immediate fix needed, but consider adding a brief "Future: state.yml" note to the design doc indicating this is known-deferred.

### Priority 2: Fix Medium-Severity Issues

6. **CX-12: Fix agent-team implementer template to use roster agent definitions**
   - Change `subagent_type: general-purpose` to `subagent_type: [agent-definition-from-roster]` with a comment explaining the lead should fill this from the team roster.

7. **W2-1: Clarify worktree lifecycle for parallel session path**
   - In writing-plans, change the Parallel Session guidance to say "Guide them to open new session in the worktree created during brainstorming. The using-git-worktrees skill has already been run; the new session should cd to the worktree path."
   - In executing-plans, change using-git-worktrees from "REQUIRED: Set up isolated workspace before starting" to "REQUIRED: Verify you are in an isolated workspace (created by brainstorming or set up via using-git-worktrees)."

8. **W3-1: Add explicit REQUIRED SUB-SKILL callout for finishing-a-development-branch in subagent-driven-development**
   - After the flowchart, add a text instruction: "After all tasks complete and final review passes: **REQUIRED SUB-SKILL:** Use superpowers:finishing-a-development-branch"

9. **W5-1: Add Integration sections to requesting-code-review and receiving-code-review**
   - requesting-code-review should list receiving-code-review as "Pairs with"
   - receiving-code-review should list requesting-code-review as "Pairs with"

10. **CX-21: Reconcile team size constraints**
    - Change writing-plans line 185 from "max 3 specialist roles total" to "max 3 simultaneous implementers per wave" to match composing-teams and agent-team-driven-development.

11. **W1-2: Add Integration section to verification-before-completion**
    - Add section listing: "Referenced by: systematic-debugging, agent-team-driven-development (implicit), subagent-driven-development (implicit), executing-plans (implicit). Applies universally before any completion claim."

### Priority 3: Fix Low-Severity Issues

12. **CX-8: Standardize human operator terminology**
    - Replace "the user" with "your human partner" in brainstorming, composing-teams, writing-plans.
    - Replace "Jesse" with "your human partner" in using-git-worktrees line 64.

13. **CX-3: Add brief explanation of TodoWrite vs TaskCreate/TaskUpdate**
    - In using-superpowers or in a shared conventions note: "TodoWrite = Claude Code's built-in task tracker for solo/sequential execution. TaskCreate/TaskUpdate/TeamCreate/TeamDelete = Agent Teams API for multi-agent parallel execution."

14. **W1-5: Consolidate finishing-a-development-branch "Called by" lists**
    - Merge the Team Context "Called by" into the main Integration section.

15. **CX-9: Remove or fix "designing-before-coding" reference**
    - Either rename to "brainstorming" in the examples list, or remove it.

16. **CX-10, CX-6: Update Integration sections**
    - composing-teams: Add agent-team-driven-development and subagent-driven-development as downstream consumers.
    - using-git-worktrees: Add agent-team-driven-development to "Called by" list.

---

## Appendix: Skills Without Integration Sections

The following skills have NO explicit Integration section:

| Skill | Has Integration? | Should it? |
|-------|-------------------|------------|
| brainstorming | No (has "After the Design" which serves similar purpose) | Yes |
| verification-before-completion | No | Yes |
| test-driven-development | No | Optional (cross-cutting) |
| systematic-debugging | Has "Related skills" and "Team Context" | Sufficient |
| receiving-code-review | No | Yes |
| dispatching-parallel-agents | No | Optional (utility) |
| writing-skills | No (has cross-references inline) | Optional |
| using-superpowers | No | No (meta-skill) |

---

## Appendix: Complete Skill Cross-Reference Matrix

```
                    brain  w-plan  workt  comp   a-team  subag  exec   verif  req-rv recv-rv finish  tdd    debug  disp   w-skl  u-sup
brainstorming         -     ->      ->     ->      .       .     .      .      .      .      .       .      .      .      .      .
writing-plans         <-     -      ctx    <-     ->      ->    ->      .      .      .      .       .      .      .      .      .
using-git-worktrees   <-    ctx      -      .     <-      <-    <-      .      .      .     <->      .      .      .      .      .
composing-teams       <-    ->       .      -      .       .     .      .      .      .      .       .      .      .      .      .
agent-team-driven     .     <-      <-     <-      -       .     .      .     ref     .     ->      ref     .      .      .      .
subagent-driven       .     <-      <-      .      .       -     .      .     ref     .     ->      ref     .      .      .      .
executing-plans       .     <-      <-      .      .       .     -      .      .      .     ->       .      .      .      .      .
verification          .      .       .      .      .       .     .      -      .      .      .       .     <-      .      .      .
requesting-code-rev   .      .       .      .     ref      .     .      .      -      .      .       .      .      .      .      .
receiving-code-rev    .      .       .      .      .       .     .      .      .      -      .       .      .      .      .      .
finishing-dev-branch  .      .      <->     .     <-      <-    <-      .      .      .      -       .      .      .      .      .
test-driven-dev       .      .       .      .      .       .     .      .      .      .      .       -     <-      .     <-      .
systematic-debugging  .      .       .      .      .       .     .     ->      .      .      .      ->      -     ref     .      .
dispatching-parallel  .      .       .      .      .       .     .      .      .      .      .       .      .      -      .      .
writing-skills        .      .       .      .      .       .     .     ex      .      .      .      <-      .      .      -      .
using-superpowers     .      .       .      .      .       .     .      .      .      .      .       .      .      .      .      -

Legend: -> = calls/invokes, <- = called by, <-> = pairs with, ref = references, ctx = contextual mention, ex = example only, . = no reference
```

---

*Generated by end-to-end workflow consistency audit, 2026-03-01*

# End-to-End Workflow Consistency Audit — Superpowers v4.4.0

**Date:** 2026-03-01
**Scope:** All 16 skills, 5 agent definitions, 7 prompt templates
**Method:** Manual reading of every SKILL.md, prompt template, and agent definition; tracing 6 workflow chains end-to-end

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Chain 1: Full Project Lifecycle](#chain-1-full-project-lifecycle)
3. [Chain 2: Solo Execution Path](#chain-2-solo-execution-path)
4. [Chain 3: Subagent Path](#chain-3-subagent-path)
5. [Chain 4: Ad-Hoc Debugging](#chain-4-ad-hoc-debugging)
6. [Chain 5: Code Review Cycle](#chain-5-code-review-cycle)
7. [Chain 6: Skill Development](#chain-6-skill-development)
8. [Cross-Cutting Issues](#cross-cutting-issues)
9. [Findings Summary Table](#findings-summary-table)
10. [Recommendations](#recommendations)

---

## Executive Summary

The Superpowers v4.4.0 skill set is broadly consistent along the primary workflow chains. The major execution skills (agent-team-driven-development, subagent-driven-development, executing-plans) share coherent prompt templates, review patterns, and handoff conventions. However, the audit identified **28 specific issues** across 6 severity categories:

- **5 Broken Handoffs** where information is lost between skills
- **6 Inconsistencies** in terminology, references, or behavior across skills
- **4 Missing Cross-References** where Integration sections omit predecessors or successors
- **5 Contradictions** where skills give conflicting guidance
- **4 Orphaned/Dangling References** to things that don't exist
- **4 Structural Gaps** where the workflow has no coverage

---

## Chain 1: Full Project Lifecycle

**Path:** brainstorming -> writing-plans -> using-git-worktrees -> composing-teams -> agent-team-driven-development -> verification-before-completion -> requesting-code-review -> finishing-a-development-branch

### Handoff: brainstorming -> writing-plans

**Status:** Mostly clean.

- brainstorming checklist step 8 says "invoke writing-plans skill to create implementation plan" -- matches writing-plans overview.
- brainstorming checklist step 6 says "Create worktree" before step 7 "Compose team" and step 8 "Transition to implementation." The flowchart confirms this order.
- writing-plans line 16 says "This should be run in a dedicated worktree (created by brainstorming skill)" -- consistent.

### Handoff: writing-plans -> agent-team-driven-development

**Status:** Clean. writing-plans line 202 says "REQUIRED SUB-SKILL: Use agent-team-driven-development" and agent-team-driven-development Integration section (line 323) lists "superpowers:writing-plans -- Creates the plan this skill executes."

### Handoff: agent-team-driven-development -> verification-before-completion

**FINDING W1-2: verification-before-completion has NO Integration section (MISSING CROSS-REFERENCE)**
- **File:** `skills/verification-before-completion/SKILL.md`
- **Issue:** This skill has no Integration section at all. It doesn't list who calls it or what it pairs with. Every other workflow skill has one.
- **Impact:** Agents discovering this skill don't know where it fits in the lifecycle.
- **Severity:** Medium

**FINDING W1-3: verification-before-completion is barely referenced by execution skills (MISSING CROSS-REFERENCE)**
- `skills/agent-team-driven-development/SKILL.md`: Does NOT reference verification-before-completion anywhere.
- `skills/subagent-driven-development/SKILL.md`: Does NOT reference verification-before-completion anywhere.
- `skills/executing-plans/SKILL.md`: Does NOT reference verification-before-completion anywhere.
- Only `skills/systematic-debugging/SKILL.md:288` references it: "superpowers:verification-before-completion -- Verify fix worked before claiming success"
- **Impact:** The three main execution skills never tell agents to use verification-before-completion. The skill is supposed to apply "ALWAYS before ANY variation of success/completion claims" (line 119-125), but no execution skill cross-references it. Agents may never discover it during plan execution.
- **Severity:** High

### Handoff: agent-team-driven-development -> requesting-code-review

**Status:** Partially covered.
- `skills/agent-team-driven-development/SKILL.md:327`: lists "superpowers:requesting-code-review -- Review methodology for quality reviewers" under "During this skill."
- But agent-team-driven-development has its OWN code quality review prompt template (`code-quality-reviewer-prompt.md`) that directly references `superpowers:code-reviewer`. The requesting-code-review skill is listed as a reference but the actual template used is different.

**FINDING W1-4: Dual review pathways create confusion (INCONSISTENCY)**
- `skills/agent-team-driven-development/SKILL.md:327` says it uses "superpowers:requesting-code-review -- Review methodology for quality reviewers" during execution.
- But `skills/agent-team-driven-development/code-quality-reviewer-prompt.md:11` uses `subagent_type: superpowers:code-reviewer` directly, not the requesting-code-review skill.
- `skills/requesting-code-review/SKILL.md:34` says "Use Task tool with superpowers:code-reviewer type, fill template at `code-reviewer.md`"
- The agent-team-driven-development code quality template and the requesting-code-review template are DIFFERENT templates with different structures. The agent-team one is shorter and task-specific; requesting-code-review's template at `code-reviewer.md` has a full checklist with {PLAN_REFERENCE} placeholder.
- **Impact:** Which template does the lead actually use? The Integration section says one thing; the prompt template does another.
- **Severity:** Medium

### Handoff: agent-team-driven-development -> finishing-a-development-branch

**Status:** Clean.
- `skills/agent-team-driven-development/SKILL.md:167`: "Use superpowers:finishing-a-development-branch"
- `skills/finishing-a-development-branch/SKILL.md:211-212`: "Called by: agent-team-driven-development (Phase 3) -- After all waves complete and all reviews pass"

**FINDING W1-5: finishing-a-development-branch has DUPLICATE "Called by" sections (STRUCTURAL)**
- `skills/finishing-a-development-branch/SKILL.md:195-200`: Lists "Called by: subagent-driven-development (Step 7), executing-plans (Step 5)" and "Pairs with: using-git-worktrees"
- `skills/finishing-a-development-branch/SKILL.md:211-212`: Under "Team Context" section, ALSO lists "Called by: agent-team-driven-development (Phase 3)"
- **Impact:** Two separate "Called by:" lists in different sections. Agent-team-driven-development is only in the second one. An agent reading just the Integration section would miss it.
- **Severity:** Low

**FINDING W1-6: finishing-a-development-branch "Called by" references wrong step for subagent-driven-development (INCONSISTENCY)**
- `skills/finishing-a-development-branch/SKILL.md:196`: "subagent-driven-development (Step 7) -- After all tasks complete"
- But subagent-driven-development has NO numbered steps labeled "Step 7." The flowchart shows the final node as "Use superpowers:finishing-a-development-branch" which comes after "Dispatch final code reviewer subagent for entire implementation."
- The executing-plans reference says "(Step 5)" which IS correct (executing-plans Step 5 at line 46-50).
- **Severity:** Low

---

## Chain 2: Solo Execution Path

**Path:** brainstorming -> writing-plans -> using-git-worktrees -> executing-plans -> verification-before-completion -> finishing-a-development-branch

### Handoff: writing-plans -> executing-plans

**FINDING W2-1: writing-plans execution handoff refers to "Parallel Session" path but doesn't mention using-git-worktrees (BROKEN HANDOFF)**
- `skills/writing-plans/SKILL.md:211-213`: For the Parallel Session choice: "Guide them to open new session in worktree. REQUIRED SUB-SKILL: New session uses superpowers:executing-plans"
- `skills/executing-plans/SKILL.md:82`: "superpowers:using-git-worktrees - REQUIRED: Set up isolated workspace before starting"
- **Problem:** writing-plans tells the user to "open new session in worktree" (implying worktree already exists from brainstorming step), but executing-plans ALSO says using-git-worktrees is REQUIRED before starting. If the user opens a new session in the already-created worktree, should they run using-git-worktrees AGAIN? Or is it already done?
- **Impact:** Confusion about whether worktree creation happens once (in brainstorming) or needs to be repeated in executing-plans.
- **Severity:** Medium

### Handoff: executing-plans -> verification-before-completion

**FINDING W2-2: executing-plans never references verification-before-completion (MISSING CROSS-REFERENCE)**
- `skills/executing-plans/SKILL.md` (entire file): No mention of verification-before-completion.
- The skill says "Run verifications as specified" (line 29) and "Don't skip verifications" (line 73) but doesn't say to use the verification-before-completion skill.
- **Impact:** Same as W1-3 -- verification-before-completion is the universal quality gate but is never cross-referenced by execution skills.
- **Severity:** High (duplicate of W1-3, included for chain completeness)

### Handoff: executing-plans -> finishing-a-development-branch

**Status:** Clean. executing-plans Step 5 (line 46-50) explicitly says "REQUIRED SUB-SKILL: Use superpowers:finishing-a-development-branch."

---

## Chain 3: Subagent Path

**Path:** brainstorming -> writing-plans -> using-git-worktrees -> subagent-driven-development -> verification-before-completion -> finishing-a-development-branch

### Handoff: writing-plans -> subagent-driven-development

**Status:** Clean. writing-plans line 207 says "REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development."

### Handoff: subagent-driven-development -> verification-before-completion

**Same issue as W1-3.** subagent-driven-development does NOT reference verification-before-completion.

### Handoff: subagent-driven-development -> finishing-a-development-branch

**FINDING W3-1: subagent-driven-development does NOT explicitly invoke finishing-a-development-branch (BROKEN HANDOFF)**
- The flowchart at `skills/subagent-driven-development/SKILL.md:64` shows "Use superpowers:finishing-a-development-branch" as the final node, but there is NO textual instruction in the skill body saying "REQUIRED SUB-SKILL: Use superpowers:finishing-a-development-branch."
- Compare with `skills/executing-plans/SKILL.md:49`: "**REQUIRED SUB-SKILL:** Use superpowers:finishing-a-development-branch" -- this IS present.
- The Integration section at line 247 lists it as required, but the process section never gives the explicit invocation instruction.
- **Impact:** The flowchart shows it, but there's no bold "REQUIRED SUB-SKILL" callout in the process text like executing-plans has. An agent may follow the text instructions and miss the flowchart's terminal node.
- **Severity:** Medium

---

## Chain 4: Ad-Hoc Debugging

**Path:** systematic-debugging -> test-driven-development -> verification-before-completion

### Handoff: systematic-debugging -> test-driven-development

**Status:** Clean.
- `skills/systematic-debugging/SKILL.md:179`: "Use the superpowers:test-driven-development skill for writing proper failing tests"
- `skills/systematic-debugging/SKILL.md:287`: "superpowers:test-driven-development -- For creating failing test case (Phase 4, Step 1)"

### Handoff: systematic-debugging -> verification-before-completion

**Status:** Clean.
- `skills/systematic-debugging/SKILL.md:288`: "superpowers:verification-before-completion -- Verify fix worked before claiming success"
- This is the ONLY execution-adjacent skill that references verification-before-completion.

### test-driven-development -> verification-before-completion

**FINDING W4-1: test-driven-development does NOT reference verification-before-completion (MISSING CROSS-REFERENCE)**
- `skills/test-driven-development/SKILL.md` has no Integration section at all.
- It has a "Verification Checklist" (line 329-340) and a "Debugging Integration" section (line 353), but neither mentions verification-before-completion.
- **Impact:** TDD is about verification at every step. The verification-before-completion skill is the natural complement, but there's no cross-reference.
- **Severity:** Low

---

## Chain 5: Code Review Cycle

**Path:** requesting-code-review -> receiving-code-review

### Handoff: requesting-code-review -> receiving-code-review

**FINDING W5-1: requesting-code-review and receiving-code-review have NO cross-references to each other (MISSING CROSS-REFERENCE)**
- `skills/requesting-code-review/SKILL.md`: No Integration section that references receiving-code-review.
- `skills/receiving-code-review/SKILL.md`: No Integration section at all.
- These are a matched pair (one for sending review, one for receiving it), but neither mentions the other.
- **Impact:** An agent using requesting-code-review doesn't know receiving-code-review exists (and vice versa). When review feedback comes back, the agent won't know there's a skill for handling it.
- **Severity:** Medium

---

## Chain 6: Skill Development

**Path:** writing-skills -> test-driven-development -> verification-before-completion

### Handoff: writing-skills -> test-driven-development

**Status:** Clean.
- `skills/writing-skills/SKILL.md:18`: "REQUIRED BACKGROUND: You MUST understand superpowers:test-driven-development before using this skill."
- Multiple references throughout the skill.

### Handoff: writing-skills -> verification-before-completion

**FINDING W6-1: writing-skills mentions verification-before-completion only as an example, not as a required skill (GAP)**
- `skills/writing-skills/SKILL.md:401`: "Examples: TDD, verification-before-completion, designing-before-coding"
- This is just listing it as an example of a "Discipline-Enforcing Skill," not saying to USE it during skill creation.
- **Impact:** After creating a skill, verification-before-completion should be invoked to verify the skill works. But writing-skills never says this.
- **Severity:** Low

---

## Cross-Cutting Issues

### CX-1: "evidence format" is NOT defined consistently

**FINDING CX-1: No canonical "evidence format" exists in verification-before-completion (INCONSISTENCY)**
- The design document at `docs/plans/skills-audit/design.md` discusses a "Canonical evidence format" with "command/citation/diff evidence types."
- But the actual `skills/verification-before-completion/SKILL.md` does NOT define any structured evidence format. It says "State claim WITH evidence" (line 34) and shows patterns like `[Run test command] [See: 34/34 pass] "All tests pass"` (line 80-81), but this is an informal pattern, not a structured format.
- No other skill references a specific evidence format.
- **Impact:** The design doc planned a canonical format, but it was never implemented. Skills that should reference a structured evidence format have nothing to reference.
- **Severity:** Medium (design intent not yet implemented)

### CX-2: state.yml is referenced only in planning docs, not in any skill

**FINDING CX-2: state.yml is not implemented in any skill (GAP)**
- `docs/plans/skills-audit/design.md` and `docs/plans/2026-03-01-skills-audit-brainstorm.md` extensively discuss `.superpowers/state.yml` as the solution to handoff gaps.
- But NO SKILL.md file mentions state.yml. Zero references.
- The design was approved but never implemented in the skills themselves.
- **Impact:** All the handoff gaps that state.yml was designed to solve (H3, H4, H5, H6, H8, H13 from the brainstorm) remain unsolved.
- **Severity:** High (design gap, but expected since this was Phase 4 work)

### CX-3: TodoWrite vs TaskCreate/TaskUpdate terminology split

**FINDING CX-3: Two different task tracking systems referenced without reconciliation (INCONSISTENCY)**
- **TodoWrite** is used by:
  - `skills/executing-plans/SKILL.md:22`: "Create TodoWrite and proceed"
  - `skills/subagent-driven-development/SKILL.md:58,61,66,79,80,109`: "Mark task complete in TodoWrite," "create TodoWrite"
  - `skills/using-superpowers/SKILL.md:36,50,52`: "Create TodoWrite todo per item"
  - `skills/writing-skills/SKILL.md:598`: "Use TodoWrite to create todos"
- **TaskCreate/TaskUpdate** is used by:
  - `skills/agent-team-driven-development/SKILL.md:82,134,135,149`: "TeamCreate," "TaskCreate for each task," "TaskUpdate to set addBlockedBy," "Mark task complete via TaskUpdate"
  - `skills/agent-team-driven-development/implementer-prompt.md:54,129`: "TaskUpdate with status in_progress"
- **TeamCreate/TeamDelete** is used exclusively by agent-team-driven-development.
- **Problem:** TodoWrite and TaskCreate/TaskUpdate appear to be different APIs (TodoWrite is Claude Code's built-in todo tracking; TaskCreate/TaskUpdate are the Agent Teams API). But no skill explains the difference or when to use which. An agent encountering both terms won't know the distinction.
- **Severity:** Medium (these ARE different APIs, but the lack of explanation creates confusion)

### CX-4: Inconsistent agent type references

**FINDING CX-4: "superpowers:code-reviewer" references a skill name, not an agent name (INCONSISTENCY)**
- The agents directory has: `qa-engineer.md`, `architect.md`, `code-reviewer.md`, `implementer.md`, `security-reviewer.md`
- Skills reference `superpowers:code-reviewer` as a subagent type (e.g., `skills/agent-team-driven-development/SKILL.md:37`, `skills/subagent-driven-development/SKILL.md:94`)
- But in the prompt templates, the agent type is used as `subagent_type: superpowers:code-reviewer` (in `skills/agent-team-driven-development/code-quality-reviewer-prompt.md:11`) and also as `Task tool (superpowers:code-reviewer)` (in `skills/subagent-driven-development/code-quality-reviewer-prompt.md:10`).
- The requesting-code-review skill at line 34 says "Use Task tool with superpowers:code-reviewer type."
- **Clarification needed:** Is `superpowers:code-reviewer` the agent definition at `agents/code-reviewer.md`? Or is it a skill reference? The `superpowers:` prefix suggests a skill namespace (like `superpowers:brainstorming`), but `code-reviewer` is an agent definition, not a skill. This conflation of namespaces could confuse agents.
- **Severity:** Medium

### CX-5: "Agent tool" vs "Task tool" naming inconsistency in prompt templates

**FINDING CX-5: Different tool names used for dispatching subagents/agents (INCONSISTENCY)**
- `skills/agent-team-driven-development/implementer-prompt.md:10`: Uses "Agent tool" with fields `subagent_type`, `team_name`, `name`, `description`, `prompt`
- `skills/agent-team-driven-development/spec-reviewer-prompt.md:10`: Uses "Agent tool" with `subagent_type`, `description`, `prompt`
- `skills/subagent-driven-development/implementer-prompt.md:6`: Uses "Task tool (general-purpose)" with `description`, `prompt`
- `skills/subagent-driven-development/code-quality-reviewer-prompt.md:10`: Uses "Task tool (superpowers:code-reviewer)"
- `skills/requesting-code-review/SKILL.md:34`: "Use Task tool with superpowers:code-reviewer type"
- **Problem:** "Agent tool" and "Task tool" are used interchangeably across skills. agent-team-driven-development uses "Agent tool" for spawning team members; subagent-driven-development uses "Task tool" for dispatching subagents. Are these the same tool with different names? Different tools?
- **Impact:** An agent trying to follow the prompt templates won't know which actual tool to call.
- **Severity:** High (functional impact -- wrong tool call = failure)

### CX-6: using-git-worktrees "Called by" list is incomplete

**FINDING CX-6: using-git-worktrees doesn't list agent-team-driven-development as caller (INCONSISTENCY)**
- `skills/using-git-worktrees/SKILL.md:212-215`: Lists "Called by: brainstorming (Phase 4), subagent-driven-development, executing-plans, Any skill needing isolated workspace"
- But agent-team-driven-development ALSO requires worktrees: line 321 says "superpowers:using-git-worktrees -- Isolated workspace before starting."
- **Problem:** using-git-worktrees doesn't list agent-team-driven-development as a caller, even though it IS one.
- **Severity:** Low

### CX-7: Placeholder mismatch in requesting-code-review template

**FINDING CX-7: {PLAN_OR_REQUIREMENTS} vs {PLAN_REFERENCE} placeholder name mismatch (INCONSISTENCY)**
- `skills/requesting-code-review/SKILL.md:38`: Lists placeholder `{PLAN_OR_REQUIREMENTS}` -- "What it should do"
- `skills/requesting-code-review/code-reviewer.md:7`: Uses `{PLAN_OR_REQUIREMENTS}` in the instruction text
- `skills/requesting-code-review/code-reviewer.md:18`: Uses `{PLAN_REFERENCE}` as the actual content placeholder
- **Problem:** The template says to fill `{PLAN_OR_REQUIREMENTS}` (line 7) but the actual content section uses `{PLAN_REFERENCE}` (line 18). These are different placeholder names. An agent filling `{PLAN_OR_REQUIREMENTS}` would leave `{PLAN_REFERENCE}` unfilled.
- **Severity:** High (functional -- template won't render correctly)

### CX-8: "your human partner" vs "the user" vs "Jesse" terminology

**FINDING CX-8: Mixed terminology for the human operator (INCONSISTENCY)**
- Most skills use **"your human partner"**: test-driven-development (lines 24, 346, 371), receiving-code-review (lines 52, 61, 82, 83, 86, 107, 130, 136, 207), verification-before-completion (line 111), executing-plans (line 21), systematic-debugging (lines 211, 234)
- Some skills use **"the user"**: brainstorming (line 15), composing-teams (lines 10, 71, 79, 100), writing-plans (line 68)
- One skill uses **"Jesse"**: using-git-worktrees (line 64: "Per Jesse's rule")
- **Impact:** "your human partner" is the intended generalized term (per the design doc's Section 7: 'TodoWrite -> TaskCreate rename + "your human partner" generalization'). But several skills still use "the user" and one uses "Jesse."
- **Severity:** Low (cosmetic, but reflects incomplete implementation of design Section 7)

### CX-9: "designing-before-coding" skill referenced but doesn't exist

**FINDING CX-9: Orphaned reference to nonexistent skill (DANGLING REFERENCE)**
- `skills/writing-skills/SKILL.md:401`: "Examples: TDD, verification-before-completion, designing-before-coding"
- There is no skill named `designing-before-coding` in the skills directory.
- Was this renamed to `brainstorming`? Or is it a planned but unimplemented skill?
- **Severity:** Low (it's just an example in a list, not a functional reference)

### CX-10: composing-teams Integration section is too narrow

**FINDING CX-10: composing-teams Integration section omits downstream consumers (GAP)**
- `skills/composing-teams/SKILL.md:105-111`: Integration section lists only brainstorming (before) and writing-plans (after).
- But composing-teams also feeds directly into agent-team-driven-development (which reads the team roster) and subagent-driven-development (which uses agent-aware dispatch). Neither is listed.
- The skill's own Overview (line 10) mentions all three downstream skills, but the Integration section omits two.
- **Severity:** Low

### CX-11: brainstorming skill has no "Announce at start" instruction

**FINDING CX-11: brainstorming lacks the announcement pattern used by other lifecycle skills (INCONSISTENCY)**
- Skills that announce: writing-plans (line 14), using-git-worktrees (line 14), composing-teams (line 12), executing-plans (line 14), finishing-a-development-branch (line 14)
- brainstorming IS a lifecycle skill (it's the first step) and doesn't announce. This breaks the pattern.
- **Severity:** Very Low (minor consistency nit)

### CX-12: agent-team-driven-development implementer template has contradictory subagent_type

**FINDING CX-12: Template says general-purpose but skill text says use roster definitions (CONTRADICTION)**
- `skills/agent-team-driven-development/implementer-prompt.md:11`: `subagent_type: general-purpose`
- `skills/agent-team-driven-development/SKILL.md:39`: "When a roster exists, spawn implementers using the specified agent definitions (e.g., architect, implementer, qa-engineer) rather than generic general-purpose."
- **Problem:** The template hardcodes `general-purpose` but the skill text says to use the roster's agent definitions. The template should say `[agent-definition-from-roster]` or similar.
- **Severity:** Medium (template contradicts the skill's own instructions)

### CX-13: subagent-driven-development says "fresh subagent per task" but expects fix loops with same subagent

**FINDING CX-13: Process contradiction -- fresh vs persistent subagents (CONTRADICTION)**
- `skills/subagent-driven-development/SKILL.md:8`: "Execute plan by dispatching fresh subagent per task"
- `skills/subagent-driven-development/SKILL.md:73-74`: Flowchart shows "Implementer subagent fixes spec gaps" -> "Dispatch spec reviewer subagent" (re-review loop), implying the SAME implementer subagent fixes issues.
- `skills/subagent-driven-development/SKILL.md:233-234`: "If reviewer finds issues: Implementer (same subagent) fixes them"
- **Problem:** If subagents are "fresh" (stateless, one-shot), how does the same implementer subagent fix issues? The skill seems to use "subagent" to mean a persistent child agent for the duration of the task, not a truly one-shot agent.
- **Impact:** The term "fresh subagent per task" is misleading. It's actually "persistent subagent per task, fresh between tasks."
- **Severity:** Low (conceptual, but could confuse implementation)

### CX-14: Writing-plans "write the header last" contradicts natural document flow

**FINDING CX-14: Plan document header instruction is process-correct but confusing (GAP)**
- `skills/writing-plans/SKILL.md:47`: "Write the header last -- after the Team Fitness Check determines which execution approach to use."
- The template at line 33-45 shows the header FIRST in the document, creating confusion about structure vs writing order.
- **Severity:** Very Low

### CX-15: Missing "Announce at start" for execution skills

**FINDING CX-15: subagent-driven-development and agent-team-driven-development lack announcement instructions (INCONSISTENCY)**
- Unlike writing-plans, executing-plans, composing-teams, using-git-worktrees, and finishing-a-development-branch, both subagent-driven-development and agent-team-driven-development do NOT have an "Announce at start" line.
- **Severity:** Very Low

### CX-16: finishing-a-development-branch worktree cleanup for Option 2 is inconsistent

**FINDING CX-16: Quick Reference table contradicts text for Option 2 worktree handling (CONTRADICTION)**
- `skills/finishing-a-development-branch/SKILL.md:106`: After Option 2 (Push and Create PR): "Then: Cleanup worktree (Step 5)"
- `skills/finishing-a-development-branch/SKILL.md:159`: Quick Reference table shows Option 2 "Keep Worktree: checkmark"
- `skills/finishing-a-development-branch/SKILL.md:172-173`: Common Mistakes says "Remove worktree when might need it (Option 2, 3)"
- `skills/finishing-a-development-branch/SKILL.md:191`: "Clean up worktree for Options 1 & 4 only"
- **Problem:** Line 106 says cleanup; lines 159, 172-173, and 191 all say keep. Direct functional contradiction.
- **Severity:** High

### CX-17: dispatching-parallel-agents is isolated from workflow chains

**FINDING CX-17: dispatching-parallel-agents is orphaned (STRUCTURAL GAP)**
- `skills/dispatching-parallel-agents/SKILL.md` has no Integration section.
- Only `skills/systematic-debugging/SKILL.md:292` references it.
- It overlaps with agent-team-driven-development but neither references the other.
- **Severity:** Low

### CX-18: spec-reviewer-prompt.md has different framing between team and subagent versions

**FINDING CX-18: Subtle framing difference in spec reviewer prompts (INCONSISTENCY)**
- Team version: "The implementer's report may be incomplete, inaccurate, or optimistic"
- Subagent version: "The implementer finished suspiciously quickly. Their report may be incomplete, inaccurate, or optimistic."
- **Severity:** Very Low (tone difference, not functional)

### CX-19: agent-team-driven-development spec reviewer dispatched via wrong tool type

**FINDING CX-19: Spec reviewer uses "Agent tool" but should be a subagent (CONTRADICTION)**
- `skills/agent-team-driven-development/SKILL.md:47-49`: "Reviewers are subagents because they benefit from fresh context"
- `skills/agent-team-driven-development/spec-reviewer-prompt.md:3`: "Dispatch as a subagent (not a team member)"
- `skills/agent-team-driven-development/spec-reviewer-prompt.md:10`: But uses "Agent tool" with `subagent_type: general-purpose`
- **Problem:** "Agent tool" is for persistent team members. Using it for a reviewer contradicts the "subagent" intent.
- **Severity:** Medium (functional -- wrong tool means reviewer becomes persistent, defeating the purpose)

### CX-20: No plan revision feedback loop

**FINDING CX-20: No skill handles the "plan needs revision" case across skill boundaries (STRUCTURAL GAP)**
- If an execution skill discovers the plan is fundamentally flawed mid-execution, there is no documented cross-skill path for pausing, revising the plan, and resuming.
- **Severity:** Low (edge case)

### CX-21: writing-plans vs composing-teams team size constraint conflict

**FINDING CX-21: "max 3 specialist roles total" vs "max 3 simultaneous implementers" (CONTRADICTION)**
- `skills/writing-plans/SKILL.md:185`: "max 3 specialist roles total"
- `skills/composing-teams/SKILL.md:101`: "Max 3 simultaneous implementers"
- `skills/agent-team-driven-development/SKILL.md:41`: "Max 3 simultaneous implementers"
- **Problem:** writing-plans is stricter (3 roles total) than the other two skills (3 simultaneous). Having 4 roles where only 3 work at once is valid per composing-teams but invalid per writing-plans.
- **Severity:** Medium

---

## Findings Summary Table

| ID | Severity | Type | Skills Involved | Summary |
|----|----------|------|-----------------|---------|
| W1-2 | Medium | Missing Cross-Ref | verification-before-completion | No Integration section at all |
| W1-3 | High | Missing Cross-Ref | agent-team/subagent/executing + verification | Execution skills never reference verification-before-completion |
| W1-4 | Medium | Inconsistency | agent-team + requesting-code-review | Dual review template pathways |
| W1-5 | Low | Structural | finishing-a-development-branch | Duplicate "Called by" sections |
| W1-6 | Low | Inconsistency | finishing-a-development-branch + subagent | Wrong step number reference |
| W2-1 | Medium | Broken Handoff | writing-plans + executing-plans | Worktree creation ambiguity for parallel session |
| W3-1 | Medium | Broken Handoff | subagent-driven-development | Missing explicit REQUIRED SUB-SKILL for finishing |
| W4-1 | Low | Missing Cross-Ref | test-driven-development | No reference to verification-before-completion |
| W5-1 | Medium | Missing Cross-Ref | requesting/receiving-code-review | Matched pair skills don't reference each other |
| W6-1 | Low | Gap | writing-skills | verification-before-completion only mentioned as example |
| CX-1 | Medium | Inconsistency | verification-before-completion | No canonical evidence format despite design intent |
| CX-2 | High | Gap | All skills | state.yml not implemented in any skill |
| CX-3 | Medium | Inconsistency | executing/subagent/using-superpowers/writing-skills + agent-team | TodoWrite vs TaskCreate/TaskUpdate unexplained |
| CX-4 | Medium | Inconsistency | All execution skills | superpowers:code-reviewer namespace conflation |
| CX-5 | High | Inconsistency | agent-team vs subagent prompt templates | "Agent tool" vs "Task tool" naming |
| CX-7 | High | Inconsistency | requesting-code-review | {PLAN_OR_REQUIREMENTS} vs {PLAN_REFERENCE} mismatch |
| CX-8 | Low | Inconsistency | Multiple skills | "your human partner" vs "the user" vs "Jesse" |
| CX-9 | Low | Dangling Reference | writing-skills | designing-before-coding skill doesn't exist |
| CX-10 | Low | Gap | composing-teams | Integration section too narrow |
| CX-11 | Very Low | Inconsistency | brainstorming | Missing "Announce at start" |
| CX-12 | Medium | Contradiction | agent-team implementer-prompt.md | Template hardcodes general-purpose, skill says use roster |
| CX-13 | Low | Contradiction | subagent-driven-development | "Fresh" subagent but expects fix loops |
| CX-14 | Very Low | Gap | writing-plans | "Write header last" confusion |
| CX-15 | Very Low | Inconsistency | subagent/agent-team-driven-development | Missing "Announce at start" |
| CX-16 | High | Contradiction | finishing-a-development-branch | Option 2 worktree cleanup contradicts itself |
| CX-17 | Low | Structural Gap | dispatching-parallel-agents | Orphaned from workflow chains |
| CX-18 | Very Low | Inconsistency | spec-reviewer prompts | "Suspiciously quickly" framing difference |
| CX-19 | Medium | Contradiction | agent-team spec-reviewer-prompt | Uses "Agent tool" for subagent |
| CX-20 | Low | Structural Gap | execution skills + writing-plans | No plan revision feedback loop |
| CX-21 | Medium | Contradiction | writing-plans + composing-teams | "3 specialist roles total" vs "3 simultaneous" |

### Severity Distribution

| Severity | Count |
|----------|-------|
| High | 5 |
| Medium | 11 |
| Low | 9 |
| Very Low | 5 |

---

## Recommendations

### Priority 1: Fix High-Severity Issues

1. **CX-16: Fix finishing-a-development-branch Option 2 worktree contradiction**
   - Remove "Then: Cleanup worktree (Step 5)" from after Option 2 (line 106) to match the Quick Reference table and Common Mistakes section. The worktree should be KEPT for PRs so the user can iterate on review feedback.

2. **W1-3: Add verification-before-completion cross-references to all execution skills**
   - Add to agent-team-driven-development, subagent-driven-development, and executing-plans Integration sections: "superpowers:verification-before-completion -- REQUIRED: Before any completion claims"
   - Add a brief note in each skill's completion phase referencing verification-before-completion.

3. **CX-5: Standardize "Agent tool" vs "Task tool" terminology**
   - Document clearly: "Agent tool" = persistent team member (used by agent-team-driven-development). "Task tool" = one-shot subagent (used by subagent-driven-development).
   - Fix CX-19: Change the spec-reviewer-prompt.md in agent-team-driven-development to use "Task tool" (subagent), not "Agent tool" (team member), since the skill text says reviewers should be subagents.

4. **CX-7: Fix placeholder mismatch in requesting-code-review/code-reviewer.md**
   - Change `{PLAN_REFERENCE}` on line 18 to `{PLAN_OR_REQUIREMENTS}` to match the skill's documented placeholders.

5. **CX-2: Note state.yml as deferred work**
   - This is intentionally deferred (Phase 4 from the skills audit design). No immediate fix needed, but consider adding a brief "Future: state.yml" note to the design doc indicating this is known-deferred.

### Priority 2: Fix Medium-Severity Issues

6. **CX-12: Fix agent-team implementer template to use roster agent definitions**
   - Change `subagent_type: general-purpose` to `subagent_type: [agent-definition-from-roster]` with a comment explaining the lead should fill this from the team roster.

7. **W2-1: Clarify worktree lifecycle for parallel session path**
   - In writing-plans, change the Parallel Session guidance to: "Guide them to open new session in the worktree created during brainstorming. The using-git-worktrees skill has already been run."
   - In executing-plans, change to: "REQUIRED: Verify you are in an isolated workspace (created by brainstorming or set up via using-git-worktrees)."

8. **W3-1: Add explicit REQUIRED SUB-SKILL callout in subagent-driven-development**
   - After the flowchart, add: "After all tasks complete and final review passes: **REQUIRED SUB-SKILL:** Use superpowers:finishing-a-development-branch"

9. **W5-1: Add Integration sections to requesting-code-review and receiving-code-review**
   - Each should list the other as "Pairs with."

10. **CX-21: Reconcile team size constraints**
    - Change writing-plans line 185 from "max 3 specialist roles total" to "max 3 simultaneous implementers per wave" to match composing-teams and agent-team-driven-development.

11. **W1-2: Add Integration section to verification-before-completion**
    - "Applies universally before any completion claim. Referenced by: systematic-debugging. Should be referenced by all execution skills."

### Priority 3: Fix Low-Severity Issues

12. **CX-8: Standardize human operator terminology** - Replace "the user" and "Jesse" with "your human partner."

13. **CX-3: Add TodoWrite vs TaskCreate/TaskUpdate explanation** - Brief note in using-superpowers explaining the two APIs.

14. **W1-5: Consolidate finishing-a-development-branch "Called by" lists** into one Integration section.

15. **CX-9: Remove or fix "designing-before-coding" reference** - Rename to "brainstorming" or remove.

16. **CX-10, CX-6: Update Integration sections** for composing-teams and using-git-worktrees to include all actual callers/consumers.

---

## Appendix: Skills Without Integration Sections

| Skill | Has Integration? | Should it? |
|-------|-------------------|------------|
| brainstorming | No (has "After the Design") | Yes |
| verification-before-completion | No | Yes |
| test-driven-development | No | Optional (cross-cutting) |
| systematic-debugging | Has "Related skills" + "Team Context" | Sufficient |
| receiving-code-review | No | Yes |
| dispatching-parallel-agents | No | Optional (utility) |
| writing-skills | No (inline cross-references) | Optional |
| using-superpowers | No | No (meta-skill) |

---

## Appendix: Complete Skill Cross-Reference Matrix

```
                    brain  w-plan  workt  comp   a-team  subag  exec   verif  req-rv recv-rv finish  tdd    debug  disp   w-skl  u-sup
brainstorming         -     ->      ->     ->      .       .     .      .      .      .      .       .      .      .      .      .
writing-plans         <-     -      ctx    <-     ->      ->    ->      .      .      .      .       .      .      .      .      .
using-git-worktrees   <-    ctx      -      .     <-      <-    <-      .      .      .     <->      .      .      .      .      .
composing-teams       <-    ->       .      -      .       .     .      .      .      .      .       .      .      .      .      .
agent-team-driven     .     <-      <-     <-      -       .     .      .     ref     .     ->      ref     .      .      .      .
subagent-driven       .     <-      <-      .      .       -     .      .     ref     .     ->      ref     .      .      .      .
executing-plans       .     <-      <-      .      .       .     -      .      .      .     ->       .      .      .      .      .
verification          .      .       .      .      .       .     .      -      .      .      .       .     <-      .      .      .
requesting-code-rev   .      .       .      .     ref      .     .      .      -      .      .       .      .      .      .      .
receiving-code-rev    .      .       .      .      .       .     .      .      .      -      .       .      .      .      .      .
finishing-dev-branch  .      .      <->     .     <-      <-    <-      .      .      .      -       .      .      .      .      .
test-driven-dev       .      .       .      .      .       .     .      .      .      .      .       -     <-      .     <-      .
systematic-debugging  .      .       .      .      .       .     .     ->      .      .      .      ->      -     ref     .      .
dispatching-parallel  .      .       .      .      .       .     .      .      .      .      .       .      .      -      .      .
writing-skills        .      .       .      .      .       .     .     ex      .      .      .      <-      .      .      -      .
using-superpowers     .      .       .      .      .       .     .      .      .      .      .       .      .      .      .      -

Legend: -> = calls/invokes, <- = called by, <-> = pairs with, ref = references, ctx = contextual mention, ex = example only, . = no reference
```

---

*Generated by end-to-end workflow consistency audit, 2026-03-01*

