# PM Discovery Research — Consolidated Reference

> **Purpose:** This document is the single source of truth for all PM discovery research conducted during Phases A through C. Any future Claude Code session should be able to read this file and have full context for the project without prior conversation history.
>
> **Last updated:** 2026-02-19
> **Status:** Complete through Phase C (User Deep Dive)

---

## Table of Contents

- [Phase A: Problem Understanding](#phase-a-problem-understanding)
- [Phase B: Market Landscape](#phase-b-market-landscape)
- [Phase C: User Deep Dive](#phase-c-user-deep-dive)
- [Reference Projects and Patterns](#reference-projects-and-patterns)
- [Differentiators — What No Existing Tool Has](#differentiators--what-no-existing-tool-has)

---

## Phase A: Problem Understanding

### Problem Statement

Technical professionals who use Claude Code across multiple project types (software dev, content, courses, personal planning) face high activation energy to start new projects because proper scaffolding — CLAUDE.md, skills, agents, workflows, directory conventions — must be manually recreated each time. Without this structure, coding agents produce poor output. Existing solutions (BMAD Method, AgentOS, etc.) exist but don't fully satisfy requirements for security, flexibility, best-practice alignment, and extensibility.

### Target Users

Technical power users of Claude Code who run diverse projects and want structured, repeatable workflows with human judgment gates.

### Current Alternatives

| Alternative | Status | Limitation |
|---|---|---|
| Manual scaffolding per session | Most common approach | Repetitive, error-prone, no knowledge transfer between sessions |
| BMAD Method | Open source, partially evaluated | Too monolithic, doesn't check all boxes for security/flexibility |
| AgentOS | Open source, partially evaluated | Doesn't fully satisfy extensibility and best-practice alignment |

### Core Frustration

The resistance to getting started — the gap between having an idea and having a properly structured project where agents can do high-quality work.

### Specific Pain Points

1. **Manual and repetitive CLAUDE.md setup** — Every new project requires recreating configuration from scratch.
2. **Context loss between agent stages** — Plans, goals, and requirements don't transfer cleanly from one stage to the next.
3. **Agent drift** — Agents build the wrong thing, skip tests, introduce errors when working without proper structure.
4. **No progressive disclosure** — Context gets dumped all at once instead of being scoped per agent, leading to confusion and wasted tokens.
5. **Model misrouting** — Using Opus for tasks that Sonnet could handle, wasting tokens and bandwidth.
6. **Over-broad agent scoping** — Agents aren't scoped to only the context they need, leading to noisy and unfocused work.

### Unique Angle: Judgment-Gated Automation

Embed a philosophy where humans insert judgment at critical decision points (PM discovery, requirements, architecture), then let Claude Code's agentic capabilities run at full speed on execution. The PM artifacts generator is the first proof of this approach.

### Foundational Philosophy

These seven principles MUST be embedded throughout the system. They are non-negotiable and inform every design decision:

1. **Judgment before tools** — Understanding WHEN and WHY matters more than HOW.
2. **Know where you end and the tool begins** — Recognize the boundary between human judgment and agent execution.
3. **Competence breeds confidence** — Real skill removes fear. The system should build capability, not dependency.
4. **Learn by doing your own work** — Context-specific practice beats generic instruction.
5. **Verify before you trust** — Critical thinking is the bedrock. Never accept agent output uncritically.
6. **The frontier is always moving** — Build the habit of finding capability boundaries, not memorizing today's limitations.
7. **Amplification, not replacement** — Domain knowledge is what gets amplified. The system makes experts more powerful, not obsolete.

---

## Phase B: Market Landscape

### Strategic Decision

**Fork Superpowers (obra/superpowers) as the foundation.**

Integration depth: Deep fork — modify core, add skills, add orchestration agent, add PM layer.

Philosophy: **80/20 autonomy** — agent handles 80%, human decides 20% at structured judgment gates.

### Key Players Evaluated

#### Superpowers (obra/superpowers) — PRIMARY FOUNDATION
- **Stars:** 55.4k
- **Role:** Already in use. Anthropic-endorsed. Extensible via plugins.
- **Gap:** Focused on dev execution, no PM phase. This project fills that gap.
- **Decision:** Fork and extend.

#### BMAD Method — CHERRY-PICK PATTERNS
- **Stars:** 36.5k
- **Role:** PM patterns source.
- **What to adopt:** PRD structure, RICE/MoSCoW prioritization frameworks.
- **What to skip:** Too monolithic to adopt wholesale.

#### Compound Engineering (Every Inc) — CRITICAL REFERENCE
- **Role:** Has the closest pipeline to the target architecture.
- **Pipeline:** brainstorm -> plan -> work -> review -> compound.
- **Key pattern:** Plan approval workflow — this is a judgment gate pattern.
- **Key pattern:** Knowledge compounding loop — docs/solutions/ feeds future planning.
- **Decision:** Adopt pipeline structure and compounding patterns.

#### wshobson/agents — SKILLS LIBRARY
- **Stars:** 28.9k
- **Role:** Browse for useful agent definitions and skill patterns.

#### Archon — ORCHESTRATION REFERENCE
- **Stars:** 13.7k
- **Key patterns:** MCP knowledge base, command-file prompting, git worktree sandboxing.
- **Insight:** Demonstrates Claude CLI can be orchestrated programmatically.

#### SkillKit — FUTURE INTEGRATION
- **Stars:** 355
- **Role:** Future cross-agent distribution layer for sharing skills across projects.

---

## Phase C: User Deep Dive

### Primary Persona: Milind — The Strategic Builder

| Attribute | Detail |
|---|---|
| **Role** | Technical PM and software developer |
| **Context** | Running a business and teaching AI courses |
| **Tool usage** | Uses Claude Code daily across diverse project types |
| **Primary goal** | 5-10x productivity, delegate 80% of work to agents, stay strategic |
| **Core frustrations** | Repetitive scaffolding, agent drift, token waste, abandoned projects |
| **Defining quote** | "It's like having a brilliant employee with no manager." |

#### Jobs to Be Done

- Rapidly go from business problem to structured project with proper agent scaffolding.
- Maintain strategic control while delegating execution.
- Ensure agents produce high-quality output by providing proper context and constraints.
- Avoid token waste by routing tasks to the right model tier.
- Compound knowledge across projects so each new project benefits from past work.

#### Forces Analysis

| Force | Description |
|---|---|
| **Push** | Business problems need solving NOW — urgency drives adoption |
| **Pull** | Vision of delegated orchestration — the ideal state is compelling |
| **Anxiety** | Over-optimization loop — risk of spending more time configuring than building |
| **Habit** | Manual scaffolding is familiar, even though it's painful |

### Current Journey (Broken)

| Step | Action | Emotional State |
|---|---|---|
| 1 | Business problem surfaces | Motivated |
| 2 | Write in notebook to crystallize thinking | Focused |
| 3 | Manual scaffolding setup (CLAUDE.md, dirs, configs) | Friction builds |
| 4 | Best practices configuration | Momentum fading |
| 5 | /brainstorm requirements | Frustrated — doesn't extract well |
| 6 | Bad plans generated from bad requirements | Concerned |
| 7 | Agent builds the wrong thing | Angry |
| 8 | Rework cycles begin | Exhausted |
| 9 | Project stalls or is abandoned | Defeated |

**Key insight:** The journey breaks down at step 3 (scaffolding friction) and never recovers. Each subsequent step amplifies the damage from the initial friction.

### Ideal Journey (Target State)

| Step | Action | Emotional State |
|---|---|---|
| 1 | Business problem surfaces | Motivated |
| 2 | Quick capture — tell the system the problem | Focused |
| 3 | PM discovery — system extracts deeply through structured conversation | Heard, understood |
| 4 | Auto-scaffolding — system generates all project structure | Relieved |
| 5 | **Judgment Gate #1:** Review PM artifacts (PRD, stories, personas) | In control |
| 6 | Autonomous execution — agent builds according to approved artifacts | Free to focus elsewhere |
| 7 | **Judgment Gate #2:** Architecture and trade-off decisions | Strategic |
| 8 | **Judgment Gate #3:** Acceptance review | Proud |
| 9 | Ship | Amazing |

**Key insight:** The ideal journey has THREE judgment gates, not one. Each gate curates information specifically for the decision at hand.

### Critical Requirement: Judgment Gate Design

Judgment gates are NOT simple approve/reject checkpoints. They are structured decision-support interfaces.

#### What a Judgment Gate Must Do

1. **Curate the right information** — Surface exactly what the human needs to decide well. No more, no less.
2. **Present in the right format** — Visual artifacts (graphs, tables, journey maps, comparison matrices), not walls of text.
3. **Ask the right question** — Frame the decision clearly so the human knows what they are actually deciding.
4. **Persist decision artifacts** — Store the decision and its rationale for future gates to build on.

#### Four Questions Every Gate Must Answer

1. What information would aid the user to take a better judgment call?
2. What does the user need in order to exercise that judgment?
3. What format can best represent the information for quick comprehension?
4. What information needs to be stored so future judgment gates can reference it?

---

## Reference Projects and Patterns

### Compound Engineering Patterns to Adopt

| Pattern | Description | Application |
|---|---|---|
| Pipeline-as-slash-commands | Each SDLC stage is a slash command | `/pm-discover` -> `/brainstorm` -> `/write-plan` -> `/execute-plan` -> `/code-review` -> `/commit-push-pr` -> `/pm-review` |
| `/lfg` autonomous chaining | Pipeline stages chain automatically when gates pass | After judgment gate approval, trigger next stage without user intervention |
| Plan approval workflow | Human reviews and approves plan before execution | Judgment gate #2 (architecture decisions) |
| Severity-based gates | P1 blocks pipeline, P2 must be fixed, P3 is optional | Code review and PM review gates use tiered severity |
| Knowledge compounding loop | `docs/solutions/` feeds future planning | Every completed project enriches the knowledge base for future projects |
| Parallel specialist agents | Multiple agents work concurrently, results are synthesized | Market researcher + user interviewer can run in parallel during discovery |
| Task dependencies as workflow DAG | Tasks declare dependencies, execution follows the graph | Phase D artifact generation depends on Phase A-C completion |

### Anthropic Best Practices to Follow

| Practice | Detail |
|---|---|
| CLAUDE.md size | Keep under 500 lines. Use `@path` imports for additional context. |
| Skill loading | Skills load descriptions only (~2% of context window). Full content loads on invocation. |
| Model routing | Haiku for search/classification, Sonnet for analysis/generation, Opus for architecture/complex reasoning. |
| Subagent scoping | Restrict tools per agent. Use `context: fork` for isolation so subagents don't pollute parent context. |
| Agent teams | Shared task lists, peer messaging, plan approval gates for coordination. |
| Hooks vs CLAUDE.md | Hooks guarantee execution (they run automatically). CLAUDE.md is advisory (agents may ignore it). Use hooks for critical behaviors. |
| CI/CD automation | GitHub Actions for automated testing, deployment, and quality gates. |

### Archon Patterns to Adopt

| Pattern | Description | Application |
|---|---|---|
| Command-file prompting | `.claude/commands/*.md` with `$ARGUMENTS` placeholder | All slash commands follow this pattern for consistency |
| Context-as-dictionary | Structured context object flows between pipeline stages | PM artifacts become the context dictionary for downstream stages |
| MCP as integration surface | MCP servers provide knowledge base and task management | Future: MCP server for PM artifact storage and retrieval |
| Git worktree sandboxing | Concurrent execution in isolated worktrees | Future: parallel agent execution without file conflicts |
| State persistence | Multiple backend options for persisting state | Session state survives across Claude Code restarts |

### Trail of Bits Patterns to Adopt

| Pattern | Description | Application |
|---|---|---|
| Anti-rationalization Stop hook | Haiku model verifies work is actually complete before agent claims "done" | Prevents agents from declaring victory prematurely |
| `fix-issue.md` 10-step pipeline | Autonomous issue resolution with structured steps | Template for autonomous execution phases between judgment gates |
| Workflow-skill-design plugin | Structured skill creation with proper metadata | Use when extracting new skills from successful workflows |
| Compound Engineering swarm | Parallel agent orchestration | Scale to multiple specialist agents during discovery and execution |

### Anthropic Knowledge Work Plugins to Integrate

| Plugin | Capability | Integration Point |
|---|---|---|
| productivity | Task management + memory | Core task tracking across pipeline stages |
| product-management | `/write-spec`, `/synthesize-research` | PM discovery phase — spec generation and research synthesis |
| marketing | Content engine | Future: marketing artifact generation |
| data | `/analyze`, `/build-dashboard` | Future: analytics dashboard for project health |
| ~~ placeholder connectors | Tool-agnostic skill interfaces | Future: abstract away specific tool dependencies |

### Trail of Bits Curated Plugins to Integrate

| Plugin | Capability | Integration Point |
|---|---|---|
| humanizer | Make agent output more natural and readable | Run at every judgment gate to improve artifact readability |
| planning-with-files | Persistent task tracking via files | Back task state with files for durability across sessions |
| skill-extractor | Extract workflows as reusable skills | Learning loop — successful workflows become new skills automatically |
| last30days | Recent market and news research | Market researcher agent during Phase B |
| react-pdf | Polished PDF artifact generation | Visual artifacts at judgment gates (journey maps, experience maps) |

---

## Differentiators — What No Existing Tool Has

These are the capabilities that set this project apart from every evaluated alternative:

1. **Judgment gates with visual decision-support artifacts** — Not just approve/reject, but curated visual information (journey maps, comparison matrices, persona cards) designed to support better human decisions.

2. **Decision artifact persistence** — Every judgment gate decision is stored with its rationale, context, and supporting data. Future gates reference past decisions to maintain coherence.

3. **PM-phase orchestration** — The pipeline starts at "understand the problem," not "write the code." No other tool covers the full journey from business problem to shipped product.

4. **Model routing per SDLC stage** — Automatic selection of the right model tier (Haiku/Sonnet/Opus) based on the cognitive demands of each stage, reducing token waste.

5. **80/20 autonomy philosophy baked into the system** — The 80% automation / 20% human judgment split is not a feature but a core architectural principle that shapes every design decision.

---

## Appendix: Full SDLC Pipeline

```
Stage 0: /pm-discover (this plugin)
    Input:  Business problem (verbal or written)
    Output: PRD, user stories, journey maps, personas, PRP
    Gate:   Judgment Gate #1 — artifact review and approval

Stage 1: /brainstorm (superpowers)
    Input:  Approved PM artifacts
    Output: Design document
    Note:   Can be skipped if PM discovery was thorough
    Gate:   None (feeds directly into planning)

Stage 2: /write-plan (superpowers)
    Input:  Design document + PM artifacts
    Output: Task-by-task implementation plan
    Gate:   Judgment Gate #2 — architecture and trade-off decisions

Stage 3: /execute-plan OR /feature-dev (superpowers)
    Input:  Approved plan
    Output: Working code + tests
    Gate:   None (feeds into review)

Stage 4: /code-review (code-review plugin)
    Input:  Completed code
    Output: Review with categorized issues (P1/P2/P3)
    Gate:   Severity-based — P1 blocks, P2 must fix, P3 optional

Stage 5: /commit-push-pr (commit-commands)
    Input:  Reviewed and fixed code
    Output: PR ready for merge
    Gate:   None

Stage 6: /pm-review (this plugin)
    Input:  Shipped feature + original PM artifacts
    Output: Acceptance/rejection + user testing directions
    Gate:   Judgment Gate #3 — acceptance review
```
