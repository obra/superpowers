---
artifact: feature-stories
project: "Claude Code Scaffolding Platform"
date: "2026-02-19"
status: approved
phase: D
persona: "Milind - The Strategic Builder"
---

# Feature Stories: Claude Code Scaffolding Platform

## Feature Index

| ID | Feature | Priority | Complexity | User Stories | Journey Phases |
|---|---|---|---|---|---|
| FS-001 | Auto-Scaffolding Engine | Must Have | L | US-001, US-013, US-017, US-018 | A: Problem Understanding, D: Requirements Synthesis |
| FS-002 | PM Discovery Module | Must Have | XL | US-002 | A: Problem Understanding |
| FS-003 | Judgment Gate System | Must Have | XL | US-003, US-010, US-012, US-016 | C: User Deep Dive, E: Artifact Review |
| FS-004 | SDLC Orchestration Agent | Must Have | XL | US-004, US-009, US-011, US-015 | D: Requirements Synthesis, E: Artifact Review, F: Handoff |
| FS-005 | Context Management System | Must Have | L | US-005, US-006 | D: Requirements Synthesis |
| FS-006 | Knowledge Compounding Engine | Should Have | M | US-007 | F: Handoff |
| FS-007 | Plugin Composition Framework | Should Have | L | US-008 | D: Requirements Synthesis |
| FS-008 | CI/CD Integration | Could Have | M | US-014 | F: Handoff |

---

## Features

### FS-001: Auto-Scaffolding Engine

**Description:** Generates complete, opinionated-but-overridable project scaffolding based on project type templates. Supports multiple project types (software dev, Claude Code plugins, courses, content, business operations), preview/dry-run mode, and user-defined customizations. This is the entry point for the platform — the first thing every user touches.
**Priority:** Must Have
**Estimated Complexity:** L

**User Stories:** US-001, US-013, US-017, US-018
**Personas:** milind-strategic-builder
**Journey Phases:** A: Problem Understanding, D: Requirements Synthesis

**Functional Requirements:**
- FR-1: Accept a project type parameter and generate the corresponding directory structure, config files, agent definitions, and skill manifests from a type-specific template.
- FR-2: Support at least 4 project types at launch: software development, Claude Code plugin, course development, and content writing.
- FR-3: Generate a populated CLAUDE.md with project-specific context derived from the user's project description, not generic placeholders.
- FR-4: Generate dependency manifests (package.json, requirements.txt, etc.) appropriate to the project type and optionally run install.
- FR-5: Support a `--dry-run` flag that outputs a tree preview of what would be generated without creating any files.
- FR-6: Accept override configuration (via flags or `.scaffoldrc` config file) to add, remove, or modify directories and files in the generated structure.
- FR-7: Detect conflicts between user overrides and template requirements and warn before proceeding.
- FR-8: Support user-defined project type templates — adding a new template directory makes the type available without code changes.
- FR-9: Handle unknown project types by generating generic scaffolding based on the closest matching type with clear flags indicating which parts are generic.

**Non-Functional Requirements:**
- NFR-1: Scaffolding generation must complete in under 30 seconds for any project type, excluding dependency installation.
- NFR-2: Generated scaffolding must be immediately functional — running `claude` in the generated project should recognize all skills and commands without additional configuration.
- NFR-3: Template format must be documented well enough that a developer can create a new project type template in under 1 hour.

**Dependencies:** None (this is the foundation module)

**Acceptance Criteria:**
1. **Given** a user specifies "claude-code-plugin" as the project type with a one-line description, **When** scaffolding runs, **Then** it generates a fully populated project with CLAUDE.md, skills/, commands/, agents/, hooks/, templates/, docs/, and package.json — all containing project-specific content, not template placeholders.
2. **Given** a user runs scaffolding with `--dry-run`, **When** the preview is displayed and the user confirms, **Then** the actual generation produces exactly the files shown in the preview.
3. **Given** a user provides a `.scaffoldrc` that removes hooks/ and adds data/, **When** scaffolding runs, **Then** the generated project has data/ but not hooks/, and any files that would have referenced hooks/ are updated or flagged.

---

### FS-002: PM Discovery Module

**Description:** The structured PM discovery workflow that extracts deep requirements through conversational phases (Problem Understanding, Market Context, User Deep Dive, Requirements Synthesis, Artifact Review, Handoff). This is the existing PM artifacts generator, integrated as a first-class module in the scaffolding platform. It produces PRDs, user stories, personas, journey maps, experience maps, feature stories, and PM specs — all in dual format (human-facing rich output and machine-consumable YAML for downstream agents).
**Priority:** Must Have
**Estimated Complexity:** XL

**User Stories:** US-002
**Personas:** milind-strategic-builder
**Journey Phases:** A: Problem Understanding, B: Market Context, C: User Deep Dive, D: Requirements Synthesis, E: Artifact Review, F: Handoff

**Functional Requirements:**
- FR-1: Implement a 6-phase conversational discovery workflow (Phases A through F) that cannot be skipped or short-circuited.
- FR-2: Ask at least 5 targeted questions per phase before generating any artifacts, with follow-up questions when answers lack depth.
- FR-3: Detect vague or incomplete answers and ask clarifying questions rather than filling assumptions.
- FR-4: Generate internally consistent artifacts — personas referenced in user stories must match defined personas, journey phases must align across all artifacts.
- FR-5: Produce all artifact types: PRD, user stories, feature stories, personas, journey map (Mermaid + HTML), experience map (HTML), and PM spec.
- FR-6: Output all artifacts in dual format: human-readable markdown with YAML frontmatter, plus a machine-consumable YAML block (For AI Agents section).
- FR-7: Use market-researcher sub-agent for Phase B to conduct automated competitive research via web search.
- FR-8: Support artifact revision — when user provides feedback during Phase E, regenerate affected artifacts while maintaining consistency.

**Non-Functional Requirements:**
- NFR-1: Discovery session state must be recoverable from generated artifacts on disk, enabling session resumability without in-memory state.
- NFR-2: HTML visual artifacts must render correctly in all modern browsers without external dependencies (self-contained CSS/JS).
- NFR-3: Generated artifacts must be under 5,000 tokens each to stay within progressive disclosure budgets for downstream agents.

**Dependencies:** FS-001 (scaffolding sets up the project where artifacts are saved)

**Acceptance Criteria:**
1. **Given** a user completes all 6 phases of PM discovery, **When** artifacts are generated, **Then** the PRD, user stories, personas, journey map, and PM spec are all internally consistent — every persona ID referenced in a user story exists in the personas artifact, and every journey phase referenced exists in the journey map.
2. **Given** a user provides a one-word answer to a Phase A question, **When** the system processes it, **Then** it asks at least 2 follow-up questions to extract more detail before moving on.
3. **Given** PM discovery artifacts are generated, **When** the orchestration agent reads them for the next stage, **Then** it can parse the YAML block without errors and extract all structured data.

---

### FS-003: Judgment Gate System

**Description:** The core innovation of the platform. Structured decision points where the pipeline pauses and presents the human operator with visual decision-support artifacts, humanized summaries, clear action prompts (approve / revise / reject), and persistent decision records. Includes the humanizer that strips AI patterns from all human-facing output, artifact versioning for tracking how decisions change requirements over time, and a decision history system for referencing past choices at future gates.
**Priority:** Must Have
**Estimated Complexity:** XL

**User Stories:** US-003, US-010, US-012, US-016
**Personas:** milind-strategic-builder
**Journey Phases:** C: User Deep Dive, E: Artifact Review

**Functional Requirements:**
- FR-1: Define judgment gate points at each SDLC stage transition (post-discovery, post-brainstorm, post-plan, post-implementation, post-review, pre-ship).
- FR-2: At each gate, present a structured summary: what was completed, key decisions needed, recommended action with rationale, and explicit options (approve / revise / reject).
- FR-3: Generate HTML visual artifacts (comparison tables, dashboards, diagrams) for gates that involve comparing alternatives, saved to docs/pm/.
- FR-4: Pass all human-facing output through a humanizer that removes AI verbal tics ("I'd be happy to," "Let me," "Great question," "Here's a comprehensive," hedging, over-qualification, list-mania).
- FR-5: Preserve structure and data accuracy during humanization — no information loss or distortion.
- FR-6: Persist every decision as a structured artifact (gate ID, timestamp, decision, alternatives considered, rationale, linked artifacts) in docs/pm/decisions/.
- FR-7: Surface relevant past decisions at future gates via a "Related Past Decisions" section.
- FR-8: Provide a decision history command that lists all decisions chronologically, filterable by stage and topic.
- FR-9: Version artifacts when they are revised at a gate — increment version number in YAML frontmatter, preserve previous versions.
- FR-10: Provide diff capability between artifact versions in human-readable format.
- FR-11: Fall back gracefully if the humanizer plugin is unavailable — proceed with raw output and display a warning.

**Non-Functional Requirements:**
- NFR-1: A judgment gate summary must be readable and decidable in under 2 minutes — this is the primary UX metric.
- NFR-2: Humanized output must contain zero instances of the blocked AI phrase patterns.
- NFR-3: Decision artifacts must be parseable by downstream agents for context injection at future gates.
- NFR-4: HTML visual artifacts must be self-contained (inline CSS/JS) and renderable without a web server.

**Dependencies:** FS-002 (produces the first set of artifacts that hit a gate), FS-005 (context management provides scoped context to gates)

**Acceptance Criteria:**
1. **Given** the pipeline reaches a judgment gate after PM discovery, **When** the gate activates, **Then** it presents a humanized summary with what was completed, decisions needed, recommendation, and approve/revise/reject options — and the summary contains zero AI verbal tics.
2. **Given** a user approves at a gate and the artifacts are updated, **When** the revision is saved, **Then** the previous version is preserved and a human-readable diff is available.
3. **Given** a user has made 5 decisions across 3 stages, **When** they invoke the decision history command, **Then** all 5 decisions are listed chronologically with gate IDs, summaries, and links to full artifacts.

---

### FS-004: SDLC Orchestration Agent

**Description:** The conductor agent that manages the full software development lifecycle pipeline. It sequences stages (PM discovery, brainstorm, plan, implement, review, ship), handles handoffs between stages with schema validation, routes to judgment gates when human input is needed, operates autonomously for the 80% of work that doesn't need human judgment, enforces anti-rationalization verification, and supports session resumability. This is the highest-complexity feature because it ties everything else together.
**Priority:** Must Have
**Estimated Complexity:** XL

**User Stories:** US-004, US-009, US-011, US-015
**Personas:** milind-strategic-builder
**Journey Phases:** D: Requirements Synthesis, E: Artifact Review, F: Handoff

**Functional Requirements:**
- FR-1: Automatically sequence through SDLC stages in order (PM discovery -> brainstorm -> plan -> implement -> review -> ship), invoking the appropriate sub-agent or plugin at each stage.
- FR-2: Evaluate stage output against quality thresholds and either proceed autonomously or route to a judgment gate based on the evaluation.
- FR-3: Retry failed stages with adjusted parameters (up to a configurable limit) before escalating to a judgment gate.
- FR-4: Validate handoff artifacts against expected schemas before passing to the next stage — required fields present, cross-references valid, no placeholder text.
- FR-5: Auto-correct minor handoff issues (missing dates, formatting) and log corrections. Route major issues (missing sections, inconsistent data) to judgment gates.
- FR-6: Ensure receiving agents request missing artifacts rather than hallucinating content.
- FR-7: Run anti-rationalization verification (via a cheap model) on sub-agent output: check for unaddressed requirements, generic filler, and unsupported claims.
- FR-8: Route rationalization flags to judgment gates showing both the output and specific flags.
- FR-9: Track verification pass rates and suggest reducing frequency for consistently passing stage types (but never auto-disable).
- FR-10: Support session resumability — derive session state from artifacts on disk, identify last completed phase, resume from next phase.
- FR-11: Present a brief status summary when resuming after significant time.
- FR-12: Log all routing decisions, stage transitions, retries, and escalations for audit.

**Non-Functional Requirements:**
- NFR-1: The orchestration agent must achieve an 80/20 autonomy ratio — the human should spend at most 20% of total pipeline time at judgment gates, with 80% handled autonomously.
- NFR-2: Stage transitions must complete in under 10 seconds (excluding the actual stage execution time).
- NFR-3: Anti-rationalization verification must use the cheapest available model (Haiku-tier) to minimize cost.
- NFR-4: Session resumability must work across crashes, restarts, and multi-day gaps without data loss.

**Dependencies:** FS-001 (scaffolding creates the project structure), FS-002 (PM discovery is the first stage), FS-003 (judgment gates are the human interface), FS-005 (context management scopes what agents see)

**Acceptance Criteria:**
1. **Given** a user initiates a project, **When** the pipeline runs end-to-end, **Then** the orchestration agent automatically sequences through all stages, invoking sub-agents and plugins, pausing only at judgment gates and quality failures.
2. **Given** a sub-agent produces output with 2 unaddressed requirements, **When** verification runs, **Then** it flags both requirements and routes to a judgment gate showing the output alongside the flags.
3. **Given** a user closes a session after Phase C of PM discovery, **When** they invoke `/pm-resume` in a new session, **Then** the system loads previous artifacts, presents a status summary, and resumes from Phase D.

---

### FS-005: Context Management System

**Description:** Manages how context flows between agents and stages. Implements progressive disclosure (each agent gets only task-relevant context), model routing (Haiku for simple tasks, Sonnet for analysis, Opus for architecture), and scoped context construction. Treats context as a curated dictionary rather than a firehose — the orchestration agent acts as the librarian, selecting what each sub-agent needs.
**Priority:** Must Have
**Estimated Complexity:** L

**User Stories:** US-005, US-006
**Personas:** milind-strategic-builder
**Journey Phases:** D: Requirements Synthesis

**Functional Requirements:**
- FR-1: Construct scoped context for each sub-agent containing only: (a) task description, (b) relevant artifacts from the previous stage, and (c) applicable judgment gate decisions — explicitly excluding unrelated artifacts.
- FR-2: Keep sub-agent context under a configurable token threshold (default 20,000 tokens) through scoping, not truncation.
- FR-3: Include a "decision summary" section with relevant past decisions when a sub-agent needs to reference earlier-stage context, rather than including full decision artifacts.
- FR-4: Classify tasks by complexity (low / medium / high) based on task type, input size, and required reasoning depth.
- FR-5: Route low-complexity tasks (search, validation, extraction) to Haiku-tier models.
- FR-6: Route medium-complexity tasks (analysis, generation, summarization) to Sonnet-tier models.
- FR-7: Route high-complexity tasks (architecture, trade-off analysis, synthesis from ambiguous inputs) to Opus-tier models.
- FR-8: Log all routing decisions with classification rationale and model tier selected.
- FR-9: Auto-escalate to a higher model tier when a lower-tier model's output fails quality checks.
- FR-10: Make routing rules configurable (allow users to override default tier assignments for specific task types).

**Non-Functional Requirements:**
- NFR-1: Context construction must complete in under 5 seconds regardless of total project artifact volume.
- NFR-2: Model routing must track token usage per tier per project for cost analysis.
- NFR-3: Context scoping must never drop relevant information — if an agent needs something, it must be included even if it approaches the token threshold.

**Dependencies:** FS-004 (orchestration agent invokes context management for each sub-agent call)

**Acceptance Criteria:**
1. **Given** a project with 60,000 tokens of accumulated artifacts, **When** the code review agent is invoked, **Then** it receives context under 20,000 tokens containing only the implementation artifacts, relevant design decisions, and the review task description — not the PM discovery artifacts or brainstorming output.
2. **Given** a web search task, **When** the context management system routes it, **Then** it goes to Haiku with a logged rationale, and if Haiku's output fails quality checks, it is automatically re-routed to Sonnet.
3. **Given** a user overrides routing to force Opus for all tasks in a project, **When** the override is applied, **Then** all tasks route to Opus and the system logs the override but does not auto-downgrade.

---

### FS-006: Knowledge Compounding Engine

**Description:** Captures learnings from completed projects (what worked, what failed, patterns discovered, solutions found) and feeds them back into future project planning and review stages. Starts as a simple structured file format (YAML/markdown) and can evolve into a more sophisticated system as usage patterns emerge. The key constraint is handling contradictory learnings gracefully — present both sides with context, don't arbitrarily resolve conflicts.
**Priority:** Should Have
**Estimated Complexity:** M

**User Stories:** US-007
**Personas:** milind-strategic-builder
**Journey Phases:** F: Handoff

**Functional Requirements:**
- FR-1: Generate a structured learnings artifact at project completion containing: decisions that worked, decisions that caused rework, patterns discovered, and recommendations for future projects.
- FR-2: Save learnings to a global knowledge base (shared across projects, not project-scoped).
- FR-3: When a new project enters PM discovery, inject relevant past learnings (matching by project type or domain) as "past experience" context — informational, not constraining.
- FR-4: Handle contradictory learnings by presenting both perspectives with their respective project contexts, allowing the human to make the judgment call.
- FR-5: Support manual addition of learnings outside the post-mortem flow (e.g., mid-project insights).
- FR-6: Tag learnings by project type, domain, stage, and outcome for filtered retrieval.

**Non-Functional Requirements:**
- NFR-1: Knowledge base queries must return in under 2 seconds.
- NFR-2: Learnings format must be human-readable (markdown with YAML frontmatter) and editable with any text editor.
- NFR-3: Knowledge base must handle at least 100 projects' worth of learnings without performance degradation.

**Dependencies:** FS-004 (orchestration agent triggers post-mortem), FS-005 (context management injects learnings into agent context)

**Acceptance Criteria:**
1. **Given** a project completes all SDLC stages, **When** post-mortem runs, **Then** a structured learnings artifact is generated and saved to the global knowledge base with project type, domain, and stage tags.
2. **Given** the knowledge base contains learnings from a previous Claude Code plugin project, **When** a new Claude Code plugin project enters PM discovery, **Then** the discovery agent receives relevant past learnings in its context.
3. **Given** two past projects have contradictory learnings about the same topic, **When** those learnings are surfaced, **Then** both perspectives are presented with their project contexts and neither is presented as the definitive answer.

---

### FS-007: Plugin Composition Framework

**Description:** Enables installation, configuration, and composition of third-party Claude Code plugins into the SDLC workflow. The orchestration agent automatically discovers installed plugins, matches their capabilities to pipeline stages, and invokes them at the appropriate points. Handles conflicts between overlapping plugins, graceful fallback when plugins fail, and provides a Unix-pipes-style composability where small specialized tools chain together into powerful workflows.
**Priority:** Should Have
**Estimated Complexity:** L

**User Stories:** US-008
**Personas:** milind-strategic-builder
**Journey Phases:** D: Requirements Synthesis

**Functional Requirements:**
- FR-1: Discover installed third-party plugins and their declared capabilities (skills, commands) at pipeline startup.
- FR-2: Match plugin capabilities to pipeline stages based on declared skill types (e.g., a humanizer plugin maps to judgment gate output processing).
- FR-3: Automatically invoke matched plugins at the appropriate pipeline points without manual configuration.
- FR-4: Detect conflicts when two plugins provide overlapping capabilities and present a judgment gate for the user to choose.
- FR-5: Fall back to built-in functionality when a third-party plugin fails, and log the failure.
- FR-6: Support a plugin configuration file that allows users to: (a) disable specific plugins for a project, (b) set priority order for conflicting plugins, (c) map plugins to custom pipeline stages.
- FR-7: Provide a command to list all installed plugins, their capabilities, and their current pipeline mappings.

**Non-Functional Requirements:**
- NFR-1: Plugin discovery must complete in under 5 seconds at pipeline startup.
- NFR-2: Plugin invocation must add no more than 2 seconds of overhead per call (excluding the plugin's own execution time).
- NFR-3: Plugin failures must never crash the pipeline — all plugin calls must be wrapped in error handling with fallback paths.

**Dependencies:** FS-004 (orchestration agent manages the pipeline where plugins are invoked), FS-003 (judgment gates handle plugin conflicts)

**Acceptance Criteria:**
1. **Given** a humanizer plugin is installed, **When** the pipeline reaches a judgment gate, **Then** the orchestration agent automatically routes gate output through the humanizer before presenting it to the user.
2. **Given** two plugins both declare a "code-review" capability, **When** the pipeline reaches the code review stage, **Then** a judgment gate presents both options with a comparison of their approaches for the user to choose.
3. **Given** a third-party plugin throws an error during execution, **When** the error is caught, **Then** the system falls back to built-in functionality, logs the error with plugin name and error details, and the pipeline continues without interruption.

---

### FS-008: CI/CD Integration

**Description:** Extends the SDLC pipeline into production workflows via GitHub Actions. Generates workflow files for automated code review on PR creation, feature implementation triggered from labeled issues, and @claude bot responding to PR comments. Respects user customizations — future scaffolding updates detect and preserve manual changes to workflow files. This is a "Could Have" feature that becomes valuable after the core local pipeline is stable.
**Priority:** Could Have
**Estimated Complexity:** M

**User Stories:** US-014
**Personas:** milind-strategic-builder
**Journey Phases:** F: Handoff

**Functional Requirements:**
- FR-1: Generate GitHub Actions workflow files in .github/workflows/ when CI/CD support is enabled during scaffolding.
- FR-2: Generate three workflow types: (a) automated code review on PR creation, (b) feature implementation triggered by issue labels (e.g., `implement-feature`), (c) @claude comment handler for PR conversations.
- FR-3: Generated workflows must use the official Claude GitHub Actions or equivalent community actions.
- FR-4: Detect existing workflow files and preserve user customizations — prompt before overwriting modified files.
- FR-5: Support workflow customization via scaffolding overrides (e.g., "only generate code review workflow, skip the others").
- FR-6: Include sensible defaults for workflow triggers, permissions, and environment variables.

**Non-Functional Requirements:**
- NFR-1: Generated workflow files must pass GitHub Actions validation (correct YAML syntax, valid action references).
- NFR-2: Workflows must include appropriate security controls (minimal permissions, secrets management guidance).
- NFR-3: Documentation for customizing workflows must be generated alongside the workflow files.

**Dependencies:** FS-001 (scaffolding engine generates the workflows), FS-004 (orchestration agent may trigger CI/CD as the final pipeline stage)

**Acceptance Criteria:**
1. **Given** a user scaffolds a project with CI/CD enabled, **When** scaffolding completes, **Then** .github/workflows/ contains three workflow files that pass GitHub Actions syntax validation.
2. **Given** a user has customized a generated workflow file, **When** they re-run scaffolding, **Then** the system detects the modification and prompts before overwriting, offering to merge or skip.
3. **Given** a PR is created in a project using the generated code review workflow, **When** the workflow triggers, **Then** it invokes code review and posts review comments on the PR.

---

## For AI Agents

```yaml
feature_stories:
  - id: FS-001
    name: "Auto-Scaffolding Engine"
    description: "Generates complete project scaffolding based on project type templates with dry-run preview, customization overrides, and extensible type system."
    priority: "Must Have"
    complexity: "L"
    user_stories: [US-001, US-013, US-017, US-018]
    personas: ["milind-strategic-builder"]
    journey_phases: ["A: Problem Understanding", "D: Requirements Synthesis"]
    functional_requirements:
      - id: FR-1
        description: "Accept a project type parameter and generate the corresponding directory structure from a type-specific template"
      - id: FR-2
        description: "Support at least 4 project types at launch"
      - id: FR-3
        description: "Generate populated CLAUDE.md with project-specific context"
      - id: FR-4
        description: "Generate dependency manifests appropriate to project type"
      - id: FR-5
        description: "Support --dry-run flag for preview without file creation"
      - id: FR-6
        description: "Accept override configuration via flags or .scaffoldrc"
      - id: FR-7
        description: "Detect conflicts between overrides and template requirements"
      - id: FR-8
        description: "Support user-defined project type templates"
      - id: FR-9
        description: "Handle unknown project types with closest-match fallback"
    non_functional_requirements:
      - id: NFR-1
        description: "Scaffolding generation completes in under 30 seconds"
      - id: NFR-2
        description: "Generated scaffolding is immediately functional"
      - id: NFR-3
        description: "Template format documented for new type creation in under 1 hour"
    dependencies: []
    acceptance_criteria:
      - given: "User specifies claude-code-plugin type with description"
        when: "Scaffolding runs"
        then: "Generates fully populated project with all required directories and project-specific content"

  - id: FS-002
    name: "PM Discovery Module"
    description: "Structured 6-phase conversational discovery workflow producing internally consistent PM artifacts in dual format."
    priority: "Must Have"
    complexity: "XL"
    user_stories: [US-002]
    personas: ["milind-strategic-builder"]
    journey_phases: ["A: Problem Understanding", "B: Market Context", "C: User Deep Dive", "D: Requirements Synthesis", "E: Artifact Review", "F: Handoff"]
    functional_requirements:
      - id: FR-1
        description: "Implement 6-phase discovery workflow that cannot be skipped"
      - id: FR-2
        description: "Ask at least 5 targeted questions per phase with follow-ups"
      - id: FR-3
        description: "Detect vague answers and ask clarifying questions"
      - id: FR-4
        description: "Generate internally consistent artifacts"
      - id: FR-5
        description: "Produce all artifact types: PRD, user stories, feature stories, personas, journey map, experience map, PM spec"
      - id: FR-6
        description: "Output artifacts in dual format: human-readable markdown with machine-consumable YAML"
      - id: FR-7
        description: "Use market-researcher sub-agent for automated competitive research"
      - id: FR-8
        description: "Support artifact revision while maintaining consistency"
    non_functional_requirements:
      - id: NFR-1
        description: "Session state recoverable from artifacts on disk"
      - id: NFR-2
        description: "HTML artifacts render in all modern browsers without external dependencies"
      - id: NFR-3
        description: "Each artifact under 5,000 tokens for progressive disclosure budgets"
    dependencies: ["FS-001"]
    acceptance_criteria:
      - given: "User completes all 6 discovery phases"
        when: "Artifacts are generated"
        then: "All artifacts are internally consistent with valid cross-references"

  - id: FS-003
    name: "Judgment Gate System"
    description: "Structured decision points with visual artifacts, humanized output, decision persistence, artifact versioning, and decision history."
    priority: "Must Have"
    complexity: "XL"
    user_stories: [US-003, US-010, US-012, US-016]
    personas: ["milind-strategic-builder"]
    journey_phases: ["C: User Deep Dive", "E: Artifact Review"]
    functional_requirements:
      - id: FR-1
        description: "Define judgment gate points at each SDLC stage transition"
      - id: FR-2
        description: "Present structured summary with completion status, decisions needed, recommendation, and options"
      - id: FR-3
        description: "Generate HTML visual artifacts for comparison gates"
      - id: FR-4
        description: "Humanize all human-facing output by removing AI verbal tics"
      - id: FR-5
        description: "Preserve structure and accuracy during humanization"
      - id: FR-6
        description: "Persist decisions as structured artifacts in docs/pm/decisions/"
      - id: FR-7
        description: "Surface related past decisions at future gates"
      - id: FR-8
        description: "Provide decision history command with filtering"
      - id: FR-9
        description: "Version artifacts on revision with preserved history"
      - id: FR-10
        description: "Provide human-readable diff between artifact versions"
      - id: FR-11
        description: "Graceful fallback when humanizer is unavailable"
    non_functional_requirements:
      - id: NFR-1
        description: "Gate summary readable and decidable in under 2 minutes"
      - id: NFR-2
        description: "Zero AI phrase pattern instances in humanized output"
      - id: NFR-3
        description: "Decision artifacts parseable by downstream agents"
      - id: NFR-4
        description: "HTML artifacts self-contained and renderable without a web server"
    dependencies: ["FS-002", "FS-005"]
    acceptance_criteria:
      - given: "Pipeline reaches judgment gate after PM discovery"
        when: "Gate activates"
        then: "Humanized summary with zero AI tics, clear options, and decision persistence"

  - id: FS-004
    name: "SDLC Orchestration Agent"
    description: "Conductor agent managing the full pipeline with autonomous sequencing, handoff validation, anti-rationalization verification, and session resumability."
    priority: "Must Have"
    complexity: "XL"
    user_stories: [US-004, US-009, US-011, US-015]
    personas: ["milind-strategic-builder"]
    journey_phases: ["D: Requirements Synthesis", "E: Artifact Review", "F: Handoff"]
    functional_requirements:
      - id: FR-1
        description: "Automatically sequence through SDLC stages invoking appropriate sub-agents"
      - id: FR-2
        description: "Evaluate output against quality thresholds for autonomous proceeding or gate routing"
      - id: FR-3
        description: "Retry failed stages with adjusted parameters up to configurable limit"
      - id: FR-4
        description: "Validate handoff artifacts against expected schemas"
      - id: FR-5
        description: "Auto-correct minor handoff issues, route major issues to gates"
      - id: FR-6
        description: "Ensure receiving agents request missing artifacts rather than hallucinating"
      - id: FR-7
        description: "Run anti-rationalization verification via cheap model"
      - id: FR-8
        description: "Route rationalization flags to judgment gates"
      - id: FR-9
        description: "Track verification pass rates and suggest frequency reduction"
      - id: FR-10
        description: "Support session resumability via artifact-derived state"
      - id: FR-11
        description: "Present status summary on session resume"
      - id: FR-12
        description: "Log all routing decisions, transitions, retries, and escalations"
    non_functional_requirements:
      - id: NFR-1
        description: "Achieve 80/20 autonomy ratio (human at gates 20% of time)"
      - id: NFR-2
        description: "Stage transitions under 10 seconds excluding execution"
      - id: NFR-3
        description: "Verification uses cheapest available model tier"
      - id: NFR-4
        description: "Resumability works across crashes and multi-day gaps"
    dependencies: ["FS-001", "FS-002", "FS-003", "FS-005"]
    acceptance_criteria:
      - given: "User initiates a project"
        when: "Pipeline runs end-to-end"
        then: "Orchestration agent sequences through all stages, pausing only at gates and failures"

  - id: FS-005
    name: "Context Management System"
    description: "Progressive disclosure and model routing — scoped context construction and automatic task-to-model-tier routing."
    priority: "Must Have"
    complexity: "L"
    user_stories: [US-005, US-006]
    personas: ["milind-strategic-builder"]
    journey_phases: ["D: Requirements Synthesis"]
    functional_requirements:
      - id: FR-1
        description: "Construct scoped context with only task-relevant artifacts and decisions"
      - id: FR-2
        description: "Keep context under configurable token threshold via scoping not truncation"
      - id: FR-3
        description: "Include decision summaries for cross-stage references"
      - id: FR-4
        description: "Classify tasks by complexity level"
      - id: FR-5
        description: "Route to Haiku for low-complexity tasks"
      - id: FR-6
        description: "Route to Sonnet for medium-complexity tasks"
      - id: FR-7
        description: "Route to Opus for high-complexity tasks"
      - id: FR-8
        description: "Log routing decisions with classification rationale"
      - id: FR-9
        description: "Auto-escalate on quality check failure"
      - id: FR-10
        description: "Support configurable routing rule overrides"
    non_functional_requirements:
      - id: NFR-1
        description: "Context construction under 5 seconds regardless of artifact volume"
      - id: NFR-2
        description: "Track token usage per tier per project for cost analysis"
      - id: NFR-3
        description: "Never drop relevant information during scoping"
    dependencies: ["FS-004"]
    acceptance_criteria:
      - given: "Project with 60,000 tokens of artifacts"
        when: "Code review agent is invoked"
        then: "Receives under 20,000 tokens of scoped context with only relevant artifacts"

  - id: FS-006
    name: "Knowledge Compounding Engine"
    description: "Captures project learnings and feeds them into future planning and review stages."
    priority: "Should Have"
    complexity: "M"
    user_stories: [US-007]
    personas: ["milind-strategic-builder"]
    journey_phases: ["F: Handoff"]
    functional_requirements:
      - id: FR-1
        description: "Generate structured learnings artifact at project completion"
      - id: FR-2
        description: "Save learnings to global cross-project knowledge base"
      - id: FR-3
        description: "Inject relevant past learnings into new project context"
      - id: FR-4
        description: "Handle contradictory learnings by presenting both perspectives"
      - id: FR-5
        description: "Support manual addition of mid-project learnings"
      - id: FR-6
        description: "Tag learnings by project type, domain, stage, and outcome"
    non_functional_requirements:
      - id: NFR-1
        description: "Knowledge base queries return in under 2 seconds"
      - id: NFR-2
        description: "Learnings format is human-readable markdown with YAML frontmatter"
      - id: NFR-3
        description: "Handles 100+ projects without performance degradation"
    dependencies: ["FS-004", "FS-005"]
    acceptance_criteria:
      - given: "Project completes all stages"
        when: "Post-mortem runs"
        then: "Structured learnings artifact saved to global knowledge base with tags"

  - id: FS-007
    name: "Plugin Composition Framework"
    description: "Discovers, matches, and composes third-party plugins into the pipeline with conflict resolution and graceful fallback."
    priority: "Should Have"
    complexity: "L"
    user_stories: [US-008]
    personas: ["milind-strategic-builder"]
    journey_phases: ["D: Requirements Synthesis"]
    functional_requirements:
      - id: FR-1
        description: "Discover installed plugins and their capabilities at startup"
      - id: FR-2
        description: "Match plugin capabilities to pipeline stages"
      - id: FR-3
        description: "Auto-invoke matched plugins at appropriate pipeline points"
      - id: FR-4
        description: "Detect capability conflicts and present judgment gate for resolution"
      - id: FR-5
        description: "Fall back to built-in functionality on plugin failure"
      - id: FR-6
        description: "Support plugin configuration file for disabling, prioritizing, and mapping"
      - id: FR-7
        description: "Provide command to list installed plugins and their pipeline mappings"
    non_functional_requirements:
      - id: NFR-1
        description: "Plugin discovery under 5 seconds at startup"
      - id: NFR-2
        description: "Plugin invocation adds no more than 2 seconds overhead"
      - id: NFR-3
        description: "Plugin failures never crash the pipeline"
    dependencies: ["FS-004", "FS-003"]
    acceptance_criteria:
      - given: "Humanizer plugin installed"
        when: "Pipeline reaches judgment gate"
        then: "Output automatically routed through humanizer before display"

  - id: FS-008
    name: "CI/CD Integration"
    description: "GitHub Actions workflow generation for production automation with customization preservation."
    priority: "Could Have"
    complexity: "M"
    user_stories: [US-014]
    personas: ["milind-strategic-builder"]
    journey_phases: ["F: Handoff"]
    functional_requirements:
      - id: FR-1
        description: "Generate GitHub Actions workflow files when CI/CD enabled"
      - id: FR-2
        description: "Generate three workflow types: code review, feature implementation, comment handler"
      - id: FR-3
        description: "Use official or community Claude GitHub Actions"
      - id: FR-4
        description: "Detect and preserve user customizations on re-scaffolding"
      - id: FR-5
        description: "Support workflow customization via scaffolding overrides"
      - id: FR-6
        description: "Include sensible defaults for triggers, permissions, and env vars"
    non_functional_requirements:
      - id: NFR-1
        description: "Generated workflows pass GitHub Actions validation"
      - id: NFR-2
        description: "Workflows include appropriate security controls"
      - id: NFR-3
        description: "Customization documentation generated alongside workflows"
    dependencies: ["FS-001", "FS-004"]
    acceptance_criteria:
      - given: "User scaffolds with CI/CD enabled"
        when: "Scaffolding completes"
        then: "Three valid workflow files generated in .github/workflows/"
```
