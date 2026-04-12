# GitNexus Integration into Core Skills — Design Spec

## Context

This fork of superpowers has GitNexus code intelligence available as 6 dedicated skills (`.claude/skills/gitnexus/`) and CLAUDE.md guidelines, but the core superpowers skills (`skills/`) don't leverage GitNexus at all. This means the development workflow skills (debugging, planning, verification, etc.) miss opportunities for graph-aware code navigation, impact analysis, and scope verification.

**Goal:** Enhance 6 core skills with targeted GitNexus integration where it clearly improves existing workflow steps.

**Approach:** Targeted insertion — add GitNexus steps alongside existing steps without rewriting skill content. All additions are gated with "if GitNexus is indexed" so skills work normally without an index.

---

## Skills and Changes

### 1. systematic-debugging (`skills/systematic-debugging/SKILL.md`)

**Change A — Phase 1, new step between "Check Recent Changes" (step 3) and "Gather Evidence" (step 4):**

Insert as new step 4, renumber existing 4→5 and 5→6:

```markdown
4. **Trace Execution Flows (if GitNexus is indexed)**

   Use the code knowledge graph to accelerate root cause investigation:

   ```
   gitnexus_query({query: "<error concept or failing behavior>"})
   → Reveals execution flows that touch the failing area

   gitnexus_context({name: "<suspect function or symbol>"})
   → Shows callers, callees, and process participation
   → Answers: Who calls this? What does it call? What flows use it?
   ```

   This narrows the search space before adding diagnostic instrumentation.
   Skip if no GitNexus index exists — proceed to evidence gathering.
```

**Rationale:** Cheap graph lookup before expensive instrumentation. Respects the escalation ladder: local checks → graph intelligence → instrumentation.

**Change B — Phase 2, step 4 "Understand Dependencies", append:**

```markdown
   - If GitNexus is indexed: `gitnexus_context({name: "<component>"})` gives a 360-degree view of what a component depends on and what depends on it
```

**Rationale:** Direct fit — the step is about understanding dependencies, which is exactly what `gitnexus_context` returns.

---

### 2. brainstorming (`skills/brainstorming/SKILL.md`)

**Change — Checklist step 1 "Explore project context", append guidance:**

After the existing step 1 content, add a note within the "Working in existing codebases" section:

```markdown
**GitNexus-accelerated exploration (if indexed):**

When the project has a GitNexus index, use it during context exploration:

```
Read resource: gitnexus://repo/{name}/context
→ Codebase overview, key statistics, index freshness

Read resource: gitnexus://repo/{name}/clusters
→ Functional areas and their relationships
```

This gives you architectural context faster than reading files individually. Use it to inform which areas to explore deeper and what questions to ask.

Skip if no GitNexus index exists.
```

**Rationale:** The brainstorming skill's first step is understanding the project. GitNexus resources provide a high-level architectural map that accelerates this exploration without replacing manual investigation.

---

### 3. writing-plans (`skills/writing-plans/SKILL.md`)

**Change — New section between "Scope Check" and "File Structure":**

```markdown
## Codebase Reconnaissance (if GitNexus is indexed)

Before mapping file structure, understand the terrain. If the project has a GitNexus index:

1. **Understand existing architecture** around the feature area:
   ```
   gitnexus_context({name: "<key symbol that will be extended or modified>"})
   → Who calls it, what it calls, what processes it participates in
   ```

2. **Assess blast radius** of planned changes:
   ```
   gitnexus_impact({target: "<symbol or file to modify>", direction: "upstream"})
   → What will be affected by changes here
   ```

3. **Map functional clusters** the feature touches:
   ```
   Read resource: gitnexus://repo/{name}/clusters
   → Identifies which functional areas the work spans
   ```

Use these results to inform File Structure decisions — they reveal hidden dependencies and coupling that specs don't mention.

Skip this section if no GitNexus index exists.
```

**Rationale:** Plans fail when they miss hidden dependencies. The "File Structure" section locks in decomposition decisions. Reconnaissance before that prevents plans that look clean on paper but violate actual coupling.

---

### 4. verification-before-completion (`skills/verification-before-completion/SKILL.md`)

**Change A — New row in "Common Failures" table:**

```markdown
| No unintended side effects | `gitnexus_detect_changes({scope: "staged"})`: only expected symbols affected | Code review, "looks right" |
```

**Change B — New supplement after "The Gate Function" code block:**

```markdown
**Scope verification (if GitNexus is indexed):**

Before claiming "no unintended side effects" or "only changed what was needed":
```
gitnexus_detect_changes({scope: "staged"})
→ Lists all symbols actually affected by your changes
→ Compare against expected scope
→ Unexpected symbols = investigate before claiming done
```

This is not a replacement for tests — it's an additional gate for scope claims.
```

**Rationale:** The skill's identity is "evidence before claims." `detect_changes` is direct evidence for the common claim "I only changed what I intended to." Kept separate from the main 5-step gate to avoid disrupting its crisp flow.

---

### 5. finishing-a-development-branch (`skills/finishing-a-development-branch/SKILL.md`)

**Change — Sub-check within Step 1 "Verify Tests", after "If tests pass":**

```markdown
**If tests pass and GitNexus is indexed — verify change scope:**

```bash
gitnexus_detect_changes({scope: "compare", base_ref: "<base-branch>"})
```

Review the affected symbols list:
- Do the changed symbols match what you expect from this branch's work?
- Any unexpected symbols? Investigate before proceeding.
- This is a sanity check, not a blocker — but unexpected scope warrants a pause.

Skip if no GitNexus index exists. Continue to Step 2.
```

**Rationale:** Last gate before presenting merge/PR options. Tests verify correctness; detect_changes verifies scope. Kept within Step 1 (not a new step) to preserve the 5-step structure.

---

### 6. subagent-driven-development (`skills/subagent-driven-development/SKILL.md` + `implementer-prompt.md`)

**Change A — SKILL.md, new section after process diagram and before "Model Selection":**

```markdown
## Pre-Dispatch Context Enrichment (if GitNexus is indexed)

Before dispatching each implementer, gather targeted context:

```
gitnexus_impact({target: "<primary symbol the task modifies>", direction: "upstream"})
→ What depends on the symbol this task will change
```

Include the impact results in the implementer's `## Context` section. This prevents the implementer from making changes that break upstream consumers they can't see.

Skip if no GitNexus index exists — dispatch with plan context only.
```

**Change B — implementer-prompt.md, new section between "Context" and "Before You Begin":**

```markdown
    ## Impact Context (if provided)

    [Controller pastes gitnexus_impact results here, or removes this section if unavailable]

    These symbols depend on code you'll be modifying. Keep them working:
    - [list of upstream dependents from impact analysis]

    If your implementation would break any of these, report DONE_WITH_CONCERNS.
```

**Rationale:** Controller is the right place to run impact analysis (broad context). Providing results in the prompt means the implementer knows the blast radius before writing code, not after breaking something.

---

## Summary

| File | Changes | GitNexus Tools |
|------|---------|----------------|
| `skills/systematic-debugging/SKILL.md` | 2 insertions | `query`, `context` |
| `skills/brainstorming/SKILL.md` | 1 insertion | resources: `context`, `clusters` |
| `skills/writing-plans/SKILL.md` | 1 new section | `context`, `impact`, resource: `clusters` |
| `skills/verification-before-completion/SKILL.md` | 1 table row + 1 supplement | `detect_changes` |
| `skills/finishing-a-development-branch/SKILL.md` | 1 sub-check | `detect_changes` |
| `skills/subagent-driven-development/SKILL.md` | 1 new section | `impact` |
| `skills/subagent-driven-development/implementer-prompt.md` | 1 new template section | (receives pre-computed results) |

**Total: 7 files modified, ~8 insertions, 0 deletions.**

All changes gated with "if GitNexus is indexed" / "skip if no index."

## Verification

After implementation:
1. Read each modified skill file end-to-end to confirm flow coherence
2. Verify no existing content was removed or rewritten
3. Confirm all GitNexus tool names and parameter formats match CLAUDE.md reference
4. Test that skills read naturally with and without the GitNexus sections
