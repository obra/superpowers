# error-forensics Skill Design

**Date:** 2026-03-06
**Status:** Approved

---

## Goal

Create a new skill `error-forensics` that accepts any error artifact (command to run, pasted output, log file), analyzes it to identify root cause, and produces a structured report with a proposed fix. When confidence is high or medium, uses `AskUserQuestion` to confirm whether to apply the fix.

---

## Section 1: Purpose & Scope

**Skill name:** `error-forensics`

**Core principle:** Accept any error artifact, diagnose it forensically, and produce a structured report that includes root cause, evidence, and a proposed fix — then ask the user whether to apply it.

**Three outcomes based on confidence:**

| Confidence | Behavior |
|-----------|----------|
| **High** | Root cause + proposed fix → `AskUserQuestion`: apply? |
| **Medium** | Root cause + proposed fix with caveats → flag uncertainty → ask confirmation before applying |
| **Low** | Root cause analysis only → ask clarifying questions before proposing fix |

**Covers all error classes:**
- Test failures (pytest, jest, go test, etc.)
- Build/compile errors (compiler output, build tool failures)
- Runtime exceptions (stack traces from running processes)
- Process/command errors (shell failures, exit codes, stderr)

**Input accepts:**
- A command to run → Claude runs it, captures stdout + stderr + exit code
- Pasted output → Claude reads it directly
- A log file path → Claude reads the file
- Unclear → `AskUserQuestion` to ask what to analyze

---

## Section 2: Process Flow

### Stage 1 — Collect Artifact

- User provides a command → run it (read-only diagnostic commands only), capture all output
- User pastes output or references file → read it
- Ambiguous input → use `AskUserQuestion`: "What should I run or analyze?"

### Stage 2 — Analyze

1. Parse output for error signals: exception types, failed assertions, exit codes, stack traces, missing symbols, config errors, dependency issues
2. If evidence is insufficient after initial artifact → propose up to 2 targeted follow-up diagnostic commands (e.g., `env`, `which <tool>`, `cat <config-file>`) — ask permission via `AskUserQuestion` before running
3. If scenario is complex/multi-system → invoke `superpowers:brainstorming` for structured clarification
4. Determine confidence level (High / Medium / Low) based on how directly evidence points to root cause
5. If confidence is Low → use `AskUserQuestion` to clarify before proposing fix

### Stage 3 — Report

```
## Error Forensics Report

**Artifact:** [what was analyzed]
**Severity:** Critical / High / Medium / Low
**Confidence:** High / Medium / Low — [reason if not High]

### Root Cause
[1-3 sentences: what went wrong and why]

### Evidence
- [Specific log line / stack frame / exit code that proves it]
- [Additional evidence items]

### Affected Component
[File, service, module, dependency, or system layer]

### Proposed Fix
[Concrete description of what needs to change — code snippet, config value, command]
[For Medium confidence: note caveats or assumptions]

### Diagnostic Trail
[Follow-up commands run (if any) and what they revealed — omit section if none]
```

### Stage 4 — Offer to Apply (High or Medium confidence only)

After report, present via `AskUserQuestion`:

```
"Should I apply this fix?"
Options:
  - Apply now
  - Show me the diff first
  - Skip — I'll handle it
```

- If "Apply now" → apply the fix, then use `superpowers:verification-before-completion` before claiming success
- If "Show me the diff first" → show exact changes, then re-ask
- If "Skip" → stop, report is complete
- If confidence is Low → do NOT offer to apply; ask clarifying questions instead

---

## Section 3: Constraints & Integration

### Hard Constraints (Red Flags — never do these)

- Never apply fixes without asking (`AskUserQuestion` is mandatory for High/Medium)
- Never apply fixes when confidence is Low
- Never run commands that write to disk, modify state, or install packages during investigation
- Never speculate on fixes without evidence ("it might be..." without log support)
- Never skip the report — even obvious issues get a structured report

### Integration

**`systematic-debugging`:** That skill drives a developer through their own investigation+fix cycle. `error-forensics` produces a forensic diagnosis and optionally applies a fix — useful when you have an artifact but don't want to debug manually, or when fix ownership is unclear.

**`verification-before-completion`:** Required after applying a fix — must verify the issue is resolved before claiming success.

**`superpowers:brainstorming`:** Invoked for complex multi-system scenarios where clarification is needed before diagnosis.

### File Structure

```
skills/error-forensics/
  SKILL.md    # Self-contained, no supporting files needed
```

---

## Skill Type

**Technique** — concrete steps to follow with clear decision points. Uses `AskUserQuestion` for interaction. Partially **discipline-enforcing** (must not apply fixes without asking, must not act on Low confidence).

---

## CSO Notes (for frontmatter description)

Trigger conditions to include:
- "failing command", "stack trace", "error log", "test output"
- "root cause", "diagnose", "analyze error"
- "before fixing", "what went wrong"

The description must NOT summarize the workflow — only the triggering conditions.
