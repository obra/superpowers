# Architecture & Design Review: Hartye-superpowers Plugin

**Review Date:** 2026-03-02
**Reviewer:** arch-reviewer (Claude Code agent)
**Scope:** Full architectural and design analysis of the h-superpowers Claude Code plugin

---

## Executive Summary

The Hartye-superpowers (forked from obra/superpowers) plugin is a well-conceived, compositionally sound system for encoding software engineering discipline into reusable, discoverable skills for Claude Code and OpenCode. The architecture follows a pragmatic layered model: a thin runtime bootstrap layer, a flat discoverable skill namespace, and a philosophy-first skill body design. The project is largely coherent and internally consistent, with notable strengths in skill design patterns and the multi-agent orchestration framework. Key gaps exist in execution-environment symmetry (the OpenCode adapter deviates from the Claude Code bootstrap approach in ways that reduce parity), in the relationship between prompt templates and their governing skills, and in the absence of a formal skill dependency/sequencing declaration mechanism.

---

## 1. Overall Project Structure and Organization

### Directory Layout

```
Hartye-superpowers/
  .claude-plugin/          # Claude Code plugin metadata
    plugin.json
    marketplace.json
  .opencode/               # OpenCode adapter
    plugins/h-superpowers.js
  agents/                  # Claude Code agent definitions
    code-reviewer.md
  commands/                # Claude Code slash commands
    brainstorm.md
    execute-plan.md
    write-plan.md
  hooks/                   # Session lifecycle hooks
    hooks.json
    session-start.sh
  lib/                     # Shared JavaScript utilities
    skills-core.js
  skills/                  # The skill library (core content)
    brainstorming/
    dispatching-parallel-agents/
    executing-plans/
    finishing-a-development-branch/
    receiving-code-review/
    requesting-code-review/
    subagent-driven-development/
    systematic-debugging/
    team-driven-development/
    test-driven-development/
    using-git-worktrees/
    using-superpowers/
    verification-before-completion/
    writing-plans/
    writing-skills/
  docs/                    # Documentation and plans
```

### Structural Assessment

**Strengths:**
- Flat skill namespace with semantic directory names prevents discovery friction. Each skill has a single authoritative `SKILL.md` entry point.
- Clear separation between plugin infrastructure (`.claude-plugin/`, `hooks/`, `lib/`) and content (`skills/`).
- Supporting files (prompt templates, reference documents) are co-located with their governing skill directory, following the "locality of reference" principle.
- The `commands/` directory provides a shallow user-facing API that delegates to skills, maintaining a clean separation between invocation surface and content.

**Gaps:**
- There is no top-level index or manifest that maps skill names to their directories. Discovery relies entirely on runtime file-system traversal in `skills-core.js`. A static `skills/index.json` would enable validation tooling and faster introspection.
- The `agents/` directory contains only one file (`code-reviewer.md`). This agent is referenced by `requesting-code-review/SKILL.md` but is architecturally distinct from the team-driven-development role templates (`team-*-prompt.md`), which live inside their skill's directory. The placement of a single agent outside the skill tree is an inconsistency.
- The OpenCode adapter (`.opencode/plugins/h-superpowers.js`) partially reimplements frontmatter parsing logic from `lib/skills-core.js` (the `extractAndStripFrontmatter` function), noting this is intentional ("avoid dependency on skills-core for bootstrap") but creating a maintenance divergence.

---

## 2. Skill Design Patterns

### Frontmatter Convention

All skills use a minimal two-field YAML frontmatter (`name`, `description`) enforced by the `writing-skills` skill's checklist. This is well-designed. The constraint to max 1024 characters and a "Use when..." description format creates a uniform CSO (Claude Search Optimization) surface. The discovery that description text affects skill invocation behavior (a workflow-summarizing description caused Claude to follow it instead of reading the skill body) is documented as institutional knowledge in `writing-skills/SKILL.md`, which is a significant design insight worth preserving prominently.

### Skill Body Structure

Skills follow a recognizable template:
1. Frontmatter
2. Overview (name + core principle in 1-2 sentences)
3. When to Use (flowchart for non-obvious decisions)
4. The Process (detailed steps, often as another flowchart)
5. Red Flags / Anti-patterns (rationalization tables)
6. Integration (dependencies on other skills)

This structure is applied with high consistency across the 15 top-level skills. The discipline-enforcing skills (TDD, systematic-debugging, verification-before-completion) all use an "Iron Law" pattern with a verbatim callout box, followed by rationalization tables listing excuses and their refutations. This is internally consistent and appears deliberate.

**Observed inconsistency:** `executing-plans/SKILL.md` lacks a "Red Flags" section present in most other skills. `dispatching-parallel-agents/SKILL.md` does not use flowcharts despite having a When to Use decision tree (it uses one, but the process section is entirely prose). `writing-plans/SKILL.md` has no Red Flags section and does not follow the flowchart-for-decisions convention.

### Trigger Description Quality

Most descriptions correctly follow the "Use when [triggering conditions]" form without workflow summary:
- `subagent-driven-development`: "Use when executing implementation plans with independent tasks in the current session" — correct
- `test-driven-development`: "Use when implementing any feature or bugfix, before writing implementation code" — correct
- `using-superpowers`: "Use when starting any conversation - establishes how to find and use skills..." — slightly violates the pattern by including what the skill does ("establishes how to find and use skills"), but this may be intentional as a bootstrapping skill

One description that may trigger prematurely:
- `brainstorming`: "You MUST use this before any creative work..." — uses imperative second-person language that the `writing-skills` skill explicitly warns against ("write in third person, injected into system prompt"). This creates a technical inconsistency in the most frequently used skill.

### Skill Size

The `writing-skills/SKILL.md` at ~650 lines is significantly longer than the recommended token budget. The `writing-skills` skill itself states "Frequently-loaded skills: <200 words total" and "Other skills: <500 words." The meta-skill that defines the rules violates the size rules it defines. This creates a bootstrapping tension that should be acknowledged explicitly.

---

## 3. Plugin Architecture

### Claude Code Integration

**Bootstrap flow:**
1. `hooks.json` declares a `SessionStart` hook matching on `startup|resume|clear|compact`
2. `session-start.sh` runs, reads `using-superpowers/SKILL.md` content, and injects it into `additionalContext` as `EXTREMELY_IMPORTANT` wrapped text
3. The agent is now aware of the skill system and the meta-skill that governs how to use all other skills
4. All subsequent skill invocations go through the `Skill` tool (Claude Code native)

This is a well-designed bootstrap that solves the cold-start problem: the agent needs to know skills exist before it can use the `Skill` tool to discover them. Injecting `using-superpowers` directly solves this cleanly.

**Concerns:**
- The hook matcher pattern `startup|resume|clear|compact` treats `compact` as a session-start event. If context compaction is frequent, this re-injects the bootstrap on every compaction, increasing token overhead per session. This may be acceptable (compaction clears context, so re-injection is needed), but deserves documentation.
- The `session-start.sh` script hardcodes a bash string-replacement JSON escaper (`escape_for_json`). This is fragile for SKILL.md content containing unusual character combinations. A more robust approach would use a JSON serializer (e.g., `node -e 'process.stdout.write(JSON.stringify(...))'`), though the current implementation handles the common cases.

### OpenCode Integration

The OpenCode adapter (`h-superpowers.js`) uses a fundamentally different injection mechanism: the `experimental.chat.system.transform` hook to append to the system prompt on every chat request. This differs from Claude Code's session-start hook approach. The adapter also duplicates frontmatter parsing logic rather than importing from `skills-core.js`.

The adapter includes a tool mapping comment block for OpenCode users (`TodoWrite` → `update_plan`, `Task` tool → OpenCode subagent system). This is pragmatic but creates a semantic coupling where the skill content assumes Claude Code tool names and the adapter patches this at runtime.

**Architectural gap:** There is no abstraction layer between skill content and execution environment. If skill content references Claude Code-specific tools (like `Skill`, `Task`, `TodoWrite`), that content is incompatible with OpenCode without the adapter's workaround. A "skill contract" convention (e.g., a frontmatter field `tools-required: [Skill, Task]`) would make this compatibility requirement explicit and allow linters to flag incompatible deployments.

### Commands Layer

The three commands (`brainstorm.md`, `execute-plan.md`, `write-plan.md`) are minimal wrappers that invoke their corresponding skills. This is the correct design: commands are invocation shortcuts, not content carriers. The `disable-model-invocation: true` flag prevents the command from being interpreted by a secondary model before delivery, which is appropriate.

**Gap:** Only 3 of the 15 skills have corresponding commands. The selection (brainstorming, writing-plans, executing-plans) is reasonable for "most-commonly invoked explicitly" skills, but there is no documented rationale for why these three were promoted to commands while others (e.g., `subagent-driven-development`, `systematic-debugging`) were not. A `commands/README.md` with selection criteria would improve maintainability.

---

## 4. Separation of Concerns

### Skills vs Agents vs Commands

The three artifact types represent distinct concerns:
- **Skills**: Reusable process documentation loaded on demand
- **Agents**: Persistent role definitions spawned as subagents
- **Commands**: User-facing invocation shortcuts

The separation is mostly clean. However, the `requesting-code-review/SKILL.md` references a `code-reviewer.md` template and also the `agents/code-reviewer.md` agent, creating two parallel code-reviewer artifacts. The skill dispatches a "h-superpowers:code-reviewer subagent" but this maps to the `agents/code-reviewer.md` file. Meanwhile `requesting-code-review/code-reviewer.md` is a prompt template for the subagent invocation. These two files serve different roles (agent definition vs dispatch template) but are named similarly and co-located in separate trees, which may cause confusion.

### Hooks vs Skills

The `session-start.sh` hook correctly handles only the bootstrap concern (injecting `using-superpowers`). It does not attempt to inject all skills or enforce workflows — that responsibility belongs to the `using-superpowers` skill content itself. This is a good separation.

### Prompt Templates

The subagent-driven-development skill stores three prompt templates as `.md` files:
- `implementer-prompt.md`
- `spec-reviewer-prompt.md`
- `code-quality-reviewer-prompt.md`

The team-driven-development skill stores three role templates:
- `team-lead-prompt.md`
- `team-implementer-prompt.md`
- `team-reviewer-prompt.md`

These templates are co-located with their governing skill, which is correct. However, they are not formally declared as skill artifacts — `lib/skills-core.js` only processes `SKILL.md` files. If a user invokes the `Skill` tool looking for `subagent-driven-development`, they get the orchestration instructions but must know to look for prompt templates via relative path references in the skill body. A frontmatter declaration like `templates: [./implementer-prompt.md, ...]` would make these discoverable and verifiable.

---

## 5. Extensibility

### Adding New Skills

The process for adding a new skill is:
1. Create a directory under `skills/`
2. Create `SKILL.md` with frontmatter
3. Follow the `writing-skills` checklist for TDD-based skill development

This is discoverable and low-friction. The `findSkillsInDir()` function in `skills-core.js` automatically discovers new skills without configuration changes. The personal skill override mechanism (`resolveSkillPath()` preferring personal skills over plugin skills) provides a correct precedence model for customization.

**Concerns:**
- There is no validation step that ensures a newly added skill meets the structural requirements (frontmatter, description format, required sections). The `writing-skills` skill defines a checklist but it is advisory. A CI check or linting script that validates skill structure would close this gap.
- The `maxDepth = 3` limit in `findSkillsInDir()` prevents skills nested deeper than 3 levels from being discovered. This is generally sufficient but is an undocumented constraint on skill organization.
- Skill versioning is implicit in the plugin version (`plugin.json` shows `4.3.0`), but individual skills have no version fields. If a user has personal skills that shadow plugin skills, there is no mechanism to detect that the plugin skill has been updated with breaking changes.

### Personal Skill Override

The shadowing mechanism (personal skills in `~/.claude/skills` override plugin skills by name) is architecturally clean. The explicit `h-superpowers:` prefix bypass allows users to force-load a plugin skill when they have a personal override, which is the right escape hatch.

---

## 6. Consistency Across Skill Types

### Discipline-Enforcing Skills (TDD, Verification, Debugging)

These three skills share the strongest internal consistency: Iron Law callout, rationalization table, Red Flags section, real-world impact data. They apply the same psychological framework (Cialdini's persuasion principles, as referenced in `writing-skills/persuasion-principles.md`) consistently.

### Workflow Skills (Brainstorming, Writing Plans, Executing Plans, Subagent-Driven, Team-Driven)

These are consistently structured with flowcharts for decision points and process flows. The handoff patterns are explicit: brainstorming → writing-plans → (subagent-driven | executing-plans) → finishing-a-development-branch. This "required sub-skill" pattern with explicit integration sections creates a navigable graph.

**Inconsistency:** `writing-plans/SKILL.md` tells the agent to present two execution options to the user ("Subagent-Driven" vs "Parallel Session") but does not mention `team-driven-development` as a third option. This omission is logically inconsistent with the README, which lists all three approaches as parallel alternatives at step 4 of the basic workflow.

### Multi-Agent Skills (Subagent-Driven, Team-Driven, Dispatching-Parallel)

These three skills form a coherent taxonomy of multi-agent patterns:
- `dispatching-parallel-agents`: Concurrent independent subagents, no coordination
- `subagent-driven-development`: Sequential subagents with hub-and-spoke quality gates
- `team-driven-development`: Persistent collaborative agents with peer-to-peer messaging

The decision flowcharts in each skill direct users toward the appropriate alternative, creating a mutually-referential but non-circular skill graph. This is well-designed.

**Gap:** `dispatching-parallel-agents` is primarily framed as a debugging/bug-fix tool ("When you have multiple unrelated failures...") despite being a general parallel execution primitive. The description and framing underrepresent its applicability to non-debugging scenarios (e.g., parallel feature research, parallel test generation). This limits its discoverability for non-debugging use cases.

---

## 7. Architectural Gaps and Redundancies

### Gap 1: Skill Dependency Graph is Implicit

The integration sections of each skill declare dependencies textually ("REQUIRED: h-superpowers:using-git-worktrees") but this graph has no machine-readable representation. There is no tooling to:
- Detect cycles in skill dependencies
- Validate that referenced skills exist
- Generate a dependency graph for documentation
- Warn when a required sub-skill is not installed

### Gap 2: No Skill Lifecycle Events

The system has a session-start hook but no skill-invocation hooks. There is no way to intercept skill invocations for telemetry, audit logging, or skill-specific setup (e.g., automatically creating a worktree when `subagent-driven-development` is invoked without one). This limits observability.

### Gap 3: Team-Driven Development Lacks Infrastructure Code

The `team-driven-development` skill describes a `~/.claude/teams/<team-name>/` directory structure with `tasks.json` and per-agent inbox files, but there are no utilities in `lib/` or `skills/` to create, read, or manage this structure. The skill assumes this infrastructure will be created manually or by the agent at runtime. Given the complexity of multi-agent coordination, this is a significant gap — the absence of initialization tooling (even a simple shell script) means agents must reconstruct the shared state protocol from the skill documentation at each invocation.

### Gap 4: OpenCode Tool-Name Mismatch Has No Compile-Time Check

The adapter's tool mapping comment is documentation, not enforcement. An agent running in OpenCode that follows a skill's `TodoWrite` instruction literally will fail at runtime. There is no mechanism to detect this mismatch before the agent attempts the tool call.

### Redundancy: Two Frontmatter Parsers

`lib/skills-core.js` (`extractFrontmatter`) and `.opencode/plugins/h-superpowers.js` (`extractAndStripFrontmatter`) both parse YAML frontmatter from skill files. The rationale (avoid importing `skills-core.js` in the OpenCode bootstrap) is noted in code comments, but if the frontmatter format ever evolves, both parsers must be updated. This is the only significant implementation redundancy in the project.

---

## 8. Multi-Agent Skill Relationships

The three multi-agent skills represent distinct coordination models that sit on a cost/coordination continuum:

```
Cost:        Low                              High
Coordination: None        Hub-Spoke       Peer-to-Peer
              |               |                |
    dispatching-parallel   subagent-driven  team-driven
    -agents               -development     -development
```

### Relationship to Core Workflow

All three integrate with the same upstream (`writing-plans`) and downstream (`finishing-a-development-branch`) skills. They are interchangeable at position 4 in the basic workflow, which is architecturally clean.

### Subagent-Driven vs Team-Driven

These two skills are the most architecturally significant. `subagent-driven-development` uses a fixed 3-role structure (implementer, spec-reviewer, code-quality-reviewer) that is deterministic and stateless. `team-driven-development` uses a flexible N-role structure with persistent state (the shared task list and inboxes), requiring more orchestration but enabling emergent coordination.

The documentation (`comparison-agent-teams-vs-subagents.md`) provides an excellent decision matrix. The `team-driven-development` skill correctly marks itself as experimental, requires an environment variable opt-in, and warns about cost multipliers. This is responsible experimental feature design.

**Architectural concern:** The `team-driven-development` skill instructs the lead agent to manage the shared task list (`tasks.json`) manually, which conflates orchestration logic with data management. If multiple agents attempt concurrent writes to `tasks.json`, there is a race condition. The skill's "Red Flags" section warns "Never: Let agents claim same task (race condition)" but offers no locking mechanism. This is a known limitation that should be documented more prominently with explicit guidance on how to implement task locking (e.g., atomic file rename, file locking, or lead-agent-mediated assignments only).

### Writing-Plans Integration Gap

The `writing-plans` skill's execution handoff only mentions two options (subagent-driven, executing-plans) without mentioning `team-driven-development` or `dispatching-parallel-agents`. This means the natural entry point for plan execution is incomplete as a decision hub. When a user arrives at `writing-plans` output, they are offered a binary choice that does not reflect the full taxonomy of execution options.

---

## 9. Summary Findings

### Finding 1: The Skill Design Pattern is Strong but Inconsistently Applied

The core skill design pattern (frontmatter with CSO-optimized description, Iron Law for discipline skills, flowcharts for non-obvious decisions, rationalization tables, Red Flags, Integration section) is well-conceived and empirically grounded. However, its application is uneven across skills. The discipline-enforcing skills (TDD, debugging, verification) apply the full pattern rigorously. The workflow skills (writing-plans, executing-plans) are more permissive. A formal skill "schema" document (not just the writing-skills checklist) with mandatory vs optional sections would reduce this variance.

### Finding 2: The Execution Environment Abstraction is Incomplete

The plugin targets two execution environments (Claude Code and OpenCode) that have different tool surfaces. The current approach is to patch the difference at the bootstrap level (OpenCode adapter's tool mapping comment) and assume agents will interpret it correctly at runtime. This creates a latent incompatibility that will surface unpredictably when agents follow Claude Code-specific instructions in OpenCode environments. A more robust design would either: (a) maintain separate skill variants per environment, (b) introduce a tool-abstraction layer in the skill content (e.g., `[TASK_TOOL]` as a substitution placeholder), or (c) add runtime tool availability checking in the adapter.

### Finding 3: Team-Driven Development Lacks Supporting Infrastructure

The `team-driven-development` skill is the most architecturally ambitious component but has the weakest supporting infrastructure. It describes a file-based shared state model (tasks.json, inbox files) that agents must construct manually, a race condition risk with no locking guidance, and no initialization utilities. For a feature explicitly marked as experimental, the gap between the skill's described behavior and the infrastructure available to support it is the largest single risk in the project. This does not make the skill unusable, but it increases the probability of agent failure during team coordination without clear recovery paths.

---

## Recommendations (Prioritized)

**High Priority:**
1. Update `writing-plans/SKILL.md`'s execution handoff section to include `team-driven-development` as a third execution option, making the decision hub complete.
2. Add a locking strategy to `team-driven-development/SKILL.md` (e.g., recommend lead-only task assignment rather than agent self-claiming, which eliminates the race condition entirely).
3. Move `agents/code-reviewer.md` into `skills/requesting-code-review/` or establish a clear convention for when agent definitions live in `agents/` vs skill subdirectories.

**Medium Priority:**
4. Add a `skill-validator.js` to `lib/` that checks SKILL.md files for required frontmatter, description format, and word count targets.
5. Expand `dispatching-parallel-agents/SKILL.md` description and framing to cover non-debugging parallel use cases.
6. Create a team initialization script (shell or Node.js) under `skills/team-driven-development/` that creates the `~/.claude/teams/<name>/` directory structure, replacing the manual file creation burden on agents.
7. Fix the `brainstorming/SKILL.md` description to use third-person form per the `writing-skills` convention.

**Low Priority:**
8. Add a static `skills/index.json` for tooling and validation use.
9. Document the OpenCode tool name mismatch risk in `docs/README.opencode.md`.
10. Add a note to `writing-skills/SKILL.md` acknowledging the self-referential irony that the meta-skill exceeds the word count targets it defines for other skills.

---

*This review was produced by reading all specified files without modifying any project files.*
