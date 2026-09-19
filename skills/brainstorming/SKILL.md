---
name: brainstorming
description: Use before creative work that is new or ambiguous - creating features, building components, or changing behavior where intent, requirements, or design are not yet pinned down. Explores user intent, requirements and design before implementation.
---

# Brainstorming Ideas Into Designs

Help turn ideas into fully formed designs and specs through natural collaborative dialogue.

Start by understanding the current project context, then ask questions one at a time to refine the idea. Once you understand what you're building, present the design and get user approval.

<HARD-GATE>
Do NOT invoke any implementation skill, write any code, scaffold any project, or take any implementation action until you have presented a design and the user has approved it.
</HARD-GATE>

**Scale the process to the ambiguity, not the other way around.** A new
system or an underspecified request gets the full flow below. A small, fully
specified change gets a two-sentence design and a single approval question.
What you may never skip is presenting SOME design and getting approval before
implementing — unexamined assumptions are where wasted work comes from.
Even on the lightweight path, still write the spec file (a few sentences is
fine) and get the user's approval of it: the next skill - executing-specs or
writing-plans - needs it as input. What the lightweight path compresses is
the questioning and the alternatives, not the artifact.

## Checklist

Create a task for each of these items and complete them in order (on the
lightweight path, items 2-3 may collapse into the design itself — items 1
and 4-8 always happen):

1. **Explore project context** — check files, docs, recent commits
2. **Ask clarifying questions** — one at a time, understand purpose/constraints/success criteria
3. **Propose 2-3 approaches** — with trade-offs and your recommendation
4. **Present design** — in sections scaled to their complexity, get user approval after each section; apply the "Design for isolation and clarity" and "Working in existing codebases" guidance below
5. **Write design doc** — save to `docs/specs/YYYY-MM-DD-<topic>-design.md` (do NOT commit — see below)
6. **Spec self-review** — quick inline check for placeholders, contradictions, ambiguity, scope (see below)
7. **User reviews written spec** — ask user to review the spec file before proceeding
8. **Tier triage** — assess light vs. heavy scope, confirm the recommendation with the user, record the verdict in the spec's header lines, and route to executing-specs (light) or writing-plans (heavy)

**The terminal state is the tier triage, routing to executing-specs or
writing-plans.** Do NOT invoke any other implementation skill after
brainstorming.

## The Process

**Understanding the idea:**

- Check out the current project state first (files, docs, recent commits)
- Before asking detailed questions, assess scope: if the request describes multiple independent subsystems (e.g., "build a platform with chat, file storage, billing, and analytics"), flag this immediately. Don't spend questions refining details of a project that needs to be decomposed first.
- If the project is too large for a single spec, help the user decompose into sub-projects: what are the independent pieces, how do they relate, what order should they be built? Then brainstorm the first sub-project through the normal design flow. Each sub-project gets its own spec → implementation cycle through the tier triage.
- For appropriately-scoped projects, ask questions one at a time to refine the idea
- If a fact is discoverable in the environment (files, git history, docs, running a command), look it up instead of asking. Questions are reserved for decisions and preferences that are the user's to make.
- With every question, include your recommended answer and why - the user can then confirm with a word or push back
- Ask questions in dependency order: settle upstream decisions before the downstream ones that hinge on them, so answers don't get invalidated
- Prefer multiple choice questions when possible, but open-ended is fine too
- Only one question per message - if a topic needs more exploration, break it into multiple questions
- Focus on understanding: purpose, constraints, success criteria

**Exploring approaches:**

- Propose 2-3 different approaches with trade-offs
- Present options conversationally with your recommendation and reasoning
- Lead with your recommended option and explain why

**Presenting the design:**

- Once you believe you understand what you're building, present the design
- Scale each section to its complexity: a few sentences if straightforward, up to 200-300 words if nuanced
- Ask after each section whether it looks right so far
- Cover: architecture, components, data flow, error handling, testing
- Be ready to go back and clarify if something doesn't make sense

**Design for isolation and clarity:**

- Break the system into smaller units that each have one clear purpose, communicate through well-defined interfaces, and can be understood and tested independently
- For each unit, you should be able to answer: what does it do, how do you use it, and what does it depend on?
- Can someone understand what a unit does without reading its internals? Can you change the internals without breaking consumers? If not, the boundaries need work.
- Smaller, well-bounded units are also easier for you to work with - you reason better about code you can hold in context at once, and your edits are more reliable when files are focused. When a file grows large, that's often a signal that it's doing too much.

**Working in existing codebases:**

- Explore the current structure before proposing changes. Follow existing patterns.
- Where existing code has problems that affect the work (e.g., a file that's grown too large, unclear boundaries, tangled responsibilities), include targeted improvements as part of the design - the way a good developer improves code they're working in.
- Don't propose unrelated refactoring. Stay focused on what serves the current goal.

## After the Design

**Documentation:**

- Write the validated design (spec) to `docs/specs/YYYY-MM-DD-<topic>-design.md`
  - (User preferences for spec location override this default)
- Start the spec with header lines recording the tier verdict:

  ```
  **Tier:** light|heavy (provisional until triage)
  **Escalation threshold:** N files
  ```

  Write your provisional assessment when you first draft the spec; the
  Tier Triage step confirms or corrects it and removes the "provisional"
  marker. These header lines — not the conversation — are what
  executing-specs' entry gate reads, so a session that dies before triage
  still leaves a recorded verdict. Set the escalation threshold to the
  Implementation notes' file count plus a small margin (2-3 files).
- If you expect to recommend the light tier at the triage step below, the
  spec MUST include an **Implementation notes** section: files to
  create/modify, key interfaces, and test intent — plus, for each area of
  work, one existing test to copy (a test function that already exercises
  the target path, or "none — first test for this path") and the exact
  scoped test command for it. On the light path the spec is the
  implementer's brief - there is no plan document to fill the gap.
  Heavy-path specs don't need this section; the plan carries it. The
  section's presence carries no tier signal — the **Tier:** header does.
- Do NOT commit the spec. You will iterate on it; drafts are file edits, not
  commits. Commit timing depends on the tier: on the heavy path the spec is
  committed together with the plan when subagent-driven-development starts
  executing; on the light path it is committed as part of the single final
  commit when executing-specs finishes.

**Spec Self-Review:**
After writing the spec document, look at it with fresh eyes:

1. **Placeholder scan:** Any "TBD", "TODO", incomplete sections, or vague requirements? Fix them.
2. **Internal consistency:** Do any sections contradict each other? Does the architecture match the feature descriptions?
3. **Scope check:** Is this focused enough for a single implementation plan, or does it need decomposition?
4. **Ambiguity check:** Could any requirement be interpreted two different ways? If so, pick one and make it explicit.
5. **Rationale check:** Does each non-obvious value or constraint carry a one-clause reason in domain terms? Implementers may not cite the spec in code, so the reason is what ends up in the comment.

Fix any issues inline. No need to re-review — just fix and move on.

**User Review Gate:**
The user approved the design in conversation; this second gate is for the
written artifact — the act of writing it down introduces drift, and the file
(not the chat) is what the next skill consumes. Ask the user to review it:

> "Spec written to `<path>`. Please review it and let me know if you want to make any changes before we proceed."

Wait for the user's response. If they request changes, make them and re-run the spec review loop. Only proceed once the user approves.

**Tier Triage:**

Once the user has approved the written spec, route to the next skill based
on scope - do not default to writing-plans.

1. Assess tier from concrete signals:
   - **Light:** single subsystem; roughly 1-5 files touched; no schema or
     API migrations; no new cross-component interfaces to design; work fits
     about 1-3 implementer dispatches.
   - **Heavy:** multiple subsystems; many files; new interfaces between
     components; migrations; anything needing task-by-task interface
     pinning.
   - **Any unresolved decision forces heavy:** a "TBD", an "implementation
     must confirm", or an interface left open makes the spec ineligible
     for light. Resolve it in the spec or route heavy.
2. State your recommendation with a one-line rationale and ask one
   confirmation question. Borderline cases default to heavy: misrouting
   heavy work to light costs more than planning overhead saves.
3. Update the spec's **Tier:** and **Escalation threshold:** header lines
   with the confirmed verdict.
4. Route: light → invoke the executing-specs skill; heavy → invoke the
   writing-plans skill to create a detailed implementation plan.

Do NOT invoke any other implementation skill. The skill chosen by the
triage - executing-specs or writing-plans - is the next step.

## Key Principles

- **One question at a time** - Don't overwhelm with multiple questions
- **Recommend with every question** - Attach your recommended answer so confirming takes one word
- **Look up facts, ask decisions** - Never ask the user something the environment can answer
- **Multiple choice preferred** - Easier to answer than open-ended when possible
- **YAGNI ruthlessly** - Remove unnecessary features from all designs
- **Explore alternatives** - Propose 2-3 approaches for open design decisions
- **Incremental validation** - Present design, get approval before moving on
- **Be flexible** - Go back and clarify when something doesn't make sense
