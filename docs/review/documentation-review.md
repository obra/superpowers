# Documentation & UX Review: Hartye-superpowers

**Reviewer:** Documentation & UX Agent
**Date:** 2026-03-02
**Scope:** All user-facing documentation, SKILL.md files, installation guides, commands, and platform-specific docs

---

## Executive Summary

The Hartye-superpowers project has strong foundational documentation. SKILL.md files are well-structured, use an effective pattern of DOT flowcharts, rationalization tables, and red flags lists, and show clear evidence of iterative refinement based on real testing. However, several important gaps exist: the README contains multiple stale references to the upstream project (`obra/superpowers`) rather than the forked `Hartye-superpowers` identity, there is no single coherent onboarding path for first-time users, and three skills lack the detailed context of their peers.

---

## 1. Installation Experience

### Claude Code (Primary Path)

**Assessment: Good with one significant issue**

The README provides clear two-command installation for Claude Code:

```bash
/plugin marketplace add obra/superpowers-marketplace
/plugin install superpowers@superpowers-marketplace
```

**Issues found:**

- Both commands reference `obra/superpowers-marketplace` and `superpowers@superpowers-marketplace`, not `Hartye-superpowers`. If this fork has its own marketplace, the commands are wrong. If it uses the upstream marketplace, this needs clarification.
- The `plugin.json` identifies the plugin as `h-superpowers` (version 4.3.0), but the install commands reference `superpowers`. There is a namespace mismatch between what the plugin declares itself to be and what the install docs tell users to type.
- The `marketplace.json` in `.claude-plugin/` uses `"name": "superpowers-dev"` with a `"source": "./"` pointing to local path — this is clearly a development/test marketplace, not a user-facing one. No user-facing marketplace registration doc exists.

**Verification step gap:** The README says "ask Claude to help with something that would trigger a skill" to verify. This is reasonable but vague. No concrete first prompt is suggested (e.g., "tell Claude: 'I want to build a login feature'"). A specific 3-5 word example would lower the anxiety of new users.

### OpenCode Path

**Assessment: Strong**

`.opencode/INSTALL.md` is clear, has a numbered step structure, includes troubleshooting, and covers the tool mapping table (TodoWrite → update_plan, etc.). The `docs/README.opencode.md` provides even more depth with Windows support across three shell environments. This is the most polished platform-specific doc.

**One gap:** The INSTALL.md verification step says `"do you have superpowers?"` — but the fork is `Hartye-superpowers`. Should the verification prompt reflect the renamed plugin?

### Codex Path

**Assessment: Good but minimal**

`.codex/INSTALL.md` is concise and correct. It covers Windows PowerShell. Migration from old bootstrap is documented. Uninstall is documented (rare, valuable).

**Gap:** No troubleshooting section for Linux-specific issues despite Linux being a primary Codex environment.

---

## 2. Skill Discoverability

**Assessment: Generally strong, with one pattern violation and one description quality gap**

The project correctly follows the Anthropic best practice of "description = trigger conditions, not workflow summary" — documented explicitly in `writing-skills/SKILL.md` and `anthropic-best-practices.md`. Most descriptions follow this well.

### Description Quality by Skill

| Skill | Description Quality | Notes |
|-------|---------------------|-------|
| `using-superpowers` | Good | Clear trigger: "starting any conversation" |
| `brainstorming` | Excellent | Imperative, comprehensive trigger |
| `subagent-driven-development` | Good | Concise, trigger-focused |
| `team-driven-development` | Good | Clear trigger conditions |
| `systematic-debugging` | Excellent | Enumerates use cases |
| `test-driven-development` | Good | "before writing implementation code" |
| `writing-plans` | Adequate | "before touching code" is slightly vague |
| `executing-plans` | Adequate | "in a separate session" is important context |
| `verification-before-completion` | Excellent | Very specific — "before committing or creating PRs" |
| `requesting-code-review` | Adequate | Could be more specific about subagent context |
| `receiving-code-review` | Good | Long but descriptive |
| `finishing-a-development-branch` | Verbose | Description is 192 chars — explains the workflow rather than just the trigger. Violates the project's own CSO guidance. |
| `using-git-worktrees` | Good | Specific context conditions |
| `dispatching-parallel-agents` | Good | Specific: "2+ independent tasks" |
| `writing-skills` | Adequate | Covers creation and verification |

**Specific issue — `finishing-a-development-branch`:**
Description reads: "Use when implementation is complete, all tests pass, and you need to decide how to integrate the work - guides completion of development work by presenting structured options for merge, PR, or cleanup"

The phrase "guides completion of development work by presenting structured options for merge, PR, or cleanup" summarizes the workflow — exactly what the `writing-skills/SKILL.md` CSO section says to avoid. Claude may follow this description shortcut and skip the full skill flowchart. Recommended fix: trim to "Use when implementation is complete and all tests pass, to decide how to integrate or discard the work."

---

## 3. SKILL.md Description Quality — Detailed Assessment

### Strengths Across the Library

1. **Flowchart usage is appropriate and effective.** Skills like `brainstorming`, `subagent-driven-development`, `team-driven-development`, and `systematic-debugging` use DOT flowcharts for decision points and loops — exactly the guidance in `writing-skills`. Simpler skills use lists.

2. **Rationalization tables are consistently present** in discipline-enforcing skills (TDD, systematic-debugging, verification-before-completion). These are the most distinctive and effective aspect of the skill library.

3. **Red flag sections prevent the most common failure modes** — having these in every discipline skill is a meaningful differentiator.

4. **Integration sections with explicit REQUIRED/COMPLEMENTARY markers** make the skill graph navigable.

5. **Quick Reference tables** appear in most skills and are well-targeted.

### Weaknesses

1. **`receiving-code-review` contains project-specific language** that reduces portability. Phrases like "your human partner's rule" and `"Strange things are afoot at the Circle K"` are context-specific to Jesse's workflow. In a general-purpose library, these read as internal references rather than universal guidance. New users won't know what "your human partner" means in this context versus generic usage.

2. **`systematic-debugging` Phase 4 step numbering is confusing.** The skill goes "Step 4: Implementation" then "Step 5: If 3+ Fixes Failed" inside Phase 4. There is no actual Step 5 label — it appears inline as "5. **If 3+ Fixes Failed: Question Architecture**". This is a minor formatting issue but breaks the expected scan pattern.

3. **`writing-plans` does not include a "When to Use" decision flowchart** even though the skill has a dependency on being run after brainstorming in a worktree. New users may invoke this skill prematurely without the proper context.

4. **`dispatching-parallel-agents` feels slightly orphaned.** It is listed in the README under Collaboration but is not referenced in the main workflow description (brainstorming → worktrees → plans → execution → review → finish). It is not a "required sub-skill" from any other skill's integration section. Discoverability depends entirely on users reading the README's skills library section.

---

## 4. Consistency of Documentation Style and Format

**Assessment: High consistency, with a few outliers**

The skills library shows strong format consistency overall. The deviations are minor:

| Pattern | Consistent? | Exceptions |
|---------|-------------|------------|
| YAML frontmatter with only `name` and `description` | Yes | All skills comply |
| "Use when..." description prefix | Mostly | `using-superpowers` starts with "Use when starting any conversation..." |
| DOT flowcharts for decisions | Good | `writing-plans` has no flowchart despite having multiple decision branches |
| "Announce at start" instruction | 3 of 14 skills | Only `using-git-worktrees`, `writing-plans`, `executing-plans` have this; others that also involve state changes do not |
| Integration section with REQUIRED/COMPLEMENTARY markers | Mostly | `dispatching-parallel-agents`, `verification-before-completion` have no Integration section |
| Red flags section | Present in discipline skills | Expected pattern, followed |
| Common Mistakes section | Present in most | `brainstorming`, `using-superpowers`, `writing-skills` do not have a Common Mistakes section |

**The "Announce at start" inconsistency** is notable. Three skills (`writing-plans`, `executing-plans`, `using-git-worktrees`) tell Claude to announce the skill name when starting. This is a transparency UX pattern. If it's valuable for those three, it should be standardized or explicitly excluded from the others with a reason.

---

## 5. Gaps in Documentation

### Gap 1: No First-Time User Journey

The README describes the workflow in a numbered list (brainstorming → worktrees → plans → execution → review → finish), but there is no single "Getting Started" narrative that walks a completely new user through their first successful session end-to-end. The skills library is powerful but assumes the user understands how the pieces fit together.

**Suggested addition:** A `docs/getting-started.md` or expanded README section: "Your First Feature with Superpowers" — showing a concrete example like "I want to add a dark mode toggle" walked through each step.

### Gap 2: No Cross-Platform Tool Mapping Reference

The OpenCode and Codex docs each have their own tool mapping tables in different locations (OpenCode INSTALL.md has one inline, the README doesn't). A shared reference would help users working across environments.

### Gap 3: `team-driven-development` Has No Tested Status Indicator

The skill prominently marks itself `⚠️ EXPERIMENTAL` but the RELEASE-NOTES.md does not describe what specific testing was performed on the skill. The `IMPLEMENTATION-SUMMARY.md` acknowledges that actual team spawning, message passing, and cost validation have not been tested (`⏳`). This is honest, but users encountering the skill in the marketplace won't see this caveat. The SKILL.md's "Troubleshooting" section is good, but the experimental warning could be more prominent in the README.

### Gap 4: `hooks/session-start.sh` Has No User Documentation

The session-start hook is central to the plugin (it injects context on every session start), but there is no documentation explaining what it does, how it works, or how to troubleshoot it beyond the RELEASE-NOTES.md entries. The `hooks.json` shows `async: false` — a deliberate recent change — with no inline comment explaining why.

### Gap 5: No Glossary or Terminology Reference

Several terms appear throughout without definition on first use: "worktree," "skill," "subagent," "TodoWrite," "HARD-GATE." First-time users will encounter these in skill content without context. A short glossary in the README or a dedicated `docs/glossary.md` would lower the learning curve.

### Gap 6: `docs/windows/polyglot-hooks.md` Is Unreferenced

The file `docs/windows/polyglot-hooks.md` exists but is not linked from the README, the OpenCode docs, or the Codex docs. Users looking for Windows-specific hook information won't find it through normal navigation.

---

## 6. README Completeness

**Assessment: Good coverage of skills, weak on fork identity and contribution path**

### What the README Does Well

- All 14 skills are listed with brief descriptions
- The Basic Workflow section explains step ordering
- Philosophy section is clear and motivating
- Installation is covered for all three platforms
- Links to blog post, issues, and marketplace

### What Is Missing or Wrong

1. **Fork identity gap:** The README says "Read more: [Superpowers for Claude Code](https://blog.fsck.com/...)" linking to Jesse Vincent's blog. The repository URLs throughout point to `github.com/obra/superpowers`. The `plugin.json` says author is "Jesse Vincent." The `marketplace.json` says owner is "Jesse Vincent." Nothing in the README acknowledges that this is `Hartye-superpowers` — a fork or derivative. If this is Eric Hartye's fork, the README should reflect that.

2. **Contributing section references `obra/superpowers`:** The Contributing section says fork *this* repository and submit PRs — but "this repository" should be clarified (fork URL missing).

3. **Update command is wrong for fork:** `/plugin update superpowers` may target the upstream plugin, not this fork's installed version, depending on how the marketplace is configured. This needs verification.

4. **Support links point upstream:** Issues and Marketplace links both point to `github.com/obra/` — if this is a separate project, these should point to the Hartye repository.

5. **`team-driven-development` is described as "experimental" in the skills list but not marked differently** — users may treat it as equal-weight to battle-tested skills like TDD or systematic-debugging.

---

## 7. RELEASE-NOTES.md Accuracy

**Assessment: Detailed and accurate for upstream; does not reflect fork-specific changes**

The RELEASE-NOTES.md is an excellent, detailed changelog showing the full evolution from v2.0.0 through v4.3.0. Notable observations:

1. The notes accurately describe all major changes including Windows fixes, OpenCode support, Codex migration, and skill consolidation.

2. **No entry for `Hartye-superpowers` fork.** If any changes were made when creating the fork (renaming the plugin from `superpowers` to `h-superpowers`, changing `plugin.json` author details, etc.), those changes are not captured in the RELEASE-NOTES.

3. The v4.3.0 entry accurately describes `async: false` for the SessionStart hook and the brainstorming HARD-GATE addition. The v4.2.0 entry contradicts itself somewhat — it first said "Windows: SessionStart hook runs async to prevent terminal freeze" (`v4.2.0`) then v4.3.0 says "SessionStart hook now runs synchronously." This could confuse users trying to understand the current behavior.

4. Historical notes reference skills that were removed (sharing-skills, testing-skills-with-subagents as standalone), which could confuse users who search for them.

---

## 8. Example Use Cases

**Assessment: Strong examples in some skills, absent in others**

### Where Examples Excel

- **`subagent-driven-development`**: The complete 165-line example showing the full two-stage review cycle (implementer → spec reviewer → code quality reviewer) is one of the most useful pieces of documentation in the project. It shows exactly what message exchanges look like.
- **`team-driven-development`**: The `example-auth-feature.md` linked from the skill is comprehensive.
- **`dispatching-parallel-agents`**: Concrete real-world example (6 failures, 3 agents, all resolved) with actual timing and outcome.
- **`test-driven-development`**: Good/Bad code examples are clear and contrasted well.
- **`receiving-code-review`**: Multiple real exchange examples showing correct vs. incorrect responses.

### Where Examples Are Missing or Weak

- **`writing-plans`**: Shows the plan structure format but no worked example of a complete plan. A minimal example (2-3 tasks fully written out) would help.
- **`executing-plans`**: No example of what a review checkpoint looks like or what "Ready for feedback" output should contain.
- **`brainstorming`**: No example conversation showing the question-by-question dialogue. The checklist implies a process but doesn't show it in action.

---

## 9. Cross-Platform Documentation Gaps

**Assessment: Windows coverage is comprehensive for OpenCode; incomplete for Codex and Claude Code**

| Platform | macOS | Linux | Windows |
|----------|-------|-------|---------|
| Claude Code | Covered | Assumed (same as macOS) | Partially (RELEASE-NOTES mentions fixes; no dedicated guide) |
| OpenCode | Covered | Covered | Excellent (3 shell variants) |
| Codex | Covered | Covered | Minimal (PowerShell junction only) |

**Specific gaps:**

1. **Claude Code on Windows**: The RELEASE-NOTES mention several Windows fixes (v4.2.0 hook execution, O(n²) performance fix), but there is no `docs/windows/claude-code.md` guide. Users would need to read RELEASE-NOTES to understand Windows-specific behavior.

2. **Linux compatibility**: The RELEASE-NOTES mention a v3.6.2 fix for Linux polyglot hook wrapper. The `docs/windows/polyglot-hooks.md` file exists but is not linked and appears to document a pattern that may no longer apply (RELEASE-NOTES v4.2.0 replaced the polyglot wrapper).

3. **macOS-specific paths**: Several docs use `~/.config/` paths that are macOS/Linux conventions. Windows paths using `%USERPROFILE%` are only covered in the OpenCode Windows docs and the Codex INSTALL.md PowerShell section.

---

## Top Findings Summary

### Finding 1: Fork Identity Mismatch (HIGH IMPACT)

The most significant documentation issue is that this project (`Hartye-superpowers`, plugin ID `h-superpowers`) has documentation throughout that identifies it as Jesse Vincent's `obra/superpowers`. The README sponsor link goes to Jesse, the blog link goes to Jesse's blog, all support URLs go to `github.com/obra`, and the plugin manifest credits Jesse Vincent. If this is Eric Hartye's fork, the documentation does not reflect it. New users installing this plugin will be confused about its relationship to the upstream project. This affects: README.md, plugin.json, marketplace.json, commands/*.md (description fields), and all support links.

### Finding 2: Skill Description CSO Violation in `finishing-a-development-branch` (MEDIUM IMPACT)

The `finishing-a-development-branch` skill's description summarizes its workflow ("guides completion... by presenting structured options for merge, PR, or cleanup") — violating the project's own documented guidance (CSO section in `writing-skills/SKILL.md`). Based on documented test results from v4.0.0, this pattern causes Claude to follow the description shortcut instead of reading the full flowchart. Given that this skill is the terminal step for all major workflows, Claude skipping or misexecuting the four-option decision tree would degrade user experience significantly.

### Finding 3: No First-Time User Journey / Getting Started Guide (MEDIUM IMPACT)

The project assumes users understand the workflow before reading skills. There is no guided walkthrough of "here is a real feature request, here is how Superpowers handles it from brainstorm to PR." The Basic Workflow list in the README is accurate but abstract. Without seeing a concrete end-to-end example, new users must piece together the workflow from individual skill docs. The `team-driven-development` example-auth-feature.md shows what this could look like, but it focuses on the most complex workflow. A simpler example (single-developer, subagent-driven) as a "Hello World" would dramatically improve first-session success.

---

## Additional Observations

- The `writing-skills` skill (SKILL.md) is the most comprehensive and meta-reflective document in the project — it could serve as a model for documentation quality elsewhere.
- The `persuasion-principles.md` support file is a thoughtful inclusion that is rarely seen in technical documentation; it grounds the rationalization-resistance patterns in behavioral research.
- The session-start hook matcher `"startup|resume|clear|compact"` in hooks.json is not documented for users who might want to understand when the hook fires.
- The `CREATION-LOG.md` in `systematic-debugging/` is an interesting artifact — it documents the development history of the skill itself. It is not linked from anywhere and could confuse users who encounter it while navigating skill directories.
- `agents/code-reviewer.md` is referenced in RELEASE-NOTES as being added in v3.2.1 but is not mentioned in the README's skills listing, even under "What's Inside."
