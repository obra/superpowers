---
name: brainstorming
description: "Use before any creative work — creating features, building components, adding functionality, or modifying behavior. Explores intent, requirements, and design before implementation."
---

# Brainstorming Ideas Into Designs

Turn an idea into a design through collaborative dialogue. Understand the project, ask questions, present a design, get approval before implementing.

<HARD-GATE>
For **standard** and **critical** tier work: no implementation skill, no code, no scaffolding until a design is presented and approved.

For **trivial** tier (config value, typo, one-line fix, copy edit): skip brainstorming; the Golden Rule still applies.

See `using-superpowers` § Risk Tiers.
</HARD-GATE>

## Routing by Risk Tier

| Tier | Ceremony | Examples |
|------|----------|----------|
| **Trivial — skip** | Make the change, follow the Golden Rule | Config value, typo, one-line fix, copy edit, comment |
| **Light — steps 1, 3, 5** | Explore context → 1-2 clarifying questions → 3-line inline design (no spec file) | Bug fix with clear behavior, well-scoped utility in an existing module, small internal refactor |
| **Full — all 9 steps** | Full checklist, spec doc written and reviewed | New features, architectural decisions, cross-cutting concerns, critical tier, anything touching a Non-Negotiable (`using-superpowers` § Non-Negotiables) |

When in doubt between Light and Full → Full. Between Trivial and Light → Light.

## Checklist (Full tier)

Create a task per item, in order. Light tier runs only 1, 3, 5. Trivial skips the checklist.

1. Explore project context (files, docs, recent commits)
2. Offer visual companion if upcoming questions are visual — its own message, no other content (see Visual Companion section) *[full only]*
3. Batch clarifying questions with a recommended default for each; serialize only when an answer genuinely affects the next question
4. Propose 2-3 approaches with trade-offs and your recommendation *[full only]*
5. Present design — one approval at the architecture level; walk the rest without per-section gates unless a real tradeoff surfaces
6. Write design doc to `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md` and commit *[full only]*
7. Spec self-review (placeholders, contradictions, ambiguity, scope) *[full only]*
8. User reviews written spec *[full only]*
9. Invoke `writing-plans` to create the implementation plan

Terminal state = invoking `writing-plans`. No other implementation skill comes next.

## Scope Pre-Check

If the request describes multiple independent subsystems (e.g., "platform with chat, files, billing, analytics"), flag it before spending questions on details. Help decompose into sub-projects — each gets its own spec → plan → implementation cycle.

## Asking Questions

- **Batch first** — independent questions in one message, each with a recommended default. Serialize only when an answer genuinely changes the next question.
- **Pick trivial defaults yourself** — cosmetic choices (colors, copy, icons) and reversible conventions already visible in the codebase don't warrant a question. State the choice inline; the user redirects if needed.
- Multiple choice when possible; open-ended is fine otherwise.
- Focus on purpose, constraints, success criteria.
- Be ready to loop back and reclarify.

## Presenting the Design

Scale sections to complexity (a few sentences for simple parts, up to ~300 words when nuanced). **One approval at the architecture level**, then walk the remaining sections in sequence. Stop mid-walk only if a genuine tradeoff surfaces — not for routine sections or to re-confirm what architecture approval already settled. Cover architecture, components, data flow, error handling, testing.

**Design for isolation:** smaller units with clear single responsibility and well-defined interfaces. For each unit: what it does, how to use it, what it depends on. You reason better about code you can hold in context.

**Existing codebases:** follow existing patterns. Targeted improvements where they serve the current goal; no unrelated refactor.

## After the Design (Full tier)

Write the spec to `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md`, use `elements-of-style:writing-clearly-and-concisely` if available, commit.

**Self-review:** placeholders, internal consistency, scope focused enough for one plan, ambiguity. Fix inline.

**User review gate:** "Spec at `<path>`. Review it before I write the implementation plan." Wait for approval; if changes requested, re-loop.

Then: invoke `writing-plans`. Nothing else.

## Visual Companion

Browser-based companion for mockups/diagrams/visual options during brainstorming. Available as a tool, not a mode.

**Offer (its own message, no other content):**
> "Some of what we're working on might be easier to explain if I can show it to you in a web browser. I can put together mockups, diagrams, comparisons, and other visuals as we go. This feature is still new and can be token-intensive. Want to try it? (Requires opening a local URL)"

Wait for the response. If declined, continue text-only.

**Per-question decision (even after they accept):** would the user understand this better by seeing it than reading it?
- Browser: mockups, wireframes, layout comparisons, architecture diagrams, side-by-side designs
- Terminal: requirements, conceptual choices, tradeoffs, text A/B/C/D, scope decisions

UI topic ≠ visual question. "What does personality mean here?" = terminal. "Which wizard layout works better?" = browser.

If they accept, read `skills/brainstorming/visual-companion.md` before proceeding.
