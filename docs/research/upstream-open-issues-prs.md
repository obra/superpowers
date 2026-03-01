# Upstream Open Issues & PRs vs. Superpowers v4.5.0

> **Date:** 2026-03-01
> **Repository:** https://github.com/obra/superpowers
> **Open Issues:** 104 | **Open PRs:** 84
> **Our Version:** v4.5.0 (skills audit implementation, Phases 1-3)

## Executive Summary

Of 104 open issues and 84 open PRs, our v4.5.0 skills audit **directly addresses 38 issues and aligns with 18 PRs**. The remaining gaps fall into: platform support (30+ issues/PRs for non-Claude-Code platforms), infrastructure bugs (hooks, plugin.json), new skill proposals, and deferred Phase 4 items.

---

## Category 1: Already Addressed by v4.5.0

These issues/PRs are fully or substantially addressed by our skills audit changes.

### Issues Addressed

| # | Title | How v4.5.0 Addresses It |
|---|-------|------------------------|
| #583 | Make git worktree isolation optional | Design Section 6 (Worktree Rework): optional skip when user opts out or task is trivial. State.yml tracks worktree preference. |
| #574 | Git worktree not created after brainstorming | Brainstorming checklist now has explicit Step 6 (Create worktree) with verification gate. |
| #566 | writing-plans doesn't enforce TDD structure | Design Section 5 (TDD Structural Enforcement): plan-level test expectations required per task, execution-level RED/GREEN evidence mandatory. |
| #565 | Brainstorming skips design doc review, overwrites with plan | Design Section 2 (Directory-Based Plans): design.md and plan.md are separate files in a directory. Brainstorming never touches plan.md. User gate between design approval and plan writing restored. |
| #551 | Progress-tracking skill for development memory | Design Section 1 (.superpowers/state.yml): persistent state across sessions tracking phase, plan progress, completed tasks, team roster. |
| #530 | Brainstorming should challenge product assumptions | Phase 3 per-skill fixes: brainstorming now includes assumption challenging step (from PR #541 pattern). |
| #528 | Claude skips spec and code quality review | Design Section 4 (Canonical Evidence Format): rejection rule means any report missing required evidence is sent back. Structural enforcement via citation requirements. |
| #526 | Align writing-skills with Anthropic guide | Phase 3: writing-skills updated with anthropic-best-practices.md reference and Anthropic guide patterns. |
| #512 | Brainstorming/writing-plans token efficiency | Design Section 2: directory-based plans with individual task files = ~2.7x token savings. Executors load per-task files. |
| #493 | Unit testing schema introspection instead of functionality | TDD skill now has testing-anti-patterns.md covering this exact case (schema introspection anti-pattern). |
| #490 | New feature mixed with another feature | Brainstorming updated with feature preservation principle. |
| #489 | Boundary coverage of unit-tested variable range | TDD skill now references testing-anti-patterns.md with boundary coverage guidance. |
| #464 | Skills to support Swarm Mode (parallel execution) | agent-team-driven-development skill provides wave-based parallel execution with persistent specialists, per-agent worktrees, and merge coordination. |
| #463 | Controller skips spec/quality reviewer dispatch | Canonical evidence format (Section 4) makes skipping structurally visible. Reports without file:line citations are rejected. |
| #455 | End to End Testing Skill | verification-before-completion now requires fresh verification evidence for all completion claims. |
| #437 | TDD: Add explicit refactoring examples | Phase 3 per-skill fixes addressed TDD gaps. |
| #436 | Code-reviewer: Support uncommitted changes | requesting-code-review updated with broader review context support. |
| #429 | Support for Claude Code Agent Teams | agent-team-driven-development and composing-teams skills fully leverage TeamCreate, SendMessage, TaskList, Teammate primitives. |
| #384 | Automatic TDD Skill Enforcement | Design Section 5: plan-level test expectations + execution-level RED/GREEN evidence = structural TDD enforcement. |
| #373 | TDD process not followed, no tests written | Same as above: structural enforcement via evidence format prevents this. |
| #371 | Sub-agent can't find worktree location | State.yml tracks all worktree paths (lead + per-implementer). Cross-session recovery reads state cold. |
| #348 | Make git worktree optional/removable | Same as #583: worktree rework makes isolation optional. |
| #337 | Make plan file save location configurable | Design Section 2: directory-based plans structure. While we didn't add env var config, the directory structure is cleaner. |
| #315 | Redundant subagent/parallel session prompt in Codex | Phase 3 per-skill fixes: spawn prompt minimization when project agents exist. |
| #299 | Improve worktree UX: caching and env setup | using-git-worktrees includes auto-detect setup commands and baseline test verification. |
| #291 | subagent-driven-development: Add final fresh-eyes review | All three executors (subagent-driven, agent-team-driven, executing-plans) now dispatch final cross-cutting code reviewer after all tasks. |
| #280 | writing-skills: Inconsistent file reference syntax | Phase 3: writing-skills updated with consistent cross-reference syntax. |
| #279 | using-git-worktrees: Project-local .worktrees/ causes duplicate CLAUDE.md loading | Worktree rework layers on native EnterWorktree, reducing this class of issues. |
| #248 | Best practice for domain-specific specialists | composing-teams skill handles specialist discovery, tier-based presentation, and user selection. |
| #238 | Worktree cleanup fails when CWD is inside worktree | finishing-a-development-branch updated with correct CWD-first cleanup ordering. |
| #237 | Subagents miss using-superpowers context | using-superpowers updated. Spawn prompts now include skill references. |
| #229 | Spec review for writing-plans | Design Section 3 (Verification Gates): precondition checks at each handoff. |
| #186 | Worktrees for debugging | Worktree creation now explicit in brainstorming checklist. |
| #167 | finishing-a-development-branch fails in worktree | finishing skill updated with worktree-aware checkout and cleanup ordering. |
| #158 | Persisting the conversation (be stateful) | State.yml provides cross-session persistence. Phase/plan/worktree state survives session loss. |
| #147 | After compact, forgets review in subagent-driven | State.yml persists workflow progress. Session-start hook can reload context. |
| #123 | Plan committed without user review chance | Brainstorming now has explicit user gate before plan writing. Design doc is committed separately. |
| #107 | Claude Code doesn't follow After the Design section | Brainstorming checklist enforced with TaskCreate per item. After the Design section rebuilt with explicit steps. |
| #87 | Modular task files for token reduction | Design Section 2: directory-based plans with tasks/ subdirectory. |

### PRs Aligned With

| PR # | Title | Alignment |
|------|-------|-----------|
| #578 | Phantom completion fix + persistent validator pool | Our canonical evidence format (Section 4) implements the same citation-based approach. We require file:line evidence in reviews. |
| #520 | Smart question batching, visual previews | Phase 3 brainstorming improvements include this pattern. |
| #498 | Boundary coverage and anti-patterns for testing | Our TDD skill and testing-anti-patterns.md cover the same issues (#489, #490, #493). |
| #483 | Restore worktree step in brainstorming | Our brainstorming has explicit worktree step in checklist. |
| #471 | Align writing-skills with Anthropic guide | Our writing-skills includes anthropic-best-practices.md. |
| #448 | Reviewing-plans skill + namespace docs/plans | Our directory-based plans and verification gates achieve the same goals. |
| #442 | Plan status tracking (pending/executed) | Our state.yml tracks plan.status. |
| #391 | finishing-a-development-branch: worktree CWD ordering | Our finishing skill includes correct cleanup ordering. |
| #386 | Brainstorming: add research existing solutions step | Phase 3 brainstorming improvements. |
| #541 | Proactive assumption challenging in brainstorming | Phase 3 brainstorming improvements. |
| #340 | Configurable plans directory | Our directory-based plans partially address the organization concern. |
| #235 | Add principles of phase design to writing-plans | Phase 3 writing-plans improvements. |
| #172 | Explicit TDD sub-skill requirements in writing-plans | Our TDD structural enforcement (Section 5) goes further than this PR. |
| #508 | Persistent-planning skill for shared file-based memory | Our state.yml + directory-based plans achieve similar persistent state goals. |
| #555 | Progress bootstrap/tracker for .progress memory | Our state.yml tracks implementation progress (completed_tasks, current_wave). |
| #459 | Improve using-superpowers description and conciseness | Our using-superpowers was updated in Phase 3. |
| #534 | Quick mode for one-off tasks | Phase 4 deferred item (workflow tiering), but using-superpowers was streamlined. |
| #579 | Brainstorming: add scale/volume discovery question | Phase 3 brainstorming improvements. |

---

## Category 2: High Priority Gaps (Should Fix)

These are real problems that our v4.5.0 does NOT fully address.

### Infrastructure / Hook Bugs

| # | Title | What's Needed | Priority |
|---|-------|---------------|----------|
| #577 | SessionStart hook fails on Linux: CLAUDE_PLUGIN_ROOT not expanding | Fix single quotes to double quotes in hooks.json command. Pure infrastructure bug. PRs #584, #585 have fixes. | **Critical** -- breaks plugin on Linux |
| #571 | session-start hook hangs on bash 5.3+ | Heredoc variable expansion bug. PR #572 has fix (use printf instead of heredoc). | **Critical** -- hangs plugin on bash 5.3 |
| #529 | v4.3.1 regressed Windows hook fix from PR #331 | hooks.json and session-start naming. Windows-specific. | **High** -- breaks plugin on Windows |
| #546 | plugin.json contains unrecognized keys: category, source | Remove non-standard keys from plugin.json. Simple fix. | **High** -- prevents plugin from loading |

### Behavioral / Skill Gaps

| # | Title | What's Needed | Priority |
|---|-------|---------------|----------|
| #485 | Model improvised run_in_background despite skill instructions | subagent-driven-development Red Flags need stronger language about why sequential dispatch is required (beyond "conflicts" -- mention TaskOutput bug, background retrieval unreliability). | **High** -- model ignores skill instructions |
| #473 | dispatching-parallel-agents: agents freeze on dev tasks | Add explicit autonomy level section to dispatch prompts. Differentiate investigation tasks (natural autonomy) from development tasks (need explicit "FULL AUTONOMY" framing). | **High** -- agents freeze instead of working |
| #472 | Concealment directives prevent diagnosing failures | using-superpowers should allow agents to report stuck/waiting states. Add exception: "If you are blocked waiting for input, say so." The EXTREMELY_IMPORTANT wrapper should not prevent failure surfacing. | **High** -- users can't diagnose stuck sessions |
| #476 | Claude chains commands with && causing consent prompts | code-reviewer and other skills should advise running git commands separately. PR #480 addresses this. | **Medium** |
| #495 | Architecture check before feature implementation | brainstorming could include an architecture awareness step that checks existing design constraints before proposing solutions. Not currently in our skill. | **Medium** |
| #479 | Code/security review insufficient during implementation | A dedicated security-review skill or security dimension in code-quality review. PR #560 proposes one. | **Medium** |
| #451 | writing-skills: Avoid exclamation marks in inline code spans | Minor writing-skills fix. | **Low** |

### Feature Requests We Should Consider

| # | Title | What's Needed | Priority |
|---|-------|---------------|----------|
| #374 | Add E2E browser testing for web app development | A skill for end-to-end validation using playwright/browser testing. Our TDD skill covers unit/integration but not E2E. | **Medium** -- common gap reported by users |
| #246 | Add context: fork option to systematic-debugging | Debugging skill could benefit from "fork context" approach for exploring multiple hypotheses. | **Low** |
| #231 | Hook arbitrary code research tools into workflow | Extensibility mechanism for custom research tools in brainstorming/planning. | **Low** |

---

## Category 3: Medium Priority (Nice to Have)

### Deferred Phase 4 Items

These were explicitly deferred to Phase 4 of our audit design.

| # | Title | Status |
|---|-------|--------|
| PR #534 | Quick mode for one-off tasks | Phase 4: Workflow tiering (quick / standard / complex). |
| PR #547 | Model-aware agents | Phase 4: Model tiering (opus / sonnet / haiku defaults). |
| #306 | Specify different models for different task types | Phase 4: Model tiering. |
| #465 | Clear documentation per model/version | Phase 4: Model tiering documentation. |

### Upstream PRs Worth Evaluating

| PR # | Title | Assessment |
|------|-------|-----------|
| #578 | Phantom completion fix + persistent validator pool | **Adopt Phase 1 (mandatory citations).** Our evidence format is conceptually identical. Phase 2 (persistent validators) is worth adopting for team mode -- reduces review startup overhead and enables cross-task dependency detection. |
| #448 | Reviewing-plans skill + namespace docs/plans | **Consider adopting.** We have verification gates but not a dedicated reviewing-plans skill. The 3-Example Rule (verify naming conventions against 3+ codebase examples) is a powerful mechanism our gates don't include. |
| #564 | Auditing AI-generated code skill | **Consider adopting.** Addresses a gap our code-review doesn't cover: AI-specific failure patterns (dead validation, hallucinated imports, monolithic components). |
| #560 | Security review skill | **Consider adopting.** Complements our code quality review with security-specific checks (input validation, auth, data exposure). |
| #480 | Prevent && command chaining in code reviewer | **Adopt.** Simple fix for real consent-prompt friction (#476). |
| #520 | Smart question batching in brainstorming | **Already aligned.** Our Phase 3 includes this pattern. |
| #498 | Boundary coverage and anti-patterns | **Already aligned.** Covered by our testing-anti-patterns.md. |
| #442 | Plan status tracking | **Already aligned.** Our state.yml tracks plan.status. |
| #391 | finishing-a-development-branch CWD ordering | **Already aligned.** Our finishing skill includes this fix. |
| #340 | Configurable plans directory (SUPERPOWERS_PLANS_DIR) | **Consider for v4.6.** Simple env var that respects user preference for plan location. |
| #508 | Persistent-planning skill | **Overlaps with state.yml.** Our approach is simpler (YAML state) vs. their 3-file pattern. Worth reviewing for ideas. |
| #555 | Progress bootstrap/tracker | **Overlaps with state.yml.** Similar concept, different implementation. |

### Issues That Need Minor Work

| # | Title | What's Needed |
|---|-------|---------------|
| #559 | Repeated message continue printing | Likely a hook output issue. Investigate whether our hook changes affect this. |
| #536 | What happened to systematic-debugging | Documentation/visibility issue. Our systematic-debugging skill exists and is functional. |
| #478 | Clear context after detailed plan -- Claude Code | Not a Superpowers issue per se -- relates to Claude Code context management. State.yml helps with recovery after compact. |
| #396 | "Prompt is too long" and impossible to compact | Token budget issue. Our directory-based plans help (load per-task files), but this is partially a Claude Code limitation. |
| #227 | write-plan exceeding 32K output token limit | Directory-based plans with split task files reduce this. Plans should reference files rather than embedding complete code. |
| #408 | write-plan error writing files | Intermittent "invalid argument" error. Not reproducible on our setup. |

---

## Category 4: Low Priority / Stale / Not Applicable

### Platform Support (Not Our Scope)

These issues/PRs relate to platforms other than Claude Code. Our fork focuses on Claude Code.

| # | Type | Title | Platform |
|---|------|-------|----------|
| #554 | Issue | Codex not automatically using skills | Codex |
| #503 | Issue | Add Support for Kiro CLI | Kiro |
| #445 | Issue | Codex usage issues | Codex |
| #439 | Issue | opencode: Skills not triggered with big files | OpenCode |
| #433 | Issue | opencode: Agent not following basic workflow | OpenCode |
| #381 | Issue | opencode: Cannot use skill | OpenCode |
| #368 | Issue | v4.1.1 causing opencode blank screen | OpenCode |
| #355 | Issue | Plugin installation flaky (name collision) | Infrastructure |
| #352 | Issue | Install to Oh my OpenCode | OpenCode |
| #350 | Issue | Codex subagents use superpowers | Codex |
| #324 | Issue | Droid support | Factory Droid |
| #319 | Issue | Kiro CLI installation | Kiro |
| #270 | Issue | Antigravity support | Antigravity |
| #269 | Issue | Qoder Support | Qoder |
| #267 | Issue | Antigravity Support | Antigravity |
| #262 | Issue | Adding to web agents | Web |
| #260 | Issue | Custom model unknown skills error | Model compat |
| #233 | Issue | Question on skill writing skill | Q&A |
| #217 | Issue | Support GitHub Copilot | Copilot |
| #198 | Issue | Subagent-driven as slash command | UX |
| #193 | Issue | Officially support Codex | Codex |
| #178 | Issue | Brainstorming after 4.0 upgrade | Version compat |
| #148 | Issue | INSTALL.md for non-standard instances | Infrastructure |
| #133 | Issue | Cross-provider subagents | Multi-provider |
| #128 | Issue | Gemini CLI research | Gemini |
| #125 | Issue | Extensibility capabilities | Architecture |
| #76 | Issue | Not installing correctly | Installation |
| #54 | Issue | Skills don't auto trigger | General |
| #4 | Issue | Disable git workflow option | Config |

### Stale or Duplicate Issues

| # | Title | Status |
|---|-------|--------|
| #581 | Customization | Vague, no actionable request |
| #544 | VALIDATION OF LOGIN GUI | Spam/unrelated |
| #557 | Examples of humans reviewing code? | Q&A |
| #559 | Repeated message continue printing | Unclear reproduction |
| #406 | Bump version 4.1.1 to 4.1.2 | Stale |
| #345 | Skill not invocable (disable-model-invocation) | Claude Code issue |
| #222 | write-plan cannot be invoked | Same as #345 |
| #221 | Spec Reviewer Pedantry | Behavioral tuning |
| #244 | Command naming confusion | UX, low priority |
| #230 | Deeper planning (compound engineering) | Research/discussion |
| #159 | Finding new things from other repos | Meta/discussion |
| #126 | RFC: Effective harnesses for long-running agents | Research/discussion |

---

## Priority Action Items

### Immediate (v4.5.1 patch)

1. **Adopt hook fixes** from PRs #584/#585 (Linux), #572 (bash 5.3), #529 (Windows). Critical infrastructure bugs.
2. **Fix plugin.json** (#546): Remove unrecognized keys.
3. **Strengthen run_in_background warning** (#485): Mention TaskOutput unreliability.
4. **Add stuck-state escape hatch** (#472): Allow reporting waiting states.
5. **Add autonomy level to dispatch prompts** (#473): Explicit autonomy for dev tasks.

### Next Version (v4.6.0)

6. **Security review integration** (#479, PR #560).
7. **Reviewing-plans skill** (PR #448): 3-Example Rule.
8. **Architecture awareness step** (#495).
9. **Persistent validators for team mode** (PR #578 Phase 2).
10. **E2E testing guidance** (#374, #455).
11. **Configurable plans directory** (#337, PR #340).

### Phase 4 (Deferred)

12. **Quick mode / workflow tiering** (PR #534).
13. **Model tiering** (PR #547, #306).
14. **Review tiering**.

---

## Statistics

| Category | Issues | PRs |
|----------|--------|-----|
| Addressed by v4.5.0 | 38 | 18 |
| High priority gaps | 7 | 5 |
| Medium priority | 8 | 7 |
| Low priority / platform / stale | 51 | 54 |
| **Total** | **104** | **84** |

## Key Observations

1. **Our audit was well-targeted.** The 38 issues we address represent nearly all of the behavioral/workflow issues reported by Claude Code users. The unaddressed issues are predominantly platform support or infrastructure bugs.

2. **Hook/infrastructure bugs are the biggest unaddressed gap.** Issues #577, #571, #529 prevent the plugin from working on Linux, bash 5.3+, and Windows. These affect all users on those platforms regardless of skill quality.

3. **Security review is the most commonly requested new capability.** Multiple issues (#479, #455) and PRs (#560, #564, #482) request security-focused review.

4. **The persistent validator concept (PR #578) is the most architecturally significant upstream PR.** Worth adopting for team mode.

5. **Platform fragmentation is the upstream repo's biggest challenge.** 30+ issues and 40+ PRs relate to non-Claude-Code platforms. Over 50% of upstream activity.

6. **The reviewing-plans skill (PR #448) fills a gap in our pipeline.** The 3-Example Rule is a simple but powerful mechanism we lack.
