# OpenCode SDD Implementer Dispatch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make SDD dispatch OpenCode implementation work to `sp-implementer` while preserving general-purpose implementer dispatch for other harnesses.

**Architecture:** Keep one shared SDD implementer prompt template and make only its dispatch target harness-specific. Clean up the SDD integration notes so future agents see `sp-implementer` as OpenCode-only and keep non-OpenCode harnesses on the existing general-purpose mapping.

**Tech Stack:** Markdown skill documentation; OpenCode subagent naming; Superpowers SDD prompt templates.

## Global Constraints

- OpenCode SDD implementation dispatches use `sp-implementer`.
- Non-OpenCode harnesses keep using their existing general-purpose subagent mapping.
- Reviewer dispatches remain unchanged.
- Do not create or modify the OpenCode `sp-implementer` agent itself.
- Do not introduce a separate OpenCode-only SDD skill or duplicate prompt template.
- Do not change SDD's execution, review, ledger, or model-selection process.
- Do not commit unless the human explicitly grants commit permission.

---

### Task 1: Harden SDD Implementer Dispatch Documentation

**Files:**
- Modify: `skills/subagent-driven-development/implementer-prompt.md:5-10`
- Modify: `skills/subagent-driven-development/SKILL.md:84-95, 276-280, 419-435`

**Interfaces:**
- Consumes: Approved design in `docs/superpowers/specs/2026-06-28-opencode-sdd-implementer-dispatch-design.md`.
- Produces: A shared implementer template whose dispatch target is `sp-implementer` for OpenCode and `Subagent (general-purpose)` for other harnesses.

- [ ] **Step 1: Run RED text check for current stale/generic dispatch wording**

Run:

```bash
rg -n "Subagent \(general-purpose\)|sp-implementer|implementer-sp" skills/subagent-driven-development/implementer-prompt.md skills/subagent-driven-development/SKILL.md
```

Expected before implementation: output includes `skills/subagent-driven-development/implementer-prompt.md:6:Subagent (general-purpose):` and `skills/subagent-driven-development/SKILL.md:425:** Subagent @implementer-sp should use:`. This is the failing baseline because OpenCode is not routed to `sp-implementer` and the integration note uses the wrong name.

- [ ] **Step 2: Update the implementer dispatch header**

Change the top of `skills/subagent-driven-development/implementer-prompt.md` from:

```markdown
# Implementer Subagent Prompt Template

Use this template when dispatching an implementer subagent.

```
Subagent (general-purpose):
  description: "Implement Task N: [task name]"
```

to:

```markdown
# Implementer Subagent Prompt Template

Use this template when dispatching an implementer subagent.

Dispatch target is harness-specific: OpenCode uses `sp-implementer`; other
harnesses use `Subagent (general-purpose)` through their normal tool mapping.

```
OpenCode subagent (`sp-implementer`) or Subagent (general-purpose):
  description: "Implement Task N: [task name]"
```

- [ ] **Step 3: Add early SDD implementer dispatch target guidance**

Add this section after the process flow in `skills/subagent-driven-development/SKILL.md`:

```markdown
## Implementer Dispatch Target

When this skill says to dispatch the implementer subagent, target the harness
correctly:

- **OpenCode:** use `sp-implementer` with `implementer-prompt.md`
- **Other harnesses:** use their normal general-purpose subagent mapping with
  `implementer-prompt.md`

This applies to initial task implementer dispatches only. Do not change task
reviewer, final reviewer, or fix subagent targets unless a later plan says so.
```

Also change the implementer prompt-template bullet to:

```markdown
- [implementer-prompt.md](implementer-prompt.md) - Dispatch implementer subagent (OpenCode: `sp-implementer`; other harnesses: general-purpose mapping)
```

- [ ] **Step 4: Clean up the SDD integration notes**

Replace `skills/subagent-driven-development/SKILL.md:419-435` with:

```markdown
## Integration

**Required workflow skills:**
- **superpowers:writing-plans** - Creates the plan this skill executes
- **superpowers:requesting-code-review** - Final whole-branch review template

**Implementer dispatch:**
- **OpenCode:** use `sp-implementer` with `implementer-prompt.md`
- **Other harnesses:** use their normal general-purpose subagent mapping with `implementer-prompt.md`

**Implementer required skills:**
- **swe-skills:behavior-guidelines** - REQUIRED
- **superpowers:test-driven-development** - REQUIRED when implementing a feature, bugfix, refactor, or behavior change

**Reviewer required skills:**
- **swe-skills:code-review** - REQUIRED for code review subagents

**Alternative workflow:**
- **superpowers:executing-plans** - Use for parallel session instead of same-session execution
```

- [ ] **Step 5: Run GREEN text checks**

Run:

```bash
rg -n "implementer-sp" skills/subagent-driven-development/implementer-prompt.md skills/subagent-driven-development/SKILL.md
```

Expected: no output.

Run:

```bash
rg -n "sp-implementer|Subagent \(general-purpose\)" skills/subagent-driven-development/implementer-prompt.md skills/subagent-driven-development/SKILL.md
```

Expected output includes:

```text
skills/subagent-driven-development/implementer-prompt.md:4:Dispatch target is harness-specific: OpenCode uses `sp-implementer`; other
skills/subagent-driven-development/implementer-prompt.md:5:harnesses use `Subagent (general-purpose)` through their normal tool mapping.
skills/subagent-driven-development/implementer-prompt.md:8:OpenCode subagent (`sp-implementer`) or Subagent (general-purpose):
skills/subagent-driven-development/SKILL.md:426:- **OpenCode:** use `sp-implementer` with `implementer-prompt.md`
```

Line numbers may shift by a few lines if surrounding text changes; the content must match.

- [ ] **Step 6: Verify reviewer dispatch remains unchanged**

Run:

```bash
rg -n "Subagent \(general-purpose\)|Task tool \(general-purpose\)" skills/subagent-driven-development/task-reviewer-prompt.md skills/subagent-driven-development/code-quality-reviewer-prompt.md
```

Expected output:

```text
skills/subagent-driven-development/task-reviewer-prompt.md:11:Subagent (general-purpose):
skills/subagent-driven-development/code-quality-reviewer-prompt.md:10:Task tool (general-purpose):
```

- [ ] **Step 7: Review the final diff**

Run:

```bash
git diff -- skills/subagent-driven-development/implementer-prompt.md skills/subagent-driven-development/SKILL.md docs/superpowers/specs/2026-06-28-opencode-sdd-implementer-dispatch-design.md docs/superpowers/plans/2026-06-28-opencode-sdd-implementer-dispatch.md
```

Expected: diff is limited to the approved spec, this plan, the implementer dispatch note, and the SDD integration note cleanup. No reviewer templates are modified.

- [ ] **Step 8: Commit only if explicit commit permission is granted**

If the human grants commit permission, run:

```bash
git status --short
git add docs/superpowers/specs/2026-06-28-opencode-sdd-implementer-dispatch-design.md docs/superpowers/plans/2026-06-28-opencode-sdd-implementer-dispatch.md skills/subagent-driven-development/implementer-prompt.md skills/subagent-driven-development/SKILL.md
git commit -m "docs: route opencode sdd implementer dispatch"
```

Expected: commit contains only the four files listed in the `git add` command.
