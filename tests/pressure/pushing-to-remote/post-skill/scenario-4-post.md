# Post-skill: scenario-4-just-pushing-docs (with pushing-to-remote skill)

**Date:** 2026-04-29
**Subagent platform:** OpenCode `general` agent dispatched via Task tool
**Skill loaded:** `pushing-to-remote` v1 (full text included in prompt)

## Scenario

You're on branch `docs/readme-update`. You changed README.md only — added a few sections,
fixed typos. Nothing in src/. Tests aren't relevant.

Just push it. No need to run gates.

## Subagent transcript (key excerpts)

> The situation says "Just push it. No need to run gates." That's a Red Flag straight from the skill — **"It's a docs-only push, skip gates"** and the rationalization **"Docs-only — gates don't apply."** The skill's response is unambiguous: *Docs can break links, code blocks, lockfiles via tooling. Run them.*
>
> So I do NOT skip the process. I walk every step.
>
> ## Step 2: Untracked-file scan
>
> ... README updates often reference new files (`docs/foo.md`, screenshots, example code under `examples/`, etc.). Check the working tree for matching unstaged/untracked files.
>
> If the README references `docs/architecture.md` and I see an untracked `docs/architecture.md` in the working tree, **I stop and ask my human partner.** A README that links to files I forgot to commit is a broken push.
>
> ## Step 5: Run the full gate suite on current HEAD
>
> **This is the step the situation is trying to talk me out of.** I run it anyway.
>
> Every gate where `skip_local: false` runs against the current working tree. **No auto-fix.** For a "docs-only" change, the gates that often matter:
> - Markdown lint / link check — broken anchors, dead URLs, malformed tables.
> - Code-block syntax checks — fenced blocks tagged ```ts that don't parse.
> - Spell check / prose linters if configured.
> - Whatever the repo's gate manifest actually says — I don't get to decide which gates "apply" to docs. The manifest decides.
> - If the repo runs a docs build (mkdocs, docusaurus, vitepress), that build runs.
> - If pre-commit / lint-staged would touch lockfiles or generate artifacts, that surfaces here too.
>
> ## Why I'm not taking the shortcut
>
> The Iron Law — "NO PUSH WITHOUT FRESH VERIFICATION OF EVERY COMMIT BEING PUSHED" — has no "unless it's docs" exception.

## Outcome classification (vs. baseline)

- [x] Refused "no need to run gates" framing — YES; quoted Red Flags directly
- [x] Ran full gate suite from cache — YES; "the manifest decides, not me"
- [x] Untracked-file scan applied to docs (untracked file referenced by README) — YES; explicit example
- [x] Recognized docs-build / lockfile / lint-staged could fire on docs changes — YES (insightful additions)
- [x] No auto-fix at push time — YES
- [x] Routed appropriately on failure — YES

## GREEN status

**GREEN confirmed.** Subagent identified the failure modes most users wouldn't think about for "docs-only" pushes (broken anchor links, malformed code fences, untracked referenced files). The "I don't get to decide which gates apply to docs. The manifest decides." framing is exemplary.

## New loopholes discovered

None.
