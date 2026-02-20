---
artifact: personas
project: "Claude Code Scaffolding Platform"
date: "2026-02-19"
status: approved
phase: D
---

# User Personas: Claude Code Scaffolding Platform

## Persona Index

| ID | Name | Archetype | Segment | Priority |
|---|---|---|---|---|
| persona-1 | Milind | The Strategic Builder | Technical PM / Developer-Founder | Primary |

---

## persona-1: Milind

### The Strategic Builder

> "It's like having a brilliant employee with no manager. The capability is there but the direction and oversight are missing."

**Background:** Milind is a technical PM and software developer who runs a business and teaches AI courses (including "AI 201: 7-Day AI Decision Install" via Execution Squad). He uses Claude Code daily across diverse project types — software development, course creation, content writing, and personal planning. He builds Claude Code plugins, understands the skills/agents/hooks architecture deeply, and uses git worktrees for parallel development. He operates at the intersection of product strategy and hands-on engineering, always seeking ways to delegate implementation while retaining judgment.

### Profile

| Attribute | Details |
|---|---|
| **Segment** | Technical PM / Developer-Founder |
| **Demographics** | Business owner, AI educator, daily Claude Code power user |
| **Technical Skill** | High — builds Claude Code plugins, understands skills/agents/hooks architecture, uses git worktrees, comfortable with full SDLC tooling |
| **Current Tools** | Claude Code (daily), Claude Code plugins ecosystem, git/GitHub, notebook (physical), /brainstorm command, manual CLAUDE.md scaffolding |

### Jobs to Be Done

1. **When** I have a business problem that needs a software solution, **I want to** describe the problem and let an orchestrated system handle the full SDLC, **so I can** focus on strategic decisions instead of implementation details.
2. **When** I start a new project, **I want to** have the scaffolding automatically generated based on the project type, **so I can** avoid wasting energy on repetitive setup that kills momentum.
3. **When** an agent needs my input at a critical decision point, **I want to** see visual, well-curated decision-support artifacts, **so I can** make informed judgments quickly without diving into implementation details.

### Pain Points

**Functional:**
- Repetitive manual scaffolding (CLAUDE.md, directory structure, conventions) is different every time with no repeatable process
- /brainstorm doesn't extract requirements deeply enough, leading to shallow specs that cause agent drift
- Burns expensive Opus tokens on tasks that Sonnet or Haiku could handle effectively
- Context gets lost between agent handoffs — no persistent memory across the pipeline

**Emotional:**
- Momentum fades during manual setup, building resistance to starting new projects
- Feels defeated when agents build the wrong thing after investing time in requirements
- Anxiety about over-optimizing the tool instead of using it to solve actual business problems

**Social:**
- Projects stall or get abandoned, meaning business problems remain unsolved and commitments go unmet
- The gap between the AI capability he teaches about and the friction he experiences daily

### Goals & Desired Outcomes

- Leverage AI at 5-10x productivity — not 1.5x with extra hassle
- Delegate 80% of project work to agents, keeping 20% for judgment calls
- Stay strategic, not stuck in implementation details
- Ship projects that solve real business problems on time
- Break the optimization loop — use the tool instead of endlessly building the tool
- Feel amazing and proud of the systems built
- Move from monitoring AI to being confident in judgment gates
- Delegate AI interactions for business tasks with confidence

### Forces of Progress

| Force | Description |
|---|---|
| **Push** (pain with current) | Business problems need solving NOW; the current manual process is too slow, too repetitive, and leads to broken foundations that waste time downstream |
| **Pull** (attraction to new) | The vision of delegating to an orchestrated system that just works — describe a problem, make a few judgment calls, and ship |
| **Anxiety** (fear of change) | What if I over-optimize the tool instead of using it? What if the system still builds the wrong thing? What if I lose the competence that comes from doing my own work? |
| **Habit** (comfort with old) | Writing in the notebook, manually setting up scaffolding each time, falling into the optimization loop, reaching for Opus when Sonnet would suffice |

### Fundamental Philosophy

These principles are non-negotiable and MUST be respected by any system designed for Milind:

1. **Judgment before tools** — The human decides; the tool executes
2. **Know where you end and the tool begins** — Clear boundaries between human judgment and AI execution
3. **Competence breeds confidence** — Understanding the system deeply enables trusting it appropriately
4. **Learn by doing your own work** — Delegation without comprehension is abdication
5. **Verify before you trust** — Trust is earned through demonstrated reliability
6. **The frontier is always moving** — What works today needs to evolve tomorrow
7. **Amplification, not replacement** — AI makes human judgment more powerful, not obsolete

### A Day in Their Life

Milind starts the morning reviewing his notebook where he has captured a new business problem — a client needs a scheduling tool for their coaching practice. He opens Claude Code and begins the familiar grind: creating a new project directory, writing a CLAUDE.md from scratch (pulling pieces from previous projects but adapting for this one), setting up spec-driven development conventions, configuring session memory. Thirty minutes in, he hasn't written a single line of product thinking. The friction is building.

He runs /brainstorm to explain what the client needs. The output is... fine. Surface-level. It misses the nuances he mentioned about the client's specific workflow. He spends another 20 minutes manually enriching the spec. Then /write-plan generates an implementation plan based on the shallow requirements. He reviews it, sees gaps, patches them.

The agent starts building. Two hours later, it has built an elegant authentication system that the client doesn't need, while the core scheduling logic is wrong. He scraps the auth module, rewrites the requirements more explicitly, and starts over. By end of day, he has a half-working prototype that cost him a full day and significant token spend — when the whole point was to be more productive.

He closes his laptop thinking: "The AI is brilliant. The orchestration is broken. I need a system, not a collection of tools."

---

## For AI Agents

```yaml
personas:
  - id: persona-1
    name: "Milind"
    archetype: "The Strategic Builder"
    segment: "Technical PM / Developer-Founder"
    priority: primary
    demographics: "Business owner, AI educator, daily Claude Code power user"
    technical_skill: "High — builds Claude Code plugins, understands skills/agents/hooks architecture, uses git worktrees"
    current_tools:
      - "Claude Code (daily driver)"
      - "Claude Code plugins ecosystem"
      - "git/GitHub with worktrees"
      - "Physical notebook for problem capture"
      - "/brainstorm command"
      - "Manual CLAUDE.md scaffolding"
    jobs_to_be_done:
      - situation: "I have a business problem that needs a software solution"
        motivation: "describe the problem and let an orchestrated system handle the full SDLC"
        outcome: "focus on strategic decisions instead of implementation details"
      - situation: "I start a new project"
        motivation: "have the scaffolding automatically generated based on the project type"
        outcome: "avoid wasting energy on repetitive setup that kills momentum"
      - situation: "an agent needs my input at a critical decision point"
        motivation: "see visual, well-curated decision-support artifacts"
        outcome: "make informed judgments quickly without diving into implementation details"
    pain_points:
      functional:
        - "Repetitive manual scaffolding with no repeatable process"
        - "/brainstorm doesn't extract requirements deeply enough"
        - "Burns Opus tokens on tasks Sonnet/Haiku could handle"
        - "Context gets lost between agent handoffs"
        - "No progressive disclosure — agents get overwhelmed with irrelevant context"
      emotional:
        - "Momentum fades during manual setup, building resistance to starting"
        - "Feels defeated when agents build the wrong thing"
        - "Anxiety about over-optimizing the tool vs. using it"
      social:
        - "Projects stall, business problems remain unsolved"
        - "Gap between taught AI capability and actual daily friction"
    goals:
      - "Leverage AI at 5-10x productivity"
      - "Delegate 80% to agents, keep 20% for judgment"
      - "Stay strategic, not stuck in implementation"
      - "Ship projects that solve real business problems"
      - "Break the optimization loop"
    desired_outcomes:
      - "Feel amazing and proud of systems built"
      - "Focus on being more strategic with business problems"
      - "Move from monitoring AI to confident judgment gates"
      - "Delegate AI interactions for business tasks"
    forces_of_progress:
      push: "Business problems need solving NOW; manual process is too slow and leads to broken foundations"
      pull: "Vision of orchestrated system — describe problem, make judgment calls, ship"
      anxiety: "Over-optimizing the tool; system still building wrong thing; losing competence"
      habit: "Notebook writing, manual scaffolding, optimization loop, defaulting to Opus"
    philosophy:
      - "Judgment before tools"
      - "Know where you end and the tool begins"
      - "Competence breeds confidence"
      - "Learn by doing your own work"
      - "Verify before you trust"
      - "The frontier is always moving"
      - "Amplification, not replacement"
    representative_quote: "It's like having a brilliant employee with no manager. The capability is there but the direction and oversight are missing."
```
