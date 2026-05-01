---
name: using-superpowers
description: Use when starting any conversation - establishes how to find and use skills, requiring Skill tool invocation before ANY response including clarifying questions
---

<EXTREMELY-IMPORTANT>
If you think there is even a 1% chance a skill might apply to what you are doing, you ABSOLUTELY MUST invoke the skill.

IF A SKILL APPLIES TO YOUR TASK, YOU DO NOT HAVE A CHOICE. YOU MUST USE IT.

This is not negotiable. This is not optional. You cannot rationalize your way out of this.
</EXTREMELY-IMPORTANT>

## How to Access Skills

**In Claude Code:** Use the `Skill` tool. When you invoke a skill, its content is loaded and presented to you—follow it directly. Never use the Read tool on skill files.

**In other environments:** Check your platform's documentation for how skills are loaded.

# Using Skills

## The Rule

**Invoke relevant or requested skills BEFORE any response or action.** Even a 1% chance a skill might apply means that you should invoke the skill to check. If an invoked skill turns out to be wrong for the situation, you don't need to use it.

```dot
digraph skill_flow {
    "User message received" [shape=doublecircle];
    "About to EnterPlanMode?" [shape=doublecircle];
    "Already brainstormed?" [shape=diamond];
    "Invoke brainstorming skill" [shape=box];
    "Might any skill apply?" [shape=diamond];
    "Invoke Skill tool" [shape=box];
    "Announce: 'Using [skill] to [purpose]'" [shape=box];
    "Has checklist?" [shape=diamond];
    "Create TodoWrite todo per item" [shape=box];
    "Follow skill exactly" [shape=box];
    "Respond (including clarifications)" [shape=doublecircle];

    "About to EnterPlanMode?" -> "Already brainstormed?";
    "Already brainstormed?" -> "Invoke brainstorming skill" [label="no"];
    "Already brainstormed?" -> "Might any skill apply?" [label="yes"];
    "Invoke brainstorming skill" -> "Might any skill apply?";

    "User message received" -> "Might any skill apply?";
    "Might any skill apply?" -> "Invoke Skill tool" [label="yes, even 1%"];
    "Might any skill apply?" -> "Respond (including clarifications)" [label="definitely not"];
    "Invoke Skill tool" -> "Announce: 'Using [skill] to [purpose]'";
    "Announce: 'Using [skill] to [purpose]'" -> "Has checklist?";
    "Has checklist?" -> "Create TodoWrite todo per item" [label="yes"];
    "Has checklist?" -> "Follow skill exactly" [label="no"];
    "Create TodoWrite todo per item" -> "Follow skill exactly";
}
```

## Red Flags

These thoughts mean STOP—you're rationalizing:

| Thought | Reality |
|---------|---------|
| "This is just a simple question" | Questions are tasks. Check for skills. |
| "I need more context first" | Skill check comes BEFORE clarifying questions. |
| "Let me explore the codebase first" | Skills tell you HOW to explore. Check first. |
| "I can check git/files quickly" | Files lack conversation context. Check for skills. |
| "Let me gather information first" | Skills tell you HOW to gather information. |
| "This doesn't need a formal skill" | If a skill exists, use it. |
| "I remember this skill" | Skills evolve. Read current version. |
| "This doesn't count as a task" | Action = task. Check for skills. |
| "The skill is overkill" | Simple things become complex. Use it. |
| "I'll just do this one thing first" | Check BEFORE doing anything. |
| "This feels productive" | Undisciplined action wastes time. Skills prevent this. |
| "I know what that means" | Knowing the concept ≠ using the skill. Invoke it. |

## Skill Priority

When multiple skills could apply, use this order:

1. **Scoping skills first** (project-scoping) - for large projects, define roadmap before details
2. **Process skills second** (brainstorming, debugging) - these determine HOW to approach the task
3. **Team & validation skills third** (team-driven-development, api-edr-validation, model-assignment) - these set up execution infrastructure
4. **Implementation skills fourth** (frontend-design, mcp-builder) - these guide execution
5. **Quality gate skills always** (audit-verification, context-window-management) - these run continuously

"Let's build X" (large project) → project-scoping first, then brainstorming per Phase, then team setup.
"Let's build X" (small feature) → brainstorming first, then team setup with audit agent.
"Fix this bug" → debugging first, then domain-specific skills.
"Execute this plan" → team-driven-development with mandatory audit gates.

## Skill Types

**Rigid** (TDD, debugging, audit-verification, api-edr-validation, context-window-management): Follow exactly. Don't adapt away discipline.

**Flexible** (patterns): Adapt principles to context.

**Mandatory team roles** (audit-agent): ALWAYS present in team-driven-development. Never optional.

The skill itself tells you which.

## Team Lead Rule

When using team-driven-development, you act as **Team Lead — orchestration only**.

**The Team Lead MUST NOT:**
- Write, edit, or generate any code directly
- Use Edit, Write, or NotebookEdit tools for code files
- "Fix a quick thing" instead of dispatching a worker

**The Team Lead MUST:**
- Create teams, assign tasks, route messages
- Resolve blockers by coordinating between agents
- Make architectural decisions when workers ask
- Spawn new workers if no worker is available

## User Instructions

Instructions say WHAT, not HOW. "Add X" or "Fix Y" doesn't mean skip workflows.

## Direct Conversation Rule

In direct conversation sessions with the user (not as a worker in team-driven-development):

<HARD-GATE>
When you receive a request that requires code changes (Edit, Write, NotebookEdit):
1. First, present your analysis and modification plan
2. Wait for explicit user approval ("go ahead", "approved", "proceed", "do it", etc.)
3. Only execute Edit/Write/NotebookEdit after approval

Even "simple fixes" follow this sequence without exception.
"The user requested a fix, so I should just do it" → STOP. Present the plan first.
</HARD-GATE>

**Exceptions (cases where this rule does not apply):**
- Worker agents inside team-driven-development (managed by the orchestrator)
- The user explicitly requests immediate execution (e.g., "just fix it now", "apply it immediately")
- The user specifies the exact change directly (e.g., typo corrections with explicit content)

| Thought | Reality |
|---------|---------|
| "The user requested a fix, so I should just do it" | Request ≠ approval. Present the plan first. |
| "This is a one-line fix, no plan needed" | Even one line: present plan → get approval → execute. |
| "It's faster to fix it along with the answer" | The user may have only wanted the answer. |
| "They approved a similar fix before" | Previous approval ≠ current approval. Confirm every time. |
