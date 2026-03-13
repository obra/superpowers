# GitHub Project Management Skill — TDD Review

## RED Phase: CLI Testing Results

All `gh` CLI commands from `gh-reference.md` were tested against real project `nickolasclarke/1`.

### Working Correctly
- `gh auth status`, `project list/view/field-list/item-list`
- `project item-create` (drafts), `item-edit`, `item-delete`
- `issue create`, `issue create --project` (one-step)
- All GraphQL sub-issues commands (`addSubIssue`, `removeSubIssue`, `listSubIssues`)

### Issues Found

1. **`item-create` returns NO OUTPUT on success** — agent won't know the item ID was created. The skill/reference should note this and suggest using `item-list --format json` after to verify.
2. **`gh issue create` fails if the repo has issues disabled** — skill doesn't handle this case.
3. **`--project` flag on `gh issue create` works by PROJECT NAME (not number)** — `gh-reference.md` shows both methods but could be clearer about when to use which.

---

## Analysis Against writing-skills Guidelines

### Frontmatter/CSO

**Current description (227 chars):**
```yaml
description: Use when completing design docs, creating implementation plans, discovering bugs during unrelated work, or finishing branches - integrates GitHub issue tracking into development workflow with confirmation before creating issues
```

**Analysis:**

| Criterion | Status | Notes |
|-----------|--------|-------|
| Starts with "Use when..." | Pass | Correct format |
| Under 500 chars | Pass | 227 chars |
| Under 1024 chars total | Pass | Well within limit |
| Third person | Pass | No first-person language |
| Avoids summarizing workflow | **Fail** | The second half — "integrates GitHub issue tracking into development workflow with confirmation before creating issues" — summarizes what the skill does rather than when to use it. This is exactly the trap writing-skills warns about in the CSO section. |

The description's first half is good (triggering conditions), but the second half describes the skill's behavior. Per writing-skills: "Descriptions that summarize workflow create a shortcut Claude will take. The skill body becomes documentation Claude skips."

**Proposed fix:**
```yaml
description: Use when completing design docs, creating implementation plans, discovering bugs during unrelated work, or finishing branches — any checkpoint where work should be tracked in GitHub issues or project boards
```

This keeps the triggering conditions but replaces the workflow summary with additional context about *when* (not *how*).

### Structure

**Recommended template from writing-skills:**
```
Overview, When to Use, Core Pattern, Quick Reference, Implementation, Common Mistakes
```

**Current SKILL.md structure:**
```
Overview, Configuration, Integration Points (4 sub-sections), Issue Types, Common Rationalizations, Quick Reference
```

**Comparison:**

| Recommended Section | Present? | Notes |
|---------------------|----------|-------|
| Overview | Yes | Good — has core principle |
| When to Use | **No** | Missing entirely. Integration Points partially covers this but as workflow steps, not as a "When to Use / When NOT to Use" section |
| Core Pattern | N/A | This is a workflow skill, not a technique — reasonable to skip |
| Quick Reference | Yes | Present but minimal — just a pointer to gh-reference.md + 3 commands |
| Implementation | Partially | Integration Points serve this role |
| Common Mistakes | **No** | Missing. The "Common Rationalizations" table addresses a different concern (resistance to issue creation) |
| Red Flags | **No** | Missing |

**Additional observations:**
- The "Configuration" section is well-placed early — good for practical setup.
- "Integration Points" is the skill's core content and is well-structured with triggers and actions.
- "Issue Types" table is clean and useful.

### Token Efficiency

**Word counts:**

| File | Words | Target | Status |
|------|-------|--------|--------|
| SKILL.md | 582 | <500 | **Over by 82 words** |
| gh-reference.md | 829 | N/A (reference file) | Acceptable as heavy reference |
| **Combined** | **1,411** | — | Loaded together when skill is active |

**Comparison with peer skills:**

| Skill | Words |
|-------|-------|
| brainstorming | 364 |
| writing-plans | 458 |
| finishing-a-development-branch | 679 |
| **github-project-management** | **582** |

The SKILL.md is in the same ballpark as finishing-a-development-branch (which is a more complex skill). Not egregiously over, but should be trimmed.

**What can be cut:**

1. **Quick Reference section (lines 109-125):** The 3 example commands duplicate content from gh-reference.md. Replace with just: "See gh-reference.md for CLI commands. Minimum auth: `gh auth refresh -s project`" — saves ~50 words.
2. **"Common Rationalizations" table (lines 99-106):** This is good content but takes ~50 words. Could be tighter — the table repeats similar points. Consider keeping 2 rows instead of 4.
3. **Integration Point templates:** The proposed issue body formats in sections 1 and 3 are detailed. These are useful for agent behavior but could be compressed slightly.

**Net savings estimate:** ~80-100 words, bringing it under 500.

### Keyword Coverage

**Terms an agent would search for when needing this skill:**

| Search Term | Present in SKILL.md? | Present in gh-reference.md? |
|-------------|---------------------|-----------------------------|
| "issue" | Yes | Yes |
| "project" | Yes | Yes |
| "tracking" / "track" | Yes | No |
| "bug" | Yes (in rationalizations) | No |
| "tech debt" | Yes | No |
| "sub-issue" / "sub-issues" | Yes | Yes |
| "GitHub" | Yes (title + config) | Yes |
| "milestone" | No | No |
| "backlog" | No | No |
| "project board" | No | No |
| "draft" | Yes (in Issue Types table) | Yes |
| "sprint" | No | No |
| "triage" | No | No |
| "gh project" / "gh issue" | Yes | Yes |

**Gaps:** "project board", "backlog", and "triage" are terms an agent might search for. The first is a minor gap. The latter two are intentionally out of scope (the design doc explicitly says strategic planning is not covered), but a "When NOT to Use" section could mention them as exclusions, which would actually *improve* discoverability — an agent searching "backlog" would find the skill and see it's not the right one, avoiding confusion.

### Cross-Referencing

**Current references in SKILL.md:**

| Referenced Skill | How Referenced | Proper Marker? |
|------------------|---------------|----------------|
| brainstorming | Implicit — "Design doc committed to `docs/plans/`" (section 1) | **No** — no explicit skill reference |
| writing-plans | Implicit — "Implementation plan completed" (section 2) | **No** — no explicit skill reference |
| finishing-a-development-branch | Explicit — "running finishing-a-development-branch" (section 4) | **No** — uses plain text, not `REQUIRED SUB-SKILL` or `REQUIRED BACKGROUND` marker |
| gh-reference.md | "See gh-reference.md for CLI commands" + "See gh-reference.md for GraphQL commands" | N/A — this is a file within the skill, not a cross-skill reference |

**Issues:**

1. None of the cross-references use the required markers (`REQUIRED BACKGROUND` or `REQUIRED SUB-SKILL`).
2. The relationship here is the reverse of typical cross-references — this skill is *called by* brainstorming, writing-plans, and finishing-a-development-branch, not the other way around. The question is whether *those* skills reference this one. That's outside the scope of this review but worth noting.
3. The skill should clarify its relationship to the other skills. Something like: "**Called after:** brainstorming, writing-plans, finishing-a-development-branch" (similar to how finishing-a-development-branch has a "Called by" section).

**Comparison:** finishing-a-development-branch has an explicit "Integration" section at the bottom listing "Called by" and "Pairs with" relationships. github-project-management lacks this pattern.

### Flowcharts

**Decision points that could benefit from a flowchart:**

1. **Issue Type Decision (Repo issue vs Project draft):** Currently a 2-row table. The decision is simple enough that a table works fine — a flowchart would be overkill.

2. **Bug Discovery Decision Tree (section 3):** Currently inline text: "Can fix in <5 minutes? → Fix it. Complex? → Offer to create issue." This is a legitimate decision point. A small inline flowchart would make the decision clearer and harder to skip. However, it's only two branches — borderline whether it warrants a flowchart.

3. **Overall Integration Point Selection:** "Which integration point am I at?" is implicitly answered by the trigger conditions (design doc committed, plan completed, bug discovered, branch finishing). This doesn't need a flowchart — the triggers are distinct enough.

**Recommendation:** A flowchart is not strictly necessary. The existing structure is clear. If anything, the bug discovery decision tree in section 3 is the best candidate, but it's simple enough that the current inline format works.

### Missing Sections

| Section | Status | Priority |
|---------|--------|----------|
| **When to Use / When NOT to Use** | Missing | High — this is in the template and helps discoverability |
| **Common Mistakes** | Missing | Medium — what goes wrong when agents use this skill? |
| **Red Flags** | Missing | Medium — for discipline aspects (e.g., creating issues without confirmation) |
| **Integration / Called By** | Missing | Low — nice to have for cross-skill navigation |

### Pattern Comparison

**How peer skills handle key structural elements:**

| Element | brainstorming | finishing-branch | writing-plans | github-project-mgmt |
|---------|--------------|-----------------|--------------|---------------------|
| "Announce at start" | No | Yes | Yes | No |
| When to Use / NOT | No | No | No | No |
| Common Mistakes | No | Yes (4 items) | No | No |
| Red Flags | No | Yes | No | No |
| Quick Reference table | No | Yes | No | Partial (pointer) |
| Integration/Cross-refs | Mentioned inline | Explicit section | Explicit markers | Implicit only |
| Core principle stated | No | Yes | No | Yes |

**Observations:**
- finishing-a-development-branch is the most mature skill of the set — it has Common Mistakes, Red Flags, Quick Reference table, and an Integration section. It's the best structural model for github-project-management.
- brainstorming is surprisingly light on structure — no common mistakes, no red flags, no announce. It may also need a review.
- writing-plans uses `REQUIRED SUB-SKILL` markers correctly in its execution handoff section — a good pattern for github-project-management to follow.

---

## Proposed Improvements

### Priority 1: Must Fix

These are things that are either broken or violate critical guidelines.

**1.1 — Description summarizes workflow (CSO violation)**

The description's second half tells the agent what the skill does instead of when to use it. This is the exact anti-pattern the writing-skills CSO section warns about.

Before:
```yaml
description: Use when completing design docs, creating implementation plans, discovering bugs during unrelated work, or finishing branches - integrates GitHub issue tracking into development workflow with confirmation before creating issues
```

After:
```yaml
description: Use when completing design docs, creating implementation plans, discovering bugs during unrelated work, or finishing branches — any development checkpoint where work should be tracked as GitHub issues or project items
```

**1.2 — `item-create` silent success not documented**

`gh project item-create` returns no output on success. An agent following the reference will create an item and have no feedback. This should be noted in gh-reference.md.

Add after the `item-create` command in gh-reference.md:
```markdown
# Note: item-create returns NO OUTPUT on success.
# Verify creation with:
gh project item-list 1 --owner obra --format json | jq '.items[-1]'
```

**1.3 — `--project` flag uses PROJECT NAME, not number**

gh-reference.md Method 1 shows `--project "My Project"` which is correct, but the distinction between project name (for `--project` flag) and project number (for `gh project` subcommands) is not called out. An agent could easily confuse them.

Add a note in gh-reference.md:
```markdown
# IMPORTANT: --project flag takes the project NAME (display name),
# while gh project subcommands take the project NUMBER.
```

### Priority 2: Should Fix

These are guideline violations that affect quality but aren't broken.

**2.1 — Add "When to Use / When NOT to Use" section**

This is in the recommended template. The Integration Points section covers "when" implicitly via triggers, but there's no explicit section and — more importantly — no "When NOT to Use" guidance.

Add after Overview:
```markdown
## When to Use

- After completing a design doc (brainstorming)
- After writing an implementation plan (writing-plans)
- When you discover a bug or tech debt unrelated to current work
- After finishing a development branch (finishing-a-development-branch)

## When NOT to Use

- Sprint planning, backlog grooming, or roadmap organization
- Automated issue creation without user confirmation
- Project-specific conventions (put those in CLAUDE.md)
```

**2.2 — Add "Common Mistakes" section**

finishing-a-development-branch provides a good model. Based on the RED phase testing results and the skill's design:

```markdown
## Common Mistakes

**Creating issues without confirmation**
- Problem: Issues are visible to the whole team — auto-creation is overstepping
- Fix: Always propose details and wait for explicit approval

**Using project number with --project flag**
- Problem: `--project 1` fails; the flag takes project name, not number
- Fix: Use `--project "Project Name"` or the two-step method with project number

**Assuming item-create output confirms success**
- Problem: `gh project item-create` returns no output on success
- Fix: Verify with `item-list --format json` after creation

**Not checking repo has issues enabled**
- Problem: `gh issue create` fails on repos with issues disabled
- Fix: Fall back to project draft item for repos without issues
```

**2.3 — Add cross-reference markers**

Replace implicit references with explicit markers per writing-skills guidelines.

In Integration Points section headers, add:

- Section 1: "**Follows:** superpowers:brainstorming"
- Section 2: "**Follows:** superpowers:writing-plans"
- Section 4: "**Follows:** superpowers:finishing-a-development-branch"

And add an Integration section at the bottom (following finishing-a-development-branch's pattern):
```markdown
## Integration

**Called after:**
- **brainstorming** — When design doc is committed
- **writing-plans** — When implementation plan is written
- **finishing-a-development-branch** — When branch work is complete
```

**2.4 — Trim SKILL.md to under 500 words**

Current: 582 words. Target: <500.

Specific cuts:
- Remove Quick Reference code block (lines 115-125) — redundant with gh-reference.md. Keep only the one-liner pointer and auth command. Saves ~40 words.
- Trim Common Rationalizations table from 4 rows to 2 most impactful. Saves ~30 words.
- Tighten Integration Point descriptions slightly. Target ~20 words saved.

### Priority 3: Nice to Have

**3.1 — Add "Red Flags" section**

This skill has discipline-enforcing aspects (always confirm before creating, don't auto-create). A Red Flags section would reinforce these:

```markdown
## Red Flags

**Never:**
- Create an issue without user confirmation
- Add items to a project without checking configuration first
- Close issues without verifying they're actually resolved

**Always:**
- Propose issue details and wait for approval
- Check `github_project` config before project operations
- Verify auth scopes before first project operation
```

**3.2 — Add sub-issues to SKILL.md Integration Point 2**

The SKILL.md mentions sub-issues in Integration Point 2 (option B), but the design doc only shows options A, B (individual issues), C (skip). The SKILL.md added "Parent issue with sub-issues" as a new option B without it being in the design doc. This is an enhancement worth keeping since sub-issues were tested and work, but it should be noted that gh-reference.md is the reference for how to execute this.

**3.3 — Note that `gh issue create` fails on repos with issues disabled**

Add to Issue Types table or to a Common Mistakes section:
```markdown
**Note:** Some repos have GitHub Issues disabled. If `gh issue create` fails, fall back to creating a project draft item instead.
```

---

## Summary

The github-project-management skill is well-designed overall. The integration point structure is clear, the triggers are distinct, and the separation between SKILL.md (workflow) and gh-reference.md (CLI commands) follows the writing-skills heavy reference pattern correctly.

**What's good:**
- Clear core principle and overview
- Well-defined triggers for each integration point
- Issue Types table is concise and useful
- Common Rationalizations table addresses agent resistance effectively
- gh-reference.md is comprehensive with working examples
- Sub-issues support via GraphQL is well-documented

**What needs work:**
- Description summarizes workflow (CSO violation) — Priority 1
- Missing "When to Use / When NOT to Use" section — Priority 2
- Missing "Common Mistakes" section — Priority 2, and the RED phase testing found real mistakes to document
- Cross-references are implicit rather than using required markers — Priority 2
- Slightly over word count target (582 vs 500) — Priority 2
- CLI gotchas from testing (silent `item-create`, `--project` name vs number) need to be documented — Priority 1

**Recommended next steps:**
1. Fix the description (CSO violation) — smallest change, highest impact on discoverability
2. Add Common Mistakes section incorporating RED phase findings
3. Add verification notes to gh-reference.md for `item-create` and `--project` flag
4. Add When to Use / When NOT to Use section
5. Add cross-reference markers and Integration section
6. Trim to under 500 words
7. Run GREEN phase tests with the updated skill to verify agent compliance
