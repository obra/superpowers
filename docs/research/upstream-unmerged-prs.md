# Upstream Unmerged PRs: obra/superpowers

**Date:** 2026-03-01
**Total PRs scanned:** 230 (146 closed-not-merged + 84 open)
**Repository:** https://github.com/obra/superpowers

---

## Executive Summary

The obra/superpowers repo has accumulated 230 unmerged PRs spanning platform integrations, skill improvements, new skills, bug fixes, and infrastructure changes. The maintainer (obra) appears to be selective about merges, and many high-quality contributions sit unmerged. The most valuable unmerged ideas fall into a few key themes:

1. **Phantom completion / evidence enforcement** (PR #578, #170) -- the single biggest user pain point
2. **Model selection / cost efficiency** (PR #547, #322, #380) -- repeated demand for tiered model use
3. **Persistent state / session recovery** (PR #508, #555, #458) -- cross-session memory
4. **Plan review before execution** (PR #448) -- catching plan errors before subagents run
5. **Platform expansion** (20+ PRs for Gemini, Copilot, Kiro, Factory, TRAE, Crush, Pi, Continue, etc.)
6. **Quick mode bypass** (PR #534) -- per-request skill bypass
7. **Worktree fixes** (PR #391, #105, #483) -- CWD ordering, base branch detection
8. **Hook/startup fixes** (PR #572, #585, #584, #553, #507) -- bash 5.3 hang, Linux compat, Windows compat

---

## Category 1: Skill Improvements (Changes to Existing SKILL.md Files)

### PR #578 (OPEN) -- subagent-driven-development: phantom completion fix + persistent validator pool
- **Author:** STRML
- **What:** Addresses the #1 failure mode: tasks marked done with hallucinated/incomplete implementations. Two-phase fix: (1) mandatory evidence citations in implementer and spec-reviewer prompts, (2) persistent validator pool with combined spec+quality review, re-review loop bounds, context poisoning mitigation.
- **Key ideas:**
  - Implementers MUST include: exact test command + output, `git diff --stat`, file list with line counts
  - Spec reviewers MUST cite `file:line` per requirement; prose-only verdicts rejected
  - Persistent validator team members (2 validators, combined review pass)
  - Re-review loop capped at 3 cycles, then escalate to human
  - SDK memory validation test before enabling persistent topology
  - Validator rotation every 5 tasks for large plans (with explicit cross-task gap disclosure)
- **Why not merged:** Very large/ambitious PR. Likely awaiting review or being broken into phases.
- **Relevance:** HIGH. We already implemented evidence format in our skills audit (Wave 2). The persistent validator pool design is the next logical step.

### PR #471 (OPEN) -- Align writing-skills with Anthropic's Complete Guide to Building Skills
- **Author:** harrymunro
- **What:** Updates writing-skills SKILL.md and anthropic-best-practices.md to incorporate Anthropic's official skill-authoring playbook. Adds 3 new reference files (planning-and-design.md, skill-patterns.md, troubleshooting.md).
- **Key ideas:**
  - Description formula: `[What it does] + [When to use it] + [Key capabilities]` (not workflow steps)
  - New optional frontmatter fields: `license`, `compatibility`, `allowed-tools`, `metadata`
  - Folder naming: kebab-case only, must match `name` field
  - No XML angle brackets in frontmatter (security restriction)
  - Skill directory structure: `scripts/`, `references/`, `assets/` subdirectories
  - 5 named patterns: sequential workflow, multi-MCP, iterative refinement, context-aware, domain-specific
- **Why not merged:** Likely waiting for review. High quality contribution.
- **Relevance:** HIGH. We did Anthropic alignment in Wave 5 but this adds more structured reference material.

### PR #459 (OPEN) -- Improve using-superpowers skill description and conciseness
- **Author:** fernandezbaptiste
- **What:** Trims the `using-superpowers` skill description for better conciseness. Removes overly aggressive "EXTREMELY-IMPORTANT" XML wrapper, shrinks the red flags table from 10 rows to 5, adds structured output section.
- **Key ideas:**
  - Remove the heavy-handed EXTREMELY-IMPORTANT wrapper
  - Shorten the red flags table to the 5 most important rationalizations
  - Add structured output expectations (skill announcement, TodoWrite items, task response)
  - Improved description with trigger phrases
- **Why not merged:** Style preference difference? obra may prefer the aggressive enforcement.
- **Relevance:** MEDIUM. We trimmed red flags in our Wave 5 work already, but this PR's approach differs.

### PR #534 (OPEN) -- feat: add quick mode for one-off tasks
- **Author:** johnwhoyou
- **What:** Adds a `quick:` prefix to bypass all Superpowers workflows for a single message. Documented across README, Codex, OpenCode docs.
- **Key ideas:**
  - `<QUICK_MODE>` guard in using-superpowers near the top
  - Case-sensitive, must start at character 1
  - Only the current message is affected; next message reverts to normal
  - Base system and developer instructions still apply
- **Why not merged:** Design decision -- obra may want a different bypass mechanism.
- **Relevance:** MEDIUM. Common user request. Simple and clean implementation.

### PR #541 (OPEN) -- Add proactive assumption challenging to brainstorming skill
- **Author:** thakoreh
- **What:** Fixes #530. Adds a step where the brainstorming skill proactively challenges assumptions embedded in the user's request rather than accepting them at face value.
- **Why not merged:** Waiting for review.
- **Relevance:** MEDIUM. We added assumption challenging in our Wave 4 brainstorming updates.

### PR #579 (OPEN) -- feat(brainstorming): add scale/volume as required discovery question
- **Author:** zabda
- **What:** Adds scale/volume as an explicit required question during brainstorming's "Understanding the idea" phase. Volume (transactions/sec, records, users, etc.) is a critical architectural driver.
- **Why not merged:** Waiting for review.
- **Relevance:** MEDIUM. Good specific addition to brainstorming discovery phase.

### PR #520 (OPEN) -- feat(brainstorming): Smart question batching, visual previews, alternative surfacing
- **Author:** SebRogala
- **What:** Improves brainstorming clarifying questions with smart batching (group related questions), visual previews using AskUserQuestion tool for UI/layout decisions, and better alternative surfacing.
- **Why not merged:** Waiting for review.
- **Relevance:** MEDIUM. Interesting UX improvement for brainstorming sessions.

### PR #386 (OPEN) -- feat(brainstorming): add research existing solutions step
- **Author:** Vincent-lkm
- **What:** Adds a new step to brainstorming that searches for existing solutions before proposing custom approaches. Uses `gh search repos` and web search.
- **Why not merged:** Waiting for review.
- **Relevance:** MEDIUM. We added a research step in our Wave 4 brainstorming update.

### PR #483 (OPEN) -- fix(skills): restore worktree step in brainstorming workflow
- **Author:** qishaoyumu
- **What:** Restores the `using-git-worktrees` invocation that was lost during brainstorming simplification. Fixes stale cross-reference in worktrees skill.
- **Why not merged:** Waiting for review.
- **Relevance:** HIGH. This is a real handoff gap (our audit finding H2).

### PR #391 (OPEN) -- fix(finishing-a-development-branch): handle worktree CWD cleanup ordering
- **Author:** tartansandal
- **What:** Rewrites Step 5 (Cleanup Worktree) with correct ordering: move CWD out first, remove worktree, prune refs, then delete branch. Adds two new Common Mistakes. Adds cross-session plan guidance.
- **Key ideas:**
  - `cd <main-repo-path>` BEFORE `git worktree remove` (otherwise shell CWD becomes invalid)
  - Branch deletion AFTER worktree removal (git refuses to delete branch checked out in worktree)
  - Warning for plans generated for other sessions: CWD will be inside worktree
- **Why not merged:** Waiting for review.
- **Relevance:** HIGH. We fixed the CWD bug in our Wave 5 work. This PR's approach is more thorough.

### PR #480 (OPEN) -- fix: prevent && command chaining in code reviewer
- **Author:** dotuananh0712
- **What:** Adds guidance to run git diff commands separately instead of chaining with `&&`, which causes consent prompts in Claude Code.
- **Why not merged:** Small fix, waiting for review.
- **Relevance:** LOW. Minor but real UX improvement.

### PR #498 (OPEN) -- feat(skills): add boundary coverage and anti-patterns for better testing
- **Author:** dotuananh0712
- **What:** Enhances TDD and brainstorming skills: boundary value testing guidance, feature preservation guidance, schema introspection.
- **Why not merged:** Waiting for review.
- **Relevance:** MEDIUM. Good additions to TDD skill.

### PR #511 (OPEN) -- Improve visual companion: per-question decisions, cross-platform server docs
- **Author:** arittr
- **What:** Rewrites visual companion with per-question browser/terminal heuristic, cross-platform server startup, removes `${CLAUDE_PLUGIN_ROOT}` references from skill docs.
- **Why not merged:** Waiting for review.
- **Relevance:** LOW. Visual companion is a niche feature.

### PR #517 (OPEN) -- Add skill library audit reference to writing-skills
- **Author:** vishnujayvel
- **What:** Adds `auditing-existing-skills.md` reference doc and updates SKILL.md description to include "auditing a skill library" as a trigger.
- **Why not merged:** Waiting for review.
- **Relevance:** MEDIUM. Useful for writing-skills meta-capability.

### PR #235 (OPEN) -- Add principles of phase design to writing-plans skill
- **Author:** talsraviv
- **What:** Adds two key principles to writing-plans: (1) "Something simple working soon" -- close a working loop of value fast, then add layers. (2) "Stoppable phases" -- each phase is self-contained working software.
- **Key ideas:**
  - Core principle: close a working value loop fast (boilerplate, hello world, minimal slice)
  - Each phase is independently stoppable
  - Avoid "write all tests at the end" patterns
- **Why not merged:** Likely a style/scope decision.
- **Relevance:** MEDIUM. Concise and useful addition to writing-plans philosophy.

### PR #568 (CLOSED) -- Simplify execution flow: always use subagent-driven-development
- **Author:** tgruben-circuit
- **What:** Removes the choice between subagent-driven-development and executing-plans. Makes subagent-driven the only execution method. Updates writing-plans to always hand off to subagent-driven.
- **Key ideas:**
  - Removes the decision flowchart from subagent-driven-development
  - writing-plans always hands off to subagent-driven (in a new clean session)
  - executing-plans still exists but is no longer offered as an alternative
- **Why not merged:** Controversial simplification -- executing-plans is still needed for harnesses without subagent support.
- **Relevance:** MEDIUM. The direction is right for Claude Code but breaks other platforms.

### PR #213 (CLOSED) -- Improve brainstorming skill from 71/100 to 97/100
- **Author:** RichardHightower
- **What:** Restructures brainstorming with explicit phases, numbered steps, a design template in `references/`, and an example session reference.
- **Key ideas:**
  - 5 explicit phases: Context, Explore Approaches, Present Design, Document, Handoff
  - Design document template with status tracking (Draft/Validated/Implemented)
  - Example session reference for new users
- **Why not merged:** Likely too opinionated / restructures too aggressively.
- **Relevance:** LOW-MEDIUM. Some good ideas but the numbered-step approach may be too rigid.

### PR #183 (OPEN) -- Feat/designing for autonomy
- **Author:** talsraviv
- **What:** Adds "Designing for agent implementation" section to brainstorming. Key insight: agents can't see browser DevTools, mobile logs, or scattered logs.
- **Key ideas:**
  - Route ALL logs to ONE agent-accessible location
  - Build dev-only endpoints: `/dev/health`, `/dev/state`, `/dev/reset`
  - Errors must include: what was attempted, what failed, why, next steps
  - Browser testing hierarchy: exhaust non-browser paths first
- **Why not merged:** Waiting for review. From a thoughtful early contributor.
- **Relevance:** MEDIUM. Good design-for-observability principles.

### PR #172 (OPEN) -- docs(writing-plans): add explicit TDD sub-skill requirements
- **Author:** alexrexi
- **What:** Adds explicit cross-reference from writing-plans to test-driven-development skill with Iron Law explanation.
- **Why not merged:** Waiting for review.
- **Relevance:** LOW. We added TDD enforcement in Wave 2.

---

## Category 2: New Skills or Features

### PR #587 (OPEN) -- Add managing-kanban skill for multi-project task tracking
- **Author:** murphybread
- **What:** New skill: `managing-kanban` with WIP limits, task sizing (S/M/L), claim-write protocol for parallel agent safety, archive rules.
- **Key ideas:**
  - Opt-in: skips silently if no `## Kanban` section in config file
  - Two files: `kanban.md` (active) + `kanbanArchive.md` (history)
  - Single master file with `[ProjectName]` tags (no per-project files)
  - WIP limit of 7 with claim-write protocol (read rev, increment, write, verify)
  - M/L tasks require writing-plans before WIP claim
  - State transition table with defined valid moves
- **Why not merged:** Waiting for review. Well-designed with opt-in pattern.
- **Relevance:** MEDIUM. Interesting for multi-project orchestration.

### PR #508 (OPEN) -- feat: add persistent-planning skill for shared file-based memory
- **Author:** zzh730
- **What:** New skill: `persistent-planning` with 3-file pattern (plan + findings + progress) for shared memory across tasks/sessions.
- **Key ideas:**
  - Orchestrator-mediated: only orchestrator reads/writes planning files
  - Session recovery after `/clear` via progress file detection in session-start hook
  - 2-Action Rule: every 2 tasks, orchestrator asks "did subagents discover something future tasks need?"
  - Plan Deviation Protocol: don't edit plan, record decisions in findings
  - 3-Strike Error Protocol: 3 failures on same approach = escalate to human
  - Findings growth management with Summary sections
- **Why not merged:** Waiting for review.
- **Relevance:** HIGH. Very close to our `.superpowers/state.yml` design. Different implementation approach (companion files vs state file).

### PR #448 (OPEN) -- Add reviewing-plans skill + namespace docs/plans by project
- **Author:** banga87
- **What:** New skill: `reviewing-plans` for pre-execution plan verification against codebase. Also namespaces plans under `docs/plans/<project>/`.
- **Key ideas:**
  - Fresh context recommended (new session, not the one that wrote the plan)
  - Decision flowchart: complex plan? written by another session? high-risk?
  - Verify naming conventions with 3+ existing examples
  - Check file paths, dependencies, task ordering
  - Project-namespaced plan directories
- **Why not merged:** Waiting for review.
- **Relevance:** HIGH. Plan review before execution is a gap in current workflow.

### PR #564 (OPEN) -- feat: add auditing-ai-generated-code skill
- **Author:** talesperito
- **What:** New skill for auditing vibe-coded / AI-generated code before production. 7 audit dimensions, structured output format, production readiness score.
- **Key ideas:**
  - 7 dimensions: Architecture, Consistency, Robustness, Production Risks, Security, Dead/Hallucinated Code, Tech Debt
  - Specific AI-code failure patterns: dead validation, hallucinated dependencies, hardcoded secrets
  - Structured output with severity levels and exact locations
  - Production readiness score rubric (0-30: not deployable, 31-50: high risk, etc.)
- **Why not merged:** Waiting for review.
- **Relevance:** MEDIUM. Novel skill addressing a real gap.

### PR #560 (OPEN) -- feat: add security-review skill
- **Author:** Hnturk
- **What:** Discipline-enforcing skill for security vulnerability review. Covers OWASP Top 10, input validation, auth, data exposure, dependencies.
- **Why not merged:** Waiting for review.
- **Relevance:** MEDIUM. Multiple PRs (also #482, #424) attempt security review skills.

### PR #555 (OPEN) -- feat(skills): add progress bootstrap and tracker for .progress memory
- **Author:** LanternCX
- **What:** Two new skills: `progress-bootstrap` and `progress-tracker` for structured memory layer across sessions.
- **Why not merged:** Waiting for review.
- **Relevance:** MEDIUM. Another approach to cross-session persistence (like #508 and our state.yml).

### PR #333 (OPEN) -- Add syncing-documentation skill
- **Author:** rhinos0608
- **What:** New discipline skill requiring documentation sync with code changes. Dispatches subagent to investigate affected docs before updating.
- **Key ideas:**
  - Triggers on all meaningful code changes
  - Subagent investigates: "What docs exist for this module? What changed? What needs updating?"
  - Quick reference table by change type (API, refactor, security, feature, bug, config)
  - Counters to common rationalizations for skipping docs
- **Why not merged:** Waiting for review.
- **Relevance:** MEDIUM. Good discipline skill.

### PR #322 (CLOSED) -- feat: add model-selection skill for cost-efficient agent spawning
- **Author:** GenuineDickies
- **What:** New skill with model selection reference table, escalation rules (2 failures = escalate tier), user override warnings.
- **Key ideas:**
  - Haiku for bulk/mechanical, Sonnet for most coding, Opus for architecture/security
  - Escalation: Haiku->Sonnet->Opus after 2 failures
  - Per-task failure counting, not global
  - Warn when user requests mismatched model
- **Why not merged:** Closed. Possibly superseded by #380 or #547.
- **Relevance:** HIGH. Model tiering is a key Phase 4 topic for us.

### PR #380 (OPEN) -- Add model-selection-for-agents skill
- **Author:** scottlepich-lz
- **What:** Another model-selection skill. More opinionated: always use opus for planning/review, resist cost anxiety.
- **Key ideas:**
  - Complex planning and code review = opus, always
  - Implementation = sonnet
  - Anti-rationalization table (12 excuses and rebuttals)
  - "Cost anxiety" vs "budget constraints" distinction explicitly rejected
  - Addresses sophisticated rationalizations including production incidents
- **Why not merged:** Waiting for review. More aggressive than #322.
- **Relevance:** HIGH. Strong anti-rationalization patterns. Overlaps with our Phase 4 model tiering work.

### PR #547 (OPEN) -- Feat/model aware agents (OpenCode)
- **Author:** AlexMKX
- **What:** Registers three model-aware agents via OpenCode plugin config hook: implementer (sonnet), spec-reviewer (sonnet), code-reviewer (opus).
- **Key ideas:**
  - Agents registered via plugin `config` hook with full prompts embedded
  - User-defined agents in opencode.json take priority (shallow merge)
  - implementer-sp: sonnet, full tool access
  - spec-reviewer-sp: sonnet, read-only tools
  - code-reviewer-sp: opus, read-only tools
- **Why not merged:** OpenCode-specific. Waiting for review.
- **Relevance:** HIGH. Concrete implementation of model tiering for one platform.

### PR #334 (OPEN) -- feat: document review system and workflow enforcement (by obra himself!)
- **Author:** obra
- **What:** Adds spec/plan document review loops, workflow enforcement (brainstorming must go to writing-plans), directory restructuring, visual companion, instruction priority hierarchy.
- **Key ideas:**
  - Specs to `docs/superpowers/specs/`, plans to `docs/superpowers/plans/`
  - Brainstorming -> writing-plans transition enforced (no platform planning)
  - Subagent-driven mandatory on capable harnesses
  - Visual companion for brainstorming (HTML + WebSocket server)
  - Instruction priority: user CLAUDE.md > skills > default system prompt
- **Why not merged:** obra's own branch, likely still in development. Very large diff.
- **Relevance:** CRITICAL. This is obra's intended direction. Shows planned directory restructuring and workflow enforcement.

### PR #442 (OPEN) -- feat: add plan status tracking to writing-plans and executing-plans
- **Author:** Mharbulous
- **What:** Adds YAML frontmatter `status: pending/executed` to plans. writing-plans creates with `pending`, executing-plans marks `executed` on completion.
- **Why not merged:** Small, clean change. Waiting for review.
- **Relevance:** MEDIUM. Simple lifecycle tracking. Our state.yml approach is more comprehensive.

### PR #340 (OPEN) -- feat: add configurable plans directory via SUPERPOWERS_PLANS_DIR
- **Author:** jeherve
- **What:** Environment variable to save plans outside the project repo. Useful for keeping planning docs out of commits.
- **Key ideas:**
  - `SUPERPOWERS_PLANS_DIR` env var overrides default `docs/plans/`
  - Project path derived from CWD relative to `~`
  - Updates brainstorming to use configured location
- **Why not merged:** Waiting for review.
- **Relevance:** LOW-MEDIUM. Niche use case but clean implementation.

### PR #121 (OPEN) -- Add github-project-management skill
- **Author:** nickolasclarke
- **What:** Skill for GitHub issue/project integration at natural workflow checkpoints (after brainstorming, after plans, during implementation, after branch completion).
- **Key ideas:**
  - Issues proposed at workflow checkpoints, always requires user confirmation
  - Repo issues vs project draft items distinction
  - Project configured in CLAUDE.md (`github_project: owner/number`)
  - Integration with `gh` CLI for project and issue management
- **Why not merged:** Author noted wanting to rewrite as more generic. Old PR.
- **Relevance:** MEDIUM. Issue tracking integration is a common request.

### PR #477 (OPEN) -- feat: gate bootstrap injection on SUPERPOWERS_SKIP_BOOTSTRAP env var
- **Author:** sjawhar
- **What:** `SUPERPOWERS_SKIP_BOOTSTRAP=1` skips system prompt injection while preserving individual skill access.
- **Key ideas:**
  - Enables headless/CI/autonomous agent sessions to use skills without mandatory bootstrap
  - Single-line change in OpenCode plugin
  - Clean separation: bootstrap is for interactive sessions, individual skills for CI
- **Why not merged:** Waiting for review. Clean, minimal change.
- **Relevance:** MEDIUM. Useful for CI/automation use cases.

### PR #531 (OPEN) -- feat: add harness-engineering skill
- **Author:** gh-xj
- **What:** New skill focused on harness-readiness-check preflight mindset. Inspired by OpenAI's harness engineering approach.
- **Why not merged:** Waiting for review.
- **Relevance:** LOW-MEDIUM. Niche but interesting.

### PR #458 (OPEN) -- feat: implement sentinel progress tracking and dynamic skill discovery
- **Author:** VoDaiLocz
- **What:** Sentinel progress tracking in PROGRESS.md during plan execution + SKILLS_INDEX.md for skill discovery without context overload.
- **Why not merged:** Waiting for review.
- **Relevance:** MEDIUM. Another approach to progress tracking.

### PR #532 (OPEN) -- Add claude-max-proxy-setup skill
- **Author:** ERROR403agent
- **What:** Skill for setting up claude-max-api-proxy to reduce API costs by routing through Claude Max/Pro subscription.
- **Why not merged:** Waiting for review.
- **Relevance:** LOW. Very specific use case.

---

## Category 3: Bug Fixes

### PR #572 (OPEN) -- Fix session-start hang on bash 5.3+
- **Author:** pds
- **What:** Replaces `cat <<EOF` heredoc with `printf` in session-start hook. Bash 5.3 regression causes heredoc variable expansion to hang when content exceeds ~512 bytes.
- **Key ideas:**
  - `session_context` is ~4,500 bytes, well above the threshold
  - Affects macOS users with Homebrew bash 5.3+
  - Simple `printf` replacement fixes the issue
- **Why not merged:** Waiting for review. This is a real user-facing bug.
- **Relevance:** HIGH. Critical startup bug.

### PR #585 (OPEN) -- fix: use double quotes for CLAUDE_PLUGIN_ROOT in SessionStart hook
- **Author:** atian8179
- **What:** Single quotes around `${CLAUDE_PLUGIN_ROOT}` prevent variable expansion on Linux.
- **Why not merged:** Duplicate of #584, both fixing same issue.
- **Relevance:** HIGH. Affects all Linux users.

### PR #584 (OPEN) -- Fix SessionStart hook variable expansion on Linux
- **Author:** 04cb
- **What:** Same fix as #585 -- removes quotes so JSON string provides proper quoting.
- **Why not merged:** Competing with #585.
- **Relevance:** HIGH. Same Linux startup fix.

### PR #553 (OPEN) -- fix(hooks): replace BASH_SOURCE with POSIX-safe $0 for Linux compatibility
- **Author:** jd316
- **What:** Replaces `${BASH_SOURCE[0]}` with `$0` in session-start hook for Ubuntu/dash compatibility.
- **Why not merged:** Waiting for review.
- **Relevance:** HIGH. Affects Ubuntu users where /bin/sh is dash.

### PR #582 (CLOSED) -- fix: prevent path traversal in resolveSkillPath
- **Author:** ashsolei
- **What:** Validates skill names don't contain `..` or absolute paths. Ensures resolved paths stay within expected directories.
- **Key ideas:**
  - Reject names containing `..` or starting with `/`
  - `path.resolve()` + prefix check to ensure containment
  - Applies to both personal and superpowers skill directories
- **Why not merged:** Closed. May have been considered over-engineered for the threat model.
- **Relevance:** LOW-MEDIUM. Security hardening, but low-probability attack vector.

### PR #525 (OPEN) -- chore: remove unused lib/skills-core.js
- **Author:** RomarQ
- **What:** Deletes dead code. `lib/skills-core.js` has had no importers since #330.
- **Why not merged:** Simple cleanup, waiting for review.
- **Relevance:** LOW. Housekeeping.

### PR #405 (OPEN) -- Update assert_order to support patterns on the same line
- **Author:** bgao
- **What:** Test helper fix: `assert_order` now checks column order when patterns are on the same line.
- **Why not merged:** Waiting for review.
- **Relevance:** LOW. Test infrastructure improvement.

---

## Category 4: Platform Support

### Gemini CLI / Antigravity (Multiple PRs)
- **PR #570 (OPEN)** sh3lan93 -- Add Gemini CLI extension support (native extension, all 14+ skills)
- **PR #563 (OPEN)** Kayri -- Gemini CLI extension builder and CI pipeline (Python build + GitHub Actions)
- **PR #537 (OPEN)** mhenke -- Gemini CLI support (hub pattern installer, skill symlinks)
- **PR #535 (OPEN)** mhenke -- Native Antigravity support
- **PR #499 (OPEN)** cwest -- Gemini CLI / Antigravity via Hub Pattern (install guide + README)
- **PR #488 (OPEN)** js-krinay -- Antigravity IDE integration docs
- **PR #281 (OPEN)** codeF1x -- Antigravity installation instructions in README
- **PR #192 (OPEN)** AHGGG -- Antigravity IDE integration (tested on Windows)
- **Closed:** #497 (cwest), #550 (ciphernaut), #320 (crichalchemist), #264 (MichaelAntonFischer)
- **Status:** Multiple competing approaches. mhenke's hub pattern (#537) seems most mature.

### GitHub Copilot (Multiple PRs)
- **PR #556 (OPEN)** tomazb -- Copilot support with copilot-instructions.md
- **PR #533 (OPEN)** mhenke -- Native Copilot CLI support (plugin manifest, hooks, installer)
- **PR #218 (OPEN)** crabhit -- Copilot Agent Mode integration (AGENTS.md + CLI tool)
- **Closed:** #91 (varunr89 -- experimental Copilot support)

### Factory Droid (Multiple PRs)
- **PR #370 (OPEN)** enoreyes -- Full plugin support (manifest, marketplace, installer)
- **PR #519 (OPEN)** vurihuang -- .factory directory with docs and scripts
- **Closed:** #139 (karol-f), #130 (galangryandana), #129 (galangryandana), #127 (galangryandana)

### Kiro IDE
- **PR #527 (OPEN)** rfxlamia -- Kiro steering files for all skills
- **PR #363 (OPEN)** flixfox1 -- Kiro IDE native power support
- **Status:** Two competing approaches for Kiro integration.

### OpenClaw (Multiple PRs)
- **PR #543 (OPEN)** maloqab -- OpenClaw platform support
- **PR #569 (OPEN)** caasols -- OpenClaw wrapper hardening (idempotent, configurable)
- **Closed:** #438 (ProgramCaiCai)

### Crush CLI (successor to OpenCode)
- **PR #580 (OPEN)** mhenke -- Full Crush CLI support (AGENTS.md, INSTALL.md, README)

### Qwen Code CLI
- **PR #516 (OPEN)** mhenke -- Native Qwen Code CLI support (hub pattern)

### TRAE
- **PR #513 (OPEN)** quangrau -- TRAE integration (hub pattern installer, skill symlinks)

### Continue (VS Code extension)
- **PR #302 (OPEN)** murphyXu -- Continue adapter with slash command prompts

### Pi (coding agent)
- **PR #500 (OPEN)** sheurich -- Experimental pi support (Phase 1)

### AdaL (Sylph AI)
- **PR #400 (OPEN)** liyin2015 -- AdaL installation instructions

### Codex Improvements
- **PR #362 (OPEN)** deinspanjer -- Update parallel-execution skills for collab agents
- **PR #359 (OPEN)** bshelkhonov -- Update Codex subagent mapping
- **PR #411 (OPEN)** kundeng -- Codex installer can update AGENTS.md
- **PR #409/410 (OPEN)** kundeng -- Node-based install/upgrade/doctor for Codex/OpenCode
- **PR #266 (OPEN)** lcostantino -- Option to temporarily disable skill in Codex
- **PR #145 (OPEN)** varunr89 -- Native Codex skills support update instructions

### Claude Code Web
- **PR #152 (OPEN)** purp -- [WIP] Claude Code for Web compatibility (iPad use case)

### Windows Support
- **PR #539 (OPEN)** itsjinendrajain -- Fix symlink path in Windows installation
- **Closed:** #507, #496, #475, #421, #398, #377, #360, #356, #332, #326, #282, #184, #168, #132, #47, #38
- **Status:** Windows support has been a persistent pain point with many attempted fixes.

### Documentation PRs
- **PR #548 (OPEN)** juliangums -- Correct Cursor install command (`/add-plugin` not `/plugin-add`)
- **PR #542 (OPEN)** Lemonawa -- Update instructions for Claude Code, Codex, OpenCode
- **PR #506 (OPEN)** cavanaug -- Use OPENCODE_CONFIG_DIR in install docs
- **PR #456 (OPEN)** paulgear -- Use relative symlinks for opencode installation
- **PR #540 (OPEN)** parthalon025 -- Community Extensions section in README

---

## Category 5: Infrastructure / Tooling Changes

### PR #409 (OPEN) -- installer: add node-based install/upgrade/doctor for Codex/OpenCode
- **Author:** kundeng
- **What:** `lib/installer-core.js` with `install`, `upgrade`, `doctor` commands. Idempotent central-clone workflow.
- **Why not merged:** Large infrastructure change, possibly waiting for design review.
- **Relevance:** MEDIUM. Professional installer infrastructure.

### PR #395 (OPEN) -- docs: add PRD for native skills install/update
- **Author:** aryeko
- **What:** PRD proposing native, agent-driven open-spec install/update path with safe migration from bootstrap flow.
- **Why not merged:** Design document, not code.
- **Relevance:** LOW-MEDIUM. Strategic thinking about installation.

### PR #563 (OPEN) -- feat: add Gemini CLI extension builder and CI pipeline
- **Author:** Kayri
- **What:** Python build pipeline + GitHub Actions for compiling skills into Gemini CLI extension.
- **Why not merged:** Waiting for review.
- **Relevance:** LOW. Gemini-specific CI.

---

## Category 6: Accidental / Spam / Wrong-Repo PRs

| PR | Author | Reason |
|----|--------|--------|
| #575 (CLOSED) | ocherry341 | Self-labeled "Accidental PR, closed" |
| #576 (OPEN) | houlianpi | Empty template body, no description |
| #567 (CLOSED) | houlianpi | Test/accidental |
| #562 (CLOSED) | iamtouchskyer | Test PR |
| #561 (CLOSED) | steins024 | Repo setup, not a contribution |
| #545 (OPEN) | fibi-daudi | Unrelated (login GUI validation app) |
| #538 (OPEN) | ArmyMikePhilly | Unrelated (agency OS lead-gen framework) |
| #392 (OPEN) | whd4 | Unrelated (HTML landing page) |
| #277 (CLOSED) | nehashakoor981-boop | Trivial/spam |
| #268 (CLOSED) | bendhillon12 | Auto-generated, accidental |
| #247 (CLOSED) | diwsickles | Unrelated (puzzle game) |
| #191 (CLOSED) | JAMMAN7-png | Unclear/accidental |
| #109, #108 (CLOSED) | mikecourt | Auto-generated debugging attempts |
| #103, #102 (CLOSED) | jamon8888 | Auto-generated branch names |
| #84, #75, #67, #66 (CLOSED) | ashleytower | Auto-generated duplicates |
| #71, #70, #69 (CLOSED) | ashleytower | Bulk/duplicate additions |
| #64 (CLOSED) | titofebus | Rename attempt |
| #52 (CLOSED) | josaatt | Version bump only |
| #18 (CLOSED) | joegoldin | Fork link update |
| #304 (CLOSED) | ScalingSolutions1 | Auto-generated |

---

## Category 7: Large/Ambitious Closed PRs (Notable Ideas)

### PR #558 (CLOSED) -- Pipeline v3.1 -- Intent Engineering + AOA + Human Engagement
- **Author:** EAIconsulting
- **Why closed:** Too large/different vision. Over-engineered SDLC orchestration.

### PR #272 (CLOSED) -- Apply 8 research-backed patterns to improve skill instruction following
- **Author:** bradwindy
- **Why closed:** 20,000+ line diff, too large to review.

### PR #170 (CLOSED) -- Production-Tested Improvements: Mechanical Enforcement & Safety Gates
- **Author:** EthanJStark
- **Why closed:** Fork-specific changes (changed plugin metadata to personal fork).

### PR #407 (CLOSED) -- Make skills more opinionated and autonomous
- **Author:** aarongraham
- **Why closed:** Likely too aggressive.

### PR #236 (CLOSED) -- Got rid of TDD stuff
- **Author:** jobuii
- **Why closed:** Against project philosophy. TDD is core.

### Remaining closed PRs of lower interest
- See full list in Category 7 appendix below.

---

## Top 15 Most Valuable Unmerged Ideas (Prioritized)

| Rank | PR | Title | Author | Value |
|------|-----|-------|--------|-------|
| 1 | #578 | Phantom completion fix + persistent validator pool | STRML | Evidence enforcement + validator architecture |
| 2 | #334 | Document review system + workflow enforcement | obra | Maintainer's own planned direction |
| 3 | #572 | Fix session-start hang on bash 5.3+ | pds | Critical user-facing bug fix |
| 4 | #391 | Worktree CWD cleanup ordering fix | tartansandal | Real bug with detailed fix |
| 5 | #448 | reviewing-plans skill | banga87 | Fills gap in plan-to-execution pipeline |
| 6 | #508 | persistent-planning skill | zzh730 | Cross-session memory (3-file pattern) |
| 7 | #547 | Model-aware agents for OpenCode | AlexMKX | Concrete model tiering implementation |
| 8 | #380 | model-selection-for-agents skill | scottlepich-lz | Comprehensive model tiering with anti-rationalization |
| 9 | #471 | Align writing-skills with Anthropic guide | harrymunro | Official skill-authoring alignment |
| 10 | #534 | Quick mode bypass | johnwhoyou | High user demand, clean implementation |
| 11 | #585/584 | Fix SessionStart hook on Linux | atian8179/04cb | Critical Linux startup fix |
| 12 | #553 | POSIX-safe $0 for Linux hooks | jd316 | Ubuntu compatibility fix |
| 13 | #477 | SUPERPOWERS_SKIP_BOOTSTRAP env var | sjawhar | CI/automation support |
| 14 | #525 | Remove unused skills-core.js | RomarQ | Dead code cleanup |
| 15 | #235 | Phase design principles for writing-plans | talsraviv | Elegant, minimal addition |

---

## Cross-Reference with Our Skills Audit

Many of these unmerged PRs address issues we identified in our skills audit:

| Our Finding | Related PRs |
|-------------|-------------|
| H1: Phantom completion | #578 (evidence citations + validator pool) |
| H2: Brainstorming -> worktree handoff gap | #483 (restore worktree step) |
| H3: CWD bug in finishing-a-development-branch | #391 (detailed CWD ordering fix) |
| A: Model tiering (Phase 4) | #322, #380, #547 (three different approaches) |
| B: Cross-session persistence | #508, #555, #458 (three approaches to memory) |
| C: Plan review before execution | #448 (reviewing-plans skill) |
| D: Anthropic guide alignment | #471 (comprehensive alignment) |
| E: Quick bypass for trivial tasks | #534 (quick mode) |
| F: CI/automation support | #477 (skip bootstrap env var) |

---

## Statistics

- **Total unmerged PRs:** 230 (146 closed-not-merged + 84 open)
- **Accidental/spam:** ~27 PRs
- **Platform support:** ~50 PRs (across 15+ platforms)
- **Skill improvements:** ~30 PRs
- **New skills:** ~20 PRs
- **Bug fixes:** ~25 PRs
- **Infrastructure:** ~10 PRs
- **Documentation only:** ~15 PRs
- **Large/ambitious closed:** ~10 PRs
- **Other/remaining closed:** ~43 PRs
