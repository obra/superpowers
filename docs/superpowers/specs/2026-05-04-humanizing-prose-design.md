# Humanizing Prose — Design

**Date:** 2026-05-04
**Status:** Draft (awaiting human partner review)
**Author:** Brainstormed with human partner, written by agent
**Target:** Personal skill set in `joeshirey/superpowers` fork (not upstream); applies across harnesses (OpenCode, Claude Code, Codex, Gemini CLI)

## Problem

Coding agents produce a lot of prose: PR descriptions, README updates, doc pages, design specs, release notes, long chat replies that explain a decision. That prose almost always reads as obviously AI-generated. It puffs up significance, leans on em dashes and rule-of-three lists, hedges with "could potentially," opens with "Let's dive in," ends with "the future looks bright."

The human partner already wrote a `humanizer` skill that fixes this kind of writing when given a chunk of text to clean up. It is good at the editing. The gap is that nothing tells the agent to use it. Today the human partner has to notice the AI-sounding prose, copy it into a separate session, and ask for it to be humanized. By that point the bad prose has already been committed, posted, or sent.

The goal is to close that gap. The agent should self-check its own prose against the humanizer rules **before** the prose is written to a file or sent to the human partner, without dragging the heavy 559-line humanizer reference into every chat reply or running it on code where the rules actively cause harm.

## Goals

1. Catch AI-sounding prose **before it gets persisted**: markdown files, PR descriptions, commit bodies, READMEs, doc files, release notes, blog posts.
2. Catch AI-sounding prose in chat replies once the reply is substantive enough to be worth checking (rough threshold: ~30 words of natural-language prose).
3. Never apply humanizer rules to code, code comments, commit subject lines, tool output, or short conversational replies. Many humanizer rules are wrong for those contexts.
4. Keep the heavyweight humanizer reference out of normal context. Only load it when the trigger fires.
5. Dogfood the skill on its own artifacts: humanize the prose sections of this spec, the trigger skill, and the adapted humanizer SKILL.md before committing. The pattern catalog inside the humanizer is illustrative reference content and stays verbatim. If the skill cannot survive being applied to its own prose, it is not ready.

## Non-Goals

- **Editing code or code comments.** Humanizer rules conflict with terse code conventions. Code comments often *should* use passive voice, drop subjects, and stay short. Out of scope.
- **Editing commit subject lines.** Subject lines need to stay imperative and under ~72 characters. The humanizer's "vary your rhythm" and "add personality" guidance is wrong for them. Subject lines are excluded. Commit *bodies* are in scope.
- **Hard enforcement via hooks or git pre-commit.** This is a self-check skill, not a guard. The agent reads the rules and applies them; nothing blocks output mechanically.
- **Changing the existing humanizer's pattern catalog.** The 29 patterns and the personality/voice section are tested content and stay as written. Only the input/output workflow gets adapted.
- **Cross-language style enforcement.** The humanizer is English-only. Other languages are out of scope.
- **Upstream contribution.** AGENTS.md is explicit that personal-preference and style skills belong outside core. This stays in the fork.

## High-Level Design

Two skills, both in `skills/`, both in this repo:

```
skills/humanizing-prose/SKILL.md   # trigger skill — small, always loadable
skills/humanizer/SKILL.md          # heavy reference — loaded on demand
```

The trigger skill is the one the agent discovers and follows on every session. It defines what counts as "prose worth humanizing," lists the always-fire artifacts and the chat-reply word threshold, and instructs the agent to load the `humanizer` skill via the `skill` tool when the trigger fires.

The `humanizer` skill is the existing 559-line reference, moved from `~/.config/opencode/skills/humanizer/` into this repo and lightly adapted. The pattern catalog and personality section stay verbatim. The "user gives me text → I produce draft + audit + final" output structure gets replaced with a self-check workflow that fits agent-self-editing.

This split mirrors how other superpowers skills handle heavy reference material (see `writing-skills` referencing `anthropic-best-practices.md`, or `committing-work` orchestrating other behavior). It keeps the always-loaded surface small and pushes the big content behind an explicit load.

## Skill: `humanizing-prose`

### Frontmatter

```yaml
---
name: humanizing-prose
description: Use when about to write prose for a human reader: markdown files, PR descriptions, commit bodies, READMEs, doc pages, release notes, blog posts, or chat replies longer than a couple of sentences. Catches AI-sounding writing (significance inflation, em dash overuse, rule of three, hedging, sycophancy) before it gets sent or committed.
---
```

The description names the artifacts and the symptoms (the kinds of writing the agent might produce), and follows the `writing-skills` CSO guidance: trigger conditions, no workflow summary.

### When to Fire (always)

The agent runs this skill before producing prose in any of these contexts:

| Context | Why |
|---|---|
| Writing or editing `.md` / `.mdx` files | Persisted prose, usually for a human reader |
| PR description / PR body | Read by reviewers, often by the public |
| Commit message **body** (not subject) | Persisted, searched, read by future agents |
| READMEs | High-visibility, sets project tone |
| Files under `docs/` | Documentation, by definition for humans |
| Release notes, changelogs, blog posts | Public-facing prose |
| Design docs and specs (`docs/superpowers/specs/`) | The thing you're reading right now |

### When to Fire (chat replies)

For chat replies to the human partner: fire when the reply will exceed roughly **30 words of natural-language prose** (about two sentences). Below that, skip the check. Quick acknowledgments, "running it now," short answers to direct questions, and one-sentence status updates do not need humanizing.

The 30-word threshold is a guideline, not a counter. The agent estimates as it drafts; if the reply is going to be more than a quick one-liner, the check fires.

**What counts toward the 30 words:** only natural-language prose intended for the human partner to read. Code blocks, tool output the agent is relaying, structured tables, JSON, command output, and direct quotes do not count. A reply that is mostly a code block with a one-sentence framing is below threshold even if total characters are large. A reply that is three short prose paragraphs interleaved with code is above threshold and the prose paragraphs get humanized; the code stays untouched.

### When NOT to Fire (always skip)

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

### Procedure

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

### Red Flags — STOP if you find yourself doing any of these

- Writing a PR description or doc page without invoking the humanizer reference
- Telling yourself "I know the patterns, I don't need to load the reference"
- Skipping the self-check because the prose "feels fine"
- Applying humanizer rules to code or code comments
- Rewriting a commit subject line to "make it less AI-sounding"
- Humanizing a direct quote of someone else's writing
- Padding short chat replies up to 30 words to trigger the check (the threshold is a ceiling-style trigger, not a target)
- Loading the humanizer reference on every short message "just in case"

### Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "It's just a one-line README change" | One-line changes set the tone of the file. Check it. |
| "PR descriptions are throwaway" | They are searched, linked, quoted, and read by reviewers. Not throwaway. |
| "I'll humanize it later if the human partner complains" | The human partner will complain by closing the PR. Check it now. |
| "The humanizer reference is too long to load every time" | The trigger is specifically designed so it only loads when the cost is worth it. |
| "This is technical writing, the AI patterns don't apply" | Technical writing is where significance inflation and rule-of-three thrive. Especially apply it here. |
| "The human partner reads everything I write anyway" | The point is to not waste their time editing your prose. |
| "I already did one pass, that's good enough" | The humanizer's self-check is a second pass on purpose. Do it. |

### What This Skill Is NOT

- **A code-style enforcer.** Code conventions are different. Use a linter.
- **A grammar checker.** The humanizer catches a specific class of AI tells, not general writing problems.
- **A length limiter.** Long prose is fine. AI-sounding prose is not.
- **A blocker.** Nothing prevents the agent from shipping un-humanized prose if the trigger doesn't fire. The skill is opt-in by context, not enforced by tooling.

### Integration

**Pairs with:**
- `humanizer` — the heavyweight reference this skill loads on demand.
- `committing-work` — fires when the agent is about to write the commit body (not the subject).
- `writing-plans` and `brainstorming` — both produce specs and design docs, both are in-scope artifacts.

**Distinct from:**
- Code-quality skills (`test-driven-development`, `verification-before-completion`) — those govern code; this governs prose.
- `humanizer` itself — the humanizer is *what* to do; this skill is *when* to do it.

## Skill: `humanizer` (adapted)

The existing humanizer at `~/.config/opencode/skills/humanizer/SKILL.md` moves into this repo at `skills/humanizer/SKILL.md`. The personal-config copy gets removed after the move so there is one source of truth.

### What stays verbatim

- All 29 numbered patterns in the CONTENT, LANGUAGE AND GRAMMAR, STYLE, COMMUNICATION, and FILLER AND HEDGING sections.
- The PERSONALITY AND SOUL section.
- The Voice Calibration section.
- The reference link to Wikipedia's Signs of AI writing page.

### What changes

The current humanizer is shaped as "user pastes in text, I produce a draft → audit → final rewrite with all three labeled." For agent-self-editing during writing, that 3-pass labeled output is the wrong shape. The agent does not need to print the draft and the audit. It needs a procedure for revising silently and shipping the revised version.

Replace the **Process** and **Output Format** sections with a self-check workflow:

```markdown
## Self-Check Workflow (when invoked by humanizing-prose)

1. Hold the draft in mind. Do not print it.
2. Scan against the 29 patterns. Note every match.
3. Revise the matched spots in place.
4. Read the revised version back as if a human wrote it. If anything
   still reads as obviously AI-generated, revise again.
5. Ship the revised version. Do not print the pre-revision draft, the
   audit, or the change log unless the human partner asks for them.
```

The Full Example section stays as a worked illustration but gets a one-line note that the labeled draft/audit/final structure is for the example only. Actual self-checks during agent writing are silent.

### Frontmatter changes

Update the `compatibility` field to reflect the new home, and tighten the description. The current description is good; minor edits only.

```yaml
---
name: humanizer
description: Reference catalog of AI-writing patterns and how to fix them. Loaded on demand by the humanizing-prose skill when the agent is about to produce prose for a human reader. Covers significance inflation, em dash overuse, rule of three, AI vocabulary, passive voice, sycophancy, and ~25 other patterns from Wikipedia's Signs of AI writing.
license: MIT
compatibility: claude-code opencode codex gemini-cli
---
```

The description is reframed as "reference catalog loaded on demand" so it does not get triggered as a standalone skill. `humanizing-prose` is the front door.

## Dogfooding

While building this:
- This spec gets humanized before being committed.
- The trigger skill content gets humanized before being committed.
- The adapted humanizer SKILL.md gets humanized in the prose sections. The pattern catalog stays verbatim because it is illustrative reference content, not prose for a human reader.

If applying the humanizer rules to the spec produces prose that is worse, that is a signal the skill needs work, not the spec.

No formal subagent-based RED/GREEN/REFACTOR testing for this skill. The human partner will assess effectiveness from real use.

## Migration

Steps in order:

1. Create `skills/humanizing-prose/SKILL.md` (this design's trigger skill).
2. Create `skills/humanizer/SKILL.md` by copying from `~/.config/opencode/skills/humanizer/SKILL.md`, then apply the Process / Output Format / frontmatter changes described above.
3. Remove `~/.config/opencode/skills/humanizer/` so there is one source of truth.
4. Commit to `feat/humanizing-prose-skill`. Push to `origin` (your fork). No upstream PR.

## Future Work

- **Per-project voice samples.** The humanizer already supports voice calibration via a writing sample. A future enhancement could let a project drop a `.writing-style.md` file at repo root that gets auto-loaded when the trigger fires. Out of scope here.
- **Hook-based enforcement.** A pre-commit hook could grep commit bodies and PR descriptions for the highest-frequency tells (em dashes, "stands as," etc.) and warn. Mechanical, not judgment-based. Would complement, not replace, this skill. Defer until the skill itself is proven.
- **A `linting-prose` companion.** A separate small skill that runs the regex-detectable subset of patterns and reports hits, for the case where the human partner wants to audit existing prose without rewriting it.

## Open Questions

None. All design decisions confirmed during brainstorming.
