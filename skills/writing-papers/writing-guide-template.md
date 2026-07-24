# WRITING_GUIDE.md template

Copy into `paper/WRITING_GUIDE.md`, fill every bracket, delete unused parts.
This file is the binding contract every chapter-writing agent must read first.

```markdown
# [Paper short name] — Writing Contract

Binding contract for every section-writing agent. Read fully before writing.

## Paper identity
- Title: "[full title]"
- Names: [system/benchmark names + the LaTeX macros for them]
- Positioning: [one paragraph: what is claimed as done, what is pilot,
  what is protocol/roadmap. Never claim unimplemented parts as done.]
- Downweighted topics: [decisions from the user, e.g. "X is one short
  subsection, framed as conceptual"]
- Target: [venue, page budget, column format]

## Hard rules
1. Citations: ONLY keys existing in references.bib (list below). Never invent.
   Need a missing source? Write \tbd{[cite: description]} instead.
2. Numbers: every unmeasured number wrapped in \tbd{...}. Known-true system
   facts are not placeholders.
3. Honesty: "we propose / we instantiate / we plan" must match the
   positioning paragraph.
4. Style: plain academic English; short declarative sentences; first person
   plural. Banned vocabulary: delve, showcase, leverage (verb), crucial,
   pivotal, landscape, underscore, testament, meticulous, seamless, holistic,
   paradigm shift. No rule-of-three rhetoric; no em-dash chains.
5. LaTeX subset: sectioning, lists, booktabs tables, TikZ figures with the
   preamble's libraries only. No \usepackage, no new macros. Provided macros:
   [list them].
6. Each file starts with \section{...} and compiles when \input into main.tex.
7. Use ONLY labels from the registry below.

## Label registry
Sections: [sec:intro, sec:related, ...]
Figures (owner section in parentheses): [fig:... — one line each]
Tables: [tab:... — one line each]
Reserved math symbols: [symbol → meaning → owning section]

## Section files, owners, length targets
- sections/00_abstract.tex — [target words]
- sections/01_introduction.tex — [~pages, required structure]
- [...]

## Content boundaries (avoid overlap)
- [§X owns concept A; §Y owns concept B; §Z cites in passing only...]

## Verified factual substrate (use freely, do not contradict)
[Paste the synthesized codebase-exploration findings here: architecture facts,
scale numbers, exact mechanism descriptions, honest caveats. This is the only
source of system facts chapter agents may use.]

## Allowed citation keys
[key — one-line description, grouped by topic]

Do NOT cite: [list of NOT-FOUND items from literature verification]
```
