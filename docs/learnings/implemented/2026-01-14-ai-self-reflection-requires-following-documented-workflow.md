---
date: 2026-01-14
type: backtracking
source: ai-detected
confidence: high
tags: [skill-execution, workflow-discipline, ai-self-reflection, general]
project: calendar-prep-mvp
---

# AI Self-Reflection Requires Following Documented Workflow

## What Happened

After user ran `/ai-self-reflection` command, I performed an informal analysis and discussion about the learning, then asked "what now?" without following the skill's documented workflow. User correctly prompted "we just had some learning, what is the next step?" which led to reading the skill documentation and discovering I'd skipped critical steps.

## AI Assumption

Assumed the ai-self-reflection process was: analyze informally → discuss with user → manually decide how to capture learnings.

## Reality

The skill has a **specific documented workflow**:
1. Ask user for scope (since last verification OR full session)
2. Silently analyze for mistakes (user corrections, backtracking, repeated errors)
3. Show summary with brief descriptions
4. Ask bulk confirmation (capture all or skip)
5. Write learning files with YAML frontmatter
6. Increment meta-learning counter
7. Commit learnings to git

I skipped steps 1, 3, 4 and went straight to informal discussion.

## Lesson

**When invoking any skill, read the SKILL.md completely before starting execution and follow it exactly.**

Skills are documented workflows with specific steps, formats, and success criteria. Don't improvise or skip steps based on assumed understanding.

## Context

Applies to all skill execution - particularly process skills (brainstorming, debugging, self-reflection, etc.) that have rigid workflows.

## Suggested Action

Consider adding to global CLAUDE.md:
```
## Skill Execution Discipline
When using any skill via Skill tool:
1. Read the entire SKILL.md first
2. Follow documented steps exactly (don't improvise)
3. Check "Success Criteria" section to verify completion
4. For rigid skills (workflows), every step is mandatory
```
