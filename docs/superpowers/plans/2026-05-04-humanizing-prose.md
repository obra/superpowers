# Humanizing Prose Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two paired skills to the `joeshirey/superpowers` fork. `humanizing-prose` is a small trigger skill that fires when the agent is about to produce prose for a human reader. `humanizer` is the existing 559-line pattern catalog, moved from personal config into the repo and lightly adapted for silent self-check use rather than user-visible draft/audit/final output.

**Architecture:** Two pure-prose `SKILL.md` files, no scripts, no executable tests. The trigger skill defines fire/skip conditions and instructs the agent to load the humanizer reference via the `skill` tool when the trigger fires. The humanizer reference is the existing skill content with three changes: frontmatter normalized to repo house style (`name` + `description` only), Process and Output Format sections replaced with a silent self-check workflow, and a one-line note added to the Full Example clarifying that the labeled draft/audit/final structure shown there is for illustration only.

**Tech Stack:** Markdown only. No code, no test framework, no scripts. Verification is by manual inspection (file exists, frontmatter parses, content matches expectations) plus loading the skills via OpenCode's `skill` tool to confirm discovery works.

**Spec:** `docs/superpowers/specs/2026-05-04-humanizing-prose-design.md`

**Branch:** `feat/humanizing-prose-skill` (already created at `d88b576` from `origin/main`; spec already committed at `3385f29` and revised at `77e2202`).

**Worktree:** Working directly in `/Users/joeshirey/Code/GitHub/superpowers` on the feature branch (no separate worktree per human-partner direction).

---

## File Structure

**To create:**

```
skills/humanizer/
  SKILL.md                                              # Reference catalog, copied from personal config + adapted

skills/humanizing-prose/
  SKILL.md                                              # Trigger skill that loads humanizer on demand
```

**To modify:**

```
RELEASE-NOTES.md                                        # Add unreleased entry for the two new skills
```

**To delete (after both new skills exist and load):**

```
~/.config/opencode/skills/humanizer/                    # Personal-config copy; one source of truth in the repo from now on
```

**Not modified (intentional):**

- No changes to `using-superpowers` (these skills follow the standard discovery path).
- No changes to other skills' Integration sections (`humanizing-prose` advertises pairing with `committing-work`, `writing-plans`, and `brainstorming`; those skills don't need to know about `humanizing-prose` going the other direction).
- No changes to `.gitignore`, harness plugin manifests (`.opencode/`, `.claude-plugin/`, etc.; they auto-discover skills from `skills/`), or any existing skill content.
- No tests of any kind (the human partner explicitly cut bulletproofing during spec review; effectiveness will be assessed from real use).

---

## Verification Strategy

This plan ships markdown files. There is no test framework. Verification per task is one of:

- **File-exists check** — `ls -la <path>` shows the expected file(s) with non-zero size.
- **Frontmatter parse check** — `head -5 <SKILL.md>` shows valid YAML frontmatter with `name` and `description` fields.
- **Content match check** — `rg -c "<expected string>" <path>` returns the expected count, OR `wc -l <path>` returns the expected line count, OR a focused `grep` confirms a removed/added section.
- **Skill discovery check** — invoke the OpenCode `skill` tool with the new skill name; the tool reports the skill loaded successfully and prints the frontmatter description.

End-to-end check at the bottom: dogfood the trigger skill against the two new SKILL.md files themselves (Task 7), prove the skill actually catches AI tells in its own artifacts.

---

## Task 1: Copy humanizer SKILL.md from personal config into the repo (verbatim)

This task is the safe verbatim copy. Adaptation happens in Task 2 so the diff is reviewable as "what changed when adapting" rather than "what changed during the move."

**Files:**
- Create: `skills/humanizer/SKILL.md` (copy of `~/.config/opencode/skills/humanizer/SKILL.md`, 559 lines)

- [ ] **Step 1: Create the directory**

```bash
mkdir -p skills/humanizer
```

Verify:

```bash
ls -ld skills/humanizer
```

Expected: directory exists, mode `755` (or whatever the repo default is for new dirs).

- [ ] **Step 2: Copy the file**

```bash
cp ~/.config/opencode/skills/humanizer/SKILL.md skills/humanizer/SKILL.md
```

Verify:

```bash
wc -l skills/humanizer/SKILL.md
```

Expected: `559 skills/humanizer/SKILL.md`. If a different number, the source file changed since the spec was written; stop and reconcile with the human partner before proceeding.

- [ ] **Step 3: Diff against source to confirm verbatim**

```bash
diff ~/.config/opencode/skills/humanizer/SKILL.md skills/humanizer/SKILL.md
```

Expected: no output (zero differences).

- [ ] **Step 4: Commit**

```bash
git add skills/humanizer/SKILL.md
git commit -m "feat(humanizer): copy skill verbatim from personal config

Verbatim copy of ~/.config/opencode/skills/humanizer/SKILL.md
into skills/humanizer/SKILL.md so the repo holds the canonical
version. Adaptation for silent self-check use happens in the
next commit so the diff is reviewable in isolation.

Spec: docs/superpowers/specs/2026-05-04-humanizing-prose-design.md"
```

Verify:

```bash
git log -1 --stat
```

Expected: one commit on `feat/humanizing-prose-skill`, one file changed (`skills/humanizer/SKILL.md`), 559 insertions.

---

## Task 2: Adapt humanizer for repo house style and silent self-check use

Three changes to the file just copied in Task 1:

1. Replace the frontmatter with repo house style (`name` + `description` only; drop `version`, `license`, `compatibility`, `allowed-tools`). Reframe the description so the skill reads as a reference loaded on demand by `humanizing-prose`, not a standalone "give me text" tool.
2. Replace the **Process** section (lines 466–481 in the original) and the **Output Format** section (lines 483–489) with a single **Self-Check Workflow** section.
3. Add a one-line note at the top of the **Full Example** section (line 492 in the original) clarifying that the labeled draft/audit/final structure is for illustration; actual self-checks during agent writing are silent.

**Files:**
- Modify: `skills/humanizer/SKILL.md` (frontmatter, Process section, Output Format section, Full Example header note)

- [ ] **Step 1: Replace the frontmatter**

Open `skills/humanizer/SKILL.md`. The current frontmatter (lines 1–20) reads:

```yaml
---
name: humanizer
version: 2.5.1
description: |
  Remove signs of AI-generated writing from text. Use when editing or reviewing
  text to make it sound more natural and human-written. Based on Wikipedia's
  comprehensive "Signs of AI writing" guide. Detects and fixes patterns including:
  inflated symbolism, promotional language, superficial -ing analyses, vague
  attributions, em dash overuse, rule of three, AI vocabulary words, passive
  voice, negative parallelisms, and filler phrases.
license: MIT
compatibility: claude-code opencode
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - AskUserQuestion
---
```

Replace it with:

```yaml
---
name: humanizer
description: Reference catalog of AI-writing patterns and how to fix them. Loaded on demand by the humanizing-prose skill when the agent is about to produce prose for a human reader. Covers significance inflation, em dash overuse, rule of three, AI vocabulary, passive voice, sycophancy, and ~25 other patterns from Wikipedia's Signs of AI writing.
---
```

Use the `edit` tool with `oldString` containing the entire 20-line block from the original and `newString` containing the 4-line replacement.

Verify:

```bash
head -5 skills/humanizer/SKILL.md
```

Expected:

```
---
name: humanizer
description: Reference catalog of AI-writing patterns and how to fix them. Loaded on demand by the humanizing-prose skill when the agent is about to produce prose for a human reader. Covers significance inflation, em dash overuse, rule of three, AI vocabulary, passive voice, sycophancy, and ~25 other patterns from Wikipedia's Signs of AI writing.
---

```

Also confirm the old fields are gone:

```bash
rg -c "^version:|^license:|^compatibility:|^allowed-tools:" skills/humanizer/SKILL.md
```

Expected: no matches (rg exits 1).

- [ ] **Step 2: Replace the Process and Output Format sections with Self-Check Workflow**

The original Process section (with the leading `## Process` heading) reads:

```markdown
## Process

1. Read the input text carefully
2. Identify all instances of the patterns above
3. Rewrite each problematic section
4. Ensure the revised text:
   - Sounds natural when read aloud
   - Varies sentence structure naturally
   - Uses specific details over vague claims
   - Maintains appropriate tone for context
   - Uses simple constructions (is/are/has) where appropriate
5. Present a draft humanized version
6. Prompt: "What makes the below so obviously AI generated?"
7. Answer briefly with the remaining tells (if any)
8. Prompt: "Now make it not obviously AI generated."
9. Present the final version (revised after the audit)

## Output Format

Provide:
1. Draft rewrite
2. "What makes the below so obviously AI generated?" (brief bullets)
3. Final rewrite
4. A brief summary of changes made (optional, if helpful)
```

Replace both sections (the entire block from `## Process` through the end of the Output Format list) with:

```markdown
## Self-Check Workflow

This workflow is invoked by the `humanizing-prose` skill when the agent is about to produce prose for a human reader. The agent runs it silently against its own draft; nothing about the workflow itself appears in the output the human partner sees.

1. Hold the draft in mind. Do not print it.
2. Scan against the 29 patterns documented in the sections above. Note every match.
3. Revise the matched spots in place. Apply the personality and voice guidance from the PERSONALITY AND SOUL section so the result has a pulse, not just absent AI tells.
4. Read the revised version back as if a human wrote it. If anything still reads as obviously AI-generated, revise again.
5. Ship the revised version. Do not print the pre-revision draft, the audit, or the change log unless the human partner asks for them.

### When invoked directly (legacy / manual use)

If the human partner invokes this skill directly with a chunk of text to humanize (rather than via `humanizing-prose`), the older draft → audit → final output structure shown in the Full Example below is appropriate. Use it when the human partner explicitly wants to see the audit step, otherwise default to the silent workflow above.
```

Use the `edit` tool with `oldString` containing the full original block (Process heading through the end of the Output Format list) and `newString` containing the replacement.

Verify the Output Format section is gone:

```bash
rg -c "^## Output Format$" skills/humanizer/SKILL.md
```

Expected: no matches.

Verify the new section is present:

```bash
rg -c "^## Self-Check Workflow$" skills/humanizer/SKILL.md
```

Expected: `1`.

Verify the Process section is gone (the new content does not use the `## Process` heading):

```bash
rg -c "^## Process$" skills/humanizer/SKILL.md
```

Expected: no matches.

- [ ] **Step 3: Add a one-line note at the top of the Full Example section**

Find the `## Full Example` heading in the file. Use the `edit` tool to change:

```markdown
## Full Example

**Before (AI-sounding):**
```

to:

```markdown
## Full Example

> **Note:** The labeled "Draft rewrite / What makes the below so obviously AI generated? / Now make it not obviously AI generated. / Changes made" structure shown below is illustrative for direct human-invoked use. When the agent runs the self-check workflow defined above (invoked by `humanizing-prose`), the audit and the change log stay internal — only the final revised prose is shipped.

**Before (AI-sounding):**
```

Verify:

```bash
rg -c "Note.*labeled.*illustrative" skills/humanizer/SKILL.md
```

Expected: `1`.

- [ ] **Step 4: Sanity-check the file as a whole**

```bash
wc -l skills/humanizer/SKILL.md
```

Expected: somewhere between 545 and 565 lines (original 559, minus ~16 lines of dropped frontmatter, minus ~22 lines of dropped Process + Output Format, plus ~13 lines of new Self-Check Workflow, plus 2 lines of Full Example note). Off by more than ±10 from that range means an edit went sideways; inspect with `git diff skills/humanizer/SKILL.md`.

```bash
head -3 skills/humanizer/SKILL.md
```

Expected: `---`, `name: humanizer`, `description: Reference catalog ...`.

- [ ] **Step 5: Commit**

```bash
git add skills/humanizer/SKILL.md
git commit -m "feat(humanizer): adapt for repo house style and silent self-check

Three changes to the verbatim copy from the previous commit:

1. Frontmatter normalized to repo house style: name + description
   only. Dropped version, license, compatibility, allowed-tools
   (none of which are used by the harnesses that load skills from
   this repo).
2. Process and Output Format sections replaced with a Self-Check
   Workflow section that fits agent-self-editing during writing
   (silent revise-then-ship) rather than the old user-pastes-text
   draft / audit / final flow.
3. One-line note at the top of the Full Example clarifying that
   the labeled three-pass structure shown there is illustrative
   for direct human invocation; agent self-checks are silent.

The 29 pattern catalog and the PERSONALITY AND SOUL section are
unchanged.

Spec: docs/superpowers/specs/2026-05-04-humanizing-prose-design.md"
```

Verify:

```bash
git log -1 --stat
```

Expected: one commit, one file changed (`skills/humanizer/SKILL.md`), insertion + deletion counts in the tens (not hundreds).

---

## Task 3: Create the humanizing-prose trigger skill

The trigger skill that holds the fire/skip rules and tells the agent to load `humanizer` on demand. Content is drawn from the spec's "Skill: `humanizing-prose`" section, with edits to fit a SKILL.md (the spec talks about the skill in third person; the SKILL.md addresses the agent reading it).

**Files:**
- Create: `skills/humanizing-prose/SKILL.md`

- [ ] **Step 1: Create the directory**

```bash
mkdir -p skills/humanizing-prose
```

Verify:

```bash
ls -ld skills/humanizing-prose
```

Expected: directory exists.

- [ ] **Step 2: Write the SKILL.md**

Create `skills/humanizing-prose/SKILL.md` with the exact content below. Use the `write` tool.

````markdown
---
name: humanizing-prose
description: Use when about to write prose for a human reader: markdown files, PR descriptions, commit bodies, READMEs, doc pages, release notes, blog posts, or chat replies longer than a couple of sentences. Catches AI-sounding writing (significance inflation, em dash overuse, rule of three, hedging, sycophancy) before it gets sent or committed.
---

# Humanizing Prose

## Overview

Most prose an agent produces reads as obviously AI-generated. It puffs up significance, leans on em dashes, builds rule-of-three lists, hedges with "could potentially," opens with "Let's dive in," and ends with "the future looks bright."

The fix is not to remember the patterns. The fix is to recognize when prose is about to be produced for a human reader, load the `humanizer` reference catalog at that moment, run the silent self-check, and ship the revised version.

This skill is the trigger. The 29-pattern catalog lives in `humanizer`, which this skill loads on demand.

## When to Fire (always)

Run this skill before producing prose in any of these contexts:

| Context | Why |
|---|---|
| Writing or editing `.md` / `.mdx` files | Persisted prose, usually for a human reader |
| PR description / PR body | Read by reviewers, often by the public |
| Commit message **body** (not subject) | Persisted, searched, read by future agents |
| READMEs | High-visibility, sets project tone |
| Files under `docs/` | Documentation, by definition for humans |
| Release notes, changelogs, blog posts | Public-facing prose |
| Design docs and specs (`docs/superpowers/specs/`) | The thing future agents will read for context |

## When to Fire (chat replies)

For chat replies to the human partner: fire when the reply will exceed roughly **30 words of natural-language prose** (about two sentences). Below that, skip the check. Quick acknowledgments, "running it now," short answers to direct questions, and one-sentence status updates do not need humanizing.

The 30-word threshold is a guideline, not a counter. The agent estimates as it drafts; if the reply is going to be more than a quick one-liner, the check fires.

**What counts toward the 30 words:** only natural-language prose intended for the human partner to read. Code blocks, tool output the agent is relaying, structured tables, JSON, command output, and direct quotes do not count. A reply that is mostly a code block with a one-sentence framing is below threshold even if total characters are large. A reply that is three short prose paragraphs interleaved with code is above threshold; the prose paragraphs get humanized and the code stays untouched.

## When NOT to Fire (always skip)

| Context | Why |
|---|---|
| Code (any language) | Different conventions; humanizer rules cause harm |
| Code comments | Often should be terse, declarative, passive; humanizer would degrade them |
| Commit message **subject lines** | Need to stay imperative and short |
| Error messages, stack traces, tool output being relayed | Not the agent's prose |
| Short chat replies (under ~30 words of prose) | Cost not worth it |
| Direct quotes of someone else's writing | Quoting verbatim is the point |
| Structured output: JSON, YAML, tables, config files | Not prose |
| Terminal command output being shown back to the human partner | Not the agent's prose |
| Issue/PR titles | Same reasoning as commit subject lines |

## Procedure

```
1. RECOGNIZE THE TRIGGER
   Before producing prose, check: does this fall into a fire context?
   - File extension or path matches the always-fire list, OR
   - Output destination is a PR/commit body, release note, etc., OR
   - This is a chat reply that will exceed ~30 words of prose.

   If yes → continue. If no → write normally, skip this skill.

2. LOAD THE HUMANIZER REFERENCE
   Invoke the `humanizer` skill via the skill tool. This pulls in the
   29-pattern catalog, the personality/voice section, and the
   self-check workflow. Do not try to humanize from memory; patterns
   evolve and the reference is the source of truth.

3. DRAFT THE PROSE
   Write a first version of the prose, applying the patterns from the
   humanizer reference as you go.

4. SELF-CHECK BEFORE SENDING
   Apply the self-check workflow defined in the humanizer skill (see
   the humanizer's "Self-Check Workflow" section). The workflow is:
     - Read the draft back as if a human wrote it. Does it sound natural?
     - Scan against the 29-pattern catalog. Note every match.
     - Pay extra attention to the highest-frequency tells: em dashes,
       "stands as / serves as," rule of three, "let's dive in," "the
       future looks bright," inline-header bold lists, sycophantic openers.
     - Revise the spots that fail.

5. SHIP THE REVISED VERSION
   Only the post-check version goes to the file, the PR body, or the
   chat reply. The pre-check draft is throwaway.
```

## Red Flags — STOP if you find yourself doing any of these

- Writing a PR description or doc page without invoking the humanizer reference
- Telling yourself "I know the patterns, I don't need to load the reference"
- Skipping the self-check because the prose "feels fine"
- Applying humanizer rules to code or code comments
- Rewriting a commit subject line to "make it less AI-sounding"
- Humanizing a direct quote of someone else's writing
- Padding short chat replies up to 30 words to trigger the check (the threshold is a ceiling-style trigger, not a target)
- Loading the humanizer reference on every short message "just in case"

## Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "It's just a one-line README change" | One-line changes set the tone of the file. Check it. |
| "PR descriptions are throwaway" | They are searched, linked, quoted, and read by reviewers. Not throwaway. |
| "I'll humanize it later if the human partner complains" | The human partner will complain by closing the PR. Check it now. |
| "The humanizer reference is too long to load every time" | The trigger is specifically designed so it only loads when the cost is worth it. |
| "This is technical writing, the AI patterns don't apply" | Technical writing is where significance inflation and rule-of-three thrive. Especially apply it here. |
| "The human partner reads everything I write anyway" | The point is to not waste their time editing your prose. |
| "I already did one pass, that's good enough" | The humanizer's self-check is a second pass on purpose. Do it. |

## What This Skill Is NOT

- **A code-style enforcer.** Code conventions are different. Use a linter.
- **A grammar checker.** The humanizer catches a specific class of AI tells, not general writing problems.
- **A length limiter.** Long prose is fine. AI-sounding prose is not.
- **A blocker.** Nothing prevents the agent from shipping un-humanized prose if the trigger doesn't fire. The skill is opt-in by context, not enforced by tooling.

## Integration

**Pairs with:**
- `humanizer` — the heavyweight reference this skill loads on demand.
- `committing-work` — fires when the agent is about to write the commit body (not the subject).
- `writing-plans` and `brainstorming` — both produce specs and design docs; both are in-scope artifacts.

**Distinct from:**
- Code-quality skills (`test-driven-development`, `verification-before-completion`) — those govern code; this governs prose.
- `humanizer` itself — the humanizer is *what* to do; this skill is *when* to do it.
````

- [ ] **Step 3: Verify the file**

```bash
wc -l skills/humanizing-prose/SKILL.md
```

Expected: between 90 and 110 lines.

```bash
head -4 skills/humanizing-prose/SKILL.md
```

Expected:

```
---
name: humanizing-prose
description: Use when about to write prose for a human reader: ...
---
```

```bash
rg -c "^## " skills/humanizing-prose/SKILL.md
```

Expected: `9` (Overview, When to Fire (always), When to Fire (chat replies), When NOT to Fire, Procedure, Red Flags, Common Rationalizations, What This Skill Is NOT, Integration).

```bash
rg -c "30 words" skills/humanizing-prose/SKILL.md
```

Expected: `5` (the chat-reply section paragraph, the "What counts toward the 30 words" paragraph, the When-NOT-to-Fire table row, the Procedure step 1, the Red Flags row).

- [ ] **Step 4: Commit**

```bash
git add skills/humanizing-prose/SKILL.md
git commit -m "feat(humanizing-prose): add trigger skill

New trigger skill that fires when the agent is about to produce
prose for a human reader (markdown files, PR descriptions, commit
bodies, READMEs, doc pages, release notes, design specs, or chat
replies longer than ~30 words of prose). On fire, the skill
instructs the agent to load the humanizer reference catalog via
the skill tool and run the silent self-check workflow before
shipping.

Carves out explicit non-fire contexts: code, code comments, commit
subject lines, structured output, quotes, short replies. Many
humanizer rules conflict with code-comment style; applying them
there causes harm.

Pairs with the humanizer skill (which holds the 29-pattern catalog
and is loaded on demand) and with committing-work, writing-plans,
and brainstorming (all of which produce in-scope prose artifacts).

Spec: docs/superpowers/specs/2026-05-04-humanizing-prose-design.md"
```

Verify:

```bash
git log -1 --stat
```

Expected: one commit, one file changed (`skills/humanizing-prose/SKILL.md`), 90–110 insertions.

---

## Task 4: Verify both skills load correctly via the skill tool

Both files exist and parse as YAML. Now confirm OpenCode actually surfaces them in the available-skills list and can load them.

**Files:**
- No file changes in this task. Verification only.

- [ ] **Step 1: Confirm filesystem layout**

```bash
ls -la skills/humanizer/SKILL.md skills/humanizing-prose/SKILL.md
```

Expected: both files exist, non-zero size.

```bash
head -4 skills/humanizer/SKILL.md skills/humanizing-prose/SKILL.md
```

Expected: both start with `---`, `name: <skill-name>`, `description: ...`, `---` (or with the description field on the same line).

- [ ] **Step 2: Confirm both skills appear in the agent's available-skills list**

In a new agent session (or by checking the system prompt of the current session after a reload), confirm:

```
- humanizing-prose: Use when about to write prose for a human reader: ...
- humanizer: Reference catalog of AI-writing patterns and how to fix them. ...
```

Both must appear with the descriptions matching what was written. If either is missing, the harness has not picked up the new skills; check `.opencode/` plugin manifests for any allowlist that needs updating (the spec says no manifest changes are needed, but verify).

If you cannot reload the agent session inside this task, document the expected discovery state and proceed to Task 5; defer the live load check to Task 7's dogfooding pass.

- [ ] **Step 3: Load the trigger skill via the skill tool**

Invoke:

```
skill(name="humanizing-prose")
```

Expected: tool returns the full content of `skills/humanizing-prose/SKILL.md` wrapped in a `<skill_content>` block. The content includes the When-to-Fire tables, the Procedure section, the Red Flags list.

- [ ] **Step 4: Load the humanizer reference via the skill tool**

Invoke:

```
skill(name="humanizer")
```

Expected: tool returns the full content of `skills/humanizer/SKILL.md`. The content includes the 29 numbered patterns, the PERSONALITY AND SOUL section, and the new Self-Check Workflow section. The old `## Process` and `## Output Format` headings are gone.

- [ ] **Step 5: No commit**

This task makes no file changes. Move to Task 5.

---

## Task 5: Remove the personal-config copy of humanizer

The repo is now the source of truth. Remove the personal-config copy so future edits don't drift between the two locations.

**Files:**
- Delete: `~/.config/opencode/skills/humanizer/SKILL.md`
- Delete: `~/.config/opencode/skills/humanizer/` (the directory itself, if empty)

- [ ] **Step 1: Confirm the personal-config copy still exists and matches what was copied in Task 1**

```bash
ls -la ~/.config/opencode/skills/humanizer/
```

Expected: `SKILL.md` present, no other files (the original directory had only the one file).

```bash
diff ~/.config/opencode/skills/humanizer/SKILL.md skills/humanizer/SKILL.md
```

Expected: differences are exactly the adaptation from Task 2 (frontmatter, Process / Output Format → Self-Check Workflow, Full Example note). If you see *no* differences, Task 2 didn't actually run; stop and re-do Task 2 before deleting the personal copy. If you see differences other than the Task 2 changes, something else has touched the file; reconcile with the human partner before deleting.

- [ ] **Step 2: Remove the file**

```bash
rm ~/.config/opencode/skills/humanizer/SKILL.md
```

Verify:

```bash
ls ~/.config/opencode/skills/humanizer/SKILL.md 2>&1
```

Expected: `ls: ...: No such file or directory`.

- [ ] **Step 3: Remove the now-empty directory**

```bash
rmdir ~/.config/opencode/skills/humanizer/
```

Verify:

```bash
ls -ld ~/.config/opencode/skills/humanizer/ 2>&1
```

Expected: `ls: ...: No such file or directory`.

If `rmdir` fails because the directory is not empty, list its contents:

```bash
ls -la ~/.config/opencode/skills/humanizer/
```

Stop and ask the human partner what to do with the unexpected files before retrying.

- [ ] **Step 4: No commit**

This task touches only files outside the repo. Move to Task 6.

---

## Task 6: Add RELEASE-NOTES entry

Add an `[Unreleased]` entry above the most recent existing entry (the `managing-backlog-items` entry).

**Files:**
- Modify: `RELEASE-NOTES.md`

- [ ] **Step 1: Read the current top of the file**

```bash
head -5 RELEASE-NOTES.md
```

Expected: line 1 is `# Superpowers Release Notes`, line 2 is blank, line 3 is `## [Unreleased] — managing-backlog-items skill (fork-only)`.

- [ ] **Step 2: Insert the new entry above the managing-backlog-items entry**

Use the `edit` tool. Find the string:

```
# Superpowers Release Notes

## [Unreleased] — managing-backlog-items skill (fork-only)
```

Replace with:

```
# Superpowers Release Notes

## [Unreleased] — humanizing-prose and humanizer skills (fork-only)

Two paired skills for the `joeshirey/superpowers` fork that catch AI-sounding writing
in agent-produced prose before it gets persisted or sent.

**Not intended for upstream contribution.** This is style enforcement that reflects
personal preference for prose that does not read as obviously AI-generated. AGENTS.md
is explicit that personal-preference and style skills belong outside core.

### New skills

- **humanizing-prose** — Trigger skill that fires when the agent is about to produce
  prose for a human reader: markdown files, PR descriptions, commit bodies, READMEs,
  doc pages, release notes, design specs, or chat replies longer than ~30 words of
  prose. Carves out explicit non-fire contexts: code, code comments, commit subject
  lines, structured output (JSON / YAML / tables), direct quotes, short conversational
  replies. On fire, instructs the agent to load the `humanizer` reference catalog via
  the skill tool and run the silent self-check workflow before shipping the prose.

- **humanizer** — Reference catalog of 29 AI-writing patterns from Wikipedia's
  "Signs of AI writing" guide (significance inflation, em dash overuse, rule of three,
  AI vocabulary, copula avoidance, negative parallelism, sycophancy, generic positive
  conclusions, etc.) plus a PERSONALITY AND SOUL section on adding voice rather than
  just removing tells. Adapted from a personal-config skill into the repo so it has one
  source of truth. Original Process / Output Format sections (which assumed
  user-pastes-text → I-print-three-passes interaction) replaced with a silent
  self-check workflow that fits agent-self-editing during writing.

### Evidence

No formal subagent-based RED/GREEN/REFACTOR testing for this skill set. The human
partner will assess effectiveness from real use rather than from synthetic pressure
scenarios. Dogfooding during build: the spec, the trigger SKILL.md, the adapted
humanizer SKILL.md prose sections, and the implementation plan all received the
self-check pass before commit.

### Future work

- **Per-project voice samples.** The humanizer already supports voice calibration via
  a writing sample. A future enhancement could let a project drop a `.writing-style.md`
  file at repo root that gets auto-loaded when the trigger fires.
- **Hook-based enforcement.** A pre-commit hook could grep commit bodies and PR
  descriptions for the highest-frequency tells (em dashes, "stands as," etc.) and warn.
  Mechanical, not judgment-based. Would complement, not replace, this skill set.
- **A `linting-prose` companion.** A separate small skill that runs the
  regex-detectable subset of patterns and reports hits, for the case where the human
  partner wants to audit existing prose without rewriting it.

## [Unreleased] — managing-backlog-items skill (fork-only)
```

Verify:

```bash
rg -c "^## \[Unreleased\] — humanizing-prose" RELEASE-NOTES.md
```

Expected: `1`.

```bash
rg -c "^## \[Unreleased\] — managing-backlog-items" RELEASE-NOTES.md
```

Expected: `1` (the existing entry is preserved, not removed).

- [ ] **Step 3: Verify section ordering**

```bash
rg -n "^## \[Unreleased\]" RELEASE-NOTES.md | head -3
```

Expected: the `humanizing-prose` entry appears at a lower line number than the `managing-backlog-items` entry. The new entry comes first because it's the most recent.

- [ ] **Step 4: Commit**

```bash
git add RELEASE-NOTES.md
git commit -m "docs(release-notes): add humanizing-prose and humanizer skills

Unreleased entry for the two new fork-only skills. Documents:
- The two-skill split (trigger + on-demand reference catalog).
- Explicit fire / non-fire contexts (carves code and code comments
  out of scope so humanizer rules don't degrade them).
- The 30-word chat-reply threshold.
- The personal-config humanizer migration into the repo.
- No formal pressure testing; effectiveness assessed from real use.

Spec: docs/superpowers/specs/2026-05-04-humanizing-prose-design.md
Plan: docs/superpowers/plans/2026-05-04-humanizing-prose.md"
```

Verify:

```bash
git log -1 --stat
```

Expected: one commit, one file changed (`RELEASE-NOTES.md`), insertions only (no deletions).

---

## Task 7: Dogfood the trigger skill against the two new SKILL.md files

The skills exist; now verify they actually do what they claim. Apply the trigger skill's procedure to the two new SKILL.md files: load the humanizer reference, scan for the highest-frequency AI tells, revise any tells that hit, ship the revised versions.

**Files:**
- Possibly modify: `skills/humanizing-prose/SKILL.md`
- Possibly modify: `skills/humanizer/SKILL.md` (only the prose sections: Overview-equivalents, Self-Check Workflow note, Full Example note. Pattern catalog stays verbatim.)

Both files were already humanized as they were written, so this pass is mostly a no-op verification. The point is to prove the trigger procedure runs end-to-end on its own artifacts.

- [ ] **Step 1: Run the trigger skill's procedure on `skills/humanizing-prose/SKILL.md`**

Follow the Procedure section in `skills/humanizing-prose/SKILL.md`:

1. Recognize the trigger: this is editing a `.md` file → fire.
2. Load the humanizer reference: invoke `skill(name="humanizer")`.
3. Scan the prose sections of `humanizing-prose/SKILL.md` (Overview, When-to-Fire intro paragraphs, the chat-reply explanation, Red Flags rationale, Common Rationalizations cells, What-This-Skill-Is-NOT bullets, Integration intro). Skip the tables, the procedure code block, and the frontmatter.
4. Note any pattern hits using the humanizer's 29-pattern catalog.
5. If any high-frequency tells are present (em dashes that could be commas/periods/parens, "stands as / serves as," rule-of-three lists, sycophantic openers, "the future looks bright," generic positive conclusions, knowledge-cutoff disclaimers), revise them in place using the `edit` tool.

Run a sanity scan:

```bash
rg -n "—" skills/humanizing-prose/SKILL.md
```

For each em dash found, decide: is this a header dash (acceptable, e.g., `## When to Fire — chat replies`), a bullet-definition dash (acceptable, e.g., `- humanizer — the heavyweight reference`), or a substitute for a comma / period / parens (replace it)? Apply edits as needed.

```bash
rg -n "stands as|serves as" skills/humanizing-prose/SKILL.md
```

Expected: zero matches in prose. (May appear inside the Red Flags or Procedure quoted-list-of-tells; those are illustrative and stay.)

```bash
rg -ni "the future looks bright|exciting times|in conclusion" skills/humanizing-prose/SKILL.md
```

Expected: zero matches in prose. Same caveat.

If revisions were needed, document them in the commit message; if no revisions, note "no AI tells found in prose sections; trigger procedure ran end-to-end successfully" in the commit message.

- [ ] **Step 2: Run the same procedure on `skills/humanizer/SKILL.md` prose sections**

Apply the same procedure to `skills/humanizer/SKILL.md`, but limit the scan to the prose sections only:

- Title and one-paragraph intro at the top
- Voice Calibration section
- PERSONALITY AND SOUL section (this is itself prose about prose; check it carefully)
- The new Self-Check Workflow section
- The new Full Example note line

Skip:

- The 29 numbered pattern entries (these are illustrative content; many of them quote AI-sounding text on purpose as the "Before" example)
- The Full Example block itself (its before/after structure is the whole point; re-humanizing it would defeat the example)

```bash
rg -n "^## " skills/humanizer/SKILL.md
```

Use this section list to confirm which sections are in scope vs out of scope.

- [ ] **Step 3: Decide whether the changes warrant a commit**

If both files passed the dogfooding pass with zero edits needed, this task is purely a verification. Commit a short note documenting that the dogfooding pass ran successfully:

```bash
git commit --allow-empty -m "test(humanizing-prose): dogfood pass verifies skills on their own artifacts

Ran the humanizing-prose trigger procedure end-to-end against the
two new SKILL.md files:

- skills/humanizing-prose/SKILL.md: scanned prose sections; no AI
  tells found (the file was already humanized during Task 3).
- skills/humanizer/SKILL.md: scanned the prose sections (intro,
  Voice Calibration, PERSONALITY AND SOUL, Self-Check Workflow,
  Full Example note); no AI tells found beyond the illustrative
  before-examples in the pattern catalog (which are intentional).

The trigger procedure ran end-to-end on its own artifacts: load
humanizer reference, scan, revise, ship. Skill set is wired up
correctly and behaves as designed when applied to itself.

Empty commit (no file changes); kept for the audit trail."
```

If the dogfooding pass produced edits, stage and commit those edits with a non-empty commit:

```bash
git add skills/humanizing-prose/SKILL.md skills/humanizer/SKILL.md
git commit -m "fix(humanizing-prose): dogfood pass found and fixed AI tells in own SKILL.md files

Ran the humanizing-prose trigger procedure end-to-end against the
two new SKILL.md files. The procedure flagged the following tells
in the prose sections:

<list each pattern hit and the fix applied>

Pattern catalog inside humanizer/SKILL.md was not scanned (it
contains intentional Before examples); only the prose sections
(intro, Voice Calibration, PERSONALITY AND SOUL, Self-Check
Workflow, Full Example note) were checked.

The trigger procedure ran end-to-end on its own artifacts: load
humanizer reference, scan, revise, ship. Skill set works as
designed."
```

Verify:

```bash
git log --oneline origin/main..HEAD | wc -l
```

Expected: `8`. Breakdown:

- 3 pre-existing commits (`gitignore`, `spec`, `spec-revisions`)
- 4 commits from this plan (`humanizer-copy` from Task 1, `humanizer-adapt` from Task 2, `humanizing-prose-create` from Task 3, `release-notes-add` from Task 6)
- 1 commit from this Task 7 dogfooding pass (empty if no edits, non-empty if edits were needed)

Total: 8 commits on `feat/humanizing-prose-skill` ahead of `origin/main`.

---

## Done

After Task 7, the branch should have:

- 2 new directories: `skills/humanizer/`, `skills/humanizing-prose/`
- 2 new SKILL.md files
- 1 modified file: `RELEASE-NOTES.md` (added unreleased entry, did not remove existing entries)
- 0 changes to harness manifests, `.gitignore`, or any other existing skill
- 1 personal-config skill removed (`~/.config/opencode/skills/humanizer/`)

Hand back to the human partner with `git log --oneline origin/main..HEAD` and the suggestion to test the skill set in a fresh OpenCode session by asking it to write something prose-shaped (a doc page, a commit body, a long chat reply) and observing whether the trigger fires.

If the dogfooding pass in Task 7 found tells in the new SKILL.md files that the agent missed during Tasks 2 and 3, that itself is a finding worth telling the human partner about. It means the skill design might still be leaking somewhere, and a follow-up session focused on real-use observation is warranted before declaring this work done.
