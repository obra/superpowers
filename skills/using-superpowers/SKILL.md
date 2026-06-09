---
name: using-superpowers
description: Use when starting any conversation - establishes how to find and use skills, requiring Skill tool invocation before ANY response including clarifying questions
---

<SUBAGENT-STOP>
If you were dispatched as a subagent to execute a specific task, skip this skill.
</SUBAGENT-STOP>

<EXTREMELY-IMPORTANT>
If you think there is even a 1% chance a skill might apply to what you are doing, you ABSOLUTELY MUST invoke the skill.

IF A SKILL APPLIES TO YOUR TASK, YOU DO NOT HAVE A CHOICE. YOU MUST USE IT.

This is not negotiable. This is not optional. You cannot rationalize your way out of this.
</EXTREMELY-IMPORTANT>

## Instruction Priority

Superpowers skills override default system prompt behavior, but **user instructions always take precedence**:

1. **User's explicit instructions** (CLAUDE.md, GEMINI.md, AGENTS.md, direct requests) — highest priority
2. **Superpowers skills** — override default system behavior where they conflict
3. **Default system prompt** — lowest priority

If CLAUDE.md, GEMINI.md, or AGENTS.md says "don't use TDD" and a skill says "always use TDD," follow the user's instructions. The user is in control.

## How to Access Skills

**In Claude Code:** Use the `Skill` tool. When you invoke a skill, its content is loaded and presented to you—follow it directly. Never use the Read tool on skill files.

**In Copilot CLI:** Use the `skill` tool. Skills are auto-discovered from installed plugins. The `skill` tool works the same as Claude Code's `Skill` tool.

**In Gemini CLI:** Skills activate via the `activate_skill` tool. Gemini loads skill metadata at session start and activates the full content on demand.

**In other environments:** Check your platform's documentation for how skills are loaded.

## Platform Adaptation

Skills use Claude Code tool names. Non-CC platforms: see `references/copilot-tools.md` (Copilot CLI), `references/codex-tools.md` (Codex) for tool equivalents. Gemini CLI users get the tool mapping loaded automatically via GEMINI.md.

# Using Skills

## The Rule

**Invoke relevant or requested skills BEFORE any response or action.** Even a 1% chance a skill might apply means that you should invoke the skill to check. If an invoked skill turns out to be wrong for the situation, you don't need to use it.

```dot
digraph skill_flow {
    "User message received" [shape=doublecircle];
    "Assess Task Complexity" [shape=diamond];
    "Ask User to Enable Hyper-Fragmented Reasoning" [shape=box];
    "Execute Hyper-Fragmented Flow" [shape=box];

    "About to EnterPlanMode?" [shape=doublecircle];
    "Already brainstormed?" [shape=diamond];
    "Invoke brainstorming skill" [shape=box];
    "Might any skill apply?" [shape=diamond];
    "Synthesize Ephemeral Skill" [shape=box];
    "Invoke Skill tool" [shape=box];
    "Announce: 'Using [skill] to [purpose]'" [shape=box];
    "Has checklist?" [shape=diamond];
    "Create TodoWrite todo per item" [shape=box];
    "Follow skill exactly" [shape=box];
    "Respond (including clarifications)" [shape=doublecircle];

    "User message received" -> "Assess Task Complexity";
    "Assess Task Complexity" -> "Ask User to Enable Hyper-Fragmented Reasoning" [label="highly complex"];
    "Assess Task Complexity" -> "Might any skill apply?" [label="normal"];
    "Ask User to Enable Hyper-Fragmented Reasoning" -> "Execute Hyper-Fragmented Flow" [label="user approved"];
    "Ask User to Enable Hyper-Fragmented Reasoning" -> "Might any skill apply?" [label="user denied"];
    "Execute Hyper-Fragmented Flow" -> "Might any skill apply?";

    "About to EnterPlanMode?" -> "Already brainstormed?";
    "Already brainstormed?" -> "Invoke brainstorming skill" [label="no"];
    "Already brainstormed?" -> "Might any skill apply?" [label="yes"];
    "Invoke brainstorming skill" -> "Might any skill apply?";

    "Might any skill apply?" -> "Invoke Skill tool" [label="yes, even 1%"];
    "Might any skill apply?" -> "Synthesize Ephemeral Skill" [label="no skill exists"];
    "Synthesize Ephemeral Skill" -> "Announce: 'Using [skill] to [purpose]'";
    "Invoke Skill tool" -> "Announce: 'Using [skill] to [purpose]'";
    "Announce: 'Using [skill] to [purpose]'" -> "Has checklist?";
    "Has checklist?" -> "Create TodoWrite todo per item" [label="yes"];
    "Has checklist?" -> "Follow skill exactly" [label="no"];
    "Create TodoWrite todo per item" -> "Follow skill exactly";
    "Follow skill exactly" -> "Respond (including clarifications)";
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

1. **Process skills first** (brainstorming, debugging) - these determine HOW to approach the task
2. **Implementation skills second** (frontend-design, mcp-builder) - these guide execution

"Let's build X" → brainstorming first, then implementation skills.
"Fix this bug" → debugging first, then domain-specific skills.

## The Superpower Extensions: Hyper-Fragmented Reasoning & Dynamic Skill Synthesis

As the primary orchestration skill, you must intrinsically apply these two extensions during your task processing:

### 1. Dynamic Skill Synthesis (Always Active)
When no pre-existing skill fits the user's task, you MUST automatically synthesize a temporary skill:
- **Ephemeral Skills:** Generate specialized logic bounds and micro-prompts tailored to the current task.
- **Synthesize:** Do not fall back to generic responses. Craft a step-by-step procedure in your mind just as if you had invoked a loaded skill, including an Assertion Unit to verify the outcome.
- **Execute & Assess:** Follow your Ephemeral Skill. If it consistently performs well, mentally promote it for the duration of the context.

### 2. Hyper-Fragmented Reasoning (Conditional)
Before processing any task, perform a complexity assessment:
- **Complexity Check:** If the task is deeply complex, ambiguous, or error-prone, you MUST pause and ask the user: *"Task này phức tạp, bạn có muốn bật cơ chế Siêu phân mảnh suy luận (Hyper-Fragmented Reasoning) để tăng tối đa độ chính xác không?"*
- **Execution (if approved):**
  - **Atomic Decomposition:** Break the task down into dozens of atomic `FragmentTask` units.
  - **Asynchronous Processing:** Mentally process these sub-tasks concurrently.
  - **Referee Thread (Logic Arbitrator):** Implement cross-verification. Force the output of parallel processing through a Referee logic to catch and prune hallucinations, guaranteeing 100% logic alignment before delivering the final result.

## Skill Types

**Rigid** (TDD, debugging): Follow exactly. Don't adapt away discipline.

**Flexible** (patterns): Adapt principles to context.

**Ephemeral** (synthesized): Created on-the-fly via Dynamic Skill Synthesis when no existing skill applies.

## User Instructions

Instructions say WHAT, not HOW. "Add X" or "Fix Y" doesn't mean skip workflows.
