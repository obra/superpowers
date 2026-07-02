---
name: superpowers:writing-skills
description: "Use when creating or editing skills — TDD-inspired skill authoring methodology"
source: https://github.com/obra/superpowers/tree/main/skills/writing-skills
hermes-adapted: true
upstream-version: "6.0.3"
tool-mapping: "skill_view/skills_list=Skill, todo=TodoWrite, delegate_task=Subagent/Task, search_files=Glob/grep"
install: "hermes skills install <url-to-raw-SKILL.md> --name superpowers:writing-skills"
---

---
name: writing-skills
description: Use when creating new skills, editing existing skills, or verifying skills work before deployment
---
# Writing Skills
## Overview
\*\*Writing skills IS Test-Driven Development applied to process documentation.\*\*
\*\*Personal skills live in your runtime's skills directory\*\* — see [claude-code-tools.md](../using-superpowers/references/claude-code-tools.md), [codex-tools.md](../using-superpowers/references/codex-tools.md), [copilot-tools.md](../using-superpowers/references/copilot-tools.md), or [gemini-tools.md](../using-superpowers/references/gemini-tools.md) for the path on your runtime. Codex, Copilot CLI, and Gemini CLI all also recognize `~/.agents/skills/` as a cross-runtime alias.
You write test cases (pressure scenarios with delegate_tasks), watch them fail (baseline behavior), write the skill (documentation), watch tests pass (agents comply), and refactor (close loopholes).
\*\*Core principle:\*\* If you didn't watch an agent fail without the skill, you don't know if the skill teaches the right thing.
\*\*REQUIRED BACKGROUND:\*\* You MUST understand superpowers:test-driven-development before using this skill. That skill defines the fundamental RED-GREEN-REFACTOR cycle. This skill adapts TDD to documentation.
\*\*Official guidance:\*\* For Anthropic's official skill authoring best practices, see anthropic-best-practices.md. This document provides additional patterns and guidelines that complement the TDD-focused approach in this skill.
## What is a Skill?
A \*\*skill\*\* is a reference guide for proven techniques, patterns, or tools. Skills help future agents find and apply effective approaches.
\*\*Skills are:\*\* Reusable techniques, patterns, tools, reference guides
\*\*Skills are NOT:\*\* Narratives about how you solved a problem once
## TDD Mapping for Skills
| TDD Concept | Skill Creation |
|-------------|----------------|
| \*\*Test case\*\* | Pressure scenario with delegate_task |
| \*\*Production code\*\* | Skill document (SKILL.md) |
| \*\*Test fails (RED)\*\* | Agent violates rule without skill (baseline) |
| \*\*Test passes (GREEN)\*\* | Agent complies with skill present |
| \*\*Refactor\*\* | Close loopholes while maintaining compliance |
| \*\*Write test first\*\* | Run baseline scenario BEFORE writing skill |
| \*\*Watch it fail\*\* | Document exact rationalizations agent uses |
| \*\*Minimal code\*\* | Write skill addressing those specific violations |
| \*\*Watch it pass\*\* | Verify agent now complies |
| \*\*Refactor cycle\*\* | Find new rationalizations → plug → re-verify |
The entire skill creation process follows RED-GREEN-REFACTOR.
## When to Create a Skill
\*\*Create when:\*\*
- Technique wasn't intuitively obvious to you
- You'd reference this again across projects
- Pattern applies broadly (not project-specific)
- Others would benefit
\*\*Don't create for:\*\*
- One-off solutions
- Standard practices well-documented elsewhere
- Project-specific conventions (put in your instructions file)
- Mechanical constraints (if it's enforceable with regex/validation, automate it—save documentation for judgment calls)
## Skill Types
### Technique
Concrete method with steps to follow (condition-based-waiting, root-cause-tracing)
### Pattern
Way of thinking about problems (flatten-with-flags, test-invariants)
### Reference
API docs, syntax guides, tool documentation (office docs)
## Directory Structure
```
skills/
skill-name/
SKILL.md # Main reference (required)
supporting-file.\* # Only if needed
```
\*\*Flat namespace\*\* - all skills in one searchable namespace
\*\*Separate files for:\*\*
1. \*\*Heavy reference\*\* (100+ lines) - API docs, comprehensive syntax
2. \*\*Reusable tools\*\* - Scripts, utilities, templates
\*\*Keep inline:\*\*
- Principles and concepts
- Code patterns (< 50 lines)
- Everything else
## SKILL.md Structure
\*\*Frontmatter (YAML):\*\*
- Two required fields: `name` and `description` (see [agentskills.io/specification](https://agentskills.io/specification) for all supported fields)
- Max 1024 characters total
- `name`: Use letters, numbers, and hyphens only (no parentheses, special chars)
- `description`: Third-person, describes ONLY when to use (NOT what it does)
- Start with "Use when..." to focus on triggering conditions
- Include specific symptoms, situations, and contexts
- \*\*NEVER summarize the skill's process or workflow\*\* (see SDO section for why)
- Keep under 500 characters if possible
```markdown
---
name: Skill-Name-With-Hyphens
description: Use when [specific triggering conditions and symptoms]
---
# Skill Name
## Overview
What is this? Core principle in 1-2 sentences.
## When to Use
[Small inline flowchart IF decision non-obvious]
Bullet list with SYMPTOMS and use cases
When NOT to use
## Core Pattern (for techniques/patterns)
Before/after code comparison
## Quick Reference
Table or bullets for scanning common operations
## Implementation
Inline code for simple patterns
Link to file for heavy reference or reusable tools
## Common Mistakes
What goes wrong + fixes
## Real-World Impact (optional)
Concrete results
```
## Skill Discovery Optimization (SDO)
\*\*Critical for discovery:\*\* Future agents need to FIND your skill
### 1. Rich Description Field
\*\*Purpose:\*\* Your agent reads the description to decide which skills to load for a given task. Make it answer: "Should I read this skill right now?"
\*\*Format:\*\* Start with "Use when..." to focus on triggering conditions
\*\*CRITICAL: Description = When to Use, NOT What the Skill Does\*\*
The description should ONLY describe triggering conditions. Do NOT summarize the skill's process or workflow in the description.
\*\*Why this matters:\*\* Testing revealed that when a description summarizes the skill's workflow, an agent may follow the description instead of reading the full skill content. A description saying "code review between tasks" caused an agent to do ONE review, even though the skill's flowchart clearly showed TWO reviews (spec compliance then code quality).
When the description was changed to just "Use when executing implementation plans with independent tasks" (no workflow summary), the agent correctly read the flowchart and followed the two-stage review process.
\*\*The trap:\*\* Descriptions that summarize workflow create a shortcut agents will take. The skill body becomes documentation agents skip.
```yaml
# ❌ BAD: Summarizes workflow - agents may follow this instead of reading skill
description: Use when executing plans - dispatches delegate_task per task with code review between tasks
# ❌ BAD: Too much process detail
description: Use for TDD - write test first, watch it fail, write minimal code, refactor
# ✅ GOOD: Just triggering conditions, no workflow summary
description: Use when executing implementation plans with independent tasks in the current session
# ✅ GOOD: Triggering conditions only
description: Use when implementing any feature or bugfix, before writing implementation code
```
\*\*Content:\*\*
- Use concrete triggers, symptoms, and situations that signal this skill applies
- Describe the \*problem\* (race conditions, inconsistent behavior) not \*language-specific symptoms\* (setTimeout, sleep)
- Keep triggers technology-agnostic unless the skill itself is technology-specific
- If skill is technology-specific, make that explicit in the trigger
- Write in third person (injected into system prompt)
- \*\*NEVER summarize the skill's process or workflow\*\*
```yaml
# ❌ BAD: Too abstract, vague, doesn't include when to use
description: For async testing
# ❌ BAD: First person
description: I can help you with async tests when they're flaky
# ❌ BAD: Mentions technology but skill isn't specific to it
description: Use when tests use setTimeout/sleep and are flaky
# ✅ GOOD: Starts with "Use when", describes problem, no workflow
description: Use when tests have race conditions, timing dependencies, or pass/fail inconsistently
# ✅ GOOD: Technology-specific skill with explicit trigger
description: Use when using React Router and handling authentication redirects
```
### 2. Keyword Coverage
Use words an agent would search for:
- Error messages: "Hook timed out", "ENOTEMPTY", "race condition"
- Symptoms: "flaky", "hanging", "zombie", "pollution"
- Synonyms: "timeout/hang/freeze", "cleanup/teardown/afterEach"
- Tools: Actual commands, library names, file types
### 3. Descriptive Naming
\*\*Use active voice, verb-first:\*\*
- ✅ `creating-skills` not `skill-creation`
- ✅ `condition-based-waiting` not `async-test-helpers`
### 4. Token Efficiency (Critical)
\*\*Problem:\*\* getting-started and frequently-referenced skills load into EVERY conversation. Every token counts.
\*\*Target word counts:\*\*
- getting-started workflows: <150 words each
- Frequently-loaded skills: <200 words total
- Other skills: <500 words (still be concise)
\*\*Techniques:\*\*
\*\*Move details to tool help:\*\*
```bash
# ❌ BAD: Document all flags in SKILL.md
search-conversations supports --text, --both, --after DATE, --before DATE, --limit N
# ✅ GOOD: Reference --help
search-conversations supports multiple modes and filters. Run --help for details.
```
\*\*Use cross-references:\*\*
```markdown
# ❌ BAD: Repeat workflow details
When searching, dispatch delegate_task with template...
[20 lines of repeated instructions]
# ✅ GOOD: Reference other skill
Always use delegate_tasks (50-100x context savings). REQUIRED: Use [other-skill-name] for workflow.
```
\*\*Compress examples:\*\*
```markdown
# ❌ BAD: Verbose example (42 words)
your human partner: "How did we handle authentication errors in React Router before?"
You: I'll search past conversations for React Router authentication patterns.
[Dispatch delegate_task with search query: "React Router authentication error handling 401"]
# ✅ GOOD: Minimal example (20 words)
Partner: "How did we handle auth errors in React Router?"
You: Searching...
[Dispatch delegate_task → synthesis]
```
\*\*Eliminate redundancy:\*\*
- Don't repeat what's in cross-referenced skills
- Don't explain what's obvious from command
- Don't include multiple examples of same pattern
\*\*Verification:\*\*
```bash
wc -w skills/path/SKILL.md
# getting-started workflows: aim for <150 each
# Other frequently-loaded: aim for <200 total
```
\*\*Name by what you DO or core insight:\*\*
- ✅ `condition-based-waiting` > `async-test-helpers`
- ✅ `using-skills` not `skill-usage`
- ✅ `flatten-with-flags` > `data-structure-refactoring`
- ✅ `root-cause-tracing` > `debugging-techniques`
\*\*Gerunds (-ing) work well for processes:\*\*
- `creating-skills`, `testing-skills`, `debugging-with-logs`
- Active, describes the action you're taking
### 5. Cross-Referencing Other Skills
\*\*When writing documentation that references other skills:\*\*
Use skill name only, with explicit requirement markers:
- ✅ Good: `\*\*REQUIRED SUB-SKILL:\*\* Use superpowers:test-driven-development`
- ✅ Good: `\*\*REQUIRED BACKGROUND:\*\* You MUST understand superpowers:systematic-debugging`
- ❌ Bad: `See skills/testing/test-driven-development` (unclear if required)
- ❌ Bad: `@skills/testing/test-driven-development/SKILL.md` (force-loads, burns context)
\*\*Why no @ links:\*\* `@` syntax force-loads files immediately, consuming 200k+ context before you need them.

[... middle omitted — see footer ...]

- Meta-testing techniques
## Anti-Patterns
### ❌ Narrative Example
"In session 2025-10-03, we found empty projectDir caused..."
\*\*Why bad:\*\* Too specific, not reusable
### ❌ Multi-Language Dilution
example-js.js, example-py.py, example-go.go
\*\*Why bad:\*\* Mediocre quality, maintenance burden
### ❌ Code in Flowcharts
```dot
step1 [label="import fs"];
step2 [label="read file"];
```
\*\*Why bad:\*\* Can't copy-paste, hard to read
### ❌ Generic Labels
helper1, helper2, step3, pattern4
\*\*Why bad:\*\* Labels should have semantic meaning
## STOP: Before Moving to Next Skill
\*\*After writing ANY skill, you MUST STOP and complete the deployment process.\*\*
\*\*Do NOT:\*\*
- Create multiple skills in batch without testing each
- Move to next skill before current one is verified
- Skip testing because "batching is more efficient"
\*\*The deployment checklist below is MANDATORY for EACH skill.\*\*
Deploying untested skills = deploying untested code. It's a violation of quality standards.
## Skill Creation Checklist (TDD Adapted)
\*\*IMPORTANT: Create a todo for EACH checklist item below.\*\*
\*\*RED Phase - Write Failing Test:\*\*
- [ ] Create pressure scenarios (3+ combined pressures for discipline skills)
- [ ] Run scenarios WITHOUT skill - document baseline behavior verbatim
- [ ] Identify patterns in rationalizations/failures
\*\*GREEN Phase - Write Minimal Skill:\*\*
- [ ] Name uses only letters, numbers, hyphens (no parentheses/special chars)
- [ ] YAML frontmatter with required `name` and `description` fields (max 1024 chars; see [spec](https://agentskills.io/specification))
- [ ] Description starts with "Use when..." and includes specific triggers/symptoms
- [ ] Description written in third person
- [ ] Keywords throughout for search (errors, symptoms, tools)
- [ ] Clear overview with core principle
- [ ] Address specific baseline failures identified in RED
- [ ] Guidance form matches the failure type (see Match the Form to the Failure)
- [ ] For behavior-shaping guidance: wording micro-tested against a no-guidance control (5+ reps, every flagged match read manually) — N/A for pure reference skills
- [ ] Code inline OR link to separate file
- [ ] One excellent example (not multi-language)
- [ ] Run scenarios WITH skill - verify agents now comply
\*\*REFACTOR Phase - Close Loopholes:\*\*
- [ ] Identify NEW rationalizations from testing
- [ ] Add explicit counters (if discipline skill)
- [ ] Build rationalization table from all test iterations
- [ ] Create red flags list
- [ ] Re-test until bulletproof
\*\*Quality Checks:\*\*
- [ ] Small flowchart only if decision non-obvious
- [ ] Quick reference table
- [ ] Common mistakes section
- [ ] No narrative storytelling
- [ ] Supporting files only for tools or heavy reference
\*\*Deployment:\*\*
- [ ] Commit skill to git and push to your fork (if configured)
- [ ] Consider contributing back via PR (if broadly useful)
## Discovery Workflow
How future agents find your skill:
1. \*\*Encounters problem\*\* ("tests are flaky")
2. \*\*Searches skills\*\* (greps descriptions, browses categories)
3. \*\*Finds SKILL\*\* (description matches)
4. \*\*Scans overview\*\* (is this relevant?)
5. \*\*Reads patterns\*\* (quick reference table)
6. \*\*Loads example\*\* (only when implementing)
\*\*Optimize for this flow\*\* - put searchable terms early and often.
## The Bottom Line
\*\*Creating skills IS TDD for process documentation.\*\*
Same Iron Law: No skill without failing test first.
Same cycle: RED (baseline) → GREEN (write skill) → REFACTOR (close loopholes).
Same benefits: Better quality, fewer surprises, bulletproof results.
If you follow TDD for code, follow it for skills. It's the same discipline applied to documentation.

──────── [TRUNCATED] ────────
Showing 11,246 chars (head) + 3,733 chars (tail) of 26,844 total clean characters.
Full text saved to: /Users/liujie/.hermes/profiles/dev/cache/web/raw.githubusercontent.com-3ce66a9a63.md
To read the omitted middle: read_file path="/Users/liujie/.hermes/profiles/dev/cache/web/raw.githubusercontent.com-3ce66a9a63.md" offset=206 limit=200  (the file is the complete page; raise/lower offset to page through it).
─────────────────────────────