---
name: writing-papers
description: Use when writing an academic paper (arXiv preprint or journal submission) about a research project or codebase — multi-agent chapter drafting under a written contract, with verified-only citations, placeholder discipline for pending data, and an adversarial review gate
---

# Writing Papers

## Overview

Write a full paper with an agent team the same way you'd run a controlled experiment: fix the contract first, parallelize the drafting, then attack the draft adversarially before calling it done.

**Announce at start:** "I'm using the writing-papers skill to drive this paper."

**Core principles:**

1. **Evidence before outline, outline before prose.** Never draft a section before the factual substrate and bibliography are verified.
2. **Citations are verified or absent.** Every reference is checked against arXiv/publisher pages by a dedicated agent. Anything unverifiable is marked NOT FOUND and never cited. No exceptions.
3. **Claims match reality.** If the paper describes a system, an exploration agent must first establish what is actually implemented; unimplemented parts are written as protocol/roadmap, never as results.
4. **Unmeasured numbers are placeholders.** Every number not yet measured is wrapped in a visible highlight macro so nothing fabricated can hide in prose.
5. **The contract file is the single source of truth** for chapter writers: positioning, style rules, label registry, allowed citation keys, factual substrate, section boundaries.

## Phase 1 — Research and evidence collection (parallel)

Launch subagents concurrently:

- **Codebase exploration** (one per repo): what is actually implemented, with file-path evidence and honest caveats. This becomes the paper's "factual substrate".
- **Literature verification**: for every reference the user or the draft plan mentions, find exact title, first author, year, venue, arXiv ID/DOI. Output `[VERIFIED]` or `[NOT FOUND]` per item. NOT FOUND is a valid, important answer — report it, propose substitutes, never silently invent.
- **Prior internal material**: read the user's concept docs/PDFs; they often already contain the research questions and structure.

## Phase 2 — Confirm the plan with the user (blocking checkpoint)

Present an honest gap analysis (what the ambition claims vs. what is implemented) and ask for decisions before writing a single section:

- **Positioning**: full study vs. benchmark/framework + pilot vs. position paper. When the system is partially built, recommend "framework defines the full matrix; paper instantiates the implemented cells; rest is protocol + staged roadmap".
- Title direction, paper language, system/benchmark naming, target venue.

Do not proceed without answers. Record any downweighting decisions (e.g. "metric suite X is conceptual — one subsection only") in the contract.

## Phase 3 — Scaffold before drafting

Create in `paper/`:

1. **`main.tex`** — arXiv-friendly single-column article; `\input` one file per section. See [latex-pitfalls.md](latex-pitfalls.md) for a known-good preamble and the placeholder macro `\tbd{}`.
2. **`references.bib`** — verified entries ONLY. Header comment lists the NOT-FOUND items with "do not cite". Wrap titles in double braces `{{...}}` to protect capitalization. Put camera-ready TODOs in `%` comments, not `note` fields.
3. **`WRITING_GUIDE.md`** — the binding contract. Use [writing-guide-template.md](writing-guide-template.md). Must contain: positioning + honesty rules; hard rules (verified keys only, `\tbd{}` discipline, allowed LaTeX subset, banned AI-tell vocabulary); the complete figure/table/section **label registry**; per-section owner, length target, and content boundaries (who owns which concept — prevents overlap); the factual substrate from Phase 1; the allowed citation key list with one-line descriptions.

## Phase 4 — Parallel chapter drafting

- One subagent per section group (abstract+intro / related work / problem+framework / system design / experiments+analysis / limitations+conclusion+appendix). Use context-inheriting agents if available so Phase-1 findings carry over.
- Every prompt: "read WRITING_GUIDE.md and references.bib first; they are the binding contract", plus section-specific structure, figures to produce (TikZ, simple libraries only), and the reminder that experimental numbers are `\tbd{}`.
- Chapter agents never add packages, macros, or citation keys.

## Phase 5 — Assemble, compile, audit

1. Compile with `tectonic main.tex`; fix errors iteratively (see [latex-pitfalls.md](latex-pitfalls.md) for the recurring ones).
2. **Deterministic citation audit** (no LLM):
   ```bash
   # keys cited but missing from bib
   for k in $(grep -oE '\\cite[tp]?\{[^}]+\}' sections/*.tex | sed -E 's/.*\{([^}]+)\}/\1/' | tr ',' '\n' | sort -u); do
     grep -q "{$k," references.bib || echo "MISSING: $k"; done
   ```
3. Render the PDF and visually inspect every figure page (TikZ label collisions are common and invisible in the log).

## Phase 6 — Adversarial review gate (required)

One reviewer agent with four hats, findings capped and ordered by severity, **no edits**:

- **R1 factual consistency**: claims vs. the Phase-1 exploration reports; cross-section contradictions (counts, formulas, "release" vs "plan to release").
- **R2 overclaiming**: every sentence a skeptical reviewer would attack; verify tense honesty ("we report" vs "we will").
- **R3 writing quality**: banned vocabulary, terminology drift (pick one term per concept), symbol collisions, missing `\tbd{}`.
- **Devil's advocate**: the 3 hardest whole-paper attacks and whether the text already defends; if not, where a 1–2 sentence defense goes.

Then a separate **revision agent** applies the findings checklist and recompiles until clean. Re-run the citation audit after revision.

## Phase 7 — Deliverables

- `main.pdf` + per-page visual check.
- If numbers are pending: a separate **experiment execution plan** mapping every `\tbd{}` to a workstream, with a risk call-out for the parts that require new construction (those are the schedule risk, not the reruns).
- Summarize for the user: page count, placeholder count, what remains manual (author list, camera-ready TODOs in bib comments).

## Red flags — stop and fix

- A citation you "remember" but no agent verified → remove or verify now.
- A section describing an unimplemented feature in present tense → rewrite as protocol/roadmap.
- Two sections defining the same concept → the label registry / content boundaries were too loose; fix the contract, not just the prose.
- Numbers in prose without `\tbd{}` that you cannot trace to a measurement → placeholder them.
