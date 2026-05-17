# Superpowers Optimized Release Notes

## v6.6.1 (2026-05-08)

Context pressure gate, Tailwind v4 reference, plan-level security flag, stub scan, and cleaner docs paths.

### New Features

**Context pressure gate** — The skill-activator hook (and its Codex adapter) now reads the live session JSONL to estimate context window usage, and hard-blocks plan-execution prompts when the last assistant turn exceeded 60% of the 200K window. When triggered, the hook replaces all skill hints with a compact-first instruction telling the model to save state.md via context-management, run /compact, and resume from state.md. This prevents Auto Compact from firing mid-implementation and destroying file paths, variable names, and discovered facts at the worst possible moment. Pressure is computed from `input + cache_creation + cache_read` of the last assistant turn — that is the actual current context size, not a cumulative sum across turns.

**Tailwind v4 reference (`skills/frontend-design/tailwind-v4.md`)** — A dedicated companion file with v4 install commands, `@theme` config syntax, renamed class scales, and new features. Frontend-design's training data is biased toward v3, which leads to broken setups when scaffolding for current Tailwind. The skill now routes to this file before any Tailwind work on greenfield or version-unknown projects.

### Changes

**Writing-plans: security flag per task** — Every task in a plan now carries a `Security flag: none | security` line. Setting it to `security` (for tasks handling auth, credentials, input validation, permissions, crypto, or data-access boundaries) triggers a pre-implementation security review before the implementer is dispatched. Catches the class of bug where security-relevant work ships without anyone explicitly checking it.

**Writing-plans: scope-reduction scan** — Plan self-review now searches the plan for "v1", "basic", "simple", "for now", "placeholder", "initial version", and "minimal", and verifies each hit was explicitly sanctioned by the user. Catches quiet scope downgrades where the model promises less than what was asked for without flagging it.

**Writing-plans: execution auto-selection** — Replaces the open "Which approach?" question with deterministic logic: ≥60% context or ≥5 tasks → subagent-driven; heavy inter-task state sharing → inline; default → subagent. The "Ready to execute" framing and explicit "Stop here" instruction give the user a real redirect window instead of the model chaining straight into execution.

**Verification-before-completion: stub scan** — Implementation tasks now require a grep pass for `TODO`, `FIXME`, `placeholder`, and `NotImplementedError` (excluding test files) before any "done" claim. Any hit in a file the task created or modified blocks completion until the stub is removed or explicitly justified. Catches the common failure mode of declaring success while leaving stub code in production.

**Frontend-design: framework & version awareness** — Before scaffolding any CSS framework, the skill now requires inspecting `package.json` and CSS entry files to detect the existing version (or stating the chosen version explicitly on greenfield). Mixing v3 config syntax with v4 CSS directives produces broken builds; this gate prevents that class of error.

**Dependency-management trigger refinement** — Removed "version bump" from the dependency-management trigger keywords. It was overlapping with the dedicated `version-bump` skill, causing the wrong workflow to load on plain version-bump requests.

**Cleaner docs output paths** — Brainstorming specs and writing-plans plans now save to `docs/specs/` and `docs/plans/` instead of `docs/superpowers-prepared/specs/` and `docs/superpowers-prepared/plans/`. The plugin name no longer surfaces in the folder structure of every project that uses these skills. CLAUDE.md, both skill files, both reviewer prompt templates, the autoimprove fixture, and all integration tests were updated. The `stop-reminders` decision-log detection was unaffected — its regex already matched any `specs/` or `plans/` parent folder rather than the plugin-namespaced one, so existing repos with the old path continue triggering reminders correctly.

**Test coverage** — ~290 lines of new tests in `test-skill-activator.js` cover the context pressure gate: execution-trigger pattern matching, Windows/Unix `cwdToProjectDir` encoding, JSONL pressure parsing, threshold behavior, and the block message format.

## v6.6.0 (2026-04-15)

Full-stack audit: 3 new skills, smarter cross-session memory, scope gates across 6 skills, and expanded hook coverage.

### New Features

**Refactoring skill** — Enforces behavior-locking tests before any structural change and incremental verification after each move. Four phases: lock current behavior with characterization tests, define the refactoring boundary, make one structural change at a time with tests green after each, then audit for stale references. Includes guidance on writing characterization tests for side-effectful code and detecting test runners automatically.

**Performance Investigation skill** — Measure-first methodology for performance work. Requires a quantitative baseline before any optimization, profiling to identify the actual bottleneck (not the guessed one), a hypothesis with predicted improvement, and re-measurement after every change. Profiling tool recommendations are CLI-friendly so the AI can read output directly; GUI-only tools prompt the user to share results.

**Dependency Management skill** — Structured incremental updates with verification at each step. Covers the full lifecycle: audit outdated packages, assess impact from changelogs, update one dependency at a time with test/build/smoke verification, and handle security vulnerabilities as a special case. Includes lockfile merge conflict resolution, version pinning strategy, and monorepo coordination guidance.

**Weighted memory scoring** — The skill-activator hook now ranks session-log and known-issues matches using a weighted score (70% keyword density + 30% recency) instead of flat boolean matching. More relevant entries surface first.

**Per-project watermark** — The context-engine hook now creates a per-project watermark file (md5 hash of cwd) so multiple projects sharing the same machine don't overwrite each other's session-start state.

**Cross-session diff base** — When a valid watermark exists from a previous session, the context-engine uses it as the git diff base instead of HEAD~1. This means the "what changed" snapshot reflects changes since your last session, not just the last commit.

**Blast radius import filtering** — The context-engine's blast radius analysis now applies a secondary filter checking for actual import/require/from references, reducing false positives from files that happen to contain the same basename but don't actually depend on the changed file.

### Changes

**6 scope gates added to existing skills** — frontend-design checks for an existing design system before generating a new one; TDD bootstraps test infrastructure before writing the first test; finishing-branch pulls decisions from session-log into PR descriptions; using-superpowers has a soft gate for existing projects without memory files; deliberation has a loop guard preventing infinite deliberation-premise-check cycles; context-management clarifies state.md vs plan.md roles.

**Subagent guard expanded** — The action verb pattern now catches activate/trigger/execute/launch/spawn/start in addition to the original invoke/use/run/call verbs. Also detects Skill tool invocation patterns (`Skill("superpowers..."`, `skill: "brainstorming"`).

**Stop-reminders pattern coverage widened** — The isSignificantSession check now detects edits to specs/*.md, plans/*.md, and plugin.universal.yaml in addition to SKILL.md, hooks/*.js, and CLAUDE.md.

**Session-log hard cap raised** — The per-entry hard cap was raised from 1000 to 1500 characters (~375 tokens) to accommodate multi-subsystem sessions that legitimately need more space.

**Session-start awk parser fix** — The parser that extracts recent [saved] entries now correctly flushes the previous block when encountering consecutive [saved] entries. Previously, consecutive entries without non-[saved] content between them would silently drop the earlier entry.

### Fixes

**Systematic-debugging post-fix improvement** — After resolving a bug, the skill now suggests promoting permanent discoveries to project-map.md Critical Constraints, ensuring hard-won architectural knowledge persists beyond the session-log.

**3 new test suites** — Added dedicated test files for context-engine.js (16 tests), stop-reminders.js (14 tests), and subagent-guard.js (25 tests). Combined with the existing skill-activator tests (41), the plugin now has 96 unit tests covering all major hooks.

## v6.5.2 (2026-04-11)

Stop hook reliability, session isolation, and subagent plan tracking improvements.

### Fixes

**Stats-only sessions no longer trigger stop-hook blocking** — In v6.5.1, the stop hook would emit `decision: "block"` even when the only available reminder was the informational session-stats summary (e.g., "6 min, 1 skill invocation"). Users saw "Stop hook error: Session summary: ..." after every turn in light sessions. The hook now checks for actionable reminders before blocking; stats-only sessions return `{}` silently.

**Edit log is now session-aware — no cross-session contamination** — The shared `~/.claude/hooks-logs/edit-log.txt` used a 3-field format (`timestamp | tool | path`) with no session identifier. Test sessions running via `claude -p` saw edits from the interactive session, triggering false-positive TDD and decision-log reminders inside headless test runs. The log format is now 4-field (`timestamp | session_id | tool | path`) and `stop-reminders.js` filters entries by the current session id, so each session only sees its own edits.

**Plan checkboxes now enforced after subagent-driven development** — The subagent-driven-development skill previously marked tasks complete without updating the `- [ ]` checkboxes in `plan.md`. The task-complete instruction now explicitly requires changing `- [ ]` to `- [x]` in `plan.md` and syncing `state.md` if present, matching the intent of the plan-tracking system.

**State.md staleness detection added to stop hook** — The stop hook now detects when `state.md` exists and contains plan status that appears out of date relative to recent edits (modified source files with no corresponding state update). Users see a targeted reminder to update `state.md` rather than silently leaving it stale across sessions.

**Context-management resets the decision-log reminder marker** — After saving context, the skill now writes a timestamp to `~/.claude/hooks-logs/last-saved-entry.txt`. The stop hook uses this marker to suppress the "update your decision log" reminder immediately after a context-management save, preventing redundant reminders in the same turn.

## v6.5.1 (2026-04-10)

Patch release focused on Stop-hook correctness and reminder signal quality.

### Fixes

**Claude Code `Stop` hook output contract corrected** — `hooks/stop-reminders.js` previously emitted `hookSpecificOutput` with `hookEventName: "Stop"`, which Claude rejects on Stop events with JSON validation errors. The Stop reminder path now emits a schema-valid continuation payload (`decision: "block"` + `reason`) and keeps `{}` for no-op cases. A regression suite (`tests/codex/test-stop-reminders.js`) now enforces this output shape.

**Stop-hook TDD reminders now recognize `test-*.js` under `tests/`** — Both Stop reminder implementations now classify repository-style test filenames such as `tests/codex/test-stop-reminders.js` as tests, preventing false-positive “source changed without tests” reminders when test files use `test-*.js` naming instead of `*.test.js`.

## v6.5.0 (2026-04-09)

Codex parity hardening: the plugin now follows the current Codex hook contract more closely, adds reactive Bash smart-compress on Codex, and tightens install/update guidance so complete Codex installs are easier to get right.

### New Features

**Codex `PostToolUse(Bash)` smart-compress** — Codex sessions can now replace noisy Bash output after execution with a compressed summary using the same compression rules already used by the Claude-side Bash compressor. Large `find`/`ls` output and long passing test runs can be collapsed to concise summaries with explicit `[smart-compress]` and `[compressed: X->Y lines | type]` markers, reducing context waste without hiding failures.

### Changes

**Codex hook set expanded to five native hooks** — The Codex build now wires `SessionStart`, `UserPromptSubmit`, `PreToolUse(Bash)`, `PostToolUse(Bash)`, and `Stop` through dedicated Codex adapters. This keeps the Codex path aligned with the current official hook model while still acknowledging the remaining platform limits versus Claude Code.

**Codex install/update docs now define a complete install** — The Codex docs now treat skills, custom agents, and macOS/Linux lifecycle hooks as the standard install on supported platforms, include a clean reinstall fallback for stale or inconsistent local installs, and call out `codex-cli 0.118.0+` as the minimum tested version for live hook behavior.

**Compiler/reporting language is now precise about Codex parity** — Generated loss reports and the Codex-facing docs now say only what they actually prove: native compilation for hooks targeted to Codex, not full Claude parity. This removes misleading wording that could imply unsupported Claude-only hook surfaces also existed on Codex.

### Fixes

**Codex hook output/registry compatibility hardened** — The Codex-generated hook registry now uses the current top-level `hooks` shape, the plugin manifest no longer carries the stale Codex `hooks` field, and the Codex-specific adapters now emit the output shapes expected by the current Codex docs. This addresses the class of failures where Codex would silently ignore hooks or reject invalid hook output.

**Codex `Stop` and `PostToolUse(Bash)` are now validated live, not just by unit tests** — The Codex `Stop` adapter now uses the continuation-block path (`decision: "block"` + `reason`) that Codex actually surfaces at turn end, and the reactive Codex `PostToolUse(Bash)` smart-compress path has been proven live on `codex-cli 0.118.0` for compressible commands such as `find . -type f`. This closes the earlier uncertainty where the adapters looked correct locally but had not yet been confirmed against the real Codex runtime.

**Codex JSON transcript interpretation is now documented correctly** — In `codex exec --json`, the `command_execution.aggregated_output` field can still show the original raw Bash output even when the model was actually continued from the hook-provided compressed replacement. The Codex test checklist and troubleshooting guidance now treat the final model-visible response and captured hook output as the source of truth for `PostToolUse(Bash)` verification.

**Codex Bash safety checks close more real shell read paths** — The Codex Bash safety path now catches additional `.env` read patterns such as `sed` and `awk`, reducing the chance that a secret file read slips past Codex's Bash-only interception surface.

## v6.4.0 (2026-04-07)

Native Codex hooks, OpenCode safety parity, hookbridge migration, and memory system improvements.

### New Features

**Native Codex hook adapters** — Three new adapter scripts in `hooks/codex/` bring full lifecycle hook support to Codex (macOS/Linux with hooks enabled):
- `session-start-adapter.js` — injects project context (project-map, session-log, state, known-issues) at session start, matching the Claude Code session-start hook behavior
- `stop-adapter.js` — generates discipline reminders at turn end using git uncommitted changes instead of edit-log.txt (which Codex cannot write)
- `pretool-bash-adapter.js` — single dispatcher for PreToolUse(Bash): runs dangerous-command and secret-protection checks in one process (required because Codex fires multiple matching hooks concurrently)

The `codex-hooks.json` now registers all four Codex hook events: `SessionStart`, `UserPromptSubmit` (skill activator), `Stop`, and `PreToolUse(Bash)`.

**Codex agent configs** — `codex-agents/code-reviewer.toml` and `codex-agents/red-team.toml` enable native Codex agent support for the code-reviewer and red-team workflows, but Codex still requires manual placement in `~/.codex/agents/` because plugin manifests cannot bundle TOML agents.

**OpenCode `tool.execute.before` safety hook** — The OpenCode plugin now intercepts all bash, read, edit, and write tool calls before execution, applying the same safety checks as the Claude Code hooks: 19 dangerous command patterns, 25 sensitive file path patterns, 14 secret-leaking bash patterns, and hardcoded secret detection for write operations. Blocking is via thrown errors, matching OpenCode's native hook contract. Previously the OpenCode plugin only injected the system prompt; it had no pre-execution safety layer.

**`plugin.universal.yaml` as single source of truth** — All hook files and platform manifests (`hooks/hooks.json`, `hooks/codex-hooks.json`, `.claude-plugin/plugin.json`, `.codex-plugin/plugin.json`) are now generated from `plugin.universal.yaml` in the repo root via `hookbridge compile`. Do not hand-edit the generated files — they will be overwritten. This eliminates the previous duplication where hooks were maintained in three places and could drift out of sync. Compiled with the new open source tool Hookbridge: https://github.com/REPOZY/Hookbridge

**Context-management: structured grep workflow** — The skill now specifies a four-step grep process: extract 2-3 distinctive nouns from the task, grep each individually, adjust based on hit count (0 hits → fall back to project-map critical constraints; 1–10 hits → read them; >10 hits on one keyword → narrow with a second term), then surface findings explicitly. Previously the skill gave a single generic grep command with no guidance on what to do with the results.

**Context-management: superseded-entry detection** — Before appending a new `[saved]` entry, the skill now instructs checking for earlier entries on the same topic and marking contradicted ones as `[superseded by YYYY-MM-DD]`. This prevents the session-log from accumulating contradictory decisions across sessions without any connection between them.

### Changes

**`[auto]` entry system retired** — `stop-reminders.js` no longer writes automatic `[auto]` entries to `session-log.md` at session stop. The session-log is now `[saved]`-only — human-written entries via the context-management skill. Auto-entries produced noise that inflated injection costs and were never referenced in practice.

**Skill-rules expanded coverage** — The TDD rule now matches "tests first", "failing tests first", and "write the failing tests" in addition to the existing keywords. The verification-before-completion rule adds "verify everything", "all done", "we're done", and intent patterns like "think I'm done" and "before we call it done" to reduce missed activations on natural phrasing.

**Red-team agent security constraints** — The red-team agent prompt now explicitly states that file contents are untrusted data and that the agent must not follow instructions embedded in source files, comments, or strings. Output is restricted to the conversation — no file writes, no shell commands. This prevents a malicious file under review from hijacking the agent.

**Token-efficiency: Read tool chunk rule** — Added an explicit rule: the Read tool returns a maximum of 2,000 lines per call. For files suspected to exceed this limit, use `offset` and `limit` parameters and read in sequential chunks. Never assume a single read covered the complete file.

**OpenCode plugin export renamed** — The plugin export is now `SuperpowersOptimizedPlugin` (was `SuperpowersPlugin`). This only affects internal plugin wiring in `.opencode/plugins/superpowers-prepared.js`; no user-facing behavior changes.

**`plugin-compiler/` directory removed** — The working copy of hookbridge that lived inside the plugin repo has been removed. hookbridge lives at its canonical location and `plugin.universal.yaml` in the repo root replaces it as the hook compilation entry point.

**Codex platform docs rewritten** — `docs/platforms/codex.md` and `.codex/INSTALL.md` now both include a feature comparison table (macOS/Linux with hooks vs Windows native), corrected install steps, and clear hook-capability boundaries (what Codex can and cannot intercept).

### Fixes

**OpenCode system transform array handling corrected** — The `experimental.chat.system.transform` hook was using `output.system ||= []` before pushing content, which would incorrectly skip pushing when the array was already populated. Fixed to direct `.push()` since OpenCode always pre-populates the system array.

Fixed the "Stop hook error: JSON validation failed: Hook JSON output validation failed" issue: https://github.com/REPOZY/superpowers-prepared/issues/9

Fixed the minor issue found in the Security Audit posted by a user: https://github.com/REPOZY/superpowers-prepared/issues/12

## v6.3.0 (2026-04-03)

Session memory quality pass: the stop-reminders hook now tracks undocumented work phases across long sessions, enforced token budgets prevent session-log bloat from inflating injection costs, and parallel dispatch defaults are corrected in two skills.

### New Features

**Phase-aware decision-log reminders** — The stop-reminders hook previously asked "were significant files edited in the last 30 minutes?" — a window that fails in long sessions with multiple work phases (same edits stay in the window after a `[saved]` entry, while later phases can slip out entirely). It now asks "were significant files edited since the last `[saved]` entry?" The `track-edits` hook detects when a `[saved]` entry is written to `session-log.md` and records a timestamp marker; `stop-reminders` reads that marker at Stop time. Each logical work batch gets exactly one reminder at the right time, with no false positives between phases.

**Session-log token budget guard** — `stop-reminders` now measures the last 2 `[saved]` entries at every session Stop and warns when any entry exceeds the 250-token budget (~1,000 characters). These entries are injected into every future session; a bloated entry costs tokens forever. The warning identifies the specific over-budget entry and instructs what to trim.

**Strict `[saved]` entry template in context-management** — The context-management skill's `[saved]` entry template now has an explicit structure (Goal / Decisions / Rejected / Open only), a "Never include" list (test results, task checklists → `state.md`, how-it-works walkthroughs, speculative analysis → design docs, one-time confirmations), and a hard token budget. Without this enforcement, the AI defaulted to "more is safer" and wrote entries that were 5–10× over the optimal size.

**dispatching-parallel-agents skill hint added** — `skill-rules.json` now includes a rule for `dispatching-parallel-agents` — it was the only skill with no hint coverage, meaning prompts like "dispatch these tasks simultaneously" received no routing suggestion.

### Changes

**Parallel Waves is now the default in subagent-driven-development** — "Parallel Waves" was previously labeled "Optional Speed Mode". It is now the stated default for independent tasks; sequential execution is the explicit fallback for tasks with shared-file or state dependencies. The single-message dispatch requirement is now explicit in both `subagent-driven-development` and `dispatching-parallel-agents`, with a rationale: all subagents share the same cached system prompt prefix, and dispatching them in one message ensures every agent gets a cache hit on the heavy shared prefix.

**Anti-sycophancy rules added to global CLAUDE.md** — Four rules now govern position stability: don't revise a stated position under pushback without new evidence; proactively state the strongest objection to any non-trivial proposal; agreement must cite a specific reason, not just affirm; state confidence level explicitly when uncertain.

## v6.2.0 (2026-03-30)

Cross-session memory overhaul: the full memory stack is now injected automatically at session start, stop-reminders actually writes to session-log.md, and agents can no longer waste tokens as content relays.

### New Features

**Full memory stack injected at session start** — `session-log.md` (last 2 `[saved]` decisions), `state.md` (active task snapshot), `known-issues.md` (error map), and `context-snapshot.json` (changed files + recent commits) are now all injected into session context by the session-start hook — unconditionally, without requiring the AI to remember to read them. Previously only `project-map.md` was injected; the rest depended entirely on AI compliance with the entry sequence.

**Decision-log reminder in stop-reminders** — When the session modified SKILL.md files, hooks, or plugin config, the Stop hook now surfaces an explicit prompt to invoke `context-management` before ending the session. These are the sessions where the "why" matters most and is most likely to be lost.

### Changes

**Agent & External Content Rules added to token-efficiency** — Five new rules cover the behavioral characteristics of the Agent tool and WebFetch that the AI previously had to discover by failure: agent results are always compressed on return (never use agents as content relays), WebFetch returns AI summaries not raw text (use `curl -sf` for verbatim URL content), and local files should always be Read directly. These rules are always-on from session start.

**"When the User Names a Specific Skill" section added to using-superpowers** — Clarifies that phrases like "use brainstorming" or "use context management" are Skill tool invocations, not conceptual goals to achieve ad-hoc. This was the root cause of entry sequence bypass in analyzed session transcripts: the AI improvised with agents instead of calling the Skill tool.

**Mandatory first actions surfaced at injection point** — The session-start hook now prepends three concrete steps before the full using-superpowers body: activate token-efficiency, classify complexity, and invoke named skills via the Skill tool. Previously these were buried in the skill text where they competed with everything else for attention.

**Content-relay anti-pattern added to dispatching-parallel-agents** — "The task is content relay" is now an explicit entry in the "Do not use when" list, with a one-line explanation: agent results are compressed, raw content will be lost.

**using-superpowers step 4 extended** — Now requires a `[saved]` entry at the end of any session where significant decisions were made, not just sessions with ongoing incomplete work.

**`known-issues.md` added to auto-gitignore list** — `track-edits.js` now includes `known-issues.md` in the AI_ARTIFACTS list so it is automatically added to `.gitignore` on first write.

### Fixes

**stop-reminders.js never wrote to session-log.md** — The hook was documented as "auto-writes session-log.md `[auto]` entry" but only wrote to a private temp file at `~/.claude/hooks-logs/edit-log.txt`. The `[auto]` entries visible in prior session logs were written manually by the AI. Fixed: the hook now writes a proper `[auto]` entry to `session-log.md` in the project root on session stop, gated by the existing 2-minute guard to prevent duplicates.

**MANDATORY FIRST ACTIONS had invalid JSON** — The preamble added in the previous session contained literal unescaped double-quotes (`"use brainstorming"`) inside the bash string that produced the hook's JSON output. This caused `JSON.parse` failures on every session start for any platform that validated the JSON. Fixed by removing the quotes from the example text.

## v6.1.0 (2026-03-28)

Skill quality pass: two new automated review gates, richer subagent prompts, sharper stop conditions, and a fix to the project-map staleness loop.

### New Features

**Spec reviewer gate in brainstorming** — After a design is approved and saved, `brainstorming` now dispatches a spec-reviewer subagent using a calibrated prompt template (`spec-document-reviewer-prompt.md`) before handing off to `writing-plans`. The reviewer checks for placeholders, internal contradictions, ambiguous requirements, and scope creep. Critical issues block the handoff; minor issues become advisory recommendations. This catches design gaps before they propagate into the plan.

**Plan reviewer gate in writing-plans** — `writing-plans` now dispatches a plan-reviewer subagent using `plan-document-reviewer-prompt.md` after the plan is saved. The reviewer cross-checks the plan against the original spec — not just the plan in isolation — catching scope drift, vague steps, missing file paths, and incorrect TDD ordering. Both reviewer prompts include skill leakage prevention to keep subagents focused.

### Changes

`**dispatching-parallel-agents` strengthened** — Added a "Do not use when" block covering exploratory debugging, related failures, and shared-state scenarios. Added an assembled example prompt showing all required fields (scope, goal, constraints, output format, leakage prevention) wired together. Added a ❌/✅ common mistakes section. Updated the description to "2+" (more precise than "multiple") and added "sequential dependencies" as an explicit disqualifier alongside file and state conflicts.

`**executing-plans` stop conditions expanded** — The single "stop on repeated verification failures" bullet is replaced with a named list: missing dependency, plan gap preventing start, unclear/contradictory instruction, repeated verification failure. Added "never guess — ask for clarification" as an explicit directive. Added the main/master branch prohibition with a reference to the worktree step.

`**claude-md-creator` self-assesses redundancy** — The skill no longer asks the user "anything you'd cut?" It now applies the redundancy filter itself before presenting the draft: every line must pass "would the agent produce incorrect output without this?" Lines that don't survive the filter are cut before the user sees them.

**PR description required in `finishing-a-development-branch`** — Option 2 (push + open PR) now requires a structured description: what changed, why, how to verify, and notable decisions. Previously the skill just said "Create PR" with no guidance on content.

**Worktree path persistence clarified** — `using-git-worktrees` now explicitly states that the `cd` in the creation step does not persist across separate shell calls, and that all subsequent commands must use the full worktree path or `cd <path> && <command>` inline.

`**find-polluter.sh` surfaced for test pollution** — `systematic-debugging` Phase 1 now references the `find-polluter.sh` script for tests that fail only in certain orderings. Previously the script existed in the skill folder but was never mentioned in the skill itself.

### Fixes

**project-map.md staleness loop fixed** — The staleness check in `using-superpowers` entry sequence step 6 detected stale map entries and re-read changed files — but never wrote the updates back. Every session with a stale map would re-read the same files and leave the map unchanged for next time, repeating the cycle forever. The check now explicitly updates the changed Key Files entries and refreshes the git hash in the header after re-reading, breaking the loop.

**project-map.md version sync constraint was incomplete** — The constraint listed three manifest files that must stay version-synced, but omitted `.codex-plugin/plugin.json` and `VERSION` (both required per `CLAUDE.md`). A version bump following the map's constraint would silently miss two files. Updated to list all five.

**context-snapshot.json creation expectation clarified** — When `git init` runs mid-session via the fresh-project gate, `context-snapshot.json` is not created in that session (the context-engine hook already fired at session start before git existed). The confirm path in `using-superpowers` now states this explicitly and notes that the file will appear on the next session start from the project root.

## v6.0.0 (2026-03-24)

Comprehensive codebase audit and hardening. Twelve bugs, routing gaps, and safety issues found and fixed across hooks, skill routing, and the subagent guard.

### Fixes

**Gitignore corruption when section already exists** — When `track-edits.js` appended an AI artifact to an existing `# AI assistant artifacts` section in `.gitignore`, it omitted the newline prefix, causing the new entry to be concatenated onto the last line of the file if it lacked a trailing newline. The entry would be silently malformed and git would not recognize it. Fixed by applying the `prefix` variable in both branches.

**Dead export `appendAutoSessionEntry` in stop-reminders** — `stop-reminders.js` exported `appendAutoSessionEntry` in its `module.exports`, but the function was never defined anywhere in the file. Any consumer calling it would get a `TypeError`. Removed from exports.

**Cross-platform cache age check in session-start** — The update check used `date -r FILE +%s` to read a file's modification time, which behaves inconsistently on some Linux distributions. On failure the cache age defaulted to 0, causing a GitHub fetch on every session start. Replaced with `stat -c %Y` (GNU/Linux) falling back to `stat -f %m` (BSD/macOS) falling back to 0.

**Awk stderr leaked into session context** — The `session-start` hook used `2>&1` when capturing the using-superpowers skill body via awk. Any awk error (permission denied, missing file) would be injected into the AI's session context as part of the skill text. Changed to `2>/dev/null`.

`**premise-check` was unreachable via skill-activator hook** — Despite being the most important safety-net skill (validates whether work should exist before building it), `premise-check` had no entry in `skill-rules.json`. The skill-activator hook could never suggest it based on user input — it only fired if the model proactively read the Routing Guide text. Added a high-priority rule covering "design a system", "should we build this", "validate the premise", and related phrases.

`**receiving-code-review` was unreachable via skill-activator hook** — Same gap: no `skill-rules.json` entry. Phrases like "address review feedback" and "respond to review" never triggered it. Added a medium-priority rule.

`**error-recovery` missing from Routing Guide** — The skill existed and was in `skill-rules.json`, but was absent from the Routing Guide in `using-superpowers`. A model doing full-complexity routing would never find it as a destination. Added to the guide.

`**deliberation` missing from subagent-guard** — The subagent guard's violation patterns covered 20 skills but omitted `deliberation`. A subagent invoking `deliberation` by plain name (without the `superpowers-prepared:` prefix) would slip through. Added to the patterns. The guard was also refactored to use a verb-prefix pattern (`invoking/using/running + skill name`) that eliminates false positives from prose mentions of skill names.

**ReDoS vulnerability in block-dangerous-commands** — Six regex patterns used `(-.+\s+)*` which is a nested quantifier enabling catastrophic backtracking on adversarial input. Replaced with `(-\S+\s+)*` which eliminates the backtracking risk while preserving the same match semantics.

### Changes

**Routing Guide clarifies parallel execution paths** — The distinction between `dispatching-parallel-agents` (ad-hoc parallel work outside plan execution) and `subagent-driven-development` (plan execution with optional parallel waves) is now explicit in the Routing Guide. Previously the two entries looked equivalent, causing model confusion on which to pick.

**Internal skills documented in Routing Guide** — `self-consistency-reasoner` (invoked internally by `systematic-debugging` and `verification-before-completion`) and `token-efficiency` (always-on, invoked at Entry Sequence step 1) are now noted as intentional non-entries in the Routing Guide. Previously their absence was undocumented, which could be misread as orphaned skills.

**CMD arg limit documented in run-hook.cmd** — A comment now notes the 8-argument limit of the `%2-%9` forwarding pattern in the Windows batch wrapper, flagging it for future callers who need more.

## v5.8.0 (2026-03-24)

"Map this project" now correctly triggers the context-management skill and writes `project-map.md` to the project root.

### Fixes

**"map this project" routing was broken** — Saying "map this project" produced a chat response instead of a `project-map.md` file. Two bugs caused this: (1) `skill-rules.json` had no rule mapping map intent to `context-management`, so the skill was never suggested; (2) even when invoked manually, `context-management` defaulted to writing `state.md` because the project map procedure was buried below the state-saving procedure with no routing gate. Fixed by adding a dedicated high-priority rule in `skill-rules.json` covering "map this project", "map the project", "generate/create/update project map", updating the `context-management` skill description to include these trigger phrases, and adding an explicit routing table at the top of the skill that branches to the correct procedure before any other content is read.

## v5.7.0 (2026-03-23)

Context engine, pre-verified blast radius for code review and debugging, and a fix for false-positive update notices.

### New Features

**Context engine** — A new `context-engine.js` SessionStart hook runs automatically on every session start and writes `context-snapshot.json` to the project root. It captures the files changed in the last commit, a change summary, the last 5 commits, and blast radius (which other tracked files reference each changed file, computed via `git grep`). Zero dependencies — uses Node.js built-ins and git. Fails silently if git is unavailable. Automatically adds `context-snapshot.json` to `.gitignore` on first write.

**Code review uses context snapshot** — `requesting-code-review` now checks `context-snapshot.json` before dispatching the agent. If the snapshot is fresh (git hash matches HEAD), the changed files and blast radius are used to scope the review immediately — no exploration needed. If stale, changed files are used as a starting point. If absent, the skill falls back to `git diff` directly.

**Systematic debugging uses context snapshot** — Phase 1 of `systematic-debugging` now reads `context-snapshot.json` first when investigating what changed recently. The `changed_files` and `recent_commits` fields answer the question immediately, without running `git log` and `git diff` manually.

### Fixes

**Update check false positive** — The session-start hook was reading the installed version from its own directory, which could be an older cached copy after a Claude Code plugin update. The hook would then report a newer version as available even though the update was already applied. Fixed by reading the installed version from `~/.claude/plugins/installed_plugins.json` (the authoritative source) first, with a fallback to the hook's own `plugin.json`.

## v5.6.0 (2026-03-21)

Session memory enhanced, auto-gitignore for AI artifacts, and routing guide completeness. `project-map.md` is now injected directly into every session start by the hook — no instruction-following required. AI workspace files are automatically added to `.gitignore` the moment they're created. The routing guide now covers every user-invocable skill in the plugin.

### New Features

**project-map.md auto-injected at session start** — The session-start hook now reads `project-map.md` from the working directory and injects its content directly into context, unconditionally, before the first turn. Previously, reading the project map relied on Claude following the entry sequence — if the task was classified as micro, or if the first message was conversational, the file might never be read. Now it's always in context. For maps ≤200 lines the full content is injected; for larger maps only the `## Critical Constraints` and `## Hot Files` sections are injected, with a note pointing to the full file.

**Auto-gitignore for AI workspace artifacts** — When Claude creates `project-map.md`, `session-log.md`, or `state.md` in a project, they are now automatically added to `.gitignore` under a `# AI assistant artifacts` section header. These are tooling artifacts — generated by the AI, not part of the project — and should never appear in `git status` as untracked files. The gitignore check runs in the `PostToolUse` hook for files Claude writes directly, and in the stop hook for `session-log.md` entries written by the hook itself. Idempotent: if the entry already exists, nothing is changed.

### Changes

**Routing guide now covers all user-invocable skills** — `premise-check` and `using-git-worktrees` were missing from the routing guide in `using-superpowers` and had no coverage anywhere in the entry sequence. Both are now listed: `premise-check` at the top of the guide (run before brainstorming or planning when it's unclear whether work should exist at all), and `using-git-worktrees` before the implementation entries (run before implementation when the work needs branch isolation).

`**claude-md-creator` added to routing guide with explicit bypass protection** — CLAUDE.md creation was being classified as lightweight and implemented directly, bypassing the `claude-md-creator` skill that exists specifically for this task. The routing guide now includes an explicit entry for CLAUDE.md / AGENTS.md creation pointing to `claude-md-creator`, with a note that it applies at any complexity level. The lightweight action text now includes an exception: if a dedicated implementation skill exists for the task, invoke it — lightweight only skips workflow overhead, not implementation skills.

## v5.5.0 (2026-03-20)

Reasoning gap prevention and fresh project memory setup. The AI now catches its own design and implementation gaps earlier, classifies tasks more accurately, and proactively offers to set up the memory stack before building anything in a new directory.

### New Features

**Fresh project gate** — When you type "build", "create", "implement", or any creation-intent prompt in a directory with no `project-map.md`, the AI now pauses before starting and explains exactly what it will lose without the memory stack (re-exploring structure, re-reading known files, re-proposing rejected approaches, losing the "why" behind decisions). It offers to run `git init` and generate `project-map.md` in ~30 seconds before proceeding, or start immediately if you prefer. Previously this offer only appeared if git was absent — now it fires whenever no `project-map.md` exists, regardless of git status, so users who already have git initialized are no longer silently skipped.

**Failure-mode check in brainstorming** — Before any design can be approved, the AI must now state the top 2–3 ways the chosen approach could fail or not cover all cases. This is adversarial reasoning — actively trying to break the design — not a list of known assumptions. Critical failure modes (the design fails for a significant user scenario) must be fixed before proceeding; minor ones are documented as non-goals. This catches unknown assumptions at the design stage, where fixing them costs nothing, rather than discovering them after implementation.

**Assumption externalization in writing-plans** — The plan header now requires an `Assumptions` field listing what the plan rests on and what each assumption excludes ("Assumes X — will NOT work if Y"). Every task involving conditional logic now requires a `Does NOT cover` field stating which scenarios the condition excludes. If an excluded scenario should be covered, the task is revised before implementation begins. This catches known assumptions at the planning stage, complementing the adversarial failure-mode check in brainstorming.

**Condition coverage check in verification** — `verification-before-completion` now requires, as step 5 of its gate, that any change involving a condition or gate explicitly state what it does NOT cover before the task is marked done. If the answer reveals a gap that should be covered, it must be fixed before proceeding. This is the final catch in a three-stage adversarial pipeline: design → planning → completion.

### Changes

**Classification hard overrides** — The complexity classification in `using-superpowers` now has a hard override section that is evaluated before the lightweight criteria. If any of four conditions are true (adds/modifies/removes a condition or trigger, affects user experience, modifies a shared dependency, introduces a new outcome), the task is immediately classified as full regardless of file count. This prevents lightweight anchoring on file count for tasks that have significant behavioral impact.

**Lightweight articulation requirement** — Before classifying any task as lightweight, the AI must now explicitly state in one sentence why each of the four lightweight criteria is satisfied. If any criterion cannot be clearly articulated, the task is classified as full. Combined with the hard overrides, this closes the gap where tasks with new conditional logic were being mis-classified as lightweight, skipping brainstorming and the design-stage failure-mode check.

## v5.4.0 (2026-03-20)

Session memory, deliberation skill, social accountability, and ASI-guided auto-fix. The AI no longer starts every session amnesiac, makes better architectural decisions before committing to a direction, and its review agents now prioritize and fix findings more accurately.

### New Features

**Deliberation skill** — New `skills/deliberation/SKILL.md` for complex architectural or technology decisions where the options aren't yet well-defined or the problem may need reframing before brainstorming begins. The skill convenes 3–5 named stakeholder perspectives (Security Engineer, Developer Experience Advocate, Ops/Infrastructure Engineer, Maintainability Advocate, Performance Engineer, User/Product) — each speaks once without debate or rebuttal. The output surfaces where perspectives converge (load-bearing constraints that any solution must satisfy), where they genuinely disagree (live tensions that cannot be papered over), and optionally reframes the original question when deliberation reveals it was mis-stated. No forced conclusion — deliberation produces clarity about the decision space, not a recommendation. Routed by `using-superpowers` before brainstorming when the decision is unclear. Triggered by: "trade-off", "should we use", "evaluate these options", "architecture decision", "not sure which approach".

**Session memory stack** — The plugin now builds a four-file memory stack at your project root that eliminates re-discovery overhead across sessions. `session-log.md` accumulates a history of decisions, rejected approaches, and key facts. The stop hook auto-appends a minimal `[auto]` entry at every session end (skills used, files modified) at zero cost — no setup, no action required. When you explicitly invoke `context-management`, it writes a richer `[saved]` entry capturing goals, rationale, and what was tried and abandoned. At session start, the AI greps this log for keywords from the current task and surfaces relevant history before doing any work.

**Project map** — New `project-map.md` is the semantic memory layer: a persistent, AI-written map of the project's directory structure, key file purposes, and critical non-obvious constraints (e.g. "single quotes break Linux CI in hooks.json"). Generate it once with "map this project". After that, the AI reads it at every session start instead of re-globbing and re-reading files it already understands. Staleness is automatic: the AI checks the git hash in the map header against the current commit, then uses `git diff --name-only` to identify exactly which files changed and re-reads only those. Works on non-git projects too via file timestamp comparison. If no git repository is detected, the AI offers to run `git init` during map generation (creates a `.git` folder, touches no user files) with a clear explanation of what happens if you decline.

**Skill quality gate** — The `skill-creator` skill now includes a five-dimension quality check (Safety, Completeness, Executability, Maintainability, Cost-awareness) that must pass before moving to test cases. A skill that fails Executability or Completeness is redesigned, not just tested. This catches gaps and ambiguities at the design stage rather than discovering them during evaluation.

**Model selection guidance for subagents** — `subagent-driven-development` now specifies which model to use for each Agent tool call: Haiku for file reads, log scanning, and patch verification (output is data, not decisions); Sonnet for all implementation tasks (default); Opus for architecture analysis, complex spec review, and multi-system debugging. Reduces cost on lightweight review work and improves accuracy on reasoning-heavy tasks.

### Changes

**Social accountability in agent prompts** — The `code-reviewer`, `red-team`, and `implementer` agent prompts now include social accountability framing informed by 2389.ai research. Each agent is explicitly told that downstream work depends on the accuracy of its output: a false positive in the red team report triggers a full wasted fix cycle; a missed bug in code review ships to production; an implementer task that fails review cycles back and blocks the whole pipeline. The framing is factual, not motivational — it describes what actually happens, which is what improved accuracy in the research.

**ASI-guided iterative auto-fix pipeline** — The auto-fix pipeline in `requesting-code-review` was rewritten from a sequential batch (fix all Critical/High in order, run full suite once at end) to an ASI-guided iterative loop. The red team now marks one finding as the ASI (Actionable Side Information — the single finding that poses the greatest real-world risk if unaddressed). The pipeline starts there: write failing test → fix code → re-read only the files touched by the fix → check whether any other reported findings are now resolved or changed in severity → re-identify the new ASI → repeat until no Critical or High findings remain → run full suite once. This prevents fix collisions when multiple findings touch shared code, and catches side effects immediately rather than discovering them in a single final regression run.

**Proactive compaction breakpoints** — `token-efficiency` now includes explicit guidance to break context at logical seams before implementation begins (after research/exploration, after abandoning a failed approach) rather than waiting for auto-compaction at 95% context fill. Auto-compaction at 95% destroys the most recently gathered context — exactly the variable names, file paths, and evidence that implementation depends on. A proactive break at 50% preserves all of it.

**context-management expanded** — Now manages all four memory files (`project-map.md`, `session-log.md`, `state.md`, `known-issues.md`) as a unified stack with documented procedures for each. Session-start procedure updated to grep `session-log.md` for task keywords before diving in. Explicit cross-reference to `episodic-memory@superpowers-marketplace` for semantic cross-project recall that falls outside the scope of per-project grep-based memory.

**Entry sequence updated** — `using-superpowers` entry sequence now includes `project-map.md` as step 5: read the map if it exists, check staleness, re-read only changed files. This makes orientation at session start deterministic and zero-waste.

**Session-start hook** — Now detects when no git repository is present and injects a quiet background note into session context. The AI acts on this only when `project-map.md` is relevant — it does not announce it verbally on every session start.

## v5.3.0 (2026-03-17)

Frontend design intelligence and documentation improvements. The frontend skill was completely rewritten from a 62-line checklist into a comprehensive design reasoning system, and several docs were updated to reflect the current state of the plugin.

### New Features

**frontend-design skill (complete rewrite)** — The former `frontend-craftsmanship` skill has been renamed to `frontend-design` and rewritten from scratch. It now includes a 4-step design system generation framework that forces deliberate style, color, typography, and effects decisions before writing code. Adds a 25-style reference catalog (Minimalism through Cyberpunk), a 30-category industry design reference table mapping product types to recommended design directions, 8 common page structure patterns (dashboard, landing page, admin panel, etc.), 5-state UI state management (loading, error, empty, success, partial), frontend-backend integration patterns (API loading, optimistic updates, error boundaries, auth flows), dark mode implementation guidance, micro-copy and UX writing standards, and 10 priority quality standard categories covering accessibility, touch targets, performance, animation, forms, navigation, and charts. 353 lines, single file, zero dependencies.

**Red team pipeline documentation** — New `docs/architecture/red-team-pipeline.md` explains the end-to-end flow from code review through red team dispatch to auto-fix pipeline, including when each component fires, what the red team produces, how auto-fix processes findings, and merge blocking rules.

**Frontend design documentation** — New `docs/architecture/frontend-design.md` explains the skill's 7 capabilities with examples, what users can expect when prompting for frontend work, and how activation integrates with other Superpowers skills.

### Changes

**Testing documentation updated** — `docs/testing.md` (now `docs/architecture/testing-structure.md`) was rewritten to reflect the actual 5-directory test structure: claude-code, skill-triggering, explicit-skill-requests, subagent-driven-dev, and opencode. Added the subagent hook scope test, fixed stale plugin name references, and added a quick reference section with copy-paste commands for every test suite.

**AGENTS.minimal.md updated** — Added missing `premise-check` skill reference.

**frontend-craftsmanship → frontend-design rename** — All references across 9 files updated: SKILL.md frontmatter, skill-rules.json, subagent-guard.js, README.md, AGENTS.minimal.md, using-superpowers routing, executing-plans, subagent-driven-development, and RELEASE-NOTES.md.

## v5.2.0 (2026-03-15)

Adversarial red team analysis and auto-fix pipeline. Code review now goes beyond checklists — it actively tries to break your code, then fixes what it finds.

### New Features

**Red team agent** — New `agents/red-team.md` adversarially attacks completed implementations to find concrete failure scenarios that checklist-based review misses. Focuses on 7 attack categories: logic bugs, adversarial inputs, state corruption, concurrency & timing, resource exhaustion, error cascading, and assumption violations. Each finding includes a specific trigger, root cause with file:line references, and a test case skeleton. Explicitly does NOT overlap with the OWASP/CWE security review — its domain is adversarial logic analysis.

**Auto-fix pipeline** — When the red team report contains Critical or High findings, `requesting-code-review` now runs an auto-fix pipeline: for each finding, the test case skeleton is fleshed into a real test (must fail — proving the scenario is real), then the code is fixed to pass the test, then the full suite is verified for regressions. False positives are caught naturally (test passes → finding was invalid → skip). Medium findings are tracked for later, not auto-fixed.

**Red team integration in code review** — `requesting-code-review` now dispatches the red team agent in parallel with the code reviewer when changes touch complex logic, concurrency, state management, data transformation pipelines, retry/recovery logic, or performance-critical paths.

**Hardcoded secret content scanning** — `protect-secrets.js` now scans the content of Edit and Write operations for hardcoded secrets before the write happens. Detects 14 patterns: AWS access/secret keys, GitHub tokens, OpenAI keys, Anthropic keys, Stripe keys, private key PEM blocks, generic API key assignments, database connection strings with passwords, Slack tokens, SendGrid keys, Twilio keys, and Supabase keys. On detection, the write is blocked and the agent is instructed to move the value to an environment variable (e.g. `.env` file) and reference it via `process.env.VARIABLE_NAME` instead. Files where secrets are expected (`.env`, documentation) are allowlisted.

### Changes

**Subagent guard updated** — `hooks/subagent-guard.js` now includes violation patterns for `premise-check` and `red-team` skills, preventing subagents from invoking these skills via filesystem discovery.

---

## v5.1.0 (2026-03-14)

Upstream sync and hardening release. Adopts the most impactful changes from obra/superpowers, adds new safety mechanisms, and removes deprecated features.

### New Features

**Subagent context isolation** — All delegation skills (`subagent-driven-development`, `dispatching-parallel-agents`, `executing-plans`) now explicitly prohibit forwarding parent session context or history to subagents. Each subagent prompt is constructed from scratch with only task-scoped information. This prevents context pollution where subagents inherit the parent's reasoning chains and behave incorrectly (e.g., a reviewer acting as a lead developer).

**Subagent skill leakage prevention** — All subagent prompt templates now include an explicit instruction preventing subagents from discovering and invoking superpowers-prepared skills via filesystem access. Without this, a focused implementer subagent could discover workflow skills like `brainstorming` or `executing-plans` and derail into orchestration mode instead of doing its assigned task.

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

`**adaptive-workflow-selector` no longer exists as a standalone skill.** If your CLAUDE.md or custom workflows reference it, update them to use `using-superpowers` which now handles complexity classification inline.

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

- Cursor install command: `/plugin-add superpowers` → `/plugin-add superpowers-prepared`
- Update command: `/plugin update superpowers` → `/plugin update superpowers-prepared`

**README: Missing documentation for hooks and agents**

- Added Hooks subsection to "What's Inside" listing all 5 hooks
- Added Agents subsection documenting the code-reviewer with `memory: user`
- Updated comparison table with Hooks system and Safety guards rows
- Updated intro and summary to mention hooks and safety guards

---

## v4.4.0 (2026-03-06)

This release closes the gap between what the skills document and what agents actually do wrong. Improvements are sourced from a systematic AI self-review of the plugin combined with the previously-documented real-session failure patterns from `docs/superpowers-prepared/specs/2025-11-28-skills-improvements-from-user-feedback.md`.

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

**frontend-design: Concrete Standards Checklist**

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

Added two missing routing entries: `frontend-design` for UI/frontend implementation tasks, and `security-reviewer` for security-sensitive changes before merge. The routing guide is now comprehensive across all active specialist skills.

**dispatching-parallel-agents: Integration verification strengthened**

Step 6 "Run integration verification" now specifies: execute the full project test suite plus any cross-domain checks, and do not mark the wave complete until integration passes. Removes ambiguity about what "integration verification" means in practice.

---

## v5.1.0 (2026-04-30)

### Removals

- **Legacy slash commands removed** — `/brainstorm`, `/execute-plan`, and `/write-plan` are gone. They were deprecated stubs that did nothing but tell the user to invoke the corresponding skill. Invoke `superpowers:brainstorming`, `superpowers:executing-plans`, and `superpowers:writing-plans` directly instead. (#1188)
- **`superpowers:code-reviewer` named agent removed** — the agent was the plugin's only named agent and was used by exactly two skills, while every other reviewer/implementer subagent in the repo dispatches `general-purpose` with a prompt template alongside its skill. The agent's persona and checklist have been merged into `skills/requesting-code-review/code-reviewer.md` as a self-contained Task-dispatch template. Anyone dispatching `Task (superpowers:code-reviewer)` should switch to `Task (general-purpose)` with the prompt template instead. (PR #1299)
- **Integration sections removed from skills** — these were a legacy of the time before agents had native skills systems and didn't help with steering.

### Worktree Skills Rewrite

`using-git-worktrees` and `finishing-a-development-branch` now detect when the agent is already running inside an isolated worktree and prefer the harness's native worktree controls before falling back to `git worktree`. Behavior was TDD-validated and cross-platform-checked across five harnesses. (PRI-974, PR #1121)

- **Environment detection** — both skills check `GIT_DIR != GIT_COMMON` before doing anything; if already in a linked worktree, creation is skipped entirely. A submodule guard prevents false detection.
- **Consent before creating worktrees** — `using-git-worktrees` no longer creates worktrees implicitly; the skill asks the user first. Fixes #991 (subagent-driven-development was auto-creating worktrees without consent).
- **Native tool preference (Step 1a)** — when the harness exposes its own worktree tool (e.g. Codex), the skill defers to it. The user's stated preference is respected when expressed.
- **Provenance-based cleanup** — `finishing-a-development-branch` only cleans up worktrees inside `.worktrees/` (created by superpowers); anything outside is left alone. Fixes #940 (Option 2 was incorrectly cleaning up worktrees), #999 (merge-then-remove ordering), and #238 (`cd` to repo root before `git worktree remove`).
- **Detached HEAD handling** — the finishing menu collapses to two options when there is no branch to merge from.
- **Hardcoded `/Users/jesse` paths** in skill examples replaced with generic placeholders. (#858, PR #1122)

### Contributor Guidelines for AI Agents

Two new sections at the top of `CLAUDE.md` (symlinked to `AGENTS.md`) speak directly to AI agents. An audit of the last 100 closed PRs against this repo showed a 94% rejection rate driven by AI-generated slop: agents that didn't read the PR template, opened duplicates, fabricated problem descriptions, or pushed fork- or domain-specific changes upstream.

- **Pre-submission checklist** — read the PR template, search for existing PRs, verify a real problem exists, confirm the change belongs in core, and show the human partner the complete diff before submitting.
- **What we will not accept** — third-party dependencies, "compliance" rewrites of skill content, project-specific configuration, bulk PRs, speculative fixes, domain-specific skills, fork-specific changes, fabricated content, and bundled unrelated changes.
- **New harness PRs require a session transcript** — most past new-harness integrations copied skill files or wrapped with `npx skills` instead of loading the `using-superpowers` bootstrap at session start. The acceptance test ("Let's make a react todo list" must auto-trigger `brainstorming` in a clean session) and a complete transcript are now required.

### Codex Plugin Mirror Tooling

New `sync-to-codex-plugin` script mirrors superpowers into the OpenAI Codex plugin marketplace as `prime-radiant-inc/openai-codex-plugins`. Path/user-agnostic so any team member can run it. (PR #1165)

- Clones the fork fresh into a temp directory per run, regenerates overlays inline, and opens a PR; auto-detects upstream from the script's own location and preflights `rsync`/`git`/`gh auth`/`python3`.
- `--bootstrap` flag for first-time setup; `EXCLUDES` patterns anchored to source root; `assets/` excluded.
- Mirrors `CODE_OF_CONDUCT.md`; drops the `agents/openai.yaml` overlay.
- Seeds `interface.defaultPrompt` in the mirrored `plugin.json`. (PR #1180 by @arittr)
- Codex plugin files are committed to the source repo so the sync script uses canonical versions; Codex marketplace metadata is preserved.

### OpenCode

- **Bootstrap content cached at module level** — `getBootstrapContent()` was calling `fs.existsSync` + `fs.readFileSync` + frontmatter regex on every agent step (the `experimental.chat.messages.transform` hook fires on every step in OpenCode's agent loop). Now read once, cached for the session lifetime, with a null sentinel for the missing-file case. 15 regression tests cover cache behavior, fs call counts, the injection guard, the missing-file sentinel, and cache reset. (Fixes #1202)
- **Integration tests modernized**.
- **Install caveats clarified** in the README.

### Code Review Consolidation

`requesting-code-review` is now self-contained: the persona, checklist, and dispatch template live in `skills/requesting-code-review/code-reviewer.md` and the skill dispatches `Task (general-purpose)` directly. (PR #1299)

- **Single source of truth** — the persona/checklist that previously lived in both `agents/code-reviewer.md` and the skill's placeholder template (and drifted independently) is now one file.
- **`subagent-driven-development` follows suit** — its `code-quality-reviewer-prompt.md` now dispatches `Task (general-purpose)` instead of the named agent.
- **Behavioral test added** — `tests/claude-code/test-requesting-code-review.sh` plants real bugs (SQL injection, plaintext password handling, credential logging) into a tiny project and asserts the dispatched reviewer flags every planted issue at Critical/Important severity and refuses to approve the diff.
- **Codex and Copilot workaround docs trimmed** — the "Named agent dispatch" sections in `references/codex-tools.md` and `references/copilot-tools.md` documented how to flatten a named agent into a generic dispatch. With no named agents shipping, the workaround is unnecessary; both sections were dropped.

### Subagent-Driven Development

- **No more pause every 3 tasks** — the "review after each batch (3 tasks)" cadence in `requesting-code-review` (originally for `executing-plans`) was leaking into `subagent-driven-development`. Replaced with "each task or at natural checkpoints" plus an explicit continuous-execution directive.
- **SDD integration test now runs its assertions** — three independent bugs caused the test to silently bail before printing any verification results: an unresolved `..` segment in the working-dir path, a `set -euo pipefail` interaction with `find | sort | head -1` (SIGPIPE on the producer killed the script), and a missing `--plugin-dir` on the `claude -p` invocation that caused the test to load the installed plugin instead of the working tree. All three fixed; six verification tests now actually run against a real end-to-end SDD run.

### Cursor

- **Windows SessionStart hook** routed through `run-hook.cmd` instead of invoking the extensionless `session-start` script directly. Fixes Windows opening the file in an editor instead of running it. Also removed an accidental UTF-8 BOM from `hooks-cursor.json`.

### Gemini CLI

- **Subagent dispatch mapping** — Gemini's `Task` dispatch now maps to `@agent-name` / `@generalist`, with parallel subagent dispatch documented for independent tasks.

### Skills

- **Terminology cleanups** across skill content.

### Documentation & Install

- **Factory Droid installation instructions** added to README.
- **Quickstart install links** in README. (PR #1293 by @arittr)
- **Codex plugin install guidance** updated. (PR #1288 by @arittr)
- **Codex `wait` mapping corrected** to `wait_agent` in the tools reference.
- **Install order reorganized**; Codex install instructions cleaned up.
- **Removed vestigial `CHANGELOG.md`** in favor of `RELEASE-NOTES.md` as the single source. (PR #1163 by @shaanmajid)
- **Discord invite link** fixed; release announcements link and a detailed Discord description added to the Community section.

### Community

- @shaanmajid — vestigial `CHANGELOG.md` removal (PR #1163)
- @arittr — README quickstart install links (#1293), Codex plugin install guidance (#1288), `sync-to-codex-plugin` `interface.defaultPrompt` seed (#1180)

## v5.0.7 (2026-03-31)

### GitHub Copilot CLI Support

- **SessionStart context injection** — Copilot CLI v1.0.11 added support for `additionalContext` in sessionStart hook output. The session-start hook now detects the `COPILOT_CLI` environment variable and emits the SDK-standard `{ "additionalContext": "..." }` format, giving Copilot CLI users the full superpowers bootstrap at session start. (Original fix by @culinablaz in PR #910)
- **Tool mapping** — added `references/copilot-tools.md` with the full Claude Code to Copilot CLI tool equivalence table
- **Skill and README updates** — added Copilot CLI to the `using-superpowers` skill's platform instructions and README installation section

### OpenCode Fixes

- **Skills path consistency** — the bootstrap text no longer advertises a misleading `configDir/skills/superpowers/` path that didn't match the runtime path. The agent should use the native `skill` tool, not navigate to files by path. Tests now use consistent paths derived from a single source of truth. (#847, #916)
- **Bootstrap as user message** — moved bootstrap injection from `experimental.chat.system.transform` to `experimental.chat.messages.transform`, prepending to the first user message instead of adding a system message. Avoids token bloat from system messages repeated every turn (#750) and fixes compatibility with Qwen and other models that break on multiple system messages (#894).

## v5.0.6 (2026-03-24)

### Inline Self-Review Replaces Subagent Review Loops

The subagent review loop (dispatching a fresh agent to review plans/specs) doubled execution time (~25 min overhead) without measurably improving plan quality. Regression testing across 5 versions with 5 trials each showed identical quality scores regardless of whether the review loop ran.

- **brainstorming** — replaced Spec Review Loop (subagent dispatch + 3-iteration cap) with inline Spec Self-Review checklist: placeholder scan, internal consistency, scope check, ambiguity check
- **writing-plans** — replaced Plan Review Loop (subagent dispatch + 3-iteration cap) with inline Self-Review checklist: spec coverage, placeholder scan, type consistency
- **writing-plans** — added explicit "No Placeholders" section defining plan failures (TBD, vague descriptions, undefined references, "similar to Task N")
- Self-review catches 3-5 real bugs per run in ~30s instead of ~25 min, with comparable defect rates to the subagent approach

### Brainstorm Server

- **Session directory restructured** — the brainstorm server session directory now contains two peer subdirectories: `content/` (HTML files served to the browser) and `state/` (events, server-info, pid, log). Previously, server state and user interaction data were stored alongside served content, making them accessible over HTTP. The `screen_dir` and `state_dir` paths are both included in the server-started JSON. (Reported by 吉田仁)

### Bug Fixes

- **Owner-PID lifecycle fixes** — the brainstorm server's owner-PID monitoring had two bugs causing false shutdowns within 60 seconds: (1) EPERM from cross-user PIDs (Tailscale SSH, etc.) was treated as "process dead", and (2) on WSL the grandparent PID resolves to a short-lived subprocess that exits before the first lifecycle check. Fixed by treating EPERM as "alive" and validating the owner PID at startup — if it's already dead, monitoring is disabled and the server relies on the 30-minute idle timeout. This also removes the Windows/MSYS2-specific carve-out from `start-server.sh` since the server now handles it generically. (#879)
- **writing-skills** — corrected false claim that SKILL.md frontmatter supports "only two fields"; now says "two required fields" and links to the agentskills.io specification for all supported fields (PR #882 by @arittr)

### Codex App Compatibility

- **codex-tools** — added named agent dispatch mapping documenting how to translate Claude Code's named agent types to Codex's `spawn_agent` with worker roles (PR #647 by @arittr)
- **codex-tools** — added environment detection and Codex App finishing sections for worktree-aware skills (by @arittr)
- **Design spec** — added Codex App compatibility design spec (PRI-823) covering read-only environment detection, worktree-safe skill behavior, and sandbox fallback patterns (by @arittr)

## v5.0.5 (2026-03-17)

### Bug Fixes

- **Brainstorm server ESM fix** — renamed `server.js` → `server.cjs` so the brainstorming server starts correctly on Node.js 22+ where the root `package.json` `"type": "module"` caused `require()` to fail. (PR #784 by @sarbojitrana, fixes #774, #780, #783)
- **Brainstorm owner-PID on Windows** — skip PID lifecycle monitoring on Windows/MSYS2 where the PID namespace is invisible to Node.js, preventing the server from self-terminating after 60 seconds. (#770, docs from PR #768 by @lucasyhzlu-debug)
- **stop-server.sh reliability** — verify the server process actually died before reporting success. SIGTERM + 2s wait + SIGKILL fallback. (#723)

### Changed

- **Execution handoff** — restore user choice between subagent-driven and inline execution after plan writing. Subagent-driven is recommended but no longer mandatory.

## v5.0.4 (2026-03-16)

### Review Loop Refinements

Dramatically reduces token usage and speeds up spec and plan reviews by eliminating unnecessary review passes and tightening reviewer focus.

- **Single whole-plan review** — plan reviewer now reviews the complete plan in one pass instead of chunk-by-chunk. Removed all chunk-related concepts (`## Chunk N:` headings, 1000-line chunk limits, per-chunk dispatch).
- **Raised the bar for blocking issues** — both spec and plan reviewer prompts now include a "Calibration" section: only flag issues that would cause real problems during implementation. Minor wording, stylistic preferences, and formatting quibbles should not block approval.
- **Reduced max review iterations** — from 5 to 3 for both spec and plan review loops. If the reviewer is calibrated correctly, 3 rounds is plenty.
- **Streamlined reviewer checklists** — spec reviewer trimmed from 7 categories to 5; plan reviewer from 7 to 4. Removed formatting-focused checks (task syntax, chunk size) in favor of substance (buildability, spec alignment).

### OpenCode

- **One-line plugin install** — OpenCode plugin now auto-registers the skills directory via a `config` hook. No symlinks or `skills.paths` config needed. Install is just adding one line to `opencode.json`. (PR #753)
- **Added `package.json`** so OpenCode can install superpowers as an npm package from git.

### Bug Fixes

- **Verify server actually stopped** — `stop-server.sh` now confirms the process is dead before reporting success. SIGTERM + 2s wait + SIGKILL fallback. Reports failure if the process survives. (PR #751)
- **Generic agent language** — brainstorm companion waiting page now says "the agent" instead of "Claude".

## v5.0.3 (2026-03-15)

### Cursor Support

- **Cursor hooks** — added `hooks/hooks-cursor.json` with Cursor's camelCase format (`sessionStart`, `version: 1`) and updated `.cursor-plugin/plugin.json` to reference it. Fixed platform detection in `session-start` to check `CURSOR_PLUGIN_ROOT` first (Cursor may also set `CLAUDE_PLUGIN_ROOT`). (Based on PR #709)

### Bug Fixes

- **Stop firing SessionStart hook on `--resume`** — the startup hook was re-injecting context on resumed sessions, which already have the context in their conversation history. The hook now fires only on `startup`, `clear`, and `compact`.
- **Bash 5.3+ hook hang** — replaced heredoc (`cat <<EOF`) with `printf` in `hooks/session-start`. Fixes indefinite hang on macOS with Homebrew bash 5.3+ caused by a bash regression with large variable expansion in heredocs. (#572, #571)
- **POSIX-safe hook script** — replaced `${BASH_SOURCE[0]:-$0}` with `$0` in `hooks/session-start`. Fixes "Bad substitution" error on Ubuntu/Debian where `/bin/sh` is dash. (#553)
- **Portable shebangs** — replaced `#!/bin/bash` with `#!/usr/bin/env bash` in all shell scripts. Fixes execution on NixOS, FreeBSD, and macOS with Homebrew bash where `/bin/bash` is outdated or missing. (#700)
- **Brainstorm server on Windows** — auto-detect Windows/Git Bash (`OSTYPE=msys*`, `MSYSTEM`) and switch to foreground mode, fixing silent server failure caused by `nohup`/`disown` process reaping. (#737)
- **Codex docs fix** — replaced deprecated `collab` flag with `multi_agent` in Codex documentation. (PR #749)

## v5.0.2 (2026-03-11)

### Zero-Dependency Brainstorm Server

**Removed all vendored node_modules — server.js is now fully self-contained**

- Replaced Express/Chokidar/WebSocket dependencies with zero-dependency Node.js server using built-in `http`, `fs`, and `crypto` modules
- Removed ~1,200 lines of vendored `node_modules/`, `package.json`, and `package-lock.json`
- Custom WebSocket protocol implementation (RFC 6455 framing, ping/pong, proper close handshake)
- Native `fs.watch()` file watching replaces Chokidar
- Full test suite: HTTP serving, WebSocket protocol, file watching, and integration tests

### Brainstorm Server Reliability

- **Auto-exit after 30 minutes idle** — server shuts down when no clients are connected, preventing orphaned processes
- **Owner process tracking** — server monitors the parent harness PID and exits when the owning session dies
- **Liveness check** — skill verifies server is responsive before reusing an existing instance
- **Encoding fix** — proper `<meta charset="utf-8">` on served HTML pages

### Subagent Context Isolation

- All delegation skills (brainstorming, dispatching-parallel-agents, requesting-code-review, subagent-driven-development, writing-plans) now include context isolation principle
- Subagents receive only the context they need, preventing context window pollution

## v5.0.1 (2026-03-10)

### Agentskills Compliance

**Brainstorm-server moved into skill directory**

- Moved `lib/brainstorm-server/` → `skills/brainstorming/scripts/` per the [agentskills.io](https://agentskills.io) specification
- All `${CLAUDE_PLUGIN_ROOT}/lib/brainstorm-server/` references replaced with relative `scripts/` paths
- Skills are now fully portable across platforms — no platform-specific env vars needed to locate scripts
- `lib/` directory removed (was the last remaining content)

### New Features

**Gemini CLI extension**

- Native Gemini CLI extension support via `gemini-extension.json` and `GEMINI.md` at repo root
- `GEMINI.md` @imports `using-superpowers` skill and tool mapping table at session start
- Gemini CLI tool mapping reference (`skills/using-superpowers/references/gemini-tools.md`) — translates Claude Code tool names (Read, Write, Edit, Bash, etc.) to Gemini CLI equivalents (read_file, write_file, replace, etc.)
- Documents Gemini CLI limitations: no subagent support, skills fall back to `executing-plans`
- Extension root at repo root for cross-platform compatibility (avoids Windows symlink issues)
- Install instructions added to README

### Improvements

**Multi-platform brainstorm server launch**

- Per-platform launch instructions in visual-companion.md: Claude Code (default mode), Codex (auto-foreground via `CODEX_CI`), Gemini CLI (`--foreground` with `is_background`), and fallback for other environments
- Server now writes startup JSON to `$SCREEN_DIR/.server-info` so agents can find the URL and port even when stdout is hidden by background execution

**Brainstorm server dependencies bundled**

- `node_modules` vendored into the repo so the brainstorm server works immediately on fresh plugin installs without requiring `npm` at runtime
- Removed `fsevents` from bundled deps (macOS-only native binary; chokidar falls back gracefully without it)
- Fallback auto-install via `npm install` if `node_modules` is missing

**OpenCode tool mapping fix**

- `TodoWrite` → `todowrite` (was incorrectly mapped to `update_plan`); verified against OpenCode source

### Bug Fixes

**Windows/Linux: single quotes break SessionStart hook** (#577, #529, #644, PR #585)

- Single quotes around `${CLAUDE_PLUGIN_ROOT}` in hooks.json fail on Windows (cmd.exe doesn't recognize single quotes as path delimiters) and on Linux (single quotes prevent variable expansion)
- Fix: replaced single quotes with escaped double quotes — works across macOS bash, Windows cmd.exe, Windows Git Bash, and Linux, with and without spaces in paths
- Verified on Windows 11 (NT 10.0.26200.0) with Claude Code 2.1.72 and Git for Windows

**Brainstorming spec review loop skipped** (#677)

- The spec review loop (dispatch spec-document-reviewer subagent, iterate until approved) existed in the prose "After the Design" section but was missing from the checklist and process flow diagram
- Since agents follow the diagram and checklist more reliably than prose, the spec review step was being skipped entirely
- Added step 7 (spec review loop) to the checklist and corresponding nodes to the dot graph
- Tested with `claude --plugin-dir` and `claude-session-driver`: worker now correctly dispatches the reviewer

**Cursor install command** (PR #676)

- Fixed Cursor install command in README: `/plugin-add` → `/add-plugin` (confirmed via Cursor 2.5 release announcement)

**User review gate in brainstorming** (#565)

- Added explicit user review step between spec completion and writing-plans handoff
- User must approve the spec before implementation planning begins
- Checklist, process flow, and prose updated with the new gate

**Session-start hook emits context only once per platform**

- Hook now detects whether it's running in Claude Code or another platform
- Emits `hookSpecificOutput` for Claude Code, `additional_context` for others — prevents double context injection

**Linting fix in token analysis script**

- `except:` → `except Exception:` in `tests/claude-code/analyze-token-usage.py`

### Maintenance

**Removed dead code**

- Deleted `lib/skills-core.js` and its test (`tests/opencode/test-skills-core.js`) — unused since February 2026
- Removed skills-core existence check from `tests/opencode/test-plugin-loading.sh`

### Community

- @karuturi — Claude Code official marketplace install instructions (PR #610)
- @mvanhorn — session-start hook dual-emit fix, OpenCode tool mapping fix
- @daniel-graham — linting fix for bare except
- PR #585 author — Windows/Linux hooks quoting fix

---

## v5.0.0 (2026-03-09)

### Breaking Changes

**Specs and plans directory restructured**

- Specs (brainstorming output) now save to `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`
- Plans (writing-plans output) now save to `docs/superpowers/plans/YYYY-MM-DD-<feature-name>.md`
- User preferences for spec/plan locations override these defaults
- All internal skill references, test files, and example paths updated to match
- Migration: move existing files from `docs/plans/` to new locations if desired

**Subagent-driven development mandatory on capable harnesses**

Writing-plans no longer offers a choice between subagent-driven and executing-plans. On harnesses with subagent support (Claude Code, Codex), subagent-driven-development is required. Executing-plans is reserved for harnesses without subagent capability, and now tells the user that Superpowers works better on a subagent-capable platform.

**Executing-plans no longer batches**

Removed the "execute 3 tasks then stop for review" pattern. Plans now execute continuously, stopping only for blockers.

**Slash commands deprecated**

`/brainstorm`, `/write-plan`, and `/execute-plan` now show deprecation notices pointing users to the corresponding skills. Commands will be removed in the next major release.

### New Features

**Visual brainstorming companion**

Optional browser-based companion for brainstorming sessions. When a topic would benefit from visuals, the brainstorming skill offers to show mockups, diagrams, comparisons, and other content in a browser window alongside terminal conversation.

- `lib/brainstorm-server/` — WebSocket server with browser helper library, session management scripts, and dark/light themed frame template ("Superpowers Brainstorming" with GitHub link)
- `skills/brainstorming/visual-companion.md` — Progressive disclosure guide for server workflow, screen authoring, and feedback collection
- Brainstorming skill adds a visual companion decision point to its process flow: after exploring project context, the skill evaluates whether upcoming questions involve visual content and offers the companion in its own message
- Per-question decision: even after accepting, each question is evaluated for whether browser or terminal is more appropriate
- Integration tests in `tests/brainstorm-server/`

**Document review system**

Automated review loops for spec and plan documents using subagent dispatch:

- `skills/brainstorming/spec-document-reviewer-prompt.md` — Reviewer checks completeness, consistency, architecture, and YAGNI
- `skills/writing-plans/plan-document-reviewer-prompt.md` — Reviewer checks spec alignment, task decomposition, file structure, and file size
- Brainstorming dispatches spec reviewer after writing the design doc
- Writing-plans includes chunk-based plan review loop after each section
- Review loops repeat until approved or escalate after 5 iterations
- End-to-end tests in `tests/claude-code/test-document-review-system.sh`
- Design spec and implementation plan in `docs/superpowers/`

**Architecture guidance across the skill pipeline**

Design-for-isolation and file-size-awareness guidance added to brainstorming, writing-plans, and subagent-driven-development:

- **Brainstorming** — New sections: "Design for isolation and clarity" (clear boundaries, well-defined interfaces, independently testable units) and "Working in existing codebases" (follow existing patterns, targeted improvements only)
- **Writing-plans** — New "File Structure" section: map out files and responsibilities before defining tasks. New "Scope Check" backstop: catch multi-subsystem specs that should have been decomposed during brainstorming
- **SDD implementer** — New "Code Organization" section (follow plan's file structure, report concerns about growing files) and "When You're in Over Your Head" escalation guidance
- **SDD code quality reviewer** — Now checks architecture, unit decomposition, plan conformance, and file growth
- **Spec/plan reviewers** — Architecture and file size added to review criteria
- **Scope assessment** — Brainstorming now assesses whether a project is too large for a single spec. Multi-subsystem requests are flagged early and decomposed into sub-projects, each with its own spec → plan → implementation cycle

**Subagent-driven development improvements**

- **Model selection** — Guidance for choosing model capability by task type: cheap models for mechanical implementation, standard for integration, capable for architecture and review
- **Implementer status protocol** — Subagents now report DONE, DONE_WITH_CONCERNS, BLOCKED, or NEEDS_CONTEXT. Controller handles each status appropriately: re-dispatching with more context, upgrading model capability, breaking tasks apart, or escalating to human

### Improvements

**Instruction priority hierarchy**

Added explicit priority ordering to using-superpowers:

1. User's explicit instructions (CLAUDE.md, AGENTS.md, direct requests) — highest priority
2. Superpowers skills — override default system behavior
3. Default system prompt — lowest priority

If CLAUDE.md or AGENTS.md says "don't use TDD" and a skill says "always use TDD," the user's instructions win.

**SUBAGENT-STOP gate**

Added `<SUBAGENT-STOP>` block to using-superpowers. Subagents dispatched for specific tasks now skip the skill instead of activating the 1% rule and invoking full skill workflows.

**Multi-platform improvements**

- Codex tool mapping moved to progressive disclosure reference file (`references/codex-tools.md`)
- Platform Adaptation pointer added so non-Claude-Code platforms can find tool equivalents
- Plan headers now address "agentic workers" instead of "Claude" specifically
- Collab feature requirement documented in `docs/README.codex.md`

**Writing-plans template updates**

- Plan steps now use checkbox syntax (`- [ ] **Step N:**`) for progress tracking
- Plan header references both subagent-driven-development and executing-plans with platform-aware routing

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

Claude Code 2.1.x changed how hooks execute on Windows: it now auto-detects `.sh` files in commands and prepends `bash` . This broke the polyglot wrapper pattern because `bash "run-hook.cmd" session-start.sh` tries to execute the .cmd file as a bash script.

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
  - Platform-specific documentation (`docs/platforms/opencode.md`, `docs/platforms/codex.md`)

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
- Design documents now written to `docs/superpowers-prepared/specs/YYYY-MM-DD-<topic>-design.md` before implementation
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
- Design specs stored in `docs/superpowers-prepared/specs/`, implementation plans in `docs/superpowers-prepared/plans/`

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
  - `**REQUIRED BACKGROUND:`** - Prerequisites you must understand
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

- Skills repository is now at [https://github.com/obra/superpowers-skills](https://github.com/obra/superpowers-skills)
- Fork → Branch → PR workflow
- See skills/meta/writing-skills/SKILL.md for TDD approach to documentation

## Known Issues

None at this time.

## Credits

- Problem-solving skills inspired by Amplifier patterns
- Community contributions and feedback
- Extensive testing and iteration on skill effectiveness

---

**Full Changelog:** [https://github.com/obra/superpowers/compare/dd013f6...main](https://github.com/obra/superpowers/compare/dd013f6...main)
**Skills Repository:** [https://github.com/obra/superpowers-skills](https://github.com/obra/superpowers-skills)
**Issues:** [https://github.com/obra/superpowers/issues](https://github.com/obra/superpowers/issues)
