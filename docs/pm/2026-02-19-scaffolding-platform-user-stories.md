---
artifact: user-stories
project: "Claude Code Scaffolding Platform"
date: "2026-02-19"
status: approved
phase: D
persona: "Milind - The Strategic Builder"
---

# User Stories: Claude Code Scaffolding Platform

## Story Index

| ID | Title | Persona | Priority | Journey Phase |
|---|---|---|---|---|
| US-001 | Auto-Scaffolding | Milind | Must Have | A: Problem Understanding |
| US-002 | PM Discovery Workflow | Milind | Must Have | A: Problem Understanding |
| US-003 | Judgment Gates with Visual Artifacts | Milind | Must Have | C: User Deep Dive |
| US-004 | SDLC Orchestration Agent | Milind | Must Have | D: Requirements Synthesis |
| US-005 | Progressive Disclosure | Milind | Must Have | D: Requirements Synthesis |
| US-006 | Model Routing | Milind | Should Have | D: Requirements Synthesis |
| US-007 | Knowledge Compounding | Milind | Should Have | F: Handoff |
| US-008 | Plugin Composability | Milind | Should Have | D: Requirements Synthesis |
| US-009 | Handoff Quality | Milind | Must Have | F: Handoff |
| US-010 | Decision Persistence | Milind | Should Have | E: Artifact Review |
| US-011 | Anti-Rationalization Verification | Milind | Should Have | E: Artifact Review |
| US-012 | Humanized Output | Milind | Must Have | C: User Deep Dive |
| US-013 | Multi-Project-Type Support | Milind | Must Have | A: Problem Understanding |
| US-014 | GitHub Actions Integration | Milind | Could Have | F: Handoff |
| US-015 | Session Resumability | Milind | Should Have | E: Artifact Review |
| US-016 | Artifact Versioning | Milind | Should Have | E: Artifact Review |
| US-017 | Dry-Run / Preview Mode | Milind | Could Have | D: Requirements Synthesis |
| US-018 | Scaffold Customization / Overrides | Milind | Should Have | A: Problem Understanding |

---

## Stories

### US-001: Auto-Scaffolding

**As a** technical PM and developer (Milind),
**I want to** describe a project type and have the system automatically generate the full scaffolding (CLAUDE.md, directory structure, skills, agents, hooks, workflows),
**So that** I can start working on the actual problem within minutes instead of spending hours on boilerplate setup.

**Priority:** Must Have
**Persona:** milind-strategic-builder
**Journey Phase:** A: Problem Understanding
**Feature Story:** FS-001

**Acceptance Criteria:**

1. **Given** I invoke the scaffolding command and specify a project type (e.g., "claude-code-plugin"),
   **When** the system processes my request,
   **Then** it generates a complete directory structure including CLAUDE.md, AGENTS.md, skills/, commands/, agents/, hooks/, templates/, and docs/ with sensible defaults populated in each file.

2. **Given** I specify a project type that has associated dependencies (e.g., Node.js packages, Python requirements),
   **When** scaffolding completes,
   **Then** the system generates the appropriate dependency manifest (package.json, requirements.txt, etc.) with all required dependencies listed and optionally runs the install step.

3. **Given** I provide a one-sentence project description alongside the project type,
   **When** scaffolding completes,
   **Then** the CLAUDE.md file contains a project-specific overview, and agent/skill definitions reference the actual project domain rather than generic placeholders.

**Notes:** This is the entry point for the entire platform. Speed here directly determines first-impression value. The scaffolding should be opinionated but overridable.

---

### US-002: PM Discovery Workflow

**As a** technical PM and developer (Milind),
**I want to** a structured PM discovery workflow that extracts requirements through deep conversational questions (problem definition, users, market context, JTBD, journey mapping),
**So that** downstream agents have high-quality, detailed requirements to work from instead of shallow, assumption-laden briefs.

**Priority:** Must Have
**Persona:** milind-strategic-builder
**Journey Phase:** A: Problem Understanding
**Feature Story:** FS-002

**Acceptance Criteria:**

1. **Given** I invoke `/pm-discover` on a new project,
   **When** the discovery workflow begins,
   **Then** the system asks at least 5 targeted questions across problem understanding, user identification, and market context before generating any artifacts, and it does not skip phases even if I provide short answers.

2. **Given** I complete all six discovery phases (A through F),
   **When** the workflow reaches artifact generation,
   **Then** the system produces a PRD, user stories, personas, journey map, and PM spec that are internally consistent (personas referenced in stories match those defined, journey phases align with story mappings).

3. **Given** I provide vague or incomplete answers during discovery,
   **When** the system detects insufficient detail,
   **Then** it asks clarifying follow-up questions rather than filling in assumptions, and it flags which areas lack depth before proceeding.

**Notes:** This is the existing PM artifacts generator. The key integration challenge is ensuring its output format is consumable by the orchestration agent and downstream stages.

---

### US-003: Judgment Gates with Visual Artifacts

**As a** technical PM and developer (Milind),
**I want to** the system to pause at critical decision points and present me with visual decision-support artifacts (HTML journey maps, comparison dashboards, humanized summaries with clear action prompts),
**So that** I can make informed judgments in under 2 minutes per gate without parsing walls of unstructured text.

**Priority:** Must Have
**Persona:** milind-strategic-builder
**Journey Phase:** C: User Deep Dive
**Feature Story:** FS-003

**Acceptance Criteria:**

1. **Given** the pipeline reaches a judgment gate (e.g., post-PM-discovery, post-implementation-plan, post-code-review),
   **When** the gate activates,
   **Then** the system presents a structured summary with: (a) what was completed, (b) key decisions needed, (c) recommended action with rationale, and (d) explicit options (approve / revise / reject) — all in humanized prose, not raw AI output.

2. **Given** a judgment gate involves comparing alternatives (e.g., architecture options, implementation approaches),
   **When** the gate presents the comparison,
   **Then** it generates an HTML visual artifact (table, diagram, or dashboard) saved to docs/pm/ that I can open in a browser for side-by-side evaluation.

3. **Given** I make a decision at a judgment gate,
   **When** I select an option and provide rationale,
   **Then** the system records the decision, rationale, timestamp, and gate ID as a persistent artifact before proceeding to the next stage.

**Notes:** This is the core innovation of the platform. The difference between this and existing tools is that gates are not just "y/n" prompts — they provide genuine decision support.

---

### US-004: SDLC Orchestration Agent

**As a** technical PM and developer (Milind),
**I want to** an orchestration agent that manages the full pipeline (PM discovery -> brainstorm -> plan -> implement -> review -> ship),
**So that** I only need to engage at judgment gates while the system handles the 80% of routine work autonomously.

**Priority:** Must Have
**Persona:** milind-strategic-builder
**Journey Phase:** D: Requirements Synthesis
**Feature Story:** FS-004

**Acceptance Criteria:**

1. **Given** I initiate a new project through the orchestration agent,
   **When** the pipeline starts,
   **Then** the agent automatically sequences through the SDLC stages in order (PM discovery -> brainstorm -> plan -> implement -> review -> ship), invoking the appropriate sub-agent or plugin at each stage without requiring me to manually trigger each transition.

2. **Given** a stage completes successfully and passes its quality gate,
   **When** the orchestration agent evaluates the stage output,
   **Then** it either (a) routes to a judgment gate if human input is needed, or (b) proceeds to the next stage autonomously if the output meets predefined quality thresholds — and it logs which path was taken and why.

3. **Given** a stage fails or produces output below the quality threshold,
   **When** the orchestration agent detects the failure,
   **Then** it retries the stage with adjusted parameters (up to a configurable retry limit), and if retries are exhausted, it escalates to a judgment gate with a clear explanation of what failed and what was tried.

**Notes:** The 80/20 split is the key metric. Milind should spend 20% of his time (at judgment gates) and the system should handle 80% autonomously. Track the ratio.

---

### US-005: Progressive Disclosure

**As a** technical PM and developer (Milind),
**I want to** each agent and stage to receive only the context relevant to its task (scoped context, not the full project dump),
**So that** agents produce focused, high-quality output instead of getting confused by irrelevant information or hitting context window limits.

**Priority:** Must Have
**Persona:** milind-strategic-builder
**Journey Phase:** D: Requirements Synthesis
**Feature Story:** FS-005

**Acceptance Criteria:**

1. **Given** the orchestration agent hands off to a sub-agent (e.g., the code review agent),
   **When** it constructs the sub-agent's context,
   **Then** the context includes only: (a) the sub-agent's task description, (b) the specific artifacts from the previous stage that are relevant, and (c) any decisions from judgment gates that affect this stage — and explicitly excludes unrelated artifacts from other stages.

2. **Given** a project has accumulated more than 50,000 tokens of artifacts across all stages,
   **When** any single sub-agent is invoked,
   **Then** the context provided to that agent is under 20,000 tokens (or a configurable threshold), achieved through scoping rather than truncation, so no relevant information is cut off.

3. **Given** a sub-agent needs to reference a decision made three stages ago,
   **When** the orchestration agent prepares context,
   **Then** it includes a "decision summary" section with only the relevant past decisions (not the full decision artifacts), keeping the context concise but complete.

**Notes:** This is about treating context as a curated dictionary, not a firehose. The orchestration agent is the librarian.

---

### US-006: Model Routing

**As a** technical PM and developer (Milind),
**I want to** the system to automatically route tasks to the appropriate model tier (Haiku for search/verification, Sonnet for analysis/generation, Opus for architecture/complex reasoning),
**So that** I optimize for both quality and cost without manually deciding which model to use for each task.

**Priority:** Should Have
**Persona:** milind-strategic-builder
**Journey Phase:** D: Requirements Synthesis
**Feature Story:** FS-005

**Acceptance Criteria:**

1. **Given** a task is classified as low-complexity (web search, format validation, simple extraction),
   **When** the orchestration agent routes the task,
   **Then** it is sent to Haiku (or equivalent cheapest tier), and the routing decision is logged with the classification rationale.

2. **Given** a task is classified as high-complexity (architectural design, cross-cutting trade-off analysis, PRD synthesis from ambiguous inputs),
   **When** the orchestration agent routes the task,
   **Then** it is sent to Opus (or equivalent highest tier), and the routing decision is logged with the classification rationale.

3. **Given** a task routed to a lower-tier model produces output that fails quality checks,
   **When** the quality gate detects the failure,
   **Then** the system automatically re-routes to the next higher tier and logs the escalation, without requiring human intervention.

**Notes:** Model routing is a cost optimization. Track token usage per model tier per project to measure savings. Consider making the routing rules configurable.

---

### US-007: Knowledge Compounding

**As a** technical PM and developer (Milind),
**I want to** the system to capture learnings from completed projects (what worked, what failed, solutions discovered, patterns identified) and feed them back into future planning and review stages,
**So that** the system gets measurably smarter over time and I stop repeating the same mistakes across projects.

**Priority:** Should Have
**Persona:** milind-strategic-builder
**Journey Phase:** F: Handoff
**Feature Story:** FS-006

**Acceptance Criteria:**

1. **Given** a project completes (all stages through ship),
   **When** the post-mortem phase runs,
   **Then** the system generates a structured learnings artifact containing: (a) decisions that worked well, (b) decisions that caused rework, (c) patterns discovered, and (d) recommendations for future projects — saved to a global knowledge base.

2. **Given** a new project enters PM discovery,
   **When** the system prepares context for the PM discovery agent,
   **Then** it includes relevant learnings from past projects that match the new project's type or domain, surfaced as "past experience" context rather than hard constraints.

3. **Given** the knowledge base contains contradictory learnings from different projects,
   **When** the system surfaces these learnings,
   **Then** it presents both perspectives with their respective project contexts rather than arbitrarily choosing one, allowing me to make the judgment call.

**Notes:** This is a long-term differentiator. Start with a simple structured file format. Avoid over-engineering a database until the usage patterns are clear.

---

### US-008: Plugin Composability

**As a** technical PM and developer (Milind),
**I want to** install and compose third-party Claude Code plugins (humanizer, last30days, planning-with-files, react-pdf, etc.) into my workflow seamlessly,
**So that** I can leverage the growing ecosystem of tools without rebuilding functionality or managing integration glue code.

**Priority:** Should Have
**Persona:** milind-strategic-builder
**Journey Phase:** D: Requirements Synthesis
**Feature Story:** FS-007

**Acceptance Criteria:**

1. **Given** I install a third-party plugin that provides a skill (e.g., `/humanize`),
   **When** the orchestration agent reaches a stage where that skill is relevant (e.g., humanizing output at a judgment gate),
   **Then** it automatically invokes the plugin's skill at the appropriate point in the pipeline without requiring me to manually configure the integration.

2. **Given** two plugins provide conflicting or overlapping capabilities,
   **When** the orchestration agent detects the conflict,
   **Then** it presents a judgment gate asking me to choose which plugin to use for the overlapping capability, with a comparison of their approaches.

3. **Given** a third-party plugin fails or produces unexpected output,
   **When** the orchestration agent detects the failure,
   **Then** it falls back to built-in functionality (if available) or escalates to a judgment gate, and logs the failure for the plugin author to debug.

**Notes:** The plugin ecosystem is what makes Claude Code extensible. Composability should feel like Unix pipes — small tools chained together.

---

### US-009: Handoff Quality

**As a** technical PM and developer (Milind),
**I want to** structured artifact handoffs between SDLC stages (PM artifacts -> planning, plans -> implementation, implementation -> review) with explicit contracts,
**So that** no context is lost between stages and each receiving agent gets exactly what it needs to do its job.

**Priority:** Must Have
**Persona:** milind-strategic-builder
**Journey Phase:** F: Handoff
**Feature Story:** FS-004

**Acceptance Criteria:**

1. **Given** a stage completes and produces output artifacts,
   **When** the orchestration agent prepares the handoff to the next stage,
   **Then** it validates that the output artifacts conform to the expected schema (required fields present, cross-references valid, no placeholder text remaining) before passing them forward.

2. **Given** a handoff artifact fails schema validation,
   **When** the validation error is detected,
   **Then** the system either (a) auto-corrects minor issues (missing dates, formatting) and logs the correction, or (b) routes to a judgment gate for major issues (missing sections, inconsistent data) with a clear description of what's wrong.

3. **Given** the receiving agent processes the handoff artifacts,
   **When** it encounters a reference to an artifact or decision it doesn't have,
   **Then** it requests the missing artifact from the orchestration agent rather than hallucinating content, and the orchestration agent either provides it or escalates to a judgment gate.

**Notes:** Handoff quality is the single biggest failure mode in multi-agent systems. Every handoff should be validated. Consider defining explicit interface contracts between stages.

---

### US-010: Decision Persistence

**As a** technical PM and developer (Milind),
**I want to** every judgment gate decision (and its rationale, alternatives considered, and context at the time) to be persisted as a structured artifact,
**So that** future gates can reference past decisions, I have an audit trail, and I never have to re-explain context that was already established.

**Priority:** Should Have
**Persona:** milind-strategic-builder
**Journey Phase:** E: Artifact Review
**Feature Story:** FS-003

**Acceptance Criteria:**

1. **Given** I make a decision at a judgment gate,
   **When** the decision is recorded,
   **Then** the system persists a decision artifact containing: gate ID, timestamp, decision made, alternatives considered, rationale provided, and links to the artifacts that informed the decision — saved to docs/pm/decisions/.

2. **Given** a later judgment gate involves a topic related to a previous decision,
   **When** the gate prepares its decision-support artifacts,
   **Then** it includes a "Related Past Decisions" section that surfaces the relevant prior decisions with their rationales, so I can maintain consistency or consciously deviate.

3. **Given** I want to review all decisions made for a project,
   **When** I invoke a decision history command,
   **Then** the system presents a chronological list of all decisions with their gate IDs, summaries, and links to full artifacts, filterable by stage and topic.

**Notes:** Decision persistence is what turns a one-shot tool into a system with memory. Keep the format simple — YAML frontmatter with markdown body.

---

### US-011: Anti-Rationalization Verification

**As a** technical PM and developer (Milind),
**I want to** the system to verify (via a cheap model like Haiku) that agents actually completed their work to spec rather than rationalizing incomplete or hallucinated output,
**So that** quality gates are meaningful and I can trust the pipeline's autonomous stages.

**Priority:** Should Have
**Persona:** milind-strategic-builder
**Journey Phase:** E: Artifact Review
**Feature Story:** FS-004

**Acceptance Criteria:**

1. **Given** a sub-agent produces output for a stage,
   **When** the output is submitted to the quality gate,
   **Then** a separate verification agent (running on a cheaper model) checks the output against the original task requirements and flags any: (a) requirements that were acknowledged but not addressed, (b) sections that contain generic filler rather than project-specific content, (c) claims that aren't supported by the input context.

2. **Given** the verification agent flags potential rationalization,
   **When** the flags are generated,
   **Then** the system routes to a judgment gate showing both the original output and the specific flags, so I can determine whether the output is acceptable or needs rework.

3. **Given** verification consistently passes for a particular stage type,
   **When** the system has accumulated enough data (configurable threshold, e.g., 10 consecutive passes),
   **Then** it suggests reducing verification frequency for that stage type to save tokens, but does not auto-disable without my approval.

**Notes:** This is about building trust in autonomous operation. If agents can rationalize, the entire pipeline is unreliable. Verification should be cheap (Haiku-level) but consistent.

---

### US-012: Humanized Output

**As a** technical PM and developer (Milind),
**I want to** all human-facing output (judgment gate summaries, status updates, decision prompts) to pass through a humanizer that strips AI patterns (hedging, over-qualification, list-mania, emoji spam) and presents information in clear, direct prose,
**So that** I can trust and quickly process what I'm reading at judgment gates without mentally filtering AI noise.

**Priority:** Must Have
**Persona:** milind-strategic-builder
**Journey Phase:** C: User Deep Dive
**Feature Story:** FS-003

**Acceptance Criteria:**

1. **Given** any output is destined for a judgment gate or human-facing display,
   **When** the output is generated,
   **Then** it passes through the humanizer before display, and the humanized version contains no instances of: "I'd be happy to," "Let me," "Great question," "Here's a comprehensive," or other common AI verbal tics.

2. **Given** the humanizer processes a structured artifact (e.g., a comparison table or decision summary),
   **When** it rewrites the content,
   **Then** it preserves the structure and data accuracy while improving readability — no information is lost or distorted in the humanization pass.

3. **Given** the humanizer is unavailable (plugin not installed or error),
   **When** the system detects the unavailability,
   **Then** it proceeds with the raw output but adds a visible warning that humanization was skipped, rather than blocking the pipeline.

**Notes:** The humanizer is a critical UX component. Consider using a dedicated plugin like the `humanizer` plugin rather than building from scratch. The key metric is: can Milind read and decide in under 2 minutes per gate?

---

### US-013: Multi-Project-Type Support

**As a** technical PM and developer (Milind),
**I want to** the system to support different project types (software development, Claude Code plugins, course development, content writing, business operations, personal planning) with appropriate scaffolding templates for each,
**So that** I have one unified tool for all my projects instead of maintaining separate workflows for each type.

**Priority:** Must Have
**Persona:** milind-strategic-builder
**Journey Phase:** A: Problem Understanding
**Feature Story:** FS-001

**Acceptance Criteria:**

1. **Given** I invoke the scaffolding command,
   **When** I specify a project type from the supported list,
   **Then** the system generates scaffolding specific to that type — e.g., a "course" type generates modules/, lessons/, assessments/ instead of src/, tests/, while a "claude-code-plugin" type generates skills/, commands/, agents/, hooks/.

2. **Given** I specify a project type that is not in the supported list,
   **When** the system processes my request,
   **Then** it generates a reasonable generic scaffolding based on the closest matching type and flags which parts are generic, asking me to review and customize.

3. **Given** I want to add a new project type,
   **When** I create a project type template following the documented template format,
   **Then** the system recognizes and uses the new type on subsequent invocations without requiring code changes to the platform itself.

**Notes:** Start with 3-4 core types (software dev, claude-code-plugin, course, content). Make the type system extensible so new types are just template additions.

---

### US-014: GitHub Actions Integration

**As a** technical PM and developer (Milind),
**I want to** the system to integrate with GitHub Actions for CI/CD automation (automated code review on PR creation, feature implementation triggered from labeled issues, @claude bot responding to PR comments),
**So that** the SDLC pipeline extends beyond local development into production workflows with minimal manual intervention.

**Priority:** Could Have
**Persona:** milind-strategic-builder
**Journey Phase:** F: Handoff
**Feature Story:** FS-008

**Acceptance Criteria:**

1. **Given** the scaffolding platform generates a project with CI/CD support enabled,
   **When** scaffolding completes,
   **Then** it generates GitHub Actions workflow files (.github/workflows/) for: (a) automated code review on PR creation, (b) feature implementation triggered by issue labels, and (c) @claude response handler for PR comments.

2. **Given** a PR is created in a project that uses the generated GitHub Actions,
   **When** the PR triggers the code review workflow,
   **Then** the workflow invokes the code review agent, posts review comments on the PR, and updates the PR status (approve / request changes) based on the review outcome.

3. **Given** I want to customize the CI/CD workflows,
   **When** I modify the generated workflow files,
   **Then** future scaffolding updates do not overwrite my customizations (the system detects and preserves manual changes or prompts before overwriting).

**Notes:** This extends the platform into async/production workflows. Prioritize after the core local pipeline is solid. Reference existing GitHub Actions for Claude Code as a starting point.

---

### US-015: Session Resumability

**As a** technical PM and developer (Milind),
**I want to** be able to close a session mid-workflow and resume exactly where I left off in a later session,
**So that** I can work on discovery, planning, or implementation across multiple sittings without losing progress or having to re-establish context.

**Priority:** Should Have
**Persona:** milind-strategic-builder
**Journey Phase:** E: Artifact Review
**Feature Story:** FS-004

**Acceptance Criteria:**

1. **Given** I am mid-workflow (e.g., between Phase C and Phase D of PM discovery),
   **When** I close the session and later invoke `/pm-resume`,
   **Then** the system loads all previously generated artifacts, identifies the last completed phase, and resumes from the next phase without re-asking questions I already answered.

2. **Given** I resume a session after significant time has passed (e.g., days),
   **When** the system resumes,
   **Then** it presents a brief summary of where things stand (what's done, what's next, any pending decisions) before continuing, so I can re-orient quickly.

**Notes:** Session state should be derived from artifacts on disk, not from an in-memory store. If the artifacts exist, the phase is complete. This makes resumability robust to crashes and restarts.

---

### US-016: Artifact Versioning

**As a** technical PM and developer (Milind),
**I want to** artifacts to be versioned so that when I revise them (e.g., updating a PRD after a judgment gate), I can see what changed and optionally roll back,
**So that** I have an audit trail of how requirements and designs evolved over the project lifecycle.

**Priority:** Should Have
**Persona:** milind-strategic-builder
**Journey Phase:** E: Artifact Review
**Feature Story:** FS-003

**Acceptance Criteria:**

1. **Given** an artifact is revised (e.g., PRD updated after review),
   **When** the revision is saved,
   **Then** the system saves the new version with an incremented version number in the YAML frontmatter and preserves the previous version (either as a separate file or via git history).

2. **Given** I want to compare two versions of an artifact,
   **When** I invoke the diff command for that artifact,
   **Then** the system presents a human-readable diff showing what was added, removed, and modified between the two versions.

**Notes:** Leverage git for storage. The system should commit artifact versions with meaningful commit messages. Avoid building a custom versioning system when git already does this well.

---

### US-017: Dry-Run / Preview Mode

**As a** technical PM and developer (Milind),
**I want to** preview what a scaffolding or pipeline stage would produce before committing to it,
**So that** I can catch misconfigurations or wrong assumptions early without having to undo generated work.

**Priority:** Could Have
**Persona:** milind-strategic-builder
**Journey Phase:** D: Requirements Synthesis
**Feature Story:** FS-001

**Acceptance Criteria:**

1. **Given** I invoke the scaffolding command with a `--dry-run` flag,
   **When** the system processes the scaffolding,
   **Then** it outputs a tree view of the files and directories that would be created, with summaries of key file contents, without actually creating any files.

2. **Given** I review a dry-run output and approve it,
   **When** I confirm the scaffolding,
   **Then** the system generates exactly what was shown in the preview — no surprise additions or omissions.

**Notes:** Dry-run mode builds trust in the system. It's especially valuable for first-time users who want to understand what the platform will do before letting it modify their filesystem.

---

### US-018: Scaffold Customization / Overrides

**As a** technical PM and developer (Milind),
**I want to** provide overrides and customizations to the default scaffolding (e.g., "skip the hooks directory," "use Python instead of Node," "add a data/ directory"),
**So that** the generated structure matches my actual needs rather than forcing me into a one-size-fits-all template.

**Priority:** Should Have
**Persona:** milind-strategic-builder
**Journey Phase:** A: Problem Understanding
**Feature Story:** FS-001

**Acceptance Criteria:**

1. **Given** I invoke scaffolding with override flags or an override config file,
   **When** the system generates the project,
   **Then** it applies my overrides on top of the template defaults — adding, removing, or modifying directories and files as specified.

2. **Given** I specify an override that conflicts with a template requirement (e.g., removing a file that other generated files reference),
   **When** the system detects the conflict,
   **Then** it warns me about the conflict and asks for confirmation before proceeding, rather than silently generating broken references.

**Notes:** Overrides should be declarative (a config file or flags), not procedural. Consider a `.scaffoldrc` or similar config file format.

---

## For AI Agents

```yaml
user_stories:
  - id: US-001
    title: "Auto-Scaffolding"
    persona: "milind-strategic-builder"
    priority: "Must Have"
    journey_phase: "A: Problem Understanding"
    feature_story: "FS-001"
    as_a: "technical PM and developer (Milind)"
    i_want_to: "describe a project type and have the system automatically generate the full scaffolding"
    so_that: "I can start working on the actual problem within minutes instead of spending hours on setup"
    acceptance_criteria:
      - given: "I invoke the scaffolding command and specify a project type"
        when: "the system processes my request"
        then: "it generates a complete directory structure including CLAUDE.md, AGENTS.md, skills/, commands/, agents/, hooks/, templates/, and docs/ with sensible defaults"
      - given: "I specify a project type that has associated dependencies"
        when: "scaffolding completes"
        then: "the system generates the appropriate dependency manifest with all required dependencies listed"
      - given: "I provide a one-sentence project description alongside the project type"
        when: "scaffolding completes"
        then: "the CLAUDE.md file contains a project-specific overview and agent definitions reference the actual project domain"

  - id: US-002
    title: "PM Discovery Workflow"
    persona: "milind-strategic-builder"
    priority: "Must Have"
    journey_phase: "A: Problem Understanding"
    feature_story: "FS-002"
    as_a: "technical PM and developer (Milind)"
    i_want_to: "a structured PM discovery workflow that extracts requirements through deep conversational questions"
    so_that: "downstream agents have high-quality, detailed requirements to work from"
    acceptance_criteria:
      - given: "I invoke /pm-discover on a new project"
        when: "the discovery workflow begins"
        then: "the system asks at least 5 targeted questions across problem understanding, user identification, and market context before generating artifacts"
      - given: "I complete all six discovery phases"
        when: "the workflow reaches artifact generation"
        then: "the system produces a PRD, user stories, personas, journey map, and PM spec that are internally consistent"
      - given: "I provide vague or incomplete answers"
        when: "the system detects insufficient detail"
        then: "it asks clarifying follow-up questions rather than filling in assumptions"

  - id: US-003
    title: "Judgment Gates with Visual Artifacts"
    persona: "milind-strategic-builder"
    priority: "Must Have"
    journey_phase: "C: User Deep Dive"
    feature_story: "FS-003"
    as_a: "technical PM and developer (Milind)"
    i_want_to: "the system to pause at critical decision points with visual decision-support artifacts"
    so_that: "I can make informed judgments in under 2 minutes per gate"
    acceptance_criteria:
      - given: "the pipeline reaches a judgment gate"
        when: "the gate activates"
        then: "the system presents a structured summary with what was completed, decisions needed, recommended action, and explicit options"
      - given: "a judgment gate involves comparing alternatives"
        when: "the gate presents the comparison"
        then: "it generates an HTML visual artifact saved to docs/pm/"
      - given: "I make a decision at a judgment gate"
        when: "I select an option and provide rationale"
        then: "the system records the decision, rationale, timestamp, and gate ID as a persistent artifact"

  - id: US-004
    title: "SDLC Orchestration Agent"
    persona: "milind-strategic-builder"
    priority: "Must Have"
    journey_phase: "D: Requirements Synthesis"
    feature_story: "FS-004"
    as_a: "technical PM and developer (Milind)"
    i_want_to: "an orchestration agent that manages the full SDLC pipeline"
    so_that: "I only engage at judgment gates while the system handles 80% autonomously"
    acceptance_criteria:
      - given: "I initiate a new project through the orchestration agent"
        when: "the pipeline starts"
        then: "the agent automatically sequences through SDLC stages invoking appropriate sub-agents"
      - given: "a stage completes successfully"
        when: "the orchestration agent evaluates output"
        then: "it routes to judgment gate or proceeds autonomously based on quality thresholds"
      - given: "a stage fails or produces below-threshold output"
        when: "the agent detects the failure"
        then: "it retries with adjusted parameters then escalates to judgment gate if retries exhausted"

  - id: US-005
    title: "Progressive Disclosure"
    persona: "milind-strategic-builder"
    priority: "Must Have"
    journey_phase: "D: Requirements Synthesis"
    feature_story: "FS-005"
    as_a: "technical PM and developer (Milind)"
    i_want_to: "each agent to receive only the context relevant to its task"
    so_that: "agents produce focused output without context window bloat"
    acceptance_criteria:
      - given: "the orchestration agent hands off to a sub-agent"
        when: "it constructs the sub-agent's context"
        then: "context includes only task description, relevant previous artifacts, and applicable decisions"
      - given: "a project has accumulated more than 50,000 tokens of artifacts"
        when: "any single sub-agent is invoked"
        then: "context provided is under 20,000 tokens achieved through scoping not truncation"

  - id: US-006
    title: "Model Routing"
    persona: "milind-strategic-builder"
    priority: "Should Have"
    journey_phase: "D: Requirements Synthesis"
    feature_story: "FS-005"
    as_a: "technical PM and developer (Milind)"
    i_want_to: "automatic routing of tasks to the appropriate model tier"
    so_that: "I optimize for quality and cost without manual model selection"
    acceptance_criteria:
      - given: "a task is classified as low-complexity"
        when: "the orchestration agent routes the task"
        then: "it is sent to Haiku with routing rationale logged"
      - given: "a task routed to a lower-tier model fails quality checks"
        when: "the quality gate detects the failure"
        then: "the system re-routes to the next higher tier automatically"

  - id: US-007
    title: "Knowledge Compounding"
    persona: "milind-strategic-builder"
    priority: "Should Have"
    journey_phase: "F: Handoff"
    feature_story: "FS-006"
    as_a: "technical PM and developer (Milind)"
    i_want_to: "capture learnings from completed projects and feed them into future projects"
    so_that: "the system gets measurably smarter over time"
    acceptance_criteria:
      - given: "a project completes all stages"
        when: "the post-mortem phase runs"
        then: "the system generates a structured learnings artifact saved to a global knowledge base"
      - given: "a new project enters PM discovery"
        when: "the system prepares context"
        then: "it includes relevant learnings from past projects matching the type or domain"

  - id: US-008
    title: "Plugin Composability"
    persona: "milind-strategic-builder"
    priority: "Should Have"
    journey_phase: "D: Requirements Synthesis"
    feature_story: "FS-007"
    as_a: "technical PM and developer (Milind)"
    i_want_to: "install and compose third-party plugins into my workflow"
    so_that: "I leverage existing tools without rebuilding functionality"
    acceptance_criteria:
      - given: "I install a third-party plugin that provides a skill"
        when: "the orchestration agent reaches a relevant stage"
        then: "it automatically invokes the plugin's skill at the appropriate point"
      - given: "two plugins provide overlapping capabilities"
        when: "the orchestration agent detects the conflict"
        then: "it presents a judgment gate for me to choose"

  - id: US-009
    title: "Handoff Quality"
    persona: "milind-strategic-builder"
    priority: "Must Have"
    journey_phase: "F: Handoff"
    feature_story: "FS-004"
    as_a: "technical PM and developer (Milind)"
    i_want_to: "structured artifact handoffs between SDLC stages with explicit contracts"
    so_that: "no context is lost between stages"
    acceptance_criteria:
      - given: "a stage completes and produces output artifacts"
        when: "the orchestration agent prepares the handoff"
        then: "it validates output artifacts conform to expected schema before passing forward"
      - given: "a handoff artifact fails schema validation"
        when: "the error is detected"
        then: "the system auto-corrects minor issues or routes to judgment gate for major issues"
      - given: "the receiving agent encounters a missing reference"
        when: "it processes handoff artifacts"
        then: "it requests the missing artifact from the orchestration agent rather than hallucinating"

  - id: US-010
    title: "Decision Persistence"
    persona: "milind-strategic-builder"
    priority: "Should Have"
    journey_phase: "E: Artifact Review"
    feature_story: "FS-003"
    as_a: "technical PM and developer (Milind)"
    i_want_to: "every judgment gate decision persisted as a structured artifact"
    so_that: "future gates reference past decisions and I have an audit trail"
    acceptance_criteria:
      - given: "I make a decision at a judgment gate"
        when: "the decision is recorded"
        then: "the system persists gate ID, timestamp, decision, alternatives, rationale, and linked artifacts"
      - given: "a later gate involves a topic related to a previous decision"
        when: "the gate prepares decision-support artifacts"
        then: "it includes a Related Past Decisions section"

  - id: US-011
    title: "Anti-Rationalization Verification"
    persona: "milind-strategic-builder"
    priority: "Should Have"
    journey_phase: "E: Artifact Review"
    feature_story: "FS-004"
    as_a: "technical PM and developer (Milind)"
    i_want_to: "verification that agents completed work to spec rather than rationalizing"
    so_that: "quality gates are meaningful and I can trust autonomous stages"
    acceptance_criteria:
      - given: "a sub-agent produces output"
        when: "output is submitted to quality gate"
        then: "a verification agent checks against original requirements and flags unaddressed items, filler, and unsupported claims"
      - given: "verification flags potential rationalization"
        when: "flags are generated"
        then: "the system routes to judgment gate showing output and specific flags"

  - id: US-012
    title: "Humanized Output"
    persona: "milind-strategic-builder"
    priority: "Must Have"
    journey_phase: "C: User Deep Dive"
    feature_story: "FS-003"
    as_a: "technical PM and developer (Milind)"
    i_want_to: "all human-facing output passes through a humanizer stripping AI patterns"
    so_that: "I can trust and quickly process information at judgment gates"
    acceptance_criteria:
      - given: "output is destined for a judgment gate"
        when: "the output is generated"
        then: "it passes through the humanizer and contains no AI verbal tics"
      - given: "the humanizer processes a structured artifact"
        when: "it rewrites the content"
        then: "it preserves structure and data accuracy while improving readability"
      - given: "the humanizer is unavailable"
        when: "the system detects unavailability"
        then: "it proceeds with raw output and adds a visible warning"

  - id: US-013
    title: "Multi-Project-Type Support"
    persona: "milind-strategic-builder"
    priority: "Must Have"
    journey_phase: "A: Problem Understanding"
    feature_story: "FS-001"
    as_a: "technical PM and developer (Milind)"
    i_want_to: "support for different project types with appropriate scaffolding for each"
    so_that: "I have one unified tool for all my projects"
    acceptance_criteria:
      - given: "I specify a project type from the supported list"
        when: "the system generates scaffolding"
        then: "it produces type-specific directories and files"
      - given: "I specify an unsupported project type"
        when: "the system processes my request"
        then: "it generates generic scaffolding based on closest match and flags which parts are generic"
      - given: "I create a new project type template"
        when: "I follow the documented template format"
        then: "the system recognizes and uses the new type without code changes"

  - id: US-014
    title: "GitHub Actions Integration"
    persona: "milind-strategic-builder"
    priority: "Could Have"
    journey_phase: "F: Handoff"
    feature_story: "FS-008"
    as_a: "technical PM and developer (Milind)"
    i_want_to: "CI/CD automation via GitHub Actions"
    so_that: "the pipeline extends into production workflows"
    acceptance_criteria:
      - given: "scaffolding generates a project with CI/CD enabled"
        when: "scaffolding completes"
        then: "it generates .github/workflows/ for code review, feature implementation, and @claude response"
      - given: "I customize generated workflow files"
        when: "future scaffolding updates run"
        then: "the system detects and preserves manual changes"

  - id: US-015
    title: "Session Resumability"
    persona: "milind-strategic-builder"
    priority: "Should Have"
    journey_phase: "E: Artifact Review"
    feature_story: "FS-004"
    as_a: "technical PM and developer (Milind)"
    i_want_to: "resume a closed session exactly where I left off"
    so_that: "I can work across multiple sittings without losing progress"
    acceptance_criteria:
      - given: "I am mid-workflow and close the session"
        when: "I later invoke /pm-resume"
        then: "the system loads previous artifacts, identifies last completed phase, and resumes from the next phase"
      - given: "I resume after significant time"
        when: "the system resumes"
        then: "it presents a brief status summary before continuing"

  - id: US-016
    title: "Artifact Versioning"
    persona: "milind-strategic-builder"
    priority: "Should Have"
    journey_phase: "E: Artifact Review"
    feature_story: "FS-003"
    as_a: "technical PM and developer (Milind)"
    i_want_to: "versioned artifacts with diff capability"
    so_that: "I have an audit trail of how requirements evolved"
    acceptance_criteria:
      - given: "an artifact is revised"
        when: "the revision is saved"
        then: "the system saves with incremented version number and preserves the previous version"
      - given: "I want to compare versions"
        when: "I invoke the diff command"
        then: "the system presents a human-readable diff"

  - id: US-017
    title: "Dry-Run / Preview Mode"
    persona: "milind-strategic-builder"
    priority: "Could Have"
    journey_phase: "D: Requirements Synthesis"
    feature_story: "FS-001"
    as_a: "technical PM and developer (Milind)"
    i_want_to: "preview scaffolding output before committing"
    so_that: "I catch misconfigurations early without undoing generated work"
    acceptance_criteria:
      - given: "I invoke scaffolding with --dry-run"
        when: "the system processes scaffolding"
        then: "it outputs a tree view of files that would be created without creating them"
      - given: "I approve a dry-run output"
        when: "I confirm"
        then: "the system generates exactly what was previewed"

  - id: US-018
    title: "Scaffold Customization / Overrides"
    persona: "milind-strategic-builder"
    priority: "Should Have"
    journey_phase: "A: Problem Understanding"
    feature_story: "FS-001"
    as_a: "technical PM and developer (Milind)"
    i_want_to: "provide overrides and customizations to default scaffolding"
    so_that: "generated structure matches my actual needs"
    acceptance_criteria:
      - given: "I invoke scaffolding with override flags or config"
        when: "the system generates the project"
        then: "it applies overrides on top of template defaults"
      - given: "an override conflicts with a template requirement"
        when: "the system detects the conflict"
        then: "it warns about the conflict and asks for confirmation"
```
