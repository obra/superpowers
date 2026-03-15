# Superpowers Release Notes

## v5.1.0 (2026-03-14)

Upstream sync and hardening release. Adopts the most impactful changes from obra/superpowers, adds new safety mechanisms, and removes deprecated features.

### New Features

**Subagent context isolation** — All delegation skills (`subagent-driven-development`, `dispatching-parallel-agents`, `executing-plans`) now explicitly prohibit forwarding parent session context or history to subagents. Each subagent prompt is constructed from scratch with only task-scoped information. This prevents context pollution where subagents inherit the parent's reasoning chains and behave incorrectly (e.g., a reviewer acting as a lead developer).

**Subagent skill leakage prevention** — All subagent prompt templates now include an explicit instruction preventing subagents from discovering and invoking superpowers-optimized skills via filesystem access. Without this, a focused implementer subagent could discover workflow skills like `brainstorming` or `executing-plans` and derail into orchestration mode instead of doing its assigned task.

**Instruction priority hierarchy** — `using-superpowers` now declares an explicit priority order: (1) explicit user instructions, (2) project-level CLAUDE.md/AGENTS.md, (3) Superpowers skill instructions. Skills are defaults, not mandates — if a user explicitly overrides a skill's behavior, the agent follows the user.

**Plan review gate** — `writing-plans` now dispatches a plan-reviewer subagent after saving a plan, before offering execution options. The reviewer checks for vague steps, missing file paths, hidden dependencies, incorrect TDD ordering, and scope gaps against the approved design. Bad plans are revised before execution begins.

**Project scope decomposition** — `brainstorming` now assesses whether a project is too large for a single spec (4+ independent subsystems or 20+ tasks) and decomposes into sub-projects with separate specs. This prevents the common failure mode of trying to design an entire system in one monolithic document.

**Architecture guidance for existing codebases** — `brainstorming` now includes explicit guidance to study existing patterns before proposing new ones, match project conventions, and design for isolation (minimizing blast radius per change).

**Premise check skill** — New `premise-check` skill validates whether proposed work should exist before investing in it. Forces three questions (does the problem exist? is the solution proportional? what's the cost of not building?) and triggers reassessment when new evidence weakens the original motivation for in-progress work. Prevents over-engineering by catching unnecessary complexity before it's built.

### Changes

**Recommended subagent-driven-development** — `writing-plans` now labels `subagent-driven-development` as the recommended execution path (parallel with per-task review gates) and `executing-plans` as the alternative (sequential, simpler). User choice is preserved.

**Slash commands removed** — The `commands/` directory (`/brainstorm`, `/execute-plan`, `/write-plan`) has been removed. Skills are now the primary mechanism in Claude Code. Natural language routing via `skill-activator.js` and the `using-superpowers` router handle all workflow selection automatically — no manual command invocation needed.

**Gemini CLI support** — Added Gemini CLI installation instructions to README.

**Compatibility warning** — README now includes a prominent note about potential interference from other plugins or custom skills/agents that overlap with this plugin's domains.

### Fixes

**Linux hook variable expansion** — All 7 hook entries in `hooks.json` changed from single quotes to escaped double quotes around `${CLAUDE_PLUGIN_ROOT}`. Single quotes prevented shell variable expansion on Linux, causing "No such file or directory" errors (upstream issue #577).

---

## v5.0.0 (2026-03-13)

Major overhaul focused on signal-to-noise ratio: every skill must earn its place by changing behavior Claude wouldn't follow on its own. Role-play skills merged into the skills that use them, router redesigned for zero-cost micro-tasks, and two new killer features added (error recovery intelligence and progress visibility).

### Breaking Changes

**6 skills removed (merged or deleted)**

The following skills no longer exist as standalone skills. Their useful parts have been absorbed into the skills that invoke them:

- `senior-engineer` — Engineering rigor sections merged into `brainstorming` (design-phase) and `executing-plans` (implementation-phase). The role-play prompt ("you are an expert with 30 years experience") was removed as it didn't change behavior — specific rules do.
- `testing-specialist` — Advanced test strategy (integration, E2E, property-based, performance, flaky test diagnosis, coverage strategy) merged into `test-driven-development` as a new "Advanced Test Strategy" section.
- `security-reviewer` — Full OWASP/CWE security checklist, severity enforcement, and auto-trigger conditions merged into `requesting-code-review` as a built-in "Security Review" section. The `protect-secrets.js` hook continues to handle automated enforcement.
- `adaptive-workflow-selector` — 3-tier complexity classification (micro/lightweight/full) folded directly into `using-superpowers` as an inline "Complexity Classification" section. No longer requires a separate skill invocation.
- `prompt-optimizer` — Removed. Rarely triggered, marginal value. Brainstorming already handles ambiguous requests through clarifying questions.
- `writing-skills` — Removed. Developer-only meta-skill, not user-facing value. Contributing guide updated in README.

**Skill count: 24 → 19** (5 deleted, 1 new)

**`adaptive-workflow-selector` no longer exists as a standalone skill.** If your CLAUDE.md or custom workflows reference it, update them to use `using-superpowers` which now handles complexity classification inline.

### Added

**error-recovery — Project-specific error-to-solution intelligence**

New skill that maintains `known-issues.md` at the project root — a mapping of recurring errors to their proven solutions. Designed for errors that waste time when rediscovered each session: environment setup, missing services, platform-specific issues, configuration problems.

- Consulted automatically by `systematic-debugging` in a new Phase 0 (before investigation begins)
- Read by `using-superpowers` during the entry sequence when the file exists
- Updated after resolving bugs that meet recurrence criteria (environment-dependent, config, platform-specific)
- Entries kept concise: error pattern, cause, fix command, context
- File capped at 50 entries with pruning guidance

**track-session-stats.js — Progress visibility hook**

New PostToolUse hook (triggered on Skill tool calls) that tracks skill invocations to `session-stats.json`. Provides:
- Session duration
- Total skill invocations with per-skill breakdown
- Auto-expires after 2 hours (new session)
- Integrated into `stop-reminders.js` which now surfaces a session summary line

**Micro-task detection in skill-activator.js**

The UserPromptSubmit hook now detects micro-tasks (typo fixes, variable renames, import additions, etc.) and outputs `{}` — zero routing overhead. Patterns include:
- "fix the typo on line 42" → skipped
- "rename foo to bar" → skipped
- "add missing import" → skipped
- "build me a new auth system" → routed normally

**Confidence threshold in skill-activator.js**

Skill matching now requires a minimum score of 2 (was 1). Single-keyword matches that produced false positives are filtered out:
- "review" alone → no suggestion (was: suggested code review)
- "review my code before merge" → correctly routes to requesting-code-review

**3-tier complexity classification in using-superpowers**

Replaces the separate `adaptive-workflow-selector` skill with an inline classification:
- **Micro**: typo fix, single rename, 1-line config change → skip everything, just do it
- **Lightweight**: ~2 files, no new behavior/architecture → implement directly, only verification-before-completion at the end
- **Full**: anything else → complete pipeline (brainstorming → planning → execution → review → verify)

**Lightweight fast path**

Lightweight tasks now skip brainstorming, planning, worktrees, and parallel dispatch. Only gate: `verification-before-completion` when done. This eliminates the previous 3-skill-invocation overhead for small changes.

### Changed

**brainstorming: Added Engineering Rigor section**

Absorbed from senior-engineer: requirements verification, edge case identification, explicit trade-off evaluation, SOLID principles, architectural risk flagging. Removed prompt-optimizer reference.

**executing-plans: Added Engineering Rigor for Complex Tasks section**

Absorbed from senior-engineer: approach validation against requirements, edge case identification, simpler alternative consideration, hidden coupling prevention. Removed senior-engineer reference.

**test-driven-development: Added Advanced Test Strategy section**

Absorbed from testing-specialist: integration tests, E2E tests, property-based tests, performance tests, flaky test diagnosis, coverage strategy. Removed testing-specialist reference.

**requesting-code-review: Added Security Review (Built-In) section**

Absorbed from security-reviewer: OWASP Top 10/CWE scan, input validation, auth flow review, secrets handling, dependency vulnerabilities, logging hygiene. Auto-triggers when changes touch auth, data handling, APIs, secrets, crypto, or infrastructure. Critical/High findings block merge. Updated description to include security-related trigger keywords.

**receiving-code-review: Updated security finding reference**

Removed standalone security-reviewer reference. Security findings now come from the integrated security section in requesting-code-review.

**subagent-driven-development: Removed senior-engineer references**

Replaced "invoke senior-engineer subagent" with inline guidance: validate approach against requirements, consider simpler alternatives. Blocked task protocol updated similarly.

**writing-plans: Removed prompt-optimizer reference**

Replaced with direct guidance: ask clarifying questions for ambiguous features rather than invoking a separate prompt optimization step.

**systematic-debugging: Added Phase 0 (Check Known Issues)**

New first phase before investigation: check `known-issues.md` for the error message/code/test name, try documented solution first. If it works, stop — no further investigation needed. Added post-fix prompt to update known-issues.md for recurring errors.

**using-superpowers: Complete rewrite**

- Entry sequence simplified: token-efficiency → classify complexity → check state.md → check known-issues.md → follow appropriate path
- Removed adaptive-workflow-selector invocation
- Added inline complexity classification (micro/lightweight/full)
- Removed security-reviewer from routing guide (now built into requesting-code-review)
- Updated red flags section

**token-efficiency: Updated description**

Removed adaptive-workflow-selector reference. Added "exploration tracking" to description.

**skill-rules.json: Rebuilt**

- Removed 6 rules for deleted skills (adaptive-workflow-selector, senior-engineer, testing-specialist, security-reviewer, prompt-optimizer, writing-skills)
- Added error-recovery rule
- Merged security keywords into requesting-code-review rule
- Merged testing-specialist keywords into test-driven-development rule
- Total: 16 → 14 rules

**hooks.json: Added track-session-stats**

New PostToolUse hook entry for Skill matcher, running `track-session-stats.js`.

**stop-reminders.js: Added session stats summary**

Now loads `session-stats.json` and includes a session summary line (duration, skill count, breakdown) in stop-hook output alongside existing TDD and commit reminders.

**AGENTS.minimal.md: Updated to reflect new skill set**

Removed references to adaptive-workflow-selector, senior-engineer, security-reviewer, testing-specialist, prompt-optimizer. Added error-recovery and known-issues.md guidance.

**README.md: Complete rewrite**

- Added workflow diagram showing the complete hook and routing flow
- Updated feature comparison table (7 hooks, 3-tier routing, integrated security, error recovery, progress visibility)
- Updated Skills Library to 19 skills organized by category (Core Workflow, Design & Planning, Execution, Quality & Testing, Review & Integration, Intelligence)
- Listed all 7 hooks with their matchers and descriptions
- Updated contributing guide (removed writing-skills reference)
- Added "Proportional overhead" to philosophy section

## v4.6.0 (2026-03-11)

This release integrates self-consistency reasoning (Wang et al., ICLR 2023) into the two skills where single-chain reasoning failures are most expensive: root cause diagnosis and completion verification. Also includes plugin manifest fixes, marketplace metadata improvements, and README updates with research-driven optimization documentation and shields.io badges.

### Added

**self-consistency-reasoner — Multi-path reasoning technique for high-stakes inference**

New internal skill based on the Self-Consistency method (Wang et al., ICLR 2023). Generates N independent reasoning paths and takes majority vote to catch confident-but-wrong single-chain failures. Not invoked independently — embedded in the skills that need it. Key design decisions:

- Scoped to fire only during high-stakes multi-step inference where being wrong has real cost
- Path count scales to difficulty: 3 for binary verification, 5 for root cause diagnosis, 7 for complex multi-factor problems
- Low confidence (<=50% agreement) triggers a hard stop, not a best-guess — ambiguity is surfaced, not hidden
- Process is internal: users see only the aggregated result and confidence level

**systematic-debugging: Self-Consistency Gate in Phase 3**

Phase 3 (Hypothesize and Test) now requires multi-path reasoning before committing to a root cause hypothesis. The agent generates 3-5 independent hypotheses via different approaches (trace forward from inputs, backward from error, from recent changes, from similar past bugs), takes majority vote, and gates on confidence:
- High (80-100%): proceed to test
- Moderate (60-79%): proceed but note minority hypothesis as fallback
- Low (<=50%): hard stop — gather more evidence before choosing a direction

This directly addresses the most expensive debugging failure mode: latching onto the first plausible hypothesis and committing 3+ edits before discovering the root cause was different.

**verification-before-completion: Self-Consistency Verification**

Added multi-path verification for non-trivial completion claims. When the evidence evaluation requires multi-step inference, the agent generates 3 independent reasoning paths evaluating "does this evidence actually prove the claim?" — one checking what the evidence proves, one checking what it doesn't prove, one considering alternative explanations. Catches the failure mode where evidence is interpreted through a single (potentially wrong) lens, leading to false "done" declarations.

**README: Research-Driven Optimizations section**

Added comprehensive documentation of the three research papers that ground the fork's optimizations:
- arXiv:2602.11988 (AGENTbench) — why minimal context files outperform verbose ones
- arXiv:2602.24287 — why prior assistant responses degrade performance
- Wang et al., ICLR 2023 — why single reasoning chains fail on hard problems

Each paper section includes key findings, what was changed in the fork, and the four core principles that emerged.

**README: shields.io badges**

Added badges for GitHub stars, install command (links to Installation section), Cursor, Claude Code, Codex CLI, and MIT license.

### Fixed

**Plugin manifest: Duplicate hooks error**

Removed `"hooks": "./hooks/hooks.json"` from both `.claude-plugin/plugin.json` and `.cursor-plugin/plugin.json`. Claude Code auto-loads `hooks/hooks.json` from the standard path, so explicitly declaring it caused a "Duplicate hooks file detected" error on plugin installation.

**Plugin manifest: Invalid author.repository field**

Removed `repository` from inside the `author` object in `.claude-plugin/plugin.json`. The `author` field only supports `name` and `email` per the plugin schema. The top-level `repository` field was already correctly set.

### Improved

**Marketplace metadata**

Enhanced `.claude-plugin/marketplace.json` with `metadata.description`, plugin-level `homepage`, `repository`, `license`, `category`, and `tags` fields for better discoverability.

---

## v4.5.0 (2026-03-10)

This release adds a comprehensive hooks system with proactive skill routing, edit tracking, stop reminders, and two safety guard hooks. Also includes cross-session memory for the code-reviewer agent and README corrections.

### Added

**Hooks System — 5 new hooks for proactive workflow enforcement and safety**

The plugin now ships a full hooks pipeline registered in `hooks/hooks.json`:

- **skill-activator** (UserPromptSubmit) — Matches user prompts against 17 keyword/regex rules in `hooks/skill-rules.json` before Claude processes them. Injects up to 3 relevant skill suggestions wrapped in `<user-prompt-submit-hook>` tags, reinforcing the `using-superpowers` routing system deterministically. Returns `{}` for non-matching prompts (zero token cost).

- **track-edits** (PostToolUse, matcher: Edit|Write) — Logs every file edit to `~/.claude/hooks-logs/edit-log.txt` with ISO timestamp, tool name, and resolved file path. Auto-rotates at 500 lines with a size-based check (50KB threshold) to avoid reading the file on every write. Feeds data to `stop-reminders`. Never blocks.

- **stop-reminders** (Stop) — Generates contextual reminders when Claude finishes a response: TDD reminder (source files changed without corresponding test files), commit reminder (5+ files modified). Uses a file-based TTL guard (`stop-hook-fired.lock`, 2-minute expiry) to prevent the infinite loop where Stop hook output causes Claude to resume.

- **block-dangerous-commands** (PreToolUse, matcher: Bash) — Blocks destructive bash commands across 3 severity tiers (critical/high/strict). Default level: `high`. Covers 26 patterns including `rm -rf /`, `git push --force`, `DROP TABLE`, `chmod 777`, `mkfs`, `:(){ :|:& };:`, and more. Logs blocked operations to `~/.claude/hooks-logs/YYYY-MM-DD.jsonl`. Based on claude-code-hooks by karanb192 (MIT License).

- **protect-secrets** (PreToolUse, matcher: Read|Edit|Write|Bash) — Prevents reading, modifying, or exfiltrating sensitive files. 30 sensitive file patterns (`.env`, SSH keys, AWS credentials, PEM files, etc.) + 31 bash exfiltration patterns (`curl -d @.env`, `scp id_rsa`, `cat .env`, etc.). Allowlist for safe files (`.env.example`, `.env.template`). Allowlist intentionally NOT applied to bash commands to prevent bypass via chained commands like `cat .env.example && cat .env`. Based on claude-code-hooks by karanb192 (MIT License).

**code-reviewer agent: Cross-session memory**

Added `memory: user` to `agents/code-reviewer.md`. The code-reviewer agent now retains learnings about codebase patterns, recurring issues, and project conventions across reviews via `~/.claude/user-memory/`.

### Fixed

**README: Incorrect plugin names in install/update commands**

- Cursor install command: `/plugin-add superpowers` → `/plugin-add superpowers-optimized`
- Update command: `/plugin update superpowers` → `/plugin update superpowers-optimized`

**README: Missing documentation for hooks and agents**

- Added Hooks subsection to "What's Inside" listing all 5 hooks
- Added Agents subsection documenting the code-reviewer with `memory: user`
- Updated comparison table with Hooks system and Safety guards rows
- Updated intro and summary to mention hooks and safety guards

---

## v4.4.0 (2026-03-06)

This release closes the gap between what the skills document and what agents actually do wrong. Improvements are sourced from a systematic AI self-review of the plugin combined with the previously-documented real-session failure patterns from `docs/plans/2025-11-28-skills-improvements-from-user-feedback.md`.

### Added

**verification-before-completion: Configuration Change Verification**

Added a dedicated section for changes that affect provider selection, feature flags, environment variables, or credentials. The core gap: agents verified that operations *succeeded* but not that outcomes reflected the *intended change*. The documented failure — a subagent testing an LLM integration, receiving status 200, and reporting "OpenAI working" while still hitting Anthropic — is now addressed with a gate that requires identifying, locating, and verifying the observable difference, not just operation completion. Includes a reference table of insufficient vs required evidence for common change types.

**testing-anti-patterns: Anti-Pattern 6 — Mock-Interface Drift**

Added the sixth anti-pattern: deriving mocks from implementation code rather than the interface definition. The documented failure: both the production code and the mock used `cleanup()` when the interface defined `close()`. Tests passed. Runtime crashed. TypeScript cannot catch this in inline `vi.fn()` mocks. The gate function requires reading the interface file *before* looking at the code under test, then mocking only methods with exactly the names defined in the interface. A failing test caused by a method-name mismatch is correctly treated as a bug in the code, not the mock.

**subagent-driven-development: E2E Process Hygiene section**

Added process cleanup instructions for subagents that start background services. Subagents are stateless and have no knowledge of processes started by previous subagents. Documented failure: 4+ accumulated server processes causing port conflicts and E2E tests hitting stale servers with wrong config. The section provides the exact `pkill`/`lsof`/`pgrep` pattern to include in subagent prompts for service-dependent tasks.

**subagent-driven-development: Blocked Task Protocol section**

Added escalation rules for fundamentally blocked tasks: stop after 2 failed attempts, surface the block to the user with evidence, invoke `senior-engineer` for architectural blocks, and document non-critical blocks in `state.md` rather than silently skipping them. Prevents the undefined behavior of infinite retry loops or silent task omission.

**adaptive-workflow-selector: Skill Invocation Guide**

Added concrete skill lists for each workflow path, solving the gap where the selector chose a path but never specified what that path contained. Three tiers: micro tasks (skip the selector entirely), lightweight (only `test-driven-development` + `verification-before-completion`), and full (follow the `using-superpowers` routing guide).

**frontend-craftsmanship: Concrete Standards Checklist**

Replaced aspirational guidance ("accessible, responsive, Core Web Vitals") with a verifiable, output-changing checklist across four categories: structure (semantic HTML, heading hierarchy), accessibility (alt text, aria-label, focus-visible, WCAG AA contrast), CSS (design tokens, clamp() typography, prefers-reduced-motion, mobile-first), and performance (lazy loading, layout shift prevention).

### Fixed

**requesting-code-review: Reviewer file access**

Added explicit file reading instruction to both `skills/requesting-code-review/code-reviewer.md` and `agents/code-reviewer.md`. Documented failure: reviewer subagents reporting "file doesn't appear to exist" for files that did exist, because no instruction told them to explicitly load files before reviewing. Reviewers must now run `git diff --name-only` and use the Read tool on each file before analyzing the diff.

**subagent-driven-development/implementer-prompt: Self-review produces fixes, not just findings**

Enhanced step 5 of the implementer prompt: self-review now explicitly requires fixing identified issues and re-running verification before reporting, rather than just noting them. Eliminates the unnecessary round-trip where an implementer who already knows the fix has to report it and wait for a separate fixer subagent.

**context-management: state.md canonical location**

Specified that `state.md` should be written at the project root, or next to the active plan file if one exists. Previously unspecified, causing inconsistency across sessions.

### Improved

**using-superpowers: Routing guide now covers all specialist skills**

Added two missing routing entries: `frontend-craftsmanship` for UI/frontend implementation tasks, and `security-reviewer` for security-sensitive changes before merge. The routing guide is now comprehensive across all active specialist skills.

**dispatching-parallel-agents: Integration verification strengthened**

Step 6 "Run integration verification" now specifies: execute the full project test suite plus any cross-domain checks, and do not mark the wave complete until integration passes. Removes ambiguity about what "integration verification" means in practice.

---

## v4.3.1 (2026-02-21)

### Added

**Cursor support**

Superpowers now works with Cursor's plugin system. Includes a `.cursor-plugin/plugin.json` manifest and Cursor-specific installation instructions in the README. The SessionStart hook output now includes an `additional_context` field alongside the existing `hookSpecificOutput.additionalContext` for Cursor hook compatibility.

### Fixed

**Windows: Restored polyglot wrapper for reliable hook execution (#518, #504, #491, #487, #466, #440)**

Claude Code's `.sh` auto-detection on Windows was prepending `bash` to the hook command, breaking execution. The fix:

- Renamed `session-start.sh` to `session-start` (extensionless) so auto-detection doesn't interfere
- Restored `run-hook.cmd` polyglot wrapper with multi-location bash discovery (standard Git for Windows paths, then PATH fallback)
- Exits silently if no bash is found rather than erroring
- On Unix, the wrapper runs the script directly via `exec bash`
- Uses POSIX-safe `dirname "$0"` path resolution (works on dash/sh, not just bash)

This fixes SessionStart failures on Windows with spaces in paths, missing WSL, `set -euo pipefail` fragility on MSYS, and backslash mangling.

## v4.3.0 (2026-02-12)

This fix should dramatically improve superpowers skills compliance and should reduce the chances of Claude entering its native plan mode unintentionally.

### Changed

**Brainstorming skill now enforces its workflow instead of describing it**

Models were skipping the design phase and jumping straight to implementation skills like frontend-design, or collapsing the entire brainstorming process into a single text block. The skill now uses hard gates, a mandatory checklist, and a graphviz process flow to enforce compliance:

- `<HARD-GATE>`: no implementation skills, code, or scaffolding until design is presented and user approves
- Explicit checklist (6 items) that must be created as tasks and completed in order
- Graphviz process flow with `writing-plans` as the only valid terminal state
- Anti-pattern callout for "this is too simple to need a design" — the exact rationalization models use to skip the process
- Design section sizing based on section complexity, not project complexity

**Using-superpowers workflow graph intercepts EnterPlanMode**

Added an `EnterPlanMode` intercept to the skill flow graph. When the model is about to enter Claude's native plan mode, it checks whether brainstorming has happened and routes through the brainstorming skill instead. Plan mode is never entered.

### Fixed

**SessionStart hook now runs synchronously**

Changed `async: true` to `async: false` in hooks.json. When async, the hook could fail to complete before the model's first turn, meaning using-superpowers instructions weren't in context for the first message.

## v4.2.0 (2026-02-05)

### Breaking Changes

**Codex: Replaced bootstrap CLI with native skill discovery**

The `superpowers-codex` bootstrap CLI, Windows `.cmd` wrapper, and related bootstrap content file have been removed. Codex now uses native skill discovery via `~/.agents/skills/superpowers/` symlink, so the old `use_skill`/`find_skills` CLI tools are no longer needed.

Installation is now just clone + symlink (documented in INSTALL.md). No Node.js dependency required. The old `~/.codex/skills/` path is deprecated.

### Fixes

**Windows: Fixed Claude Code 2.1.x hook execution (#331)**

Claude Code 2.1.x changed how hooks execute on Windows: it now auto-detects `.sh` files in commands and prepends `bash`. This broke the polyglot wrapper pattern because `bash "run-hook.cmd" session-start.sh` tries to execute the `.cmd` file as a bash script.

Fix: hooks.json now calls session-start.sh directly. Claude Code 2.1.x handles the bash invocation automatically. Also added .gitattributes to enforce LF line endings for shell scripts (fixes CRLF issues on Windows checkout).

**Windows: SessionStart hook runs async to prevent terminal freeze (#404, #413, #414, #419)**

The synchronous SessionStart hook blocked the TUI from entering raw mode on Windows, freezing all keyboard input. Running the hook async prevents the freeze while still injecting superpowers context.

**Windows: Fixed O(n^2) `escape_for_json` performance**

The character-by-character loop using `${input:$i:1}` was O(n^2) in bash due to substring copy overhead. On Windows Git Bash this took 60+ seconds. Replaced with bash parameter substitution (`${s//old/new}`) which runs each pattern as a single C-level pass — 7x faster on macOS, dramatically faster on Windows.

**Codex: Fixed Windows/PowerShell invocation (#285, #243)**

- Windows doesn't respect shebangs, so directly invoking the extensionless `superpowers-codex` script triggered an "Open with" dialog. All invocations now prefixed with `node`.
- Fixed `~/` path expansion on Windows — PowerShell doesn't expand `~` when passed as an argument to `node`. Changed to `$HOME` which expands correctly in both bash and PowerShell.

**Codex: Fixed path resolution in installer**

Used `fileURLToPath()` instead of manual URL pathname parsing to correctly handle paths with spaces and special characters on all platforms.

**Codex: Fixed stale skills path in writing-skills**

Updated `~/.codex/skills/` reference (deprecated) to `~/.agents/skills/` for native discovery.

### Improvements

**Worktree isolation now required before implementation**

Added `using-git-worktrees` as a required skill for both `subagent-driven-development` and `executing-plans`. Implementation workflows now explicitly require setting up an isolated worktree before starting work, preventing accidental work directly on main.

**Main branch protection softened to require explicit consent**

Instead of prohibiting main branch work entirely, the skills now allow it with explicit user consent. More flexible while still ensuring users are aware of the implications.

**Simplified installation verification**

Removed `/help` command check and specific slash command list from verification steps. Skills are primarily invoked by describing what you want to do, not by running specific commands.

**Codex: Clarified subagent tool mapping in bootstrap**

Improved documentation of how Codex tools map to Claude Code equivalents for subagent workflows.

### Tests

- Added worktree requirement test for subagent-driven-development
- Added main branch red flag warning test
- Fixed case sensitivity in skill recognition test assertions

---

## v4.1.1 (2026-01-23)

### Fixes

**OpenCode: Standardized on `plugins/` directory per official docs (#343)**

OpenCode's official documentation uses `~/.config/opencode/plugins/` (plural). Our docs previously used `plugin/` (singular). While OpenCode accepts both forms, we've standardized on the official convention to avoid confusion.

Changes:
- Renamed `.opencode/plugin/` to `.opencode/plugins/` in repo structure
- Updated all installation docs (INSTALL.md, README.opencode.md) across all platforms
- Updated test scripts to match

**OpenCode: Fixed symlink instructions (#339, #342)**

- Added explicit `rm` before `ln -s` (fixes "file already exists" errors on reinstall)
- Added missing skills symlink step that was absent from INSTALL.md
- Updated from deprecated `use_skill`/`find_skills` to native `skill` tool references

---

## v4.1.0 (2026-01-23)

### Breaking Changes

**OpenCode: Switched to native skills system**

Superpowers for OpenCode now uses OpenCode's native `skill` tool instead of custom `use_skill`/`find_skills` tools. This is a cleaner integration that works with OpenCode's built-in skill discovery.

**Migration required:** Skills must be symlinked to `~/.config/opencode/skills/superpowers/` (see updated installation docs).

### Fixes

**OpenCode: Fixed agent reset on session start (#226)**

The previous bootstrap injection method using `session.prompt({ noReply: true })` caused OpenCode to reset the selected agent to "build" on first message. Now uses `experimental.chat.system.transform` hook which modifies the system prompt directly without side effects.

**OpenCode: Fixed Windows installation (#232)**

- Removed dependency on `skills-core.js` (eliminates broken relative imports when file is copied instead of symlinked)
- Added comprehensive Windows installation docs for cmd.exe, PowerShell, and Git Bash
- Documented proper symlink vs junction usage for each platform

**Claude Code: Fixed Windows hook execution for Claude Code 2.1.x**

Claude Code 2.1.x changed how hooks execute on Windows: it now auto-detects `.sh` files in commands and prepends `bash `. This broke the polyglot wrapper pattern because `bash "run-hook.cmd" session-start.sh` tries to execute the .cmd file as a bash script.

Fix: hooks.json now calls session-start.sh directly. Claude Code 2.1.x handles the bash invocation automatically. Also added .gitattributes to enforce LF line endings for shell scripts (fixes CRLF issues on Windows checkout).

---

## v4.0.3 (2025-12-26)

### Improvements

**Strengthened using-superpowers skill for explicit skill requests**

Addressed a failure mode where Claude would skip invoking a skill even when the user explicitly requested it by name (e.g., "subagent-driven-development, please"). Claude would think "I know what that means" and start working directly instead of loading the skill.

Changes:
- Updated "The Rule" to say "Invoke relevant or requested skills" instead of "Check for skills" - emphasizing active invocation over passive checking
- Added "BEFORE any response or action" - the original wording only mentioned "response" but Claude would sometimes take action without responding first
- Added reassurance that invoking a wrong skill is okay - reduces hesitation
- Added new red flag: "I know what that means" → Knowing the concept ≠ using the skill

**Added explicit skill request tests**

New test suite in `tests/explicit-skill-requests/` that verifies Claude correctly invokes skills when users request them by name. Includes single-turn and multi-turn test scenarios.

## v4.0.2 (2025-12-23)

### Fixes

**Slash commands now user-only**

Added `disable-model-invocation: true` to all three slash commands (`/brainstorm`, `/execute-plan`, `/write-plan`). Claude can no longer invoke these commands via the Skill tool—they're restricted to manual user invocation only.

The underlying skills (`superpowers:brainstorming`, `superpowers:executing-plans`, `superpowers:writing-plans`) remain available for Claude to invoke autonomously. This change prevents confusion when Claude would invoke a command that just redirects to a skill anyway.

## v4.0.1 (2025-12-23)

### Fixes

**Clarified how to access skills in Claude Code**

Fixed a confusing pattern where Claude would invoke a skill via the Skill tool, then try to Read the skill file separately. The `using-superpowers` skill now explicitly states that the Skill tool loads skill content directly—no need to read files.

- Added "How to Access Skills" section to `using-superpowers`
- Changed "read the skill" → "invoke the skill" in instructions
- Updated slash commands to use fully qualified skill names (e.g., `superpowers:brainstorming`)

**Added GitHub thread reply guidance to receiving-code-review** (h/t @ralphbean)

Added a note about replying to inline review comments in the original thread rather than as top-level PR comments.

**Added automation-over-documentation guidance to writing-skills** (h/t @EthanJStark)

Added guidance that mechanical constraints should be automated, not documented—save skills for judgment calls.

## v4.0.0 (2025-12-17)

### New Features

**Two-stage code review in subagent-driven-development**

Subagent workflows now use two separate review stages after each task:

1. **Spec compliance review** - Skeptical reviewer verifies implementation matches spec exactly. Catches missing requirements AND over-building. Won't trust implementer's report—reads actual code.

2. **Code quality review** - Only runs after spec compliance passes. Reviews for clean code, test coverage, maintainability.

This catches the common failure mode where code is well-written but doesn't match what was requested. Reviews are loops, not one-shot: if reviewer finds issues, implementer fixes them, then reviewer checks again.

Other subagent workflow improvements:
- Controller provides full task text to workers (not file references)
- Workers can ask clarifying questions before AND during work
- Self-review checklist before reporting completion
- Plan read once at start, extracted to TodoWrite

New prompt templates in `skills/subagent-driven-development/`:
- `implementer-prompt.md` - Includes self-review checklist, encourages questions
- `spec-reviewer-prompt.md` - Skeptical verification against requirements
- `code-quality-reviewer-prompt.md` - Standard code review

**Debugging techniques consolidated with tools**

`systematic-debugging` now bundles supporting techniques and tools:
- `root-cause-tracing.md` - Trace bugs backward through call stack
- `defense-in-depth.md` - Add validation at multiple layers
- `condition-based-waiting.md` - Replace arbitrary timeouts with condition polling
- `find-polluter.sh` - Bisection script to find which test creates pollution
- `condition-based-waiting-example.ts` - Complete implementation from real debugging session

**Testing anti-patterns reference**

`test-driven-development` now includes `testing-anti-patterns.md` covering:
- Testing mock behavior instead of real behavior
- Adding test-only methods to production classes
- Mocking without understanding dependencies
- Incomplete mocks that hide structural assumptions

**Skill test infrastructure**

Three new test frameworks for validating skill behavior:

`tests/skill-triggering/` - Validates skills trigger from naive prompts without explicit naming. Tests 6 skills to ensure descriptions alone are sufficient.

`tests/claude-code/` - Integration tests using `claude -p` for headless testing. Verifies skill usage via session transcript (JSONL) analysis. Includes `analyze-token-usage.py` for cost tracking.

`tests/subagent-driven-dev/` - End-to-end workflow validation with two complete test projects:
- `go-fractals/` - CLI tool with Sierpinski/Mandelbrot (10 tasks)
- `svelte-todo/` - CRUD app with localStorage and Playwright (12 tasks)

### Major Changes

**DOT flowcharts as executable specifications**

Rewrote key skills using DOT/GraphViz flowcharts as the authoritative process definition. Prose becomes supporting content.

**The Description Trap** (documented in `writing-skills`): Discovered that skill descriptions override flowchart content when descriptions contain workflow summaries. Claude follows the short description instead of reading the detailed flowchart. Fix: descriptions must be trigger-only ("Use when X") with no process details.

**Skill priority in using-superpowers**

When multiple skills apply, process skills (brainstorming, debugging) now explicitly come before implementation skills. "Build X" triggers brainstorming first, then domain skills.

**brainstorming trigger strengthened**

Description changed to imperative: "You MUST use this before any creative work—creating features, building components, adding functionality, or modifying behavior."

### Breaking Changes

**Skill consolidation** - Six standalone skills merged:
- `root-cause-tracing`, `defense-in-depth`, `condition-based-waiting` → bundled in `systematic-debugging/`
- `testing-skills-with-subagents` → bundled in `writing-skills/`
- `testing-anti-patterns` → bundled in `test-driven-development/`
- `sharing-skills` removed (obsolete)

### Other Improvements

- **render-graphs.js** - Tool to extract DOT diagrams from skills and render to SVG
- **Rationalizations table** in using-superpowers - Scannable format including new entries: "I need more context first", "Let me explore first", "This feels productive"
- **docs/testing.md** - Guide to testing skills with Claude Code integration tests

---

## v3.6.2 (2025-12-03)

### Fixed

- **Linux Compatibility**: Fixed polyglot hook wrapper (`run-hook.cmd`) to use POSIX-compliant syntax
  - Replaced bash-specific `${BASH_SOURCE[0]:-$0}` with standard `$0` on line 16
  - Resolves "Bad substitution" error on Ubuntu/Debian systems where `/bin/sh` is dash
  - Fixes #141

---

## v3.5.1 (2025-11-24)

### Changed

- **OpenCode Bootstrap Refactor**: Switched from `chat.message` hook to `session.created` event for bootstrap injection
  - Bootstrap now injects at session creation via `session.prompt()` with `noReply: true`
  - Explicitly tells the model that using-superpowers is already loaded to prevent redundant skill loading
  - Consolidated bootstrap content generation into shared `getBootstrapContent()` helper
  - Cleaner single-implementation approach (removed fallback pattern)

---

## v3.5.0 (2025-11-23)

### Added

- **OpenCode Support**: Native JavaScript plugin for OpenCode.ai
  - Custom tools: `use_skill` and `find_skills`
  - Message insertion pattern for skill persistence across context compaction
  - Automatic context injection via chat.message hook
  - Auto re-injection on session.compacted events
  - Three-tier skill priority: project > personal > superpowers
  - Project-local skills support (`.opencode/skills/`)
  - Shared core module (`lib/skills-core.js`) for code reuse with Codex
  - Automated test suite with proper isolation (`tests/opencode/`)
  - Platform-specific documentation (`docs/README.opencode.md`, `docs/README.codex.md`)

### Changed

- **Refactored Codex Implementation**: Now uses shared `lib/skills-core.js` ES module
  - Eliminates code duplication between Codex and OpenCode
  - Single source of truth for skill discovery and parsing
  - Codex successfully loads ES modules via Node.js interop

- **Improved Documentation**: Rewrote README to explain problem/solution clearly
  - Removed duplicate sections and conflicting information
  - Added complete workflow description (brainstorm → plan → execute → finish)
  - Simplified platform installation instructions
  - Emphasized skill-checking protocol over automatic activation claims

---

## v3.4.1 (2025-10-31)

### Improvements

- Optimized superpowers bootstrap to eliminate redundant skill execution. The `using-superpowers` skill content is now provided directly in session context, with clear guidance to use the Skill tool only for other skills. This reduces overhead and prevents the confusing loop where agents would execute `using-superpowers` manually despite already having the content from session start.

## v3.4.0 (2025-10-30)

### Improvements

- Simplified `brainstorming` skill to return to original conversational vision. Removed heavyweight 6-phase process with formal checklists in favor of natural dialogue: ask questions one at a time, then present design in 200-300 word sections with validation. Keeps documentation and implementation handoff features.

## v3.3.1 (2025-10-28)

### Improvements

- Updated `brainstorming` skill to require autonomous recon before questioning, encourage recommendation-driven decisions, and prevent agents from delegating prioritization back to humans.
- Applied writing clarity improvements to `brainstorming` skill following Strunk's "Elements of Style" principles (omitted needless words, converted negative to positive form, improved parallel construction).

### Bug Fixes

- Clarified `writing-skills` guidance so it points to the correct agent-specific personal skill directories (`~/.claude/skills` for Claude Code, `~/.codex/skills` for Codex).

## v3.3.0 (2025-10-28)

### New Features

**Experimental Codex Support**
- Added unified `superpowers-codex` script with bootstrap/use-skill/find-skills commands
- Cross-platform Node.js implementation (works on Windows, macOS, Linux)
- Namespaced skills: `superpowers:skill-name` for superpowers skills, `skill-name` for personal
- Personal skills override superpowers skills when names match
- Clean skill display: shows name/description without raw frontmatter
- Helpful context: shows supporting files directory for each skill
- Tool mapping for Codex: TodoWrite→update_plan, subagents→manual fallback, etc.
- Bootstrap integration with minimal AGENTS.md for automatic startup
- Complete installation guide and bootstrap instructions specific to Codex

**Key differences from Claude Code integration:**
- Single unified script instead of separate tools
- Tool substitution system for Codex-specific equivalents
- Simplified subagent handling (manual work instead of delegation)
- Updated terminology: "Superpowers skills" instead of "Core skills"

### Files Added
- `.codex/INSTALL.md` - Installation guide for Codex users
- `.codex/superpowers-bootstrap.md` - Bootstrap instructions with Codex adaptations
- `.codex/superpowers-codex` - Unified Node.js executable with all functionality

**Note:** Codex support is experimental. The integration provides core superpowers functionality but may require refinement based on user feedback.

## v3.2.3 (2025-10-23)

### Improvements

**Updated using-superpowers skill to use Skill tool instead of Read tool**
- Changed skill invocation instructions from Read tool to Skill tool
- Updated description: "using Read tool" → "using Skill tool"
- Updated step 3: "Use the Read tool" → "Use the Skill tool to read and run"
- Updated rationalization list: "Read the current version" → "Run the current version"

The Skill tool is the proper mechanism for invoking skills in Claude Code. This update corrects the bootstrap instructions to guide agents toward the correct tool.

### Files Changed
- Updated: `skills/using-superpowers/SKILL.md` - Changed tool references from Read to Skill

## v3.2.2 (2025-10-21)

### Improvements

**Strengthened using-superpowers skill against agent rationalization**
- Added EXTREMELY-IMPORTANT block with absolute language about mandatory skill checking
  - "If even 1% chance a skill applies, you MUST read it"
  - "You do not have a choice. You cannot rationalize your way out."
- Added MANDATORY FIRST RESPONSE PROTOCOL checklist
  - 5-step process agents must complete before any response
  - Explicit "responding without this = failure" consequence
- Added Common Rationalizations section with 8 specific evasion patterns
  - "This is just a simple question" → WRONG
  - "I can check files quickly" → WRONG
  - "Let me gather information first" → WRONG
  - Plus 5 more common patterns observed in agent behavior

These changes address observed agent behavior where they rationalize around skill usage despite clear instructions. The forceful language and pre-emptive counter-arguments aim to make non-compliance harder.

### Files Changed
- Updated: `skills/using-superpowers/SKILL.md` - Added three layers of enforcement to prevent skill-skipping rationalization

## v3.2.1 (2025-10-20)

### New Features

**Code reviewer agent now included in plugin**
- Added `superpowers:code-reviewer` agent to plugin's `agents/` directory
- Agent provides systematic code review against plans and coding standards
- Previously required users to have personal agent configuration
- All skill references updated to use namespaced `superpowers:code-reviewer`
- Fixes #55

### Files Changed
- New: `agents/code-reviewer.md` - Agent definition with review checklist and output format
- Updated: `skills/requesting-code-review/SKILL.md` - References to `superpowers:code-reviewer`
- Updated: `skills/subagent-driven-development/SKILL.md` - References to `superpowers:code-reviewer`

## v3.2.0 (2025-10-18)

### New Features

**Design documentation in brainstorming workflow**
- Added Phase 4: Design Documentation to brainstorming skill
- Design documents now written to `docs/plans/YYYY-MM-DD-<topic>-design.md` before implementation
- Restores functionality from original brainstorming command that was lost during skill conversion
- Documents written before worktree setup and implementation planning
- Tested with subagent to verify compliance under time pressure

### Breaking Changes

**Skill reference namespace standardization**
- All internal skill references now use `superpowers:` namespace prefix
- Updated format: `superpowers:test-driven-development` (previously just `test-driven-development`)
- Affects all REQUIRED SUB-SKILL, RECOMMENDED SUB-SKILL, and REQUIRED BACKGROUND references
- Aligns with how skills are invoked using the Skill tool
- Files updated: brainstorming, executing-plans, subagent-driven-development, systematic-debugging, testing-skills-with-subagents, writing-plans, writing-skills

### Improvements

**Design vs implementation plan naming**
- Design documents use `-design.md` suffix to prevent filename collisions
- Implementation plans continue using existing `YYYY-MM-DD-<feature-name>.md` format
- Both stored in `docs/plans/` directory with clear naming distinction

## v3.1.1 (2025-10-17)

### Bug Fixes

- **Fixed command syntax in README** (#44) - Updated all command references to use correct namespaced syntax (`/superpowers:brainstorm` instead of `/brainstorm`). Plugin-provided commands are automatically namespaced by Claude Code to avoid conflicts between plugins.

## v3.1.0 (2025-10-17)

### Breaking Changes

**Skill names standardized to lowercase**
- All skill frontmatter `name:` fields now use lowercase kebab-case matching directory names
- Examples: `brainstorming`, `test-driven-development`, `using-git-worktrees`
- All skill announcements and cross-references updated to lowercase format
- This ensures consistent naming across directory names, frontmatter, and documentation

### New Features

**Enhanced brainstorming skill**
- Added Quick Reference table showing phases, activities, and tool usage
- Added copyable workflow checklist for tracking progress
- Added decision flowchart for when to revisit earlier phases
- Added comprehensive AskUserQuestion tool guidance with concrete examples
- Added "Question Patterns" section explaining when to use structured vs open-ended questions
- Restructured Key Principles as scannable table

**Anthropic best practices integration**
- Added `skills/writing-skills/anthropic-best-practices.md` - Official Anthropic skill authoring guide
- Referenced in writing-skills SKILL.md for comprehensive guidance
- Provides patterns for progressive disclosure, workflows, and evaluation

### Improvements

**Skill cross-reference clarity**
- All skill references now use explicit requirement markers:
  - `**REQUIRED BACKGROUND:**` - Prerequisites you must understand
  - `**REQUIRED SUB-SKILL:**` - Skills that must be used in workflow
  - `**Complementary skills:**` - Optional but helpful related skills
- Removed old path format (`skills/collaboration/X` → just `X`)
- Updated Integration sections with categorized relationships (Required vs Complementary)
- Updated cross-reference documentation with best practices

**Alignment with Anthropic best practices**
- Fixed description grammar and voice (fully third-person)
- Added Quick Reference tables for scanning
- Added workflow checklists Claude can copy and track
- Appropriate use of flowcharts for non-obvious decision points
- Improved scannable table formats
- All skills well under 500-line recommendation

### Bug Fixes

- **Re-added missing command redirects** - Restored `commands/brainstorm.md` and `commands/write-plan.md` that were accidentally removed in v3.0 migration
- Fixed `defense-in-depth` name mismatch (was `Defense-in-Depth-Validation`)
- Fixed `receiving-code-review` name mismatch (was `Code-Review-Reception`)
- Fixed `commands/brainstorm.md` reference to correct skill name
- Removed references to non-existent related skills

### Documentation

**writing-skills improvements**
- Updated cross-referencing guidance with explicit requirement markers
- Added reference to Anthropic's official best practices
- Improved examples showing proper skill reference format

## v3.0.1 (2025-10-16)

### Changes

We now use Anthropic's first-party skills system!

## v2.0.2 (2025-10-12)

### Bug Fixes

- **Fixed false warning when local skills repo is ahead of upstream** - The initialization script was incorrectly warning "New skills available from upstream" when the local repository had commits ahead of upstream. The logic now correctly distinguishes between three git states: local behind (should update), local ahead (no warning), and diverged (should warn).

## v2.0.1 (2025-10-12)

### Bug Fixes

- **Fixed session-start hook execution in plugin context** (#8, PR #9) - The hook was failing silently with "Plugin hook error" preventing skills context from loading. Fixed by:
  - Using `${BASH_SOURCE[0]:-$0}` fallback when BASH_SOURCE is unbound in Claude Code's execution context
  - Adding `|| true` to handle empty grep results gracefully when filtering status flags

---

# Superpowers v2.0.0 Release Notes

## Overview

Superpowers v2.0 makes skills more accessible, maintainable, and community-driven through a major architectural shift.

The headline change is **skills repository separation**: all skills, scripts, and documentation have moved from the plugin into a dedicated repository ([obra/superpowers-skills](https://github.com/obra/superpowers-skills)). This transforms superpowers from a monolithic plugin into a lightweight shim that manages a local clone of the skills repository. Skills auto-update on session start. Users fork and contribute improvements via standard git workflows. The skills library versions independently from the plugin.

Beyond infrastructure, this release adds nine new skills focused on problem-solving, research, and architecture. We rewrote the core **using-skills** documentation with imperative tone and clearer structure, making it easier for Claude to understand when and how to use skills. **find-skills** now outputs paths you can paste directly into the Read tool, eliminating friction in the skills discovery workflow.

Users experience seamless operation: the plugin handles cloning, forking, and updating automatically. Contributors find the new architecture makes improving and sharing skills trivial. This release lays the foundation for skills to evolve rapidly as a community resource.

## Breaking Changes

### Skills Repository Separation

**The biggest change:** Skills no longer live in the plugin. They've been moved to a separate repository at [obra/superpowers-skills](https://github.com/obra/superpowers-skills).

**What this means for you:**

- **First install:** Plugin automatically clones skills to `~/.config/superpowers/skills/`
- **Forking:** During setup, you'll be offered the option to fork the skills repo (if `gh` is installed)
- **Updates:** Skills auto-update on session start (fast-forward when possible)
- **Contributing:** Work on branches, commit locally, submit PRs to upstream
- **No more shadowing:** Old two-tier system (personal/core) replaced with single-repo branch workflow

**Migration:**

If you have an existing installation:
1. Your old `~/.config/superpowers/.git` will be backed up to `~/.config/superpowers/.git.bak`
2. Old skills will be backed up to `~/.config/superpowers/skills.bak`
3. Fresh clone of obra/superpowers-skills will be created at `~/.config/superpowers/skills/`

### Removed Features

- **Personal superpowers overlay system** - Replaced with git branch workflow
- **setup-personal-superpowers hook** - Replaced by initialize-skills.sh

## New Features

### Skills Repository Infrastructure

**Automatic Clone & Setup** (`lib/initialize-skills.sh`)
- Clones obra/superpowers-skills on first run
- Offers fork creation if GitHub CLI is installed
- Sets up upstream/origin remotes correctly
- Handles migration from old installation

**Auto-Update**
- Fetches from tracking remote on every session start
- Auto-merges with fast-forward when possible
- Notifies when manual sync needed (branch diverged)
- Uses pulling-updates-from-skills-repository skill for manual sync

### New Skills

**Problem-Solving Skills** (`skills/problem-solving/`)
- **collision-zone-thinking** - Force unrelated concepts together for emergent insights
- **inversion-exercise** - Flip assumptions to reveal hidden constraints
- **meta-pattern-recognition** - Spot universal principles across domains
- **scale-game** - Test at extremes to expose fundamental truths
- **simplification-cascades** - Find insights that eliminate multiple components
- **when-stuck** - Dispatch to right problem-solving technique

**Research Skills** (`skills/research/`)
- **tracing-knowledge-lineages** - Understand how ideas evolved over time

**Architecture Skills** (`skills/architecture/`)
- **preserving-productive-tensions** - Keep multiple valid approaches instead of forcing premature resolution

### Skills Improvements

**using-skills (formerly getting-started)**
- Renamed from getting-started to using-skills
- Complete rewrite with imperative tone (v4.0.0)
- Front-loaded critical rules
- Added "Why" explanations for all workflows
- Always includes /SKILL.md suffix in references
- Clearer distinction between rigid rules and flexible patterns

**writing-skills**
- Cross-referencing guidance moved from using-skills
- Added token efficiency section (word count targets)
- Improved CSO (Claude Search Optimization) guidance

**sharing-skills**
- Updated for new branch-and-PR workflow (v2.0.0)
- Removed personal/core split references

**pulling-updates-from-skills-repository** (new)
- Complete workflow for syncing with upstream
- Replaces old "updating-skills" skill

### Tools Improvements

**find-skills**
- Now outputs full paths with /SKILL.md suffix
- Makes paths directly usable with Read tool
- Updated help text

**skill-run**
- Moved from scripts/ to skills/using-skills/
- Improved documentation

### Plugin Infrastructure

**Session Start Hook**
- Now loads from skills repository location
- Shows full skills list at session start
- Prints skills location info
- Shows update status (updated successfully / behind upstream)
- Moved "skills behind" warning to end of output

**Environment Variables**
- `SUPERPOWERS_SKILLS_ROOT` set to `~/.config/superpowers/skills`
- Used consistently throughout all paths

## Bug Fixes

- Fixed duplicate upstream remote addition when forking
- Fixed find-skills double "skills/" prefix in output
- Removed obsolete setup-personal-superpowers call from session-start
- Fixed path references throughout hooks and commands

## Documentation

### README
- Updated for new skills repository architecture
- Prominent link to superpowers-skills repo
- Updated auto-update description
- Fixed skill names and references
- Updated Meta skills list

### Testing Documentation
- Added comprehensive testing checklist (`docs/TESTING-CHECKLIST.md`)
- Created local marketplace config for testing
- Documented manual testing scenarios

## Technical Details

### File Changes

**Added:**
- `lib/initialize-skills.sh` - Skills repo initialization and auto-update
- `docs/TESTING-CHECKLIST.md` - Manual testing scenarios
- `.claude-plugin/marketplace.json` - Local testing config

**Removed:**
- `skills/` directory (82 files) - Now in obra/superpowers-skills
- `scripts/` directory - Now in obra/superpowers-skills/skills/using-skills/
- `hooks/setup-personal-superpowers.sh` - Obsolete

**Modified:**
- `hooks/session-start.sh` - Use skills from ~/.config/superpowers/skills
- `commands/brainstorm.md` - Updated paths to SUPERPOWERS_SKILLS_ROOT
- `commands/write-plan.md` - Updated paths to SUPERPOWERS_SKILLS_ROOT
- `commands/execute-plan.md` - Updated paths to SUPERPOWERS_SKILLS_ROOT
- `README.md` - Complete rewrite for new architecture

### Commit History

This release includes:
- 20+ commits for skills repository separation
- PR #1: Amplifier-inspired problem-solving and research skills
- PR #2: Personal superpowers overlay system (later replaced)
- Multiple skill refinements and documentation improvements

## Upgrade Instructions

### Fresh Install

```bash
# In Claude Code
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace
```

The plugin handles everything automatically.

### Upgrading from v1.x

1. **Backup your personal skills** (if you have any):
   ```bash
   cp -r ~/.config/superpowers/skills ~/superpowers-skills-backup
   ```

2. **Update the plugin:**
   ```bash
   /plugin update superpowers
   ```

3. **On next session start:**
   - Old installation will be backed up automatically
   - Fresh skills repo will be cloned
   - If you have GitHub CLI, you'll be offered the option to fork

4. **Migrate personal skills** (if you had any):
   - Create a branch in your local skills repo
   - Copy your personal skills from backup
   - Commit and push to your fork
   - Consider contributing back via PR

## What's Next

### For Users

- Explore the new problem-solving skills
- Try the branch-based workflow for skill improvements
- Contribute skills back to the community

### For Contributors

- Skills repository is now at https://github.com/obra/superpowers-skills
- Fork → Branch → PR workflow
- See skills/meta/writing-skills/SKILL.md for TDD approach to documentation

## Known Issues

None at this time.

## Credits

- Problem-solving skills inspired by Amplifier patterns
- Community contributions and feedback
- Extensive testing and iteration on skill effectiveness

---

**Full Changelog:** https://github.com/obra/superpowers/compare/dd013f6...main
**Skills Repository:** https://github.com/obra/superpowers-skills
**Issues:** https://github.com/obra/superpowers/issues
