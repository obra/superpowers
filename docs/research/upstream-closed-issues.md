# Upstream Closed Issues Catalog — obra/superpowers

> **Date:** 2026-03-01
> **Total closed issues:** 156
> **Breakdown:** 126 COMPLETED, 24 NOT_PLANNED, 2 DUPLICATE, 4 empty/spam
> **Our fork version:** v4.5.0 (skills audit branch `worktree-skills-audit`)

---

## Summary Statistics

| Category | Count | Description |
|----------|-------|-------------|
| Resolved with merged PR | 38 | Linked to a specific merged PR |
| Resolved by version upgrade | 31 | Fixed organically by major version changes (v3.x -> v4.x) |
| Resolved by discussion/clarification | 22 | Questions answered, usage clarified |
| Closed without fix (NOT_PLANNED) | 24 | Rejected, deferred, or out of scope |
| Duplicate | 2 | Marked as duplicate of another issue |
| Spam/empty/off-topic | 7 | No actionable content |
| Skill grading reports (NOT_PLANNED) | 14 | External audit reports, closed as informational |
| Addressed by our v4.5.0 skills audit | 18 | Issues whose root causes our audit explicitly targets |
| NOT addressed — still relevant | 11 | Gaps remaining after our work |

---

## Category 1: Resolved (Linked to Merged PR or Confirmed Fixed)

### 1A. Windows Hook Compatibility (20 issues, fixed by PR #134, #331, #335, #428, #523)

These form the single largest cluster of closed issues. All relate to the SessionStart hook failing on Windows due to bash path issues, CRLF line endings, backslash mangling, HCS sandbox blocking, etc.

| Issue | Title | Fixed By | Close Date |
|-------|-------|----------|------------|
| #518 | SessionStart hook fails on Windows when user profile path contains spaces | PR #523, #428 | 2026-02-21 |
| #504 | SessionStart hook fails on Windows: session-start.sh not found | PR #331, #335 | 2026-02-21 |
| #491 | SessionStart hook fails on Windows — hooks.json points to .sh file | PR #523 | 2026-02-21 |
| #487 | SessionStart hook fails on Windows: CLAUDE_PLUGIN_ROOT backslashes mangled | PR #428 | 2026-02-21 |
| #466 | SessionStart hook fragile on Windows/MSYS due to set -euo pipefail | PR #331 | 2026-02-21 |
| #440 | SessionStart hook crashes on Windows without WSL | PR #331, #335 | 2026-02-21 |
| #431 | SessionStart hook fails on Windows: bash cannot resolve path | PR #331 | 2026-02-06 |
| #420 | Windows: SessionStart hook fails due to Claude Code path handling bug | PR #428 (upstream-bug label) | 2026-02-21 |
| #419 | SessionStart hook blocks input on Windows | PR #331 | 2026-02-05 |
| #418 | SessionStart hook fails on Windows due to mixed path separators | PR #331 | 2026-02-05 |
| #417 | SessionStart hook fails on Windows due to HCS sandbox blocking bash | Labeled upstream-bug, fixed by #523 polyglot wrapper | 2026-02-21 |
| #414 | SessionStart hook freezes terminal on Windows (bash not in PATH) | Labeled upstream-bug, fixed by #523 | 2026-02-21 |
| #413 | SessionStart hook hangs on Windows (Git Bash too slow) | PR #331 | 2026-02-05 |
| #412 | SessionStart hook error on Windows (Claude Code v2.1.31) | PR #331 | 2026-02-04 |
| #404 | Windows - Plugin Freezes Terminal Keyboard Input in VSCode | PR #331 | 2026-02-05 |
| #399 | Windows: SessionStart hook fails due to CLAUDE_PLUGIN_ROOT path handling | PR #331 | 2026-02-05 |
| #393 | SessionStart hook fails on Windows with REGDB_E_CLASSNOTREG error | PR #331 | 2026-02-05 |
| #389 | SessionStart hook fails on Windows — bash cannot resolve path | PR #331 | 2026-02-05 |
| #369 | SessionStart hook shows 'hook error' on Windows | PR #331 | 2026-02-05 |
| #354 | SessionStart hook produces no output on Windows (Git Bash shebang) | PR #523 | 2026-02-21 |
| #317 | Windows: SessionStart hook fails due to CRLF line endings | PR #331 | 2026-01-22 |
| #313 | SessionStart hook error on Windows (run-hook.cmd compatibility) | PR #331 | 2026-01-22 |
| #292 | Blank terminal window opens on Claude Code startup (Windows) | PR #331 | 2026-01-22 |
| #293 | Windows: CMD window opens before brainstorm on every confirm | PR #523 | 2026-02-21 |
| #285 | Codex not support PowerShell env (Windows) | PR #427 | 2026-02-05 |
| #225 | Windows: SessionStart hook fails - not auto-registered + hardcoded bash path | PR #134, #331 | 2026-01-22 |
| #173 | run-hook.cmd wrapper fails on macOS/Linux | PR #134 | 2025-12-21 |
| #141 | run-hook.cmd uses bash-specific syntax that fails on Linux/dash | PR #134 | 2025-12-03 |
| #51 | Plugin hook error on SessionStart when Windows user dir has space | PR #134, #428 | 2025-12-23 |
| #37 | Windows prompting to open .sh file | PR #134 | 2025-12-23 |
| #31 | Claude Code Freezes After Superpowers Installation (Windows 11) | PR #134 | 2025-12-23 |

**Our audit status:** NOT directly addressed. Windows hook issues are infrastructure-level, outside skill content scope. Our skills audit focused on skill markdown quality. These are already resolved upstream.

### 1B. Hook System Fixes (5 issues)

| Issue | Title | Fixed By | Close Date |
|-------|-------|----------|------------|
| #515 | When git is slow, claude start will be stuck | PR #523 (reduced hook weight) | 2026-02-22 |
| #444 | SessionStart hook output silently dropped due to async: true | Hook config fix in v4.x | 2026-02-21 |
| #390 | Stop hook hangs indefinitely when Haiku API call times out | PR #523 (timeout handling) | 2026-02-22 |
| #385 | SessionStart hook matcher includes 'compact', causing infinite context loop | Hook config fix in v4.x | 2026-01-30 |
| #415 | Invalid hook event names in agent definitions | Agent definition fixes in v4.x | 2026-02-04 |

### 1C. Plugin Loading / Installation (14 issues)

| Issue | Title | Fixed By | Close Date |
|-------|-------|----------|------------|
| #447 | Superpowers plugin does not load in new sessions | v4.x restructure | 2026-02-09 |
| #474 | /using-superpowers not working | v4.x skill rename fixes | 2026-02-15 |
| #175 | Invalid manifest: "official-sounding combinations are reserved" | Manifest name change | 2025-12-18 |
| #240 | Unable to install plugin - "official-sounding combinations" | Same as #175 | 2026-01-08 |
| #142 | npm error 404 for @obra/superpowers-marketplace | Marketplace URL fix | 2025-12-09 |
| #234 | install superpowers@superpowers-marketplace fail | Same root cause as #142 | 2026-01-14 |
| #242 | Superpowers skill not available after adding marketplace | v4.x restructure | 2026-01-14 |
| #151 | Skills not discovered by Claude Code despite valid SKILL.md files | v4.x skill discovery fix | 2025-12-23 |
| #104 | Failed to load hooks from episodic memory plugin | Duplicate hooks config fix | 2025-11-14 |
| #46 | Claude /plugin reporting loading error | Early plugin system fixes | 2025-10-18 |
| #40 | Skill slash commands do not appear on fresh install | v3.x -> v4.x migration | 2025-10-18 |
| #33 | Invalid manifest file: Unrecognized key 'category' | PR #9, manifest schema update | 2025-10-16 |
| #29 | Plugin manifest validation errors: 'category' | Same as #33 | 2025-10-15 |
| #24 | Category line in plugin config is now invalid | Same as #33 | 2025-10-14 |
| #23 | Claude plugin manifest schema change | Same as #33 | 2025-10-14 |
| #28 | v2.0.15 breaks Superpowers commands | Claude Code version-specific | 2025-10-15 |
| #26 | Error while installing the marketplace | Early install docs | 2025-10-14 |
| #19 | Superpowers loading is broken | Early plugin system | 2025-10-13 |
| #17 | Failed to clone marketplace repository | Early install docs | 2025-10-13 |

### 1D. OpenCode Integration (10 issues)

| Issue | Title | Fixed By | Close Date |
|-------|-------|----------|------------|
| #343 | Plugin installation using wrong folder for opencode | PR #349 | 2026-01-23 |
| #342 | v4.1.0 .opencode/INSTALL.md not updated | PR #349 | 2026-01-23 |
| #339 | Skill installation in opencode not working | PR #335 | 2026-01-23 |
| #328 | Skills not loaded auto in opencode | PR #330 | 2026-01-22 |
| #311 | opencode CLI crashed after install superpowers | PR #335 | 2026-01-22 |
| #303 | Windows 11 Git Bash Install for opencode | PR #335 | 2026-01-22 |
| #301 | Conversation auto-switches agent mode after starting chat (OpenCode) | PR #330 | 2026-01-22 |
| #298 | Personal skills not discovered with OPENCODE_CONFIG_DIR | PR #297 | 2026-01-19 |
| #256 | opencode can't start after install superpowers in Win11 | PR #335 | 2026-01-22 |
| #232 | Cannot find module skills-core.js (Windows OpenCode) | PR #335 | 2026-01-22 |
| #226 | OpenCode: bootstrap injection can reset custom agent | PR #330 | 2026-01-22 |
| #177 | Opencode crashes after following installation instructions | PR #335 | 2026-01-22 |
| #187 | Support for native OpenCode Skill Tool | PR #330 | 2026-01-22 |
| #239 | Selected model not taken into account (OpenCode) | PR #330 | 2026-01-19 |

### 1E. Codex Integration (7 issues)

| Issue | Title | Fixed By | Close Date |
|-------|-------|----------|------------|
| #416 | Improve Codex installation | PR #430 | 2026-02-06 |
| #403 | superpowers-codex use-skill does not discover repo-local skills | PR #430 | 2026-02-06 |
| #394 | Native skills install/update (agent-driven, full library) | PR #430 | 2026-02-06 |
| #96 | Newest codex re-reads skill directory every time | PR #430 | 2026-02-06 |
| #73 | Brainstorming asks too many obvious questions on Codex | PR #462 | 2026-02-06 |
| #72 | Codex needs to be told where to make personal skills | PR #430 | 2026-02-06 |
| #243 | Fix Windows "Open with" dialog when running superpowers-codex | PR #427 | 2026-02-05 |

### 1F. Skill Content / Behavior Fixes (10 issues with merged PRs)

| Issue | Title | Fixed By | Close Date |
|-------|-------|----------|------------|
| #195 | writing-skills incorrectly states only name+description in YAML frontmatter | PR #157 | 2026-01-08 |
| #214 | Superpowers is forcing Haiku | PR #144, #120 (removed hardcoded model) | 2026-01-03 |
| #154 | .claude/settings.local.json should be gitignored | PR #153 | 2025-12-09 |
| #101 | using-git-worktrees tries to gitignore .worktrees even if globally ignored | PR #160 | 2025-12-23 |
| #254 | executing-plans: Batch commits break editor-based review workflows | PR #522 (scale to complexity) | 2026-01-13 |
| #573 | Git worktree is not created after brainstorming | PR #382 (require worktree before execution) | 2026-02-28 |
| #388 | Brainstorm skill: Use the AskUserQuestion tool | PR #462 | 2026-02-05 |
| #378 | Basic workflow not triggered automatically (brainstorm -> plan -> worktree skipped) | PR #382, #462 | 2026-01-30 |
| #55 | code-reviewer agent not found | PR #115 (YAML fix) | 2025-10-20 |
| #131 | Use opus instead of sonnet for code reviewer agent | PR #120, #144 | 2025-12-01 |

### 1G. Cursor Integration (2 issues)

| Issue | Title | Fixed By | Close Date |
|-------|-------|----------|------------|
| #106 | Is there interest in integrating with Cursor? | PR #467 | 2026-02-21 |
| #295 | Cursor IDE compatibility | PR #467 | 2026-02-22 |

---

## Category 2: Closed Without Fix (NOT_PLANNED) — Potential Gaps

These 24 issues were deliberately closed without implementation. Some represent genuine gaps.

### 2A. Feature Requests — Deferred or Out of Scope (no action needed)

| Issue | Title | Why Closed | Still Relevant? |
|-------|-------|------------|-----------------|
| #426 | [FEATURE] (empty) | Empty issue body | No |
| #422 | TDD on Replit: no global skill install | Platform-specific, out of scope | No |
| #402 | How is yours different from specs-kit by Microsoft? | Question, not actionable | No |
| #358 | Gemini CLI & Copilot installation | New harness, deferred | Low — future work |
| #336 | Anti gravity | Spam/off-topic | No |
| #323 | "Created a bag for your project" | Spam | No |
| #278 | "Sowt" | Empty/spam | No |
| #296 | The Missing Package Manager for AI Agents | Aspirational, not actionable | No |
| #259 | Add Code Simplifier Agent from Anthropic | Out of scope for this project | No |
| #265 | Replace DOT notation with simple DSL syntax | Design preference, rejected | No |

### 2B. Feature Requests — Still Relevant Gaps

| Issue | Title | Why Closed | What Would Need to Change |
|-------|-------|------------|---------------------------|
| #521 | **using-git-worktrees: copy env files into new worktrees** | NOT_PLANNED | Worktrees lack .env/.env.local files. Tests fail in worktrees when they depend on env vars. Our audit's worktree rework (design.md section 5) does not address env file copying. **Need: Add env file copy step to worktree creation skill.** |
| #469 | **Leverage Claude Code agent teams for parallel plan execution** | Duplicate (of open work) | This is exactly what our `agent-team-driven-development` and `composing-teams` skills do. **Addressed by our audit.** |
| #329 | **Replace auto compact with clear and automatic resume** | NOT_PLANNED | Context compaction wastes tokens; superpowers should run `/clear` + resume from state files instead. Our `state.yml` infrastructure partially addresses this. **Need: Resume-from-state-file skill or session-start integration.** |
| #314 | **Don't explicitly write code in plans** | NOT_PLANNED | Plans balloon to 12K+ lines with explicit code. Users want requirements, not copy-paste implementations. **Partially addressed by our audit** (design.md section 6 — TDD enforcement discourages pre-written code). |
| #316 | Repeated git clone executed multiple times per session (Windows + Cursor) | NOT_PLANNED | Platform-specific, possibly re-emerges with Cursor integration | Low |
| #338 | The markdown format has severe issue | NOT_PLANNED | Unclear what the issue was | No detail |
| #245 | **Add context:fork option to brainstorming skill** | NOT_PLANNED | Claude Code `context: fork` isolates skill context. Brainstorming could benefit from clean context. **Not addressed by our audit. Need: frontmatter `context: fork` investigation.** |
| #242 | Superpowers skill not available after adding marketplace | NOT_PLANNED | Install flow issue; may recur | Low |
| #240 | Unable to install plugin - reserved name | NOT_PLANNED | Manifest naming; already fixed differently | No |

### 2C. Skill Grading Reports (14 issues, all NOT_PLANNED)

These were external audit reports filed as issues. All closed as informational — not actionable as GitHub issues but contain useful diagnostics.

| Issue | Skill | Score | Key Findings |
|-------|-------|-------|-------------|
| #202 | using-superpowers | 68/100 (D) | Progressive disclosure weak; 1 high-severity issue |
| #203 | dispatching-parallel-agents | 74/100 (C) | 4 medium issues; ease of use needs work |
| #206 | brainstorming | 71/100 (C) | 1 high, 4 medium; spec compliance low |
| #207 | writing-plans | 80/100 (B) | 2 medium, 2 low issues |
| #208 | requesting-code-review | 83/100 (B) | Solid but imperfect |
| #209 | receiving-code-review | 82/100 (B) | Similar to requesting |
| #210 | writing-skills | 82/100 (B) | Good structure |
| #211 | verification-before-completion | 85/100 (B) | Good but not great |
| #212 | subagent-driven-development | 87/100 (B) | Best execution skill |
| #204 | executing-plans | 84/100 (B) | 2 medium, 2 low |
| #205 | finishing-a-development-branch | 85/100 (B) | Solid |
| #201 | systematic-debugging | 84/100 (B) | Good |
| #200 | test-driven-development | 87/100 (B) | 2 medium, 2 low |
| #199 | using-git-worktrees | 81/100 (B) | Decent |

**Our audit relevance:** Our v4.5.0 skills audit explicitly addresses the findings in these grading reports, especially for the lowest-scoring skills (using-superpowers 68/D, brainstorming 71/C, dispatching-parallel-agents 74/C). Our audit brainstorm doc references the same issues these reports identify.

---

## Category 3: Duplicates

| Issue | Title | Duplicate Of | Close Date |
|-------|-------|-------------|------------|
| #143 | Opus 4.5 bails on brainstorming | Behavioral duplicate of model-specific issues | 2025-12-05 |
| #283 | Claude 2.1.12 broke the hook for Windows | Duplicate of Windows hook cluster | 2026-01-18 |

---

## Category 4: Questions / Discussions (Resolved by Clarification)

| Issue | Title | Resolution |
|-------|-------|------------|
| #402 | How is yours different from specs-kit? | Answered in discussion |
| #325 | Does superpower externalize its tasks list? | Answered |
| #286 | What kind of skill is elements-of-style? | Explained |
| #284 | How to continue superpowers work after exit | Usage guidance provided |
| #261 | How to use it in Google Antigravity? | Answered |
| #250 | Chinese video tutorial request | Community resource |
| #182 | What is difference between Superpowers and OpenSpec? | Answered |
| #164 | Can this work on Antigravity? (Chinese) | Answered |
| #163 | Superpowers + GitHub spec-kit? | Discussed |
| #162 | Single or multiple design documents during brainstorming | Design guidance provided |
| #149 | Misleading documentation — or cognitive issue — or bug? | Docs clarified |
| #112 | Question about purpose of skills/commands markdown files | Explained |
| #83 | Does it use all skills or only a few after installing? | Progressive disclosure explained |
| #82 | Odd session start hook | Usage issue resolved |
| #81 | I don't see /plugins? | Installation guidance |
| #68 | Opus & subagents — does it delegate to cheaper models? | Answered |
| #56 | What should CLAUDE.md include now? | Documentation guidance |
| #48 | How to get Claude to actually read the skills files? | Skill triggering tips |
| #364 | How do I resume a work session? | Session resume guidance |
| #194 | Clarify whether plans should contain full implementation code | Design intent clarified |

---

## Category 5: Addressed by Our v4.5.0 Skills Audit

These closed issues describe problems that our skills audit design explicitly targets, even though they were already "closed" upstream (often by discussion, not by code fix).

| Closed Issue | Problem | Our Audit Fix | Design Section |
|-------------|---------|---------------|----------------|
| #573 | Worktree not created after brainstorming | Verification gates at handoffs check state.yml before execution | Section 3 |
| #378 | Basic workflow not triggered automatically | Gate checks enforce brainstorm -> plan -> worktree -> execute | Section 3 |
| #314 | Plans explicitly write code (too detailed) | TDD structural enforcement discourages pre-written code | Section 6 |
| #86 | Implementation plan usually far too detailed | Same — TDD enforcement + plan structure reform | Section 6 |
| #194 | Plans contain full implementation code | Same — requirements over implementations | Section 6 |
| #254 | Batch commits break editor review workflows | Addressed in executing-plans skill updates | Per-skill fixes |
| #190 | All skills preloaded consuming 22k+ tokens | Progressive disclosure improvements in using-superpowers | Per-skill fixes |
| #214 | Superpowers forcing Haiku model | Agent selection hierarchy — project agents > shipped fallbacks | Design decision |
| #131 | Use opus instead of sonnet for reviewer | Agent selection hierarchy | Design decision |
| #59 | Allow user to choose model before sub-agent | Agent selection hierarchy | Design decision |
| #110 | 95% of skills lack automated tests | TDD structural enforcement | Section 6 |
| #111 | Missing test execution framework | TDD structural enforcement + evidence format | Sections 4, 6 |
| #100 | Make it more explicit skill is waiting for user input | AskUserQuestion tool usage in brainstorming | Per-skill fixes |
| #60 | Claude doesn't show question it thinks it asks | Same — explicit AskUserQuestion | Per-skill fixes |
| #114 | Use native AskUserQuestion tool | Same | Per-skill fixes |
| #150 | Subagent implementation asks for edit permissions for every agent | Subagent permission model improvements | Per-skill fixes |
| #135 | Add conventional commit guidance to finishing-a-development-branch | PR template improvements in finishing skill | Per-skill fixes |
| #45 | DRY pattern enforcement | Code review skill improvements | Per-skill fixes |

---

## Category 6: NOT Addressed — Still Relevant Gaps

These are the most important findings. These issues were closed upstream but the underlying problems persist and our skills audit does not cover them.

### Gap 1: Worktree Environment Files (#521)
- **Problem:** `.env`, `.env.local`, and other gitignored config files don't exist in new worktrees. Baseline tests fail. Implementation can't be tested.
- **Closed as:** NOT_PLANNED
- **Our audit status:** NOT addressed. Our worktree rework (design section 5) layers on native EnterWorktree but does not add env file copying.
- **What needs to change:** Add a post-worktree-creation step that copies project-specific gitignored files (`.env*`, `.envrc`, database configs) into the new worktree. Should be configurable via `.superpowers/config.yml` to specify which files to copy.

### Gap 2: Worktree Database Isolation (#220)
- **Problem:** Worktrees share the same database via copied `.env` files. Schema migrations in one worktree break others.
- **Closed as:** COMPLETED (but only by discussion — no code change)
- **Our audit status:** NOT addressed.
- **What needs to change:** Provide guidance or templating in worktree creation for isolated DB connections (e.g., `DB_NAME=myapp_wt_$BRANCH`). This is project-specific but the skill should at least warn about shared state.

### Gap 3: Session Resume / Context Recovery (#329, #364)
- **Problem:** Users lose progress when context fills up. No mechanism to `/clear` and resume from plan state.
- **Closed as:** #329 NOT_PLANNED, #364 COMPLETED (by discussion only)
- **Our audit status:** PARTIALLY addressed. `state.yml` enables cold recovery, but there's no explicit "resume" command or session-start integration that reads state.yml and resumes.
- **What needs to change:** Session-start hook or explicit resume skill that reads `.superpowers/state.yml` and reconstructs minimal context (current phase, plan location, completed tasks, active worktree).

### Gap 4: Token Efficiency / Lite Mode (#74, #190)
- **Problem:** Brainstorming alone can burn through a Pro plan's 5-hour limit. Skills are verbose and ask many questions.
- **Closed as:** COMPLETED (but only by discussion)
- **Our audit status:** PARTIALLY addressed (progressive disclosure improvements, question batching). But no "lite" mode exists.
- **What needs to change:** Consider a complexity tier system: small tasks skip brainstorming's deep questioning, use abbreviated plans. PR #534 (quick-bypass for trivial tasks) in our audit covers this partially.

### Gap 5: Skill Triggering Reliability (#42, #48, #215)
- **Problem:** Users invoke `/brainstorm` but Claude ignores it, pretends to read the skill, or follows its own approach. The skill markdown is loaded but not followed.
- **Closed as:** COMPLETED (various fixes over time)
- **Our audit status:** PARTIALLY addressed by frontmatter improvements and red flags table reduction.
- **What needs to change:** This is fundamentally a model compliance issue. More aggressive enforcement language, fewer conditional branches in skill text, and hard verification gates (section 3) should help. Monitor after v4.5.0 deployment.

### Gap 6: Copy Serena/MCP Directories to Worktrees (#241)
- **Problem:** `.serena/` and similar MCP server config directories need to be copied to worktrees for tools like Serena to work.
- **Closed as:** COMPLETED (by discussion)
- **Our audit status:** NOT addressed.
- **What needs to change:** Generalize gap 1's solution — configurable list of directories/files to copy into worktrees.

### Gap 7: context:fork for Brainstorming (#245)
- **Problem:** Brainstorming runs in main context, polluting it with exploration chatter. Claude Code `context: fork` would isolate this.
- **Closed as:** NOT_PLANNED
- **Our audit status:** NOT addressed.
- **What needs to change:** Investigate adding `context: fork` to brainstorming SKILL.md frontmatter. This would give brainstorming a clean sub-context and return only the design doc. Requires testing — may break the brainstorm-to-plan handoff.

### Gap 8: Claude Code Hanging During File Writes (#185)
- **Problem:** Claude silently hangs when trying to write large files (like design docs), only with superpowers installed.
- **Closed as:** COMPLETED
- **Our audit status:** NOT addressed (likely a Claude Code upstream issue).
- **What needs to change:** Monitor. If it recurs, add guidance to break large writes into smaller chunks.

### Gap 9: Conventional Commit Enforcement (#135)
- **Problem:** PR template lacks conventional commit guidance, version impact indicators, and breaking change sections.
- **Closed as:** COMPLETED
- **Our audit status:** PARTIALLY addressed in finishing skill updates.
- **What needs to change:** Verify that `finishing-a-development-branch` skill includes conventional commit format in PR title suggestions.

### Gap 10: Brainstorming Asks Too Many Questions (#73, #74)
- **Problem:** Brainstorming asks questions with obvious answers, especially on Codex where autonomous operation is preferred.
- **Closed as:** COMPLETED (#73 by PR #462)
- **Our audit status:** PARTIALLY addressed (question batching, assumption challenging).
- **What needs to change:** Verify post-deployment that question count is reasonable. Consider platform-aware behavior (fewer questions on Codex/autonomous runners).

### Gap 11: Security Audit Findings (#366)
- **Problem:** 13 warning-level issues related to `eval` usage found by ASK security scanner.
- **Closed as:** COMPLETED (acknowledged, informational)
- **Our audit status:** NOT addressed (security hardening was not in scope).
- **What needs to change:** Review all `eval` usages in hook scripts. Replace with safer alternatives where possible.

---

## Category 7: Spam, Empty, or Off-Topic (No Action)

| Issue | Title | Why Ignored |
|-------|-------|-------------|
| #426 | [FEATURE] | Empty body |
| #336 | Anti gravity | Off-topic |
| #323 | "Created a bag for your project" | Spam |
| #278 | "Sowt" | Empty/meaningless |
| #25 | "K" (Cyrillic) | Empty |
| #32 | "test" | Test issue |
| #12 | superpower: never open a microsoft office product again | Feature idea, no actionable detail |

---

## Cross-Reference: Merged PRs to Closed Issues

| PR | Title | Issues Resolved |
|----|-------|-----------------|
| #134 | Add Windows support for plugin hooks | #37, #51, #225, #31, #173, #141 |
| #331 | Fix Windows hook execution for Claude Code 2.1.x | #313, #317, #292, #418, #419, #413, #412, #404, #399, #393, #389, #369, #440, #431 |
| #335 | Fix OpenCode native skills + Windows hook execution | #339, #311, #303, #256, #232, #177 |
| #330 | Feat: OpenCode native skills + fix agent reset bug | #328, #301, #226, #187, #239 |
| #349 | Fix opencode: standardize on plugins/ directory | #343, #342 |
| #297 | Fix: respect OPENCODE_CONFIG_DIR | #298 |
| #523 | Fix: restore polyglot wrapper for Windows hook compatibility | #518, #491, #487, #354, #293, #417, #414, #466 |
| #428 | Fix ~/ path expansion on Windows | #420, #518, #51 |
| #427 | Fix Windows/PowerShell invocation of superpowers-codex | #285, #243 |
| #430 | Migrate Codex to native skill discovery | #416, #403, #394, #96, #72 |
| #462 | Enforce brainstorming workflow with hard gates | #388, #73 |
| #382 | Fix: require worktree setup before execution | #573, #378 |
| #153 | Chore: gitignore settings.local.json | #154 |
| #160 | Fix: use git check-ignore for worktree gitignore verification | #101 |
| #157 | Docs: fix documentation accuracy issues in skills | #195 |
| #144 | Fix: properly inherit agent model from main | #214, #131 |
| #120 | Remove model name from core-reviewer | #131 |
| #115 | Fix: yaml error in code-reviewer agent | #55 |
| #467 | Add Cursor plugin compatibility | #106, #295 |
| #522 | Scale process-oriented skills to task complexity | #254 |
| #9 | Fix session-start hook execution in plugin context | #8, #7 |
| #90 | Update installation instructions | #81, various install questions |

---

## Priority Actions for Our Fork

Based on this analysis, the most impactful unaddressed items for our v4.5.0+ roadmap:

### P0 — High Impact, Achievable Now
1. **Worktree env file copying** (#521, #220, #241): Add configurable file/directory list to copy into worktrees. Blocks real-world usage for any project with env-dependent tests.
2. **Session resume from state.yml** (#329, #364): We built the infrastructure (state.yml) but no resume mechanism. Add resume integration to session-start hook.

### P1 — Medium Impact
3. **context:fork investigation** (#245): Test whether `context: fork` in brainstorming frontmatter improves or breaks the workflow.
4. **Security hardening** (#366): Audit eval usage in hook scripts.
5. **Platform-aware question reduction** (#73, #74): Fewer questions on Codex/autonomous runners.

### P2 — Low Impact / Monitor
6. **File write hanging** (#185): Monitor after deployment.
7. **Skill triggering reliability** (#42, #48, #215): Our gate infrastructure should help. Monitor.

---

*Generated 2026-03-01 from comprehensive scan of all 156 closed issues on obra/superpowers.*

# Upstream Closed Issues Catalog — obra/superpowers

> **Date:** 2026-03-01
> **Total closed issues:** 156
> **Breakdown:** 126 COMPLETED, 24 NOT_PLANNED, 2 DUPLICATE, 4 empty/spam
> **Our fork version:** v4.5.0 (skills audit branch `worktree-skills-audit`)

---

## Summary Statistics

| Category | Count | Description |
|----------|-------|-------------|
| Resolved with merged PR | 38 | Linked to a specific merged PR |
| Resolved by version upgrade | 31 | Fixed organically by major version changes (v3.x -> v4.x) |
| Resolved by discussion/clarification | 22 | Questions answered, usage clarified |
| Closed without fix (NOT_PLANNED) | 24 | Rejected, deferred, or out of scope |
| Duplicate | 2 | Marked as duplicate of another issue |
| Spam/empty/off-topic | 7 | No actionable content |
| Skill grading reports (NOT_PLANNED) | 14 | External audit reports, closed as informational |
| Addressed by our v4.5.0 skills audit | 18 | Issues whose root causes our audit explicitly targets |
| NOT addressed -- still relevant | 11 | Gaps remaining after our work |

---

## Category 1: Resolved (Linked to Merged PR or Confirmed Fixed)

### 1A. Windows Hook Compatibility (31 issues, fixed by PR #134, #331, #335, #428, #523)

These form the single largest cluster of closed issues. All relate to the SessionStart hook failing on Windows due to bash path issues, CRLF line endings, backslash mangling, HCS sandbox blocking, etc.

| Issue | Title | Fixed By | Close Date |
|-------|-------|----------|------------|
| #518 | SessionStart hook fails on Windows when user profile path contains spaces | PR #523, #428 | 2026-02-21 |
| #504 | SessionStart hook fails on Windows: session-start.sh not found | PR #331, #335 | 2026-02-21 |
| #491 | SessionStart hook fails on Windows -- hooks.json points to .sh file | PR #523 | 2026-02-21 |
| #487 | SessionStart hook fails on Windows: CLAUDE_PLUGIN_ROOT backslashes mangled | PR #428 | 2026-02-21 |
| #466 | SessionStart hook fragile on Windows/MSYS due to set -euo pipefail | PR #331 | 2026-02-21 |
| #440 | SessionStart hook crashes on Windows without WSL | PR #331, #335 | 2026-02-21 |
| #431 | SessionStart hook fails on Windows: bash cannot resolve path | PR #331 | 2026-02-06 |
| #420 | Windows: SessionStart hook fails due to Claude Code path handling bug | PR #428 (upstream-bug label) | 2026-02-21 |
| #419 | SessionStart hook blocks input on Windows | PR #331 | 2026-02-05 |
| #418 | SessionStart hook fails on Windows due to mixed path separators | PR #331 | 2026-02-05 |
| #417 | SessionStart hook fails on Windows due to HCS sandbox blocking bash | Labeled upstream-bug, fixed by #523 polyglot wrapper | 2026-02-21 |
| #414 | SessionStart hook freezes terminal on Windows (bash not in PATH) | Labeled upstream-bug, fixed by #523 | 2026-02-21 |
| #413 | SessionStart hook hangs on Windows (Git Bash too slow) | PR #331 | 2026-02-05 |
| #412 | SessionStart hook error on Windows (Claude Code v2.1.31) | PR #331 | 2026-02-04 |
| #404 | Windows - Plugin Freezes Terminal Keyboard Input in VSCode | PR #331 | 2026-02-05 |
| #399 | Windows: SessionStart hook fails due to CLAUDE_PLUGIN_ROOT path handling | PR #331 | 2026-02-05 |
| #393 | SessionStart hook fails on Windows with REGDB_E_CLASSNOTREG error | PR #331 | 2026-02-05 |
| #389 | SessionStart hook fails on Windows -- bash cannot resolve path | PR #331 | 2026-02-05 |
| #369 | SessionStart hook shows 'hook error' on Windows | PR #331 | 2026-02-05 |
| #354 | SessionStart hook produces no output on Windows (Git Bash shebang) | PR #523 | 2026-02-21 |
| #317 | Windows: SessionStart hook fails due to CRLF line endings | PR #331 | 2026-01-22 |
| #313 | SessionStart hook error on Windows (run-hook.cmd compatibility) | PR #331 | 2026-01-22 |
| #292 | Blank terminal window opens on Claude Code startup (Windows) | PR #331 | 2026-01-22 |
| #293 | Windows: CMD window opens before brainstorm on every confirm | PR #523 | 2026-02-21 |
| #285 | Codex not support PowerShell env (Windows) | PR #427 | 2026-02-05 |
| #225 | Windows: SessionStart hook fails - not auto-registered + hardcoded bash path | PR #134, #331 | 2026-01-22 |
| #173 | run-hook.cmd wrapper fails on macOS/Linux | PR #134 | 2025-12-21 |
| #141 | run-hook.cmd uses bash-specific syntax that fails on Linux/dash | PR #134 | 2025-12-03 |
| #51 | Plugin hook error on SessionStart when Windows user dir has space | PR #134, #428 | 2025-12-23 |
| #37 | Windows prompting to open .sh file | PR #134 | 2025-12-23 |
| #31 | Claude Code Freezes After Superpowers Installation (Windows 11) | PR #134 | 2025-12-23 |

**Our audit status:** NOT directly addressed. Windows hook issues are infrastructure-level, outside skill content scope. Our skills audit focused on skill markdown quality. These are already resolved upstream.

### 1B. Hook System Fixes (5 issues)

| Issue | Title | Fixed By | Close Date |
|-------|-------|----------|------------|
| #515 | When git is slow, claude start will be stuck | PR #523 (reduced hook weight) | 2026-02-22 |
| #444 | SessionStart hook output silently dropped due to async: true | Hook config fix in v4.x | 2026-02-21 |
| #390 | Stop hook hangs indefinitely when Haiku API call times out | PR #523 (timeout handling) | 2026-02-22 |
| #385 | SessionStart hook matcher includes 'compact', causing infinite context loop | Hook config fix in v4.x | 2026-01-30 |
| #415 | Invalid hook event names in agent definitions | Agent definition fixes in v4.x | 2026-02-04 |

### 1C. Plugin Loading / Installation (18 issues)

| Issue | Title | Fixed By | Close Date |
|-------|-------|----------|------------|
| #447 | Superpowers plugin does not load in new sessions | v4.x restructure | 2026-02-09 |
| #474 | /using-superpowers not working | v4.x skill rename fixes | 2026-02-15 |
| #175 | Invalid manifest: "official-sounding combinations are reserved" | Manifest name change | 2025-12-18 |
| #240 | Unable to install plugin - "official-sounding combinations" | Same as #175 | 2026-01-08 |
| #142 | npm error 404 for @obra/superpowers-marketplace | Marketplace URL fix | 2025-12-09 |
| #234 | install superpowers@superpowers-marketplace fail | Same root cause as #142 | 2026-01-14 |
| #242 | Superpowers skill not available after adding marketplace | v4.x restructure | 2026-01-14 |
| #151 | Skills not discovered by Claude Code despite valid SKILL.md files | v4.x skill discovery fix | 2025-12-23 |
| #104 | Failed to load hooks from episodic memory plugin | Duplicate hooks config fix | 2025-11-14 |
| #46 | Claude /plugin reporting loading error | Early plugin system fixes | 2025-10-18 |
| #40 | Skill slash commands do not appear on fresh install | v3.x -> v4.x migration | 2025-10-18 |
| #33 | Invalid manifest file: Unrecognized key 'category' | PR #9, manifest schema update | 2025-10-16 |
| #29 | Plugin manifest validation errors: 'category' | Same as #33 | 2025-10-15 |
| #24 | Category line in plugin config is now invalid | Same as #33 | 2025-10-14 |
| #23 | Claude plugin manifest schema change | Same as #33 | 2025-10-14 |
| #28 | v2.0.15 breaks Superpowers commands | Claude Code version-specific | 2025-10-15 |
| #26 | Error while installing the marketplace | Early install docs | 2025-10-14 |
| #19 | Superpowers loading is broken | Early plugin system | 2025-10-13 |
| #17 | Failed to clone marketplace repository | Early install docs | 2025-10-13 |

### 1D. OpenCode Integration (14 issues)

| Issue | Title | Fixed By | Close Date |
|-------|-------|----------|------------|
| #343 | Plugin installation using wrong folder for opencode | PR #349 | 2026-01-23 |
| #342 | v4.1.0 .opencode/INSTALL.md not updated | PR #349 | 2026-01-23 |
| #339 | Skill installation in opencode not working | PR #335 | 2026-01-23 |
| #328 | Skills not loaded auto in opencode | PR #330 | 2026-01-22 |
| #311 | opencode CLI crashed after install superpowers | PR #335 | 2026-01-22 |
| #303 | Windows 11 Git Bash Install for opencode | PR #335 | 2026-01-22 |
| #301 | Conversation auto-switches agent mode after starting chat (OpenCode) | PR #330 | 2026-01-22 |
| #298 | Personal skills not discovered with OPENCODE_CONFIG_DIR | PR #297 | 2026-01-19 |
| #256 | opencode can't start after install superpowers in Win11 | PR #335 | 2026-01-22 |
| #232 | Cannot find module skills-core.js (Windows OpenCode) | PR #335 | 2026-01-22 |
| #226 | OpenCode: bootstrap injection can reset custom agent | PR #330 | 2026-01-22 |
| #177 | Opencode crashes after following installation instructions | PR #335 | 2026-01-22 |
| #187 | Support for native OpenCode Skill Tool | PR #330 | 2026-01-22 |
| #239 | Selected model not taken into account (OpenCode) | PR #330 | 2026-01-19 |

### 1E. Codex Integration (7 issues)

| Issue | Title | Fixed By | Close Date |
|-------|-------|----------|------------|
| #416 | Improve Codex installation | PR #430 | 2026-02-06 |
| #403 | superpowers-codex use-skill does not discover repo-local skills | PR #430 | 2026-02-06 |
| #394 | Native skills install/update (agent-driven, full library) | PR #430 | 2026-02-06 |
| #96 | Newest codex re-reads skill directory every time | PR #430 | 2026-02-06 |
| #73 | Brainstorming asks too many obvious questions on Codex | PR #462 | 2026-02-06 |
| #72 | Codex needs to be told where to make personal skills | PR #430 | 2026-02-06 |
| #243 | Fix Windows "Open with" dialog when running superpowers-codex | PR #427 | 2026-02-05 |

### 1F. Skill Content / Behavior Fixes (10 issues with merged PRs)

| Issue | Title | Fixed By | Close Date |
|-------|-------|----------|------------|
| #195 | writing-skills incorrectly states only name+description in YAML frontmatter | PR #157 | 2026-01-08 |
| #214 | Superpowers is forcing Haiku | PR #144, #120 (removed hardcoded model) | 2026-01-03 |
| #154 | .claude/settings.local.json should be gitignored | PR #153 | 2025-12-09 |
| #101 | using-git-worktrees tries to gitignore .worktrees even if globally ignored | PR #160 | 2025-12-23 |
| #254 | executing-plans: Batch commits break editor-based review workflows | PR #522 (scale to complexity) | 2026-01-13 |
| #573 | Git worktree is not created after brainstorming | PR #382 (require worktree before execution) | 2026-02-28 |
| #388 | Brainstorm skill: Use the AskUserQuestion tool | PR #462 | 2026-02-05 |
| #378 | Basic workflow not triggered automatically (brainstorm -> plan -> worktree skipped) | PR #382, #462 | 2026-01-30 |
| #55 | code-reviewer agent not found | PR #115 (YAML fix) | 2025-10-20 |
| #131 | Use opus instead of sonnet for code reviewer agent | PR #120, #144 | 2025-12-01 |

### 1G. Cursor Integration (2 issues)

| Issue | Title | Fixed By | Close Date |
|-------|-------|----------|------------|
| #106 | Is there interest in integrating with Cursor? | PR #467 | 2026-02-21 |
| #295 | Cursor IDE compatibility | PR #467 | 2026-02-22 |

---

## Category 2: Closed Without Fix (NOT_PLANNED) -- Potential Gaps

These 24 issues were deliberately closed without implementation. Some represent genuine gaps.

### 2A. Feature Requests -- Deferred or Out of Scope (no action needed)

| Issue | Title | Why Closed | Still Relevant? |
|-------|-------|------------|-----------------|
| #426 | [FEATURE] (empty) | Empty issue body | No |
| #422 | TDD on Replit: no global skill install | Platform-specific, out of scope | No |
| #402 | How is yours different from specs-kit by Microsoft? | Question, not actionable | No |
| #358 | Gemini CLI and Copilot installation | New harness, deferred | Low -- future work |
| #336 | Anti gravity | Spam/off-topic | No |
| #323 | "Created a bag for your project" | Spam | No |
| #278 | "Sowt" | Empty/spam | No |
| #296 | The Missing Package Manager for AI Agents | Aspirational, not actionable | No |
| #259 | Add Code Simplifier Agent from Anthropic | Out of scope for this project | No |
| #265 | Replace DOT notation with simple DSL syntax | Design preference, rejected | No |

### 2B. Feature Requests -- Still Relevant Gaps

| Issue | Title | Why Closed | What Would Need to Change |
|-------|-------|------------|---------------------------|
| #521 | using-git-worktrees: copy env files into new worktrees | NOT_PLANNED | Worktrees lack .env/.env.local files. Tests fail in worktrees when they depend on env vars. Our audit's worktree rework (design.md section 5) does not address env file copying. Need: Add env file copy step to worktree creation skill. |
| #469 | Leverage Claude Code agent teams for parallel plan execution | Duplicate (of open work) | This is exactly what our agent-team-driven-development and composing-teams skills do. Addressed by our audit. |
| #329 | Replace auto compact with clear and automatic resume | NOT_PLANNED | Context compaction wastes tokens; superpowers should run /clear + resume from state files instead. Our state.yml infrastructure partially addresses this. Need: Resume-from-state-file skill or session-start integration. |
| #314 | Don't explicitly write code in plans | NOT_PLANNED | Plans balloon to 12K+ lines with explicit code. Users want requirements, not copy-paste implementations. Partially addressed by our audit (design.md section 6 -- TDD enforcement discourages pre-written code). |
| #316 | Repeated git clone executed multiple times per session (Windows + Cursor) | NOT_PLANNED | Platform-specific, possibly re-emerges with Cursor integration |
| #338 | The markdown format has severe issue | NOT_PLANNED | Unclear what the issue was; no detail provided |
| #245 | Add context:fork option to brainstorming skill | NOT_PLANNED | Claude Code context:fork isolates skill context. Brainstorming could benefit from clean context. Not addressed by our audit. Need: frontmatter context:fork investigation. |
| #242 | Superpowers skill not available after adding marketplace | NOT_PLANNED | Install flow issue; may recur |
| #240 | Unable to install plugin - reserved name | NOT_PLANNED | Manifest naming; already fixed differently |

### 2C. Skill Grading Reports (14 issues, all NOT_PLANNED)

These were external audit reports filed as issues. All closed as informational -- not actionable as GitHub issues but contain useful diagnostics.

| Issue | Skill | Score | Key Findings |
|-------|-------|-------|-------------|
| #202 | using-superpowers | 68/100 (D) | Progressive disclosure weak; 1 high-severity issue |
| #203 | dispatching-parallel-agents | 74/100 (C) | 4 medium issues; ease of use needs work |
| #206 | brainstorming | 71/100 (C) | 1 high, 4 medium; spec compliance low |
| #207 | writing-plans | 80/100 (B) | 2 medium, 2 low issues |
| #208 | requesting-code-review | 83/100 (B) | Solid but imperfect |
| #209 | receiving-code-review | 82/100 (B) | Similar to requesting |
| #210 | writing-skills | 82/100 (B) | Good structure |
| #211 | verification-before-completion | 85/100 (B) | Good but not great |
| #212 | subagent-driven-development | 87/100 (B) | Best execution skill |
| #204 | executing-plans | 84/100 (B) | 2 medium, 2 low |
| #205 | finishing-a-development-branch | 85/100 (B) | Solid |
| #201 | systematic-debugging | 84/100 (B) | Good |
| #200 | test-driven-development | 87/100 (B) | 2 medium, 2 low |
| #199 | using-git-worktrees | 81/100 (B) | Decent |

**Our audit relevance:** Our v4.5.0 skills audit explicitly addresses the findings in these grading reports, especially for the lowest-scoring skills (using-superpowers 68/D, brainstorming 71/C, dispatching-parallel-agents 74/C). Our audit brainstorm doc references the same issues these reports identify.

---

## Category 3: Duplicates

| Issue | Title | Duplicate Of | Close Date |
|-------|-------|-------------|------------|
| #143 | Opus 4.5 bails on brainstorming | Behavioral duplicate of model-specific issues | 2025-12-05 |
| #283 | Claude 2.1.12 broke the hook for Windows | Duplicate of Windows hook cluster | 2026-01-18 |

---

## Category 4: Questions / Discussions (Resolved by Clarification)

| Issue | Title | Resolution |
|-------|-------|------------|
| #402 | How is yours different from specs-kit? | Answered in discussion |
| #325 | Does superpower externalize its tasks list? | Answered |
| #286 | What kind of skill is elements-of-style? | Explained |
| #284 | How to continue superpowers work after exit | Usage guidance provided |
| #261 | How to use it in Google Antigravity? | Answered |
| #250 | Chinese video tutorial request | Community resource |
| #182 | What is difference between Superpowers and OpenSpec? | Answered |
| #164 | Can this work on Antigravity? (Chinese) | Answered |
| #163 | Superpowers + GitHub spec-kit? | Discussed |
| #162 | Single or multiple design documents during brainstorming | Design guidance provided |
| #149 | Misleading documentation -- or cognitive issue -- or bug? | Docs clarified |
| #112 | Question about purpose of skills/commands markdown files | Explained |
| #83 | Does it use all skills or only a few after installing? | Progressive disclosure explained |
| #82 | Odd session start hook | Usage issue resolved |
| #81 | I don't see /plugins? | Installation guidance |
| #68 | Opus and subagents -- does it delegate to cheaper models? | Answered |
| #56 | What should CLAUDE.md include now? | Documentation guidance |
| #48 | How to get Claude to actually read the skills files? | Skill triggering tips |
| #364 | How do I resume a work session? | Session resume guidance |
| #194 | Clarify whether plans should contain full implementation code | Design intent clarified |
| #494 | Entire.io Full Integration | Feature discussion |
| #351 | Change text search from grep to ripgrep | Discussion |

---

## Category 5: Addressed by Our v4.5.0 Skills Audit

These closed issues describe problems that our skills audit design explicitly targets, even though they were already "closed" upstream (often by discussion, not by code fix).

| Closed Issue | Problem | Our Audit Fix | Design Section |
|-------------|---------|---------------|----------------|
| #573 | Worktree not created after brainstorming | Verification gates at handoffs check state.yml before execution | Section 3 |
| #378 | Basic workflow not triggered automatically | Gate checks enforce brainstorm -> plan -> worktree -> execute | Section 3 |
| #314 | Plans explicitly write code (too detailed) | TDD structural enforcement discourages pre-written code | Section 6 |
| #86 | Implementation plan usually far too detailed | Same -- TDD enforcement + plan structure reform | Section 6 |
| #194 | Plans contain full implementation code | Same -- requirements over implementations | Section 6 |
| #254 | Batch commits break editor review workflows | Addressed in executing-plans skill updates | Per-skill fixes |
| #190 | All skills preloaded consuming 22k+ tokens | Progressive disclosure improvements in using-superpowers | Per-skill fixes |
| #214 | Superpowers forcing Haiku model | Agent selection hierarchy -- project agents > shipped fallbacks | Design decision |
| #131 | Use opus instead of sonnet for reviewer | Agent selection hierarchy | Design decision |
| #59 | Allow user to choose model before sub-agent | Agent selection hierarchy | Design decision |
| #110 | 95% of skills lack automated tests | TDD structural enforcement | Section 6 |
| #111 | Missing test execution framework | TDD structural enforcement + evidence format | Sections 4, 6 |
| #100 | Make it more explicit skill is waiting for user input | AskUserQuestion tool usage in brainstorming | Per-skill fixes |
| #60 | Claude doesn't show question it thinks it asks | Same -- explicit AskUserQuestion | Per-skill fixes |
| #114 | Use native AskUserQuestion tool | Same | Per-skill fixes |
| #150 | Subagent implementation asks for edit permissions for every agent | Subagent permission model improvements | Per-skill fixes |
| #135 | Add conventional commit guidance to finishing-a-development-branch | PR template improvements in finishing skill | Per-skill fixes |
| #45 | DRY pattern enforcement | Code review skill improvements | Per-skill fixes |

---

## Category 6: NOT Addressed -- Still Relevant Gaps

These are the most important findings. These issues were closed upstream but the underlying problems persist and our skills audit does not cover them.

### Gap 1: Worktree Environment Files (#521)
- **Problem:** `.env`, `.env.local`, and other gitignored config files don't exist in new worktrees. Baseline tests fail. Implementation can't be tested.
- **Closed as:** NOT_PLANNED
- **Our audit status:** NOT addressed. Our worktree rework (design section 5) layers on native EnterWorktree but does not add env file copying.
- **What needs to change:** Add a post-worktree-creation step that copies project-specific gitignored files (`.env*`, `.envrc`, database configs) into the new worktree. Should be configurable via `.superpowers/config.yml` to specify which files to copy.

### Gap 2: Worktree Database Isolation (#220)
- **Problem:** Worktrees share the same database via copied `.env` files. Schema migrations in one worktree break others.
- **Closed as:** COMPLETED (but only by discussion -- no code change)
- **Our audit status:** NOT addressed.
- **What needs to change:** Provide guidance or templating in worktree creation for isolated DB connections (e.g., `DB_NAME=myapp_wt_$BRANCH`). This is project-specific but the skill should at least warn about shared state.

### Gap 3: Session Resume / Context Recovery (#329, #364)
- **Problem:** Users lose progress when context fills up. No mechanism to `/clear` and resume from plan state.
- **Closed as:** #329 NOT_PLANNED, #364 COMPLETED (by discussion only)
- **Our audit status:** PARTIALLY addressed. `state.yml` enables cold recovery, but there is no explicit "resume" command or session-start integration that reads state.yml and resumes.
- **What needs to change:** Session-start hook or explicit resume skill that reads `.superpowers/state.yml` and reconstructs minimal context (current phase, plan location, completed tasks, active worktree).

### Gap 4: Token Efficiency / Lite Mode (#74, #190)
- **Problem:** Brainstorming alone can burn through a Pro plan's 5-hour limit. Skills are verbose and ask many questions.
- **Closed as:** COMPLETED (but only by discussion)
- **Our audit status:** PARTIALLY addressed (progressive disclosure improvements, question batching). But no "lite" mode exists.
- **What needs to change:** Consider a complexity tier system: small tasks skip brainstorming's deep questioning, use abbreviated plans. PR #534 (quick-bypass for trivial tasks) in our audit covers this partially.

### Gap 5: Skill Triggering Reliability (#42, #48, #215)
- **Problem:** Users invoke `/brainstorm` but Claude ignores it, pretends to read the skill, or follows its own approach. The skill markdown is loaded but not followed.
- **Closed as:** COMPLETED (various fixes over time)
- **Our audit status:** PARTIALLY addressed by frontmatter improvements and red flags table reduction.
- **What needs to change:** This is fundamentally a model compliance issue. More aggressive enforcement language, fewer conditional branches in skill text, and hard verification gates (section 3) should help. Monitor after v4.5.0 deployment.

### Gap 6: Copy Serena/MCP Directories to Worktrees (#241)
- **Problem:** `.serena/` and similar MCP server config directories need to be copied to worktrees for tools like Serena to work.
- **Closed as:** COMPLETED (by discussion)
- **Our audit status:** NOT addressed.
- **What needs to change:** Generalize gap 1's solution -- configurable list of directories/files to copy into worktrees.

### Gap 7: context:fork for Brainstorming (#245)
- **Problem:** Brainstorming runs in main context, polluting it with exploration chatter. Claude Code `context: fork` would isolate this.
- **Closed as:** NOT_PLANNED
- **Our audit status:** NOT addressed.
- **What needs to change:** Investigate adding `context: fork` to brainstorming SKILL.md frontmatter. This would give brainstorming a clean sub-context and return only the design doc. Requires testing -- may break the brainstorm-to-plan handoff.

### Gap 8: Claude Code Hanging During File Writes (#185)
- **Problem:** Claude silently hangs when trying to write large files (like design docs), only with superpowers installed.
- **Closed as:** COMPLETED
- **Our audit status:** NOT addressed (likely a Claude Code upstream issue).
- **What needs to change:** Monitor. If it recurs, add guidance to break large writes into smaller chunks.

### Gap 9: Conventional Commit Enforcement (#135)
- **Problem:** PR template lacks conventional commit guidance, version impact indicators, and breaking change sections.
- **Closed as:** COMPLETED
- **Our audit status:** PARTIALLY addressed in finishing skill updates.
- **What needs to change:** Verify that `finishing-a-development-branch` skill includes conventional commit format in PR title suggestions.

### Gap 10: Brainstorming Asks Too Many Questions (#73, #74)
- **Problem:** Brainstorming asks questions with obvious answers, especially on Codex where autonomous operation is preferred.
- **Closed as:** COMPLETED (#73 by PR #462)
- **Our audit status:** PARTIALLY addressed (question batching, assumption challenging).
- **What needs to change:** Verify post-deployment that question count is reasonable. Consider platform-aware behavior (fewer questions on Codex/autonomous runners).

### Gap 11: Security Audit Findings (#366)
- **Problem:** 13 warning-level issues related to `eval` usage found by ASK security scanner.
- **Closed as:** COMPLETED (acknowledged, informational)
- **Our audit status:** NOT addressed (security hardening was not in scope).
- **What needs to change:** Review all `eval` usages in hook scripts. Replace with safer alternatives where possible.

---

## Category 7: Remaining Issues (Misc Resolved)

These issues were resolved by organic project evolution, early version fixes, or are informational.

| Issue | Title | Category | Close Date |
|-------|-------|----------|------------|
| #423 | Codex: User Feedback (skill loading redundancy) | Codex UX feedback, addressed by PR #430 | 2026-02-06 |
| #387 | codex for windows | Addressed by Codex Windows fixes | 2026-01-31 |
| #383 | SessionStart hook error on Windows with Claude Code 2.1.x | Windows cluster | 2026-01-30 |
| #375 | Feature request: dynamic skill acquisition via skills.sh | Discussed, partially addressed by marketplace | 2026-01-30 |
| #366 | Agent Security Audit Report by ASK | Informational | 2026-01-30 |
| #341 | SessionStart:resume hook error | Hook fixes | 2026-01-23 |
| #327 | marketplace.json.name | Config fix | 2026-01-23 |
| #312 | Claude Code Skills not found (Chinese) | Install guidance | 2026-01-22 |
| #275 | SessionStart:startup hook error | Hook fixes | 2026-01-22 |
| #274 | Superpowers skills on disk but not usable in Codex | PR #430 | 2026-01-19 |
| #273 | opencode fails to start after install (Chinese) | PR #335 | 2026-01-22 |
| #197 | Codex superpowers-codex use-skill hangs (Chinese) | Codex fixes | 2025-12-29 |
| #189 | brainstorm skill disable-model-invocation error | v4.x skill config fix | 2025-12-29 |
| #180 | Featured in Awesome Claude Code | Informational/celebratory | 2025-12-23 |
| #176 | Multi-agent installer for your skills | Discussed | 2025-12-19 |
| #174 | Optimizing skill triggering | Addressed by v4.x short descriptions | 2025-12-18 |
| #161 | Superpowers + frontend-design skill | Discussed | 2025-12-18 |
| #140 | /help does not display commands | v4.x fixes | 2025-12-23 |
| #119 | docs location (move to ./claude/docs/plans/) | Discussed, not changed | 2025-12-23 |
| #117 | integration with claude-skills-cli | Discussed | 2025-12-23 |
| #94 | superpowers requires a startup hook | Hook infrastructure improvements | 2025-12-23 |
| #78 | Version mismatch: plugin.json vs marketplace.json | Version sync fix | 2025-10-31 |
| #77 | Consider OpenSkills CLI for non-Claude agents | Discussed | 2025-10-31 |
| #74 | Lite superpowers using fewer tokens | Discussed, partially by PR #522 | 2025-10-31 |
| #63 | Sending appreciation | Thank you note | 2025-10-28 |
| #58 | Cannot use skills, not found | Install/path fix | 2025-12-23 |
| #53 | A typo in the README | Typo fix | 2025-10-20 |
| #50 | elements-of-style missing | Separate plugin | 2025-10-20 |
| #49 | Clean reinstall but skills broken | Install path fix | 2025-12-23 |
| #44 | README uses /brainstorm but should be superpowers:brainstorming | Naming standardization | 2025-10-18 |
| #43 | README out of date | Docs update | 2025-10-18 |
| #42 | Superpower degradation since Anthropic Skills release | Skills migration fixes | 2025-11-01 |
| #39 | Skills read from different directory after Skills switch | Skills path migration | 2025-10-16 |
| #36 | Superpowers simply stopped working | Plugin loading fix | 2025-10-16 |
| #35 | README is included as command | Manifest fix | 2025-10-16 |
| #22 | Have you saved the initial brief? | Discussed | 2025-10-14 |
| #21 | Request for detailed installation instructions | PR #90 | 2025-11-24 |
| #20 | Codex installation | Install docs | 2025-10-28 |
| #15 | Support for "per project" install | Discussed | 2025-10-16 |
| #14 | find-skills at first tries to run nonexistent command | Early fix | 2025-10-13 |
| #13 | Cleanup after uninstalling plugin | Discussed | 2025-10-16 |
| #16 | session-start.sh fails when skills repo diverged | PR #9 | 2025-10-13 |
| #10 | Hook additional context shown on startup | Hook config | 2025-10-13 |
| #8 | "Plugin hook error" when launching Claude Code | PR #9 | 2025-10-13 |
| #7 | Opening Claude Code has no built-in commands | PR #9 | 2025-10-13 |
| #3 | No marketplace.json? | Early setup | 2025-10-11 |

---

## Cross-Reference: Merged PRs to Closed Issues

| PR | Title | Issues Resolved |
|----|-------|-----------------|
| #134 | Add Windows support for plugin hooks | #37, #51, #225, #31, #173, #141 |
| #331 | Fix Windows hook execution for Claude Code 2.1.x | #313, #317, #292, #418, #419, #413, #412, #404, #399, #393, #389, #369, #440, #431 |
| #335 | Fix OpenCode native skills + Windows hook execution | #339, #311, #303, #256, #232, #177 |
| #330 | Feat: OpenCode native skills + fix agent reset bug | #328, #301, #226, #187, #239 |
| #349 | Fix opencode: standardize on plugins/ directory | #343, #342 |
| #297 | Fix: respect OPENCODE_CONFIG_DIR | #298 |
| #523 | Fix: restore polyglot wrapper for Windows hook compat | #518, #491, #487, #354, #293, #417, #414, #466 |
| #428 | Fix ~/ path expansion on Windows | #420, #518, #51 |
| #427 | Fix Windows/PowerShell invocation of superpowers-codex | #285, #243 |
| #430 | Migrate Codex to native skill discovery | #416, #403, #394, #96, #72 |
| #462 | Enforce brainstorming workflow with hard gates | #388, #73 |
| #382 | Fix: require worktree setup before execution | #573, #378 |
| #153 | Chore: gitignore settings.local.json | #154 |
| #160 | Fix: use git check-ignore for worktree gitignore | #101 |
| #157 | Docs: fix documentation accuracy issues in skills | #195 |
| #144 | Fix: properly inherit agent model from main | #214, #131 |
| #120 | Remove model name from core-reviewer | #131 |
| #115 | Fix: yaml error in code-reviewer agent | #55 |
| #467 | Add Cursor plugin compatibility | #106, #295 |
| #522 | Scale process-oriented skills to task complexity | #254 |
| #9 | Fix session-start hook execution in plugin context | #8, #7 |
| #90 | Update installation instructions | #81, various install questions |

---

## Priority Actions for Our Fork

Based on this analysis, the most impactful unaddressed items for our v4.5.0+ roadmap:

### P0 -- High Impact, Achievable Now
1. **Worktree env file copying** (#521, #220, #241): Add configurable file/directory list to copy into worktrees. Blocks real-world usage for any project with env-dependent tests.
2. **Session resume from state.yml** (#329, #364): We built the infrastructure (state.yml) but no resume mechanism. Add resume integration to session-start hook.

### P1 -- Medium Impact
3. **context:fork investigation** (#245): Test whether `context: fork` in brainstorming frontmatter improves or breaks the workflow.
4. **Security hardening** (#366): Audit eval usage in hook scripts.
5. **Platform-aware question reduction** (#73, #74): Fewer questions on Codex/autonomous runners.

### P2 -- Low Impact / Monitor
6. **File write hanging** (#185): Monitor after deployment.
7. **Skill triggering reliability** (#42, #48, #215): Our gate infrastructure should help. Monitor.

---

*Generated 2026-03-01 from comprehensive scan of all 156 closed issues on obra/superpowers.*

