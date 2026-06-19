# Release Notes

## v1.7.1 (2026-06-19)

### Changed
- **using-superpowers** consolidated 5 navigation systems (Skill Priority, Decision Ladder, Canonical Sequence, Which Skill table, Built-in Overlap examples) into a single Decision Ladder with disambiguations and a compact overlap table — 130 lines removed
- **using-superpowers** removed EXTREMELY-IMPORTANT block; replaced with clear Skill Invocation Rule
- **using-superpowers** defined "your human partner" = the user in the current conversation
- **using-superpowers** fixed systematic-debugging appearing in both Process and Implementation skill lists
- **using-superpowers** added verification-before-completion, receiving-code-review, and skill-authoring-tdd to Decision Ladder
- **subagent-driven-development** reconciled continuous execution vs. pre-flight review contradiction — exceptions now explicitly listed
- **subagent-driven-development** clarified "changes" definition for re-dispatch (different model, context, instructions, or broken-down task)
- **subagent-driven-development** clarified DONE_WITH_CONCERNS boundary (correctness/scope vs. observations)
- **writing-plans** replaced "questionable taste" language with "unfamiliar with this codebase's conventions and patterns"
- **test-driven-development** removed "Why Order Matters" section (redundant with Common Rationalizations table) — 52 lines removed
- **test-driven-development** closed exceptions loophole — skipping TDD now requires EXPLICIT user approval
- **test-driven-development** defined when mocks are unavoidable (external services, side effects, slow dependencies)
- **skill-authoring-tdd** reduced SDO examples from 6 to 2 — same principles, less bloat

### Added
- **SUBAGENT-STOP tags** added to 8 skills that lacked them: executing-plans, systematic-debugging, merge-conflict-resolution, writing-plans, brainstorming, using-git-worktrees, skill-authoring-tdd, finishing-a-development-branch
- **Integration sections** added to 6 skills: dispatching-parallel-agents, brainstorming, verification-before-completion, receiving-code-review, test-driven-development, writing-plans

### Fixed
- **releasing** clarified "Tests Pass (if applicable)" — only skip if project has no test suite
- **requesting-code-review** clarified BASE_SHA comment (HEAD~1 vs origin/main)
- **merge-conflict-resolution** defined semantic conflict (textually clean but behaviorally wrong)
- **verification-before-completion** clarified "in this message" — stale if run 3 messages ago
- **systematic-debugging** added context for root-cause-tracing.md reference
- **receiving-code-review** clarified gratitude vs. factual acknowledgment boundary

## v1.7.0 (2026-06-19)

### Added
- **subagent-driven-development** rewritten review system — single task reviewer (spec + quality), file-based artifacts, progress ledger, pre-flight plan review
- **subagent-driven-development** new scripts: `sdd-workspace`, `task-brief`, `review-package` for file-based diff/brief handling
- **writing-plans** Global Constraints block and per-task Interfaces block
- **writing-plans** Task Right-Sizing guidance
- **brainstorming** per-session key authentication for visual companion
- **brainstorming** auto-reconnect with exponential backoff and tombstone overlay
- **brainstorming** just-in-time companion offering (not upfront)
- **brainstorming** `--open` flag for auto-opening browser after consent
- **brainstorming** `--idle-timeout-minutes` flag (default 4h, was 30min)
- **brainstorming** server instance ID for safe stop-server.sh PID verification
- **skill-authoring-tdd** "Match the Form to the Failure" decision table from upstream writing-skills
- **skill-authoring-tdd** "Micro-Test Wording Before Full Scenarios" methodology

### Changed
- **subagent-driven-development** merged spec-reviewer + code-quality-reviewer into single task-reviewer-prompt.md
- **subagent-driven-development** model selection now requires explicit model per dispatch
- **subagent-driven-development** controller cannot pre-judge or suppress reviewer findings
- **finishing-a-development-branch** forge-neutral PR creation (no hardcoded `gh pr create`)
- **using-git-worktrees** removed legacy global worktree directory (`~/.config/superpowers/worktrees/`)
- **using-git-worktrees** renumbered steps (Step 3→2, Step 4→3)
- **skill-authoring-tdd** CSO renamed to SDO (Skill Discovery Optimization)
- Vendor-neutral language across all skills, adapted for Letta Code conventions

### Fixed
- **brainstorming** file server sandboxing (symlinks, dotfiles, path traversal)
- **systematic-debugging** "Ultrathink" → "Ultra-think" hyphenation
- **test-driven-development** `@testing-anti-patterns.md` → proper markdown link (Letta Code doesn't support `@` syntax)

### Removed
- **subagent-driven-development** `spec-reviewer-prompt.md` and `code-quality-reviewer-prompt.md` (merged into `task-reviewer-prompt.md`)
- **using-git-worktrees** legacy `~/.config/superpowers/worktrees/` global directory support

## v1.6.0 (2026-05-22)

### Added
- **using-git-worktrees** now explicitly documents `CreateWorktree` as the Letta Code native tool (Step 1a)

### Changed
- **using-git-worktrees** default worktree directory is now `.letta/worktrees/` (aligned with Letta Code PR #1693 enforcement)
- **using-git-worktrees** directory priority reordered: existing `.letta/worktrees/` → legacy `.worktrees/`/`worktrees/` → global → default `.letta/worktrees/`
- **finishing-a-development-branch** provenance check reordered with `.letta/worktrees/` first
- **using-superpowers** Git Worktrees overlap section updated to emphasize detection/consent/setup/verification gaps

### Fixed
- **releasing** pre-release checklist now includes "Review changes" step (was documented in process but missing from checklist)
- Stale "changelog" references updated to "release notes" in using-superpowers and FUTURE-SKILLS.md

## v1.5.1 (2026-05-06)

### Changed
- **Releasing skill** now detects the release notes file dynamically (RELEASE-NOTES.md or CHANGELOG.md) instead of hardcoding CHANGELOG.md
- **Releasing skill** bootstraps RELEASE-NOTES.md for new projects that don't have one yet
- **Finishing-a-development-branch** post-merge check now detects the release notes file instead of hardcoding CHANGELOG.md

### Removed
- **CHANGELOG.md** removed in favor of RELEASE-NOTES.md (aligns with upstream obra/superpowers convention)

## v1.5.0 (2026-05-06)

### Added
- **merge-conflict-resolution** skill — classifies merge conflicts by type (both-modified, delete/modify, generated, semantic), applies per-type resolution strategies, auto-resolves clear cases, escalates ambiguous ones
- **finishing-a-development-branch** now references merge-conflict-resolution when merge produces conflicts
- **using-superpowers** decision ladder updated with merge-conflict-resolution entry

### Fixed
- **finishing-a-development-branch** Option 2 now has post-merge follow-up step (pull main, clean up, offer to release)

## v1.4.0 (2026-05-06)

### Added
- **Environment detection** in using-git-worktrees (Step 0) — detects if already in a linked worktree and skips creation; includes submodule guard
- **Consent before worktree creation** — asks user before creating worktrees (no more auto-creation without consent)
- **Native tool preference** (Step 1a) — defers to harness-native worktree tools before falling back to `git worktree`
- **Environment detection** in finishing-a-development-branch (Step 2) — determines workspace state (normal repo, worktree, detached HEAD) before presenting menu
- **Detached HEAD menu** — reduced 3-option menu when working in an externally managed workspace
- **Provenance-based cleanup** — only cleans up worktrees under `.worktrees/`, `worktrees/`, `.letta/worktrees/`, or `~/.config/letta-superpowers/worktrees/`; leaves harness-owned worktrees alone
- **CWD safety** — always `cd` to main repo root before `git worktree remove`; runs `git worktree prune` after removal
- **Continuous execution directive** in subagent-driven-development — execute all tasks without pausing between them

### Changed
- **using-git-worktrees** core principle updated to: "Detect existing isolation first. Then use native tools. Then fall back to git. Never fight the harness."
- **finishing-a-development-branch** process expanded from 6 to 7 steps (added environment detection between test verification and base branch detection)
- **finishing-a-development-branch** core principle updated to: "Verify tests → Detect environment → Review diff → Present options → Execute choice → Clean up"

## v1.3.0 (2026-05-06)

### Added
- **Git hooks** to prevent accidental commits to main/master branches (`pre-commit` hook in `.githooks/`)
- **Setup script** for one-time git hooks installation (`skills/using-superpowers/scripts/setup-git-hooks.sh`)
- **First-run setup** section in using-superpowers skill for automatic hook installation
- **Test suite** for git hooks (`tests/test-git-hooks.sh`)
- **Diff review step** in finishing-a-development-branch (Step 3) — review full diff before presenting merge/PR options
- **GitHub milestone integration** — optional milestone creation and issue filing in writing-plans, `--milestone` flag on PR creation in finishing-a-development-branch, milestone close step in releasing

### Changed
- **finishing-a-development-branch** process expanded from 5 to 6 steps (added diff review between base branch detection and option presentation)
- **releasing** process expanded from 6 to 7 steps (added milestone close after release verification)

### Fixed
- **Worktree cleanup contradictions** in finishing-a-development-branch (unified to cleanup Options 1,3,5; keep Options 2,4)
- **Wrong step numbers** in finishing-a-development-branch Integration section
- **Wrong caller** in using-git-worktrees Integration (brainstorming → writing-plans)
- **Ambiguous path** in code-quality-reviewer-prompt.md
- **TESTS_RUN counter** not incremented in test-utils.sh pass()/fail()
- **Executable bit** on .githooks/pre-commit not preserved by git
- **.gitattributes** missing .githooks/* rule for LF enforcement; file had CRLF line endings

## v1.2.2 (2026-04-20)

### Fixed
- **Template variable mismatch** in requesting-code-review (aligned `PLAN_REFERENCE` to `PLAN_OR_REQUIREMENTS`)
- **Skill description format** in brainstorming to use "Use when..." convention
- **Path style inconsistency** in brainstorming (absolute → relative path)
- **find-polluter.sh** now documents `find -path` syntax (not shell globs)
- **Worktree handoff** in brainstorming now documented (fixes upstream obra/superpowers inconsistency)
- **Decision ladder** now includes review step (step 8) and review skills in disambiguations
- **Orphaned receiving-code-review** now linked from requesting-code-review

### Changed
- **using-superpowers decision ladder** expanded from 9 to 10 steps
- **letta-code-tools.md** reference updated with missing tools (TaskOutput, TaskStop, AskUserQuestion, memory)

### Added
- **Symlink setup** for `.skills/` → `skills/` (single source of truth)
- **FUTURE-SKILLS.md** documenting 8 identified workflow gaps for future development
- **Requesting/receiving-code-review** integration documented in "Which Skill to Use?" table

## v1.2.1 (2026-04-15)

### Changed
- **Built-in skill overlap** guidance rewritten with detailed example scenarios
- CORRECT vs WRONG paths for each overlapping skill
- Quick reference table for fast disambiguation
- Covers: `skill-authoring-tdd`, `using-git-worktrees`, `dispatching-parallel-agents`

## v1.2.0 (2026-04-15)

### Added
- **Continue button** to Visual Companion: Users click to confirm selection instead of returning to terminal
- **Automated test suite** for Visual Companion (`tests/` directory)
- **Test logging** with clean audit trail (`tests/test-results.log`)
- `wait_for_done()` pattern in visual-companion.md for blocking until user confirms

### Changed
- Continue button appears automatically when user makes a selection
- Button sends `{"type":"done"}` event with final selection
- Users can change selection multiple times before clicking Continue
- Updated visual-companion.md with new workflow documentation

### Fixed
- Server binds to 0.0.0.0 when needed for WSL/Windows accessibility

## v1.1.0 (2026-04-13)

### Added
- **Canonical Skill Sequence** to `using-superpowers/SKILL.md`: 8-step workflow chain (brainstorming → worktrees → plans → execute → review → finish → release)
- **Task Type → Skill Mapping** table: Quick reference for which skill to use first
- **Hard Gates** section: 4 non-negotiable rules (no code before design, etc.)
- **When to Parallelize** rules: Guidance for using `dispatching-parallel-agents`
- **Built-in Skill Overlap** guidance: Clarifies when to use superpowers skills vs Letta Code built-ins

### Changed
- Renamed `writing-skills` → `skill-authoring-tdd` to avoid trigger collision with built-in `creating-skills`
- Updated README.md with new skill name
- Updated internal reference in `testing-skills-with-subagents.md`

### Fixed
- Normalized line endings to LF (enforced by .gitattributes)

## v1.0.2 (2026-04-13)

### Fixed
- visual-companion.md: Changed `latest-click.json` → `tail -1 $STATE_DIR/events` (server writes NDJSON)
- visual-companion.md: Fixed stop-server.sh argument from `--project-dir` to `$SESSION_DIR`
- visual-companion.md: Added note explaining `state_dir` vs `SESSION_DIR` relationship
- code-quality-reviewer-prompt.md: Changed subagent_type from `explore` to `general-purpose` (needs Bash for git diff)
- brainstorming/SKILL.md: Removed non-existent `frontend-design`, `mcp-builder` references
- using-superpowers/SKILL.md: Changed skill examples to existing skills
- render-graphs.js: Changed "your human partner" → "the user"

### Impact
- Full brainstorming workflow (start server → push content → read selection → stop server) now works end-to-end

## v1.0.1 (2026-04-13)

### Fixed
- Removed incorrect `run_in_background: true` from visual-companion.md (start-server.sh handles backgrounding via nohup)
- Updated Visual Companion documentation with accurate Note about nohup behavior and --foreground flag warning
- Changed frame-template.html header link from obra/superpowers to grayemon/letta-superpowers
- Added `**/diagrams/` to .gitignore for render-graphs.js output

### Changed
- Updated Known Limitations: Visual Companion server runs independently via nohup (not subject to 120s timeout)

## v1.0.0 (2026-04-13)

First stable release of Letta Code adaptation.

### Added
- 14 Letta Code compatible skills
- `skills/using-superpowers/references/letta-code-tools.md` for Letta Code tool reference
- `history-analyzer` subagent type to tools reference
- `.superpowers/` to .gitignore (session files)

### Changed
- All Task() tool calls updated to Letta Code structured parameter syntax: `Task({ subagent_type, description, prompt, model })`
- Removed `superpowers:` namespace prefix from all skill references
- Updated code review workflow to use `subagent_type: "general-purpose"` (no custom agent definition needed)
- Visual Companion adapted for Letta Code with `run_in_background: true` guidance
- `docs/superpowers/specs/` → `docs/specs/` (5 skills updated)
- `docs/superpowers/plans/` → `docs/plans/` (2 skills updated)
- `~/.config/superpowers/` → `~/.config/letta-superpowers/` (config paths)

### Fixed
- Removed non-existent `"fork"` subagent type from letta-code-tools.md
- Fixed `"inherit"` model param (should omit param, not pass literal)
- Replaced Claude Code `@` file syntax with explicit Read instructions
- Removed reference to missing `.letta/INSTALL.md`
- Replaced Jesse-specific paths with generic `/home/user/` paths
- Removed Jesse person references from skill docs
- Added cloud interface caveate to Visual Companion documentation
- Removed reference to missing `elements-of-style:writing-clearly-and-concisely` skill
- Clarified `@` syntax explanation for Letta Code context
- Fixed "Lace" project reference in condition-based-waiting-example.ts

### Removed
- Platform-specific directories: `.claude-plugin/`, `.cursor-plugin/`, `.opencode/`, `.codex/`
- Platform-specific files: `hooks/`, `agents/`, `GEMINI.md`, `AGENTS.md`
- Plugin infrastructure: `scripts/bump-version.sh`, `package.json`, `.version-bump.json`
- Original contributor guidelines: `CLAUDE.md`

### Known Limitations
- Visual Companion requires local Letta Code CLI execution
- Brainstorm server runs via nohup (independent of Bash timeout)

### Credits
- Original: [obra/superpowers](https://github.com/obra/superpowers) by Jesse Vincent
- Letta Code adaptation: Raymond
- Review feedback: Ezra (Letta/MemGPT Team)
