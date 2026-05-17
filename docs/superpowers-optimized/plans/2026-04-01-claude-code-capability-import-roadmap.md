# Claude Code Capability Import Roadmap for Superpowers-Optimized

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers-optimized:subagent-driven-development` for implementation, or `superpowers-optimized:executing-plans` if work must stay inline. This document is intentionally design-heavy because the main risk is importing the wrong abstractions, not missing code volume.

**Goal:** Import the small set of Claude Code capabilities that materially improve Superpowers-Optimized without trying to recreate Claude Code itself.
**Architecture:** Treat Superpowers-Optimized as a workflow layer, not a runtime clone. Add narrowly scoped capabilities only where Claude Code exposes a proven pattern that fits the plugin's hook, skill, and agent model. Keep all platform-specific behavior capability-gated and documented per platform.
**Tech Stack:** Markdown skills and agents, Node.js hook scripts, hook registries, Claude/Codex platform docs, existing Claude Code headless tests, platform-specific manifests.
**Assumptions:**
- Superpowers-Optimized remains a plugin/workflow layer, not a standalone agent runtime. This roadmap will NOT work if the goal changes to "rebuild Claude Code internals inside the plugin."
- Claude remains the reference platform for full hook behavior today. This roadmap will NOT work if Codex parity is treated as a guaranteed starting assumption.
- New capability imports must preserve the plugin's existing constraints: no dependencies, no hidden databases, cross-platform behavior where practical, and no parallel memory systems by accident.

---

## Executive Summary

The problem is real, but the original temptation is too broad. Claude Code is a full agent runtime with its own tool registry, hook engine, instruction loader, plan mode, plugin system, and agent model. Superpowers-Optimized is not that. It is a workflow overlay that adds memory, routing, safeguards, and higher-discipline operating procedures. That distinction must stay intact.

The worthwhile import set is narrow:

1. **Codex parity, but only if the platform now supports the necessary hooks**
2. **A read-only Explore agent and an evidence-driven Verification agent**
3. **A skill-capture workflow inspired by `skillify`**
4. **Use of richer Claude hook events where they tighten context freshness**
5. **An optional memory reconciliation skill, only if memory boundaries are made explicit first**

The correct implementation posture is:

- Proceed with items 1 through 4 only if they remain narrow.
- Treat item 1 as a discovery-and-gating project first, not as an implementation assumption.
- Treat item 5 as optional and lowest priority.
- Explicitly reject any work that starts pulling Claude Code runtime concerns into the plugin: tool registry parity, query-engine parity, permission-engine parity, MCP parity, or plan-mode/runtime cloning.

## Premise Check

### 1. Does the problem actually exist, or is it already solved?

Partially yes.

- **Codex parity gap:** real. The repo currently documents Codex primarily as skill discovery, and [`hooks/codex-hooks.json`](/mnt/c/Users/Tjerk%20Pieksma/Documents/Github/superpowers-optimized/superpowers-optimized/hooks/codex-hooks.json) only wires `SessionStart`, while Claude wiring in [`hooks/hooks.json`](/mnt/c/Users/Tjerk%20Pieksma/Documents/Github/superpowers-optimized/superpowers-optimized/hooks/hooks.json) is much broader.
- **Explore and verification role gap:** real. The current repo has [`agents/code-reviewer.md`](/mnt/c/Users/Tjerk%20Pieksma/Documents/Github/superpowers-optimized/superpowers-optimized/agents/code-reviewer.md) and [`agents/red-team.md`](/mnt/c/Users/Tjerk%20Pieksma/Documents/Github/superpowers-optimized/superpowers-optimized/agents/red-team.md), but not a fast read-only codebase scout or a verification-specific pre-completion agent.
- **Workflow capture gap:** real. Superpowers is explicitly a skill framework, but it lacks a first-class path for turning successful sessions into reusable skills.
- **Hook freshness gap:** real on Claude, but the right use is incremental freshness, not auto-regenerating everything on every event.
- **Memory reconciliation gap:** only partially real. The repo already has a coherent file-based memory system. A remember-style import is justified only if there is demonstrated drift between project instructions, episodic memory, and platform memory.

### 2. Is the proposed solution proportional to the problem?

Only if each item stays narrow.

- **Proportional:** capability-gated Codex parity, two focused agents, one capture skill, and 2-3 narrowly defined new hook flows.
- **Not proportional:** attempting to import Claude Code's runtime machinery or turning Superpowers into a second orchestration engine.

### 3. What is the cost of NOT building this?

- **Not building Codex parity:** Codex remains a second-class platform; users get skills but not most of the workflow automation that makes the plugin valuable.
- **Not building Explore/Verification agents:** the workflow remains usable, but exploration and pre-completion verification stay less specialized and more error-prone.
- **Not building skill capture:** repeatable workflows continue to be manually rediscovered and manually authored.
- **Not building richer hooks:** memory freshness remains more session-bound and more reliant on manual discipline.
- **Not building remember-style reconciliation:** acceptable if memory boundaries remain clear; expensive only if drift becomes common.

## Sequencing Principle

Implement in the original recommended order, but with one correction:

1. **Codex capability discovery and gated parity**
2. **Explore agent**
3. **Verification agent**
4. **Skill capture (`skillify`-style)**
5. **Richer Claude hook surface**
6. **Optional memory reconciliation**

This is the right order because item 1 determines whether "cross-platform parity" is even a real project, and items 2 through 4 deliver value without requiring runtime surgery.

## Initiative 1: Codex Capability-Gated Hook Parity

### Recommendation

Proceed, but only as a gated project. Do **not** promise parity before proving the platform surface exists.

### Why implement this in Superpowers-Optimized

This is the most leverage-heavy gap. If Codex users only receive session-start injection while Claude users receive prompt routing, edit tracking, stop reminders, safety hooks, and compression, then the plugin is effectively two different products with the same branding. That is a real product problem.

### Why this is still not "recreate Claude Code"

The goal is not runtime parity. The goal is to wire the plugin into whatever Codex-native lifecycle the platform actually exposes, and to clearly document the unsupported remainder.

### Implementation approach

#### Phase 1A: Capability discovery

Build a capability matrix first:

- Which hook events does current Codex expose, if any beyond `SessionStart`?
- What is the payload shape for each event?
- Are matchers supported or only whole-event handlers?
- Can hooks mutate tool input/output, or only log/block?
- Are subagent lifecycle events exposed?

**Stop condition:** if the platform still only supports `SessionStart`, stop the parity project there and update docs to say so explicitly. Do not fake parity by inventing polling scripts or background daemons.

#### Phase 1B: Minimum viable parity

Only if supported, wire the highest-value flows first:

- `UserPromptSubmit` -> [`hooks/skill-activator.js`](/mnt/c/Users/Tjerk%20Pieksma/Documents/Github/superpowers-optimized/superpowers-optimized/hooks/skill-activator.js)
- `PostToolUse(Edit|Write)` -> [`hooks/track-edits.js`](/mnt/c/Users/Tjerk%20Pieksma/Documents/Github/superpowers-optimized/superpowers-optimized/hooks/track-edits.js)
- `Stop` -> [`hooks/stop-reminders.js`](/mnt/c/Users/Tjerk%20Pieksma/Documents/Github/superpowers-optimized/superpowers-optimized/hooks/stop-reminders.js)

Do **not** start with compression or deep safety ordering until the basic lifecycle is proven.

#### Phase 1C: Safety and ergonomics parity

Only after the minimum viable parity works:

- `PreToolUse(Bash)` -> dangerous command blocking
- `PreToolUse(Read|Edit|Write|Bash)` -> secret protection
- `PreToolUse(Bash)` -> bash compression, last in order so earlier blockers still win
- `SubagentStop` -> subagent guard, if the event exists

### Files and linked surfaces to check together

- [`hooks/codex-hooks.json`](/mnt/c/Users/Tjerk%20Pieksma/Documents/Github/superpowers-optimized/superpowers-optimized/hooks/codex-hooks.json)
- [`docs/platforms/codex.md`](/mnt/c/Users/Tjerk%20Pieksma/Documents/Github/superpowers-optimized/superpowers-optimized/docs/platforms/codex.md)
- [`README.md`](/mnt/c/Users/Tjerk%20Pieksma/Documents/Github/superpowers-optimized/superpowers-optimized/README.md)
- [`RELEASE-NOTES.md`](/mnt/c/Users/Tjerk%20Pieksma/Documents/Github/superpowers-optimized/superpowers-optimized/RELEASE-NOTES.md)
- [`tests/skill-triggering/run-test.sh`](/mnt/c/Users/Tjerk%20Pieksma/Documents/Github/superpowers-optimized/superpowers-optimized/tests/skill-triggering/run-test.sh) plus any new Codex-specific smoke harness

If any platform-facing claim changes, also verify manifest/version sync:

- [`.claude-plugin/plugin.json`](/mnt/c/Users/Tjerk%20Pieksma/Documents/Github/superpowers-optimized/superpowers-optimized/.claude-plugin/plugin.json)
- [`.cursor-plugin/plugin.json`](/mnt/c/Users/Tjerk%20Pieksma/Documents/Github/superpowers-optimized/superpowers-optimized/.cursor-plugin/plugin.json)
- [`.codex-plugin/plugin.json`](/mnt/c/Users/Tjerk%20Pieksma/Documents/Github/superpowers-optimized/superpowers-optimized/.codex-plugin/plugin.json)
- [`VERSION`](/mnt/c/Users/Tjerk%20Pieksma/Documents/Github/superpowers-optimized/superpowers-optimized/VERSION)

### Risks and gaps

- The biggest risk is building against an imagined Codex hook API.
- The second risk is partial parity that changes behavior without updating docs, causing support confusion.
- The third risk is ordering drift between Claude and Codex safety hooks.

### Expected impact

- Best case: Codex becomes a first-class platform for the plugin.
- Worst acceptable case: the discovery phase proves the platform gap is still real, and the repo becomes more honest and better documented.

## Initiative 2: Add an Explore Agent

### Recommendation

Proceed. This is a clean fit.

### Why implement this in Superpowers-Optimized

Superpowers already leans heavily on structured workflows, map generation, and scoped exploration. A fast, read-only exploration agent complements that model without competing with it. The current agent set is biased toward review and adversarial analysis after code exists; it is weaker at early-stage codebase interrogation.

### Implementation approach

Add a new agent file, likely [`agents/explore.md`](/mnt/c/Users/Tjerk%20Pieksma/Documents/Github/superpowers-optimized/superpowers-optimized/agents/explore.md), with three hard properties:

- **Read-only behavior**: no edits, no write commands, no repo mutations
- **Fast path bias**: optimize for search, reading, and concise factual output
- **Explicit use case**: codebase discovery, file finding, implementation tracing, architecture questions

Do not make this a generic helper. Claude Code's built-in Explore works because it is deliberately constrained. Replicate the constraint, not the branding.

### Linked files and workflow fallout

- Add the agent file itself under `agents/`
- Update [`skills/using-superpowers/SKILL.md`](/mnt/c/Users/Tjerk%20Pieksma/Documents/Github/superpowers-optimized/superpowers-optimized/skills/using-superpowers/SKILL.md) if you want routing guidance to mention when to use it
- Update [`skills/subagent-driven-development/SKILL.md`](/mnt/c/Users/Tjerk%20Pieksma/Documents/Github/superpowers-optimized/superpowers-optimized/skills/subagent-driven-development/SKILL.md) and [`skills/dispatching-parallel-agents/SKILL.md`](/mnt/c/Users/Tjerk%20Pieksma/Documents/Github/superpowers-optimized/superpowers-optimized/skills/dispatching-parallel-agents/SKILL.md) if they enumerate agent roles
- Update docs if agent inventory is described anywhere

### Risks and gaps

- If the prompt is too broad, it becomes redundant with the main agent.
- If it is not explicitly read-only, it can silently become an implementation agent and overlap with the main workflow.
- If it is routed too aggressively, it will create overhead on tasks that do not need delegation.

### Expected impact

- Faster and safer source-map building
- Cleaner separation between "find and explain" and "change code"
- Better fit for parallel exploration in large repos

## Initiative 3: Add a Verification Agent

### Recommendation

Proceed, but position it carefully relative to the existing `code-reviewer` and `red-team` agents.

### Why implement this in Superpowers-Optimized

This fills a real gap between review and execution. The existing `verification-before-completion` skill is process guidance. A verification agent would be an execution role that tries to break completed work with commands and evidence before the main agent claims completion.

### Implementation approach

Add a new agent file, likely [`agents/verification.md`](/mnt/c/Users/Tjerk%20Pieksma/Documents/Github/superpowers-optimized/superpowers-optimized/agents/verification.md), with these constraints:

- **Verification-only**: cannot edit project files
- **Evidence-first**: every conclusion tied to a command or reproducible probe
- **Adversarial baseline**: must run at least one break-oriented probe, not just happy-path checks

Do not collapse this into `code-reviewer` or `red-team`.

- `code-reviewer` is a review/finding role
- `red-team` is failure-scenario generation
- `verification` should be execution-based validation against actual behavior

### Linked files and workflow fallout

- Add the new agent under `agents/`
- Update [`skills/verification-before-completion/SKILL.md`](/mnt/c/Users/Tjerk%20Pieksma/Documents/Github/superpowers-optimized/superpowers-optimized/skills/verification-before-completion/SKILL.md) to either recommend or require it for larger tasks
- Re-check [`skills/requesting-code-review/SKILL.md`](/mnt/c/Users/Tjerk%20Pieksma/Documents/Github/superpowers-optimized/superpowers-optimized/skills/requesting-code-review/SKILL.md) so review and verification are not conflated
- Update any subagent-routing docs that describe available roles

### Risks and gaps

- The main failure mode is duplicating review instead of verifying behavior.
- A second failure mode is making the verification prompt so strict that it becomes unusable in low-infrastructure repos.
- A third failure mode is not defining when to prefer `verification` versus `code-reviewer` versus `red-team`, which creates role confusion.

### Expected impact

- More honest completion claims
- Better pre-merge confidence for non-trivial tasks
- Lower rate of "tests pass, but behavior is still wrong" failures

## Initiative 4: Add a `skillify`-Style Workflow Capture Skill

### Recommendation

Proceed. This is one of the best conceptual matches in the entire import set.

### Why implement this in Superpowers-Optimized

Superpowers is already a skill-centric system. Right now it has excellent authored skills, but a weak path for converting newly discovered successful workflows into reusable assets. Claude Code's `skillify` concept maps directly onto the plugin's reason to exist.

### Implementation approach

Create a new skill, likely under `skills/skill-capture/` or `skills/skillify/`, but keep scope tight:

- Start as a **user-invoked** workflow, not an always-on auto-generator
- Make it review-first: propose the generated skill content before writing
- Support both repo-local and personal destinations only if the target platform supports those paths cleanly; otherwise keep repo-local first
- Reuse the session's concrete evidence: user prompts, workflow steps, corrections, required tools, and success criteria

The import target is not Claude Code's exact UI flow. The target is the idea of "promote a successful repeated workflow into a reusable skill with human review."

### Linked files and workflow fallout

- New skill directory under `skills/`
- Update [`hooks/skill-rules.json`](/mnt/c/Users/Tjerk%20Pieksma/Documents/Github/superpowers-optimized/superpowers-optimized/hooks/skill-rules.json) for discoverability
- Update [`skills/using-superpowers/SKILL.md`](/mnt/c/Users/Tjerk%20Pieksma/Documents/Github/superpowers-optimized/superpowers-optimized/skills/using-superpowers/SKILL.md) if you want it routed explicitly
- Update platform docs to explain where generated skills should live on Claude vs Codex
- Add triggering tests and content tests

### Risks and gaps

- Auto-capturing too aggressively would create low-quality skills and repo clutter.
- Cross-platform save paths are a real complexity trap; do not overbuild this.
- If the generated skill format does not match existing repo conventions, it becomes a maintenance burden instead of a productivity win.

### Expected impact

- Lower cost of turning ad hoc workflows into durable assets
- Faster compounding of user-specific and repo-specific process knowledge
- Stronger long-term differentiation for the plugin

## Initiative 5: Use Richer Claude Hook Events for Context Freshness

### Recommendation

Proceed on Claude first, but keep behavior narrow. Do **not** auto-regenerate memory artifacts on every event.

### Why implement this in Superpowers-Optimized

The repo's current memory model is strong at session start and end, but weaker in the middle of long-running sessions where instructions change, the working directory changes, or a large set of files changes. Claude Code exposes `InstructionsLoaded`, `CwdChanged`, and `FileChanged`; Superpowers should use those only where they materially improve freshness.

### Correct scope

The goal is not "hook more things because hooks exist." The goal is:

- mark relevant context as stale sooner
- refresh narrow snapshots when the environment changes
- reduce reliance on the model remembering to manually re-check context

### Implementation approach

#### `InstructionsLoaded`

Use this to track and summarize instruction changes, not to rebuild memory.

- detect which instruction files were loaded or changed
- update a lightweight freshness marker or note
- optionally surface a concise reminder when project instructions changed materially

#### `CwdChanged`

Use this to refresh repo-local context boundaries.

- re-run a narrow version of the context engine for the new working directory
- refresh changed-file scope and recent-commit context
- avoid re-injecting the whole memory stack mid-session

#### `FileChanged`

Use this for incremental staleness, not auto-maintenance.

- mark `project-map.md` as potentially stale if hot structural files changed
- update or append lightweight context snapshots if useful
- do **not** rewrite `project-map.md` on every edit
- do **not** append to `known-issues.md` automatically without a solved error

### Linked files and workflow fallout

- [`hooks/hooks.json`](/mnt/c/Users/Tjerk%20Pieksma/Documents/Github/superpowers-optimized/superpowers-optimized/hooks/hooks.json)
- likely new scripts under `hooks/` for these events, or new modes inside [`hooks/context-engine.js`](/mnt/c/Users/Tjerk%20Pieksma/Documents/Github/superpowers-optimized/superpowers-optimized/hooks/context-engine.js)
- [`docs/architecture/project-memory.md`](/mnt/c/Users/Tjerk%20Pieksma/Documents/Github/superpowers-optimized/superpowers-optimized/docs/architecture/project-memory.md)
- [`README.md`](/mnt/c/Users/Tjerk%20Pieksma/Documents/Github/superpowers-optimized/superpowers-optimized/README.md)
- tests for hook behavior and any documented guarantees

Also re-check:

- [`hooks/track-edits.js`](/mnt/c/Users/Tjerk%20Pieksma/Documents/Github/superpowers-optimized/superpowers-optimized/hooks/track-edits.js)
- [`hooks/stop-reminders.js`](/mnt/c/Users/Tjerk%20Pieksma/Documents/Github/superpowers-optimized/superpowers-optimized/hooks/stop-reminders.js)
- [`hooks/track-session-stats.js`](/mnt/c/Users/Tjerk%20Pieksma/Documents/Github/superpowers-optimized/superpowers-optimized/hooks/track-session-stats.js)

because new hook events often create silent drift in metrics, reminders, and freshness assumptions.

### Risks and gaps

- Over-eager hooks can create noise, token churn, and file churn.
- Mid-session context mutation can become confusing if not clearly bounded.
- Automatic `project-map.md` maintenance sounds attractive but is likely the wrong tradeoff unless the update rules are extremely strict.

### Expected impact

- Fresher context during long sessions
- Less dependence on manual "re-read the environment" discipline
- Better alignment between the memory model and Claude's actual event surface

## Initiative 6: Optional `remember`-Style Memory Reconciliation

### Recommendation

Do not build this until the first four initiatives are complete and there is evidence of memory drift that the current system does not handle cleanly.

### Why this is optional

Superpowers already has a coherent memory architecture: `project-map.md`, `session-log.md`, `state.md`, `known-issues.md`, plus project instructions. A remember-style import is only justified if there is a real classification problem between "durable instruction," "temporary state," "episodic history," and "error memory."

### Implementation approach

If built, it should start as a **read-only reconciliation skill**:

- review current memory artifacts and instruction files
- propose promotions, demotions, deduplications, or conflict resolution
- require explicit user approval before any write

Do not build automatic memory promotion first. That is exactly how overlapping memory systems become incoherent.

### Linked files and workflow fallout

- new skill under `skills/`
- likely coordination with [`skills/context-management/SKILL.md`](/mnt/c/Users/Tjerk%20Pieksma/Documents/Github/superpowers-optimized/superpowers-optimized/skills/context-management/SKILL.md)
- docs update in [`docs/architecture/project-memory.md`](/mnt/c/Users/Tjerk%20Pieksma/Documents/Github/superpowers-optimized/superpowers-optimized/docs/architecture/project-memory.md)
- likely platform-doc clarification about which memory layer owns which kind of fact

### Risks and gaps

- Highest risk in the whole roadmap: duplicating or contradicting the existing memory model.
- Without explicit memory ownership rules, this feature will create confusion instead of reducing it.

### Expected impact

- Useful only if memory drift is already hurting users.
- Otherwise, this should remain unbuilt.

## Cross-Cutting Checks Required for Every Initiative

Whenever one initiative ships, check these adjacent surfaces before calling it complete:

- **Docs:** `README.md`, platform docs, architecture docs, release notes
- **Tests:** Claude skill tests, trigger tests, and any platform-specific smoke tests
- **Routing:** `skills/using-superpowers/SKILL.md`, `hooks/skill-rules.json`, any skill that enumerates workflow order or agent roles
- **Agent safety:** ensure new agents are role-bounded and do not accidentally become generic helpers
- **Hook ordering:** blockers before transformers, safety before compression
- **Stats/telemetry:** if hook behavior changed, verify whether session stats or reminders should change too
- **Versioning:** if behavior is released publicly, sync manifest versions and `VERSION`
- **Cross-platform behavior:** Linux/Windows path handling, shell quoting, and repo-root assumptions

## What Not to Build

Explicitly reject these unless the product goal changes:

- Claude Code query-engine parity
- Claude Code tool-registry parity
- Claude Code permission-engine parity
- Claude Code MCP/plugin-loader parity
- Claude Code plan-mode runtime cloning
- Automatic memory promotion without user review
- Automatic `project-map.md` rewriting on every file change

## Final Recommendation

Build **four** things, in order:

1. Codex capability discovery, then parity only where supported
2. Explore agent
3. Verification agent
4. Skill-capture workflow

Then, and only then:

5. Add narrow Claude hook freshness improvements
6. Reassess whether memory reconciliation is still worth building

That is the proportional path. It solves real gaps, respects the plugin's existing architecture, and avoids turning Superpowers-Optimized into a bad partial clone of Claude Code.
