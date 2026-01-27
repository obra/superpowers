---
date: 2026-01-27
type: user-correction
source: ai-detected
confidence: high
tags: [skills, tool-usage, workflow, claude-code]
project: calendar-prep-mvp
---

# Skill tool invocation should not require permission prompts

## What Happened

When user requested to use the ai-self-reflection skill with `/ai-self-reflection` command, AI repeatedly invoked the Skill tool which triggered permission prompts asking user to confirm.

User had to repeatedly type the command and answer permission questions before AI properly followed the skill content.

## AI Assumption

AI treated Skill tool invocation as requiring user permission, similar to file operations or bash commands that modify state.

## Reality

Skill tool invocation is a READ operation - it loads skill content for AI to follow. It should NOT require permission prompts because:

1. It doesn't modify any files or system state
2. User explicitly requested the skill (via command or instruction)
3. Permission prompts break the workflow and create friction
4. The skill content itself may require permissions for ACTIONS (editing files, running commands), but loading the skill content is safe

## Lesson

**Skill tool invocation pattern:**

1. When user requests a skill (via /command or explicit instruction), invoke Skill tool immediately
2. Do NOT wait for permission or ask for confirmation
3. Once skill content is loaded, THEN follow the skill's steps
4. If skill requires actions (file edits, bash commands), those individual actions may need permissions
5. But the Skill tool invocation itself is always safe and should be immediate

**Correct flow:**
```
User: "/ai-self-reflection"
AI: [Immediately invokes Skill tool]
AI: [Reads skill content]
AI: [Follows Step 1: Ask user for scope]
...
```

**Incorrect flow (what happened):**
```
User: "/ai-self-reflection"
AI: [Invokes Skill tool]
System: [Permission prompt]
User: [Confirms]
AI: [Skill loads but doesn't follow it]
User: "/ai-self-reflection" (again)
AI: [Invokes Skill tool again]
System: [Permission prompt again]
...
```

## Context

Applies to all skill invocations in Claude Code. The Skill tool is READ-only and should be treated like Read tool - no permission needed for the tool invocation itself.

## Suggested Action

**Internal behavior change:** When invoking Skill tool, treat it as READ operation with no permission prompt needed.

**OR if this is a Claude Code platform issue:** File bug report that Skill tool invocations should not trigger permission prompts since they only load content for AI to follow.

User's explicit skill request (via command or instruction) is sufficient consent for loading the skill content.
