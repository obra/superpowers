---
artifact: prd
project: "Claude Code Scaffolding Platform"
date: "2026-02-19"
status: approved
phase: D
---

# Product Requirements Document: Claude Code Scaffolding Platform

## Executive Summary

A deeply customized fork of Superpowers (obra/superpowers) that transforms Claude Code from a capable but unstructured AI coding assistant into a judgment-gated SDLC automation platform. The system adds three layers missing from the current ecosystem: (1) a PM discovery module that deeply extracts requirements before any code is written, (2) an orchestration agent that manages the full pipeline autonomously while surfacing visual decision-support artifacts at judgment gates, and (3) a context management system with progressive disclosure and model routing. Built for a single power user who runs diverse projects (software, courses, content, personal) and wants 80/20 autonomy — 80% automated, 20% human judgment at the moments that matter.

## Problem Statement

Technical professionals who use Claude Code across multiple project types face high activation energy to start new projects because proper scaffolding must be manually recreated each time. Without structure, coding agents produce poor output — they build the wrong thing, skip tests, waste tokens on wrong models, and lose context between stages. The core frustration is the resistance to getting started: the gap between having an idea and having a properly structured project with clear requirements, the right directory layout, appropriate agent configurations, and a workflow that enforces quality at every stage.

Secondary problems compound this:
- **No PM layer exists** in any Claude Code plugin ecosystem. Projects jump straight from idea to code, skipping the requirements and design phases that determine success.
- **Context is lost between SDLC stages.** What the PM phase discovers does not flow structured into brainstorming, planning, or implementation.
- **Token waste is rampant.** Opus-class models are used for tasks that Haiku or Sonnet could handle, because no routing intelligence exists.
- **Quality verification is manual.** There are no automated hooks to catch rationalization, hallucination, or drift from requirements.
- **Knowledge does not compound.** Each project starts from zero. Learnings from past projects are not captured or reused.

## Target Users

Primary persona: **Milind — The Strategic Builder**. Technical PM/developer, business owner, AI course creator. Runs 5+ concurrent projects across software development, course creation, content writing, and business operations. Wants to leverage AI at 5-10x productivity but is constrained by the manual overhead of scaffolding, requirements gathering, and workflow management. Values judgment and verification over speed.

### User Segments

| Segment | Description | Priority |
|---|---|---|
| Strategic Builder | Technical professional running diverse AI-augmented projects who needs structured workflows and judgment gates to maintain quality at scale | Primary |
| AI-First Developer | Developer who has adopted Claude Code and wants to extend it with PM and orchestration capabilities but lacks the scaffolding | Secondary (future) |

## Goals & Success Metrics

| Goal | Metric | Target |
|---|---|---|
| Reduce project startup friction | Time from idea to structured project with scaffolding, CLAUDE.md, and first skill | < 5 minutes (from 30+ minutes manual) |
| Improve requirements quality | Rework cycles after implementation begins (requirements missed or misunderstood) | 0-1 cycles (from 3+) |
| Reduce token waste | Percentage of Opus tokens used for tasks Sonnet/Haiku could handle | < 20% (from ~80% currently) |
| Increase project completion rate | Projects that reach "shipped" status vs. abandoned | > 70% completion (from ~30%) |
| Build knowledge compounding | Reusable learnings captured and applied to subsequent projects | > 5 documented solutions per quarter feeding into new project scaffolding |
| Maintain human judgment quality | Decision gate approval rate (decisions the user would make again after reflection) | > 90% satisfaction with gated decisions |

## Feature Requirements

### Must Have (P0)

| ID | Feature | Description | User Stories |
|---|---|---|---|
| FR-001 | Auto-Scaffolding Engine | Generate complete project scaffolding based on project type (software, course, content, planning). Includes CLAUDE.md, directory structure, skills, agents, hooks, and workflows. Template-driven with automatic type detection. | US-001, US-002, US-003 |
| FR-002 | PM Discovery Module | Structured 6-phase discovery workflow: Problem Understanding, Market Context, User Deep Dive, Requirements Synthesis, Artifact Review, Handoff. Generates personas, journey maps (markdown + HTML), user stories, feature stories, PRD, and PM spec. Deep conversational extraction with web research. | US-004, US-005, US-006 |
| FR-003 | Judgment Gate System | Structured decision points surfaced with visual artifacts. Humanized output (strip AI patterns). Decision persistence. Clear action prompts. Gates at: requirements approval, architecture decisions, implementation review, acceptance review. | US-007, US-008 |
| FR-004 | SDLC Orchestration Agent | Conductor managing full pipeline: PM discovery, brainstorming, planning, implementation, review, shipping. Handles handoffs with structured artifacts. Enforces verification at each stage. Routes to judgment gates. Implements 80/20 autonomy model. | US-009, US-010, US-011 |
| FR-005 | Context Management System | Progressive disclosure delivering right context to right agent at right time. Model routing (Haiku for verification, Sonnet for standard tasks, Opus for complex reasoning). Scoped agent context. Context-as-dictionary between stages. | US-012, US-013 |
| FR-006 | Humanized Output | All human-facing output passes through humanization layer. Strip AI crutch phrases, filler words, and formulaic patterns. Integration with Trail of Bits humanizer plugin. | US-014 |
| FR-007 | Multi-Project-Type Support | First-class support for software development, course development, content writing, business operations, and personal planning. Each type has its own scaffolding template, workflow, and artifact set. | US-001, US-015 |
| FR-008 | Structured Artifact Handoffs | Every SDLC stage produces machine-consumable output that the next stage can parse. PRD flows to brainstorm. Design doc flows to plan. Plan flows to implementation. Structured YAML/markdown format. | US-010, US-016 |

### Should Have (P1)

| ID | Feature | Description | User Stories |
|---|---|---|---|
| FR-009 | Knowledge Compounding Engine | Capture learnings, solutions, and patterns in docs/solutions/. Feed discoveries into future project planning and review stages. Integrate with skill-extractor for reusable skill generation. | US-017, US-018 |
| FR-010 | Plugin Composition Framework | Install and compose third-party Claude Code plugins: humanizer, last30days, planning-with-files, react-pdf, productivity, marketing, data analysis. Manage plugin dependencies and configuration. | US-019 |
| FR-011 | Automatic Model Routing | Task-to-model assignment based on complexity analysis. Haiku for verification hooks and simple queries. Sonnet for standard code generation and planning. Opus for complex reasoning, architecture, and PM synthesis. | US-012, US-013 |
| FR-012 | Decision Persistence | Every judgment gate decision stored as a dated artifact in docs/decisions/. Include context, options considered, decision made, and rationale. Searchable and referenceable. | US-020 |
| FR-013 | Anti-Rationalization Verification | Haiku-based verification hook that checks agent output for rationalization, hallucination, or drift from requirements before presenting to user. Runs automatically at judgment gates. | US-021 |

### Could Have (P2)

| ID | Feature | Description | User Stories |
|---|---|---|---|
| FR-014 | CI/CD Integration | GitHub Actions workflows for automated testing, linting, and deployment triggered by pipeline stages. | US-022 |
| FR-015 | MCP Knowledge Base | Persistent cross-project knowledge via MCP server (Archon pattern). Queryable project history, decision history, and solution library. | US-023 |
| FR-016 | Cross-Agent Portability | SkillKit integration for skills that work across Claude Code, Cursor, GitHub Copilot. Write once, run in multiple AI coding environments. | US-024 |

### Won't Have (P3 — explicitly deferred)

| ID | Feature | Reason for Deferral |
|---|---|---|
| FR-030 | Multi-user/team features | Single-user system. Team features add complexity with no current value. |
| FR-031 | SaaS hosting | No web deployment needed. Runs locally via Claude Code CLI. |
| FR-032 | Custom UI/dashboard | Terminal + HTML artifacts are sufficient. Custom UI is premature optimization. |
| FR-033 | Non-Claude AI agent support | Platform is built on Claude Code. Supporting other agents dilutes focus. |

## Constraints & Assumptions

### Constraints
- **Single user (Milind):** No multi-tenant, auth, or permission requirements. Simplifies architecture but means no user testing with others.
- **Fork of Superpowers:** Must maintain compatibility with upstream Superpowers updates. Cannot diverge so far that rebasing becomes impossible.
- **Claude Code plugin architecture:** Must follow Anthropic's plugin conventions (CLAUDE.md, skills/, commands/, hooks/, agents/). Cannot require custom CLI modifications.
- **Token budget awareness:** System must be cost-efficient. Opus usage must be justified. Model routing is a constraint, not just a feature.
- **Personal project:** No marketplace publishing requirements initially, but architecture should not preclude it.
- **Node.js runtime:** Superpowers is Node.js-based. All scripts and tooling must work in this environment.

### Assumptions
- Claude Code's plugin/skill system will remain stable through at least mid-2026
- Anthropic will continue supporting the current CLAUDE.md, skills, hooks, and agent architecture
- Superpowers (obra/superpowers) will continue active development and remain the leading Claude Code plugin framework
- MCP protocol will remain the standard for tool integration with Claude
- Model pricing will remain in the current range (or decrease), making model routing economically worthwhile
- The user will continue running 5+ concurrent projects across multiple types

## Competitive Context

The Claude Code plugin ecosystem is rapidly growing but no existing solution combines PM discovery, SDLC orchestration, and judgment gating.

| Competitor | Stars | Strengths | Gaps |
|---|---|---|---|
| Superpowers (obra) | 55.4k | Comprehensive dev execution skills, large community, well-structured plugin architecture | No PM layer, no orchestration, no judgment gates, no model routing |
| BMAD Method | 36.5k | Full SDLC methodology from PM through deployment | Monolithic approach, hard to compose with other plugins, no visual artifacts |
| Compound Engineering | — | Pipeline model with plan-approval gates, knowledge compounding | Not a Claude Code plugin, different architecture |
| Archon | 13.7k | MCP knowledge base, CLI orchestration patterns | Focused on agent building, not SDLC workflow |
| Claude Code Plugins (various) | — | Individual capabilities (humanizer, planning, etc.) | No integration layer, no PM phase, no orchestration |

**Key differentiators for this product:**
- Only solution with a dedicated PM discovery phase that generates structured, visual artifacts before any code is written
- Judgment gates with visual decision-support artifacts — not just approval prompts
- Context management with model routing — right model for right task
- Knowledge compounding across projects — each project makes the next one easier
- Multi-project-type support — not just software development

## Open Questions

- **Superpowers fork strategy:** How to structure the fork to minimize merge conflicts while adding significant new capabilities? Overlay vs. deep integration?
- **Model routing implementation:** Should routing be rule-based (task type -> model) or adaptive (learn from usage patterns)?
- **Plugin composition conflicts:** How to handle cases where composed plugins have conflicting hooks or commands?
- **Knowledge compounding format:** What structure for docs/solutions/ maximizes reusability across project types?
- **Verification hook performance:** Will Haiku-based anti-rationalization hooks add unacceptable latency to the workflow?

---

## For AI Agents

```yaml
requirements:
  must_have:
    - id: FR-001
      name: "Auto-Scaffolding Engine"
      description: "Generate complete project scaffolding based on project type with CLAUDE.md, directory structure, skills, agents, hooks, and workflows"
      acceptance_criteria:
        - given: "A user starts a new software project"
          when: "They run the scaffolding command with project type 'software'"
          then: "A complete project directory is created with CLAUDE.md, skills/, agents/, hooks/, templates/, and appropriate starter configurations"
        - given: "A user starts a new course project"
          when: "They run the scaffolding command with project type 'course'"
          then: "A course-specific directory is created with curriculum/, modules/, exercises/, and course-specific CLAUDE.md"
      user_stories: [US-001, US-002, US-003]
      personas: [persona-milind]
    - id: FR-002
      name: "PM Discovery Module"
      description: "Structured 6-phase discovery workflow generating personas, journey maps, user stories, feature stories, PRD, and PM spec"
      acceptance_criteria:
        - given: "A user initiates PM discovery for a new project"
          when: "They complete all 6 phases of the discovery workflow"
          then: "A complete set of PM artifacts is generated in docs/pm/ with structured YAML frontmatter and machine-consumable sections"
        - given: "The PM discovery module runs Phase B (Market Context)"
          when: "The market-researcher agent executes"
          then: "Real competitive data is gathered via WebSearch/WebFetch and synthesized into the competitive context section"
      user_stories: [US-004, US-005, US-006]
      personas: [persona-milind]
    - id: FR-003
      name: "Judgment Gate System"
      description: "Structured decision points with visual artifacts, humanized output, and decision persistence"
      acceptance_criteria:
        - given: "The orchestration agent reaches a decision point"
          when: "A judgment gate is triggered"
          then: "The user is presented with a visual summary artifact, clear options, and a structured decision prompt"
        - given: "The user makes a decision at a judgment gate"
          when: "The decision is recorded"
          then: "The decision is persisted as a dated artifact with context, options, and rationale"
      user_stories: [US-007, US-008]
      personas: [persona-milind]
    - id: FR-004
      name: "SDLC Orchestration Agent"
      description: "Conductor managing full pipeline from PM discovery through shipping with structured handoffs and verification"
      acceptance_criteria:
        - given: "A user initiates the full SDLC pipeline"
          when: "The orchestration agent runs"
          then: "Each stage executes in order with structured artifact handoffs, and the agent pauses at judgment gates for human input"
        - given: "A pipeline stage produces output"
          when: "The orchestrator processes the handoff"
          then: "The output is validated against the expected schema before passing to the next stage"
      user_stories: [US-009, US-010, US-011]
      personas: [persona-milind]
    - id: FR-005
      name: "Context Management System"
      description: "Progressive disclosure with model routing and scoped agent context"
      acceptance_criteria:
        - given: "A specialized agent is invoked"
          when: "The context management system prepares its context"
          then: "Only relevant context is included, and the appropriate model is selected based on task complexity"
      user_stories: [US-012, US-013]
      personas: [persona-milind]
    - id: FR-006
      name: "Humanized Output"
      description: "All human-facing output passes through humanization to strip AI patterns and filler"
      acceptance_criteria:
        - given: "An agent produces human-facing output"
          when: "The output is processed through the humanizer"
          then: "AI crutch phrases, filler words, and formulaic patterns are removed while preserving meaning and tone"
      user_stories: [US-014]
      personas: [persona-milind]
    - id: FR-007
      name: "Multi-Project-Type Support"
      description: "First-class scaffolding and workflows for software, course, content, business, and personal project types"
      acceptance_criteria:
        - given: "A user specifies a project type"
          when: "The scaffolding engine runs"
          then: "Type-specific templates, workflows, and artifact sets are generated"
      user_stories: [US-001, US-015]
      personas: [persona-milind]
    - id: FR-008
      name: "Structured Artifact Handoffs"
      description: "Every SDLC stage produces machine-consumable output for the next stage"
      acceptance_criteria:
        - given: "The PM phase completes"
          when: "The PRD and PM spec are generated"
          then: "They contain a PRP section that a brainstorming agent can parse without additional context"
      user_stories: [US-010, US-016]
      personas: [persona-milind]
  should_have:
    - id: FR-009
      name: "Knowledge Compounding Engine"
      description: "Capture and reuse learnings across projects"
      user_stories: [US-017, US-018]
    - id: FR-010
      name: "Plugin Composition Framework"
      description: "Install and manage third-party Claude Code plugins"
      user_stories: [US-019]
    - id: FR-011
      name: "Automatic Model Routing"
      description: "Task-to-model assignment based on complexity"
      user_stories: [US-012, US-013]
    - id: FR-012
      name: "Decision Persistence"
      description: "Store all judgment gate decisions as dated artifacts"
      user_stories: [US-020]
    - id: FR-013
      name: "Anti-Rationalization Verification"
      description: "Haiku-based verification hook for agent output quality"
      user_stories: [US-021]
  could_have:
    - id: FR-014
      name: "CI/CD Integration"
      description: "GitHub Actions workflows triggered by pipeline stages"
      user_stories: [US-022]
    - id: FR-015
      name: "MCP Knowledge Base"
      description: "Persistent cross-project knowledge via MCP server"
      user_stories: [US-023]
    - id: FR-016
      name: "Cross-Agent Portability"
      description: "SkillKit integration for multi-environment skills"
      user_stories: [US-024]
  wont_have:
    - id: FR-030
      name: "Multi-user/team features"
      reason: "Single-user system, no current value"
    - id: FR-031
      name: "SaaS hosting"
      reason: "Runs locally via CLI"
    - id: FR-032
      name: "Custom UI/dashboard"
      reason: "Terminal + HTML artifacts sufficient"
    - id: FR-033
      name: "Non-Claude AI agent support"
      reason: "Platform built on Claude Code exclusively"
```
