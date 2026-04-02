# Prototyping Skill (`/superpowers:prototyping`)

**Status:** Draft
**Date:** 2026-04-02

## Purpose

A skill that creates small, throwaway prototypes to de-risk technical uncertainty before committing to an implementation plan. Works in an isolated scratch directory, iterates until the question is answered, reports learnings into the conversation context, and cleans up.

Sits between `write-spec` and `writing-plans` in the pipeline. When a spec contains technical uncertainty that documentation alone can't resolve, prototyping answers it with working code before the plan gets written.

## Core Principles

1. **Single technical question** — each prototype answers one question. Multi-concern asks get rejected ("that's a spec, not a prototype")
2. **Autonomous** — the skill decides everything: execution model, validation method, iteration approach. Never asks the user for process decisions
3. **Iteration-capped, not timeboxed** — up to 10 iterations to get something working. If still unresolved, surface to the user
4. **Throwaway** — artifacts are deleted after learnings are reported. Only proven code patterns and findings survive, in the conversation context
5. **Expert-driven** — workers get domain-specific expert roles matching the prototype's subject matter
6. **Falsification-oriented** — target the riskiest assumption first, not the easy parts

## Non-Goals

- Producing production-quality code (code quality is not a priority — getting it working is)
- Persisting artifacts beyond the conversation context
- Replacing brainstorming or spec writing
- Prototyping large systems or multi-concern architectures
- Git commits, branches, or PRs for prototype code

## Conceptual Foundations

The skill draws on several established methodologies:

- **Spike (XP)** — a throwaway effort whose only deliverable is knowledge, not code
- **Breadboarding (electronics)** — wire only the uncertain integration point with minimal connectivity
- **OODA Loop (Boyd)** — Observe → Orient → Decide → Act; the Orient phase (updating your mental model) is where learning happens
- **Sketching (Buxton)** — keep costs low enough to explore alternatives; a 20-minute prototype teaches more than a 2-hour one because you'll try more approaches
- **Falsification (Popper)** — the goal is to find what breaks, not confirm what works; a prototype that doesn't stress the risky assumption taught nothing

## Entry Point

The skill accepts:
- **Required:** A technical question or uncertainty to resolve (from spec, user request, or conversation context)
- **Optional:** Spec reference, relevant API docs, library name, existing code to integrate with

If the context doesn't make the question clear, the skill asks once: "What specific technical question should this prototype answer?"

## Prototype Types

| Type | Example | Validation |
|------|---------|-----------|
| API integration | "How does this API authenticate? What does the response look like?" | Run script, check response status/shape |
| Library exploration | "Can this library handle streaming? What's the API surface?" | Run script, verify expected behavior |
| UI component | "What does this interaction pattern look like in practice?" | Serve locally, user confirms visually |
| Algorithm/logic | "Does this approach handle edge cases correctly?" | Run with test inputs, compare outputs |

## Architecture

```
Main Thread (Orchestrator)
├── Scope Check — single question? (reject if too broad)
├── Classify — API / library / UI / algorithm
├── Frame — what's the riskiest assumption?
├── Decide Execution Model (autonomous)
│   ├── Simple: Single subagent with expert role
│   ├── Interactive (visual): Team with 1 worker
│   └── Multiple alternatives: Team with N parallel workers
├── Create scratch dir: .superpowers/prototypes/<name>/
├── Dispatch worker(s) with expert role
├── Monitor iterations (cap at 10)
├── Collect results
├── Report learnings into context
├── Delete scratch directory
└── Route: writing-plans (success) or back to spec (showstopper)
```

The orchestrator's jobs:
1. Scope-check and classify the prototype
2. Decide execution model (never ask the user)
3. Assign expert roles based on domain
4. Track progress via todos
5. Synthesize and report learnings
6. Clean up artifacts

## Execution Model Decision

The skill decides autonomously based on signals:

| Signal | Model | Rationale |
|--------|-------|-----------|
| Single question, clear path, no visual component | One subagent | Fastest path, minimal overhead |
| Needs mid-flight user input (visual confirmation) | Team with 1 worker | Worker can surface visual for user via lead |
| User explicitly asked to compare approaches, OR the question has 2+ distinct viable solutions (e.g., "REST vs GraphQL", "library A vs library B") | Team with N parallel workers | Parallel exploration, lead synthesizes |

## Worker Behavior

Each worker receives:
- A specific expert role matching the domain ("You are an expert in [X]. Your task is to build a minimal working prototype that answers: [question]")
- The scratch directory path
- The specific question to answer
- Context from the spec (if available)

Workers iterate using the OODA loop:
1. Write code → Run → **Orient** (what did I learn? what changed in my mental model?) → Next action
2. The Orient step is key — workers must articulate what they learned before writing more code
3. Track each iteration via todos

**Iteration cap:** If a worker hits 10 iterations without resolving the question, it stops and reports what it knows. The orchestrator surfaces this to the user: "After 10 iterations, here's what we know and what's still unresolved."

## Scope Enforcement

The skill rejects prototypes that are too broad. Rejection criteria:
- Request spans multiple independent concerns
- Would require setting up significant infrastructure
- Is effectively asking for a full implementation

When rejecting: "That's too broad for a prototype. A prototype answers one technical question. Consider breaking this into: [suggested single questions]."

## Validation

The skill decides validation method based on prototype type (never asks the user):

| Type | Method |
|------|--------|
| API integration | Run script automatically, check responses |
| Library exploration | Run script/tests automatically |
| Algorithm/logic | Run with inputs automatically, compare outputs |
| UI component | Serve locally, ask user to visually confirm — **only case requiring user input** |

## Output Format

After validation, learnings are reported directly in the conversation context:

```markdown
## Prototype Results: [question answered]

### What works
- [Finding with exact working code snippet]
- [Finding with exact working code snippet]

### What doesn't work
- [Gotcha / failure discovered]
- [Approach that was tried and failed, with why]

### Recommendations
- [Specific guidance for the implementation plan]

### Verdict
SUCCESS → ready for writing-plans (findings should be factored in)
— or —
SHOWSTOPPER → back to spec (with evidence of why)
```

No separate document is produced. The proven code patterns live in the context and carry forward into the plan.

## Cleanup

After learnings are reported, `.superpowers/prototypes/<name>/` is deleted. Nothing persists on disk.

## Integration

**Pipeline position:**
```
brainstorming → write-spec → [prototyping] → writing-plans → executing-plans
```

**Called by:** User or orchestrator when spec contains technical uncertainty
**Feeds into:** `writing-plans` (success) or `write-spec`/`brainstorming` (showstopper)
**Uses:** `expert:engage` for domain expertise in worker prompts

## Scratch Directory Structure

```
.superpowers/prototypes/<name>/
├── prototype.{js,py,ts,...}    # Main prototype script(s)
├── test.{js,py,ts,...}         # Validation script (if applicable)
└── [minimal supporting files]
```

Language and structure are determined by the domain. Minimal files only — no project scaffolding.

## New Files

- `skills/prototyping/SKILL.md` — main skill document
- `skills/prototyping/worker-prompt.md` — prompt template for prototype workers (parameterized by domain/role/question)

## Modified Files

None. This is a new skill that slots into the existing pipeline without modifying other skills.
