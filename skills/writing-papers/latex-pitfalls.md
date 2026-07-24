# LaTeX pitfalls for agent-written arXiv papers

Recurring failures observed when multiple agents write LaTeX sections that are
assembled and compiled with `tectonic`. Check these before debugging anything else.

## Known-good preamble skeleton

```latex
\documentclass[11pt]{article}
\usepackage[margin=1in]{geometry}
\usepackage[T1]{fontenc}
\usepackage[utf8]{inputenc}
\usepackage{amsmath}
\usepackage{newtxtext,newtxmath}   % AFTER amsmath; provides AMS symbols incl. \checkmark
\usepackage{graphicx}
\usepackage{booktabs}
\usepackage{multirow}
\usepackage{xcolor}
\usepackage{enumitem}
\usepackage{caption}
\usepackage{subcaption}
\usepackage{tikz}
\usetikzlibrary{arrows.meta,positioning,fit,backgrounds,calc,shapes.geometric}
\usepackage[numbers,sort&compress]{natbib}
\usepackage[colorlinks=true,linkcolor=blue,citecolor=blue,urlcolor=blue]{hyperref}
\usepackage{xspace}
```

## The placeholder macro

`soul`'s `\hl` breaks inside math mode and some boxes. Use a math-aware
`\colorbox` instead:

```latex
\newcommand{\tbd}[1]{\ifmmode\colorbox{yellow}{$\strut #1$}\else\colorbox{yellow}{\strut #1}\fi}
```

Works in prose (`\tbd{XX.X}`), table cells (`\tbd{--}`), and math
(`$\geq\tbd{\delta_1}$`). Does not line-wrap — keep placeholder text short.

## Pitfall checklist

1. **`amssymb` after `newtxmath`** → `\Bbbk already defined`. Load `amsmath`
   then `newtxtext,newtxmath`; do NOT load `amssymb` at all (newtx covers it).
2. **TikZ style named `step`** → `pgfkeys error: '/tikz/step' requires a value`
   (`step` is the grid key). Also avoid `label`, `at`, `scale` as style names.
   Use `lvlbox`, `stage`, etc.
3. **BibTeX lowercasing titles** → `TEM` becomes `Tem`, `OSWorld` → `Osworld`.
   Wrap every title in double braces: `title = {{TEM Agent: ...}}`.
4. **Working notes in `note = {}` fields render in the PDF.** Put camera-ready
   TODOs in `%` comments inside the `.bib` instead.
5. **Chapter agents adding `\usepackage` or macros in section files** → clashes
   at assembly. Contract rule: sections use only the preamble's packages and
   the provided macros.
6. **TikZ label collisions** don't error — they only look broken. Visually
   inspect every figure page of the rendered PDF; axis labels placed with
   `below left=... and -Xmm` offsets are the usual offender.
7. **Missing-figure `\includegraphics`** kills the build; for planned result
   figures use an empty TikZ axes placeholder with a `\tbd{results pending}`
   node instead.
8. **Symbol reuse across sections** (e.g. $\rho$ as irreversibility AND
   failure rate AND retry credit): the label registry should also reserve
   math symbols owned per section.
9. First `tectonic` run downloads packages — slow and network-bound; don't
   parallelize multiple first-compiles.
10. Citation audit is grep-able; run it after every revision round (see
    SKILL.md Phase 5).
